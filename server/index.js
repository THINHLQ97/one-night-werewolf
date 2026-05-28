require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const { ROLES, getNightOrder, isWolfRole } = require('./roles');
const { createRoom, getRoom, getRoomByPlayerId, addPlayer, addBotPlayers, removePlayer, saveDisconnectedPlayer, findDisconnectedPlayer, clearDisconnectedPlayer } = require('./rooms');
const { startGame, getNightActionData, processNightAction, computeResults, getEliminatedHunters, computeDeductionConflicts } = require('./gameLogic');
const { generateBotId, generateBotName, decideBotNightAction, decideBotNightActionStep2, decideBotVote, decideBotBodyguardProtect, decideBotHunterShoot } = require('./botAI');
const { handleGoogleLogin, handleGuestLogin, authenticateToken, GOOGLE_CLIENT_ID } = require('./auth');
const db = require('./db');
const { calculateGamePoints, clampPoints, checkRankUp, getRank } = require('./ranking');

const app = express();
app.use(cors());
app.use(express.json());

// ─── Auth API routes ─────────────────────────────────────────────────────────

app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing idToken' });
    const result = await handleGoogleLogin(idToken);
    res.json({ user: sanitizeUser(result.user), token: result.token });
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

app.post('/api/auth/guest', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const result = await handleGuestLogin(name.trim());
    res.json({ user: sanitizeUser(result.user), token: result.token });
  } catch (err) {
    console.error('Guest login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const user = await authenticateToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/auth/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token' });
    const user = await authenticateToken(token);
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    const { displayName, avatarUrl } = req.body;
    const updated = await db.updateProfile(user.id, displayName || user.display_name, avatarUrl !== undefined ? avatarUrl : user.avatar_url);
    res.json({ user: sanitizeUser(updated) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const rows = await db.getLeaderboard(limit);
    res.json({ leaderboard: rows.map(r => sanitizeUser(r)) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/google-client-id', (req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID });
});

function sanitizeUser(u) {
  return {
    id: u.id,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    points: u.points,
    gamesPlayed: u.games_played,
    gamesWon: u.games_won,
    rank: u.rank || getRank(u.points || 0),
  };
}

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/socket.io') || req.url.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 10000,
  pingTimeout: 5000,
});

const PORT = process.env.PORT || 3001;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function broadcastPlayerList(room) {
  const playerData = await Promise.all(room.players.map(async p => {
    const base = { id: p.id, name: p.name, isHost: p.isHost, isBot: p.isBot || false };
    if (p.userId) {
      const user = await db.getUser(p.userId);
      if (user) {
        base.rank = user.rank;
        base.points = user.points;
        base.avatarUrl = user.avatar_url;
      }
    }
    return base;
  }));
  io.to(room.code).emit('player_list', { players: playerData, hostId: room.hostId });
}

function broadcastSettings(room) {
  io.to(room.code).emit('settings_updated', { settings: room.settings });
}

// ─── Night phase orchestration ────────────────────────────────────────────────

async function runNightPhase(room) {
  const { nightPhase, players } = room;
  room.state = 'night';
  room.nightLog = []; // Track all night actions for post-game history

  io.to(room.code).emit('night_start');

  for (let i = 0; i < nightPhase.roleOrder.length; i++) {
    if (room.state !== 'night') break;

    const role = nightPhase.roleOrder[i];
    nightPhase.currentRoleIndex = i;

    const roleData = ROLES[role];

    // Broadcast to all: which role is being called
    io.to(room.code).emit('night_role_called', {
      role,
      roleName: roleData.nameVi,
      instruction: roleData.nightInstruction,
      closeInstruction: roleData.nightClose,
    });

    // Find players whose ORIGINAL role matches (before any swaps)
    let actingPlayers = players.filter(p => room.originalCards[p.id] === role);

    // Werewolf phase: include alphawolf & mysticwolf but exclude dreamwolf
    if (role === 'werewolf') {
      actingPlayers = players.filter(p => {
        const r = room.originalCards[p.id];
        return r === 'werewolf' || r === 'alphawolf' || r === 'mysticwolf';
      });
    }

    if (actingPlayers.length > 0) {
      const realPlayers = actingPlayers.filter(p => !p.isBot);
      const botPlayers = actingPlayers.filter(p => p.isBot);

      realPlayers.forEach(p => {
        const actionData = getNightActionData(room, role);
        if (actionData.otherPlayers) {
          actionData.otherPlayers = actionData.otherPlayers.filter(op => op.id !== p.id);
        }
        io.to(p.id).emit('night_action_request', { role, ...actionData });
      });

      await new Promise(resolve => {
        nightPhase.pendingPlayerIds = actingPlayers.map(p => p.id);
        nightPhase.pendingActions = [];
        nightPhase.resolver = resolve;
        nightPhase.timer = setTimeout(() => {
          nightPhase.pendingPlayerIds = [];
          nightPhase.resolver = null;
          resolve();
        }, 30000);

        // Bot auto-actions after short delay
        if (botPlayers.length > 0) {
          setTimeout(() => {
            botPlayers.forEach(bot => {
              if (!nightPhase.pendingPlayerIds.includes(bot.id)) return;
              const action = decideBotNightAction(room, bot.id, role);
              const result = processNightAction(room, bot.id, role, action);

              if (!room.nightLog) room.nightLog = [];
              room.nightLog.push({ role, playerId: bot.id, playerName: bot.name, action: { ...action }, result: { ...result } });

              // Handle multi-step bot roles
              if (role === 'paranormalinvestigator' && result.canContinue) {
                const action2 = decideBotNightActionStep2(room, bot.id, role, result);
                const result2 = processNightAction(room, bot.id, role, action2);
                room.nightLog.push({ role, playerId: bot.id, playerName: bot.name, action: { ...action2 }, result: { ...result2 } });
              }
              if (role === 'witch' && result.step === 1 && result.canSwap) {
                const action2 = decideBotNightActionStep2(room, bot.id, role, result);
                const result2 = processNightAction(room, bot.id, role, action2);
                room.nightLog.push({ role, playerId: bot.id, playerName: bot.name, action: { ...action2 }, result: { ...result2 } });
              }

              // Revealer public broadcast
              if (role === 'revealer' && result.revealed && result.targetPlayer) {
                io.to(room.code).emit('night_public_reveal', { playerId: result.targetPlayer, role: result.role });
              }

              const idx = nightPhase.pendingPlayerIds.indexOf(bot.id);
              if (idx !== -1) nightPhase.pendingPlayerIds.splice(idx, 1);
              nightPhase.pendingActions.push({ playerId: bot.id, role, action });
            });

            if (nightPhase.pendingPlayerIds.length === 0 && nightPhase.resolver) {
              clearTimeout(nightPhase.timer);
              const r = nightPhase.resolver;
              nightPhase.resolver = null;
              r();
            }
          }, 1500);
        }
      });
    } else {
      await new Promise(r => setTimeout(r, 3000));
    }

    // Signal end of this role's turn
    io.to(room.code).emit('night_role_done', { role });
    await new Promise(r => setTimeout(r, 1000));
  }

  startDayPhase(room);
}

function startDayPhase(room) {
  room.state = 'day';

  const pool = [...room.settings.selectedRoles];
  if (room.hasAlphaWolf) pool.push('werewolf');

  room.dayPhase = {
    votes: {},
    timerEnd: Date.now() + 5 * 60 * 1000,
    tokenClaims: {
      pool,
      deductions: {},  // { playerId: { position: roleId, ... } }
      conflicts: [],
    },
  };

  io.to(room.code).emit('day_start', {
    timerEnd: room.dayPhase.timerEnd,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    tokenPool: pool,
    shieldedPlayer: room.shieldedPlayer || null,
  });

  // Auto-end after 5 minutes
  room.dayPhase.autoEndTimer = setTimeout(() => {
    if (room.state === 'day') endGame(room);
  }, 5 * 60 * 1000);

  // Bot auto-votes with staggered delays
  const bots = room.players.filter(p => p.isBot);
  bots.forEach((bot, i) => {
    const delay = 3000 + i * 1500 + Math.random() * 2000;
    setTimeout(() => {
      if (room.state !== 'day') return;
      if (room.dayPhase.votes[bot.id]) return;

      const currentRole = room.currentCards[bot.id];
      if (currentRole === 'bodyguard') {
        const targetId = decideBotBodyguardProtect(room, bot.id);
        room.dayPhase.bodyguardProtect = { protectorId: bot.id, targetId };
      } else {
        const targetId = decideBotVote(room, bot.id);
        room.dayPhase.votes[bot.id] = targetId;
      }

      io.to(room.code).emit('vote_update', {
        votes: room.dayPhase.votes,
        bodyguardProtect: room.dayPhase.bodyguardProtect || null,
        players: room.players.map(p => ({ id: p.id, name: p.name })),
      });

      checkAllVoted(room);
    }, delay);
  });
}

function sanitizeTokenClaims(tc, room) {
  const nameMap = {};
  room.players.forEach(p => { nameMap[p.id] = p.name; });

  // Resolve player names in conflict claimers
  const conflicts = (tc.conflicts || []).map(c => {
    const base = { ...c };
    if (c.claimers) {
      base.claimers = c.claimers.map(pid => ({ id: pid, name: nameMap[pid] || '?' }));
    }
    if (c.playerId) {
      base.playerName = nameMap[c.playerId] || '?';
    }
    return base;
  });

  return { pool: tc.pool, deductions: tc.deductions, conflicts };
}

function checkAllVoted(room) {
  const voted = Object.keys(room.dayPhase.votes).length;
  const hasBodyguard = room.dayPhase.bodyguardProtect ? 1 : 0;
  if (voted + hasBodyguard >= room.players.length) {
    endGame(room);
  }
}

function endGame(room) {
  if (room.dayPhase?.autoEndTimer) clearTimeout(room.dayPhase.autoEndTimer);

  const { hunters } = getEliminatedHunters(room);

  if (hunters.length > 0 && !room.dayPhase.hunterTarget) {
    room.state = 'hunter_phase';
    room.dayPhase.hunterTarget = {};
    room.dayPhase.pendingHunters = [...hunters];

    const otherPlayers = room.players.map(p => ({ id: p.id, name: p.name }));

    // Broadcast phase start to ALL first
    io.to(room.code).emit('hunter_phase_start', {
      hunters: hunters.map(id => {
        const p = room.players.find(pp => pp.id === id);
        return { id, name: p?.name };
      }),
    });

    // Then send shoot request to each hunter (after phase_start so it doesn't get overwritten)
    setTimeout(() => {
      hunters.forEach(hunterId => {
        const hunterPlayer = room.players.find(p => p.id === hunterId);
        if (hunterPlayer?.isBot) {
          // Bot hunter auto-shoots
          setTimeout(() => {
            if (!room.dayPhase.pendingHunters?.includes(hunterId)) return;
            const targetId = decideBotHunterShoot(room, hunterId);
            room.dayPhase.hunterTarget[hunterId] = targetId;
            room.dayPhase.pendingHunters = room.dayPhase.pendingHunters.filter(id => id !== hunterId);
            io.to(room.code).emit('hunter_shoot_update', { hunterId, hunterName: hunterPlayer.name });
            if (room.dayPhase.pendingHunters.length === 0) finishGame(room);
          }, 2000);
        } else {
          io.to(hunterId).emit('hunter_shoot_request', {
            otherPlayers: otherPlayers.filter(p => p.id !== hunterId),
          });
        }
      });
    }, 100);

    room.dayPhase.hunterTimer = setTimeout(() => {
      finishGame(room);
    }, 15000);

    return;
  }

  finishGame(room);
}

async function finishGame(room) {
  if (room.dayPhase?.hunterTimer) clearTimeout(room.dayPhase.hunterTimer);
  const results = computeResults(room);

  // Sanitize nightLog: resolve player IDs to names in actions
  const nameMap = {};
  room.players.forEach(p => { nameMap[p.id] = p.name; });
  const nightLog = (room.nightLog || []).map(entry => ({
    ...entry,
    targetName: entry.action.targetPlayer ? nameMap[entry.action.targetPlayer] : null,
    target1Name: entry.action.target1 ? nameMap[entry.action.target1] : null,
    target2Name: entry.action.target2 ? nameMap[entry.action.target2] : null,
  }));

  // Award points to authenticated users (skip simulation/bot games)
  const rankUpdates = {};
  if (!room.isSimulation) {
    const humanPlayers = room.players.filter(p => !p.isBot);
    const totalPlayerCount = humanPlayers.length;
    const pointsMap = calculateGamePoints(humanPlayers, results.winners, totalPlayerCount);

    for (const p of humanPlayers) {
      if (!p.userId) continue;
      const originalRole = room.originalCards[p.id];
      if (!originalRole) continue;
      const delta = pointsMap[p.id] || 0;
      const won = results.winners.includes(p.id);
      const userBefore = await db.getUser(p.userId);
      if (!userBefore) continue;
      const oldPoints = userBefore.points;
      const updatedUser = await db.updatePoints(p.userId, delta, won, room.code, originalRole, results.finalCards[p.id]);
      const rankChange = checkRankUp(oldPoints, updatedUser.points);
      rankUpdates[p.id] = {
        pointsDelta: delta,
        newPoints: updatedUser.points,
        rank: updatedUser.rank,
        rankUp: rankChange.ranked ? rankChange.newRank : null,
        demoted: rankChange.demoted ? rankChange.newRank : null,
      };
    }
  }

  io.to(room.code).emit('game_over', {
    results,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
    nightLog,
    rankUpdates,
  });
}

// ─── Socket events ────────────────────────────────────────────────────────────

io.on('connection', socket => {
  console.log('Connected:', socket.id);

  // ── Create room ──
  socket.on('create_room', async ({ name, token, authToken }, cb) => {
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });
    const authUser = authToken ? await authenticateToken(authToken) : null;
    const room = createRoom(socket.id, name.trim(), token, authUser?.id || null);
    socket.join(room.code);
    socket.roomCode = room.code;
    if (authUser) socket.userId = authUser.id;
    cb({
      code: room.code,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, isBot: p.isBot || false })),
      settings: room.settings,
      hostId: room.hostId,
    });
    broadcastPlayerList(room);
  });

  // ── Create simulation room ──
  socket.on('create_simulation', async ({ name, token, authToken, botCount, selectedRoles, gameMode }, cb) => {
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });
    const count = Math.max(2, Math.min(9, parseInt(botCount) || 4));
    const authUser = authToken ? await authenticateToken(authToken) : null;
    const room = createRoom(socket.id, name.trim(), token, authUser?.id || null);
    if (authUser) socket.userId = authUser.id;
    room.isSimulation = true;
    socket.join(room.code);
    socket.roomCode = room.code;

    addBotPlayers(room, count, generateBotId, generateBotName);

    if (selectedRoles) room.settings.selectedRoles = selectedRoles;
    if (gameMode) room.settings.gameMode = gameMode;

    cb({
      code: room.code,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, isBot: p.isBot || false })),
      settings: room.settings,
      hostId: room.hostId,
    });
    broadcastPlayerList(room);
  });

  // ── Add/remove bot in lobby ──
  socket.on('add_bot', (_, cb) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id) return cb?.({ error: 'Không có quyền' });
    if (room.state !== 'waiting') return cb?.({ error: 'Game đã bắt đầu' });
    if (room.players.length >= 10) return cb?.({ error: 'Phòng đã đầy' });

    const botIndex = room.players.filter(p => p.isBot).length;
    addBotPlayers(room, 1, generateBotId, () => generateBotName(botIndex));
    broadcastPlayerList(room);
    cb?.({ ok: true });
  });

  socket.on('remove_bot', (_, cb) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id) return cb?.({ error: 'Không có quyền' });
    if (room.state !== 'waiting') return cb?.({ error: 'Game đã bắt đầu' });

    const lastBot = [...room.players].reverse().find(p => p.isBot);
    if (!lastBot) return cb?.({ error: 'Không có bot nào' });

    room.players = room.players.filter(p => p.id !== lastBot.id);
    broadcastPlayerList(room);
    cb?.({ ok: true });
  });

  // ── Join room ──
  socket.on('join_room', async ({ code, name, token, authToken }, cb) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) return cb({ error: 'Không tìm thấy phòng' });
    if (room.state !== 'waiting') return cb({ error: 'Game đã bắt đầu' });
    if (room.players.length >= 10) return cb({ error: 'Phòng đã đầy (tối đa 10 người)' });
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });
    const authUser = authToken ? await authenticateToken(authToken) : null;
    const added = addPlayer(room, socket.id, name.trim(), token, false, authUser?.id || null);
    if (authUser) socket.userId = authUser.id;
    if (!added) return cb({ error: 'Bạn đã trong phòng này' });

    socket.join(room.code);
    socket.roomCode = room.code;
    broadcastPlayerList(room);

    cb({
      code: room.code,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, isBot: p.isBot || false })),
      settings: room.settings,
      hostId: room.hostId,
    });
  });

  // ── Rejoin room (after disconnect/reconnect) ──
  socket.on('rejoin_room', ({ code, name, token }, cb) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) return cb?.({ error: 'Phòng không tồn tại' });

    let oldId = null;
    const dc = findDisconnectedPlayer(code, name);
    if (dc) {
      oldId = dc.oldId;
      clearDisconnectedPlayer(code, name);
    }

    let player = null;
    if (token) {
      player = room.players.find(p => p.token === token && p.id !== socket.id);
    }
    if (!player && oldId) {
      player = room.players.find(p => p.id === oldId);
    }
    if (!player) {
      player = room.players.find(p => p.name === name && p.id !== socket.id);
    }

    if (!player) return cb?.({ error: 'Không tìm thấy phiên cũ' });

    if (token) player.token = token;

    const prevId = player.id;
    player.id = socket.id;
    if (room.hostId === prevId) room.hostId = socket.id;

    if (room.originalCards[prevId] !== undefined) {
      room.originalCards[socket.id] = room.originalCards[prevId];
      delete room.originalCards[prevId];
    }
    if (room.currentCards[prevId] !== undefined) {
      room.currentCards[socket.id] = room.currentCards[prevId];
      delete room.currentCards[prevId];
    }
    if (room.dayPhase?.votes[prevId] !== undefined) {
      room.dayPhase.votes[socket.id] = room.dayPhase.votes[prevId];
      delete room.dayPhase.votes[prevId];
    }
    // Remap deduction board
    const tc = room.dayPhase?.tokenClaims;
    if (tc) {
      // Remap this player's deduction row
      if (tc.deductions[prevId]) {
        tc.deductions[socket.id] = tc.deductions[prevId];
        delete tc.deductions[prevId];
      }
      // Remap references to this player in other players' deductions
      Object.entries(tc.deductions).forEach(([pid, row]) => {
        if (row[prevId] !== undefined) {
          row[socket.id] = row[prevId];
          delete row[prevId];
        }
      });
    }

    socket.join(room.code);
    socket.roomCode = room.code;

    const roleId = room.originalCards[socket.id];
    const currentRoleId = room.currentCards[socket.id];

    cb?.({
      ok: true,
      code: room.code,
      state: room.state,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, isBot: p.isBot || false })),
      settings: room.settings,
      hostId: room.hostId,
      roleId,
      role: roleId ? ROLES[roleId] : null,
      currentRoleId,
      votes: room.dayPhase?.votes || {},
      timerEnd: room.dayPhase?.timerEnd || null,
      timerPaused: room.dayPhase?.paused || false,
      timerPausedRemaining: room.dayPhase?.pausedRemaining || null,
      hasAlphaWolf: room.hasAlphaWolf || false,
      tokenClaims: tc ? sanitizeTokenClaims(tc, room) : null,
    });

    broadcastPlayerList(room);
  });

  // ── Rename player ──
  socket.on('rename_player', ({ name }, cb) => {
    if (!name?.trim()) return cb?.({ error: 'Tên không hợp lệ' });
    const room = getRoom(socket.roomCode);
    if (!room) return cb?.({ error: 'Phòng không tồn tại' });
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return cb?.({ error: 'Không tìm thấy người chơi' });
    player.name = name.trim().slice(0, 20);
    broadcastPlayerList(room);
    cb?.({ ok: true, name: player.name });
  });

  // ── Update settings (host only) ──
  socket.on('update_settings', ({ selectedRoles, gameMode }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;
    if (selectedRoles) room.settings.selectedRoles = selectedRoles;
    if (gameMode) room.settings.gameMode = gameMode;
    broadcastSettings(room);
  });

  // ── Start game (host only) ──
  socket.on('start_game', (_, cb) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id) return cb?.({ error: 'Không có quyền' });
    if (room.players.length < 3) return cb?.({ error: 'Cần ít nhất 3 người chơi' });

    try {
      startGame(room);
    } catch (e) {
      return cb?.({ error: e.message });
    }

    // Send each real player their private role (skip bots)
    room.players.filter(p => !p.isBot).forEach(p => {
      io.to(p.id).emit('role_assigned', {
        roleId: room.originalCards[p.id],
        role: ROLES[room.originalCards[p.id]],
      });
    });

    io.to(room.code).emit('game_started', {
      state: 'role_reveal',
      playerCount: room.players.length,
      hasAlphaWolf: room.hasAlphaWolf || false,
    });

    cb?.({ ok: true });

    // After 15s role reveal, start night
    setTimeout(() => {
      if (room.state === 'role_reveal') {
        runNightPhase(room);
      }
    }, 15000);
  });

  // ── Night action submitted ──
  socket.on('night_action', ({ role, action }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.state !== 'night') return;

    const nightPhase = room.nightPhase;
    const idx = nightPhase.pendingPlayerIds.indexOf(socket.id);
    if (idx === -1) return;

    const result = processNightAction(room, socket.id, role, action);

    // Log this action for post-game history
    const playerName = room.players.find(p => p.id === socket.id)?.name || '?';
    if (!room.nightLog) room.nightLog = [];
    room.nightLog.push({
      role,
      playerId: socket.id,
      playerName,
      action: { ...action },
      result: { ...result },
    });

    if (Object.keys(result).length > 0) {
      socket.emit('night_action_result', { role, result });
    }

    // Revealer public broadcast
    if (role === 'revealer' && result.revealed && result.targetPlayer) {
      io.to(room.code).emit('night_public_reveal', {
        playerId: result.targetPlayer,
        role: result.role,
      });
    }

    // Multi-step roles: keep player pending if they can continue
    const ms = nightPhase.multiStepState?.[socket.id];
    if (role === 'paranormalinvestigator' && result.canContinue) {
      socket.emit('night_action_request', {
        role,
        ...getNightActionData(room, role),
        otherPlayers: room.players.filter(p => p.id !== socket.id).map(p => ({ id: p.id, name: p.name })),
        step: 2,
        shieldedPlayer: room.shieldedPlayer,
      });
      return;
    }
    if (role === 'witch' && result.step === 1 && result.canSwap) {
      socket.emit('night_action_request', {
        role,
        step: 2,
        centerSlot: action.centerSlot,
        centerRole: result.seen.role,
        otherPlayers: room.players.filter(p => p.id !== socket.id).map(p => ({ id: p.id, name: p.name })),
        shieldedPlayer: room.shieldedPlayer,
      });
      return;
    }

    nightPhase.pendingPlayerIds.splice(idx, 1);
    nightPhase.pendingActions.push({ playerId: socket.id, role, action });

    if (nightPhase.pendingPlayerIds.length === 0 && nightPhase.resolver) {
      clearTimeout(nightPhase.timer);
      const resolve = nightPhase.resolver;
      nightPhase.resolver = null;
      resolve();
    }
  });

  // ── Player ready after role reveal ──
  socket.on('ready', () => {
    // Just acknowledgement — timer handles progression
  });

  // ── Vote ──
  socket.on('vote', ({ targetId }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.state !== 'day') return;
    if (!room.players.some(p => p.id === targetId)) return;
    if (socket.id === targetId) return;

    room.dayPhase.votes[socket.id] = targetId;

    io.to(room.code).emit('vote_update', {
      votes: room.dayPhase.votes,
      bodyguardProtect: room.dayPhase.bodyguardProtect || null,
      players: room.players.map(p => ({ id: p.id, name: p.name })),
    });

    checkAllVoted(room);
  });

  // ── Bodyguard protect (instead of vote) ──
  socket.on('bodyguard_protect', ({ targetId }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.state !== 'day') return;
    if (!room.players.some(p => p.id === targetId)) return;
    if (socket.id === targetId) return;

    room.dayPhase.bodyguardProtect = { protectorId: socket.id, targetId };

    io.to(room.code).emit('vote_update', {
      votes: room.dayPhase.votes,
      bodyguardProtect: room.dayPhase.bodyguardProtect,
      players: room.players.map(p => ({ id: p.id, name: p.name })),
    });

    checkAllVoted(room);
  });

  // ── Deduction board ──
  socket.on('deduction_set', ({ position, roleId }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.state !== 'day') return;
    const tc = room.dayPhase?.tokenClaims;
    if (!tc || !tc.pool.includes(roleId)) return;

    // Validate position is a valid player ID or center slot
    const validCenters = room.hasAlphaWolf
      ? ['center0', 'center1', 'center2', 'centerWolf']
      : ['center0', 'center1', 'center2'];
    const isValidPos = room.players.some(p => p.id === position) || validCenters.includes(position);
    if (!isValidPos) return;

    // Enforce pool limit: count how many times this player already assigned this role
    const myRow = tc.deductions[socket.id] || {};
    const poolFreq = {};
    tc.pool.forEach(r => { poolFreq[r] = (poolFreq[r] || 0) + 1; });
    const maxAllowed = poolFreq[roleId] || 0;

    // Count current usage of this role in player's row (exclude the cell being set)
    let currentUsage = 0;
    Object.entries(myRow).forEach(([pos, rid]) => {
      if (rid === roleId && pos !== position) currentUsage++;
    });
    if (currentUsage >= maxAllowed) return; // Block: would exceed pool count

    if (!tc.deductions[socket.id]) tc.deductions[socket.id] = {};
    tc.deductions[socket.id][position] = roleId;
    tc.conflicts = computeDeductionConflicts(tc);
    io.to(room.code).emit('token_claims_update', sanitizeTokenClaims(tc, room));
  });

  socket.on('deduction_clear', ({ position }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.state !== 'day') return;
    const tc = room.dayPhase?.tokenClaims;
    if (!tc || !tc.deductions[socket.id]) return;

    delete tc.deductions[socket.id][position];
    if (Object.keys(tc.deductions[socket.id]).length === 0) {
      delete tc.deductions[socket.id];
    }
    tc.conflicts = computeDeductionConflicts(tc);
    io.to(room.code).emit('token_claims_update', sanitizeTokenClaims(tc, room));
  });

  // ── Hunter shoot (after being eliminated) ──
  socket.on('hunter_shoot', ({ targetId }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.state !== 'hunter_phase') return;
    if (!room.dayPhase.pendingHunters?.includes(socket.id)) return;
    if (!room.players.some(p => p.id === targetId)) return;
    if (socket.id === targetId) return;

    room.dayPhase.hunterTarget[socket.id] = targetId;
    room.dayPhase.pendingHunters = room.dayPhase.pendingHunters.filter(id => id !== socket.id);

    io.to(room.code).emit('hunter_shoot_update', {
      hunterId: socket.id,
      hunterName: room.players.find(p => p.id === socket.id)?.name,
    });

    if (room.dayPhase.pendingHunters.length === 0) {
      finishGame(room);
    }
  });

  // ── Timer controls (host only) ──
  socket.on('timer_pause', () => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id || room.state !== 'day') return;
    if (room.dayPhase.paused) return;

    // Store remaining time and clear auto-end timer
    const remaining = Math.max(0, room.dayPhase.timerEnd - Date.now());
    room.dayPhase.paused = true;
    room.dayPhase.pausedRemaining = remaining;
    if (room.dayPhase.autoEndTimer) clearTimeout(room.dayPhase.autoEndTimer);

    io.to(room.code).emit('timer_update', { paused: true, remaining });
  });

  socket.on('timer_resume', () => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id || room.state !== 'day') return;
    if (!room.dayPhase.paused) return;

    const remaining = room.dayPhase.pausedRemaining || 0;
    room.dayPhase.paused = false;
    room.dayPhase.pausedRemaining = null;
    room.dayPhase.timerEnd = Date.now() + remaining;

    // Restart auto-end timer
    room.dayPhase.autoEndTimer = setTimeout(() => {
      if (room.state === 'day') endGame(room);
    }, remaining);

    io.to(room.code).emit('timer_update', { paused: false, timerEnd: room.dayPhase.timerEnd });
  });

  socket.on('timer_adjust', ({ seconds }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id || room.state !== 'day') return;
    const delta = parseInt(seconds);
    if (isNaN(delta)) return;

    if (room.dayPhase.paused) {
      // Adjust paused remaining
      room.dayPhase.pausedRemaining = Math.max(0, (room.dayPhase.pausedRemaining || 0) + delta * 1000);
      io.to(room.code).emit('timer_update', { paused: true, remaining: room.dayPhase.pausedRemaining });
    } else {
      // Adjust live timer
      room.dayPhase.timerEnd = Math.max(Date.now(), room.dayPhase.timerEnd + delta * 1000);
      if (room.dayPhase.autoEndTimer) clearTimeout(room.dayPhase.autoEndTimer);
      const remaining = room.dayPhase.timerEnd - Date.now();
      room.dayPhase.autoEndTimer = setTimeout(() => {
        if (room.state === 'day') endGame(room);
      }, remaining);

      io.to(room.code).emit('timer_update', { paused: false, timerEnd: room.dayPhase.timerEnd });
    }
  });

  // ── Force end day (host only) ──
  socket.on('end_day', () => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id || room.state !== 'day') return;
    endGame(room);
  });

  // ── New game (host only) ──
  socket.on('new_game', () => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.state = 'waiting';
    room.originalCards = {};
    room.currentCards = {};
    room.nightPhase = null;
    room.dayPhase = null;
    room.results = null;
    io.to(room.code).emit('back_to_lobby', {
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost, isBot: p.isBot || false })),
      settings: room.settings,
      hostId: room.hostId,
    });
  });

  // ── Leave room (back to home) ──
  socket.on('leave_room', (_, cb) => {
    const room = getRoomByPlayerId(socket.id);
    if (!room) return cb?.({ ok: true });
    if (room.state !== 'waiting') return cb?.({ error: 'Không thể rời phòng khi game đang chơi' });
    socket.leave(room.code);
    const updated = removePlayer(room, socket.id);
    if (updated) broadcastPlayerList(updated);
    cb?.({ ok: true });
  });

  // ── Chat ──
  socket.on('chat_send', ({ roomCode, text }) => {
    if (!text?.trim() || !roomCode) return;
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const msg = {
      id: socket.id,
      name: player.name,
      text: text.trim().slice(0, 200),
      time: Date.now(),
      type: 'chat',
    };
    io.to(roomCode).emit('chat_message', msg);
  });

  // ── Voice Chat (WebRTC signaling) ──
  socket.on('voice_join', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    if (!room.voiceParticipants) room.voiceParticipants = new Set();
    // Send current voice peers to the joiner
    const existingPeers = [...room.voiceParticipants].filter(id => id !== socket.id);
    socket.emit('voice_peers', { peers: existingPeers });
    // Add to set and notify others
    room.voiceParticipants.add(socket.id);
    socket.to(roomCode).emit('voice_peer_joined', { peerId: socket.id });
  });

  socket.on('voice_leave', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room || !room.voiceParticipants) return;
    room.voiceParticipants.delete(socket.id);
    io.to(roomCode).emit('voice_peer_left', { peerId: socket.id });
  });

  socket.on('webrtc_signal', ({ to, signal }) => {
    io.to(to).emit('webrtc_signal', { from: socket.id, signal });
  });

  socket.on('voice_mute_change', ({ roomCode, muted }) => {
    socket.to(roomCode).emit('voice_muted', { peerId: socket.id, muted });
  });

  socket.on('voice_host_mute', ({ roomCode, targetId }) => {
    const room = getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;
    // Send mute request to the target player
    io.to(targetId).emit('voice_host_mute_request', { by: socket.id });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;

    // Clean up voice chat
    if (room.voiceParticipants?.has(socket.id)) {
      room.voiceParticipants.delete(socket.id);
      io.to(room.code).emit('voice_peer_left', { peerId: socket.id });
    }

    const player = room.players.find(p => p.id === socket.id);

    if (room.state !== 'waiting' && player) {
      saveDisconnectedPlayer(socket.id, room.code, player.name);
      console.log(`Saved disconnect state for ${player.name} in room ${room.code}`);

      if (room.state === 'night' && room.nightPhase) {
        const np = room.nightPhase;
        const idx = np.pendingPlayerIds.indexOf(socket.id);
        if (idx !== -1) {
          np.pendingPlayerIds.splice(idx, 1);
          if (np.pendingPlayerIds.length === 0 && np.resolver) {
            clearTimeout(np.timer);
            const resolve = np.resolver;
            np.resolver = null;
            resolve();
          }
        }
      }
      return;
    }

    const updated = removePlayer(room, socket.id);
    if (updated) {
      broadcastPlayerList(updated);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  const nets = require('os').networkInterfaces();
  Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).forEach(n => {
    console.log(`  → http://${n.address}:${PORT}`);
  });
});

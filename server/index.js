const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const { ROLES, getNightOrder, isWolfRole } = require('./roles');
const { createRoom, getRoom, getRoomByPlayerId, addPlayer, removePlayer, saveDisconnectedPlayer, findDisconnectedPlayer, clearDisconnectedPlayer } = require('./rooms');
const { startGame, getNightActionData, processNightAction, computeResults, getEliminatedHunters } = require('./gameLogic');

const app = express();
app.use(cors());
app.use(express.json());

const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/socket.io')) return next();
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

function broadcastPlayerList(room) {
  io.to(room.code).emit('player_list', {
    players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
    hostId: room.hostId,
  });
}

function broadcastSettings(room) {
  io.to(room.code).emit('settings_updated', { settings: room.settings });
}

// ─── Night phase orchestration ────────────────────────────────────────────────

async function runNightPhase(room) {
  const { nightPhase, players } = room;
  room.state = 'night';

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
      actingPlayers.forEach(p => {
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
  room.dayPhase = {
    votes: {},
    timerEnd: Date.now() + 5 * 60 * 1000,
  };

  io.to(room.code).emit('day_start', {
    timerEnd: room.dayPhase.timerEnd,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
  });

  // Auto-end after 5 minutes
  room.dayPhase.autoEndTimer = setTimeout(() => {
    if (room.state === 'day') endGame(room);
  }, 5 * 60 * 1000);
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

    hunters.forEach(hunterId => {
      io.to(hunterId).emit('hunter_shoot_request', {
        otherPlayers: otherPlayers.filter(p => p.id !== hunterId),
      });
    });

    io.to(room.code).emit('hunter_phase_start', {
      hunters: hunters.map(id => {
        const p = room.players.find(pp => pp.id === id);
        return { id, name: p?.name };
      }),
    });

    room.dayPhase.hunterTimer = setTimeout(() => {
      finishGame(room);
    }, 15000);

    return;
  }

  finishGame(room);
}

function finishGame(room) {
  if (room.dayPhase?.hunterTimer) clearTimeout(room.dayPhase.hunterTimer);
  const results = computeResults(room);

  io.to(room.code).emit('game_over', {
    results,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
  });
}

// ─── Socket events ────────────────────────────────────────────────────────────

io.on('connection', socket => {
  console.log('Connected:', socket.id);

  // ── Create room ──
  socket.on('create_room', ({ name, token }, cb) => {
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });
    const room = createRoom(socket.id, name.trim(), token);
    socket.join(room.code);
    socket.roomCode = room.code;
    cb({
      code: room.code,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
      settings: room.settings,
      hostId: room.hostId,
    });
  });

  // ── Join room ──
  socket.on('join_room', ({ code, name, token }, cb) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) return cb({ error: 'Không tìm thấy phòng' });
    if (room.state !== 'waiting') return cb({ error: 'Game đã bắt đầu' });
    if (room.players.length >= 10) return cb({ error: 'Phòng đã đầy (tối đa 10 người)' });
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });

    const added = addPlayer(room, socket.id, name.trim(), token);
    if (!added) return cb({ error: 'Bạn đã trong phòng này' });

    socket.join(room.code);
    socket.roomCode = room.code;
    broadcastPlayerList(room);

    cb({
      code: room.code,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
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

    socket.join(room.code);
    socket.roomCode = room.code;

    const roleId = room.originalCards[socket.id];
    const currentRoleId = room.currentCards[socket.id];

    cb?.({
      ok: true,
      code: room.code,
      state: room.state,
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
      settings: room.settings,
      hostId: room.hostId,
      roleId,
      role: roleId ? ROLES[roleId] : null,
      currentRoleId,
      votes: room.dayPhase?.votes || {},
      timerEnd: room.dayPhase?.timerEnd || null,
      hasAlphaWolf: room.hasAlphaWolf || false,
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

    // Send each player their private role
    room.players.forEach(p => {
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
      players: room.players.map(p => ({ id: p.id, name: p.name, isHost: p.isHost })),
      settings: room.settings,
      hostId: room.hostId,
    });
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const room = getRoomByPlayerId(socket.id);
    if (!room) return;

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

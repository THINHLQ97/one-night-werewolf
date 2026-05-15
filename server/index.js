const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const { ROLES, getNightOrder } = require('./roles');
const { createRoom, getRoom, getRoomByPlayerId, addPlayer, removePlayer, saveDisconnectedPlayer, findDisconnectedPlayer, clearDisconnectedPlayer } = require('./rooms');
const { startGame, getNightActionData, processNightAction, computeResults } = require('./gameLogic');

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
    const actingPlayers = players.filter(p => room.originalCards[p.id] === role);

    if (actingPlayers.length > 0) {
      // Send action request to each acting player
      actingPlayers.forEach(p => {
        const actionData = getNightActionData(room, role);
        // Filter otherPlayers to exclude self
        if (actionData.otherPlayers) {
          actionData.otherPlayers = actionData.otherPlayers.filter(op => op.id !== p.id);
        }
        io.to(p.id).emit('night_action_request', { role, ...actionData });
      });

      // Wait for all actions (30s timeout)
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
      // Brief pause for narration even if no one acts
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

function endGame(room) {
  if (room.dayPhase?.autoEndTimer) clearTimeout(room.dayPhase.autoEndTimer);
  const results = computeResults(room);

  const playerMap = {};
  room.players.forEach(p => { playerMap[p.id] = p.name; });

  io.to(room.code).emit('game_over', {
    results,
    players: room.players.map(p => ({ id: p.id, name: p.name })),
  });
}

// ─── Socket events ────────────────────────────────────────────────────────────

io.on('connection', socket => {
  console.log('Connected:', socket.id);

  // ── Create room ──
  socket.on('create_room', ({ name }, cb) => {
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });
    const room = createRoom(socket.id, name.trim());
    socket.join(room.code);
    socket.roomCode = room.code;
    cb({
      code: room.code,
      players: room.players,
      settings: room.settings,
      hostId: room.hostId,
    });
  });

  // ── Join room ──
  socket.on('join_room', ({ code, name }, cb) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) return cb({ error: 'Không tìm thấy phòng' });
    if (room.state !== 'waiting') return cb({ error: 'Game đã bắt đầu' });
    if (room.players.length >= 10) return cb({ error: 'Phòng đã đầy (tối đa 10 người)' });
    if (!name?.trim()) return cb({ error: 'Tên không được để trống' });

    const added = addPlayer(room, socket.id, name.trim());
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
  socket.on('rejoin_room', ({ code, name }, cb) => {
    const room = getRoom(code?.toUpperCase());
    if (!room) return cb?.({ error: 'Phòng không tồn tại' });

    const dc = findDisconnectedPlayer(code, name);
    if (dc) {
      const oldId = dc.oldId;
      clearDisconnectedPlayer(code, name);

      const player = room.players.find(p => p.id === oldId);
      if (player) {
        player.id = socket.id;
        if (room.hostId === oldId) room.hostId = socket.id;

        if (room.originalCards[oldId] !== undefined) {
          room.originalCards[socket.id] = room.originalCards[oldId];
          delete room.originalCards[oldId];
        }
        if (room.currentCards[oldId] !== undefined) {
          room.currentCards[socket.id] = room.currentCards[oldId];
          delete room.currentCards[oldId];
        }
        if (room.dayPhase?.votes[oldId] !== undefined) {
          room.dayPhase.votes[socket.id] = room.dayPhase.votes[oldId];
          delete room.dayPhase.votes[oldId];
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
        });

        broadcastPlayerList(room);
        return;
      }
    }

    cb?.({ error: 'Không tìm thấy phiên cũ' });
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
  socket.on('update_settings', ({ selectedRoles }) => {
    const room = getRoom(socket.roomCode);
    if (!room || room.hostId !== socket.id) return;
    room.settings.selectedRoles = selectedRoles;
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

    // Process the action
    const result = processNightAction(room, socket.id, role, action);

    // Send private result to this player
    if (Object.keys(result).length > 0) {
      socket.emit('night_action_result', { role, result });
    }

    // Mark as done
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
      players: room.players.map(p => ({ id: p.id, name: p.name })),
    });

    // Auto-end when everyone voted
    const voted = Object.keys(room.dayPhase.votes).length;
    if (voted >= room.players.length) {
      endGame(room);
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

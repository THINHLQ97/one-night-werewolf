const rooms = new Map();
const disconnectedPlayers = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom(hostId, hostName, token) {
  const code = generateCode();
  const room = {
    code,
    hostId,
    state: 'waiting',
    players: [{ id: hostId, name: hostName, isHost: true, token: token || null }],
    settings: {
      selectedRoles: ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
    },
    originalCards: {},
    currentCards: {},
    nightPhase: null,
    dayPhase: null,
    results: null,
  };
  rooms.set(code, room);
  return room;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function getRoomByPlayerId(playerId) {
  for (const room of rooms.values()) {
    if (room.players.some(p => p.id === playerId)) return room;
  }
  return null;
}

function addPlayer(room, playerId, playerName, token) {
  if (room.players.some(p => p.id === playerId)) return false;
  room.players.push({ id: playerId, name: playerName, isHost: false, token: token || null });
  return true;
}

function removePlayer(room, playerId) {
  room.players = room.players.filter(p => p.id !== playerId);
  if (room.players.length === 0) {
    rooms.delete(room.code);
    return null;
  }
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }
  return room;
}

function saveDisconnectedPlayer(oldSocketId, roomCode, playerName) {
  disconnectedPlayers.set(`${roomCode}:${playerName}`, {
    oldId: oldSocketId,
    roomCode,
    name: playerName,
    disconnectedAt: Date.now(),
  });
  setTimeout(() => {
    disconnectedPlayers.delete(`${roomCode}:${playerName}`);
  }, 30 * 60 * 1000);
}

function findDisconnectedPlayer(roomCode, playerName) {
  return disconnectedPlayers.get(`${roomCode}:${playerName}`) || null;
}

function clearDisconnectedPlayer(roomCode, playerName) {
  disconnectedPlayers.delete(`${roomCode}:${playerName}`);
}

function deleteRoom(code) {
  rooms.delete(code);
}

module.exports = { createRoom, getRoom, getRoomByPlayerId, addPlayer, removePlayer, deleteRoom, saveDisconnectedPlayer, findDisconnectedPlayer, clearDisconnectedPlayer };

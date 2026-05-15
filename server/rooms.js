const rooms = new Map();

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code;
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function createRoom(hostId, hostName) {
  const code = generateCode();
  const room = {
    code,
    hostId,
    state: 'waiting',
    players: [{ id: hostId, name: hostName, isHost: true }],
    settings: {
      selectedRoles: ['werewolf', 'werewolf', 'seer', 'robber', 'troublemaker', 'villager', 'villager'],
    },
    // Set during game
    originalCards: {},  // playerId/center0-2 -> roleId at game start
    currentCards: {},   // playerId/center0-2 -> roleId after night actions
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

function addPlayer(room, playerId, playerName) {
  if (room.players.some(p => p.id === playerId)) return false;
  room.players.push({ id: playerId, name: playerName, isHost: false });
  return true;
}

function removePlayer(room, playerId) {
  room.players = room.players.filter(p => p.id !== playerId);
  if (room.players.length === 0) {
    rooms.delete(room.code);
    return null;
  }
  // Transfer host if host left
  if (room.hostId === playerId) {
    room.hostId = room.players[0].id;
    room.players[0].isHost = true;
  }
  return room;
}

function deleteRoom(code) {
  rooms.delete(code);
}

module.exports = { createRoom, getRoom, getRoomByPlayerId, addPlayer, removePlayer, deleteRoom };

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

function createRoom(hostId, hostName, token, userId = null) {
  const code = generateCode();
  const room = {
    code,
    hostId,
    state: 'waiting',
    createdAt: Date.now(),
    players: [{ id: hostId, name: hostName, isHost: true, token: token || null, userId }],
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

function addPlayer(room, playerId, playerName, token, isBot = false, userId = null) {
  if (room.players.some(p => p.id === playerId)) return false;
  room.players.push({ id: playerId, name: playerName, isHost: false, token: token || null, isBot, userId });
  return true;
}

function addBotPlayers(room, count, generateBotId, generateBotName) {
  const added = [];
  for (let i = 0; i < count; i++) {
    const id = generateBotId();
    const name = generateBotName(i);
    room.players.push({ id, name, isHost: false, token: null, isBot: true });
    added.push({ id, name });
  }
  return added;
}

function hasHumanPlayers(room) {
  return room.players.some(p => !p.isBot);
}

function removePlayer(room, playerId) {
  room.players = room.players.filter(p => p.id !== playerId);
  // Delete room when no human players remain (bots alone can't keep room alive)
  if (!hasHumanPlayers(room)) {
    rooms.delete(room.code);
    return null;
  }
  if (room.hostId === playerId) {
    // Reassign host to first human player
    const nextHost = room.players.find(p => !p.isBot);
    if (nextHost) {
      room.hostId = nextHost.id;
      nextHost.isHost = true;
    }
  }
  return room;
}

function listPublicRooms() {
  const list = [];
  for (const room of rooms.values()) {
    if (room.state !== 'waiting') continue;
    const humans = room.players.filter(p => !p.isBot);
    const bots = room.players.filter(p => p.isBot);
    const host = room.players.find(p => p.id === room.hostId);
    list.push({
      code: room.code,
      hostName: host?.name || '?',
      playerCount: room.players.length,
      humanCount: humans.length,
      botCount: bots.length,
      isSimulation: !!room.isSimulation,
      gameMode: room.settings?.gameMode || 'classic',
      createdAt: room.createdAt || 0,
    });
  }
  // Sort newest first
  return list.sort((a, b) => b.createdAt - a.createdAt);
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

function getAllRooms() {
  return [...rooms.values()];
}

module.exports = { createRoom, getRoom, getRoomByPlayerId, addPlayer, addBotPlayers, removePlayer, deleteRoom, saveDisconnectedPlayer, findDisconnectedPlayer, clearDisconnectedPlayer, listPublicRooms, hasHumanPlayers, getAllRooms };

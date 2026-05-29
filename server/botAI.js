const { isWolfRole } = require('./roles');

const BOT_NAMES = [
  'Bot Tí', 'Bot Tèo', 'Bot Mập', 'Bot Lùn', 'Bot Gầy',
  'Bot Hùng', 'Bot Dũng', 'Bot Lan', 'Bot Mai', 'Bot Phúc',
];

let botCounter = 0;

function generateBotId() {
  return `bot_${Date.now()}_${++botCounter}`;
}

function generateBotName(index) {
  return BOT_NAMES[index % BOT_NAMES.length];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getOtherPlayerIds(room, botId) {
  return room.players.filter(p => p.id !== botId).map(p => p.id);
}

function getValidCenterSlots(room) {
  return room.hasAlphaWolf
    ? ['center0', 'center1', 'center2', 'centerWolf']
    : ['center0', 'center1', 'center2'];
}

function decideBotNightAction(room, botId, role) {
  const others = getOtherPlayerIds(room, botId);
  const centers = getValidCenterSlots(room);

  switch (role) {
    case 'doppelganger':
      return { targetPlayer: pickRandom(others), step: 1 };

    case 'sentinel':
      return { targetPlayer: pickRandom(others) };

    case 'werewolf': {
      const wolvesFilter = r => (r === 'werewolf' || r === 'alphawolf' || r === 'mysticwolf');
      const wolves = room.players.filter(p => wolvesFilter(room.originalCards[p.id]));
      if (wolves.length === 1) {
        return { peekCenter: pickRandom(centers) };
      }
      return {};
    }

    case 'alphawolf': {
      const nonWolves = others.filter(id => !isWolfRole(room.originalCards[id]));
      const target = nonWolves.length > 0 ? pickRandom(nonWolves) : pickRandom(others);
      return { targetPlayer: target };
    }

    case 'mysticwolf': {
      const nonWolves = others.filter(id => !isWolfRole(room.originalCards[id]));
      const target = nonWolves.length > 0 ? pickRandom(nonWolves) : pickRandom(others);
      return { targetPlayer: target };
    }

    case 'minion':
    case 'mason':
      return {};

    case 'apprenticeseer':
      return { centerSlot: pickRandom(centers) };

    case 'seer': {
      if (Math.random() < 0.6) {
        return { targetPlayer: pickRandom(others) };
      }
      const shuffled = [...centers].sort(() => Math.random() - 0.5);
      return { centerSlots: shuffled.slice(0, 2) };
    }

    case 'paranormalinvestigator':
      return { targetPlayer: pickRandom(others), step: 1 };

    case 'robber':
      return { targetPlayer: pickRandom(others) };

    case 'witch':
      return { centerSlot: pickRandom(centers), step: 1 };

    case 'troublemaker': {
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      if (shuffled.length >= 2) {
        return { target1: shuffled[0], target2: shuffled[1] };
      }
      return {};
    }

    case 'villageidiot':
      return { direction: Math.random() < 0.5 ? 'left' : 'right' };

    case 'drunk':
      return { centerSlot: pickRandom(centers) };

    case 'insomniac':
      return {};

    case 'revealer':
      return { targetPlayer: pickRandom(others) };

    default:
      return {};
  }
}

function decideBotDoppelgangerStep2(room, botId, copiedRole) {
  // Delegate to the copied role's AI
  return decideBotNightAction(room, botId, copiedRole);
}

function decideBotNightActionStep2(room, botId, role, step1Result) {
  const others = getOtherPlayerIds(room, botId);

  if (role === 'paranormalinvestigator') {
    return { targetPlayer: pickRandom(others), step: 2 };
  }

  if (role === 'witch') {
    if (Math.random() < 0.7 && others.length > 0) {
      return { targetPlayer: pickRandom(others), step: 2 };
    }
    return { targetPlayer: 'skip', step: 2 };
  }

  return {};
}

function decideBotVote(room, botId) {
  const others = getOtherPlayerIds(room, botId);
  const originalRole = room.originalCards[botId];
  const currentRole = room.currentCards[botId];

  const knownWolves = [];
  const knownVillage = [];

  room.players.forEach(p => {
    if (p.id === botId) return;
    const orig = room.originalCards[p.id];
    if (isWolfRole(orig)) knownWolves.push(p.id);
    else if (orig !== 'tanner') knownVillage.push(p.id);
  });

  if (isWolfRole(originalRole) || originalRole === 'minion') {
    const nonWolves = others.filter(id => !isWolfRole(room.originalCards[id]) && room.originalCards[id] !== 'minion');
    if (nonWolves.length > 0) return pickRandom(nonWolves);
    return pickRandom(others);
  }

  if (originalRole === 'tanner') {
    return pickRandom(others);
  }

  if (knownWolves.length > 0) {
    return pickRandom(knownWolves);
  }

  return pickRandom(others);
}

function decideBotBodyguardProtect(room, botId) {
  const others = getOtherPlayerIds(room, botId);
  return pickRandom(others);
}

function decideBotHunterShoot(room, botId) {
  const others = getOtherPlayerIds(room, botId);
  const originalRole = room.originalCards[botId];

  if (isWolfRole(originalRole)) {
    const nonWolves = others.filter(id => !isWolfRole(room.originalCards[id]));
    if (nonWolves.length > 0) return pickRandom(nonWolves);
  }

  return pickRandom(others);
}

module.exports = {
  generateBotId,
  generateBotName,
  decideBotNightAction,
  decideBotNightActionStep2,
  decideBotDoppelgangerStep2,
  decideBotVote,
  decideBotBodyguardProtect,
  decideBotHunterShoot,
};

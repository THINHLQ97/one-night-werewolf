const { ROLES, getNightOrder } = require('./roles');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const VALID_CENTER_SLOTS = ['center0', 'center1', 'center2'];

function isValidPlayerId(room, id) {
  return room.players.some(p => p.id === id);
}

function startGame(room) {
  const { players, settings } = room;
  const roles = [...settings.selectedRoles];

  if (roles.length !== players.length + 3) {
    throw new Error(`Need exactly ${players.length + 3} roles for ${players.length} players`);
  }

  shuffle(roles);

  const cards = {};
  players.forEach((p, i) => {
    cards[p.id] = roles[i];
  });
  cards['center0'] = roles[players.length];
  cards['center1'] = roles[players.length + 1];
  cards['center2'] = roles[players.length + 2];

  room.originalCards = { ...cards };
  room.currentCards = { ...cards };
  room.state = 'role_reveal';
  room.nightPhase = {
    roleOrder: getNightOrder(settings.selectedRoles),
    currentRoleIndex: -1,
    pendingPlayerIds: [],
    pendingActions: [],
    resolver: null,
    timer: null,
  };
  room.dayPhase = null;
  room.results = null;
}

// ─── Night helpers ────────────────────────────────────────────────────────────

function getNightActionData(room, role) {
  const { players } = room;

  switch (role) {
    case 'werewolf': {
      const werewolves = players.filter(p => room.originalCards[p.id] === 'werewolf').map(p => ({ id: p.id, name: p.name }));
      return { werewolves, isSolo: werewolves.length === 1 };
    }
    case 'minion': {
      const werewolves = players.filter(p => room.originalCards[p.id] === 'werewolf').map(p => ({ id: p.id, name: p.name }));
      return { werewolves };
    }
    case 'mason': {
      const masons = players.filter(p => room.originalCards[p.id] === 'mason').map(p => ({ id: p.id, name: p.name }));
      return { masons };
    }
    case 'seer':
    case 'robber':
    case 'troublemaker': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers };
    }
    case 'drunk':
    case 'insomniac':
    default:
      return {};
  }
}

function processNightAction(room, playerId, role, action) {
  const { currentCards } = room;

  switch (role) {
    case 'werewolf': {
      if (action.peekCenter !== undefined) {
        if (!VALID_CENTER_SLOTS.includes(action.peekCenter)) return {};
        return { peeked: { slot: action.peekCenter, role: currentCards[action.peekCenter] } };
      }
      return {};
    }

    case 'minion':
      return {};

    case 'mason':
      return {};

    case 'seer': {
      if (action.targetPlayer) {
        if (!isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
        return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
      }
      if (action.centerSlots && Array.isArray(action.centerSlots) && action.centerSlots.length === 2) {
        if (!action.centerSlots.every(s => VALID_CENTER_SLOTS.includes(s))) return {};
        return {
          seen: {
            type: 'center',
            slots: action.centerSlots.map(s => ({ slot: s, role: currentCards[s] })),
          },
        };
      }
      return {};
    }

    case 'robber': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
      const myOldRole = currentCards[playerId];
      const theirRole = currentCards[action.targetPlayer];
      currentCards[playerId] = theirRole;
      currentCards[action.targetPlayer] = myOldRole;
      return { newRole: theirRole };
    }

    case 'troublemaker': {
      if (!action.target1 || !action.target2) return {};
      if (!isValidPlayerId(room, action.target1) || !isValidPlayerId(room, action.target2)) return {};
      if (action.target1 === playerId || action.target2 === playerId) return {};
      if (action.target1 === action.target2) return {};
      const r1 = currentCards[action.target1];
      const r2 = currentCards[action.target2];
      currentCards[action.target1] = r2;
      currentCards[action.target2] = r1;
      return {};
    }

    case 'drunk': {
      if (!action.centerSlot || !VALID_CENTER_SLOTS.includes(action.centerSlot)) return {};
      const myRole = currentCards[playerId];
      const centerRole = currentCards[action.centerSlot];
      currentCards[playerId] = centerRole;
      currentCards[action.centerSlot] = myRole;
      return {};
    }

    case 'insomniac': {
      return { currentRole: currentCards[playerId] };
    }

    default:
      return {};
  }
}

// ─── Vote & results ───────────────────────────────────────────────────────────

function tallyVotes(room) {
  const { players, dayPhase } = room;
  const votes = dayPhase.votes;

  const tally = {};
  players.forEach(p => { tally[p.id] = 0; });
  Object.values(votes).forEach(targetId => {
    if (tally[targetId] !== undefined) tally[targetId]++;
  });

  const maxVotes = Math.max(0, ...Object.values(tally));
  const eliminated = maxVotes >= 2
    ? players.filter(p => tally[p.id] === maxVotes).map(p => p.id)
    : [];

  return { tally, eliminated };
}

function applyHunterEffect(room, eliminated) {
  const { currentCards, dayPhase } = room;
  const hunterKills = [];

  for (const id of eliminated) {
    if (currentCards[id] === 'hunter' && dayPhase.votes[id]) {
      const target = dayPhase.votes[id];
      if (!eliminated.includes(target) && !hunterKills.includes(target)) {
        hunterKills.push(target);
      }
    }
  }

  return [...eliminated, ...hunterKills];
}

function determineWinners(room, eliminated) {
  const { players, currentCards } = room;

  const werewolvesInGame = players.some(p => currentCards[p.id] === 'werewolf');
  const eliminatedWerewolf = eliminated.some(id => currentCards[id] === 'werewolf');
  const eliminatedTanner = eliminated.some(id => currentCards[id] === 'tanner');

  const winners = [];

  // Tanner wins if eliminated (independent of other outcomes)
  if (eliminatedTanner) {
    eliminated.forEach(id => {
      if (currentCards[id] === 'tanner') winners.push(id);
    });
  }

  if (werewolvesInGame) {
    if (eliminatedWerewolf) {
      // Village wins: at least one werewolf killed
      players.forEach(p => {
        const role = currentCards[p.id];
        if (role !== 'werewolf' && role !== 'minion' && role !== 'tanner') {
          winners.push(p.id);
        }
      });
    } else {
      // Werewolf team wins: no werewolf killed
      players.forEach(p => {
        const role = currentCards[p.id];
        if (role === 'werewolf' || role === 'minion') {
          winners.push(p.id);
        }
      });
    }
  } else {
    // No werewolves among players — village wins only if no one is killed
    if (eliminated.length === 0) {
      players.forEach(p => {
        const role = currentCards[p.id];
        if (role !== 'tanner') winners.push(p.id);
      });
    }
  }

  return { winners: [...new Set(winners)] };
}

function computeResults(room) {
  const { tally, eliminated: initialEliminated } = tallyVotes(room);
  const eliminated = applyHunterEffect(room, initialEliminated);
  const { winners } = determineWinners(room, eliminated);

  room.results = {
    tally,
    eliminated,
    initialEliminated,
    winners,
    finalCards: { ...room.currentCards },
    originalCards: { ...room.originalCards },
  };
  room.state = 'results';
  return room.results;
}

module.exports = { startGame, getNightActionData, processNightAction, computeResults };

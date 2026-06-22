const {
  OFFICE_ROLES,
  SNAKE_TEAM_ROLES,
  STAFF_TEAM_ROLES,
  ISHIKOI_TEAM_ROLES,
  isSnakeRole,
  isStaffRole,
  isIshikoiRole,
  getOfficeNightOrder,
} = require('./officeRoles');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const BASE_CENTER_SLOTS = ['center0', 'center1', 'center2'];
const ALL_CENTER_SLOTS = ['center0', 'center1', 'center2', 'centerSnake'];

function getValidCenterSlots(room) {
  return room.hasToxicManager ? ALL_CENTER_SLOTS : BASE_CENTER_SLOTS;
}

// Center slots Outsourcing can copy — only the 3 standard centers, NOT centerSnake
function getOutsourcingCenterSlots() {
  return BASE_CENTER_SLOTS;
}

function isValidPlayerId(room, id) {
  return room.players.some(p => p.id === id);
}

function isShielded() {
  // Office has no shield mechanic
  return false;
}

// ─── Start ────────────────────────────────────────────────────────────────────

function startOfficeGame(room) {
  const { players, settings } = room;
  const roles = [...settings.selectedRoles];

  if (roles.length !== players.length + 3) {
    throw new Error(`Need exactly ${players.length + 3} roles for ${players.length} players`);
  }

  shuffle(roles);

  if (room.isSimulation && room.preferredHostRole) {
    const preferred = room.preferredHostRole;
    const idx = roles.indexOf(preferred);
    if (idx !== -1) {
      const hostPos = players.findIndex(p => p.id === room.hostId);
      if (hostPos !== -1 && hostPos < players.length) {
        [roles[hostPos], roles[idx]] = [roles[idx], roles[hostPos]];
      }
    }
  }

  const cards = {};
  players.forEach((p, i) => { cards[p.id] = roles[i]; });
  cards['center0'] = roles[players.length];
  cards['center1'] = roles[players.length + 1];
  cards['center2'] = roles[players.length + 2];

  // Toxic Manager: extra Snake card placed outside the deck (analog of centerWolf)
  if (settings.selectedRoles.includes('toxic_manager')) {
    cards['centerSnake'] = 'snake';
  }

  // Snake artwork variant: random per game (Q1 answer = (a))
  room.snakeArt = Math.random() < 0.5 ? 'snake-1' : 'snake-2';

  room.originalCards = { ...cards };
  room.currentCards = { ...cards };
  room.state = 'role_reveal';
  room.shieldedPlayer = null;
  room.hasToxicManager = settings.selectedRoles.includes('toxic_manager');
  room.revealedToAll = {};
  room.outsourcingData = {}; // { playerId: { copiedRole, copiedFromSlot } }
  room.spammerTargets = {}; // { targetPlayerId: { spammerSide: 'left'|'right' } }
  room.nightPhase = {
    roleOrder: getOfficeNightOrder(settings.selectedRoles),
    currentRoleIndex: -1,
    pendingPlayerIds: [],
    pendingActions: [],
    resolver: null,
    timer: null,
    multiStepState: {},
  };
  room.dayPhase = null;
  room.results = null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNeighborIds(room, playerId) {
  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) return { left: null, right: null };
  const n = room.players.length;
  const leftIdx = (idx - 1 + n) % n;
  const rightIdx = (idx + 1) % n;
  return {
    left: room.players[leftIdx].id,
    right: room.players[rightIdx].id,
  };
}

// Build list of players who originally belong to Snake team (incl. Outsourcing copying snake)
function getOriginalSnakePlayers(room) {
  return room.players.filter(p => {
    const r = room.originalCards[p.id];
    if (isSnakeRole(r)) return true;
    if (r === 'outsourcing' && room.outsourcingData?.[p.id]) {
      return isSnakeRole(room.outsourcingData[p.id].copiedRole);
    }
    return false;
  });
}

function getOriginalIshikoiPlayers(room) {
  return room.players.filter(p => {
    const r = room.originalCards[p.id];
    if (isIshikoiRole(r)) return true;
    if (r === 'outsourcing' && room.outsourcingData?.[p.id]) {
      return isIshikoiRole(room.outsourcingData[p.id].copiedRole);
    }
    return false;
  });
}

// ─── Night action data (what to send to the player when their turn starts) ────

function getOfficeNightActionData(room, role) {
  const { players } = room;

  switch (role) {
    case 'outsourcing': {
      return { centerSlots: getOutsourcingCenterSlots(), step: 1 };
    }

    case 'snake': {
      // All snake players see each other (like wolves)
      const snakes = getOriginalSnakePlayers(room).map(p => ({
        id: p.id,
        name: p.name,
        role: room.originalCards[p.id] === 'outsourcing'
          ? room.outsourcingData[p.id].copiedRole
          : room.originalCards[p.id],
      }));
      return { snakes, isSolo: snakes.length === 1 };
    }

    case 'toxic_manager': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers };
    }

    case 'stalker': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers };
    }

    case 'snoop': {
      return { centerSlots: BASE_CENTER_SLOTS };
    }

    case 'netizen': {
      const ishikois = getOriginalIshikoiPlayers(room)
        .filter(p => {
          const r = room.originalCards[p.id];
          // Netizen sees only Ishikoi (not other Netizens)
          if (r === 'ishikoi') return true;
          if (r === 'outsourcing' && room.outsourcingData?.[p.id]?.copiedRole === 'ishikoi') return true;
          return false;
        })
        .map(p => ({ id: p.id, name: p.name }));
      return { ishikois };
    }

    case 'tracker': {
      // Server pre-computes neighbor snake count (not exposed until processNightAction)
      return {};
    }

    case 'spammer': {
      const { left, right } = getNeighborIds(room, null /* filled by role data below */);
      // Spammer can choose either neighbor — return both options
      return { needNeighbors: true };
    }

    case 'ceo':
      return { otherPlayers: players.map(p => ({ id: p.id, name: p.name })) };

    case 'poacher':
      return { otherPlayers: players.map(p => ({ id: p.id, name: p.name })) };

    case 'hr':
      return { otherPlayers: players.map(p => ({ id: p.id, name: p.name })) };

    case 'dumper':
      return { centerSlots: BASE_CENTER_SLOTS, allPlayers: players.map(p => ({ id: p.id, name: p.name })), step: 1 };

    case 'paranoid':
      return {};

    case 'legal':
      return { otherPlayers: players.map(p => ({ id: p.id, name: p.name })) };

    default:
      return {};
  }
}

// Variant of spammer night-data that needs playerId (called separately)
function getSpammerNeighbors(room, playerId) {
  return getNeighborIds(room, playerId);
}

// ─── Process action ───────────────────────────────────────────────────────────

function processOfficeNightAction(room, playerId, role, action) {
  const { currentCards } = room;

  switch (role) {
    case 'outsourcing': {
      if (!action.centerSlot || !getOutsourcingCenterSlots().includes(action.centerSlot)) return {};
      const copiedRole = currentCards[action.centerSlot];
      room.outsourcingData[playerId] = { copiedRole, copiedFromSlot: action.centerSlot };
      currentCards[playerId] = copiedRole;
      return { copiedRole, copiedFromSlot: action.centerSlot };
    }

    case 'snake': {
      // No action — just sees teammates
      return {};
    }

    case 'toxic_manager': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      // Move target's card → centerSnake, the centerSnake (a Snake) → target
      const oldCard = currentCards[action.targetPlayer];
      currentCards[action.targetPlayer] = currentCards['centerSnake'];
      currentCards['centerSnake'] = oldCard;
      return {};
    }

    case 'stalker': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
    }

    case 'snoop': {
      if (!action.centerSlot || !BASE_CENTER_SLOTS.includes(action.centerSlot)) return {};
      return { seen: { type: 'center', slots: [{ slot: action.centerSlot, role: currentCards[action.centerSlot] }] } };
    }

    case 'netizen': {
      // Re-compute ishikoi list at action time (in case outsourcing changed things)
      const ishikois = getOriginalIshikoiPlayers(room)
        .filter(p => {
          const r = room.originalCards[p.id];
          if (r === 'ishikoi') return true;
          if (r === 'outsourcing' && room.outsourcingData?.[p.id]?.copiedRole === 'ishikoi') return true;
          return false;
        })
        .map(p => ({ id: p.id, name: p.name }));
      return { ishikois };
    }

    case 'tracker': {
      const { left, right } = getNeighborIds(room, playerId);
      let count = 0;
      // Count neighbors whose CURRENT card is a Snake role (post-swap state)
      if (left && isSnakeRole(currentCards[left])) count++;
      if (right && isSnakeRole(currentCards[right])) count++;
      return { snakeNeighborCount: count };
    }

    case 'spammer': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      const { left, right } = getNeighborIds(room, playerId);
      // Validate target is a neighbor
      if (action.targetPlayer !== left && action.targetPlayer !== right) return {};
      // From target's perspective: spammer is on their OPPOSITE side
      // If I (spammer) chose my left neighbor → I am on their right
      // If I (spammer) chose my right neighbor → I am on their left
      const spammerSide = action.targetPlayer === left ? 'right' : 'left';
      room.spammerTargets[action.targetPlayer] = { spammerSide };
      return { targetPlayer: action.targetPlayer, side: spammerSide };
    }

    case 'ceo': {
      if (action.targetPlayer) {
        if (!isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
        return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
      }
      if (action.centerSlots && Array.isArray(action.centerSlots) && action.centerSlots.length === 2) {
        if (!action.centerSlots.every(s => BASE_CENTER_SLOTS.includes(s))) return {};
        return {
          seen: { type: 'center', slots: action.centerSlots.map(s => ({ slot: s, role: currentCards[s] })) },
        };
      }
      return {};
    }

    case 'poacher': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
      const myOldRole = currentCards[playerId];
      const theirRole = currentCards[action.targetPlayer];
      currentCards[playerId] = theirRole;
      currentCards[action.targetPlayer] = myOldRole;
      return { newRole: theirRole };
    }

    case 'hr': {
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

    case 'dumper': {
      const step = action.step || 1;
      const ms = room.nightPhase.multiStepState;
      if (!ms[playerId]) ms[playerId] = {};
      if (step === 1) {
        if (!action.centerSlot || !BASE_CENTER_SLOTS.includes(action.centerSlot)) return {};
        ms[playerId].dumperSlot = action.centerSlot;
        ms[playerId].dumperStep = 1;
        return {
          seen: { type: 'center', slot: action.centerSlot, role: currentCards[action.centerSlot] },
          step: 1,
          mustSwap: true,
        };
      }
      if (step === 2) {
        const slot = ms[playerId]?.dumperSlot;
        if (!slot) return {};
        if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
        // Swap center slot with target's card (target can be self)
        const centerRole = currentCards[slot];
        const playerRole = currentCards[action.targetPlayer];
        currentCards[action.targetPlayer] = centerRole;
        currentCards[slot] = playerRole;
        ms[playerId].dumperStep = 2;
        ms[playerId].dumperDone = true;
        return { swapped: true, step: 2, targetPlayer: action.targetPlayer };
      }
      return {};
    }

    case 'paranoid':
      return { currentRole: currentCards[playerId] };

    case 'legal': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      const targetRole = currentCards[action.targetPlayer];
      const isHidden = isSnakeRole(targetRole) || isIshikoiRole(targetRole);
      if (!isHidden) {
        room.revealedToAll[action.targetPlayer] = targetRole;
      }
      return { revealed: !isHidden, targetPlayer: action.targetPlayer, role: isHidden ? null : targetRole };
    }

    default:
      return {};
  }
}

// ─── Vote & results ───────────────────────────────────────────────────────────

function tallyOfficeVotes(room) {
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

function determineOfficeWinners(room, eliminated) {
  const { players, currentCards } = room;

  const hasSnakeInGame = players.some(p => isSnakeRole(currentCards[p.id]));
  const hasIshikoiInGame = players.some(p => currentCards[p.id] === 'ishikoi');

  const snakeEliminated = eliminated.some(id => isSnakeRole(currentCards[id]));
  const ishikoiEliminated = eliminated.some(id => currentCards[id] === 'ishikoi');
  // Netizen "substitutes" as Ishikoi ONLY if no Ishikoi in players
  const netizenEliminated = eliminated.some(id => currentCards[id] === 'netizen');
  const netizenActsAsIshikoi = !hasIshikoiInGame && netizenEliminated;

  const winners = [];

  // 1. Ishikoi-team wins — highest priority
  if (ishikoiEliminated || netizenActsAsIshikoi) {
    players.forEach(p => {
      if (isIshikoiRole(currentCards[p.id])) winners.push(p.id);
    });
    return { winners: [...new Set(winners)] };
  }

  // 2. Snake team check
  if (hasSnakeInGame) {
    if (snakeEliminated) {
      // Staff wins
      players.forEach(p => {
        if (isStaffRole(currentCards[p.id])) winners.push(p.id);
      });
    } else {
      // Snake wins
      players.forEach(p => {
        if (isSnakeRole(currentCards[p.id])) winners.push(p.id);
      });
    }
  } else {
    // No snake in players → staff wins by default (no threat existed)
    players.forEach(p => {
      if (isStaffRole(currentCards[p.id])) winners.push(p.id);
    });
  }

  return { winners: [...new Set(winners)] };
}

function computeOfficeResults(room) {
  const { tally, eliminated: initialEliminated } = tallyOfficeVotes(room);
  // No bodyguard, no hunter cascade — eliminated == initialEliminated
  const eliminated = initialEliminated;
  const { winners } = determineOfficeWinners(room, eliminated);

  room.results = {
    tally,
    votes: { ...(room.dayPhase?.votes || {}) },
    eliminated,
    initialEliminated,
    winners,
    finalCards: { ...room.currentCards },
    originalCards: { ...room.originalCards },
  };
  room.state = 'results';
  return room.results;
}

module.exports = {
  startOfficeGame,
  getOfficeNightActionData,
  processOfficeNightAction,
  computeOfficeResults,
  getSpammerNeighbors,
  getNeighborIds,
};

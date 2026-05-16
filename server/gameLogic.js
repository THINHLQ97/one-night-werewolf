const { ROLES, getNightOrder, isWolfRole } = require('./roles');

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

function isShielded(room, playerId) {
  return room.shieldedPlayer === playerId;
}

function startGame(room) {
  const { players, settings } = room;
  const roles = [...settings.selectedRoles];

  if (roles.length !== players.length + 3) {
    throw new Error(`Need exactly ${players.length + 3} roles for ${players.length} players`);
  }

  shuffle(roles);

  const cards = {};
  players.forEach((p, i) => { cards[p.id] = roles[i]; });
  cards['center0'] = roles[players.length];
  cards['center1'] = roles[players.length + 1];
  cards['center2'] = roles[players.length + 2];

  room.originalCards = { ...cards };
  room.currentCards = { ...cards };
  room.state = 'role_reveal';
  room.shieldedPlayer = null;
  room.bodyguardProtected = null;
  room.revealedToAll = {};
  room.piTransformed = {};
  room.nightPhase = {
    roleOrder: getNightOrder(settings.selectedRoles),
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

// ─── Night helpers ────────────────────────────────────────────────────────────

function getNightActionData(room, role) {
  const { players } = room;

  switch (role) {
    case 'werewolf': {
      const wolvesFilter = r => (r === 'werewolf' || r === 'alphawolf' || r === 'mysticwolf');
      const werewolves = players.filter(p => wolvesFilter(room.originalCards[p.id])).map(p => ({ id: p.id, name: p.name }));
      return { werewolves, isSolo: werewolves.length === 1 };
    }
    case 'alphawolf': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'mysticwolf': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'minion': {
      const werewolves = players.filter(p => isWolfRole(room.originalCards[p.id])).map(p => ({ id: p.id, name: p.name }));
      return { werewolves };
    }
    case 'mason': {
      const masons = players.filter(p => room.originalCards[p.id] === 'mason').map(p => ({ id: p.id, name: p.name }));
      return { masons };
    }
    case 'sentinel': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers };
    }
    case 'apprenticeseer':
      return {};
    case 'seer':
    case 'robber':
    case 'troublemaker': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'paranormalinvestigator': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer, step: 1 };
    }
    case 'witch':
      return { step: 1 };
    case 'villageidiot':
      return { shieldedPlayer: room.shieldedPlayer };
    case 'revealer': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'bodyguard': {
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
    case 'sentinel': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      room.shieldedPlayer = action.targetPlayer;
      return {};
    }

    case 'werewolf': {
      if (action.peekCenter !== undefined) {
        if (!VALID_CENTER_SLOTS.includes(action.peekCenter)) return {};
        return { peeked: { slot: action.peekCenter, role: currentCards[action.peekCenter] } };
      }
      return {};
    }

    case 'alphawolf': {
      if (!action.centerSlot || !action.targetPlayer) return {};
      if (!VALID_CENTER_SLOTS.includes(action.centerSlot)) return {};
      if (!isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true };
      const targetOldRole = currentCards[action.targetPlayer];
      currentCards[action.targetPlayer] = currentCards[action.centerSlot];
      currentCards[action.centerSlot] = targetOldRole;
      return {};
    }

    case 'mysticwolf': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true };
      return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
    }

    case 'minion':
    case 'mason':
      return {};

    case 'apprenticeseer': {
      if (!action.centerSlot || !VALID_CENTER_SLOTS.includes(action.centerSlot)) return {};
      return { seen: { type: 'center', slots: [{ slot: action.centerSlot, role: currentCards[action.centerSlot] }] } };
    }

    case 'seer': {
      if (action.targetPlayer) {
        if (!isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
        if (isShielded(room, action.targetPlayer)) return { blocked: true };
        return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
      }
      if (action.centerSlots && Array.isArray(action.centerSlots) && action.centerSlots.length === 2) {
        if (!action.centerSlots.every(s => VALID_CENTER_SLOTS.includes(s))) return {};
        return {
          seen: { type: 'center', slots: action.centerSlots.map(s => ({ slot: s, role: currentCards[s] })) },
        };
      }
      return {};
    }

    case 'paranormalinvestigator': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true, step: action.step || 1 };

      const seenRole = currentCards[action.targetPlayer];
      const isWolf = isWolfRole(seenRole);
      const isTanner = seenRole === 'tanner';
      const transformed = isWolf || isTanner;

      if (transformed) {
        room.piTransformed[playerId] = isWolf ? 'werewolf' : 'tanner';
      }

      const step = action.step || 1;
      const ms = room.nightPhase.multiStepState;
      if (!ms[playerId]) ms[playerId] = {};
      ms[playerId].piStep = step;
      ms[playerId].piDone = transformed || step >= 2;

      return {
        seen: { type: 'player', id: action.targetPlayer, role: seenRole },
        transformed,
        transformedTo: transformed ? (isWolf ? 'werewolf' : 'tanner') : null,
        step,
        canContinue: !transformed && step < 2,
      };
    }

    case 'witch': {
      const step = action.step || 1;
      const ms = room.nightPhase.multiStepState;
      if (!ms[playerId]) ms[playerId] = {};

      if (step === 1) {
        if (!action.centerSlot || !VALID_CENTER_SLOTS.includes(action.centerSlot)) return {};
        ms[playerId].witchSlot = action.centerSlot;
        ms[playerId].witchStep = 1;
        return {
          seen: { type: 'center', slot: action.centerSlot, role: currentCards[action.centerSlot] },
          step: 1,
          canSwap: true,
        };
      }
      if (step === 2) {
        const slot = ms[playerId]?.witchSlot;
        if (!slot) return {};
        ms[playerId].witchStep = 2;
        ms[playerId].witchDone = true;

        if (action.targetPlayer && action.targetPlayer !== 'skip') {
          if (!isValidPlayerId(room, action.targetPlayer)) return {};
          if (isShielded(room, action.targetPlayer)) return { blocked: true, step: 2 };
          const centerRole = currentCards[slot];
          const playerRole = currentCards[action.targetPlayer];
          currentCards[action.targetPlayer] = centerRole;
          currentCards[slot] = playerRole;
          return { swapped: true, step: 2 };
        }
        return { swapped: false, step: 2 };
      }
      return {};
    }

    case 'robber': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true };
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
      if (isShielded(room, action.target1) || isShielded(room, action.target2)) return { blocked: true };
      const r1 = currentCards[action.target1];
      const r2 = currentCards[action.target2];
      currentCards[action.target1] = r2;
      currentCards[action.target2] = r1;
      return {};
    }

    case 'villageidiot': {
      if (!action.direction || !['left', 'right'].includes(action.direction)) return {};
      const otherIds = room.players.filter(p => p.id !== playerId && !isShielded(room, p.id)).map(p => p.id);
      if (otherIds.length < 2) return {};
      const roles = otherIds.map(id => currentCards[id]);
      if (action.direction === 'left') {
        const first = roles.shift();
        roles.push(first);
      } else {
        const last = roles.pop();
        roles.unshift(last);
      }
      otherIds.forEach((id, i) => { currentCards[id] = roles[i]; });
      return { rotated: action.direction };
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

    case 'revealer': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true };
      const targetRole = currentCards[action.targetPlayer];
      const isHidden = isWolfRole(targetRole) || targetRole === 'tanner';
      if (!isHidden) {
        room.revealedToAll[action.targetPlayer] = targetRole;
      }
      return { revealed: !isHidden, targetPlayer: action.targetPlayer, role: isHidden ? null : targetRole };
    }

    case 'bodyguard': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      room.bodyguardProtected = action.targetPlayer;
      return {};
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

function applyBodyguard(room, eliminated) {
  if (!room.bodyguardProtected) return eliminated;
  return eliminated.filter(id => id !== room.bodyguardProtected);
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

  const werewolvesInGame = players.some(p => isWolfRole(currentCards[p.id]));
  const eliminatedWerewolf = eliminated.some(id => isWolfRole(currentCards[id]));
  const eliminatedTanner = eliminated.some(id => currentCards[id] === 'tanner');

  const winners = [];

  if (eliminatedTanner) {
    eliminated.forEach(id => {
      if (currentCards[id] === 'tanner') winners.push(id);
    });
    // PI who transformed to tanner also wins if the tanner wins
    Object.entries(room.piTransformed || {}).forEach(([pid, team]) => {
      if (team === 'tanner' && eliminatedTanner) winners.push(pid);
    });
  }

  function getEffectiveTeam(pid) {
    if (room.piTransformed?.[pid]) return room.piTransformed[pid];
    const role = currentCards[pid];
    if (isWolfRole(role) || role === 'minion') return 'werewolf';
    if (role === 'tanner') return 'tanner';
    return 'village';
  }

  if (werewolvesInGame) {
    if (eliminatedWerewolf) {
      players.forEach(p => {
        if (getEffectiveTeam(p.id) === 'village') winners.push(p.id);
      });
    } else {
      players.forEach(p => {
        if (getEffectiveTeam(p.id) === 'werewolf') winners.push(p.id);
      });
    }
  } else {
    if (eliminated.length === 0) {
      players.forEach(p => {
        if (getEffectiveTeam(p.id) !== 'tanner') winners.push(p.id);
      });
    }
  }

  return { winners: [...new Set(winners)] };
}

function computeResults(room) {
  const { tally, eliminated: initialEliminated } = tallyVotes(room);
  const afterBodyguard = applyBodyguard(room, initialEliminated);
  const eliminated = applyHunterEffect(room, afterBodyguard);
  const { winners } = determineWinners(room, eliminated);

  room.results = {
    tally,
    eliminated,
    initialEliminated,
    bodyguardSaved: room.bodyguardProtected && initialEliminated.includes(room.bodyguardProtected) ? room.bodyguardProtected : null,
    winners,
    finalCards: { ...room.currentCards },
    originalCards: { ...room.originalCards },
  };
  room.state = 'results';
  return room.results;
}

module.exports = { startGame, getNightActionData, processNightAction, computeResults };

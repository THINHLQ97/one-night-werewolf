const { ROLES, getNightOrder, isWolfRole } = require('./roles');

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const VALID_CENTER_SLOTS = ['center0', 'center1', 'center2'];
const ALL_CENTER_SLOTS = ['center0', 'center1', 'center2', 'centerWolf'];

function getValidCenterSlots(room) {
  return room.hasAlphaWolf ? ALL_CENTER_SLOTS : VALID_CENTER_SLOTS;
}

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

  // Simulation mode: host can pre-select their role from the pool
  if (room.isSimulation && room.preferredHostRole) {
    const preferred = room.preferredHostRole;
    const idx = roles.indexOf(preferred);
    if (idx !== -1) {
      // Find host's position in players
      const hostPos = players.findIndex(p => p.id === room.hostId);
      if (hostPos !== -1 && hostPos < players.length) {
        // Swap host's slot with preferred role's position
        [roles[hostPos], roles[idx]] = [roles[idx], roles[hostPos]];
      }
    }
  }

  const cards = {};
  players.forEach((p, i) => { cards[p.id] = roles[i]; });
  cards['center0'] = roles[players.length];
  cards['center1'] = roles[players.length + 1];
  cards['center2'] = roles[players.length + 2];

  if (settings.selectedRoles.includes('alphawolf')) {
    cards['centerWolf'] = 'werewolf';
  }

  room.originalCards = { ...cards };
  room.currentCards = { ...cards };
  room.state = 'role_reveal';
  room.shieldedPlayer = null;
  room.hasAlphaWolf = settings.selectedRoles.includes('alphawolf');
  room.revealedToAll = {};
  room.piTransformed = {};
  room.doppelgangerData = {}; // { playerId: { copiedRole, copiedFromId } }
  room.auraTouched = new Set(); // player IDs who viewed/moved a card (for Aura Seer)
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
    case 'doppelganger': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, step: 1 };
    }
    case 'werewolf': {
      const wolvesFilter = (p) => {
        const r = room.originalCards[p.id];
        if (r === 'werewolf' || r === 'alphawolf' || r === 'mysticwolf') return true;
        // Include doppelganger who copied a wolf variant
        if (r === 'doppelganger' && room.doppelgangerData?.[p.id]) {
          const cr = room.doppelgangerData[p.id].copiedRole;
          return cr === 'werewolf' || cr === 'alphawolf' || cr === 'mysticwolf';
        }
        return false;
      };
      const werewolves = players.filter(wolvesFilter).map(p => ({ id: p.id, name: p.name }));
      return { werewolves, isSolo: werewolves.length === 1, shieldedPlayer: room.shieldedPlayer };
    }
    case 'alphawolf': {
      const otherPlayers = players.filter(p => p.id !== undefined).map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'mysticwolf': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'minion': {
      const werewolves = players.filter(p => {
        if (isWolfRole(room.originalCards[p.id])) return true;
        if (room.originalCards[p.id] === 'doppelganger' && room.doppelgangerData?.[p.id]) {
          return isWolfRole(room.doppelgangerData[p.id].copiedRole);
        }
        return false;
      }).map(p => ({ id: p.id, name: p.name }));
      return { werewolves, shieldedPlayer: room.shieldedPlayer };
    }
    case 'mason': {
      const masons = players.filter(p => {
        if (room.originalCards[p.id] === 'mason') return true;
        if (room.originalCards[p.id] === 'doppelganger' && room.doppelgangerData?.[p.id]?.copiedRole === 'mason') return true;
        return false;
      }).map(p => ({ id: p.id, name: p.name }));
      return { masons, shieldedPlayer: room.shieldedPlayer };
    }
    case 'sentinel': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers };
    }
    case 'apprenticeseer':
      return { shieldedPlayer: room.shieldedPlayer };
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
      return { step: 1, shieldedPlayer: room.shieldedPlayer };
    case 'villageidiot':
      return { shieldedPlayer: room.shieldedPlayer };
    case 'revealer': {
      const otherPlayers = players.map(p => ({ id: p.id, name: p.name }));
      return { otherPlayers, shieldedPlayer: room.shieldedPlayer };
    }
    case 'drunk':
      return { shieldedPlayer: room.shieldedPlayer };
    case 'insomniac':
      return { shieldedPlayer: room.shieldedPlayer };
    case 'bodyguard':
      return { shieldedPlayer: room.shieldedPlayer };
    case 'auraseer': {
      // Build list of player IDs touched by this point in the night
      const players2 = room.players;
      const nameMap = {};
      players2.forEach(p => { nameMap[p.id] = p.name; });
      const touched = [...(room.auraTouched || [])].filter(id => id !== playerId).map(id => ({ id, name: nameMap[id] || '?' }));
      return { touched, shieldedPlayer: room.shieldedPlayer };
    }
    default:
      return {};
  }
}

function processNightAction(room, playerId, role, action) {
  const { currentCards } = room;

  switch (role) {
    case 'doppelganger': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      const copiedRole = currentCards[action.targetPlayer];
      if (!room.doppelgangerData) room.doppelgangerData = {};
      room.doppelgangerData[playerId] = { copiedRole, copiedFromId: action.targetPlayer };
      // Doppelganger's card becomes the copied role (affects swaps & end-game)
      currentCards[playerId] = copiedRole;
      if (room.auraTouched) room.auraTouched.add(playerId); // viewed a card
      return { copiedRole, copiedFromId: action.targetPlayer };
    }

    case 'sentinel': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      room.shieldedPlayer = action.targetPlayer;
      return {};
    }

    case 'werewolf': {
      if (action.peekCenter !== undefined) {
        if (!getValidCenterSlots(room).includes(action.peekCenter)) return {};
        if (room.auraTouched) room.auraTouched.add(playerId);
        return { peeked: { slot: action.peekCenter, role: currentCards[action.peekCenter] } };
      }
      return {};
    }

    case 'alphawolf': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true };
      const oldCard = currentCards[action.targetPlayer];
      currentCards[action.targetPlayer] = currentCards['centerWolf'];
      currentCards['centerWolf'] = oldCard;
      if (room.auraTouched) room.auraTouched.add(playerId);
      return {};
    }

    case 'mysticwolf': {
      if (!action.targetPlayer || !isValidPlayerId(room, action.targetPlayer)) return {};
      if (action.targetPlayer === playerId) return {};
      if (isShielded(room, action.targetPlayer)) return { blocked: true };
      if (room.auraTouched) room.auraTouched.add(playerId);
      return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
    }

    case 'minion':
    case 'mason':
      return {};

    case 'apprenticeseer': {
      if (!action.centerSlot || !getValidCenterSlots(room).includes(action.centerSlot)) return {};
      if (room.auraTouched) room.auraTouched.add(playerId);
      return { seen: { type: 'center', slots: [{ slot: action.centerSlot, role: currentCards[action.centerSlot] }] } };
    }

    case 'seer': {
      if (action.targetPlayer) {
        if (!isValidPlayerId(room, action.targetPlayer) || action.targetPlayer === playerId) return {};
        if (isShielded(room, action.targetPlayer)) return { blocked: true };
        if (room.auraTouched) room.auraTouched.add(playerId);
        return { seen: { type: 'player', id: action.targetPlayer, role: currentCards[action.targetPlayer] } };
      }
      if (action.centerSlots && Array.isArray(action.centerSlots) && action.centerSlots.length === 2) {
        if (!action.centerSlots.every(s => getValidCenterSlots(room).includes(s))) return {};
        if (room.auraTouched) room.auraTouched.add(playerId);
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
      if (room.auraTouched) room.auraTouched.add(playerId);

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
        if (!action.centerSlot || !getValidCenterSlots(room).includes(action.centerSlot)) return {};
        ms[playerId].witchSlot = action.centerSlot;
        ms[playerId].witchStep = 1;
        if (room.auraTouched) room.auraTouched.add(playerId);
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
      if (room.auraTouched) room.auraTouched.add(playerId);
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
      if (room.auraTouched) room.auraTouched.add(playerId);
      return {};
    }

    case 'auraseer': {
      const players2 = room.players;
      const nameMap = {};
      players2.forEach(p => { nameMap[p.id] = p.name; });
      const touched = [...(room.auraTouched || [])]
        .filter(id => id !== playerId)
        .map(id => ({ id, name: nameMap[id] || '?' }));
      return { touched };
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
      if (!action.centerSlot || !getValidCenterSlots(room).includes(action.centerSlot)) return {};
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

    default:
      return {};
  }
}

// ─── Vote & results ───────────────────────────────────────────────────────────

function tallyVotes(room) {
  const { players, dayPhase, currentCards } = room;
  const votes = dayPhase.votes;

  const tally = {};
  players.forEach(p => { tally[p.id] = 0; });
  Object.values(votes).forEach(targetId => {
    if (tally[targetId] !== undefined) tally[targetId]++;
  });

  // Prince immunity: skip Prince(s) from tally consideration
  const isPrince = (pid) => currentCards[pid] === 'prince';

  // Compute eliminated, but exclude Princes (they're immune even if max votes)
  const nonPrinceTally = {};
  players.forEach(p => {
    if (!isPrince(p.id)) nonPrinceTally[p.id] = tally[p.id];
  });
  const maxVotes = Math.max(0, ...Object.values(nonPrinceTally));
  const eliminated = maxVotes >= 2
    ? players.filter(p => !isPrince(p.id) && tally[p.id] === maxVotes).map(p => p.id)
    : [];

  // Track if any Prince was voted but spared (for UI / narration)
  const princesSpared = players.filter(p => isPrince(p.id) && tally[p.id] >= 2).map(p => p.id);

  return { tally, eliminated, princesSpared };
}

function applyBodyguard(room, eliminated) {
  const protectTarget = room.dayPhase?.bodyguardProtect?.targetId;
  if (!protectTarget) return eliminated;
  return eliminated.filter(id => id !== protectTarget);
}

function applyHunterEffect(room, eliminated) {
  const { currentCards, dayPhase } = room;
  const hunterKills = [];

  for (const id of eliminated) {
    if (currentCards[id] === 'hunter' && dayPhase.hunterTarget?.[id]) {
      const target = dayPhase.hunterTarget[id];
      if (!eliminated.includes(target) && !hunterKills.includes(target)) {
        hunterKills.push(target);
      }
    }
  }

  return [...eliminated, ...hunterKills];
}

function getEliminatedHunters(room) {
  const { tally, eliminated } = tallyVotes(room);
  const afterBodyguard = applyBodyguard(room, eliminated);
  const hunters = afterBodyguard.filter(id => room.currentCards[id] === 'hunter');
  return { tally, eliminated: afterBodyguard, hunters };
}

function determineWinners(room, eliminated) {
  const { players, currentCards } = room;

  // ── Cursed split logic (hybrid A+B) ──
  // For each Cursed player with ≥1 Wolf vote:
  //   • If they WERE eliminated → "Hero": counts as wolf killed (village wins),
  //     BUT Cursed stays Village team for own win condition → wins with village
  //   • If they were NOT eliminated → "Converted": becomes Wolf team for own win
  // If no Wolf voted them → stays village always
  const votes = room.dayPhase?.votes || {};
  const cursedTriggered = new Set(); // eliminated Cursed with wolf vote → village hero
  const cursedConverted = new Set(); // surviving Cursed with wolf vote → becomes wolf team
  players.forEach(p => {
    if (currentCards[p.id] !== 'cursed') return;
    const wolfVotedCursed = Object.entries(votes).some(([voterId, targetId]) => {
      if (targetId !== p.id) return false;
      const voterRole = currentCards[voterId];
      return isWolfRole(voterRole) || voterRole === 'minion';
    });
    if (!wolfVotedCursed) return;
    if (eliminated.includes(p.id)) {
      cursedTriggered.add(p.id); // hero
    } else {
      cursedConverted.add(p.id); // converted to wolf
    }
  });

  // For elimination tally: cursedTriggered counts as "wolf eliminated"
  const isEliminatedAsWolf = (pid) => isWolfRole(currentCards[pid]) || cursedTriggered.has(pid);
  // For "are wolves still alive?": cursedConverted (alive wolves) + actual wolves
  const isAliveAsWolf = (pid) => isWolfRole(currentCards[pid]) || cursedConverted.has(pid);

  const werewolvesInGame = players.some(p => isAliveAsWolf(p.id)) || cursedTriggered.size > 0;
  const eliminatedWerewolf = eliminated.some(id => isEliminatedAsWolf(id));
  const eliminatedTanner = eliminated.some(id => currentCards[id] === 'tanner');

  const winners = [];

  // Tanner wins independently — if Tanner is eliminated, ONLY Tanner wins (+ PI transformed to tanner)
  // Other teams do NOT win when Tanner is eliminated
  if (eliminatedTanner) {
    eliminated.forEach(id => {
      if (currentCards[id] === 'tanner') winners.push(id);
    });
    Object.entries(room.piTransformed || {}).forEach(([pid, team]) => {
      if (team === 'tanner') winners.push(pid);
    });
    return { winners: [...new Set(winners)] };
  }

  function getEffectiveTeam(pid) {
    if (room.piTransformed?.[pid]) return room.piTransformed[pid];
    // Cursed that survived wolf vote → becomes wolf team
    if (cursedConverted.has(pid)) return 'werewolf';
    // Cursed that died with wolf vote → stays village (hero)
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
    // No werewolves among players (all wolves in center)
    const minionInGame = players.some(p => getEffectiveTeam(p.id) === 'werewolf');
    const eliminatedMinion = eliminated.some(id => getEffectiveTeam(id) === 'werewolf');

    if (eliminated.length === 0) {
      if (minionInGame) {
        // Minion exists but wasn't found → werewolf team wins
        players.forEach(p => {
          if (getEffectiveTeam(p.id) === 'werewolf') winners.push(p.id);
        });
      } else {
        // No wolves, no minion, no one eliminated → everyone wins (except tanner)
        players.forEach(p => {
          if (getEffectiveTeam(p.id) !== 'tanner') winners.push(p.id);
        });
      }
    } else if (eliminatedMinion) {
      // Villagers found and eliminated the Minion → village wins
      players.forEach(p => {
        if (getEffectiveTeam(p.id) === 'village') winners.push(p.id);
      });
    }
    // else: no wolves, no minion eliminated, but someone died → no one wins
  }

  return { winners: [...new Set(winners)] };
}

function computeResults(room) {
  const { tally, eliminated: initialEliminated, princesSpared = [] } = tallyVotes(room);
  const afterBodyguard = applyBodyguard(room, initialEliminated);
  const eliminated = applyHunterEffect(room, afterBodyguard);
  const { winners } = determineWinners(room, eliminated);

  room.results = {
    tally,
    eliminated,
    initialEliminated,
    princesSpared,
    bodyguardSaved: room.dayPhase?.bodyguardProtect?.targetId && initialEliminated.includes(room.dayPhase.bodyguardProtect.targetId) ? room.dayPhase.bodyguardProtect.targetId : null,
    winners,
    finalCards: { ...room.currentCards },
    originalCards: { ...room.originalCards },
  };
  room.state = 'results';
  return room.results;
}

// ─── Deduction Board ─────────────────────────────────────────────────────────

function computeDeductionConflicts(tc) {
  const conflicts = [];
  const { pool, deductions } = tc;

  // Pool frequency: how many of each role exist
  const poolFreq = {};
  pool.forEach(r => { poolFreq[r] = (poolFreq[r] || 0) + 1; });

  // 1. Self-claim conflicts (red): multiple players claim same role for themselves
  const selfClaims = {};
  Object.entries(deductions).forEach(([pid, row]) => {
    const selfRole = row[pid]; // diagonal cell = self-claim
    if (selfRole) {
      if (!selfClaims[selfRole]) selfClaims[selfRole] = [];
      selfClaims[selfRole].push(pid);
    }
  });

  Object.entries(selfClaims).forEach(([roleId, claimers]) => {
    const available = poolFreq[roleId] || 0;
    if (claimers.length > available) {
      const roleName = ROLES[roleId]?.name || roleId;
      conflicts.push({
        type: 'selfClaimConflict',
        roleId,
        available,
        claimed: claimers.length,
        claimers,
        severity: 'error',
        reasoning: `${roleName}: ${claimers.length} players claimed it but only ${available} in pool.`,
      });
    }
  });

  // 2. Row logic conflicts (yellow): one player assigns same role more times than pool allows
  Object.entries(deductions).forEach(([pid, row]) => {
    const roleCounts = {};
    Object.values(row).forEach(roleId => {
      if (roleId) roleCounts[roleId] = (roleCounts[roleId] || 0) + 1;
    });

    Object.entries(roleCounts).forEach(([roleId, count]) => {
      const available = poolFreq[roleId] || 0;
      if (count > available) {
        const roleName = ROLES[roleId]?.name || roleId;
        conflicts.push({
          type: 'rowLogicConflict',
          playerId: pid,
          roleId,
          available,
          assigned: count,
          severity: 'warning',
          reasoning: `${roleName} assigned ${count}× but only ${available} in pool.`,
        });
      }
    });
  });

  return conflicts;
}

module.exports = { startGame, getNightActionData, processNightAction, computeResults, getEliminatedHunters, computeDeductionConflicts };

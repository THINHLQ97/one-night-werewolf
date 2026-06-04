// Rank tiers: 1 (Iron) through 8 (Challenger), progressive gaps, cap at 2000
const RANKS = [
  { tier: 1, name: 'Iron',       nameVi: 'Sắt',        minPoints: 0,    image: '1-iron.png',       frameScale: 1.5 },
  { tier: 2, name: 'Bronze',     nameVi: 'Đồng',       minPoints: 50,   image: '2-bronze.png',     frameScale: 1.55 },
  { tier: 3, name: 'Silver',     nameVi: 'Bạc',        minPoints: 100,  image: '3-silver.png',     frameScale: 1.65 },
  { tier: 4, name: 'Gold',       nameVi: 'Vàng',       minPoints: 200,  image: '4-gold.png',       frameScale: 1.75 },
  { tier: 5, name: 'WhiteGold',  nameVi: 'Bạch Kim',   minPoints: 400,  image: '5-whitegold.png',  frameScale: 1.9 },
  { tier: 6, name: 'Diamond',    nameVi: 'Kim Cương',   minPoints: 700,  image: '6-diamond.png',    frameScale: 2.15 },
  { tier: 7, name: 'Elite',      nameVi: 'Tinh Anh',   minPoints: 1000, image: '7-elite.png',      frameScale: 2.05 },
  { tier: 8, name: 'Challenger', nameVi: 'Thách Đấu',  minPoints: 1500, image: '8-challenger.png', frameScale: 2.3 },
];

const MAX_POINTS = 2000;
const LOSS_PER_PLAYER = 5;

// Calculate points for all players based on game outcome
// Each loser loses 5 pts. Total pool = losers × 5 × 2, split among winners.
function calculateGamePoints(players, winners, totalPlayerCount) {
  const loserCount = totalPlayerCount - winners.length;
  const totalPool = loserCount * LOSS_PER_PLAYER * 2;

  const results = {};
  players.forEach(p => {
    const won = winners.includes(p.id);
    if (won) {
      results[p.id] = Math.round(totalPool / winners.length);
    } else {
      results[p.id] = -LOSS_PER_PLAYER;
    }
  });
  return results;
}

// ─── Alien Mode Ranking ──────────────────────────────────────────────────────
// Same base pool as werewolf, plus a role-specific BONUS on top for harder wins.
// Loss penalty unchanged (-5).

const ALIEN_BONUS = {
  MYTHIC: 20,  // Synthetic killed (own win), Oracle survives Hunt Mode alone
  HARD:   10,  // Groob/Zerb rivalry win
  MEDIUM:  5,  // Mortician, Blob, Leader (under G+Z rivalry)
  SLIGHT:  3,  // Hunt Mode resolution — everyone else wins by killing Oracle
  NORMAL:  0,  // Standard team wins
};

function getAlienBonus(playerId, originalCards, finalCards, alienAppState, eliminated) {
  const orig = originalCards[playerId];
  const curr = finalCards[playerId];

  // 🥇 MYTHIC: Synthetic Alien killed and wins solo (everyone else lost)
  if (curr === 'syntheticalien' && eliminated.includes(playerId)) {
    return ALIEN_BONUS.MYTHIC;
  }

  // Hunt Mode logic
  if (alienAppState?.oracleHuntMode) {
    const isOracle = orig === 'oracle';
    const oracleDied = eliminated.some(id => originalCards[id] === 'oracle');

    // 🥇 MYTHIC: Oracle survives Hunt Mode alone
    if (isOracle && !eliminated.includes(playerId)) {
      return ALIEN_BONUS.MYTHIC;
    }
    // 🎯 SLIGHT: Everyone else wins by killing Oracle in Hunt Mode
    if (!isOracle && oracleDied) {
      return ALIEN_BONUS.SLIGHT;
    }
    return ALIEN_BONUS.NORMAL;
  }

  // Check Groob+Zerb rivalry
  const bothGroobZerb = Object.values(finalCards).includes('groob')
    && Object.values(finalCards).includes('zerb');

  // 🥈 HARD: Groob/Zerb wins rivalry
  if (bothGroobZerb && (curr === 'groob' || curr === 'zerb')) {
    return ALIEN_BONUS.HARD;
  }

  // 🥉 MEDIUM: Mortician, Blob, Leader (under G+Z rivalry)
  if (curr === 'mortician') return ALIEN_BONUS.MEDIUM;
  if (curr === 'blob') return ALIEN_BONUS.MEDIUM;
  if (curr === 'leader' && bothGroobZerb) return ALIEN_BONUS.MEDIUM;

  // 🎖️ NORMAL: standard team wins (Alien team, Village team, Oracle-as-Minion)
  return ALIEN_BONUS.NORMAL;
}

// Calculate alien-mode points: base pool + role bonus for winners
function calculateAlienGamePoints(players, winners, totalPlayerCount, gameContext) {
  const { originalCards = {}, finalCards = {}, alienAppState = {}, eliminated = [] } = gameContext || {};
  const loserCount = totalPlayerCount - winners.length;
  const totalPool = loserCount * LOSS_PER_PLAYER * 2;
  const baseShare = winners.length > 0 ? Math.round(totalPool / winners.length) : 0;

  const results = {};
  players.forEach(p => {
    if (!winners.includes(p.id)) {
      results[p.id] = -LOSS_PER_PLAYER;
      return;
    }
    const bonus = getAlienBonus(p.id, originalCards, finalCards, alienAppState, eliminated);
    results[p.id] = baseShare + bonus;
  });
  return results;
}

function getRank(points) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (points >= r.minPoints) rank = r;
    else break;
  }
  return rank;
}

function getNextRank(points) {
  const current = getRank(points);
  return RANKS.find(r => r.tier === current.tier + 1) || null;
}

function clampPoints(pts) {
  return Math.max(0, Math.min(MAX_POINTS, pts));
}

function checkRankUp(oldPoints, newPoints) {
  const oldRank = getRank(oldPoints);
  const newRank = getRank(newPoints);
  if (newRank.tier > oldRank.tier) {
    return { ranked: true, oldRank, newRank };
  }
  if (newRank.tier < oldRank.tier) {
    return { ranked: false, demoted: true, oldRank, newRank };
  }
  return { ranked: false };
}

module.exports = { RANKS, MAX_POINTS, LOSS_PER_PLAYER, ALIEN_BONUS, getRank, getNextRank, calculateGamePoints, calculateAlienGamePoints, clampPoints, checkRankUp };

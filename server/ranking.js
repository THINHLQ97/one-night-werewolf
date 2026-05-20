// Rank tiers: 1 (Iron) through 8 (Challenger), 500pt per tier, cap at 5000
const RANKS = [
  { tier: 1, name: 'Iron',       nameVi: 'Sắt',        minPoints: 0,    image: '1-iron.png' },
  { tier: 2, name: 'Bronze',     nameVi: 'Đồng',       minPoints: 500,  image: '2-bronze.png' },
  { tier: 3, name: 'Silver',     nameVi: 'Bạc',        minPoints: 1000, image: '3-silver.png' },
  { tier: 4, name: 'Gold',       nameVi: 'Vàng',       minPoints: 1500, image: '4-gold.png' },
  { tier: 5, name: 'WhiteGold',  nameVi: 'Bạch Kim',   minPoints: 2000, image: '5-whitegold.png' },
  { tier: 6, name: 'Diamond',    nameVi: 'Kim Cương',   minPoints: 2500, image: '6-diamond.png' },
  { tier: 7, name: 'Elite',      nameVi: 'Tinh Anh',   minPoints: 3500, image: '7-elite.png' },
  { tier: 8, name: 'Challenger', nameVi: 'Thách Đấu',  minPoints: 5000, image: '8-challenger.png' },
];

const MAX_POINTS = 5000;
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

module.exports = { RANKS, MAX_POINTS, LOSS_PER_PLAYER, getRank, getNextRank, calculateGamePoints, clampPoints, checkRankUp };

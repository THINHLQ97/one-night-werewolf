import { useState, useEffect } from 'react';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import RankBadge, { PointsBadge } from '../components/RankBadge';
import AlienTerminal from '../components/AlienTerminal';

const ROLE_NAMES = {
  doppelganger: 'Doppelgänger',
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer',
  robber: 'Robber', troublemaker: 'Troublemaker', drunk: 'Drunk',
  insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner',
  mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf',
  dreamwolf: 'Dream Wolf', apprenticeseer: 'Apprentice Seer',
  paranormalinvestigator: 'P.I.', witch: 'Witch', villageidiot: 'Village Idiot',
  revealer: 'Revealer', bodyguard: 'Bodyguard',
  prince: 'Prince', cursed: 'Cursed', auraseer: 'Aura Seer',
  // Alien
  alien: 'Alien', syntheticalien: 'Synthetic Alien',
  cow: 'Cow', groob: 'Groob', zerb: 'Zerb',
  oracle: 'Oracle', rascal: 'Rascal', exposer: 'Exposer',
  psychic: 'Psychic', mortician: 'Mortician', leader: 'Leader', blob: 'Blob',
  // Alien phase names (used in night log)
  aliens: 'Alien', groob_zerb: 'Groob & Zerb',
};

const TEAM_OF = {
  doppelganger: 'village',
  werewolf: 'werewolf', minion: 'werewolf', alphawolf: 'werewolf', mysticwolf: 'werewolf', dreamwolf: 'werewolf',
  seer: 'village', robber: 'village', troublemaker: 'village',
  drunk: 'village', insomniac: 'village', villager: 'village', hunter: 'village', mason: 'village',
  sentinel: 'village', apprenticeseer: 'village', paranormalinvestigator: 'village',
  witch: 'village', villageidiot: 'village', revealer: 'village', bodyguard: 'village',
  prince: 'village', cursed: 'village', auraseer: 'village',
  tanner: 'tanner',
  // Alien
  alien: 'alien', syntheticalien: 'synthetic',
  groob: 'alien', zerb: 'alien',
  cow: 'village', oracle: 'village', rascal: 'village', exposer: 'village',
  psychic: 'village', leader: 'village',
  mortician: 'mortician', blob: 'blob',
};

const RESULT_SIGNS = {
  village_win: '/images/result sign/villages-win.webp',
  village_lose: '/images/result sign/villages-lose.webp',
  werewolf_win: '/images/result sign/werewolves-win.webp',
  werewolf_lose: '/images/result sign/werewolves-lose.webp',
  tanner_win: '/images/result sign/tanner-win.webp',
  tanner_lose: '/images/result sign/tanner-lose.webp',
};

const isWolfRole = r => ['werewolf', 'alphawolf', 'mysticwolf', 'dreamwolf'].includes(r);

// Full-page background by winning team
const WIN_SCENES = {
  village: '/images/villages-win-scene.png',
  werewolf: '/images/werewolves-win-scene.png',
  tanner: '/images/tanner-win-scene.png',
};

// ─── Alien-specific assets ──────────────────────────────────────────────────

const ALIEN_RESULT_SIGNS = {
  alien_win: '/images/result sign-alien/alien-win.webp',
  alien_lose: '/images/result sign-alien/alien-lose.webp',
  villager_win: '/images/result sign-alien/villager-win.webp',
  villager_lose: '/images/result sign-alien/villager-lose.webp',
  synthetic_win: '/images/result sign-alien/synthetic-win.webp',
  synthetic_lose: '/images/result sign-alien/synthetic-lose.webp',
  blob_win: '/images/result sign-alien/blob-win.webp',
  blob_lose: '/images/result sign-alien/blob-lose.webp',
  mortician_win: '/images/result sign-alien/mortician-win.webp',
  mortician_lose: '/images/result sign-alien/mortician-lose.webp',
  groob_win: '/images/result sign-alien/groob-win.webp',
  groob_lose: '/images/result sign-alien/groob-lose.webp',
  zerb_win: '/images/result sign-alien/zerb-win.webp',
  zerb_lose: '/images/result sign-alien/zerb-lose.webp',
  oracle_win: '/images/result sign-alien/oracle-win.webp', // ONLY for Oracle Hunt mode
  oracle_lose: '/images/result sign-alien/oracle-lose.webp',
};

const ALIEN_WIN_SCENES = {
  alien: '/images/scene-alien/Alien-Alien-Win.png',
  villager: '/images/scene-alien/Alien-Villager-Win.png',
  synthetic: '/images/scene-alien/Alien-Synthetic-Win.png',
  blob_alien: '/images/scene-alien/Alien-Blob-Alien-Win.png',
  blob_villager: '/images/scene-alien/Alien-Blob-Villager-Win.png',
  // Oracle Hunt mode specials
  oracle_hunt_survives: '/images/scene-alien/Oracle-Special-Event-Win.png',  // Oracle survived the hunt
  oracle_hunt_dies: '/images/scene-alien/Oracle-Special-Event-Lose.png',     // Oracle got caught
};

const ALIEN_END_SCENE_IMAGES = {
  // Vote-by-role (single elimination)
  vote_alien: '/images/endscene-alien/vote-alien.webp',
  vote_synthetic_alien: '/images/endscene-alien/vote-synthetic-alien.webp',
  vote_cow: '/images/endscene-alien/vote-cow.webp',
  vote_groob: '/images/endscene-alien/vote-groob.webp',
  vote_zerb: '/images/endscene-alien/vote-zerb.webp',
  vote_leader: '/images/endscene-alien/vote-leader.webp',
  vote_mortician: '/images/endscene-alien/vote-mortician.webp',
  vote_oracle: '/images/endscene-alien/vote-oracle.webp',
  vote_psychic: '/images/endscene-alien/vote-psychic.webp',
  vote_rascal: '/images/endscene-alien/vote-rascal.webp',
  vote_exposer: '/images/endscene-alien/vote-exposer.webp',
  vote_blob: '/images/endscene-alien/vote-bloob.webp',
  // Multi-die
  multi_aliens_present: '/images/endscene-alien/more-than-2-die-but-there-aliens.webp',
  multi_no_aliens: '/images/endscene-alien/more-than-2-die-but-there-no-aliens.webp',
  // No one dies
  no_one_die_aliens: '/images/endscene-alien/no-one-die-but-there-aliens.webp',
  no_one_die_no_aliens: '/images/endscene-alien/no-one-die-but-there-no-aliens.webp',
  // Mortician specials (REVERSED per user)
  mortician_win_with_alien: '/images/endscene-alien/mortician-win-with-alien.webp',     // Mortician + Village win
  mortician_win_with_villager: '/images/endscene-alien/mortician-win-with-villager.webp', // Mortician + Alien win
  // Oracle Hunt mode specials
  oracle_hunt_survives: '/images/endscene-alien/oracle-win-special-event.webp',  // Oracle NOT voted → survives → wins alone
  oracle_hunt_dies: '/images/endscene-alien/vote-oracle-special-event.webp',     // Oracle voted out → others win
};

const ALIEN_END_SCENE_NARRATIONS = {
  vote_alien: 'Một sinh vật ngoài hành tinh đã bị lột mặt nạ. Dân làng thở phào — bóng tối từ vũ trụ đã bị đẩy lùi.',
  vote_synthetic_alien: 'Alien Nhân Tạo đã hoàn thành sứ mệnh kỳ lạ — bị tiêu diệt chính là chiến thắng của hắn.',
  vote_cow: 'Bò bị treo cổ trong nhầm lẫn. Tiếng rống bi ai vọng khắp ngôi làng nhỏ.',
  vote_groob: 'Groob ngã xuống. Trong vũ trụ rộng lớn, một kẻ thù cũ vừa ăn mừng chiến thắng.',
  vote_zerb: 'Zerb đã ra đi. Đối thủ truyền kiếp giờ đây mỉm cười dưới ánh trăng lạnh.',
  vote_leader: 'Thủ Lĩnh bị hạ — cây cột chống đỡ ngôi làng vừa đổ sụp. Bóng tối ngoài hành tinh giờ đây không gì cản nổi.',
  vote_mortician: 'Nhà Quàn bị treo cổ — kẻ độc cô đã nhập cuộc cuối cùng vào hàng ngũ những người chết.',
  vote_oracle: 'Nhà Tiên Tri đã không nhìn thấy chính cái chết của mình. Lời nguyền vũ trụ vẫn tiếp tục.',
  vote_psychic: 'Ngoại Cảm đã không đoán được số phận của chính mình. Tiếng vọng vũ trụ giờ đây không còn ai nghe được.',
  vote_rascal: 'Quỷ Nhỏ bị bắt — kẻ phá rối cuối cùng cũng phải trả giá cho những trò đùa của mình.',
  vote_exposer: 'Kẻ Phơi Bày bị tiêu diệt — ánh sáng sự thật đã tắt, bóng tối lại bao trùm.',
  vote_blob: 'Khối Blob nhầy nhụa bị tiêu diệt. Cả khối sống cùng tan biến trong giây phút.',
  multi_aliens_present: 'Cuộc thảm sát đêm nay không tha cho ai. Trong số những kẻ ngã xuống, có cả những sinh vật ngoài hành tinh.',
  multi_no_aliens: 'Nhiều người chết vô ích đêm nay — không có Alien nào bị tiêu diệt. Vũ trụ vẫn lạnh lùng quan sát.',
  no_one_die_aliens: 'Không ai ngã xuống — nhưng Alien vẫn ẩn nấp đâu đó giữa các bạn. Cuộc xâm lăng vẫn tiếp diễn.',
  no_one_die_no_aliens: 'Không có Alien, không có cái chết — một đêm yên bình hiếm hoi giữa vũ trụ hỗn loạn.',
  mortician_win_with_alien: 'Nhà Quàn mỉm cười khi hàng xóm Alien ngã xuống. Vũ trụ trả công cho kẻ chờ đợi cái chết.',
  mortician_win_with_villager: 'Nhà Quàn mỉm cười khi hàng xóm Dân ngã xuống. Một cái chết không trả thù được — nhưng Nhà Quàn đã thắng.',
  oracle_hunt_survives: 'Oracle sống sót qua cuộc săn đuổi điên cuồng — không ai vote cô. Một mình cô ta chiến thắng — bí mật của vũ trụ vẫn thuộc về cô.',
  oracle_hunt_dies: 'Cả làng đã hợp sức bỏ phiếu tiêu diệt Oracle — kẻ đoán sai số bí mật của vũ trụ. Tiếng vọng từ không gian cuối cùng cũng im lặng.',
};

const ALIEN_VOTE_KEYS = {
  alien: 'vote_alien',
  syntheticalien: 'vote_synthetic_alien',
  cow: 'vote_cow',
  groob: 'vote_groob',
  zerb: 'vote_zerb',
  leader: 'vote_leader',
  mortician: 'vote_mortician',
  oracle: 'vote_oracle',
  psychic: 'vote_psychic',
  rascal: 'vote_rascal',
  exposer: 'vote_exposer',
  blob: 'vote_blob',
};

// Determine the player's effective team in alien mode
function getAlienTeamOf(playerId, results) {
  const { finalCards = {}, originalCards = {}, alienAppState = {} } = results;
  const orig = originalCards[playerId];
  const curr = finalCards[playerId];

  // Hunt mode → Oracle (original) gets her own team
  if (alienAppState.oracleHuntMode && orig === 'oracle') return 'oracle';

  // Synthetic — independent
  if (curr === 'syntheticalien') return 'synthetic';
  // Blob — independent
  if (curr === 'blob') return 'blob';
  // Mortician — independent
  if (curr === 'mortician') return 'mortician';

  // Groob/Zerb rivalry (both in play → each on own team)
  const bothGZ = Object.values(finalCards).includes('groob') && Object.values(finalCards).includes('zerb');
  if (bothGZ) {
    if (curr === 'groob') return 'groob';
    if (curr === 'zerb') return 'zerb';
  }

  // Oracle who joined alien team via change_team (acts like Minion)
  if (alienAppState.oracleJoinedAlien && orig === 'oracle') return 'alien';

  // Real aliens
  if (curr === 'alien' || curr === 'groob' || curr === 'zerb') return 'alien';

  // Default: villager
  return 'villager';
}

function getAlienWinningTeam(results, players) {
  const { winners = [], eliminated = [], finalCards = {}, originalCards = {}, alienAppState = {} } = results;
  if (winners.length === 0) return null;

  // Hunt mode: use Oracle-Special-Event scenes based on Oracle's fate
  if (alienAppState.oracleHuntMode) {
    const oraclePlayer = players.find(p => originalCards[p.id] === 'oracle');
    if (oraclePlayer) {
      return eliminated.includes(oraclePlayer.id) ? 'oracle_hunt_dies' : 'oracle_hunt_survives';
    }
    // Oracle in center → fallback villager scene
    return 'villager';
  }

  // Determine team that won
  // Check if Blob is in winners
  const blobWinner = players.find(p => finalCards[p.id] === 'blob' && winners.includes(p.id));
  // Check if any alien (or oracle-joined-alien) is winner
  const alienWinner = winners.some(id => {
    const team = getAlienTeamOf(id, results);
    return team === 'alien';
  });
  const villagerWinner = winners.some(id => {
    const team = getAlienTeamOf(id, results);
    return team === 'villager';
  });
  const syntheticWinner = winners.some(id => getAlienTeamOf(id, results) === 'synthetic');

  // Blob + Alien
  if (blobWinner && alienWinner) return 'blob_alien';
  // Blob + Village
  if (blobWinner && villagerWinner) return 'blob_villager';
  // Synthetic
  if (syntheticWinner) return 'synthetic';
  // Alien
  if (alienWinner) return 'alien';
  // Village (also covers Mortician-only or Blob-only — fall back to villager)
  return 'villager';
}

function getAlienEndSceneKey(results, players) {
  const { eliminated = [], initialEliminated = [], finalCards = {}, originalCards = {}, alienAppState = {} } = results;

  const aliensInGame = players.some(p => {
    const r = finalCards[p.id];
    return r === 'alien' || r === 'groob' || r === 'zerb' || r === 'syntheticalien';
  });

  // ── Hunt Mode special ──
  if (alienAppState.oracleHuntMode) {
    const oraclePlayer = players.find(p => originalCards[p.id] === 'oracle');
    if (oraclePlayer) {
      return eliminated.includes(oraclePlayer.id) ? 'oracle_hunt_dies' : 'oracle_hunt_survives';
    }
  }

  // ── Mortician special — Mortician won + which team also won ──
  const morticianPlayer = players.find(p => finalCards[p.id] === 'mortician');
  if (morticianPlayer && results.winners?.includes(morticianPlayer.id)) {
    // Determine if Village or Alien also won alongside Mortician
    const alienAlsoWon = results.winners.some(id => getAlienTeamOf(id, results) === 'alien');
    const villageAlsoWon = results.winners.some(id => getAlienTeamOf(id, results) === 'villager');
    // Per user (reversed): with-alien = village won; with-villager = alien won
    if (villageAlsoWon) return 'mortician_win_with_alien';
    if (alienAlsoWon) return 'mortician_win_with_villager';
  }

  // ── No one dies ──
  if (eliminated.length === 0) {
    return aliensInGame ? 'no_one_die_aliens' : 'no_one_die_no_aliens';
  }

  // ── Multi (≥2 voted out) — alien mode has no Hunter cascade, so use `eliminated` directly ──
  if (eliminated.length >= 2) {
    const aliensEliminated = eliminated.some(id => {
      const r = finalCards[id];
      return r === 'alien' || r === 'groob' || r === 'zerb' || r === 'syntheticalien';
    });
    return aliensEliminated ? 'multi_aliens_present' : 'multi_no_aliens';
  }

  // ── Single vote — vote-{role} priority ──
  const primary = initialEliminated[0] ?? eliminated[0];
  const primaryRole = finalCards[primary];
  return ALIEN_VOTE_KEYS[primaryRole] || null;
}

// ─── End-scene banner images (2:1) ──────────────────────────────────────────
// Each key maps to a specific vote outcome. Logic: getEndSceneKey().
const END_SCENE_IMAGES = {
  // Peace — no one dies
  no_one_die: '/images/endscene/no-one-die.webp',
  no_one_die_wolves_survive: '/images/endscene/no-one-die-but-there-wolves.webp',

  // Single vote — wolves
  vote_werewolf: '/images/endscene/werewolf-vote.webp',
  vote_alpha_wolf: '/images/endscene/alpha-wolf-vote.webp',
  vote_mystic_wolf: '/images/endscene/mystic-wolf-vote.webp',
  vote_dream_wolf: '/images/endscene/dreamwolf-vote.webp',

  // Single vote — tanner
  vote_tanner: '/images/endscene/tanner-vote.webp',

  // Single vote — minion (split by wolves in game)
  vote_minion_have_wolves: '/images/endscene/minion-vote-have-wolves.webp',
  vote_minion_no_wolf: '/images/endscene/minion-vote-no-wolf.webp',

  // Single vote — villager team
  vote_villager: '/images/endscene/vote-villager.webp',
  vote_seer: '/images/endscene/vote-seer.webp',
  vote_robber: '/images/endscene/vote-robber.webp',
  vote_troublemaker: '/images/endscene/vote-troublemaker.webp',
  vote_drunk: '/images/endscene/vote-drunk.webp',
  vote_insomniac: '/images/endscene/vote-insomniac.webp',
  vote_mason: '/images/endscene/vote-mason.webp',
  // Daybreak roles
  vote_sentinel: '/images/endscene/vote-sentinel.webp',
  vote_villageidiot: '/images/endscene/vote-villager-idiot.webp',
  vote_witch: '/images/endscene/vote-witch.webp',
  vote_apprenticeseer: '/images/endscene/vote-app-seer.webp',
  vote_auraseer: '/images/endscene/vote-aura-seer.webp',
  vote_revealer: '/images/endscene/vote-revealer.webp',
  // Cursed: 2 variants based on conversion
  vote_cursed_wolf: '/images/endscene/vote-cursed-wolf.webp',          // wolf voted → converted/hero
  vote_cursed_villager: '/images/endscene/vote-cursed-villager.webp',  // no wolf vote → just villager
  // Fallback for P.I., bodyguard, prince (vote-immune so this image rarely needed)
  vote_unknown_villager: '/images/endscene/vote-an-unknown-villager.webp',

  // Hunter voted → cascade kill (image keyed by victim role)
  hunter_kill_werewolf: '/images/endscene/vote-hunter-kill-werewolf.webp',
  hunter_kill_alpha_wolf: '/images/endscene/vote-hunter-kill-alpha-wolf.webp',
  hunter_kill_mystic_wolf: '/images/endscene/vote-hunter-kill-mystic-wolf.webp',
  hunter_kill_dream_wolf: '/images/endscene/vote-hunter-kill-dream-wolf.webp',
  hunter_kill_tanner: '/images/endscene/vote-hunter-kill-tanner.webp',
  hunter_kill_minion_with_wolf: '/images/endscene/vote-hunter-kill-minion-with-wolf.webp',
  hunter_kill_minion_no_wolf: '/images/endscene/vote-hunter-kill-minion-no-wolf.webp',
  hunter_kill_villager: '/images/endscene/vote-hunter-kill-villager.webp',
  hunter_kill_seer: '/images/endscene/vote-hunter-kill-seer.webp',
  hunter_kill_robber: '/images/endscene/vote-hunter-kill-robber.webp',
  hunter_kill_troublemaker: '/images/endscene/vote-hunter-kill-troublemaker.webp',
  hunter_kill_drunk: '/images/endscene/vote-hunter-kill-drunk.webp',
  hunter_kill_insomniac: '/images/endscene/vote-hunter-kill-insomniac.webp',
  hunter_kill_mason: '/images/endscene/vote-hunter-kill-mason.webp',
  // Daybreak roles
  hunter_kill_sentinel: '/images/endscene/vote-hunter-kill-sentinel.webp',
  hunter_kill_villageidiot: '/images/endscene/vote-hunter-kill-villager-idiot.webp',
  hunter_kill_witch: '/images/endscene/vote-hunter-kill-witch.webp',
  hunter_kill_apprenticeseer: '/images/endscene/vote-hunter-kill-app-seer.webp',
  hunter_kill_auraseer: '/images/endscene/vote-hunter-kill-aura-seer.webp',
  hunter_kill_revealer: '/images/endscene/vote-hunter-kill-revealer.webp',
  hunter_kill_cursed: '/images/endscene/vote-hunter-kill-cursed.webp',
  hunter_kill_prince: '/images/endscene/vote-hunter-kill-prince.webp',
  // Doppelganger
  hunter_kill_doppelganger_villager: '/images/endscene/vote-hunter-kill-doppelganger-villager.webp',
  hunter_kill_doppelganger_wolf: '/images/endscene/vote-hunter-kill-doppelganger-wolf.webp',

  // Tie ≥ 2 voted out simultaneously
  multi_tanner: '/images/endscene/vote-more-than-2-there-is-a-tanner.webp',
  multi_wolf: '/images/endscene/vote-more-than-2-there-is-a-wolf.webp',
  multi_no_wolf: '/images/endscene/vote-more-than-2-no-wolf-die.webp',
};

const END_SCENE_NARRATIONS = {
  no_one_die: 'Không có sói, không có phản bội, cũng chẳng ai phải ngã xuống. Đêm dài khép lại bằng một cái thở phào hiếm hoi của cả làng.',
  no_one_die_wolves_survive: 'Dân làng đã tha cho nhau, nhưng bóng tối vẫn rình rập ngoài cổng. Bầy sói mỉm cười trong màn đêm — chúng sống sót mà không cần cắn ai.',

  vote_werewolf: 'Con sói bị lôi ra khỏi lớp ngụy trang sau cùng. Dân làng đã chọn đúng, và tiếng chuông bình minh vang lên trên mái ngói đỏ.',
  vote_alpha_wolf: 'Khi thủ lĩnh bầy sói gục xuống, tiếng tru trong đêm cũng hóa thành im lặng. Dân làng sống sót qua cơn ác mộng cuối cùng.',
  vote_mystic_wolf: 'Ma thuật xanh lịm tắt dần trong gió lạnh. Con sói thần bí đã bị vạch mặt, và lời nguyền trên ngôi làng bắt đầu rạn vỡ.',
  vote_dream_wolf: 'Con sói ngủ mơ đã bị kéo ra khỏi màn đêm. Những giấc mộng của nó tan biến trước ánh bình minh đang trở lại.',

  vote_tanner: 'Cả làng tưởng mình vừa thi hành công lý, nhưng kẻ bị kết án lại mỉm cười. Chán Đời đã nhận đúng cái kết mà hắn mong chờ.',

  vote_minion_have_wolves: 'Kẻ phản bội đã ngã xuống, nhưng trong bóng tối, bầy sói vẫn còn thở. Dân làng đã xử sai quân cờ, và đêm chưa hề kết thúc.',
  vote_minion_no_wolf: 'Không có sói nào ẩn náu trong làng, chỉ còn kẻ giữ lời nguyền thay chúng. Khi hắn bị phơi bày, bình yên cuối cùng cũng có lối trở về.',

  vote_villager: 'Một dân làng bình thường bị biến thành vật tế cho nỗi sợ. Và khi đám đông còn đang hô vang, bầy sói đã đứng ngoài cổng.',
  vote_seer: 'Nhà Tiên Tri bị kết án trước khi lời cảnh báo kịp trọn vẹn. Ánh sáng trong tay bà tắt đi, còn bóng tối thì bước tới.',
  vote_robber: 'Kẻ Trộm bị chỉ mặt giữa quảng trường, nhưng tội lỗi của hắn không phải nanh vuốt. Trong lúc dân làng mải phán xét, sói vẫn còn ngoài kia.',
  vote_troublemaker: 'Kẻ Gây Rối bị cuốn vào chính cơn hỗn loạn mình từng khuấy động. Nhưng lần này, cái sai của dân làng đã mở đường cho sói.',
  vote_drunk: 'Gã say rượu ngã xuống trong men hoảng loạn của dân làng. Đáng tiếc, sự thật không nằm dưới đáy cốc của ông ta.',
  vote_insomniac: 'Cô gái mất ngủ đã bị kết án giữa những ánh mắt run rẩy. Nhưng người thức suốt đêm không phải lúc nào cũng là kẻ có tội.',
  vote_mason: 'Mason đứng giữa lời buộc tội mà không thể chứng minh lòng trung thành. Những viên đá ông từng đặt nay lạnh hơn bao giờ hết.',
  vote_unknown_villager: 'Một người vô tội bị trùm mặt giữa vòng phán xét. Và khi dân làng nhận ra sai lầm, bầy sói đã tiến vào từ bóng tối.',

  hunter_kill_werewolf: 'Thợ Săn gục xuống nhưng không đi một mình. Tiếng súng cuối cùng kéo theo con sói trở về với bóng tối.',
  hunter_kill_alpha_wolf: 'Trước khi ngã xuống, Thợ Săn bóp cò lần cuối. Viên đạn ấy xé tan bóng đêm và kéo theo cả thủ lĩnh bầy sói.',
  hunter_kill_mystic_wolf: 'Phát súng cuối cùng xuyên qua làn phép xanh. Sói Huyền Bí rơi khỏi vòng ma thuật, để lại những đốm sáng tắt dần trong đêm.',
  hunter_kill_dream_wolf: 'Tiếng súng đánh thức giấc mơ cuối cùng của Sói Mộng. Nó choàng tỉnh chỉ để thấy mình đã rơi khỏi màn đêm.',
  hunter_kill_tanner: 'Thợ Săn bóp cò, và Chán Đời đón nhận nó như một món quà. Có những kẻ chỉ thật sự thắng khi không còn phải đứng dậy.',
  hunter_kill_minion_with_wolf: 'Kẻ phản bội ngã xuống dưới nòng súng, nhưng ánh mắt sói vẫn sáng ngoài mái nhà. Máu hắn không đủ để cứu dân làng.',
  hunter_kill_minion_no_wolf: 'Thợ Săn đã bắn trúng kẻ phản bội — kẻ mang lời nguyền của sói, diệt đi mầm mống tai họa.',
  hunter_kill_villager: 'Một dân làng vô tội ngã xuống sau phát súng trả thù. Đêm ấy, nỗi sợ đã giết nhiều hơn cả nanh vuốt.',
  hunter_kill_seer: 'Nhà Tiên Tri đã thấy quá nhiều bí mật, nhưng không thấy phát súng dành cho mình. Quả cầu xanh tắt lịm trong tay bà.',
  hunter_kill_robber: 'Kẻ Trộm từng quen lẩn giữa bóng tối, nhưng không trốn khỏi viên đạn cuối cùng. Lần này, hắn không còn thứ gì để đánh cắp.',
  hunter_kill_troublemaker: 'Kẻ Gây Rối luôn thích đảo lộn số phận người khác. Nhưng phát súng cuối cùng đã khiến chính cô trở thành trò đùa của định mệnh.',
  hunter_kill_drunk: 'Gã say rượu vừa kịp mở mắt trước ánh chớp của nòng súng. Cái kết đến nhanh hơn cả men còn đọng trên môi.',
  hunter_kill_insomniac: 'Người không ngủ đã sống sót qua cả đêm, nhưng không thoát khỏi phát súng cuối cùng. Con gấu nhỏ rơi xuống cùng sự im lặng.',
  hunter_kill_mason: 'Mason đã gục xuống trước phát súng oan nghiệt. Những bí mật của hội kín theo ông chìm vào nền đá lạnh.',
  hunter_kill_doppelganger_villager: 'Phát súng cuối cùng của Thợ Săn tìm đến kẻ mang gương mặt dân làng. Một bản sao ngã xuống, để lại câu hỏi chẳng ai kịp trả lời.',
  hunter_kill_doppelganger_wolf: 'Thợ Săn không nhìn nhầm con mồi cuối cùng. Dưới lớp biến hình của Doppelganger, bản năng sói đã bị viên đạn gọi tên.',

  // Daybreak — vote
  vote_sentinel: 'Lính Canh đã chìa khiên ra bảo vệ kẻ khác, nhưng không có ai chìa khiên cho ông. Tấm khiên đồng lăn trên đá lạnh, chủ nhân của nó cũng thế.',
  vote_villageidiot: 'Gã Ngốc Làng cười khúc khích cho đến phút cuối, không hiểu vì sao mình bị treo. Có lẽ với hắn, đó cũng là một trò đùa nữa.',
  vote_witch: 'Phù Thủy đã đổi bài bằng phép thuật, nhưng không thể đổi số phận của chính mình. Lọ thuốc rơi xuống, vỡ thành ngàn mảnh.',
  vote_apprenticeseer: 'Tiên Tri Học Việc chưa kịp trở thành Tiên Tri thực thụ. Phép thuật non yếu của cô không cứu được mình khỏi bản án oan nghiệt.',
  vote_auraseer: 'Tiên Tri Hào Quang đã thấy hào quang của mọi người, nhưng không kịp nhìn thấy bản án dành cho mình. Ánh sáng cuối cùng tắt trong mắt cô.',
  vote_revealer: 'Người Tiết Lộ đã lật bài quá nhiều người, có lẽ đã để lộ chính mình. Ngọn đèn dầu của ông tắt giữa quảng trường lạnh giá.',
  vote_cursed_wolf: 'Lời nguyền sống dậy đúng vào khoảnh khắc cuối. Sói đã chỉ vào Người Bị Nguyền, và khi máu chảy, máu đó là máu Sói. Dân làng đã thắng nhờ trap hoàn hảo.',
  vote_cursed_villager: 'Người Bị Nguyền chết oan như một Dân Làng bình thường. Lời nguyền không kịp trỗi dậy — Sói khôn ngoan đã tránh vote, và bóng tối vẫn còn ngoài kia.',

  // Daybreak — hunter kill
  hunter_kill_sentinel: 'Lính Canh ngã xuống trước phát súng oan nghiệt. Tấm khiên ông từng cầm để bảo vệ người khác giờ không cứu được chính mình.',
  hunter_kill_villageidiot: 'Gã Ngốc Làng vẫn cười khi viên đạn đến. Phát súng cuối cùng có lẽ là điều hợp lý nhất với hắn trong cả đêm điên rồ này.',
  hunter_kill_witch: 'Phù Thủy đưa tay lên, định niệm chú phòng thủ — nhưng viên đạn đã nhanh hơn phép thuật. Phép màu cuối cùng của bà là chết oanh liệt.',
  hunter_kill_apprenticeseer: 'Tiên Tri Học Việc chưa kịp trưởng thành. Đôi mắt non nớt khép lại dưới ánh chớp của nòng súng cuối cùng.',
  hunter_kill_auraseer: 'Tiên Tri Hào Quang thấy hào quang của Thợ Săn rực sáng — nhưng đó là hào quang của cái chết. Ánh sáng tắt nhanh hơn lời cảnh báo.',
  hunter_kill_revealer: 'Người Tiết Lộ tay vẫn nắm chiếc đèn dầu. Phát súng cuối khiến ngọn lửa rơi xuống, thiêu rụi mọi bí mật chưa kịp lật.',
  hunter_kill_cursed: 'Người Bị Nguyền chết dưới nòng súng của Thợ Săn. Không có Sói nào vote, lời nguyền câm lặng — máu họ chỉ là máu của một dân làng oan.',
  hunter_kill_prince: 'Hoàng Tử cười khinh bỉ trước lời buộc tội của dân làng — họ không thể chạm vào ngài. Nhưng mũi tên của Thợ Săn không tuân theo luật vương triều, và máu xanh chảy như máu thường.',

  multi_tanner: 'Giữa những kẻ bị kết án, có một người chờ cái chết như chờ vương miện. Chán Đời đã ẩn trong đám đông để thắng bằng chính bản án ấy.',
  multi_wolf: 'Trong nhóm người bị dẫn ra phán xét, một con sói thật đã lộ móng vuốt. Dân làng đã chọn đúng, và bình minh có quyền trở lại.',
  multi_no_wolf: 'Nhiều người bị trùm mặt trước đám đông, nhưng không có con sói nào trong số họ. Khi bản án rơi xuống, bầy sói ngoài cổng bắt đầu mỉm cười.',
};

// Mapping helpers for getEndSceneKey()
const VILLAGE_ROLE_KEYS = {
  doppelganger: 'vote_unknown_villager',
  villager: 'vote_villager',
  seer: 'vote_seer',
  robber: 'vote_robber',
  troublemaker: 'vote_troublemaker',
  drunk: 'vote_drunk',
  insomniac: 'vote_insomniac',
  mason: 'vote_mason',
  // Daybreak roles
  sentinel: 'vote_sentinel',
  villageidiot: 'vote_villageidiot',
  witch: 'vote_witch',
  apprenticeseer: 'vote_apprenticeseer',
  auraseer: 'vote_auraseer',
  revealer: 'vote_revealer',
  prince: 'vote_unknown_villager', // Prince is vote-immune, this is fallback only
  // Note: 'cursed' handled separately in getEndSceneKey for wolf/villager variants
  // P.I., bodyguard → unknown villager fallback
};

const HUNTER_VICTIM_KEYS = {
  doppelganger: 'hunter_kill_doppelganger_villager',
  werewolf: 'hunter_kill_werewolf',
  alphawolf: 'hunter_kill_alpha_wolf',
  mysticwolf: 'hunter_kill_mystic_wolf',
  dreamwolf: 'hunter_kill_dream_wolf',
  tanner: 'hunter_kill_tanner',
  villager: 'hunter_kill_villager',
  seer: 'hunter_kill_seer',
  robber: 'hunter_kill_robber',
  troublemaker: 'hunter_kill_troublemaker',
  drunk: 'hunter_kill_drunk',
  insomniac: 'hunter_kill_insomniac',
  mason: 'hunter_kill_mason',
  // Daybreak roles
  sentinel: 'hunter_kill_sentinel',
  villageidiot: 'hunter_kill_villageidiot',
  witch: 'hunter_kill_witch',
  apprenticeseer: 'hunter_kill_apprenticeseer',
  auraseer: 'hunter_kill_auraseer',
  revealer: 'hunter_kill_revealer',
  cursed: 'hunter_kill_cursed',
  prince: 'hunter_kill_prince',
  // P.I., bodyguard → unknown villager fallback
};

function getWinningTeam(results, players) {
  const { winners, finalCards } = results;
  if (!winners || winners.length === 0) return null;
  const role = finalCards[winners[0]];
  if (isWolfRole(role) || role === 'minion') return 'werewolf';
  if (role === 'tanner') return 'tanner';
  return 'village';
}

function getEndSceneKey(results, players) {
  const { eliminated = [], initialEliminated = [], finalCards = {}, originalCards = {} } = results;

  // No one dies (no majority, or bodyguard saved the only target)
  if (eliminated.length === 0) {
    const wolvesOrMinion = players.some(p => isWolfRole(finalCards[p.id]) || finalCards[p.id] === 'minion');
    return wolvesOrMinion ? 'no_one_die_wolves_survive' : 'no_one_die';
  }

  const wolvesInGame = players.some(p => isWolfRole(finalCards[p.id]));

  // Tie: ≥2 players voted out simultaneously
  if (initialEliminated.length >= 2) {
    const hasTanner = eliminated.some(id => finalCards[id] === 'tanner');
    if (hasTanner) return 'multi_tanner';
    const hasWolf = eliminated.some(id => isWolfRole(finalCards[id]));
    if (hasWolf) return 'multi_wolf';
    return 'multi_no_wolf';
  }

  const primary = initialEliminated[0] ?? eliminated[0];
  const primaryRole = finalCards[primary];

  // Hunter voted → cascade kill: image keyed by who Hunter dragged down
  if (primaryRole === 'hunter') {
    const hunterKills = eliminated.filter(id => !initialEliminated.includes(id));
    const victimRole = hunterKills[0] ? finalCards[hunterKills[0]] : null;

    if (!victimRole) return 'vote_unknown_villager'; // Hunter died without shooting
    if (victimRole === 'minion') {
      return wolvesInGame ? 'hunter_kill_minion_with_wolf' : 'hunter_kill_minion_no_wolf';
    }
    if (victimRole === 'doppelganger') return 'hunter_kill_doppelganger_villager';
    // Victim whose originalCard was doppelganger but finalCard is a wolf role
    if (originalCards) {
      const victimId = hunterKills[0];
      if (originalCards[victimId] === 'doppelganger' && isWolfRole(victimRole)) {
        return 'hunter_kill_doppelganger_wolf';
      }
    }
    return HUNTER_VICTIM_KEYS[victimRole] || 'vote_unknown_villager';
  }

  // Single non-hunter vote
  if (primaryRole === 'werewolf') return 'vote_werewolf';
  if (primaryRole === 'alphawolf') return 'vote_alpha_wolf';
  if (primaryRole === 'mysticwolf') return 'vote_mystic_wolf';
  if (primaryRole === 'dreamwolf') return 'vote_dream_wolf';
  if (primaryRole === 'tanner') return 'vote_tanner';
  if (primaryRole === 'minion') {
    return wolvesInGame ? 'vote_minion_have_wolves' : 'vote_minion_no_wolf';
  }
  // Cursed: pick wolf or villager variant based on whether any wolf voted them
  if (primaryRole === 'cursed') {
    const votes = results.tally || {};
    const allVotes = results.votes || {};
    // Check if any wolf voted for the cursed (would have converted them)
    const wolfVoted = Object.entries(allVotes).some(([voterId, targetId]) => {
      if (targetId !== primary) return false;
      const voterRole = finalCards[voterId];
      return ['werewolf','alphawolf','mysticwolf','dreamwolf','minion'].includes(voterRole);
    });
    return wolfVoted ? 'vote_cursed_wolf' : 'vote_cursed_villager';
  }
  return VILLAGE_ROLE_KEYS[primaryRole] || 'vote_unknown_villager';
}

export default function ResultsScreen({ results, myId, isHost, onNewGame }) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Staggered entrance: overlay first, then content
  useEffect(() => {
    const t = setTimeout(() => setShowContent(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (!results) return null;

  const { eliminated, initialEliminated, winners, players, finalCards, originalCards, tally, nightLog = [], rankUpdates = {} } = results;
  const hunterKills = initialEliminated ? eliminated.filter(id => !initialEliminated.includes(id)) : [];

  const isWinner = winners.includes(myId);
  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p.name; });

  // Detect alien mode via results.alienAppState
  const isAlienMode = !!results.alienAppState;

  let sceneKey, sceneSrc, narration, sceneBg, signSrc;

  if (isAlienMode) {
    sceneKey = getAlienEndSceneKey(results, players);
    sceneSrc = sceneKey ? ALIEN_END_SCENE_IMAGES[sceneKey] : null;
    narration = ALIEN_END_SCENE_NARRATIONS[sceneKey] || null;
    const winningTeam = getAlienWinningTeam(results, players);
    sceneBg = winningTeam ? ALIEN_WIN_SCENES[winningTeam] : null;

    // Determine result sign based on the player's effective alien team
    const myTeam = getAlienTeamOf(myId, results);
    const suffix = (winners.length > 0 && isWinner) ? 'win' : 'lose';
    signSrc = ALIEN_RESULT_SIGNS[`${myTeam}_${suffix}`] || ALIEN_RESULT_SIGNS[`villager_${suffix}`];
  } else {
    sceneKey = getEndSceneKey(results, players);
    sceneSrc = sceneKey ? END_SCENE_IMAGES[sceneKey] : null;
    narration = END_SCENE_NARRATIONS[sceneKey] || null;
    const winningTeam = getWinningTeam(results, players);
    sceneBg = winningTeam ? WIN_SCENES[winningTeam] : null;

    const myTeam = TEAM_OF[finalCards[myId]] || 'village';
    if (winners.length === 0) {
      signSrc = myTeam === 'werewolf' ? RESULT_SIGNS.werewolf_lose
              : myTeam === 'tanner' ? RESULT_SIGNS.tanner_lose
              : RESULT_SIGNS.village_lose;
    } else if (isWinner) {
      signSrc = myTeam === 'werewolf' ? RESULT_SIGNS.werewolf_win
              : myTeam === 'tanner' ? RESULT_SIGNS.tanner_win
              : RESULT_SIGNS.village_win;
    } else {
      signSrc = myTeam === 'werewolf' ? RESULT_SIGNS.werewolf_lose
              : myTeam === 'tanner' ? RESULT_SIGNS.tanner_lose
              : RESULT_SIGNS.village_lose;
    }
  }

  return (
    <>
      {/* Win scene background (per winning team) */}
      {sceneBg && <ResultSceneBackground src={sceneBg} />}

      {/* Win confetti / Lose vignette overlay */}
      {isWinner ? <ConfettiOverlay /> : <LoseVignette />}

      <div className={`min-h-screen min-h-[100dvh] px-3 py-4 sm:p-4 max-w-lg mx-auto relative z-10 transition-opacity duration-700 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
        {/* Result sign — larger, no extra text */}
        <div className="text-center pt-2 sm:pt-4 pb-3 sm:pb-4 relative">
          <RoleLibraryButton onClick={() => setLibraryOpen(true)} className="absolute top-2 right-0" />

          {signSrc ? (
            <img
              src={signSrc}
              alt={isWinner ? 'Victory' : 'Defeat'}
              className="mx-auto w-full max-w-[420px] drop-shadow-2xl animate-signBounce"
              draggable={false}
            />
          ) : (
            <div className="py-6">
              <p className="text-2xl font-bold text-white/60">Không ai thắng</p>
            </div>
          )}

          {/* End-scene banner (2:1) */}
          {sceneSrc && (
            <div
              className="mx-auto mt-4 w-full max-w-md rounded-xl overflow-hidden animate-narratFadeIn"
              style={{
                border: '1px solid rgba(196,168,107,0.25)',
                boxShadow: '0 6px 32px rgba(0,0,0,0.6)',
              }}
            >
              <img
                src={sceneSrc}
                alt=""
                className="block w-full aspect-[2/1] object-cover"
                draggable={false}
              />
            </div>
          )}

          {/* Win/Lose narration */}
          {narration && (
            <div className="mt-4 mx-auto max-w-sm rounded-xl overflow-hidden backdrop-blur-xl animate-narratFadeIn"
              style={{
                background: 'rgba(10, 10, 25, 0.75)',
                border: '1px solid rgba(196,168,107,0.2)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div className="px-5 py-3.5">
                <p className="text-moon-300 text-sm italic leading-relaxed">
                  "{narration}"
                </p>
              </div>
            </div>
          )}

          {rankUpdates[myId] && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm"
              style={{
                background: 'rgba(0,0,0,0.45)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <RankBadge rank={rankUpdates[myId].rank} size={24} />
              <PointsBadge points={rankUpdates[myId].newPoints} delta={rankUpdates[myId].pointsDelta} />
            </div>
          )}
        </div>

        {/* Eliminated */}
        <div className="card mb-4">
          <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
            <Icon name="swords" size={16} /> Bị loại
          </h3>
          {eliminated.length === 0 ? (
            <p className="text-white/40 text-sm">Không ai bị loại</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {eliminated.map(id => (
                <span key={id} className={`px-3 py-1.5 border rounded-xl text-sm flex items-center gap-1.5 ${
                  hunterKills.includes(id)
                    ? 'bg-yellow-500/20 border-yellow-500/40'
                    : 'bg-wolf-500/20 border-wolf-500/40'
                }`}>
                  {hunterKills.includes(id)
                    ? <Icon name="crosshair" size={14} />
                    : <Icon name="skull" size={14} />
                  }
                  {playerMap[id]} ({ROLE_NAMES[finalCards[id]]})
                  {hunterKills.includes(id) && <span className="text-white/40 ml-1">(bị Thợ Săn kéo theo)</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* All cards revealed — circular icons */}
        <div className="card mb-4">
          <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
            <Icon name="cards" size={16} /> Bài của mọi người
          </h3>
          <div className="space-y-2">
            {players.map(p => {
              const orig = originalCards[p.id];
              const final = finalCards[p.id];
              const changed = orig !== final;
              const isWin = winners.includes(p.id);
              const wasDoppel = orig === 'doppelganger' && final !== 'doppelganger';

              return (
                <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${isWin ? 'bg-village-500/10' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-2">
                    {isWin && <Icon name="trophy" size={16} className="text-yellow-400" />}
                    <span className="font-medium text-sm">{p.name}</span>
                    {eliminated.includes(p.id) && <Icon name="skull" size={14} className="text-wolf-400" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm">
                      <span className="text-moon-300 font-semibold">{ROLE_NAMES[final]}</span>
                      {changed && (
                        <div className="text-white/30 text-xs">Ban đầu: {ROLE_NAMES[orig]}</div>
                      )}
                      {wasDoppel && !changed && (
                        <div className="text-purple-400/60 text-xs">Ban đầu: Doppelgänger</div>
                      )}
                    </div>
                    <RoleIcon roleId={final} size={34} circular isDoppel={wasDoppel} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center cards */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs mb-2">Bài ở giữa:</p>
            <div className="flex gap-2 flex-wrap">
              {['center0', 'center1', 'center2'].map((slot, i) => {
                const slotWasDoppel = originalCards[slot] === 'doppelganger' && finalCards[slot] !== 'doppelganger';
                return (
                  <span key={slot} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/50 flex items-center gap-1.5">
                    <RoleIcon roleId={finalCards[slot]} size={18} circular isDoppel={slotWasDoppel} />
                    Giữa {i + 1}: {ROLE_NAMES[finalCards[slot]]}
                    {slotWasDoppel && <span className="text-purple-400/70 text-[10px]">(ban đầu Dop)</span>}
                  </span>
                );
              })}
              {finalCards['centerWolf'] && (() => {
                const wolfWasDoppel = originalCards['centerWolf'] === 'doppelganger' && finalCards['centerWolf'] !== 'doppelganger';
                return (
                  <span className="text-xs px-2 py-1 bg-wolf-500/20 rounded-lg text-wolf-300 border border-wolf-500/30 flex items-center gap-1.5">
                    <RoleIcon roleId={finalCards['centerWolf']} size={18} circular isDoppel={wolfWasDoppel} />
                    Alpha: {ROLE_NAMES[finalCards['centerWolf']]}
                    {wolfWasDoppel && <span className="text-purple-400/70 text-[10px]">(ban đầu Dop)</span>}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Blob members */}
        {results.alienAppState?.blobInstruction?.memberNames?.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-lime-400 font-semibold mb-2 flex items-center gap-1.5">
              🟢 Thành viên Blob
            </h3>
            <p className="text-white/50 text-xs mb-2">{results.alienAppState.blobInstruction.publicAnnounce?.replace('🤖 → Blob: ', '')}</p>
            <div className="flex gap-2 flex-wrap">
              {results.alienAppState.blobInstruction.members.map((id, i) => {
                const name = results.alienAppState.blobInstruction.memberNames[i];
                const isBlobSelf = finalCards[id] === 'blob';
                const survived = !eliminated.includes(id);
                return (
                  <span key={id} className={`text-xs px-2.5 py-1.5 rounded-lg border ${survived ? 'bg-lime-500/15 border-lime-500/30 text-lime-300' : 'bg-wolf-500/15 border-wolf-500/30 text-wolf-300 line-through'}`}>
                    {isBlobSelf ? '👑 ' : ''}{name} {survived ? '✓' : '✗'}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Night History */}
        {nightLog.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
              <Icon name="moon" size={16} /> Diễn biến trong đêm
            </h3>
            <div className="space-y-1.5">
              {nightLog.map((entry, i) => (
                <NightLogEntry key={i} entry={entry} playerMap={playerMap} results={results} />
              ))}
            </div>
          </div>
        )}

        {/* Alien Terminal recap */}
        {results.alienAppState && (
          <AlienTerminal
            messages={[
              results.alienAppState.oracleQuestion && { text: `Oracle: "${results.alienAppState.oracleQuestion.question}"`, time: 0 },
              results.alienAppState.alienInstruction && { text: results.alienAppState.alienInstruction.publicAnnounce, time: 1 },
              results.alienAppState.rascalInstruction && { text: results.alienAppState.rascalInstruction.publicAnnounce, time: 2 },
              results.alienAppState.exposerInstruction && { text: results.alienAppState.exposerInstruction.publicAnnounce, time: 3 },
              ...(Object.values(results.alienAppState.psychicInstructions || {}).map((inst, i) => ({ text: inst.publicAnnounce, time: 4 + i }))),
              results.alienAppState.morticianInstruction && { text: results.alienAppState.morticianInstruction.publicAnnounce, time: 6 },
              results.alienAppState.blobInstruction && { text: results.alienAppState.blobInstruction.publicAnnounce, time: 7 },
            ].filter(Boolean)}
            maxLines={10}
            collapsed={true}
          />
        )}

        {/* Vote tally */}
        <div className="card mb-6">
          <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
            <Icon name="vote" size={16} /> Kết quả vote
          </h3>
          <div className="space-y-2">
            {players
              .sort((a, b) => (tally[b.id] || 0) - (tally[a.id] || 0))
              .map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-sm text-white/70 w-24 truncate">{p.name}</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-wolf-400 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((tally[p.id] || 0) / players.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-wolf-400 w-6 text-right">{tally[p.id] || 0}</span>
                </div>
              ))}
          </div>
        </div>

        {isHost ? (
          <button className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2" onClick={onNewGame}>
            <Icon name="refresh" size={22} /> Chơi lại
          </button>
        ) : (
          <p className="text-center text-white/40 text-sm py-4">Chờ host bắt đầu game mới...</p>
        )}

        <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} gameMode={results?.alienAppState ? 'alien' : null} />
      </div>
    </>
  );
}

/* ─── Confetti overlay for winners ─────────────────────────────────────────── */

function ConfettiOverlay() {
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2.5 + Math.random() * 2,
    color: ['#f1c40f', '#e74c3c', '#27ae60', '#3498db', '#9b59b6', '#e67e22', '#1abc9c'][i % 7],
    size: 6 + Math.random() * 6,
    drift: -30 + Math.random() * 60,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-confettiFall"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            borderRadius: '2px',
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Lose vignette overlay ────────────────────────────────────────────────── */

function LoseVignette() {
  return (
    <div className="fixed inset-0 pointer-events-none z-20 animate-loseFlash"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(139,0,0,0.25) 100%)',
      }}
    />
  );
}

/* ─── Result scene background ─────────────────────────────────────────────── */

function ResultSceneBackground({ src }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setLoaded(true);
  }, [src]);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: loaded ? `url(${src})` : 'none',
          opacity: loaded ? 1 : 0,
        }}
      />
    </div>
  );
}

/* ─── Night log entry ──────────────────────────────────────────────────────── */

const CENTER_LABEL = { center0: 'Giữa 1', center1: 'Giữa 2', center2: 'Giữa 3', centerWolf: 'Alpha' };

function describeCopiedAction(copiedRole, action, result, playerMap, targetName, target1Name, target2Name) {
  switch (copiedRole) {
    case 'seer':
      if (result.seen?.type === 'player') return `xem bài ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
      if (result.seen?.type === 'center') {
        const slots = result.seen.slots || [];
        return `xem giữa: ${slots.map(s => `${CENTER_LABEL[s.slot] || s.slot} = ${ROLE_NAMES[s.role] || '?'}`).join(', ')}`;
      }
      return 'quan sát';
    case 'apprenticeseer':
      if (result.seen?.slots) return `xem giữa: ${result.seen.slots.map(s => `${CENTER_LABEL[s.slot] || s.slot} = ${ROLE_NAMES[s.role] || '?'}`).join(', ')}`;
      return 'xem bài ở giữa';
    case 'robber': {
      const name = targetName || playerMap[action.targetPlayer] || '?';
      return action.targetPlayer ? `cướp bài ${name}${result.newRole ? ` → thành ${ROLE_NAMES[result.newRole] || '?'}` : ''}` : 'không hành động';
    }
    case 'troublemaker': {
      const n1 = target1Name || playerMap[action.target1] || '?';
      const n2 = target2Name || playerMap[action.target2] || '?';
      return (action.target1 && action.target2) ? `hoán đổi ${n1} ↔ ${n2}` : 'không hành động';
    }
    case 'drunk':
      return action.centerSlot ? `đổi bài với ${CENTER_LABEL[action.centerSlot] || action.centerSlot}` : 'không hành động';
    case 'sentinel':
      return action.targetPlayer ? `đặt khiên cho ${targetName || playerMap[action.targetPlayer] || '?'}` : 'không hành động';
    case 'alphawolf': {
      const name = targetName || playerMap[action.targetPlayer] || '?';
      return action.targetPlayer ? (result.blocked ? `biến ${name} thành Sói (bị chặn)` : `biến ${name} thành Sói`) : 'không hành động';
    }
    case 'mysticwolf':
      return result.seen ? `xem bài ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}` : 'quan sát';
    case 'paranormalinvestigator':
      return result.seen ? `điều tra ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}` : 'điều tra';
    case 'witch':
      if (result.step === 2 || result.swapped != null) {
        if (result.swapped && action.targetPlayer && action.targetPlayer !== 'skip') return `đổi bài giữa cho ${targetName || playerMap[action.targetPlayer] || '?'}`;
        return 'không đổi bài';
      }
      if (result.seen) return `xem ${CENTER_LABEL[result.seen.slot || action.centerSlot] || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
      return 'xem bài ở giữa';
    case 'revealer':
      if (result.revealed && result.targetPlayer) return `lật bài ${targetName || playerMap[result.targetPlayer] || '?'} → ${ROLE_NAMES[result.role] || '?'}`;
      if (result.blocked) return `cố lật bài (bị khiên Lính Canh chặn)`;
      if (result.targetPlayer && result.revealed === false) return `lật bài ${targetName || playerMap[result.targetPlayer] || '?'} (Sói/Tanner — không công khai)`;
      return 'không hành động';
    case 'villageidiot':
      return result.rotated ? `xoay bài sang ${result.rotated === 'left' ? 'trái' : 'phải'}` : 'xoay bài';
    case 'insomniac':
      return result.currentRole ? `kiểm tra bài → ${ROLE_NAMES[result.currentRole] || '?'}` : 'kiểm tra bài';
    case 'werewolf':
      if (result.peeked) return `xem ${CENTER_LABEL[result.peeked.slot] || '?'} → ${ROLE_NAMES[result.peeked.role] || '?'}`;
      return 'nhìn đồng bọn Sói';
    case 'minion': return 'nhìn thấy các Sói';
    case 'mason': return 'nhìn Sinh Đôi';
    default: return null;
  }
}

// Map alien phase names to display roleId for icons
const PHASE_TO_ICON = {
  aliens: 'alien', groob_zerb: 'groob', oracle: 'oracle', leader: 'leader',
  cow: 'cow', rascal: 'rascal', exposer: 'exposer', psychic: 'psychic',
  mortician: 'mortician', blob: 'blob',
};

function NightLogEntry({ entry, playerMap, results }) {
  const { role, playerName, action, result, targetName, target1Name, target2Name, autoExecuted } = entry;
  const iconRoleId = PHASE_TO_ICON[role] || role;
  const autoBadge = autoExecuted ? (
    <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 font-semibold whitespace-nowrap">
      AFK • tự động
    </span>
  ) : null;

  // ── Doppelganger: merge step 1 (copy) + step 2 (action) into one readable entry ──
  if (role === 'doppelganger') {
    const copiedRole = result.copiedRole;

    // Step 1: copied a role — identified by copiedFromId in result (set only in step 1)
    const isStep1 = result.copiedFromId || (action.step === 1);
    if (copiedRole && isStep1) {
      const copiedName = ROLE_NAMES[copiedRole] || copiedRole;
      const fromName = targetName || playerMap[action.targetPlayer] || playerMap[result.copiedFromId] || '?';
      return (
        <div className={`flex items-start gap-2 px-2 py-1.5 rounded-lg border ${autoExecuted ? 'bg-yellow-500/[0.06] border-yellow-500/20' : 'bg-purple-500/[0.06] border-purple-500/10'}`}>
          <RoleIcon roleId="doppelganger" size={22} circular className="flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-white/70 text-xs font-medium">{playerName}</span>
            <span className="text-purple-400/60 text-xs"> (Doppelgänger)</span>
            {autoBadge}
            <p className="text-purple-300/70 text-[11px] leading-tight">🎭 hóa thân thành <strong className="text-purple-300">{copiedName}</strong> (copy {fromName})</p>
          </div>
        </div>
      );
    }

    // Step 2+: performing the copied role's action
    if (copiedRole) {
      const copiedName = ROLE_NAMES[copiedRole] || copiedRole;
      const desc = describeCopiedAction(copiedRole, action, result, playerMap, targetName, target1Name, target2Name);
      if (desc) {
        return (
          <div className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${autoExecuted ? 'bg-yellow-500/[0.05] border border-yellow-500/15' : 'bg-purple-500/[0.04]'}`}>
            <RoleIcon roleId={copiedRole} size={22} circular isDoppel className="flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-white/70 text-xs font-medium">{playerName}</span>
              <span className="text-purple-400/50 text-xs"> (🎭→{copiedName})</span>
              {autoBadge}
              <p className="text-white/50 text-[11px] leading-tight">{desc}</p>
            </div>
          </div>
        );
      }
    }

    // Fallback
    return (
      <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
        <RoleIcon roleId="doppelganger" size={22} circular className="flex-shrink-0 mt-0.5" />
        <div className="min-w-0">
          <span className="text-white/70 text-xs font-medium">{playerName}</span>
          <span className="text-white/30 text-xs"> (Doppelgänger)</span>
          <p className="text-white/50 text-[11px] leading-tight">thức dậy</p>
        </div>
      </div>
    );
  }

  // ── Regular roles ──
  const roleName = ROLE_NAMES[role] || role;

  function describeAction() {
    switch (role) {
      case 'werewolf':
        if (result.peeked) return `xem ${CENTER_LABEL[result.peeked.slot] || result.peeked.slot} → ${ROLE_NAMES[result.peeked.role] || '?'}`;
        if (result.werewolves) return 'nhìn thấy đồng bọn Sói';
        return 'thức dậy';
      case 'minion': return 'nhìn thấy các Sói';
      case 'mason': return 'nhìn thấy Sinh Đôi';
      case 'seer':
        if (result.seen?.type === 'player') return `xem bài ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
        if (result.seen?.type === 'center') {
          const slots = result.seen.slots || [];
          return `xem giữa: ${slots.map(s => `${CENTER_LABEL[s.slot] || s.slot} = ${ROLE_NAMES[s.role] || '?'}`).join(', ')}`;
        }
        return 'quan sát';
      case 'apprenticeseer':
        if (result.seen?.slots) return `xem giữa: ${result.seen.slots.map(s => `${CENTER_LABEL[s.slot] || s.slot} = ${ROLE_NAMES[s.role] || '?'}`).join(', ')}`;
        return 'xem bài ở giữa';
      case 'robber': {
        const name = targetName || playerMap[action.targetPlayer] || '?';
        return action.targetPlayer ? `cướp bài ${name}${result.newRole ? ` → thành ${ROLE_NAMES[result.newRole] || '?'}` : ''}` : 'không hành động';
      }
      case 'troublemaker': {
        const n1 = target1Name || playerMap[action.target1] || '?';
        const n2 = target2Name || playerMap[action.target2] || '?';
        return (action.target1 && action.target2) ? `hoán đổi ${n1} ↔ ${n2}` : 'không hành động';
      }
      case 'drunk':
        return action.centerSlot ? `đổi bài với ${CENTER_LABEL[action.centerSlot] || action.centerSlot}` : 'không hành động';
      case 'insomniac':
        return result.currentRole ? `thức dậy, bài hiện tại: ${ROLE_NAMES[result.currentRole] || '?'}` : 'kiểm tra bài';
      case 'sentinel':
        return action.targetPlayer ? `đặt khiên cho ${targetName || playerMap[action.targetPlayer] || '?'}` : 'không hành động';
      case 'alphawolf': {
        const name = targetName || playerMap[action.targetPlayer] || '?';
        return action.targetPlayer ? (result.blocked ? `cố biến ${name} thành Sói (bị chặn)` : `biến ${name} thành Sói`) : 'không hành động';
      }
      case 'mysticwolf':
        return result.seen ? `xem bài ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}` : 'quan sát';
      case 'paranormalinvestigator':
        return result.seen ? `điều tra ${playerMap[result.seen.id] || targetName || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}` : 'điều tra';
      case 'witch':
        if (result.step === 2 || result.swapped != null) {
          if (result.swapped && action.targetPlayer && action.targetPlayer !== 'skip') return `đổi bài giữa cho ${targetName || playerMap[action.targetPlayer] || '?'}`;
          return 'không đổi bài';
        }
        if (result.seen) return `xem ${CENTER_LABEL[result.seen.slot || action.centerSlot] || '?'} → ${ROLE_NAMES[result.seen.role] || '?'}`;
        return 'xem bài ở giữa';
      case 'revealer':
        if (result.revealed && result.targetPlayer) return `lật bài ${targetName || playerMap[result.targetPlayer] || '?'} → ${ROLE_NAMES[result.role] || '?'}`;
        if (result.blocked) return `cố lật bài ${targetName || '?'} (bị khiên Lính Canh chặn)`;
        if (result.targetPlayer && result.revealed === false) return `lật bài ${targetName || playerMap[result.targetPlayer] || '?'} (Sói/Tanner — không công khai)`;
        return 'không hành động';
      case 'villageidiot':
        return result.rotated ? `xoay bài sang ${result.rotated === 'left' ? 'trái' : 'phải'}` : 'xoay bài';
      case 'bodyguard': return 'thức dậy';
      case 'dreamwolf': return 'ngủ say';
      case 'auraseer':
        if (result.touched?.length > 0) return `thấy hào quang của: ${result.touched.map(t => t.name).join(', ')}`;
        return 'không thấy hào quang nào';
      case 'prince': return 'thức dậy (miễn vote)';
      case 'cursed': return 'thức dậy';
      // ── Alien phases ──
      case 'oracle':
        if (result.seen) return `xem ${result.seen.length || 1} bài giữa`;
        if (result.swapped) return 'đổi bài với bài giữa';
        if (result.correct === false) return `trả lời SAI — mục tiêu đổi!`;
        if (result.correct === true) return `trả lời ĐÚNG`;
        if (result.answer) return `trả lời: "${result.answer}"`;
        return 'trả lời câu hỏi App';
      case 'aliens':
        if (result.seen) return `xem bài → ${ROLE_NAMES[result.seen.role] || '?'}`;
        if (result.swapped) return 'hoán đổi bài với Alien khác';
        return 'nhìn thấy đồng bọn Alien';
      case 'groob_zerb': return 'nhìn thấy Groob & Zerb';
      case 'leader': return 'thấy vị trí Alien (giơ ngón cái)';
      case 'cow':
        if (result.wasTapped) return 'bị tap — có Alien ngồi cạnh!';
        return 'không bị tap';
      case 'rascal':
        if (result.skipped) return 'bỏ qua hành động';
        if (result.action === 'robber') {
          const tname = targetName || playerMap[action.targetPlayer] || '?';
          return `cướp bài ${tname}${result.newRole ? ` → thành ${ROLE_NAMES[result.newRole] || '?'}` : ''}`;
        }
        if (result.action === 'troublemaker') {
          const n1 = target1Name || playerMap[action.target1] || '?';
          const n2 = target2Name || playerMap[action.target2] || '?';
          return `hoán đổi bài ${n1} ↔ ${n2}`;
        }
        if (result.action === 'drunk') {
          const slot = action.centerSlot;
          const label = slot === 'center0' ? 'Giữa 1' : slot === 'center1' ? 'Giữa 2' : slot === 'center2' ? 'Giữa 3' : 'bài giữa';
          return `đổi bài của mình với ${label}`;
        }
        if (result.action === 'village_idiot') return `xoay bài tất cả sang ${action.direction === 'left' ? 'TRÁI' : 'PHẢI'}`;
        return 'không hành động';
      case 'exposer':
        if (result.skipped) return 'bỏ qua';
        if (result.exposed?.length > 0) return `lật ${result.exposed.length} bài giữa`;
        return 'lật bài giữa';
      case 'psychic':
        if (result.seen) return `xem bài → ${ROLE_NAMES[result.seen.role] || '?'}`;
        return 'xem bài theo chỉ thị App';
      case 'mortician':
        if (result.seen) return `xem bài hàng xóm → ${ROLE_NAMES[result.seen.role] || '?'}`;
        return 'quan sát hàng xóm';
      case 'blob': {
        const blobInst = results?.alienAppState?.blobInstruction;
        if (blobInst?.memberNames?.length > 0) {
          return `nhiễm Blob: ${blobInst.memberNames.join(', ')}`;
        }
        return 'xem thành viên Blob';
      }
      default: return 'thức dậy';
    }
  }

  return (
    <div className={`flex items-start gap-2 px-2 py-1.5 rounded-lg ${autoExecuted ? 'bg-yellow-500/[0.06] border border-yellow-500/20' : 'bg-white/[0.03]'}`}>
      <RoleIcon roleId={iconRoleId} size={22} circular className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-white/70 text-xs font-medium">{playerName}</span>
        <span className="text-white/30 text-xs"> ({roleName})</span>
        {autoBadge}
        <p className="text-white/50 text-[11px] leading-tight">{describeAction()}</p>
      </div>
    </div>
  );
}

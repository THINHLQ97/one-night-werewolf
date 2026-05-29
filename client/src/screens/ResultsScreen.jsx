import { useState, useEffect } from 'react';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import RankBadge, { PointsBadge } from '../components/RankBadge';

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
};

const TEAM_OF = {
  doppelganger: 'village', // If card swapped back to doppelganger, it's village
  werewolf: 'werewolf', minion: 'werewolf', alphawolf: 'werewolf', mysticwolf: 'werewolf', dreamwolf: 'werewolf',
  seer: 'village', robber: 'village', troublemaker: 'village',
  drunk: 'village', insomniac: 'village', villager: 'village', hunter: 'village', mason: 'village',
  sentinel: 'village', apprenticeseer: 'village', paranormalinvestigator: 'village',
  witch: 'village', villageidiot: 'village', revealer: 'village', bodyguard: 'village',
  tanner: 'tanner',
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

// ─── End-scene banner images (2:1) ──────────────────────────────────────────
// Each key maps to a specific vote outcome. Logic: getEndSceneKey().
const END_SCENE_IMAGES = {
  // Peace — no one dies (no majority, or bodyguard saved everyone)
  no_one_die: '/images/endscene/no-one-die.webp',

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
  // Fallback for sentinel, apprentice seer, P.I., witch, village idiot, revealer, bodyguard
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
  // Doppelganger — image reserved for future, not yet wired into game logic
  hunter_kill_doppelganger_villager: '/images/endscene/vote-hunter-kill-doppelganger-villager.webp',
  hunter_kill_doppelganger_wolf: '/images/endscene/vote-hunter-kill-doppelganger-wolf.webp',

  // Tie ≥ 2 voted out simultaneously
  multi_tanner: '/images/endscene/vote-more-than-2-there-is-a-tanner.webp',
  multi_wolf: '/images/endscene/vote-more-than-2-there-is-a-wolf.webp',
  multi_no_wolf: '/images/endscene/vote-more-than-2-no-wolf-die.webp',
};

const END_SCENE_NARRATIONS = {
  no_one_die: 'Không có sói, không có phản bội, cũng chẳng ai phải ngã xuống. Đêm dài khép lại bằng một cái thở phào hiếm hoi của cả làng.',

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
  if (eliminated.length === 0) return 'no_one_die';

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
  const hunterKills = eliminated.filter(id => !initialEliminated?.includes(id));

  const isWinner = winners.includes(myId);
  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p.name; });

  const sceneKey = getEndSceneKey(results, players);
  const sceneSrc = sceneKey ? END_SCENE_IMAGES[sceneKey] : null;
  const narration = END_SCENE_NARRATIONS[sceneKey] || null;
  const winningTeam = getWinningTeam(results, players);
  const sceneBg = winningTeam ? WIN_SCENES[winningTeam] : null;

  // Determine result sign based on the player's OWN team
  const myTeam = TEAM_OF[finalCards[myId]] || 'village';

  let signSrc;
  if (winners.length === 0) {
    // No one wins
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
                    </div>
                    <RoleIcon roleId={final} size={34} circular />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center cards */}
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/40 text-xs mb-2">Bài ở giữa:</p>
            <div className="flex gap-2 flex-wrap">
              {['center0', 'center1', 'center2'].map((slot, i) => (
                <span key={slot} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/50 flex items-center gap-1.5">
                  <RoleIcon roleId={finalCards[slot]} size={18} circular />
                  Giữa {i + 1}: {ROLE_NAMES[finalCards[slot]]}
                </span>
              ))}
              {finalCards['centerWolf'] && (
                <span className="text-xs px-2 py-1 bg-wolf-500/20 rounded-lg text-wolf-300 border border-wolf-500/30 flex items-center gap-1.5">
                  <RoleIcon roleId={finalCards['centerWolf']} size={18} circular />
                  Alpha: {ROLE_NAMES[finalCards['centerWolf']]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Night History */}
        {nightLog.length > 0 && (
          <div className="card mb-4">
            <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
              <Icon name="moon" size={16} /> Diễn biến trong đêm
            </h3>
            <div className="space-y-1.5">
              {nightLog.map((entry, i) => (
                <NightLogEntry key={i} entry={entry} playerMap={playerMap} />
              ))}
            </div>
          </div>
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

        <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
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

function NightLogEntry({ entry, playerMap }) {
  const { role, playerName, action, result, targetName, target1Name, target2Name } = entry;
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
        if (result.seen && action.swap && action.targetPlayer) return `xem ${CENTER_LABEL[action.centerSlot] || '?'} = ${ROLE_NAMES[result.seen.role] || '?'}, đổi cho ${targetName || playerMap[action.targetPlayer] || '?'}`;
        if (result.seen) return `xem ${CENTER_LABEL[action.centerSlot] || '?'} → ${ROLE_NAMES[result.seen.role] || '?'} (không đổi)`;
        return 'xem bài ở giữa';
      case 'revealer':
        if (result.revealed && result.targetPlayer) return `lật bài ${targetName || playerMap[result.targetPlayer] || '?'} → ${ROLE_NAMES[result.role] || '?'}`;
        if (result.blocked) return `cố lật bài ${targetName || '?'} (Sói/Tanner — ẩn)`;
        return 'không hành động';
      case 'villageidiot': return 'xoay tất cả bài sang trái';
      case 'bodyguard': return 'thức dậy';
      case 'dreamwolf': return 'ngủ say';
      default: return 'thức dậy';
    }
  }

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 rounded-lg bg-white/[0.03]">
      <RoleIcon roleId={role} size={22} circular className="flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-white/70 text-xs font-medium">{playerName}</span>
        <span className="text-white/30 text-xs"> ({roleName})</span>
        <p className="text-white/50 text-[11px] leading-tight">{describeAction()}</p>
      </div>
    </div>
  );
}

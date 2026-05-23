import { useState, useEffect } from 'react';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import RankBadge, { PointsBadge } from '../components/RankBadge';

const ROLE_NAMES = {
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

const WIN_SCENES = {
  village: '/images/villages-win-scene.png',
  werewolf: '/images/werewolves-win-scene.png',
  tanner: '/images/tanner-win-scene.png',
};

const isWolfRole = r => ['werewolf', 'alphawolf', 'mysticwolf', 'dreamwolf'].includes(r);

const WIN_NARRATIONS = {
  no_wolves_village_killed: 'Đêm ấy, chẳng có con sói nào ẩn trong làng. Chỉ có nỗi sợ âm thầm lớn lên, cho đến khi dân làng tự nhuộm đỏ tay mình.',
  no_wolves_tanner_killed: 'Không có Ma sói nào ẩn trong đêm ấy. Chỉ có một kẻ đã chán ghét sự sống đến tận cùng, và dân làng vô tình trao cho hắn chiến thắng mà hắn mong chờ nhất.',
  no_wolves_minion_survived: 'Không có Ma sói trong bóng tối, nhưng kẻ phản bội vẫn còn đó. Hắn mỉm cười giữa đám đông, khi cả làng chẳng hay mình vừa để tội ác sống sót.',
  no_wolves_minion_killed: 'Dù Ma sói không xuất hiện, bóng phản bội vẫn len lỏi giữa dân làng. Nhưng lần này, ánh mắt nghi ngờ đã chỉ đúng kẻ cần bị phán xét.',
  wolves_wolf_killed: 'Khi bình minh rạch ngang màn đêm, con sói cuối cùng đã gục xuống. Ngôi làng sống sót, run rẩy nhưng vẫn còn nguyên tiếng chuông ngày mới.',
  wolves_human_killed: 'Dân làng đã treo án cho nhầm người. Và trong khoảnh khắc họ nhận ra sự thật, tiếng tru của Ma sói đã vang lên từ phía sau lưng.',
  wolves_tanner_killed: 'Giữa cơn săn đuổi của người và sói, hắn chỉ chờ một bản án dành cho mình. Và khi dân làng ra tay, kẻ Chán đời đã thắng bằng cái chết hắn hằng mong.',
};

function getWinScenario(results, players) {
  const { eliminated, winners, finalCards } = results;
  const wolvesInGame = players.some(p => isWolfRole(finalCards[p.id]));
  const eliminatedTanner = eliminated.some(id => finalCards[id] === 'tanner');
  const eliminatedWolf = eliminated.some(id => isWolfRole(finalCards[id]));
  const minionInGame = players.some(p => finalCards[p.id] === 'minion');
  const eliminatedMinion = eliminated.some(id => finalCards[id] === 'minion');

  if (eliminatedTanner) {
    return wolvesInGame ? 'wolves_tanner_killed' : 'no_wolves_tanner_killed';
  }
  if (wolvesInGame) {
    return eliminatedWolf ? 'wolves_wolf_killed' : 'wolves_human_killed';
  }
  // No wolves
  if (eliminated.length === 0) {
    return minionInGame ? 'no_wolves_minion_survived' : null; // peace = no special narration
  }
  if (eliminatedMinion) return 'no_wolves_minion_killed';
  return 'no_wolves_village_killed';
}

function getWinningTeam(results, players) {
  const { winners, finalCards } = results;
  if (!winners || winners.length === 0) return null;
  const firstWinner = winners[0];
  const role = finalCards[firstWinner];
  if (isWolfRole(role) || role === 'minion') return 'werewolf';
  if (role === 'tanner') return 'tanner';
  return 'village';
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

  const winScenario = getWinScenario(results, players);
  const narration = winScenario ? WIN_NARRATIONS[winScenario] : null;
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
      {/* Win scene background */}
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

          {/* Win/Lose narration */}
          {narration && (
            <div className="mt-4 mx-auto max-w-sm rounded-xl overflow-hidden backdrop-blur-md animate-narratFadeIn"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(196,168,107,0.06))',
                border: '1px solid rgba(196,168,107,0.12)',
                boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              }}
            >
              <div className="px-5 py-3.5">
                <p className="text-moon-300/80 text-sm italic leading-relaxed font-light">
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

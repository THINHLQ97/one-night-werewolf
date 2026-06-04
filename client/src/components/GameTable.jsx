import { useRef, useState, useEffect } from 'react';
import RoleIcon, { CARD_BACK, CARD_IMAGES } from './RoleIcon';
import { RANK_BORDER_GRADIENTS } from './RankBadge';

const ROLE_EMOJI = {
  werewolf: '🐺', minion: '🦹', seer: '🔮', robber: '🦝', troublemaker: '😈',
  drunk: '🍺', insomniac: '👁️', villager: '👨‍🌾', hunter: '🏹', tanner: '💀', mason: '🤝',
  sentinel: '🛡️', alphawolf: '🐺', mysticwolf: '🐺', dreamwolf: '🐺',
  apprenticeseer: '🔮', paranormalinvestigator: '🕵️', witch: '🧙',
  villageidiot: '🤪', revealer: '🔦', bodyguard: '💪',
};
const ROLE_NAME_SHORT = {
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
  drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
  apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
  villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
};

function useContainerSize(ref) {
  const [size, setSize] = useState(340);
  useEffect(() => {
    if (!ref.current) return;
    const update = () => {
      const w = ref.current.parentElement?.clientWidth || 340;
      setSize(Math.min(460, Math.max(260, w - 16)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref]);
  return size;
}

export default function GameTable({
  players,
  myId,
  revealedPlayers = {},
  revealedCenter = {},
  knownWerewolves = [],
  knownMasons = [],
  knownAliens = [],
  swappedPairs = [],
  myCurrentRole = null,
  selectable = null,
  selected = [],
  onSelect = null,
  votes = null,
  eliminated = [],
  winners = [],
  isNight = false,
  hasAlphaWolf = false,
  shieldedPlayer = null,
  voiceSpeaking = {},
}) {
  const containerRef = useRef(null);
  const rawSize = useContainerSize(containerRef);
  const tableSize = rawSize;
  const scale = tableSize / 340;
  const centerX = tableSize / 2;
  const centerY = tableSize / 2;
  const playerRadius = tableSize / 2 - 35 * scale;
  const cardW = Math.round(44 * scale);
  const cardH = Math.round(60 * scale);
  const avatarSize = Math.round(48 * scale);
  const iconSize = Math.round(36 * scale);
  const centerIconSize = Math.round(28 * scale);
  const nodeWidth = Math.round(56 * scale);

  // Calculate vote counts for display
  const voteCounts = {};
  if (votes) {
    players.forEach(p => { voteCounts[p.id] = 0; });
    Object.values(votes).forEach(tid => {
      if (voteCounts[tid] !== undefined) voteCounts[tid]++;
    });
  }

  const myVote = votes?.[myId];

  return (
    <div ref={containerRef} className="game-table-container" style={{ width: tableSize, height: tableSize, position: 'relative', margin: '0 auto' }}>
      {/* Table surface */}
      <div className="game-table-surface" />

      {/* Center cards */}
      {(() => {
        const centerSlots = hasAlphaWolf
          ? ['center0', 'center1', 'center2', 'centerWolf']
          : ['center0', 'center1', 'center2'];
        const totalW = cardW * centerSlots.length + 8 * (centerSlots.length - 1);
        return (
          <div className="flex gap-2 items-center justify-center" style={{
            position: 'absolute',
            left: centerX - totalW / 2,
            top: centerY - cardH / 2,
            zIndex: 5,
          }}>
            {centerSlots.map((slot, i) => {
              const isWolf = slot === 'centerWolf';
              const isRevealed = revealedCenter[slot];
              const isSelected = selected.includes(slot);
              const isClickable = selectable === 'center' || selectable === 'both';

              return (
                <button
                  key={slot}
                  disabled={!isClickable}
                  onClick={() => isClickable && onSelect?.(slot)}
                  className={`center-card transition-all duration-300 ${
                    isRevealed ? 'center-card-revealed' : ''
                  } ${isSelected ? 'center-card-selected' : ''} ${
                    isClickable ? 'center-card-clickable' : ''
                  }`}
                  style={isWolf
                    ? { width: cardW, height: cardH, border: '1px solid rgba(239,68,68,0.4)' }
                    : { width: cardW, height: cardH }
                  }
                  title={isRevealed ? `${ROLE_EMOJI[isRevealed]} ${ROLE_NAME_SHORT[isRevealed]}` : (isWolf ? '🐺 Alpha' : `Giữa ${i + 1}`)}
                >
                  {isRevealed ? (
                    <div className="relative w-full h-full overflow-hidden rounded-[6px]">
                      <img src={CARD_IMAGES[isRevealed]} alt={isRevealed} className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                      <span className="absolute bottom-0 left-0 right-0 text-[7px] text-white font-bold text-center bg-black/60 py-0.5 leading-tight">{ROLE_NAME_SHORT[isRevealed]}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full relative overflow-hidden rounded-[6px]">
                      <img src={CARD_BACK} alt="card back" className="absolute inset-0 w-full h-full object-cover" />
                      {isWolf && (
                        <span className="relative z-10 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" style={{ fontSize: Math.round(cardW * 0.45) }}>🐺</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Players in circle */}
      {players.map((p, i) => {
        const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2;
        const halfNode = nodeWidth / 2;
        const x = centerX + playerRadius * Math.cos(angle) - halfNode;
        const y = centerY + playerRadius * Math.sin(angle) - halfNode;

        const isMe = p.id === myId;
        const isRevealed = revealedPlayers[p.id];
        const isWolf = knownWerewolves.includes(p.id);
        const isMason = knownMasons.includes(p.id);
        const isAlien = knownAliens.includes(p.id);
        const isSelected = selected.includes(p.id);
        const isClickable = (selectable === 'player' || selectable === 'both') && p.id !== myId;
        const isEliminated = eliminated.includes(p.id);
        const isWinner = winners.includes(p.id);
        const voteCount = voteCounts[p.id] || 0;
        const isMyVoteTarget = myVote === p.id;

        // Check if this player's card was swapped
        const wasSwapped = swappedPairs.some(pair => pair.includes(p.id));

        return (
          <div key={p.id} style={{ position: 'absolute', left: x, top: y }}>
            <button
              disabled={!isClickable}
              onClick={() => isClickable && onSelect?.(p.id)}
              style={{ width: nodeWidth }}
              className={`player-node transition-all duration-300
                ${isMe ? 'player-me' : ''}
                ${isWolf ? 'player-wolf' : ''}
                ${isMason ? 'player-mason' : ''}
                ${isAlien ? 'player-alien' : ''}
                ${isSelected ? 'player-selected' : ''}
                ${isClickable ? 'player-clickable' : ''}
                ${isEliminated ? 'player-eliminated' : ''}
                ${isWinner ? 'player-winner' : ''}
                ${isMyVoteTarget ? 'player-voted' : ''}
              `}
            >
              {/* Avatar with rank gradient border */}
              <div className="relative" style={{ width: avatarSize + 4, height: avatarSize + 4 }}>
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: avatarSize + 4,
                    height: avatarSize + 4,
                    background: p.rank ? (RANK_BORDER_GRADIENTS[p.rank.tier] || 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.1)',
                    padding: 2,
                  }}
                >
                  <div className="rounded-full flex items-center justify-center font-bold overflow-hidden bg-[#1a1a2e]" style={{ width: avatarSize, height: avatarSize, fontSize: 16 * scale }}>
                    {isRevealed ? (
                      <RoleIcon roleId={isRevealed} size={avatarSize} circular />
                    ) : isMe && myCurrentRole ? (
                      <RoleIcon roleId={myCurrentRole} size={avatarSize} circular />
                    ) : p.isBot ? (
                      <span>🤖</span>
                    ) : p.avatarUrl?.startsWith('emoji:') ? (
                      <span style={{ fontSize: avatarSize * 0.55 }}>{p.avatarUrl.slice(6)}</span>
                    ) : p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{p.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* Rank badge icon */}
                {p.rank && p.rank.tier > 1 && (
                  <img
                    src={`/images/${p.rank.image}`}
                    alt={p.rank.name}
                    className="absolute pointer-events-none"
                    style={{ width: 20 * scale, height: 20 * scale, bottom: -3, right: -3, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' }}
                    draggable={false}
                  />
                )}

                {/* Wolf indicator */}
                {isWolf && !isRevealed && (
                  <span className="absolute -top-1 -right-1 text-xs">🐺</span>
                )}

                {/* Mason indicator */}
                {isMason && !isRevealed && (
                  <span className="absolute -top-1 -left-1 text-xs">🤝</span>
                )}

                {/* Shield indicator — styled like Alpha Wolf token */}
                {shieldedPlayer === p.id && (
                  <span
                    className="absolute -bottom-1 -left-1 flex items-center justify-center rounded-full"
                    style={{
                      width: 18 * scale,
                      height: 18 * scale,
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(37,99,235,0.9))',
                      boxShadow: '0 0 8px rgba(59,130,246,0.6), 0 0 3px rgba(255,255,255,0.3)',
                      border: '1.5px solid rgba(147,197,253,0.6)',
                      fontSize: 10 * scale,
                    }}
                  >🛡️</span>
                )}

                {/* Swap indicator */}
                {wasSwapped && (
                  <span className="absolute -bottom-1 -right-1 text-xs">🔄</span>
                )}

                {/* Vote count badge */}
                {votes && voteCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-wolf-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {voteCount}
                  </span>
                )}

                {/* Eliminated X */}
                {isEliminated && (
                  <span className="absolute inset-0 flex items-center justify-center text-2xl text-wolf-400">✕</span>
                )}

                {/* Winner crown */}
                {isWinner && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm">🏆</span>
                )}

                {/* Voice speaking indicator */}
                {voiceSpeaking[p.id] && (
                  <span
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      top: -2, right: -2,
                      width: 12 * scale, height: 12 * scale,
                      background: 'radial-gradient(circle, #4ade80 30%, rgba(74,222,128,0.4))',
                      boxShadow: '0 0 6px rgba(74,222,128,0.8)',
                      animation: 'voicePulse 1s ease-in-out infinite',
                      zIndex: 10,
                    }}
                  />
                )}
              </div>

              {/* Name with seat number */}
              <span style={{ maxWidth: nodeWidth, fontSize: Math.max(9, 10 * scale) }} className={`mt-0.5 truncate block text-center leading-tight ${
                isMe ? 'text-moon-300 font-bold' : 'text-white/70'
              }`}>
                <span className="text-emerald-400/70 font-mono mr-0.5">#{i + 1}</span>
                {isMe ? '(Bạn)' : p.name}
              </span>

              {/* Revealed role name */}
              {isRevealed && (
                <span className="text-[8px] text-moon-400 leading-tight">{ROLE_NAME_SHORT[isRevealed]}</span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

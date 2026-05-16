import { useRef, useState, useEffect } from 'react';
import RoleIcon from './RoleIcon';

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
      setSize(Math.min(380, Math.max(260, w - 16)));
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
  swappedPairs = [],
  myCurrentRole = null,
  selectable = null,
  selected = [],
  onSelect = null,
  votes = null,
  eliminated = [],
  winners = [],
  isNight = false,
}) {
  const containerRef = useRef(null);
  const tableSize = useContainerSize(containerRef);
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
      <div className="flex gap-2 items-center justify-center" style={{
        position: 'absolute',
        left: centerX - (cardW * 3 + 16) / 2,
        top: centerY - cardH / 2,
      }}>
        {['center0', 'center1', 'center2'].map((slot, i) => {
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
              style={{ width: cardW, height: cardH }}
              title={isRevealed ? `${ROLE_EMOJI[isRevealed]} ${ROLE_NAME_SHORT[isRevealed]}` : `Giữa ${i + 1}`}
            >
              {isRevealed ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <RoleIcon roleId={isRevealed} size={centerIconSize} />
                  <span className="text-[8px] text-moon-300 mt-0.5 leading-tight">{ROLE_NAME_SHORT[isRevealed]}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <span style={{ fontSize: 18 * scale }}>🃏</span>
                  <span className="text-[8px] text-white/40 mt-0.5">{i + 1}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Players in circle */}
      {players.map((p, i) => {
        const angle = (i / players.length) * 2 * Math.PI - Math.PI / 2;
        const halfNode = nodeWidth / 2;
        const x = centerX + playerRadius * Math.cos(angle) - halfNode;
        const y = centerY + playerRadius * Math.sin(angle) - halfNode;

        const isMe = p.id === myId;
        const isRevealed = revealedPlayers[p.id];
        const isWolf = knownWerewolves.includes(p.id);
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
                ${isSelected ? 'player-selected' : ''}
                ${isClickable ? 'player-clickable' : ''}
                ${isEliminated ? 'player-eliminated' : ''}
                ${isWinner ? 'player-winner' : ''}
                ${isMyVoteTarget ? 'player-voted' : ''}
              `}
            >
              {/* Avatar circle */}
              <div className="rounded-full flex items-center justify-center font-bold relative" style={{ width: avatarSize, height: avatarSize, fontSize: 16 * scale }}>
                {isRevealed ? (
                  <RoleIcon roleId={isRevealed} size={iconSize} />
                ) : isMe && myCurrentRole ? (
                  <RoleIcon roleId={myCurrentRole} size={iconSize} />
                ) : (
                  <span>{p.name.charAt(0).toUpperCase()}</span>
                )}

                {/* Wolf indicator */}
                {isWolf && !isRevealed && (
                  <span className="absolute -top-1 -right-1 text-xs">🐺</span>
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
              </div>

              {/* Name */}
              <span style={{ maxWidth: nodeWidth, fontSize: Math.max(9, 10 * scale) }} className={`mt-0.5 truncate block text-center leading-tight ${
                isMe ? 'text-moon-300 font-bold' : 'text-white/70'
              }`}>
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

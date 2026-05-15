import RoleIcon from './RoleIcon';

const ROLE_EMOJI = {
  werewolf: '🐺', minion: '🦹', seer: '🔮', robber: '🦝', troublemaker: '😈',
  drunk: '🍺', insomniac: '👁️', villager: '👨‍🌾', hunter: '🏹', tanner: '💀',
};
const ROLE_NAME_SHORT = {
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
  drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner',
};

export default function GameTable({
  players,
  myId,
  // Night: which cards are revealed to THIS player
  revealedPlayers = {},   // { playerId: roleId }
  revealedCenter = {},    // { center0: roleId, ... }
  knownWerewolves = [],   // [playerId, ...] glow red
  swappedPairs = [],      // [[id1,id2], ...] show swap arrows
  myCurrentRole = null,   // if player knows their new role
  // Interaction
  selectable = null,      // 'player' | 'center' | 'both' | null
  selected = [],          // selected IDs
  onSelect = null,
  // Day voting
  votes = null,           // { voterId: targetId }
  // Display
  eliminated = [],        // eliminated player IDs (results)
  winners = [],           // winner player IDs (results)
  isNight = false,
}) {
  const tableSize = 340;
  const centerX = tableSize / 2;
  const centerY = tableSize / 2;
  const playerRadius = tableSize / 2 - 35;
  const cardW = 44;
  const cardH = 60;

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
    <div className="game-table-container" style={{ width: tableSize, height: tableSize, position: 'relative', margin: '0 auto' }}>
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
                  <RoleIcon roleId={isRevealed} size={28} />
                  <span className="text-[8px] text-moon-300 mt-0.5 leading-tight">{ROLE_NAME_SHORT[isRevealed]}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-lg">🃏</span>
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
        const x = centerX + playerRadius * Math.cos(angle) - 28;
        const y = centerY + playerRadius * Math.sin(angle) - 28;

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
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative">
                {isRevealed ? (
                  <RoleIcon roleId={isRevealed} size={36} />
                ) : isMe && myCurrentRole ? (
                  <RoleIcon roleId={myCurrentRole} size={36} />
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
              <span className={`text-[10px] mt-0.5 max-w-[56px] truncate block text-center leading-tight ${
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

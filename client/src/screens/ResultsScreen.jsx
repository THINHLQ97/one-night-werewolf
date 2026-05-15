import RoleIcon from '../components/RoleIcon';

const ROLE_NAMES = {
  werewolf: '🐺 Werewolf', minion: '🦹 Minion', seer: '🔮 Seer',
  robber: '🦝 Robber', troublemaker: '😈 Troublemaker', drunk: '🍺 Drunk',
  insomniac: '👁️ Insomniac', villager: '👨‍🌾 Villager', hunter: '🏹 Hunter', tanner: '💀 Tanner',
  mason: '🤝 Mason',
};

const TEAM_OF = {
  werewolf: 'werewolf', minion: 'werewolf',
  seer: 'village', robber: 'village', troublemaker: 'village',
  drunk: 'village', insomniac: 'village', villager: 'village', hunter: 'village', mason: 'village',
  tanner: 'tanner',
};

export default function ResultsScreen({ results, myId, isHost, onNewGame }) {
  if (!results) return null;

  const { eliminated, initialEliminated, winners, players, finalCards, originalCards, tally } = results;
  const hunterKills = eliminated.filter(id => !initialEliminated?.includes(id));

  const isWinner = winners.includes(myId);
  const playerMap = {};
  players.forEach(p => { playerMap[p.id] = p.name; });

  const winningTeams = new Set(winners.map(id => TEAM_OF[finalCards[id]]));

  let teamLabel, teamColor;
  if (winners.length === 0) {
    teamLabel = '🤝 Không ai thắng';
    teamColor = 'text-white/60';
  } else if (winningTeams.has('tanner') && winningTeams.size === 1) {
    teamLabel = '💀 Tanner Wins!';
    teamColor = 'text-purple-400';
  } else if (winningTeams.has('village')) {
    teamLabel = winningTeams.has('tanner') ? '🏘️ Village & 💀 Tanner Win!' : '🏘️ Village Wins!';
    teamColor = 'text-village-400';
  } else {
    teamLabel = '🐺 Werewolves Win!';
    teamColor = 'text-wolf-400';
  }

  return (
    <div className="min-h-screen min-h-[100dvh] px-3 py-4 sm:p-4 max-w-lg mx-auto fade-in">
      {/* Win banner */}
      <div className="text-center pt-6 sm:pt-8 pb-4 sm:pb-6">
        <div className="text-5xl sm:text-6xl mb-3">{isWinner ? '🎉' : '😢'}</div>
        <h2 className={`text-3xl font-bold ${teamColor}`}>{teamLabel}</h2>
        <p className="text-white/50 mt-2">
          {isWinner ? 'Bạn nằm trong phe thắng!' : 'Bạn thua lần này...'}
        </p>
      </div>

      {/* Eliminated */}
      <div className="card mb-4">
        <h3 className="text-moon-400 font-semibold mb-3">⚔️ Bị loại</h3>
        {eliminated.length === 0 ? (
          <p className="text-white/40 text-sm">Không ai bị loại</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {eliminated.map(id => (
              <span key={id} className={`px-3 py-1.5 border rounded-xl text-sm ${
                hunterKills.includes(id)
                  ? 'bg-yellow-500/20 border-yellow-500/40'
                  : 'bg-wolf-500/20 border-wolf-500/40'
              }`}>
                {hunterKills.includes(id) ? '🏹' : '💀'} {playerMap[id]} ({ROLE_NAMES[finalCards[id]]})
                {hunterKills.includes(id) && <span className="text-white/40 ml-1">(bị Thợ Săn kéo theo)</span>}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* All cards revealed */}
      <div className="card mb-4">
        <h3 className="text-moon-400 font-semibold mb-3">🃏 Bài của mọi người</h3>
        <div className="space-y-2">
          {players.map(p => {
            const orig = originalCards[p.id];
            const final = finalCards[p.id];
            const changed = orig !== final;
            const isWin = winners.includes(p.id);

            return (
              <div key={p.id} className={`flex items-center justify-between px-3 py-2 rounded-xl ${isWin ? 'bg-village-500/10' : 'bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  {isWin && <span className="text-yellow-400">🏆</span>}
                  <span className="font-medium text-sm">{p.name}</span>
                  {eliminated.includes(p.id) && <span className="text-xs text-wolf-400">💀</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right text-sm">
                    <span className="text-moon-300 font-semibold">{ROLE_NAMES[final]}</span>
                    {changed && (
                      <div className="text-white/30 text-xs">Ban đầu: {ROLE_NAMES[orig]}</div>
                    )}
                  </div>
                  <RoleIcon roleId={final} size={32} />
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
              <span key={slot} className="text-xs px-2 py-1 bg-white/5 rounded-lg text-white/50">
                Giữa {i + 1}: {ROLE_NAMES[finalCards[slot]]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Vote tally */}
      <div className="card mb-6">
        <h3 className="text-moon-400 font-semibold mb-3">🗳️ Kết quả vote</h3>
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
        <button className="btn-primary w-full text-lg py-4" onClick={onNewGame}>
          🔄 Chơi lại
        </button>
      ) : (
        <p className="text-center text-white/40 text-sm py-4">Chờ host bắt đầu game mới...</p>
      )}
    </div>
  );
}

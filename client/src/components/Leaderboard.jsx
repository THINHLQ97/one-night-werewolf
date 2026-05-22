import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AvatarWithFrame } from './ProfileBar';
import Icon from './Icon';

const API_BASE = import.meta.env.VITE_SERVER_URL || '';

const PODIUM_COLORS = [
  'from-yellow-400/20 to-yellow-600/10 border-yellow-500/30',
  'from-gray-300/20 to-gray-400/10 border-gray-400/30',
  'from-amber-600/20 to-amber-700/10 border-amber-600/30',
];
const PODIUM_BADGE = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

export default function Leaderboard({ onClose }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/leaderboard?limit=50`)
      .then(r => r.json())
      .then(data => setPlayers(data.leaderboard || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white/90 flex items-center gap-2">
              <Icon name="trophy" size={20} className="text-moon-400" />
              Bảng xếp hạng
            </h2>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none">&times;</button>
          </div>
          <p className="text-xs text-white/30 mt-1">Top 50 người chơi</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-moon-400/30 border-t-moon-400 rounded-full animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              Chưa có người chơi nào
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {players.map((p, i) => {
                const isMe = user?.id === p.id;
                const isTop3 = i < 3;
                const avatarEmoji = p.avatarUrl?.startsWith('emoji:') ? p.avatarUrl.slice(6) : null;
                const avatarImg = p.avatarUrl && !p.avatarUrl.startsWith('emoji:') ? p.avatarUrl : null;
                const winRate = p.gamesPlayed > 0 ? Math.round((p.gamesWon / p.gamesPlayed) * 100) : 0;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                      isMe ? 'bg-moon-400/10' : isTop3 ? `bg-gradient-to-r ${PODIUM_COLORS[i]}` : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Rank number */}
                    <div className="w-7 text-center flex-shrink-0">
                      {isTop3 ? (
                        <span className={`text-lg font-black ${PODIUM_BADGE[i]}`}>
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        <span className="text-sm text-white/30 font-medium">#{i + 1}</span>
                      )}
                    </div>

                    {/* Avatar with rank frame */}
                    <AvatarWithFrame
                      avatarUrl={avatarImg}
                      avatarEmoji={avatarEmoji}
                      name={p.displayName}
                      rank={p.rank}
                      size={28}
                    />

                    {/* Player info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-medium truncate ${isMe ? 'text-moon-300' : 'text-white/80'}`}>
                          {p.displayName}
                        </span>
                        {isMe && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-moon-400/20 text-moon-300 flex-shrink-0">
                            Ban
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/30">
                        {p.gamesPlayed} tran · {winRate}% thang
                      </div>
                    </div>

                    {/* Points + Rank badge */}
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1.5 justify-end">
                        {p.rank && (
                          <img
                            src={`/images/${p.rank.image}`}
                            alt={p.rank.name}
                            className="w-5 h-5 object-contain"
                            draggable={false}
                          />
                        )}
                        <span className="text-sm font-bold text-moon-400">{p.points}</span>
                      </div>
                      <div className="text-[10px] text-white/30">{p.rank?.nameVi}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

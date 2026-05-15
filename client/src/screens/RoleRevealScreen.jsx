import { useState } from 'react';
import RoleIcon from '../components/RoleIcon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';

const TEAM_STYLE = {
  werewolf: { bg: 'bg-wolf-500/20 border-wolf-500/40', text: 'text-wolf-400', label: 'Werewolf Team' },
  village:  { bg: 'bg-village-500/20 border-village-500/40', text: 'text-village-400', label: 'Village Team' },
  tanner:   { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-400', label: 'Solo' },
};

export default function RoleRevealScreen({ myRole }) {
  const [revealed, setRevealed] = useState(false);
  const [roleHidden, setRoleHidden] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  if (!myRole) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-in">
        <div className="text-center">
          <div className="text-5xl mb-4 pulse-moon">🌙</div>
          <p className="text-moon-400">Đang nhận bài...</p>
        </div>
      </div>
    );
  }

  const style = TEAM_STYLE[myRole.team] || TEAM_STYLE.village;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 fade-in">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <h2 className="text-moon-400 text-sm sm:text-lg text-center">
          🌙 Đêm xuống — Xem bài của bạn
        </h2>
        <div className="flex gap-1.5">
          {revealed && (
            <button
              onClick={() => setRoleHidden(h => !h)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
              title={roleHidden ? 'Hiện vai' : 'Ẩn vai'}
            >
              {roleHidden ? '🙈' : '👁️'}
            </button>
          )}
          <RoleLibraryButton onClick={() => setLibraryOpen(true)} />
        </div>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-48 h-64 rounded-2xl border-2 border-moon-400/40 bg-night-700 flex flex-col items-center justify-center gap-4 hover:border-moon-400 hover:bg-night-600 transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-6xl">🃏</span>
          <span className="text-moon-400 font-semibold">Lật bài</span>
        </button>
      ) : roleHidden ? (
        <div className="w-48 h-64 rounded-2xl border-2 border-white/20 bg-night-700 flex flex-col items-center justify-center gap-4">
          <span className="text-6xl">🙈</span>
          <span className="text-white/40 font-semibold text-sm">Vai đã ẩn</span>
        </div>
      ) : (
        <div className={`w-64 rounded-2xl border-2 ${style.bg} p-8 text-center fade-in`}>
          <div className="flex justify-center mb-4">
            <RoleIcon roleId={myRole.roleId} size={100} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{myRole.name}</h3>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/10 ${style.text}`}>
            {style.label}
          </span>
          <p className="text-white/70 text-sm mt-4 leading-relaxed">{myRole.description}</p>
        </div>
      )}

      <p className="text-white/30 text-sm mt-10 text-center max-w-xs">
        Đêm sẽ bắt đầu sau 15 giây. Hãy nhớ vai của bạn và đừng tiết lộ cho người khác!
      </p>

      <div className="mt-4 flex gap-1">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-white/20" />
        ))}
      </div>

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} highlightRole={myRole?.roleId} />
    </div>
  );
}

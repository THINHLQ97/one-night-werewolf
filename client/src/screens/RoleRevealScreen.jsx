import { useState, useMemo } from 'react';
import RoleIcon, { CARD_BACK } from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';

const NIGHT_QUOTES = [
  'Trong ngôi làng này, im lặng cũng có thể là một lời thú tội.',
  'Kẻ đáng tin nhất đôi khi chỉ là kẻ nói dối giỏi nhất.',
  'Sói không cần phá cửa. Chúng chỉ cần được mời vào bằng lòng tin.',
  'Dân làng không sợ bóng tối. Họ sợ người đứng cạnh mình trong bóng tối.',
  'Bình minh chỉ đến với những ai sống sót qua lời buộc tội cuối cùng.',
  'Một lá phiếu có thể cứu cả làng, hoặc dâng nó cho bầy sói.',
  'Ở đây, sự thật không thắng nhờ được nói ra — mà nhờ có người còn sống để nghe nó.',
];

const TEAM_STYLE = {
  werewolf: { bg: 'bg-wolf-500/20 border-wolf-500/40', text: 'text-wolf-400', label: 'Phe Sói', glow: 'shadow-[0_0_30px_rgba(231,76,60,0.3)]' },
  village:  { bg: 'bg-village-500/20 border-village-500/40', text: 'text-village-400', label: 'Phe Dân', glow: 'shadow-[0_0_30px_rgba(39,174,96,0.3)]' },
  tanner:   { bg: 'bg-purple-500/20 border-purple-500/40', text: 'text-purple-400', label: 'Phe Riêng', glow: 'shadow-[0_0_30px_rgba(142,68,173,0.3)]' },
};

export default function RoleRevealScreen({ myRole }) {
  const [revealed, setRevealed] = useState(false);
  const [roleHidden, setRoleHidden] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const nightQuote = useMemo(() => NIGHT_QUOTES[Math.floor(Math.random() * NIGHT_QUOTES.length)], []);

  if (!myRole) {
    return (
      <div className="min-h-screen flex items-center justify-center fade-in relative z-10">
        <div className="text-center">
          <div className="mb-4 pulse-moon text-moon-400"><Icon name="moon" size={48} /></div>
          <p className="text-moon-400">Đang nhận bài...</p>
        </div>
      </div>
    );
  }

  const style = TEAM_STYLE[myRole.team] || TEAM_STYLE.village;

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 fade-in relative z-10">
      <div className="flex items-center gap-3 mb-6 sm:mb-8">
        <h2 className="text-moon-400 text-sm sm:text-lg text-center flex items-center gap-2">
          <Icon name="moon" size={20} className="text-moon-400" /> Đêm xuống — Xem bài của bạn
        </h2>
        <div className="flex gap-1.5">
          {revealed && (
            <button
              onClick={() => setRoleHidden(h => !h)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
              title={roleHidden ? 'Hiện vai' : 'Ẩn vai'}
            >
              <Icon name={roleHidden ? 'eyeOff' : 'eye'} size={16} />
            </button>
          )}
          <RoleLibraryButton onClick={() => setLibraryOpen(true)} />
        </div>
      </div>

      {!revealed ? (
        /* Card back — tap to flip */
        <button
          onClick={() => setRevealed(true)}
          className="rounded-2xl border-2 border-moon-400/40 overflow-hidden relative hover:border-moon-400 transition-all active:scale-95 cursor-pointer group shadow-lg"
          style={{ width: 180, height: 252 }}
        >
          <img src={CARD_BACK} alt="card back" className="absolute inset-0 w-full h-full object-cover" />
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4">
            <span className="text-moon-300 font-semibold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-black/70 transition-colors">Lật bài</span>
          </div>
        </button>
      ) : roleHidden ? (
        <div className="rounded-2xl border-2 border-white/20 bg-night-700 flex flex-col items-center justify-center gap-4" style={{ width: 180, height: 252 }}>
          <Icon name="eyeOff" size={48} className="text-white/30" />
          <span className="text-white/40 font-semibold text-sm">Vai đã ẩn</span>
        </div>
      ) : (
        /* Revealed: full card on top + info below */
        <div className="flex flex-col items-center fade-in">
          {/* Card portrait */}
          <div className={`rounded-2xl overflow-hidden border-2 ${style.bg} ${style.glow}`} style={{ width: 180, height: 252 }}>
            <RoleIcon roleId={myRole.roleId} size={180} className="!rounded-xl" />
          </div>

          {/* Role info below card */}
          <div className="mt-4 text-center max-w-xs">
            <h3 className="text-2xl font-bold text-white mb-1">{myRole.name}</h3>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/10 ${style.text}`}>
              {style.label}
            </span>
            <p className="text-white/60 text-sm mt-3 leading-relaxed">{myRole.description}</p>
          </div>
        </div>
      )}

      <div className="mt-8 text-center max-w-xs px-4">
        <p className="text-white/30 text-sm mb-3">
          Đêm sẽ bắt đầu sau 15 giây. Hãy nhớ vai của bạn!
        </p>
        <p className="text-moon-400/40 text-xs italic leading-relaxed">
          "{nightQuote}"
        </p>
      </div>

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} highlightRole={myRole?.roleId} />
    </div>
  );
}

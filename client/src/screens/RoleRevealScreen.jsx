import { useState, useMemo } from 'react';
import RoleIcon, { CARD_BACK } from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import VoiceChatControls from '../components/VoiceChatControls';
import ChatPanel from '../components/ChatPanel';
import socket from '../socket';

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
  alien:     { bg: 'bg-emerald-500/20 border-emerald-500/40', text: 'text-emerald-400', label: 'Phe Alien', glow: 'shadow-[0_0_30px_rgba(74,222,128,0.3)]' },
  synthetic: { bg: 'bg-cyan-500/20 border-cyan-500/40', text: 'text-cyan-400', label: 'Phe Alien Nhân Tạo', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.3)]' },
  blob:      { bg: 'bg-lime-500/20 border-lime-500/40', text: 'text-lime-400', label: 'Phe Blob', glow: 'shadow-[0_0_30px_rgba(163,230,53,0.3)]' },
  mortician: { bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-400', label: 'Phe Nhà Quàn', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
};

export default function RoleRevealScreen({ myRole, roomCode, isHost, players, voiceSpeaking, chatMessages }) {
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
      <div className="mb-6 sm:mb-8">
        <h2 className="text-moon-400 text-sm sm:text-lg text-center flex items-center justify-center gap-2 mb-2">
          <Icon name="moon" size={20} className="text-moon-400" /> Đêm xuống — Xem bài của bạn
        </h2>
        {/* Toolbar row */}
        <div className="flex items-center justify-center gap-1.5">
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
          <VoiceChatControls roomCode={roomCode} isHost={isHost} players={players} myId={socket.id} />
          <ChatPanel roomCode={roomCode} myId={socket.id} players={players} messages={chatMessages} />
        </div>
      </div>

      {roleHidden ? (
        <div className="rounded-2xl border-2 border-white/20 bg-night-700 flex flex-col items-center justify-center gap-4" style={{ width: 180, height: 252 }}>
          <Icon name="eyeOff" size={48} className="text-white/30" />
          <span className="text-white/40 font-semibold text-sm">Vai đã ẩn</span>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* 3D Flip Card */}
          <div
            onClick={() => !revealed && setRevealed(true)}
            className={!revealed ? 'cursor-pointer group' : ''}
            style={{ width: 180, height: 252, perspective: '800px' }}
          >
            <div style={{
              width: '100%', height: '100%',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              {/* Back face */}
              <div className="rounded-2xl overflow-hidden border-2 border-moon-400/40 group-hover:border-moon-400 transition-colors shadow-lg" style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
              }}>
                <img src={CARD_BACK} alt="card back" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4">
                  <span className="text-moon-300 font-semibold text-sm bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm group-hover:bg-black/70 transition-colors">Lật bài</span>
                </div>
              </div>
              {/* Front face */}
              <div className={`rounded-2xl overflow-hidden border-2 ${style.bg} ${style.glow}`} style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}>
                <RoleIcon roleId={myRole.roleId} size={180} className="!rounded-xl" />
              </div>
            </div>
          </div>

          {/* Role info — slides in after flip */}
          {revealed && (
            <div className="mt-4 text-center max-w-xs" style={{ animation: 'revealInfoSlideIn 0.5s ease-out 0.4s both' }}>
              <h3 className="text-2xl font-bold text-white mb-1">{myRole.name}</h3>
              <span className={`text-sm font-semibold px-3 py-1 rounded-full bg-white/10 ${style.text}`}>
                {style.label}
              </span>
              <p className="text-white/60 text-sm mt-3 leading-relaxed">{myRole.description}</p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes revealInfoSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="mt-8 w-full max-w-sm mx-auto px-4">
        <div className="relative rounded-2xl overflow-hidden backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(196,168,107,0.08), rgba(255,255,255,0.03))',
            border: '1px solid rgba(196,168,107,0.15)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <div className="px-5 py-4 text-center">
            <p className="text-white/40 text-xs mb-2.5 tracking-wide uppercase">
              Đêm sẽ bắt đầu sau 15 giây
            </p>
            <div className="w-8 h-px bg-moon-400/30 mx-auto mb-3" />
            <p className="text-moon-300/70 text-sm italic leading-relaxed font-light">
              "{nightQuote}"
            </p>
          </div>
          {/* Subtle animated border glow */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none animate-quoteGlow" />
        </div>
      </div>

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} highlightRole={myRole?.roleId} gameMode={['alien','syntheticalien','groob','zerb','cow','oracle','rascal','exposer','psychic','mortician','leader','blob'].includes(myRole?.roleId) ? 'alien' : null} />
    </div>
  );
}

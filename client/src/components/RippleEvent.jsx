import { useState, useEffect } from 'react';

/**
 * RippleEvent — full-screen cinematic popup for The Ripple (Vết Nứt).
 *
 * Stages:
 *  1. intro    — dramatic reveal of The Ripple
 *  2. action   — show what the Ripple does
 *
 * Props:
 *  - action       — { actionId, label, description, ... }
 *  - onClose()    — called when player acknowledges
 */

const RIPPLE_NARRATIONS = {
  '1_minute':       { title: '⏱️ Thời Gian Co Lại',       narration: 'Vết nứt thời không xé toạc dòng chảy — cả làng chỉ còn 1 PHÚT để thảo luận trước khi bỏ phiếu.' },
  'repeat':         { title: '🔄 Vòng Lặp Thời Gian',     narration: 'Thời gian gập lại chính nó — đêm diễn ra LẦN NỮA. Nhưng Oracle sẽ không thức dậy trong vòng lặp.' },
  'insomniac':      { title: '👁️ Mất Ngủ',                narration: 'Vết nứt khiến một số người chợt tỉnh giấc — họ nhìn thấy bài hiện tại của mình.' },
  'may_not_speak':  { title: '🤐 Lời Nguyền Câm Lặng',    narration: 'Vết nứt nuốt chửng giọng nói — một số người chơi bị CẤM NÓI cho đến khi bỏ phiếu.' },
  'face_away':      { title: '🙈 Quay Mặt Đi',            narration: 'Vết nứt che mờ tầm nhìn — một số người chơi phải QUAY MẶT ĐI cho đến khi vote xong.' },
  'troublemaker':   { title: '🔀 Kẻ Gây Rối',             narration: 'Vết nứt trao quyền cho một kẻ — người đó được HOÁN ĐỔI bài của 2 người khác.' },
  'steal':          { title: '🫳 Cướp Đoạt',               narration: 'Vết nứt mở ra cơ hội — một người được CƯỚP BÀI của người khác và xem bài mới.' },
  'witch':          { title: '🧙 Phù Thủy',               narration: 'Vết nứt triệu hồi ma thuật — một người được thực hiện hành động PHÙ THỦY.' },
  'view_1':         { title: '🔍 Nhìn Trộm',              narration: 'Vết nứt hé lộ bí mật — một người được XEM BÀI của 1 người khác.' },
  'view_2':         { title: '🔍🔍 Nhìn Trộm Kép',        narration: 'Vết nứt rạn nứt sâu hơn — một người được XEM BÀI của 2 người khác.' },
  'reveal':         { title: '🃏 Phơi Bày',               narration: 'Vết nứt lật tung bí mật — một người được LẬT BÀI của 1 người khác cho cả bàn thấy.' },
  'dual_view':      { title: '👀 Song Thị',               narration: 'Vết nứt liên kết hai tâm trí — 2 người CÙNG XEM BÀI của 1 người khác.' },
  'two_hand_vote':  { title: '✌️ Hai Tay Bỏ Phiếu',       narration: 'Vết nứt trao thêm quyền lực — một số người vote bằng CẢ HAI TAY (2 phiếu).' },
  'dual_shuffle':   { title: '🔀 Xáo Trộn Đôi',           narration: 'Vết nứt buộc 2 người lộ bài cho nhau — rồi XÁO TRỘN ngẫu nhiên.' },
  'drunk':          { title: '🍺 Say Xỉn',                narration: 'Vết nứt đẩy ai đó vào cơn say — người đó PHẢI đổi bài với 1 lá ở giữa (không xem).' },
};

export default function RippleEvent({ action, onClose }) {
  const [stage, setStage] = useState('intro');

  const info = RIPPLE_NARRATIONS[action?.actionId] || { title: '⚡ The Ripple', narration: action?.description || '' };

  // Auto-advance from intro to action after 4 seconds
  useEffect(() => {
    if (stage === 'intro') {
      const timer = setTimeout(() => setStage('action'), 4000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 fade-in"
      style={{ animation: 'eventFadeIn 0.6s ease-out' }}>

      {/* ── Space vortex layers ── */}
      {/* Outer slow ring */}
      <div className="absolute pointer-events-none" style={{
        width: '140vmax', height: '140vmax',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'conic-gradient(from 0deg, transparent 0%, rgba(139,92,246,0.06) 10%, transparent 20%, rgba(88,28,135,0.08) 35%, transparent 45%, rgba(168,85,247,0.05) 60%, transparent 70%, rgba(139,92,246,0.07) 85%, transparent 100%)',
        borderRadius: '50%',
        animation: 'vortexSpin 12s linear infinite',
        filter: 'blur(30px)',
      }} />
      {/* Middle ring */}
      <div className="absolute pointer-events-none" style={{
        width: '100vmax', height: '100vmax',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'conic-gradient(from 120deg, transparent 0%, rgba(168,85,247,0.1) 8%, transparent 16%, rgba(139,92,246,0.12) 30%, transparent 40%, rgba(192,132,252,0.08) 55%, transparent 65%, rgba(139,92,246,0.1) 80%, transparent 90%)',
        borderRadius: '50%',
        animation: 'vortexSpin 8s linear infinite reverse',
        filter: 'blur(18px)',
      }} />
      {/* Inner fast ring */}
      <div className="absolute pointer-events-none" style={{
        width: '60vmax', height: '60vmax',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'conic-gradient(from 240deg, transparent 0%, rgba(192,132,252,0.15) 12%, transparent 24%, rgba(139,92,246,0.18) 40%, transparent 52%, rgba(168,85,247,0.12) 68%, transparent 80%, rgba(192,132,252,0.14) 92%, transparent 100%)',
        borderRadius: '50%',
        animation: 'vortexSpin 5s linear infinite',
        filter: 'blur(8px)',
      }} />
      {/* Center glow pulse */}
      <div className="absolute pointer-events-none" style={{
        width: '50vh', height: '50vh',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.2) 0%, rgba(88,28,135,0.08) 40%, transparent 70%)',
        animation: 'vortexPulse 3s ease-in-out infinite',
      }} />
      {/* Particle dots */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute pointer-events-none rounded-full" style={{
          width: `${2 + Math.random() * 3}px`,
          height: `${2 + Math.random() * 3}px`,
          background: `rgba(${168 + Math.random() * 40}, ${85 + Math.random() * 60}, 247, ${0.4 + Math.random() * 0.4})`,
          left: '50%', top: '50%',
          boxShadow: `0 0 ${4 + Math.random() * 6}px rgba(168,85,247,0.6)`,
          animation: `vortexParticle ${3 + Math.random() * 4}s linear ${Math.random() * 3}s infinite`,
          '--orbit-radius': `${15 + Math.random() * 25}vmin`,
          '--start-angle': `${i * 45}deg`,
        }} />
      ))}

      <div className="relative max-w-2xl w-full px-4 flex flex-col items-center">
        {/* Ripple image */}
        <div className="relative" style={{ animation: 'eventScaleIn 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <img
            src="/images/oracle special event/the-ripple-event.webp"
            alt="The Ripple"
            className="max-w-full max-h-[50vh] object-contain drop-shadow-[0_0_30px_rgba(139,92,246,0.3)]"
            draggable={false}
          />
        </div>

        {/* ── STAGE 1: INTRO ── */}
        {stage === 'intro' && (
          <div className="mt-6 text-center px-4 max-w-lg" style={{ animation: 'eventFadeIn 1.2s ease-out 0.4s both' }}>
            <p className="text-purple-300 text-lg font-bold mb-2" style={{ textShadow: '0 0 14px rgba(139,92,246,0.6)' }}>
              ⚡ THE RIPPLE — VẾT NỨT
            </p>
            <p className="text-purple-200/80 text-sm leading-relaxed italic">
              "Không gian rung chuyển... một vết nứt thời không xuất hiện giữa đêm khuya. Vận mệnh của tất cả sắp bị thay đổi."
            </p>
            <div className="mt-4 flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full bg-purple-400"
                  style={{ animation: `oracleDot 1.4s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── STAGE 2: ACTION ── */}
        {stage === 'action' && (
          <div className="mt-6 text-center px-4 max-w-lg" style={{ animation: 'eventFadeIn 0.8s ease-out' }}>
            <p className="text-purple-300 text-lg font-bold mb-2" style={{ textShadow: '0 0 14px rgba(139,92,246,0.6)' }}>
              {info.title}
            </p>
            <p className="text-purple-200/80 text-sm leading-relaxed mb-3 italic">
              "{info.narration}"
            </p>
            {action?.description && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-white/80 text-sm">{action.description}</p>
              </div>
            )}
            <button
              className="btn-primary text-sm px-6 py-2.5"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
              onClick={onClose}
            >
              Hiểu rồi
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes eventFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes eventScaleIn {
          0% { opacity: 0; transform: scale(0.85); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes oraclePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes oracleDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes vortexSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes vortexPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.9); }
          50%      { opacity: 1;   transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes vortexParticle {
          0%   { transform: translate(-50%, -50%) rotate(var(--start-angle, 0deg)) translateX(var(--orbit-radius, 20vmin)) scale(0); opacity: 0; }
          15%  { scale: 1; opacity: 1; }
          85%  { opacity: 0.8; }
          100% { transform: translate(-50%, -50%) rotate(calc(var(--start-angle, 0deg) + 360deg)) translateX(var(--orbit-radius, 20vmin)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

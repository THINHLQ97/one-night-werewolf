import { useState, useEffect } from 'react';
import RoleIcon from './RoleIcon';
import Icon from './Icon';

// Version key — bump this when adding a new update popup
const UPDATE_VERSION = 'v3_alien_invasion';
const STORAGE_KEY = `onw_seen_update_${UPDATE_VERSION}`;

// Highlighted roles for the Alien Invasion preview
const HIGHLIGHT_ROLES = [
  {
    id: 'alien', name: 'Alien', nameVi: 'Người Ngoài Hành Tinh', emoji: '👽',
    teamColor: 'alien',
    short: 'Phe kẻ xâm lăng',
    desc: 'Mở mắt cùng đồng bọn. Mỗi đêm nhận chỉ thị ngẫu nhiên từ Tiếng vọng từ không gian (xem bài, swap, hoặc chuyền tay nhau).',
  },
  {
    id: 'oracle', name: 'Oracle', nameVi: 'Nhà Tiên Tri', emoji: '🔮',
    teamColor: 'village',
    short: 'Người đối thoại với vũ trụ',
    desc: 'Thức dậy đầu tiên. Tiếng vọng đặt ra câu hỏi ngẫu nhiên. Có 5% cơ hội đối mặt với THÁCH THỨC TỐI THƯỢNG — đoán số 1-10!',
  },
  {
    id: 'cow', name: 'Cow', nameVi: 'Bò', emoji: '🐄',
    teamColor: 'village',
    short: 'Cảm biến Alien',
    desc: 'Giơ nắm đấm trong lượt Alien. Nếu Alien ngồi cạnh bạn — họ phải tap. Biết được Alien ở bên TRÁI hay PHẢI bạn.',
  },
  {
    id: 'leader', name: 'Leader', nameVi: 'Thủ Lĩnh', emoji: '👑',
    teamColor: 'village',
    short: 'Người biết tất cả Alien',
    desc: 'Mở mắt, thấy chính xác vị trí mọi Alien. Nhưng nếu TẤT CẢ Alien chỉ vào bạn — Alien thắng ngay lập tức!',
  },
  {
    id: 'blob', name: 'Blob', nameVi: 'Blob', emoji: '🟢',
    teamColor: 'blob',
    short: 'Phe riêng — hấp thụ hàng xóm',
    desc: 'Tiếng vọng cho biết ai thuộc Blob của bạn (1-4 người tùy game size). Bạn THẮNG nếu tất cả Blob sống sót.',
  },
  {
    id: 'mortician', name: 'Mortician', nameVi: 'Nhà Quàn', emoji: '⚰️',
    teamColor: 'mortician',
    short: 'Phe riêng — kẻ ưa cái chết',
    desc: 'Xem bài 0-2 hàng xóm. THẮNG nếu ít nhất 1 hàng xóm bị giết và bạn sống sót.',
  },
];

const TEAM_BG = {
  village: 'bg-village-400/10 border-village-400/30',
  werewolf: 'bg-wolf-500/10 border-wolf-500/30',
  alien: 'bg-emerald-500/10 border-emerald-500/30',
  blob: 'bg-lime-500/10 border-lime-500/30',
  mortician: 'bg-amber-500/10 border-amber-500/30',
};

const TEAM_TEXT = {
  village: 'text-village-400',
  werewolf: 'text-wolf-400',
  alien: 'text-emerald-400',
  blob: 'text-lime-400',
  mortician: 'text-amber-400',
};

export default function UpdatePopup({ onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 500);
      return () => clearTimeout(t);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
    onClose?.();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 fade-in"
      style={{ background: 'rgba(5, 15, 5, 0.92)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 40, 25, 0.96), rgba(10, 20, 15, 0.96))',
          borderColor: 'rgba(74, 222, 128, 0.35)',
          boxShadow: '0 10px 50px rgba(74, 222, 128, 0.35), 0 0 0 1px rgba(74, 222, 128, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 z-10"
        >
          ✕
        </button>

        {/* Header with alien logo */}
        <div className="px-5 pt-6 pb-4 text-center border-b border-emerald-400/15 relative overflow-hidden">
          {/* Star background effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top, rgba(74,222,128,0.12) 0%, transparent 70%)',
          }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold mb-3">
              <span className="animate-pulse">👽</span> CHẾ ĐỘ CHƠI MỚI
            </div>

            <img
              src="/images/logo-game-alien.png"
              alt="One Night Ultimate Alien"
              className="w-24 h-24 mx-auto mb-2 drop-shadow-[0_0_24px_rgba(74,222,128,0.5)]"
              draggable={false}
            />

            <h2 className="text-2xl font-bold text-emerald-300 mb-1" style={{
              textShadow: '0 0 12px rgba(74,222,128,0.5)',
            }}>
              ALIEN INVASION
            </h2>
            <p className="text-emerald-400/70 text-xs italic">
              "Tiếng vọng từ không gian đã đến..."
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="px-4 py-4 space-y-2.5">
          <div className="text-center mb-3">
            <p className="text-white/80 text-sm font-semibold">12 vai mới · 5 phe khác nhau</p>
            <p className="text-white/40 text-xs italic mt-0.5">Phong cách chơi hoàn toàn mới — App điều khiển toàn bộ đêm</p>
          </div>

          {HIGHLIGHT_ROLES.map(role => (
            <div
              key={role.id}
              className={`flex gap-3 p-2.5 rounded-xl border ${TEAM_BG[role.teamColor]}`}
            >
              <div className="flex-shrink-0">
                <RoleIcon roleId={role.id} size={48} className="!rounded-lg" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm">{role.emoji}</span>
                  <h3 className="font-bold text-white text-sm">{role.nameVi}</h3>
                  <span className="text-white/30 text-[10px]">{role.name}</span>
                </div>
                <p className={`${TEAM_TEXT[role.teamColor]} text-[11px] font-semibold mb-0.5`}>{role.short}</p>
                <p className="text-white/55 text-[11px] leading-relaxed">{role.desc}</p>
              </div>
            </div>
          ))}

          {/* Tip box */}
          <div className="mt-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
            <p className="text-emerald-300/90 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <span>🎮</span> Cách chơi mới
            </p>
            <ul className="text-white/55 text-[11px] space-y-0.5 leading-relaxed">
              <li>• <strong className="text-emerald-300">Tiếng vọng từ không gian</strong> (App) ra chỉ thị ngẫu nhiên mỗi đêm</li>
              <li>• Tất cả mọi người nghe được câu hỏi từ Tiếng vọng</li>
              <li>• Mỗi đêm là một trải nghiệm khác biệt — không có 2 ván giống nhau</li>
              <li>• Còn 6 vai khác đang chờ bạn khám phá!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <p className="text-emerald-300/50 text-[10px] text-center italic">
            Chuyển sang tab "Alien" trên trang chủ để bắt đầu
          </p>
          <button
            onClick={handleClose}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              color: '#0a1a0a',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(74,222,128,0.4)',
            }}
          >
            <Icon name="sparkle" size={16} /> Bắt đầu cuộc xâm lăng!
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import RoleIcon from './RoleIcon';
import Icon from './Icon';

// Version key — bump this when adding a new update popup
const UPDATE_VERSION = 'v1_prince_cursed_auraseer';
const STORAGE_KEY = `onw_seen_update_${UPDATE_VERSION}`;

const NEW_ROLES = [
  {
    id: 'prince', name: 'Prince', nameVi: 'Hoàng Tử', emoji: '👑',
    team: 'village', teamColor: 'village',
    short: 'Miễn dịch vote',
    desc: 'Không thể bị treo cổ. Nếu Hoàng Tử có nhiều phiếu nhất, người đứng thứ 2 bị loại thay. Vẫn có thể bị Thợ Săn bắn.',
  },
  {
    id: 'cursed', name: 'Cursed', nameVi: 'Bị Nguyền', emoji: '🩸',
    team: 'village', teamColor: 'village',
    short: 'Trap cho Sói',
    desc: 'Nếu Sói vote bạn và bạn bị loại → Dân thắng (tính như Sói bị loại). Khiêu khích Sói target mình để "kích nổ" lời nguyền.',
  },
  {
    id: 'auraseer', name: 'Aura Seer', nameVi: 'Tiên Tri Hào Quang', emoji: '✨',
    team: 'village', teamColor: 'village',
    short: 'Thấy ai đã hành động',
    desc: 'Thức dậy giữa đêm. Thấy ai ĐÃ xem hoặc đổi bài. Đối chiếu với khai báo của mọi người để bắt Sói nói dối.',
  },
];

const TEAM_BG = {
  village: 'bg-village-400/10 border-village-400/30',
  werewolf: 'bg-wolf-500/10 border-wolf-500/30',
};

export default function UpdatePopup({ onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if not seen before
    if (!localStorage.getItem(STORAGE_KEY)) {
      // Small delay so home screen renders first
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
      style={{ background: 'rgba(10, 11, 24, 0.85)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 30, 70, 0.95), rgba(20, 20, 40, 0.95))',
          borderColor: 'rgba(196, 168, 107, 0.3)',
          boxShadow: '0 10px 40px rgba(168, 85, 247, 0.3), 0 0 0 1px rgba(196, 168, 107, 0.15)',
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

        {/* Header */}
        <div className="px-5 pt-6 pb-4 text-center border-b border-white/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold mb-2">
            <span className="animate-pulse">●</span> CẬP NHẬT MỚI
          </div>
          <h2 className="text-xl font-bold text-moon-300 mb-1">3 vai mới đã sẵn sàng!</h2>
          <p className="text-white/40 text-xs">Từ bản mở rộng Daybreak</p>
        </div>

        {/* Role cards */}
        <div className="px-4 py-4 space-y-3">
          {NEW_ROLES.map(role => (
            <div
              key={role.id}
              className={`flex gap-3 p-3 rounded-xl border ${TEAM_BG[role.teamColor]}`}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <RoleIcon roleId={role.id} size={56} className="!rounded-lg" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-base">{role.emoji}</span>
                  <h3 className="font-bold text-white text-sm">{role.nameVi}</h3>
                  <span className="text-white/30 text-[10px]">{role.name}</span>
                </div>
                <p className="text-village-400 text-[11px] font-semibold mb-1">{role.short}</p>
                <p className="text-white/60 text-[11px] leading-relaxed">{role.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <p className="text-white/30 text-[10px] text-center italic">
            Xem chi tiết đầy đủ trong Thư viện nhân vật
          </p>
          <button
            onClick={handleClose}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
          >
            <Icon name="sparkle" size={16} /> Đã hiểu, bắt đầu chơi!
          </button>
        </div>
      </div>
    </div>
  );
}

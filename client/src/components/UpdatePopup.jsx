import { useState, useEffect } from 'react';
import Icon from './Icon';

// Version key — bump this when adding a new update popup
const UPDATE_VERSION = 'v5_1_one_night_office';
const STORAGE_KEY = `onw_seen_update_${UPDATE_VERSION}`;

const OFFICE_FEATURES = [
  {
    emoji: '🐍', title: 'Phe Rắn (Toxic) — 4 vai',
    desc: 'Trưởng Phòng Toxic + Stalker + Snoop + 2 Rắn Văn Phòng. Trưởng phòng có "lá Rắn bổ sung" để biến nạn nhân thành đồng bọn giữa đêm.',
  },
  {
    emoji: '💼', title: 'Phe Nhân Viên — 7 vai',
    desc: 'CEO (Seer), Poacher (Robber), HR (Troublemaker), Paranoid (Insomniac), Legal (Revealer), Tracker (đếm Rắn ngồi cạnh), Spammer (ping hàng xóm).',
  },
  {
    emoji: '🐟', title: 'Phe Ishikoi — 2 vai',
    desc: 'Ishikoi thắng nếu bị vote. Cộng Đồng Mạng biết mặt Ishikoi và đẩy dư luận. Không có Ishikoi → Netizen tự gánh điều kiện thắng.',
  },
  {
    emoji: '🤝', title: 'Outsourcing — Hóa Thân từ bài giữa',
    desc: 'Nhân Viên Thời Vụ thức dậy ĐẦU TIÊN. Xem 1 bài giữa và biến thành vai đó cả game. Hành động ngay nếu vai mới có lượt đêm.',
  },
  {
    emoji: '⚖️', title: 'Legal — Thanh tra nội bộ',
    desc: 'Lật ngửa 1 bài người khác. Là Rắn/Ishikoi → úp lại (chỉ Legal biết). Là Nhân Viên → công khai cho cả phòng thấy.',
  },
  {
    emoji: '📨', title: 'Spammer — Ping hàng xóm',
    desc: 'Chọn 1 hàng xóm để làm phiền. Họ sẽ nhận thông báo "có Spammer ở bên TRÁI/PHẢI" nhưng không biết bài Spammer là gì.',
  },
];

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
      style={{ background: 'rgba(20, 5, 15, 0.92)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(50, 15, 35, 0.96), rgba(30, 10, 25, 0.96))',
          borderColor: 'rgba(244, 114, 182, 0.35)',
          boxShadow: '0 10px 50px rgba(244, 114, 182, 0.35), 0 0 0 1px rgba(244, 114, 182, 0.2)',
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
        <div className="px-5 pt-6 pb-4 text-center border-b border-rose-400/15 relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top, rgba(244,114,182,0.15) 0%, transparent 70%)',
          }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 text-xs font-bold mb-3">
              <span className="animate-pulse">✨</span> CHẾ ĐỘ MỚI
            </div>

            <img
              src="/images/logo-one-night-office.png"
              alt="One Night Office"
              className="w-32 h-32 mx-auto mb-2 object-contain drop-shadow-[0_0_24px_rgba(244,114,182,0.5)]"
              draggable={false}
            />

            <h2 className="text-2xl font-bold text-rose-300 mb-1" style={{
              textShadow: '0 0 12px rgba(244,114,182,0.5)',
            }}>
              ONE NIGHT OFFICE
            </h2>
            <p className="text-rose-400/70 text-xs italic">
              "Drama công sở. 3 phe. Một đêm để lật mặt nhau."
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="px-4 py-4 space-y-2.5">
          <div className="text-center mb-3">
            <p className="text-white/80 text-sm font-semibold">14 vai · 3 phe · Drama văn phòng</p>
            <p className="text-white/40 text-xs italic mt-0.5">Mở tab "Office" ở màn hình chính để chơi</p>
          </div>

          {OFFICE_FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex gap-3 p-2.5 rounded-xl border bg-rose-500/5 border-rose-500/20"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-rose-500/15 flex items-center justify-center text-xl">
                {f.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-rose-300 text-sm mb-0.5">{f.title}</h3>
                <p className="text-white/55 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}

          {/* Win conditions */}
          <div className="mt-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/15">
            <p className="text-rose-300/90 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <span>🏆</span> Điều kiện thắng
            </p>
            <ul className="text-white/55 text-[11px] space-y-1 leading-relaxed">
              <li>• <strong className="text-rose-300">Phe Rắn</strong> thắng nếu KHÔNG có Rắn bị sa thải.</li>
              <li>• <strong className="text-sky-300">Phe Nhân Viên</strong> thắng nếu có Rắn bị sa thải.</li>
              <li>• <strong className="text-amber-300">Phe Ishikoi</strong> thắng nếu Ishikoi bị vote — có thể độc quyền (Snake & Staff đều thua).</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <p className="text-rose-300/50 text-[10px] text-center italic">
            Chọn tab "Office" để mở phòng — 3–10 người, 1 đêm, drama công sở
          </p>
          <button
            onClick={handleClose}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #f43f5e, #be185d)',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(244,114,182,0.4)',
            }}
          >
            <Icon name="sparkle" size={16} /> Vào phòng Office
          </button>
        </div>
      </div>
    </div>
  );
}

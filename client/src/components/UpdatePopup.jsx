import { useState, useEffect } from 'react';
import Icon from './Icon';

// Version key — bump this when adding a new update popup
const UPDATE_VERSION = 'v4_the_ripple';
const STORAGE_KEY = `onw_seen_update_${UPDATE_VERSION}`;

const RIPPLE_FEATURES = [
  {
    emoji: '⚡', title: 'The Ripple — Vết Nứt Thời Không',
    desc: 'Sau đêm, có 35% cơ hội (hoặc Oracle kích hoạt) để The Ripple xảy ra — một sự kiện bất ngờ thay đổi cục diện trận đấu.',
  },
  {
    emoji: '🔄', title: 'Vòng Lặp Thời Gian',
    desc: 'Đêm diễn ra lần nữa! Tất cả vai (trừ Oracle) thực hiện hành động mới với chỉ thị mới từ Echo.',
  },
  {
    emoji: '⏱️', title: 'Thời Gian Co Lại',
    desc: 'Thời gian thảo luận chỉ còn 1 phút — mọi thứ phải nhanh hơn!',
  },
  {
    emoji: '🤐', title: 'Lời Nguyền Câm Lặng',
    desc: 'Một số người chơi bị CẤM NÓI và không thể chat cho đến khi bỏ phiếu.',
  },
  {
    emoji: '🙈', title: 'Quay Mặt Đi',
    desc: 'Một số người chơi phải quay mặt — không thể bị vote trong lượt bỏ phiếu.',
  },
  {
    emoji: '🔀', title: 'Hành Động Bổ Sung',
    desc: 'Hoán đổi, cướp bài, xem bài, lật bài, vote 2 phiếu... và nhiều hơn nữa — tổng cộng 15 sự kiện ngẫu nhiên!',
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
      style={{ background: 'rgba(10, 5, 20, 0.92)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(25, 15, 50, 0.96), rgba(15, 10, 30, 0.96))',
          borderColor: 'rgba(139, 92, 246, 0.35)',
          boxShadow: '0 10px 50px rgba(139, 92, 246, 0.35), 0 0 0 1px rgba(139, 92, 246, 0.2)',
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
        <div className="px-5 pt-6 pb-4 text-center border-b border-purple-400/15 relative overflow-hidden">
          {/* Vortex background */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.15) 0%, transparent 70%)',
          }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-300 text-xs font-bold mb-3">
              <span className="animate-pulse">⚡</span> CẬP NHẬT MỚI
            </div>

            <img
              src="/images/oracle special event/the-ripple-event.webp"
              alt="The Ripple"
              className="w-28 h-28 mx-auto mb-2 object-contain drop-shadow-[0_0_24px_rgba(139,92,246,0.5)]"
              draggable={false}
            />

            <h2 className="text-2xl font-bold text-purple-300 mb-1" style={{
              textShadow: '0 0 12px rgba(139,92,246,0.5)',
            }}>
              THE RIPPLE
            </h2>
            <p className="text-purple-400/70 text-xs italic">
              "Không gian rung chuyển... vết nứt thời không xuất hiện giữa đêm khuya."
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="px-4 py-4 space-y-2.5">
          <div className="text-center mb-3">
            <p className="text-white/80 text-sm font-semibold">15 sự kiện ngẫu nhiên · Thay đổi mọi trận đấu</p>
            <p className="text-white/40 text-xs italic mt-0.5">Chế độ Alien — Bật "The Ripple" trong cài đặt phòng</p>
          </div>

          {RIPPLE_FEATURES.map((f, i) => (
            <div
              key={i}
              className="flex gap-3 p-2.5 rounded-xl border bg-purple-500/5 border-purple-500/20"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center text-xl">
                {f.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-purple-300 text-sm mb-0.5">{f.title}</h3>
                <p className="text-white/55 text-[11px] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}

          {/* Additional features box */}
          <div className="mt-3 p-3 rounded-xl bg-purple-500/5 border border-purple-500/15">
            <p className="text-purple-300/90 text-xs font-semibold mb-1 flex items-center gap-1.5">
              <span>✨</span> Cải tiến khác
            </p>
            <ul className="text-white/55 text-[11px] space-y-0.5 leading-relaxed">
              <li>• <strong className="text-purple-300">Hiệu ứng lật bài</strong> — animation 3D khi xem/đổi/cướp bài</li>
              <li>• <strong className="text-purple-300">Background & BGM</strong> riêng khi The Ripple diễn ra</li>
              <li>• <strong className="text-purple-300">Echo nâng cấp</strong> — giọng điệu mới, cửa sổ lớn hơn</li>
              <li>• <strong className="text-purple-300">Oracle mỉa mai</strong> — câu thoại mới khi Oracle từ chối xem bài</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 space-y-2">
          <p className="text-purple-300/50 text-[10px] text-center italic">
            Bật "The Ripple" trong phòng Alien để trải nghiệm
          </p>
          <button
            onClick={handleClose}
            className="btn-primary w-full text-sm flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              color: '#fff',
              fontWeight: 700,
              boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
            }}
          >
            <Icon name="sparkle" size={16} /> Khám phá ngay!
          </button>
        </div>
      </div>
    </div>
  );
}

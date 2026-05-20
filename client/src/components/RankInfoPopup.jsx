import { useState } from 'react';

const RANKS = [
  { tier: 1, name: 'Iron', nameVi: 'Sắt', minPoints: 0, image: '1-iron.png' },
  { tier: 2, name: 'Bronze', nameVi: 'Đồng', minPoints: 500, image: '2-bronze.png' },
  { tier: 3, name: 'Silver', nameVi: 'Bạc', minPoints: 1000, image: '3-silver.png' },
  { tier: 4, name: 'Gold', nameVi: 'Vàng', minPoints: 1500, image: '4-gold.png' },
  { tier: 5, name: 'WhiteGold', nameVi: 'Bạch Kim', minPoints: 2000, image: '5-whitegold.png' },
  { tier: 6, name: 'Diamond', nameVi: 'Kim Cương', minPoints: 2500, image: '6-diamond.png' },
  { tier: 7, name: 'Elite', nameVi: 'Tinh Anh', minPoints: 3500, image: '7-elite.png' },
  { tier: 8, name: 'Challenger', nameVi: 'Thách Đấu', minPoints: 5000, image: '8-challenger.png' },
];

const TIER_COLORS = {
  1: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  2: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
  3: 'text-gray-300 bg-gray-300/10 border-gray-300/20',
  4: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  5: 'text-yellow-100 bg-yellow-100/10 border-yellow-100/20',
  6: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20',
  7: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  8: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export default function RankInfoPopup({ currentRank, currentPoints, onClose }) {
  const [tab, setTab] = useState('ranks');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white/90">Hệ thống Rank</h2>
            <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none">&times;</button>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setTab('ranks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'ranks' ? 'bg-moon-400/20 text-moon-300' : 'text-white/40 hover:text-white/60'}`}
            >
              Bảng Rank
            </button>
            <button
              onClick={() => setTab('scoring')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'scoring' ? 'bg-moon-400/20 text-moon-300' : 'text-white/40 hover:text-white/60'}`}
            >
              Cách tính điểm
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {tab === 'ranks' ? (
            <RanksTable currentRank={currentRank} currentPoints={currentPoints} />
          ) : (
            <ScoringExplainer />
          )}
        </div>
      </div>
    </div>
  );
}

function RanksTable({ currentRank, currentPoints }) {
  return (
    <div className="space-y-2">
      {RANKS.map(rank => {
        const isCurrent = currentRank?.tier === rank.tier;
        const nextRank = RANKS.find(r => r.tier === rank.tier + 1);
        const maxPts = nextRank ? nextRank.minPoints - 1 : 5000;

        return (
          <div
            key={rank.tier}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
              isCurrent
                ? `${TIER_COLORS[rank.tier]} ring-1 ring-current`
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            <img
              src={`/images/${rank.image}`}
              alt={rank.name}
              className="w-10 h-10 object-contain flex-shrink-0"
              draggable={false}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isCurrent ? '' : 'text-white/70'}`}>
                  {rank.nameVi}
                </span>
                <span className="text-[10px] text-white/30">{rank.name}</span>
                {isCurrent && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-moon-400/20 text-moon-300 font-medium">
                    Hiện tại
                  </span>
                )}
              </div>
              <div className="text-[11px] text-white/40 mt-0.5">
                {rank.minPoints} — {maxPts} điểm
              </div>
              {isCurrent && currentPoints != null && (
                <div className="mt-1.5">
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-current h-1.5 rounded-full transition-all"
                      style={{
                        width: `${nextRank ? Math.min(100, ((currentPoints - rank.minPoints) / (nextRank.minPoints - rank.minPoints)) * 100) : 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5">
                    {currentPoints} / {nextRank ? nextRank.minPoints : 5000} pts
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoringExplainer() {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-2">
        <h3 className="font-bold text-moon-300">Công thức tính điểm</h3>
        <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-wolf-400 font-mono text-xs mt-0.5">THUA</span>
            <p className="text-white/60 text-xs">Mỗi người thua <span className="text-wolf-400 font-bold">-5 điểm</span></p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-village-400 font-mono text-xs mt-0.5">THẮNG</span>
            <p className="text-white/60 text-xs">
              Tổng pool = <span className="text-moon-300">Số người thua x 5 x 2</span>
              <br />
              Mỗi người thắng nhận = <span className="text-village-400 font-bold">Pool / Số người thắng</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-moon-300">Ví dụ minh họa</h3>

        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/50 mb-2 font-medium">Bàn 8 người — Tanner thắng 1 mình</p>
          <div className="space-y-1 text-xs text-white/50">
            <p>7 người thua: 7 x (-5) = <span className="text-wolf-400">-35 điểm</span></p>
            <p>Pool: 7 x 5 x 2 = <span className="text-moon-300">70</span></p>
            <p>Tanner nhận: 70 / 1 = <span className="text-village-400 font-bold">+70 điểm</span></p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/50 mb-2 font-medium">Bàn 8 người — 2 Sói thắng, 6 Dân thua</p>
          <div className="space-y-1 text-xs text-white/50">
            <p>6 người thua: 6 x (-5) = <span className="text-wolf-400">-30 điểm</span></p>
            <p>Pool: 6 x 5 x 2 = <span className="text-moon-300">60</span></p>
            <p>Mỗi Sói: 60 / 2 = <span className="text-village-400 font-bold">+30 điểm</span></p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-xs text-white/50 mb-2 font-medium">Bàn 6 người — 4 Dân thắng, 2 Sói thua</p>
          <div className="space-y-1 text-xs text-white/50">
            <p>2 người thua: 2 x (-5) = <span className="text-wolf-400">-10 điểm</span></p>
            <p>Pool: 2 x 5 x 2 = <span className="text-moon-300">20</span></p>
            <p>Mỗi Dân: 20 / 4 = <span className="text-village-400 font-bold">+5 điểm</span></p>
          </div>
        </div>
      </div>

      <div className="bg-moon-400/10 rounded-xl p-3 border border-moon-400/20">
        <h3 className="font-bold text-moon-300 text-xs mb-1.5">Lưu ý</h3>
        <ul className="text-xs text-white/50 space-y-1">
          <li>• Điểm tối thiểu: 0 — không bao giờ bị âm</li>
          <li>• Điểm tối đa: 5,000 (Challenger)</li>
          <li>• Bàn càng đông, thắng càng nhiều điểm</li>
          <li>• Thắng ít người = chia nhiều điểm hơn</li>
        </ul>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import RankBadge from './RankBadge';
import Icon from './Icon';

export default function RankUpPopup({ rankUp, onClose }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!rankUp) return;
    setStage(0);
    const t1 = setTimeout(() => setStage(1), 100);
    const t2 = setTimeout(() => setStage(2), 600);
    const t3 = setTimeout(() => setStage(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [rankUp]);

  if (!rankUp) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div className={`absolute inset-0 transition-opacity duration-500 ${stage >= 1 ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'radial-gradient(circle, rgba(196,168,107,0.2) 0%, rgba(0,0,0,0.9) 70%)' }}
      />

      <div className={`relative text-center transition-all duration-700 ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
        {/* Particle ring */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ${stage >= 2 ? 'opacity-100' : 'opacity-0'}`}>
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-moon-400"
              style={{
                transform: `rotate(${i * 30}deg) translateY(-80px)`,
                animation: stage >= 2 ? `rankParticle 2s ease-out ${i * 0.1}s infinite` : 'none',
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        <div className={`transition-all duration-500 ${stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <p className="text-moon-400/60 text-sm font-medium tracking-widest uppercase mb-2">Thăng hạng</p>
        </div>

        <div className={`transition-all duration-700 ${stage >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
          <RankBadge rank={rankUp} size={120} showName={false} />
        </div>

        <div className={`mt-4 transition-all duration-500 ${stage >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-2xl font-bold text-moon-300 mb-1">{rankUp.nameVi}</h2>
          <p className="text-white/40 text-sm">Chạm để đóng</p>
        </div>
      </div>
    </div>
  );
}

export function DemotedPopup({ newRank, onClose }) {
  if (!newRank) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4" onClick={onClose}>
      <div className="text-center">
        <div className="mb-3 text-wolf-400"><Icon name="skull" size={40} /></div>
        <p className="text-wolf-400/60 text-sm font-medium tracking-widest uppercase mb-4">Tụt hạng</p>
        <RankBadge rank={newRank} size={80} showName />
        <p className="text-white/40 text-sm mt-4">Chạm để đóng</p>
      </div>
    </div>
  );
}

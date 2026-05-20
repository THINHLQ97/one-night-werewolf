const RANK_COLORS = {
  1: 'text-gray-400',
  2: 'text-amber-600',
  3: 'text-gray-300',
  4: 'text-yellow-400',
  5: 'text-yellow-100',
  6: 'text-cyan-300',
  7: 'text-purple-400',
  8: 'text-red-400',
};

export default function RankBadge({ rank, size = 48, showName = false, className = '' }) {
  if (!rank) return null;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <img
          src={`/images/${rank.image}`}
          alt={rank.name}
          className="w-full h-full object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.15)]"
          draggable={false}
        />
      </div>
      {showName && (
        <span className={`text-[10px] font-bold mt-0.5 ${RANK_COLORS[rank.tier] || 'text-white/60'}`}>
          {rank.nameVi}
        </span>
      )}
    </div>
  );
}

export function RankFrame({ rank, size = 56, children, className = '' }) {
  if (!rank) {
    return <div className={className}>{children}</div>;
  }

  const frameSize = size + 16;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: frameSize, height: frameSize }}>
      {children}
      <img
        src={`/images/${rank.image}`}
        alt={rank.name}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        draggable={false}
        style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.1))' }}
      />
    </div>
  );
}

export function PointsBadge({ points, delta, className = '' }) {
  if (points == null) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-xs ${className}`}>
      <span className="text-moon-400 font-medium">{points} pts</span>
      {delta != null && delta !== 0 && (
        <span className={delta > 0 ? 'text-green-400' : 'text-wolf-400'}>
          {delta > 0 ? '+' : ''}{delta}
        </span>
      )}
    </span>
  );
}

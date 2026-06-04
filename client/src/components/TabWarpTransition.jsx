import { useEffect, useState, useRef } from 'react';

/**
 * Cosmic warp transition between game modes.
 * Plays for 1.2s when gameMode changes to/from 'alien'.
 *
 * Visual:
 *  - 80 starlines streaking from center outward (hyperspace effect)
 *  - Green/purple radial flash
 *  - CRT scanline sweep
 *  - Brief "ALIEN SIGNAL" pulse text
 */
export default function TabWarpTransition({ gameMode, prevMode }) {
  const [active, setActive] = useState(false);
  const [direction, setDirection] = useState('in'); // 'in' = to alien, 'out' = from alien
  const lastModeRef = useRef(gameMode);

  useEffect(() => {
    if (lastModeRef.current === gameMode) return;
    const wasAlien = lastModeRef.current === 'alien';
    const isAlien = gameMode === 'alien';
    lastModeRef.current = gameMode;
    if (wasAlien === isAlien) return;

    setDirection(isAlien ? 'in' : 'out');
    setActive(true);
    const t = setTimeout(() => setActive(false), 1200);
    return () => clearTimeout(t);
  }, [gameMode]);

  if (!active) return null;

  const isAlien = direction === 'in';
  const accentColor = isAlien ? 'rgba(74, 222, 128, 0.9)' : 'rgba(196, 168, 107, 0.85)';
  const accentSoft = isAlien ? 'rgba(74, 222, 128, 0.25)' : 'rgba(196, 168, 107, 0.25)';
  const bgColor = isAlien ? 'rgba(5, 15, 5, 1)' : 'rgba(15, 10, 25, 1)';

  // Generate 80 starlines with random angles + delays
  const starlines = Array.from({ length: 80 }, (_, i) => {
    const angle = (i / 80) * 360 + Math.random() * 8;
    const delay = Math.random() * 0.15;
    const distance = 80 + Math.random() * 50; // vh
    const thickness = 0.5 + Math.random() * 1.5;
    const length = 8 + Math.random() * 25;
    return { angle, delay, distance, thickness, length, key: i };
  });

  return (
    <div
      className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
      style={{ animation: 'warpFade 1.2s ease-out forwards' }}
    >
      {/* Solid color flash background */}
      <div
        className="absolute inset-0"
        style={{
          background: bgColor,
          animation: 'warpBgFade 1.2s ease-out forwards',
        }}
      />

      {/* Radial flash (center burst) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at center, ${accentColor} 0%, ${accentSoft} 25%, transparent 60%)`,
          animation: 'warpFlash 1.2s ease-out forwards',
        }}
      />

      {/* Starlines emanating from center */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: '1px', height: '1px' }}>
          {starlines.map(s => (
            <div
              key={s.key}
              className="absolute"
              style={{
                top: '0',
                left: '0',
                width: `${s.length}vh`,
                height: `${s.thickness}px`,
                background: `linear-gradient(to right, transparent, ${accentColor}, transparent)`,
                transform: `rotate(${s.angle}deg) translateX(0)`,
                transformOrigin: '0 50%',
                animation: `warpStreak 0.9s cubic-bezier(0.55, 0, 0.85, 0.5) ${s.delay}s forwards`,
                '--end-distance': `${s.distance}vh`,
                opacity: 0,
              }}
            />
          ))}
        </div>
      </div>

      {/* CRT scanline sweep (only for alien direction) */}
      {isAlien && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${accentSoft} 2px, ${accentSoft} 3px)`,
            opacity: 0,
            animation: 'warpScanline 1.2s ease-out forwards',
          }}
        />
      )}

      {/* Center label */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ animation: 'warpLabel 1.2s ease-out forwards' }}
      >
        <div className="text-center">
          <p
            className="uppercase tracking-[0.4em] text-xs sm:text-sm"
            style={{
              color: accentColor,
              textShadow: `0 0 16px ${accentColor}, 0 0 32px ${accentSoft}`,
              fontFamily: isAlien ? "'VT323', monospace" : "'Segoe UI', system-ui",
              fontSize: isAlien ? '24px' : '14px',
            }}
          >
            {isAlien ? '◢ INCOMING SIGNAL ◣' : '◢ RETURNING ◣'}
          </p>
          <p
            className="mt-2 text-xs"
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: isAlien ? "'VT323', monospace" : "'Segoe UI', system-ui",
              fontSize: isAlien ? '18px' : '11px',
            }}
          >
            {isAlien ? 'connecting to echo from space...' : 'back to the village'}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes warpFade {
          0% { opacity: 0; }
          5% { opacity: 1; }
          85% { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes warpBgFade {
          0% { opacity: 0; }
          15% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes warpFlash {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.1); }
          60% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes warpStreak {
          0% {
            opacity: 0;
            transform: rotate(var(--angle, 0deg)) translateX(0) scaleX(0.3);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateX(var(--end-distance, 80vh)) scaleX(1.5);
          }
        }
        @keyframes warpScanline {
          0% { opacity: 0; transform: translateY(-100%); }
          30% { opacity: 0.4; }
          70% { opacity: 0.3; }
          100% { opacity: 0; transform: translateY(100%); }
        }
        @keyframes warpLabel {
          0% { opacity: 0; transform: scale(0.6); filter: blur(8px); }
          25% { opacity: 1; transform: scale(1); filter: blur(0px); }
          70% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0; transform: scale(1.2); filter: blur(4px); }
        }
      `}</style>
    </div>
  );
}

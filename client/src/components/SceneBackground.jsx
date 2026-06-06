import { useState, useEffect } from 'react';

const SCENE_PATHS = {
  werewolf: {
    night: '/images/night-scene.png',
    day: '/images/day-scene.png',
  },
  alien: {
    night: '/images/scene-alien/Alien-Night-Scene.png',
    day: '/images/scene-alien/Alien-Day-Scene.png',
    ripple: '/images/scene-alien/Alien-The-Ripple-Scene.webp',
  },
};

/**
 * Day/night scene background with crossfade transition.
 * Switches asset set based on gameMode.
 *
 * @param {'night'|'day'|'ripple'|null} scene
 * @param {'werewolf'|'alien'} gameMode
 */
export default function SceneBackground({ scene, gameMode = 'werewolf' }) {
  const paths = SCENE_PATHS[gameMode] || SCENE_PATHS.werewolf;
  const [loaded, setLoaded] = useState({ day: false, night: false, ripple: false });

  useEffect(() => {
    setLoaded({ day: false, night: false, ripple: false });

    const dayImg = new Image();
    dayImg.src = paths.day;
    dayImg.onload = () => setLoaded(s => ({ ...s, day: true }));

    const nightImg = new Image();
    nightImg.src = paths.night;
    nightImg.onload = () => setLoaded(s => ({ ...s, night: true }));

    if (paths.ripple) {
      const rippleImg = new Image();
      rippleImg.src = paths.ripple;
      rippleImg.onload = () => setLoaded(s => ({ ...s, ripple: true }));
    }
  }, [paths.day, paths.night, paths.ripple]);

  if (!scene) return null;

  const isDay = scene === 'day';
  const isRipple = scene === 'ripple';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Night scene */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: loaded.night ? `url('${paths.night}')` : 'none',
          opacity: (!isDay && !isRipple) ? 1 : 0,
        }}
      />

      {/* Day scene */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: loaded.day ? `url('${paths.day}')` : 'none',
          opacity: isDay ? 1 : 0,
        }}
      />

      {/* Ripple scene */}
      {paths.ripple && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
          style={{
            backgroundImage: loaded.ripple ? `url('${paths.ripple}')` : 'none',
            opacity: isRipple ? 1 : 0,
            zIndex: 1,
          }}
        />
      )}

      {/* Dark overlay */}
      <div
        className="absolute inset-0 transition-colors duration-[1500ms] ease-in-out"
        style={{
          backgroundColor: isRipple ? 'rgba(0, 0, 0, 0.25)' : isDay ? 'rgba(0, 0, 0, 0.30)' : 'rgba(0, 0, 0, 0.35)',
          zIndex: 2,
        }}
      />

      {/* Ripple glitch/static overlay */}
      {isRipple && (
        <div style={{ zIndex: 3 }}>
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(139,92,246,0.03) 3px, rgba(139,92,246,0.03) 4px)',
            animation: 'rippleGlitchScan 8s linear infinite',
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            animation: 'rippleGlitchBars 4s step-end infinite',
          }} />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(139,92,246,0.08) 100%)',
            animation: 'rippleVignettePulse 3s ease-in-out infinite',
          }} />
          <style>{`
            @keyframes rippleGlitchScan {
              0% { transform: translateY(0); }
              100% { transform: translateY(4px); }
            }
            @keyframes rippleGlitchBars {
              0%, 92%, 100% { background: none; }
              93% { background: linear-gradient(transparent 20%, rgba(139,92,246,0.06) 20.5%, rgba(139,92,246,0.06) 21%, transparent 21.5%, transparent 45%, rgba(168,85,247,0.04) 45.5%, rgba(168,85,247,0.04) 46.5%, transparent 47%); }
              96% { background: linear-gradient(transparent 60%, rgba(139,92,246,0.07) 60.5%, rgba(139,92,246,0.07) 62%, transparent 62.5%, transparent 80%, rgba(168,85,247,0.05) 80.5%, rgba(168,85,247,0.05) 81%, transparent 81.5%); }
            }
            @keyframes rippleVignettePulse {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';

const SCENE_PATHS = {
  werewolf: {
    night: '/images/night-scene.png',
    day: '/images/day-scene.png',
  },
  alien: {
    night: '/images/scene-alien/Alien-Night-Scene.png',
    day: '/images/scene-alien/Alien-Day-Scene.png',
  },
};

/**
 * Day/night scene background with crossfade transition.
 * Switches asset set based on gameMode.
 *
 * @param {'night'|'day'|null} scene
 * @param {'werewolf'|'alien'} gameMode
 */
export default function SceneBackground({ scene, gameMode = 'werewolf' }) {
  const paths = SCENE_PATHS[gameMode] || SCENE_PATHS.werewolf;
  const [loaded, setLoaded] = useState({ day: false, night: false });

  // Preload both images on mount + when gameMode changes
  useEffect(() => {
    setLoaded({ day: false, night: false });

    const dayImg = new Image();
    dayImg.src = paths.day;
    dayImg.onload = () => setLoaded(s => ({ ...s, day: true }));

    const nightImg = new Image();
    nightImg.src = paths.night;
    nightImg.onload = () => setLoaded(s => ({ ...s, night: true }));
  }, [paths.day, paths.night]);

  if (!scene) return null;

  const isDay = scene === 'day';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Night scene */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: loaded.night ? `url('${paths.night}')` : 'none',
          opacity: isDay ? 0 : 1,
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

      {/* Dark overlay to keep UI readable */}
      <div
        className="absolute inset-0 transition-colors duration-[1500ms] ease-in-out"
        style={{
          backgroundColor: isDay ? 'rgba(0, 0, 0, 0.30)' : 'rgba(0, 0, 0, 0.35)',
        }}
      />
    </div>
  );
}

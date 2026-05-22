import { useState, useEffect } from 'react';

/**
 * Day/night scene background with crossfade transition.
 * Both images are always mounted (for smooth transitions),
 * only opacity changes. A dark overlay ensures gameplay readability.
 *
 * @param {'night'|'day'|null} scene - 'night' or 'day'. null = no scene bg.
 */
export default function SceneBackground({ scene }) {
  const [loaded, setLoaded] = useState({ day: false, night: false });

  // Preload both images on mount
  useEffect(() => {
    const dayImg = new Image();
    dayImg.src = '/images/day-scene.png';
    dayImg.onload = () => setLoaded(s => ({ ...s, day: true }));

    const nightImg = new Image();
    nightImg.src = '/images/night-scene.png';
    nightImg.onload = () => setLoaded(s => ({ ...s, night: true }));
  }, []);

  if (!scene) return null;

  const isDay = scene === 'day';

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Night scene */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: loaded.night ? 'url(/images/night-scene.png)' : 'none',
          opacity: isDay ? 0 : 1,
        }}
      />

      {/* Day scene */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-[1500ms] ease-in-out"
        style={{
          backgroundImage: loaded.day ? 'url(/images/day-scene.png)' : 'none',
          opacity: isDay ? 1 : 0,
        }}
      />

      {/* Dark overlay to keep UI readable */}
      <div
        className="absolute inset-0 transition-colors duration-[1500ms] ease-in-out"
        style={{
          backgroundColor: isDay ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.65)',
        }}
      />
    </div>
  );
}

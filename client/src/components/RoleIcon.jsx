// Map role IDs to local card images
const CARD_IMAGES = {
  werewolf: '/images/character card/Werewolf.webp',
  minion: '/images/character card/Minion.webp',
  seer: '/images/character card/Seer-0.webp',
  robber: '/images/character card/Robber.webp',
  troublemaker: '/images/character card/Troublemaker.webp',
  drunk: '/images/character card/Drunk.webp',
  insomniac: '/images/character card/Insomniac.webp',
  villager: '/images/character card/Villager.webp',
  hunter: '/images/character card/Hunter.webp',
  tanner: '/images/character card/Tanner.webp',
  mason: '/images/character card/Mason.webp',
  sentinel: '/images/character card/Sentinel.webp',
  alphawolf: '/images/character card/Alpha_wolf.webp',
  mysticwolf: '/images/character card/Mystic_wolf.webp',
  dreamwolf: '/images/character card/Dreamwolf.webp',
  apprenticeseer: '/images/character card/Apprentice_seer.webp',
  paranormalinvestigator: '/images/character card/Paranormal_investigator.webp',
  witch: '/images/character card/Witch.webp',
  villageidiot: '/images/character card/Village_idiot.webp',
  revealer: '/images/character card/Revealer.webp',
  bodyguard: '/images/character card/Bodyguard.webp',
  doppelganger: '/images/character card/Doppelganger.webp',
};

export const CARD_BACK = '/images/Card-Back.webp';

export { CARD_IMAGES };

/**
 * Renders a role card image.
 * Default: portrait aspect ratio (~3:4).
 * circular: crops into a circle focusing on the upper (face) area.
 *
 * @param {string} roleId - Role identifier
 * @param {number} size - Width in px (height auto = size * 1.4 for card mode)
 * @param {boolean} circular - If true, render as a circular face crop
 * @param {string} className - Additional CSS classes
 */
export default function RoleIcon({ roleId, size = 80, circular = false, className = '', isDoppel = false }) {
  const src = CARD_IMAGES[roleId];

  // Doppelganger overlay: purple tint + 🎭 badge
  const doppelOverlay = isDoppel ? (
    <>
      <div className="absolute inset-0 rounded-[inherit]" style={{ background: 'rgba(139, 92, 246, 0.25)', mixBlendMode: 'color', pointerEvents: 'none' }} />
      <span className="absolute flex items-center justify-center rounded-full bg-purple-600 border border-purple-400/60 shadow-lg" style={{
        bottom: -2, right: -2,
        width: Math.max(14, size * 0.32), height: Math.max(14, size * 0.32),
        fontSize: Math.max(8, size * 0.18), lineHeight: 1, pointerEvents: 'none',
      }}>🎭</span>
    </>
  ) : null;

  if (circular) {
    if (!src) {
      return (
        <div
          className={`flex items-center justify-center bg-night-700 rounded-full text-lg relative ${className}`}
          style={{ width: size, height: size }}
        >
          🃏{doppelOverlay}
        </div>
      );
    }
    return (
      <div
        className={`rounded-full overflow-visible flex-shrink-0 relative ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="rounded-full overflow-hidden bg-night-800" style={{ width: size, height: size }}>
          <img
            src={src}
            alt={roleId}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }}
            draggable={false}
          />
          {isDoppel && <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(139, 92, 246, 0.25)', mixBlendMode: 'color', pointerEvents: 'none' }} />}
        </div>
        {isDoppel && (
          <span className="absolute flex items-center justify-center rounded-full bg-purple-600 border border-purple-400/60 shadow-lg" style={{
            bottom: -1, right: -1,
            width: Math.max(12, size * 0.35), height: Math.max(12, size * 0.35),
            fontSize: Math.max(7, size * 0.2), lineHeight: 1, pointerEvents: 'none', zIndex: 2,
          }}>🎭</span>
        )}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-night-700 rounded-lg text-2xl relative ${className}`}
        style={{ width: size, height: Math.round(size * 1.4) }}
      >
        🃏{doppelOverlay}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: Math.round(size * 1.4) }}>
      <img
        src={src}
        alt={roleId}
        className="rounded-lg object-cover"
        style={{ width: size, height: Math.round(size * 1.4) }}
        draggable={false}
      />
      {doppelOverlay}
    </div>
  );
}

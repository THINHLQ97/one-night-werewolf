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
export default function RoleIcon({ roleId, size = 80, circular = false, className = '' }) {
  const src = CARD_IMAGES[roleId];

  if (circular) {
    if (!src) {
      return (
        <div
          className={`flex items-center justify-center bg-night-700 rounded-full text-lg ${className}`}
          style={{ width: size, height: size }}
        >
          🃏
        </div>
      );
    }
    // Circular crop — zoom into the upper-center area (face)
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 bg-night-800 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={src}
          alt={roleId}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 25%' }}
          draggable={false}
        />
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-night-700 rounded-lg text-2xl ${className}`}
        style={{ width: size, height: Math.round(size * 1.4) }}
      >
        🃏
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={roleId}
      className={`rounded-lg object-cover ${className}`}
      style={{ width: size, height: Math.round(size * 1.4) }}
      draggable={false}
    />
  );
}

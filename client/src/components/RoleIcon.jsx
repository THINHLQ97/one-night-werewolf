// Map role IDs to local card images
const CARD_IMAGES = {
  // ─── Werewolf ────────────────────────────────────────────────────────────────
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
  prince: '/images/character card/Prince.webp',
  cursed: '/images/character card/Cursed.webp',
  auraseer: '/images/character card/Aura_seer.webp',
  // ─── Alien ───────────────────────────────────────────────────────────────────
  alien: '/images/character card/Alien.webp',
  syntheticalien: '/images/character card/Synthetic_alien.webp',
  cow: '/images/character card/Cow-0.webp',
  groob: '/images/character card/Groob-0.webp',
  zerb: '/images/character card/Zerb-0.webp',
  leader: '/images/character card/Leader-0.webp',
  oracle: '/images/character card/Oracle-0.webp',
  psychic: '/images/character card/Psychic-0.webp',
  rascal: '/images/character card/Rascal-0.webp',
  exposer: '/images/character card/Exposer-0.webp',
  mortician: '/images/character card/Mortician-0.webp',
  blob: '/images/character card/Blob.webp',
};

export const CARD_BACK = '/images/Card-Back.webp';

export { CARD_IMAGES };

/**
 * Renders a role card image.
 * isDoppel: shows purple ring + 🎭 badge to indicate the original
 *           card was Doppelgänger that copied this role.
 */
export default function RoleIcon({ roleId, size = 80, circular = false, className = '', isDoppel = false }) {
  const src = CARD_IMAGES[roleId];

  // Purple ring shadow + saturated overlay for doppelganger
  const doppelShadow = '0 0 0 2px rgb(168, 85, 247), 0 0 12px rgba(168, 85, 247, 0.6)';
  const badgeSize = Math.max(14, size * 0.4);

  // 🎭 Badge component (always sized relative to icon)
  const renderBadge = () => isDoppel && (
    <span
      className="absolute flex items-center justify-center rounded-full bg-purple-600 shadow-lg"
      style={{
        bottom: -Math.max(2, size * 0.05),
        right: -Math.max(2, size * 0.05),
        width: badgeSize,
        height: badgeSize,
        fontSize: badgeSize * 0.6,
        lineHeight: 1,
        border: '1.5px solid #1a1a2e',
        pointerEvents: 'none',
        zIndex: 3,
      }}
    >
      🎭
    </span>
  );

  if (circular) {
    if (!src) {
      return (
        <div
          className={`flex items-center justify-center bg-night-700 rounded-full text-lg relative ${className}`}
          style={{ width: size, height: size, boxShadow: isDoppel ? doppelShadow : undefined }}
        >
          🃏{renderBadge()}
        </div>
      );
    }
    return (
      <div
        className={`flex-shrink-0 relative ${className}`}
        style={{ width: size, height: size }}
      >
        <div
          className="rounded-full overflow-hidden bg-night-800"
          style={{ width: size, height: size, boxShadow: isDoppel ? doppelShadow : undefined }}
        >
          <img
            src={src}
            alt={roleId}
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%' }}
            draggable={false}
          />
          {isDoppel && (
            <div
              className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(139, 92, 246, 0.15))', pointerEvents: 'none' }}
            />
          )}
        </div>
        {renderBadge()}
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center bg-night-700 rounded-lg text-2xl relative ${className}`}
        style={{ width: size, height: Math.round(size * 1.4), boxShadow: isDoppel ? doppelShadow : undefined }}
      >
        🃏{renderBadge()}
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: Math.round(size * 1.4) }}>
      <img
        src={src}
        alt={roleId}
        className="rounded-lg object-cover"
        style={{
          width: size,
          height: Math.round(size * 1.4),
          boxShadow: isDoppel ? doppelShadow : undefined,
        }}
        draggable={false}
      />
      {isDoppel && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.35), rgba(139, 92, 246, 0.15))', pointerEvents: 'none' }}
        />
      )}
      {renderBadge()}
    </div>
  );
}

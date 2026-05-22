import { useMemo } from 'react';
import { CARD_IMAGES, CARD_BACK } from './RoleIcon';

const CARD_ROLES = [
  'werewolf', 'seer', 'robber', 'troublemaker', 'minion',
  'drunk', 'insomniac', 'hunter', 'tanner', 'villager',
  'mason', 'witch', 'alphawolf', 'mysticwolf', 'revealer',
  'sentinel', 'paranormalinvestigator', 'bodyguard',
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function FallingCards({ count = 12 }) {
  const cards = useMemo(() => {
    const rand = seededRandom(42);
    return Array.from({ length: count }, (_, i) => {
      const role = CARD_ROLES[i % CARD_ROLES.length];
      return {
        id: i,
        role,
        left: rand() * 100,
        delay: rand() * 20,
        duration: 18 + rand() * 14,
        size: 0.55 + rand() * 0.4,
        flipDuration: 3 + rand() * 4,
        startRotate: rand() * 360,
        swayAmount: 15 + rand() * 30,
        swayDuration: 4 + rand() * 3,
      };
    });
  }, [count]);

  return (
    <div className="falling-cards-container">
      {cards.map(card => (
        <div
          key={card.id}
          className="falling-card"
          style={{
            left: `${card.left}%`,
            animationDelay: `${card.delay}s`,
            animationDuration: `${card.duration}s`,
            '--sway': `${card.swayAmount}px`,
            '--sway-duration': `${card.swayDuration}s`,
          }}
        >
          <div
            className="falling-card-inner"
            style={{
              transform: `scale(${card.size})`,
              animationDuration: `${card.flipDuration}s`,
            }}
          >
            <div className="falling-card-front" style={{ borderRadius: 10, overflow: 'hidden' }}>
              <img
                src={CARD_IMAGES[card.role]}
                alt={card.role}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>
            <div className="falling-card-back">
              <img src={CARD_BACK} alt="" draggable={false} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

import { useState, useEffect } from 'react';

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
  prince: '/images/character card/Prince.webp',
  cursed: '/images/character card/Cursed.webp',
  auraseer: '/images/character card/Aura_seer.webp',
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

const CARD_W = 80;
const CARD_H = 112;

function Card({ role, faceUp, style, className = '', label }) {
  const img = CARD_IMAGES[role];
  return (
    <div className={`card-anim-card ${className}`} style={{ width: CARD_W, height: CARD_H, perspective: '600px', ...style }}>
      <div className="card-anim-inner" style={{
        width: '100%', height: '100%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: faceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #1a1a3e 0%, #2d1b69 50%, #1a1a3e 100%)',
          border: '2px solid rgba(139,92,246,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5), inset 0 0 20px rgba(139,92,246,0.1)',
        }}>
          <div style={{
            width: '60%', height: '60%',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          }}>
            <span style={{ fontSize: 28, opacity: 0.6 }}>🐺</span>
          </div>
        </div>
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: 8,
          overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(139,92,246,0.2)',
        }}>
          {img ? (
            <img src={img} alt={role} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #2d1b69, #4c1d95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#e9d5ff', fontSize: 11, fontWeight: 600, textAlign: 'center', padding: 4,
            }}>
              {role}
            </div>
          )}
        </div>
      </div>
      {label && (
        <p style={{
          textAlign: 'center', marginTop: 4, fontSize: 11,
          color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap',
        }}>{label}</p>
      )}
    </div>
  );
}

/**
 * CardAnimation — plays a card animation overlay for night actions.
 *
 * type:
 *   'flip'   — flip card(s) face-up, hold, then flip back. Props: cards: [{ role, label }]
 *   'swap'   — two cards swap positions. Props: cards: [{ role, label }, { role, label }]
 *   'steal'  — flip target card, slide to self, give own card back. Props: cards: [{ role: targetRole, label }, { role: myRole, label }], newRole
 *   'expose' — flip center card(s) face-up and keep. Props: cards: [{ role, label }]
 *
 * onComplete() — called when animation finishes
 */
export default function CardAnimation({ type, cards = [], onComplete, newRole }) {
  const [phase, setPhase] = useState('enter'); // enter → show → exit → done

  const totalDuration = type === 'swap' ? 2400 : type === 'steal' ? 3000 : type === 'expose' ? 1800 : 2200;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 300);
    const t2 = setTimeout(() => setPhase('exit'), totalDuration - 500);
    const t3 = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, totalDuration);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [totalDuration, onComplete]);

  if (phase === 'done') return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      display: 'flex',
      justifyContent: 'center',
      padding: '12px 0',
      minHeight: CARD_H + 40,
    }}>
      {type === 'flip' && <FlipAnimation cards={cards} phase={phase} />}
      {type === 'swap' && <SwapAnimation cards={cards} phase={phase} />}
      {type === 'steal' && <StealAnimation cards={cards} phase={phase} newRole={newRole} />}
      {type === 'expose' && <ExposeAnimation cards={cards} phase={phase} />}

      <style>{KEYFRAMES}</style>
    </div>
  );
}

function FlipAnimation({ cards, phase }) {
  const faceUp = phase === 'show';
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', animation: 'cardAnimFadeIn 0.3s ease-out' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ animation: phase === 'exit' ? 'cardAnimFadeOut 0.4s ease-in forwards' : undefined }}>
          <Card role={c.role} faceUp={faceUp} label={c.label} />
        </div>
      ))}
    </div>
  );
}

function SwapAnimation({ cards, phase }) {
  const [a, b] = cards;
  const gap = 100;
  const swapping = phase === 'show';
  return (
    <div style={{
      display: 'flex', gap: gap, justifyContent: 'center', position: 'relative',
      animation: 'cardAnimFadeIn 0.3s ease-out',
    }}>
      <div style={{
        transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: swapping ? `translateX(${gap + CARD_W}px)` : 'translateX(0)',
        opacity: phase === 'exit' ? 0 : 1,
        transitionProperty: 'transform, opacity',
      }}>
        <Card role={a?.role} faceUp={false} label={a?.label} />
      </div>
      {/* Swap arrows */}
      {swapping && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 24, color: 'rgba(168,85,247,0.8)',
          animation: 'cardAnimPulse 0.7s ease-in-out',
          zIndex: 10,
        }}>
          ⇄
        </div>
      )}
      <div style={{
        transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: swapping ? `translateX(-${gap + CARD_W}px)` : 'translateX(0)',
        opacity: phase === 'exit' ? 0 : 1,
        transitionProperty: 'transform, opacity',
      }}>
        <Card role={b?.role} faceUp={false} label={b?.label} />
      </div>
    </div>
  );
}

function StealAnimation({ cards, phase, newRole }) {
  const [target, self] = cards;
  const gap = 100;
  const showPhase = phase === 'show';
  const [stealStep, setStealStep] = useState(0);

  useEffect(() => {
    if (!showPhase) return;
    const t1 = setTimeout(() => setStealStep(1), 100);    // flip target
    const t2 = setTimeout(() => setStealStep(2), 1000);   // slide to swap
    const t3 = setTimeout(() => setStealStep(3), 1800);   // flip down
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [showPhase]);

  const targetFaceUp = stealStep >= 1 && stealStep < 3;
  const swapped = stealStep >= 2;

  return (
    <div style={{
      display: 'flex', gap: gap, justifyContent: 'center', position: 'relative',
      animation: 'cardAnimFadeIn 0.3s ease-out',
    }}>
      <div style={{
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
        transform: swapped ? `translateX(${gap + CARD_W}px)` : 'translateX(0)',
        opacity: phase === 'exit' ? 0 : 1,
        zIndex: swapped ? 5 : 1,
      }}>
        <Card role={target?.role} faceUp={targetFaceUp} label={swapped ? 'Bài mới của bạn' : target?.label} />
      </div>
      {swapped && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 20, color: 'rgba(251,191,36,0.8)',
          animation: 'cardAnimPulse 0.5s ease-in-out',
          zIndex: 10,
        }}>
          🫳
        </div>
      )}
      <div style={{
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s',
        transform: swapped ? `translateX(-${gap + CARD_W}px)` : 'translateX(0)',
        opacity: phase === 'exit' ? 0 : 1,
        zIndex: swapped ? 1 : 5,
      }}>
        <Card role={self?.role} faceUp={false} label={swapped ? `Trả cho ${target?.label}` : self?.label} />
      </div>
    </div>
  );
}

function ExposeAnimation({ cards, phase }) {
  const faceUp = phase === 'show' || phase === 'exit';
  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', animation: 'cardAnimFadeIn 0.3s ease-out' }}>
      {cards.map((c, i) => (
        <div key={i} style={{
          animation: phase === 'exit' ? undefined : undefined,
          opacity: phase === 'exit' ? 0.7 : 1,
          transition: 'opacity 0.3s',
        }}>
          <Card role={c.role} faceUp={faceUp} label={c.label} />
        </div>
      ))}
    </div>
  );
}

const KEYFRAMES = `
  @keyframes cardAnimFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes cardAnimFadeOut {
    from { opacity: 1; }
    to   { opacity: 0; transform: translateY(-8px); }
  }
  @keyframes cardAnimPulse {
    0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    50%  { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 0.8; }
  }
`;

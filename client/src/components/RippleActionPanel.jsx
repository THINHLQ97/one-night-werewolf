import { useState } from 'react';
import socket from '../socket';

const ROLE_NAMES = {
  alien: 'Alien', syntheticalien: 'Synthetic Alien', cow: 'Cow', groob: 'Groob', zerb: 'Zerb',
  oracle: 'Oracle', rascal: 'Rascal', exposer: 'Exposer', psychic: 'Psychic',
  mortician: 'Mortician', leader: 'Leader', blob: 'Blob',
  werewolf: 'Werewolf', villager: 'Villager', seer: 'Seer', robber: 'Robber',
  troublemaker: 'Troublemaker', drunk: 'Drunk', insomniac: 'Insomniac',
  hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason', minion: 'Minion',
  doppelganger: 'Doppelganger', witch: 'Witch', sentinel: 'Sentinel',
};

/**
 * RippleActionPanel — full-screen overlay for interactive Ripple actions.
 * The player must choose targets before the Ripple resolves.
 */
export default function RippleActionPanel({ data, onDone }) {
  const [selected, setSelected] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const { actionId, label, description, otherPlayers = [], result } = data;

  function handleSelect(id) {
    if (submitted) return;
    if (actionId === 'troublemaker') {
      setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 2 ? [...prev, id] : prev);
    } else {
      setSelected([id]);
    }
  }

  function handleSubmit() {
    if (submitted) return;
    setSubmitted(true);
    if (actionId === 'troublemaker' && selected.length === 2) {
      socket.emit('ripple_action', { target1: selected[0], target2: selected[1] });
    } else if (actionId === 'steal' && selected.length === 1) {
      socket.emit('ripple_action', { targetPlayer: selected[0] });
    } else if (actionId === 'drunk' && selected.length === 1) {
      socket.emit('ripple_action', { centerSlot: selected[0] });
    } else if (actionId === 'witch' && selected.length === 1) {
      socket.emit('ripple_action', { centerSlot: selected[0] });
    }
  }

  function handleSelectCenter(slot) {
    if (submitted) return;
    setSelected([slot]);
  }

  const centerSlots = [
    { id: 'center0', label: 'Giữa 1' },
    { id: 'center1', label: 'Giữa 2' },
    { id: 'center2', label: 'Giữa 3' },
  ];

  const needsCenter = actionId === 'drunk' || actionId === 'witch';
  const needsPlayers = actionId === 'troublemaker' || actionId === 'steal';
  const requiredCount = actionId === 'troublemaker' ? 2 : 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      style={{ animation: 'eventFadeIn 0.5s ease-out' }}>
      <div className="max-w-md w-full px-4">
        <div className="card border-purple-500/30 bg-night-800/95">
          <div className="text-center mb-4">
            <p className="text-purple-400 text-lg font-bold mb-1">⚡ THE RIPPLE</p>
            <p className="text-purple-300 text-sm font-semibold">{label}</p>
            <p className="text-white/60 text-xs mt-1">{description}</p>
          </div>

          {/* Show result after submission */}
          {submitted && result && (
            <div className="text-center mb-4 px-3 py-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
              style={{ animation: 'eventFadeIn 0.5s ease-out' }}>
              {result.stolen && result.newRole && (
                <div>
                  <p className="text-purple-200 text-sm">Cướp bài từ: <strong className="text-purple-300">{result.targetName || '?'}</strong></p>
                  <p className="text-purple-200 text-sm">Bài mới của bạn: <strong className="text-purple-300">{ROLE_NAMES[result.newRole] || result.newRole}</strong></p>
                </div>
              )}
              {result.swapped && result.target1Name && (
                <p className="text-purple-200 text-sm">Đã hoán đổi bài: <strong>{result.target1Name}</strong> ↔ <strong>{result.target2Name}</strong></p>
              )}
              {result.swapped && !result.target1Name && actionId === 'drunk' && (
                <p className="text-purple-200 text-sm">Đã đổi bài với bài giữa.</p>
              )}
              {result.seen && (
                <p className="text-purple-200 text-sm">Bài giữa: <strong className="text-purple-300">{ROLE_NAMES[result.seen.role] || result.seen.role}</strong></p>
              )}
            </div>
          )}

          {submitted && !result && (
            <div className="text-center mb-4">
              <p className="text-white/50 text-sm">Đang xử lý...</p>
              <div className="mt-2 flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    style={{ animation: `oracleDot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Player selection */}
          {!submitted && needsPlayers && (
            <>
              <p className="text-white/40 text-xs text-center mb-2">
                Chọn {requiredCount} người chơi ({selected.length}/{requiredCount})
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {otherPlayers.map(p => (
                  <button
                    key={p.id}
                    className={`px-3 py-2 rounded-lg text-xs transition-all border text-center ${
                      selected.includes(p.id)
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
                    }`}
                    onClick={() => handleSelect(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary w-full text-sm"
                style={{ background: selected.length === requiredCount ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : undefined }}
                disabled={selected.length !== requiredCount}
                onClick={handleSubmit}
              >
                {actionId === 'steal' ? 'Cướp bài' : 'Hoán đổi'}
              </button>
            </>
          )}

          {/* Center card selection */}
          {!submitted && needsCenter && (
            <>
              <p className="text-white/40 text-xs text-center mb-2">Chọn 1 bài ở giữa</p>
              <div className="flex gap-2 justify-center mb-3">
                {centerSlots.map(s => (
                  <button
                    key={s.id}
                    className={`px-4 py-2 rounded-lg text-xs transition-all border ${
                      selected.includes(s.id)
                        ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/10'
                    }`}
                    onClick={() => handleSelectCenter(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <button
                className="btn-primary w-full text-sm"
                style={{ background: selected.length === 1 ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : undefined }}
                disabled={selected.length !== 1}
                onClick={handleSubmit}
              >
                {actionId === 'drunk' ? 'Đổi bài' : 'Xem bài'}
              </button>
            </>
          )}

          {/* Done button after result shown */}
          {submitted && result && (
            <button
              className="btn-primary w-full text-sm mt-2"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
              onClick={onDone}
            >
              Xong
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes eventFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes oracleDot {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

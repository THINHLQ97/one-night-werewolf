import { useState, useEffect, useCallback } from 'react';
import GameTable from '../components/GameTable';
import RoleIcon from '../components/RoleIcon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import { sfxCardFlip, sfxReveal } from '../audio';

const ROLE_NAMES = {
  werewolf: '🐺 Werewolf', minion: '🦹 Minion', seer: '🔮 Seer',
  robber: '🦝 Robber', troublemaker: '😈 Troublemaker', drunk: '🍺 Drunk',
  insomniac: '👁️ Insomniac', villager: '👨‍🌾 Villager', hunter: '🏹 Hunter', tanner: '💀 Tanner',
  mason: '🤝 Mason',
  sentinel: '🛡️ Sentinel', alphawolf: '🐺 Alpha Wolf', mysticwolf: '🐺 Mystic Wolf',
  dreamwolf: '🐺 Dream Wolf', apprenticeseer: '🔮 Apprentice Seer',
  paranormalinvestigator: '🕵️ P.I.', witch: '🧙 Witch', villageidiot: '🤪 Village Idiot',
  revealer: '🔦 Revealer', bodyguard: '💪 Bodyguard',
};

export default function NightScreen({ myRole, myId, nightState, players, onAction, nightKnowledge, hasAlphaWolf }) {
  const { currentRole, isMyTurn, actionData, result } = nightState;
  const [submitted, setSubmitted] = useState(false);
  const [submittedKey, setSubmittedKey] = useState(null);
  const [selected, setSelected] = useState([]);
  const [actionMode, setActionMode] = useState(null);
  const [actionStep, setActionStep] = useState('choose');
  const [roleHidden, setRoleHidden] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const step = actionData?.step || 1;
  const actionKey = `${currentRole}-${step}`;

  if (submitted && actionKey !== submittedKey) {
    setSubmitted(false);
    setSubmittedKey(null);
    setSelected([]);
    setActionMode(null);
    setActionStep('choose');
  }

  useEffect(() => {
    if (!isMyTurn || submitted) return;

    switch (currentRole) {
      case 'seer':
        setActionMode(null);
        setActionStep('choose');
        break;
      case 'robber':
      case 'sentinel':
      case 'alphawolf':
      case 'mysticwolf':
      case 'paranormalinvestigator':
      case 'revealer':
        setActionMode('player');
        setActionStep('choose');
        break;
      case 'troublemaker':
        setActionMode('player');
        setActionStep('choose');
        break;
      case 'drunk':
      case 'apprenticeseer':
        setActionMode('center');
        setActionStep('choose');
        break;
      case 'witch':
        if (step === 1) {
          setActionMode('center');
          setActionStep('choose');
        } else {
          setActionMode('player');
          setActionStep('choose');
        }
        break;
      case 'villageidiot':
        setActionMode(null);
        setActionStep('choose');
        break;
      case 'werewolf':
        if (actionData?.isSolo) {
          setActionMode('center');
          setActionStep('choose');
        } else {
          setActionStep('done');
        }
        break;
      case 'mason':
      case 'minion':
      case 'insomniac':
        setActionStep('done');
        break;
      default:
        setActionStep('done');
    }
    setSelected([]);
  }, [isMyTurn, currentRole, submitted, actionData, step]);

  function handleSelect(id) {
    sfxCardFlip();
    if (currentRole === 'troublemaker') {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
    } else if (currentRole === 'seer' && actionMode === 'center') {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
    } else {
      setSelected([id]);
    }
  }

  function handleSubmitAction() {
    let action = {};

    switch (currentRole) {
      case 'werewolf':
        if (actionData?.isSolo && selected.length === 1) {
          action = { peekCenter: selected[0] };
        }
        break;
      case 'seer':
        if (actionMode === 'player' && selected.length === 1) {
          action = { targetPlayer: selected[0] };
        } else if (actionMode === 'center' && selected.length === 2) {
          action = { centerSlots: selected };
        }
        break;
      case 'robber':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      case 'troublemaker':
        if (selected.length === 2) action = { target1: selected[0], target2: selected[1] };
        break;
      case 'drunk':
        if (selected.length === 1) action = { centerSlot: selected[0] };
        break;
      case 'sentinel':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      case 'alphawolf':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      case 'mysticwolf':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      case 'apprenticeseer':
        if (selected.length === 1) action = { centerSlot: selected[0] };
        break;
      case 'paranormalinvestigator':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      case 'witch':
        if (step === 1 && selected.length === 1) {
          action = { centerSlot: selected[0] };
        } else if (step === 2 && selected.length === 1) {
          action = { swap: true, targetPlayer: selected[0] };
        }
        break;
      case 'revealer':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      default:
        break;
    }

    onAction(currentRole, action);
    setSubmitted(true);
    setSubmittedKey(actionKey);
    setActionStep('done');
    sfxReveal();
  }

  function handleAutoSubmit(extraAction = {}) {
    onAction(currentRole, extraAction);
    setSubmitted(true);
    setSubmittedKey(actionKey);
    setActionStep('done');
  }

  const isMyRoleCalled = currentRole === myRole?.roleId;
  const canSubmit = (() => {
    if (currentRole === 'troublemaker') return selected.length === 2;
    if (currentRole === 'seer' && actionMode === 'center') return selected.length === 2;
    return selected.length === 1;
  })();

  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole = null } = nightKnowledge || {};

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col px-3 py-3 sm:p-4 max-w-lg mx-auto fade-in">
      {/* Header */}
      <div className="text-center pt-2 pb-3">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-3xl pulse-moon">🌙</span>
          <h2 className="text-lg font-semibold text-moon-300">Ban đêm</h2>
          <div className="ml-2 flex gap-1.5">
            <button
              onClick={() => setRoleHidden(h => !h)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
              title={roleHidden ? 'Hiện vai' : 'Ẩn vai'}
            >
              {roleHidden ? '🙈' : '👁️'}
            </button>
            <RoleLibraryButton onClick={() => setLibraryOpen(true)} />
          </div>
        </div>
        {myRole && !roleHidden && (
          <div className="flex items-center justify-center gap-2">
            <RoleIcon roleId={myRole.roleId} size={20} />
            <span className="text-white/50 text-sm">{myRole.name}</span>
          </div>
        )}
      </div>

      {/* Current role narration */}
      {currentRole && (
        <div className={`text-center mb-3 px-4 py-2 rounded-xl transition-all ${
          isMyRoleCalled ? 'bg-moon-400/10 border border-moon-400/30' : 'bg-white/5'
        }`}>
          <span className="text-moon-300 font-semibold">{ROLE_NAMES[currentRole]}</span>
          {isMyRoleCalled ? (
            <span className="text-moon-400 text-sm ml-2">— Đến lượt bạn!</span>
          ) : (
            <span className="text-white/30 text-sm ml-2">đang thức dậy...</span>
          )}
        </div>
      )}

      {/* Game Table */}
      <GameTable
        players={players}
        myId={myId}
        revealedPlayers={roleHidden ? {} : revealedPlayers}
        revealedCenter={roleHidden ? {} : revealedCenter}
        knownWerewolves={roleHidden ? [] : knownWerewolves}
        swappedPairs={roleHidden ? [] : swappedPairs}
        myCurrentRole={roleHidden ? null : (myCurrentRole || myRole?.roleId)}
        selectable={isMyTurn && !submitted ? actionMode : null}
        selected={selected}
        onSelect={handleSelect}
        isNight={true}
        hasAlphaWolf={hasAlphaWolf}
      />

      {/* Action Panel */}
      <div className="mt-3 flex-1">
        {isMyTurn && !submitted && (
          <div className="card fade-in">
            {/* ─── Seer ─── */}
            {currentRole === 'seer' && !actionMode && (
              <div className="text-center">
                <p className="text-white/70 text-sm mb-3">Bạn muốn xem gì?</p>
                <div className="flex gap-3 justify-center">
                  <button className="btn-ghost text-sm" onClick={() => setActionMode('player')}>👤 Bài 1 người chơi</button>
                  <button className="btn-ghost text-sm" onClick={() => setActionMode('center')}>🃏 2 bài ở giữa</button>
                </div>
              </div>
            )}
            {currentRole === 'seer' && actionMode === 'player' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi trên bàn để xem bài</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => { setActionMode(null); setSelected([]); }}>← Đổi ý</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}
            {currentRole === 'seer' && actionMode === 'center' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 2 bài ở giữa bàn ({selected.length}/2)</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => { setActionMode(null); setSelected([]); }}>← Đổi ý</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}

            {/* ─── Robber ─── */}
            {currentRole === 'robber' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để đổi bài</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
                </div>
              </div>
            )}

            {/* ─── Troublemaker ─── */}
            {currentRole === 'troublemaker' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 2 người để hoán đổi bài ({selected.length}/2)</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Hoán đổi</button>
                </div>
              </div>
            )}

            {/* ─── Drunk ─── */}
            {currentRole === 'drunk' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để đổi (bạn sẽ không biết bài mới)</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
              </div>
            )}

            {/* ─── Werewolf solo ─── */}
            {currentRole === 'werewolf' && actionData?.isSolo && actionStep === 'choose' && (
              <div className="text-center">
                <p className="text-wolf-400 text-sm font-semibold mb-1">Bạn là Sói duy nhất!</p>
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để xem</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}

            {/* ─── Mason ─── */}
            {currentRole === 'mason' && (
              <div className="text-center">
                <div className="mb-3">
                  {actionData?.masons?.length > 1 ? (
                    <p className="text-white/60 text-sm">Đồng đội Sinh Đôi trên bàn đang sáng</p>
                  ) : (
                    <p className="text-white/50 text-sm">Bạn là Mason duy nhất! Bài còn lại ở giữa.</p>
                  )}
                </div>
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong ✓</button>
              </div>
            )}

            {/* ─── Werewolf multi / Minion / Insomniac ─── */}
            {((currentRole === 'werewolf' && !actionData?.isSolo) ||
              currentRole === 'minion' || currentRole === 'insomniac') && (
              <div className="text-center">
                {currentRole === 'werewolf' && actionData?.werewolves?.length > 1 && (
                  <p className="text-white/60 text-sm mb-3">Đồng bọn trên bàn đang sáng đỏ</p>
                )}
                {currentRole === 'minion' && (
                  <div className="mb-3">
                    {actionData?.werewolves?.length > 0 ? (
                      <p className="text-white/60 text-sm">Người Sói trên bàn đang sáng đỏ</p>
                    ) : (
                      <p className="text-white/50 text-sm">Không có Sói trong game!</p>
                    )}
                  </div>
                )}
                {currentRole === 'insomniac' && (
                  <p className="text-white/60 text-sm mb-2">Bài hiện tại của bạn hiện trên bàn</p>
                )}
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong ✓</button>
              </div>
            )}

            {/* ─── Sentinel ─── */}
            {currentRole === 'sentinel' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">🛡️ Chạm vào người chơi để đặt khiên bảo vệ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Bảo vệ</button>
                </div>
              </div>
            )}

            {/* ─── Alpha Wolf ─── */}
            {currentRole === 'alphawolf' && (
              <div className="text-center">
                <p className="text-wolf-400 text-sm font-semibold mb-1">Sói Đầu Đàn</p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để đổi bài giữa với bài của họ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
                </div>
              </div>
            )}

            {/* ─── Mystic Wolf ─── */}
            {currentRole === 'mysticwolf' && (
              <div className="text-center">
                <p className="text-wolf-400 text-sm font-semibold mb-1">Sói Thần Bí</p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để xem bài của họ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}

            {/* ─── Apprentice Seer ─── */}
            {currentRole === 'apprenticeseer' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để xem</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}

            {/* ─── Paranormal Investigator ─── */}
            {currentRole === 'paranormalinvestigator' && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">
                  🕵️ Thám Tử {step === 2 ? '(lượt 2)' : '(lượt 1)'}
                </p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để xem bài</p>
                <p className="text-white/40 text-xs mb-2">⚠️ Nếu thấy Sói/Tanner, bạn sẽ biến thành vai đó!</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}

            {/* ─── Witch ─── */}
            {currentRole === 'witch' && step === 1 && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">🧙 Phù Thủy (bước 1)</p>
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để xem</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}
            {currentRole === 'witch' && step === 2 && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">🧙 Phù Thủy (bước 2)</p>
                {actionData?.centerRole && (
                  <p className="text-moon-300 text-sm mb-2">
                    Bài vừa xem: <strong>{ROLE_NAMES[actionData.centerRole]}</strong>
                  </p>
                )}
                <p className="text-white/60 text-sm mb-2">Chạm người chơi để đổi bài giữa với bài của họ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit({ swap: false })}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
                </div>
              </div>
            )}

            {/* ─── Village Idiot ─── */}
            {currentRole === 'villageidiot' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-3">Chọn hướng xoay bài của tất cả người khác:</p>
                <div className="flex gap-3 justify-center">
                  <button className="btn-ghost text-sm" onClick={() => handleAutoSubmit({ direction: 'left' })}>⬅️ Sang trái</button>
                  <button className="btn-ghost text-sm" onClick={() => handleAutoSubmit({ direction: 'right' })}>Sang phải ➡️</button>
                </div>
                <button className="btn-ghost text-xs mt-2 text-white/30" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
              </div>
            )}

            {/* ─── Revealer ─── */}
            {currentRole === 'revealer' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">🔦 Chạm vào người chơi để lật bài</p>
                <p className="text-white/40 text-xs mb-2">Nếu không phải Sói/Tanner → công khai cho tất cả!</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Lật bài</button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Submitted confirmation + result */}
        {isMyTurn && submitted && (
          <div className="card fade-in text-center">
            <p className="text-village-400 text-sm font-semibold">✓ Đã hoàn thành</p>
            {result && <ActionResultInline role={currentRole} result={result} step={step} />}
          </div>
        )}

        {/* Not my turn */}
        {!isMyTurn && currentRole && !isMyRoleCalled && (
          <div className="text-center text-white/30 text-sm py-2">
            Nhắm mắt lại và đợi...
          </div>
        )}

        {/* Knowledge notebook */}
        {!roleHidden && nightKnowledge && Object.keys(nightKnowledge).some(k => {
          const v = nightKnowledge[k];
          return (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
        }) && (
          <div className="mt-3 p-3 bg-night-800/80 border border-moon-400/20 rounded-xl">
            <p className="text-moon-400 text-xs font-semibold mb-2">📓 Ghi chú đêm nay</p>
            <KnowledgeSummary knowledge={nightKnowledge} players={players} />
          </div>
        )}
      </div>

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} highlightRole={currentRole} />
    </div>
  );
}

// ─── Inline result display ────────────────────────────────────────────────────

function ActionResultInline({ role, result, step }) {
  if (!result) return null;
  const ROLE_SHORT = {
    werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
    drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
    sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
    apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
    villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
  };
  const CENTER = ['Center 1', 'Center 2', 'Center 3'];
  function cLabel(slot) {
    if (slot === 'centerWolf') return '🐺 Alpha';
    return CENTER[parseInt(slot.replace('center', ''))] || slot;
  }

  if (role === 'werewolf' && result.peeked) {
    return <p className="text-white/70 text-sm mt-1">{cLabel(result.peeked.slot)}: <strong className="text-moon-300">{ROLE_SHORT[result.peeked.role]}</strong></p>;
  }
  if (role === 'seer' && result.seen) {
    if (result.seen.type === 'player') {
      return <p className="text-white/70 text-sm mt-1">Bài: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>;
    }
    return (
      <div className="text-white/70 text-sm mt-1">
        {result.seen.slots.map((s, i) => (
          <p key={i}>{cLabel(s.slot)}: <strong className="text-moon-300">{ROLE_SHORT[s.role]}</strong></p>
        ))}
      </div>
    );
  }
  if (role === 'robber' && result.newRole) {
    return <p className="text-white/70 text-sm mt-1">Bài mới: <strong className="text-moon-300">{ROLE_SHORT[result.newRole]}</strong></p>;
  }
  if (role === 'insomniac' && result.currentRole) {
    return <p className="text-white/70 text-sm mt-1">Bài hiện tại: <strong className="text-moon-300">{ROLE_SHORT[result.currentRole]}</strong></p>;
  }
  if (role === 'sentinel' && result.shielded) {
    return <p className="text-white/70 text-sm mt-1">🛡️ Đã đặt khiên bảo vệ</p>;
  }
  if (role === 'mysticwolf' && result.seen) {
    return <p className="text-white/70 text-sm mt-1">Bài: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>;
  }
  if (role === 'apprenticeseer' && result.seen?.slots) {
    const s = result.seen.slots[0];
    const label = s.slot === 'centerWolf' ? '🐺 Alpha' : CENTER[parseInt(s.slot.replace('center', ''))];
    return <p className="text-white/70 text-sm mt-1">{label}: <strong className="text-moon-300">{ROLE_SHORT[s.role]}</strong></p>;
  }
  if (role === 'paranormalinvestigator' && result.seen) {
    return (
      <div className="text-white/70 text-sm mt-1">
        <p>Bài: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>
        {result.transformed && <p className="text-wolf-400 text-xs mt-1">⚠️ Bạn đã biến thành {ROLE_SHORT[result.seen.role]}!</p>}
        {result.canContinue && <p className="text-white/40 text-xs mt-1">Đợi xem thêm 1 người...</p>}
      </div>
    );
  }
  if (role === 'witch') {
    if (result.seen && result.step === 1) {
      return (
        <div className="text-white/70 text-sm mt-1">
          <p>{cLabel(result.seen.slot)}: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>
          {result.canSwap && <p className="text-white/40 text-xs mt-1">Đợi chọn có đổi bài không...</p>}
        </div>
      );
    }
    if (result.swapped) {
      return <p className="text-white/70 text-sm mt-1">✓ Đã đổi bài</p>;
    }
  }
  if (role === 'villageidiot' && result.rotated) {
    return <p className="text-white/70 text-sm mt-1">🔄 Đã xoay bài sang {result.direction === 'left' ? 'trái' : 'phải'}</p>;
  }
  if (role === 'revealer') {
    if (result.revealed) {
      return <p className="text-white/70 text-sm mt-1">🔦 Đã lật: <strong className="text-moon-300">{ROLE_SHORT[result.role]}</strong> (công khai!)</p>;
    }
    if (result.role) {
      return <p className="text-white/70 text-sm mt-1">🔦 Bài là Sói/Tanner — không công khai</p>;
    }
  }
  return null;
}

// ─── Knowledge summary ────────────────────────────────────────────────────────

function KnowledgeSummary({ knowledge, players }) {
  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole } = knowledge;
  const nameMap = {};
  players.forEach(p => { nameMap[p.id] = p.name; });
  const ROLE_SHORT = {
    werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
    drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
    sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
    apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
    villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
  };
  const CENTER = ['Center 1', 'Center 2', 'Center 3'];
  function cName(slot) {
    if (slot === 'centerWolf') return '🐺 Alpha';
    const idx = parseInt(slot.replace('center', ''));
    return CENTER[idx] || slot;
  }

  const items = [];

  if (knownWerewolves.length > 0) {
    items.push(`🐺 Sói: ${knownWerewolves.map(id => nameMap[id] || '?').join(', ')}`);
  }
  if (knownMasons.length > 0) {
    items.push(`🤝 Sinh Đôi: ${knownMasons.map(id => nameMap[id] || '?').join(', ')}`);
  }
  Object.entries(revealedPlayers).forEach(([id, role]) => {
    items.push(`👤 ${nameMap[id] || id}: ${ROLE_SHORT[role] || role}`);
  });
  Object.entries(revealedCenter).forEach(([slot, role]) => {
    items.push(`🃏 ${cName(slot)}: ${ROLE_SHORT[role] || role}`);
  });
  swappedPairs.forEach(([a, b]) => {
    const nameA = a === 'center' ? 'Bài giữa' : a.startsWith('center') ? cName(a) : nameMap[a] || '?';
    const nameB = b === 'center' ? 'Bài giữa' : b.startsWith('center') ? cName(b) : nameMap[b] || '?';
    items.push(`🔄 ${nameA} ↔ ${nameB}`);
  });
  if (myCurrentRole) {
    items.push(`📋 Bài hiện tại của bạn: ${ROLE_SHORT[myCurrentRole] || myCurrentRole}`);
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <p key={i} className="text-white/60 text-xs">{item}</p>
      ))}
    </div>
  );
}

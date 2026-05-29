import { useState, useEffect, useCallback } from 'react';
import GameTable from '../components/GameTable';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import { sfxCardFlip, sfxReveal } from '../audio';
import VoiceChatControls from '../components/VoiceChatControls';
import ChatPanel from '../components/ChatPanel';

const ROLE_NAMES = {
  doppelganger: 'Doppelgänger',
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer',
  robber: 'Robber', troublemaker: 'Troublemaker', drunk: 'Drunk',
  insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner',
  mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf',
  dreamwolf: 'Dream Wolf', apprenticeseer: 'Apprentice Seer',
  paranormalinvestigator: 'P.I.', witch: 'Witch', villageidiot: 'Village Idiot',
  revealer: 'Revealer', bodyguard: 'Bodyguard',
};

export default function NightScreen({ myRole, myId, nightState, players, onAction, nightKnowledge, hasAlphaWolf, roomCode, isHost, voiceSpeaking }) {
  const { currentRole, isMyTurn, actionData, result } = nightState;
  const [submitted, setSubmitted] = useState(false);
  const [submittedKey, setSubmittedKey] = useState(null);
  const [selected, setSelected] = useState([]);
  const [actionMode, setActionMode] = useState(null);
  const [actionStep, setActionStep] = useState('choose');
  const [roleHidden, setRoleHidden] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const step = actionData?.step || 1;
  // For doppelganger step 2+, effectiveRole = the copied role
  const effectiveRole = (currentRole === 'doppelganger' && step >= 2 && actionData?.copiedRole)
    ? actionData.copiedRole : currentRole;
  const isDoppelAction = currentRole === 'doppelganger' && step >= 2;
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

    // Doppelganger step 1: always pick a player
    if (currentRole === 'doppelganger' && step === 1) {
      setActionMode('player');
      setActionStep('choose');
      setSelected([]);
      return;
    }

    // For step 2+, use the copied role to determine mode
    const modeRole = effectiveRole;

    switch (modeRole) {
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
        if (!actionData?.centerRole) {
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
  }, [isMyTurn, currentRole, submitted, actionData, step, effectiveRole]);

  function handleSelect(id) {
    sfxCardFlip();
    if (effectiveRole === 'troublemaker') {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
    } else if (effectiveRole === 'seer' && actionMode === 'center') {
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

    // For doppelganger step 1: pick a player to copy
    if (currentRole === 'doppelganger' && step === 1) {
      if (selected.length === 1) action = { targetPlayer: selected[0], step: 1 };
      onAction(currentRole, action);
      setSubmitted(true);
      setSubmittedKey(actionKey);
      setActionStep('done');
      sfxReveal();
      return;
    }

    // Use effectiveRole for building the action (works for both regular roles and doppel step 2+)
    switch (effectiveRole) {
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
        if (selected.length === 1) {
          const piStep = isDoppelAction ? (actionData?.piStep || 1) : step;
          action = { targetPlayer: selected[0], step: piStep };
        }
        break;
      case 'witch':
        if (!actionData?.centerRole && selected.length === 1) {
          action = { centerSlot: selected[0], step: 1 };
        } else if (actionData?.centerRole && selected.length === 1) {
          action = { swap: true, targetPlayer: selected[0], step: 2 };
        }
        break;
      case 'revealer':
        if (selected.length === 1) action = { targetPlayer: selected[0] };
        break;
      default:
        break;
    }

    // For doppelganger step 2+, wrap in doppelganger envelope
    if (isDoppelAction) {
      action.step = step;
    }

    onAction(currentRole, action);
    setSubmitted(true);
    setSubmittedKey(actionKey);
    setActionStep('done');
    sfxReveal();
  }

  function handleAutoSubmit(extraAction = {}) {
    if (isDoppelAction) {
      extraAction.step = step;
    }
    onAction(currentRole, extraAction);
    setSubmitted(true);
    setSubmittedKey(actionKey);
    setActionStep('done');
  }

  const doppelCopied = nightKnowledge?.doppelgangerCopiedRole;
  const isMyRoleCalled = currentRole === myRole?.roleId
    || (currentRole === 'werewolf' && (myRole?.roleId === 'alphawolf' || myRole?.roleId === 'mysticwolf'))
    // Doppelganger highlight for join-later phases
    || (myRole?.roleId === 'doppelganger' && doppelCopied && (
      currentRole === doppelCopied
      || (currentRole === 'werewolf' && ['werewolf', 'alphawolf', 'mysticwolf'].includes(doppelCopied))
    ));
  const canSubmit = (() => {
    if (effectiveRole === 'troublemaker') return selected.length === 2;
    if (effectiveRole === 'seer' && actionMode === 'center') return selected.length === 2;
    return selected.length === 1;
  })();

  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole = null, shieldedPlayer = null } = nightKnowledge || {};

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col px-3 py-3 sm:p-4 max-w-xl mx-auto fade-in relative z-10">
      {/* Header */}
      <div className="text-center pt-2 pb-3">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="text-moon-400 pulse-moon"><Icon name="moon" size={28} /></span>
          <h2 className="text-lg font-semibold text-moon-300">Ban đêm</h2>
        </div>
        {/* Toolbar row */}
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <button
            onClick={() => setRoleHidden(h => !h)}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 transition-colors"
            title={roleHidden ? 'Hiện vai' : 'Ẩn vai'}
          >
            <Icon name={roleHidden ? 'eyeOff' : 'eye'} size={16} />
          </button>
          <RoleLibraryButton onClick={() => setLibraryOpen(true)} />
          <VoiceChatControls roomCode={roomCode} isHost={isHost} players={players} myId={myId} />
          <ChatPanel roomCode={roomCode} myId={myId} players={players} />
        </div>
        {myRole && !roleHidden && (
          <div className="flex items-center justify-center gap-2">
            <RoleIcon roleId={myRole.roleId} size={22} circular />
            <span className="text-white/50 text-sm">{myRole.name}</span>
          </div>
        )}
      </div>

      {/* Current role narration */}
      {currentRole && (
        <div className={`text-center mb-3 px-4 py-2 rounded-xl transition-all ${
          isMyRoleCalled ? 'bg-moon-400/10 border border-moon-400/30' : 'bg-white/5'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <RoleIcon roleId={currentRole} size={22} circular />
            <span className="text-moon-300 font-semibold">{ROLE_NAMES[currentRole]}</span>
          </div>
          {isMyRoleCalled ? (
            <span className="text-moon-400 text-sm">— Đến lượt bạn!</span>
          ) : (
            <span className="text-white/30 text-sm">đang thức dậy...</span>
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
        knownMasons={roleHidden ? [] : (knownMasons || [])}
        swappedPairs={roleHidden ? [] : swappedPairs}
        myCurrentRole={roleHidden ? null : (myCurrentRole || myRole?.roleId)}
        selectable={isMyTurn && !submitted ? actionMode : null}
        selected={selected}
        onSelect={handleSelect}
        isNight={true}
        hasAlphaWolf={hasAlphaWolf}
        shieldedPlayer={shieldedPlayer}
        voiceSpeaking={voiceSpeaking || {}}
      />

      {/* Action Panel */}
      <div className="mt-3 flex-1">
        {isMyTurn && !submitted && (
          <div className="card fade-in">
            {/* Doppelganger step 1: pick a player to copy */}
            {currentRole === 'doppelganger' && step === 1 && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">🎭 Hóa Thân</p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để xem bài và trở thành vai đó</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}

            {/* Doppelganger step 2+ header */}
            {isDoppelAction && (
              <p className="text-purple-300 text-xs mb-2 text-center font-semibold">🎭 Hóa Thân → {ROLE_NAMES[actionData?.copiedRole]}</p>
            )}

            {effectiveRole === 'seer' && !actionMode && (
              <div className="text-center">
                <p className="text-white/70 text-sm mb-3">Bạn muốn xem gì?</p>
                <div className="flex gap-3 justify-center">
                  <button className="btn-ghost text-sm flex items-center gap-1.5" onClick={() => setActionMode('player')}>
                    <Icon name="eye" size={16} /> Bài 1 người chơi
                  </button>
                  <button className="btn-ghost text-sm flex items-center gap-1.5" onClick={() => setActionMode('center')}>
                    <Icon name="cards" size={16} /> 2 bài ở giữa
                  </button>
                </div>
              </div>
            )}
            {effectiveRole === 'seer' && actionMode === 'player' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi trên bàn để xem bài</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => { setActionMode(null); setSelected([]); }}>
                    <Icon name="arrowLeft" size={14} className="inline mr-1" />Đổi ý
                  </button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}
            {effectiveRole === 'seer' && actionMode === 'center' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 2 bài ở giữa bàn ({selected.length}/2)</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => { setActionMode(null); setSelected([]); }}>
                    <Icon name="arrowLeft" size={14} className="inline mr-1" />Đổi ý
                  </button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'robber' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để đổi bài</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'troublemaker' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 2 người để hoán đổi bài ({selected.length}/2)</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Hoán đổi</button>
                </div>
              </div>
            )}

            {effectiveRole === 'drunk' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để đổi (bạn sẽ không biết bài mới)</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
              </div>
            )}

            {effectiveRole === 'werewolf' && actionData?.isSolo && actionStep === 'choose' && (
              <div className="text-center">
                <p className="text-wolf-400 text-sm font-semibold mb-1">Bạn là Sói duy nhất!</p>
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để xem</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}

            {effectiveRole === 'mason' && (
              <div className="text-center">
                <div className="mb-3">
                  {actionData?.masons?.length > 1 ? (
                    <p className="text-white/60 text-sm">Đồng đội Sinh Đôi trên bàn đang sáng</p>
                  ) : (
                    <p className="text-white/50 text-sm">Bạn là Mason duy nhất! Bài còn lại ở giữa.</p>
                  )}
                </div>
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
              </div>
            )}

            {((effectiveRole === 'werewolf' && !actionData?.isSolo) ||
              effectiveRole === 'minion' || effectiveRole === 'insomniac') && (
              <div className="text-center">
                {effectiveRole === 'werewolf' && actionData?.werewolves?.length > 1 && (
                  <p className="text-white/60 text-sm mb-3">Đồng bọn trên bàn đang sáng đỏ</p>
                )}
                {effectiveRole === 'minion' && (
                  <div className="mb-3">
                    {actionData?.werewolves?.length > 0 ? (
                      <p className="text-white/60 text-sm">Người Sói trên bàn đang sáng đỏ</p>
                    ) : (
                      <p className="text-white/50 text-sm">Không có Sói trong game!</p>
                    )}
                  </div>
                )}
                {effectiveRole === 'insomniac' && (
                  <p className="text-white/60 text-sm mb-2">Bài hiện tại của bạn hiện trên bàn</p>
                )}
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
              </div>
            )}

            {effectiveRole === 'sentinel' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2 flex items-center justify-center gap-1.5">
                  <Icon name="shield" size={16} className="text-village-400" /> Chạm vào người chơi để đặt khiên bảo vệ
                </p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Bảo vệ</button>
                </div>
              </div>
            )}

            {effectiveRole === 'alphawolf' && (
              <div className="text-center">
                <p className="text-wolf-400 text-sm font-semibold mb-1">Sói Đầu Đàn</p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để đổi bài giữa với bài của họ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'mysticwolf' && (
              <div className="text-center">
                <p className="text-wolf-400 text-sm font-semibold mb-1">Sói Thần Bí</p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để xem bài của họ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'apprenticeseer' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để xem</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}

            {effectiveRole === 'paranormalinvestigator' && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">
                  Thám Tử {(isDoppelAction ? actionData?.piStep : step) === 2 ? '(lượt 2)' : '(lượt 1)'}
                </p>
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để xem bài</p>
                <p className="text-white/40 text-xs mb-2">Nếu thấy Sói/Tanner, bạn sẽ biến thành vai đó!</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'witch' && !actionData?.centerRole && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">Phù Thủy (bước 1)</p>
                <p className="text-white/60 text-sm mb-2">Chạm 1 bài ở giữa để xem</p>
                <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Xem bài</button>
              </div>
            )}
            {effectiveRole === 'witch' && actionData?.centerRole && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">Phù Thủy (bước 2)</p>
                {actionData?.centerRole && (
                  <p className="text-moon-300 text-sm mb-2">
                    Bài vừa xem: <strong>{ROLE_NAMES[actionData.centerRole]}</strong>
                  </p>
                )}
                <p className="text-white/60 text-sm mb-2">Chạm người chơi để đổi bài giữa với bài của họ</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit({ swap: false, step: 2, targetPlayer: 'skip' })}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Đổi bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'villageidiot' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-3">Chọn hướng xoay bài của tất cả người khác:</p>
                <div className="flex gap-3 justify-center">
                  <button className="btn-ghost text-sm" onClick={() => handleAutoSubmit({ direction: 'left' })}>
                    <Icon name="arrowLeft" size={16} className="inline mr-1" /> Sang trái
                  </button>
                  <button className="btn-ghost text-sm" onClick={() => handleAutoSubmit({ direction: 'right' })}>
                    Sang phải <Icon name="arrowLeft" size={16} className="inline ml-1 rotate-180" />
                  </button>
                </div>
                <button className="btn-ghost text-xs mt-2 text-white/30" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
              </div>
            )}

            {effectiveRole === 'revealer' && (
              <div className="text-center">
                <p className="text-white/60 text-sm mb-2">Chạm vào người chơi để lật bài</p>
                <p className="text-white/40 text-xs mb-2">Nếu không phải Sói/Tanner — công khai cho tất cả!</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit()}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={!canSubmit} onClick={handleSubmitAction}>Lật bài</button>
                </div>
              </div>
            )}

          </div>
        )}

        {isMyTurn && submitted && (
          <div className="card fade-in text-center">
            <p className="text-village-400 text-sm font-semibold">Đã hoàn thành</p>
            {result && <ActionResultInline role={currentRole} result={result} step={step} />}
          </div>
        )}

        {!isMyTurn && currentRole && !isMyRoleCalled && (
          <div className="text-center text-white/30 text-sm py-2">
            Nhắm mắt lại và đợi...
          </div>
        )}

        {!roleHidden && nightKnowledge && Object.keys(nightKnowledge).some(k => {
          const v = nightKnowledge[k];
          return (Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : !!v);
        }) && (
          <div className="mt-3 p-3 bg-night-800/80 border border-moon-400/20 rounded-xl">
            <p className="text-moon-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Icon name="notebook" size={14} /> Ghi chú đêm nay
            </p>
            <KnowledgeSummary knowledge={nightKnowledge} players={players} />
          </div>
        )}
      </div>

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} highlightRole={currentRole} />
    </div>
  );
}

function ActionResultInline({ role, result, step }) {
  if (!result) return null;
  // For doppelganger, use the copiedRole to display the right result
  const displayRole = (role === 'doppelganger' && result.copiedRole) ? result.copiedRole : role;
  const ROLE_SHORT = {
    doppelganger: 'Doppelgänger',
    werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
    drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
    sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
    apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
    villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
  };
  const CENTER = ['Center 1', 'Center 2', 'Center 3'];
  function cLabel(slot) {
    if (slot === 'centerWolf') return 'Alpha';
    return CENTER[parseInt(slot.replace('center', ''))] || slot;
  }

  // Doppelganger step 1 result: show which role was copied
  if (role === 'doppelganger' && result.copiedRole && !displayRole) {
    return <p className="text-purple-300 text-sm mt-1">Bạn đã trở thành: <strong>{ROLE_SHORT[result.copiedRole]}</strong></p>;
  }
  if (role === 'doppelganger' && result.copiedRole && !result.seen && !result.newRole && !result.currentRole && !result.peeked && !result.rotated && !result.revealed && !result.swapped && !result.blocked) {
    return <p className="text-purple-300 text-sm mt-1">🎭 Bạn đã trở thành: <strong>{ROLE_SHORT[result.copiedRole]}</strong></p>;
  }

  if (displayRole === 'werewolf' && result.peeked) {
    return <p className="text-white/70 text-sm mt-1">{cLabel(result.peeked.slot)}: <strong className="text-moon-300">{ROLE_SHORT[result.peeked.role]}</strong></p>;
  }
  if (displayRole === 'seer' && result.seen) {
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
  if (displayRole === 'robber' && result.newRole) {
    return <p className="text-white/70 text-sm mt-1">Bài mới: <strong className="text-moon-300">{ROLE_SHORT[result.newRole]}</strong></p>;
  }
  if (displayRole === 'insomniac' && result.currentRole) {
    return <p className="text-white/70 text-sm mt-1">Bài hiện tại: <strong className="text-moon-300">{ROLE_SHORT[result.currentRole]}</strong></p>;
  }
  if (displayRole === 'sentinel' && result.shielded) {
    return <p className="text-white/70 text-sm mt-1">Đã đặt khiên bảo vệ</p>;
  }
  if (displayRole === 'mysticwolf' && result.seen) {
    return <p className="text-white/70 text-sm mt-1">Bài: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>;
  }
  if (displayRole === 'apprenticeseer' && result.seen?.slots) {
    const s = result.seen.slots[0];
    const label = s.slot === 'centerWolf' ? 'Alpha' : CENTER[parseInt(s.slot.replace('center', ''))];
    return <p className="text-white/70 text-sm mt-1">{label}: <strong className="text-moon-300">{ROLE_SHORT[s.role]}</strong></p>;
  }
  if (displayRole === 'paranormalinvestigator' && result.seen) {
    return (
      <div className="text-white/70 text-sm mt-1">
        <p>Bài: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>
        {result.transformed && <p className="text-wolf-400 text-xs mt-1">Bạn đã biến thành {ROLE_SHORT[result.seen.role]}!</p>}
        {result.canContinue && <p className="text-white/40 text-xs mt-1">Đợi xem thêm 1 người...</p>}
      </div>
    );
  }
  if (displayRole === 'witch') {
    if (result.seen && result.step === 1) {
      return (
        <div className="text-white/70 text-sm mt-1">
          <p>{cLabel(result.seen.slot)}: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role]}</strong></p>
          {result.canSwap && <p className="text-white/40 text-xs mt-1">Đợi chọn có đổi bài không...</p>}
        </div>
      );
    }
    if (result.swapped) {
      return <p className="text-white/70 text-sm mt-1">Đã đổi bài</p>;
    }
  }
  if (displayRole === 'villageidiot' && result.rotated) {
    return <p className="text-white/70 text-sm mt-1">Đã xoay bài sang {result.direction === 'left' ? 'trái' : 'phải'}</p>;
  }
  if (displayRole === 'revealer') {
    if (result.revealed) {
      return <p className="text-white/70 text-sm mt-1">Đã lật: <strong className="text-moon-300">{ROLE_SHORT[result.role]}</strong> (công khai!)</p>;
    }
    if (result.role) {
      return <p className="text-white/70 text-sm mt-1">Bài là Sói/Tanner — không công khai</p>;
    }
  }
  return null;
}

function KnowledgeSummary({ knowledge, players }) {
  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole } = knowledge;
  const nameMap = {};
  players.forEach(p => { nameMap[p.id] = p.name; });
  const ROLE_SHORT = {
    doppelganger: 'Doppelgänger',
    werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
    drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
    sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
    apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
    villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
  };
  const CENTER = ['Center 1', 'Center 2', 'Center 3'];
  function cName(slot) {
    if (slot === 'centerWolf') return 'Alpha';
    const idx = parseInt(slot.replace('center', ''));
    return CENTER[idx] || slot;
  }

  const items = [];

  if (knowledge.doppelgangerCopiedRole) items.push(`🎭 Hóa Thân → ${ROLE_SHORT[knowledge.doppelgangerCopiedRole] || knowledge.doppelgangerCopiedRole}`);
  if (knownWerewolves.length > 0) items.push(`Sói: ${knownWerewolves.map(id => nameMap[id] || '?').join(', ')}`);
  if (knownMasons.length > 0) items.push(`Sinh Đôi: ${knownMasons.map(id => nameMap[id] || '?').join(', ')}`);
  Object.entries(revealedPlayers).forEach(([id, role]) => items.push(`${nameMap[id] || id}: ${ROLE_SHORT[role] || role}`));
  Object.entries(revealedCenter).forEach(([slot, role]) => items.push(`${cName(slot)}: ${ROLE_SHORT[role] || role}`));
  swappedPairs.forEach(([a, b]) => {
    const nameA = a === 'center' ? 'Bài giữa' : a.startsWith('center') ? cName(a) : nameMap[a] || '?';
    const nameB = b === 'center' ? 'Bài giữa' : b.startsWith('center') ? cName(b) : nameMap[b] || '?';
    items.push(`${nameA} ↔ ${nameB}`);
  });
  if (myCurrentRole) items.push(`Bài hiện tại: ${ROLE_SHORT[myCurrentRole] || myCurrentRole}`);

  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <p key={i} className="text-white/60 text-xs">{item}</p>
      ))}
    </div>
  );
}

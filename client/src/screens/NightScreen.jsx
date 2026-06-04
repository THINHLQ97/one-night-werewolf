import { useState, useEffect, useCallback } from 'react';
import GameTable from '../components/GameTable';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import { sfxCardFlip, sfxReveal } from '../audio';
import VoiceChatControls from '../components/VoiceChatControls';
import ChatPanel from '../components/ChatPanel';
import AlienTerminal from '../components/AlienTerminal';

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
  prince: 'Prince', cursed: 'Cursed', auraseer: 'Aura Seer',
  // Alien roles
  alien: 'Alien', syntheticalien: 'Synthetic Alien',
  cow: 'Cow', groob: 'Groob', zerb: 'Zerb',
  oracle: 'Oracle', rascal: 'Rascal', exposer: 'Exposer',
  psychic: 'Psychic', mortician: 'Mortician', leader: 'Leader', blob: 'Blob',
  // Alien phases (used as currentRole in night)
  aliens: 'Alien', groob_zerb: 'Groob & Zerb',
};

export default function NightScreen({ myRole, myId, nightState, players, onAction, nightKnowledge, hasAlphaWolf, roomCode, isHost, voiceSpeaking, chatMessages, appAnnouncements = [], gameMode, hasOracleVision = false, onReopenVision }) {
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
      case 'auraseer':
        setActionStep('done');
        break;
      // ── Alien phases ──
      case 'oracle':
        // Reset selection between oracle question types
        setActionMode(null);
        setActionStep('choose');
        setSelected([]);
        break;
      case 'aliens':
        setActionMode(null);
        setActionStep('choose');
        break;
      case 'groob_zerb':
      case 'leader':
      case 'cow':
      case 'blob':
        setActionStep('done');
        break;
      case 'rascal': {
        // Action mode depends on which Echo instruction the Rascal got
        const instType = actionData?.instruction?.type;
        if (instType === 'drunk') {
          setActionMode('center'); // Drunk action — swap with center card
        } else if (instType === 'village_idiot') {
          setActionMode(null); // Just pick left/right direction
        } else {
          setActionMode('player'); // troublemaker / robber
        }
        setActionStep('choose');
        break;
      }
      case 'exposer':
        setActionMode('center');
        setActionStep('choose');
        break;
      case 'psychic':
        setActionMode(null);
        setActionStep('choose');
        break;
      case 'mortician':
        setActionStep(actionData?.instruction?.viewCount === 0 ? 'done' : 'choose');
        break;
      default:
        setActionStep('done');
    }
    setSelected([]);
  }, [isMyTurn, currentRole, submitted, actionData, step, effectiveRole]);

  function handleSelect(id) {
    sfxCardFlip();
    if (effectiveRole === 'troublemaker' || effectiveRole === 'rascal') {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
    } else if ((effectiveRole === 'seer' || effectiveRole === 'oracle') && actionMode === 'center') {
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= 2) return prev;
        return [...prev, id];
      });
    } else if (effectiveRole === 'exposer') {
      // Exposer: app dictates exact count (1, 2 or 3) — let player toggle within that limit
      const maxCount = actionData?.instruction?.count || 1;
      setSelected(prev => {
        if (prev.includes(id)) return prev.filter(x => x !== id);
        if (prev.length >= maxCount) return prev;
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
      // ── Alien roles ──
      case 'alien':
        if (actionMode === 'center' && selected.length === 1) {
          action = { peekCenter: selected[0] };
        } else if (actionMode === 'tip' && selected.length === 1) {
          action = { tipPlayer: selected[0], centerSlot: selected[1] || 'center0' };
        }
        break;
      case 'oracle':
        if (actionMode === 'player' && selected.length === 1) {
          action = { targetPlayer: selected[0] };
        } else if (actionMode === 'center' && selected.length === 2) {
          action = { centerSlots: selected };
        }
        break;
      case 'rascal':
        if (selected.length === 2) action = { target1: selected[0], target2: selected[1] };
        break;
      case 'exposer':
        if (selected.length === 1) action = { centerSlot: selected[0] };
        break;
      case 'psychic':
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
  const ALIEN_ROLES_SET = ['alien', 'syntheticalien', 'groob', 'zerb'];
  const isMyRoleCalled = currentRole === myRole?.roleId
    || (currentRole === 'werewolf' && (myRole?.roleId === 'alphawolf' || myRole?.roleId === 'mysticwolf'))
    // Alien phases: 'aliens' phase includes all alien-affiliated roles
    || (currentRole === 'aliens' && ALIEN_ROLES_SET.includes(myRole?.roleId))
    // Groob/Zerb private phase
    || (currentRole === 'groob_zerb' && (myRole?.roleId === 'groob' || myRole?.roleId === 'zerb'))
    // Doppelganger highlight for join-later phases
    || (myRole?.roleId === 'doppelganger' && doppelCopied && (
      currentRole === doppelCopied
      || (currentRole === 'werewolf' && ['werewolf', 'alphawolf', 'mysticwolf'].includes(doppelCopied))
    ));
  const canSubmit = (() => {
    if (effectiveRole === 'troublemaker' || effectiveRole === 'rascal') return selected.length === 2;
    if ((effectiveRole === 'seer' || effectiveRole === 'oracle') && actionMode === 'center') return selected.length === 2;
    if (effectiveRole === 'exposer') return selected.length === (actionData?.instruction?.count || 1);
    return selected.length === 1;
  })();

  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole = null, shieldedPlayer = null, knownAliens = [], knownGroobZerb = [], knownCow = null } = nightKnowledge || {};

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
          {hasOracleVision && (
            <button
              onClick={onReopenVision}
              className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              title="Xem lại thị kiến Oracle"
              style={{ boxShadow: '0 0 10px rgba(74,222,128,0.3)' }}
            >
              👁️
            </button>
          )}
          <VoiceChatControls roomCode={roomCode} isHost={isHost} players={players} myId={myId} />
          <ChatPanel roomCode={roomCode} myId={myId} players={players} messages={chatMessages} />
        </div>
        {myRole && !roleHidden && (
          <div className="flex items-center justify-center gap-2">
            <RoleIcon roleId={myRole.roleId} size={22} circular />
            <span className="text-white/50 text-sm">{myRole.name}</span>
          </div>
        )}
      </div>

      {/* Alien Command Terminal — visible to ALL players */}
      {gameMode === 'alien' && (
        <AlienTerminal messages={appAnnouncements} maxLines={5} />
      )}

      {/* Current role narration */}
      {currentRole && (
        <div className={`text-center mb-3 px-4 py-2 rounded-xl transition-all ${
          isMyRoleCalled ? 'bg-moon-400/10 border border-moon-400/30' : 'bg-white/5'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <RoleIcon roleId={currentRole} size={22} circular />
            <span className="text-moon-300 font-semibold">{ROLE_NAMES[currentRole] || currentRole}</span>
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
        knownAliens={roleHidden ? [] : knownAliens}
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

            {effectiveRole === 'auraseer' && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">✨ Tiên Tri Hào Quang</p>
                {actionData?.touched?.length > 0 ? (
                  <div className="mb-2">
                    <p className="text-white/60 text-sm mb-1">Những người có hào quang (đã xem/đổi bài):</p>
                    <p className="text-purple-300 text-sm font-semibold">
                      {actionData.touched.map(t => t.name).join(', ')}
                    </p>
                  </div>
                ) : (
                  <p className="text-white/50 text-sm mb-2">Không ai có hào quang — chưa ai xem/đổi bài.</p>
                )}
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
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

            {/* ── Alien Night Actions (phase-based) ── */}

            {effectiveRole === 'oracle' && actionData?.question && actionData.question.id !== 'number_guess' && (
              <div className="text-center">
                <p className="text-emerald-400 text-sm font-semibold mb-1">Nhà Tiên Tri — Câu hỏi từ App</p>
                {actionData.question.group === 'switch' && (
                  <p className="text-wolf-400/80 text-xs mb-1 font-semibold">👽 ĐỀ NGHỊ ĐỔI PHE</p>
                )}
                <p className="text-white/70 text-sm mb-3">{actionData.question.question}</p>

                {/* Type: choice (yes/no, even/odd, etc.) */}
                {actionData.question.type === 'choice' && (
                  <div className="flex gap-2 justify-center flex-wrap">
                    {actionData.question.options.map(opt => (
                      <button key={opt} className="btn-ghost text-sm px-4 py-2" onClick={() => handleAutoSubmit({ answer: opt })}>{opt}</button>
                    ))}
                  </div>
                )}

                {/* Type: pick_number (player_number or number_guess) */}
                {actionData.question.type === 'pick_number' && (
                  <div>
                    <div className="flex gap-1.5 justify-center flex-wrap mb-3">
                      {Array.from({ length: actionData.question.max - actionData.question.min + 1 }, (_, i) => {
                        const num = actionData.question.min + i;
                        const playerInfo = actionData.playerNumbers?.find(p => p.number === num);
                        return (
                          <button
                            key={num}
                            className={`min-w-[36px] h-10 px-2 rounded-lg text-sm font-bold transition-all border ${
                              selected[0] === String(num)
                                ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 scale-110'
                                : 'bg-white/10 text-white/60 hover:bg-white/20 border-white/10'
                            }`}
                            onClick={() => setSelected([String(num)])}
                            title={playerInfo?.name || ''}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                    {actionData.question.id === 'player_number' && actionData.playerNumbers && (
                      <p className="text-white/40 text-xs mb-2">
                        {actionData.playerNumbers.map(p => `#${p.number}=${p.name}`).join(' · ')}
                      </p>
                    )}
                    <button className="btn-primary text-sm" disabled={selected.length === 0} onClick={() => handleAutoSubmit({ answer: selected[0] })}>Xác nhận</button>
                  </div>
                )}
              </div>
            )}

            {effectiveRole === 'aliens' && (
              <div className="text-center">
                <p className="text-emerald-400 text-sm font-semibold mb-1">Alien</p>
                {actionData?.aliens?.length > 1 && (
                  <p className="text-white/60 text-sm mb-2">Đồng bọn Alien: {actionData.aliens.map(a => `#${a.seat} ${a.name}`).join(', ')}</p>
                )}

                {/* Stare — do nothing */}
                {actionData?.instruction?.type === 'stare' && (
                  <>
                    <p className="text-white/50 text-sm mb-2">{actionData.instruction.announce}</p>
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
                  </>
                )}

                {/* Swap cards (forced by Oracle) */}
                {actionData?.instruction?.type === 'swap_cards' && (
                  <>
                    <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
                  </>
                )}

                {/* Rotate Left/Right */}
                {(actionData?.instruction?.type === 'rotate_left' || actionData?.instruction?.type === 'rotate_right') && (
                  <>
                    <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
                  </>
                )}

                {/* Show — reveal all alien cards to each other */}
                {actionData?.instruction?.type === 'show' && (
                  <>
                    <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
                  </>
                )}

                {/* Individual / Group view */}
                {(actionData?.instruction?.type === 'individual_view' || actionData?.instruction?.type === 'group_view') && (
                  <>
                    <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                    {actionData.viewTargets && (
                      <div className="flex gap-2 justify-center flex-wrap mb-2">
                        {actionData.viewTargets.map(t => (
                          <button
                            key={t.id}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${selected.includes(t.id) ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200' : 'bg-white/10 text-white/60 hover:bg-white/20 border-white/10'}`}
                            onClick={() => handleSelect(t.id)}
                          >
                            {t.seat ? `#${t.seat} ` : ''}{t.name}
                          </button>
                        ))}
                      </div>
                    )}
                    <button className="btn-primary text-sm" disabled={selected.length === 0} onClick={() => handleAutoSubmit({ targetId: selected[0] })}>Xem bài</button>
                  </>
                )}

                {actionData?.cowPlayerName && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-yellow-400 text-xs font-semibold">🐄 Bò đang giơ nắm đấm:</p>
                    <p className="text-yellow-300 text-sm font-bold">{actionData.cowPlayerName}</p>
                    {actionData.cowAdjacent && (
                      <p className="text-yellow-400/70 text-xs mt-1 italic">⚠️ Bạn ngồi cạnh Bò — hãy tap nắm đấm!</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {effectiveRole === 'groob_zerb' && (
              <div className="text-center">
                <p className="text-emerald-400 text-sm font-semibold mb-1">Groob & Zerb</p>
                {actionData?.partners?.length > 1 ? (
                  <p className="text-white/60 text-sm mb-2">Groob & Zerb trên bàn: {actionData.partners.map(p => p.name).join(', ')}</p>
                ) : (
                  <p className="text-white/50 text-sm mb-2">Chỉ có 1 — bạn là Alien thường.</p>
                )}
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
              </div>
            )}

            {effectiveRole === 'leader' && (
              <div className="text-center">
                <p className="text-yellow-400 text-sm font-semibold mb-1">Thủ Lĩnh</p>
                {actionData?.hasGroobAndZerb && (
                  <p className="text-purple-400 text-xs mb-2">⚠️ Cả Groob & Zerb cùng nhập trận — bạn chỉ thắng nếu CẢ HAI cùng sống!</p>
                )}
                <p className="text-white/60 text-sm mb-1">Tất cả Alien giơ ngón cái. Bạn thấy vị trí và phân biệt từng vai:</p>
                <p className="text-white/40 text-xs mb-2">💡 Leader Trap: nếu tất cả Alien <span className="text-amber-300">(trừ Synthetic)</span> cùng vote bạn ban ngày → Alien thắng.</p>
                {actionData?.alienPlayers?.length > 0 ? (
                  <div className="flex gap-2 justify-center flex-wrap mb-2">
                    {actionData.alienPlayers.map(a => {
                      const isGroob = a.role === 'groob';
                      const isZerb = a.role === 'zerb';
                      const isSynthetic = a.role === 'syntheticalien';
                      const label = isGroob ? 'Groob' : isZerb ? 'Zerb' : isSynthetic ? 'Synthetic' : 'Alien';
                      const colorClass = isGroob ? 'bg-purple-500/30 text-purple-200 border-purple-400/50'
                                       : isZerb ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                                       : isSynthetic ? 'bg-amber-500/30 text-amber-200 border-amber-400/50'
                                       : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                      return (
                        <span key={a.id} className={`px-2 py-1 rounded-lg text-xs border ${colorClass}`}>
                          {a.name} <span className="opacity-70">({label})</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-white/40 text-sm mb-2">Không thấy Alien nào giơ tay.</p>
                )}
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
              </div>
            )}

            {effectiveRole === 'cow' && (
              <div className="text-center">
                <p className="text-yellow-400 text-sm font-semibold mb-2">Bò — Kết quả tap nắm đấm</p>
                {!actionData?.wasTapped ? (
                  <p className="text-village-400 text-sm mb-3">Không ai tap nắm đấm. Cả 2 bên đều an toàn.</p>
                ) : (
                  <div className="space-y-2 mb-3">
                    {actionData.leftIsAlien && (
                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-wolf-500/20 border border-wolf-500/30">
                        <span className="text-wolf-400 text-sm">BÊN TRÁI ({actionData.leftPlayer?.name}) là Alien!</span>
                      </div>
                    )}
                    {actionData.rightIsAlien && (
                      <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-wolf-500/20 border border-wolf-500/30">
                        <span className="text-wolf-400 text-sm">BÊN PHẢI ({actionData.rightPlayer?.name}) là Alien!</span>
                      </div>
                    )}
                    {!actionData.leftIsAlien && (
                      <p className="text-village-400/60 text-xs">Bên trái ({actionData.leftPlayer?.name}): An toàn</p>
                    )}
                    {!actionData.rightIsAlien && (
                      <p className="text-village-400/60 text-xs">Bên phải ({actionData.rightPlayer?.name}): An toàn</p>
                    )}
                  </div>
                )}
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
              </div>
            )}

            {effectiveRole === 'rascal' && actionData?.instruction && (
              <div className="text-center">
                <p className="text-emerald-400 text-sm font-semibold mb-1">Quỷ Nhỏ</p>
                <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                {actionData.instruction.type === 'troublemaker' && (
                  <>
                    <p className="text-white/40 text-xs mb-2">Chạm 2 người để hoán đổi ({selected.length}/2)</p>
                    <div className="flex gap-2 justify-center">
                      {!actionData.instruction.mandatory && <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit({ skip: true })}>Bỏ qua</button>}
                      <button className="btn-primary text-sm" disabled={selected.length !== 2} onClick={() => handleAutoSubmit({ target1: selected[0], target2: selected[1] })}>Hoán đổi</button>
                    </div>
                  </>
                )}
                {actionData.instruction.type === 'robber' && (
                  <>
                    <p className="text-white/40 text-xs mb-2">Chạm 1 người để đổi bài</p>
                    <div className="flex gap-2 justify-center">
                      {!actionData.instruction.mandatory && <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit({ skip: true })}>Bỏ qua</button>}
                      <button className="btn-primary text-sm" disabled={selected.length !== 1} onClick={() => handleAutoSubmit({ targetPlayer: selected[0] })}>Đổi bài</button>
                    </div>
                  </>
                )}
                {actionData.instruction.type === 'drunk' && (
                  <>
                    <p className="text-white/40 text-xs mb-2">Chạm 1 bài giữa để đổi (không xem)</p>
                    <div className="flex gap-2 justify-center">
                      {!actionData.instruction.mandatory && <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit({ skip: true })}>Bỏ qua</button>}
                      <button className="btn-primary text-sm" disabled={selected.length !== 1} onClick={() => handleAutoSubmit({ centerSlot: selected[0] })}>Đổi bài</button>
                    </div>
                  </>
                )}
                {actionData.instruction.type === 'village_idiot' && (
                  <>
                    <p className="text-white/40 text-xs mb-2">Chọn hướng xoay</p>
                    <div className="flex gap-3 justify-center">
                      <button className="btn-ghost text-sm" onClick={() => handleAutoSubmit({ direction: 'left' })}>Sang trái</button>
                      <button className="btn-ghost text-sm" onClick={() => handleAutoSubmit({ direction: 'right' })}>Sang phải</button>
                    </div>
                    {!actionData.instruction.mandatory && <button className="btn-ghost text-xs mt-2" onClick={() => handleAutoSubmit({ skip: true })}>Bỏ qua</button>}
                  </>
                )}
              </div>
            )}

            {effectiveRole === 'exposer' && actionData?.instruction && (
              <div className="text-center">
                <p className="text-emerald-400 text-sm font-semibold mb-1">Kẻ Phơi Bày</p>
                <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                <p className="text-white/40 text-xs mb-2">Chạm {actionData.instruction.count} bài giữa ({selected.length}/{actionData.instruction.count})</p>
                <div className="flex gap-2 justify-center">
                  <button className="btn-ghost text-xs" onClick={() => handleAutoSubmit({ skip: true, centerSlots: [] })}>Bỏ qua</button>
                  <button className="btn-primary text-sm" disabled={selected.length !== actionData.instruction.count} onClick={() => handleAutoSubmit({ centerSlots: selected })}>Lật bài</button>
                </div>
              </div>
            )}

            {effectiveRole === 'psychic' && actionData?.instruction && (() => {
              const inst = actionData.instruction;
              const count = inst.count || 1;
              const isAuto = inst.viewType === 'specific' || (inst.viewType === 'neighbors' && count === 2);
              const needsPick = !isAuto && actionData.viewTargets?.length > count;

              return (
                <div className="text-center">
                  <p className="text-emerald-400 text-sm font-semibold mb-1">Psychic</p>
                  <p className="text-white/60 text-sm mb-2">{inst.announce}</p>

                  {/* Auto-reveal (no choice) */}
                  {isAuto && (
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xem bài</button>
                  )}

                  {/* Pick from pool */}
                  {!isAuto && actionData.viewTargets && (
                    <>
                      <p className="text-white/40 text-xs mb-2">
                        Chọn {count} {count > 1 ? 'người' : 'người'} ({selected.length}/{count})
                      </p>
                      <div className="flex gap-2 justify-center flex-wrap mb-2">
                        {actionData.viewTargets.map(t => (
                          <button
                            key={t.id}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all border ${selected.includes(t.id) ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'bg-white/10 text-white/60 hover:bg-white/20 border-white/10'}`}
                            onClick={() => {
                              if (selected.includes(t.id)) setSelected(selected.filter(x => x !== t.id));
                              else if (selected.length < count) setSelected([...selected, t.id]);
                            }}
                          >
                            #{t.seat} {t.name}
                          </button>
                        ))}
                      </div>
                      <button
                        className="btn-primary text-sm"
                        disabled={selected.length !== count}
                        onClick={() => handleAutoSubmit(count === 1 ? { targetId: selected[0] } : { targetIds: selected })}
                      >
                        Xem bài
                      </button>
                    </>
                  )}

                  {/* Single auto-target (count==1 with only 1 candidate) */}
                  {!isAuto && !needsPick && actionData.viewTargets?.length > 0 && actionData.viewTargets.length === count && (
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit({ targetIds: actionData.viewTargets.map(t => t.id) })}>Xem bài</button>
                  )}
                </div>
              );
            })()}

            {effectiveRole === 'mortician' && actionData?.instruction && (
              <div className="text-center">
                <p className="text-purple-400 text-sm font-semibold mb-1">Nhà Quàn</p>
                <p className="text-white/60 text-sm mb-2">{actionData.instruction.announce}</p>
                {actionData.instruction.viewCount === 0 && (
                  <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
                )}
                {actionData.instruction.viewCount >= 1 && actionData.viewableCards && Object.keys(actionData.viewableCards).length > 0 && (
                  <>
                    <div className="flex gap-3 justify-center mb-2">
                      {Object.entries(actionData.viewableCards).map(([id, role]) => (
                        <div key={id} className="flex flex-col items-center gap-1">
                          <RoleIcon roleId={role} size={36} />
                          <span className="text-moon-300 text-xs">{actionData.neighbors?.left?.id === id ? actionData.neighbors.left.name : actionData.neighbors?.right?.name}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
                  </>
                )}
                {actionData.instruction.viewCount === 1 && actionData.instruction.side === 'choice' && (
                  <>
                    <p className="text-white/40 text-xs mb-2">Chọn hàng xóm để xem</p>
                    <div className="flex gap-2 justify-center mb-2">
                      <button className={`px-3 py-1.5 rounded-lg text-xs border ${selected.includes(actionData.neighbors?.left?.id) ? 'bg-purple-500/30 border-purple-400' : 'bg-white/10'}`} onClick={() => handleSelect(actionData.neighbors.left.id)}>{actionData.neighbors.left.name}</button>
                      <button className={`px-3 py-1.5 rounded-lg text-xs border ${selected.includes(actionData.neighbors?.right?.id) ? 'bg-purple-500/30 border-purple-400' : 'bg-white/10'}`} onClick={() => handleSelect(actionData.neighbors.right.id)}>{actionData.neighbors.right.name}</button>
                    </div>
                    <button className="btn-primary text-sm" disabled={selected.length === 0} onClick={() => handleAutoSubmit({ targetId: selected[0] })}>Xem bài</button>
                  </>
                )}
              </div>
            )}

            {effectiveRole === 'blob' && actionData?.members && (
              <div className="text-center">
                <p className="text-lime-400 text-sm font-semibold mb-1">Blob</p>
                <p className="text-white/60 text-sm mb-2">Thành viên Blob (bạn + hàng xóm):</p>
                <div className="flex gap-2 justify-center flex-wrap mb-2">
                  {actionData.members.map(m => (
                    <span key={m.id} className="px-2 py-1 rounded-lg bg-lime-500/20 text-lime-300 text-xs">{m.name}</span>
                  ))}
                </div>
                <p className="text-white/40 text-xs mb-2">Tất cả thành viên Blob phải sống sót để bạn thắng!</p>
                <button className="btn-primary text-sm" onClick={() => handleAutoSubmit()}>Xong</button>
              </div>
            )}

          </div>
        )}

        {isMyTurn && submitted && (
          <div className="card fade-in text-center">
            <p className="text-village-400 text-sm font-semibold">Đã hoàn thành</p>
            {result?.autoExecuted && (
              <p className="text-yellow-300 text-[11px] mt-1 italic">⚠️ Bạn không hoạt động — hệ thống tự động chọn ngẫu nhiên</p>
            )}
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

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} highlightRole={currentRole} gameMode={gameMode} />

      {/* Oracle Special Event now rendered globally in App.jsx */}
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
    prince: 'Prince', cursed: 'Cursed', auraseer: 'Aura Seer',
    alien: 'Alien', syntheticalien: 'Synthetic Alien', cow: 'Cow', groob: 'Groob', zerb: 'Zerb',
    oracle: 'Oracle', rascal: 'Rascal', exposer: 'Exposer', psychic: 'Psychic',
    mortician: 'Mortician', leader: 'Leader', blob: 'Blob',
  };
  const CENTER = ['Center 1', 'Center 2', 'Center 3'];
  function cLabel(slot) {
    if (slot === 'centerWolf') return 'Alpha';
    return CENTER[parseInt(slot.replace('center', ''))] || slot;
  }

  if (displayRole === 'auraseer' && result.touched) {
    if (result.touched.length === 0) {
      return <p className="text-white/50 text-sm mt-1 italic">Không ai có hào quang</p>;
    }
    return (
      <p className="text-purple-300 text-sm mt-1">
        Có hào quang: <strong>{result.touched.map(t => t.name).join(', ')}</strong>
      </p>
    );
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
    if (result.blocked) {
      return <p className="text-village-400/70 text-sm mt-1">Bị khiên Lính Canh chặn</p>;
    }
    if (result.targetPlayer && result.revealed === false) {
      return <p className="text-wolf-400/70 text-sm mt-1">Bài là Sói/Tanner — không công khai</p>;
    }
  }
  // ── Alien phase results ──
  if (displayRole === 'oracle') {
    if (result.oracleChallenge === 'wrong') {
      return <p className="text-wolf-400 text-sm mt-1 font-semibold">SAI! Chế độ SĂN ORACLE kích hoạt!</p>;
    }
    if (result.oracleChallenge === 'correct') {
      return <p className="text-village-400 text-sm mt-1 font-semibold">ĐÚNG! Phe Dân nhận lợi thế!</p>;
    }
    // Oracle joined alien — reveal list of aliens
    if (result.knownAliens?.length > 0) {
      return (
        <div className="text-emerald-300 text-sm mt-1">
          <p className="font-semibold mb-1">Bạn đã gia nhập phe Alien! Đồng bọn:</p>
          <p className="text-emerald-200">{result.knownAliens.map(a => `#${a.seat} ${a.name}`).join(', ')}</p>
          <p className="text-white/40 text-xs italic mt-1">(Họ KHÔNG biết bạn là đồng bọn. Bạn thắng cùng Alien.)</p>
        </div>
      );
    }
    if (result.appReply) return <p className="text-emerald-300/80 text-sm mt-1">{result.appReply}</p>;
    return <p className="text-white/50 text-sm mt-1">Đã trả lời: {result.answer}</p>;
  }
  if (displayRole === 'aliens') {
    if (result.seen) {
      const targetName = result.seen.id?.startsWith('center')
        ? (['Giữa 1', 'Giữa 2', 'Giữa 3'][parseInt(result.seen.id.replace('center', ''))] || result.seen.id)
        : (result.seen.name || result.seen.id);
      return <p className="text-white/70 text-sm mt-1">{targetName}: <strong className="text-emerald-300">{ROLE_SHORT[result.seen.role] || result.seen.role}</strong></p>;
    }
    if (result.swapped) return <p className="text-emerald-300 text-sm mt-1">Đã hoán đổi bài giữa các Alien!</p>;
    if (result.rotated) {
      const dir = result.rotated === 'rotate_left' ? 'TRÁI' : 'PHẢI';
      return (
        <div className="text-emerald-300 text-sm mt-1">
          <p>Chuyền bài sang {dir}.</p>
          {result.receivedFrom && <p className="text-white/60">Nhận bài từ: <strong className="text-emerald-200">{result.receivedFrom}</strong></p>}
          <p>Bài mới: <strong className="text-emerald-200">{ROLE_SHORT[result.newRole] || result.newRole}</strong></p>
        </div>
      );
    }
    if (result.shown && result.revealed) {
      return (
        <div className="text-white/70 text-sm mt-1">
          <p className="mb-1">Bài hiện tại của các Alien:</p>
          {result.revealed.map((a, i) => (
            <p key={i}>#{a.seat} {a.name}: <strong className="text-emerald-300">{ROLE_SHORT[a.role] || a.role}</strong></p>
          ))}
        </div>
      );
    }
  }
  if (displayRole === 'rascal') {
    if (result.skipped) return <p className="text-white/50 text-sm mt-1">Đã bỏ qua</p>;
    if (result.newRole) return <p className="text-white/70 text-sm mt-1">Bài mới: <strong className="text-moon-300">{ROLE_SHORT[result.newRole] || result.newRole}</strong></p>;
    if (result.action) return <p className="text-white/70 text-sm mt-1">Đã thực hiện: {result.action}</p>;
  }
  if (displayRole === 'exposer') {
    if (result.exposed?.length > 0) {
      return (<div className="text-white/70 text-sm mt-1">{result.exposed.map((e, i) => (<p key={i}>{cLabel(e.slot)}: <strong className="text-moon-300">{ROLE_SHORT[e.role] || e.role}</strong></p>))}</div>);
    }
    if (result.skipped) return <p className="text-white/50 text-sm mt-1">Đã bỏ qua</p>;
  }
  if (displayRole === 'psychic') {
    if (Array.isArray(result.seen)) {
      return (<div className="text-white/70 text-sm mt-1">{result.seen.map((s, i) => (
        <p key={i}>#{s.seat || '?'} {s.name || '?'}: <strong className="text-moon-300">{ROLE_SHORT[s.role] || s.role}</strong></p>
      ))}</div>);
    }
    if (result.seen) return <p className="text-white/70 text-sm mt-1">Bài: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role] || result.seen.role}</strong></p>;
  }
  if (displayRole === 'mortician') {
    if (result.seen) return <p className="text-white/70 text-sm mt-1">Bài hàng xóm: <strong className="text-moon-300">{ROLE_SHORT[result.seen.role] || result.seen.role}</strong></p>;
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
    prince: 'Prince', cursed: 'Cursed', auraseer: 'Aura Seer',
    alien: 'Alien', syntheticalien: 'Synthetic Alien', cow: 'Cow', groob: 'Groob', zerb: 'Zerb',
    oracle: 'Oracle', rascal: 'Rascal', exposer: 'Exposer', psychic: 'Psychic',
    mortician: 'Mortician', leader: 'Leader', blob: 'Blob',
  };
  const CENTER = ['Center 1', 'Center 2', 'Center 3'];
  function cName(slot) {
    if (slot === 'centerWolf') return 'Alpha';
    const idx = parseInt(slot.replace('center', ''));
    return CENTER[idx] || slot;
  }

  const items = [];

  if (knowledge.doppelgangerCopiedRole) items.push(`🎭 Hóa Thân → ${ROLE_SHORT[knowledge.doppelgangerCopiedRole] || knowledge.doppelgangerCopiedRole}`);
  if (knownWerewolves.length > 0) items.push(`🐺 Sói: ${knownWerewolves.map(id => nameMap[id] || '?').join(', ')}`);
  if (knownMasons.length > 0) items.push(`Sinh Đôi: ${knownMasons.map(id => nameMap[id] || '?').join(', ')}`);
  if (knowledge.knownAliens?.length > 0) {
    const roles = knowledge.knownAlienRoles || {};
    const labelOf = (r) => r === 'groob' ? 'Groob' : r === 'zerb' ? 'Zerb' : r === 'syntheticalien' ? 'Synthetic' : r === 'alien' ? 'Alien' : null;
    const formatted = knowledge.knownAliens.map(id => {
      const name = nameMap[id] || '?';
      const lab = labelOf(roles[id]);
      return lab ? `${name} (${lab})` : name;
    }).join(', ');
    items.push(`👽 Alien: ${formatted}`);
  }
  if (knowledge.knownGroobZerb?.length > 0) items.push(`👾 Groob & Zerb: ${knowledge.knownGroobZerb.map(id => nameMap[id] || '?').join(', ')}`);
  if (knowledge.knownCow) items.push(`🐄 Cow: ${nameMap[knowledge.knownCow] || '?'}`);
  if (knowledge.auraSeen) {
    const aura = knowledge.auraTouched || [];
    if (aura.length > 0) {
      items.push(`✨ Hào quang: ${aura.map(t => t.name || nameMap[t.id] || '?').join(', ')}`);
    } else {
      items.push(`✨ Hào quang: Không có ai`);
    }
  }
  if (knowledge.oracleRevealed) {
    items.push(`👁️ Oracle: ${knowledge.oracleRevealed.name} (ghế #${knowledge.oracleRevealed.seat}) — thấu thị`);
  }
  if (knowledge.blobMembers?.length > 0) {
    items.push(`🟢 Blob: ${knowledge.blobMembers.map(m => m.name).join(', ')}`);
  }
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

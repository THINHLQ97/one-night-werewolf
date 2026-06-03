import { useState, useEffect } from 'react';
import GameTable from '../components/GameTable';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';
import TokenClaimBoard from '../components/TokenClaimBoard';
import VoiceChatControls from '../components/VoiceChatControls';
import ChatPanel from '../components/ChatPanel';

function useCountdown(timerEnd, paused, pausedRemaining) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (paused && pausedRemaining != null) {
      setRemaining(Math.max(0, Math.ceil(pausedRemaining / 1000)));
      return;
    }
    if (!timerEnd) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEnd, paused, pausedRemaining]);

  return remaining;
}

const ROLE_SHORT = {
  doppelganger: 'Doppelgänger',
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
  drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
  apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
  villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
  prince: 'Prince', cursed: 'Cursed', auraseer: 'Aura Seer',
};
const CENTER = ['Center 1', 'Center 2', 'Center 3'];
function centerName(slot) {
  if (slot === 'centerWolf') return 'Alpha';
  const idx = parseInt(slot.replace('center', ''));
  return CENTER[idx] || slot;
}

export default function DayScreen({ dayState, myId, isHost, onVote, onBodyguardProtect, onEndDay, onTimerPause, onTimerResume, onTimerAdjust, nightKnowledge, myRole, hasAlphaWolf, hunterPhase, onHunterShoot, tokenClaims, onDeductionSet, onDeductionClear, roomCode, voiceSpeaking, chatMessages }) {
  const { timerEnd, votes, bodyguardProtect, players, paused, pausedRemaining, shieldedPlayer, votingPhase, votingTimerEnd } = dayState;
  // Use voting timer when in voting phase, otherwise discussion timer
  const activeTimerEnd = votingPhase ? votingTimerEnd : timerEnd;
  const remaining = useCountdown(activeTimerEnd, votingPhase ? false : paused, votingPhase ? null : pausedRemaining);
  const isBodyguard = myRole?.roleId === 'bodyguard';
  const myVote = isBodyguard ? null : votes[myId];
  const myProtect = isBodyguard ? bodyguardProtect?.targetId : null;
  const [roleHidden, setRoleHidden] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');

  const votedCount = Object.keys(votes).length + (bodyguardProtect ? 1 : 0);

  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole } = nightKnowledge || {};

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col px-3 py-3 sm:p-4 max-w-xl mx-auto fade-in relative z-10">
      {/* Header */}
      <div className="text-center pt-2 pb-2">
        <div className="flex items-center justify-center gap-3 mb-1">
          <span className={votingPhase ? 'text-wolf-400' : 'text-yellow-400'}>
            <Icon name={votingPhase ? 'lightning' : 'sun'} size={28} />
          </span>
          <div>
            <h2 className={`text-lg font-bold ${votingPhase ? 'text-wolf-300' : 'text-moon-300'}`}>
              {votingPhase ? 'Bỏ phiếu' : 'Thảo luận'}
            </h2>
            <div className={`text-2xl font-mono font-bold flex items-center justify-center gap-1.5 ${
              votingPhase ? 'text-wolf-400' : paused ? 'text-yellow-400 animate-pulse' : remaining < 60 ? 'text-wolf-400' : 'text-white/80'
            }`}>
              {paused && !votingPhase && <Icon name="pause" size={16} />}
              {mins}:{secs}
            </div>
          </div>
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
          <ChatPanel roomCode={roomCode} myId={myId} players={players} messages={chatMessages} />
        </div>
        <p className="text-white/40 text-xs mt-1">
          {votingPhase
            ? `${votedCount}/${players.length} đã vote · ${isBodyguard ? 'Chạm vào người chơi để BẢO VỆ' : 'Chạm vào người chơi để vote'}`
            : 'Hãy thảo luận, thời gian bỏ phiếu sẽ bắt đầu sau khi hết giờ'
          }
        </p>
      </div>

      {/* My role reminder */}
      {myRole && !roleHidden && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <RoleIcon roleId={myCurrentRole || myRole.roleId} size={22} circular isDoppel={myRole.roleId === 'doppelganger' && (myCurrentRole || myRole.roleId) !== 'doppelganger'} />
          <span className="text-white/50 text-xs">
            Vai của bạn: {ROLE_SHORT[myCurrentRole || myRole.roleId]}
            {myRole.roleId === 'doppelganger' && (myCurrentRole || myRole.roleId) !== 'doppelganger' && (
              <span className="text-purple-400/70"> 🎭</span>
            )}
          </span>
        </div>
      )}

      {/* Game Table with voting */}
      <GameTable
        players={players}
        myId={myId}
        revealedPlayers={roleHidden ? {} : revealedPlayers}
        revealedCenter={roleHidden ? {} : revealedCenter}
        knownWerewolves={roleHidden ? [] : knownWerewolves}
        knownMasons={roleHidden ? [] : knownMasons}
        swappedPairs={roleHidden ? [] : swappedPairs}
        myCurrentRole={roleHidden ? null : (myCurrentRole || myRole?.roleId)}
        selectable={votingPhase ? 'player' : 'none'}
        selected={isBodyguard ? (myProtect ? [myProtect] : []) : (myVote ? [myVote] : [])}
        onSelect={votingPhase ? (isBodyguard ? onBodyguardProtect : onVote) : () => {}}
        votes={votes}
        isNight={false}
        hasAlphaWolf={hasAlphaWolf}
        shieldedPlayer={shieldedPlayer}
        voiceSpeaking={voiceSpeaking || {}}
      />

      {/* Token Claim Board */}
      {tokenClaims && (
        <div className="mt-3">
          <TokenClaimBoard
            tokenClaims={tokenClaims}
            hasAlphaWolf={hasAlphaWolf}
            myId={myId}
            players={players}
            onDeductionSet={onDeductionSet}
            onDeductionClear={onDeductionClear}
          />
        </div>
      )}

      {/* Vote status */}
      <div className="mt-3 flex-1">
        {votingPhase && isBodyguard && myProtect && (
          <p className="text-center text-village-400/60 text-xs mb-2 flex items-center justify-center gap-1.5">
            <Icon name="shield" size={14} /> Bạn đang bảo vệ người này. Chạm người khác để đổi.
          </p>
        )}
        {votingPhase && !isBodyguard && myVote && (
          <p className="text-center text-white/40 text-xs mb-2">
            Bạn đã vote. Chạm vào người khác để đổi ý.
          </p>
        )}

        {/* Night knowledge notebook */}
        {!roleHidden && nightKnowledge && (
          <div className="p-3 bg-night-800/80 border border-moon-400/20 rounded-xl mb-3">
            <p className="text-moon-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Icon name="notebook" size={14} /> Dữ kiện từ đêm qua
            </p>
            <KnowledgeSummary knowledge={nightKnowledge} players={players} />
          </div>
        )}

        {isHost && (
          <div className="space-y-2">
            {/* Timer controls — only during discussion phase */}
            {!votingPhase && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={paused ? onTimerResume : onTimerPause}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    paused
                      ? 'bg-village-500/20 border border-village-400/30 text-village-300'
                      : 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-300'
                  }`}
                >
                  <Icon name={paused ? 'play' : 'pause'} size={12} />
                  {paused ? 'Tiếp tục' : 'Tạm dừng'}
                </button>
                <button
                  onClick={() => onTimerAdjust(-30)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10"
                >
                  −30s
                </button>
                <button
                  onClick={() => onTimerAdjust(30)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10"
                >
                  +30s
                </button>
                <button
                  onClick={() => onTimerAdjust(60)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10"
                >
                  +1m
                </button>
              </div>
            )}
            <button className="btn-danger w-full text-sm flex items-center justify-center gap-1.5" onClick={onEndDay}>
              <Icon name="lightning" size={16} /> {votingPhase ? 'Kết thúc bỏ phiếu ngay' : 'Bỏ phiếu ngay'}
            </button>
          </div>
        )}
      </div>

      {hunterPhase && (
        <HunterPhaseOverlay
          hunterPhase={hunterPhase}
          myId={myId}
          players={players}
          onShoot={onHunterShoot}
        />
      )}

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
    </div>
  );
}

function HunterPhaseOverlay({ hunterPhase, myId, players, onShoot }) {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const isMyTurn = hunterPhase.isMyTurn && !submitted;

  const hunterNames = hunterPhase.hunters?.map(h => h.name).join(', ') || '';

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center">
        <div className="mb-3 text-wolf-400"><Icon name="crosshair" size={40} /></div>
        <h2 className="text-xl font-bold text-wolf-400 mb-2">Thợ Săn bị loại!</h2>
        <p className="text-white/60 text-sm mb-4">
          {isMyTurn
            ? 'Bạn là Thợ Săn! Chọn 1 người để bắn theo.'
            : `${hunterNames} là Thợ Săn và đang chọn người để bắn...`
          }
        </p>

        {isMyTurn && (
          <div className="space-y-2 mb-4">
            {hunterPhase.otherPlayers.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`w-full py-2 px-4 rounded-lg text-sm transition-all ${
                  selected === p.id
                    ? 'bg-wolf-500 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {isMyTurn && selected && (
          <button
            className="btn-primary w-full flex items-center justify-center gap-2"
            onClick={() => { setSubmitted(true); onShoot(selected); }}
          >
            <Icon name="crosshair" size={18} /> Bắn {hunterPhase.otherPlayers.find(p => p.id === selected)?.name}
          </button>
        )}

        {!isMyTurn && (
          <div className="animate-pulse text-white/40 text-sm">
            Đang chờ Thợ Săn chọn mục tiêu...
          </div>
        )}
      </div>
    </div>
  );
}

function KnowledgeSummary({ knowledge, players }) {
  const { revealedPlayers = {}, revealedCenter = {}, knownWerewolves = [], knownMasons = [], swappedPairs = [], myCurrentRole } = knowledge;
  const nameMap = {};
  players.forEach(p => { nameMap[p.id] = p.name; });

  const items = [];

  if (knownWerewolves.length > 0) items.push(`Sói: ${knownWerewolves.map(id => nameMap[id] || '?').join(', ')}`);
  if (knownMasons.length > 0) items.push(`Sinh Đôi: ${knownMasons.map(id => nameMap[id] || '?').join(', ')}`);
  Object.entries(revealedPlayers).forEach(([id, role]) => items.push(`${nameMap[id]}: ${ROLE_SHORT[role] || role}`));
  Object.entries(revealedCenter).forEach(([slot, role]) => items.push(`${centerName(slot)}: ${ROLE_SHORT[role] || role}`));
  swappedPairs.forEach(([a, b]) => {
    const nameA = a.startsWith('center') ? centerName(a) : nameMap[a] || '?';
    const nameB = b.startsWith('center') ? centerName(b) : nameMap[b] || '?';
    items.push(`${nameA} ↔ ${nameB}`);
  });
  if (myCurrentRole) items.push(`Bài hiện tại: ${ROLE_SHORT[myCurrentRole] || myCurrentRole}`);

  if (items.length === 0) return <p className="text-white/30 text-xs">Không có thông tin đặc biệt</p>;

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <p key={i} className="text-white/60 text-xs">{item}</p>
      ))}
    </div>
  );
}

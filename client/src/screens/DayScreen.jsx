import { useState, useEffect } from 'react';
import GameTable from '../components/GameTable';
import RoleIcon from '../components/RoleIcon';
import RoleLibrary, { RoleLibraryButton } from '../components/RoleLibrary';

function useCountdown(timerEnd) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!timerEnd) return;
    const tick = () => setRemaining(Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [timerEnd]);

  return remaining;
}

const ROLE_SHORT = {
  werewolf: 'Werewolf', minion: 'Minion', seer: 'Seer', robber: 'Robber', troublemaker: 'Troublemaker',
  drunk: 'Drunk', insomniac: 'Insomniac', villager: 'Villager', hunter: 'Hunter', tanner: 'Tanner', mason: 'Mason',
  sentinel: 'Sentinel', alphawolf: 'Alpha Wolf', mysticwolf: 'Mystic Wolf', dreamwolf: 'Dream Wolf',
  apprenticeseer: 'Apprentice Seer', paranormalinvestigator: 'P.I.', witch: 'Witch',
  villageidiot: 'Village Idiot', revealer: 'Revealer', bodyguard: 'Bodyguard',
};
const CENTER = ['Center 1', 'Center 2', 'Center 3'];
function centerName(slot) {
  if (slot === 'centerWolf') return '🐺 Alpha';
  const idx = parseInt(slot.replace('center', ''));
  return CENTER[idx] || slot;
}

export default function DayScreen({ dayState, myId, isHost, onVote, onBodyguardProtect, onEndDay, nightKnowledge, myRole, hasAlphaWolf, hunterPhase, onHunterShoot }) {
  const { timerEnd, votes, bodyguardProtect, players } = dayState;
  const remaining = useCountdown(timerEnd);
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
    <div className="min-h-screen min-h-[100dvh] flex flex-col px-3 py-3 sm:p-4 max-w-lg mx-auto fade-in">
      {/* Header */}
      <div className="text-center pt-2 pb-2">
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">☀️</span>
          <div>
            <h2 className="text-lg font-bold text-moon-300">Thảo luận & Bỏ phiếu</h2>
            <div className={`text-2xl font-mono font-bold ${remaining < 60 ? 'text-wolf-400' : 'text-white/80'}`}>
              {mins}:{secs}
            </div>
          </div>
          <div className="flex gap-1.5">
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
        <p className="text-white/40 text-xs mt-1">
          {votedCount}/{players.length} đã vote · {isBodyguard ? '💪 Chạm vào người chơi để BẢO VỆ' : 'Chạm vào người chơi để vote'}
        </p>
      </div>

      {/* My role reminder */}
      {myRole && !roleHidden && (
        <div className="flex items-center justify-center gap-2 mb-2">
          <RoleIcon roleId={myCurrentRole || myRole.roleId} size={20} />
          <span className="text-white/50 text-xs">Vai của bạn: {ROLE_SHORT[myCurrentRole || myRole.roleId]}</span>
        </div>
      )}

      {/* Game Table with voting */}
      <GameTable
        players={players}
        myId={myId}
        revealedPlayers={roleHidden ? {} : revealedPlayers}
        revealedCenter={roleHidden ? {} : revealedCenter}
        knownWerewolves={roleHidden ? [] : knownWerewolves}
        swappedPairs={roleHidden ? [] : swappedPairs}
        myCurrentRole={roleHidden ? null : (myCurrentRole || myRole?.roleId)}
        selectable="player"
        selected={isBodyguard ? (myProtect ? [myProtect] : []) : (myVote ? [myVote] : [])}
        onSelect={isBodyguard ? onBodyguardProtect : onVote}
        votes={votes}
        isNight={false}
        hasAlphaWolf={hasAlphaWolf}
      />

      {/* Vote status */}
      <div className="mt-3 flex-1">
        {isBodyguard && myProtect && (
          <p className="text-center text-village-400/60 text-xs mb-2">
            💪 Bạn đang bảo vệ người này. Chạm người khác để đổi.
          </p>
        )}
        {!isBodyguard && myVote && (
          <p className="text-center text-white/40 text-xs mb-2">
            Bạn đã vote. Chạm vào người khác để đổi ý.
          </p>
        )}

        {/* Night knowledge notebook */}
        {!roleHidden && nightKnowledge && (
          <div className="p-3 bg-night-800/80 border border-moon-400/20 rounded-xl mb-3">
            <p className="text-moon-400 text-xs font-semibold mb-2">📓 Dữ kiện từ đêm qua</p>
            <KnowledgeSummary knowledge={nightKnowledge} players={players} />
          </div>
        )}

        {isHost && (
          <button className="btn-danger w-full text-sm" onClick={onEndDay}>
            ⚡ Kết thúc bỏ phiếu ngay
          </button>
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
        <div className="text-4xl mb-3">🏹</div>
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
            className="btn-primary w-full"
            onClick={() => { setSubmitted(true); onShoot(selected); }}
          >
            🏹 Bắn {hunterPhase.otherPlayers.find(p => p.id === selected)?.name}
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

  if (knownWerewolves.length > 0) {
    items.push(`🐺 Sói: ${knownWerewolves.map(id => nameMap[id] || '?').join(', ')}`);
  }
  if (knownMasons.length > 0) {
    items.push(`🤝 Sinh Đôi: ${knownMasons.map(id => nameMap[id] || '?').join(', ')}`);
  }
  Object.entries(revealedPlayers).forEach(([id, role]) => {
    items.push(`👤 ${nameMap[id]}: ${ROLE_SHORT[role] || role}`);
  });
  Object.entries(revealedCenter).forEach(([slot, role]) => {
    items.push(`🃏 ${centerName(slot)}: ${ROLE_SHORT[role] || role}`);
  });
  swappedPairs.forEach(([a, b]) => {
    const nameA = a.startsWith('center') ? centerName(a) : nameMap[a] || '?';
    const nameB = b.startsWith('center') ? centerName(b) : nameMap[b] || '?';
    items.push(`🔄 ${nameA} ↔ ${nameB}`);
  });
  if (myCurrentRole) {
    items.push(`📋 Bài hiện tại: ${ROLE_SHORT[myCurrentRole] || myCurrentRole}`);
  }

  if (items.length === 0) return <p className="text-white/30 text-xs">Không có thông tin đặc biệt</p>;

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <p key={i} className="text-white/60 text-xs">{item}</p>
      ))}
    </div>
  );
}

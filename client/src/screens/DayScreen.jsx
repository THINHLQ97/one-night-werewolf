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

export default function DayScreen({ dayState, myId, isHost, onVote, onEndDay, nightKnowledge, myRole }) {
  const { timerEnd, votes, players } = dayState;
  const remaining = useCountdown(timerEnd);
  const myVote = votes[myId];
  const [roleHidden, setRoleHidden] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0');
  const secs = String(remaining % 60).padStart(2, '0');

  const votedCount = Object.keys(votes).length;

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
          {votedCount}/{players.length} đã vote · Chạm vào người chơi để vote
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
        selected={myVote ? [myVote] : []}
        onSelect={onVote}
        votes={votes}
        isNight={false}
      />

      {/* Vote status */}
      <div className="mt-3 flex-1">
        {myVote && (
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

      <RoleLibrary isOpen={libraryOpen} onClose={() => setLibraryOpen(false)} />
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
    const idx = parseInt(slot.replace('center', ''));
    items.push(`🃏 ${CENTER[idx]}: ${ROLE_SHORT[role] || role}`);
  });
  swappedPairs.forEach(([a, b]) => {
    const nameA = a.startsWith('center') ? CENTER[parseInt(a.replace('center', ''))] : nameMap[a] || '?';
    const nameB = b.startsWith('center') ? CENTER[parseInt(b.replace('center', ''))] : nameMap[b] || '?';
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

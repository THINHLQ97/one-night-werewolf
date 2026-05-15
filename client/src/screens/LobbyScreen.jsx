import { useState } from 'react';
import socket from '../socket';
import RoleIcon from '../components/RoleIcon';

const ALL_ROLES = [
  { id: 'werewolf', name: 'Werewolf', emoji: '🐺', team: 'werewolf', max: 2 },
  { id: 'minion',   name: 'Minion',   emoji: '🦹', team: 'werewolf', max: 1 },
  { id: 'seer',     name: 'Seer',     emoji: '🔮', team: 'village',  max: 1 },
  { id: 'robber',   name: 'Robber',   emoji: '🦝', team: 'village',  max: 1 },
  { id: 'troublemaker', name: 'Troublemaker', emoji: '😈', team: 'village', max: 1 },
  { id: 'drunk',    name: 'Drunk',    emoji: '🍺', team: 'village',  max: 1 },
  { id: 'insomniac',name: 'Insomniac',emoji: '👁️', team: 'village',  max: 1 },
  { id: 'hunter',   name: 'Hunter',   emoji: '🏹', team: 'village',  max: 1 },
  { id: 'tanner',   name: 'Tanner',   emoji: '💀', team: 'tanner',  max: 1 },
  { id: 'villager', name: 'Villager', emoji: '👨‍🌾', team: 'village',  max: 3 },
];

const TEAM_COLOR = { werewolf: 'text-wolf-400', village: 'text-village-400', tanner: 'text-purple-400' };
const TEAM_LABEL = { werewolf: 'Phe Sói', village: 'Phe Dân', tanner: 'Phe Riêng' };
const TEAM_BG = { werewolf: 'bg-wolf-500/10 border-wolf-500/30', village: 'bg-village-400/10 border-village-400/30', tanner: 'bg-purple-500/10 border-purple-500/30' };

const ROLE_DETAILS = {
  werewolf: {
    nightAction: 'Mở mắt và nhìn đồng bọn Sói. Nếu là Sói đơn độc, được xem 1 bài ở giữa.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Hãy tỏ ra vô tội và đổ lỗi cho người khác. Nếu là Sói đơn, dùng thông tin bài giữa để tạo alibi.',
  },
  minion: {
    nightAction: 'Mở mắt và biết ai là Sói. Nhưng Sói không biết bạn là Tay Sai.',
    winCondition: 'Thắng cùng phe Sói. Nếu bạn bị loại thay Sói, phe Sói vẫn thắng.',
    tips: 'Hãy thu hút sự nghi ngờ về phía mình để bảo vệ Sói. Có thể nhận mình là Sói giả.',
  },
  seer: {
    nightAction: 'Chọn xem bài của 1 người chơi khác, HOẶC xem 2 bài ở giữa.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Chia sẻ thông tin bạn biết nhưng cẩn thận — Sói có thể giả danh Tiên Tri.',
  },
  robber: {
    nightAction: 'Đổi bài của bạn với bài của 1 người khác, sau đó xem bài mới của mình.',
    winCondition: 'Bạn thuộc phe của bài MỚI. Nếu lấy được bài Sói, bạn là Sói.',
    tips: 'Nếu lấy được vai tốt, hãy khai báo. Nếu lấy Sói... hãy im lặng và đánh lạc hướng.',
  },
  troublemaker: {
    nightAction: 'Hoán đổi bài của 2 người khác (không xem bài).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Khai báo bạn đã đổi ai. Điều này giúp xác định ai đang nắm bài gì.',
  },
  drunk: {
    nightAction: 'Đổi bài của bạn với 1 bài ở giữa (không được xem bài mới).',
    winCondition: 'Bạn thuộc phe của bài MỚI, nhưng bạn không biết đó là bài gì.',
    tips: 'Bạn không biết vai mới — hãy lắng nghe và suy luận từ thông tin người khác.',
  },
  insomniac: {
    nightAction: 'Thức dậy cuối cùng và xem bài hiện tại của mình (sau khi có thể bị đổi).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Nếu bài bạn bị đổi, ai đó đã lấy vai cũ của bạn — hãy tìm ra ai.',
  },
  hunter: {
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng cùng phe Dân. Nếu bạn bị loại, người bạn vote cũng bị loại theo.',
    tips: 'Hãy vote cẩn thận! Nếu bạn bị loại, vote của bạn sẽ kéo theo 1 người nữa.',
  },
  tanner: {
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng nếu bạn bị loại. Phe Sói và Dân đều thua nếu Tanner thắng.',
    tips: 'Hành xử đáng ngờ vừa đủ để bị vote, nhưng đừng lộ liễu quá.',
  },
  villager: {
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Lắng nghe, phân tích và tìm mâu thuẫn trong lời khai của mọi người.',
  },
};

export default function LobbyScreen({ roomCode, players, hostId, isHost, settings, onSettingsChange, onStartGame }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const selected = settings.selectedRoles || [];
  const needed = players.length + 3;

  function countRole(id) {
    return selected.filter(r => r === id).length;
  }

  function addRole(id) {
    const role = ALL_ROLES.find(r => r.id === id);
    if (countRole(id) >= role.max) return;
    onSettingsChange([...selected, id]);
  }

  function removeRole(id) {
    const idx = selected.lastIndexOf(id);
    if (idx === -1) return;
    const next = [...selected];
    next.splice(idx, 1);
    onSettingsChange(next);
  }

  function handleStart() {
    setError('');
    if (selected.length !== needed) {
      return setError(`Cần đúng ${needed} bài (${players.length} người + 3 bài giữa). Hiện có ${selected.length}.`);
    }
    setLoading(true);
    onStartGame((res) => {
      setLoading(false);
      if (res?.error) setError(res.error);
    });
  }

  function handleRename() {
    if (!newName.trim()) return;
    socket.emit('rename_player', { name: newName.trim() });
    setEditingName(false);
    setNewName('');
  }

  const copied = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const myPlayer = players.find(p => p.id === socket.id);

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto fade-in">
      {/* Room code */}
      <div className="text-center pt-6 pb-4">
        <p className="text-white/50 text-sm mb-1">Mã phòng</p>
        <button
          onClick={copied}
          className="text-5xl font-bold tracking-[0.3em] text-moon-300 hover:text-moon-200 transition-colors"
          title="Nhấn để copy"
        >
          {roomCode}
        </button>
        <p className="text-white/40 text-xs mt-1">Nhấn để copy · Chia sẻ với bạn bè</p>
      </div>

      {/* Players */}
      <div className="card mb-4">
        <h3 className="text-moon-400 font-semibold mb-3">
          👥 Người chơi ({players.length}/10)
        </h3>
        <div className="flex flex-wrap gap-2">
          {players.map(p => (
            <span
              key={p.id}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                p.id === hostId
                  ? 'bg-moon-400/20 text-moon-300 border border-moon-400/40'
                  : 'bg-white/10 text-white/80'
              }`}
            >
              {p.id === hostId ? '👑 ' : ''}{p.name}
              {p.id === socket.id ? ' (Bạn)' : ''}
            </span>
          ))}
        </div>

        {/* Rename */}
        {!editingName ? (
          <button
            className="text-moon-400/60 text-xs mt-3 hover:text-moon-300 transition-colors"
            onClick={() => { setEditingName(true); setNewName(myPlayer?.name || ''); }}
          >
            ✏️ Đổi tên
          </button>
        ) : (
          <div className="flex gap-2 mt-3">
            <input
              className="input text-sm py-1.5 flex-1"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setEditingName(false); }}
            />
            <button className="btn-primary text-xs px-3 py-1" onClick={handleRename}>Lưu</button>
            <button className="btn-ghost text-xs px-3 py-1" onClick={() => setEditingName(false)}>Hủy</button>
          </div>
        )}
      </div>

      {/* Role setup */}
      <div className="card mb-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-moon-400 font-semibold">🃏 Chọn bài</h3>
          <span className={`text-sm font-mono ${selected.length === needed ? 'text-village-400' : 'text-wolf-400'}`}>
            {selected.length}/{needed}
          </span>
        </div>

        {!isHost && (
          <p className="text-white/40 text-sm mb-3">Chỉ host mới có thể chọn bài</p>
        )}

        <div className="space-y-1">
          {ALL_ROLES.map(role => {
            const count = countRole(role.id);
            const details = ROLE_DETAILS[role.id];
            const isExpanded = expandedRole === role.id;

            return (
              <div key={role.id}>
                <div className="flex items-center justify-between py-1.5">
                  <button
                    className="flex items-center gap-2 flex-1 text-left"
                    onClick={() => setExpandedRole(isExpanded ? null : role.id)}
                  >
                    <RoleIcon roleId={role.id} size={28} />
                    <span className={`text-sm font-medium ${TEAM_COLOR[role.team]}`}>{role.name}</span>
                    <span className={`text-white/30 text-[10px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                  </button>

                  {isHost ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeRole(role.id)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 disabled:opacity-30"
                        disabled={count === 0}
                      >−</button>
                      <span className="w-5 text-center font-bold text-moon-300">{count}</span>
                      <button
                        onClick={() => addRole(role.id)}
                        className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 disabled:opacity-30"
                        disabled={count >= role.max}
                      >+</button>
                    </div>
                  ) : (
                    <span className="text-moon-400 font-bold w-5 text-center">{count}</span>
                  )}
                </div>

                {/* Expanded role details */}
                {isExpanded && details && (
                  <div className={`ml-2 mb-2 p-3 rounded-xl border text-xs space-y-2 ${TEAM_BG[role.team]}`}>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        role.team === 'werewolf' ? 'bg-wolf-500/30 text-wolf-300' :
                        role.team === 'tanner' ? 'bg-purple-500/30 text-purple-300' :
                        'bg-village-400/30 text-village-300'
                      }`}>{TEAM_LABEL[role.team]}</span>
                      {role.max > 1 && <span className="text-white/30">tối đa {role.max}</span>}
                    </div>

                    <div>
                      <p className="text-moon-400 font-semibold mb-0.5">🌙 Ban đêm</p>
                      <p className="text-white/60">{details.nightAction}</p>
                    </div>

                    <div>
                      <p className="text-moon-400 font-semibold mb-0.5">🏆 Điều kiện thắng</p>
                      <p className="text-white/60">{details.winCondition}</p>
                    </div>

                    <div>
                      <p className="text-moon-400 font-semibold mb-0.5">💡 Mẹo chơi</p>
                      <p className="text-white/60">{details.tips}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-wolf-400 text-sm text-center mb-3">{error}</p>}

      {isHost && (
        <button
          className="btn-primary w-full text-lg py-4"
          onClick={handleStart}
          disabled={loading || players.length < 3}
        >
          {loading ? 'Đang bắt đầu...' : '🌙 Bắt đầu game'}
        </button>
      )}
      {!isHost && (
        <p className="text-center text-white/40 text-sm py-4">
          Chờ host bắt đầu game...
        </p>
      )}
    </div>
  );
}

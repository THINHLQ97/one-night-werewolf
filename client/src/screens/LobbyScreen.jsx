import { useState } from 'react';
import socket from '../socket';
import RoleIcon from '../components/RoleIcon';
import Icon from '../components/Icon';
import RankBadge from '../components/RankBadge';
import VoiceChatControls from '../components/VoiceChatControls';
import ChatPanel from '../components/ChatPanel';

const WEREWOLF_ROLES = [
  // Base
  { id: 'doppelganger', name: 'Doppelgänger', emoji: '🎭', team: 'village', max: 1, expansion: 'base' },
  { id: 'werewolf', name: 'Werewolf', emoji: '🐺', team: 'werewolf', max: 5, expansion: 'base' },
  { id: 'minion',   name: 'Minion',   emoji: '🦹', team: 'werewolf', max: 1, expansion: 'base' },
  { id: 'mason',    name: 'Mason',    emoji: '🤝', team: 'village',  max: 2, expansion: 'base' },
  { id: 'seer',     name: 'Seer',     emoji: '🔮', team: 'village',  max: 1, expansion: 'base' },
  { id: 'robber',   name: 'Robber',   emoji: '🦝', team: 'village',  max: 1, expansion: 'base' },
  { id: 'troublemaker', name: 'Troublemaker', emoji: '😈', team: 'village', max: 1, expansion: 'base' },
  { id: 'drunk',    name: 'Drunk',    emoji: '🍺', team: 'village',  max: 1, expansion: 'base' },
  { id: 'insomniac',name: 'Insomniac',emoji: '👁️', team: 'village',  max: 1, expansion: 'base' },
  { id: 'hunter',   name: 'Hunter',   emoji: '🏹', team: 'village',  max: 1, expansion: 'base' },
  { id: 'tanner',   name: 'Tanner',   emoji: '💀', team: 'tanner',  max: 1, expansion: 'base' },
  { id: 'villager', name: 'Villager', emoji: '👨‍🌾', team: 'village',  max: 5, expansion: 'base' },
  // Daybreak
  { id: 'sentinel',  name: 'Sentinel',  emoji: '🛡️', team: 'village',  max: 1, expansion: 'daybreak' },
  { id: 'alphawolf', name: 'Alpha Wolf', emoji: '🐺', team: 'werewolf', max: 1, expansion: 'daybreak' },
  { id: 'mysticwolf',name: 'Mystic Wolf',emoji: '🐺', team: 'werewolf', max: 1, expansion: 'daybreak' },
  { id: 'dreamwolf', name: 'Dream Wolf', emoji: '🐺', team: 'werewolf', max: 1, expansion: 'daybreak' },
  { id: 'apprenticeseer', name: 'Apprentice Seer', emoji: '🔮', team: 'village', max: 1, expansion: 'daybreak' },
  { id: 'paranormalinvestigator', name: 'P.I.', emoji: '🕵️', team: 'village', max: 1, expansion: 'daybreak' },
  { id: 'witch',     name: 'Witch',     emoji: '🧙', team: 'village',  max: 1, expansion: 'daybreak' },
  { id: 'villageidiot', name: 'Village Idiot', emoji: '🤪', team: 'village', max: 1, expansion: 'daybreak' },
  { id: 'revealer',  name: 'Revealer',  emoji: '🔦', team: 'village',  max: 1, expansion: 'daybreak' },
  { id: 'bodyguard', name: 'Bodyguard', emoji: '💪', team: 'village',  max: 1, expansion: 'daybreak' },
  { id: 'prince',    name: 'Prince',    emoji: '👑', team: 'village',  max: 1, expansion: 'daybreak' },
  { id: 'cursed',    name: 'Cursed',    emoji: '🩸', team: 'village',  max: 1, expansion: 'daybreak' },
  { id: 'auraseer',  name: 'Aura Seer', emoji: '✨', team: 'village',  max: 1, expansion: 'daybreak' },
];

const ALIEN_ROLES = [
  { id: 'alien',    name: 'Alien',    emoji: '👽', team: 'alien',     max: 3, expansion: 'alien' },
  { id: 'syntheticalien', name: 'Synthetic Alien', emoji: '🤖', team: 'synthetic', max: 1, expansion: 'alien' },
  { id: 'groob',    name: 'Groob',    emoji: '👾', team: 'alien',     max: 1, expansion: 'alien' },
  { id: 'zerb',     name: 'Zerb',     emoji: '👾', team: 'alien',     max: 1, expansion: 'alien' },
  { id: 'leader',   name: 'Leader',   emoji: '👑', team: 'village',   max: 1, expansion: 'alien' },
  { id: 'cow',      name: 'Cow',      emoji: '🐄', team: 'village',   max: 1, expansion: 'alien' },
  { id: 'oracle',   name: 'Oracle',   emoji: '🔮', team: 'village',   max: 1, expansion: 'alien' },
  { id: 'rascal',   name: 'Rascal',   emoji: '😈', team: 'village',   max: 1, expansion: 'alien' },
  { id: 'exposer',  name: 'Exposer',  emoji: '🔦', team: 'village',   max: 1, expansion: 'alien' },
  { id: 'psychic',  name: 'Psychic',  emoji: '🧠', team: 'village',   max: 1, expansion: 'alien' },
  { id: 'mortician',name: 'Mortician', emoji: '⚰️', team: 'mortician', max: 1, expansion: 'alien' },
  { id: 'blob',     name: 'Blob',     emoji: '🟢', team: 'blob',      max: 1, expansion: 'alien' },
];

const ALL_ROLES = [...WEREWOLF_ROLES, ...ALIEN_ROLES];

const TEAM_COLOR = { werewolf: 'text-wolf-400', village: 'text-village-400', tanner: 'text-purple-400', alien: 'text-emerald-400', synthetic: 'text-cyan-400', mortician: 'text-amber-400', blob: 'text-lime-400' };
const TEAM_LABEL = { werewolf: 'Phe Sói', village: 'Phe Dân', tanner: 'Phe Riêng', alien: 'Phe Alien', synthetic: 'Phe Riêng', mortician: 'Phe Riêng', blob: 'Phe Blob' };
const TEAM_BG = { werewolf: 'bg-wolf-500/10 border-wolf-500/30', village: 'bg-village-400/10 border-village-400/30', tanner: 'bg-purple-500/10 border-purple-500/30', alien: 'bg-emerald-500/10 border-emerald-500/30', synthetic: 'bg-cyan-500/10 border-cyan-500/30', mortician: 'bg-amber-500/10 border-amber-500/30', blob: 'bg-lime-500/10 border-lime-500/30' };

const ROLE_DETAILS = {
  doppelganger: {
    nightAction: 'Thức dậy ĐẦU TIÊN. Xem bài 1 người → trở thành vai đó và thực hiện hành động ngay.',
    winCondition: 'Thắng theo phe của vai đã copy. Sói → phe Sói. Tanner → phe Tanner. Còn lại → phe Dân.',
    tips: 'Vai linh hoạt nhất! Bạn sẽ hành động như vai đã copy. Nhớ rằng bài gốc là Hóa Thân.',
  },
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
  mason: {
    nightAction: 'Mở mắt và nhìn nhau. Biết chắc ai cùng phe Dân.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Bạn biết chắc đồng đội — hãy tin tưởng nhau và phối hợp tìm Sói. Nếu chỉ có 1 Mason, bài còn lại ở giữa.',
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
  sentinel: {
    nightAction: 'Đặt khiên bảo vệ 1 người. Người đó không bị xem/đổi bài trong đêm.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Bảo vệ vai quan trọng (Tiên Tri, Người Mất Ngủ) khỏi bị can thiệp.',
  },
  alphawolf: {
    nightAction: 'Thức dậy cùng Sói. Sau đó đổi 1 bài giữa với bài 1 người khác.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Đổi bài cho người được Dân tin tưởng nhất — biến họ thành Sói.',
  },
  mysticwolf: {
    nightAction: 'Thức dậy cùng Sói. Sau đó xem bài 1 người chơi.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Xem bài người nguy hiểm nhất để chuẩn bị đối phó ban ngày.',
  },
  dreamwolf: {
    nightAction: 'Thuộc phe Sói nhưng KHÔNG thức dậy. Sói khác không biết bạn.',
    winCondition: 'Thắng nếu không có Sói nào bị loại.',
    tips: 'Đóng vai Dân thuyết phục nhất — không ai biết bạn là Sói.',
  },
  apprenticeseer: {
    nightAction: 'Xem 1 bài ở giữa bàn.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Biết 1 bài ở giữa giúp loại trừ vai nào không ai giữ.',
  },
  paranormalinvestigator: {
    nightAction: 'Xem bài tối đa 2 người. Nếu thấy Sói/Tanner → biến thành vai đó!',
    winCondition: 'Thắng theo phe mới nếu bị biến đổi.',
    tips: 'Rủi ro cao! Cân nhắc kỹ trước khi xem.',
  },
  witch: {
    nightAction: 'Xem 1 bài giữa, có thể đổi bài đó với bài 1 người chơi.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Thấy bài Sói ở giữa? Đổi cho người đáng ngờ!',
  },
  villageidiot: {
    nightAction: 'Xoay bài tất cả người khác sang trái/phải (không xem).',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Khai báo hướng xoay giúp mọi người suy luận.',
  },
  revealer: {
    nightAction: 'Lật bài 1 người. Nếu không phải Sói/Tanner → công khai cho tất cả!',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Lật được Dân → thu hẹp nghi phạm Sói.',
  },
  bodyguard: {
    nightAction: 'Không thức dậy ban đêm. Khi vote: chỉ vào người BẢO VỆ thay vì loại.',
    winCondition: 'Thắng nếu phe Dân loại được Sói.',
    tips: 'Đừng tiết lộ mình là Cận Vệ. Bảo vệ người bạn tin là Dân!',
  },
  prince: {
    nightAction: 'Không thức dậy ban đêm.',
    winCondition: 'Thắng cùng phe Dân. Bạn MIỄN DỊCH với vote — không thể bị loại.',
    tips: 'Tự nhận là Hoàng Tử để Sói biết không có lợi khi vote bạn. Nhưng cẩn thận với Robber/Witch!',
  },
  cursed: {
    nightAction: 'Không thức dậy ban đêm.',
    winCondition: 'Sói vote + bị loại → ANH HÙNG (thắng cùng Dân). Sói vote + KHÔNG bị loại → THÀNH SÓI.',
    tips: 'Khiêu khích Sói vote bạn và đảm bảo Dân theo vote — bạn chết như anh hùng và thắng!',
  },
  auraseer: {
    nightAction: 'Thức dậy sau Kẻ Quậy. Thấy ai ĐÃ xem hoặc đổi bài đêm nay.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Biết ai active đêm nay → loại trừ Villager/Hunter/Tanner/Bodyguard. Cẩn thận: Sói cũng có thể "có hào quang".',
  },
  // ─── Alien ───────────────────────────────────────────────────────────────────
  alien: {
    nightAction: 'Mở mắt, nhìn đồng bọn Alien. Có thể "tip" 1 người (đổi bài họ với bài giữa). Nếu Alien đơn, xem 1 bài giữa.',
    winCondition: 'Thắng nếu không có Alien nào bị loại. Hoặc thắng nếu Leader bị loại.',
    tips: 'Tip Cow hoặc người phe Dân mạnh để gây rối. Nếu đơn, thông tin bài giữa rất quý.',
  },
  syntheticalien: {
    nightAction: 'Mở mắt cùng Alien. Nhìn thấy tất cả đồng bọn Alien.',
    winCondition: 'Thắng NẾU BỊ GIẾT. Nếu bạn chết → Alien & Dân đều thua.',
    tips: 'Giống Tanner nhưng nguy hiểm hơn. Hành xử đáng ngờ vừa đủ để bị vote.',
  },
  cow: {
    nightAction: 'Thức dậy sau Alien. Biết mình có bị "tip" (đổi bài) hay không.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Nếu bị tip, bài bạn đã đổi — hãy khai báo để mọi người suy luận.',
  },
  groob: {
    nightAction: 'Mở mắt cùng Zerb, nhìn nhau. Biết chắc ai cùng phe.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Phối hợp với Zerb để tìm Alien. Nếu chỉ có 1, bài còn lại ở giữa.',
  },
  zerb: {
    nightAction: 'Mở mắt cùng Groob, nhìn nhau. Biết chắc ai cùng phe.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Phối hợp với Groob để tìm Alien. Nếu chỉ có 1, bài còn lại ở giữa.',
  },
  oracle: {
    nightAction: 'Xem bài 1 người chơi khác, HOẶC 2 bài ở giữa.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Chia sẻ thông tin bạn biết nhưng cẩn thận — Alien có thể giả danh.',
  },
  rascal: {
    nightAction: 'Hoán đổi bài 2 người khác (có thể bỏ qua).',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Khai báo bạn đã đổi ai — hoặc bluff rằng đã đổi để gây rối Alien.',
  },
  exposer: {
    nightAction: 'Lật 1 bài ở giữa. Bài lật sẽ hiển thị cho mọi người.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Bài lật giúp Psychic và cả nhóm có thêm thông tin.',
  },
  psychic: {
    nightAction: 'Xem tất cả bài đã lật ở giữa. Nếu không có bài lật, xem bài 1 người.',
    winCondition: 'Thắng cùng phe Dân.',
    tips: 'Phối hợp tốt với Exposer — họ lật bài, bạn đọc.',
  },
  mortician: {
    nightAction: 'App chỉ thị xem 0, 1, hoặc 2 bài hàng xóm.',
    winCondition: 'Phe riêng. Thắng nếu ÍT NHẤT 1 hàng xóm bị giết & mình sống.',
    tips: 'Đẩy hàng xóm ra — nhưng đừng để bị loại theo. Biết bài hàng xóm giúp lập kế hoạch.',
  },
  leader: {
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng cùng phe Dân. NHƯNG nếu bạn bị loại, phe Alien thắng!',
    tips: 'Che giấu danh tính — nếu bạn bị loại, Alien thắng ngay lập tức.',
  },
  blob: {
    nightAction: 'Không có hành động ban đêm.',
    winCondition: 'Thắng nếu bạn VÀ 2 người ngồi cạnh đều KHÔNG bị loại.',
    tips: 'Bảo vệ hàng xóm của bạn. Đổ lỗi cho người ở xa bạn!',
  },
};

export default function LobbyScreen({ roomCode, players, hostId, isHost, settings, isSimulation, preferredHostRole, gameMode: gameModeFromProps, onPreferredRoleChange, onSettingsChange, onModeChange, onStartGame, onLeave, voiceSpeaking, chatMessages }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRole, setExpandedRole] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const isAlienMode = gameModeFromProps === 'alien' || settings.gameMode === 'alien';
  const gameMode = isAlienMode ? 'alien' : (settings.gameMode || 'base');
  const selected = settings.selectedRoles || [];
  const needed = players.length + 3;
  const filteredRoles = isAlienMode
    ? ALIEN_ROLES
    : WEREWOLF_ROLES.filter(r => gameMode === 'combined' || r.expansion === gameMode);

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
    socket.emit('rename_player', { name: newName.trim() }, (res) => {
      if (res?.ok) {
        sessionStorage.setItem('onw_name', res.name);
      }
    });
    setEditingName(false);
    setNewName('');
  }

  const copied = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const myPlayer = players.find(p => p.id === socket.id);

  return (
    <div className="min-h-screen min-h-[100dvh] px-3 py-4 sm:p-4 max-w-lg mx-auto fade-in">
      {/* Back button */}
      <button
        onClick={onLeave}
        className="flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors text-sm mt-2 mb-1"
      >
        <Icon name="arrowLeft" size={16} /> Rời phòng
      </button>

      {/* Room code */}
      <div className="text-center pt-2 sm:pt-4 pb-3 sm:pb-4">
        <p className="text-white/50 text-sm mb-1">Mã phòng</p>
        <button
          onClick={copied}
          className="text-4xl sm:text-5xl font-bold tracking-[0.3em] text-moon-300 hover:text-moon-200 transition-colors"
          title="Nhấn để copy"
        >
          {roomCode}
        </button>
        <p className="text-white/40 text-xs mt-1">Nhấn để copy · Chia sẻ với bạn bè</p>
        {/* Voice chat & chat controls in lobby */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <VoiceChatControls roomCode={roomCode} isHost={isHost} players={players} myId={socket.id} />
          <ChatPanel roomCode={roomCode} myId={socket.id} players={players} messages={chatMessages} />
        </div>
      </div>

      {/* Players */}
      <div className="card mb-4">
        <h3 className="text-moon-400 font-semibold mb-3 flex items-center gap-1.5">
          <Icon name="users" size={16} /> Người chơi ({players.length}/10)
        </h3>
        <div className="flex flex-wrap gap-2">
          {players.map(p => (
            <span
              key={p.id}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                p.isBot
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                  : p.id === hostId
                    ? 'bg-moon-400/20 text-moon-300 border border-moon-400/40'
                    : 'bg-white/10 text-white/80'
              }`}
            >
              {voiceSpeaking?.[p.id] && <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: '#4ade80', boxShadow: '0 0 4px rgba(74,222,128,0.8)', animation: 'voicePulse 1s ease-in-out infinite' }} />}
              {p.isBot ? <><Icon name="robot" size={14} className="inline mr-1" /></> : p.id === hostId ? <><Icon name="crown" size={14} className="inline mr-1 text-moon-300" /></> : ''}{p.rank && <RankBadge rank={p.rank} size={16} className="inline-flex mr-1 align-middle" />}{p.name}
              {p.id === socket.id ? ' (Bạn)' : ''}
            </span>
          ))}
        </div>

        {/* Add/Remove Bot buttons (host only) */}
        {isHost && (
          <div className="flex gap-2 mt-3">
            <button
              className="text-blue-400/60 text-xs hover:text-blue-300 transition-colors"
              onClick={() => socket.emit('add_bot', {}, (res) => { if (res?.error) console.warn(res.error); })}
              disabled={players.length >= 10}
            >
              + Thêm Bot
            </button>
            {players.some(p => p.isBot) && (
              <button
                className="text-wolf-400/60 text-xs hover:text-wolf-300 transition-colors"
                onClick={() => socket.emit('remove_bot', {}, (res) => { if (res?.error) console.warn(res.error); })}
              >
                - Xóa Bot
              </button>
            )}
          </div>
        )}

        {/* Rename */}
        {!editingName ? (
          <button
            className="text-moon-400/60 text-xs mt-3 hover:text-moon-300 transition-colors"
            onClick={() => { setEditingName(true); setNewName(myPlayer?.name || ''); }}
          >
            <Icon name="pencil" size={14} className="inline mr-1" /> Đổi tên
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
          <h3 className="text-moon-400 font-semibold flex items-center gap-1.5"><Icon name="cards" size={16} /> Chọn bài</h3>
          <span className={`text-sm font-mono ${selected.length === needed ? 'text-village-400' : 'text-wolf-400'}`}>
            {selected.length}/{needed}
          </span>
        </div>

        {/* Mode selector — hidden in alien mode (alien has no sub-modes) */}
        {!isAlienMode && (
          <div className="flex gap-2 mb-3">
            {[
              { mode: 'base', label: '🎯 Cơ bản' },
              { mode: 'daybreak', label: '🌅 Daybreak' },
              { mode: 'combined', label: '⚡ Kết hợp' },
            ].map(m => (
              <button
                key={m.mode}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  gameMode === m.mode
                    ? 'bg-moon-400/20 text-moon-300 border border-moon-400/40'
                    : 'bg-white/5 text-white/40 border border-transparent'
                } ${isHost ? 'hover:bg-white/10' : 'opacity-60'}`}
                onClick={() => isHost && onModeChange?.(m.mode)}
                disabled={!isHost}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}
        {isAlienMode && (
          <div className="mb-3 space-y-2">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-emerald-400 text-xs font-medium">👽 One Night Ultimate Alien</span>
            </div>
            <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${
              settings.enableRipple
                ? 'bg-purple-500/15 border-purple-500/30'
                : 'bg-white/5 border-white/10'
            } ${isHost ? 'hover:bg-purple-500/10' : 'opacity-60'}`}>
              <input
                type="checkbox"
                checked={!!settings.enableRipple}
                onChange={(e) => isHost && onSettingsChange?.({ enableRipple: e.target.checked })}
                disabled={!isHost}
                className="accent-purple-500 w-4 h-4"
              />
              <div>
                <span className="text-purple-300 text-xs font-semibold">⚡ The Ripple (Vết Nứt)</span>
                <p className="text-white/40 text-[10px]">35% xảy ra sau đêm — thay đổi luật chơi bất ngờ</p>
              </div>
            </label>
          </div>
        )}

        {!isHost && (
          <p className="text-white/40 text-sm mb-3">Chỉ host mới có thể chọn bài</p>
        )}

        <div className="space-y-1">
          {filteredRoles.map(role => {
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
                    <RoleIcon roleId={role.id} size={24} />
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
                        role.team === 'alien' ? 'bg-emerald-500/30 text-emerald-300' :
                        role.team === 'synthetic' ? 'bg-cyan-500/30 text-cyan-300' :
                        role.team === 'mortician' ? 'bg-amber-500/30 text-amber-300' :
                        role.team === 'blob' ? 'bg-lime-500/30 text-lime-300' :
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

      {/* ── Simulation: Host can pre-select their role ── */}
      {isSimulation && isHost && selected.length > 0 && (
        <div className="card mb-4 border border-purple-500/30" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(255,255,255,0.02))' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-purple-300 font-semibold flex items-center gap-1.5 text-sm">
              <Icon name="robot" size={14} /> 🧪 Chọn vai cho bạn (Test)
            </h3>
            {preferredHostRole && (
              <button
                onClick={() => onPreferredRoleChange?.(null)}
                className="text-white/40 text-xs hover:text-white/70"
              >
                ✕ Bỏ chọn
              </button>
            )}
          </div>
          <p className="text-white/40 text-[11px] mb-2.5">
            Chọn vai bạn muốn để test. Bot sẽ nhận các vai còn lại ngẫu nhiên.
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {[...new Set(selected)].map(roleId => {
              const role = ALL_ROLES.find(r => r.id === roleId);
              if (!role) return null;
              const isPicked = preferredHostRole === roleId;
              return (
                <button
                  key={roleId}
                  onClick={() => onPreferredRoleChange?.(isPicked ? null : roleId)}
                  className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl border transition-all ${
                    isPicked
                      ? 'border-purple-400 bg-purple-500/20 scale-105 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 active:scale-95'
                  }`}
                >
                  <RoleIcon roleId={roleId} size={28} circular />
                  <span className={`text-[9px] leading-tight text-center ${
                    isPicked ? 'text-purple-200 font-bold' : 'text-white/60'
                  }`}>
                    {role.name}
                  </span>
                </button>
              );
            })}
          </div>
          {preferredHostRole && (
            <p className="text-purple-300/80 text-xs mt-2 text-center">
              ✓ Sẽ nhận: <strong>{ALL_ROLES.find(r => r.id === preferredHostRole)?.name}</strong>
            </p>
          )}
        </div>
      )}

      {error && <p className="text-wolf-400 text-sm text-center mb-3">{error}</p>}

      {isHost && (
        <button
          className="btn-primary w-full text-lg py-4"
          onClick={handleStart}
          disabled={loading || players.length < 3}
        >
          {loading ? 'Đang bắt đầu...' : <><Icon name="moon" size={18} className="inline mr-1.5" /> Bắt đầu game</>}
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

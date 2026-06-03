import { useState, useMemo, useEffect } from 'react';
import socket, { playerToken } from '../socket';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';
import FallingCards from '../components/FallingCards';
import ProfileBar, { GoogleLoginButton } from '../components/ProfileBar';
import Leaderboard from '../components/Leaderboard';
import RoleLibrary from '../components/RoleLibrary';
import UpdatePopup from '../components/UpdatePopup';

const ADJECTIVES = ['Vui', 'Nhanh', 'Mạnh', 'Khéo', 'Lanh', 'Dũng', 'Tài', 'Giỏi', 'Hay', 'Cool', 'Pro', 'Ngầu', 'Bí Ẩn', 'Tinh', 'Lém'];
const ANIMALS = ['Cáo', 'Gấu', 'Hổ', 'Rồng', 'Chim', 'Mèo', 'Thỏ', 'Voi', 'Sói', 'Cú', 'Ếch', 'Cá', 'Bò', 'Dê', 'Ngựa'];

const FAMOUS_QUOTES = [
  { en: 'Man is a wolf to man.', author: 'Plautus', vi: 'Con người là sói đối với chính đồng loại mình.' },
  { en: 'The only thing we have to fear is fear itself.', author: 'Franklin D. Roosevelt', vi: 'Điều đáng sợ nhất không phải bóng tối, mà là nỗi sợ bên trong mỗi người.' },
  { en: "If you tell the truth, you don't have to remember anything.", author: 'Mark Twain', vi: 'Kẻ nói thật không cần nhớ mình đã bịa điều gì.' },
  { en: 'He who fights with monsters should look to it that he himself does not become a monster.', author: 'Friedrich Nietzsche', vi: 'Kẻ săn quái vật phải coi chừng chính mình hóa thành quái vật.' },
  { en: 'And when you gaze long into an abyss, the abyss also gazes into you.', author: 'Friedrich Nietzsche', vi: 'Khi nhìn quá lâu vào bóng tối, bóng tối cũng bắt đầu nhìn lại bạn.' },
  { en: 'In order to be an irreproachable member of a flock of sheep, one must above all be a sheep oneself.', author: 'Albert Einstein', vi: 'Muốn không bị nghi ngờ giữa bầy cừu, trước hết hãy biết trở thành một con cừu.' },
  { en: 'Truth is stranger than fiction.', author: 'Mark Twain', vi: 'Sự thật đôi khi còn khó tin hơn cả lời bịa đặt.' },
  { en: 'A liar is not believed when he tells the truth.', author: 'Tục ngữ', vi: 'Kẻ nói dối sẽ chẳng còn được tin, ngay cả khi hắn nói thật.' },
];

function generateName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj} ${animal} ${num}`;
}

export default function HomeScreen({ onJoin, error, setError }) {
  const { user, authToken, loginAsGuest, googleClientId, loginWithGoogle } = useAuth();
  const isLoggedIn = !!user;
  const [mode, setMode] = useState(null);
  const [name, setName] = useState(() => user?.displayName || generateName());
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [botCount, setBotCount] = useState(4);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [publicRooms, setPublicRooms] = useState([]);

  // Subscribe to room list when on main menu (logged in) or join mode
  useEffect(() => {
    if (mode !== null && mode !== 'join') return;
    if (!isLoggedIn) return;

    const handler = ({ rooms }) => setPublicRooms(rooms || []);
    socket.on('room_list', handler);
    socket.emit('subscribe_rooms');

    return () => {
      socket.off('room_list', handler);
      socket.emit('unsubscribe_rooms');
    };
  }, [mode, isLoggedIn]);

  const displayName = isLoggedIn ? user.displayName : name.trim();
  const quote = useMemo(() => FAMOUS_QUOTES[Math.floor(Math.random() * FAMOUS_QUOTES.length)], []);

  function handleCreate(e) {
    e.preventDefault();
    if (!displayName) return setError('Nhập tên của bạn');
    setLoading(true);
    socket.emit('create_room', { name: displayName, token: playerToken, authToken }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoin(res.code, res.players, res.settings, res.hostId);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!displayName) return setError('Nhập tên của bạn');
    if (!code.trim()) return setError('Nhập mã phòng');
    setLoading(true);
    const roomCode = code.trim().toUpperCase();

    socket.emit('rejoin_room', { code: roomCode, name: displayName, token: playerToken }, (res) => {
      if (res?.ok) {
        setLoading(false);
        onJoin(res.code, res.players, res.settings, res.hostId, res.state, res);
        return;
      }
      socket.emit('join_room', { name: displayName, code: roomCode, token: playerToken, authToken }, (res2) => {
        setLoading(false);
        if (res2.error) return setError(res2.error);
        onJoin(res2.code, res2.players, res2.settings, res2.hostId);
      });
    });
  }

  function handleSimulation(e) {
    e.preventDefault();
    if (!displayName) return setError('Nhập tên của bạn');
    setLoading(true);
    socket.emit('create_simulation', { name: displayName, token: playerToken, authToken, botCount }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoin(res.code, res.players, res.settings, res.hostId, undefined, res);
    });
  }

  async function handleGuestPlay() {
    if (!name.trim()) return setError('Nhập tên của bạn');
    setLoading(true);
    try {
      await loginAsGuest(name.trim());
    } catch {
      setError('Không thể đăng nhập');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 fade-in relative">
      <FallingCards count={14} />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <button
          onClick={() => setShowLeaderboard(true)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          title="Bảng xếp hạng"
        >
          <Icon name="trophy" size={18} className="text-moon-400" />
        </button>
        <ProfileBar />
      </div>

      {showLeaderboard && <Leaderboard onClose={() => setShowLeaderboard(false)} />}

      <div className="text-center mb-6 sm:mb-8 relative z-10">
        <img
          src="/images/logo-game.png"
          alt="One Night Ultimate Werewolf"
          className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-3 drop-shadow-[0_0_24px_rgba(196,168,107,0.3)]"
          draggable={false}
        />
        <div className="max-w-xs mx-auto">
          <p className="text-white/30 text-xs italic leading-relaxed">"{quote.en}"</p>
          <p className="text-moon-400/50 text-[11px] italic mt-0.5">{quote.vi}</p>
          <p className="text-white/20 text-[10px] mt-1">— {quote.author}</p>
        </div>
      </div>

      {!isLoggedIn && !mode ? (
        /* Not logged in — show login options */
        <div className="card w-full max-w-sm flex flex-col gap-4 relative z-10">
          <h2 className="text-lg font-semibold text-moon-300 text-center">Chào mừng!</h2>

          {googleClientId && (
            <GoogleLoginButton clientId={googleClientId} onLogin={loginWithGoogle} />
          )}

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/30 text-xs">hoặc</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div>
            <label className="text-white/40 text-xs mb-1 block">Chơi nhanh không cần tài khoản</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Nhập tên của bạn"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                maxLength={20}
              />
              <button
                type="button"
                onClick={() => setName(generateName())}
                className="btn-ghost px-3 py-0"
                title="Tạo tên ngẫu nhiên"
              ><Icon name="dice" size={22} /></button>
            </div>
          </div>

          {error && <p className="text-wolf-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleGuestPlay}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Đang kết nối...' : 'Chơi ngay'}
          </button>
        </div>
      ) : !mode ? (
        /* Logged in — show main menu */
        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <button className="btn-primary text-lg py-4 flex items-center justify-center gap-2.5" onClick={() => { setMode('create'); setError(''); }}>
            <Icon name="sparkle" size={22} /> Tạo phòng mới
          </button>
          <button className="btn-ghost text-lg py-4 flex items-center justify-center gap-2.5 relative" onClick={() => { setMode('join'); setError(''); }}>
            <Icon name="door" size={22} /> Vào phòng
            {publicRooms.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-moon-400/20 text-moon-300 text-xs font-bold">
                {publicRooms.length}
              </span>
            )}
          </button>
          <button className="btn-ghost text-lg py-4 border-dashed flex items-center justify-center gap-2.5" onClick={() => { setMode('simulation'); setError(''); }}>
            <Icon name="robot" size={22} /> Simulation Mode
          </button>
          <button className="btn-ghost text-base py-3 flex items-center justify-center gap-2 text-moon-400 border-moon-400/20" onClick={() => setShowLibrary(true)}>
            <Icon name="book" size={20} /> Thư viện nhân vật
          </button>
        </div>
      ) : (
        <form
          onSubmit={mode === 'create' ? handleCreate : mode === 'join' ? handleJoin : handleSimulation}
          className="card w-full max-w-sm flex flex-col gap-4 relative z-10"
        >
          <h2 className="text-xl font-semibold text-moon-300 flex items-center gap-2.5">
            {mode === 'create' ? <><Icon name="sparkle" size={22} /> Tạo phòng mới</> :
             mode === 'join' ? <><Icon name="door" size={22} /> Vào phòng</> :
             <><Icon name="robot" size={22} /> Simulation Mode</>}
          </h2>

          {mode === 'simulation' && (
            <p className="text-white/50 text-sm -mt-2">Chơi thử với bot AI để test game</p>
          )}

          {mode === 'join' && (
            <>
              <input
                className="input uppercase tracking-widest text-center text-xl font-bold"
                placeholder="MÃ PHÒNG"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                maxLength={4}
                autoFocus
              />

              {/* Public rooms list */}
              <div className="-mt-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white/40 text-xs">
                    {publicRooms.length === 0
                      ? 'Chưa có phòng nào đang mở'
                      : `${publicRooms.length} phòng đang mở`}
                  </p>
                  <button
                    type="button"
                    onClick={() => socket.emit('subscribe_rooms')}
                    className="text-moon-400/60 text-xs hover:text-moon-300 flex items-center gap-1"
                    title="Làm mới"
                  >
                    <Icon name="refresh" size={11} /> Làm mới
                  </button>
                </div>

                {publicRooms.length > 0 && (
                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1" style={{ overscrollBehavior: 'contain' }}>
                    {publicRooms.map(r => {
                      const isFull = r.playerCount >= 10;
                      return (
                        <button
                          key={r.code}
                          type="button"
                          disabled={isFull}
                          onClick={() => { setCode(r.code); setError(''); }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                            code === r.code
                              ? 'bg-moon-400/15 border-moon-400/50'
                              : isFull
                                ? 'bg-white/[0.02] border-white/5 opacity-50 cursor-not-allowed'
                                : 'bg-white/5 border-white/10 hover:bg-white/10 active:scale-[0.98]'
                          }`}
                        >
                          <div className="flex flex-col items-start min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-moon-300 tracking-wider">{r.code}</span>
                              {r.isSimulation && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">SIM</span>
                              )}
                            </div>
                            <span className="text-white/40 text-[11px] truncate max-w-[180px]">
                              Host: {r.hostName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Icon name="users" size={12} className="text-white/40" />
                            <span className={`text-xs font-semibold ${isFull ? 'text-wolf-400' : 'text-white/60'}`}>
                              {r.playerCount}/10
                            </span>
                            {r.botCount > 0 && (
                              <span className="text-[10px] text-white/30 ml-1">({r.botCount} bot)</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'simulation' && (
            <div>
              <label className="text-white/40 text-xs mb-1 block">Số lượng bot: {botCount}</label>
              <div className="flex items-center gap-3">
                <button type="button" className="btn-ghost px-3 py-1" onClick={() => setBotCount(c => Math.max(2, c - 1))}>-</button>
                <input
                  type="range"
                  min={2} max={9}
                  value={botCount}
                  onChange={e => setBotCount(parseInt(e.target.value))}
                  className="flex-1 accent-moon-400"
                />
                <button type="button" className="btn-ghost px-3 py-1" onClick={() => setBotCount(c => Math.min(9, c + 1))}>+</button>
              </div>
              <p className="text-white/30 text-xs mt-1 text-center">Tổng: {botCount + 1} người chơi (bạn + {botCount} bot)</p>
            </div>
          )}

          {error && <p className="text-wolf-400 text-sm text-center">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang kết nối...' : mode === 'create' ? 'Tạo phòng' : mode === 'join' ? 'Vào phòng' : 'Bắt đầu Simulation'}
          </button>
          <button type="button" className="btn-ghost flex items-center justify-center gap-2" onClick={() => { setMode(null); setError(''); }}>
            <Icon name="arrowLeft" size={16} /> Quay lại
          </button>
        </form>
      )}

      <p className="text-white/20 text-xs mt-12 text-center relative z-10">
        Dự án phi lợi nhuận · Mọi bản quyền hình ảnh thuộc về Bezier Games
      </p>

      <RoleLibrary isOpen={showLibrary} onClose={() => setShowLibrary(false)} />
      <UpdatePopup />
    </div>
  );
}

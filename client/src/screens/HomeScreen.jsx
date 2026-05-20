import { useState } from 'react';
import socket, { playerToken } from '../socket';
import Icon from '../components/Icon';
import FallingCards from '../components/FallingCards';

const ADJECTIVES = ['Vui', 'Nhanh', 'Mạnh', 'Khéo', 'Lanh', 'Dũng', 'Tài', 'Giỏi', 'Hay', 'Cool', 'Pro', 'Ngầu', 'Bí Ẩn', 'Tinh', 'Lém'];
const ANIMALS = ['Cáo', 'Gấu', 'Hổ', 'Rồng', 'Chim', 'Mèo', 'Thỏ', 'Voi', 'Sói', 'Cú', 'Ếch', 'Cá', 'Bò', 'Dê', 'Ngựa'];

function generateName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const num = Math.floor(Math.random() * 100);
  return `${adj} ${animal} ${num}`;
}

export default function HomeScreen({ onJoin, error, setError }) {
  const [mode, setMode] = useState(null);
  const [name, setName] = useState(() => generateName());
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [botCount, setBotCount] = useState(4);

  function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Nhập tên của bạn');
    setLoading(true);
    socket.emit('create_room', { name: name.trim(), token: playerToken }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoin(res.code, res.players, res.settings, res.hostId);
    });
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Nhập tên của bạn');
    if (!code.trim()) return setError('Nhập mã phòng');
    setLoading(true);
    const roomCode = code.trim().toUpperCase();

    socket.emit('rejoin_room', { code: roomCode, name: name.trim(), token: playerToken }, (res) => {
      if (res?.ok) {
        setLoading(false);
        onJoin(res.code, res.players, res.settings, res.hostId, res.state, res);
        return;
      }
      socket.emit('join_room', { name: name.trim(), code: roomCode, token: playerToken }, (res2) => {
        setLoading(false);
        if (res2.error) return setError(res2.error);
        onJoin(res2.code, res2.players, res2.settings, res2.hostId);
      });
    });
  }

  function handleSimulation(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Nhập tên của bạn');
    setLoading(true);
    socket.emit('create_simulation', { name: name.trim(), token: playerToken, botCount }, (res) => {
      setLoading(false);
      if (res.error) return setError(res.error);
      onJoin(res.code, res.players, res.settings, res.hostId);
    });
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 fade-in relative">
      <FallingCards count={14} />

      <div className="text-center mb-8 sm:mb-10 relative z-10">
        <img
          src="/images/logo-game.png"
          alt="One Night Ultimate Werewolf"
          className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-2 drop-shadow-[0_0_24px_rgba(196,168,107,0.3)]"
          draggable={false}
        />
      </div>

      {!mode ? (
        <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
          <button className="btn-primary text-lg py-4 flex items-center justify-center gap-2.5" onClick={() => { setMode('create'); setError(''); }}>
            <Icon name="sparkle" size={22} /> Tạo phòng mới
          </button>
          <button className="btn-ghost text-lg py-4 flex items-center justify-center gap-2.5" onClick={() => { setMode('join'); setError(''); }}>
            <Icon name="door" size={22} /> Vào phòng
          </button>
          <button className="btn-ghost text-lg py-4 border-dashed flex items-center justify-center gap-2.5" onClick={() => { setMode('simulation'); setError(''); }}>
            <Icon name="robot" size={22} /> Simulation Mode
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

          <div>
            <label className="text-white/40 text-xs mb-1 block">Tên hiển thị (có thể đổi sau)</label>
            <div className="flex gap-2">
              <input
                className="input flex-1"
                placeholder="Tên của bạn"
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

          {mode === 'join' && (
            <input
              className="input uppercase tracking-widest text-center text-xl font-bold"
              placeholder="MÃ PHÒNG"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
              maxLength={4}
              autoFocus
            />
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

      <p className="text-white/30 text-sm mt-12 text-center relative z-10">
        3–10 người · Không cần tài khoản
      </p>
    </div>
  );
}

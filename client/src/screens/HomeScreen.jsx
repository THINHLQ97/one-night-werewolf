import { useState } from 'react';
import socket, { playerToken } from '../socket';

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

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6 fade-in">
      <div className="text-center mb-8 sm:mb-10">
        <div className="text-5xl sm:text-7xl mb-3 sm:mb-4">🐺</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-moon-300 tracking-tight">One Night</h1>
        <p className="text-moon-400 text-base sm:text-lg mt-1">Ultimate Werewolf</p>
      </div>

      {!mode ? (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button className="btn-primary text-lg py-4" onClick={() => { setMode('create'); setError(''); }}>
            ✨ Tạo phòng mới
          </button>
          <button className="btn-ghost text-lg py-4" onClick={() => { setMode('join'); setError(''); }}>
            🚪 Vào phòng
          </button>
        </div>
      ) : (
        <form
          onSubmit={mode === 'create' ? handleCreate : handleJoin}
          className="card w-full max-w-sm flex flex-col gap-4"
        >
          <h2 className="text-xl font-semibold text-moon-300">
            {mode === 'create' ? '✨ Tạo phòng mới' : '🚪 Vào phòng'}
          </h2>

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
                className="btn-ghost px-3 py-0 text-lg"
                title="Tạo tên ngẫu nhiên"
              >🎲</button>
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

          {error && <p className="text-wolf-400 text-sm text-center">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Đang kết nối...' : mode === 'create' ? 'Tạo phòng' : 'Vào phòng'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => { setMode(null); setError(''); }}>
            ← Quay lại
          </button>
        </form>
      )}

      <p className="text-white/30 text-sm mt-12 text-center">
        3–10 người · Không cần tài khoản
      </p>
    </div>
  );
}

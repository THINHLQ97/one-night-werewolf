import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RankBadge from './RankBadge';
import Icon from './Icon';

export default function ProfileBar({ className = '' }) {
  const { user, logout, googleClientId, loginWithGoogle, loading } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {googleClientId && (
          <GoogleLoginButton clientId={googleClientId} onLogin={loginWithGoogle} />
        )}
      </div>
    );
  }

  const nextRank = getNextRankInfo(user.rank, user.points);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setShowMenu(s => !s)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-moon-400/20 flex items-center justify-center text-xs font-bold text-moon-400">
            {user.displayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        <span className="text-sm text-white/70 font-medium max-w-[100px] truncate">{user.displayName}</span>
        <RankBadge rank={user.rank} size={20} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 card min-w-[220px] p-3 space-y-3">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-moon-400/20 flex items-center justify-center text-lg font-bold text-moon-400">
                  {user.displayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white/80">{user.displayName}</p>
                <p className="text-xs text-moon-400">{user.rank?.nameVi || 'Unranked'}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Điểm</span>
                <span className="text-moon-400 font-medium">{user.points}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">Trận</span>
                <span className="text-white/60">{user.gamesPlayed} ({user.gamesWon}W)</span>
              </div>
              {nextRank && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-white/40">Tiếp theo</span>
                    <span className="text-white/50">{nextRank.name} ({nextRank.remaining} pts)</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-moon-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${nextRank.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { logout(); setShowMenu(false); }}
              className="w-full text-xs text-white/40 hover:text-wolf-400 py-1.5 transition-colors flex items-center justify-center gap-1"
            >
              <Icon name="arrowLeft" size={12} /> Đăng xuất
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function getNextRankInfo(rank, points) {
  if (!rank || rank.tier >= 8) return null;
  const RANK_MINS = [0, 500, 1000, 1500, 2000, 2500, 3500, 5000];
  const nextMin = RANK_MINS[rank.tier];
  const currentMin = RANK_MINS[rank.tier - 1] || 0;
  if (!nextMin) return null;
  const range = nextMin - currentMin;
  const progress = Math.min(100, ((points - currentMin) / range) * 100);
  const remaining = nextMin - points;
  const RANK_NAMES_VI = ['', 'Đồng', 'Bạc', 'Vàng', 'Bạch Kim', 'Kim Cương', 'Tinh Anh', 'Thách Đấu'];
  return { name: RANK_NAMES_VI[rank.tier] || '?', progress, remaining };
}

function GoogleLoginButton({ clientId, onLogin }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      if (!window.google?.accounts?.id) {
        await loadGoogleScript();
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });
      }
      window.google.accounts.id.prompt();
    } catch (err) {
      console.error('Google login error:', err);
      setLoading(false);
    }
  }

  async function handleCredentialResponse(response) {
    try {
      await onLogin(response.credential);
    } catch (err) {
      console.error('Login failed:', err);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-colors text-sm text-white/70"
    >
      <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
      {loading ? 'Đang đăng nhập...' : 'Đăng nhập Google'}
    </button>
  );
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (document.getElementById('google-login-script')) return resolve();
    const script = document.createElement('script');
    script.id = 'google-login-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

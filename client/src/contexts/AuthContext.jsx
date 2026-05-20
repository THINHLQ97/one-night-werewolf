import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_SERVER_URL || '';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('onw_auth_token'));
  const [loading, setLoading] = useState(true);
  const [googleClientId, setGoogleClientId] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/google-client-id`)
      .then(r => r.json())
      .then(data => { if (data.clientId) setGoogleClientId(data.clientId); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authToken) { setLoading(false); return; }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => setUser(data.user))
      .catch(() => { localStorage.removeItem('onw_auth_token'); setAuthToken(null); })
      .finally(() => setLoading(false));
  }, [authToken]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) throw new Error('Google login failed');
    const data = await res.json();
    localStorage.setItem('onw_auth_token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const loginAsGuest = useCallback(async (name) => {
    const res = await fetch(`${API_BASE}/api/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Guest login failed');
    const data = await res.json();
    localStorage.setItem('onw_auth_token', data.token);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const updateProfile = useCallback(async (displayName, avatarUrl) => {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ displayName, avatarUrl }),
    });
    if (!res.ok) throw new Error('Update failed');
    const data = await res.json();
    setUser(data.user);
    return data.user;
  }, [authToken]);

  const logout = useCallback(() => {
    localStorage.removeItem('onw_auth_token');
    setAuthToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch {}
  }, [authToken]);

  return (
    <AuthContext.Provider value={{ user, authToken, loading, googleClientId, loginWithGoogle, loginAsGuest, updateProfile, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client.js';
import { flagNotice } from '../features/notice/noticeContent.js';

const AuthContext = createContext(null);
const NO_ACCESS = { access: { full: null, tools: [], hasAny: false, mode: 'NONE' }, offers: [], provider: 'MOCK' };
const CHALLENGE_KEY = 'edu_2fa_challenge';

export const challengeStore = {
  get: () => {
    try { return JSON.parse(sessionStorage.getItem(CHALLENGE_KEY) || 'null'); } catch { return null; }
  },
  set: (value) => {
    try { value ? sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(value)) : sessionStorage.removeItem(CHALLENGE_KEY); } catch { return undefined; }
    return undefined;
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [ready, setReady] = useState(false);

  const clearSession = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
    setAccessInfo(null);
  }, []);

  const logout = useCallback(() => {
    api.post('/auth/logout').catch(() => null);
    clearSession();
  }, [clearSession]);

  const loadAccess = useCallback(async (u) => {
    if (u?.role !== 'CLIENT') return setAccessInfo(null);
    try {
      setAccessInfo(await api.get('/payments/access'));
    } catch {
      setAccessInfo(NO_ACCESS);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) return setReady(true);
    try {
      const { user: u } = await api.get('/auth/me');
      setUser(u);
      await loadAccess(u);
    } catch {
      clearSession();
    } finally {
      setReady(true);
    }
  }, [loadAccess, clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearSession);
    refresh();
  }, [refresh, clearSession]);

  const startSession = useCallback(async ({ token, user: u }) => {
    tokenStore.set(token);
    setUser(u);
    await loadAccess(u);
    return u;
  }, [loadAccess]);

  const settle = useCallback(async (res) => {
    if (res.status === 'SETUP_2FA') {
      challengeStore.set({ challengeToken: res.challengeToken, email: res.user.email, role: res.user.role });
      return { setupRequired: true, user: res.user };
    }
    challengeStore.set(null);
    if (res.user?.role === 'CLIENT') flagNotice();
    return { user: await startSession(res) };
  }, [startSession]);

  const value = useMemo(() => ({
    user,
    ready,
    accessInfo,
    access: accessInfo?.access || NO_ACCESS.access,
    hasAccess: user?.role === 'ADMIN' || !!accessInfo?.access?.hasAny,
    login: async (body) => settle(await api.post('/auth/login', body)),
    loginWithCode: async (body) => settle(await api.post('/auth/login/2fa', body)),
    register: async (body) => settle(await api.post('/auth/register', body)),
    activateTwoFactor: async (code) => settle(await api.post('/auth/2fa/activate', { challengeToken: challengeStore.get()?.challengeToken, code })),
    logout,
    refreshAccess: () => loadAccess(user),
  }), [user, ready, accessInfo, settle, logout, loadAccess]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

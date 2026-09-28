import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { getAuthToken, setAuthToken, setUnauthorizedHandler } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [authError, setAuthError] = useState('');

  const refresh = useCallback(async () => {
    // Sin token guardado no hay sesión que restaurar: se evita pedir /auth/me
    // (siempre respondería 401 y ensuciaría la consola en cada visita al
    // sitio público o al login).
    if (!getAuthToken()) {
      setUser(null);
      setAuthError('');
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setAuthError('');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        // Sesión realmente inexistente/vencida: se limpia el token viejo para
        // no reenviarlo en cada petición.
        setAuthToken(null);
        setUser(null);
        setAuthError('');
      } else {
        // Fallo del servidor/red: NO es una sesión inválida. Se conserva el
        // token y se informa, en vez de expulsar al usuario al login en bucle.
        setAuthError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cualquier 401 (token vencido/inválido en CUALQUIER petición, no solo el
  // chequeo inicial) cierra la sesión aquí mismo — ver services/api.js. Un
  // 401 repetido tras esto ya no encuentra token que reenviar (401 "sin
  // sesión"), así que nunca reintenta ni entra en bucle; simplemente deja de
  // pasar por aquí en cuanto ProtectedRoute redirige al login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setAuthToken(null);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.twoFactorRequired) return data;
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithTwoFactor = async (tempToken, code) => {
    const { data } = await api.post('/auth/login/2fa', { tempToken, code });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, authError, login, loginWithTwoFactor, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    if (!getToken()) { setReady(true); return; }
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);
  useEffect(() => {
    window.addEventListener('ibee:unauthorized', logout);
    return () => window.removeEventListener('ibee:unauthorized', logout);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const res = await api.login(email, password);
    setToken(res.token);
    setUser(res.user);
  }, []);
  const value = useMemo(() => ({ user, ready, login, logout, isAdmin: user?.role === 'admin' }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

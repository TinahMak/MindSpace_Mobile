import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, setAuthToken, setUnauthorizedHandler } from './api';

const TOKEN_KEY = 'mindspace.token';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(async () => {
    setAuthToken(null);
    setToken(null);
    setUser(null);
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {}
  }, []);

  // Restore a remembered session on launch.
  useEffect(() => {
    setUnauthorizedHandler(() => clear());
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(TOKEN_KEY);
        if (saved) {
          setAuthToken(saved);
          const me = await api('/me/');
          setToken(saved);
          setUser(me);
        }
      } catch {
        await clear();
      } finally {
        setReady(true);
      }
    })();
  }, [clear]);

  // remember=true keeps you logged in (like the website's "Remember me").
  // remember=false keeps the session only until the app is closed.
  const start = useCallback(async ({ token: newToken, user: newUser }, remember) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    if (remember) await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    else await SecureStore.deleteItemAsync(TOKEN_KEY).catch(() => {});
  }, []);

  const login = useCallback(
    async (email, password, remember = true) => {
      const data = await api('/auth/login/', { method: 'POST', body: { email, password }, auth: false });
      await start(data, remember);
      return data.user;
    },
    [start],
  );

  const signup = useCallback(
    async (fields) => {
      const data = await api('/auth/signup/', { method: 'POST', body: fields, auth: false });
      await start(data, true);
      return data;
    },
    [start],
  );

  const proSignup = useCallback(
    async (fields) => {
      const data = await api('/pro/signup/', { method: 'POST', body: fields, auth: false });
      await start(data, true);
      return data;
    },
    [start],
  );

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout/', { method: 'POST' });
    } catch {}
    await clear();
  }, [clear]);

  const refreshUser = useCallback(async () => {
    const me = await api('/me/');
    setUser(me);
    return me;
  }, []);

  const value = useMemo(
    () => ({ token, user, ready, login, signup, proSignup, logout, refreshUser, setUser, clear }),
    [token, user, ready, login, signup, proSignup, logout, refreshUser, clear],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

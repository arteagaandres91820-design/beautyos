import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../lib/api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('beautyos_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then((r) => {
        setUser(r.data);
        if (r.data.business?.slug) localStorage.setItem('beautyos_biz_slug', r.data.business.slug);
      })
      .catch(() => { localStorage.removeItem('beautyos_token'); localStorage.removeItem('beautyos_user'); })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await authApi.login(email, password);
    localStorage.setItem('beautyos_token', data.token);
    if (data.user?.business?.slug) localStorage.setItem('beautyos_biz_slug', data.user.business.slug);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('beautyos_token');
    localStorage.removeItem('beautyos_user');
    localStorage.removeItem('beautyos_biz_slug');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

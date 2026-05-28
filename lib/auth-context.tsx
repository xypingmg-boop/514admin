'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}
const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const stored = localStorage.getItem('micai_user');
    const token = localStorage.getItem('micai_token');
    if (stored && token) {
      setUserState(JSON.parse(stored));
    }
    setLoading(false);
  }, []);
  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('micai_token', token);
    localStorage.setItem('micai_user', JSON.stringify(user));
    setUserState(user);
  };
  const logout = () => {
    localStorage.removeItem('micai_token');
    localStorage.removeItem('micai_user');
    setUserState(null);
  };
  const setUser = (user: User) => {
    localStorage.setItem('micai_user', JSON.stringify(user));
    setUserState(user);
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

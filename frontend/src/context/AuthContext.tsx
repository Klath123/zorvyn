import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthState } from '../types';
import api from '../lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return { token, user: user ? JSON.parse(user) : null };
  });

  useEffect(() => {
    if (auth.token) localStorage.setItem('token', auth.token);
    else localStorage.removeItem('token');
    if (auth.user) localStorage.setItem('user', JSON.stringify(auth.user));
    else localStorage.removeItem('user');
  }, [auth]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    setAuth({ token: data.data.token, user: data.data.user });
  }, []);

  const logout = useCallback(() => {
    setAuth({ token: null, user: null });
  }, []);

  const hasRole = useCallback(
    (role: string) => auth.user?.roles?.includes(role as any) ?? false,
    [auth.user]
  );

  return (
    <AuthContext.Provider
      value={{ ...auth, login, logout, isAuthenticated: !!auth.token, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

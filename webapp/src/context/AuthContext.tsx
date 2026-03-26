import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useMe, useLogin, useRegister, useLogout } from '@queries/auth.query';
import { getSocket, disconnectSocket } from '../lib/socket';
import type { User } from '../lib/types';

interface AuthContextType {
  user: User | null | undefined;
  isLoading: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
  const qc = useQueryClient();

  const { data: user, isLoading } = useMe(!!token);
  const { mutateAsync: loginMutation } = useLogin();
  const { mutateAsync: registerMutation } = useRegister();
  const { mutateAsync: logoutMutation } = useLogout();

  const setToken = useCallback(
    (newToken: string | null) => {
      setTokenState(newToken);
      if (newToken) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        localStorage.setItem('token', newToken);
      } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
        qc.clear();
      }
    },
    [qc],
  );

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Connect socket with the current token so real-time events work immediately
      // after login or page refresh (token already in localStorage).
      const socket = getSocket();
      if (!socket.connected) socket.connect();
    }
  }, [token]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginMutation({ email, password });
      setToken(data.token);
    },
    [loginMutation, setToken],
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role: string) => {
      const data = await registerMutation({ name, email, password, role });
      setToken(data.token);
    },
    [registerMutation, setToken],
  );

  const logout = useCallback(async () => {
    try {
      await logoutMutation();
    } finally {
      setToken(null);
      disconnectSocket();
    }
  }, [logoutMutation, setToken]);

  return (
    <AuthContext.Provider value={{ user, isLoading, token, setToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

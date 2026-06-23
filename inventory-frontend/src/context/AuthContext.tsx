'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserInfo, isAuthenticated, clearAuth, setToken, setUserInfo } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface AuthContextType {
  username: string;
  role: string;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      const info = getUserInfo();
      setUsername(info.username);
      setRole(info.role);
      setIsLoggedIn(true);
    }
  }, []);

  const login = async (usernameInput: string, password: string) => {
    const response = await api.post('/auth/login', {
      username: usernameInput,
      password,
    });
    const { token, username: uname, role: urole } = response.data;
    setToken(token);
    setUserInfo(uname, urole);
    setUsername(uname);
    setRole(urole);
    setIsLoggedIn(true);
    router.push('/dashboard');
  };

  const logout = () => {
    clearAuth();
    setUsername('');
    setRole('');
    setIsLoggedIn(false);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ username, role, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

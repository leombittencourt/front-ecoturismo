// ============================================================
// src/contexts/AuthContext.tsx — Versão para backend .NET
// ============================================================
// Substitua o AuthContext atual por este quando migrar para o .NET
// ============================================================

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, fetchMyProfile, getStoredToken } from '@/services/api';
import type { User } from '@/services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

interface AuthContextType extends Omit<AuthState, 'loading'> {
  loading: boolean;
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: User['role'][]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  });

  // Restaurar sessão do token salvo
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Validar token buscando perfil
    fetchMyProfile()
      .then(user => {
        setState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });
      })
      .catch(() => {
        apiLogout();
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      });
  }, []);

  const login = useCallback(async (email: string, senha: string): Promise<boolean> => {
    const result = await apiLogin(email, senha);
    if (!result) return false;

    setState({
      user: result.user,
      token: result.token,
      isAuthenticated: true,
      loading: false,
    });
    return true;
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    });
  }, []);

  const hasRole = useCallback((roles: User['role'][]): boolean => {
    return !!state.user && roles.includes(state.user.role);
  }, [state.user]);

  return (
    <AuthContext.Provider value={{
      user: state.user,
      token: state.token,
      isAuthenticated: state.isAuthenticated,
      loading: state.loading,
      login,
      logout,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

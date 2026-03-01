import React, { createContext, useContext, useState, useCallback } from "react";
import { apiClient, type User, type Municipio } from "@/services/apiClient";

interface AuthState {
  user: User | null;
  municipio: Municipio | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, senha: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: User["role"][]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const LS_AUTH = "eco_auth";
const LS_TOKEN = "accessToken";

function normalizeRole(role: string | null | undefined): User["role"] {
  const normalized = String(role ?? "").trim().toLowerCase();
  if (normalized === "admin") return "admin";
  if (normalized === "prefeitura") return "prefeitura";
  if (normalized === "balneario") return "balneario";
  return "publico";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const saved = localStorage.getItem(LS_AUTH);
    if (saved) {
      try {
        return JSON.parse(saved) as AuthState;
      } catch {
        /* ignore */
      }
    }
    return { user: null, municipio: null, token: null, isAuthenticated: false };
  });

  const login = useCallback(async (email: string, senha: string): Promise<boolean> => {
    try {
      const res = await apiClient.login({ email, password: senha });
      localStorage.setItem(LS_TOKEN, res.token);

      const profile = res.profile as typeof res.profile & {
        MunicipioId?: string | null;
        AtrativoId?: string | null;
        atrativo_id?: string | null;
      };
      const municipioId = profile.municipioId ?? profile.MunicipioId ?? null;
      const atrativoId = profile.atrativoId ?? profile.atrativo_id ?? profile.AtrativoId ?? null;

      const user: User = {
        id: res.profile.id,
        nome: res.profile.nome,
        email: res.profile.email,
        role: normalizeRole(res.profile.role),
        municipioId: (municipioId ?? null) as any,
        atrativoId: (atrativoId ?? undefined) as any,
      } as User;

      let municipio: Municipio | null = null;
      if (municipioId) {
        const m = await apiClient.getMunicipio(municipioId) as Municipio & {
          Uf?: string | null;
          UF?: string | null;
        };
        municipio = {
          id: m.id,
          nome: m.nome,
          uf: String(m.uf ?? m.Uf ?? m.UF ?? '').trim(),
        } as Municipio;
      }

      const newState: AuthState = {
        user,
        municipio,
        token: res.token,
        isAuthenticated: true,
      };

      setState(newState);
      localStorage.setItem(LS_AUTH, JSON.stringify(newState));

      return true;
    } catch {
      localStorage.removeItem(LS_TOKEN);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setState({ user: null, municipio: null, token: null, isAuthenticated: false });
    localStorage.removeItem(LS_AUTH);
    localStorage.removeItem(LS_TOKEN);
  }, []);

  const hasRole = useCallback(
    (roles: User["role"][]): boolean => {
      if (!state.user) return false;
      const currentRole = normalizeRole(state.user.role);
      return roles.map(normalizeRole).includes(currentRole);
    },
    [state.user]
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

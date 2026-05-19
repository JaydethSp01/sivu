import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthResponse, Rol, UsuarioResumen } from "./types";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  usuario: UsuarioResumen | null;
  setSession: (auth: AuthResponse) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUsuario: (usuario: UsuarioResumen) => void;
  clear: () => void;
  hasRole: (...roles: Rol[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      setSession: (auth) =>
        set({
          accessToken: auth.accessToken,
          refreshToken: auth.refreshToken,
          usuario: auth.usuario,
        }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUsuario: (usuario) => set({ usuario }),
      clear: () => set({ accessToken: null, refreshToken: null, usuario: null }),
      hasRole: (...roles) => {
        const u = get().usuario;
        if (!u) return false;
        return roles.some((r) => u.roles.includes(r));
      },
    }),
    {
      name: "sivu-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        usuario: s.usuario,
      }),
    }
  )
);

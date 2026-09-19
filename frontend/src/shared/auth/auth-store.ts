/** Store de sesión (Zustand): usuario + roles + permisos en memoria, nada sensible en disco. */
import { create } from 'zustand';
import { getMeApi, loginApi, logoutApi, type Me } from './auth-api';
import { ApiError } from './api-client';

interface AuthState {
  user: Me | null;
  hydrated: boolean;
  busy: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  busy: false,
  error: null,

  login: async (username, password) => {
    set({ busy: true, error: null });
    try {
      const me = await loginApi(username.trim(), password);
      set({ user: me, hydrated: true, busy: false });
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión';
      set({ error: msg, busy: false, hydrated: true });
      return false;
    }
  },

  hydrate: async () => {
    try {
      const me = await getMeApi();
      set({ user: me, hydrated: true });
    } catch {
      set({ user: null, hydrated: true });
    }
  },

  logout: async () => {
    await logoutApi().catch(() => undefined);
    set({ user: null, hydrated: true, error: null });
  },
}));

/** ¿Tiene el permiso `modulo.accion` (case-insensitive)? Bypass para ADMIN. */
export function hasPermission(user: Me | null, code: string): boolean {
  if (!user) return false;
  if (user.roles.some((r) => r.toUpperCase() === 'ADMIN')) return true;
  return user.permissions.some((p) => p.toLowerCase() === code.toLowerCase());
}

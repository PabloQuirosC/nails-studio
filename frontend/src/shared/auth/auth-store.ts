/** Store de sesión (Zustand): usuario + roles + permisos en memoria, nada sensible en disco. */
import { create } from 'zustand';
import { getMeApi, loginApi, logoutApi, type Me } from './auth-api';
import { ApiError } from './api-client';

const SESSION_KEY = 'ns_session_user';

/** Caché no sensible (sin tokens) para no flashear "verificando" al refrescar. */
function readCachedUser(): Me | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Me;
    if (typeof parsed?.id !== 'number' || !Array.isArray(parsed.roles)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedUser(me: Me | null): void {
  try {
    if (me) sessionStorage.setItem(SESSION_KEY, JSON.stringify(me));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* almacenamiento lleno/bloqueado: la sesión en memoria sigue mandando */
  }
}

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
      writeCachedUser(me);
      set({ user: me, hydrated: true, busy: false });
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión';
      set({ error: msg, busy: false, hydrated: true });
      return false;
    }
  },

  hydrate: async () => {
    const cached = readCachedUser();
    if (cached) {
      // Pinta de inmediato con la última sesión conocida y revalida en silencio.
      set({ user: cached, hydrated: true });
      try {
        const me = await getMeApi();
        writeCachedUser(me);
        set({ user: me, hydrated: true });
      } catch {
        writeCachedUser(null);
        set({ user: null, hydrated: true });
      }
      return;
    }
    try {
      const me = await getMeApi();
      writeCachedUser(me);
      set({ user: me, hydrated: true });
    } catch {
      writeCachedUser(null);
      set({ user: null, hydrated: true });
    }
  },

  logout: async () => {
    await logoutApi().catch(() => undefined);
    writeCachedUser(null);
    set({ user: null, hydrated: true, error: null });
  },
}));

/** ¿Tiene el permiso `modulo.accion` (case-insensitive)? Bypass para ADMIN. */
export function hasPermission(user: Me | null, code: string): boolean {
  if (!user) return false;
  if (user.roles.some((r) => r.toUpperCase() === 'ADMIN')) return true;
  return user.permissions.some((p) => p.toLowerCase() === code.toLowerCase());
}

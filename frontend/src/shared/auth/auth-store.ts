/** Store de sesión (Zustand): usuario + roles + permisos SOLO en memoria.
 * Política dura: CERO storage (ni localStorage ni sessionStorage guardan sesión).
 * Al recargar se revalida contra el servidor vía cookie httpOnly; en
 * Application no debe aparecer ninguna clave ns_*. Si el access venció pero
 * el refresh vive, se renueva en silencio (single-flight: el backend rota y
 * mata la familia ante reuso, así que jamás hay dos refresh en vuelo).
 */
import { create } from 'zustand';
import { getMeApi, isTamperDetail, loginApi, logoutApi, refreshApi, type Me } from './auth-api';
import { ApiError, FORCE_LOGOUT_EVENT, purgeClientSession } from './api-client';

/** Vuelo único de renovación: hydrate corre en guard + dashboard a la vez. */
let refreshFlight: Promise<Me> | null = null;
function singleFlightRefresh(): Promise<Me> {
  if (!refreshFlight) {
    refreshFlight = refreshApi().finally(() => { refreshFlight = null; });
  }
  return refreshFlight;
}

// Limpieza legacy una vez al cargar: borra ns_session_user viejo para que
// Application quede limpio. Solo removeItem, nunca escribe.
try {
  purgeClientSession();
} catch { /* sin window en SSR */ }

interface AuthState {
  user: Me | null;
  hydrated: boolean;
  /** true solo cuando el servidor confirmó la sesión (nunca desde caché). */
  verified: boolean;
  busy: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
  /** Kill local sin llamar al backend (tamper detectado o 401 duro). */
  forceLogout: (reason?: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  verified: false,
  busy: false,
  error: null,

  login: async (username, password) => {
    set({ busy: true, error: null });
    try {
      const me = await loginApi(username.trim(), password);
      if (!me.permissions || me.permissions.length === 0) {
        // Defensa en profundidad: backend ya da 403, pero si llega aquí se mata.
        await logoutApi().catch(() => undefined);
        purgeClientSession();
        set({ user: null, hydrated: true, verified: false, busy: false, error: 'Usuario sin permisos asignados.' });
        return false;
      }
      set({ user: me, hydrated: true, verified: true, busy: false });
      return true;
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión';
      set({ error: msg, busy: false, hydrated: true });
      return false;
    }
  },

  hydrate: async () => {
    // Sin caché: siempre se revalida contra el servidor (cookie httpOnly).
    // En Application no queda ninguna clave ns_*.
    const accept = (me: Me): boolean => {
      if (!me.permissions || me.permissions.length === 0) {
        purgeClientSession();
        set({ user: null, hydrated: true, verified: false, error: 'Usuario sin permisos asignados.' });
        return false;
      }
      set({ user: me, hydrated: true, verified: true, error: null });
      return true;
    };
    try {
      const me = await getMeApi();
      accept(me);
    } catch (err) {
      // Access vencido/ausente pero refresh vivo -> renovación silenciosa.
      // Ante manipulación NO se reintenta (el kill global ya se emitió).
      if (err instanceof ApiError && err.status === 401 && !isTamperDetail(err.message)) {
        try {
          const me = await singleFlightRefresh();
          accept(me);
          return;
        } catch { /* refresh muerto: cae al logout suave */ }
      }
      purgeClientSession();
      set({ user: null, hydrated: true, verified: false });
    }
  },

  logout: async () => {
    await logoutApi().catch(() => undefined);
    purgeClientSession();
    set({ user: null, hydrated: true, verified: false, error: null });
  },

  forceLogout: (reason) => {
    purgeClientSession();
    set({
      user: null,
      hydrated: true,
      verified: false,
      busy: false,
      error: reason ? `Sesión invalidada: ${reason}` : 'Sesión invalidada por seguridad.',
    });
  },
}));

/** Mata sesión en frontend ante tamper/expiración detectada por api-client. */
if (typeof window !== 'undefined') {
  window.addEventListener(FORCE_LOGOUT_EVENT, (e) => {
    const reason = (e as CustomEvent<{ reason?: string }>)?.detail?.reason;
    try {
      useAuthStore.getState().forceLogout(reason);
      // Solo redirige si quedó montado el panel: nunca saca al visitante público.
      if (window.location.pathname.startsWith('/admin/dashboard')) {
        window.location.replace('/admin');
      }
    } catch { /* store no listo */ }
  });
}

/** ¿Tiene el permiso `modulo.accion` (case-insensitive)?
 * Sin bypass por rol: SOLO los permisos autorizan. Ser ADMIN sin el permiso
 * explícito NO concede nada (el seed le da todos, pero el código no asume).
 */
export function hasPermission(user: Me | null, code: string): boolean {
  if (!user) return false;
  if (!user.permissions || user.permissions.length === 0) return false;
  return user.permissions.some((p) => p.toLowerCase() === code.toLowerCase());
}

/** Puerta del panel: sin permisos no hay dashboard, aunque haya sesión. */
export function hasAnyPermission(user: Me | null): boolean {
  return !!user && Array.isArray(user.permissions) && user.permissions.length > 0;
}

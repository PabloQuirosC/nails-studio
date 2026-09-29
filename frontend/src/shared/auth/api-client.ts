/** Cliente API: token solo en memoria + cookie httpOnly.
 *
 * Política dura: CERO storage para sesión (ni localStorage ni sessionStorage).
 * En Application no debe aparecer ninguna clave ns_*. Si se detecta
 * manipulación (401) se purga memoria y se emite `ns:force-logout`.
 */
import { hideLoading, showLoading } from '../loading/loading-store';

// En Vercel con rewrites, VITE_API_URL debe estar VACÍO para usar rutas relativas.
// En local, el proxy de Vite maneja /api → http://127.0.0.1:8000
const API_URL = (import.meta.env.VITE_API_URL as string | undefined ?? '').replace(/\/$/, '');

let memoryToken: string | null = null;
export function setToken(t: string | null): void { memoryToken = t; }
export function getToken(): string | null { return memoryToken; }
export function clearToken(): void { memoryToken = null; }

export const FORCE_LOGOUT_EVENT = 'ns:force-logout';
const LEGACY_KEYS = ['ns_session_user', 'ns_session', 'ns_token', 'nails_session'];

/** Limpieza legacy una sola vez: borra huellas viejas, nunca escribe. */
export function purgeClientSession(): void {
  memoryToken = null;
  try {
    for (const k of LEGACY_KEYS) sessionStorage.removeItem(k);
  } catch { /* almacenamiento bloqueado */ }
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
  } catch { /* almacenamiento bloqueado */ }
}

function emitForceLogout(reason: string): void {
  purgeClientSession();
  try {
    window.dispatchEvent(new CustomEvent(FORCE_LOGOUT_EVENT, { detail: { reason } }));
  } catch { /* SSR / sin window */ }
}

// Expirar es normal (el access vive 15 min y se renueva vía /refresh);
// solo la firma manipulada es kill. No meter aquí 'expirado'.
const TAMPER_HINTS = ['manipulaci', 'manipulado', 'firma inv', 'invalidada'];

/** ¿El detalle de un 401 indica manipulación? El store lo usa para decidir
 * si intenta renovación silenciosa (nunca ante tamper). */
export function isTamperDetail(detail: string): boolean {
  const lowered = detail.toLowerCase();
  return TAMPER_HINTS.some((h) => lowered.includes(h));
}

/** Polling de listas admin: se refrescan solas sin recargar (20 s, pausado en pestaña oculta). */
export const LIVE_REFRESH_MS = 20_000;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiInit extends RequestInit {
  message?: string;
  block?: boolean;
  /** background: polling silencioso, nunca muestra el spinner global. */
  background?: boolean;
}

/** fetch contra /api/v1 con bloqueo visual opcional (usa el spinner de uñas). */
export async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const { message = 'Puliendo tu experiencia…', block = true, background = false, ...rest } = init ?? {};
  const silent = background || !block;
  if (!silent) showLoading(message);
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (memoryToken) headers.Authorization = `Bearer ${memoryToken}`;
    const method = (rest.method ?? 'GET').toString().toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') headers['X-Requested-With'] = 'fetch';
    const res = await fetch(`${API_URL}${path}`, {
      ...rest,
      headers: { ...headers, ...(rest.headers as Record<string, string> | undefined) },
      credentials: 'include',
      signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401) {
      const data = await res.json().catch(() => null);
      const detail = String((data as { detail?: unknown } | null)?.detail ?? '');
      const lowered = detail.toLowerCase();
      // Anónimo sin sesión ("No autenticado"): caso normal en /admin sin login.
      // Nunca es kill global, solo limpia el token en memoria.
      const isAnonymous = lowered.includes('no autenticado') || lowered.includes('sin refresh token');
      const tampered = !isAnonymous && isTamperDetail(detail);
      // 401 siempre mata token en memoria; si huele a tamper/expiración, kill total front.
      if (tampered || (!isAnonymous && detail === '')) {
        emitForceLogout(detail || 'unauthorized');
      } else {
        clearToken();
      }
      const msg = detail ? detail : `Error ${res.status}`;
      throw new ApiError(res.status, msg);
    }
    if (res.status === 204) return null as T;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const detail = (data as { detail?: unknown } | null)?.detail;
      const msg = Array.isArray(detail)
        ? (detail as Array<{ msg?: string }>).map((d) => d.msg ?? 'Error').join('; ')
        : typeof detail === 'string' ? detail : `Error ${res.status}`;
      throw new ApiError(res.status, msg);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, 'No se pudo conectar con el servidor');
  } finally {
    if (!silent) hideLoading();
  }
}

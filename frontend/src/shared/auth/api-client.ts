/** Cliente API: token solo en memoria (nunca localStorage) + cookie httpOnly (credentials:include). */
import { hideLoading, showLoading } from '../loading/loading-store';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

let memoryToken: string | null = null;
export function setToken(t: string | null): void { memoryToken = t; }
export function getToken(): string | null { return memoryToken; }
export function clearToken(): void { memoryToken = null; }

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
}

/** fetch contra /api/v1 con bloqueo visual opcional (usa el spinner de uñas). */
export async function apiFetch<T>(path: string, init?: ApiInit): Promise<T> {
  const { message = 'Puliendo tu experiencia…', block = true, ...rest } = init ?? {};
  if (block) showLoading(message);
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
    if (res.status === 401) clearToken();
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
    if (block) hideLoading();
  }
}

import { hideLoading, showLoading } from './loading-store';

interface BlockingInit extends RequestInit {
  /** Texto del loader. Por defecto: 'Puliendo tu experiencia…'. */
  message?: string;
  /** Si es false, no bloquea la página (para precargas silenciosas). */
  block?: boolean;
}

/**
 * Wrapper de fetch que bloquea la página con el spinner de uñas
 * hasta que el endpoint responde (éxito o error).
 *
 *   const res = await apiFetch('/api/v1/bookings', { message: 'Reservando tu cita…' });
 */
export async function apiFetch(input: RequestInfo | URL, init?: BlockingInit): Promise<Response> {
  const { message, block = true, ...rest } = init ?? {};
  if (!block) return fetch(input, rest);
  showLoading(message);
  try {
    return await fetch(input, rest);
  } finally {
    hideLoading();
  }
}

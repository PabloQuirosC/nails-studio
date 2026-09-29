/** Modelos + endpoints de auth/RBAC (contratos del backend Hexagonal). */
import { apiFetch, clearToken, isTamperDetail, setToken } from './api-client';

export { isTamperDetail };

export interface Me {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: string;
  roles: string[];
  permissions: string[];
}

interface TokenRes { access_token: string; expires_in: number; }

export async function loginApi(username: string, password: string): Promise<Me> {
  const tok = await apiFetch<TokenRes>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    message: 'Verificando tus credenciales…',
  });
  setToken(tok.access_token);
  return getMeApi();
}

export async function getMeApi(): Promise<Me> {
  return apiFetch<Me>('/api/v1/auth/me', { message: 'Cargando tu sesión…', block: false });
}

/** Renueva el par con la cookie ns_refresh (el backend rota: revoca la usada
 * y emite una nueva). Solo para expiración/ausencia de access, jamás ante
 * manipulación: un refresh inválido también mata la familia en el servidor. */
export async function refreshApi(): Promise<Me> {
  const tok = await apiFetch<TokenRes>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({}),
    message: 'Renovando sesión…',
    block: false,
  });
  setToken(tok.access_token);
  return getMeApi();
}

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch<{ detail: string }>('/api/v1/auth/logout', { method: 'POST', block: false });
  } finally {
    clearToken();
  }
}

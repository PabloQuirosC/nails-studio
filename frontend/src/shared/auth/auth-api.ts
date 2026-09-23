/** Modelos + endpoints de auth/RBAC (contratos del backend Hexagonal). */
import { apiFetch, clearToken, setToken } from './api-client';

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

export async function logoutApi(): Promise<void> {
  try {
    await apiFetch<{ detail: string }>('/api/v1/auth/logout', { method: 'POST', block: false });
  } finally {
    clearToken();
  }
}

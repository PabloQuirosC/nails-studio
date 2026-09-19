/** Capa de datos admin (mejora futura #3): TanStack Query contra el backend Hexagonal.

Patrón online-con-fallback: si el backend no responde (ApiError 0 / 401 sin
sesión de staff), los hooks devuelven `undefined` y el Dashboard usa sus mocks
locales. Mutaciones con invalidación de `['admin', ...]`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/auth/api-client';

export interface BackendUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  roles: string[];
  last_login: string | null;
}

export interface BackendRole {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  is_system: boolean;
}

export interface BackendPermission {
  id: number;
  module_id: number;
  name: string;
  code: string;
  type: string;
  active: boolean;
}

export interface GiftCard {
  code: string;
  amount: number;
  buyer: string;
  recipient: string | null;
  used: boolean;
}

interface Page<T> { items: T[]; total: number; }

const PAGE_SIZE = 6;

/** Solo consideramos "en línea" cuando hay respuesta (errores de red → mocks). */
function isOffline(err: unknown): boolean {
  return (err as { status?: number })?.status === 0;
}

// ─── Usuarios ───
export function useServerUsers(page: number, q: string, role = '') {
  const rq = role && role !== 'all' ? `&role=${encodeURIComponent(role)}` : '';
  return useQuery({
    queryKey: ['admin', 'users', page, q.trim().toLowerCase(), role],
    queryFn: () =>
      apiFetch<Page<BackendUser>>(
        `/api/v1/usuarios?offset=${(page - 1) * PAGE_SIZE}&limit=${PAGE_SIZE}&q=${encodeURIComponent(q.trim())}${rq}`,
        { message: 'Cargando usuarios…' },
      ),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { username: string; email: string; full_name: string; password: string }) =>
      apiFetch<BackendUser>('/api/v1/usuarios', {
        method: 'POST', body: JSON.stringify(input), message: 'Creando usuario…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/usuarios/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}

export function useToggleUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; status: 'ACTIVE' | 'INACTIVE' }) =>
      apiFetch<BackendUser>(`/api/v1/usuarios/${input.id}`, {
        method: 'PUT', body: JSON.stringify({ status: input.status }), message: 'Actualizando estado…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
  });
}

// ─── Roles y permisos ───
export function useServerRoles() {
  return useQuery({
    queryKey: ['admin', 'roles'],
    queryFn: () => apiFetch<BackendRole[]>('/api/v1/roles', { message: 'Cargando roles…' }),
    retry: 1,
    staleTime: 60_000,
  });
}

export function useServerPermissions() {
  return useQuery({
    queryKey: ['admin', 'permissions'],
    queryFn: () => apiFetch<BackendPermission[]>('/api/v1/permisos', { message: 'Cargando permisos…' }),
    retry: 1,
    staleTime: 60_000,
  });
}

export function useRolePermissions(roleId: number | null) {
  return useQuery({
    queryKey: ['admin', 'roles', roleId, 'permissions'],
    queryFn: () =>
      apiFetch<BackendPermission[]>(`/api/v1/roles/${roleId}/permisos`, { message: 'Cargando permisos del rol…' }),
    enabled: roleId !== null,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useGrantPermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { roleId: number; permissionId: number }) =>
      apiFetch<{ detail: string }>(`/api/v1/roles/${input.roleId}/permisos`, {
        method: 'POST', body: JSON.stringify({ permission_id: input.permissionId }),
        message: 'Asignando permiso…',
      }),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'roles', v.roleId, 'permissions'] });
    },
  });
}

export function useRevokePermission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { roleId: number; permissionId: number }) =>
      apiFetch<{ detail: string }>(`/api/v1/roles/${input.roleId}/permisos/${input.permissionId}`, {
        method: 'DELETE', message: 'Retirando permiso…',
      }),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: ['admin', 'roles', v.roleId, 'permissions'] });
    },
  });
}

// ─── Gift cards ───
export function useServerGiftCards(filter: 'all' | 'active' | 'used', q: string) {
  const used = filter === 'all' ? '' : filter === 'active' ? '&used=false' : '&used=true';
  return useQuery({
    queryKey: ['admin', 'giftcards', filter, q.trim().toLowerCase()],
    queryFn: () =>
      apiFetch<Page<GiftCard>>(
        `/api/v1/giftcards?offset=0&limit=100&q=${encodeURIComponent(q.trim())}${used}`,
        { message: 'Cargando gift cards…' },
      ),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useCreateGiftCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; buyer: string; recipient?: string }) =>
      apiFetch<GiftCard>('/api/v1/giftcards', {
        method: 'POST', body: JSON.stringify(input), message: 'Creando gift card…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'giftcards'] }); },
  });
}

export function useSetGiftCardUsed() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; used: boolean }) =>
      apiFetch<GiftCard>(`/api/v1/giftcards/${input.code}`, {
        method: 'PUT', body: JSON.stringify({ used: input.used }), message: 'Actualizando…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'giftcards'] }); },
  });
}

export function useUpdateGiftCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; patch: { amount?: number; buyer?: string; recipient?: string | null } }) =>
      apiFetch<GiftCard>(`/api/v1/giftcards/${input.code}`, {
        method: 'PUT', body: JSON.stringify(input.patch), message: 'Guardando cambios…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'giftcards'] }); },
  });
}

export function useDeleteGiftCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) =>
      apiFetch<{ detail: string }>(`/api/v1/giftcards/${code}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'giftcards'] }); },
  });
}

export interface GiftCardAudit {
  id: number;
  code: string;
  actor_username: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useGiftCardHistory(code: string | null) {
  return useQuery({
    queryKey: ['admin', 'giftcards', code, 'history'],
    queryFn: () =>
      apiFetch<GiftCardAudit[]>(`/api/v1/giftcards/${code}/history`, { message: 'Cargando historial…' }),
    enabled: code !== null,
    retry: 1,
    staleTime: 15_000,
  });
}

export { isOffline };

/** Capa de datos del estudio (catálogo, agenda, clientas) contra el backend Hexagonal.

Mismo patrón que rbac-api.ts: online-con-fallback (sin respuesta → mocks del
Dashboard) y mutaciones con invalidación. Los queries llevan `message` para
que el spinner de uñas bloquee mientras el endpoint no responde.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/auth/api-client';
import type { GiftCard } from './rbac-api';

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
  active: boolean;
  design_count?: number;
}

export interface Design {
  id: number;
  category_id: number;
  name: string;
  price: number;
  duration_min: number;
  image_url: string | null;
  description: string | null;
  technique: string | null;
  tags: string[];
  occasion: string | null;
  complexity: string | null;
  active: boolean;
}

export interface Appointment {
  id: number;
  client_id: number;
  design_id: number | null;
  artist_name: string;
  starts_at: string;
  ends_at: string;
  status: string;
  notes: string | null;
}

export interface Client {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  points: number;
  visits: number;
  last_visit: string | null;
  active: boolean;
}

export interface Rewards {
  client_id: number;
  visits: number;
  visits_to_reward: number;
  progress_pct: number;
  loyalty_cards: string[];
}

interface Page<T> { items: T[]; total: number; }

const PAGE = 6;

// ─── Catálogo ───
export function useServerCategories() {
  return useQuery({
    queryKey: ['studio', 'categories'],
    queryFn: () => apiFetch<Category[]>('/api/v1/categories', { message: 'Cargando categorías…' }),
    retry: 1,
    staleTime: 60_000,
  });
}

export function useServerDesigns(page: number, q: string, category: string, limit = PAGE) {
  const cat = category && category !== 'all' ? `&category=${encodeURIComponent(category)}` : '';
  return useQuery({
    queryKey: ['studio', 'designs', page, q.trim().toLowerCase(), category, limit],
    queryFn: () =>
      apiFetch<Page<Design>>(
        `/api/v1/designs?offset=${(page - 1) * limit}&limit=${limit}&q=${encodeURIComponent(q.trim())}${cat}`,
        { message: 'Cargando diseños…' },
      ),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; icon: string; color: string; description?: string }) =>
      apiFetch<Category>('/api/v1/categories', {
        method: 'POST', body: JSON.stringify(input), message: 'Creando categoría…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'categories'] }); },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/categories/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['studio', 'categories'] });
      void qc.invalidateQueries({ queryKey: ['studio', 'designs'] });
    },
  });
}

export function useCreateDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      apiFetch<Design>('/api/v1/designs', {
        method: 'POST', body: JSON.stringify(input), message: 'Creando diseño…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'designs'] }); },
  });
}

export function useDeleteDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/designs/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'designs'] }); },
  });
}

export function useServerDesign(id: number | null) {
  return useQuery({
    queryKey: ['studio', 'designs', id],
    queryFn: () => apiFetch<Design>(`/api/v1/designs/${id}`, { message: 'Cargando diseño…' }),
    enabled: id !== null,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useUpdateDesign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; patch: Record<string, unknown> }) =>
      apiFetch<Design>(`/api/v1/designs/${input.id}`, {
        method: 'PUT', body: JSON.stringify(input.patch), message: 'Guardando cambios…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'designs'] }); },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; patch: Record<string, unknown> }) =>
      apiFetch<Category>(`/api/v1/categories/${input.id}`, {
        method: 'PUT', body: JSON.stringify(input.patch), message: 'Guardando cambios…',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['studio', 'categories'] });
      void qc.invalidateQueries({ queryKey: ['studio', 'designs'] });
    },
  });
}

// ─── Agenda ───
export function useServerAppointments(day = '', status = '') {
  return useQuery({
    queryKey: ['studio', 'appointments', day, status],
    queryFn: () =>
      apiFetch<Page<Appointment>>(
        `/api/v1/appointments?offset=0&limit=100&day=${encodeURIComponent(day)}&status=${encodeURIComponent(status)}`,
        { message: 'Cargando agenda…' },
      ),
    retry: 1,
    staleTime: 15_000,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      apiFetch<Appointment>('/api/v1/appointments', {
        method: 'POST', body: JSON.stringify(input), message: 'Reservando cita…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'appointments'] }); },
  });
}

export function useSetAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; status: string }) =>
      apiFetch<Appointment>(`/api/v1/appointments/${input.id}/status`, {
        method: 'PATCH', body: JSON.stringify({ status: input.status }), message: 'Actualizando cita…',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['studio', 'appointments'] });
      void qc.invalidateQueries({ queryKey: ['studio', 'clients'] });
      void qc.invalidateQueries({ queryKey: ['admin', 'giftcards'] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/appointments/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'appointments'] }); },
  });
}

// ─── Clientas ───
export function useServerClients(page: number, q: string, limit = PAGE) {
  return useQuery({
    queryKey: ['studio', 'clients', page, q.trim().toLowerCase(), limit],
    queryFn: () =>
      apiFetch<Page<Client>>(
        `/api/v1/clients?offset=${(page - 1) * limit}&limit=${limit}&q=${encodeURIComponent(q.trim())}`,
        { message: 'Cargando clientas…' },
      ),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useClientRewards(clientId: number | null) {
  return useQuery({
    queryKey: ['studio', 'clients', clientId, 'rewards'],
    queryFn: () =>
      apiFetch<Rewards>(`/api/v1/clients/${clientId}/rewards`, { message: 'Cargando lealtad…' }),
    enabled: clientId !== null,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) =>
      apiFetch<Client>('/api/v1/clients', {
        method: 'POST', body: JSON.stringify(input), message: 'Registrando clienta…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'clients'] }); },
  });
}

export function useServerClient(id: number | null) {
  return useQuery({
    queryKey: ['studio', 'clients', id],
    queryFn: () => apiFetch<Client>(`/api/v1/clients/${id}`, { message: 'Cargando clienta…' }),
    enabled: id !== null,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; patch: Record<string, unknown> }) =>
      apiFetch<Client>(`/api/v1/clients/${input.id}`, {
        method: 'PUT', body: JSON.stringify(input.patch), message: 'Guardando cambios…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'clients'] }); },
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/clients/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'clients'] }); },
  });
}

export function useAdjustClientPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; delta: number; reason: string }) =>
      apiFetch<Client>(`/api/v1/clients/${input.id}/points`, {
        method: 'POST',
        body: JSON.stringify({ delta: input.delta, reason: input.reason }),
        message: 'Ajustando puntos…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['studio', 'clients'] }); },
  });
}

// ─── Lealtad (gift cards emitidas cada 10 visitas) ───
export function useLoyaltyCards(enabled: boolean) {
  return useQuery({
    queryKey: ['studio', 'loyalty-cards'],
    queryFn: () =>
      apiFetch<Page<GiftCard>>('/api/v1/giftcards?offset=0&limit=100&source=loyalty', {
        message: 'Cargando lealtad…',
      }),
    enabled,
    retry: 1,
    staleTime: 30_000,
  });
}

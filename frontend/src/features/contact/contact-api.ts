/** Contacto: info pública + envío real, y buzón admin (leer/eliminar + datos). */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, LIVE_REFRESH_MS } from '../../shared/auth/api-client';

export interface ContactInfo {
  address: string;
  schedule: string;
  whatsapp: string;
  instagram: string;
  updated_at: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ContactSocial {
  id: number;
  label: string;
  url: string;
  icon: string;
  created_at: string;
}

/** Claves de icono aceptadas (el resto cae a enlace genérico). */
export const SOCIAL_ICONS = ['facebook', 'instagram', 'tiktok', 'youtube', 'whatsapp', 'web'] as const;

interface Page<T> { items: T[]; total: number; }

// ─── Pública (sin auth) ───
export function useContactInfo() {
  return useQuery({
    queryKey: ['public', 'contact-info'],
    queryFn: () => apiFetch<ContactInfo>('/api/v1/contact/info', { message: 'Cargando contacto…', block: false }),
    retry: 1,
    staleTime: 120_000,
  });
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (input: { name: string; email: string; phone?: string; message: string }) =>
      apiFetch<{ detail: string; id: number }>('/api/v1/contact/messages', {
        method: 'POST',
        body: JSON.stringify(input),
        message: 'Enviando tu mensaje…',
      }),
    retry: 0,
  });
}

// ─── Admin (requiere contacto.read/update/delete) ───
export function useAdminMessages(unreadOnly = false, page = 1, limit = 10) {
  const offset = (Math.max(1, page) - 1) * limit;
  return useQuery({
    queryKey: ['admin', 'contact-messages', unreadOnly, page, limit],
    queryFn: () =>
      apiFetch<Page<ContactMessage>>(
        `/api/v1/contact/messages?offset=${offset}&limit=${limit}${unreadOnly ? '&unread_only=true' : ''}`,
        { message: 'Cargando mensajes…', background: true },
      ),
    retry: 1,
    staleTime: 30_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

export function useMarkMessageRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; is_read: boolean }) =>
      apiFetch<ContactMessage>(`/api/v1/contact/messages/${input.id}`, {
        method: 'PUT', body: JSON.stringify({ is_read: input.is_read }), message: 'Actualizando…',
      }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'contact-messages'] }); },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/contact/messages/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['admin', 'contact-messages'] }); },
  });
}

export function useAdminContactInfo() {
  return useQuery({
    queryKey: ['admin', 'contact-info'],
    queryFn: () => apiFetch<ContactInfo>('/api/v1/contact/info', { message: 'Cargando datos…', block: false }),
    retry: 1,
    staleTime: 60_000,
  });
}

export function useUpdateContactInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Pick<ContactInfo, 'address' | 'schedule' | 'whatsapp' | 'instagram'>>) =>
      apiFetch<ContactInfo>('/api/v1/contact/info', {
        method: 'PUT', body: JSON.stringify(patch), message: 'Guardando datos…',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'contact-info'] });
      void qc.invalidateQueries({ queryKey: ['public', 'contact-info'] });
    },
  });
}

// ─── Redes sociales: lectura pública, escritura con contacto.update/delete ───
export function useContactSocials() {
  return useQuery({
    queryKey: ['public', 'contact-socials'],
    queryFn: () => apiFetch<ContactSocial[]>('/api/v1/contact/socials', { message: 'Cargando redes…', block: false }),
    retry: 1,
    staleTime: 120_000,
  });
}

export function useCreateSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { label: string; url: string; icon: string }) =>
      apiFetch<ContactSocial>('/api/v1/contact/socials', {
        method: 'POST', body: JSON.stringify(input), message: 'Agregando red…',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['public', 'contact-socials'] });
    },
  });
}

export function useUpdateSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: number; patch: { label?: string; url?: string; icon?: string } }) =>
      apiFetch<ContactSocial>(`/api/v1/contact/socials/${input.id}`, {
        method: 'PUT', body: JSON.stringify(input.patch), message: 'Guardando red…',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['public', 'contact-socials'] });
    },
  });
}

export function useDeleteSocial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<{ detail: string }>(`/api/v1/contact/socials/${id}`, { method: 'DELETE', message: 'Eliminando…' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['public', 'contact-socials'] });
    },
  });
}

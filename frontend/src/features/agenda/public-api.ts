/** Reserva pública (sin auth): crea clienta si no existe, cita en pending. */
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../../shared/auth/api-client';

export interface PublicBookingInput {
  name: string;
  phone: string;
  email?: string;
  design_id: number | null;
  starts_at: string;
  ends_at: string;
  notes?: string;
}

export interface PublicBookingOut {
  id: number;
  client_id: number;
  design_id: number | null;
  starts_at: string;
  ends_at: string;
  status: string;
}

export function useCreatePublicBooking() {
  return useMutation({
    mutationFn: (input: PublicBookingInput) =>
      apiFetch<PublicBookingOut>('/api/v1/appointments/public', {
        method: 'POST',
        body: JSON.stringify(input),
        message: 'Confirmando tu reserva…',
      }),
    retry: 0,
  });
}

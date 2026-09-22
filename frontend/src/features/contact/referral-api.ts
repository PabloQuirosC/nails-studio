/** Referidos: contenido público del programa + edición admin. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../shared/auth/api-client';

export interface ReferralInfo {
  title: string;
  subtitle: string;
  steps: string[];
  updated_at: string;
}

export const REFERRAL_DEFAULTS: ReferralInfo = {
  title: 'Programa de referidos',
  subtitle: 'Invita a tus amigas y acumula recompensas de lealtad.',
  steps: [
    'Comparte el estudio con tus amigas e invítalas a agendar',
    'Cada 10 visitas acumulas una gift card de lealtad',
    'Consulta aquí tu saldo con el teléfono de tu registro',
  ],
  updated_at: '',
};

// ─── Pública (sin auth) ───
export function useReferralInfo() {
  return useQuery({
    queryKey: ['public', 'referral-info'],
    queryFn: () => apiFetch<ReferralInfo>('/api/v1/referrals/info', { message: 'Cargando programa…', block: false }),
    retry: 1,
    staleTime: 120_000,
  });
}

// ─── Admin (requiere referidos.update) ───
export function useUpdateReferralInfo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title?: string; subtitle?: string; steps?: string[] }) =>
      apiFetch<ReferralInfo>('/api/v1/referrals/info', {
        method: 'PUT', body: JSON.stringify(input), message: 'Guardando programa…',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['public', 'referral-info'] });
    },
  });
}

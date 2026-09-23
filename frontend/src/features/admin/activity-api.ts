/** Feed global de actividad reciente (auditorías de auth + gift cards). */
import { useQuery } from '@tanstack/react-query';
import { apiFetch, LIVE_REFRESH_MS } from '../../shared/auth/api-client';

export interface ActivityItem {
  kind: 'login_ok' | 'login_fail' | 'giftcard';
  text: string;
  actor: string | null;
  created_at: string | null;
}

export function useRecentActivity(limit = 12) {
  return useQuery({
    queryKey: ['admin', 'activity', limit],
    queryFn: () =>
      apiFetch<ActivityItem[]>(`/api/v1/actividad/reciente?limit=${limit}`, {
        message: 'Cargando actividad…',
        background: true,
      }),
    retry: 1,
    staleTime: 30_000,
    refetchInterval: LIVE_REFRESH_MS,
  });
}

/** Catálogo público (sin auth): diseños y categorías con fallback a mocks. */
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../shared/auth/api-client';

export interface PublicCategory {
  id: number;
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string | null;
}

export interface PublicDesign {
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
}

interface Page<T> { items: T[]; total: number; }

export function usePublicCategories() {
  return useQuery({
    queryKey: ['public', 'categories'],
    queryFn: () => apiFetch<PublicCategory[]>('/api/v1/categories', { message: 'Cargando catálogo…' }),
    retry: 1,
    staleTime: 120_000,
  });
}

export function usePublicDesigns(q = '', category = '', occasion = '') {
  const cat = category ? `&category=${encodeURIComponent(category)}` : '';
  const occ = occasion ? `&occasion=${encodeURIComponent(occasion)}` : '';
  return useQuery({
    queryKey: ['public', 'designs', q.trim().toLowerCase(), category, occasion],
    queryFn: () =>
      apiFetch<Page<PublicDesign>>(
        `/api/v1/designs?offset=0&limit=100&q=${encodeURIComponent(q.trim())}${cat}${occ}`,
        { message: 'Cargando diseños…' },
      ),
    retry: 1,
    staleTime: 60_000,
  });
}

export function usePublicDesign(id: string | undefined) {
  return useQuery({
    queryKey: ['public', 'designs', id],
    queryFn: () => apiFetch<PublicDesign>(`/api/v1/designs/${id}`, { message: 'Cargando diseño…' }),
    enabled: !!id,
    retry: 1,
    staleTime: 60_000,
  });
}

export interface PublicPost {
  id: number;
  slug: string;
  kind: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  category: string;
  image_url: string | null;
  read_minutes: number;
  author: string | null;
  rating: number | null;
  design_name: string | null;
  created_at?: string;
}

export function usePublicPosts(kind: 'articulo' | 'testimonio') {
  return useQuery({
    queryKey: ['public', 'posts', kind],
    queryFn: () =>
      apiFetch<Page<PublicPost>>(`/api/v1/posts?limit=100&kind=${kind}`, {
        message: kind === 'articulo' ? 'Cargando blog…' : 'Cargando testimonios…',
      }),
    retry: 1,
    staleTime: 120_000,
  });
}

export function usePublicPost(ref: string | undefined) {
  return useQuery({
    queryKey: ['public', 'posts', ref],
    queryFn: () => apiFetch<PublicPost>(`/api/v1/posts/${ref}`, { message: 'Cargando artículo…' }),
    enabled: !!ref,
    retry: 1,
    staleTime: 120_000,
  });
}

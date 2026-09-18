import { useSyncExternalStore } from 'react';

interface LoadingState {
  count: number;
  message: string;
}

let state: LoadingState = { count: 0, message: '' };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function syncScrollLock(): void {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = state.count > 0 ? 'hidden' : '';
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): LoadingState {
  return state;
}

/** Muestra el loader global (contado por referencia: N peticiones concurrentes). */
export function showLoading(message = 'Puliendo tu experiencia…'): void {
  state = { count: state.count + 1, message };
  syncScrollLock();
  emit();
}

/** Libera una unidad de carga. Nunca deja el contador en negativo. */
export function hideLoading(): void {
  state = { count: Math.max(0, state.count - 1), message: state.count <= 1 ? '' : state.message };
  syncScrollLock();
  emit();
}

/** Ejecuta una tarea bloqueando la página hasta su resolución (éxito o error). */
export async function withLoading<T>(task: Promise<T> | (() => Promise<T>), message?: string): Promise<T> {
  showLoading(message);
  try {
    return await (typeof task === 'function' ? task() : task);
  } finally {
    hideLoading();
  }
}

/** Hook para el overlay global. */
export function useLoading(): { active: boolean; message: string } {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { active: snap.count > 0, message: snap.message };
}

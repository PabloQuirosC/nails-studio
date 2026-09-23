/** Guards sin flash ni setTimeout en render.
 * ProtectedRoute exige sesión verificada por servidor + al menos 1 permiso.
 * Cero storage: sin caché que autorice, solo memoria + cookie httpOnly.
 */
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { hasAnyPermission, hasPermission, useAuthStore } from './auth-store';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, hydrated, verified, hydrate } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    // hydrated=true = el servidor ya respondió: sin sesión verificada no hay panel.
    if (!verified || !user || !hasAnyPermission(user)) navigate('/admin', { replace: true });
  }, [hydrated, verified, user, navigate]);

  if (!hydrated) {
    // Sin texto: fondo neutro mientras el SERVIDOR confirma la sesión.
    return <div className="min-h-screen bg-[#060505]" aria-hidden="true" />;
  }
  if (!verified || !user || !hasAnyPermission(user)) return null;
  return <>{children}</>;
}

export function RequirePermission({ code, children }: { code: string; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const verified = useAuthStore((s) => s.verified);
  if (!verified || !hasPermission(user, code)) {
    return (
      <div className="rounded-2xl border border-[#d4613a]/30 bg-[#d4613a]/[0.06] p-6 text-center">
        <p className="font-serif text-lg text-[#faf7f0]">Sin permiso</p>
        <p className="text-[#b3a893] text-xs mt-1 font-mono">Requiere {code}</p>
      </div>
    );
  }
  return <>{children}</>;
}

/** Para botones/acciones: oculta en vez de mostrar el bloque "Sin permiso". */
export function Can({ code, children }: { code: string; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const verified = useAuthStore((s) => s.verified);
  if (!verified || !hasPermission(user, code)) return null;
  return <>{children}</>;
}

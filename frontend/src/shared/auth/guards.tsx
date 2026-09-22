/** Guards sin flash ni setTimeout en render (corrige antipatrón de dulce). */
import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { hasPermission, useAuthStore } from './auth-store';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, hydrated, hydrate } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !user) navigate('/admin', { replace: true });
  }, [hydrated, user, navigate]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060505]">
        <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Verificando sesión…</p>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}

export function RequirePermission({ code, children }: { code: string; children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!hasPermission(user, code)) {
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
  if (!hasPermission(user, code)) return null;
  return <>{children}</>;
}

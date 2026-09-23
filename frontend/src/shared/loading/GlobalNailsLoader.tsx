import { useEffect, useState } from 'react';
import { useLoading } from './loading-store';

/**
 * Overlay global que bloquea la página mientras hay endpoints ocupados.
 * Minimalista profesional: monograma en anillo + barra indeterminada.
 * Solo transform/opacity. Retardo de 200 ms para no parpadear en respuestas rápidas.
 */
export function GlobalNailsLoader() {
  const { active, message } = useLoading();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!active || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message || 'Cargando'}
      className="fixed inset-0 z-[2000] flex items-center justify-center animate-fade-in"
      style={{
        background: 'rgba(12,10,8,0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'wait',
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center px-10 py-9 rounded-3xl border border-[#f2d29b]/20 animate-scale-in"
        style={{ background: 'linear-gradient(160deg, #1a140d 0%, #0f0c09 100%)', boxShadow: '0 0 80px rgba(242,210,155,0.12)' }}>
        {/* ── Logo en anillo ── */}
        <div className="relative w-16 h-16" aria-hidden="true">
          <span className="absolute inset-0 rounded-full border border-[#f2d29b]/15" />
          <span className="loader-ring absolute inset-0 rounded-full" />
          <img
            src="/logo.jpg"
            alt=""
            className="absolute inset-1.5 w-[52px] h-[52px] rounded-full object-cover"
          />
        </div>

        <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.35em] uppercase mt-6">Nails Studio</p>
        <p className="text-[#b3a893] text-xs mt-2">
          {message || 'Cargando…'}
        </p>

        {/* ── Barra indeterminada ── */}
        <div className="w-40 h-px mt-5 bg-[#f2d29b]/15 rounded-full overflow-hidden" aria-hidden="true">
          <span className="loader-bar block h-full w-1/3 bg-[#f2d29b] rounded-full" />
        </div>
      </div>
    </div>
  );
}

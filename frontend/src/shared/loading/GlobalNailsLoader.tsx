import { useEffect, useState } from 'react';
import { useLoading } from './loading-store';

const NAILS = [0, 1, 2, 3, 4];

/**
 * Overlay global que bloquea la página mientras hay endpoints ocupados.
 * Temática salón: 5 uñas que se van esmaltando en secuencia + destello de pincel.
 * Retardo de 200 ms para no parpadear en respuestas rápidas.
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
        background: 'rgba(8,7,6,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'wait',
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.preventDefault()}
    >
      <div className="flex flex-col items-center px-8 py-10 rounded-3xl border border-[#c9a96e]/25 animate-scale-in"
        style={{ background: 'linear-gradient(160deg, #1c150c 0%, #100d08 100%)', boxShadow: '0 0 80px rgba(201,169,110,0.15)' }}>
        {/* ── 5 uñas esmaltándose ── */}
        <div className="flex items-end gap-2.5" aria-hidden="true">
          {NAILS.map((i) => (
            <div
              key={i}
              className="nail-tip"
              style={{ animationDelay: `${i * 0.16}s`, width: 22, height: 30 + (i === 2 ? 6 : 0) }}
            >
              <span className="nail-fill" style={{ animationDelay: `${i * 0.16}s` }} />
              <span className="nail-shine" style={{ animationDelay: `${i * 0.16}s` }} />
            </div>
          ))}
        </div>

        {/* ── trazo de pincel ── */}
        <div className="brush-stroke" aria-hidden="true">
          <span className="brush-bristle" />
        </div>

        <p className="font-serif italic text-[#f0ebe4] text-lg mt-2">Nails Studio</p>
        <p className="text-[#c9a96e] text-xs font-mono tracking-widest uppercase mt-1">
          {message || 'Puliendo tu experiencia…'}
        </p>
        <div className="flex gap-1.5 mt-4" aria-hidden="true">
          {[0, 1, 2].map((d) => (
            <span key={d} className="loader-dot" style={{ animationDelay: `${d * 0.22}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Paginación local (mocks/fallbacks). Para datos de servidor el Dashboard usa page/total propios. */
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginated = items.slice((page - 1) * pageSize, page * pageSize);
  const safeSet = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));
  return { paginated, page, totalPages, setPage: safeSet };
}

export function Pagination({ page, total, onChange, count, pageSize, showNumbers = true }: {
  page: number; total: number; onChange: (p: number) => void; count: number; pageSize: number;
  /** Solo flechas anterior/siguiente (para muchas páginas, ej. catálogo de permisos). */
  showNumbers?: boolean;
}) {
  if (total <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-[#b3a893] text-xs font-mono">
        Mostrando {from}–{to} de {count}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Página anterior"
          className="h-8 px-3 flex items-center justify-center gap-1 rounded border border-[#403521] text-[#b3a893] hover:border-[#f2d29b] hover:text-[#f2d29b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
          <ChevronLeft size={13} /> Anterior
        </button>
        {showNumbers ? (
          Array.from({ length: total }).map((_, i) => (
            <button key={i} onClick={() => onChange(i + 1)}
              className={`w-8 h-8 flex items-center justify-center rounded border text-xs transition-colors ${page === i + 1 ? 'border-[#f2d29b] bg-[#f2d29b]/15 text-[#f2d29b]' : 'border-[#403521] text-[#b3a893] hover:border-[#f2d29b] hover:text-[#f2d29b]'}`}>
              {i + 1}
            </button>
          ))
        ) : (
          <span className="h-8 px-3 flex items-center justify-center rounded border border-[#f2d29b]/40 bg-[#f2d29b]/10 text-[#f2d29b] text-xs font-mono" aria-current="page">
            {page} / {total}
          </span>
        )}
        <button onClick={() => onChange(page + 1)} disabled={page === total} aria-label="Página siguiente"
          className="h-8 px-3 flex items-center justify-center gap-1 rounded border border-[#403521] text-[#b3a893] hover:border-[#f2d29b] hover:text-[#f2d29b] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs">
          Siguiente <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

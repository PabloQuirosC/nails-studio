import { Link } from 'react-router';
import { usePublicPosts } from '../../features/catalog/public-api';
import { resolveImageUrl } from '../../shared/images';

export function About() {
  // Solo servidor (Admin → Nosotros, kind=nosotros): cargando → skeleton,
  // error → aviso + reintentar. Sin datos fijos.
  const nosQuery = usePublicPosts('nosotros');
  const nosItems = nosQuery.data?.items ?? [];
  const historia = nosItems.find(p => p.category.toLowerCase().includes('histor'))
    ?? nosItems.find(p => !/valor|equipo/i.test(p.category));
  const valores = nosItems.filter(p => /valor/i.test(p.category));
  const equipo = nosItems.filter(p => /equipo/i.test(p.category));
  const values = valores.map((v, i) => ({
    n: String(i + 1).padStart(2, '0'),
    title: v.title,
    desc: v.excerpt ?? v.body ?? '',
    image: resolveImageUrl(v.image_url),
  }));
  return (
    <div className="min-h-dvh pt-24 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="section-label mb-3">Nosotros</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#faf7f0] tracking-tighter leading-[1.1]">El arte de crear<br />belleza con precisión</h1>
        </div>

        {nosQuery.isLoading ? (
          <div aria-label="Cargando nosotros">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20 items-center">
              <div className="rounded-2xl border border-[#3a2f1e] bg-[#14110c] animate-pulse aspect-[4/5]" />
              <div className="space-y-4">
                <div className="h-3 w-32 rounded bg-[#14110c] animate-pulse" />
                <div className="h-6 w-full rounded bg-[#14110c] animate-pulse" />
                <div className="h-4 w-5/6 rounded bg-[#14110c] animate-pulse" />
                <div className="h-4 w-4/6 rounded bg-[#14110c] animate-pulse" />
              </div>
            </div>
            <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase animate-pulse">Cargando nosotros…</p>
          </div>
        ) : nosQuery.isError || !historia ? (
          <div role="alert" className="text-center py-24 px-6 rounded-2xl bg-[#d4613a]/10 border border-[#d4613a]/30">
            <p className="font-serif text-2xl mb-2 text-[#faf7f0] tracking-tight">
              {nosQuery.isError ? 'No se pudo cargar esta sección' : 'Sin contenido todavía'}
            </p>
            <p className="text-sm text-[#e08a6d] leading-relaxed max-w-[52ch] mx-auto font-mono">
              {(nosQuery.error as Error)?.message ?? 'Publica la historia desde Admin → Nosotros.'}
            </p>
            {nosQuery.isError && (
              <button onClick={() => void nosQuery.refetch()}
                className="mt-6 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150">
                Reintentar
              </button>
            )}
          </div>
        ) : (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 mb-20 items-center">
          <div className="rounded-2xl overflow-hidden border border-[#3a2f1e]">
            {resolveImageUrl(historia.image_url) && (
              <img
                src={resolveImageUrl(historia.image_url) ?? ''}
                alt={historia.title}
                loading="lazy"
                className="w-full aspect-[4/5] object-cover"
              />
            )}
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[#f2d29b] text-xs tracking-[0.25em] uppercase mb-4">Nuestra historia</p>
            <p className="font-serif text-[#d8cfbf] text-lg leading-[1.6] max-w-[52ch] mb-5">
              {historia.title}
            </p>
            {historia.excerpt && (
              <p className="text-[#b3a893] leading-[1.7] max-w-[60ch] mb-4">
                {historia.excerpt}
              </p>
            )}
            {historia.body && (
              <p className="text-[#b3a893] leading-[1.7] max-w-[60ch]">
                {historia.body}
              </p>
            )}
            {historia.author && (
              <p className="text-[#6b6355] text-xs mt-4 font-mono">Por {historia.author}</p>
            )}
          </div>
        </div>

        {/* Values */}
        <div className="border-t border-[#3a2f1e] mb-20">
          {values.map(v => (
            <div key={v.n} className="grid sm:grid-cols-[64px_72px_1fr_1.2fr] gap-2 sm:gap-8 items-center py-7 border-b border-[#3a2f1e]">
              <p className="font-mono text-[#f2d29b] text-xs">{v.n}</p>
              {v.image ? (
                <img src={v.image} alt={v.title} loading="lazy" className="w-[72px] h-[72px] rounded-xl object-cover border border-[#3a2f1e]" />
              ) : (
                <span aria-hidden="true" />
              )}
              <p className="font-serif text-[#faf7f0] text-xl tracking-tight">{v.title}</p>
              <p className="text-[#b3a893] text-sm leading-relaxed max-w-[52ch]">{v.desc}</p>
            </div>
          ))}
        </div>

        {equipo.length > 0 && (
          <div className="mb-20">
            <p className="font-mono text-[#f2d29b] text-xs tracking-[0.25em] uppercase mb-6">Nuestro equipo</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipo.map(p => {
                const img = resolveImageUrl(p.image_url);
                return (
                <div key={p.id} className="rounded-2xl border border-[#3a2f1e] bg-[#0d0b09] overflow-hidden">
                  {img && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={img} alt={p.title} loading="lazy" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="font-serif text-[#faf7f0] text-lg tracking-tight">{p.title}</p>
                    {(p.excerpt || p.body) && (
                      <p className="text-[#b3a893] text-sm leading-relaxed mt-1.5">{p.excerpt ?? p.body}</p>
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}
        </>
        )}

        <div className="text-center">
          <p className="font-serif text-3xl text-[#faf7f0] tracking-tight mb-6">¿Lista para tu transformación?</p>
          <Link to="/reservas" className="btn-primary">
            Reservar cita
          </Link>
        </div>
      </div>
    </div>
  );
}

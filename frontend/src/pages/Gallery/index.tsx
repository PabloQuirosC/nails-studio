import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clapperboard, Pause, Play, X } from 'lucide-react';
import { DESIGNS, CATEGORIES } from '../../data';
import { resolveImageUrl } from '../../shared/images';
import { usePublicCategories, usePublicDesigns } from '../../features/catalog/public-api';

type GalleryItem = { id: number; name: string; category: string; price: number; image: string; technique: string };

const HERO_MS = 6000;
const SLIDE_MS = 4500;

/** Reveal on scroll: añade .is-visible una vez visible. */
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function Gallery() {
  const [filter, setFilter] = useState('');
  const [lightIndex, setLightIndex] = useState<number | null>(null);
  const [playing, setPlaying] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [heroIndex, setHeroIndex] = useState(0);

  const catsQuery = usePublicCategories();
  const designsQuery = usePublicDesigns('', filter);
  const online = catsQuery.data !== undefined && designsQuery.data !== undefined;
  const liveCategories = online
    ? (catsQuery.data ?? []).map(c => ({ id: c.slug, name: c.name }))
    : CATEGORIES;
  const slugById = new Map((catsQuery.data ?? []).map(c => [c.id, c.slug] as const));
  const filtered: GalleryItem[] = online
    ? (designsQuery.data?.items ?? []).map(d => ({
        id: d.id, name: d.name, category: slugById.get(d.category_id) ?? '',
        price: d.price, image: resolveImageUrl(d.image_url) ?? '', technique: d.technique ?? '',
      }))
    : (filter ? DESIGNS.filter(d => d.category === filter) : DESIGNS);

  const featured = filtered.slice(0, 5);
  const catName = (id: string) => liveCategories.find(c => c.id === id)?.name ?? id;

  /* ── Hero cinematográfico: rotación automática (pausada con reduced-motion o lightbox) ── */
  useEffect(() => {
    if (featured.length < 2 || lightIndex !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setHeroIndex(i => (i + 1) % featured.length), HERO_MS);
    return () => window.clearInterval(t);
  }, [featured.length, lightIndex]);
  useEffect(() => { setHeroIndex(0); }, [filter]);

  const goLight = useCallback(
    (dir: 1 | -1) => setLightIndex(i => (i === null ? i : (i + dir + filtered.length) % filtered.length)),
    [filtered.length],
  );

  /* ── Modo video: avance automático + teclado ── */
  useEffect(() => {
    if (lightIndex === null || !playing || filtered.length === 0) return;
    const t = window.setInterval(() => goLight(1), SLIDE_MS);
    return () => window.clearInterval(t);
  }, [lightIndex, playing, filtered.length, goLight]);

  useEffect(() => {
    if (lightIndex === null) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightIndex(null);
      if (e.key === 'ArrowRight') goLight(1);
      if (e.key === 'ArrowLeft') goLight(-1);
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying(p => !p);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [lightIndex, goLight]);

  const hero = featured[heroIndex % Math.max(featured.length, 1)];
  const strip = [...filtered, ...filtered];

  /* ── Estados de carga/error (skeleton, no spinner) ── */
  const galleryLoading = !online && (catsQuery.isLoading || designsQuery.isLoading);
  const galleryError = !online && (catsQuery.isError || designsQuery.isError);
  const retryGallery = () => { void catsQuery.refetch(); void designsQuery.refetch(); };

  return (
    <div className="min-h-dvh bg-[#060505]">
      {/* ═══ HERO CINEMATOGRÁFICO ═══ */}
      <section className="relative h-[78dvh] min-h-[540px] overflow-hidden film-grain">
        {featured.map((d, i) => (
          <div
            key={d.id}
            className="absolute inset-0 transition-[opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
            style={{ opacity: i === heroIndex % featured.length ? 1 : 0, zIndex: i === heroIndex % featured.length ? 1 : 0 }}
            aria-hidden={i !== heroIndex % featured.length}
          >
            {i === heroIndex % featured.length && (
              <img key={`kb-${heroIndex}`} src={d.image} alt="" className="kenburns h-full w-full object-cover" />
            )}
          </div>
        ))}
        <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, #060505 4%, transparent 45%, rgba(8,7,6,0.55) 100%)' }} />
        {/* letterbox */}
        <div className="absolute top-0 left-0 right-0 h-14 z-10 bg-gradient-to-b from-[#060505]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-10 sm:px-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end gap-6 justify-between">
            <div className="hero-fade" key={`cap-${heroIndex}`} aria-live="polite">
              <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase mb-3">
                Galería · {hero ? catName(hero.category) : 'Nuestro trabajo'}
              </p>
              <h1 className="font-serif text-4xl sm:text-6xl tracking-tighter text-[#faf7f0] leading-[1.05]">
                {hero?.name ?? 'Nuestro trabajo'}
              </h1>
              {hero && (
                <p className="text-[#f2d29b] font-mono text-sm mt-3">desde ₡{hero.price.toLocaleString()}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                {featured.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setHeroIndex(i)}
                    aria-label={`Ver ${d.name}`}
                    className={`h-1 w-6 rounded-full transition-[transform,background-color,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${i === heroIndex % featured.length ? 'bg-[#f2d29b] scale-x-125' : 'bg-white/25 hover:bg-white/50'}`}
                  />
                ))}
              </div>
              <button
                onClick={() => {
                  setLightIndex(hero ? filtered.findIndex(f => f.id === hero.id) : 0);
                  setPlaying(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-full hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
              >
                <Clapperboard size={15} /> Ver película
              </button>
            </div>
          </div>
        </div>
        {/* flechas hero */}
        {featured.length > 1 && (
          <>
            <button
              onClick={() => setHeroIndex(i => (i - 1 + featured.length) % featured.length)}
              aria-label="Anterior"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-[#f2d29b] active:scale-[0.97] items-center justify-center hidden sm:flex transition-[transform,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setHeroIndex(i => (i + 1) % featured.length)}
              aria-label="Siguiente"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 text-white/70 hover:text-white hover:border-[#f2d29b] active:scale-[0.97] items-center justify-center hidden sm:flex transition-[transform,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            >
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </section>

      {/* ═══ CINTA DE PELÍCULA INFINITA ═══ */}
      <section aria-hidden className="border-y border-[#3a2f1e] bg-[#0d0b09] py-5 overflow-hidden">
        <div className="marquee-track marquee-slow gap-4 pr-4">
          {strip.map((d, i) => (
            <button key={`${d.id}-${i}`} tabIndex={-1} onClick={() => setLightIndex(filtered.findIndex(f => f.id === d.id))} className="shrink-0 group active:scale-[0.98] transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]">
              <img
                src={d.image}
                alt=""
                loading="lazy"
                className="h-36 w-28 sm:h-44 sm:w-36 rounded-xl object-cover border border-[#403521] group-hover:border-[#f2d29b]/60 transition-[border-color] duration-200"
              />
            </button>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 pb-20 pt-12">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {['', ...liveCategories.map(c => c.id)].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)} aria-pressed={filter === cat}
              className={`px-4 py-2 text-xs rounded-full border transition-[border-color,color,background-color] duration-200 ${filter === cat ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
              {cat ? liveCategories.find(c => c.id === cat)?.name : 'Todos'}
            </button>
          ))}
        </div>
        <p className="font-mono text-[#b3a893] text-xs tracking-[0.2em] uppercase mb-8" aria-live="polite">
          {galleryLoading ? 'Cargando…' : `${filtered.length} diseños`}
        </p>

        {/* Grid con reveal */}
        {galleryLoading ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3" aria-label="Cargando galería">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="break-inside-avoid overflow-hidden rounded-xl border border-[#403521] bg-[#14110c] animate-pulse"
                style={{ aspectRatio: i % 3 === 0 ? '1/1.3' : i % 3 === 1 ? '1/0.9' : '1/1.1' }} />
            ))}
          </div>
        ) : galleryError ? (
          <div role="alert" className="text-center py-24 px-6">
            <p className="font-serif text-2xl mb-2 text-[#faf7f0]">No se pudo cargar la galería</p>
            <p className="text-sm text-[#b3a893] leading-relaxed max-w-[65ch] mx-auto">Revisa tu conexión e inténtalo de nuevo.</p>
            <button onClick={retryGallery}
              className="mt-5 px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-full hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]">
              Reintentar
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 px-6 text-[#b3a893]">
            <p className="font-serif text-2xl mb-2">Sin resultados</p>
            <p className="text-sm leading-relaxed max-w-[65ch] mx-auto">Prueba con otra categoría.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {filtered.map((d, i) => (
              <Reveal key={d.id} delay={(i % 5) * 70}>
                <button type="button" onClick={() => setLightIndex(i)} aria-label={`Ampliar ${d.name}`}
                  className="break-inside-avoid w-full text-left cursor-pointer group overflow-hidden rounded-xl border border-transparent hover:border-[#f2d29b]/40 active:scale-[0.98] transition-[transform,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
                  <span className="relative overflow-hidden block" style={{ aspectRatio: i % 3 === 0 ? '1/1.3' : i % 3 === 1 ? '1/0.9' : '1/1.1' }}>
                    <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#060505]/85 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-4 text-left">
                      <span>
                        <span className="font-serif text-[#faf7f0] text-sm block">{d.name}</span>
                        <span className="text-[#f2d29b] text-xs font-mono block">desde ₡{d.price.toLocaleString()}</span>
                      </span>
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {/* ═══ LIGHTBOX MODO VIDEO ═══ */}
      {lightIndex !== null && filtered[lightIndex] && (
        <div className="modal-overlay" onClick={() => setLightIndex(null)}>
          <div className="relative w-full max-w-4xl mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="relative overflow-hidden rounded-2xl border border-[#f2d29b]/25 film-grain">
              <img
                key={filtered[lightIndex].id}
                src={filtered[lightIndex].image}
                alt={filtered[lightIndex].name}
                className="kenburns w-full max-h-[70vh] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#060505] via-[#060505]/55 to-transparent">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-mono text-[#f2d29b] text-[11px] tracking-[0.25em] uppercase">
                      {catName(filtered[lightIndex].category)} · {lightIndex + 1} / {filtered.length}
                    </p>
                    <p className="font-serif text-2xl sm:text-3xl text-[#faf7f0] mt-1">{filtered[lightIndex].name}</p>
                    <p className="text-[#b3a893] text-sm mt-1">{filtered[lightIndex].technique}</p>
                    <p className="text-[#f2d29b] font-mono mt-1">desde ₡{filtered[lightIndex].price.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goLight(-1)}
                      aria-label="Anterior"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/80 hover:border-[#f2d29b] hover:text-white active:scale-[0.97] flex items-center justify-center transition-[transform,border-color,color] duration-150 ease-out"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() => setPlaying(p => !p)}
                      aria-label={playing ? 'Pausar' : 'Reproducir'}
                      aria-pressed={playing}
                      className="w-12 h-12 rounded-full bg-[#f2d29b] text-[#0d0b09] hover:bg-[#f7ddab] active:scale-[0.97] flex items-center justify-center transition-[transform,background-color] duration-150 ease-out"
                    >
                      {playing ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={() => goLight(1)}
                      aria-label="Siguiente"
                      className="w-10 h-10 rounded-full border border-white/20 text-white/80 hover:border-[#f2d29b] hover:text-white active:scale-[0.97] flex items-center justify-center transition-[transform,border-color,color] duration-150 ease-out"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                {/* barra de progreso del "video" */}
                <div className="h-[3px] bg-white/10 rounded-full mt-4 overflow-hidden">
                  {playing ? (
                    <div key={lightIndex} className="lightbox-progress h-full w-full origin-left bg-[#f2d29b] rounded-full" />
                  ) : (
                    <div className="h-full w-0 bg-[#f2d29b]/40 rounded-full" />
                  )}
                </div>
              </div>
              <button
                onClick={() => setLightIndex(null)}
                aria-label="Cerrar"
                className="absolute top-4 right-4 w-9 h-9 bg-[#060505]/70 rounded-full flex items-center justify-center text-[#faf7f0] hover:bg-[#060505] active:scale-[0.97] transition-[transform,background-color] duration-150"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-center text-[#b3a893] text-[11px] font-mono mt-3">
              ← → navegar · espacio reproducir/pausar · esc cerrar
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, X, SlidersHorizontal, Clock, GitCompare, Check, Plus } from 'lucide-react';
import { DESIGNS, CATEGORIES, OCCASIONS, COMPLEXITIES } from '../../data';
import { Modal, Toast } from '../../components/ui/Modal';
import { CategoryIcon } from '../../shared/category-icons';
import { resolveImageUrl } from '../../shared/images';
import { usePublicCategories, usePublicDesigns } from '../../features/catalog/public-api';

export function Catalog() {
  const [params] = useSearchParams();
  const initCat = params.get('categoria') || '';
  const initOcc = params.get('ocasion') || '';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initCat);
  const [occasion, setOccasion] = useState(initOcc);
  const [complexity, setComplexity] = useState('');
  const [compare, setCompare] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', visible: false });

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const catsQuery = usePublicCategories();
  const onlineCats = catsQuery.data !== undefined;
  const liveCategories = onlineCats
    ? (catsQuery.data ?? []).map(c => ({ id: c.slug, name: c.name, icon: c.icon, color: c.color }))
    : CATEGORIES;
  const designsQuery = usePublicDesigns(search, category, occasion);
  const onlineDesigns = designsQuery.data !== undefined;
  const slugById = useMemo(
    () => new Map((catsQuery.data ?? []).map(c => [c.id, c.slug] as const)),
    [catsQuery.data],
  );

  const filtered = useMemo(() => {
    if (onlineDesigns) {
      const items = (designsQuery.data?.items ?? []).map(d => ({
        id: d.id,
        name: d.name,
        category: slugById.get(d.category_id) ?? '',
        price: d.price,
        duration: d.duration_min,
        image: resolveImageUrl(d.image_url) ?? '',
        description: d.description ?? '',
        technique: d.technique ?? '',
        tags: d.tags ?? [],
        occasion: d.occasion ?? '',
        complexity: d.complexity ?? '',
      }));
      if (!complexity) return items;
      return items.filter(d => d.complexity === complexity);
    }
    return DESIGNS.filter(d => {
      if (category && d.category !== category) return false;
      if (occasion && d.occasion !== occasion) return false;
      if (complexity && d.complexity !== complexity) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.tags.some(t => t.includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [onlineDesigns, designsQuery.data, slugById, category, occasion, complexity, search]);

  const toggleCompare = (id: number) => {
    if (compare.includes(id)) {
      setCompare(c => c.filter(x => x !== id));
    } else if (compare.length < 3) {
      setCompare(c => [...c, id]);
      showToast('Diseño agregado al comparador');
    } else {
      showToast('Máximo 3 diseños para comparar');
    }
  };

  const compareItems = filtered.filter(d => compare.includes(d.id));

  /* Estados de carga: skeleton mientras no hay datos; aviso inline si falla (con fallback a mocks). */
  const designsLoading = designsQuery.isLoading && !onlineDesigns;
  const designsFailed = designsQuery.isError && !onlineDesigns;
  const retryDesigns = () => { void designsQuery.refetch(); void catsQuery.refetch(); };
  const clearFilters = () => { setSearch(''); setCategory(''); setOccasion(''); setComplexity(''); };
  const hasFilters = Boolean(search.trim() || category || occasion || complexity);

  return (
    <div className="min-h-dvh pt-24 px-6 pb-20">
      <Toast message={toast.msg} visible={toast.visible} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="section-label mb-3">Catálogo</p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <h1 className="font-serif text-4xl sm:text-5xl text-[#faf7f0] tracking-tighter">Todos los diseños</h1>
            <p className="font-mono text-[#b3a893] text-xs tracking-[0.2em] uppercase" aria-live="polite">
              {onlineDesigns || !designsLoading ? `${filtered.length} diseños` : 'Cargando…'}
            </p>
          </div>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b3a893]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar diseños..."
              className="w-full bg-[#14110c] border border-[#403521] rounded pl-10 pr-4 py-2.5 text-sm text-[#faf7f0] placeholder-[#b3a893] outline-none focus:border-[#f2d29b]"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            aria-expanded={filtersOpen}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#14110c] border border-[#403521] rounded text-sm text-[#b3a893] hover:border-[#f2d29b] hover:text-[#f2d29b] active:scale-[0.98] transition-[transform,border-color,color] duration-150 ease-out"
          >
            <SlidersHorizontal size={14} /> Filtros {(category || occasion || complexity) && <span className="w-1.5 h-1.5 bg-[#f2d29b] rounded-full" aria-hidden="true" />}
          </button>
          {compare.length > 0 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#f2d29b] text-[#0d0b09] rounded text-sm font-medium hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150 ease-out"
            >
              <GitCompare size={14} /> Comparar ({compare.length})
            </button>
          )}
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-[#14110c] border border-[#403521] rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fade-in">
            <div>
              <p className="text-[#b3a893] text-xs font-mono mb-3 uppercase tracking-widest">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {['', ...liveCategories.map(c => c.id)].map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)} aria-pressed={category === cat}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-[border-color,color,background-color] duration-200 ${category === cat ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
                    {cat ? liveCategories.find(c => c.id === cat)?.name : 'Todos'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#b3a893] text-xs font-mono mb-3 uppercase tracking-widest">Ocasión</p>
              <div className="flex flex-wrap gap-2">
                {['', ...OCCASIONS].map(o => (
                  <button key={o} onClick={() => setOccasion(o)} aria-pressed={occasion === o}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-[border-color,color,background-color] duration-200 ${occasion === o ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
                    {o || 'Todas'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#b3a893] text-xs font-mono mb-3 uppercase tracking-widest">Complejidad</p>
              <div className="flex flex-wrap gap-2">
                {['', ...COMPLEXITIES].map(c => (
                  <button key={c} onClick={() => setComplexity(c)} aria-pressed={complexity === c}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-[border-color,color,background-color] duration-200 ${complexity === c ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
                    {c || 'Todas'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {designsFailed && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-[#d4613a]/10 border border-[#d4613a]/30 text-xs">
            <p className="text-[#e08a6d] flex-1">Sin conexión al servidor — mostrando diseños guardados.</p>
            <button onClick={retryDesigns} className="px-3 py-1.5 rounded-lg border border-[#d4613a]/40 text-[#e08a6d] hover:bg-[#d4613a]/10 active:scale-[0.98] transition-[transform,background-color] duration-150">
              Reintentar
            </button>
          </div>
        )}

        {/* Grid */}
        {designsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Cargando diseños">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-[#403521] bg-[#14110c] animate-pulse aspect-[4/5]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 px-6">
            <p className="font-serif text-2xl mb-2 text-[#faf7f0] tracking-tight">Sin resultados</p>
            <p className="text-sm text-[#b3a893] leading-relaxed max-w-[52ch] mx-auto">Prueba con otros filtros o búsqueda.</p>
            {hasFilters && (
              <button onClick={clearFilters}
                className="mt-6 px-5 py-2.5 border border-[#f2d29b]/40 text-[#f2d29b] text-sm rounded-full hover:bg-[#f2d29b]/10 active:scale-[0.98] transition-[transform,background-color] duration-150 ease-out">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((d) => (
              <div key={d.id} className="rounded-xl border border-[#3a2f1e] bg-[#0d0b09] group relative overflow-hidden card-lift active:scale-[0.99] transition-[transform,border-color] duration-200 ease-out">
                <Link to={`/catalogo/${d.id}`} aria-label={`Ver ${d.name}`}>
                  <div className="overflow-hidden aspect-[4/5]">
                    <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105" />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/catalogo/${d.id}`} className="flex-1">
                      <p className="font-serif text-[#faf7f0] group-hover:text-[#f2d29b] transition-colors duration-200 text-sm leading-snug">{d.name}</p>
                      <p className="text-[#b3a893] text-xs mt-0.5 capitalize">{liveCategories.find(c => c.id === d.category)?.name}</p>
                    </Link>
                    <div className="text-right shrink-0">
                      <p className="text-[#f2d29b] font-mono text-sm">₡{d.price.toLocaleString()}</p>
                      <div className="flex items-center gap-1 text-[#b3a893] text-xs justify-end">
                        <Clock size={9} /> {d.duration}m
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 bg-[#332a1d] text-[#b3a893] text-xs rounded">{d.complexity}</span>
                    <span className="px-2 py-0.5 bg-[#332a1d] text-[#b3a893] text-xs rounded">{d.occasion}</span>
                    <button
                      onClick={() => toggleCompare(d.id)}
                      aria-pressed={compare.includes(d.id)}
                      aria-label={compare.includes(d.id) ? `Quitar ${d.name} del comparador` : `Agregar ${d.name} al comparador`}
                      className={`ml-auto text-xs flex items-center gap-1 px-2 py-1 rounded border active:scale-[0.97] transition-[transform,border-color,color] duration-150 ${compare.includes(d.id) ? 'border-[#f2d29b] text-[#f2d29b]' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}
                    >
                      {compare.includes(d.id) ? <Check size={11} /> : <Plus size={11} />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparator Modal */}
      <Modal open={compareOpen} onClose={() => setCompareOpen(false)} title="Comparar diseños" size="xl">
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${compareItems.length}, minmax(0, 1fr))` }}>
          {compareItems.map(d => (
            <div key={d.id} className="text-center min-w-0">
              <img src={d.image} alt={d.name} loading="lazy" className="w-full aspect-square object-cover rounded-lg mb-3" />
              <p className="font-serif text-[#faf7f0] mb-1">{d.name}</p>
              <p className="text-[#f2d29b] font-mono">desde ₡{d.price.toLocaleString()}</p>
              <div className="mt-3 space-y-1 text-xs text-[#b3a893] text-left">
                <div className="flex justify-between"><span>Duración</span><span className="text-[#faf7f0]">{d.duration} min</span></div>
                <div className="flex justify-between"><span>Complejidad</span><span className="text-[#faf7f0]">{d.complexity}</span></div>
                <div className="flex justify-between"><span>Ocasión</span><span className="text-[#faf7f0]">{d.occasion}</span></div>
                <div className="flex justify-between gap-2"><span>Técnica</span><span className="text-[#faf7f0] text-right max-w-[120px]">{d.technique}</span></div>
              </div>
              <Link to={`/reservas?design=${d.id}`} className="mt-4 w-full block py-2 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded hover:bg-[#f7ddab] active:scale-[0.98] transition-[transform,background-color] duration-150 text-center">
                Reservar
              </Link>
            </div>
          ))}
        </div>
        <button onClick={() => { setCompare([]); setCompareOpen(false); }} className="mt-6 text-[#b3a893] text-sm hover:text-[#faf7f0] active:text-[#f2d29b] flex items-center gap-1 transition-colors duration-200">
          <X size={14} /> Limpiar comparador
        </button>
      </Modal>
    </div>
  );
}

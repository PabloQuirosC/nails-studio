import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Search, X, SlidersHorizontal, Clock, GitCompare } from 'lucide-react';
import { DESIGNS, CATEGORIES, OCCASIONS, COMPLEXITIES } from '../../data';
import { Modal, Toast } from '../../components/ui/Modal';

export function Catalog() {
  const [params] = useSearchParams();
  const initCat = params.get('categoria') || '';
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initCat);
  const [occasion, setOccasion] = useState('');
  const [complexity, setComplexity] = useState('');
  const [compare, setCompare] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [toast, setToast] = useState({ msg: '', visible: false });

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const filtered = useMemo(() => {
    return DESIGNS.filter(d => {
      if (category && d.category !== category) return false;
      if (occasion && d.occasion !== occasion) return false;
      if (complexity && d.complexity !== complexity) return false;
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.tags.some(t => t.includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [category, occasion, complexity, search]);

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

  const compareItems = DESIGNS.filter(d => compare.includes(d.id));

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <Toast message={toast.msg} visible={toast.visible} />
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Catálogo</p>
          <h1 className="font-serif text-4xl text-[#f0ebe4]">Todos los diseños</h1>
        </div>

        {/* Search + Filter bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a7d6e]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar diseños..."
              className="w-full bg-[#181310] border border-[#2e2518] rounded pl-10 pr-4 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e]"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#181310] border border-[#2e2518] rounded text-sm text-[#8a7d6e] hover:border-[#c9a96e] hover:text-[#c9a96e]"
          >
            <SlidersHorizontal size={14} /> Filtros {(category || occasion || complexity) && <span className="w-1.5 h-1.5 bg-[#c9a96e] rounded-full" />}
          </button>
          {compare.length > 0 && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#c9a96e] text-[#0d0b0a] rounded text-sm font-medium"
            >
              <GitCompare size={14} /> Comparar ({compare.length})
            </button>
          )}
        </div>

        {/* Filter panel */}
        {filtersOpen && (
          <div className="bg-[#181310] border border-[#2e2518] rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-5 animate-fade-in">
            <div>
              <p className="text-[#8a7d6e] text-xs font-mono mb-3 uppercase tracking-widest">Categoría</p>
              <div className="flex flex-wrap gap-2">
                {['', ...CATEGORIES.map(c => c.id)].map(cat => (
                  <button key={cat} onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${category === cat ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}>
                    {cat ? CATEGORIES.find(c => c.id === cat)?.name : 'Todos'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#8a7d6e] text-xs font-mono mb-3 uppercase tracking-widest">Ocasión</p>
              <div className="flex flex-wrap gap-2">
                {['', ...OCCASIONS].map(o => (
                  <button key={o} onClick={() => setOccasion(o)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${occasion === o ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}>
                    {o || 'Todas'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#8a7d6e] text-xs font-mono mb-3 uppercase tracking-widest">Complejidad</p>
              <div className="flex flex-wrap gap-2">
                {['', ...COMPLEXITIES].map(c => (
                  <button key={c} onClick={() => setComplexity(c)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${complexity === c ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}>
                    {c || 'Todas'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-[#8a7d6e] text-xs font-mono mb-6">{filtered.length} diseños</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-[#8a7d6e]">
            <p className="font-serif text-2xl mb-2">Sin resultados</p>
            <p className="text-sm">Prueba con otros filtros o búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-[#2e2518]">
            {filtered.map(d => (
              <div key={d.id} className="bg-[#0d0b0a] group relative overflow-hidden">
                <Link to={`/catalogo/${d.id}`}>
                  <div className="aspect-square overflow-hidden">
                    <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                </Link>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/catalogo/${d.id}`} className="flex-1">
                      <p className="font-serif text-[#f0ebe4] group-hover:text-[#c9a96e] transition-colors text-sm leading-snug">{d.name}</p>
                      <p className="text-[#8a7d6e] text-xs mt-0.5 capitalize">{CATEGORIES.find(c => c.id === d.category)?.name}</p>
                    </Link>
                    <div className="text-right shrink-0">
                      <p className="text-[#c9a96e] font-mono text-sm">${d.price}</p>
                      <div className="flex items-center gap-1 text-[#8a7d6e] text-xs justify-end">
                        <Clock size={9} /> {d.duration}m
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="px-2 py-0.5 bg-[#2a2018] text-[#8a7d6e] text-xs rounded">{d.complexity}</span>
                    <span className="px-2 py-0.5 bg-[#2a2018] text-[#8a7d6e] text-xs rounded">{d.occasion}</span>
                    <button
                      onClick={() => toggleCompare(d.id)}
                      className={`ml-auto text-xs flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${compare.includes(d.id) ? 'border-[#c9a96e] text-[#c9a96e]' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}
                    >
                      <GitCompare size={10} /> {compare.includes(d.id) ? '✓' : '+'}
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
        <div className={`grid grid-cols-${compareItems.length} gap-6`} style={{ gridTemplateColumns: `repeat(${compareItems.length}, 1fr)` }}>
          {compareItems.map(d => (
            <div key={d.id} className="text-center">
              <img src={d.image} alt={d.name} className="w-full aspect-square object-cover rounded-lg mb-3" />
              <p className="font-serif text-[#f0ebe4] mb-1">{d.name}</p>
              <p className="text-[#c9a96e] font-mono">desde ${d.price}</p>
              <div className="mt-3 space-y-1 text-xs text-[#8a7d6e] text-left">
                <div className="flex justify-between"><span>Duración</span><span className="text-[#f0ebe4]">{d.duration} min</span></div>
                <div className="flex justify-between"><span>Complejidad</span><span className="text-[#f0ebe4]">{d.complexity}</span></div>
                <div className="flex justify-between"><span>Ocasión</span><span className="text-[#f0ebe4]">{d.occasion}</span></div>
                <div className="flex justify-between"><span>Técnica</span><span className="text-[#f0ebe4] text-right max-w-[120px]">{d.technique}</span></div>
              </div>
              <Link to={`/reservas?design=${d.id}`} className="mt-4 w-full block py-2 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] text-center">
                Reservar
              </Link>
            </div>
          ))}
        </div>
        <button onClick={() => { setCompare([]); setCompareOpen(false); }} className="mt-6 text-[#8a7d6e] text-sm hover:text-[#f0ebe4] flex items-center gap-1">
          <X size={14} /> Limpiar comparador
        </button>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { X } from 'lucide-react';
import { DESIGNS, CATEGORIES } from '../../data';
import { usePublicCategories, usePublicDesigns } from '../../features/catalog/public-api';

type GalleryItem = { id: number; name: string; category: string; price: number; image: string; technique: string };

export function Gallery() {
  const [filter, setFilter] = useState('');
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null);

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
        price: d.price, image: d.image_url ?? '', technique: d.technique ?? '',
      }))
    : (filter ? DESIGNS.filter(d => d.category === filter) : DESIGNS);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Galería</p>
          <h1 className="font-serif text-4xl text-[#f0ebe4]">Nuestro trabajo</h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {['', ...liveCategories.map(c => c.id)].map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 text-xs rounded-full border transition-colors ${filter === cat ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}>
              {cat ? liveCategories.find(c => c.id === cat)?.name : 'Todos'}
            </button>
          ))}
        </div>

        {/* Pinterest-style grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {filtered.map((d, i) => (
            <div key={d.id} onClick={() => setLightbox(d)} className="break-inside-avoid cursor-pointer group overflow-hidden rounded-lg">
              <div className="relative overflow-hidden" style={{ aspectRatio: i % 3 === 0 ? '1/1.3' : i % 3 === 1 ? '1/0.9' : '1/1.1' }}>
                <img src={d.image} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b0a]/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <div>
                    <p className="font-serif text-[#f0ebe4] text-sm">{d.name}</p>
                    <p className="text-[#c9a96e] text-xs font-mono">desde ₡{d.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="modal-overlay" onClick={() => setLightbox(null)}>
          <div className="relative max-w-2xl w-full mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <img src={lightbox.image} alt={lightbox.name} className="w-full rounded-xl" />
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0d0b0a] rounded-b-xl">
              <p className="font-serif text-xl text-[#f0ebe4]">{lightbox.name}</p>
              <p className="text-[#8a7d6e] text-sm">{lightbox.technique}</p>
              <p className="text-[#c9a96e] font-mono mt-1">desde ₡{lightbox.price.toLocaleString()}</p>
            </div>
            <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-9 h-9 bg-[#0d0b0a]/70 rounded-full flex items-center justify-center text-[#f0ebe4] hover:bg-[#0d0b0a]">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useParams, Link } from 'react-router';
import { ArrowLeft, Clock, Layers } from 'lucide-react';
import { DESIGNS, CATEGORIES } from '../../data';
import { usePublicCategories, usePublicDesign } from '../../features/catalog/public-api';

export function DesignDetail() {
  const { id } = useParams();
  const live = usePublicDesign(id);
  const online = live.data !== undefined;
  const catsQuery = usePublicCategories();
  const liveCats = online && catsQuery.data !== undefined
    ? catsQuery.data.map(c => ({ id: c.slug, name: c.name }))
    : CATEGORIES;
  const design = online
    ? (live.data ? {
        id: live.data.id,
        name: live.data.name,
        category: (catsQuery.data ?? []).find(c => c.id === live.data!.category_id)?.slug ?? '',
        price: live.data.price,
        duration: live.data.duration_min,
        image: live.data.image_url ?? '',
        description: live.data.description ?? '',
        complexity: live.data.complexity ?? '',
        occasion: live.data.occasion ?? '',
        technique: live.data.technique ?? '',
        tags: live.data.tags ?? [],
      } : undefined)
    : DESIGNS.find(d => d.id === Number(id));

  if (!design) return (
    <div className="min-h-dvh pt-32 flex items-center justify-center text-center px-6">
      <div>
        <p className="font-serif text-3xl text-[#faf7f0] tracking-tight mb-3">Diseño no encontrado</p>
        <p className="text-[#b3a893] text-sm leading-relaxed max-w-[52ch] mx-auto mb-6">Es posible que se haya retirado del catálogo.</p>
        <Link to="/catalogo" className="btn-outline">Volver al catálogo</Link>
      </div>
    </div>
  );

  const cat = liveCats.find(c => c.id === design.category);

  return (
    <div className="min-h-dvh pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <Link
          to={design.category ? `/catalogo?categoria=${design.category}` : '/catalogo'}
          className="inline-flex items-center gap-2 text-[#b3a893] hover:text-[#f2d29b] active:text-[#f2d29b] text-sm mb-8 transition-colors duration-200"
        >
          <ArrowLeft size={14} /> {cat?.name ?? 'Catálogo'}
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="rounded-2xl overflow-hidden border border-[#3a2f1e]">
              <img src={design.image} alt={design.name} className="w-full aspect-[4/5] object-cover" />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-[#332a1d] text-[#b3a893] text-xs rounded font-mono">{cat?.name}</span>
                <span className="px-2 py-0.5 bg-[#332a1d] text-[#b3a893] text-xs rounded font-mono">{design.complexity}</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl text-[#faf7f0] tracking-tighter mb-3">{design.name}</h1>
              <p className="text-[#b3a893] leading-[1.6] max-w-[65ch]">{design.description}</p>
            </div>

            <dl className="divide-y divide-[#3a2f1e] border-y border-[#3a2f1e]">
              <div className="flex items-center justify-between py-4">
                <dt className="text-[#b3a893] text-xs font-mono uppercase tracking-widest">Precio</dt>
                <dd className="text-[#f2d29b] font-serif text-2xl">desde ₡{design.price.toLocaleString()}</dd>
              </div>
              <div className="flex items-center justify-between py-4">
                <dt className="text-[#b3a893] text-xs font-mono uppercase tracking-widest">Duración</dt>
                <dd className="flex items-center gap-1.5 text-[#faf7f0]">
                  <Clock size={14} className="text-[#f2d29b]" aria-hidden="true" /> {design.duration} min
                </dd>
              </div>
              <div className="flex items-center justify-between py-4">
                <dt className="text-[#b3a893] text-xs font-mono uppercase tracking-widest">Ocasión</dt>
                <dd className="text-[#faf7f0] text-sm">{design.occasion}</dd>
              </div>
            </dl>

            <div>
              <p className="text-[#b3a893] text-xs font-mono mb-2 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={12} /> Técnica
              </p>
              <p className="text-[#d8cfbf] text-sm leading-relaxed">{design.technique}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {design.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-[#332a1d] text-[#b3a893] text-xs rounded-full">#{tag}</span>
              ))}
            </div>

            <div className="flex gap-3 mt-auto">
              <Link
                to={`/reservas?design=${design.id}`}
                className="btn-primary flex-1 focus-visible:outline-2 focus-visible:outline-[#f2d29b] focus-visible:outline-offset-2"
              >
                Reservar este diseño
              </Link>
            </div>

            <div className="flex items-center gap-x-5 gap-y-2 pt-2 flex-wrap">
              {['Materiales certificados', 'Artistas profesionales'].map(t => (
                <span key={t} className="flex items-center gap-2 text-[#a29885] text-xs">
                  <span className="w-1 h-1 rounded-full bg-[#f2d29b] shrink-0" aria-hidden="true" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

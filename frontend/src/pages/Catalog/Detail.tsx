import { useParams, Link } from 'react-router';
import { ArrowLeft, Clock, Star, Layers } from 'lucide-react';
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
    <div className="min-h-screen pt-32 flex items-center justify-center text-center px-6">
      <div>
        <p className="font-serif text-3xl text-[#f0ebe4] mb-3">Diseño no encontrado</p>
        <Link to="/catalogo" className="text-[#c9a96e] hover:underline">← Volver al catálogo</Link>
      </div>
    </div>
  );

  const cat = liveCats.find(c => c.id === design.category);

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <Link to="/catalogo" className="inline-flex items-center gap-2 text-[#8a7d6e] hover:text-[#c9a96e] text-sm mb-8">
          <ArrowLeft size={14} /> Catálogo
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <img src={design.image} alt={design.name} className="w-full aspect-square object-cover rounded-lg" />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[design.image, design.image, design.image].map((img, i) => (
                <img key={i} src={img} alt="" className="aspect-square object-cover rounded opacity-60 hover:opacity-100 transition-opacity cursor-pointer" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 bg-[#2a2018] text-[#8a7d6e] text-xs rounded font-mono">{cat?.name}</span>
                <span className="px-2 py-0.5 bg-[#2a2018] text-[#8a7d6e] text-xs rounded font-mono">{design.complexity}</span>
              </div>
              <h1 className="font-serif text-4xl text-[#f0ebe4] mb-3">{design.name}</h1>
              <p className="text-[#8a7d6e] leading-relaxed">{design.description}</p>
            </div>

            <div className="grid grid-cols-3 gap-4 py-6 border-y border-[#2e2518]">
              <div>
                <p className="text-[#8a7d6e] text-xs font-mono mb-1">Precio</p>
                <p className="text-[#c9a96e] font-serif text-2xl">desde ₡{design.price.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[#8a7d6e] text-xs font-mono mb-1">Duración</p>
                <div className="flex items-center gap-1.5 text-[#f0ebe4]">
                  <Clock size={14} className="text-[#c9a96e]" /> {design.duration} min
                </div>
              </div>
              <div>
                <p className="text-[#8a7d6e] text-xs font-mono mb-1">Ocasión</p>
                <p className="text-[#f0ebe4] text-sm">{design.occasion}</p>
              </div>
            </div>

            <div>
              <p className="text-[#8a7d6e] text-xs font-mono mb-2 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={12} /> Técnica
              </p>
              <p className="text-[#c8bfb0] text-sm leading-relaxed">{design.technique}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {design.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-[#2a2018] text-[#8a7d6e] text-xs rounded-full">#{tag}</span>
              ))}
            </div>

            <div className="flex gap-3 mt-auto">
              <Link
                to={`/reservas?design=${design.id}`}
                className="flex-1 py-3.5 bg-[#c9a96e] text-[#0d0b0a] font-medium rounded text-center hover:bg-[#d4b87e] transition-colors"
              >
                Reservar este diseño
              </Link>
              <Link
                to={`/visualizador`}
                className="px-4 py-3.5 border border-[#c9a96e]/50 text-[#c9a96e] rounded hover:bg-[#c9a96e]/10 transition-colors text-sm"
              >
                Ver en 3D
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {[1,2,3,4,5].map(s => <Star key={s} size={14} className="fill-[#c9a96e] text-[#c9a96e]" />)}
              <span className="text-[#8a7d6e] text-xs">(48 reseñas)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

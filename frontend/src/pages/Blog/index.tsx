import { useState } from 'react';
import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { BLOG_POSTS } from '../../data';
import { usePublicBlogCategories, usePublicPosts } from '../../features/catalog/public-api';
import { resolveImageUrl } from '../../shared/images';

export function Blog() {
  const [category, setCategory] = useState('');
  const postsQuery = usePublicPosts('articulo', category);
  const catsQuery = usePublicBlogCategories();
  const cats = catsQuery.data ?? [];
  const online = postsQuery.data !== undefined;
  const posts = online
    ? (postsQuery.data?.items ?? []).map(p => ({
        id: p.slug, title: p.title, excerpt: p.excerpt ?? '', category: p.category,
        image: resolveImageUrl(p.image_url) ?? '', readTime: `${p.read_minutes} min`,
        date: new Date(p.created_at ?? Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      }))
    : BLOG_POSTS.map(p => ({ ...p, id: String(p.id) }));
  const postsLoading = postsQuery.isLoading && !online;
  const postsFailed = postsQuery.isError && !online;
  const retryPosts = () => { void postsQuery.refetch(); };
  const [featured, ...rest] = posts;
  return (
    <div className="min-h-dvh pt-24 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="section-label mb-3">Blog</p>
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <h1 className="font-serif text-4xl sm:text-5xl text-[#faf7f0] tracking-tighter">Tips & tendencias</h1>
            <p className="font-mono text-[#b3a893] text-xs tracking-[0.2em] uppercase" aria-live="polite">
              {postsLoading ? 'Cargando…' : `${posts.length} artículos`}
            </p>
          </div>
        </div>
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8" role="group" aria-label="Filtrar por categoría">
            <button onClick={() => setCategory('')} aria-pressed={category === ''}
              className={`px-3 py-1.5 text-xs rounded-full border transition-[border-color,color,background-color] duration-200 ${category === '' ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
              Todas
            </button>
            {cats.map(c => (
              <button key={c.id} onClick={() => setCategory(c.name)} aria-pressed={category === c.name}
                className={`px-3 py-1.5 text-xs rounded-full border transition-[border-color,color,background-color] duration-200 ${category === c.name ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
                {c.name}
              </button>
            ))}
          </div>
        )}
        {postsFailed && (
          <div role="alert" className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 px-4 py-3 rounded-xl bg-[#d4613a]/10 border border-[#d4613a]/30 text-xs">
            <p className="text-[#e08a6d] flex-1">Sin conexión al servidor — mostrando artículos guardados.</p>
            <button onClick={retryPosts} className="px-3 py-1.5 rounded-lg border border-[#d4613a]/40 text-[#e08a6d] hover:bg-[#d4613a]/10 active:scale-[0.98] transition-[transform,background-color] duration-150">
              Reintentar
            </button>
          </div>
        )}
        {postsLoading ? (
          <div className="space-y-6" aria-label="Cargando artículos">
            <div className="rounded-2xl border border-[#403521] bg-[#14110c] animate-pulse aspect-[2/1] sm:aspect-[21/9]" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-5 py-6 border-t border-[#3a2f1e]">
                <div className="w-32 sm:w-44 aspect-video rounded-lg bg-[#14110c] animate-pulse shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-3 w-24 rounded bg-[#14110c] animate-pulse" />
                  <div className="h-5 w-3/4 rounded bg-[#14110c] animate-pulse" />
                  <div className="h-3 w-full rounded bg-[#14110c] animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-24 px-6">
            <p className="font-serif text-2xl mb-2 text-[#faf7f0] tracking-tight">Sin artículos todavía</p>
            <p className="text-sm text-[#b3a893] leading-relaxed max-w-[52ch] mx-auto">Estamos preparando contenido nuevo. Mientras tanto, explora nuestros diseños.</p>
            <Link to="/catalogo" className="btn-outline mt-6">Ver catálogo</Link>
          </div>
        ) : (
          <div>
            {featured && (
              <Link to={`/blog/${featured.id}`} className="group grid md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-[#3a2f1e] bg-[#0d0b09] card-lift active:scale-[0.99] transition-[transform,border-color] duration-200 ease-out mb-4">
                <div className="overflow-hidden aspect-video md:aspect-auto md:min-h-[320px]">
                  <img src={featured.image} alt={featured.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105" />
                </div>
                <div className="p-7 sm:p-9 flex flex-col justify-center">
                  <span className="px-2 py-0.5 bg-[#332a1d] text-[#f2d29b] text-xs rounded font-mono w-fit">{featured.category}</span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#faf7f0] tracking-tight mt-4 mb-3 leading-tight group-hover:text-[#f2d29b] transition-colors duration-200">{featured.title}</h2>
                  <p className="text-[#b3a893] text-sm leading-relaxed line-clamp-2 max-w-[52ch]">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 mt-5 text-[#b3a893] text-xs">
                    <Clock size={11} aria-hidden="true" /> {featured.readTime}
                    <span aria-hidden="true">·</span>
                    <span>{featured.date}</span>
                  </div>
                </div>
              </Link>
            )}
            <div className="divide-y divide-[#3a2f1e] border-b border-[#3a2f1e]">
              {rest.map(post => (
                <Link key={post.id} to={`/blog/${post.id}`} className="group flex gap-5 py-6 items-start active:scale-[0.99] transition-transform duration-150 ease-out">
                  <div className="w-28 sm:w-44 aspect-video rounded-lg overflow-hidden shrink-0 border border-[#3a2f1e]">
                    <img src={post.image} alt={post.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="px-2 py-0.5 bg-[#332a1d] text-[#f2d29b] text-xs rounded font-mono">{post.category}</span>
                    <h2 className="font-serif text-lg sm:text-xl text-[#faf7f0] tracking-tight mt-2 mb-1.5 leading-snug group-hover:text-[#f2d29b] transition-colors duration-200">{post.title}</h2>
                    <p className="text-[#b3a893] text-xs leading-relaxed line-clamp-2 max-w-[65ch]">{post.excerpt}</p>
                    <div className="flex items-center gap-3 mt-3 text-[#b3a893] text-xs">
                      <Clock size={11} aria-hidden="true" /> {post.readTime}
                      <span aria-hidden="true">·</span>
                      <span>{post.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

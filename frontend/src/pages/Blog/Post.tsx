import { useParams, Link } from 'react-router';
import { ArrowLeft, Clock } from 'lucide-react';
import { BLOG_POSTS } from '../../data';
import { usePublicPost } from '../../features/catalog/public-api';
import { resolveImageUrl } from '../../shared/images';

export function BlogPost() {
  const { id } = useParams();
  const live = usePublicPost(id);
  const online = live.data !== undefined;
  const post = online
    ? (live.data ? {
        category: live.data.category,
        title: live.data.title,
        readTime: `${live.data.read_minutes} min`,
        date: new Date(live.data.created_at ?? Date.now()).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
        image: resolveImageUrl(live.data.image_url) ?? '',
        excerpt: live.data.excerpt ?? '',
        body: (live.data.body ?? '').split('\n\n'),
      } : undefined)
    : (() => {
        const found = BLOG_POSTS.find(p => p.id === Number(id));
        return found ? { ...found, body: [] as string[] } : undefined;
      })();

  if (!post) return (
    <div className="min-h-dvh pt-32 flex items-center justify-center text-center px-6">
      <div>
        <p className="font-serif text-3xl text-[#faf7f0] tracking-tight mb-3">Artículo no encontrado</p>
        <p className="text-[#b3a893] text-sm leading-relaxed max-w-[52ch] mx-auto mb-6">Es posible que se haya movido o eliminado.</p>
        <Link to="/blog" className="btn-outline">Volver al blog</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh pt-24 px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#b3a893] hover:text-[#f2d29b] active:text-[#f2d29b] text-sm mb-8 transition-colors duration-200">
          <ArrowLeft size={14} /> Blog
        </Link>
        <span className="px-2 py-0.5 bg-[#332a1d] text-[#f2d29b] text-xs rounded font-mono">{post.category}</span>
        <h1 className="font-serif text-4xl sm:text-5xl text-[#faf7f0] tracking-tighter mt-4 mb-3 leading-[1.1]">{post.title}</h1>
        <div className="flex items-center gap-3 text-[#b3a893] text-xs mb-8">
          <Clock size={11} aria-hidden="true" /> {post.readTime} · {post.date}
        </div>
        <div className="rounded-2xl overflow-hidden border border-[#3a2f1e] mb-10">
          <img src={post.image} alt={post.title} loading="lazy" className="w-full aspect-video object-cover" />
        </div>
        <div className="max-w-[68ch]">
          <p className="font-serif text-[#d8cfbf] leading-[1.6] text-lg mb-6">{post.excerpt}</p>
          {post.body.length > 0 ? (
            post.body.map((p, i) => <p key={i} className="text-[#b3a893] leading-[1.7] mt-5">{p}</p>)
          ) : (
            <>
              <p className="text-[#b3a893] leading-[1.7]">El cuidado de las uñas va más allá de la estética. Es una práctica de autocuidado que, cuando se realiza con los materiales y técnicas correctas, puede transformar tu rutina y elevar tu confianza.</p>
              <p className="text-[#b3a893] leading-[1.7] mt-5">En Nails Studio nos especializamos en técnicas que no solo lucen increíbles, sino que cuidan la salud de tu uña natural. Cada decisión de diseño parte de entender la forma, longitud y condición de cada uña.</p>
            </>
          )}
        </div>
        <div className="mt-12 pt-8 border-t border-[#3a2f1e]">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-[#b3a893] hover:text-[#f2d29b] active:text-[#f2d29b] transition-colors duration-200">
            <ArrowLeft size={14} /> Seguir leyendo
          </Link>
        </div>
      </div>
    </div>
  );
}

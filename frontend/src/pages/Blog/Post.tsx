import { useParams, Link } from 'react-router';
import { ArrowLeft, Clock } from 'lucide-react';
import { BLOG_POSTS } from '../../data';

export function BlogPost() {
  const { id } = useParams();
  const post = BLOG_POSTS.find(p => p.id === Number(id));

  if (!post) return (
    <div className="min-h-screen pt-32 flex items-center justify-center text-center px-6">
      <div>
        <p className="font-serif text-3xl text-[#f0ebe4] mb-3">Artículo no encontrado</p>
        <Link to="/blog" className="text-[#c9a96e] hover:underline">← Volver al blog</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <Link to="/blog" className="inline-flex items-center gap-2 text-[#8a7d6e] hover:text-[#c9a96e] text-sm mb-8">
          <ArrowLeft size={14} /> Blog
        </Link>
        <span className="px-2 py-0.5 bg-[#2a2018] text-[#c9a96e] text-xs rounded font-mono">{post.category}</span>
        <h1 className="font-serif text-4xl text-[#f0ebe4] mt-4 mb-3 leading-[1.1]">{post.title}</h1>
        <div className="flex items-center gap-3 text-[#8a7d6e] text-xs mb-8">
          <Clock size={11} /> {post.readTime} · {post.date}
        </div>
        <img src={post.image} alt={post.title} className="w-full rounded-xl mb-10 aspect-video object-cover" />
        <div className="prose prose-invert max-w-none">
          <p className="text-[#c8bfb0] leading-relaxed text-base mb-4">{post.excerpt}</p>
          <p className="text-[#8a7d6e] leading-relaxed">El cuidado de las uñas va más allá de la estética. Es una práctica de autocuidado que, cuando se realiza con los materiales y técnicas correctas, puede transformar tu rutina y elevar tu confianza.</p>
          <p className="text-[#8a7d6e] leading-relaxed mt-4">En Nails Studio nos especializamos en técnicas que no solo lucen increíbles, sino que cuidan la salud de tu uña natural. Cada decisión de diseño parte de entender la forma, longitud y condición de cada uña.</p>
        </div>
      </div>
    </div>
  );
}

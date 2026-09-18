import { Link } from 'react-router';
import { Clock } from 'lucide-react';
import { BLOG_POSTS } from '../../data';

export function Blog() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Blog</p>
          <h1 className="font-serif text-4xl text-[#f0ebe4]">Tips & tendencias</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map(post => (
            <Link key={post.id} to={`/blog/${post.id}`} className="group bg-[#181310] border border-[#2e2518] rounded-xl overflow-hidden hover:border-[#c9a96e]/30 transition-colors">
              <div className="aspect-video overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5">
                <span className="px-2 py-0.5 bg-[#2a2018] text-[#c9a96e] text-xs rounded font-mono">{post.category}</span>
                <h2 className="font-serif text-[#f0ebe4] mt-3 mb-2 leading-snug group-hover:text-[#c9a96e] transition-colors">{post.title}</h2>
                <p className="text-[#8a7d6e] text-xs leading-relaxed">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-4 text-[#8a7d6e] text-xs">
                  <Clock size={11} /> {post.readTime}
                  <span>·</span>
                  <span>{post.date}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

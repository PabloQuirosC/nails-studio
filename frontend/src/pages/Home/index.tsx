import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Star, Sparkle, Clock, MapPin, ArrowUpRight, PenLine } from 'lucide-react';
import { CATEGORIES, DESIGNS, TESTIMONIALS } from '../../data';
import { CategoryIcon } from '../../shared/category-icons';
import { usePublicPosts, useSubmitTestimonio } from '../../features/catalog/public-api';
import { Modal, Toast } from '../../components/ui/Modal';

function isOpen() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  const d = new Date().getDay();
  if (d === 0) return h >= 11 && h < 16;
  return d >= 1 && d <= 6 && h >= 10 && h < 19;
}

const MARQUEE_ITEMS = [
  'Acrílicas', 'Gel X', 'Semipermanente', 'Pedicure Spa',
  'Relieves 3D', 'Encapsulados', 'Mano Alzada', 'Chrome Effect',
  'Acrílicas', 'Gel X', 'Semipermanente', 'Pedicure Spa',
  'Relieves 3D', 'Encapsulados', 'Mano Alzada', 'Chrome Effect',
];

const STATS = [
  { n: '5 K+', label: 'Diseños únicos', star: false },
  { n: '8',    label: 'Años de arte', star: false },
  { n: '4.9',  label: 'Calificación', star: true },
];

const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1610992236809-7a5b76df6e8a?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=700&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1610992236809-7a5b76df6e8a?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=600&fit=crop&auto=format',
];

export function Home() {
  const open = isOpen();
  const trending = DESIGNS.slice(0, 8);
  const testiQuery = usePublicPosts('testimonio');
  const testiItems = testiQuery.data !== undefined
    ? (testiQuery.data.items ?? []).map(p => ({
        id: `srv-${p.id}` as string | number,
        name: p.author ?? p.title,
        text: p.excerpt ?? '',
        design: p.design_name ?? '',
        rating: p.rating ?? 5,
        avatar: (p.author ?? '?').trim().charAt(0).toUpperCase(),
      }))
    : TESTIMONIALS;

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewDesign, setReviewDesign] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [toast, setToast] = useState({ msg: '', visible: false });
  const submitReview = useSubmitTestimonio();

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2600);
  };

  const handleReview = () => {
    if (reviewName.trim().length < 2) { setReviewError('Escribe tu nombre.'); return; }
    if (reviewText.trim().length < 10) { setReviewError('Cuéntanos un poco más (mínimo 10 caracteres).'); return; }
    setReviewError('');
    submitReview.mutate(
      { author: reviewName.trim(), text: reviewText.trim(), rating: reviewRating, design_name: reviewDesign.trim() || undefined },
      {
        onSuccess: () => {
          setReviewOpen(false);
          setReviewName(''); setReviewText(''); setReviewDesign(''); setReviewRating(5);
          showToast('¡Gracias! Tu reseña será publicada tras revisión.');
        },
        onError: (err) => setReviewError((err as Error).message || 'No se pudo enviar. Intenta de nuevo.'),
      },
    );
  };

  return (
    <div className="overflow-x-hidden">

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center noise pt-32 pb-28">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1800&h=1200&fit=crop&auto=format"
            alt=""
            className="w-full h-full object-cover"
            style={{ opacity: 0.18 }}
          />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,169,110,0.06) 0%, transparent 70%), linear-gradient(to bottom, #080706 0%, transparent 30%, transparent 70%, #080706 100%)'
          }} />
        </div>

        {/* Floating orbs */}
        <div className="orb orb-gold orb-animate" style={{ width: 600, height: 600, top: '-10%', right: '-15%', opacity: 0.6 }} />
        <div className="orb orb-terra orb-animate-rev" style={{ width: 400, height: 400, bottom: '5%', left: '-10%', opacity: 0.5 }} />
        <div className="orb orb-gold" style={{ width: 300, height: 300, top: '40%', left: '10%', opacity: 0.15, filter: 'blur(120px)' }} />

        {/* Rotating decorative ring */}
        <div className="absolute right-10 top-1/3 hidden xl:block" style={{ opacity: 0.4 }}>
          <div
            className="animate-spin-slow"
            style={{
              width: 140, height: 140,
              border: '1px solid rgba(201,169,110,0.3)',
              borderRadius: '50%',
              borderTopColor: '#c9a96e',
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-[#c9a96e] text-[10px] tracking-[0.3em] uppercase">Nail Art</span>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="section-label justify-center mb-8">
            Arte · Precisión · Lujo
          </div>

          <h1 className="font-serif leading-[1.02] mb-8" style={{ fontSize: 'clamp(3.2rem, 9vw, 7.5rem)' }}>
            <span className="block text-[#f0ebe4]">Tus uñas,</span>
            <span className="block text-gradient text-glow-gold">tu obra maestra</span>
          </h1>

          <p className="text-[#7a6e60] max-w-lg mx-auto mb-12 leading-relaxed" style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)' }}>
            Diseños únicos creados a mano en cada cita. Arte que dura, técnica que cuida.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/reservas" className="btn-primary glow-gold-hover">
              Reservar mi cita <ArrowRight size={16} />
            </Link>
            <Link to="/catalogo" className="btn-outline">
              Ver diseños
            </Link>
          </div>

          {/* Quick trust signals */}
          <div className="relative z-10 flex items-center justify-center gap-x-6 gap-y-3 mt-10 px-4 flex-wrap">
            {['Materiales certificados', 'Artistas profesionales'].map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[#7a6e60] text-xs whitespace-nowrap">
                <div className="w-1 h-1 rounded-full bg-[#c9a96e] shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-0 hidden sm:flex flex-col items-center gap-2 pointer-events-none" aria-hidden="true">
          <div className="w-px h-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#c9a96e]/60 to-transparent animate-[shimmer_2s_ease_infinite]"
              style={{ background: 'linear-gradient(to bottom, transparent, #c9a96e, transparent)', backgroundSize: '100% 200%', animation: 'scroll-line 2s ease infinite' }} />
          </div>
          <span className="font-mono text-[#c9a96e]/50 text-[9px] tracking-[0.25em] uppercase">Scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════ */}
      <div className="border-y border-[#231e14] overflow-hidden py-4" style={{ background: 'linear-gradient(90deg, #0e0b08, #111009, #0e0b08)' }}>
        <div className="marquee-track">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="flex items-center shrink-0">
              <span className="font-serif italic text-[#f0ebe4]/70 text-lg px-8 whitespace-nowrap">{item}</span>
              <span className="text-[#c9a96e] flex items-center"><Sparkle size={12} /></span>
            </span>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════ */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: 'linear-gradient(90deg, transparent, #231e14, transparent)' }}>
          {STATS.map((s, i) => (
            <div key={i} className="flex flex-col items-center py-10 px-6 text-center" style={{ background: '#080706' }}>
              <span className="font-serif text-5xl lg:text-6xl text-gradient mb-2" style={{ lineHeight: 1 }}>{s.n}</span>
              <span className="font-mono text-[#7a6e60] text-xs tracking-widest uppercase mt-2 flex items-center gap-1.5">
                {s.label}
                {s.star && <Star size={11} className="fill-[#c9a96e] text-[#c9a96e]" />}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-14 gap-6">
            <div>
              <div className="section-label mb-4">Servicios</div>
              <h2 className="font-serif text-[#f0ebe4]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Nuestras especialidades
              </h2>
            </div>
            <Link to="/catalogo" className="hidden sm:flex items-center gap-2 text-sm text-[#7a6e60] hover:text-[#c9a96e] transition-colors shrink-0 group">
              Ver todo <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          {/* Grid: 4 cols, first two items span full height on desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat, i) => (
              <Link
                key={cat.id}
                to={`/catalogo?categoria=${cat.id}`}
                className="relative group overflow-hidden rounded-xl card-lift"
                style={{ aspectRatio: i < 2 ? '9/11' : '4/5' }}
              >
                {/* Background image */}
                <img
                  src={CATEGORY_IMAGES[i]}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(to top, rgba(8,7,6,0.96) 0%, rgba(8,7,6,0.4) 50%, rgba(8,7,6,0.1) 100%)`,
                  }}
                />
                {/* Color accent on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at bottom, ${cat.color}22 0%, transparent 70%)` }}
                />
                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="mb-2 block text-[#e8d4a8]"><CategoryIcon name={cat.icon} size={22} /></span>
                      <p className="font-serif text-[#f0ebe4] text-sm sm:text-base leading-tight group-hover:text-[#c9a96e] transition-colors duration-300">
                        {cat.name}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      className="text-[#c9a96e] opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 shrink-0 mt-1"
                    />
                  </div>
                  <p className="text-[#7a6e60] text-xs mt-1.5 leading-relaxed max-h-0 overflow-hidden group-hover:max-h-10 transition-all duration-500">
                    {cat.description}
                  </p>
                  <div className="mt-3 h-px w-6 group-hover:w-12 transition-all duration-500" style={{ background: cat.color }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TRENDING — horizontal scroll
      ══════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="section-label mb-4">Tendencias</div>
              <h2 className="font-serif text-[#f0ebe4]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Diseños del mes
              </h2>
            </div>
            <Link to="/catalogo" className="hidden sm:flex items-center gap-2 text-sm text-[#7a6e60] hover:text-[#c9a96e] transition-colors shrink-0 group">
              Ver todos <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Horizontal scroll strip */}
        <div className="overflow-x-auto pb-4 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-4 px-6" style={{ width: 'max-content' }}>
            {trending.map((d, i) => (
              <Link
                key={d.id}
                to={`/catalogo/${d.id}`}
                className="group relative rounded-xl overflow-hidden shrink-0 card-lift"
                style={{ width: i === 0 ? 320 : 240, height: i === 0 ? 400 : 300 }}
              >
                <img
                  src={d.image}
                  alt={d.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.3) 55%, transparent 100%)' }} />

                {/* Badge */}
                {i === 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#080706] font-medium"
                    style={{ background: 'linear-gradient(135deg, #c9a96e, #d4613a)' }}>
                    #1 Este mes
                  </div>
                )}

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-serif text-[#f0ebe4] group-hover:text-[#c9a96e] transition-colors leading-tight mb-1">
                    {d.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#7a6e60] text-xs capitalize">{d.category.replace('-', ' ')}</p>
                    <p className="text-[#c9a96e] font-mono text-xs">desde ${d.price}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════ */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="orb orb-gold" style={{ width: 400, height: 400, top: '20%', left: '50%', transform: 'translateX(-50%)', opacity: 0.08, position: 'absolute', filter: 'blur(100px)' }} />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="section-label justify-center mb-4">Testimonios</div>
            <h2 className="font-serif text-[#f0ebe4]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
              Lo que dicen ellas
            </h2>
            <button
              onClick={() => { setReviewError(''); setReviewOpen(true); }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 border border-[#c9a96e]/40 text-[#c9a96e] text-sm rounded-full hover:bg-[#c9a96e]/10 transition-colors"
            >
              <PenLine size={14} /> Deja tu reseña
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testiItems.map((t, i) => (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-8 card-lift border-gradient relative overflow-hidden"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Big quote mark */}
                <div className="absolute top-4 right-6 font-serif text-[120px] leading-none text-[#c9a96e]/06 select-none pointer-events-none">
                  "
                </div>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} className="fill-[#c9a96e] text-[#c9a96e]" />
                  ))}
                </div>
                <p className="font-serif italic text-[#c8bfb0] leading-relaxed mb-6 relative z-10" style={{ fontSize: '1.05rem' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-[#c9a96e] text-lg border border-[#c9a96e]/25"
                      style={{ background: 'linear-gradient(135deg, #1a1510, #231a10)' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-[#f0ebe4] text-sm font-medium">{t.name}</p>
                      <p className="text-[#7a6e60] text-xs">{t.design}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-[#c9a96e]/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          LOCATION
      ══════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="section-label mb-6">Ubicación</div>
              <h2 className="font-serif text-[#f0ebe4] mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Visítanos en<br />el estudio
              </h2>

              <div className="space-y-5">
                {[
                  { icon: MapPin, label: 'Av. Artística 2410, Local 3\nCol. Centro, Ciudad' },
                  { icon: Clock, label: 'Lun – Sáb: 10:00 – 19:00\nDomingo: 11:00 – 16:00' },
                ].map((row, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full border border-[#231e14] flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(201,169,110,0.06)' }}>
                      <row.icon size={14} className="text-[#c9a96e]" />
                    </div>
                    <p className="text-[#7a6e60] leading-relaxed text-sm whitespace-pre-line pt-2">{row.label}</p>
                  </div>
                ))}
              </div>

              <div className={`mt-8 inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-mono ${
                open
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50'
                  : 'bg-red-950/30 text-red-400 border border-red-900/40'
              }`}>
                <div className={`w-2 h-2 rounded-full ${open ? 'bg-emerald-400 animate-pulse-ring' : 'bg-red-400'}`} />
                {open ? 'Abierto ahora' : 'Cerrado · Abrimos pronto'}
              </div>

              <div className="mt-10 flex gap-4">
                <Link to="/contacto" className="btn-outline !py-3 !px-6">
                  Cómo llegar
                </Link>
                <Link to="/reservas" className="btn-primary !py-3 !px-6">
                  Reservar cita
                </Link>
              </div>
            </div>

            {/* Map card */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#231e14]">
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&h=600&fit=crop&auto=format"
                alt="Nuestro estudio"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.8) 0%, transparent 50%)' }} />
              <div className="absolute bottom-6 left-6">
                <p className="font-serif text-[#f0ebe4] text-lg mb-1">Nails Studio</p>
                <p className="text-[#7a6e60] text-sm">Av. Artística 2410</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(201,169,110,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 border-t border-b border-[#231e14]" />
        <div className="orb orb-terra" style={{ width: 500, height: 500, top: '-20%', left: '30%', opacity: 0.12, position: 'absolute', filter: 'blur(100px)' }} />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="section-label justify-center mb-8">¿Lista para tu transformación?</div>
          <h2 className="font-serif text-[#f0ebe4] mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.05 }}>
            Tu próxima cita<br />
            <em className="text-gradient">te espera</em>
          </h2>
          <p className="text-[#7a6e60] mb-12 max-w-sm mx-auto leading-relaxed">
            Agenda en minutos. Confirmación inmediata por WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/reservas" className="btn-primary glow-gold" style={{ padding: '16px 48px', fontSize: '16px' }}>
              Reservar ahora <ArrowRight size={18} />
            </Link>
            <Link to="/catalogo" className="btn-outline" style={{ padding: '15px 36px' }}>
              Explorar diseños
            </Link>
          </div>
        </div>
      </section>

      {/* ── Modal: deja tu reseña ── */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Deja tu reseña" size="sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Tu nombre *</label>
            <input value={reviewName} onChange={e => setReviewName(e.target.value)}
              placeholder="Ej. Ana López" className="w-full bg-[#0d0b0a] border border-[#2e2518] rounded px-3 py-2.5 text-[#f0ebe4] text-sm focus:outline-none focus:border-[#c9a96e] transition-colors" />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Calificación *</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} estrellas`}>
                  <Star size={26} className={n <= reviewRating ? 'fill-[#c9a96e] text-[#c9a96e]' : 'text-[#4a4238] hover:text-[#8a7d6e]'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Diseño (opcional)</label>
            <input value={reviewDesign} onChange={e => setReviewDesign(e.target.value)}
              placeholder="Ej. Botanical Garden" className="w-full bg-[#0d0b0a] border border-[#2e2518] rounded px-3 py-2.5 text-[#f0ebe4] text-sm focus:outline-none focus:border-[#c9a96e] transition-colors" />
          </div>
          <div>
            <label className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest block mb-1.5">Tu experiencia *</label>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4} maxLength={2000}
              placeholder="Cuéntanos cómo te fue en el estudio…"
              className="w-full bg-[#0d0b0a] border border-[#2e2518] rounded px-3 py-2.5 text-[#f0ebe4] text-sm focus:outline-none focus:border-[#c9a96e] transition-colors resize-none" />
          </div>
          {reviewError && (
            <p className="p-3 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#e08a6d] text-xs">{reviewError}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setReviewOpen(false)}
            className="flex-1 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] transition-colors">Cancelar</button>
          <button onClick={handleReview} disabled={submitReview.isPending}
            className="flex-1 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] disabled:opacity-50 transition-colors">
            {submitReview.isPending ? 'Enviando…' : 'Enviar reseña'}
          </button>
        </div>
      </Modal>
      <Toast message={toast.msg} visible={toast.visible} />

    </div>
  );
}

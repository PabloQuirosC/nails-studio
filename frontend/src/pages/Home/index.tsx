import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, ArrowUpRight, Star, Sparkle, Clock, MapPin, PenLine } from 'lucide-react';
import { DESIGNS, TESTIMONIALS, OCCASIONS } from '../../data';
import { useMonthlyDesigns, usePublicCategories, usePublicPosts, useSubmitTestimonio } from '../../features/catalog/public-api';
import { useContactInfo } from '../../features/contact/contact-api';
import { isOpenLegacy, isOpenNow } from '../../features/contact/open-hours';
import { resolveImageUrl } from '../../shared/images';
import { Modal, Toast } from '../../components/ui/Modal';

/** Badge coherente con el horario editable (Admin → Contacto). */
function useIsOpen(): boolean {
  const { data } = useContactInfo();
  if (!data) return isOpenLegacy();
  return isOpenNow(data.schedule) ?? isOpenLegacy();
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

const OCCASION_TAGLINES: Record<string, string> = {
  'Boda': 'El día más fotografiado',
  'Diario': 'Elegancia todos los días',
  'Fiesta/Evento': 'Que te miren las manos',
  'Minimalista': 'Menos, pero mejor',
};

/* ── Esquinas de marco editorial (guía L'ATELIER) ── */
function Corners() {
  const base = 'absolute w-5 h-5 border-[#f2d29b]/70';
  return (
    <span aria-hidden="true">
      <span className={`${base} top-0 left-0 border-t-2 border-l-2`} />
      <span className={`${base} top-0 right-0 border-t-2 border-r-2`} />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2`} />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2`} />
    </span>
  );
}

function SectionHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="relative px-7 py-6 mb-12 w-fit max-w-full">
      <Corners />
      <p className="section-label mb-3">{kicker}</p>
      <h2 className="font-serif text-[#faf7f0] tracking-tighter" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', lineHeight: 1.05 }}>
        {title}
      </h2>
    </div>
  );
}

export function Home() {
  const open = useIsOpen();
  // Diseños del mes: marcados desde Admin → Catálogo ★. Sin servidor o sin
  // marcados, se muestran los primeros 8 locales (comportamiento anterior).
  const monthlyQuery = useMonthlyDesigns();
  const catsQuery = usePublicCategories();
  const trending = (() => {
    const items = monthlyQuery.data?.items ?? [];
    if (items.length === 0) return DESIGNS.slice(0, 8);
    const slugById = new Map((catsQuery.data ?? []).map(c => [c.id, c.slug] as const));
    return items.map(m => ({
      id: m.id,
      name: m.name,
      category: slugById.get(m.category_id) ?? 'mano-alzada',
      price: m.price,
      image: resolveImageUrl(m.image_url) ?? '',
    }));
  })();
  const testiQuery = usePublicPosts('testimonio');
  const testiItems = testiQuery.data != null
    ? (testiQuery.data?.items ?? []).map(p => ({
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
      <section className="relative min-h-dvh flex flex-col justify-end overflow-hidden px-6 pt-36 pb-12">
        {/* Marco editorial con esquinas doradas */}
        <div className="absolute inset-4 sm:inset-6 pointer-events-none" aria-hidden="true">
          <div className="absolute inset-0 border border-[#3a2f1e]" />
          <Corners />
        </div>
        <div className="absolute inset-0" aria-hidden="true" style={{
          background: 'radial-gradient(ellipse 60% 45% at 85% 10%, rgba(242,210,155,0.10) 0%, transparent 65%), linear-gradient(to bottom, #060505 0%, transparent 35%, transparent 75%, #060505 100%)'
        }} />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-2 sm:px-8" data-hero="v2">
          <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
            <p className="font-mono text-[#f2d29b] text-[11px] tracking-[0.3em] uppercase">Estudio de nail art — desde 2019</p>
            <p className="flex items-center gap-2 font-mono text-[#a29885] text-[11px] tracking-[0.2em] uppercase">
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={10} className="fill-[#f2d29b] text-[#f2d29b]" />
                ))}
              </span>
              4.9 · Calificación
            </p>
          </div>

          <h1 className="font-serif text-[#faf7f0] uppercase" style={{ fontSize: 'clamp(2.9rem, 10vw, 9rem)', lineHeight: 0.95, letterSpacing: '-0.02em' }}>
            Tus uñas,<br />
            <span aria-hidden="true" style={{ WebkitTextStroke: '1.5px #f2d29b', color: 'transparent' }}>tu obra maestra</span>
            <span className="sr-only">tu obra maestra</span>
          </h1>

          <div className="flex flex-col md:flex-row md:items-end gap-8 justify-between mt-9">
            <p className="text-[#a29885] text-lg leading-relaxed max-w-[46ch]">
              Diseños únicos creados a mano en cada cita. Arte que dura, técnica que cuida.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="hidden sm:flex -space-x-3" aria-hidden="true">
              </div>
              <Link to="/reservas" className="btn-primary glow-gold-hover">
                Reservar mi cita <ArrowRight size={16} />
              </Link>
              <Link to="/catalogo" className="btn-outline">
                Ver diseños
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:flex flex-col items-center gap-2 pointer-events-none" aria-hidden="true">
          <span className="font-mono text-[#f2d29b]/50 text-[9px] tracking-[0.25em] uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#f2d29b]/60 to-transparent" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          MARQUEE
      ══════════════════════════════════════════════ */}
      <div className="border-y border-[#3a2f1e] overflow-hidden py-4" style={{ background: 'linear-gradient(90deg, #0d0b09, #100d09, #0d0b09)' }}>
        <div className="marquee-track" aria-hidden="true">
          {MARQUEE_ITEMS.map((item, i) => (
            <span key={i} className="flex items-center shrink-0">
              <span className="font-serif italic text-[#faf7f0]/70 text-lg px-8 whitespace-nowrap">{item}</span>
              <span className="text-[#f2d29b] flex items-center"><Sparkle size={12} /></span>
            </span>
          ))}
        </div>
      </div>


      {/* BUSCADOR */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <SectionHead kicker="Empieza aquí" title="¿Qué buscas?" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {OCCASIONS.map(o => (
              <Link key={o} to={`/catalogo?ocasion=${encodeURIComponent(o)}`}
                className="group rounded-2xl border border-[#3a2f1e] bg-[#0d0b09] p-7 card-lift active:scale-[0.99] transition-[transform,border-color] duration-200 ease-out">
                <p className="font-mono text-[#f2d29b] text-[11px] tracking-[0.25em] uppercase mb-3">Ocasión</p>
                <p className="font-serif text-[#faf7f0] text-2xl tracking-tight group-hover:text-[#f2d29b] transition-colors duration-200">{o}</p>
                <p className="text-[#a29885] text-sm mt-2">{OCCASION_TAGLINES[o] ?? ''}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-xs text-[#b3a893] group-hover:text-[#f2d29b] transition-colors duration-200">
                  Explorar <ArrowUpRight size={13} className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
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
              <h2 className="font-serif text-[#faf7f0] tracking-tighter" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
                Diseños del mes
              </h2>
            </div>
            <Link to="/catalogo" className="hidden sm:flex items-center gap-2 text-sm text-[#a29885] hover:text-[#f2d29b] active:text-[#f2d29b] transition-colors duration-200 shrink-0 group">
              Ver todos <ArrowUpRight size={14} className="transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
                className="group relative rounded-xl overflow-hidden shrink-0 card-lift active:scale-[0.99] transition-[transform,border-color] duration-200 ease-out"
                style={{ width: i === 0 ? 320 : 240, height: i === 0 ? 400 : 300 }}
              >
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105"
                />
                {/* Overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.3) 55%, transparent 100%)' }} />

                {/* Badge */}
                {i === 0 && (
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#060505] font-medium"
                    style={{ background: 'linear-gradient(135deg, #f2d29b, #d4613a)' }}>
                    #1 Este mes
                  </div>
                )}

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-serif text-[#faf7f0] group-hover:text-[#f2d29b] transition-colors leading-tight mb-1">
                    {d.name}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#a29885] text-xs capitalize">{d.category.replace('-', ' ')}</p>
                    <p className="text-[#f2d29b] font-mono text-xs">desde ${d.price}</p>
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
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="section-label justify-center mb-4">Testimonios</div>
            <h2 className="font-serif text-[#faf7f0] tracking-tighter" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
              Lo que dicen ellas
            </h2>
            <button
              onClick={() => { setReviewError(''); setReviewOpen(true); }}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 border border-[#f2d29b]/40 text-[#f2d29b] text-sm rounded-full hover:bg-[#f2d29b]/10 active:scale-[0.98] transition-[transform,background-color,border-color] duration-150 ease-out"
            >
              <PenLine size={14} /> Deja tu reseña
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testiItems.map((t) => (
              <div
                key={t.id}
                className="glass-card rounded-2xl p-8 card-lift border-gradient relative overflow-hidden"
              >
                {/* Big quote mark */}
                <div className="absolute top-4 right-6 font-serif text-[120px] leading-none text-[#f2d29b]/06 select-none pointer-events-none">
                  "
                </div>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={13} className="fill-[#f2d29b] text-[#f2d29b]" />
                  ))}
                </div>
                <p className="font-serif italic text-[#d8cfbf] leading-relaxed mb-6 relative z-10" style={{ fontSize: '1.05rem' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-serif text-[#f2d29b] text-lg border border-[#f2d29b]/25"
                      style={{ background: 'linear-gradient(135deg, #171310, #201912)' }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-[#faf7f0] text-sm font-medium">{t.name}</p>
                      <p className="text-[#a29885] text-xs">{t.design}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-[#f2d29b]/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTUDIO */}
      <section className="py-24 px-6 border-t border-[#3a2f1e]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionHead kicker="El estudio" title="Desde 2019" />
            <p className="font-serif text-[#d8cfbf] text-xl leading-[1.6] max-w-[48ch] mb-5">
              Una mesa, una lámpara UV y una obsesión: que cada clienta salga con arte, no solo con color.
            </p>
            <p className="text-[#b3a893] leading-[1.7] max-w-[56ch] mb-8">
              Hoy somos un equipo de artistas especializadas con miles de diseños únicos. Cada cita es una colaboración.
            </p>
            <Link to="/nosotros" className="btn-outline">Conócenos</Link>
          </div>
          <dl className="divide-y divide-[#3a2f1e] border-y border-[#3a2f1e]">
            {STATS.map(s => (
              <div key={s.label} className="flex items-baseline justify-between py-6 gap-6">
                <dt className="font-mono text-[#a29885] text-xs tracking-[0.2em] uppercase">{s.label}</dt>
                <dd className="font-serif text-[#faf7f0] text-4xl sm:text-5xl">{s.n}</dd>
              </div>
            ))}
          </dl>
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
              <h2 className="font-serif text-[#faf7f0] tracking-tighter mb-8" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1 }}>
                Visítanos en<br />el estudio
              </h2>

              <div className="space-y-5">
                {[
                  { icon: MapPin, label: 'Av. Artística 2410, Local 3\nCol. Centro, Ciudad' },
                  { icon: Clock, label: 'Lun – Sáb: 10:00 – 19:00\nDomingo: 11:00 – 16:00' },
                ].map((row, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full border border-[#3a2f1e] flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(242,210,155,0.06)' }}>
                      <row.icon size={14} className="text-[#f2d29b]" />
                    </div>
                    <p className="text-[#a29885] leading-relaxed text-sm whitespace-pre-line pt-2">{row.label}</p>
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
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-[#3a2f1e]">
              <img
                src={resolveImageUrl('https://drive.google.com/file/d/1Z0KrgimGcjZZICdSUlKEgSmdNU_R5utM/view?usp=sharing') ?? ''}
                alt="Nuestro estudio"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,7,6,0.8) 0%, transparent 50%)' }} />
              <div className="absolute bottom-6 left-6">
                <p className="font-serif text-[#faf7f0] text-lg mb-1">Nails Studio</p>
                <p className="text-[#a29885] text-sm">Av. Artística 2410</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════ */}
      <section className="relative py-32 px-6 text-center overflow-hidden">
        {/* Fondo estático */}
        <div className="absolute inset-0" aria-hidden="true" style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(242,210,155,0.08) 0%, transparent 70%)',
        }} />
        <div className="absolute inset-0 border-t border-b border-[#3a2f1e]" aria-hidden="true" />

        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="section-label justify-center mb-8">¿Lista para tu transformación?</div>
          <h2 className="font-serif text-[#faf7f0] tracking-tighter mb-6" style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', lineHeight: 1.05 }}>
            Tu próxima cita<br />
            <em className="text-gradient">te espera</em>
          </h2>
          <p className="text-[#a29885] mb-12 max-w-sm mx-auto leading-relaxed">
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
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Tu nombre *</label>
            <input value={reviewName} onChange={e => setReviewName(e.target.value)}
              placeholder="Ej. Ana López" className="w-full bg-[#0d0b09] border border-[#403521] rounded px-3 py-2.5 text-[#faf7f0] text-sm focus:outline-none focus:border-[#f2d29b] transition-colors" />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Calificación *</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setReviewRating(n)} aria-label={`${n} estrellas`}>
                  <Star size={26} className={n <= reviewRating ? 'fill-[#f2d29b] text-[#f2d29b]' : 'text-[#6b6355] hover:text-[#b3a893]'} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Diseño (opcional)</label>
            <input value={reviewDesign} onChange={e => setReviewDesign(e.target.value)}
              placeholder="Ej. Botanical Garden" className="w-full bg-[#0d0b09] border border-[#403521] rounded px-3 py-2.5 text-[#faf7f0] text-sm focus:outline-none focus:border-[#f2d29b] transition-colors" />
          </div>
          <div>
            <label className="text-[#b3a893] text-xs font-mono uppercase tracking-widest block mb-1.5">Tu experiencia *</label>
            <textarea value={reviewText} onChange={e => setReviewText(e.target.value)} rows={4} maxLength={2000}
              placeholder="Cuéntanos cómo te fue en el estudio…"
              className="w-full bg-[#0d0b09] border border-[#403521] rounded px-3 py-2.5 text-[#faf7f0] text-sm focus:outline-none focus:border-[#f2d29b] transition-colors resize-none" />
          </div>
          {reviewError && (
            <p className="p-3 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#e08a6d] text-xs">{reviewError}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setReviewOpen(false)}
            className="flex-1 py-2.5 border border-[#403521] text-[#b3a893] text-sm rounded hover:border-[#b3a893] active:scale-[0.98] transition-[transform,border-color,color] duration-150 ease-out">Cancelar</button>
          <button onClick={handleReview} disabled={submitReview.isPending}
            className="flex-1 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded hover:bg-[#f7ddab] active:scale-[0.98] disabled:opacity-50 transition-[transform,background-color,opacity] duration-150 ease-out">
            {submitReview.isPending ? 'Enviando…' : 'Enviar reseña'}
          </button>
        </div>
      </Modal>
      <Toast message={toast.msg} visible={toast.visible} />

    </div>
  );
}



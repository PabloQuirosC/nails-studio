import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, ChevronRight } from 'lucide-react';

const LINKS = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/reservas', label: 'Reservas' },
  { to: '/galeria', label: 'Galería' },
  { to: '/blog', label: 'Blog' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  /* Estado de scroll sin listeners: un sentinel en flujo avisa vía IntersectionObserver. */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <>
      {/* Sentinel en flujo: sale del viewport al hacer scroll */}
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 left-0 h-12 w-px pointer-events-none" />

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,box-shadow,border-color] duration-200 ease-out ${
          scrolled
            ? 'glass shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <img
              src="/logo.jpg"
              alt="Nails Studio"
              className="w-7 h-7 rounded-full object-cover border border-[#f2d29b]/40 group-hover:border-[#f2d29b] transition-colors"
            />
            <span className="font-serif text-[19px] tracking-wide">
              <span className="text-gradient-subtle">Nails</span>
              <span className="text-[#faf7f0]"> Studio</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {LINKS.map(l => {
              const active = location.pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`text-[13px] tracking-wide relative py-1 transition-colors duration-200 ${
                    active ? 'text-[#f2d29b]' : 'text-[#a29885] hover:text-[#faf7f0]'
                  }`}
                >
                  {l.label}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-0.5 left-0 right-0 h-px origin-left bg-gradient-to-r from-[#f2d29b] to-transparent transition-transform duration-200 ease-out ${active ? 'scale-x-100' : 'scale-x-0'}`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/referidos" className="text-[13px] text-[#a29885] hover:text-[#f2d29b] transition-colors">
              Referidos
            </Link>
            <Link to="/reservas" className="btn-primary !py-2.5 !px-5 !text-[13px]">
              Reservar Cita
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="lg:hidden w-9 h-9 flex items-center justify-center text-[#a29885] hover:text-[#faf7f0] active:scale-[0.97] transition-[transform,color] duration-150 ease-out"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden glass border-t border-[#3a2f1e] animate-fade-in">
            <div className="px-6 py-6 flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="animate-fade-in flex items-center justify-between py-3 border-b border-[#3a2f1e] text-[#a29885] hover:text-[#faf7f0] active:text-[#f2d29b] text-sm transition-colors duration-200"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  {l.label}
                  <ChevronRight size={14} className="text-[#6b6355]" aria-hidden="true" />
                </Link>
              ))}
              <Link to="/referidos" className="mt-3 flex items-center gap-2 text-[#f2d29b] text-sm py-2">
                Referidos
              </Link>
              <Link to="/reservas" className="btn-primary mt-2 !w-full">
                Reservar Cita
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

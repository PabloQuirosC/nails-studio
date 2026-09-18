import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { Menu, X, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <>
      {/* Top announcement bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#c9a96e] text-[#080706] text-center py-1.5 text-xs font-medium tracking-wide">
        ✦ Reserva tu cita ahora — Arte que dura, técnica que cuida ✦
      </div>

      <header
        className={`fixed top-8 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'glass shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full border border-[#c9a96e]/40 flex items-center justify-center group-hover:border-[#c9a96e] transition-colors">
              <Sparkles size={12} className="text-[#c9a96e]" />
            </div>
            <span className="font-serif text-[19px] tracking-wide">
              <span className="text-gradient-subtle">Nails</span>
              <span className="text-[#f0ebe4]"> Studio</span>
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
                  className={`text-[13px] tracking-wide relative transition-colors duration-200 ${
                    active ? 'text-[#c9a96e]' : 'text-[#7a6e60] hover:text-[#f0ebe4]'
                  }`}
                >
                  {l.label}
                  {active && (
                    <span className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-[#c9a96e] to-transparent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <Link to="/referidos" className="text-[13px] text-[#7a6e60] hover:text-[#c9a96e] transition-colors">
              Gift Cards
            </Link>
            <Link to="/reservas" className="btn-primary !py-2.5 !px-5 !text-[13px]">
              Reservar Cita
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="lg:hidden w-9 h-9 flex items-center justify-center text-[#7a6e60] hover:text-[#f0ebe4] transition-colors"
            onClick={() => setOpen(o => !o)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="lg:hidden glass border-t border-[#231e14] animate-fade-in">
            <div className="px-6 py-6 flex flex-col gap-1">
              {LINKS.map((l, i) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center justify-between py-3 border-b border-[#231e14] text-[#7a6e60] hover:text-[#f0ebe4] text-sm transition-colors"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {l.label}
                  <span className="text-[#231e14] text-xs">→</span>
                </Link>
              ))}
              <Link to="/referidos" className="mt-3 flex items-center gap-2 text-[#c9a96e] text-sm py-2">
                Gift Cards & Referidos
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

import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight, ArrowLeft, Loader2, TriangleAlert } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../../data';
import { withLoading } from '../../shared/loading/loading-store';

const DRIVE_COVER = 'https://drive.google.com/thumbnail?id=1Z0KrgimGcjZZICdSUlKEgSmdNU_R5utM&sz=w1000';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1000&h=1400&fit=crop&auto=format';

export function AdminLogin() {
  const [coverSrc, setCoverSrc] = useState(DRIVE_COVER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    // Bloquea la página con el spinner de uñas hasta tener respuesta.
    // Reemplazar el setTimeout por POST /api/v1/auth/login vía apiFetch.
    void withLoading(
      () =>
        new Promise<boolean>((resolve) =>
          window.setTimeout(() => {
            resolve(
              email.trim().toLowerCase() === ADMIN_CREDENTIALS.email &&
                password === ADMIN_CREDENTIALS.password,
            );
          }, 900),
        ),
      'Verificando tus credenciales…',
    ).then((ok) => {
      setLoading(false);
      if (ok) {
        localStorage.setItem('ns_admin', '1');
        navigate('/admin/dashboard');
      } else {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    });
  };

  const inputBase =
    'w-full bg-[#0d0b0a] border rounded-lg pl-10 pr-10 py-3 text-sm text-[#f0ebe4] placeholder-[#4a4238] outline-none transition-all duration-200';

  return (
    <div className="min-h-screen flex bg-[#080706] noise relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-gold orb-animate" style={{ width: 520, height: 520, top: '-12%', left: '-8%', opacity: 0.5 }} />
      <div className="orb orb-terra orb-animate-rev" style={{ width: 420, height: 420, bottom: '-10%', right: '30%', opacity: 0.35 }} />

      {/* ── Left: brand panel (desktop) ── */}
      <div className="hidden lg:flex relative w-[46%] flex-col justify-between overflow-hidden border-r border-[#231e14]">
        <img
          src={coverSrc}
          onError={() => { if (coverSrc !== FALLBACK_COVER) setCoverSrc(FALLBACK_COVER); }}
          referrerPolicy="no-referrer"
          alt="Arte en uñas Nails Studio"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.35 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(8,7,6,0.55) 0%, rgba(8,7,6,0.25) 40%, rgba(8,7,6,0.92) 100%), radial-gradient(ellipse 90% 55% at 50% 100%, rgba(201,169,110,0.16) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 p-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-[#c9a96e]/50 flex items-center justify-center">
            <Sparkles size={13} className="text-[#c9a96e]" />
          </div>
          <span className="font-serif text-xl tracking-wide">
            <span className="text-gradient-subtle">Nails</span>
            <span className="text-[#f0ebe4]"> Studio</span>
          </span>
        </div>

        <div className="relative z-10 p-10">
          <p className="font-mono text-[#c9a96e] text-[10px] tracking-[0.3em] uppercase mb-4">
            Acceso privado · Staff
          </p>
          <p className="font-serif italic text-[#f0ebe4] leading-snug" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            “El lujo está<br />en cada detalle.”
          </p>
          <div className="mt-6 h-px w-16 bg-gradient-to-r from-[#c9a96e] to-transparent" />
          <div className="mt-6 flex gap-8">
            {[
              ['5K+', 'diseños'],
              ['4.9★', 'rating'],
              ['8 años', 'de arte'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-serif text-xl text-[#e8d4a8]">{n}</p>
                <p className="font-mono text-[#8a7d6e] text-[10px] uppercase tracking-widest">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: form ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md animate-fade-in-up">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[#7a6e60] hover:text-[#c9a96e] text-xs font-mono uppercase tracking-widest transition-colors mb-8"
          >
            <ArrowLeft size={13} /> Volver al sitio
          </Link>

          <div className="mb-4">
            <span className="section-label">Panel de administración</span>
          </div>
          <h1 className="font-serif text-[#f0ebe4] leading-tight mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}>
            Bienvenida de <em className="text-gradient not-italic font-serif italic">vuelta</em>
          </h1>
          <p className="text-[#7a6e60] text-sm mb-8 leading-relaxed">
            Ingresa con tu cuenta de staff para gestionar citas, catálogo y clientas.
          </p>

          <form
            onSubmit={handleSubmit}
            className="glass-card border-gradient rounded-2xl p-7 sm:p-8 space-y-5"
            noValidate
          >
            <div>
              <label htmlFor="admin-email" className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest mb-2 block">
                Email corporativo
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238] pointer-events-none" />
                <input
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="tu@ nailsstudio.com"
                  aria-invalid={error ? true : undefined}
                  className={`${inputBase} ${error ? 'border-[#d4613a]/60' : 'border-[#2e2518] focus:border-[#c9a96e]/70 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.12)]'}`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="admin-password" className="text-[#8a7d6e] text-[11px] font-mono uppercase tracking-widest block">
                  Contraseña
                </label>
                <button type="button" className="text-[#4a4238] hover:text-[#c9a96e] text-xs transition-colors">
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4a4238] pointer-events-none" />
                <input
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={error ? true : undefined}
                  className={`${inputBase} ${error ? 'border-[#d4613a]/60' : 'border-[#2e2518] focus:border-[#c9a96e]/70 focus:shadow-[0_0_0_3px_rgba(201,169,110,0.12)]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4238] hover:text-[#f0ebe4] transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="flex items-start gap-2.5 p-3.5 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded-lg text-[#e08a6d] text-xs leading-relaxed animate-fade-in"
              >
                <TriangleAlert size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary glow-gold-hover w-full !py-3.5 !text-[15px] disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verificando…
                </>
              ) : (
                <>
                  Ingresar al panel <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-[#4a4238] text-[11px] font-mono tracking-wide pt-1">
              Acceso restringido · Solo personal autorizado
            </p>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[#4a4238] text-[11px] font-mono">
            <span className="w-1 h-1 rounded-full bg-[#c9a96e]/60" />
            Sesión protegida · Nails Studio © 2026
            <span className="w-1 h-1 rounded-full bg-[#c9a96e]/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

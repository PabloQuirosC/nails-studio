import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft, Loader2, TriangleAlert } from 'lucide-react';
import { useAuthStore } from '../../shared/auth/auth-store';

const DRIVE_COVER = 'https://drive.google.com/thumbnail?id=1Z0KrgimGcjZZICdSUlKEgSmdNU_R5utM&sz=w1000';
const FALLBACK_COVER = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1000&h=1400&fit=crop&auto=format';

export function AdminLogin() {
  const [coverSrc, setCoverSrc] = useState(DRIVE_COVER);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, hydrated, verified, hydrate, login, busy, error: storeError } = useAuthStore();

  useEffect(() => {
    if (!hydrated) void hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    // Solo sesión VERIFICADA por servidor redirige. Caché no autoriza.
    if (!hydrated || !verified || !user) return;
    if (!user.permissions || user.permissions.length === 0) {
      void useAuthStore.getState().logout();
      setError('Usuario sin permisos asignados. Contacta al administrador.');
      return;
    }
    navigate('/admin/dashboard', { replace: true });
  }, [hydrated, verified, user, navigate]);

  useEffect(() => {
    if (storeError) setError(storeError);
  }, [storeError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    void login(email, password).then((ok) => {
      if (ok) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        setError(useAuthStore.getState().error ?? 'Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    });
  };

  const inputBase =
    'w-full bg-[#0d0b09] border rounded-lg pl-10 pr-10 py-3 text-sm text-[#faf7f0] placeholder-[#6b6355] outline-none transition-all duration-200';

  return (
    <div className="min-h-screen flex bg-[#060505] noise relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="orb orb-gold orb-animate" style={{ width: 520, height: 520, top: '-12%', left: '-8%', opacity: 0.5 }} />
      <div className="orb orb-terra orb-animate-rev" style={{ width: 420, height: 420, bottom: '-10%', right: '30%', opacity: 0.35 }} />

      {/* ── Left: brand panel (desktop) ── */}
      <div className="hidden lg:flex relative w-[46%] flex-col justify-between overflow-hidden border-r border-[#3a2f1e]">
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
              'linear-gradient(to bottom, rgba(8,7,6,0.55) 0%, rgba(8,7,6,0.25) 40%, rgba(8,7,6,0.92) 100%), radial-gradient(ellipse 90% 55% at 50% 100%, rgba(242,210,155,0.16) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 p-10 flex items-center gap-2.5">
          <img
            src="/logo.jpg"
            alt="Nails Studio"
            className="w-8 h-8 rounded-full object-cover border border-[#f2d29b]/50"
          />
          <span className="font-serif text-xl tracking-wide">
            <span className="text-gradient-subtle">Nails</span>
            <span className="text-[#faf7f0]"> Studio</span>
          </span>
        </div>

        <div className="relative z-10 p-10">
          <p className="font-mono text-[#f2d29b] text-[10px] tracking-[0.3em] uppercase mb-4">
            Acceso privado · Staff
          </p>
          <p className="font-serif italic text-[#faf7f0] leading-snug" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)' }}>
            “El lujo está<br />en cada detalle.”
          </p>
          <div className="mt-6 h-px w-16 bg-gradient-to-r from-[#f2d29b] to-transparent" />
          <div className="mt-6 flex gap-8">
            {[
              ['5K+', 'diseños'],
              ['4.9★', 'rating'],
              ['8 años', 'de arte'],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-serif text-xl text-[#f9e9c8]">{n}</p>
                <p className="font-mono text-[#b3a893] text-[10px] uppercase tracking-widest">{l}</p>
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
            className="inline-flex items-center gap-2 text-[#a29885] hover:text-[#f2d29b] text-xs font-mono uppercase tracking-widest transition-colors mb-8"
          >
            <ArrowLeft size={13} /> Volver al sitio
          </Link>

          <div className="mb-4">
            <span className="section-label">Panel de administración</span>
          </div>
          <h1 className="font-serif text-[#faf7f0] leading-tight mb-2" style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)' }}>
            Bienvenida de <em className="text-gradient not-italic font-serif italic">vuelta</em>
          </h1>
          <p className="text-[#a29885] text-sm mb-8 leading-relaxed">
            Ingresa con tu cuenta de staff para gestionar citas, catálogo y clientas.
          </p>

          <form
            onSubmit={handleSubmit}
            className="glass-card border-gradient rounded-2xl p-7 sm:p-8 space-y-5"
            noValidate
          >
            <div>
              <label htmlFor="admin-email" className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest mb-2 block">
                Email corporativo
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355] pointer-events-none" />
                <input
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="tu@ nailsstudio.com"
                  aria-invalid={error ? true : undefined}
                  className={`${inputBase} ${error ? 'border-[#d4613a]/60' : 'border-[#403521] focus:border-[#f2d29b]/70 focus:shadow-[0_0_0_3px_rgba(242,210,155,0.12)]'}`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="admin-password" className="text-[#b3a893] text-[11px] font-mono uppercase tracking-widest block">
                  Contraseña
                </label>
                <button type="button" className="text-[#6b6355] hover:text-[#f2d29b] text-xs transition-colors">
                  ¿La olvidaste?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6b6355] pointer-events-none" />
                <input
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={error ? true : undefined}
                  className={`${inputBase} ${error ? 'border-[#d4613a]/60' : 'border-[#403521] focus:border-[#f2d29b]/70 focus:shadow-[0_0_0_3px_rgba(242,210,155,0.12)]'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6355] hover:text-[#faf7f0] transition-colors"
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
              disabled={busy}
              className="btn-primary glow-gold-hover w-full !py-3.5 !text-[15px] disabled:opacity-70 disabled:cursor-wait"
            >
              {busy ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Verificando…
                </>
              ) : (
                <>
                  Ingresar al panel <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="text-center text-[#6b6355] text-[11px] font-mono tracking-wide pt-1">
              Acceso restringido · Solo personal autorizado
            </p>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[#6b6355] text-[11px] font-mono">
            <span className="w-1 h-1 rounded-full bg-[#f2d29b]/60" />
            Sesión protegida · Nails Studio © 2026
            <span className="w-1 h-1 rounded-full bg-[#f2d29b]/60" />
          </div>
        </div>
      </div>
    </div>
  );
}

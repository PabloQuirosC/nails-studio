import { useState } from 'react';
import { Gift, Search, Share2 } from 'lucide-react';
import { Toast } from '../../components/ui/Modal';
import { apiFetch, ApiError } from '../../shared/auth/api-client';
import { REFERRAL_DEFAULTS, useReferralInfo } from '../../features/contact/referral-api';

interface LoyaltyCard {
  code: string;
  amount: number;
  used: boolean;
}

interface Lookup {
  name: string;
  visits: number;
  points: number;
  visits_to_reward: number;
  progress_pct: number;
  loyalty_cards: LoyaltyCard[];
}

export function Referrals() {
  const [toast, setToast] = useState({ msg: '', visible: false });
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Lookup | null>(null);
  // Contenido administrable (con valores por defecto si no hay servidor).
  const infoQuery = useReferralInfo();
  const program = infoQuery.data ?? REFERRAL_DEFAULTS;

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const lookup = async () => {
    const clean = phone.trim();
    if (clean.length < 5) {
      setError('Escribe tu teléfono tal como lo registraste en el estudio.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data = await apiFetch<Lookup>(`/api/v1/clients/lookup?phone=${encodeURIComponent(clean)}`, {
        message: 'Buscando tu saldo…',
      });
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : 'No se pudo conectar con el servidor');
    } finally {
      setBusy(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => showToast('¡Código copiado!')).catch(() => undefined);
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <Toast message={toast.msg} visible={toast.visible} />
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase mb-3">Programa</p>
          <h1 className="font-serif text-4xl text-[#faf7f0]">Referidos</h1>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Programa (contenido administrable desde el panel) */}
          <div className="bg-[#14110c] border border-[#403521] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[#f2d29b]/15 flex items-center justify-center">
                <Share2 size={18} className="text-[#f2d29b]" />
              </div>
              <h2 className="font-serif text-xl text-[#faf7f0]">{program.title}</h2>
            </div>
            <p className="text-[#b3a893] text-sm mb-6">{program.subtitle}</p>

            <div className="space-y-4">
              {program.steps.map((text, i) => (
                <div key={i} className="flex gap-4">
                  <span className="font-mono text-[#f2d29b] text-xs w-6 shrink-0 pt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-[#b3a893] text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Consulta real por teléfono */}
          <div className="bg-[#14110c] border border-[#403521] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#f2d29b]/15 flex items-center justify-center">
                <Search size={18} className="text-[#f2d29b]" />
              </div>
              <h2 className="font-serif text-xl text-[#faf7f0]">Consulta tu saldo</h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void lookup()}
                placeholder="Tu teléfono, ej. +506 8888 8888"
                inputMode="tel"
                className="flex-1 bg-[#0d0b09] border border-[#403521] rounded-lg px-4 py-2.5 text-sm text-[#faf7f0] placeholder-[#6b6355] focus:outline-none focus:border-[#f2d29b]/60 transition-colors"
              />
              <button
                onClick={() => void lookup()}
                disabled={busy}
                className="px-5 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-semibold rounded-lg hover:bg-[#f7ddab] disabled:opacity-60 transition-colors"
              >
                {busy ? 'Buscando…' : 'Consultar'}
              </button>
            </div>

            {error ? (
              <p role="alert" className="text-[#e08a6d] text-sm mt-4">{error}</p>
            ) : null}

            {result ? (
              <div className="mt-6 space-y-5">
                <div>
                  <p className="font-serif text-lg text-[#faf7f0]">Hola, {result.name}</p>
                  <p className="text-[#b3a893] text-xs mt-1 font-mono">
                    {result.visits} visitas · {result.points} puntos ·{' '}
                    {result.visits_to_reward === 0
                      ? 'tienes recompensa disponible'
                      : `te faltan ${result.visits_to_reward} visitas para tu gift card`}
                  </p>
                  <div className="h-1.5 mt-3 bg-[#332a1d] rounded-full overflow-hidden" aria-hidden="true">
                    <div className="h-full bg-[#f2d29b] rounded-full transition-all" style={{ width: `${result.progress_pct}%` }} />
                  </div>
                </div>

                {result.loyalty_cards.length > 0 ? (
                  <div className="space-y-2">
                    {result.loyalty_cards.map(c => (
                      <div key={c.code} className="flex items-center justify-between gap-3 bg-[#0d0b09] border border-[#403521] rounded-lg px-4 py-3">
                        <span className="flex items-center gap-2 text-sm">
                          <Gift size={14} className={c.used ? 'text-[#6b6355]' : 'text-[#f2d29b]'} />
                          <span className="font-mono text-[#f9e9c8] text-xs tracking-widest">{c.code}</span>
                          <span className="text-[#b3a893] text-xs">₡{c.amount.toLocaleString()}</span>
                        </span>
                        {c.used ? (
                          <span className="text-[#6b6355] text-xs">Canjeada</span>
                        ) : (
                          <button onClick={() => copyCode(c.code)} className="text-[#f2d29b] text-xs hover:underline">
                            Copiar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#b3a893] text-sm">Aún no tienes gift cards de lealtad. ¡Cada visita te acerca!</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

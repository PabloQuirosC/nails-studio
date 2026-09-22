import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { Toast } from '../../components/ui/Modal';

export function Referrals() {
  const [toast, setToast] = useState({ msg: '', visible: false });
  const REFERRAL_CODE = 'NAILS-AMIGA24';

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2000);
  };

  const copyCode = () => {
    navigator.clipboard?.writeText(REFERRAL_CODE).then(() => showToast('¡Código copiado!'));
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <Toast message={toast.msg} visible={toast.visible} />
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase mb-3">Programa</p>
          <h1 className="font-serif text-4xl text-[#faf7f0]">Referidos</h1>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Referral */}
          <div className="bg-[#14110c] border border-[#403521] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#f2d29b]/15 flex items-center justify-center">
                <Share2 size={18} className="text-[#f2d29b]" />
              </div>
              <h2 className="font-serif text-xl text-[#faf7f0]">Programa de referidos</h2>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { step: '01', text: 'Comparte tu código único con amigas' },
                { step: '02', text: 'Tu amiga obtiene $100 de descuento en su primera cita' },
                { step: '03', text: 'Tú recibes $150 de crédito cuando ella venga' },
              ].map(s => (
                <div key={s.step} className="flex gap-4">
                  <span className="font-mono text-[#f2d29b] text-xs w-6 shrink-0 pt-0.5">{s.step}</span>
                  <p className="text-[#b3a893] text-sm leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#332a1d] border border-[#f2d29b]/20 rounded-lg p-4">
              <p className="text-[#b3a893] text-xs font-mono mb-2">Tu código de referido</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-[#f2d29b] text-xl flex-1">{REFERRAL_CODE}</p>
                <button onClick={copyCode} className="px-3 py-1.5 border border-[#f2d29b]/40 text-[#f2d29b] text-xs rounded hover:bg-[#f2d29b]/10 transition-colors">
                  Copiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

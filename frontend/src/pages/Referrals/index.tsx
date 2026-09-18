import { useState } from 'react';
import { Gift, Share2, Check } from 'lucide-react';
import { Modal, Toast } from '../../components/ui/Modal';

export function Referrals() {
  const [giftAmount, setGiftAmount] = useState(500);
  const [giftMsg, setGiftMsg] = useState('');
  const [giftEmail, setGiftEmail] = useState('');
  const [giftSent, setGiftSent] = useState(false);
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
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Programa</p>
          <h1 className="font-serif text-4xl text-[#f0ebe4]">Referidos & Gift Cards</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Referral */}
          <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#c9a96e]/15 flex items-center justify-center">
                <Share2 size={18} className="text-[#c9a96e]" />
              </div>
              <h2 className="font-serif text-xl text-[#f0ebe4]">Programa de referidos</h2>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { step: '01', text: 'Comparte tu código único con amigas' },
                { step: '02', text: 'Tu amiga obtiene $100 de descuento en su primera cita' },
                { step: '03', text: 'Tú recibes $150 de crédito cuando ella venga' },
              ].map(s => (
                <div key={s.step} className="flex gap-4">
                  <span className="font-mono text-[#c9a96e] text-xs w-6 shrink-0 pt-0.5">{s.step}</span>
                  <p className="text-[#8a7d6e] text-sm leading-relaxed">{s.text}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#2a2018] border border-[#c9a96e]/20 rounded-lg p-4">
              <p className="text-[#8a7d6e] text-xs font-mono mb-2">Tu código de referido</p>
              <div className="flex items-center gap-3">
                <p className="font-mono text-[#c9a96e] text-xl flex-1">{REFERRAL_CODE}</p>
                <button onClick={copyCode} className="px-3 py-1.5 border border-[#c9a96e]/40 text-[#c9a96e] text-xs rounded hover:bg-[#c9a96e]/10 transition-colors">
                  Copiar
                </button>
              </div>
            </div>
          </div>

          {/* Gift Cards */}
          <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-[#d4613a]/15 flex items-center justify-center">
                <Gift size={18} className="text-[#d4613a]" />
              </div>
              <h2 className="font-serif text-xl text-[#f0ebe4]">Gift Cards digitales</h2>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[#8a7d6e] text-xs font-mono mb-3">Monto</p>
                <div className="grid grid-cols-4 gap-2">
                  {[300, 500, 750, 1000].map(amt => (
                    <button key={amt} onClick={() => setGiftAmount(amt)}
                      className={`py-2.5 text-sm rounded border transition-colors ${giftAmount === amt ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}>
                      ${amt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Email del destinatario</label>
                <input value={giftEmail} onChange={e => setGiftEmail(e.target.value)} type="email" placeholder="amiga@email.com"
                  className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e]" />
              </div>
              <div>
                <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Mensaje personalizado (opcional)</label>
                <textarea value={giftMsg} onChange={e => setGiftMsg(e.target.value)} rows={3} placeholder="Para ti con todo mi cariño..."
                  className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e] resize-none" />
              </div>
              <button onClick={() => giftEmail && setGiftSent(true)} className="w-full py-3 bg-[#d4613a] text-white font-medium rounded hover:bg-[#e06848] transition-colors">
                Comprar Gift Card ${giftAmount}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal open={giftSent} onClose={() => setGiftSent(false)} title="¡Gift Card enviada!" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#d4613a]/15 border border-[#d4613a]/30 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-[#d4613a]" />
          </div>
          <p className="text-[#8a7d6e] mb-2">Gift Card de <span className="text-[#c9a96e] font-mono">${giftAmount}</span> enviada a</p>
          <p className="text-[#f0ebe4] font-medium mb-6">{giftEmail}</p>
          <button onClick={() => setGiftSent(false)} className="px-6 py-2.5 bg-[#c9a96e] text-[#0d0b0a] rounded hover:bg-[#d4b87e] text-sm font-medium">
            Perfecto
          </button>
        </div>
      </Modal>
    </div>
  );
}

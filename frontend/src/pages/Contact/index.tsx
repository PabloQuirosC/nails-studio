import { useState } from 'react';
import { MapPin, Clock, Mail } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useContactInfo, useContactSocials, useSubmitContact } from '../../features/contact/contact-api';
import { isOpenLegacy, isOpenNow } from '../../features/contact/open-hours';
import { SocialIcon } from '../../features/contact/social-icons';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  // Solo servidor: cargando → skeleton, error → aviso + reintentar. Sin datos fijos.
  const infoQuery = useContactInfo();
  const info = infoQuery.data;
  const socialsQuery = useContactSocials();
  const socials = socialsQuery.data ?? [];
  const infoLoading = infoQuery.isLoading || socialsQuery.isLoading;

  const address = info?.address ?? '';

  const submitMut = useSubmitContact();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSendError('');
    submitMut.mutate(
      {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      },
      {
        onSuccess: () => setSent(true),
        onError: (err) => setSendError((err as Error).message || 'No se pudo enviar. Intenta de nuevo.'),
      },
    );
  };

  const schedule = info?.schedule ?? '';
  const isOpen = info ? (isOpenNow(schedule) ?? isOpenLegacy()) : false;

  return (
    <div className="min-h-dvh pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="section-label mb-3">Contacto</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#faf7f0] tracking-tighter">Encuéntranos</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12">
          {/* Info: skeleton → datos → error (nunca fijos) */}
          <div className="space-y-8">
            {infoLoading ? (
              <div className="divide-y divide-[#3a2f1e] border-y border-[#3a2f1e]" aria-label="Cargando contacto">
                {[0, 1].map(i => (
                  <div key={i} className="flex gap-4 py-4">
                    <div className="w-10 h-10 rounded-full bg-[#14110c] border border-[#403521] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-24 rounded bg-[#14110c] animate-pulse" />
                      <div className="h-4 w-3/4 rounded bg-[#14110c] animate-pulse" />
                    </div>
                  </div>
                ))}
                <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase py-4 animate-pulse">Cargando contacto…</p>
              </div>
            ) : infoQuery.isError || !info ? (
              <div role="alert" className="px-4 py-8 rounded-xl bg-[#d4613a]/10 border border-[#d4613a]/30 text-center">
                <p className="font-serif text-[#faf7f0] text-lg">No se pudo cargar la información</p>
                <p className="text-[#e08a6d] text-xs mt-1 font-mono">{(infoQuery.error as Error)?.message ?? 'Error de conexión'}</p>
                <button onClick={() => { void infoQuery.refetch(); void socialsQuery.refetch(); }}
                  className="mt-4 px-4 py-2 bg-[#f2d29b] text-[#0d0b09] text-xs font-semibold rounded-lg hover:bg-[#f7ddab] transition-colors">
                  Reintentar
                </button>
              </div>
            ) : (
            <>
            <div className="divide-y divide-[#3a2f1e] border-y border-[#3a2f1e]">
              {[
                { icon: MapPin, label: 'Dirección', value: address },
                { icon: Clock, label: 'Horario', value: schedule },
              ].map(item => (
                <div key={item.label} className="flex gap-4 py-4">
                  <div className="w-10 h-10 rounded-full bg-[#332a1d] border border-[#f2d29b]/20 flex items-center justify-center shrink-0">
                    <item.icon size={15} className="text-[#f2d29b]" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[#b3a893] text-xs font-mono uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-[#faf7f0] text-sm whitespace-pre-line leading-relaxed">{item.value}</p>
                  </div>
                </div>
              ))}
              {socials.map(s => (
                <div key={s.id} className="flex gap-4 py-4">
                  <div className="w-10 h-10 rounded-full bg-[#332a1d] border border-[#f2d29b]/20 flex items-center justify-center shrink-0">
                    <SocialIcon icon={s.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#b3a893] text-xs font-mono uppercase tracking-widest mb-1">{s.label}</p>
                    <a href={s.url} target="_blank" rel="noreferrer"
                      className="text-[#f2d29b] hover:underline text-sm break-all">{s.url}</a>
                  </div>
                </div>
              ))}
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono ${isOpen ? 'bg-[#8aab8a]/15 text-[#8aab8a] border border-[#8aab8a]/30' : 'bg-[#d4613a]/15 text-[#d4613a] border border-[#d4613a]/30'}`}>
              <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[#8aab8a] animate-pulse' : 'bg-[#d4613a]'}`} aria-hidden="true" />
              {isOpen ? 'Abierto ahora' : 'Cerrado · Abrimos pronto'}
            </div>
            </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[#14110c] border border-[#403521] rounded-xl p-8 space-y-5 h-fit">
            <h2 className="font-serif text-2xl text-[#faf7f0] tracking-tight">Escríbenos</h2>
            {[
              { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Tu nombre', auto: 'name' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com', auto: 'email' },
              { key: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+52 55 ...', auto: 'tel' },
            ].map(f => (
              <div key={f.key}>
                <label htmlFor={`contact-${f.key}`} className="text-[#b3a893] text-xs font-mono uppercase tracking-widest mb-2 block">{f.label}</label>
                <input id={`contact-${f.key}`} value={(form as any)[f.key]} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                  type={f.type} placeholder={f.placeholder} autoComplete={f.auto} required
                  className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] placeholder-[#b3a893] outline-none focus:border-[#f2d29b] transition-[border-color] duration-200" />
              </div>
            ))}
            <div>
              <label htmlFor="contact-message" className="text-[#b3a893] text-xs font-mono uppercase tracking-widest mb-2 block">Mensaje</label>
              <textarea id="contact-message" value={form.message} onChange={e => setForm(s => ({ ...s, message: e.target.value }))}
                rows={4} required placeholder="¿En qué te podemos ayudar?"
                className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] placeholder-[#b3a893] outline-none focus:border-[#f2d29b] transition-[border-color] duration-200 resize-none" />
            </div>
            <button type="submit" disabled={submitMut.isPending}
              className="w-full py-3 bg-[#f2d29b] text-[#0d0b09] font-medium rounded hover:bg-[#f7ddab] active:scale-[0.99] disabled:opacity-50 transition-[transform,background-color,opacity] duration-150 ease-out">
              {submitMut.isPending ? 'Enviando…' : 'Enviar mensaje'}
            </button>
            {sendError && (
              <p role="alert" className="p-3 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#e08a6d] text-xs">{sendError}</p>
            )}
            <p className="text-[#6b6355] text-xs leading-relaxed">Al enviar aceptas que te contactemos por los medios proporcionados.</p>
          </form>
        </div>
      </div>

      <Modal open={sent} onClose={() => setSent(false)} title="Mensaje enviado" size="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#f2d29b]/10 border border-[#f2d29b]/30 flex items-center justify-center">
            <Mail size={22} className="text-[#f2d29b]" aria-hidden="true" />
          </div>
          <p className="text-[#b3a893] text-sm leading-relaxed mb-5 max-w-[40ch] mx-auto">Gracias{form.name ? ` ${form.name}` : ''}, recibimos tu mensaje. Te responderemos en menos de 24 horas.</p>
          <button onClick={() => setSent(false)} className="px-6 py-2.5 bg-[#f2d29b] text-[#0d0b09] rounded hover:bg-[#f7ddab] active:scale-[0.98] text-sm font-medium transition-[transform,background-color] duration-150">
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}

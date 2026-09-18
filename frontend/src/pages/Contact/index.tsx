import { useState } from 'react';
import { MapPin, Clock, Phone, AtSign } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const isOpen = (() => {
    const now = new Date();
    const day = now.getDay();
    const h = now.getHours() + now.getMinutes() / 60;
    if (day === 0) return h >= 11 && h < 16;
    return day >= 1 && day <= 6 && h >= 10 && h < 19;
  })();

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Contacto</p>
          <h1 className="font-serif text-4xl text-[#f0ebe4]">Encuéntranos</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Info */}
          <div className="space-y-8">
            <div className="space-y-5">
              {[
                { icon: MapPin, label: 'Dirección', value: 'Av. Artística 2410, Local 3\nCol. Centro, Ciudad' },
                { icon: Clock, label: 'Horario', value: 'Lunes–Sábado: 10:00–19:00\nDomingo: 11:00–16:00' },
                { icon: Phone, label: 'WhatsApp', value: '+52 55 1234 5678' },
                { icon: AtSign, label: 'Instagram', value: '@nailsstudio.mx' },
              ].map(item => (
                <div key={item.label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#2a2018] border border-[#c9a96e]/20 flex items-center justify-center shrink-0">
                    <item.icon size={15} className="text-[#c9a96e]" />
                  </div>
                  <div>
                    <p className="text-[#8a7d6e] text-xs font-mono mb-1">{item.label}</p>
                    <p className="text-[#f0ebe4] text-sm whitespace-pre-line">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-mono ${isOpen ? 'bg-[#8aab8a]/15 text-[#8aab8a] border border-[#8aab8a]/30' : 'bg-[#d4613a]/15 text-[#d4613a] border border-[#d4613a]/30'}`}>
              <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[#8aab8a]' : 'bg-[#d4613a]'}`} />
              {isOpen ? 'Abierto ahora' : 'Cerrado · Abrimos pronto'}
            </div>

            {/* Map placeholder */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-xl overflow-hidden aspect-video flex items-center justify-center text-[#8a7d6e] text-sm">
              <div className="text-center">
                <MapPin size={24} className="mx-auto mb-2 text-[#c9a96e]" />
                <p>Mapa interactivo</p>
                <a href="#" className="text-[#c9a96e] hover:underline text-xs mt-1 block">Ver en Google Maps ↗</a>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-[#181310] border border-[#2e2518] rounded-xl p-8 space-y-5 h-fit">
            <h2 className="font-serif text-2xl text-[#f0ebe4]">Escríbenos</h2>
            {[
              { key: 'name', label: 'Nombre', type: 'text', placeholder: 'Tu nombre' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com' },
              { key: 'phone', label: 'Teléfono', type: 'tel', placeholder: '+52 55 ...' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">{f.label}</label>
                <input value={(form as any)[f.key]} onChange={e => setForm(s => ({ ...s, [f.key]: e.target.value }))}
                  type={f.type} placeholder={f.placeholder} required
                  className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e]" />
              </div>
            ))}
            <div>
              <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Mensaje</label>
              <textarea value={form.message} onChange={e => setForm(s => ({ ...s, message: e.target.value }))}
                rows={4} required placeholder="¿En qué te podemos ayudar?"
                className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e] resize-none" />
            </div>
            <button type="submit" className="w-full py-3 bg-[#c9a96e] text-[#0d0b0a] font-medium rounded hover:bg-[#d4b87e] transition-colors">
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>

      <Modal open={sent} onClose={() => setSent(false)} title="Mensaje enviado" size="sm">
        <div className="text-center py-4">
          <p className="text-4xl mb-4">✉️</p>
          <p className="text-[#8a7d6e] mb-4">Gracias {form.name}, recibimos tu mensaje. Te responderemos en menos de 24 horas.</p>
          <button onClick={() => setSent(false)} className="px-6 py-2.5 bg-[#c9a96e] text-[#0d0b0a] rounded hover:bg-[#d4b87e] text-sm font-medium">
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}

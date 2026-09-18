import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { Check, ChevronRight, Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { DESIGNS, CATEGORIES, TIME_SLOTS } from '../../data';
import { Modal } from '../../components/ui/Modal';

const STEPS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmación'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function Booking() {
  const [params] = useSearchParams();
  const designId = params.get('design') ? Number(params.get('design')) : null;
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState({
    design: designId ? DESIGNS.find(d => d.id === designId) : null,
    category: '',
    isEvent: false,
    date: null as Date | null,
    time: '',
    name: '',
    phone: '',
    email: '',
    notes: '',
    eventPeople: '',
    eventDate: '',
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = new Date(calYear, calMonth, 1).getDay();

  const canNext = () => {
    if (step === 0) return !!selected.design || !!selected.category;
    if (step === 1) return !!selected.date && !!selected.time;
    if (step === 2) return !!selected.name && !!selected.phone && !!selected.email;
    return true;
  };

  const handleSubmit = () => {
    setConfirmOpen(true);
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Reservas</p>
          <h1 className="font-serif text-4xl text-[#f0ebe4]">Agenda tu cita</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 shrink-0 ${i <= step ? 'text-[#c9a96e]' : 'text-[#8a7d6e]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border transition-colors ${i < step ? 'bg-[#c9a96e] border-[#c9a96e] text-[#0d0b0a]' : i === step ? 'border-[#c9a96e]' : 'border-[#2e2518]'}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs whitespace-nowrap">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px mx-2 shrink-0 ${i < step ? 'bg-[#c9a96e]' : 'bg-[#2e2518]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-6 sm:p-8">

          {/* Step 0: Service */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-2xl text-[#f0ebe4] mb-6">¿Qué servicio deseas?</h2>

              <div className="mb-6">
                <label className="flex items-center gap-3 p-4 border border-[#2e2518] rounded-lg cursor-pointer hover:border-[#c9a96e] has-[:checked]:border-[#c9a96e] mb-3 transition-colors">
                  <input type="checkbox" className="accent-[#c9a96e]" checked={selected.isEvent} onChange={e => setSelected(s => ({ ...s, isEvent: e.target.checked }))} />
                  <div>
                    <p className="text-[#f0ebe4] text-sm font-medium">Reserva para evento especial</p>
                    <p className="text-[#8a7d6e] text-xs">Bodas, XV años, grupos (formulario diferenciado)</p>
                  </div>
                </label>
              </div>

              {selected.isEvent ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Tipo de evento</label>
                    <select className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] outline-none focus:border-[#c9a96e]">
                      <option>Boda</option><option>XV Años</option><option>Graduación</option><option>Cumpleaños</option><option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Cantidad de personas</label>
                    <input value={selected.eventPeople} onChange={e => setSelected(s => ({ ...s, eventPeople: e.target.value }))}
                      className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] outline-none focus:border-[#c9a96e]" placeholder="Ej. 5" type="number" />
                  </div>
                  <div>
                    <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Fecha del evento</label>
                    <input value={selected.eventDate} onChange={e => setSelected(s => ({ ...s, eventDate: e.target.value }))}
                      className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] outline-none focus:border-[#c9a96e]" type="date" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[#8a7d6e] text-xs font-mono mb-4">Diseño seleccionado o elige una categoría</p>
                  {selected.design && (
                    <div className="flex gap-3 p-3 bg-[#2a2018] border border-[#c9a96e]/30 rounded-lg mb-5">
                      <img src={selected.design.image} alt="" className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="text-[#f0ebe4] text-sm">{selected.design.name}</p>
                        <p className="text-[#c9a96e] text-xs font-mono">desde ${selected.design.price}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setSelected(s => ({ ...s, category: cat.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${selected.category === cat.id ? 'border-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] hover:border-[#8a7d6e]'}`}>
                        <span className="text-xl">{cat.icon}</span>
                        <p className="text-[#f0ebe4] text-sm mt-1">{cat.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 1: Date/Time */}
          {step === 1 && (
            <div>
              <h2 className="font-serif text-2xl text-[#f0ebe4] mb-6">¿Cuándo te gustaría venir?</h2>
              {/* Calendar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => { const d = new Date(calYear, calMonth - 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="text-[#8a7d6e] hover:text-[#f0ebe4] px-2">‹</button>
                  <p className="text-[#f0ebe4] font-serif">{MONTHS[calMonth]} {calYear}</p>
                  <button onClick={() => { const d = new Date(calYear, calMonth + 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="text-[#8a7d6e] hover:text-[#f0ebe4] px-2">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#8a7d6e] mb-2">
                  {['Do','Lu','Ma','Mi','Ju','Vi','Sá'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(calYear, calMonth, day);
                    const isSelected = selected.date?.toDateString() === date.toDateString();
                    const isPast = date < today;
                    return (
                      <button key={day} disabled={isPast} onClick={() => setSelected(s => ({ ...s, date }))}
                        className={`aspect-square text-xs rounded transition-colors ${isPast ? 'text-[#2e2518] cursor-not-allowed' : isSelected ? 'bg-[#c9a96e] text-[#0d0b0a] font-medium' : 'text-[#8a7d6e] hover:bg-[#2a2018] hover:text-[#f0ebe4]'}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Time slots */}
              {selected.date && (
                <div>
                  <p className="text-[#8a7d6e] text-xs font-mono mb-3">Horarios disponibles</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(t => (
                      <button key={t} onClick={() => setSelected(s => ({ ...s, time: t }))}
                        className={`py-2 text-xs rounded border transition-colors ${selected.time === t ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e]'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-2xl text-[#f0ebe4] mb-6">Tus datos de contacto</h2>
              <div className="space-y-4">
                {[
                  { label: 'Nombre completo', key: 'name', icon: User, type: 'text', placeholder: 'María García' },
                  { label: 'Teléfono (WhatsApp)', key: 'phone', icon: MessageSquare, type: 'tel', placeholder: '+52 55 1234 5678' },
                  { label: 'Email', key: 'email', icon: null, type: 'email', placeholder: 'maria@email.com' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">{f.label}</label>
                    <input value={(selected as any)[f.key]} onChange={e => setSelected(s => ({ ...s, [f.key]: e.target.value }))}
                      type={f.type} placeholder={f.placeholder}
                      className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e]" />
                  </div>
                ))}
                <div>
                  <label className="text-[#8a7d6e] text-xs font-mono mb-2 block">Notas adicionales (opcional)</label>
                  <textarea value={selected.notes} onChange={e => setSelected(s => ({ ...s, notes: e.target.value }))}
                    placeholder="Referencias de diseño, alergias, peticiones especiales..."
                    rows={3} className="w-full bg-[#2a2018] border border-[#2e2518] rounded px-3 py-2.5 text-sm text-[#f0ebe4] placeholder-[#8a7d6e] outline-none focus:border-[#c9a96e] resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-serif text-2xl text-[#f0ebe4] mb-6">Revisa tu reserva</h2>
              <div className="space-y-4">
                {[
                  { label: 'Servicio', value: selected.design?.name || CATEGORIES.find(c => c.id === selected.category)?.name || '—', icon: null },
                  { label: 'Fecha', value: selected.date?.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || '—', icon: Calendar },
                  { label: 'Hora', value: selected.time || '—', icon: Clock },
                  { label: 'Nombre', value: selected.name, icon: User },
                  { label: 'Contacto', value: selected.phone, icon: null },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-3 border-b border-[#2e2518]">
                    <span className="text-[#8a7d6e] text-sm">{row.label}</span>
                    <span className="text-[#f0ebe4] text-sm text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="px-5 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded hover:border-[#8a7d6e] hover:text-[#f0ebe4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="px-6 py-2.5 bg-[#c9a96e] text-[#0d0b0a] text-sm font-medium rounded hover:bg-[#d4b87e] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit}
                className="px-6 py-2.5 bg-[#d4613a] text-white text-sm font-medium rounded hover:bg-[#e06848] flex items-center gap-2 transition-colors">
                Confirmar reserva <Check size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal open={confirmOpen} onClose={() => { setConfirmOpen(false); setStep(0); setSelected(s => ({ ...s, date: null, time: '', name: '', phone: '', email: '' })); }} title="¡Reserva confirmada!" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#c9a96e]/15 border border-[#c9a96e]/30 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-[#c9a96e]" />
          </div>
          <h3 className="font-serif text-2xl text-[#f0ebe4] mb-2">¡Te esperamos!</h3>
          <p className="text-[#8a7d6e] text-sm mb-1">{selected.date?.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {selected.time}</p>
          <p className="text-[#8a7d6e] text-sm mb-6">Recibirás confirmación por WhatsApp al {selected.phone}</p>
          <p className="text-[#c9a96e] font-mono text-xs">Código: NS-{Math.random().toString(36).slice(2, 8).toUpperCase()}</p>
        </div>
      </Modal>
    </div>
  );
}

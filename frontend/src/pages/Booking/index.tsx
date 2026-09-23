import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Check, ChevronRight, Calendar, Clock, User, MessageSquare } from 'lucide-react';
import { DESIGNS, CATEGORIES, TIME_SLOTS } from '../../data';
import { CategoryIcon } from '../../shared/category-icons';
import { resolveImageUrl } from '../../shared/images';
import { usePublicCategories, usePublicDesigns } from '../../features/catalog/public-api';
import { useCreatePublicBooking } from '../../features/agenda/public-api';
import { Modal } from '../../components/ui/Modal';

const STEPS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmación'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function Booking() {
  const [params] = useSearchParams();
  const designId = params.get('design') ? Number(params.get('design')) : null;
  const [step, setStep] = useState(0);
  const catsQuery = usePublicCategories();
  const designsQuery = usePublicDesigns();
  const online = catsQuery.data !== undefined && designsQuery.data !== undefined;
  const slugById = new Map((catsQuery.data ?? []).map(c => [c.id, c.slug] as const));
  const liveCategories = online
    ? (catsQuery.data ?? []).map(c => ({ id: c.slug, name: c.name, icon: c.icon }))
    : CATEGORIES;
  const liveDesigns = online
    ? (designsQuery.data?.items ?? []).map(d => ({
        id: d.id,
        name: d.name,
        category: slugById.get(d.category_id) ?? '',
        price: d.price,
        duration: d.duration_min,
        image: resolveImageUrl(d.image_url) ?? '',
        description: d.description ?? '',
        technique: d.technique ?? '',
        tags: d.tags ?? [],
        occasion: d.occasion ?? '',
        complexity: d.complexity ?? '',
      }))
    : DESIGNS;
  const [selected, setSelected] = useState({
    design: designId ? liveDesigns.find(d => d.id === designId) : null,
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
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState('');
  const createBookingMut = useCreatePublicBooking();

  useEffect(() => {
    if (designId && !selected.design) {
      const found = liveDesigns.find(d => d.id === designId);
      if (found) setSelected(s => ({ ...s, design: found }));
    }
  }, [designId, liveDesigns, selected.design]);
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  // Horas ya pasadas (solo aplican si el día elegido es hoy).
  const isTodaySel = selected.date?.toDateString() === today.toDateString();
  const nowMin = today.getHours() * 60 + today.getMinutes();
  const slotPast = (t: string) => {
    if (!isTodaySel) return false;
    const [hh, mm] = t.split(':').map(Number);
    return hh * 60 + mm <= nowMin;
  };

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
    if (!selected.date || !selected.time) return;
    setSubmitError('');
    const [hh, mm] = selected.time.split(':').map(Number);
    const start = new Date(selected.date);
    start.setHours(hh, mm, 0, 0);
    const durationMin = selected.design?.duration ?? 60;
    const end = new Date(start.getTime() + durationMin * 60000);
    // ISO local (sin desfase UTC): mismo patrón que el panel admin.
    const toISO = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    createBookingMut.mutate(
      {
        name: selected.name.trim(),
        phone: selected.phone.trim(),
        email: selected.email.trim() || undefined,
        design_id: selected.design?.id ?? null,
        starts_at: toISO(start),
        ends_at: toISO(end),
        notes: selected.notes.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          setBookingId(res.id);
          setConfirmOpen(true);
        },
        onError: (err) => setSubmitError((err as Error).message || 'No se pudo reservar.'),
      },
    );
  };

  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <p className="font-mono text-[#f2d29b] text-xs tracking-[0.3em] uppercase mb-3">Reservas</p>
          <h1 className="font-serif text-4xl text-[#faf7f0]">Agenda tu cita</h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-0 mb-10 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 shrink-0 ${i <= step ? 'text-[#f2d29b]' : 'text-[#b3a893]'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono border transition-colors ${i < step ? 'bg-[#f2d29b] border-[#f2d29b] text-[#0d0b09]' : i === step ? 'border-[#f2d29b]' : 'border-[#403521]'}`}>
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs whitespace-nowrap">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`w-8 h-px mx-2 shrink-0 ${i < step ? 'bg-[#f2d29b]' : 'bg-[#403521]'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-[#14110c] border border-[#403521] rounded-xl p-6 sm:p-8">

          {/* Step 0: Service */}
          {step === 0 && (
            <div>
              <h2 className="font-serif text-2xl text-[#faf7f0] mb-6">¿Qué servicio deseas?</h2>

              <div className="mb-6">
                <label className="flex items-center gap-3 p-4 border border-[#403521] rounded-lg cursor-pointer hover:border-[#f2d29b] has-[:checked]:border-[#f2d29b] mb-3 transition-colors">
                  <input type="checkbox" className="accent-[#f2d29b]" checked={selected.isEvent} onChange={e => setSelected(s => ({ ...s, isEvent: e.target.checked }))} />
                  <div>
                    <p className="text-[#faf7f0] text-sm font-medium">Reserva para evento especial</p>
                    <p className="text-[#b3a893] text-xs">Bodas, XV años, grupos (formulario diferenciado)</p>
                  </div>
                </label>
              </div>

              {selected.isEvent ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[#b3a893] text-xs font-mono mb-2 block">Tipo de evento</label>
                    <select className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] outline-none focus:border-[#f2d29b]">
                      <option>Boda</option><option>XV Años</option><option>Graduación</option><option>Cumpleaños</option><option>Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[#b3a893] text-xs font-mono mb-2 block">Cantidad de personas</label>
                    <input value={selected.eventPeople} onChange={e => setSelected(s => ({ ...s, eventPeople: e.target.value }))}
                      className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] outline-none focus:border-[#f2d29b]" placeholder="Ej. 5" type="number" />
                  </div>
                  <div>
                    <label className="text-[#b3a893] text-xs font-mono mb-2 block">Fecha del evento</label>
                    <input value={selected.eventDate} onChange={e => setSelected(s => ({ ...s, eventDate: e.target.value }))}
                      className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] outline-none focus:border-[#f2d29b]" type="date" />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[#b3a893] text-xs font-mono mb-4">Diseño seleccionado o elige una categoría</p>
                  {selected.design && (
                    <div className="flex gap-3 p-3 bg-[#332a1d] border border-[#f2d29b]/30 rounded-lg mb-5">
                      <img src={selected.design.image} alt="" className="w-12 h-12 object-cover rounded" />
                      <div>
                        <p className="text-[#faf7f0] text-sm">{selected.design.name}</p>
                        <p className="text-[#f2d29b] text-xs font-mono">desde ₡{selected.design.price.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {liveCategories.map(cat => (
                      <button key={cat.id} onClick={() => setSelected(s => ({ ...s, category: cat.id }))}
                        className={`p-3 rounded-lg border text-left transition-colors ${selected.category === cat.id ? 'border-[#f2d29b] bg-[#f2d29b]/10' : 'border-[#403521] hover:border-[#b3a893]'}`}>
                        <span className="block text-[#f2d29b]"><CategoryIcon name={cat.icon} size={20} /></span>
                        <p className="text-[#faf7f0] text-sm mt-1">{cat.name}</p>
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
              <h2 className="font-serif text-2xl text-[#faf7f0] mb-6">¿Cuándo te gustaría venir?</h2>
              {/* Calendar — mini como admin */}
              <div className="mb-6 mx-auto w-full max-w-[320px] bg-[#14110c] border border-[#403521] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-serif text-sm text-[#faf7f0]">{MONTHS[calMonth]} {calYear}</p>
                  <div className="flex gap-1">
                    <button aria-label="Mes anterior" onClick={() => { const d = new Date(calYear, calMonth - 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="w-6 h-6 flex items-center justify-center rounded-md border border-[#403521] text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 transition-colors">‹</button>
                    <button aria-label="Mes siguiente" onClick={() => { const d = new Date(calYear, calMonth + 1); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }} className="w-6 h-6 flex items-center justify-center rounded-md border border-[#403521] text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 transition-colors">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-[#6b6355] mb-1.5">
                  {['D','L','M','M','J','V','S'].map((d, i) => <div key={`${d}${i}`} className="py-0.5">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="h-8" />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(calYear, calMonth, day);
                    const isSelected = selected.date?.toDateString() === date.toDateString();
                    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isToday = date.toDateString() === today.toDateString();
                    return (
                      <button key={day} disabled={isPast} onClick={() => setSelected(s => {
                        const sameDay = date.toDateString() === today.toDateString();
                        const [hh, mm] = s.time ? s.time.split(':').map(Number) : [0, 0];
                        const timeGone = !!s.time && sameDay && (hh * 60 + mm) <= nowMin;
                        return { ...s, date, time: timeGone ? '' : s.time };
                      })}
                        className={`h-8 rounded-lg flex items-center justify-center text-[11px] transition-all relative
                        ${isSelected ? 'bg-[#f2d29b] text-[#0d0b09] font-bold shadow-[0_2px_12px_rgba(242,210,155,0.35)]'
                          : isPast ? 'text-[#403521] cursor-not-allowed'
                          : 'text-[#b3a893] hover:bg-[#332a1d] hover:text-[#faf7f0]'}`}>
                        {day}
                        {!isSelected && isToday && <span className="absolute bottom-1 w-1 h-1 rounded-full bg-[#f2d29b]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Time slots */}
              {selected.date && (
                <div>
                  <p className="text-[#b3a893] text-xs font-mono mb-3">Horarios disponibles</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map(t => {
                      const past = slotPast(t);
                      const active = selected.time === t;
                      return (
                        <button key={t} disabled={past} onClick={() => setSelected(s => ({ ...s, time: t }))}
                          className={`py-2 text-xs rounded border transition-colors ${active ? 'border-[#f2d29b] text-[#f2d29b] bg-[#f2d29b]/10' : past ? 'border-[#403521] text-[#403521] cursor-not-allowed' : 'border-[#403521] text-[#b3a893] hover:border-[#b3a893]'}`}>
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Contact */}
          {step === 2 && (
            <div>
              <h2 className="font-serif text-2xl text-[#faf7f0] mb-6">Tus datos de contacto</h2>
              <div className="space-y-4">
                {[
                  { label: 'Nombre completo', key: 'name', icon: User, type: 'text', placeholder: 'María García' },
                  { label: 'Teléfono (WhatsApp)', key: 'phone', icon: MessageSquare, type: 'tel', placeholder: '+52 55 1234 5678' },
                  { label: 'Email', key: 'email', icon: null, type: 'email', placeholder: 'maria@email.com' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[#b3a893] text-xs font-mono mb-2 block">{f.label}</label>
                    <input value={(selected as any)[f.key]} onChange={e => setSelected(s => ({ ...s, [f.key]: e.target.value }))}
                      type={f.type} placeholder={f.placeholder}
                      className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] placeholder-[#b3a893] outline-none focus:border-[#f2d29b]" />
                  </div>
                ))}
                <div>
                  <label className="text-[#b3a893] text-xs font-mono mb-2 block">Notas adicionales (opcional)</label>
                  <textarea value={selected.notes} onChange={e => setSelected(s => ({ ...s, notes: e.target.value }))}
                    placeholder="Referencias de diseño, alergias, peticiones especiales..."
                    rows={3} className="w-full bg-[#332a1d] border border-[#403521] rounded px-3 py-2.5 text-sm text-[#faf7f0] placeholder-[#b3a893] outline-none focus:border-[#f2d29b] resize-none" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 className="font-serif text-2xl text-[#faf7f0] mb-6">Revisa tu reserva</h2>
              <div className="space-y-4">
                {[
                  { label: 'Servicio', value: selected.design?.name || liveCategories.find(c => c.id === selected.category)?.name || '—', icon: null },
                  { label: 'Fecha', value: selected.date?.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) || '—', icon: Calendar },
                  { label: 'Hora', value: selected.time || '—', icon: Clock },
                  { label: 'Nombre', value: selected.name, icon: User },
                  { label: 'Contacto', value: selected.phone, icon: null },
                ].map(row => (
                  <div key={row.label} className="flex justify-between py-3 border-b border-[#403521]">
                    <span className="text-[#b3a893] text-sm">{row.label}</span>
                    <span className="text-[#faf7f0] text-sm text-right">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
              className="px-5 py-2.5 border border-[#403521] text-[#b3a893] text-sm rounded hover:border-[#b3a893] hover:text-[#faf7f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Anterior
            </button>
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="px-6 py-2.5 bg-[#f2d29b] text-[#0d0b09] text-sm font-medium rounded hover:bg-[#f7ddab] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors">
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={createBookingMut.isPending}
                className="px-6 py-2.5 bg-[#d4613a] text-white text-sm font-medium rounded hover:bg-[#e06848] disabled:opacity-50 flex items-center gap-2 transition-colors">
                {createBookingMut.isPending ? 'Reservando…' : (<>Confirmar reserva <Check size={14} /></>)}
              </button>
            )}
          </div>
          {submitError && (
            <p role="alert" className="mt-4 p-3 bg-[#d4613a]/10 border border-[#d4613a]/30 rounded text-[#e08a6d] text-xs">{submitError}</p>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal open={confirmOpen} onClose={() => { setConfirmOpen(false); setBookingId(null); setStep(0); setSelected(s => ({ ...s, date: null, time: '', name: '', phone: '', email: '' })); }} title="¡Reserva recibida!" size="sm">
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-[#f2d29b]/15 border border-[#f2d29b]/30 flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-[#f2d29b]" />
          </div>
          <h3 className="font-serif text-2xl text-[#faf7f0] mb-2">¡Te esperamos!</h3>
          <p className="text-[#b3a893] text-sm mb-1">{selected.date?.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · {selected.time}</p>
          <p className="text-[#b3a893] text-sm mb-6">Te confirmaremos por WhatsApp al {selected.phone} (queda en estado pendiente hasta que el estudio la confirme).</p>
          <p className="text-[#f2d29b] font-mono text-xs">Reserva #{bookingId ?? '—'}</p>
        </div>
      </Modal>
    </div>
  );
}

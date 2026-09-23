import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronRight } from 'lucide-react';
import { DESIGNS } from '../../data';
import { useContactInfo } from '../../features/contact/contact-api';
import { usePublicDesigns, type PublicDesign } from '../../features/catalog/public-api';
import { isOpenLegacy, isOpenNow } from '../../features/contact/open-hours';
import { resolveImageUrl } from '../../shared/images';

type Reco = { id: number; name: string; price: number; image: string };

type Message = { id: number; from: 'bot' | 'user'; text: string; options?: string[]; designs?: Reco[] };

/** Quiz paso 0 → occasion del backend (filtra /api/v1/designs?occasion=). */
const QUIZ_OCCASION: Record<string, string> = {
  'Boda / XV años': 'Boda',
  'Diario / Trabajo': 'Diario',
  'Fiesta / Evento': 'Fiesta/Evento',
  'Minimalista': 'Minimalista',
};

const toReco = (d: PublicDesign): Reco => ({
  id: d.id, name: d.name, price: d.price, image: resolveImageUrl(d.image_url) ?? '',
});

const STATIC_RECO: Reco[] = DESIGNS.slice(0, 3).map(d => ({ id: d.id, name: d.name, price: d.price, image: d.image }));

const QUIZ_STEPS = [
  { q: '¿Cuál es la ocasión?', opts: ['Boda / XV años', 'Diario / Trabajo', 'Fiesta / Evento', 'Minimalista'] },
  { q: '¿Tu color favorito ahora mismo?', opts: ['Nude / Beige', 'Rojo / Terracota', 'Negro / Oscuro', 'Rosa / Lavanda', 'Metálico'] },
  { q: '¿Cuánto mantenimiento te gusta?', opts: ['Muy poco (dura y olvida)', 'Moderado (cada 3 semanas)', 'No me importa si es artístico'] },
];

const INITIAL: Message = {
  id: 0, from: 'bot',
  text: '✨ Hola, soy tu asesora de Nails Studio. ¿En qué te ayudo hoy?',
  options: ['Ver precios', 'Agendar cita', 'Ubicación y horario', 'Quiero que me recomienden'],
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL]);
  const [quizStep, setQuizStep] = useState(-1);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const { data: contactInfo } = useContactInfo();
  const studioAddress = contactInfo?.address.replace(/\n/g, ', ') ?? 'Av. Artística 2410, local 3';
  const studioSchedule = contactInfo?.schedule.replace(/\n/g, ' | ') ?? 'Lunes–Sábado: 10:00–19:00 | Domingo: 11:00–16:00';
  const studioOpen = contactInfo ? (isOpenNow(contactInfo.schedule) ?? isOpenLegacy()) : isOpenLegacy();
  /** WhatsApp real del estudio (contact/info) → link wa.me con dígitos normalizados. */
  const waDigits = (contactInfo?.whatsapp ?? '').replace(/\D/g, '');
  const waLink = waDigits
    ? `https://wa.me/${waDigits}?text=${encodeURIComponent('Hola Nails Studio, quiero información')}`
    : null;
  /** Catálogo vivo solo con el chat abierto (el bot vive en el Layout global). */
  const liveDesigns = usePublicDesigns('', '', '', open);
  const [quizOccasion, setQuizOccasion] = useState<string | null>(null);
  const liveByOccasion = usePublicDesigns('', '', quizOccasion ?? '', open && quizOccasion !== null);
  const [pendingReco, setPendingReco] = useState(false);
  /** Rango de precios real; fallback al texto genérico si aún no hay datos (offline). */
  const livePrices = liveDesigns.data?.items.map(d => d.price) ?? [];
  const priceText = livePrices.length
    ? `Nuestros diseños van desde ₡${Math.min(...livePrices).toLocaleString()} hasta ₡${Math.max(...livePrices).toLocaleString()}. El catálogo completo con todos los precios está disponible en la sección Catálogo. ¿Te ayudo con algo más?`
    : 'Los precios dependen del diseño y la técnica — desde Express hasta Elaborado. El catálogo completo con todos los precios está disponible en la sección Catálogo. ¿Te ayudo con algo más?';
  const bottomRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(1);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMsg = (msg: Omit<Message, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: idCounter.current++ }]);
  };

  /** Inserta la recomendación pendiente cuando llega el catálogo vivo por ocasión. */
  useEffect(() => {
    if (!pendingReco) return;
    if (liveByOccasion.data) {
      const items = liveByOccasion.data.items.slice(0, 3).map(toReco);
      const general = (liveDesigns.data?.items ?? []).slice(0, 3).map(toReco);
      const picks = items.length ? items : general.length ? general : STATIC_RECO;
      addMsg({ from: 'bot', text: '¡Listo! Para tu ocasión te recomiendo:', designs: picks });
      setPendingReco(false);
      setQuizOccasion(null);
    } else if (liveByOccasion.isError) {
      const general = (liveDesigns.data?.items ?? []).slice(0, 3).map(toReco);
      addMsg({ from: 'bot', text: 'Estos son los favoritos del momento:', designs: general.length ? general : STATIC_RECO });
      setPendingReco(false);
      setQuizOccasion(null);
    }
  }, [pendingReco, liveByOccasion.data, liveByOccasion.isError]);

  /** Recomendación inmediata: vivos por ocasión → generales vivos → estáticos (offline). */
  const recommendLive = () => {
    const live = (liveByOccasion.data?.items ?? []).slice(0, 3).map(toReco);
    const general = (liveDesigns.data?.items ?? []).slice(0, 3).map(toReco);
    const picks = live.length ? live : general.length ? general : STATIC_RECO;
    const note = live.length
      ? '¡Perfecto! Basándome en tus respuestas, te recomiendo estos diseños:'
      : '¡Perfecto! Estos son los favoritos del momento:';
    setTimeout(() => addMsg({ from: 'bot', text: note, designs: picks }), 400);
    setQuizOccasion(null);
  };

  const handleOption = (opt: string) => {
    addMsg({ from: 'user', text: opt });
    if (quizStep >= 0) {
      const answers = [...quizAnswers, opt];
      setQuizAnswers(answers);
      if (quizStep === 0) setQuizOccasion(QUIZ_OCCASION[opt] ?? null);
      if (quizStep < QUIZ_STEPS.length - 1) {
        setTimeout(() => {
          setQuizStep(s => s + 1);
          addMsg({ from: 'bot', text: QUIZ_STEPS[quizStep + 1].q, options: QUIZ_STEPS[quizStep + 1].opts });
        }, 400);
      } else {
        setQuizStep(-1);
        setQuizAnswers([]);
        if (quizOccasion && !liveByOccasion.data && !liveByOccasion.isError) {
          setPendingReco(true);
          setTimeout(() => addMsg({ from: 'bot', text: 'Buscando diseños para tu ocasión… ✨' }), 400);
        } else {
          recommendLive();
        }
      }
      return;
    }
    setTimeout(() => {
      if (opt === 'Ver precios') {
        addMsg({ from: 'bot', text: priceText, options: ['Agendar cita', 'Quiero que me recomienden', 'Cerrar'] });
      } else if (opt === 'Agendar cita') {
        addMsg({ from: 'bot', text: 'Puedes reservar directamente aquí 👉 <a href="/reservas" class="text-[#f2d29b] underline">Ir a Reservas</a>. O dime tu servicio y te ayudo a seleccionarlo.', options: ['Quiero que me recomienden', 'Cerrar'] });
      } else if (opt === 'Ubicación y horario') {
        addMsg({ from: 'bot', text: `📍 Estamos en ${studioAddress}.\n⏰ ${studioSchedule}.\nAhora mismo ${studioOpen ? '<span class="text-[#8aab8a]">estamos abiertos</span> ✓' : '<span class="text-[#e08a6d]">estamos cerrados</span> · abrimos pronto'}${waLink ? `\n💬 <a href="${waLink}" target="_blank" rel="noreferrer" class="text-[#f2d29b] underline">Escríbenos por WhatsApp</a>` : ''}`, options: ['Agendar cita', 'Ver precios', 'Cerrar'] });
      } else if (opt === 'Quiero que me recomienden') {
        setQuizStep(0);
        setQuizAnswers([]);
        addMsg({ from: 'bot', text: QUIZ_STEPS[0].q, options: QUIZ_STEPS[0].opts });
      } else {
        setOpen(false);
        setMessages([INITIAL]);
        setQuizStep(-1);
        setQuizOccasion(null);
        setPendingReco(false);
      }
    }, 350);
  };

  const handleSend = () => {
    if (!inputVal.trim()) return;
    addMsg({ from: 'user', text: inputVal });
    setInputVal('');
    setTimeout(() => addMsg({ from: 'bot', text: `Gracias por tu mensaje. Para una respuesta inmediata usa los botones de abajo${waLink ? ` o <a href="${waLink}" target="_blank" rel="noreferrer" class="text-[#f2d29b] underline">escríbenos por WhatsApp</a>` : ', o escríbenos por WhatsApp'}.`, options: ['Ver precios', 'Agendar cita', 'Cerrar'] }), 400);
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#f2d29b] text-[#0d0b09] shadow-xl hover:bg-[#f7ddab] hover:scale-105 flex items-center justify-center"
        aria-label="Abrir chat"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 glass border border-[#403521] rounded-2xl shadow-2xl flex flex-col animate-scale-in overflow-hidden">
          <div className="px-4 py-3 bg-[#332a1d] border-b border-[#403521] flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f2d29b] flex items-center justify-center text-[#0d0b09] text-xs font-serif">NS</div>
            <div>
              <p className="text-sm text-[#faf7f0] font-medium">Nails Studio</p>
              <p className="text-xs text-[#8aab8a]">● En línea</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] ${msg.from === 'user' ? 'bg-[#f2d29b] text-[#0d0b09] rounded-2xl rounded-br-sm' : 'bg-[#332a1d] text-[#faf7f0] rounded-2xl rounded-bl-sm'} px-3.5 py-2.5 text-sm leading-relaxed`}>
                  {msg.designs ? (
                    <div className="space-y-2">
                      <p>{msg.text}</p>
                      {msg.designs.map(d => (
                        <div key={d.id} className="flex gap-2 bg-[#14110c] rounded-lg p-2">
                          {d.image ? (
                            <img src={d.image} alt={d.name} className="w-12 h-12 object-cover rounded" />
                          ) : null}
                          <div>
                            <p className="font-medium text-[#f2d29b] text-xs">{d.name}</p>
                            <p className="text-[#b3a893] text-xs">desde ₡{d.price.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : msg.from === 'user' ? (
                    <span className="whitespace-pre-line break-words">{msg.text}</span>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                  )}
                  {msg.options && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      {msg.options.map(opt => (
                        <button key={opt} onClick={() => handleOption(opt)} className="flex items-center gap-1 text-xs bg-[#1e1912] hover:bg-[#f2d29b] hover:text-[#0d0b09] text-[#f2d29b] px-3 py-1.5 rounded-full text-left transition-colors">
                          <ChevronRight size={10} /> {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-[#403521] flex gap-2">
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Escribe un mensaje..."
              className="flex-1 bg-[#332a1d] border border-[#403521] rounded-full px-4 py-2 text-sm text-[#faf7f0] placeholder-[#b3a893] outline-none focus:border-[#f2d29b]"
            />
            <button onClick={handleSend} className="w-9 h-9 bg-[#f2d29b] text-[#0d0b09] rounded-full flex items-center justify-center hover:bg-[#f7ddab]">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

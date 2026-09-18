import { Link } from 'react-router';

export function About() {
  return (
    <div className="min-h-screen pt-24 px-6 pb-20">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Nosotros</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#f0ebe4] leading-[1.1]">El arte de crear<br />belleza con precisión</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
          <div>
            <img
              src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&h=900&fit=crop&auto=format"
              alt="La dueña trabajando"
              className="w-full rounded-xl opacity-80"
            />
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[#c9a96e] text-xs tracking-widest uppercase mb-4">Nuestra historia</p>
            <p className="text-[#c8bfb0] leading-relaxed mb-4">
              Nails Studio nació de una convicción simple: las uñas son un lienzo, y cada clienta merece arte personalizado, no un template repetido.
            </p>
            <p className="text-[#8a7d6e] leading-relaxed mb-4">
              Fundamos el estudio en 2019 con una mesa, una lampara UV y una obsesión por la calidad. Hoy somos un equipo de artistas especializadas con más de 5,000 diseños únicos en nuestro haber.
            </p>
            <p className="text-[#8a7d6e] leading-relaxed">
              Cada cita es una colaboración. Escuchamos, diseñamos y ejecutamos con la precisión de quien ama lo que hace.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#2e2518] mb-20">
          {[
            { n: '01', title: 'Calidad sin compromiso', desc: 'Solo usamos materiales premium con certificación internacional.' },
            { n: '02', title: 'Arte personalizado', desc: 'Ningún diseño se repite. Cada uña es única como quien la lleva.' },
            { n: '03', title: 'Higiene estricta', desc: 'Protocolos de esterilización profesional en cada servicio.' },
          ].map(v => (
            <div key={v.n} className="bg-[#0d0b0a] p-8">
              <p className="font-mono text-[#c9a96e] text-xs mb-4">{v.n}</p>
              <p className="font-serif text-[#f0ebe4] text-lg mb-2">{v.title}</p>
              <p className="text-[#8a7d6e] text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p className="font-serif text-3xl text-[#f0ebe4] mb-6">¿Lista para tu transformación?</p>
          <Link to="/reservas" className="inline-flex items-center gap-2 px-8 py-4 bg-[#c9a96e] text-[#0d0b0a] font-medium rounded hover:bg-[#d4b87e] transition-colors">
            Reservar cita
          </Link>
        </div>
      </div>
    </div>
  );
}

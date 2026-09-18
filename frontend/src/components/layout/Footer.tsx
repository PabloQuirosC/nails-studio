import { Link } from 'react-router';
import { Share2, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-[#2e2518] mt-24 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl text-[#f0ebe4] mb-3">Nails <span className="text-[#c9a96e]">Studio</span></p>
          <p className="text-[#8a7d6e] text-sm leading-relaxed max-w-xs">Arte de uñas premium. Cada diseño es una obra única creada para expresar tu personalidad.</p>
          <div className="flex gap-4 mt-5">
            <a href="#" className="text-[#8a7d6e] hover:text-[#c9a96e]"><Share2 size={18} /></a>
            <a href="#" className="text-[#8a7d6e] hover:text-[#c9a96e]"><Heart size={18} /></a>
          </div>
        </div>
        <div>
          <p className="text-[#f0ebe4] text-sm font-medium mb-4">Servicios</p>
          <ul className="space-y-2 text-[#8a7d6e] text-sm">
            {['Acrílicas', 'Gel X', 'Semipermanente', 'Pedicure Spa', 'Mano Alzada'].map(s => (
              <li key={s}><Link to="/catalogo" className="hover:text-[#c9a96e]">{s}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[#f0ebe4] text-sm font-medium mb-4">Información</p>
          <ul className="space-y-2 text-[#8a7d6e] text-sm">
            {[['Nosotros', '/nosotros'], ['Blog', '/blog'], ['Galería', '/galeria'], ['Gift Cards', '/referidos'], ['Contacto', '/contacto']].map(([l, to]) => (
              <li key={to}><Link to={to} className="hover:text-[#c9a96e]">{l}</Link></li>
            ))}
          </ul>
          <div className="mt-6 text-[#8a7d6e] text-xs space-y-1">
            <p>Lun – Sáb: 10:00 – 19:00</p>
            <p>Domingo: 11:00 – 16:00</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#2e2518] flex flex-col sm:flex-row justify-between gap-2 text-[#8a7d6e] text-xs">
        <p>© 2026 Nails Studio. Todos los derechos reservados.</p>
        <Link to="/admin" className="hover:text-[#c9a96e]">Admin ↗</Link>
      </div>
    </footer>
  );
}

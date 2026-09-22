import { Link } from 'react-router';
import { Camera, MessageCircle } from 'lucide-react';
import { CATEGORIES } from '../../data';

export function Footer() {
  return (
    <footer className="border-t border-[#403521] mt-24 px-6 py-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <p className="font-serif text-2xl text-[#faf7f0] mb-3">Nails <span className="text-[#f2d29b]">Studio</span></p>
          <p className="text-[#b3a893] text-sm leading-relaxed max-w-xs">Arte de uñas premium. Cada diseño es una obra única creada para expresar tu personalidad.</p>
          <div className="flex gap-3 mt-5">
            <Link to="/contacto" aria-label="Escríbenos por WhatsApp"
              className="w-9 h-9 rounded-full border border-[#403521] flex items-center justify-center text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 active:scale-[0.97] transition-[transform,color,border-color] duration-200">
              <MessageCircle size={16} />
            </Link>
            <Link to="/contacto" aria-label="Síguenos en Instagram"
              className="w-9 h-9 rounded-full border border-[#403521] flex items-center justify-center text-[#b3a893] hover:text-[#f2d29b] hover:border-[#f2d29b]/40 active:scale-[0.97] transition-[transform,color,border-color] duration-200">
              <Camera size={16} />
            </Link>
          </div>
        </div>
        <div>
          <p className="text-[#faf7f0] text-sm font-medium mb-4">Servicios</p>
          <ul className="space-y-2 text-[#b3a893] text-sm">
            {CATEGORIES.slice(0, 5).map(c => (
              <li key={c.id}><Link to={`/catalogo?categoria=${c.id}`} className="hover:text-[#f2d29b] transition-colors duration-200">{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[#faf7f0] text-sm font-medium mb-4">Información</p>
          <ul className="space-y-2 text-[#b3a893] text-sm">
            {[['Nosotros', '/nosotros'], ['Blog', '/blog'], ['Galería', '/galeria'], ['Referidos', '/referidos'], ['Contacto', '/contacto']].map(([l, to]) => (
              <li key={to}><Link to={to} className="hover:text-[#f2d29b]">{l}</Link></li>
            ))}
          </ul>
          <div className="mt-6 text-[#b3a893] text-xs space-y-1">
            <p>Lun – Sáb: 10:00 – 19:00</p>
            <p>Domingo: 11:00 – 16:00</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#403521] flex flex-col sm:flex-row justify-between gap-2 text-[#b3a893] text-xs">
        <p>© 2026 Nails Studio. Todos los derechos reservados.</p>
        <Link to="/admin" className="hover:text-[#f2d29b]">Admin ↗</Link>
      </div>
    </footer>
  );
}

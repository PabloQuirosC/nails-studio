import { AtSign, Camera, Clapperboard, Globe, Music2, Phone, Share2, type LucideIcon } from 'lucide-react';

/** Icono por clave de red social (lucide 1.x no trae marcas: se usan genéricos). */
const MAP: Record<string, LucideIcon> = {
  facebook: Share2,
  instagram: Camera,
  tiktok: Music2,
  youtube: Clapperboard,
  whatsapp: Phone,
  web: Globe,
};

export function SocialIcon({ icon, size = 15 }: { icon: string; size?: number }) {
  const Cmp = MAP[icon.toLowerCase()] ?? AtSign;
  return <Cmp size={size} className="text-[#f2d29b]" aria-hidden="true" />;
}

/** Iconos de categorías: claves estables → componentes Lucide (cero emojis en UI). */
import {
  Brush,
  Crown,
  Flower2,
  Footprints,
  Gem,
  Heart,
  Layers,
  Leaf,
  Palette,
  Sparkles,
  Star,
  Wand2,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_ICONS = {
  gem: Gem,
  sparkles: Sparkles,
  flower: Flower2,
  footprints: Footprints,
  layers: Layers,
  leaf: Leaf,
  wand: Wand2,
  brush: Brush,
  palette: Palette,
  heart: Heart,
  star: Star,
  crown: Crown,
} as const satisfies Record<string, LucideIcon>;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

export function CategoryIcon({ name, size = 14, className }: { name: string; size?: number; className?: string }) {
  const Icon = (CATEGORY_ICONS as Record<string, LucideIcon>)[name] ?? Sparkles;
  return <Icon size={size} className={className} />;
}

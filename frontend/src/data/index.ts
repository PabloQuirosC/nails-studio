export const CATEGORIES = [
  { id: 'acrilicas', name: 'Acrílicas', icon: 'gem', color: '#f2d29b', description: 'Extensiones resistentes y versátiles' },
  { id: 'gel-x', name: 'Gel X', icon: 'sparkles', color: '#9b8ea8', description: 'Gel ultra-flexible sin daño' },
  { id: 'semipermanente', name: 'Semipermanente', icon: 'flower', color: '#c8a0a0', description: 'Color duradero hasta 3 semanas' },
  { id: 'pedicure', name: 'Pedicure Spa', icon: 'footprints', color: '#8ab0c8', description: 'Tratamiento completo de pies' },
  { id: 'relieves', name: 'Relieves', icon: 'layers', color: '#a89b8e', description: 'Texturas tridimensionales' },
  { id: 'encapsulados', name: 'Encapsulados', icon: 'leaf', color: '#8aab8a', description: 'Elementos atrapados en gel' },
  { id: 'efectos', name: 'Efectos', icon: 'wand', color: '#d4a06e', description: 'Chrome, holográfico, cat eye' },
  { id: 'mano-alzada', name: 'Mano Alzada', icon: 'brush', color: '#d4613a', description: 'Arte pintado a mano' },
];

export const OCCASIONS = ['Boda', 'Diario', 'Fiesta/Evento', 'Minimalista'];
export const COMPLEXITIES = ['Express', 'Elaborado'];

export const DESIGNS = [
  { id: 1, name: 'French Cristal', category: 'acrilicas', occasion: 'Boda', complexity: 'Express', price: 22500, duration: 60, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Clásico french reinventado con acabado cristalino premium.', technique: 'Acrílico + gel de punta en polvo cromado', tags: ['french', 'cristal', 'elegante'] },
  { id: 2, name: 'Ombre Terracota', category: 'gel-x', occasion: 'Diario', complexity: 'Express', price: 19000, duration: 75, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Degradado cálido de nude a terracota con textura seda.', technique: 'Gel X + efecto ombre con pigmento', tags: ['ombre', 'terracota', 'nude'] },
  { id: 3, name: 'Botanical Garden', category: 'mano-alzada', occasion: 'Fiesta/Evento', complexity: 'Elaborado', price: 37500, duration: 120, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Flores silvestres pintadas a mano con micro-detalle en cada uña.', technique: 'Gel + acrílico + pintura nail art', tags: ['floral', 'artístico', 'detallado'] },
  { id: 4, name: 'Cat Eye Galaxia', category: 'efectos', occasion: 'Fiesta/Evento', complexity: 'Express', price: 21000, duration: 60, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Efecto magnético multicromo que cambia con la luz.', technique: 'Gel semipermanente + pigmento magnético', tags: ['cat-eye', 'chrome', 'efecto'] },
  { id: 5, name: 'Encapsulado Flores Secas', category: 'encapsulados', occasion: 'Diario', complexity: 'Elaborado', price: 32500, duration: 90, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Flores reales preservadas dentro del gel para un look único.', technique: 'Gel + flores secas + acabado cristal', tags: ['flores', 'encapsulado', 'natural'] },
  { id: 6, name: 'Minimalista Nude', category: 'semipermanente', occasion: 'Minimalista', complexity: 'Express', price: 14000, duration: 45, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Clean girl aesthetic con tonos nude que alargan la mano.', technique: 'Semipermanente + base rubber nude', tags: ['nude', 'minimalista', 'clean'] },
  { id: 7, name: 'Relieve 3D Mariposa', category: 'relieves', occasion: 'Boda', complexity: 'Elaborado', price: 42500, duration: 150, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Mariposas en relieve con cristales Swarovski.', technique: 'Acrílico 3D + cristales + pigmento perlado', tags: ['mariposa', 'crystals', 'relieve'] },
  { id: 8, name: 'Spa Luxury Pedicure', category: 'pedicure', occasion: 'Diario', complexity: 'Express', price: 17500, duration: 60, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Tratamiento completo con exfoliación, masaje y semipermanente.', technique: 'Exfoliación + masaje + semipermanente', tags: ['spa', 'pedicure', 'tratamiento'] },
  { id: 9, name: 'Chrome Espejo Dorado', category: 'efectos', occasion: 'Fiesta/Evento', complexity: 'Express', price: 20000, duration: 60, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Espejo metálico dorado de alta intensidad.', technique: 'Semipermanente + polvo chrome dorado', tags: ['chrome', 'dorado', 'metalico'] },
  { id: 10, name: 'Gel X Almond Natural', category: 'gel-x', occasion: 'Minimalista', complexity: 'Express', price: 18000, duration: 70, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Forma almendra con gel ultra-flexible en tonos naturales.', technique: 'Gel X + base sheer pink', tags: ['almond', 'natural', 'gel'] },
  { id: 11, name: 'Marble Luxe', category: 'acrilicas', occasion: 'Boda', complexity: 'Elaborado', price: 35000, duration: 120, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Mármol blanco con venas doradas pintado a mano sobre acrílico.', technique: 'Acrílico + pintura marble + hoja de oro', tags: ['marble', 'oro', 'lujo'] },
  { id: 12, name: 'Abstract Ink', category: 'mano-alzada', occasion: 'Fiesta/Evento', complexity: 'Elaborado', price: 40000, duration: 135, image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format', description: 'Trazos abstractos en tinta con estética galería de arte.', technique: 'Gel + tinta nail art + acabado matte', tags: ['abstract', 'ink', 'artístico'] },
];

export const TESTIMONIALS = [
  { id: 1, name: 'Valentina Ríos', text: 'Llevaba años buscando un estudio que entendiera que quería arte, no solo color. Nails Studio es exactamente eso.', design: 'Botanical Garden', rating: 5, avatar: 'V' },
  { id: 2, name: 'Camila Serrano', text: 'El encapsulado con flores reales me duró 5 semanas perfecto. La calidad es incomparable y la atención es increíble.', design: 'Encapsulado Flores Secas', rating: 5, avatar: 'C' },
  { id: 3, name: 'María José López', text: 'Vine para mi boda y el equipo me hizo los relieves más hermosos. Todas mis invitadas querían el contacto del estudio.', design: 'Relieve 3D Mariposa', rating: 5, avatar: 'M' },
  { id: 4, name: 'Andrea Fuentes', text: 'El catálogo tiene opciones para todos los gustos y la reserva en línea es rapidísima. Volveré cada mes sin duda.', design: 'Marble Luxe', rating: 5, avatar: 'A' },
];

export const BLOG_POSTS = [
  { id: 1, title: 'Cómo prolongar la duración de tu esmaltado semipermanente', excerpt: 'Pequeños hábitos que marcan la diferencia entre 2 y 4 semanas de durabilidad perfecta.', category: 'Cuidados', date: '12 Sep 2026', readTime: '4 min', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=500&fit=crop&auto=format' },
  { id: 2, title: 'Tendencias otoño 2026: los diseños que dominarán la temporada', excerpt: 'Desde el minimal aesthetic hasta el maximalism floral, analizamos lo que viene fuerte.', category: 'Tendencias', date: '5 Sep 2026', readTime: '6 min', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=500&fit=crop&auto=format' },
  { id: 3, title: 'Gel X vs Acrílico: ¿cuál es mejor para ti?', excerpt: 'Comparamos durabilidad, daño, precio y versatilidad para que tomes la mejor decisión.', category: 'Educación', date: '28 Ago 2026', readTime: '5 min', image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=500&fit=crop&auto=format' },
];

export const NAIL_COLORS = [
  { id: 'nude-blush', name: 'Blush Nude', hex: '#e8c9be' },
  { id: 'terracotta', name: 'Terracota', hex: '#c4633a' },
  { id: 'burgundy', name: 'Burgundy', hex: '#6b2035' },
  { id: 'black', name: 'Onyx', hex: '#1a1a1a' },
  { id: 'white', name: 'Snow', hex: '#f8f5f2' },
  { id: 'rose-gold', name: 'Rose Gold', hex: '#c9a096' },
  { id: 'mauve', name: 'Mauve', hex: '#9b7a8b' },
  { id: 'coral', name: 'Coral Vivo', hex: '#e85d42' },
  { id: 'gold', name: 'Dorado', hex: '#f2d29b' },
  { id: 'teal', name: 'Verde Jade', hex: '#3a7a7a' },
  { id: 'lavender', name: 'Lavanda', hex: '#9b8ec4' },
  { id: 'red', name: 'Rojo Clásico', hex: '#c41e3a' },
  { id: 'peach', name: 'Durazno', hex: '#e8a07a' },
  { id: 'navy', name: 'Navy', hex: '#1a2a4a' },
  { id: 'chrome-silver', name: 'Chrome Silver', hex: '#c8c8d4', metallic: true },
  { id: 'chrome-gold', name: 'Chrome Gold', hex: '#d4b86a', metallic: true },
];

export const NAIL_SHAPES = [
  { id: 'square', name: 'Cuadrada' },
  { id: 'round', name: 'Redonda' },
  { id: 'oval', name: 'Oval' },
  { id: 'almond', name: 'Almendra' },
  { id: 'coffin', name: 'Ataúd' },
  { id: 'stiletto', name: 'Stiletto' },
];

export const NAIL_DESIGNS_3D = [
  { id: 'solid', name: 'Sólido' },
  { id: 'french', name: 'French' },
  { id: 'ombre', name: 'Ombré' },
  { id: 'marble', name: 'Mármol' },
  { id: 'glitter', name: 'Glitter' },
  { id: 'chrome', name: 'Chrome' },
];

export const TIME_SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'];


"""Seed del estudio: 8 categorías + 12 diseños + 4 clientas demo (idempotente, upsert)."""
import logging

from sqlalchemy import select

from app.infrastructure.db.session import session_factory
from app.infrastructure.models.catalog import Category, Design
from app.infrastructure.models.clients import Client
from app.infrastructure.models.content import Post

logger = logging.getLogger(__name__)

CATEGORIES = [
    ("acrilicas", "Acrílicas", "gem", "#c9a96e", "Extensiones resistentes y versátiles"),
    ("gel-x", "Gel X", "sparkles", "#9b8ea8", "Gel ultra-flexible sin daño"),
    ("semipermanente", "Semipermanente", "flower", "#c8a0a0", "Color duradero hasta 3 semanas"),
    ("pedicure", "Pedicure Spa", "footprints", "#8ab0c8", "Tratamiento completo de pies"),
    ("relieves", "Relieves", "layers", "#a89b8e", "Texturas tridimensionales"),
    ("encapsulados", "Encapsulados", "leaf", "#8aab8a", "Elementos atrapados en gel"),
    ("efectos", "Efectos", "wand", "#d4a06e", "Chrome, holográfico, cat eye"),
    ("mano-alzada", "Mano Alzada", "brush", "#d4613a", "Arte pintado a mano"),
]

IMG = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=600&fit=crop&auto=format"

DESIGNS = [
    ("French Cristal", "acrilicas", "Boda", "Express", 22500, 60, "Clásico french reinventado con acabado cristalino premium.", "Acrílico + gel de punta en polvo cromado", ["french", "cristal", "elegante"]),
    ("Ombre Terracota", "gel-x", "Diario", "Express", 19000, 75, "Degradado cálido de nude a terracota con textura seda.", "Gel X + efecto ombre con pigmento", ["ombre", "terracota", "nude"]),
    ("Botanical Garden", "mano-alzada", "Fiesta/Evento", "Elaborado", 37500, 120, "Flores silvestres pintadas a mano con micro-detalle en cada uña.", "Gel + acrílico + pintura nail art", ["floral", "artístico", "detallado"]),
    ("Cat Eye Galaxia", "efectos", "Fiesta/Evento", "Express", 21000, 60, "Efecto magnético multicromo que cambia con la luz.", "Gel semipermanente + pigmento magnético", ["cat-eye", "chrome", "efecto"]),
    ("Encapsulado Flores Secas", "encapsulados", "Diario", "Elaborado", 32500, 90, "Flores reales preservadas dentro del gel para un look único.", "Gel + flores secas + acabado cristal", ["flores", "encapsulado", "natural"]),
    ("Minimalista Nude", "semipermanente", "Minimalista", "Express", 14000, 45, "Clean girl aesthetic con tonos nude que alargan la mano.", "Semipermanente + base rubber nude", ["nude", "minimalista", "clean"]),
    ("Relieve 3D Mariposa", "relieves", "Boda", "Elaborado", 42500, 150, "Mariposas en relieve con cristales Swarovski.", "Acrílico 3D + cristales + pigmento perlado", ["mariposa", "crystals", "relieve"]),
    ("Spa Luxury Pedicure", "pedicure", "Diario", "Express", 17500, 60, "Tratamiento completo con exfoliación, masaje y semipermanente.", "Exfoliación + masaje + semipermanente", ["spa", "pedicure", "tratamiento"]),
    ("Chrome Espejo Dorado", "efectos", "Fiesta/Evento", "Express", 20000, 60, "Espejo metálico dorado de alta intensidad.", "Semipermanente + polvo chrome dorado", ["chrome", "dorado", "metalico"]),
    ("Gel X Almond Natural", "gel-x", "Minimalista", "Express", 18000, 70, "Forma almendra con gel ultra-flexible en tonos naturales.", "Gel X + base sheer pink", ["almond", "natural", "gel"]),
    ("Marble Luxe", "acrilicas", "Boda", "Elaborado", 35000, 120, "Mármol blanco con venas doradas pintado a mano sobre acrílico.", "Acrílico + pintura marble + hoja de oro", ["marble", "oro", "lujo"]),
    ("Abstract Ink", "mano-alzada", "Fiesta/Evento", "Elaborado", 40000, 135, "Trazos abstractos en tinta con estética galería de arte.", "Gel + tinta nail art + acabado matte", ["abstract", "ink", "artístico"]),
]

CLIENTS = [
    ("Valentina Ríos", "+52 55 1001", 12, 240),
    ("Camila Serrano", "+52 55 1002", 8, 160),
    ("María José López", "+52 55 1003", 5, 100),
    ("Andrea Fuentes", "+52 55 1004", 3, 60),
]

IMG_BLOG = "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=500&fit=crop&auto=format"

BODY_GENERIC = (
    "El cuidado de las uñas va más allá de la estética. Es una práctica de autocuidado que, "
    "cuando se realiza con los materiales y técnicas correctas, puede transformar tu rutina y "
    "elevar tu confianza.\n\nEn Nails Studio nos especializamos en técnicas que no solo lucen "
    "increíbles, sino que cuidan la salud de tu uña natural. Cada decisión de diseño parte de "
    "entender la forma, longitud y condición de cada uña."
)

# (slug, kind, title, excerpt, category, read_minutes, author, rating, design_name)
POSTS = [
    ("como-prolongar-semipermanente", "articulo",
     "Cómo prolongar la duración de tu esmaltado semipermanente",
     "Pequeños hábitos que marcan la diferencia entre 2 y 4 semanas de durabilidad perfecta.",
     "Cuidados", 4, None, None, None),
    ("tendencias-otono-2026", "articulo",
     "Tendencias otoño 2026: los diseños que dominarán la temporada",
     "Desde el minimal aesthetic hasta el maximalism floral, analizamos lo que viene fuerte.",
     "Tendencias", 6, None, None, None),
    ("gel-x-vs-acrilico", "articulo",
     "Gel X vs Acrílico: ¿cuál es mejor para ti?",
     "Comparamos durabilidad, daño, precio y versatilidad para que tomes la mejor decisión.",
     "Educación", 5, None, None, None),
    ("testimonio-valentina", "testimonio",
     "Valentina Ríos",
     "Llevaba años buscando un estudio que entendiera que quería arte, no solo color. Nails Studio es exactamente eso.",
     "Testimonio", 1, "Valentina Ríos", 5, "Botanical Garden"),
    ("testimonio-camila", "testimonio",
     "Camila Serrano",
     "El encapsulado con flores reales me duró 5 semanas perfecto. La calidad es incomparable y la atención es increíble.",
     "Testimonio", 1, "Camila Serrano", 5, "Encapsulado Flores Secas"),
    ("testimonio-maria-jose", "testimonio",
     "María José López",
     "Vine para mi boda y el equipo me hizo los relieves más hermosos. Todas mis invitadas querían el contacto del estudio.",
     "Testimonio", 1, "María José López", 5, "Relieve 3D Mariposa"),
    ("testimonio-andrea", "testimonio",
     "Andrea Fuentes",
     "El catálogo tiene opciones para todos los gustos y la reserva en línea es rapidísima. Volveré cada mes sin duda.",
     "Testimonio", 1, "Andrea Fuentes", 5, "Marble Luxe"),
    ("nuestra-historia", "nosotros",
     "Nails Studio nació de una convicción simple: las uñas son un lienzo, y cada clienta merece arte personalizado, no un template repetido.",
     "Fundamos el estudio en 2019 con una mesa, una lampara UV y una obsesión por la calidad. Hoy somos un equipo de artistas especializadas con más de 5,000 diseños únicos en nuestro haber.",
     "Historia", 2, "Fernanda Torres", None, None,
     "Cada cita es una colaboración. Escuchamos, diseñamos y ejecutamos con la precisión de quien ama lo que hace.",
     "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=700&h=900&fit=crop&auto=format"),
    ("valor-calidad", "nosotros",
     "Calidad sin compromiso",
     "Solo usamos materiales premium con certificación internacional.",
     "Valores", 1, None, None, None),
    ("valor-arte", "nosotros",
     "Arte personalizado",
     "Ningún diseño se repite. Cada uña es única como quien la lleva.",
     "Valores", 1, None, None, None),
    ("valor-higiene", "nosotros",
     "Higiene estricta",
     "Protocolos de esterilización profesional en cada servicio.",
     "Valores", 1, None, None, None),
]


def main() -> None:
    db = session_factory()
    try:
        cat_ids: dict[str, int] = {}
        for slug, name, icon, color, desc in CATEGORIES:
            cat = db.scalar(select(Category).where(Category.slug == slug))
            if cat is None:
                cat = Category(slug=slug, name=name, icon=icon, color=color, description=desc)
                db.add(cat)
                db.flush()
            elif cat.icon != icon:
                # Migración de datos: emojis → claves Lucide.
                cat.icon = icon
            cat_ids[slug] = cat.id
        n_designs = 0
        for name, slug, occasion, complexity, price, duration, desc, tech, tags in DESIGNS:
            exists = db.scalar(select(Design).where(Design.name == name, Design.category_id == cat_ids[slug]))
            if exists is None:
                db.add(Design(category_id=cat_ids[slug], name=name, occasion=occasion, complexity=complexity,
                              price=price, duration_min=duration, image_url=IMG, description=desc,
                              technique=tech, tags=tags))
                n_designs += 1
        n_clients = 0
        for name, phone, visits, points in CLIENTS:
            if db.scalar(select(Client).where(Client.phone == phone)) is None:
                db.add(Client(name=name, phone=phone, visits=visits, points=points))
                n_clients += 1
        n_posts = 0
        for row in POSTS:
            slug, kind, title, excerpt, category, mins, author, rating, design = row[:9]
            body = row[9] if len(row) > 9 else BODY_GENERIC
            image = row[10] if len(row) > 10 else IMG_BLOG
            if db.scalar(select(Post).where(Post.slug == slug)) is None:
                db.add(Post(slug=slug, kind=kind, title=title, excerpt=excerpt, body=body,
                            category=category, image_url=image, read_minutes=mins,
                            author=author, rating=rating, design_name=design))
                n_posts += 1
        db.commit()
        logger.info("Seed estudio: %s categorías, %s diseños nuevos, %s clientas nuevas, %s posts nuevos",
                    len(cat_ids), n_designs, n_clients, n_posts)
        print(f"Seed estudio OK: {len(cat_ids)} categorías, {n_designs} diseños nuevos, {n_clients} clientas nuevas, {n_posts} posts nuevos")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()

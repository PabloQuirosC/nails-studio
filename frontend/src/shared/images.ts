/** URLs de imagen pegadas por usuarias: el link "compartir" de Google Drive
 *  es una página web (no renderiza en <img>). Se convierte a imagen directa.
 *
 *  Soporta: /file/d/ID/..., open?id=ID, uc?id=ID|export=...
 *  Requiere que el archivo esté compartido como "cualquier persona con el enlace".
 */
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const raw = url.trim();
  if (!raw) return null;
  let id: string | null = null;
  const fileMatch = raw.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (fileMatch) {
    id = fileMatch[1];
  } else {
    try {
      const parsed = new URL(raw);
      if (parsed.hostname === 'drive.google.com') {
        id = parsed.searchParams.get('id');
      }
    } catch {
      return raw;
    }
  }
  if (!id) return raw;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
}

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
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  let id: string | null = null;
  const fileMatch = raw.match(/drive\.google\.com\/file\/d\/([\w-]+)/i);
  if (fileMatch) {
    id = fileMatch[1];
  } else {
    if (parsed.hostname === 'drive.google.com') {
      id = parsed.searchParams.get('id');
    }
  }
  if (!id) return raw;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
}

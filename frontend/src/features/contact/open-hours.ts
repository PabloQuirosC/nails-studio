/** Abierto/cerrado derivado del horario editable (Admin → Contacto).
 *
 *  Entiende líneas como "Lunes–Sábado: 10:00–17:00" o "Domingo: 11:00–16:00".
 *  Si no logra interpretar el texto, devuelve null y la llamada usa su
 *  horario anterior como respaldo (nunca rompe el badge).
 */

const DAYS: Record<string, number> = {
  domingo: 0, dom: 0,
  lunes: 1, lun: 1,
  martes: 2, mar: 2,
  miercoles: 3, miércoles: 3, mie: 3,
  jueves: 4, jue: 4,
  viernes: 5, vie: 5,
  sabado: 6, sábado: 6, sab: 6,
};

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function parseDays(part: string): number[] | null {
  const range = part.split(/[–—-]/).map(norm).filter(Boolean);
  if (range.length === 1) {
    const d = DAYS[range[0]];
    return d === undefined ? null : [d];
  }
  if (range.length === 2) {
    const a = DAYS[range[0]];
    const b = DAYS[range[1]];
    if (a === undefined || b === undefined) return null;
    const out: number[] = [];
    let d = a;
    for (let i = 0; i < 7; i++) {
      out.push(d);
      if (d === b) break;
      d = (d + 1) % 7;
    }
    return out;
  }
  return null;
}

function parseHours(part: string): [number, number] | null {
  const m = part.match(/(\d{1,2}):(\d{2})\s*[–—\-a-z]+\s*(\d{1,2}):(\d{2})/i);
  if (!m) return null;
  const open = Number(m[1]) + Number(m[2]) / 60;
  const close = Number(m[3]) + Number(m[4]) / 60;
  if (close <= open) return null;
  return [open, close];
}

/** true = abierto, false = cerrado, null = horario no interpretable. */
export function isOpenNow(schedule: string, now = new Date()): boolean | null {
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  let coversToday = false;
  for (const line of schedule.split('\n')) {
    const parts = line.split(':');
    if (parts.length < 2) continue;
    // El horario usa ":" como separador día/horas Y dentro de las horas:
    // separamos por la primera ocurrencia que deje horas parseables.
    let hit = false;
    for (let i = 1; i < parts.length; i++) {
      const days = parseDays(parts.slice(0, i).join(':'));
      const hours = parseHours(parts.slice(i).join(':'));
      if (days && hours) {
        hit = true;
        if (days.includes(day)) {
          coversToday = true;
          if (h >= hours[0] && h < hours[1]) return true;
        }
        break;
      }
    }
    if (!hit) return null; // línea no interpretable → no adivinar
  }
  return coversToday ? false : null;
}

/** Respaldo con el horario clásico (por si el texto no se interpreta). */
export function isOpenLegacy(now = new Date()): boolean {
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  if (day === 0) return h >= 11 && h < 16;
  return day >= 1 && day <= 6 && h >= 10 && h < 19;
}

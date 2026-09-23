import { describe, expect, it } from 'vitest';
import { isOpenNow } from './open-hours';

const SCHEDULE = 'Lunes–Sábado: 10:00–17:00\nDomingo: 11:00–16:00';

// Lunes 2026-09-21 12:00, domingo 2026-09-27.
const MON_NOON = new Date(2026, 8, 21, 12, 0);
const MON_LATE = new Date(2026, 8, 21, 18, 30);
const SUN_NOON = new Date(2026, 8, 27, 12, 0);
const SUN_LATE = new Date(2026, 8, 27, 17, 0);

describe('isOpenNow', () => {
  it('abre en horario entre semana', () => {
    expect(isOpenNow(SCHEDULE, MON_NOON)).toBe(true);
  });

  it('cierra fuera de horario aunque sea día laboral', () => {
    expect(isOpenNow(SCHEDULE, MON_LATE)).toBe(false);
  });

  it('respeta el horario de domingo', () => {
    expect(isOpenNow(SCHEDULE, SUN_NOON)).toBe(true);
    expect(isOpenNow(SCHEDULE, SUN_LATE)).toBe(false);
  });

  it('devuelve null si el texto no se interpreta', () => {
    expect(isOpenNow('Abierto cuando haya luz', MON_NOON)).toBe(null);
  });
});

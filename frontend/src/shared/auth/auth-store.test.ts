import { describe, expect, it } from 'vitest';
import { hasAnyPermission, hasPermission } from './auth-store';
import type { Me } from './auth-api';

function me(roles: string[] = [], permissions: string[] = []): Me {
  return {
    id: 1,
    username: 'test',
    email: 'test@nailsstudio.com',
    full_name: 'Test',
    roles,
    permissions,
  } as Me;
}

describe('hasPermission', () => {
  it('niega sin usuario', () => {
    expect(hasPermission(null, 'blog.read')).toBe(false);
  });

  it('ADMIN sin permiso explícito NO escala (solo permisos autorizan)', () => {
    expect(hasPermission(me(['ADMIN'], ['blog.read']), 'cualquier.cosa')).toBe(false);
    expect(hasPermission(me(['ADMIN'], ['blog.read']), 'blog.read')).toBe(true);
    expect(hasPermission(me(['admin'], ['x.y']), 'contacto.delete')).toBe(false);
    expect(hasPermission(me(['ADMIN'], []), 'contacto.delete')).toBe(false);
    expect(hasPermission(me(['admin'], []), 'cualquier.cosa')).toBe(false);
  });

  it('hasAnyPermission exige al menos 1 permiso', () => {
    expect(hasAnyPermission(null)).toBe(false);
    expect(hasAnyPermission(me(['staff'], []))).toBe(false);
    expect(hasAnyPermission(me([], []))).toBe(false);
    expect(hasAnyPermission(me(['staff'], ['blog.read']))).toBe(true);
  });

  it('compara permisos case-insensitive', () => {
    expect(hasPermission(me(['staff'], ['Blog.Read']), 'blog.read')).toBe(true);
    expect(hasPermission(me(['staff'], ['blog.read']), 'BLOG.READ')).toBe(true);
  });

  it('niega permiso ausente', () => {
    expect(hasPermission(me(['staff'], ['blog.read']), 'blog.delete')).toBe(false);
  });
});

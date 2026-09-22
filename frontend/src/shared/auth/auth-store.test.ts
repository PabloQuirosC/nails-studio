import { describe, expect, it } from 'vitest';
import { hasPermission } from './auth-store';
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

  it('ADMIN tiene bypass total', () => {
    expect(hasPermission(me(['admin'], []), 'cualquier.cosa')).toBe(true);
    expect(hasPermission(me(['ADMIN'], []), 'contacto.delete')).toBe(true);
  });

  it('compara permisos case-insensitive', () => {
    expect(hasPermission(me(['staff'], ['Blog.Read']), 'blog.read')).toBe(true);
    expect(hasPermission(me(['staff'], ['blog.read']), 'BLOG.READ')).toBe(true);
  });

  it('niega permiso ausente', () => {
    expect(hasPermission(me(['staff'], ['blog.read']), 'blog.delete')).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { resolveImageUrl } from './images';

describe('resolveImageUrl', () => {
  it('convierte link compartir /file/d/ID', () => {
    expect(resolveImageUrl('https://drive.google.com/file/d/ABC123xyz/view?usp=sharing')).toBe(
      'https://drive.google.com/thumbnail?id=ABC123xyz&sz=w1200',
    );
  });

  it('convierte open?id=', () => {
    expect(resolveImageUrl('https://drive.google.com/open?id=ABC123')).toBe(
      'https://drive.google.com/thumbnail?id=ABC123&sz=w1200',
    );
  });

  it('deja intactas las URLs normales y vacías', () => {
    expect(resolveImageUrl('https://images.unsplash.com/x?w=1')).toBe('https://images.unsplash.com/x?w=1');
    expect(resolveImageUrl(null)).toBe(null);
    expect(resolveImageUrl('  ')).toBe(null);
  });
});

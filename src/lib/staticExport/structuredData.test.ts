import { describe, it, expect } from 'vitest';
import { extractLogoUrl } from './structuredData';

describe('extractLogoUrl', () => {
  const withLogo = {
    layout: { sections: ['header-abc123', 'hero-x'] },
    'header-abc123': { elements: { logo_image: { content: 'https://cdn.example.com/logo.png' } } },
  };

  it('finds the header logo_image', () => {
    expect(extractLogoUrl(withLogo)).toBe('https://cdn.example.com/logo.png');
  });

  it('returns undefined without a header section or logo', () => {
    expect(extractLogoUrl({ layout: { sections: ['hero-x'] }, 'hero-x': { elements: {} } })).toBeUndefined();
    expect(
      extractLogoUrl({ layout: { sections: ['header-a'] }, 'header-a': { elements: {} } })
    ).toBeUndefined();
    expect(extractLogoUrl(null)).toBeUndefined();
  });

  it('rejects non-https values (relative, data:, http:)', () => {
    const make = (v: any) => ({
      layout: { sections: ['header-a'] },
      'header-a': { elements: { logo_image: { content: v } } },
    });
    expect(extractLogoUrl(make('/uploads/logo.png'))).toBeUndefined();
    expect(extractLogoUrl(make('data:image/png;base64,x'))).toBeUndefined();
    expect(extractLogoUrl(make('http://cdn/logo.png'))).toBeUndefined();
    expect(extractLogoUrl(make(42))).toBeUndefined();
  });
});

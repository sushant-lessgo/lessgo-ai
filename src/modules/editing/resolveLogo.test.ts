import { describe, it, expect } from 'vitest';
import { resolveLogo } from './resolveLogo';

describe('resolveLogo — surface-aware fallback chains', () => {
  it('light surface: globalSettings.logoUrl wins', () => {
    expect(
      resolveLogo({ logoUrl: 'https://cdn/light.png' }, { logo_image: 'https://cdn/legacy.png' }, 'light'),
    ).toEqual({ kind: 'image', url: 'https://cdn/light.png' });
  });

  it('dark surface: logoUrlDark wins over logoUrl', () => {
    expect(
      resolveLogo({ logoUrl: 'https://cdn/light.png', logoUrlDark: 'https://cdn/dark.png' }, {}, 'dark'),
    ).toEqual({ kind: 'image', url: 'https://cdn/dark.png' });
  });

  it('dark surface: falls back to logoUrl when no dark asset', () => {
    expect(resolveLogo({ logoUrl: 'https://cdn/light.png' }, {}, 'dark')).toEqual({
      kind: 'image',
      url: 'https://cdn/light.png',
    });
  });

  it('light surface: legacy logo_image fallback when no globalSettings (naayom back-compat)', () => {
    expect(resolveLogo(undefined, { logo_image: 'https://cdn/legacy.png' }, 'light')).toEqual({
      kind: 'image',
      url: 'https://cdn/legacy.png',
    });
  });

  it('dark surface: legacy logo_image fallback when no globalSettings (naayom back-compat)', () => {
    expect(resolveLogo({}, { logo_image: 'https://cdn/legacy.png' }, 'dark')).toEqual({
      kind: 'image',
      url: 'https://cdn/legacy.png',
    });
  });

  it('wordmark fallback when no image anywhere', () => {
    expect(resolveLogo(undefined, { wordmark: 'Acme' }, 'light')).toEqual({
      kind: 'wordmark',
      text: 'Acme',
    });
    expect(resolveLogo({}, { wordmark: 'Acme' }, 'dark')).toEqual({
      kind: 'wordmark',
      text: 'Acme',
    });
  });

  it('empty-string values are treated as unset (fall through)', () => {
    // Empty logoUrl → falls to legacy logo_image
    expect(resolveLogo({ logoUrl: '' }, { logo_image: 'https://cdn/legacy.png' }, 'light')).toEqual({
      kind: 'image',
      url: 'https://cdn/legacy.png',
    });
    // Empty logoUrlDark → falls to logoUrl on dark surface
    expect(resolveLogo({ logoUrl: 'https://cdn/light.png', logoUrlDark: '' }, {}, 'dark')).toEqual({
      kind: 'image',
      url: 'https://cdn/light.png',
    });
    // Empty everything → empty wordmark
    expect(resolveLogo({ logoUrl: '' }, { logo_image: '', wordmark: '' }, 'light')).toEqual({
      kind: 'wordmark',
      text: '',
    });
  });

  it('nothing set → empty wordmark', () => {
    expect(resolveLogo(undefined, undefined, 'light')).toEqual({ kind: 'wordmark', text: '' });
    expect(resolveLogo(undefined, undefined, 'dark')).toEqual({ kind: 'wordmark', text: '' });
  });
});

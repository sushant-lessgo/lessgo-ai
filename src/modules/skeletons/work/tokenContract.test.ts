// src/modules/skeletons/work/tokenContract.test.ts
// Unit coverage for the two work-skeleton token surfaces (§D):
//   1. skin token bounds — `assertSkinTokens` fails LOUD (full violation list) on
//      out-of-range values, passes a valid fixture (AC L122).
//   2. user style tokens — `serializeStyleTokens` emits the expected `[data-sid]`
//      `--u-*` CSS, and empty input → empty string (AC L123 serializer path).

import { describe, it, expect } from 'vitest';
import { assertSkinTokens, serializeSkinTokens, type WorkSkinTokens } from './tokenContract';
import { serializeStyleTokens, type StyleTokens } from '../styleTokens';

const validTokens: WorkSkinTokens = {
  paper: '#faf9f6',
  paper2: '#f0efe9',
  ink: '#1a1a1a',
  inkSoft: '#444',
  inkMute: '#777',
  line: 'rgba(0,0,0,0.16)',
  lineSoft: 'rgba(0,0,0,0.09)',
  dark: '#141414',
  onDark: '#fafafa',
  onDarkSoft: '#cfcfcf',
  lineDark: 'rgba(255,255,255,0.2)',
  fontDisplay: "'Bricolage Grotesque', sans-serif",
  fontBody: "'Hanken Grotesk', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  fsBodyPx: 16,
  lhBody: 1.6,
  wrapPx: 1380,
  gutterPx: 40,
  secPadYPx: 120,
  radiusPx: 3,
  displayWeight: 600,
  heroAlign: 'start',
  heroDisplayScaleMax: 86,
  heroDisplayLineHeight: 0.94,
  heroDisplayTracking: -0.02,
  heroDisplayWeight: 600,
  heroNumeral: false,
  sectionHeaderStyle: 'plain',
  footerWordmark: false,
  galleryCaption: 'below',
  packagesStyle: 'list',
  aboutLayout: 'stack',
  headerOverlay: false,
};

describe('assertSkinTokens — skin token bounds (loud fail)', () => {
  it('passes a valid fixture skin', () => {
    expect(() => assertSkinTokens({ id: 'fixture', tokens: validTokens })).not.toThrow();
  });

  it('throws listing EVERY violation for an out-of-bounds skin', () => {
    const bad: WorkSkinTokens = {
      ...validTokens,
      fsBodyPx: 40,        // > max 24
      radiusPx: -5,        // < min 0
      wrapPx: 500,         // < min 960
      displayWeight: 450,  // not an enum member
      ink: '',             // empty colour string
    };
    let msg = '';
    try {
      assertSkinTokens({ id: 'bad-skin', tokens: bad });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain('bad-skin');
    expect(msg).toContain('5 token violation(s)');
    expect(msg).toContain('--wk-fs-body');
    expect(msg).toContain('--wk-r');
    expect(msg).toContain('--wk-wrap');
    expect(msg).toContain('--wk-display-weight');
    expect(msg).toContain('--wk-ink');
  });

  it('throws when the tokens object is missing', () => {
    expect(() => assertSkinTokens({ id: 'no-tokens', tokens: undefined as any })).toThrow(/no tokens/);
  });

  it('accepts the dramatic Atelier hero knob values (in range)', () => {
    const atelier: WorkSkinTokens = {
      ...validTokens,
      heroAlign: 'center',
      heroDisplayScaleMax: 138,
      heroDisplayLineHeight: 0.9,
      heroDisplayTracking: -0.045,
      heroDisplayWeight: 700,
      heroNumeral: true,
    };
    expect(() => assertSkinTokens({ id: 'atelier-knobs', tokens: atelier })).not.toThrow();
  });

  it('throws listing EVERY hero-knob violation (out of range / bad enum / bad type)', () => {
    const bad: WorkSkinTokens = {
      ...validTokens,
      heroAlign: 'middle' as any,     // not start|center
      heroDisplayScaleMax: 400,       // > max 200
      heroDisplayLineHeight: 2.0,     // > max 1.4
      heroDisplayTracking: -0.2,      // < min -0.08
      heroDisplayWeight: 450,         // not an enum member
      heroNumeral: 'yes' as any,      // not a boolean
    };
    let msg = '';
    try {
      assertSkinTokens({ id: 'bad-hero', tokens: bad });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain('6 token violation(s)');
    expect(msg).toContain('--wk-hero-align');
    expect(msg).toContain('--wk-hero-scale');
    expect(msg).toContain('--wk-hero-lh');
    expect(msg).toContain('--wk-hero-tracking');
    expect(msg).toContain('--wk-hero-weight');
    expect(msg).toContain('--wk-hero-num-display');
  });

  it('accepts the Wave 2A section-header + footer-wordmark opt-ins (atelier)', () => {
    const atelier: WorkSkinTokens = {
      ...validTokens,
      sectionHeaderStyle: 'rule',
      footerWordmark: true,
    };
    expect(() => assertSkinTokens({ id: 'wave2a', tokens: atelier })).not.toThrow();
  });

  it('throws on a bad sectionHeaderStyle enum / non-boolean footerWordmark', () => {
    const bad: WorkSkinTokens = {
      ...validTokens,
      sectionHeaderStyle: 'ruled' as any, // not plain|rule
      footerWordmark: 'yes' as any,       // not a boolean
    };
    let msg = '';
    try {
      assertSkinTokens({ id: 'bad-wave2a', tokens: bad });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain('2 token violation(s)');
    expect(msg).toContain('--wk-sec-head-display');
    expect(msg).toContain('--wk-footer-wm-fs');
  });

  it('accepts the Wave 2B composition opt-ins (atelier)', () => {
    const atelier: WorkSkinTokens = {
      ...validTokens,
      galleryCaption: 'overlay',
      packagesStyle: 'card',
      aboutLayout: 'split-portrait',
      headerOverlay: true,
    };
    expect(() => assertSkinTokens({ id: 'wave2b', tokens: atelier })).not.toThrow();
  });

  it('throws listing EVERY Wave 2B violation (bad enums + non-boolean headerOverlay)', () => {
    const bad: WorkSkinTokens = {
      ...validTokens,
      galleryCaption: 'inside' as any,    // not below|overlay
      packagesStyle: 'grid' as any,       // not list|card
      aboutLayout: 'split' as any,        // not stack|split-portrait
      headerOverlay: 'yes' as any,        // not a boolean
    };
    let msg = '';
    try {
      assertSkinTokens({ id: 'bad-wave2b', tokens: bad });
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).toContain('4 token violation(s)');
    expect(msg).toContain('--wk-gal-cap-pos');
    expect(msg).toContain('--wk-pkg-cta-w');
    expect(msg).toContain('--wk-about-align');
    expect(msg).toContain('--wk-header-bg');
  });
});

describe('serializeSkinTokens — Wave 2A derived vars', () => {
  it('emits plain/off defaults for a neutral skin (byte-neutral)', () => {
    const css = serializeSkinTokens(validTokens);
    expect(css).toContain('--wk-sec-head-display:block;');
    expect(css).toContain('--wk-sec-head-bw:0;');
    expect(css).toContain('--wk-sec-head-num:none;');
    expect(css).toContain('--wk-footer-wm-fs:clamp(1.7rem,4vw,3rem);');
    expect(css).toContain('--wk-footer-dot:none;');
  });

  it('emits rule-header + wordmark vars for the opted-in skin', () => {
    const css = serializeSkinTokens({ ...validTokens, sectionHeaderStyle: 'rule', footerWordmark: true });
    expect(css).toContain('--wk-sec-head-display:flex;');
    expect(css).toContain('--wk-sec-head-bw:2px;');
    expect(css).toContain('--wk-sec-head-num:block;');
    expect(css).toContain('--wk-sec-head-meta-ml:auto;');
    expect(css).toContain('--wk-footer-wm-fs:clamp(48px,11vw,170px);');
    expect(css).toContain('--wk-footer-dot:inline;');
  });
});

describe('serializeSkinTokens — Wave 2B derived vars', () => {
  it('emits neutral (below/list/stack/off) defaults for a non-setting skin', () => {
    const css = serializeSkinTokens(validTokens);
    expect(css).toContain('--wk-gal-cap-pos:static;');
    expect(css).toContain('--wk-gal-grad-display:none;');
    expect(css).toContain('--wk-gal-hover-scale:1;');
    expect(css).toContain('--wk-pkg-cta-w:auto;');
    expect(css).toContain('--wk-pkg-price-fs:1.7rem;');
    expect(css).toContain('--wk-about-align:start;');
    expect(css).toContain('--wk-header-bg:var(--u-bg, var(--wk-paper));');
    expect(css).toContain('--wk-header-dot:none;');
  });

  it('emits the Atelier composition vars for the opted-in skin', () => {
    const css = serializeSkinTokens({
      ...validTokens,
      galleryCaption: 'overlay',
      packagesStyle: 'card',
      aboutLayout: 'split-portrait',
      headerOverlay: true,
    });
    expect(css).toContain('--wk-gal-cap-pos:absolute;');
    expect(css).toContain('--wk-gal-grad-display:block;');
    expect(css).toContain('--wk-gal-dot-display:inline-block;');
    expect(css).toContain('--wk-pkg-cta-w:100%;');
    expect(css).toContain('--wk-pkg-cta-mt:auto;');
    expect(css).toContain('--wk-pkg-price-fs:clamp(32px,3vw,42px);');
    expect(css).toContain('--wk-about-align:center;');
    expect(css).toContain('--wk-about-eyebrow-display:inline-block;');
    expect(css).toContain('--wk-header-bg:transparent;');
    expect(css).toContain('--wk-header-fg:var(--wk-on-dark);');
    expect(css).toContain('--wk-header-dot:inline-block;');
  });
});

describe('serializeStyleTokens — user style-token serializer', () => {
  it('returns empty string for empty / null input', () => {
    expect(serializeStyleTokens(undefined)).toBe('');
    expect(serializeStyleTokens(null)).toBe('');
    expect(serializeStyleTokens({})).toBe('');
  });

  it('emits [data-sid]{--u-*} CSS for a section, in field order', () => {
    const tokens: StyleTokens = {
      'hero-abc12345': { corners: 'round', spacingY: 'compact', shadow: 'soft' },
    };
    const css = serializeStyleTokens(tokens);
    // background before spacingY before corners before shadow (deterministic order)
    expect(css).toBe(
      '[data-sid="hero-abc12345"]{--u-space-y:0.75;--u-radius:24px;--u-shadow:0 2px 12px rgba(0,0,0,0.06);}',
    );
  });

  it('maps dark background to both --u-bg and --u-fg', () => {
    const css = serializeStyleTokens({ 'contact-x': { background: 'dark' } });
    expect(css).toBe('[data-sid="contact-x"]{--u-bg:var(--wk-dark);--u-fg:var(--wk-on-dark);}');
  });

  it('skips default / absent coordinates and empty sections', () => {
    const css = serializeStyleTokens({
      'a-1': { corners: 'default', spacingY: 'default' }, // all default → no block
      'b-2': { border: 'hairline' },
    });
    expect(css).toBe('[data-sid="b-2"]{--u-border:1px solid var(--wk-line);}');
  });

  it('does NOT serialize headerMode (consumed as a data-attr, not a var)', () => {
    const css = serializeStyleTokens({ 'header-1': { headerMode: 'fixed' } });
    expect(css).toBe('');
  });
});

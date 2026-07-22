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
    expect(css).toContain('--wk-header-bg:var(--wk-dark);');
    expect(css).not.toContain('--wk-header-bg:transparent');
    expect(css).toContain('--wk-header-fg:var(--wk-on-dark);');
    expect(css).toContain('--wk-header-dot:inline-block;');
  });
});

// ── section-background phase 2 review — the `:root`-derived-var hole (N8) ───────
// The N8 re-point works by INHERITANCE: a child reading `var(--wk-ink-mute)`
// resolves it AT ITSELF, inside the overridden `[data-sid]` block. A child reading
// a DERIVED var (`var(--wk-about-eyebrow-color)`) does not — custom properties
// substitute their `var()`s at the element that DECLARES them, and these are
// declared on `:root`, so a section-level re-point can never reach them.
//
// This is a RATCHET, not a green field: the two entries below are the offenders
// that exist today. Adding a NEW `:root` derived colour that embeds a
// polarity-bound token fails this test. See the KNOWN HOLE note in
// `src/modules/skeletons/styleTokens.ts`.
describe('serializeSkinTokens — :root derived colours vs the N8 re-point', () => {
  /** The skin tokens `BACKGROUND_CSS` re-points inside a `[data-sid]` block. */
  const POLARITY_BOUND =
    /var\(\s*--wk-(?:ink|ink-soft|ink-mute|on-dark|on-dark-soft|line|line-soft|line-dark|paper|paper-2)\b/;

  /** Documented, deliberate exceptions. */
  const KNOWN = new Set([
    // `aboutLayout:'stack'` only. Inert for atelier (`'split-portrait'` →
    // `var(--wk-accent-ink,#fff)`), but a future stack skin would render a
    // dark-grey eyebrow on a user-chosen Ink band.
    '--wk-about-eyebrow-color',
    // Header vars: exempt BY DESIGN — the header is denied per-section backgrounds
    // entirely (plan D5), so nothing ever re-points tokens under it.
    '--wk-header-bg',
    '--wk-header-fg',
    '--wk-header-line',
  ]);

  function rootDeclarations(css: string): Array<[string, string]> {
    const start = css.indexOf(':root{');
    const end = css.indexOf('\n}', start);
    expect(start, 'no :root block in the serialized skin').toBeGreaterThanOrEqual(0);
    return css
      .slice(start + ':root{'.length, end)
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const colon = d.indexOf(':');
        return [d.slice(0, colon).trim(), d.slice(colon + 1).trim()] as [string, string];
      });
  }

  it.each([
    ['neutral skin (stack / list / below / header off)', validTokens],
    [
      'atelier-shaped skin (split-portrait / card / overlay / rule)',
      {
        ...validTokens,
        aboutLayout: 'split-portrait',
        packagesStyle: 'card',
        galleryCaption: 'overlay',
        headerOverlay: true,
        sectionHeaderStyle: 'rule',
        footerWordmark: true,
      } as WorkSkinTokens,
    ],
  ])('%s: no NEW :root derived colour embeds a polarity-bound token', (_label, tokens) => {
    const offenders = rootDeclarations(serializeSkinTokens(tokens))
      .filter(([, value]) => POLARITY_BOUND.test(value))
      .map(([name]) => name)
      .filter((name) => !KNOWN.has(name));
    expect(
      offenders,
      'a :root-level derived colour embeds a polarity-bound token — it can never ' +
        'follow a per-section background override (see styleTokens.ts KNOWN HOLE)',
    ).toEqual([]);
  });

  it('pins the known offender: stack aboutLayout derives the eyebrow from --wk-ink-mute', () => {
    // If this ever goes green (the emission is fixed), drop `--wk-about-eyebrow-color`
    // from KNOWN above so the ratchet tightens.
    expect(serializeSkinTokens(validTokens)).toContain(
      '--wk-about-eyebrow-color:var(--wk-ink-mute);',
    );
    expect(serializeSkinTokens({ ...validTokens, aboutLayout: 'split-portrait' })).toContain(
      '--wk-about-eyebrow-color:var(--wk-accent-ink,#fff);',
    );
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

  it('maps dark background to both --u-bg and --u-fg (+ the N8 polarity re-points)', () => {
    const css = serializeStyleTokens({ 'contact-x': { background: 'dark' } });
    expect(css).toBe(
      '[data-sid="contact-x"]{--u-bg:var(--wk-dark);--u-fg:var(--wk-on-dark);' +
        '--wk-ink:var(--wk-on-dark);--wk-ink-soft:var(--wk-on-dark-soft);' +
        '--wk-ink-mute:var(--wk-on-dark-soft);--wk-line:var(--wk-line-dark);' +
        '--wk-line-soft:var(--wk-line-dark);' +
        '--wk-paper:var(--wk-dark);--wk-paper-2:var(--wk-dark);}',
    );
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

  // section-background phase 3 (D1/D8): `bgMode` is a per-block PROP, not a var.
  // Delivering it as CSS (e.g. `--u-hero-media-display:none`) was considered and
  // rejected — a `display:none` hero image is still DOWNLOADED by the browser,
  // whereas the prop path removes the element from the markup entirely.
  it('does NOT serialize bgMode (a per-block prop, not a var)', () => {
    expect(serializeStyleTokens({ 'hero-1': { bgMode: 'color' } })).toBe('');
    expect(serializeStyleTokens({ 'hero-1': { bgMode: 'image' } })).toBe('');
    // …and it does not disturb the surface declarations of the same section.
    expect(serializeStyleTokens({ 'hero-1': { bgMode: 'color', corners: 'sharp' } })).toBe(
      '[data-sid="hero-1"]{--u-radius:0px;}',
    );
  });

  // section-background D2 — CONTRAST PAIR INVARIANT.
  // Dark-default block roots (`.wk-hero`, `.wk-hero-img`, `.wk-footer`) declare
  // `color:var(--u-fg, var(--wk-on-dark))` AT THE ROOT, which beats any colour
  // inherited from the wrapper's `[data-surface]` rule. So a surface that emits
  // `--u-bg` without `--u-fg` paints light-on-light there. Every non-default
  // surface must emit BOTH. (Resolver-side coverage lives in
  // `src/modules/skeletons/styleTokens.test.ts`.)
  it.each(['paper', 'paper-2', 'dark', 'accent'] as const)(
    'background "%s" emits BOTH --u-bg and --u-fg (contrast pair)',
    (background) => {
      const css = serializeStyleTokens({ 'about-1': { background } });
      expect(css).toContain('[data-sid="about-1"]{');
      expect(css).toMatch(/--u-bg:[^;]+;/);
      expect(css).toMatch(/--u-fg:[^;]+;/);
    },
  );

  it('maps paper / paper-2 to the ink foreground (+ the N8 polarity re-points)', () => {
    const onDarkToInk =
      '--wk-on-dark:var(--wk-ink);--wk-on-dark-soft:var(--wk-ink-soft);' +
      '--wk-line-dark:var(--wk-line);';
    expect(serializeStyleTokens({ 'about-1': { background: 'paper' } })).toBe(
      `[data-sid="about-1"]{--u-bg:var(--wk-paper);--u-fg:var(--wk-ink);${onDarkToInk}}`,
    );
    expect(serializeStyleTokens({ 'about-1': { background: 'paper-2' } })).toBe(
      `[data-sid="about-1"]{--u-bg:var(--wk-paper-2);--u-fg:var(--wk-ink);${onDarkToInk}}`,
    );
  });

  // ── section-background N8 (phase 2) — CONTRAST INVARIANT PART 2 ──────────────
  // The root `--u-bg`/`--u-fg` pair does not reach block CHILDREN that hard-code a
  // polarity-specific SKIN token. `.wk-footer__note`/`__eyebrow`/`__bottom` pin
  // `var(--wk-on-dark-soft)` and `.wk-footer__top` pins `var(--wk-line-dark)`
  // (Footer/styles.ts:16-35) — so `paper` there must ALSO re-point the on-dark
  // family, or secondary text and hairlines stay near-white on a light band.
  // Mirror case: light-default blocks pin `--wk-ink-soft`/`--wk-ink-mute`/
  // `--wk-line` and fill cards with `--wk-paper`, so `dark` must re-point those.
  // Spec AC: "No surface choice can produce an unreadable text/background pairing."
  it.each(['paper', 'paper-2'] as const)(
    'light surface "%s" re-points the ON-DARK family to ink (footer children stay readable)',
    (background) => {
      const css = serializeStyleTokens({ 'footer-1': { background } });
      expect(css).toContain('--wk-on-dark:var(--wk-ink);');
      expect(css).toContain('--wk-on-dark-soft:var(--wk-ink-soft);');
      expect(css).toContain('--wk-line-dark:var(--wk-line);');
    },
  );

  it('dark surface re-points the INK family + card fills to the on-dark family', () => {
    const css = serializeStyleTokens({ 'about-1': { background: 'dark' } });
    expect(css).toContain('--wk-ink:var(--wk-on-dark);');
    expect(css).toContain('--wk-ink-soft:var(--wk-on-dark-soft);');
    expect(css).toContain('--wk-ink-mute:var(--wk-on-dark-soft);');
    expect(css).toContain('--wk-line:var(--wk-line-dark);');
    expect(css).toContain('--wk-paper:var(--wk-dark);');
    expect(css).toContain('--wk-paper-2:var(--wk-dark);');
  });

  it('accent surface re-points every polarity-bound token to the accent ink', () => {
    const css = serializeStyleTokens({ 'contact-1': { background: 'accent' } });
    for (const name of ['--wk-ink', '--wk-ink-soft', '--wk-ink-mute', '--wk-on-dark', '--wk-on-dark-soft']) {
      expect(css).toContain(`${name}:var(--wk-accent-ink, #fff);`);
    }
    // A custom property may never point at ITSELF (cycle → guaranteed-invalid,
    // which would delete the hairline instead of restyling it).
    expect(css).not.toContain('--wk-line-dark:var(--wk-line-dark)');
  });

  // CONTAINMENT: the re-points live ONLY inside a `[data-sid]` block, and a block
  // is only emitted for an EXPLICITLY overridden section. No override ⇒ no skin
  // token is ever re-pointed ⇒ existing drafts (Kundius) are untouched. This is
  // the assertion that keeps the N8 fix from becoming a global design change.
  it('emits no skin-token re-point when the section has no background override', () => {
    const css = serializeStyleTokens({
      'about-1': { corners: 'round', spacingY: 'compact' },
      'faq-1': { background: 'default' },
    });
    expect(css).not.toContain('--wk-ink');
    expect(css).not.toContain('--wk-on-dark');
    expect(css).not.toContain('--wk-paper');
    expect(css).not.toContain('--wk-line');
  });
});

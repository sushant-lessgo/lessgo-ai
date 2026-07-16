// src/modules/skeletons/work/tokenContract.ts
// SKIN token surface #1 (§D.1): the work-skeleton's bounded design-token contract.
// A skin (compile-time data) supplies concrete values for these `--wk-*` vars; the
// skeleton owns the MARKUP that consumes them. This file declares:
//   - the token field set + their `--wk-*` CSS var names,
//   - numeric bounds per token + enum tokens,
//   - a compatibility-matrix structure (cross-token rules; starts empty, grows as
//     the Kontur/Pulse lint discovers interactions),
//   - `assertSkinTokens(skin)` — throws with a FULL violation list when any token
//     is out of range (AC L122: "out-of-range fails loud"),
//   - `serializeSkinTokens(tokens)` — the `:root{--wk-*}` + base surface CSS.
//
// PURE DATA/LOGIC — no React, no template imports. `assertSkinTokens` takes a
// structural carrier (not the full WorkSkinDef) so there is NO import cycle with
// skin.ts.

// ── Token fields ────────────────────────────────────────────────────────────
export interface WorkSkinTokens {
  // Colours (format-checked as non-empty strings — any valid CSS colour).
  paper: string;
  paper2: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  line: string;
  lineSoft: string;
  dark: string;
  onDark: string;
  onDarkSoft: string;
  lineDark: string;

  // Type faces (non-empty font-stack strings).
  fontDisplay: string;
  fontBody: string;
  fontMono: string;

  // Numeric (bounded — see WORK_TOKEN_BOUNDS).
  fsBodyPx: number;   // base body font-size
  lhBody: number;     // base body line-height
  wrapPx: number;     // content column max-width
  gutterPx: number;   // horizontal gutter
  secPadYPx: number;  // section vertical rhythm
  radiusPx: number;   // base corner radius

  // Enum-constrained.
  displayWeight: number; // one of WORK_TOKEN_ENUMS.displayWeight

  // Hero-composition knobs (fidelity Wave 1). NEUTRAL defaults reproduce the
  // CURRENT hero exactly; a dramatic skin (atelier2) raises them for the Atelier
  // "cover" signature (giant tight centered headline + background numeral). The
  // skeleton owns the markup; these vars let a skin reach the hero's DNA.
  heroAlign: 'start' | 'center'; // hero content alignment (start = current bottom-left)
  heroDisplayScaleMax: number;   // hero headline clamp max, px (bounded)
  heroDisplayLineHeight: number; // hero headline line-height (bounded)
  heroDisplayTracking: number;   // hero headline letter-spacing, em (bounded, usually negative)
  heroDisplayWeight: number;     // hero headline weight (enum) — may exceed section displayWeight
  heroNumeral: boolean;          // giant background slide numeral on/off (default off)

  // Section-header grammar (fidelity Wave 2A). NEUTRAL default `'plain'` renders
  // section heads EXACTLY as today (byte-identical). `'rule'` = Atelier's signature
  // "rule header": a 2px top rule spanning the head, an accent index numeral
  // (auto-numbered 01/02… via a CSS counter), the h2, and right-aligned meta
  // (reuses the head's existing eyebrow — no new contract field).
  sectionHeaderStyle: 'plain' | 'rule';

  // Footer wordmark (fidelity Wave 2A). NEUTRAL default `false` keeps the current
  // compact footer. `true` = Atelier's giant footer wordmark (the heading rendered
  // huge, weight 700, with an accent dot) — no new contract field (reuses heading).
  footerWordmark: boolean;
}

/** Token field → its emitted `--wk-*` CSS custom property name. */
export const WORK_TOKEN_VARS: Record<keyof WorkSkinTokens, string> = {
  paper: '--wk-paper',
  paper2: '--wk-paper-2',
  ink: '--wk-ink',
  inkSoft: '--wk-ink-soft',
  inkMute: '--wk-ink-mute',
  line: '--wk-line',
  lineSoft: '--wk-line-soft',
  dark: '--wk-dark',
  onDark: '--wk-on-dark',
  onDarkSoft: '--wk-on-dark-soft',
  lineDark: '--wk-line-dark',
  fontDisplay: '--wk-ff-display',
  fontBody: '--wk-ff-body',
  fontMono: '--wk-ff-mono',
  fsBodyPx: '--wk-fs-body',
  lhBody: '--wk-lh-body',
  wrapPx: '--wk-wrap',
  gutterPx: '--wk-gutter',
  secPadYPx: '--wk-sec-y',
  radiusPx: '--wk-r',
  displayWeight: '--wk-display-weight',
  heroAlign: '--wk-hero-align',
  heroDisplayScaleMax: '--wk-hero-scale',
  heroDisplayLineHeight: '--wk-hero-lh',
  heroDisplayTracking: '--wk-hero-tracking',
  heroDisplayWeight: '--wk-hero-weight',
  heroNumeral: '--wk-hero-num-display',
  sectionHeaderStyle: '--wk-sec-head-display', // primary; expands to 5 derived vars
  footerWordmark: '--wk-footer-wm-fs',         // primary; expands to 4 derived vars
};

export const WORK_TOKEN_COLOR_FIELDS: (keyof WorkSkinTokens)[] = [
  'paper', 'paper2', 'ink', 'inkSoft', 'inkMute',
  'line', 'lineSoft', 'dark', 'onDark', 'onDarkSoft', 'lineDark',
];

export const WORK_TOKEN_FONT_FIELDS: (keyof WorkSkinTokens)[] = [
  'fontDisplay', 'fontBody', 'fontMono',
];

/** Numeric bounds (inclusive). A skin token outside its range fails loud. */
export const WORK_TOKEN_BOUNDS: Record<string, { min: number; max: number }> = {
  fsBodyPx:  { min: 12, max: 24 },
  lhBody:    { min: 1.0, max: 2.2 },
  wrapPx:    { min: 960, max: 1680 },
  gutterPx:  { min: 12, max: 120 },
  secPadYPx: { min: 32, max: 260 },
  radiusPx:  { min: 0, max: 48 },
  heroDisplayScaleMax:   { min: 48, max: 200 },
  heroDisplayLineHeight: { min: 0.8, max: 1.4 },
  heroDisplayTracking:   { min: -0.08, max: 0.02 },
};

/** Enum-constrained numeric tokens. */
export const WORK_TOKEN_ENUMS: Record<string, number[]> = {
  displayWeight: [300, 400, 500, 600, 700, 800],
  heroDisplayWeight: [300, 400, 500, 600, 700, 800],
};

/** Enum-constrained STRING tokens. */
export const WORK_TOKEN_STRING_ENUMS: Record<string, string[]> = {
  heroAlign: ['start', 'center'],
  sectionHeaderStyle: ['plain', 'rule'],
};

/** Boolean tokens (validated as `typeof === 'boolean'`). */
export const WORK_TOKEN_BOOL_FIELDS: (keyof WorkSkinTokens)[] = ['heroNumeral', 'footerWordmark'];

// ── Compatibility matrix (cross-token rules) ────────────────────────────────
// Rules that no single-field bound can express (e.g. paper vs ink must contrast).
// Starts EMPTY; entries are added as the Kontur/Pulse lint (phases 3/4/6/7)
// discovers real token interactions. A rule reporting `violated === true` adds a
// line to the `assertSkinTokens` violation list.
export interface WorkTokenCompatRule {
  id: string;
  describe: string;
  violated: (t: WorkSkinTokens) => boolean;
}

export const WORK_TOKEN_COMPAT: WorkTokenCompatRule[] = [];

// ── Loud validation ─────────────────────────────────────────────────────────
/** Minimal structural shape `assertSkinTokens` needs (avoids a skin.ts cycle). */
export interface SkinTokenCarrier {
  id?: string;
  tokens: WorkSkinTokens;
}

/**
 * Validate a skin's tokens against the contract. Collects EVERY violation and
 * throws a single Error listing all of them (so a bad skin surfaces every problem
 * at once, at construction/load — never a silent partial render).
 */
export function assertSkinTokens(skin: SkinTokenCarrier): void {
  const id = skin?.id ?? '?';
  const t = skin?.tokens;
  if (!t) {
    throw new Error(`[work-skeleton] skin "${id}" has no tokens object`);
  }

  const violations: string[] = [];

  for (const f of WORK_TOKEN_COLOR_FIELDS) {
    const v = (t as any)[f];
    if (typeof v !== 'string' || v.trim() === '') {
      violations.push(`token "${String(f)}" (${WORK_TOKEN_VARS[f]}) must be a non-empty colour string`);
    }
  }
  for (const f of WORK_TOKEN_FONT_FIELDS) {
    const v = (t as any)[f];
    if (typeof v !== 'string' || v.trim() === '') {
      violations.push(`token "${String(f)}" (${WORK_TOKEN_VARS[f]}) must be a non-empty font-stack string`);
    }
  }
  for (const [f, b] of Object.entries(WORK_TOKEN_BOUNDS)) {
    const varName = WORK_TOKEN_VARS[f as keyof WorkSkinTokens];
    const v = (t as any)[f];
    if (typeof v !== 'number' || Number.isNaN(v)) {
      violations.push(`token "${f}" (${varName}) must be a number`);
    } else if (v < b.min || v > b.max) {
      violations.push(`token "${f}" (${varName}) = ${v} is out of range [${b.min}, ${b.max}]`);
    }
  }
  for (const [f, allowed] of Object.entries(WORK_TOKEN_ENUMS)) {
    const varName = WORK_TOKEN_VARS[f as keyof WorkSkinTokens];
    const v = (t as any)[f];
    if (!allowed.includes(v)) {
      violations.push(`token "${f}" (${varName}) = ${v} is not one of {${allowed.join(', ')}}`);
    }
  }
  for (const [f, allowed] of Object.entries(WORK_TOKEN_STRING_ENUMS)) {
    const varName = WORK_TOKEN_VARS[f as keyof WorkSkinTokens];
    const v = (t as any)[f];
    if (!allowed.includes(v)) {
      violations.push(`token "${f}" (${varName}) = ${JSON.stringify(v)} is not one of {${allowed.join(', ')}}`);
    }
  }
  for (const f of WORK_TOKEN_BOOL_FIELDS) {
    const v = (t as any)[f];
    if (typeof v !== 'boolean') {
      violations.push(`token "${String(f)}" (${WORK_TOKEN_VARS[f]}) must be a boolean`);
    }
  }
  for (const rule of WORK_TOKEN_COMPAT) {
    try {
      if (rule.violated(t)) violations.push(`compatibility "${rule.id}": ${rule.describe}`);
    } catch {
      violations.push(`compatibility "${rule.id}": rule threw while evaluating`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `[work-skeleton] skin "${id}" has ${violations.length} token violation(s):\n - ${violations.join('\n - ')}`,
    );
  }
}

// ── Serialization ───────────────────────────────────────────────────────────
/**
 * Serialize a skin's tokens into the `:root{--wk-*}` block plus the base
 * `[data-surface]` band rules and the palette-scoped body baseline. Palette accent
 * vars + variant overrides + knob CSS are appended separately by skin.ts
 * (`buildWorkStylesheet`). Blocks never paint their own full-bleed background —
 * the `[data-surface]` wrapper does.
 */
export function serializeSkinTokens(t: WorkSkinTokens): string {
  // Hero alignment expands into three derived vars (one enum → text-align +
  // vertical align-items + column cross-axis) so the SAME hero CSS renders
  // neutral (start = current bottom-left) or dramatic (center = Atelier cover).
  const heroCenter = t.heroAlign === 'center';
  const heroTextAlign = heroCenter ? 'center' : 'left';
  const heroItems = heroCenter ? 'center' : 'flex-end';   // .wk-hero vertical
  const heroInline = heroCenter ? 'center' : 'stretch';   // .wk-hero__in cross-axis
  // Section-header grammar (Wave 2A): one enum → 5 derived vars that flip the
  // shared head CSS between the current stacked head (`plain`, byte-identical to
  // the fallback defaults) and Atelier's rule header (`rule`). All 5 vars carry
  // the plain value for a non-setting skin, so `[data-palette]` still renders as
  // before.
  const ruleHead = t.sectionHeaderStyle === 'rule';
  const headDisplay = ruleHead ? 'flex' : 'block';
  const headBorderW = ruleHead ? '2px' : '0';
  const headPadTop  = ruleHead ? '18px' : '0';
  const headNum     = ruleHead ? 'block' : 'none'; // index-numeral ::before display
  const headMetaMl  = ruleHead ? 'auto' : '0';     // eyebrow → right-aligned meta
  // Footer wordmark (Wave 2A): the boolean expands into the heading's giant-type
  // vars + the accent-dot display. Defaults equal the current compact footer.
  const fw = t.footerWordmark;
  const fwFs  = fw ? 'clamp(48px,11vw,170px)' : 'clamp(1.7rem,4vw,3rem)';
  const fwLh  = fw ? '0.85' : '1.02';
  const fwLs  = fw ? '-0.04em' : '-0.02em';
  const fwDot = fw ? 'inline' : 'none';
  return `:root{
  --wk-paper:${t.paper};
  --wk-paper-2:${t.paper2};
  --wk-ink:${t.ink};
  --wk-ink-soft:${t.inkSoft};
  --wk-ink-mute:${t.inkMute};
  --wk-line:${t.line};
  --wk-line-soft:${t.lineSoft};
  --wk-dark:${t.dark};
  --wk-on-dark:${t.onDark};
  --wk-on-dark-soft:${t.onDarkSoft};
  --wk-line-dark:${t.lineDark};
  --wk-ff-display:${t.fontDisplay};
  --wk-ff-body:${t.fontBody};
  --wk-ff-mono:${t.fontMono};
  --wk-fs-body:${t.fsBodyPx}px;
  --wk-lh-body:${t.lhBody};
  --wk-wrap:${t.wrapPx}px;
  --wk-gutter:${t.gutterPx}px;
  --wk-sec-y:${t.secPadYPx}px;
  --wk-r:${t.radiusPx}px;
  --wk-display-weight:${t.displayWeight};
  --wk-hero-align:${heroTextAlign};
  --wk-hero-items:${heroItems};
  --wk-hero-inline:${heroInline};
  --wk-hero-scale:${t.heroDisplayScaleMax}px;
  --wk-hero-lh:${t.heroDisplayLineHeight};
  --wk-hero-tracking:${t.heroDisplayTracking}em;
  --wk-hero-weight:${t.heroDisplayWeight};
  --wk-hero-num-display:${t.heroNumeral ? 'block' : 'none'};
  --wk-sec-head-display:${headDisplay};
  --wk-sec-head-bw:${headBorderW};
  --wk-sec-head-pt:${headPadTop};
  --wk-sec-head-num:${headNum};
  --wk-sec-head-meta-ml:${headMetaMl};
  --wk-footer-wm-fs:${fwFs};
  --wk-footer-wm-lh:${fwLh};
  --wk-footer-wm-ls:${fwLs};
  --wk-footer-dot:${fwDot};
}
[data-surface="paper"]{background:var(--wk-paper);color:var(--wk-ink);}
[data-surface="paper-2"]{background:var(--wk-paper-2);color:var(--wk-ink);border-block:1px solid var(--wk-line);}
[data-surface="dark"]{background:var(--wk-dark);color:var(--wk-on-dark);}
[data-surface="accent"]{background:var(--wk-accent);color:var(--wk-accent-ink, #fff);}
[data-palette]{background:var(--wk-paper);color:var(--wk-ink);font-family:var(--wk-ff-body);font-weight:400;font-size:var(--wk-fs-body);line-height:var(--wk-lh-body);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;}`;
}

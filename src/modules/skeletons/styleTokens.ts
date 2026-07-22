// src/modules/skeletons/styleTokens.ts
// USER style-token vocabulary — the "Design ▾" layer (work-skeleton D1, §D.2).
//
// TWO token surfaces exist (see docs/task/work-skeleton.plan.md §D):
//   1. SKIN tokens (`--wk-*`, compile-time, bounded)   → tokenContract.ts
//   2. USER style tokens (`--u-*`, RUNTIME, this file) → per-section design
//      overrides the user picks in the Design ▾ panel (panel UI itself is out of
//      scope for D1 — only the vocabulary + serializer land here).
//
// PURE DATA + LOGIC — no React, no template-module imports, no skeleton imports.
// So this file never enters the dispatch firewall and is safe to import from the
// renderers and from `src/types/template.ts` (type-only there).
//
// Every value is a DESIGNED COORDINATE (an enum step), never a free number — the
// panel can only offer curated looks. Persisted at
// `Project.themeValues.styleTokens[sectionId]` (JSON — no migration). The
// serializer emits `[data-sid="<sectionId>"]{--u-*:…}` CSS blocks that the
// skeleton's injectors inline; every block core's root carries `data-sid` and
// consumes `var(--u-*, <skeleton default>)`, so an absent/`default` value falls
// through to the skeleton's baseline.

// `./ids` is the ONLY import here and is pure data (no React, no skeleton/template
// modules) — importing it keeps this file firewall-safe.
import { isSkeletonBacked } from './ids';

// ── Value enums (each a curated coordinate) ─────────────────────────────────
export type UBackground = 'default' | 'paper' | 'paper-2' | 'dark' | 'accent';
export type USpacingY   = 'default' | 'compact' | 'normal' | 'spacious';
export type UCorners    = 'default' | 'sharp' | 'soft' | 'round';
export type UBorder     = 'default' | 'none' | 'hairline' | 'solid';
export type UShadow     = 'default' | 'none' | 'soft' | 'strong';
export type UOpacity    = 'default' | 'full' | 'muted' | 'faint';
/** Header sticky/fixed lever. Design state (not copy) — stored here, not on the
 *  header content element. Consumed as a `data-wk-header-mode` attribute by the
 *  header block in phase 6 (NOT a CSS var), so it is deliberately NOT serialized
 *  by `serializeStyleTokens`. */
export type UHeaderMode = 'default' | 'static' | 'fixed';

/** One section's user style-token selection. Every field optional; an absent field
 *  — or the explicit `'default'` — emits NOTHING (skeleton baseline shows through). */
export interface SectionStyleTokens {
  background?: UBackground;
  spacingY?: USpacingY;
  corners?: UCorners;
  border?: UBorder;
  shadow?: UShadow;
  opacity?: UOpacity;
  headerMode?: UHeaderMode;
}

/** The project's full style-token map, keyed by `sectionId` (`${type}-${uuid}`). */
export type StyleTokens = Record<string, SectionStyleTokens>;

// ── Value → CSS custom-property declarations ────────────────────────────────
// Each coordinate maps to zero or more `[--u-var, value]` pairs. `'default'`
// (and any absent value) maps to `[]` → emits nothing → skeleton default wins.

type Decls = ReadonlyArray<readonly [string, string]>;

// CONTRAST INVARIANT (section-background D2): every NON-default surface emits the
// COMPLETE `--u-bg` + `--u-fg` pair. Dark-default block roots (`.wk-hero`,
// `.wk-hero-img`, `.wk-footer`) declare `color:var(--u-fg, var(--wk-on-dark))` at
// the root, which BEATS any colour inherited from the wrapper's
// `[data-surface="paper"]` rule — so a bg-only `paper`/`paper-2` override would
// paint light-on-light. Never add a background-only row here.
//
// CONTRAST INVARIANT, PART 2 (section-background N8, phase 2). The root pair is
// NOT the whole story: block CHILDREN hard-code a POLARITY-SPECIFIC skin token and
// so ignore `--u-fg` entirely. Both directions are real:
//   - dark-default blocks pin ON-DARK values on children — `.wk-footer__note` /
//     `__eyebrow` / `__bottom` / `__col-head` / `__contact-line` use
//     `color:var(--wk-on-dark-soft)` and `.wk-footer__top` uses
//     `border-bottom:1px solid var(--wk-line-dark)` (Footer/styles.ts:16-35). A
//     `paper` override there leaves near-white secondary text + hairlines on a
//     light band.
//   - light-default blocks pin INK values — `.wk-about__eyebrow`,
//     `.wk-proof__eyebrow`, `.wk-faq__a`, `.wk-packages__desc`, … use
//     `var(--wk-ink-soft)` / `var(--wk-ink-mute)` / `var(--wk-line)`, plus card
//     fills of `var(--wk-paper)`. A `dark` override there leaves dark-grey labels
//     and light cards on a dark band.
// Spec AC: "No surface choice can produce an unreadable text/background pairing."
//
// FIX: each non-default surface also RE-POINTS the polarity-bound skin tokens to
// the family that matches the chosen band, at the block root (`[data-sid]`), so
// every descendant that reads them follows the override by inheritance — no
// per-block CSS and no per-block selector list to keep in sync.
//
// CONTAINMENT (why this is safe): these declarations exist ONLY inside a
// `[data-sid]` block, and a `[data-sid]` block is only ever emitted for a section
// the user has EXPLICITLY overridden. With no override nothing is emitted at all,
// so every existing draft (Kundius included) is untouched — this cannot change any
// skin-default surface, including atelier's own `dark` proof/contact/footer bands.
const INK_FAMILY: Decls = [
  ['--wk-ink', 'var(--wk-on-dark)'],
  ['--wk-ink-soft', 'var(--wk-on-dark-soft)'],
  ['--wk-ink-mute', 'var(--wk-on-dark-soft)'],
  ['--wk-line', 'var(--wk-line-dark)'],
  ['--wk-line-soft', 'var(--wk-line-dark)'],
];
/** Light band: only the ON-DARK family needs re-pointing (ink tokens already fit). */
const ON_DARK_TO_INK: Decls = [
  ['--wk-on-dark', 'var(--wk-ink)'],
  ['--wk-on-dark-soft', 'var(--wk-ink-soft)'],
  ['--wk-line-dark', 'var(--wk-line)'],
];

const BACKGROUND_CSS: Record<UBackground, Decls> = {
  default: [],
  paper: [
    ['--u-bg', 'var(--wk-paper)'], ['--u-fg', 'var(--wk-ink)'],
    ...ON_DARK_TO_INK,
  ],
  'paper-2': [
    ['--u-bg', 'var(--wk-paper-2)'], ['--u-fg', 'var(--wk-ink)'],
    ...ON_DARK_TO_INK,
  ],
  dark: [
    ['--u-bg', 'var(--wk-dark)'], ['--u-fg', 'var(--wk-on-dark)'],
    ...INK_FAMILY,
    // Card/placeholder fills (`.wk-proof__card`, `.wk-packages__card`,
    // `.wk-*__ph`) paint `var(--wk-paper)`/`var(--wk-paper-2)` explicitly but set
    // no colour of their own — on a dark band that is white-on-white. Re-point the
    // surface family too so nested fills follow the override.
    ['--wk-paper', 'var(--wk-dark)'],
    ['--wk-paper-2', 'var(--wk-dark)'],
  ],
  accent: [
    ['--u-bg', 'var(--wk-accent)'], ['--u-fg', 'var(--wk-accent-ink, #fff)'],
    ['--wk-ink', 'var(--wk-accent-ink, #fff)'],
    ['--wk-ink-soft', 'var(--wk-accent-ink, #fff)'],
    ['--wk-ink-mute', 'var(--wk-accent-ink, #fff)'],
    ['--wk-on-dark', 'var(--wk-accent-ink, #fff)'],
    ['--wk-on-dark-soft', 'var(--wk-accent-ink, #fff)'],
    // NB: `--wk-line-dark` is deliberately NOT re-declared here — pointing it at
    // itself would be a custom-property CYCLE (guaranteed-invalid at computed-value
    // time), which would take the hairline out entirely rather than restyle it.
    ['--wk-line', 'var(--wk-line-dark)'],
    ['--wk-line-soft', 'var(--wk-line-dark)'],
    ['--wk-paper', 'var(--wk-accent)'],
    ['--wk-paper-2', 'var(--wk-accent)'],
  ],
};

const SPACING_CSS: Record<USpacingY, Decls> = {
  default:  [],
  compact:  [['--u-space-y', '0.75']],
  normal:   [['--u-space-y', '1']],
  spacious: [['--u-space-y', '1.4']],
};

const CORNERS_CSS: Record<UCorners, Decls> = {
  default: [],
  sharp: [['--u-radius', '0px']],
  soft:  [['--u-radius', '10px']],
  round: [['--u-radius', '24px']],
};

const BORDER_CSS: Record<UBorder, Decls> = {
  default: [],
  none:     [['--u-border', 'none']],
  hairline: [['--u-border', '1px solid var(--wk-line)']],
  solid:    [['--u-border', '1.5px solid var(--wk-ink)']],
};

const SHADOW_CSS: Record<UShadow, Decls> = {
  default: [],
  none:   [['--u-shadow', 'none']],
  soft:   [['--u-shadow', '0 2px 12px rgba(0,0,0,0.06)']],
  strong: [['--u-shadow', '0 8px 30px rgba(0,0,0,0.12)']],
};

const OPACITY_CSS: Record<UOpacity, Decls> = {
  default: [],
  full:  [['--u-opacity', '1']],
  muted: [['--u-opacity', '0.9']],
  faint: [['--u-opacity', '0.75']],
};

// Deterministic field order → stable serialized output (parity-critical).
const FIELD_CSS = {
  background: BACKGROUND_CSS,
  spacingY: SPACING_CSS,
  corners: CORNERS_CSS,
  border: BORDER_CSS,
  shadow: SHADOW_CSS,
  opacity: OPACITY_CSS,
} as const;

const FIELD_ORDER = ['background', 'spacingY', 'corners', 'border', 'shadow', 'opacity'] as const;

/** All `--u-*` custom properties this vocabulary can emit (for phase-3+ block cores
 *  that consume `var(--u-*, <skeleton default>)`). `headerMode` drives a data-attr,
 *  not a var — hence absent here.
 *
 *  NOTE: a non-default `background` ALSO re-points polarity-bound SKIN tokens
 *  (`--wk-ink*`, `--wk-on-dark*`, `--wk-line*`, `--wk-paper*`) inside that one
 *  section's `[data-sid]` block — see the contrast invariant above. Those are skin
 *  names, not `--u-*` names, so they are deliberately not listed here. */
export const USER_STYLE_TOKEN_VARS = [
  '--u-bg', '--u-fg', '--u-space-y', '--u-radius', '--u-border', '--u-shadow', '--u-opacity',
] as const;

/**
 * Serialize a project's style-token map into per-section `[data-sid]` CSS blocks.
 * Only non-default coordinates emit declarations; a section with no active
 * coordinate emits no block; empty/absent input → empty string. `headerMode` is
 * intentionally skipped (consumed as a data-attr by the header block).
 */
export function serializeStyleTokens(styleTokens?: StyleTokens | null): string {
  if (!styleTokens) return '';
  const blocks: string[] = [];
  for (const sectionId of Object.keys(styleTokens)) {
    const st = styleTokens[sectionId];
    if (!st) continue;
    const decls: string[] = [];
    for (const field of FIELD_ORDER) {
      const value = st[field];
      if (!value || value === 'default') continue;
      const map = FIELD_CSS[field] as Record<string, Decls>;
      const pairs = map[value] ?? [];
      for (const [name, val] of pairs) decls.push(`${name}:${val};`);
    }
    if (decls.length === 0) continue;
    // sectionIds are `${type}-${uuid}` (safe); strip quotes/backslashes defensively.
    const safeId = String(sectionId).replace(/["\\]/g, '');
    blocks.push(`[data-sid="${safeId}"]{${decls.join('')}}`);
  }
  return blocks.join('\n');
}

/**
 * Resolve the `data-surface` value for ONE section wrapper (section-background D4).
 *
 * The user's per-section background override is ID-keyed
 * (`styleTokens[sectionId].background`); the template skin's default is TYPE-keyed
 * and is passed in as `fallback` (callers compute it via
 * `tmpl.getSurfaceForSection(sectionType)`), so the two key spaces never mix.
 *
 * GATED on `isSkeletonBacked(templateId)`: `styleTokens` is project-GLOBAL while the
 * templateId is user-switchable, so an ungated resolver would leak a `dark`/`paper-2`
 * value picked on the work skeleton onto hearth/lex after a template switch. The
 * surface vocabulary is a SKELETON concept — `isSkeletonBacked` is the axis, not
 * `isWorkCopyTemplate` (that's the copy-engine axis).
 *
 * Absent tokens, an absent section entry, or the explicit `'default'` → `fallback`.
 */
export function resolveSectionSurface(
  templateId: string | null | undefined,
  styleTokens: StyleTokens | null | undefined,
  sectionId: string,
  fallback: string,
): string {
  if (!isSkeletonBacked(templateId)) return fallback;
  const override = styleTokens?.[sectionId]?.background;
  if (!override || override === 'default') return fallback;
  return override;
}

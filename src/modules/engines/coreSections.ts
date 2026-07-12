// src/modules/engines/coreSections.ts
// FROZEN (scalePlan §3) — engine-core section sets. Coder-maintained; a template
// that declares an engine MUST resolve every section here to a real (non-
// placeholder) block in BOTH edit and published modes (conformance test,
// spec 01 phase 4). Do not extend casually: shrinking a set weakens the
// guarantee, growing it can silently un-ship an existing template.
//
// Rationale (scale-01 plan, D-A — resolver keys re-verified 2026-07-07, no drift):
// - thing: the guaranteed COMMON contract across meridian + vestria is only
//   `header, hero, features, testimonials, footer` (5). Vestria has NO
//   `pricing`/`cta` sections — its CTA is the `contact` lead-form — so
//   meridian's 7 would make vestria unshippable under conformance. `pricing`
//   and `cta` are meridian-specific extras, not engine guarantees. (Rejected
//   alternative: alias table `cta → cta|contact` — fuzzier "frozen" set, more
//   machinery for zero v0 benefit.)
// - trust: hearth's canonical 7; lex has the identical 7; surge has these 7
//   plus delta sections (logos/about/casestudies/stats). No tension.
// - work: generalized from granth's writer-shaped 6 to the template-agnostic
//   `hero, work, about, footer` (4) now that atelier — the anticipated second
//   shortlist-eligible work template (visual-portfolio) — lands. `work` is the
//   generic showcase section; granth resolves it via a resolver alias to its
//   existing books/portfolio block pair (resolveGranthBlock.ts), so granth's
//   visuals are byte-for-byte unchanged. lumen(9) is D4 bespoke/off-funnel
//   (never shortlisted), EXEMPT from engine-core conformance via `bespoke: true`
//   in templateMeta (it still gets the capability-evidence check).

import type { CopyEngine } from '@/types/brief';

export const engineCoreSections: Record<CopyEngine, readonly string[]> = {
  thing: ['header', 'hero', 'features', 'testimonials', 'footer'],
  trust: ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'],
  work: ['hero', 'work', 'about', 'footer'],
} as const;

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
// - work: granth's canonical 6. granth(6) ∩ lumen(9) is only
//   `hero, about, footer` — too thin to mean anything — and lumen is D4
//   bespoke/off-funnel (never shortlisted), so it is EXEMPT from engine-core
//   conformance via `bespoke: true` in templateMeta (it still gets the
//   capability-evidence check). Revisit work-core when a second
//   shortlist-eligible work template lands.

import type { CopyEngine } from '@/types/brief';

export const engineCoreSections: Record<CopyEngine, readonly string[]> = {
  thing: ['header', 'hero', 'features', 'testimonials', 'footer'],
  trust: ['header', 'hero', 'services', 'testimonials', 'packages', 'cta', 'footer'],
  work: ['hero', 'about', 'books', 'writing', 'praise', 'footer'],
} as const;

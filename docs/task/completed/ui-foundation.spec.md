---
tier: full
tier-why: global token layer + complete primitive reskin (>15 files) + template/published-bleed risk requiring proven isolation
---

# ui-foundation — spec

## Problem / why
Designer handoff landed (`docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/`)
covering all four app surfaces (Auth, Dashboard, Editor, Onboarding). Every redesign
spec (auth / dashboard / editor-shell) consumes the same tokens + primitives. Building
those ad-hoc per screen = drift + duplicated buttons. Foundation must land first so no
consuming spec ever invents its own primitive.

## Goal
Ship the shared visual foundation for app chrome: one global token layer (fonts, color,
radius, shadow from the handoff README) + a complete set of reskinned shared primitives.
End state is a single system — old app UI is fully replaced across the track, no parallel
component library, big-bang deploy. Generated landing pages are untouched.

## Scope IN
- **Tokens** from handoff README §Design System: color table, radius scale, shadow set,
  type scale (display/body weights + letter-spacing/line-height), placeholder-image
  stripe pattern, recurring badge styles.
- **Fonts (all self-hosted** under `public/fonts/`, matching existing infra): Onest,
  JetBrains Mono, Material Symbols Rounded (variable icon font), Caveat.
- **Icons**: self-hosted Material Symbols Rounded rendered by icon name (per handoff),
  filled state via `font-variation-settings:'FILL' 1`. Pixel-faithful to design.
- **Complete primitive set** (everything shared across ≥2 handoff screens), reskinned
  in place on existing `src/components/ui/` where a primitive already exists:
  buttons (primary blue / coral CTA / secondary / ghost / destructive), inputs,
  select, checkbox, switch, textarea, cards/panels, badges, pills / status chips,
  nav items (active = `#003E80` on `#e6f0ff`), segmented control, tabs, modal shell,
  toast/notification, striped image-placeholder component.
- **Isolation mechanism**: tokens scoped so they cannot reach `src/modules/templates/*`
  or the published renderer (see Constraints).

## Scope OUT (non-goals)
- No screen redesigns — Auth, Dashboard, Editor-shell are their own consuming specs.
- **No changes to generated pages** — template blocks, `.published.tsx`, published
  renderer, template tokens/palettes. Hard boundary.
- No new-behavior primitives (toolbar chrome, CMS boards, link picker internals) — those
  belong to toolbarPlan / work vertical; foundation only supplies generic primitives they
  reuse (e.g. segmented control, modal shell).
- No dev-only component gallery (first consuming screen = acceptance surface).
- No responsive/mobile work — handoff is desktop-first, mobile unspecified. Tokens must
  not *preclude* responsive, but no breakpoints designed here.
- No marketing/signed-out landing page (excluded from handoff).

## Constraints
- **Template/published isolation is the #1 constraint.** Template blocks use Tailwind
  utility classes; redefining Tailwind's global palette/radius/font would silently shift
  generated pages. Foundation tokens must be scoped (app-shell class or `data-` attr, or
  a namespaced token set) so `src/modules/templates/*` and the published renderer render
  byte-identical before/after. The planner picks the mechanism; the guarantee is fixed.
- Reskin existing primitives in place — do NOT create a parallel component library.
  One primitive set at track end.
- Self-host all fonts (no Google Fonts CDN); follow existing `@font-face` pattern in
  `src/styles/fonts-self-hosted.css` + preload approach.
- All values match the handoff README tables closely (high-fidelity — colors/radii/
  shadows/type are final).
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/README.md` — token tables
  (color/radius/shadow/type), badge styles, placeholder pattern, per-surface screen index.
- `docs/Design/.../Lessgo Auth.dc.html`, `Lessgo Dashboard.dc.html`,
  `Lessgo Editor Redesign.dc.html`, `Lessgo Onboarding Flow.dc.html` — read markup for
  exact structure/spacing/color/type of each primitive in context.
- `src/styles/fonts-self-hosted.css` + `public/fonts/` — existing self-host pattern to
  mirror for the 4 new families.
- `src/components/ui/` (Radix) — existing primitives to reskin in place.
- `src/modules/Design/designTokens.ts` — existing shared design-token module (understand
  its scope vs the new app-chrome token layer; must not collide with template tokens).
- `docs/tracks/uiRedesignPlan.md` — track plan; this is Lane-1 spec #1 (merges first).

## Font sourcing (LICENSING CLEARED 2026-07-16 — no purchase, all libre)
All app-chrome fonts are free/self-hostable; the font-license human gate is **resolved**.
Fetch commands + obligations below — execute in the font phase, mirror the existing
`public/fonts/<family>/` + `src/styles/fonts-self-hosted.css` pattern (Latin-subset woff2,
`<family>-latin-<weight>-normal.woff2`; variable → `format('woff2-variations')` + range).

| Font | License | Obligation |
|---|---|---|
| Onest | SIL OFL 1.1 | ship `OFL.txt` in the dir; don't rename modified copies |
| JetBrains Mono | SIL OFL 1.1 | already self-hosted (`public/fonts/jetbrains-mono/`) — OFL already satisfied |
| Material Symbols Rounded | Apache 2.0 | retain `LICENSE`+`NOTICE` in the dir |
| Caveat (optional, Auth accent) | SIL OFL 1.1 | ship `OFL.txt` if kept |

**Onest** (weights 400/500/600/700/800):
```bash
mkdir -p public/fonts/onest
for w in 400 500 600 700 800; do
  curl -L -o public/fonts/onest/onest-latin-$w-normal.woff2 \
    "https://cdn.jsdelivr.net/fontsource/fonts/onest@latest/latin-$w-normal.woff2"
done
```
**JetBrains Mono** — 400/500 already present; handoff wants 400–600, add ONLY 600:
```bash
curl -L -o public/fonts/jetbrains-mono/jetbrains-mono-latin-600-normal.woff2 \
  "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-600-normal.woff2"
```
**Material Symbols Rounded** (variable icon font, FILL/GRAD/opsz/wght axes):
```bash
mkdir -p public/fonts/material-symbols-rounded
curl -L -o public/fonts/material-symbols-rounded/material-symbols-rounded.woff2 \
  "https://github.com/google/material-design-icons/raw/master/variablefont/MaterialSymbolsRounded%5BFILL%2CGRAD%2Copsz%2Cwght%5D.woff2"
```
**⚠️ MANDATORY: subset Material Symbols.** The raw variable font is ~3–4 MB (thousands of
glyphs) → LCP killer. Subset to ONLY the icons the handoff uses (`arrow_forward, mail,
lock, auto_awesome, push_pin, perm_media, tune`, + any others found by grepping the four
`.dc.html` files for Material-Symbols text nodes) via `pyftsubset`/`glyphhanger`, KEEPING
the `FILL,GRAD,opsz,wght` axes so `font-variation-settings:'FILL' 1` still animates. Full
unsubset font must NOT be committed.

## Open exploration questions (feeds scout)
- **Isolation**: how do template blocks / `.published.tsx` currently pull color/radius/
  font — Tailwind utilities, template `tokens.ts` CSS vars, or both? What's the safest
  scoping mechanism that lets app chrome restyle without touching generated output?
- Which handoff primitives already exist in `src/components/ui/` (reskin) vs are net-new?
- Does `tailwind.config` theme feed both app chrome AND template blocks today? Where does
  the seam sit?
- Existing font preload path (`CriticalFontPreload.tsx`) — how to add 4 families without
  regressing template hero-font preload.
- Material Symbols Rounded as a self-hosted variable font — feasible wiring + FILL axis.

## Candidate human gates
- **MANDATORY: template/published no-change gate.** Before merge, founder eyeballs a
  published page (`/p/[slug]`) + an editor page before/after — must be visually identical.
  Proves isolation held. (Founder does QA manually.)
- Font-license/self-host sourcing for the 4 families (confirm before committing binaries).

## Acceptance criteria
- [ ] All 4 fonts self-hosted + loading (Onest, JetBrains Mono, Material Symbols Rounded,
      Caveat); icons render by name with FILL axis working.
- [ ] Full token layer present (color/radius/shadow/type/placeholder/badge) matching
      handoff README values.
- [ ] Complete primitive set implemented + reskinned in place (list under Scope IN),
      each matching its handoff appearance.
- [ ] No parallel component library — existing `src/components/ui/` primitives reskinned,
      not duplicated.
- [ ] `tsc`, `test:run`, `npm run build` green.
- [ ] **Generated pages unchanged**: a published page + an editor-rendered page are
      visually identical before/after (founder-verified gate).

## Pilot / smallest slice
Not phased as pilot — foundation is atomic (tokens + primitives land together, verified
by the isolation gate). It is itself the thin base of Lane 1; the first *consuming* spec
(`auth-redesign`) is where the foundation gets proven against a real screen. Build order
within the spec: (1) fonts + token layer + isolation mechanism → verify no template change,
(2) primitives on top of tokens.

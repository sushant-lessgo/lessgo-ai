# atelier-template — spec

First on-demand template (templatePlan queue #1) = the factory pipeline's real-customer drill.
Work-engine **visual-portfolio** template `atelier`. Anchor customer: Kundius Photography (most
important client; rejected Lumen's feel). Agreed 2026-07-11.

## Decision trail (scalePlan §7 gate run, 2026-07-11)
- photographer → **work engine** (T1: browsable work persuades).
- Rung **D** (new template): work engine's only fitting-style options don't exist — granth is
  writer-shaped, lumen's feel was rejected by the customer, C (blocks on flagship) has no
  acceptable flagship. Plus rung **A**: `photographer` businessType entry.
- NOT bespoke (templatePlan roadmap law): registered, token-driven, capability-declared,
  conformance-tested — Kundius is customer #1 of a servable template, not owner of a one-off.

## Who it serves
Work-engine businesses whose browsable work persuades: photographers (entry #1), designers,
studios, visual artists, makers. Style = warm/editorial + playful energy — the demand sweet spot
(coverage-100: warm/human 35% of demand vs tech/minimal 7%).

## Design source (customer taste-pick, done)
**Atelier layout × Kontur skin**: KPDirection2Atelier.html section grammar + composition;
KPDirection3Kontur tokens (Bricolage Grotesque + Hanken Grotesk, warm paper/ink, vermilion
accent, marquee playfulness). Hero = background-image slider. Designer brief:
`template-design/atelierKonturBrief.md` (Step-1 merged tiles → founder+customer pick → full
5-page expansion). Final approved HTML is this build's input and the handoff lint's test case.

## Goal
`atelier` registered and serveable: a photographer Brief passes the serve gate and gets a
complete, distinct, 5-page bilingual-capable site; Kundius live on it end-to-end.

## Scope
IN:
1. **Template module** `src/modules/templates/atelier/` — tokens/palettes (vermilion default +
   2–3 curated accents)/knobs (btn-radius, density, card treatment)/sectionRules/ThemeInjector/
   dual block pairs, per factory pipeline (kit → lint gap report → port → conformance → parity).
2. **Hero slider block** — autoplay crossfade + arrows/dots; published side = tiny vanilla JS
   asset (formHandler.js pattern) or CSS-only; degrades to static first image. #1 parity risk —
   explicit QA gate.
3. **Pages (5, grammar-derived):** Home · Work · Experiences · About · Contact — on the vestria
   multipage machinery (SiteContext/page-menu). No blog.
4. **Work-engine section grammar formalized** (granth seed → written contract: cover/work/
   packages/about/quote-band/contact + slots) — grammar only, feeds the design kit + conformance.
5. **Tiered packages** (T7 wave-1 item, pulled by need) — 2/3/4-card ranges.
6. **Back the existing `photographer` entry** — rung A is ALREADY DONE
   (`src/modules/businessTypes/config.ts:242`: copyEngine work, requiredCapabilities
   `['gallery']` deliberately unbacked, likelyIntents enquiry/book-call/follow-social,
   defaultStyle editorial-craft). Atelier ships the first `gallery`-declaring template →
   serve gate flips photographers from MANUAL-ONBOARD to SERVE by itself.
7. Capability declarations + honesty tests: `multipage · gallery · packages · lead-form ·
   bilingual`.
8. Kundius site: built, EN/NL authored (manual-fill), published; custom domain attach when she's
   ready (none live today).
OUT: blog capability · work-engine COPY GENERATION (stays roadmap step 4; manual-fill now) ·
assisted translation · lumen migration/deletion (retires as bespoke-off, untouched) · picker
"looks" UX beyond what the factory build ships · any Kundius-specific field/schema.

## Dependencies (order)
1. `i18n-phase-1` merged (bilingual layer this template declares).
2. `template-factory` run complete IN FULL (founder ruling: one go) — kit generator, handoff
   lint, `templateConformance()`, screenshot parity QA, knobs pilot, skill rewrite. **Its
   end-to-end drill criterion IS this build** (atelier/work replaces salon/trust).
3. Approved designer HTML (can progress in parallel; blocks the port phase only).
4. newGeneration Gate 0 (vestria multipage parity QA) — pending; absorb into this build's parity
   gate if still open (flag at plan time).

## Constraints
- Dual-renderer parity everywhere; slider + language toggle are the two hot spots.
- Bundle firewall: atelier loads via registry async loader only.
- Copy never knows templateId; knobs/palettes render-side only.
- Fonts self-hosted (Bricolage Grotesque + Hanken Grotesk added to public/fonts + preload).
- Designer's bar: no partial template (scalePlan §11.3); conformance green = done.
- audienceType wiring: Kundius = service audience today; engine tagging = work. Registration
  shape follows whatever List-3/templateMeta form the factory build lands — don't invent a
  parallel mechanism (plan decision).

## Acceptance
- [ ] `templateConformance('atelier')` green (core-set coverage, consumes ⊆ contract, resolve +
      distinctness both modes, capability honesty, published/client boundary, knob set, **editor
      basics** — logo upload, all text editable, image slots wired, button/link configure, nav +
      footer links, collection add/remove/reorder, social links, form config, knob switching;
      per factory spec's editor-basics contract).
- [ ] Screenshot parity diff green; founder parity sign-off.
- [ ] Serve gate: photographer Brief → atelier offered (fit() passes); non-fitting Brief doesn't.
- [ ] Knob/palette axes switch live in-app with zero copy change, both renderers correct.
- [ ] Slider: autoplay + manual controls on published static HTML; static-image fallback no-JS.
- [ ] Kundius: 5-page EN/NL site published; toggle + geo default work; founder would NOT have
      intervened (self-serve quality backstop).
- [ ] Zero bespoke: no Kundius-named field, file, or branch in platform code.

## Human gates
- Step-1 style-tile pick (founder + customer) — in motion.
- Curated palette taste pass.
- Parity QA sign-off.

## References
- `docs/task/template-factory.spec.md` — pipeline this build drills.
- `docs/task/i18n-phase-1.spec.md` — bilingual dependency.
- `docs/tracks/templatePlan.md` — ruling + queue; `docs/tracks/scalePlan.md` §7/§8/§11.3.
- `docs/research/coverage-100/findings.md` — work-engine grammar evidence (lean: hero+portfolio
  dominate; packages 33, gallery 44, multipage 99, bilingual 21).
- `template-design/KPDirection2Atelier.html` / `KPDirection3Kontur.html` /
  `atelierKonturBrief.md` (gitignored dir).
- `.claude/skills/new-template/SKILL.md` — landmines (dual-renderer, styles.ts, prefixing,
  data-surface, behaviors asset, two-identifier).

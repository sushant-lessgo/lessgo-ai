# templatePlan — coverage, factory, port queue

Track doc for template coverage toward public beta. Successor focus after scalePlan
implementation. Evidence base: `docs/research/coverage-100/findings.md` (canonical; independent
cross-check folded as its §10) · `docs/product/templateLibrary.md` (design inventory) ·
`docs/task/template-factory.spec.md` (factory spec — the build half of this track).

**North star:** a stranger signs up → serve gate says yes → gets a complete, distinct,
**multi-page (≈5-page + blog) site**. Coverage-100 (N=101): 98% multi-page · 62% blog ·
demand style warm/human 35% vs tech/minimal 7% (our supply is inverted) · engines
trust≈30% / place≈28–36% / thing≈20–24% / work≈14–19% / quick-yes≈0.

## Decisions (T-numbers — RULED 2026-07-11, Step-0 sitting)

| # | Decision | Status |
|---|---|---|
| T1 | **Designers/studios → work engine (default).** Ladder reordered — "the work is browsable and does the persuading → work" fires BEFORE "sells defined expertise → trust". Case studies ≠ browsable portfolio (case-study agencies stay trust). Engine remains two-layer: category default (List 1 lookup) + per-business override (classify signal + page-2 Brief 1-tap correct). | ✅ AGREED |
| T2 | **Salons → trust** — on merit, not convenience: salon ≈ dentist (appointment-based personal service; photos = proof of skill, not venue browsing). Trust + map-hours + gallery capabilities. Place is for venue-IS-the-product businesses only. | ✅ AGREED |
| T3 | **Storefront line = upfront self-selection, not inference.** Onboarding asks: lead/conversion site (store stays on Amazon/Flipkart/WhatsApp — we link) → proceed · storefront wanted → serve gate → manual-onboard + demand board. We never build checkout. | ✅ AGREED (user-shaped) |
| T4 | **Course/program sellers split:** solo instructor-led (name/face carries the sale) → trust · product-led/institutional (curriculum-first) → thing. Defaults only; T1 override applies. | ✅ AGREED |
| T5 | **Place engine: COMMITTED, build ASAP** — product backlog, sequenced after work engine; NOT immediate, NOT lead-gated (founder override of defer+trigger proposal). Mill (designed) + Cabin (DNA) are its templates-in-waiting. | ✅ RULED |
| T6 | **Beta floor = ALL 4 engines** (thing + trust + work + place) live before public beta (founder override of 3-engine proposal). quick-yes stays unbuilt (0/101 demand). Sequence: work (granth seed → full engine) then place. | ✅ RULED |
| T7 | **Contract patch in two waves.** Wave 1 now (engine-agnostic, before factory): sections `team` + `certsBand`, tiered pricing/packages variant, capabilities `booking-embed` + `reviews-widget`, + fold T1–T4 rulings into taxonomy. Wave 2 with place engine build: `menu`, `multi-location`, `events-calendar` (designed with place grammar, not guessed). | ✅ AGREED |
| T8 | **India sample top-up: DEFERRED** — GTM (India-first vs global) undecided; revisit at GTM decision. Priorities lock on current N=101; top-up can amend later. | ⏸ DEFERRED |

## Place engine (T5 — ruled)

**Committed; build ASAP after work engine; before beta (T6).** Context kept for the record: the
28–36% sample share is partly batch-2 publicWWW seam bias and real-funnel evidence was thin (1
place lead in first-20, 0 of 7 customers) — founder chose commitment over a demand trigger
because foundational coverage IS the current goal (avoid being stuck in private beta). Place =
venue-IS-the-product businesses only (restaurants, hotels, venues, facilities); dentists/salons/
gyms-as-coaching are trust + location capabilities. Wave-2 contract bundle (menu, multi-location,
events-calendar) lands with this build. Templates ready: Mill (fully designed) + Cabin (DNA).

## On-demand queue (rulings via scalePlan §7 table)

| # | Demand signal | Gate verdict | Build path | Status |
|---|---|---|---|---|
| 1 | **kundiousphotography** (anchor customer; rejected Lumen's feel; picked Atelier layout × Kontur skin + hero slider) | **D** (new template — no fitting work-engine flagship, C unavailable) + **A** (`photographer` entry) | `atelier` work-engine visual-portfolio template = **the factory drill** (replaces salon). Execution order: `i18n-phase-1` → `template-factory` (FULL, one go — founder ruling) → `atelier-template`. Specs in docs/task/. Pulls: tiered packages (T7 w1) · work-engine grammar formalization (step-4 grammar only, no copy gen) · **i18n Phase 1 UN-DEFERRED** (founder 2026-07-11; bilingual 21/101 + 28 non-EN, findings §8 #4). Lumen → retired bespoke-off. Designer brief: `template-design/atelierKonturBrief.md` (tiles → pick → 5-page expansion). | 🔨 SPECCED 2026-07-11 |

## Roadmap (post-Step-0; REORDERED 2026-07-11 — demand-first)

**Ruling: first-20 on-demand work takes precedence over corpus-derived priorities.** The piled-up
private-beta projects drive which templates/capabilities get built, each done END-TO-END and
GENERALIZED (no bespoke; §13 only as deliberate exception). Enforcement: every request passes
scalePlan §7's decision table (never D when C works); every new block ships token-driven +
capability-declared + conformance-tested even if one customer uses it today. Wave-1 contract
items are pulled in when a project needs them, not as an up-front phase. **The FIRST on-demand
template doubles as the factory pipeline drill** (replaces the hypothetical salon drill —
factory gets built around a real customer). Steps 3–5 below re-rank behind the on-demand queue;
gap-audit of the 13 designs runs when a demand signal points at one of them.

1. **Contract patch wave 1** — T7 via /feature: team, certsBand, tiered packages, booking-embed,
   reviews-widget + T1–T4 taxonomy edits. Freezes the target BEFORE factory (design kit derives
   from contract). (findings.md canonicalized ✅ 2026-07-11 — cross-check folded as §10,
   independent file deleted.)
2. **Factory** (template-factory spec, 2 pilot slices): (A) knobs pilot on hearth — 3 named
   looks in picker; (B) pipeline drill — kit generator + handoff lint + `templateConformance()`
   + screenshot parity QA, end-to-end on one template.
3. **Gap-audit the 13 library designs** — run the lint over each design HTML → per-template gap
   report (missing core sections/slots/multi-page chrome) → rank ports by style-demand ×
   engine-availability × gap-size. Expected first port: **Vital** (trust live, warm-clinical =
   demand sweet spot). Folio/Pulse/Riot gate on work engine; Mill/Cabin gate on place engine.
4. **Work engine completion** — granth seed → full engine (strategy prompts, section grammar,
   element contracts, voice). Unblocks photographers/writers/designers + 3 ports + writer track.
5. **Place engine build** — engine + wave-2 contract bundle (menu, multi-location,
   events-calendar) + Mill port (Cabin on demand).
6. **Weekly crank throughout** — ~1 template-equivalent/week alternating port ↔ depth
   (variants/looks), steered by the spec's gate: "10 generated same-niche sites — any two
   identical at thumbnail?" Demand board overrides queue the moment real signals exist.
   **Beta opens when all 4 engines + their floor templates are green (T6).**

**Founder touchpoints only:** Step-0 rulings · style-tile taste picks · parity QA sign-off per
template. Everything else agent-executable.

## References
- `docs/research/coverage-100/templateMapping.md` — per-site template fit + gap rollup (2026-07-11): 36% servable in-code, place bucket 35%, empty cells = trust×editorial (4) + thing×warm (2); designer ask-list §Gist
- `docs/task/template-factory.spec.md` — factory spec (kit/lint/conformance/parity/skill-rewrite)
- `docs/research/coverage-100/findings.md` — canonical experiment findings (N=101)
- `docs/product/templateLibrary.md` — design-system inventory (13 built + 4 DNA + port status)
- `docs/tracks/scalePlan.md` — engines/lists/serve-gate architecture this track plugs into

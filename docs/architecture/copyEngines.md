# The 5 Copy Engines (core mental model)

_Evergreen reference. Extracted 2026-07-17 from `docs/tracks/Completed/scalePlan.md` (List 2) so
the live idea isn't stranded in an archived plan. Reflects **current** build state, not the
2026-07-07 snapshot._

A copy engine is one of the two core mental models of Lessgo (the other is the
[3-tier template model](../../CLAUDE.md#3-tier-template-model-core-mental-model)). Every page
Lessgo writes is produced by exactly one engine.

## What a copy engine is

**A copy engine = the argument machine.** Brief in → words out. Concretely it owns four things:

1. **Strategy questions** the AI answers (awareness stage, one-reader / one-idea).
2. **Section grammar** — the argument order + which objections each page must clear.
3. **Element contract** — what each section owes the argument.
4. **Voice rules** — then the copy fan-out fills the actual words.

Concretely, an engine **is** a `src/modules/audience/<x>/` folder (strategy prompts +
section selection + element schema + voice), keyed off the **Brief**, not off `templateId`.

Division of labour — keep these four straight:

| Layer | Decides |
|---|---|
| **goal** | what the visitor should DO (one action per page) |
| **engine** | what they must BELIEVE first, and in what order |
| **copy call** | in which words |
| **template** | in what clothes |

**Firewall:** an engine never decides the template, blocks, or look, and never decides CTA
mechanics — it *receives* the goal as a fact and aims the argument at it. Copy depends on
**engine + Brief only, never template** (conformance-tested). Swapping template after generation
changes zero words.

## The five engines — split by HOW THE VISITOR DECIDES

The engines are forked on the visitor's decision question, because that changes what the page
must say. **The master list is CLOSED at 5** (agreed 2026-07-07): a one-action page can only
offer five kinds of reason-to-act. A 6th would need a 6th kind of evidence — exactly what the
ICP (one-conversion-action sites) excludes.

| # | Engine | Visitor is… | Persuades via | Example business types | Code | Status |
|---|--------|-------------|---------------|------------------------|------|--------|
| 1 | **thing** | evaluating a THING | features, proof it works | SaaS, hardware, app, physical product | `audience/product/` | ✅ live |
| 2 | **trust** | trusting a PERSON / FIRM | credentials, testimonials, process | dentist, consultant, agency, coach | `audience/service/` | ✅ live |
| 3 | **work** | browsing WORK | the work itself | photographer, designer, writer, artist | `audience/work/` | ✅ built — **pilot** (atelier); onboarding E-series in flight |
| 4 | **place** | checking a PLACE | photos, menu, hours, directions | restaurant, shop, venue | — | ❌ not built (waits for a customer, P3) |
| 5 | **quick-yes** | one quick YES | one claim, one button | link-in-bio, RSVP, waitlist | — | ❌ not built (waits for a customer, P3) |

### Router tiebreakers (in order)
`sells defined expertise → trust` · `portfolio is the proof → work` · `browsing photos/menu IS
the decision → place` · `offer already understood, page only ASKS → quick-yes` · `else → thing`.

### Sharp edges (real misclassifications this list survived)
- **Place is kept narrow.** A dentist is **trust-engine + a `hasPhysicalLocation` capability
  flag** (which injects map/hours blocks), NOT place-engine. Place is only for when browsing the
  place itself IS the decision.
- **quick-yes is about how little persuading is needed** — it is NEVER keyed on a redirect
  destination. `kathaworld.com` has a store-redirect button sitting atop a full *thing* argument
  (features / how-it-works / testimonials); the old "destination elsewhere → quick-yes" rule
  would have misclassified it. It's thing + a download-app mechanism.
- Naayom and Golden Shadow share ONE engine (both *thing* — "does this solve my problem");
  everything different about them is list data + design style, not a new engine.

## Engine ≠ audienceType (the load-bearing distinction)

This is the trap that has already misled specs. **The engine is not the same axis as
`audienceType`, and they do not line up 1:1.**

- `audienceType` (`product` / `service` / `ecommerce` / `writer`) = the onboarding persona/route
  and tier-1 of the 3-tier model. It is **retiring as the classification axis** — see below.
- **`work` is an engine, not an audienceType.** Atelier projects run the work engine but are
  `audienceType: 'service'`.
- Therefore **dispatch keys off `isWorkCopyTemplate(templateId)` FIRST, then `audienceType`**
  (`src/lib/workCopyEngine.ts`). Get this order wrong and work projects render as service copy.

## How the engine is chosen

**The AI picks the engine ONLY when the business-type list doesn't already know it.** The
classify call outputs a business-type guess:

- entry `committed` ⇒ `copyEngine = entry.copyEngine` (pure lookup, zero AI)
- entry `ambiguous` / no entry ⇒ resolution collapses to `ask` → the **D4** buyer-decision
  question, prior pre-selected (this lead also doubles as a demand signal for a new type)
- low confidence on a committed type ⇒ a one-tap **D3** confirm (never changes the engine)

See **The entry decider** below for the full routing table + revisable-belief lifecycle.

The AI's job shrinks over time to mapping one-liners onto known types; the ladder fires only for
genuinely new types — precisely the leads the demand board wants flagged.

## The entry decider (how the choice reaches the user)

The **entry decider** is the first-touch flow that turns a one-liner into a resolved engine and
routes accordingly. It replaces the old persona gate and the double one-liner entry. The user
types their business in ONE line (D1); the AI returns only signals (`EntrySignals` — a
business-type guess + confidence + tiebreaker, **never** an engine — the firewall). Code resolves
the engine deterministically (`resolveEngine`), and confidence only nudges presentation, never
which engine wins.

Registry state drives which screen fires — never AI confidence:

| Registry state of the guessed type | Screen | What the user sees |
|---|---|---|
| `committed`, confidence ≥ 0.6 | (silent) | no question — straight to `FinalizeHandoff` (work) or the confirm→wizard transition (thing/trust) |
| `committed`, confidence < 0.6 | **D3** | one-tap "is that right?" confirm of the SAME lookup engine (no re-classify) |
| `ambiguous` (e.g. designer/agency/manufacturer) | **D4** | the buyer-decision question, prior pre-selected |
| unknown / not in registry | **D4** | the buyer-decision question, prior = tiebreaker result if any |

**Routing table** (one-liner → classify → route):

- **clear work** → `FinalizeHandoff` (silent auto-confirm on mount → work journey at Show Your Work)
- **clear thing / trust** → confirm → generic wizard entered at the `understanding` slot (identity not re-asked)
- **clear place / quick-yes** → **D5 demand board** (logged, never built — `brief.copyEngine` never set)
- **ambiguous / unknown** → **D4** buyer-decision question; the pick (`applyEnginePick`) then routes as above

D2 (a "you're a photographer" confirmation screen) and D6 (an engine-set handoff ceremony) were
**cut** after founder QA — the clear path must not stop for ceremony. The live screens are
**D1** (entry), **D3** (almost-sure confirm), **D4** (buyer-decision question), **D5** (demand
board), the silent **FinalizeHandoff** / **ConfirmToWizard** transitions, and the
`WHAT YOUR SITE LEADS WITH` rail field.

**The engine is a revisable belief, not a verdict.** Its lifecycle: **inferred** (from the
one-liner at D1) → **confirmed** (the user's D3/D4 pick, or the silent clear path) → **committed**
(locked at the plan gate). The rail's "Change how buyers decide" link reopens D4 any time before
the plan gate. `place`/`quick-yes` never enter this lifecycle in the schema — they resolve, route
to demand, and are logged, never written to `brief.copyEngine` (the enum stays `{thing,trust,work}`).

Code: entry screens in `src/app/onboarding/[token]/components/decider/`; resolver +
`applyEnginePick` in `src/modules/brief/classify.ts`; the rail engine field in
`src/components/onboarding/journey/UnderstoodRail.tsx`.

## Direction: engines are replacing audienceType as the spine

Onboarding is being reorganized **by engine, not by audienceType** (memory
`project_onboarding_by_engine`). Entry classifies → engine → matching flow. `audienceType` is
retiring as the user-facing classification axis, though it remains load-bearing plumbing in the
codebase (3-tier model, type contracts, dispatch, `Project.audienceType` column) for now — no
decision yet commits to deleting the field. **`work` is the pilot engine** for this
reorganization; the other four engines' onboarding step-content comes later (E5+).

## Work contract — Wave-2 fields + source lanes

The frozen work-engine content contract (`src/modules/engines/workSections.ts`,
`workElementContract`) gained a wave of designer-parity fields (work-contract-wave2).
Every field declares a **source lane** — how it gets filled — and every field is
**optional with graceful-empty** (empty → today's markup exactly, so existing drafts
incl. Kundius render byte-identical until filled). All image fields ride the shared
`MediaAsset` media-library picker (no parallel upload path).

| Section | Field(s) | Lane | fillMode |
|---|---|---|---|
| Packages | per-tier `image` | MediaAsset picker (manual) | `system` |
| Packages | per-tier `bullets` (newline-delimited) | facts-verbatim (group `items`) or AI-drafted when facts silent | `manual_preferred` |
| Packages | per-tier `featured` ("most booked" flag) | manual toggle (`E.Toggle`) | `system` |
| Packages | per-tier `category` | AI-drafted, editable (no facts source) | `manual_preferred` |
| About | `portrait_image` (4:5) | MediaAsset picker (manual) | `system` |
| About | `signature` | manual/facts; defaults to name at first-gen (`stampAboutSignature`) | `system` |
| About | `badge` (distinct from eyebrow) | AI-drafted, editable | `manual_preferred` |
| Hero | `slides[]` (`{id,image}`) | MediaAsset picker per slide; auto-derived from works-group covers at first-gen (`stampHeroSlides`) | `system` (items) |
| Hero | `cta2_label` | AI-drafted / manual | `manual_preferred` |
| Hero | `cta2_href` | manual | `system` |
| Header | `logo_image` | MediaAsset picker (text wordmark stays default) | `system` |
| Footer | nav columns + contact | **DERIVED from live page list + facts — NO contract field** (assembly-time stamp, marker `footer_nav_mode:'derived'`) | n/a |

**The three lane mechanisms (load-bearing):**

1. **`fillMode:'system'` = the manual lane.** System fields are hard-excluded from the
   AI spec by `isSystemField` in `buildWorkSectionSpec` (`copyPrompt.ts`), get no
   `applySchemaDefaults` injection, and drop out of scoped-regen element lists — exactly
   manual-lane behavior. This is THE named mechanism for every image field + `cta2_href`
   + `featured` + `signature` + `logo_image`.
2. **The parse-time system-key strip** (`stripSystemKeys` in
   `src/modules/audience/work/parseCopy.ts`) is the UNIFORM guard: prompt-side skip is
   not enough because `applyAllSchemaDefaults` keeps all non-null AI keys, so a confused
   AI response during section regen could surface system keys. The strip deletes any
   AI-emitted value whose contract field is `fillMode:'system'` (except `id`) — covering
   first-gen + ALL regen routes. Per-merge belts (e.g. the story-regen `signature` skip
   in `aiActions.ts`) complement it, never replace it.
3. **The footer derivation stamp** (`src/modules/generation/workFooterDerive.ts`) is
   assembly-time, not render-time: `stampWorkFooterNav` computes nav columns + contact
   ONCE from the complete `fc.pages` set (post fan-out, in `work.llm.ts` `runFanOut`) and
   writes them + the marker into the stored footer content, so BOTH renderers read the
   SAME data (no dual-renderer divergence). `resyncWorkContent` re-stamps
   (`onlyIfMarked:true`) when the CMS page-set changes, so columns track detail-page
   add/remove. No marker → legacy footer, byte-identical.

Facts-verbatim / auto-derive stamps (`injectPackages`, `stampAboutSignature`,
`stampHeroSlides`, `stampWorkFooterNav`) all live at first-gen sites in scope of facts
(`work.llm.ts` `runFanOut`, or at parse via `injectPackages`) and NEVER clobber a
user-edited value (idempotent, empty-only writes) — regen paths cannot reach the
first-gen stamps by construction. Deferred fast-follow: the hero editor exposes
per-slide pick/replace but no add/remove-slides affordance.

## Pointers
- Dispatch: `src/lib/workCopyEngine.ts` (`resolveCopyEngine` → `product` | `service` | `work`).
- Per-audience builders/parsers: `src/modules/audience/{product,service,work}/`.
- Regen reuses the same per-audience copy builders: `src/modules/generation/` (see its README).
- Full scale rationale (lists 1–3, serve gate, demand board): `docs/tracks/Completed/scalePlan.md`.
- Work-vertical journey: `docs/tracks/workEndtoEnd.md`.

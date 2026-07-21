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

## Output language (all three live engines)

Every copy prompt carries an explicit **`## OUTPUT LANGUAGE — {Language}` directive** —
`thing`/`trust` since language-settings (2026-07-21), `work` since its build. It is emitted
**unconditionally, English included**: the "picked English, got Dutch" bug was the model
inferring the language from a non-English one-liner, so gating the directive on non-English
would leave the bug in place.

The value is always an **English exonym** (`Dutch`, not `Nederlands`) from
`LOCALE_ENGLISH_NAMES` — the directive interpolates it into English instructions.

Two sources, because the two paths hold different data:

- **First generation** — the audience routes carry no tokenId, so the wizard sends the
  resolved ISO code on the strategy/copy request body and each route runs
  `resolvePromptLanguage()` (validate against `SUPPORTED_LOCALES` → `'en'` fallback →
  exonym). Raw client input can never reach a prompt; no prisma enters those routes.
- **Regeneration** — `scopedRegen` holds the Project row and server-reads
  `content.localeConfig.defaultLocale`.

Both derive from the same wizard pick, so they agree. **Work reconcile rule:** a present
`localeConfig.defaultLocale` wins; the raw `facts.languages[0]` label is the fallback for
legacy work projects (a bare code there, e.g. `'nl'`, is rejected by `labelToLocaleCode`
and falls back to English).

Details + known limits: `src/lib/i18n/README.md`.

## Direction: engines are replacing audienceType as the spine

Onboarding is being reorganized **by engine, not by audienceType** (memory
`project_onboarding_by_engine`). Entry classifies → engine → matching flow. `audienceType` is
retiring as the user-facing classification axis, though it remains load-bearing plumbing in the
codebase (3-tier model, type contracts, dispatch, `Project.audienceType` column) for now — no
decision yet commits to deleting the field. **`work` is the pilot engine** for this
reorganization; the other four engines' onboarding step-content comes later (E5+).

## Pointers
- Dispatch: `src/lib/workCopyEngine.ts` (`resolveCopyEngine` → `product` | `service` | `work`).
- Per-audience builders/parsers: `src/modules/audience/{product,service,work}/`.
- Regen reuses the same per-audience copy builders: `src/modules/generation/` (see its README).
- Full scale rationale (lists 1–3, serve gate, demand board): `docs/tracks/Completed/scalePlan.md`.
- Work-vertical journey: `docs/tracks/workEndtoEnd.md`.

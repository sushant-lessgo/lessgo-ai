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

- entry exists ⇒ `copyEngine = entry.copyEngine` (pure lookup, zero AI)
- no entry ⇒ AI applies the tiebreaker ladder above → shown back on page 2 in the user's
  language, one tap to correct (this lead also doubles as a demand signal for a new type)
- low confidence ⇒ chooser shown upfront

The AI's job shrinks over time to mapping one-liners onto known types; the ladder fires only for
genuinely new types — precisely the leads the demand board wants flagged.

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

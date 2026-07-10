# serve-gate-v2 — spec

## Problem / why
QA findings F13/F15/F16 (`reports/scale-1-10-findings.md`, read the joint section "The serve
gate is over-tight" first): the serve gate rejected 4 of 7 real, serveable leads — including
the named pilot customer (Wingrrowth). Root flaws, agreed 2026-07-10:

1. **Wrong registry.** `requiredCapabilitiesFromBrief()` filters against `templateMeta.capabilities`
   only. Two of the three implicit required capabilities (`lead-form`, `store-badges`) are
   satisfied by **shared blocks** (`SharedLeadForm`, `SharedStoreBadges` in
   `sharedBlocks/registry.ts` + `.published.ts`) that resolve on EVERY template before template
   dispatch — the gate can't see them. The codebase already disagrees with itself:
   `seedGoalForm.ts` seeds a working shared form on granth (`capabilities: []`) while
   `fit.ts:65` would reject the same page. The seeder is right.
2. **Rejecting on inference.** `structure.mode === 'multi'` is AI-inferred from the SOURCE
   site's page count — the user never asked for multipage and never gets to relax it (gate runs
   at step 4, structure gate at 7b). Serve coverage silently depends on how the user typed
   their input (URL vs one-liner), violating D5/D8.
3. **Admin panel lies.** `/admin` Business Types serveability evaluates only
   `businessType.requiredCapabilities`, never goal-derived ones — reports "serveable" for
   businesses the gate rejects (writer, app).

## Goal
The gate answers one question: *"can we serve this business's conversion job with what we have —
templates + capabilities + shared blocks?"* Hard-reject ONLY on user-confirmed, page-breaking
gaps. AI inferences never reject — they prefill 7b and sort the template shortlist. The admin
serveability view and the gate become the same function, so they can never disagree.

Philosophy (agreed): demand board is a product asset until ~100 live sites (founder
conversations, build signal) — so a TRUE "can't serve" is valuable and a FALSE one is pure
loss. Posture flip at 100 sites is founder discipline, NOT product instrumentation.

## Scope OUT (non-goals)
- Gate relocation — stays at step 4 (cheap early honesty is right).
- Demand board / MANUAL-ONBOARD capture flow — works verbatim per QA; untouched.
- Metrics/targets for rejection rate — explicitly declined (founder discipline).
- New engines, templates, capabilities, or blocks.
- 7b structure-gate changes — §3's "deletion relaxes hard-fit" law already correct once the
  inference lands there as a prefill.
- No confirm-card "we downgraded you to single page" notice — inference prefills 7b where the
  user already sees and edits the page plan; a notice is redundant.
- Template shortlist/picker UI (F4) — separate feature; this spec only fixes what FILTERS,
  the sort/preferred mechanics stay as-is.

## Constraints
- The rule split, precisely:
  - **Hard (filters):** copyEngine match; businessType `requiredCapabilities` (e.g. gallery)
    UNSATISFIABLE by any template AND by shared blocks; goal-mechanism needs (`lead-form`,
    `store-badges`) UNSATISFIABLE by any template AND by shared blocks. With today's shared
    blocks, mechanism needs are always satisfied — the code must still model them as
    requirements (a future mechanism may not have a shared block).
  - **Soft (sorts/prefills only):** `structure.mode` (inferred), design style, and any future
    AI-inferred signal. Inferred `multi` still prefills the 7b sitemap and prefers
    multipage-capable templates in the shortlist sort.
- Shared-block capability registry must be a declared list (which capability each shared block
  satisfies), not a hardcoded `if` — D9 (differences live in list entries).
- One serveability function: gate and `/admin` Business Types table call the same code path.
  Admin view should evaluate per businessType × its `likelyIntents` (a type can be serveable
  for some intents and not others — show that honestly).
- Spec change, not a patch: `fit.test.ts:82` ("download-app derives store-badges → 0 matches")
  and `serveGate.test.ts:221` (`missing = 'rungC:store-badges'`) currently ASSERT the wrong
  behavior — rewrite them with the new law, don't delete coverage.
- Rung diagnostics (`rungA/rungC:<capability>` missing labels) must survive — the demand board
  depends on them for true rejections.
- No DB/schema changes expected; no data migration.

## References
- `reports/scale-1-10-findings.md` — joint serve-gate section + F13/F15/F16 (repro Briefs,
  registry table, the seeder-vs-gate contradiction with file:line).
- `docs/tracks/scalePlan.md` §7 rule 3 ("default to preferred unless page is broken without
  it"), D5/D6/D8, §9 decisions 3 & 9.
- `src/modules/templates/fit.ts` (`:65-67` the three implicit requirements),
  `src/modules/templates/templateMeta.ts`, the serve gate (`decideServe`),
  `src/modules/goals/injectGoalSections.ts:86` + `seedGoalForm.ts:80` (the machinery that
  proves shared blocks satisfy mechanism needs), `sharedBlocks/registry.ts`.
- Admin: `/admin` Business Types table's serveability evaluation.
- Repro Briefs to encode as fixtures: Wingrrowth-shape (consultant/trust/M1/multi-inferred),
  writer/work/lead-magnet(M1)/single, app/thing?/download-app — exact shapes in F13/F15/F16.

## Open exploration questions
- Where does `decideServe` live and what exactly does it return (rung labels, missing string) —
  full call graph gate ↔ admin table.
- Where is the template shortlist sorted today (style-soft sort) — the demoted `multipage`
  signal plugs in there.
- Does anything else read `structure.mode` as a hard input before 7b?
- `subscribe-newsletter` M4-for-filtering / M1-for-rendering split (F15 correction) — confirm
  the new model doesn't need to touch it (it shouldn't; rendering special-cases stay).

## Candidate human gates
- None irreversible (no schema, no migration, no publish path). Suggested single gate before
  merge: run the three repro Briefs + photographer/restaurant through the gate on dev and
  eyeball the admin table.

## Acceptance criteria
- [ ] Wingrrowth-shape Brief (trust engine, M1, inferred `multi`) → SERVE; 7b sitemap prefilled
      multi-page; template shortlist prefers multipage-capable when any exist for the engine.
- [ ] Writer Brief (work engine, `lead-magnet` M1) → SERVE on granth; shared lead form seeded
      (already works — F1 fixed render).
- [ ] App Brief (`download-app`) → SERVE; `SharedStoreBadges` injected (existing machinery).
- [ ] Photographer Brief → still MANUAL-ONBOARD `rungC:gallery`; restaurant/"Something else" →
      still `rungA:unclassified`. Demand board rows unchanged in shape.
- [ ] Gate and admin Business Types table return identical serveability for every
      businessType × likelyIntent; writer and app rows no longer claim blanket "serveable"
      while the gate rejects their first intents — the matrix is honest both ways.
- [ ] `fit.test.ts` / `serveGate.test.ts` rewritten to assert the new law; shared-block
      capability satisfaction covered by its own test; inferred-signal-never-rejects covered.
- [ ] `tsc` + full `test:run` green.

## Pilot / smallest slice
Single slice — this is a rule rewrite, not a build. If phasing is wanted: phase 1 = gate rule +
shared-block registry + tests (kills F13/F15/F16), phase 2 = admin table unification.

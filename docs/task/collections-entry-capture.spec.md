# collections-entry-capture — spec

## Problem / why
F19 (`reports/scale-1-10-findings.md`, P1): `facts.collections` can NEVER populate on a real
entry, so the entire scale-10 collection surface (structure-gate collection node, collection →
pages bridge) is unreachable in the product. Chicken-and-egg: the single entry AI call both
classifies the business AND extracts facts, but the collection-extraction fields
(`entryEnrichmentFields`/`entryEnrichmentPrompt`/`enrichSignals`) are only added to the
schema/prompt when `businessType` is passed IN — which is this very call's OUTPUT. The entry
step never sends it (can't), so `extraction === null` on every real entry
(`/api/v2/scrape-website/route.ts` and `/api/v2/understand/route.ts` both). Repro: pine64.org
— a pure product catalogue — classified perfectly, product lines landed in *features*,
`facts.collections === null`, no collection node at 7b.
The downstream is NOT broken: injecting `facts.collections` by hand made the whole scale-10 UI
work (render/rename/add/remove/empty-state, bridge correctly dormant). The input wire is the
entire problem.

## Goal
**Decided (2026-07-10): option (b) — ask everything once.** The single entry call's extraction
schema/prompt includes the UNION of all engines' collection-enrichment fields; after the call
classifies the business, fold ONLY the guessed engine's fields via its existing
`enrichSignals` and discard the rest. One AI call, no added latency; `facts.collections`
populates on real entries whose source material shows collections.

## Scope OUT (non-goals)
- No second AI pass, no wizard-triggered re-extraction (options a/c declined).
- No changes to the scale-10 downstream (CollectionNode, structure gate UI, collection→pages
  bridge, `requiredCollections` registry gating) — verified sound via fixture.
- No new collection types/engine vocab; union is over what engines already declare.
- One-liner entries: no site to extract from — collections may stay empty (the node's
  empty-state/`+ Add` path at 7b covers manual entry; if that add-path is not reachable when
  `facts.collections` is null, making the node render for collection-capable businessTypes
  with an empty state IS in scope — the user must be able to add collections by hand).
- Prompt-quality tuning beyond wiring the union (engines own their extraction wording).

## Constraints
- Keep the per-engine wiring as the single source (D9): union is BUILT from each engine's
  `entryEnrichmentFields`/`entryEnrichmentPrompt` declarations — no hand-maintained combined
  list that drifts when an engine adds a field.
- Fold step: run ONLY the classified engine's `enrichSignals` over the response; fields
  belonging to other engines are dropped before `collectionsFromSignals()`/`buildBriefDraft()`.
- The existing explicit-businessType path (`extractionForBusinessType(businessType)` when the
  request DOES carry it) keeps working unchanged — union applies only when type is unknown.
- Both routes: `/api/v2/scrape-website` (product) and `/api/v2/understand` (service).
- Token-cost awareness: union adds prompt length to every entry call — keep the union fields
  compact; if two engines declare near-identical collection fields, they may share (planner
  judgment). No model change.
- Slugs remain code-derived via the shared `slugify` (F28 fix landed — collections must use
  the corrected `normalize.ts` implementation).
- Costs 1 credit as today — no credit change.

## References
- `reports/scale-1-10-findings.md` F19 (full trace with file:line: `classify.ts`
  `collectionsFromSignals`/`buildBriefDraft`, `scrape-website/route.ts:169` gating,
  `EntryInputStep.tsx:96` request shape), TC-10.x fixture results.
- Engine declarations: `src/modules/engines/{thing,trust,work}.ts` +
  businessType-level `manufacturer` wiring — the complete, correct, unreachable enrichment.
- `docs/tracks/scalePlan.md` scale-10 section + D9.
- Repro: URL entry `https://www.pine64.org` (token `9knkYn8_QZpE` shape) — should yield
  product-line collections.

## Open exploration questions
- Exact schema mechanics: are `entryEnrichmentFields` merged into one zod/JSON schema cleanly,
  or do engines declare overlapping keys with different shapes (collision rule needed)?
- Does the AI reliably leave other engines' fields empty, or does the fold need to be
  defensive about cross-engine noise?
- Is the 7b collection node reachable with empty `facts.collections` today (manual add path),
  or gated on non-null? (Determines the empty-state item in Scope.)
- `understand` route: do service engines declare collection enrichment at all today, or is
  the union effectively thing/manufacturer-only right now?

## Candidate human gates
- Live check before merge: real URL entry on a catalogue-heavy site (pine64-style) →
  collection node populated at 7b. One gate.

## Acceptance criteria
- [ ] URL entry, catalogue site, no `businessType` in request: `facts.collections` populated;
      7b renders the collection node with extracted items; TC-10.1 passes through the product.
- [ ] Classified engine ≠ collection-declaring engine: foreign fields discarded, no cross-
      engine leakage into the Brief.
- [ ] Explicit-businessType extraction path unchanged (existing tests stay green).
- [ ] One-liner entry: node reachable with empty state for collection-capable types; manual
      `+ Add` works end-to-end into the Brief.
- [ ] Exactly ONE AI call per entry (no second pass) — assert request count in test.
- [ ] Collection slugs derive via shared `slugify` (`widget-co`, not `widget--co`).
- [ ] `tsc` + full `test:run` green.

## Pilot / smallest slice
Single slice for the thing/manufacturer path (where collections demonstrably exist — pine64
repro), then confirm/extend the `understand` route if any service engine declares enrichment.

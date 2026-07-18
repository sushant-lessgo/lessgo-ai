# src/modules/engines

Engine-core section sets for the scale track's closed copy engines
(`thing` / `trust` / `work` — see `@/types/brief`).

- **`coreSections.ts`** — `engineCoreSections: Record<CopyEngine, readonly string[]>`.
  The guaranteed section contract a template MUST resolve (real block, both
  edit + published modes) for every engine it declares in
  `src/modules/templates/templateMeta.ts`. Enforced by the conformance tests
  (spec 01 phase 4).

## Work-vertical contract freeze (work-contract phase A)

Additive, pure-data modules that freeze the agreed work-vertical facts so tracks
C (copy engine), D (skeleton + template library) and E (onboarding) build against
a stable contract without drift. NO UI, prompts, renderers, or wizard wiring —
DATA + the `workContract.test.ts` conformance test only; zero behavior change to
existing engines. All obey the D5 firewall (pure data; never react / stores /
hooks / template runtime; no `templateId`/`skeletonId` literals — source-scanned
in the test).

- **`workSections.ts`** — the work-core section freeze: `workMustSections` (8) /
  `workOptionalSections` (7) + `WorkSectionKey`, the 3 proof shapes, and the
  per-section `workElementContract` (registered as `elementContracts.work`).
  **Invariant (D1):** `engineCoreSections.work` is the conformance SUBSET
  (`engineCoreSections.work ⊆ workMustSections`) — never grow/merge the two; the
  full freeze converges into templates in track D.
- **`workPages.ts`** — closed 8-page vocabulary (fixed in-code slugs; 2
  parametric), 3 named whole-site archetypes (+ default `standard`), and the
  deterministic zero-AI `proposeWorkSiteStructure` (system proposes, user decides;
  thresholds stubbed for the track-E pilot).
- **`workSlots.ts`** — the 8 wizard fact slots with default mechanics posture +
  `workSlotReconciliation` onto today's live `workContract` field ids.
  **Invariant (D2):** this is the slot TABLE, NOT the live wizard — the
  `workContract` in `inputContracts.ts` is intentionally unchanged (adding `price`
  etc. is a track-E merge). Value shapes live in
  `src/lib/schemas/workFacts.schema.ts` (zod; `getWorkFacts` accessor at
  `brief.facts.work`).
- **`workVocabulary.ts`** — the SINGLE-SOURCE buyer-words table (internal name →
  user-facing label + description), `professionWording`, and `dreamClientChips`
  for the 4 day-one professions. **Invariant:** one rename = one edit here;
  internal names are never user-facing. 4 draft names carry `flagged` (merge-gate
  ruling).

**Status: FROZEN (scalePlan §3), coder-maintained.** Rationale in one line
(plan D-A): each set is the guaranteed *common* contract across that engine's
shortlist-eligible templates — thing = meridian∩vestria (5 sections; vestria
has no pricing/cta), trust = hearth's canonical 7, work = granth's 6 (lumen is
bespoke-exempt).

Downstream scale specs (router, serve gate, wizard, generation fan-out) read
these sets — do not edit without updating the D-A tables in
`docs/task/scale-01-brief-registry.plan.md` and the conformance tests.

Pure data: nothing here may import template modules, resolvers, or the
registry (bundle firewall).

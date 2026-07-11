# template-factory — implementation audit

## Phase 1 — `templateConformance(templateId)` consolidation

### Files changed
- `src/modules/templates/templateConformance.ts` (NEW) — parameterized per-template
  suite factory + shared `contractFor` and other deduped helpers.
- `src/modules/templates/conformance.test.ts` (REWRITE) — loops
  `templateConformance(id)` per templateId; retains cross-template/global +
  template-specific exemption proofs.
- `src/modules/templates/blockManifest.test.ts` (DELETED) — its 3 checks folded
  into `templateConformance`.
- `src/modules/templates/publishedClientBoundary.test.ts` (DOC-COMMENT ONLY) —
  added a cross-reference header naming it as the global boundary-enforcement
  point; assertions untouched.

### What changed, per file

**`templateConformance.ts` (new).** Holds the consolidated per-template suite and
all shared machinery: `RESOLVERS`, `resolvesReal`, `resolveComponent`, the single
shared `contractFor(layoutName)` (deduped from the two identical local copies),
`contractKeys`, `classify`, `synthContent`, `ALL_ASSETS`, `COLLECTION_FAMILY`,
`STRUCTURAL_CAPABILITIES`, `assertCollectionCapabilityBacked`, and
`templateConformance(templateId)`. The factory reads `templateMeta[templateId]`
to apply the retired/bespoke exemptions itself. Header carries the
published/client-boundary cross-reference (names `publishedClientBoundary.test.ts`
as the enforcement point; does not reinvent it).

**`conformance.test.ts` (rewrite).** Now: (1) global resolver+meta key parity;
(2) `for (const id of templateIds) templateConformance(id)`; (3) global sanity
(≥1 manifest declaration; structural-cap ⊆ closed vocab); (4) template-specific
exemption proofs kept verbatim (lumen bespoke D-A #2, techpremium retired,
vestria flat-grid); (5) global (d) dormancy lock + negative fixtures (drive the
exported `assertCollectionCapabilityBacked` with fake metadata).

**`blockManifest.test.ts` (deleted).** All 3 checks folded — see mapping.

**`publishedClientBoundary.test.ts`.** One doc-comment block added to the header;
no code/assertion change.

### OLD-CHECK → NEW-HOME mapping (zero coverage loss)

| Old location | Old check | New home |
|---|---|---|
| conformance `it` | resolver entry for every templateId + templateMeta key parity | conformance.test.ts global `it` (kept) |
| conformance (a) | engine-core resolves real edit+published (skip retired/bespoke) | `templateConformance` group (a) |
| conformance (b) | declared block-backed capability → capabilitySections entry resolves non-placeholder | `templateConformance` group (b) |
| conformance (b+) | every capabilitySections VALUE resolves both modes | `templateConformance` group (b+) `it` #1 |
| conformance (b+) | every capabilitySections entry declared in capabilities (no orphan) | `templateConformance` group (b+) `it` #2 |
| conformance | structural cap list ⊆ closed capability vocab | conformance.test.ts global `it` (kept) |
| conformance | lumen bespoke: skipped by (a), load-bearing missing work-core | conformance.test.ts `lumen bespoke exemption` (kept) |
| conformance | lumen exercised by (b): gallery+lead-form resolve | conformance.test.ts `lumen bespoke exemption` (kept) |
| conformance (c) | default layout ∈ declared variants | `templateConformance` group (c) `it` (also absorbs blockManifest(1) — deduped) |
| conformance (c) | each variant resolves real block both modes | `templateConformance` group (c) |
| conformance (c) | internalDispatch variant === default component both modes | `templateConformance` group (c) |
| conformance (c) | non-dispatch variant !== default component both modes (distinctness) | `templateConformance` group (c) |
| conformance (d) | per-template: declared collection cap ⇒ resolvable catalog+item pair | `templateConformance` group (d) |
| conformance (d) | DORMANT: no shipping template declares a family cap | conformance.test.ts global (kept) |
| conformance (d) | vestria stays flat-grid (`catalog`, never family cap) | conformance.test.ts global (kept) |
| conformance (d) | negative fixtures: `products` no-evidence throws; `services` placeholder throws | conformance.test.ts global (kept; drives exported helper) |
| conformance (e) | MAIN: no both-ways-scalar-divergent co-eligible pair per section | `templateConformance` group (e) main loop |
| conformance (e) | CONSISTENCY: different-copyShape co-eligible pairs runtime-hidden both ways | `templateConformance` group (e) (per-template scoped) |
| conformance (e) | HYGIENE: copyShape never collides with a consumed key | `templateConformance` group (e) (per-template scoped) |
| conformance | techpremium retired: empty engine/capability lists | conformance.test.ts global `it` (kept) |
| blockManifest (1) | default ∈ variants | folded into `templateConformance` (c) default-membership `it` (deduped — identical assertion) |
| blockManifest (2) | every capacity minCards ≤ maxCards | `templateConformance` block-manifest data group |
| blockManifest (3) | consumes ⊆ getAllElements(contract) | `templateConformance` block-manifest data group |
| blockManifest | "has at least one declaration" sanity | conformance.test.ts global "≥1 manifest declaration" `it` |
| blockManifest | local `contractFor` helper | deduped into shared `contractFor` in templateConformance.ts |
| conformance (e) | local `contractFor` helper | deduped into shared `contractFor` in templateConformance.ts |

Every old `it`/assertion is accounted for. The only intentional dedupe:
blockManifest(1) `default ∈ variants` and conformance(c) `default layout is one
of the declared variants` are the identical assertion — kept once in (c).

### Deviations
- Added a guard `it('is a registered template …')` at the top of every
  `templateConformance(id)` suite. Reason: vitest errors on an empty `describe`,
  and retired techpremium (no engines/capabilities/manifest) would otherwise emit
  an empty suite. Conservative — asserts only meta+resolver presence (already
  covered globally), keeps every suite non-empty.
- The block-manifest capacity group emits a `declares no capacities (nothing to
  check)` placeholder `it` when a template (e.g. vestria) has zero capacity
  declarations — same empty-`describe` avoidance. No assertion lost: originally
  the capacity loop was global so at least one template supplied a body; per
  template some have none.
- (e) CONSISTENCY and HYGIENE checks are now scoped per-template inside the
  factory (originally single global loops). Coverage identical (they only compare
  variants within one section/set); split emission if anything strengthens
  granularity.

### Verification
- `npx tsc --noEmit` — clean (no output).
- `npx vitest run conformance.test.ts publishedClientBoundary.test.ts` —
  `Test Files 2 passed`, `Tests 199 passed`. Boundary test green and unweakened.
- `npm run test:run` (full) — `Test Files 137 passed | 1 skipped (138)`,
  `Tests 2103 passed | 3 skipped (2106)`.

### Open risks
- `templateConformance.ts` is a non-`.test` module that statically imports every
  template resolver/placeholder/schema. It is imported ONLY by
  `conformance.test.ts` (vitest-only), so the registry firewall is unaffected —
  same idiom as the former test file. If any app/bundle code ever imports it, the
  firewall would break; a future guard could enforce test-only importers.

## Phase 1 — impl-review verdict
- Verdict: **ship** (loop 1). Independent reviewer confirmed faithful pure refactor: every OLD assertion (conformance.test.ts groups a/b/b+/c/d+neg-fixtures/e, key-parity, structural-cap, lumen bespoke, techpremium retired) + blockManifest.test.ts's 3 checks mapped to a live NEW home; single deduped `contractFor`; boundary test assertions untouched; guard/placeholder `it`s inert. Gate re-run by reviewer: `tsc --noEmit` clean, `test:run` 2103 passed/3 skipped.
- Non-blocking (orchestrator note): a FOREIGN commit `82f5d806` (editor-phase-3 "shell shift crossAxis", ToolbarShell.tsx) appeared on `feature/template-factory` from concurrent work — NOT part of this pipeline. Left in place; raise at the merge gate (may need cherry-pick off / belongs to editor track).

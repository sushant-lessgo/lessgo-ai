# src/modules/engines

Engine-core section sets for the scale track's closed copy engines
(`thing` / `trust` / `work` — see `@/types/brief`).

- **`coreSections.ts`** — `engineCoreSections: Record<CopyEngine, readonly string[]>`.
  The guaranteed section contract a template MUST resolve (real block, both
  edit + published modes) for every engine it declares in
  `src/modules/templates/templateMeta.ts`. Enforced by the conformance tests
  (spec 01 phase 4).

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

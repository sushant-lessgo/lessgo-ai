# scale-01 audit

## Phase 1 — Goal vocabulary + Brief contract (2026-07-07)

**Files changed**
- `src/modules/goals/vocabulary.ts` (create)
- `src/types/brief.ts` (create)
- `src/lib/schemas/brief.schema.ts` (create)
- `src/modules/goals/vocabulary.test.ts` (create)
- `src/modules/goals/README.md` (create — orchestrator addition, plan-review non-blocking #1)

**Per file**

- `vocabulary.ts` — per D-F: `goalMechanisms` (M1–M5) + `goalMechanismMeta` (label/description per scalePlan §6 mechanisms table); `goalIntents` (18, kebab-case, incl. `buy-via-link`, `order-via-platform`, `pay-via-link`); `goalIntentMeta` with allowed mechanisms taken from the scalePlan §6 intents table (verified against docs/tracks/scalePlan.md:230-251, e.g. book-call M1/M3/M2). Header comment: FROZEN §11.2, legacy goal enums untouched.
- `src/types/brief.ts` — per D-E: `copyEngines`/`capabilityIds`/`designStyles` as `as const` + union types (service.ts idiom); re-exports `type Brief` from the schema (canonical import path `@/types/brief`).
- `brief.schema.ts` — per D-E: `BriefSchema` all-optional top-level fields, exact field types from the plan (`businessType` open string with gate-time comment; `goal.{intent,mechanism,destination?}`; `structure.{mode,pages}`; `templateShortlist: z.enum(templateIds)`; `confidence` 0–1). Imports: enums from `@/types/brief` + `@/types/service` + `@/modules/goals/vocabulary`; type-only re-export back ⇒ no runtime cycle.
- `vocabulary.test.ts` — 11 tests: exactly 18 intents (+ no dupes), exactly 5 mechanisms, `buy-via-link` present + `buy` absent, `order-via-platform` + `pay-via-link` present + `pay-via-line` absent (plan's typo trap), meta completeness + mechanisms ⊆ goalMechanisms, §6 spot-checks, `BriefSchema.parse({})` smoke, full-fixture parse, invalid-enum/out-of-range rejects, array-destination accept.
- `README.md` — agent-oriented: purpose, FROZEN status, legacy-enums-untouched invariant, vocabulary as source of truth.

**Deviations**
- None from the plan. One addition folded in by orchestrator instruction: `src/modules/goals/README.md` (per CLAUDE.md every-major-dir-README convention).
- In-scope judgment call: `goalIntentMeta` mechanism ORDER preserved from the scalePlan §6 table (first = primary), asserted with `toEqual` in spot-checks.

**Verification**
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run` → **56 passed | 1 skipped (57 files), 751 passed | 2 skipped (753 tests)** — green.
- `npx vitest run src/modules/goals/vocabulary.test.ts` → 11/11 passed.
- Import audit: grep for `@/types/brief|brief.schema|modules/goals/vocabulary` under `src/` matches ONLY the 5 new files ⇒ zero runtime change.

**Open risks**
- None. New modules have zero app readers by design; conformance/fit phases (3–5) will be the first consumers.

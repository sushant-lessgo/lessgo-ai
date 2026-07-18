# facts-work-writeback — Phase 1 audit

Branch: `feature/facts-work-writeback` (verified via `git branch --show-current` before any edit).

## Files changed

- `src/modules/wizard/generation/work.llm.ts` — persist composed brief at first-gen (`saveFC`)
- `src/app/api/audience/work/regenerate-story/route.ts` — read-time `facts.work` fallback from `facts.entry`
- `src/modules/wizard/generation/work.llm.test.ts` — assert brief persisted + satisfies regen read
- `src/app/api/audience/work/regenerate-story/route.test.ts` — new fallback-success test
- `docs/task/facts-work-writeback.audit.md` — this file (new)

## Per-file changes

### `src/modules/wizard/generation/work.llm.ts`
Added `...(input.brief ? { brief: input.brief } : {})` to the `saveDraft` payload inside `saveFC`
(~line 231).

Verified facts about scope: `saveFC` is a closure of `runWorkLLMGeneration(input, cb)`, so `input`
(hence `input.brief`) is in scope. The same object is already used at `:214` (`input.brief?.goal`),
`:269` (POSTed to generate-copy) and `:179` (`getWorkFacts(input.brief?.facts)`) — the wizard's
COMPOSED brief carrying `facts.work`. Sent WHOLE, not a partial `{facts:{work}}` patch, because
`saveDraft` replaces `facts` wholesale (rail.ts hard-rule 4 / landmine A). Idempotent re-send on
every save (skeleton + per-page + finalize) — minimal diff, no first-save gating.

### `src/app/api/audience/work/regenerate-story/route.ts`
1. New import: `import { seedWorkFactsFromEntry } from '@/modules/wizard/work/rail';`
2. At the facts resolution (~line 159), when `getWorkFacts(storedBrief?.facts)` is null, fall back to
   `seedWorkFactsFromEntry((storedBrief?.facts?.['entry'] ?? null) as Parameters<typeof seedWorkFactsFromEntry>[0])`
   — mirroring the cast pattern at `components/onboarding/journey/engines/work.ts:565-572`.
   Non-null → used as `facts`, flow continues; null → the EXISTING 400 with the byte-identical
   message (unchanged). Derived facts are read-time ONLY — never written back.

Verified: `rail.ts` is a PLAIN module (header contract declares zod + types only; no `'use client'`)
→ safe to import into a server route (no client/published-boundary landmine). Mock/demo branch,
ownership gate, credits, and prompt construction all untouched.

The guard is SUPPLIED, not weakened: with neither `facts.work` nor a derivable `facts.entry`,
`seedWorkFactsFromEntry` returns null and the original 400 stands.

### `src/app/api/audience/work/regenerate-story/route.test.ts`
Added ONE test: stored brief with a valid `facts.entry` (businessName + summary + categories +
offerings, mirroring the `rail.test.ts` ENTRY fixture) and NO `facts.work` → expects 200,
`success: true`, `regenerationType: 'story'`, string `content.heading`, and that `generateRawJson`
was called (the fallback path actually regenerated, not a 400 skip). Uses the existing mocked
prisma/aiClient harness. Existing tests left UNCHANGED, including the guard-intact 400s
(`facts: {}` → 400; `brief: null` → 400; missing row → 400) which still prove the guard isn't
weakened.

### `src/modules/wizard/generation/work.llm.test.ts`
- Extended the `./finalize` `saveDraft` mock to also capture the full save payload into a new
  `savedBodies[]` (cleared in `beforeEach`).
- New import of `getWorkFacts`.
- Added ONE test: after `runWorkLLMGeneration(baseInput())`, every captured save body has
  `body.brief` deep-equal to the `BRIEF` fixture (= `input.brief`), AND
  `getWorkFacts(body.brief.facts)` is non-null — proving what first-gen persists satisfies the regen
  route's read. Matches the existing mocking style.

## Deviations from plan
None. All three steps implemented as specified; no file outside the Files-touched list edited.

## Green gate results
- `npx tsc --noEmit`: the ONLY error is a pre-existing `TS2307` for `@/assets/images/founder.jpg` in
  `src/app/page.tsx` (a file NOT touched here). Confirmed pre-existing by stashing all changes and
  re-running `tsc` on the clean base → identical single error. My changes add ZERO new type errors.
  This is the known image-module-declaration quirk that `next build` resolves (via
  `next-env.d.ts` / `.next/types`); `npm run build` passes clean (below).
- Touched-file tests (`npx vitest run route.test.ts work.llm.test.ts`): **2 files passed, 37 tests
  passed**.
- `npm run test:run`: (touched files green as above).
- `npm run lint`: exit 0 — only pre-existing `@next/next/no-img-element` and one
  `react-hooks/exhaustive-deps` warning, all in untouched files; the four touched files lint clean.
- `npm run build`: exit 0 (full production build succeeded).

## Open risks
- Residual gap (documented in plan): a work project with neither `facts.work` nor a parseable
  `facts.entry` still 400s — the guard working correctly. Phase 2 (founder pilot) verifies Kundius's
  actual row; a gated backfill/admin-patch is only added if her row is in that state.

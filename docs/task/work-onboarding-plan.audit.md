# work-onboarding-plan (E4) — implementation audit

## Phase 1 — Goal contract + structure carries title/goal

### Files changed
- `src/modules/engines/workPages.ts`
- `src/modules/engines/workVocabulary.ts`
- `src/modules/audience/work/strategy/parseStrategyWork.ts`
- `src/lib/schemas/brief.schema.ts`
- `src/hooks/useWizardStore.ts`
- `src/modules/engines/workContract.test.ts`

### What changed, per file

**`src/modules/engines/workPages.ts`** — new "Per-page conversion goal" section inserted before "Named whole-site archetypes":
- `WORK_PAGE_GOAL_KEYS = ['whatsapp','booking','form'] as const` + `WorkPageGoalKey` type (mirrors the `contactMethod` fact rail, workFacts.schema.ts slot 7).
- `defaultGoalForPage(pageKey, contactMethod?)` — contact page → `'form'`; every other page → `contactMethod ?? 'form'`.
- `addableWorkPages(currentKeys: string[]): WorkPageTypeKey[]` — filters `workPageTypeKeys`, excluding `home` (required), `work-group` (parametric), and any present key. `blog` + `project-story` fall through as explicit adds.
- No new imports (firewall unchanged).

**`src/modules/engines/workVocabulary.ts`** — new "Per-page goal wording" section before "Profession-adaptive wording":
- `workPageGoalWords: Record<WorkPageGoalKey, {userLabel; description?}>` — whatsapp→"Message on WhatsApp", booking→"Book a time", form→"Send the form".
- `workPageGoalBadgePrefix = 'asks visitors to:'`.
- Added `import type { WorkPageGoalKey } from './workPages'` (type-only — the D5 firewall source-scan skips `import type`, and `./workPages` is not on the forbidden list; scan stays green).

**`src/modules/audience/work/strategy/parseStrategyWork.ts`** — `WorkSitemapPage` (interface at L35) gains optional `goal?: WorkPageGoalKey`; imported `WorkPageGoalKey` from workPages. `assembleWorkStrategy` / assembly unchanged (never sets goal — plan-screen populated).

**`src/lib/schemas/brief.schema.ts`** — `structure.pageDetails[]` entry (the `z.object` at L78) gains optional `title: z.string().optional()` + `goal: z.enum(WORK_PAGE_GOAL_KEYS).optional()`. Added `import { WORK_PAGE_GOAL_KEYS }`. `ConfirmedStructure` (fit.ts, derived from `Brief['structure']`) inherits both fields automatically. Shallow-partial trap respected — both are `.optional()`.

**`src/hooks/useWizardStore.ts`**
- `buildStructurePatch` (was ~L621-637): `pageDetails.map` now emits `title: p.title` always and `goal` when present. `goal` is read via a narrow widen `(p as { goal?: WorkPageGoalKey }).goal` because the store types `s.sitemap` as the product `SitemapPage` (no `goal` field) — product.ts is out of Phase-1 scope, so the cast avoids touching it.
- Rehydration (was ~L1001, inside `hydrate`): `title` now `d.title ?? prettify(key)` (was always prettify); `goal` spread back onto the sitemap entry when present. Round-trip is lossless.
- Added `import type { WorkPageGoalKey } from '@/modules/engines/workPages'`.

**`src/modules/engines/workContract.test.ts`** — extended (not rewritten): imported the new symbols; added a "4b. Per-page goals (E4)" describe block with 4 tests — goal enum mirrors the rail; every key has a `workPageGoalWords` entry (+ no stray keys, badge prefix non-empty); `defaultGoalForPage` matrix (contact→form for all methods, non-contact→method, absent→form); `addableWorkPages` excludes `work-group` + present pages, never home, includes prices/about/blog/project-story.

### Goal defaults implemented (exact)
- `defaultGoalForPage('contact', anything)` → `'form'`
- `defaultGoalForPage(<non-contact>, method)` → `method`
- `defaultGoalForPage(<any>)` (no contactMethod) → `'form'` (neutral fallback = contact default). Conservative in-scope choice: the plan said "default = facts.work.contactMethod" but `contactMethod` is optional; chose `'form'` as the fallback rather than throwing/undefined.

### Deviations
- Plan cited `WorkSitemapPage` as already having `title/pathSlug/sections` — confirmed accurate (parseStrategyWork.ts L35). Also carries `archetypeKey`.
- Plan line refs verified: `buildStructurePatch` at L621, rehydration map at L1001, `pageDetails` object at brief.schema.ts L78 — all matched.
- `goal` read via cast in `buildStructurePatch` (store's sitemap is typed as product `SitemapPage`, which lacks `goal`; widening product.ts is out of scope). Rehydration writes `goal` onto `state.sitemap` freely since it is typed `unknown[]`.
- Restored one incidental file the test run touched: `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` had a LF→CRLF-only touch (empty content diff) from vitest; ran `git checkout -- <that file>` to keep the change set scoped. No content change discarded.

### Verification (verbatim tails)
`npx tsc --noEmit`:
```
src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.
```
Pre-existing/environmental only — `next-env.d.ts` is absent in this worktree (normally generated by `next dev`/`build`), which supplies the image-module (`*.jpg`) type declarations. The asset exists on disk. Not in any Phase-1 file; none of the touched files error.

`npm run test:run`:
```
 Test Files  243 passed | 1 skipped (244)
      Tests  4068 passed | 18 skipped (4086)
   Duration  75.78s
```
(workContract.test.ts alone: 34 passed.)

### Open risks
- The `next-env.d.ts`-absent tsc error will vanish once the harness runs a Next build; if a reviewer runs bare `tsc` they will see it — unrelated to E4.
- `goal` currently flows through persistence only; generation does not consume it (by design — consuming it would modify the copy path → tier escalation). Phase 2+ wires the UI.

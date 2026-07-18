# B17 — Remove `NEXT_PUBLIC_WORK_COPY_ENGINE` env kill-switch (work copy engine always on)

Branch: `fix/qa-0718`. Founder directive (O13 escalated). Not committed.

## Files changed

- `src/lib/workCopyEngine.ts` — logic change + header/doc de-landmine
- `src/lib/workCopyEngine.test.ts` — rewrote flag suite → allow-list suite
- `src/components/onboarding/journey/engines/work.test.ts` — rewrote preflight suite
- `src/modules/wizard/generation/work.llm.test.ts` — rewrote dispatch-guard suite
- `src/components/onboarding/journey/engines/work.ts` — COMMENTS only (de-landmine)
- `src/modules/wizard/generation/work.llm.ts` — COMMENTS only (de-landmine)
- `src/components/onboarding/wizard/GeneratingSlot.tsx` — COMMENTS only (de-landmine)
- `playwright.config.ts` — removed inert `NEXT_PUBLIC_WORK_COPY_ENGINE: 'true'` webServer env entry
- `src/modules/audience/work/README.md` — doc de-landmine
- `docs/task/bugs-qa-0718.audit.flagremoval.md` — this audit (new)

## The logic change

`src/lib/workCopyEngine.ts` — `workCopyEngineEnabled` was the ONE runtime reader of the env
flag. It conflated (a) the env kill-switch with (b) the template allow-list. Dropped the env
branch; it now delegates purely to the allow-list:

```ts
export function workCopyEngineEnabled(templateId: string | null | undefined): boolean {
  return isWorkCopyTemplate(templateId);
}
```

Kept as a distinct export name (thin alias) so the 4 callers (`work.llm.ts` re-export,
`work.ts` preflight, `GeneratingSlot.tsx`, tests) need no edits.

**Allow-list PRESERVED, verbatim:** `WORK_COPY_ENGINE_TEMPLATES = ['atelier']` and
`isWorkCopyTemplate` are byte-unchanged (except surrounding doc comments). The allow-list is
still the whole gate — non-atelier work templates (lumen/granth) still take the skeleton /
engine-disabled path.

No other runtime logic touched. The journey path has no skeleton fork, so removing the flag
does not re-expose the silent-skeleton landmine; the legacy-wizard skeleton path stays
reachable for non-allow-list templates (by design, preserved in `resolveWorkRoute` /
`GeneratingSlot`).

## Tests updated (old → new expectation)

`src/lib/workCopyEngine.test.ts` — deleted the env-off / `'1'` / `'false'` / flag-ON cases +
the `afterEach` env restore + the `afterEach` import. New env-independent asserts:
- `workCopyEngineEnabled('atelier') === true` (env UNSET) — was: flag OFF ⇒ false
- `granth`/`lumen`/`null`/`undefined` ⇒ false (allow-list still enforced)

`src/components/onboarding/journey/engines/work.test.ts` (STEP 05 preflight) — dropped
`priorFlag`/`afterEach` env restore and all env setup; removed the "reads kill-switch from
LEAF" case (env-flip no longer meaningful). New:
- atelier + facts ⇒ `{ ok: true }` env UNSET — was: required flag ON
- granth ⇒ `engine-disabled` (via allow-list) — was: required flag ON
- missing-facts + kind-less-group + SYNC cases kept, env setup dropped
- removed now-unused `afterEach` from the vitest import.

`src/modules/wizard/generation/work.llm.test.ts` (dispatch guard) — dropped `ORIG`/`afterEach`
env restore and all env setup. New env-independent routing:
- `workCopyEngineEnabled('atelier') === true`, lumen/null false
- (a) granth non-multipage ⇒ `granth-generator`
- (b) atelier multipage ⇒ `llm-fanout` unconditionally (env unset) — was: flag OFF ⇒ skeleton
- (c) lumen multipage ⇒ `skeleton` (allow-list still blocks) — was: flag ON case
- (d) atelier multipage ⇒ `llm-fanout`
- (module-level `afterEach` at L149 still used by the fetch-restore, kept in import.)

Regression asserts requested, all present: (1) atelier enabled env-unset ✓; (2) allow-list
blocks lumen/granth/null ✓; (3) atelier preflight ok env-unset ✓; (4) granth preflight
engine-disabled ✓; (5) resolveWorkRoute atelier⇒llm-fanout / lumen⇒skeleton env-unset ✓.

## Verification

- `npx vitest run` on the 3 suites: **79 passed** (0 fail).
- `npx tsc --noEmit`: clean (no output; the known founder.jpg error did not appear).
- Grep for `process.env.NEXT_PUBLIC_WORK_COPY_ENGINE`: **zero runtime reads remain** (only a
  reference inside `docs/task/completed/work-onboarding-shell.plan.md`, a historical doc).

## Deviations

- Also removed the now-unused `afterEach` import from `workCopyEngine.test.ts` and
  `work.test.ts` (would otherwise be dead imports). Within Files-touched; conservative.

## Open risks / follow-up

- **After deploy the founder should DELETE the Vercel prod `NEXT_PUBLIC_WORK_COPY_ENGINE` env
  var** — it is now inert (no code reads it), so leaving it is harmless but should be cleaned up.
- Numerous historical `docs/task/completed/*` and `docs/tracks/workEndtoEnd.md` still mention
  the flag; not touched (out of scope, historical record).
- The `e2e/` work journey specs previously relied on the webServer flag; with the flag gone
  they now run with work always-on (the intended state). Not re-run here (e2e not in scope).

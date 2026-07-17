# publish-trust — implementation audit

## Phase 1 — M3: honest publish failure (route + vitest)

### Files changed

- `src/app/api/publish/route.ts` (modified)
- `src/app/api/publish/route.test.ts` (new)
- `docs/task/publish-trust.audit.md` (new — this file)

(`docs/task/publish-trust.{spec,scout,plan}.md` are untracked-but-existing; commit-only per plan,
not edited by me.)

### What changed + why

**`src/app/api/publish/route.ts` — HTTP-status-only change, two hunks:**

1. Static-export catch (~`:513-556`): replaced the fall-through
   (`// Don't block publish - legacy SSR still works` + the `console.warn`) with
   `return createSecureResponse({ error: 'Publish failed. Your changes were saved — please try publishing again.' }, 500)`.
   Everything else in the catch is byte-identical: `console.error`, `Sentry.captureException`,
   orphaned-blob rollback (`del(uploadedBlobKey)`), and the `publishState:'failed'` + `publishError`
   DB write. Stable, non-leaky body matching the `{ error }` shape already used by the fatal 500.
   Why: the 200 contradicted the route's own `failed` row — first publish reported live with no KV
   routes, republish reported live while the previous version still served.
2. KV sub-catch (`:479`): added an explanatory comment on the deliberate/harmless double-set of
   `publishState:'failed'` (KV sub-catch + outer export catch), so a future reader doesn't "fix" it.

No test backdoor / force-fail hook (explicitly killed in review). No new imports, no util added.

**`src/app/api/publish/route.test.ts` (new)** — deterministic guard mirroring the
`src/app/api/forms/submit/route.test.ts` pattern (in-file `vi.mock`s; `createSecureResponse` →
`{ __body, __status }`; hand-rolled request; exported `POST` called directly). Mocks: Clerk `auth`,
`@sentry/nextjs`, `@/lib/prisma`, `@/lib/rateLimit`, `@/lib/validation`, `@/lib/security`,
`@/lib/planManager`, `@/lib/admin`, `@/lib/staticExport/injectChrome`,
`@/lib/staticExport/htmlGenerator`, `@/lib/staticExport/renderPublishedExport`,
`@/lib/staticExport/versionCleanup`, `@/lib/blog/publishBlogPost`, `@vercel/blob` (`del`, incl. the
dynamic import), `@/lib/routing/kvRoutes`, `@/lib/i18n/localeSlugCollision`.

Cases (4 — the 3 required, with the blob-rollback assertion split out for clarity):
1. export throws → **500**, non-empty `{ error }`, **no `url`**/`message`; exactly one
   `publishState:'failed'` update carrying the thrown message; `del` NOT called (a throw *during*
   generation never records a `blobKey` — the helper self-cleans; matches `route.ts:396-397`).
1b. throw *after* a successful upload (KV write fails) → 500 **and** `del` called with the uploaded
   `BLOB_KEY` — this is the rollback-called-with-uploaded-key assertion from the plan.
2. KV write throws (KV sub-catch path) → 500, no `url`, ≥1 `failed` write containing the KV detail.
3. Happy path → **200** `{ message: 'Page published successfully', url }`, no `failed` write, no `del`.

### Deviations from plan

- **Export-throw seam is `renderPublishedExport`, not `generateStaticHTML`.** The route no longer
  calls `generateStaticHTML` directly (it dynamic-imports `@/lib/staticExport/renderPublishedExport`,
  which wraps generation + upload + versioning). Mocked BOTH; case 1 throws from
  `renderPublishedExport` — the real seam. Same catch exercised.
- **Rollback assertion split into case 1b.** The plan folded "del called with the uploaded key when
  one exists" into case 1, but in case 1 no key exists yet by construction — so case 1 pins
  `del` NOT called and case 1b (post-upload throw) pins `del(BLOB_KEY)`. Conservative: both facts
  asserted, nothing dropped.
- Added a few mocks beyond the listed set (`@/lib/admin`, `@/lib/rateLimit`, `@sentry/nextjs`,
  `versionCleanup`, `publishBlogPost`) — all in-file, needed to reach the catch deterministically.

### Verification (actual output)

- `npx vitest run src/app/api/publish/route.test.ts` → `Test Files 1 passed (1) · Tests 4 passed (4)`.
- `npm run test:run` → `Test Files 210 passed | 1 skipped (211) · Tests 3550 passed | 18 skipped (3568)` (60.8s).
- `npx tsc --noEmit` → **one error, PRE-EXISTING and unrelated**:
  `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'`.
  Cause: this worktree has no generated `next-env.d.ts` (gitignored, produced by `next dev/build`);
  the asset file exists on disk. Not touched by, and not fixable within, this phase's file list — not "fixed".
  No errors in `src/app/api/publish/**`.
- Diff-read: the new `return` sits inside the static-export `catch` (inside the outer `try`, not
  rethrowing), so `'Page published successfully'` at the end of the outer `try` is **unreachable**
  whenever the export catch fires. Confirmed against `git diff`.
- `npm run test:e2e` deliberately NOT run — authed e2e is known-red until phase 2 lands (plan §Phase 1
  verification / §Phase 2).

### Open risks / follow-ups to carry

- **Known-red window:** dev/e2e publish now honestly 500s (no Blob/KV locally). `e2e/helpers/seedDraft.ts`
  `publishSeed`, `publish.spec.ts`, `dashboard-redirects.spec.ts`, `dashboard-shell.spec.ts` are red
  until **phase 2**. Phase 2 must follow immediately.
- **Subpage-blob rollback leak (`route.ts:521-530`) — OUT OF SCOPE, note only:** the rollback deletes
  only the root `uploadedBlobKey`; subpage/locale blobs uploaded by `renderPublishedExport` are
  orphaned on a post-upload failure. The new 500 makes this path more likely to be *hit* (it no
  longer silently succeeds), so the leak is now more visible. Already on the plan's follow-up list.
- Not committed — tree left dirty for the orchestrator.

---

## Phase 2 — M3 e2e seam (dev publish now honestly 500s)

**STATUS: INCOMPLETE — BLOCKED. Full e2e is NOT green.** 2 tests fail on `429 Rate limit
exceeded`, caused by a **pre-existing bug in `src/lib/rateLimit.ts`** — a file NOT on this
phase's Files-touched list. Stopping and reporting per the out-of-scope rule rather than
weakening the specs into accepting 429 (which the phase's core design rule forbids).

### Files changed

- `e2e/helpers/seedDraft.ts` (modified)
- `e2e/publish.spec.ts` (modified)
- `e2e/dashboard-redirects.spec.ts` (modified)
- `e2e/dashboard-shell.spec.ts` (modified)
- `e2e/README.md` (modified)
- `src/app/api/publish/route.test.ts` (modified — folded phase-1 review items)
- `docs/task/publish-trust.audit.md` (this entry)

Not touched: `playwright.config.ts` (no new spec file), `e2e/dashboard-workspace.spec.ts`.
`docs/task/publish-trust.plan.md` shows as modified in `git status` — that is phase 1's
uncommitted progress-log edit, **not mine**.

### What changed + why

**`e2e/helpers/seedDraft.ts`** — `publishSeed` no longer asserts `res.ok()`. New rule:
`200 || (500 && GET /p/{slug} < 400)`. A non-500 error status fails immediately; a 500 is
tolerated ONLY after confirming the row actually serves. A publish leaving no serving row
still fails loudly. Rewrote the `:268-279` doc comment, which documented the removed
non-fatal-fallback behavior (it claimed the export "fails non-fatally" → now an honest 500).

**`e2e/publish.spec.ts`** — captures the real `POST /api/publish` response via
`page.waitForResponse` and branches: 200 → the pre-existing live-card + `/p` assertions,
unchanged; 500 → the M3 client-behavior acceptance test (`publish-error` visible in the
modal, `publish-live-card` count 0). The `/p/{slug}` render assertions run in BOTH branches
(`published` and `failed` are both serving). Status is pinned to `[200, 500]` so anything
else (e.g. 429) fails rather than silently taking the "failure" branch. Timeouts untouched.

**`e2e/dashboard-redirects.spec.ts`** — `getPublishedFixture` now calls
`publishSeed(api, token, SLUG, CFG, finalContent)` instead of hand-driving the publish UI on
pre-t17 selectors (`div.shadow-lg`, /Choose your page URL/, /Confirm & Publish/, /Page
Published/) that the t17 reskin had already replaced — i.e. that path could never have
resolved. The fixture only ever needed a serving row. Added the `publishSeed` import.

**`e2e/dashboard-shell.spec.ts` (:279-289)** — `test.skip(!publishRes.ok())` would have
skipped this app-chrome guard FOREVER post-M3 (silent coverage loss). Now accepts `200|500`
and skips only if `/p/{slug}` doesn't serve, per the phase brief. Skip-not-fail preserved.

**`e2e/README.md`** — new "Local dev publish honestly 500s" section: the 500 contract + exact
error string, the `failed`-is-a-SERVING-state point, a local-vs-provisioned outcome table, and
the `200 || (500 && serving)` rule with a pointer to the route vitest.

**`src/app/api/publish/route.test.ts`** — folded phase-1 review items:
(a) deleted the inert `vi.mock('@/lib/staticExport/htmlGenerator')` (the route never imports
it) and reworded the comment to name the real seam, `renderPublishedExport`;
(b) case 1 now pins the exact string via a `FAIL_MESSAGE` const — status + `typeof === 'string'`
would also pass on the outer fatal catch's `'Internal Server Error'`, so it did not prove the
honest-failure path; (c) added `expect(Sentry.captureException).toHaveBeenCalled()` (spec M3
names Sentry capture as preserved behavior; nothing pinned it). Verified the string matches
`route.ts:555` byte-for-byte. Case-1 title no longer says "generateStaticHTML".

### Verification (REAL output)

- `npx tsc --noEmit` — **clean, 0 errors.** (The plan's expected `founder.jpg` TS2307 is GONE:
  the e2e run's `next dev` generated the missing `next-env.d.ts`. That env note is now stale.)
- `npx vitest run src/app/api/publish/route.test.ts` — `Test Files 1 passed (1) / Tests 4 passed (4)`.
- `npm run test:run` — `Test Files 210 passed | 1 skipped (211) / Tests 3550 passed | 18 skipped (3568)`.
- `npm run test:e2e` — **NOT GREEN.** Run 2 (`E2E_PORT=3111`) summary line:
  `2 failed / 10 skipped / 11 did not run / 60 passed (14.4m)`
  - `dashboard-lifecycle.spec.ts:157 DD7` — `/api/publish -> 429`
  - `publish.spec.ts:14 publish service / Lex` — `/api/publish -> 429 (unexpected status)`
  - "11 did not run" = serial-mode cascade from the two failures.
  - Run 1 (`npm run test:e2e`, port 3000) aborted before testing: `EADDRINUSE :::3000` — a
    FOREIGN process (PID 17640) owns 3000. Did NOT reuse it: `reuseExistingServer` would then
    have silently tested another worktree's code (the config's own warning at :86-90). Used the
    config-supported `E2E_PORT=3111` instead.

**`dashboard-shell` blog test RUNS, not skipped — evidence** (the seam's whole point), run 2 line 135:

```
✓  56 [authed] › e2e\dashboard-shell.spec.ts:258:7 › blog preview escapes the dashboard shell (B2) › rendered preview has no .app-chrome ancestor (1.5m)
```

A checkmark + 1.5m runtime = executed to completion (a skip prints `-` and ~0ms). The 500 branch
of the seam is therefore exercised and the guard is alive.

### BLOCKER — pre-existing bug outside Files touched: `src/lib/rateLimit.ts`

`defaultKeyGenerator` returns **`user:{id}` with no per-preset namespace**, and all presets
share ONE `rateLimitStore`. So EVERY rate-limited route increments the SAME counter, then
compares it against ITS OWN `maxRequests`. `/api/publish` (PUBLISHING, max **5**/60s)
therefore tests a counter fed by `/api/saveDraft` (DRAFT_OPERATIONS, 30/60s), the AI routes
(AI_GENERATION), etc. `seedDraft` itself spends ~3 of publish's 5-request budget
(strategy + copy + saveDraft) before publishing.

Server log, run 1: `WARN: Rate limit exceeded for key: user:user_3F4Worb53aGonh5MLUNcUOmsBwj
{"requests": 5, "limit": 5}` — while the client had made only 3 publish calls. Worse:
`entry.resetTime` is set by whichever route CREATED the entry, using ITS `windowMs`, so a
long-window preset can pin publish out for that whole window.

**Product impact (not just tests): a user who saves drafts normally can lock themselves out of
publishing for a minute.** This is a real bug the e2e suite has now surfaced.

Why latent until now: publishes used to take ~2min each (waiting out the doomed Blob/KV calls
before the old fake 200), which spaced them past the 60s window by accident. M3's honest 500
returns in seconds (DD7: 1.8m → 2.3s), so the collision surfaces.

`awaitPublishWindow` cannot model this — it only knows its own publish calls. I tried a
`retryAfter`-honoring back-off in `publishSeed` (in-scope, honest pacing); **it did not work** —
DD7 still 429'd after a full 60s wait, because the following seed re-spends the budget. I
reverted it rather than leave a useless minute-long wait in the helper.

**The honest fix is ~one line in `src/lib/rateLimit.ts`: namespace the key per preset** (e.g.
include a preset/route name in the key). That file is NOT on this phase's Files-touched list →
stopping for orchestrator direction. The only alternatives are dishonest: accepting 429 in the
helpers (violates the phase's core design rule — a 429 means the publish never ran) or
bypassing the limiter in tests (the helper's existing comment explicitly rejects that: "the
suite must exercise the REAL limiter that production users hit").

### Deviations

- **Ran e2e on `E2E_PORT=3111`, not the default 3000** — 3000 is held by a foreign process;
  reusing it would have tested another worktree's code. Config-supported, no file changed.
- **`publishSeed` 429 back-off: added, then reverted.** Ineffective (see above); left the
  helper minimal so the real fix can land in `rateLimit.ts`.

### Open risks

- **Phase 2 is NOT done.** e2e stays red until the `rateLimit.ts` key collision is resolved.
  The 5 seam edits themselves look correct — every non-429 assertion passed, incl. the
  dashboard-shell guard and 60 other tests.
- The 429 strictness in `publish.spec.ts` / `dashboard-shell.spec.ts` is deliberate: once the
  limiter is fixed those pin real regressions instead of hiding them.
- Not committed — tree left dirty for the orchestrator (`plan.md` dirty from phase 1, not me).

---

## Phase 2a — rate-limit key namespacing (SCOPE ADDITION, founder-approved 2026-07-17)

**Files changed**
- `src/lib/rateLimit.ts` (modified)
- `src/lib/rateLimit.test.ts` (NEW — no suite existed)
- `docs/task/publish-trust.audit.md` (this append)

### The bug — why it is a real prod bug, not a test artifact

`defaultKeyGenerator` returned a bare `user:{userId}` / `ip:{ip}` with no per-preset namespace, while
every preset shares ONE module-level `rateLimitStore`. So every rate-limited route incremented **the
same counter**, then compared it against **its own** `maxRequests`. Net effect: the LOWEST limit in
play governed ALL routes for a user.

Real users hit this with zero test involvement: `AI_GENERATION` is 5/min on FREE, so a user who
generates/regenerates copy 5× within 60s then gets **429 "Too many requests"** on `POST /api/publish`
(`PUBLISHING` = 5/min) — a limit they never came close to hitting on publishing, with a message that
names the wrong thing. Same collision across `withDraftRateLimit` (30), `withFormRateLimit` (10),
`withGeneralRateLimit` (100): the 100/min "general" budget was never actually 100 for anyone who had
made 5 AI calls. Every preset's advertised number was fiction.

Phase 1 did not cause this, it EXPOSED it: publishes used to take ~2min (waiting out doomed Blob/KV
retries), accidentally spacing calls past the 60s window; M3's honest 500 returns in ~2.3s, so the
collision now surfaces on every e2e run.

### Fix mechanism + why

Added a required `name: string` to `RateLimitConfig` and gave every preset one; store keys are now
`{name}:user:{id}` / `{name}:ip:{ip}`. This mirrors the pattern that already existed 40 lines up
(`checkDomainRateLimit` → `domain:{name}`), which is left untouched (already correctly namespaced,
and not per-user).

`name` is **required, not optional**. An optional field with a `'default'` fallback would let a
future caller silently re-create exactly this bug; required makes the compiler force a namespace
choice. This cost nothing here — grep confirmed **zero** inline configs and **zero** custom
`keyGenerator`s repo-wide; every caller goes through a preset via the `with*RateLimit` wrappers.

The deliberate LOOSENING (each route now gets its own budget ⇒ strictly more total requests/user/min)
is documented in a comment on `buildStoreKey` with a "do NOT fix this back" note, so a future reader
doesn't read it as an accident.

Preserved verbatim: tier-based override logic, fail-open catch, all response headers in
`withRateLimit`, `cleanExpiredEntries`, and every preset's own advertised limit.

### Consistency trap

Handled via a single `buildStoreKey(req, config)` helper. `rateLimit()`, `getRateLimitStatus()` and
`clearRateLimit()` all now derive their key ONLY through it — none of the three calls `keyGenerator`
directly any more. `defaultKeyGenerator` now returns the *identity* portion only and carries a
comment saying its result is never a store key. Two tests pin the trap shut (status reports the count
`rateLimit()` recorded; clear actually frees the budget) and both are per-preset-scoped.

### Custom keyGenerator — decision (documented in-code)

A custom `config.keyGenerator` is **NOT** namespaced. Rationale in the `buildStoreKey` doc comment: a
caller supplying its own generator is declaring its own scope — which may intentionally be shared
across configs or already carry a namespace — so wrapping it would silently override that intent.
Callers wanting per-config isolation bake the namespace into their generator. No such caller exists
today; this is a forward-looking contract.

### Verification (real output)

- `npx tsc --noEmit` → **exit 0, zero errors**. The `founder.jpg` TS2307 the plan warned about is
  GONE (phase 2's e2e run generated `next-env.d.ts`). Nothing else surfaced.
- `npm run test:run` → **211 passed | 1 skipped (212 files); 3559 passed | 18 skipped (3577 tests)**.
  3550 → 3559 = my 9 new cases, no regressions.
- `npx vitest run src/lib/rateLimit.test.ts` → 9/9 passed.
- Did NOT run `test:e2e` (phase 2's gate, orchestrator's to run).

### Non-vacuousness evidence for test #1 (measured, not reasoned)

Temporarily reverted `buildStoreKey` to the un-namespaced key and re-ran the suite:

```
× does NOT share a counter across presets: exhausting AI_GENERATION leaves PUBLISHING allowed
× getRateLimitStatus is per-preset: another preset reads 0 for the same user
× clearRateLimit only clears its own preset
Tests  3 failed | 6 passed (9)
```

Test #1 goes red against the bug — it is a genuine regression test. Namespace restored, re-verified
green.

**This run also caught a weak test of my own:** `namespaces unauthenticated callers by IP per preset`
PASSED under the revert (DOMAIN_VERIFY's 2 shared increments still cleared GENERAL's 100 limit, so
`allowed` stayed true either way). I strengthened it to assert `remaining === maxRequests - 1` (97 vs
99 under a shared counter) rather than leave a test that couldn't fail. Worth noting: had I only
reasoned about test #1 instead of running the revert, this dud would have shipped looking like
coverage.

### Deviations from the plan

- Plan said `${presetName}:user:${userId}`; implemented as a required `name` on `RateLimitConfig`
  rather than deriving the name by reverse-lookup from `RATE_LIMIT_PRESETS` (which would have been
  identity-based, fragile, and broken for non-preset configs). Type-safe, no `any`.
- Added 6 tests beyond the 4 required (IP-namespacing, tier fail-open fallback, per-preset scoping of
  status and clear) — same file, same mechanism, no scope creep.

### Open risks

- **Loosening is real:** a user can now make up to the SUM of all preset budgets per minute (~150+
  requests/min across routes) where the effective ceiling was previously the lowest single limit.
  Intended and founder-approved, but it does mean AI-spend exposure per user per minute rises from
  effectively-5 to a true 5 (FREE) / 10 (PRO) — credit checks (`checkCredits`), not the rate limiter,
  remain the real cost gate. Worth a conscious nod, not a blocker.
- Store remains in-memory per instance (pre-existing): on multi-instance serverless, limits are
  per-lambda, so real-world limits are already looser than advertised. Unchanged by this fix; Redis
  is the documented long-term answer. Not in scope.
- Phase 2's `test:e2e` green is the actual proof this unblocks the 429s — orchestrator runs it next.
- Not committed; tree left dirty. Phase 2's e2e edits untouched. Benign snapshot EOL churn
  (`uiFoundationIsolation.test.tsx.snap`) reverted via `git checkout --` per plan note.

---

## Phase 2 (cont.) — pre-existing flake fix folded in: `dashboard-lifecycle.spec.ts` 404

**Files changed**
- `e2e/dashboard-lifecycle.spec.ts` (modified)
- `docs/task/publish-trust.audit.md` (this section)

### What changed

`dashboard-lifecycle.spec.ts:393` (now ~:397) intermittently got **404** from
`POST /api/projects/{token}/unpublish`. Root cause is NOT the route and NOT phase 2/2a: the
file is byte-identical to `main` and fails there too under load. Clerk's `__session` JWT lives
~60s and is refreshed by clerk-js only while the browser sits on an **app** page (documented in
`publish.spec.ts:19-21` — the reason `authedApi()` exists). `page.goto('/p/{slug}')` navigates
to a PUBLISHED page (no clerk-js) → refresh stops → the next `page.request` call can land past
expiry → `src/middleware.ts:251-253` `auth.protect()` → `handleUnauthenticated()` → `notFound()`
→ 404. Slow runs (e.g. after limiter back-off) crossed the expiry window.

Fix: every `/p/{slug}` check in this file whose assertion is **status-only** now goes through
`api` (= `page.request`, same cookie jar) instead of `page.goto`, so the browser never leaves the
Clerk-bearing page. 6 call sites across the 3 hazard tests, each with a WHY comment referencing
`authedApi`:

- `custom domain attached → 409 …` (the failing one): `/p/{slug}` "must keep serving" → `api.get`,
  immediately before the `unpublish` call that was 404ing.
- `unpublish takes /p/{slug} down …` (latent): baseline-serves, post-unpublish-404, and
  re-published-serves → `api.get` (the first two precede further `api.*` calls).
- `delete removes the project …` (latent): baseline-serves + deleted-404 → `api.get`.

No assertion weakened (same URL, same expected statuses, same messages), no retries, no sleeps,
no prod source touched. The sibling test at `:187` (anonymous → middleware 404) is untouched and
still passes — it pins that middleware behaviour deliberately.

### Deviations

- Used the `api.get` treatment at ALL 6 sites rather than re-minting via `authedApi(page)`: none
  of these assertions inspect the rendered page, only the HTTP status, so no browser navigation
  was downgraded. `page` stays in use (it backs `authedApi`).
- The ONE remaining `page.goto('/p/{slug}')` call (`e2e/dashboard-lifecycle.spec.ts:115`) is the
  LAST statement before `finally`-block cleanup whose result is unchecked → no expiry hazard; left
  as a real navigation.
  <!-- Corrected in phase 2a (hardening): this bullet previously said "two remaining" calls. Only
  one remains (`:115`); the reasoning is unchanged and still holds. -->

- Ran e2e on `E2E_PORT=3115` (3000 held by a foreign process; reusing a server would test another
  worktree's code). Config-supported, no file changed.

### Test results

- `npx tsc --noEmit` — clean, 0 errors.
- `E2E_PORT=3115 npx playwright test e2e/dashboard-lifecycle.spec.ts --project=authed` →
  **`14 passed (4.2m)`**. The run included real limiter back-offs (35s + 7s waits) — i.e. it
  reproduced the slow condition that used to trigger the flake, and stayed green.

### Open risks

- Fixes the flake's mechanism, not its class: any FUTURE test that leaves an app page and then
  calls `page.request` inherits the same trap. The per-site comments are the mitigation; a
  session-refreshing helper would be the general answer (out of scope).
- Full `test:e2e` not run here (orchestrator runs it next, ~14min).
- Not committed; tree left dirty. Other agents' phase 2 / 2a files untouched.

---

## Phase 2a (hardening)

Three non-blocking polish fixes folded in after the phase-2a review (verdict was `ship`).

**Files changed**
- `src/lib/rateLimit.ts`
- `src/lib/rateLimit.test.ts`
- `docs/task/publish-trust.audit.md` (this file — appended this section; corrected the
  "two remaining `page.goto`" bullet above to ONE, at `e2e/dashboard-lifecycle.spec.ts:115`)

### Fix 1 — the anti-recurrence guard was theatre; now it's real
Phase 2a made `name` REQUIRED on `RateLimitConfig` so a future preset can't silently recreate the
shared-counter bug. But all 6 presets were written `{...} as RateLimitConfig`, and a type
ASSERTION does not enforce required props — a preset omitting `name` compiled clean, produced the
store key `undefined:user:{id}`, and the bug was back, silently.

Swapped all 6 to `satisfies RateLimitConfig` and documented WHY directly on `RATE_LIMIT_PRESETS`
(so it can't rot back to `as`). `satisfies` preserves the literal type, so no consumer inference
broke — `tsc` is clean and no consuming code changed.

**Proof the guard now bites** — temporarily deleted `name` from the `PUBLISHING` preset:
```
src/lib/rateLimit.ts(69,5): error TS1360: Type '{ maxRequests: number; windowMs: number; }' does
  not satisfy the expected type 'RateLimitConfig'.
  Property 'name' is missing in type '{ maxRequests: number; windowMs: number; }' but required in
  type 'RateLimitConfig'.
src/lib/rateLimit.ts(339,26): error TS2345: Argument of type '{ maxRequests: number; windowMs:
  number; }' is not assignable to parameter of type 'RateLimitConfig'. ...
```
Restored immediately; no residue. Note the bonus second error: the missing `name` now also fails
at the CONSUMER site — under `as` both were invisible.

### Fix 2 — pinned the outer fail-open path
`rateLimit`'s outer catch (returns `allowed: true` when the limiter itself throws) had no test;
the existing "plan lookup throws" case covers the INNER tier catch only.

New test throws from a custom `keyGenerator` (awaited by `buildStoreKey`) on a **non-tierBased**
config. This provably hits the OUTER catch: with `tierBased` absent the inner try/catch block
never executes at all. Throwing via `auth` was rejected as a seam — `defaultKeyGenerator` swallows
auth errors itself and falls back to an IP key, so nothing would reach either catch (that would
have been a dud test). Asserts `allowed: true`, `error: 'Rate limiting service unavailable'`,
full `remaining`, and a future `resetTime`.

**Mutation-checked, not assumed:** making the outer catch `throw error` fails exactly this one
test (`1 failed | 9 passed`), and it fails with the test's OWN thrown error propagating out —
confirming the error travels through that catch. Restored.

### Fix 3 — comment arithmetic
`rateLimit.test.ts` comment said a shared counter would report `97` remaining; actual is `98`
(DOMAIN_VERIFY's blocked 2nd call never increments). Comment-only; the `99` assertion was already
correct and mutation-sensitive. Added the reason inline so the number is checkable, not folklore.

### Verification
- `npx tsc --noEmit` → **0 errors**.
- `npm run test:run` → **3560 passed | 18 skipped** (211 files passed, 1 skipped). Baseline was
  3559; the +1 is fix 2's test.
- `test:e2e` deliberately NOT run — orchestrator already has it green (73 passed / 0 failed).
- Vitest EOL churn on `uiFoundationIsolation.test.tsx.snap` appeared and was `git checkout --`'d
  (pure CRLF/LF, zero content diff).

### Deviations
None.

### Open risks
- None from these fixes. `satisfies` is compile-time only — zero runtime change; fixes 2 and 3 add
  no production code. The one behavioural note remains phase 2a's deliberate LOOSENING (per-preset
  budgets ⇒ a user can make more total requests/min than under the shared counter), already
  documented on `buildStoreKey`.
- Not committed; tree left dirty as instructed. Other agents' phase 2 / 2a files untouched.

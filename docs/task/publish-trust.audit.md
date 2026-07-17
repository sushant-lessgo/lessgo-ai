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

---

# Phase 3 — M4: head escaping + URL scheme gate

**Files changed**
- `src/lib/staticExport/headTags.ts` — added `isSafeURL()` + contract doc comment.
- `src/lib/staticExport/buildPageMetadata.ts` — scheme gate in `resolveOgImage` (source) + at the
  `seo.ogImage`/`previewImage` merge point in `buildPageMetadata`.
- `src/lib/staticExport/htmlGenerator.ts` — escaped the raw head sinks; gated hreflang hrefs;
  documented why canonical is escape-only.
- `src/lib/staticExport/headTags.test.ts` — extended (isSafeURL, escapeHTML matrix, favicon single-escape).
- `src/lib/staticExport/buildPageMetadata.test.ts` — extended (og scheme gate at source + merge point).
- `src/lib/staticExport/htmlGenerator.test.ts` — extended (end-to-end head XSS hardening).
- `docs/task/publish-trust.m4-samples.md` — NEW: human-gate benign/hostile `<head>` sample pair.
- `docs/task/publish-trust.audit.md` — this section.

## What changed and why

The `<head>` is built by raw template-string interpolation, so every user-influenced value in it was
a **stored-XSS sink on live customer domains** (`*.lessgo.site` / custom domains). Escaping alone
was insufficient: `previewImage` is validated by `z.string().url()` (`validation.ts:117`), which
**accepts `javascript:`** — hence the scheme allow-list as well as the escaping.

`isSafeURL` strips ALL `\x00-\x20` chars anywhere (not `.trim()`, which would let `java\tscript:x`
and `java script:x` through — browsers ignore those when parsing a scheme), lowercases, rejects
protocol-relative `//`, and accepts only absolute `https://`/`http://` or root-relative `/…`. No
entity-decode: the predicate runs BEFORE `escapeHTML`, which re-encodes any `&`, so an
entity-encoded colon can never re-activate.

## Per-sink treatment table

| Sink (line) | Scheme gate? | Escape? | Reject semantic |
|---|---|---|---|
| `a.href` hreflang (:317) | YES `isSafeURL` | YES | **OMIT the whole `<link>`** (no safe degraded href; `''` would self-link under a foreign hreflang) |
| `canonicalURL` (:382/:386/:394) | **NO — deliberate** | YES | n/a — always built `https://${host}${path}` (`canonicalUrl.ts:18-21`), scheme is literal so a gate could never fire; hostile content sits in host/path where escaping is correct + sufficient. Reasoning documented at the call site to prevent future churn. |
| `ogImage` (:389/:397) | YES — **at source** in `resolveOgImage` + at the merge point | YES | **FALL THROUGH** the `||` chain to auto `/api/og/{slug}` (never `''` — an empty og:image is a broken card) |
| `metadata.slug` + `publishedPageId` (:431 data attrs) | n/a (not URLs) | YES | n/a |

Merge-point gating means an unsafe `seo.ogImage` no longer shadows a benign `previewImage` — it
falls through to it. The gate is idempotent, so double-gating (merge point + source) is harmless.

## DO-NOT-WRAP list — each verified, left untouched

- `metadata.title` / `description` (:378/379/387/388/395/396) — already `escapeHTML`'d. Confirmed
  `stripHTMLTags` (`buildPageMetadata.ts:144-145`) strips tags but does NOT encode, so the existing
  wrap is the one and only. Verified by the benign sample: `&amp;` once, no `&amp;amp;`.
- `faviconUrl` — escaped INSIDE `faviconLinkTag` (`headTags.ts:33`). New test pins single-escape.
- `lang`, `a.hreflang` — already escaped. `bodyHTML` — React-escaped.
- `metaPixelId` / `ga4MeasurementId` — regex-gated to charsets with no HTML metacharacters.
- `assetBase` — env-derived, not user-controlled.
- `resolveOgImage`'s `encodeURIComponent` on `?path=` — percent-encoding, orthogonal to
  HTML-escaping; benign sample confirms no interaction.
- Import hygiene: `escapeHTML`/`isSafeURL` imported ONLY from `./headTags`. The confusable
  `escapeHtml` namesakes (`src/lib/email/*`, `src/utils/formatUtils.ts`, `formHandler.js`) were not
  touched or imported.

## `resolveOgImage` shared-reader note (confirmed, files NOT edited)

Grep confirms exactly the 3 predicted readers outside the static path:
`src/app/p/[slug]/[...subpath]/page.tsx:71`, `src/app/p/[slug]/blog/[postSlug]/page.tsx:47` and `:96`.
All three pass a URL into the `previewImage` slot and use the return purely as an og:image URL.
The gate changes their behavior **safely**: an unsafe candidate now yields the auto `/api/og/{slug}`
URL instead of a live `javascript:` og:image. No reader can receive `''`. Note the blog route feeds
`seo?.ogImage || post.heroImage` — an unsafe `heroImage` now also degrades to the auto OG image
(an improvement, not a regression).

## Verification (real output)

- `npx tsc --noEmit` → **exit 0, 0 errors**.
- `npm run test:run` → **Test Files 211 passed | 1 skipped (212); Tests 3586 passed | 18 skipped
  (3604)**. Baseline was 3560 passed | 18 skipped → **+26 new tests**, zero regressions.
- **SNAPSHOT GUARD (asserted, not assumed):**
  `npx vitest run src/modules/generatedLanding/uiFoundationIsolation.test.tsx` → **5 passed**, and
  `git diff -- src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`
  produced **NO content diff** (only git's `LF will be replaced by CRLF` warning). Its clean URLs
  (`https://iso.lessgo.site`, `https://lessgo.ai/api/og/iso`) are `escapeHTML` no-ops, as designed.
  Nothing was re-recorded.
- `npm run test:e2e` deliberately NOT run (orchestrator has it green: 73 passed / 0 failed).

## Human-gate evidence

`docs/task/publish-trust.m4-samples.md` — real generated `<head>` for a benign and a hostile fixture.
Benign: identical except `&` → `&amp;` in attributes, no `&amp;amp;`. Hostile: payload inert
(`&quot;&gt;&lt;script&gt;`), no injected element, `javascript:` absent from the document entirely.

## Deviations

1. **`isSafeURL` also rejects `/\evil.com`** (not just `//evil.com`). In-scope judgment call: some
   browsers normalize `/\` to `//`, making it a protocol-relative twin. Conservative option taken;
   test pins it.
2. **`https://`/`http://` prefix required, not bare `https:`/`http:` scheme match.** The plan says
   "absolute"; requiring `//` is the stricter reading (rejects `https:foo`). Conservative.
3. **hreflang filtering happens BEFORE the `alternates.length` check**, so an all-unsafe set emits
   no `<!-- i18n hreflang alternates -->` comment block either (rather than a dangling comment).
4. **A transient test harness** (`src/lib/staticExport/__m4sample.test.ts`) was created to generate
   the sample pair and **deleted immediately after**; it is not in the tree. Samples were written to
   the scratchpad, not the repo.

## Open risks / must-know

- **`__snapshots__/uiFoundationIsolation.test.tsx.snap` shows as modified in `git status` with an
  EMPTY content diff** — benign EOL churn from vitest rewriting it with LF, exactly as predicted.
  I did **not** `git checkout --` it: my hard rules forbid state-changing git commands, and the
  orchestrator's pre-authorization is an agent message, not user consent. **Orchestrator: please
  restore it before committing** so the phase-3 diff stays scoped. Content is provably unchanged.
- Benign published pages change by a few bytes (`&` → `&amp;` in og:image/canonical attrs) — that is
  the intended, correct delta and the reason this is a human gate.
- **Out of scope, follow-up findings (NOT fixed):** `cssVariablesStyle` CSS-context injection
  (`htmlGenerator.ts:441-455`) — raw theme values inside `<style>`, where `escapeHTML` is inert;
  needs a CSS-value validator. `localeJson` U+2028/29 (pre-ES2019 engines only). `jsonLd` verified
  already breakout-safe via `structuredData.ts:70`.
- Not committed; tree left dirty as instructed. Phases 4-5 not touched.

---

## Phase 4 — M5: published-CSS guards (**shipped as option C: guards only, no new globs, no sha bump**)

**STATUS: DONE.** Phase 4 was escalated mid-flight because M5's premise was false (evidence below,
retained — it is the valuable part of this entry). The founder/orchestrator ruled **option C**:
in-script guards + the dead-glob cleanup only. **A and B were rejected.** No new template globs, no
artifact change, no baseline bump.

### Files changed
- `scripts/buildPublishedCSS.js` — removed the dead `src/modules/UIBlocks/**/*.published.tsx` glob;
  added guard 1 (per-glob zero-match hard fail) + guard 2 (app-chrome 0-leak). Guard numbering
  renumbered 1-2 after the placeholder guards were dropped.
- `docs/task/publish-trust.audit.md` — this entry.
- **NOT touched (verified unmodified):** `public/published.css`,
  `src/modules/generatedLanding/__fixtures__/published-css.sha256`.

### What shipped (option C, exactly)
1. **Removed** the dead glob `src/modules/UIBlocks/**/*.published.tsx` (dir removed long ago → 0
   matches). This is the one real piece of M5 cleanup.
2. **Kept** the 3 live globs: `src/components/published/**/*.tsx`,
   `LandingPagePublishedRenderer.tsx`, `componentRegistry.published.ts`.
3. **Reverted all 16 added globs** (`templates/**`, `skeletons/**`, `sharedBlocks/**`, `Design/**`,
   `staticExport/*`). Rationale on record below.
4. **Guard 1 — per-glob zero-match hard fail.** Each content glob resolved via `fast-glob`; any glob
   matching 0 files → `exit 1` naming that glob. Phase 4's durable value: it would have caught the
   original rot, which aggregate/size checks did not.
5. **Guard 2 — app-chrome 0-leak.** Output must contain none of (case-insensitive) `onest`, `caveat`,
   `material symbols`, `app-primary`, `app-cta`, `app-ink` → else `exit 1`. Pins the ui-foundation
   isolation contract at build time.
6. **Dropped the placeholder guards** (marker classes `[]`, size cap) entirely — no `[]` stubs, no
   dead cap code left behind. The pre-existing `>100KB` warn was restored verbatim to its committed
   form (a prior edit had replaced it with the placeholder cap); its prose is still factually correct
   (target <50KB, actual 31.28KB).

### Why A and B were rejected — the false premise (evidence retained)

Applying the plan's 19-glob set took the artifact from **32,031 B → 42,482 B** (+32.6%). The delta is
**entirely false-positive junk**, not recovered block styling:

1. **Templates / skeletons / sharedBlocks use NO Tailwind utilities.** Every `className` token across
   all 155 newly-globbed block files: **1302 tokens, 0 Tailwind utilities** — all BEM
   (`mrd-hero__grid`, `wk-faq__in`, `lg-lead__btn`, `lm-btn-brass`…). These blocks are styled by
   **inline `<style>` + CSS custom properties the templates ship themselves**, not by `published.css`.
   **There is no purge bug.**
2. **The 91 "newly present" classes are scanner artifacts.** `uppercase`/`italic`/`text-wrap` matched
   CSS *property* text inside those inline `<style>` strings (`text-transform: uppercase;`).
   `sticky`/`lowercase` matched **code comments**. Tailwind's extractor is a regex over raw file text.
3. **~90% of the growth was one editor-only file.** `Design/**/*.ts` alone = **+9,369 B**, essentially
   all from `Design/ColorSystem/accentOptions.ts`, a class-name data table for the **editor's** accent
   picker. Published pages never use them.

**Ruling rationale:** option A's "forward insurance" would insure a path that **shouldn't exist** —
Tailwind utilities in published blocks contradict the inline+BEM convention. The right protection is a
**lint rule enforcing that convention**, logged to **backlog #30**, not this bundle. Option B would
ship ~10KB of dead CSS to every customer page and bump the sha to bless it.

Why the safelist has been carrying the load: `src/components/published/**` + the safelist really are
the only Tailwind consumers on a published page. The dead glob rotted unnoticed for months precisely
because the dir it pointed at contributes nothing to Tailwind.

### Verification (real output)

**Byte-identical artifact proof — the phase's key gate.** Removing a zero-match glob changes nothing,
as predicted:

```
✅ All 3 content globs match at least one file
✅ Published CSS generated: 31.28 KB
✨ CSS size within target range (<50KB)
✅ No app-chrome leakage
✅ Published CSS build complete!

$ sha256sum public/published.css
c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6 *public/published.css
$ wc -c < public/published.css
32031
$ git status --short          # public/published.css ABSENT => unmodified
 M docs/task/publish-trust.audit.md
 M docs/task/publish-trust.plan.md
 M scripts/buildPublishedCSS.js
```

Matches the committed artifact exactly (sha `c2f87e08…`, 32,031 B). Premise re-confirmed: none of the
reverted globs were contributing.

**Guard 1 negative spot-check** — `src/components/published/**/*.tsx` temporarily repointed at a
nonexistent path, then restored (file diffed IDENTICAL to backup afterwards):

```
🎨 Building published.css...
❌ Published CSS content glob(s) matched ZERO files:
   - src/components/does-not-exist/**/*.tsx
   A dead glob silently purges every class in that directory from published.css
   (editor looks right, published page is unstyled). Fix or remove the glob.
EXIT=1
```

**Gates:**
- `npm run build` (full: build:published-css → build:assets → next build) → **exit 0**.
- `npm run test:run` → **211 files passed | 1 skipped; 3586 passed | 18 skipped** — exactly the
  baseline. `uiFoundationIsolation.test.tsx` sha case passes against the UNCHANGED fixture, no edits.
- `npx tsc --noEmit` → **0 errors**.
- `npm run lint` → **0 errors** (only pre-existing warnings: `no-img-element`, `exhaustive-deps`).
- `test:e2e` NOT run per instruction (orchestrator has it green at 73/0).
- The snapshot LF-rewrite noise did not reproduce this run — `git status` is clean of it.

### Deviations
- **Restored the `>100KB` warn.** The prior (escalated) edit had deleted it in favour of the
  placeholder guard-4 cap. The decision said leave it as-is, so I put the committed version back
  verbatim rather than leaving it deleted. Conservative; no new cap invented.
- **Guard renumbering.** With placeholder guards 2 and 4 dropped, the surviving guards are numbered
  1-2 in-script (the decision's "guard 1" and "guard 3"). Comment-only.
- Did not touch the safelist (out of scope, per plan).

### Open risks / must-know
- **`fast-glob` is a transitive dep, not a direct one** (resolves via Tailwind's own dependency).
  Guard 1 would break with a "cannot find module" if Tailwind ever drops it. Adding it to
  `package.json` was outside this phase's Files-touched list, so I did not. Cheap follow-up.
- The M5 *defect class* is genuine (a dead glob purges silently); the *blast radius today* is nil.
  Guard 1 is the durable value of this phase.
- **Backlog #30** (lint rule: no Tailwind utilities in published blocks) is the real protection for
  the inline+BEM convention — this phase deliberately does not provide it.
- Follow-up (unchanged): safelist shrink — now better motivated, since the safelist is demonstrably
  the only thing styling published pages beyond `components/published/**`.

## Phase 4 (hardening)

Three non-blocking polish fixes from the phase-4 review (verdict was `ship`), folded in by
orchestrator decision. Scope: guards only — no template globs, no sha bump, no safelist change.

### Files changed
- `scripts/buildPublishedCSS.js`
- `docs/task/publish-trust.audit.md` (this note)

### What changed
1. **Failed build no longer orphans temp files.** Guard 2 (app-chrome 0-leak) ran
   `process.exit(1)` *after* `tailwind.published.config.js` + `published.input.css` were written,
   skipping both the inline `unlinkSync` cleanup and the `catch`'s cleanup → a failed build left two
   untracked, non-gitignored files in the repo root. Now it `throw`s instead, so the existing
   `catch` cleans up; exit stays non-zero and the message still names the offending token.
   Guard 1 untouched (it runs before the temp files exist).
2. **Dropped the `fast-glob` transitive-dep fragility.** Guard 1 now uses `require('glob')`
   (`globSync`) — `glob@^11.0.3` is already a DIRECT dep (`package.json:58`); `fast-glob` only
   resolved via Tailwind's dep tree. Zero new deps; `package.json` unmodified. Verified the swap is
   semantics-preserving: per-glob counts are **identical** to `fast-glob` for all 3 live globs
   (12 / 1 / 1) *and* for the removed dead `UIBlocks/**` glob (0 / 0).
3. **Guard 2 now word-boundary matches.** It substring-matched the whole lowercased file, so
   `onest` would false-positive on a future class containing it (`honest`), likewise `caveat`.
   Now per-token `\b…\b` with regex-escaping. `\b` matches across `-` and ` `, so `app-cta` and
   `material symbols` keep working. Over-matching, never under-matching → failure direction stays safe.

### Verification (all real output)
- `npm run build` → exit 0. `public/published.css` **byte-identical**:
  sha256 `c2f87e08f517a72b43f6e9e0e9b703b6261f4f152c711be9241649c6f26219b6`, 32,031 B, and ABSENT
  from `git status`.
- `npm run test:run` → **3586 passed | 18 skipped** (baseline exact).
- `npx tsc --noEmit` → 0 errors. `npm run lint` → 0 errors (pre-existing warnings only).
- **Negative spot-check, guard 1** (glob → nonexistent path): exit 1, names
  `src/components/published/DOES_NOT_EXIST/**/*.tsx`. Restored byte-exact (`diff` clean).
  Confirms per-glob zero-match detection survives the glob-v11 swap.
- **Negative spot-check, guard 2** (deliberately non-vacuous — probe token `tw-border-spacing-x` is
  *provably present* in the output, 2 occurrences, unlike a safelisted class that emits no CSS):
  exit 1, `❌ Build failed: App-chrome token(s) leaked into published.css: tw-border-spacing-x`,
  and **both temp files absent afterwards** (`ls` → no such file), tree clean, sha unchanged.
  Restored byte-exact.
- **Word-boundary semantics proof** (7/7 pass, same expression as the script): `.honest-review{}`
  and `.uncaveated{}` → no match (the old substring guard false-positived on the first);
  `Onest` / `"Material Symbols Outlined"` / `--app-cta` / `.text-app-ink` / `--app-primary`+`Caveat`
  → all still caught.
- `test:e2e` NOT run (orchestrator has it green at 73/0).

### Deviations
- None.

### Open risks / must-know
- The `fast-glob` risk logged in phase 4's "Open risks" above is now **resolved** — no
  `package.json` change was needed after all, since `glob` was already direct.
- Guard 2 fires *after* `public/published.css` is written, so a genuine leak leaves the leaked CSS
  on disk (build still fails non-zero). Not new, not in scope; noting it since the temp-file fix
  invites the question. Only the temp files are cleaned on failure.

---

## Merge: main hotfix × phase 2a

**Files changed** (conflict resolution only — no other file touched):
- `src/lib/rateLimit.ts`
- `src/lib/rateLimit.test.ts`
- `docs/task/publish-trust.audit.md` (this section)

### Context

`git merge main` hit 2 conflicts. Cause: main shipped an independent HOTFIX
(`cb305f26`, merged `1b8c9f63`) for the SAME shared-counter bug our phase 2a fixed —
it took down a real customer's multi-page generation in production
("Generation hit a snag. Too many requests.").

**Net: phase 2a is now largely REDUNDANT with main's hotfix.** Our surviving delta is
`satisfies` + 8 unique tests. Recorded so nobody re-reads 2a as the origin of the fix.

### `src/lib/rateLimit.ts` — main's version as base

Verified main is strictly broader than ours; took it wholesale:
- preset bucket namespacing (`ai:`, `draft:` …) — same core fix as 2a
- `name: string` required on `RateLimitConfig` + incident doc comment
- `buildKey(config, await keyGenerator(req))` at all 3 call sites — closes the same
  consistency trap our `buildStoreKey` did. Kept THEIR helper/name, dropped ours.
- kept every main-only extra: `TIER_RATE_LIMITS` ×3 (15/30/60/150, sized against the
  ~7-AI-request fan-out of one generation click); `logger.warn`→`logger.error` on
  rejection (prod runs at ERROR level — the incident left no trace); `limit` on the
  result + `X-RateLimit-Limit` reporting the TIER-EFFECTIVE limit.

Layered our ONE genuine addition main lacked:
- **`as RateLimitConfig` → `satisfies RateLimitConfig`** on all 6 presets (main had 6 `as`).
  An assertion does not enforce required props, so on main a future preset omitting
  `name` compiled clean → key `undefined:user:{id}` → the incident silently returns.
  Preserved main's preset doc comments verbatim; added a comment on why `satisfies` is
  load-bearing.

**`satisfies` proof** — removed `name` from `PUBLISHING`, `tsc`:
```
src/lib/rateLimit.ts(74,5): error TS1360: Type '{ maxRequests: number; windowMs: number; }' does not satisfy the expected type 'RateLimitConfig'.
  Property 'name' is missing in type '{ maxRequests: number; windowMs: number; }' but required in type 'RateLimitConfig'.
src/lib/rateLimit.ts(360,26): error TS2345: Argument of type '{ maxRequests: number; windowMs: number; }' is not assignable to parameter of type 'RateLimitConfig'.
  Property 'name' is missing in type '{ maxRequests: number; windowMs: number; }' but required in type 'RateLimitConfig'.
```
Errors at BOTH declaration and consumer site, as predicted. `name` restored.

### `src/lib/rateLimit.test.ts` — union of both suites (14 tests)

Base = main's file (structure, naming, mocks, incident header comment). All 6 of main's
tests kept verbatim, including the incident-pinning one that fails pre-fix.

Added 8 of ours that main lacked:
- outer fail-open (throwing `keyGenerator` on a non-`tierBased` config, so the inner
  tier catch provably never runs) — also asserts main's new `limit` field
- `getRateLimitStatus`/`clearRateLimit` consistency trap (4 tests: same key as
  `rateLimit()`, per-preset status, clear resets, clear is preset-scoped)
- IP-namespacing per preset — asserts `remaining` (99), not just `allowed` (vacuous:
  DOMAIN_VERIFY's increments never approach GENERAL's 100 either way)
- PRO tier budget; failed-plan-lookup fallback

Skipped as genuine duplicates of main's coverage (not dropped coverage):
- ours "exhausting AI leaves PUBLISHING allowed" ≈ main's "separates buckets per preset"
- ours "PUBLISHING allows 5, 429s the 6th" ≈ main's "separates buckets per preset" +
  "still refuses once a preset exceeds its own ceiling"

### Deviations

- **Our tier assertions updated to MAIN's values** (FREE 15, PRO 30) — ours assumed the
  old 5/10. Main's limits were NOT changed back.
- **`beforeEach` now re-asserts `getUserPlan` → FREE.** Main's `beforeEach` only called
  `freshUser()`; our added PRO test overrides the tier mock, which would otherwise leak
  into later tests. Minimal addition, preserves main's semantics.
- **Anon test uses a fresh unique IP per call** (`freshAnonReq`), mirroring main's
  `freshUser()` isolation — IP buckets are module-level too and would bleed.
- **"falls back to preset default when plan lookup throws" is now count-indistinguishable
  from FREE** (both 15 under main's values). Kept for inner-catch coverage but renamed +
  commented honestly rather than left implying a distinction it cannot prove.
- **Behavioural note (took main's, per instruction):** our `buildStoreKey` deliberately did
  NOT namespace custom `keyGenerator` results (caller declares its own scope); main's
  `buildKey` namespaces everything including custom generators. Main's is the safer
  default. Any future caller wanting a deliberately shared cross-preset scope via a custom
  generator can no longer get it — no such caller exists today.

### Gates

- `git status`: no `UU`/`AA`; repo-wide conflict-marker sweep clean. Left staged, UNCOMMITTED.
- `npx tsc --noEmit` → **0 errors**
- `npm run test:run` → **3638 passed | 18 skipped (214 files)**, green (pre-merge ours was
  3586|18; +52 from main's merged work incl. its rateLimit tests)
- `npm run lint` → **0 errors** (2 pre-existing `react-hooks/exhaustive-deps` warnings, unrelated)
- `test:e2e` NOT run (per instruction — founder runs it)

### Open risks

- Rate limiting stays in-memory per-instance; on serverless each instance keeps its own
  buckets, so real ceilings are effectively per-instance. Pre-existing, unchanged by either
  side, called out because the tier numbers now read as if they were global.

# secrets-forms-security — audit

## Phase 1 — server-side owner derivation

**Files changed**
- `src/app/api/forms/submit/route.ts` (modified)
- `src/app/api/forms/submit/route.test.ts` (modified)
- `src/lib/validation.ts` (modified — comment-only)
- `src/app/dashboard/[token]/leads/page.tsx` (modified — comment-only)
- `docs/task/secrets-forms-security.audit.md` (created — this file)

`src/lib/publishState.ts` was import-only, NOT edited (verified).

---

### `src/app/api/forms/submit/route.ts`

- Added `import { isServingPublishState } from '@/lib/publishState'` — canonical predicate, re-pointed not reinvented.
- `FormSubmissionRequest.userId` marked `@deprecated` / ignored; `publishedPageId` documented as the identity input.
- Destructure is now `{ formId, data, publishedPageId }` — body `userId` is **never read** (comment explains why the field survives in the schema).
- New gate after zod parse (Locked decision 2):
  - `!publishedPageId` → 400 `missing_page_id`
  - `publishedPage.findUnique({ where: { id }, select: { userId, projectId, publishState } })` → null **or** `!isServingPublishState(publishState)` → 404 `unknown_page` (same body both ways; `draft`/`unpublishing` reject, `published|publishing|failed|null` accept).
- `const ownerUserId = page.userId` swapped in at every trust point: `formSubmission.count` where-clause, `checkLimit(...)`, cap-warning log, `formSubmission.create({ data: { userId: ownerUserId } })`, the "FormSubmission saved" log, and the DB-error log (`hasUserId` → `ownerUserId` prefix).
- Form-config lookup: the all-projects `project.findMany({ where: { userId } })` scan is **gone**, replaced by `project.findUnique({ where: { id: page.projectId } })` reading `content.forms[formId]` from that one project.
- Deleted the `if (!userId)` 400 branch and the trailing "no userId → 500" fallback; the `if (userId)` wrapper became an unconditional `try` (body dedented 2 spaces — that is why the diff looks wide; content is otherwise unchanged).
- Downstream untouched in behavior: ConvertKit path, blog-subscriber upsert, `sendLeadNotification` + notify-outcome flags, success payload shape, rate-limit wrapper.
- Blog edge documented in-code at the gate (cached blog post + non-serving parent → subscribes rejected; correct per spec).

### Null `projectId` handling (the reviewer's catch)

`PublishedPage.projectId` is `String?` (`prisma/schema.prisma:154`). The lookup is guarded:

```ts
let formConfig: any = null;
if (page.projectId) { const project = await prisma.project.findUnique({ where: { id: page.projectId } }); ... }
```

So `projectId == null` → **skip the lookup entirely, no 500** → falls into the same path as "no form config found": submission stored, `formName: 'Unknown Form'`, `integrations: []`, no integrations fire. Typechecks cleanly (the `if` narrows `string | null` → `string`). Pinned by the unit test *"page with a null projectId → skips the form-config lookup, still stores the lead"*.

### `src/app/api/forms/submit/route.test.ts`

- Prisma mock: added `publishedPage: { findUnique }`; `project: { findMany }` → `project: { findUnique }`.
- **Removed both `db.project.findMany.mockResolvedValue([])` default lines** (old `:57` and `:110`) — they would throw against the reworked mock. Replaced with `publishedPage.findUnique → PAGE` + `project.findUnique → null` defaults in both `beforeEach`s.
- Added `const PAGE = { userId: 'owner_1', projectId: 'proj_1', publishState: 'published' }`.
- `BODY` **keeps the forged `userId: 'user_1'`** (file-header comment now states this is deliberate and is the forged-id pin). Flipped the two cap assertions to `'owner_1'`.
- New describe block *"server-side owner derivation"* pins: derived owner on `create` (and `!== 'user_1'`); project-scoped `findUnique({ where: { id: 'proj_1' } })`; null `projectId`; unknown page → 404; missing page id → 400 (+ no page lookup); `draft`/`unpublishing` → 404; `publishing`/`failed` → 200; `null` legacy → 200; omitted body `userId` → 200 attributed to owner.

### `src/lib/validation.ts`

Comment-only on `FormSubmissionSchema`: `userId` documented as accepted-and-ignored (old-client back-compat, form.v1.js sends it forever); `publishedPageId` left optional with a note that the route owns the stable `missing_page_id` 400 instead of a zod issues array. Both fields still `.optional()`.

### `src/app/dashboard/[token]/leads/page.tsx`

Comment-only. The stale "submit takes BOTH ids from the client body (`route.ts:57`, `:198-199`)" bullet is rewritten to describe server-side derivation + the `isServingPublishState` gate, noting rows written before this deploy may still carry a forged `userId`. The "Do NOT restore it" ruling is preserved (it rests on the PK-provenance + clerk-id-vs-User.id arguments, both unaffected).

---

### Deviations from the plan

1. **DB-error log field** — the plan said keep log lines in sync; `hasUserId: !!userId` had no meaning once `userId` is unread, so it became `ownerUserId: <prefix>...` (anonymized, matching the other log lines). Conservative, in-scope.
2. **404 message wording** — the plan's body text was "…contact support."; used `'This form is no longer available. Please contact support.'` (400 uses the plan's `'Form configuration error. Please contact support.'`). Error **codes** are exactly as specced; only the human message differs, and unresolved question 7 leaves wording open.
3. **Test extras** — added `publishing`/`failed` accept pins and an "omitted body userId" pin beyond the plan's (a)–(e) list; they cover the phase's own verification matrix at zero cost.

### Test results

```
npx vitest run src/app/api/forms/submit/route.test.ts
 Test Files  1 passed (1)
      Tests  18 passed (18)

npm run test:run
 Test Files  209 passed | 1 skipped (210)
      Tests  3557 passed | 18 skipped (3575)
```

`npx tsc --noEmit` → **one pre-existing, unrelated error**:

```
src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'
```

Not caused by this phase (untouched file, clean in `git status`). Cause: `next-env.d.ts` is generated + gitignored and has never been created in this fresh worktree, so Next's image-module type declarations are absent. It disappears after any `next dev`/`next build` in the worktree. **Not papered over — reported as-is.** No tsc errors in any Phase-1 file.

### Open risks / noticed but NOT fixed

- **Manual dev-server verification (plan Phase 1 "Verification" b/c/d) not run** — no dev server/DB in this session. Covered deterministically by the new unit pins; Phase 2's e2e spec is the real end-to-end pin.
- **`src/app/api/forms/submit/route.ts:1`** — `NextResponse` and `z` imports, and `sanitizeForLogging`, were already unused before this phase and remain so. Out of scope; not touched.
- Behavior change accepted per Locked decision 3: a `formId` living in a *different* project of the same owner no longer resolves config (lead still stored, no integrations). Phase 4 ConvertKit smoke must attach the integration to a form in the published page's **own** project.
- Leak side is still open until Phase 3: `data-owner-id` remains in published markup and `form.v1.js` still sends `userId` — harmless now that the server ignores it, but the ordering (server first) is why this is safe.

---

## Phase 2 — forged-submission e2e spec

**Files changed**
- `e2e/forms-forgery.spec.ts` — **NEW** (only file created or modified this phase)

### What was written

An API-level Playwright spec (`request` fixture, no browser) pinning the phase-1 identity
contract of `POST /api/forms/submit`. Seeds a victim directly with `PrismaClient`
(`User` → `Token` → `Project` → `PublishedPage`), following the helper/cleanup style of
`e2e/dashboard-lifecycle.spec.ts`. `content` is `{}` (no `forms`) — form config is optional,
the submission still stores as `formName: 'Unknown Form'` with no integrations. All ids are
run-scoped via a `randomUUID().slice(0,8)` suffix, so concurrent/repeat runs cannot collide.
`PublishedPage.projectId` is nullable but is SET, so the project-scoped config lookup is
exercised rather than skipped.

6 cases, all as specced:
1. **Forged owner (the required regression case)** — forged `userId: 'attacker_forged_id'` → 200,
   then the persisted `FormSubmission` row is read back via Prisma and asserted
   `toBe(VICTIM_CLERK_ID)` **and** `not.toBe('attacker_forged_id')`. The status code is
   deliberately *not* the assertion: the vulnerable route 200'd too — only the DB row
   distinguishes fixed from broken.
2. **Omitted userId** → 200, row attributed to the victim owner (catches a
   trust-body-then-fall-back-to-page regression, which case 1 alone would not).
3. **Unknown page** (cuid-shaped random id) → 404 `unknown_page`.
4. **Missing page id** → 400 `missing_page_id`.
5. **Draft** → 404 `unknown_page`, plus an assertion that **no row was stored** (proves the
   404 is a real reject, not cosmetic). Restores `published` in `finally`.
6. **Unpublishing (stuck teardown)** → 404 `unknown_page`. Restores `published` in `finally`.

The file header states plainly what it does **not** cover: the phase-3 markup/asset half, the
fail-open states (`publishing`/`failed`/legacy-null — pinned by the route unit test, which can
fabricate them without a real publish), and integration firing.

### Rate-limiter finding (watchpoint resolved — no sleeps needed)

Inspected rather than assumed. `withFormRateLimit` → `RATE_LIMIT_PRESETS.FORM_SUBMISSION` =
**10 requests / 60 000 ms** (`src/lib/rateLimit.ts:36-39`), keyed by `defaultKeyGenerator` →
`ip:{ip}` for an anonymous caller (`/api/forms/submit` is in the middleware `isPublicRoute`
list, so no Clerk session). The spec makes **exactly 6 POSTs** from one IP → under the limit
with 4 to spare. **No sleeps, no pacing, no distinct-form-id workaround** — the run is
deterministic. A comment in the header records the 10-POST ceiling for anyone adding cases.
Second-order: the per-owner monthly cap (`checkLimit`, FREE = 25) is also safe because the
victim is a fresh run-scoped user AND `afterAll` deletes the rows — a leak would eventually
429 a future run's first POST, which is why cleanup matters beyond tidiness.

### Did it actually run? YES — 6/6 passed

`npx playwright test --config=<temp> ...` against a real `npm run dev` (E2E_PORT=3021) and the
real dev DB: **6 passed (44.0s)**. Server logs confirm the intended branches were hit
(`publishState: 'draft'` / `'unpublishing'` / null → "unknown/non-serving page"). Not an
unrun test.

- `npx tsc --noEmit` — clean. **Note:** tsc does **not** cover `e2e/` (not in the tsconfig
  include), so it is not a real gate for this file; the actual Playwright run is.
- Leak check after the run, direct Prisma count:
  `{ users: 0, pages: 0, projects: 0, submissions: 0, forgedRows: 0 }` — cleanup verified.

### Deviations

- **None within Files-touched.** `e2e/forms-forgery.spec.ts` is the only file created or modified.

### Open risks / noticed but NOT fixed

1. **BLOCKER FOR THE ORCHESTRATOR — the spec currently runs in NO project.**
   `playwright.config.ts` `testMatch` is an explicit **allowlist** (its own comment warns:
   "an unregistered spec silently matches no project and gives false confidence: the suite goes
   green having never run it"). `npx playwright test forms-forgery --list` → **"Total: 0 tests
   in 0 files"**. `playwright.config.ts` is **not in this phase's Files-touched list**, so per
   the scope rule I did not edit it. It needs `/forms-forgery\.spec\.ts/` added — most likely to
   a **no-auth** project, since the route is public and the spec needs no Clerk session (the
   `public` project's testMatch, or a new one). Until that lands, `npm run test:e2e --
   forms-forgery` runs nothing and the plan's Phase 2 verification line cannot be satisfied via
   the repo config. I proved the spec passes with a temporary root config
   (`pw.forgery.tmp.config.ts`), which has been **deleted** — `git status` shows only
   `?? e2e/forms-forgery.spec.ts` from this phase.
2. Storage-state caveat for whoever registers it: if it is added to the **`authed`** project,
   the Clerk session changes the rate-limit key from `ip:` to `user:` (still 10/60s, still fine)
   — but `public`/no-auth is the more honest match for a public endpoint.
3. The spec cannot distinguish "derivation is correct" from "the route happens to ignore the
   body because of an unrelated bug" — it is a contract pin, not a mutation test. The route unit
   test carries the finer-grained pins.

---

## Phase 2 — config registration

Follow-up to the Phase-2 blocker above (open risk 1). The orchestrator authorized adding
`playwright.config.ts` to Phase 2's Files touched to fix exactly this.

**Files changed**
- `playwright.config.ts` (modified — one line)

### The change

Registered `/forms-forgery\.spec\.ts/` in the **`public`** project's `testMatch` array, alongside
`generation`/`render`/`parity`/`ui-isolation`. Existing single-line style/formatting kept:

```ts
testMatch: [/generation\.spec\.ts/, /render\.spec\.ts/, /parity\.spec\.ts/, /ui-isolation\.spec\.ts/, /forms-forgery\.spec\.ts/],
```

`public` (not `authed`) is correct: the spec is API-level and needs no Clerk session
(`/api/forms/submit` is public via the middleware `isPublicRoute` list), so `authed`'s `setup`
dependency + `storageState` would be dead weight. This also keeps the rate-limit key as `ip:`,
matching the 6-POST/10-per-60s headroom analysis recorded above.

`e2e/forms-forgery.spec.ts` was **not** modified — it is reviewed and passing.

### Before / after — `npx playwright test forms-forgery --list`

**Before:** `Error: No tests found.` → `Total: 0 tests in 0 files`

**After:** `Total: 6 tests in 1 file`, all under `[public]`:

```
  [public] › forms-forgery.spec.ts:100:5 › forged body userId is IGNORED — the row is attributed to the page owner
  [public] › forms-forgery.spec.ts:128:5 › omitted userId still resolves to the page owner (derivation, not fallback)
  [public] › forms-forgery.spec.ts:148:5 › unknown publishedPageId → 404 unknown_page
  [public] › forms-forgery.spec.ts:166:5 › missing publishedPageId → 400 missing_page_id
  [public] › forms-forgery.spec.ts:181:5 › unpublished page (draft) → 404 unknown_page, no lead captured
  [public] › forms-forgery.spec.ts:211:5 › stuck teardown (unpublishing) → 404 unknown_page
  Total: 6 tests in 1 file
```

### Real run — 6/6 PASSED

`E2E_PORT=3411 npm run test:e2e -- forms-forgery`, against a real `npm run dev` + the real dev DB
(dedicated port per the config's own warning that `reuseExistingServer` can silently test a
foreign worktree's code):

```
Running 6 tests using 1 worker
  ✓  1 [public] › e2e\forms-forgery.spec.ts:100:5 › forged body userId is IGNORED … (7.3s)
  ✓  2 [public] › e2e\forms-forgery.spec.ts:128:5 › omitted userId still resolves to the page owner …
  ✓  3 [public] › e2e\forms-forgery.spec.ts:148:5 › unknown publishedPageId → 404 unknown_page
  ✓  4 [public] › e2e\forms-forgery.spec.ts:166:5 › missing publishedPageId → 400 missing_page_id
  ✓  5 [public] › e2e\forms-forgery.spec.ts:181:5 › unpublished page (draft) → 404 unknown_page …
  ✓  6 [public] › e2e\forms-forgery.spec.ts:211:5 › stuck teardown (unpublishing) → 404 unknown_page
  6 passed (37.5s)
```

Server logs again confirm the intended branches were hit (`publishState: 'draft'` /
`'unpublishing'` / null → "unknown/non-serving page"). Observed, not assumed.

### No collateral damage to other projects

`npx playwright test --list` → **89 tests in 17 files** (was 83 in 16; delta = exactly the 6 new).
All pre-existing specs still resolve, unchanged counts: `generation` 5, `parity` 7, `render` 3,
`ui-isolation` 2, `auth.setup` 1, `publish` 3, `edit-persistence` 1, `editor-dirty-guard` 4,
`dashboard-shell` 9, `dashboard-workspace` 5, `dashboard-redirects` 13, `dashboard-lifecycle` 13,
`dashboard-rollups-inbox` 3, `media` 6, `media-picker` 2, `work-onboarding` 6.

### Deviations

- **None.** Single line, single file, exactly as scoped.

### Open risks

- Phase-2 open risk 1 above is now **RESOLVED** — the security spec genuinely executes in
  `npm run test:e2e`. Open risks 2 and 3 stand as written (2 is now moot: `public` was chosen).
- The allowlist trap that caused this remains structural: any future e2e spec still needs manual
  registration here or it silently runs nowhere. Out of scope to fix; the config's existing
  comment already warns about it.

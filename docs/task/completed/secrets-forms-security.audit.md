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

---

# Phase 3 — `form.v2.js` + markup: stop sending and stop leaking the owner id

Founder sign-off received at the human gate: ship the semantic change as `form.v2.js`,
freeze `form.v1.js` from a vendored source. No in-place v1 edit.

## Files changed

Created:
- `scripts/legacy/form.v1.src.js` — vendored FROZEN copy of the pre-edit `formHandler.js`.
- `public/assets/form.v2.js` — new built artifact (live handler).

Modified:
- `src/lib/staticExport/formHandler.js` — v2 semantics (both handlers).
- `scripts/buildAssets.js` — mapping + contract comment.
- `public/assets/form.v1.js` — rebuilt from the frozen source; **byte-identical to the committed artifact** (see grep results).
- `src/lib/staticExport/htmlGenerator.ts` — blob injector → `form.v2.js`.
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` — SSR-fallback `<Script>` → `form.v2.js`.
- 9 `data-owner-id` emitters: `src/components/published/FormMarkupPublished.tsx`,
  `src/components/published/InlineFormMarkupPublished.tsx`,
  `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.published.tsx`,
  `src/modules/skeletons/work/blocks/Contact/WorkContact.published.tsx`,
  `src/modules/templates/atelier/blocks/Contact/AtelierContact.published.tsx`,
  `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.published.tsx`,
  `src/modules/templates/lumen/blocks/Contact/LumenContactForm.published.tsx`,
  `src/modules/templates/techpremium/blocks/Contact/TechPremiumContact.published.tsx`,
  `src/modules/templates/shared/blog/BlogPostBodyBlock.tsx`.
- 5 first-party senders (dropped body `userId`): `src/components/published/FormIsland.tsx`,
  `src/components/forms/FormRenderer.tsx`, `src/components/forms/InlineFormInput.tsx`,
  `src/modules/templates/techpremium/blocks/Footer/TechPremiumNewsletterCapture.tsx`,
  `src/modules/templates/meridian/blocks/Footer/MeridianNewsletterCapture.tsx`.
- Tests: `src/lib/staticExport/assetBase.guard.test.ts`,
  `src/modules/goals/__tests__/acceptance.scale05.test.ts`,
  `src/modules/generatedLanding/sharedBlocks/__tests__/leadForm.parity.test.tsx`.
- Docs: `CLAUDE.md`, `src/components/forms/README.md`, `src/lib/staticExport/README.md`,
  `scripts/README.md`.

## What changed, per file

**Ordering followed exactly as specified:** vendor frozen copy → edit live source → update
mapping → `node scripts/buildAssets.js` → verify.

- `scripts/legacy/form.v1.src.js`: byte-exact body copy of the pre-edit `formHandler.js`,
  verified mechanically (`diff <(tail -n +23 legacy) <(tail -n +2 orig)` → identical), with a
  FROZEN banner mirroring `a.v1.src.js`. The banner states *why* v1 must keep reading/sending
  the owner id: old blobs' markup still carries `data-owner-id` and the v1 script REQUIRES it.
- `formHandler.js` (now → `form.v2.js`): both handlers drop the `dataset.ownerId` read, drop
  `ownerId` from the required-field check (now `formId` + `pageId` only — the exact check that
  would have silently killed every new form under an old cached script), and drop `userId` from
  both fetch bodies. Header comment records the v2 identity + "next semantic change = v3".
- `buildAssets.js`: `form.v1.js ← scripts/legacy/form.v1.src.js` (FROZEN, `dir: legacyDir`),
  `form.v2.js ← src/lib/staticExport/formHandler.js` (live). Contract mapping block updated.
- Both injectors repointed **in the same commit** (no SSR skew; app deploy is atomic).
- Emitters: single attribute-line deletion each. `pageOwnerId` props/interfaces/threading LEFT
  IN PLACE per Locked decision 6 (deferred cleanup, deliberately not widened here).
- Tests: the two attribute assertions were flipped to `not.toContain('data-owner-id')` — they
  now pin the *absence* of the leak rather than merely being neutered.

## Artifact split check (real output)

```
$ grep -o 'dataset\.ownerId\|userId' public/assets/form.v1.js | sort | uniq -c
      2 dataset.ownerId
      2 userId                # FROZEN — both handlers intact

$ grep -c 'ownerId\|userId' public/assets/form.v2.js
0                             # live — NEITHER present

$ git diff --exit-code -- public/assets/form.v1.js
(no diff)  → form.v1.js is BYTE-IDENTICAL to the committed artifact
```
The byte-identity of `form.v1.js` is the strongest available evidence the freeze is exact: the
rebuild from the vendored source reproduced the previously committed bytes. Re-verified AFTER
the full `npm run build` (which re-runs `buildAssets`) — both still correct.

## Dual-renderer parity

- `grep -rn 'data-owner-id' src/ e2e/` → **zero live emitters** remain; all remaining hits are
  comments or the new negative assertions.
- Per-file diffstat for the 9 emitters: 8 files = exactly `1 deletion`; `LeadForm.published.tsx`
  = attribute deletion + its stale contract comment (which documented `data-owner-id→ownerId`).
  No other markup/CSS drifted, so no editor↔published divergence is possible.
- Confirmed `TechPremiumNewsletterCapture.tsx` / `MeridianNewsletterCapture.tsx` are imported ONLY
  by the `.published.tsx` footers. Their edit-side twins (`HairlineFooter.tsx`,
  `TechPremiumFooter.tsx`) have no fetch/submit path at all — newsletter there is editor config UI
  (`setupNewsletter`/`removeNewsletter`). So there is no twin to sync and no missed 6th sender.
- The attribute only ever existed on `.published.tsx` files (edit-side twins are interactive
  React and never used it), so removal cannot change the editor surface.

## Test / build results (all run in WORKDIR, all observed)

- `npx tsc --noEmit` → **exit 0, clean**.
- `npm run test:run` → **209 files passed | 1 skipped; 3557 tests passed | 18 skipped** (incl.
  all 3 flipped assertions, `leadForm.parity`, `acceptance.scale05`, `assetBase.guard`).
- `npm run build` → **exit 0** (buildPublishedCSS + buildAssets + next build).
- `E2E_PORT=3413 npx playwright test forms-forgery` → **6/6 passed** (dedicated port, so no
  `reuseExistingServer` bleed into a foreign worktree). Server contract untouched this phase.

## Deviations

1. `scripts/README.md`: the adjacent line claimed `analyticsGenerator.js → a.v1.js`, which was
   already **wrong** before this phase (F9b moved live analytics to `a.v2.js`). Since the file
   was on my Files-touched list and this sits in the same 3-line bullet I was editing, I
   corrected it to `a.v2.js` and documented both frozen legacy sources. Conservative, doc-only.
2. `src/components/forms/README.md`: the plan cited a "stale owner-id claim" at line 129; the
   `FormSubmissionRequest` snippet there in fact just omitted the fields. I documented the real
   contract instead (`publishedPageId` required, `userId` accepted-and-ignored, never trusted).
3. `CLAUDE.md`: the asset line also said `a.v1.js` for the beacon (same pre-existing F9b
   staleness); corrected to `a.v2.js` while stating the versioning rule, since a half-corrected
   line would be actively misleading to the next agent.

## Noticed but NOT fixed (out of Files-touched — orchestrator's call)

Stale `form.v1.js` prose references in files not on my list (all comments/names, no assertions,
none affect behavior):
- `src/hooks/editStore/lumenSeed.ts:255`, `src/hooks/editStore/pageActions.ts:259`
- `src/lib/blog/buildBlogPages.ts:50,51`, `src/lib/blog/__tests__/buildBlogPages.test.ts:4,50`
  (confirmed per plan step 5: **name/comment only, no `form.v1` assertion** — nothing to flip)
- `src/modules/audience/product/elementSchema.ts:690,1085`,
  `src/modules/audience/service/elementSchema.ts:548`
- `src/components/published/InlineFormMarkupPublished.tsx:6,11` (header comment still says
  "Pairs with form.v1.js" — file WAS on my list; left because the plan scoped this file to the
  attribute removal only. Flag for a follow-up doc pass if desired.)
- `src/modules/generatedLanding/sharedBlocks/LeadForm/leadFormFields.tsx:35`,
  `src/modules/skeletons/work/blocks/Contact/{leadFormMarkup.tsx:32,WorkContact.core.tsx:7,WorkContact.published.tsx:3,WorkContact.tsx:6}`,
  `src/modules/templates/atelier/blocks/Contact/{AtelierContact.core.tsx:5,AtelierContact.published.tsx:3,AtelierContact.tsx:6,contactFields.ts:4}`,
  `src/modules/templates/{lumen,techpremium,vestria}/blocks/Contact/*` (various),
  `src/modules/templates/shared/blog/BlogPostBodyBlock.tsx:16`,
  `src/modules/templates/vestria/registration.test.ts:111`,
  `src/modules/wizard/generation/finalize.ts:94`
- `src/app/api/forms/submit/route.ts:23,65` + `e2e/forms-forgery.spec.ts:14` reference the
  frozen `form.v1.js` **correctly** (they describe old-blob back-compat) — leave as-is.

## Open risks

- **Deploy ordering (carried from F9b):** `form.v2.js` must be live on the assets origin BEFORE
  any page referencing it is published/served, else new blobs 404 their form handler. The app
  deploy is atomic (htmlGenerator + `public/assets/` ship together); a page published from a
  *pre-deploy* instance is unaffected (it references v1, still shipped).
- `pageOwnerId` prop threading (~25 files) still exists and is now dead weight on the published
  path (nothing reads it). Deferred per Locked decision 6 / unresolved question 5.
- Manual QA still owed at phase 4: publish in dev → confirm HTML has no `data-owner-id`,
  references `form.v2.js`, and submits end-to-end; plus the old-blob (`form.v1.js` + attribute)
  back-compat submit.

## Working-tree note (not my edits)

`git status` also shows `docs/task/secrets-forms-security.plan.md` (the orchestrator's own
uncommitted phase-2 progress-log line) and
`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` (empty diff —
CRLF-only churn from the test run, no content change). Neither was touched by this phase.

---

## Phase 3 follow-up — doc/comment corrections (impl-review non-blocking items)

**Files changed**
- `src/components/published/InlineFormMarkupPublished.tsx`
- `docs/task/secrets-forms-security.audit.md` (this file)

Comments and prose ONLY. No code logic, markup, props, or assets changed.

### `src/components/published/InlineFormMarkupPublished.tsx`
Header comment said "Pairs with form.v1.js" (line ~6) and "Data attributes for form.v1.js
integration" (line ~11). Both now read `form.v2.js` — this file's markup no longer emits
`data-owner-id` and is consumed by v2. Added the same owner-derivation contract sentence used by
its sibling `LeadForm.published.tsx`, for consistent wording across the two contract comments.
Diff is confined to the header block comment (verified via `git diff -U2`; the `data-owner-id`
attribute deletion visible in that diff is pre-existing Phase 3 work, not this follow-up).

### `docs/task/secrets-forms-security.audit.md`
The Phase 3 verification bullet claimed `TechPremiumNewsletterCapture.tsx` /
`MeridianNewsletterCapture.tsx` were "shared by BOTH renderers". Imprecise and misleading.
Corrected to the verified reason: both are imported ONLY by the `.published.tsx` footers; their
edit-side twins (`HairlineFooter.tsx`, `TechPremiumFooter.tsx`) carry no fetch/submit path —
newsletter there is editor config UI (`setupNewsletter`/`removeNewsletter`). Operational
conclusion is unchanged (no twin to sync, no missed 6th sender); only the reason was wrong.

### Deviations
None.

### Test results
- `npx tsc --noEmit` → clean (exit 0).
- `npm run test:run` → 209 files passed / 1 skipped; **3557 passed / 18 skipped** — matches the
  expected baseline exactly.
- `git diff -- public/assets/` → **EMPTY**. `form.v1.js` byte-identity (the phase's back-compat
  proof) is undisturbed.
- Scoped diff → only the 2 files above were modified by this follow-up. (Whole-branch
  `git diff --stat` still lists all of Phases 1-3 because those remain uncommitted pending the
  orchestrator's commit.)

### Open risks
None. Comment/prose-only; no runtime surface touched.

---

## Post-merge — project query narrowed

**Files changed**
- `src/app/api/forms/submit/route.ts` (modified)
- `docs/task/secrets-forms-security.audit.md` (appended — this entry)

### `src/app/api/forms/submit/route.ts`
Added `select: { content: true }` to the `prisma.project.findUnique` form-config
lookup (~line 165). Only `project.content` is ever read (`content.forms[formId]`);
the query previously fetched every column.

**Why:** an independent uncommitted change in the main checkout made exactly this
optimization on the OLD `findMany` query that this branch replaced (narrowing
`include: { token: true }` → `select: { content: true }` — the joined token row and
the other JSON columns themeValues/computedDesign/brief/aiBaseline are pure wire
cost on every submission). This branch deleted that query, so the intent is carried
forward onto its replacement.

No logic, `where` clause, null-`projectId` guard, or error handling changed.
Form-config resolution reads `content.forms[formId]` identically.

### Deviations
None in the code. **BLOCKED before completion**, see below.

### Test results
- `npx tsc --noEmit` → clean.
- `npm run test:run` → **1 failed | 3593 passed | 18 skipped**.
  Failure: `src/app/api/forms/submit/route.test.ts` >
  "scopes the form-config lookup to the page's OWN project" — asserts
  `expect(db.project.findUnique).toHaveBeenCalledWith({ where: { id: 'proj_1' } })`,
  an exact-match assertion that the added `select` key breaks.
  This is a stale assertion, not a behavior regression.
- `git diff --stat` → only `src/app/api/forms/submit/route.ts` (+ this audit).

### Open risks
`route.test.ts` is NOT on this phase's Files-touched list (`route.ts` ONLY), so it was
left unedited and the suite is RED. Orchestrator must decide: authorize the one-line
test update (`{ where: { id: 'proj_1' }, select: { content: true } }`) or revert this
change. Test intent (lookup scoped to the page's own project) is unaffected either way.

**RESOLVED (orchestrator-authorized follow-up):** `src/app/api/forms/submit/route.test.ts` — the stale assertion at ~line 189 was updated to match the real query (`{ where: { id: 'proj_1' }, select: { content: true } }`); intent preserved (the `where` clause still pins the lookup to `page.projectId` — the security property; a comment now marks `select` as incidental). Suite fully green: **3594 passed | 18 skipped | 0 failed**; `npx tsc --noEmit` clean.

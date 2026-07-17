# secrets-forms-security — implementation plan (M8 only)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\secrets-forms-security`
- **Branch:** `feature/secrets-forms-security`
- **Tier:** `full` (ESCALATED from `standard` per spec AMENDMENT — `formHandler.js` is on the publish path) → per-phase impl-review.
- **Scope ruling:** M8 ONLY. All M6 work (encryption, `UserIntegration`, ConvertKit URL-param methods, schema comment) is OUT — do not touch. Prod greenfield; no data migration; no schema change; no Prisma migration.
- **Revision note:** plan-review round 1 = revise; B1–B4 + 2 non-blocking items folded in below (test-file pin, canonical `isServingPublishState`, edit-side senders, `form.v2.js` bump per the shipped-asset versioning contract, project-scoped form lookup, stale-comment sweep).

## Overview

`POST /api/forms/submit` currently trusts a client-supplied body `userId` that is printed into public page HTML (`data-owner-id` = the owner's Clerk id). An attacker can forge any owner: fake rows under their account, their ConvertKit integration fired, their monthly submission cap burned. Fix: the server derives the owner from `publishedPageId` via `PublishedPage.userId`, gates on the canonical serving predicate (`isServingPublishState`), ignores body `userId` entirely, scopes form-config lookup to the page's own project, and the public HTML stops emitting the owner's Clerk id — shipped as `form.v2.js` per the asset-versioning contract so no cache state is ever broken. No schema change; every already-published (immutable) blob keeps its frozen `form.v1.js` and keeps working.

## Progress log

- phase 1 server-side owner derivation: **done** (commit 142cbba9, review loops 1, verdict `ship`) — tsc clean, 3557 tests pass. Founder signed off the gate: canonical `isServingPublishState` matrix + project-scoped lookup, both as planned. Null-`projectId` guard added (reviewer catch; `PublishedPage.projectId` is `String?`) → skips config lookup, no 500.
- phase 2 forged-submission e2e spec: pending
- phase 3 form.v2.js + markup — stop sending/leaking owner id: pending
- phase 4 integration verification + no-regression smoke: pending

## Locked design decisions (state once, phases implement)

1. **Body `userId` is ACCEPTED-AND-IGNORED, never rejected — indefinitely.** Old published blobs are immutable and reference `form.v1.js`, which (frozen, see decision 7) sends `userId` forever; the in-app fetchers keep the prop threading too. The field stays in `FormSubmissionSchema` (documented as ignored); the route never reads it. Old published HTML that still carries `data-owner-id` keeps working because derivation only needs `data-page-id`, which every existing emitter already sets.
2. **`publishedPageId` becomes the required identity input; serving-state gate uses the CANONICAL helper.** Route-level checks (not zod `.min(1)` — keep stable error codes, not a zod issues array):
   - missing/empty `publishedPageId` → **400** `{ error: 'missing_page_id', message: 'Form configuration error. Please contact support.' }`
   - `prisma.publishedPage.findUnique({ where: { id: publishedPageId }, select: { userId: true, projectId: true, publishState: true } })` returns null → **404** `{ error: 'unknown_page', message: '…contact support.' }`
   - `!isServingPublishState(page.publishState)` → **404 `unknown_page`** (same body; don't distinguish existence). Import from `src/lib/publishState.ts` — the canonical predicate, plain module (no `'use client'` boundary), already imported by route handlers/server components (`src/app/p/[slug]/page.tsx:96`, `src/lib/blog/ssr.tsx:43`, `src/lib/seo/resolvePublishedHost.ts:44`). **Re-point, don't reinvent.** This rejects exactly `'draft'` AND `'unpublishing'` (`NON_SERVING_STATES`, publishState.ts:16 — `'unpublishing'` is written by `teardown.ts:137` and can stick permanently on a crashed teardown; its KV routes + blob are GONE and `/p/[slug]` 404s it, so rejecting its leads is honest). It also fail-opens `null`/legacy rows for free.
   - serving states (`published | publishing | failed | null/legacy`) → ACCEPT. Rationale mirrors the helper's doc: `publishing` is transient during republish and `failed` leaves the previous version live — rejecting either drops real leads on live pages.
3. **Derived owner (`page.userId`, Clerk id) replaces `userId` at every trust point:** monthly-cap count + `checkLimit` (route lines 98–101), `FormSubmission.create` (line 198), and all log lines (104, 212, 281). **Form-config lookup is scoped to `page.projectId`:** replace the `findMany({ where: { userId } })` all-projects scan (lines 119–133) with `prisma.project.findUnique({ where: { id: page.projectId } })` and read `content.forms[formId]` from that one project. This USES the selected `projectId` (no dead select) and closes the residual confused-deputy: a forged submit against victim page X with a `formId` from victim project Y no longer fires Y's integration key. Behavior change accepted: a formId living in a DIFFERENT project of the same owner no longer resolves config (submission still stored, `formName: 'Unknown Form'`, no integrations) — forms are created in the project whose page publishes them, so cross-project resolution was accidental. The `Project.content.forms` reading mechanism itself is UNCHANGED — M6 is out.
4. **Blog subscribe: NO carve-out needed.** `BlogPostBodyBlock.tsx:80` already emits `data-page-id={props.publishedPageId}` (the parent site's `PublishedPage.id`, same id the `blogSubscriber` upsert at route lines 219–232 keys on), so blog posts flow through the same derivation, and blog HTML gets its form script through the same `generateStaticHTML` path (→ `form.v2.js` after phase 3, automatically). Known edge (accept + document in code comment): a blog post still cached/live while the parent page is non-serving will have subscribes rejected — correct per spec ("unpublished → rejected").
5. **Editor/preview submits:** pre-publish, `publishedPageId` is undefined → 400 `missing_page_id`. Matches pre-change behavior in practice (pre-publish `pageOwnerId` was also undefined → old 400 "User ID required"); no regression; watchpoint in phase 4 QA.
6. **`data-owner-id` stops being emitted from all 9 emitters, and ALL first-party senders stop sending `userId`** — the published-surface fetchers (`FormIsland`, the 2 newsletter captures) AND the edit-side senders `src/components/forms/FormRenderer.tsx:117` + `src/components/forms/InlineFormInput.tsx:154` (both fed `userId={pageOwnerId}` from `LandingPageRenderer.tsx:546/584/620`; not a security hole post-phase-1, but included so this decision is true without asterisks). The `pageOwnerId` prop PLUMBING (htmlGenerator options → renderers → block props, `storeTypes.ts:340`, `renderPublishedExport.ts`) is LEFT IN PLACE this run — ripping ~25 files of threading out of a security patch widens blast radius for zero attacker-visible gain once nothing emits it. Deferred cleanup, in unresolved questions.
7. **`formHandler.js`'s semantic change ships as `form.v2.js`; `form.v1.js` is FROZEN.** The versioning contract (`scripts/buildAssets.js:11–28`, established by `docs/task/completed/f9b-beacon-versioning.audit.md`) says: a shipped asset filename NEVER changes semantics; any semantic change → new filename built from live source, old filename rebuilt from a frozen copy under `scripts/legacy/`. F9b left form at v1 precisely BECAUSE its semantics were then unchanged — this run changes them, so the same rule now forces a bump. **Cache-exposure analysis (why not edit v1 in place):** the dangerous mixed state is *old cached `form.v1.js` + new markup without `data-owner-id`* → old script's required-field check (`formHandler.js:165`, `:253`) fails → "Form configuration error" → every form on every newly-published page silently dead for that client. Exposure via caching is probably small (`vercel.json` sets `Cache-Control` only for `/api/forms/:path*`; `next.config.js` `headers()` sets none for `/assets/*`, so `public/` files get Vercel's default short/revalidate caching) — but the contract forbids relying on that, and the bump designs the state out entirely: new markup references `form.v2.js`, a filename never previously served, so no stale cache entry for it can exist; old blobs reference `form.v1.js`, rebuilt byte-equivalent from the frozen source, and their HTML still carries `data-owner-id`. Script version and markup travel together inside each immutable blob → no sequencing dance, no broken combination. Mirror the `a.v1`/`a.v2` mechanics exactly.

---

## Phase 1 — server-side owner derivation  **[HUMAN GATE — ownership/authz semantics change on a public endpoint; founder must sign off the rejection matrix + project-scoped form lookup in "Locked design decisions" before implementation]**

The core fix. Ship first so the server is correct for BOTH old payloads (with `userId`) and new ones (without).

**Files touched**
- `src/app/api/forms/submit/route.ts`
- `src/app/api/forms/submit/route.test.ts` — the existing suite CANNOT stay green without these edits (its Prisma mock lacks `publishedPage`; two assertions pin the claimed id); see step 5
- `src/lib/publishState.ts` — **import-only, NO edit** (listed for review scoping: route.ts gains `import { isServingPublishState }`)
- `src/lib/validation.ts` — comment-only on `FormSubmissionSchema.userId`: "ignored — owner is server-derived; kept for old-client back-compat"; keep both fields optional
- `src/app/dashboard/[token]/leads/page.tsx` — comment-only fix, lines 36–40: the "submit takes both ids from the client body / Do NOT restore it" ruling is false after this phase; rewrite to describe server-side derivation

**Steps**
1. In `formSubmitHandler`, after zod parse: implement the `publishedPageId` gate + `publishedPage.findUnique` + `isServingPublishState` check per Locked decision 2. Delete the `if (!userId)` 400 branch (lines 60–69) and the trailing "no userId → 500" fallback (lines 297–308); the derivation gate replaces both (the route no longer has a no-owner path — the big `if (userId)` wrapper becomes unconditional).
2. Introduce `const ownerUserId = page.userId` and swap it in at every trust point per Locked decision 3. Replace the `project.findMany` scan with `project.findUnique({ where: { id: page.projectId } })` per decision 3. Never read `validationResult.data.userId` (destructure without it; one-line comment saying why the field still exists in the schema).
3. Keep `FormSubmissionRequest` interface (lines 17–22) in sync — mark `userId` deprecated/ignored.
4. Keep everything downstream byte-identical in behavior for a legitimate submission: ConvertKit `addSubscriber` path, blog subscriber upsert, `sendLeadNotification` + notify-outcome flags, success payload shape (`submissionId`, `integrations`), rate-limit wrapper.
5. `route.test.ts` (this is the phase's regression pin, not incidental repair):
   - Extend the Prisma mock (lines 12–18): add `publishedPage: { findUnique: vi.fn() }`; change `project: { findMany }` → `project: { findUnique: vi.fn() }` (route no longer calls findMany).
   - `beforeEach` defaults: `db.publishedPage.findUnique.mockResolvedValue({ userId: 'owner_1', projectId: 'proj_1', publishState: 'published' })`; `db.project.findUnique.mockResolvedValue(null)` (no formConfig; keeps paths minimal, as today).
   - `BODY` KEEPS `userId: 'user_1'` — the request still sends a forged id; flip line 123 to `expect(where.userId).toBe('owner_1')` and line 128 to `expect(limit).toHaveBeenCalledWith('owner_1', 'formSubmissions', 10)`. **That asymmetry (body says user_1, DB/limit see owner_1) IS the forged-id unit case.**
   - Add a small new describe block pinning: (a) `formSubmission.create` called with `userId: 'owner_1'`; (b) `publishedPage.findUnique` null → 404 `unknown_page`; (c) missing `publishedPageId` → 400 `missing_page_id`; (d) `publishState: 'draft'` and `'unpublishing'` → 404 `unknown_page`; (e) `publishState: null` (legacy) → 200 (fail-open via helper).

**Verification**
- `npx tsc --noEmit` green; `npm run test:run` green (route.test.ts suites incl. new pins).
- Manual (dev server): (a) POST with valid `publishedPageId` + forged `userId` → 200, DB row `userId` = page owner; (b) unknown `publishedPageId` → 404 `unknown_page`; (c) omitted `publishedPageId` → 400 `missing_page_id`; (d) omitted `userId` + valid page → 200.

## Phase 2 — forged-submission e2e spec (deterministic QA rule — spec acceptance criterion)

**Files touched**
- `e2e/forms-forgery.spec.ts` (new)

**Steps**
1. New Playwright spec, API-level (`request` fixture; no browser needed). Seed data directly with `PrismaClient` — copy the seeding/cleanup helper style from `e2e/dashboard-lifecycle.spec.ts` (already imports `@prisma/client`). Seed a victim: `User`/`Token`/`Project` (satisfy FKs; `content.forms` may stay empty — form config optional, submission still stores) + `PublishedPage` row with `publishState: 'published'`, unique slug, victim Clerk-style `userId`.
2. Cases:
   - **Forged owner:** POST `{ formId, data, publishedPageId: victimPage.id, userId: 'attacker_forged_id' }` → expect 200; query `formSubmission` via Prisma → row `userId === victimOwnerId`, NOT the forged id. (THE required regression case.)
   - **Omitted userId:** same POST without `userId` → 200, row attributed to victim owner.
   - **Unknown page:** POST with random cuid `publishedPageId` → 404, body `error: 'unknown_page'`.
   - **Missing page id:** POST without `publishedPageId` → 400, body `error: 'missing_page_id'`.
   - **Unpublished page:** flip seeded page to `publishState: 'draft'` → POST → 404 `unknown_page`.
   - **Stuck teardown:** flip seeded page to `publishState: 'unpublishing'` → POST → 404 `unknown_page` (pins the 5th state; matrix now covers draft/unpublishing/published + unknown/missing).
3. Cleanup all seeded rows + created `FormSubmission`s in `finally`/`afterAll`.
4. Watchpoint: `withFormRateLimit` is per-IP — if the 6 POSTs trip it, space them or check the limiter's window config; keep the spec deterministic (no sleeps unless the limiter forces it, then document why).

**Verification**
- `npm run test:e2e -- forms-forgery` green locally (against dev server per `e2e/README.md` conventions); `npx tsc --noEmit` green.

## Phase 3 — `form.v2.js` + markup: stop sending and stop leaking the owner id  **[HUMAN GATE — publish-path asset versioning + a new-filename rollout; founder sign-off on the v2 bump (Locked decision 7) before implementation]**

Server (phase 1) already ignores `userId`, so this phase is pure leak-closure and safe only AFTER it — order matters, never before. Ships the semantic change under a NEW filename per the versioning contract; `form.v1.js` freezes.

**Files touched**
- `scripts/legacy/form.v1.src.js` — NEW: vendored byte-exact copy of the CURRENT `src/lib/staticExport/formHandler.js` (pre-edit), with a FROZEN banner (mirror `scripts/legacy/a.v1.src.js`)
- `src/lib/staticExport/formHandler.js` — live source becomes v2 semantics, both handlers: drop `ownerId` reads (lines 162, 250), remove `ownerId` from the required-field checks (165, 253 — require only `formId` + `pageId`), drop `userId` from both fetch bodies (192, 280)
- `scripts/buildAssets.js` — mapping change: `form.v1.js ← scripts/legacy/form.v1.src.js` (FROZEN), `form.v2.js ← src/lib/staticExport/formHandler.js` (live); update the contract-comment mapping block
- `public/assets/form.v1.js` + `public/assets/form.v2.js` — regenerated + committed (run `node scripts/buildAssets.js`; v1 must come out byte-equivalent in semantics to today's artifact — verify it still contains `ownerId`)
- `src/lib/staticExport/htmlGenerator.ts` — line 414: `form.v1.js` → `form.v2.js` (new publishes only)
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` — line 258 (SSR-fallback `<Script>`): `form.v1.js` → `form.v2.js`
- `src/lib/staticExport/assetBase.guard.test.ts` — line 100 literal → `form.v2.js` (+ comment at ~line 17)
- `src/components/published/FormMarkupPublished.tsx` — remove `data-owner-id` (line 51; keep prop in interface)
- `src/components/published/InlineFormMarkupPublished.tsx` — remove `data-owner-id` (line 71)
- `src/components/published/FormIsland.tsx` — drop `userId: pageOwnerId` from fetch body (line 48; keep prop)
- `src/components/forms/FormRenderer.tsx` — drop `userId` from fetch body (line 117; keep prop) — edit-side sender, per Locked decision 6
- `src/components/forms/InlineFormInput.tsx` — drop `userId` from fetch body (line 154; keep prop) — edit-side sender
- `src/modules/generatedLanding/sharedBlocks/LeadForm/LeadForm.published.tsx` — remove `data-owner-id` (line 43) + fix contract comment at line 6
- `src/modules/templates/atelier/blocks/Contact/AtelierContact.published.tsx` (line 34)
- `src/modules/templates/vestria/blocks/Contact/VestriaLeadForm.published.tsx` (line 34)
- `src/modules/skeletons/work/blocks/Contact/WorkContact.published.tsx` (line 32)
- `src/modules/templates/techpremium/blocks/Contact/TechPremiumContact.published.tsx` (line 88)
- `src/modules/templates/lumen/blocks/Contact/LumenContactForm.published.tsx` (line 90)
- `src/modules/templates/shared/blog/BlogPostBodyBlock.tsx` (line 81)
- `src/modules/templates/techpremium/blocks/Footer/TechPremiumNewsletterCapture.tsx` — drop `userId` from fetch body (line 53)
- `src/modules/templates/meridian/blocks/Footer/MeridianNewsletterCapture.tsx` — drop `userId` from fetch body (line 53)
- `src/modules/goals/__tests__/acceptance.scale05.test.ts` — flip line 254 assertion to `not.toContain('data-owner-id')`
- `src/modules/generatedLanding/sharedBlocks/__tests__/leadForm.parity.test.tsx` — flip line 100 assertion likewise
- Docs (kept out of phase 1 so no file appears in two phases): `CLAUDE.md` (line ~103 `form.v1.js` → `form.v2.js` for new publishes; line ~120 forms bullet — submit no longer trusts client-body owner), `src/components/forms/README.md` (line 8 asset name; line 129 stale owner-id claim), `src/lib/staticExport/README.md` (lines 39, 62, 105 — v2 mapping + frozen v1), `scripts/README.md` (line 21)

**Steps**
1. Vendor the frozen source FIRST (`scripts/legacy/form.v1.src.js` = today's `formHandler.js`, untouched), THEN edit the live `formHandler.js`, THEN update `buildAssets.js` mapping, THEN `node scripts/buildAssets.js` and commit all four artifacts/sources. Verify the split like F9b did: built `form.v1.js` still contains `ownerId`/`userId`; built `form.v2.js` contains neither.
2. Repoint BOTH injectors (`htmlGenerator.ts:414` blob path + `LandingPagePublishedRenderer.tsx:258` SSR-fallback path) at `form.v2.js` in the same commit — app deploy is atomic, so no skew between them.
3. Remove the attribute from the 9 emitters; drop `userId` from the 5 first-party fetch bodies (FormIsland, 2 newsletter captures, FormRenderer, InlineFormInput). Do NOT remove `pageOwnerId` props/threading (Locked decision 6).
4. **Dual-renderer parity check per block pair:** grep confirms only `.published.tsx` files emit `data-owner-id` (edit-side twins are interactive React and never used the attribute), so removal cannot create editor↔published visual divergence — but eyeball each touched `.published.tsx` against its `.tsx` twin and confirm no other markup drifts in the same edit. Note: `TechPremiumNewsletterCapture.tsx` / `MeridianNewsletterCapture.tsx` are shared by BOTH renderers (imported from the `.published` footers), so one edit covers both sides.
5. Update the three test files (two attribute flips + the `assetBase.guard` literal). Also grep tests for any other `form\.v1` literal assertions before closing (`buildBlogPages.test.ts` mentions it in a name/comment only — no assertion; confirm).
6. Docs sweep per the Files-touched list.

**Verification**
- `npx tsc --noEmit`, `npm run test:run` green (incl. flipped assertions + `leadForm.parity`, `acceptance.scale05`, `assetBase.guard`, `htmlGenerator`, `realProofPublishedOutput` suites).
- `npm run build` green (exercises `buildPublishedCSS` + `buildAssets` + next build).
- Artifact split check: grep built `public/assets/form.v1.js` → `ownerId` PRESENT (frozen); grep `form.v2.js` → `ownerId`/`userId` ABSENT.
- Manual: publish a page in dev, view published HTML source → NO `data-owner-id` anywhere, script tag references `form.v2.js`, form submits successfully end-to-end.
- Re-run `e2e/forms-forgery.spec.ts` (unchanged, still green — server contract untouched by this phase).

## Phase 4 — integration verification + no-regression smoke (no code; QA gate before merge)

**Files touched**
- (none — verification phase; any fixes discovered go back through the owning phase's review)

**Steps / checks**
1. Full local gate: `npx tsc --noEmit` + `npm run test:run` + `npm run test:e2e` + `npm run build` all green (no-CI rule: green locally before the founder pushes).
2. **ConvertKit no-regression** (spec criterion 5): in dev, attach a ConvertKit integration to a form (key in `Project.content` as today — the form must live in the published page's OWN project per Locked decision 3), publish, submit → subscriber lands in ConvertKit; `integrations` array reports success. (Needs a test ConvertKit key — founder-assisted.)
3. **Lead-notification email**: with `RESEND_API_KEY` + `LEAD_NOTIFICATION_EMAIL` set, a legitimate submission fires the email and `notifiedAt` is written.
4. **Blog subscribe**: dev blog post → subscribe form → 200, `BlogSubscriber` row upserted (proves derivation path for `BLOG_SUBSCRIBE_FORM_ID`).
5. **Old-blob simulation**: take a page published BEFORE phase 3 (HTML contains `data-owner-id` + references `form.v1.js`), submit against the final server → 200, attributed to page owner (proves frozen-v1 + immutable-blob back-compat).
6. Editor/preview watchpoint: attempt a form submit from preview of an unpublished project → clean 400 error surfaced by the form UI (no uncaught failure).

**Verification** = the checklist above, recorded in the phase audit. Merge to main remains the standing human gate (plain merge; founder pushes; deploy-watcher polls).

---

## Unresolved questions

1. Rejection matrix OK? Esp.: `failed`/`publishing`/legacy-null ACCEPT, `unpublishing` REJECT (canonical helper) — agree?
2. Form-config lookup narrowed to the page's OWN project (cross-project formId of same owner → no integrations fire) — any legit cross-project use you know of?
3. `form.v2.js` bump (vs in-place v1 edit) per versioning contract — confirm.
4. Unpublished parent page kills blog-post subscribes (post blob may still be CDN-cached) — acceptable?
5. `pageOwnerId` prop plumbing (~25 files) left in place — defer removal to a cleanup spec, or want it in this run?
6. ConvertKit smoke needs a live test key — have one for dev?
7. 404 body uses generic "contact support" message — wording fine?

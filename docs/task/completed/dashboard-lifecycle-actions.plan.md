# dashboard-lifecycle-actions — implementation plan (rev 3, post plan-review ×3)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\dashboard-lifecycle-actions`
- **Branch:** `feature/dashboard-lifecycle-actions` (base `main` @ `b3bf9345`)
- **Tier:** full
- **Spec:** `docs/task/dashboard-lifecycle-actions.spec.md` · **Scout:** `docs/task/dashboard-lifecycle-actions.scout.md`
- Baseline note: fresh-worktree `tsc` shows one false error (`src/app/page.tsx` founder.jpg / missing `next-env.d.ts`); run `npm run build` once to clear. Do NOT "fix" it.

## Overview

Dashboard S2: wire the S1 ••• card menu to live lifecycle actions — **Unpublish** (the beta
blocker: today a mispublish is permanent), **Delete** (with cascade take-down), **Rename**,
**Duplicate** — all behind `assertProjectOwner` and a custom-domain guard. Core net-new pieces:
(a) a **publish-state-aware SSR serving predicate** (today `/p/[slug]` serves any row that
exists, so deleting KV routes alone does NOT stop serving — review finding B1), and (b) an
ordered, idempotent teardown library (KV routes → blobs/versions → DB finalize) that inverts
the publish pipeline without orphaning KV routes, blobs, or live pages.

## Progress log

- phase 1 dashboard plumbing (providers, URL helper): done (commit c16baad5, review loops 1, verdict ship)
- phase 2 publish-state serving predicate (SSR 404 + isPublished re-point): done (commit ecffd51a, review loops 1, verdict ship)
- phase 3 teardown library: done (commit 2e80de3d, review loops 1, verdict ship). DD1c investigation = NO purge mechanism exists → honest ~1h edge window; phase 5 copy is load-bearing.
- phase 4 unpublish + delete API routes + e2e: done (commit 82cc4cba, review loops 2, verdict ship). Found+fixed: demo-token destructive bypass (SECURITY), D1 guard state-hole, untrue e2e 401 assert, 2 e2e-infra defects (unregistered spec / broken E2E_PORT). **e2e 7/7 green, verified by execution.**
- phase 5 dashboard wiring slice 1 (Unpublish/Delete live): done (commit bddc24af, review loops 1, verdict ship). **⛔ GATE A now open — awaiting founder.**
- phase 6 rename + duplicate: done (commit b5e3405c, review loops 1, verdict ship). e2e 14/14.
- phase 7 acceptance sweep + docs: done (commit 0e9a704d, review loops 1, verdict ship). All 4 gates green. GATE B (merge) open.

## Recorded orchestrator decisions

- **D1 — custom-domain guard predicate = `publishedPage.customDomain !== null`**, regardless of
  `customDomainStatus`. Pending/failed domains still hold the `@unique` slot + a Vercel
  registration; keying off `status === 'live'` would leak half-attached domains.
- **D2 — authz = `assertProjectOwner(clerkId, tokenId, { action, claimIfOrphan: true })`** on
  every mutation. Its built-in **audited** admin override (`logAdminOverride`) is KEPT — the
  spec's target was the *unaudited* `published-slug` hand-rolled widening, which must NOT be
  copied. Applied identically in BOTH mutation routes at birth (phase 4). "Admin may
  delete/unpublish any project (logged)" is flagged for the founder at Gate A; if strict
  owner-only is wanted, add `access.adminOverride === true → 403` in both routes (one-line each).
- **D3 — scope:** Domain settings + Archive menu items stay greyed. Out of this spec.
- **Review rulings applied (rev 2):** derive publish state from `publishState`, never write
  `isPublished` (B2); `versionCleanup.ts` untouched — teardown enumerates versions itself; blog
  teardown enumerates blobs/keys directly (B3, no `unpublishBlogPost` loop); ConfirmDialog
  restyle dropped from slice 1; phases rename+duplicate merged; Sentry capture on
  `teardown_incomplete`; honest e2e scope (no live-subdomain-404 theatre).
- **Review rulings applied (rev 3):** DD1c — blob-proxy CDN cache window on unpublish
  (best-effort purge + honest documented ~1h window, UI copy + Gate A verification method,
  `s-maxage` lowering rejected); publish-limit predicate loosening named as a billing-adjacent
  business-rule change (DD0b item 2, Gate A); `/api/og/[slug]` metadata gap + sitemap
  `'failed'`/`'publishing'` nuance recorded explicitly (DD0/DD0b), not silently.

## Design decisions

**DD0 — Serving predicate: `publishState`-derived, one helper (B1 + B2 root fix).**
Today a KV-route miss is NOT a 404: `src/middleware.ts:118-135` falls through to
`NextResponse.rewrite('/p/{subdomain}{path}')`, and every `/p/[slug]` SSR route serves any
existing row (`p/[slug]/page.tsx:91` checks only `!page`). So route deletion alone merely
demotes a live page from blob-proxy to SSR — it keeps serving. Fix:
- New plain module `src/lib/publishState.ts` (server+client safe, no `'use client'`):
  - `isServingPublishState(state: string): boolean` → **false for `'draft'` and
    `'unpublishing'`**, true otherwise (`'publishing'`/`'failed'`/`'published'` keep serving —
    preserves the republish window and failed-republish SSR behavior).
  - `OCCUPIES_PUBLISH_SLOT` predicate doc: `publishState !== 'draft'` — used for the plan
    published-page **limit count** and the dashboard **status pill** (a stuck `'unpublishing'`
    page still holds its slot and shows Published with Unpublish-as-retry, but SSR already 404s).
- Gate ALL `/p/[slug]` SSR fallbacks with `isServingPublishState`:
  `src/app/p/[slug]/page.tsx` (**both** `generateMetadata` :19 → `{}` AND the page :71 →
  `notFound()`), `src/app/p/[slug]/[...subpath]/page.tsx` (both exports),
  `src/app/p/[slug]/privacy/page.tsx`, and `src/lib/blog/ssr.tsx` `loadBlogSsr()` (:21-22 —
  single choke point covering `/p/[slug]/blog` + `/p/[slug]/blog/[postSlug]`). Each lookup adds
  `publishState` to its select.
- **ISR:** these routes have `revalidate = 3600` — without invalidation the cached render
  survives teardown for up to an hour. Teardown calls `revalidatePath()` (see DD1 step 3b).
  The CDN layer in front of the blob-proxy is a SEPARATE cache with no such hook — see DD1c.
- **Accepted gap (explicit, not silence):** `/api/og/[slug]/route.tsx:49` selects by slug with
  no publish-state check and will still serve an OG image with title/description for an
  unpublished page. Metadata-only (no page content, no orphaned storage) → deliberately
  DEFERRED, not gated this slice; recorded as a follow-up in phase 7 docs.

**DD0b — `isPublished` is NOT written; its readers are re-pointed (B2, ruled).**
`PublishedPage.isPublished` (`schema.prisma:161`, `@default(true)`) has **no writer anywhere**;
writing `false` on unpublish would be a one-way door (re-publish's existing-row branch,
`publish/route.ts:209-225`, never sets it back). Ruling: unpublish does NOT touch it. All
known `PublishedPage.isPublished` readers are re-pointed to `publishState`:
1. `src/lib/seo/resolvePublishedHost.ts:13,:41` — select `publishState` instead; predicate
   `isServingPublishState(page.publishState)` (sitemap/robots/rss follow serving). **Noted
   nuance:** "serving" includes `'failed'`/`'publishing'`, so a page in those states can appear
   in a sitemap. Marginal and consistent with the serving predicate (the page IS reachable);
   accepted, not a defect.
2. `src/app/api/publish/route.ts:229` — limit count `where: { userId, publishState: { not:
   'draft' } }` (slot predicate). **Only line of the publish route touched**, mandated by the
   B2 ruling; the happy path is otherwise untouched. **Named business-rule change
   (billing-adjacent):** because `isPublished` was `@default(true)` on EVERY row, the old count
   included `'draft'`-state rows too; the new predicate excludes them — i.e. the plan limit is
   **loosened**: an unpublished page no longer consumes a plan slot while still squatting its
   slug (DD12). Judged desirable (paying for a taken-down page is worse), but it changes what
   the limit counts — founder acknowledges at Gate A. Known pre-existing gap left as-is and
   flagged for Gate A: the limit check runs only on the CREATE branch, so re-publishing a
   previously-unpublished page never re-checks the limit.
3. `src/lib/blog/publishBlogPost.ts:78` (`loadContext` `findFirst({ projectId,
   isPublished: true })`) — re-point to `publishState: 'published'` (blog publish requires a
   live site) + update fixture `src/lib/blog/__tests__/publishBlogPost.test.ts:70`.
Implementer MUST grep `isPublished` repo-wide and confirm no other **PublishedPage** readers
(`src/schemas/validation.ts:234` and `src/types/core/content.ts:325` look like different
entities — verify, leave alone if so). Schema field itself stays (no migration, no drop).

**DD1 — Teardown order + failure semantics (atomicity is BUILT, not inherited).**
True atomicity across three external systems (KV, Blob, Postgres) is impossible; instead the
teardown is a **forward-only ordered sequence with a DB-finalize-last invariant**: the DB is
only marked `draft`/deleted after ALL external cleanup succeeded. Order (KV-first):

1. **Guard** (D1): `customDomain !== null` → abort with typed `blocked` result, zero writes.
2. Set `publishState: 'unpublishing'` (transient marker; plain `String` column, **no schema
   migration**). A crash mid-teardown leaves a detectable state instead of a lying
   `'published'` — and DD0 means an `'unpublishing'` page already 404s on the SSR path.
3. **KV route deletion** (DD2) — the switch that stops blob-proxy serving; blobs deleted later
   are already unreachable. (Blob-first would leave live routes pointing at deleted blobs.)
   3b. **ISR invalidation:** immediately after KV deletion, `revalidatePath('/p/' + slug)` plus
   `/p/{slug}{path}` for every enumerated non-root path, `/p/{slug}/privacy`, `/p/{slug}/blog`,
   and `/p/{slug}/blog/{postSlug}` per published post. Without this the cached SSR render keeps
   serving up to `revalidate = 3600`. (Callable here — teardown runs inside a route handler.)
   3c. **Best-effort CDN purge (DD1c):** if a supported purge mechanism exists, invoke it for
   the public host URLs; try/catch, NEVER fails the teardown.
4. **Blob + version deletion** (DD3) + **blog blob deletion** (DD2b), strict.
5. **DB finalize** (DD4 for unpublish; delete-mode stops before this — caller runs DD11).

Failure at step 3/4 → leave `publishState = 'unpublishing'`, return a typed retryable-failure
result (route → 500 `teardown_incomplete`) **and `Sentry.captureMessage('teardown_incomplete',
{ extra: { pageId, slug, step } })`** so a stuck page is visible to the founder, not just the
customer (`@sentry/nextjs` already a dep). Every step is **idempotent** (KV deletes, blob
`del`, row deletes, `revalidatePath`), so re-invoking resumes and completes. No new
`'unpublish_failed'` state; no rollback-to-published after step 3 begins.

**DD1c — Blob-proxy CDN cache: unpublish has no cache-key escape (best-effort purge + honest
documented window).**
The customer-facing URL (`{slug}.lessgo.site/`) is normally served by a middleware rewrite to
`/api/blob-proxy`, which returns `Cache-Control: public, s-maxage=3600,
stale-while-revalidate=86400` (`src/app/api/blob-proxy/route.ts:74`). **The CDN cache key is
the PUBLIC URL, not the rewritten path — DD1 step 3b's `revalidatePath('/p/{slug}')` does not
evict it.** Re-publish escapes this window by minting a NEW cache key (`src/middleware.ts:
115-117` appends `&v={version}` precisely "so republishes propagate immediately instead of
lagging the s-maxage window"); unpublish has no new version to mint — after KV deletion the
middleware stops rewriting and the origin correctly 404s (DD0), but the edge can replay the
cached HTML on the old key. Ruling (in order):
1. **Investigate-then-use purge, at implement time (phase 3).** The implementer FIRST checks
   whether a supported cache-purge mechanism actually exists in this stack: a Vercel
   purge/invalidate REST API reachable with the existing token/env, a `cacheTag` +
   `revalidateTag` path applicable to the blob-proxy route handler, or similar. **Do NOT
   invent or assume an API exists** — if no real, supported mechanism is found, say so in the
   phase audit and rely on (2). If one exists: call it from teardown step 3c, **best-effort**
   — wrapped in try/catch, never fails the teardown — with a Sentry capture on failure
   (reuse the `teardown_incomplete` capture convention, e.g. `extra: { step: 'cdn_purge' }`
   at warning level: a purge miss means a stale window, not incomplete teardown, so it must
   NOT flip the result to retryable-failure). If the chosen mechanism requires editing
   `blob-proxy/route.ts` (e.g. attaching a cache tag), that edit **borders the fenced publish
   happy path** — justification required in the audit; the existing `Cache-Control` header
   values stay byte-identical.
2. **Regardless of (1), accept + document the window honestly** (a purge can fail):
   - **UI copy (phase 5):** the unpublish confirm dialog AND the success toast tell the user
     the truth — take-down is immediate for new visitors, but a cached copy at our CDN can
     keep showing for up to about an hour. Plain words, no jargon (never "s-maxage").
     Files: `src/components/dashboard/ProjectCardMenu.tsx` (both the `confirmDialog` body
     and the success-toast message live at this call site).
   - **Gate A step 1** tells the founder how to verify take-down correctly given the window
     (cache-busting query param / hard refresh proves the origin 404s; the plain URL may
     serve stale for ≤1h) — see the Gate A section.
   - **Named spec deviation:** the AC "Unpublish takes a live page down → stops serving" is
     satisfied at the ORIGIN immediately, and at the EDGE within ~1h unless the best-effort
     purge succeeds. Stated plainly here and in phase 7 docs; not papered over.
3. **Rejected alternative — lowering `s-maxage` on the blob-proxy:** that is a
   publish-happy-path performance change (every published-page view pays it, forever, for a
   rare unpublish) and the spec fences the publish path off. Not done.
4. **SWR nuance (get this right in docs/copy):** after `s-maxage` (1h) expires,
   `stale-while-revalidate` serves stale while revalidating in the background — that
   revalidation hits the middleware, finds no KV route, reaches the origin 404, and the cache
   corrects itself. So the practical stale window is **~1h, not 24h**.

**DD2 — Route enumeration (the `removeRoutes` root-path trap).**
`removeRoutes(hosts)` deletes ONLY `route:{host}:/` + `redirect:{host}:/` + `slug-for:{host}`.
Teardown enumerates the full key set:
- **Hosts:** `publishSubdomainHosts(slug)` (lessgo.site + legacy lessgo.ai). Custom domain is
  guaranteed absent by the guard — never in the set.
- **Paths:** union of `PublishedPageVersion.metadata.blobs[].path` across **ALL** versions
  (older versions may have written subpage/locale routes the current one doesn't; legacy
  versions with only `version.blobKey` contribute `/`), **plus blog paths**: `/blog` + one
  `/blog/{post.slug}` per `BlogPost` with `status: 'published'` for the project.
- **APIs:** `deleteRoutes(keys: {host,path}[])` for every non-root (host × path) pair, then
  `removeRoutes(hosts)` for the root trio.

**DD2b — Blog teardown = direct enumeration, NOT `unpublishBlogPost` (B3, ruled).**
Blog blobs are never registered in `PublishedPageVersion` (`src/lib/blog/README.md:11`), so
version cleanup can't see them; and looping `unpublishBlogPost` is wrong — it **re-renders and
uploads a fresh index blob for every non-last post** (`publishBlogPost.ts:334-357`; an N-post
teardown would upload N−1 blobs it then deletes) and its deletes are `safeDel` best-effort
(:357,:365,:381), invisible to the strict-failure contract. Instead teardown itself:
- deletes blob `post.blobKey` per published `BlogPost` + `page.blogIndex.blobKey`
  (`schema.prisma:186-188`) — strict, in step 4;
- deletes KV `/blog` + `/blog/{slug}` keys — folded into DD2's key set, step 3;
- at DB finalize: demotes those posts (`status: 'draft'`, `publishedVersion/blobKey/blobUrl:
  null`, keep `firstPublishedAt` — slug stays locked, mirrors `unpublishBlogPost`'s row write)
  and clears `PublishedPage.blogIndex` (`Prisma.DbNull`). Delete mode skips the demote (rows
  cascade with the project).
- **Documented consequence (Gate A talking point):** site re-publish does NOT auto-restore the
  blog — `syncBlogAfterSitePublish` only re-renders `status:'published'` posts; after an
  unpublish, posts are drafts and must be re-published individually. Honest full take-down.

**DD3 — Multi-version blob cleanup, self-contained + strict.**
**`versionCleanup.ts` is NOT touched** (ruled — keeps the publish happy path pristine).
Teardown does its own enumeration in `teardown.ts`: `publishedPageVersion.findMany({ where:
{ publishedPageId } })` → blobKeys from `metadata.blobs[].blobKey` with legacy
`version.blobKey` fallback → `del()` each (strict: any failure → retryable result per DD1) →
**explicitly `update({ currentVersionId: null })` BEFORE deleting version rows** (the
`"CurrentVersion"` relation `schema.prisma:169/191` has no explicit `onDelete`; don't lean on
implicit SetNull) → `publishedPageVersion.deleteMany`. Do NOT model anything on
`publish/route.ts:520-528` (root-blob-only rollback — known-weak).

**DD4 — Exactly what unpublish writes (DB finalize).**
`PublishedPage.update`: `publishState: 'draft'`, `publishError: null`, `blogIndex:
Prisma.DbNull` (`currentVersionId` already nulled in DD3; `lastPublishAt` kept as history;
**`isPublished` NOT written** per DD0b). Plus blog-post demote (DD2b) and `Project.update:
{ status: 'draft' }`. The `PublishedPage` row is **kept** (slug reservation, DD12) — re-publish
takes the existing-row branch and works unchanged. Dashboard consequence: the
`publishedPage ? 'Published' : 'Draft'` derivation (page.tsx:150) becomes wrong — phase 5
changes it to the slot predicate `publishedPage && publishState !== 'draft'` (a stuck
`'unpublishing'` page shows Published with Unpublish available as retry). The SSR-404
requirement is handled structurally by DD0, not by an implementer side-check.

**DD5 — Confirm dialog: use `ConfirmDialog.tsx` AS-IS (restyle dropped — ruled).**
`confirmDialog()`/`promptDialog()` promise API is exactly what the menu needs (incl. Rename
input). The `app-*` retokenizing of its internals is gold-plating in a destructive slice and
shares blast radius with the edit page → **out of scope; recorded as a follow-up in phase 7
docs**. Phase 1 only mounts the hosts (DD6).

**DD6 — Provider mounting (phase 1).** Mount `<DialogHost />` + `<ToastProvider>` in the
dashboard layout (`src/app/dashboard/layout.tsx`; S1 shipped the shell — if the layout file
doesn't exist, add a thin client wrapper inside it rather than in each page). Without this,
`confirmDialog` silently degrades to `window.confirm`.

**DD7 — Guard freshness: BOTH pre-disable and server guard.** Extend the dashboard server
query select (**both the owner AND the duplicated admin branch**) with
`publishState, customDomain` → menu pre-disables/labels Unpublish/Delete with "Remove the
custom domain first" when `customDomain !== null`. Client state can be stale, so the **server
409 is the source of truth**; a stale click surfaces the same message via error toast.

**DD8 — Live-URL helper.** New `src/lib/publishedUrl.ts` exporting `publishedHost(slug)` /
`publishedUrl(slug, path = '/')` → `https://${slug}.lessgo.site...` (plain module — safe for
server + client import; no `'use client'`). Adopted THIS slice by `ProjectGridCard.tsx:107`
(currently the WRONG `lessgo.ai/p/${slug}`) and `ProjectCardMenu.tsx:57` "Visit site"
(`/p/` path). `SlugModal.tsx:39,:119` + `domain/LiveStep.tsx:64` already print the *correct*
string as literals — left alone this slice (follow-up); no 4th literal is introduced.

**DD9 — Duplicate clone contract.** In one `$transaction`: mint token → create Project →
clone `ProjectPage` rows. Copied scalar/JSON fields: `title` (+ " (copy)"), `audienceType`,
`templateId`, `variantId`, `paletteId`, `content`, `themeValues`, `computedDesign`, `brief`,
`aiBaseline`, `inputText`; `status: 'draft'`; `userId` = caller's `dbUser.id`. **Cloned
relations: `pages` (`ProjectPage`) only** — skipping them silently loses multi-page sites.
NOT cloned: publishedPage, testimonials, collectLink, blogPosts, editDeltas, socialPosts,
emailSequence, outreach* (published/engagement state — a duplicate is an independent
unpublished draft). Token minting: extract **`mintProjectToken()`** into a new
`src/lib/projectToken.ts` (inline `nanoid(12)` + `token.create`, per `/api/start:56-70`);
`/api/start` is NOT repointed this slice (blast-radius control; follow-up).

**DD10 — Rename vs smart-name fallback.** Explicit title is authoritative. PATCH writes
`Project.title`; the dashboard fallback chain (page.tsx:14) must apply **only** when title is
empty/`"Untitled Project"` — implementer verifies and, if it currently derives
unconditionally, adjusts it to prefer a real title. `promptDialog` is prefilled with the
currently *displayed* name (so renaming a derived-name project keeps what the user sees).

**DD11 — Delete cascade (delete mode), cascades named explicitly.**
Guard → full teardown (DD1–DD3, stops before DB finalize) if a `PublishedPage` exists → then a
Prisma `$transaction`: delete `PublishedPage` row (versions already gone, `currentVersionId`
already null) → delete `Project` → delete `Token` LAST (FK `Project.tokenId → Token.value`).
Per `schema.prisma`, these child relations are **`onDelete: Cascade`** and need no explicit
deletes: `EditDelta`(:60), `BlogPost`(:83), `ProjectPage`(:125), `SocialPost`(:256),
`EmailSequence`(:279), `OutreachIntake`(:297), `ProspectScrape`(:317), `OutreachMessage`(:338),
`CollectLink`(:636). **Only `Testimonial` is `onDelete: SetNull`** (:604) — rows survive with
`projectId: null` (conservative; acceptable). `PublishedPage.projectId` (:154) has **no
`@relation`** → nothing FK-blocks the project delete, which is why a "teardown ok, then
transaction fails" window is benign and retry-safe. Non-published project: skip teardown,
transaction only. `FormSubmission`/`PageAnalytics` are slug-keyed historical records — retained.

**DD12 — Slug retention = deliberate slug squatting (explicit, Gate A talking point).**
Unpublish keeps the `PublishedPage` row, so the `@unique` slug stays reserved and re-publish
preserves the URL — the intended UX. **Consequence:** `api/publish/route.ts:196-206` returns
409 "Slug already taken" for any OTHER user forever; the only release path is Delete. Founder
to acknowledge at Gate A (fine for beta; a reclaim policy is post-beta if ever). Note the
interaction with DD0b item 2: an unpublished page squats its slug but no longer counts against
the plan's published-page limit.

---

## Phase 1 — Dashboard plumbing: providers + URL helper

**Goal:** Non-behavioral groundwork so later phases only wire actions.

**Steps:**
1. Create `src/lib/publishedUrl.ts` (DD8).
2. Adopt it in `ProjectGridCard.tsx` (`domain` label, :107) and `ProjectCardMenu.tsx`
   "Visit site" (:57) — fixes the wrong `lessgo.ai/p/{slug}` label + link.
3. Mount `<DialogHost />` + `<ToastProvider>` in `src/app/dashboard/layout.tsx` (DD6).
4. NO ConfirmDialog restyle (DD5); `@/components/ui/dropdown-menu` untouched (hard ruling).

**Files touched:**
- `src/lib/publishedUrl.ts` (new)
- `src/components/dashboard/ProjectGridCard.tsx`
- `src/components/dashboard/ProjectCardMenu.tsx`
- `src/app/dashboard/layout.tsx`

**Verification:** `tsc` green; `npm run test:run` green; manual on `npm run dev`: dashboard
card shows `slug.lessgo.site`, Visit site opens the subdomain URL, a temp `confirmDialog()`
call renders the dialog (not `window.confirm`).

---

## Phase 2 — Publish-state serving predicate (SSR 404 + `isPublished` re-point)

**Goal:** DD0 + DD0b — make "not published" actually mean 404 on every SSR fallback, and
re-point all `PublishedPage.isPublished` readers to `publishState`. Independent of teardown;
zero behavior change for currently-published pages (`publishState === 'published'`).

**Steps:**
1. New `src/lib/publishState.ts`: `isServingPublishState()` (+ short doc of the slot
   predicate) + unit test.
2. Gate the SSR fallbacks (add `publishState` to each select; non-serving → `notFound()` /
   `{}` in `generateMetadata`): `p/[slug]/page.tsx` (**:19 AND :71**),
   `p/[slug]/[...subpath]/page.tsx` (both exports), `p/[slug]/privacy/page.tsx`,
   `src/lib/blog/ssr.tsx` `loadBlogSsr()` (covers both blog SSR routes).
   `/api/og/[slug]` is deliberately NOT gated (DD0 accepted gap — metadata only).
3. Re-point `isPublished` readers per DD0b: `resolvePublishedHost.ts` (select + :41),
   `publish/route.ts:229` (count → `publishState: { not: 'draft' }` — sole publish-route
   edit; the limit-loosening consequence is named in DD0b item 2 and raised at Gate A),
   `publishBlogPost.ts:78` (→ `publishState: 'published'`) + test fixture.
4. Repo-wide `isPublished` grep; confirm no other PublishedPage readers (DD0b); note findings
   in the phase audit.

**Files touched:**
- `src/lib/publishState.ts` (new)
- `src/lib/publishState.test.ts` (new)
- `src/app/p/[slug]/page.tsx`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `src/app/p/[slug]/privacy/page.tsx`
- `src/lib/blog/ssr.tsx`
- `src/lib/seo/resolvePublishedHost.ts`
- `src/app/api/publish/route.ts` (count predicate only)
- `src/lib/blog/publishBlogPost.ts` (loadContext predicate only)
- `src/lib/blog/__tests__/publishBlogPost.test.ts`

**Verification:** `tsc`, `npm run test:run` green (incl. updated blog tests); manual dev:
existing published page still serves `/p/{slug}` + a subpage + blog; hand-set a dev row to
`publishState: 'draft'` → `/p/{slug}` 404s. Caveat: any legacy dev row that is live-but-`draft`
will start 404ing — intended (prod was wiped 2026-06-16; all prod rows post-date the machine).

---

## Phase 3 — Teardown library (server-only core)

**Goal:** One reusable, ordered, idempotent `teardownPublishedPage()` implementing DD1–DD4
(+ DD1c best-effort CDN purge, DD2b blog, DD3 self-contained versions). `versionCleanup.ts`
NOT touched.

**Steps:**
1. **DD1c investigation FIRST:** determine whether a real, supported CDN purge mechanism
   exists (Vercel purge/invalidate REST API with existing token/env, `cacheTag` +
   `revalidateTag` for the blob-proxy handler, or similar). Do NOT invent one. Record the
   finding (exists → which; doesn't → why) in the phase audit.
2. New `src/lib/staticExport/teardown.ts`:
   `teardownPublishedPage(pageId, { mode: 'unpublish' | 'delete' })` — DD1 order: guard
   (typed `{ blocked: 'custom_domain' }`) → `'unpublishing'` marker → route-key enumeration
   (DD2 incl. blog keys) + `deleteRoutes`/`removeRoutes` → `revalidatePath` sweep (DD1 3b) →
   **best-effort CDN purge if step 1 found a mechanism** (DD1c: try/catch, never fails
   teardown, Sentry warning `{ step: 'cdn_purge' }` on failure) → strict blob deletion: all
   versions' blobs (DD3, own `findMany`, legacy fallback) + blog post/index blobs (DD2b) →
   null `currentVersionId` → delete version rows → DB finalize (DD4 + blog demote) for
   `mode:'unpublish'`; `mode:'delete'` stops after cleanup and returns (caller runs DD11
   transaction). Typed result union (blocked / retryable-failure / done); retryable-failure
   path fires the Sentry `teardown_incomplete` capture (DD1); never leaves
   `publishState:'draft'` with external state remaining.
3. Unit tests `src/lib/staticExport/teardown.test.ts` (mock prisma/kv/blob/Sentry/
   `revalidatePath`): route-key enumeration incl. subpage/locale paths across multiple
   versions + legacy blobKey-only version + blog `/blog` + `/blog/{slug}` keys + both hosts;
   **no blob uploads ever occur during teardown** (B3 regression); blog index + post blobs
   deleted; KV-before-blob-before-DB ordering; `revalidatePath` called for root + subpaths +
   blog paths; **CDN-purge failure does NOT fail the teardown and does NOT block DB finalize
   (DD1c — only if a purge mechanism was adopted)**; failure mid-blob leaves `'unpublishing'`,
   does NOT finalize, captures Sentry; retry completes; `currentVersionId` nulled before
   version-row deletion; guard short-circuits with zero writes.

**Files touched:**
- `src/lib/staticExport/teardown.ts` (new)
- `src/lib/staticExport/teardown.test.ts` (new)
- `src/app/api/blob-proxy/route.ts` — **CONDITIONAL, DD1c only:** touched ONLY if the chosen
  purge mechanism requires it (e.g. attaching a `cacheTag`). This borders the fenced publish
  happy path: justification required in the phase audit, `Cache-Control` header values stay
  byte-identical, and no other response behavior changes. If no mechanism (or one that needs
  no route edit) → this file is NOT touched.

**Verification:** `tsc` green; `npm run test:run` green incl. new tests; existing publish-path
tests untouched and green. If `blob-proxy/route.ts` was edited: manual dev check that a
published page still serves through the proxy with identical cache headers.

---

## Phase 4 — API routes: unpublish + delete (+ honest e2e)

**Goal:** The two blocker endpoints, D2-compliant, with e2e that asserts only what the local
env can actually observe.

**Steps:**
1. New `POST src/app/api/projects/[tokenId]/unpublish/route.ts`: `auth()` → 401 →
   `assertProjectOwner(clerkId, tokenId, { action: 'projects.unpublish', claimIfOrphan: true })`
   → `!access.ok` → status passthrough (canonical `[tokenId]/route.ts:23-30` pattern; NOT the
   `published-slug` widening) → find `PublishedPage` by projectId (none/already-`draft` →
   idempotent 200 no-op) → `teardownPublishedPage(pageId, { mode: 'unpublish' })` →
   blocked → 409 `{ code: 'custom_domain_attached', error: 'Remove the custom domain first' }`;
   retryable failure → 500 `{ code: 'teardown_incomplete' }`; done → 200.
2. Add `DELETE` handler to `src/app/api/projects/[tokenId]/route.ts`: same authz ladder
   (`action: 'projects.delete'`) → if published: guard + teardown (`mode: 'delete'`), 409/500
   as above → DD11 `$transaction` (PublishedPage → Project [cascades per DD11] → Token) → 200.
3. D2 applied identically in BOTH routes + code comment: admin override allowed + audited;
   strict owner-only = `if (access.adminOverride) return 403` in both — decision at Gate A.
4. **Playwright** `e2e/dashboard-lifecycle.spec.ts` (new; authed via `auth.setup.ts` pattern,
   seed via `e2e/helpers/seedDraft.ts`): (a) unauthenticated → 401; (b) non-owner token → 403;
   (c) unpublish a published seed → 200, `/p/{slug}` (SSR path, reachable on localhost)
   returns 404, project GET shows draft, `POST /api/publish` re-publish works and `/p/{slug}`
   serves again; (d) DELETE published project → project GET 404 + `/p/{slug}` 404; (e)
   custom-domain project → 409 `custom_domain_attached`, `/p/{slug}` still serves (no partial
   teardown).
   **Honest scope:** e2e does NOT assert `{slug}.lessgo.site` going down — host-based
   subdomain routing through middleware + KV isn't reproducible locally, and the DD1c CDN
   cache layer doesn't exist locally at all. Live-URL/KV/blob verification = phase-3 unit
   tests + Gate A manual (deployed host + admin KV diagnostics + DD1c cache-busting check).
   No teardown-e2e coverage is claimed beyond the SSR 404 + API contract.

**Files touched:**
- `src/app/api/projects/[tokenId]/unpublish/route.ts` (new)
- `src/app/api/projects/[tokenId]/route.ts`
- `e2e/dashboard-lifecycle.spec.ts` (new)
- `e2e/helpers/seedDraft.ts` (only if seeding needs a published/custom-domain variant helper)

**Verification:** `tsc`, `npm run test:run`, `npm run test:e2e` (new spec) green.

---

## Phase 5 — Dashboard wiring slice 1: Unpublish + Delete live

**Goal:** ••• menu Delete un-greyed + Unpublish added, guard-aware, with refresh + toasts.

**Steps:**
1. `src/app/dashboard/page.tsx`: extend the Prisma select with `publishState, customDomain`
   in **BOTH** the owner and admin branches (DD7); change status derivation to the slot
   predicate `publishedPage && publishState !== 'draft'` (DD4/DD0).
2. `ProjectGridCard.tsx`: extend `ProjectGridItem` with `publishState`,
   `hasCustomDomain: boolean` (+ pass-through).
3. `ProjectCardMenu.tsx`: add `onDelete`/`onUnpublish` flow (fetch → toast →
   `router.refresh()` — server-component refresh pattern; no optimistic removal). Delete =
   `confirmDialog({ destructive: true, ... })` naming the project + "also takes down the live
   page" when published. **Unpublish item** shown when `publishState !== 'draft'` (doubles as
   retry for a stuck `'unpublishing'`), with its own confirm. **DD1c honest-window copy
   (REQUIRED):** the unpublish confirm dialog AND the success toast both state, in plain
   words, that take-down is immediate for new visitors but a cached copy at our CDN can keep
   showing for up to about an hour (no jargon — never "s-maxage"/"SWR"). E.g. confirm body:
   "Your page stops being served immediately, but visitors may see a cached copy for up to an
   hour."; toast: "Unpublished. The cached copy can take up to an hour to clear." (final
   wording implementer's, meaning fixed). When `hasCustomDomain`: both items disabled with
   "Remove the custom domain first" (DD7); 409 from a stale click → same message as error
   toast. Domain settings + Archive stay greyed (D3). PostHog: `project_unpublish_clicked` /
   `project_delete_clicked` here (mirroring `project_preview_clicked`).
4. Popover styling stays at call site — `@/components/ui/dropdown-menu` untouched.
5. **Playwright**: extend `e2e/dashboard-lifecycle.spec.ts` with the UI path — menu → confirm
   dialog → toast → card disappears (delete) / flips to Draft (unpublish); custom-domain card
   shows disabled items.

**Files touched:**
- `src/app/dashboard/page.tsx`
- `src/components/dashboard/ProjectGridCard.tsx`
- `src/components/dashboard/ProjectCardMenu.tsx`
- `e2e/dashboard-lifecycle.spec.ts`

**Verification:** `tsc`, `test:run`, e2e green; manual dev pass: unpublish → confirm dialog
shows the cached-copy sentence → card flips to Draft → re-publish from editor works; delete
published → gone + `/p/{slug}` 404.

---

## ⛔ HUMAN GATE A — **PASSED (with deployed checks DEFERRED) 2026-07-16**

### Founder rulings (binding — do not re-litigate)
- **D2 admin override → KEEP the audited override.** No `adminOverride → 403` flip. The
  commented one-liner stays in both routes as documentation of the road not taken.
- **DD12 slug squatting → fine for beta.** No reclaim policy this slice.
- **DD0b limit-count loosening → founder delegated the call ("trivial at this stage, you
  decide"). ORCHESTRATOR RULING: KEEP the loosening** (`publishState: { not: 'draft' }`).
  Rationale: `isPublished` was `@default(true)` with no writer, so the *published*-page limit
  was counting drafts — that was a bug, not a policy. The fix restores the limit's intended
  meaning; pricing-v2 redefines these limits anyway. Reverting to bug-compatible behaviour to
  protect an undesigned limit would be worse.
- **DD2b blog demote-on-unpublish → right for beta.** Posts return as drafts; re-publish is
  per-post.

### ⚠️ DEFERRED to the big-bang deploy — NOT verified, do not claim otherwise
The founder cannot deploy now: this branch is a **consuming spec of the held big-bang push**
(main carries the ui-foundation base with push HELD until auth/dashboard/editor-shell land).
So three Gate A items are **untested on real infra** and must be checked at the big-bang deploy:
1. **`{slug}.lessgo.site` take-down** — needs host-based subdomain routing through real
   middleware + KV; not reproducible locally.
2. **DD1c: does the ~1h CDN edge window actually EXIST?** — the open empirical question. No
   purge mechanism exists (phase 3), so the shipped copy promises the window defensively. The
   phase-2 plan-reviewer's read is that the blob-proxy CDN cache key may include the *rewrite
   target* (`middleware.ts:115-117`), in which case unpublish escapes the window for free and
   the copy should be TIGHTENED. **Check: unpublish, then hit the plain subdomain URL vs. one
   with `?nocache=1`.** Plain still serving + cache-bust 404 ⇒ window is real (copy correct).
   Both 404 ⇒ no window (tighten copy — a cheap follow-up, not a re-plan).
3. **KV/blob cleanliness on prod** (admin KV diagnostics) + re-publish on the real host.

**What IS verified (don't under-claim either):** local dev exercises **real Vercel Blob + KV** —
the e2e run performed a genuine `POST /api/publish 200` with a real blob upload, then unpublished
and got a real 404. Teardown is proven against real infra; only real *host routing* + the CDN
layer are unproven.

---

### Original gate definition (retained for the deploy-time checks)

One combined gate covering all four spec-mandated items:
1. **Unpublish/take-down** — founder QA on a deployed env: publish → unpublish → verify
   take-down **knowing the DD1c CDN window exists**: `/p/{slug}` must 404 immediately, and
   `{slug}.lessgo.site` must 404 **when checked with a cache-busting query param (e.g.
   `?nocache=1`) or hard refresh** — that proves the origin is down; the PLAIN subdomain URL
   may keep serving a cached copy for up to ~1h unless the best-effort purge succeeded
   (~1h practical, not 24h — SWR revalidation self-corrects). KV/blob clean (admin KV
   diagnostics), re-publish works. Note: blog posts come back as drafts (DD2b).
2. **Delete project** — draft + published cases; published cascade verified clean.
3. **Custom-domain guard** — a page with `customDomain` set cannot be unpublished/deleted;
   message correct; zero partial teardown.
4. **Access-control** — non-owner 403 confirmed; founder RULES on D2: keep audited admin
   override, or add `adminOverride → 403` (one-line in each route)?
Talking points: DD1c spec deviation (AC "stops serving" = origin immediate, edge ≤1h) +
whether a purge mechanism was found; DD12 slug squatting (unpublished slug blocks other users
forever, release = Delete only); **DD0b limit-count loosening** (unpublished pages no longer
consume a plan slot while squatting their slug — billing-adjacent rule change, acknowledge);
DD0b re-publish-skips-limit-check note; DD0 accepted `/api/og/[slug]` metadata gap +
sitemap-may-list-`'failed'`/`'publishing'` nuance.

---

## Phase 6 — Rename + Duplicate

**Goal:** Both remaining menu items live (merged phase — same files). Rename: explicit title
wins over smart-name fallback. Duplicate: independent unpublished clone, multi-page-safe (DD9).

**Steps:**
1. Add `PATCH` to `src/app/api/projects/[tokenId]/route.ts`: authz ladder
   (`action: 'projects.rename'`, `claimIfOrphan: true`); body `{ title: string }`, trimmed,
   1–120 chars, 400 otherwise; writes `Project.title`. (Apply Gate A's D2 ruling if strict.)
2. New `src/lib/projectToken.ts` — `mintProjectToken()` (nanoid(12) + `token.create`).
3. New `POST src/app/api/projects/[tokenId]/duplicate/route.ts`: authz ladder
   (`action: 'projects.duplicate'`) → load source project + `pages` → DD9 `$transaction` →
   200 `{ tokenId }`. No `user.upsert`/`createDefaultPlan` (caller already exists).
4. `ProjectCardMenu.tsx`: un-grey Rename → `promptDialog({ defaultValue: displayedName })` →
   PATCH → toast + `router.refresh()`; un-grey Duplicate → POST → toast + `router.refresh()`.
5. `src/app/dashboard/page.tsx`: verify smart-name fallback (:14) only applies to
   empty/`"Untitled Project"` titles; adjust if unconditional (DD10).
6. **Playwright**: extend `e2e/dashboard-lifecycle.spec.ts` — rename API 200 + non-owner 403 +
   UI rename reflects on card; duplicate → new Draft card with new tokenId, editing the copy
   doesn't touch the original, non-owner 403.

**Files touched:**
- `src/app/api/projects/[tokenId]/route.ts`
- `src/lib/projectToken.ts` (new)
- `src/app/api/projects/[tokenId]/duplicate/route.ts` (new)
- `src/components/dashboard/ProjectCardMenu.tsx`
- `src/app/dashboard/page.tsx`
- `e2e/dashboard-lifecycle.spec.ts`

**Verification:** `tsc`, `test:run`, e2e green; manual: rename a derived-name project →
explicit title sticks; duplicate a multi-page project → copy has all pages; duplicate a
published project → copy is Draft, original stays live.

---

## Phase 7 — Acceptance sweep + docs

**Goal:** Full-green gates, AC checklist walk, publish-arch doc updated.

**Steps:**
1. Walk every spec acceptance criterion against dev; confirm no orphan paths (admin KV
   diagnostics after an unpublish + a delete). The "stops serving" AC is assessed per the
   DD1c deviation wording (origin immediate, edge ≤1h).
2. Document in `docs/architecture/publishArch.md`: teardown flow (order, `'unpublishing'`
   state, guard, DD0 serving predicate, `isPublished` deprecation-in-place), **DD1c CDN-cache
   window on unpublish** (mechanism found or not, ~1h practical window incl. the SWR
   self-correction nuance, rejected `s-maxage` change), DD0b limit-count semantics, DD12 slug
   retention, blog-demote behavior. Record follow-ups: ConfirmDialog `app-*` retokenize
   (DD5), `SlugModal`/`LiveStep` → `publishedUrl.ts`, `/api/start` → `mintProjectToken()`,
   `/api/og/[slug]` publish-state gating (DD0 accepted gap).
3. **Restore owner blog-draft preview on an unpublished site** (regression introduced by phase 2;
   found by phase-2 impl-review). `loadBlogSsr()` has a THIRD caller the plan missed:
   `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx:32` — the owner-only
   preview of a post in ANY status (drafts included). Phase 2's gate means that once teardown
   writes `'draft'`/`'unpublishing'`, the owner loses blog-draft preview of their own unpublished
   site. **ORCHESTRATOR RULING: preview must survive unpublish** — it is authed/owner-only, serves
   no public content, and DD2b demotes posts to draft on unpublish anyway, so the gate is actively
   wrong here. Add an opt-out option to `loadBlogSsr()` (e.g. `{ requireServing = true }`) and pass
   `false` from the preview route ONLY. Public blog SSR routes keep the gate (default). Add a unit
   test asserting: preview loads a `'draft'`-state page, public SSR does not.
4. **De-fang the e2e test-ordering tripwire** (phase-6 review; reviewer judged the audit
   under-sells this). `/api/publish` is rate-limited **5/60s per user** (`src/lib/rateLimit.ts:30-31`,
   in-memory). Phase 6's fast tests compressed *neighbouring, unmodified* publish tests into one
   window → a 429 that **looks exactly like a real publish regression**. Current mitigation is
   only "keep phase-6 tests last" + a comment (`e2e/dashboard-lifecycle.spec.ts:391-396`) — a
   tripwire for the next contributor who inserts a test mid-file.
   **RULING: make ordering irrelevant.** Wrap `publishSeed()` so it tracks its own publish
   timestamps and `await`s out the 60s window before the 6th call (~15 lines, `e2e/helpers/`).
   **Do NOT add an e2e rate-limit bypass flag** — that would un-pin real limiter behaviour.
   No product-code change. Then the "keep last" comment can go.
5. Fix the phase-6 review's cosmetic nits: `duplicate/route.ts:94` clamp the **base** title to
   `120 - ' (copy)'.length` rather than slicing the result (avoids splitting a surrogate pair and
   avoids a 120-char title losing its " (copy)" marker entirely); the stale "below" pointer at
   `e2e/dashboard-lifecycle.spec.ts:483` (the phase-6 block is now above); missing trailing
   newline on that spec.
6. Full gates: `tsc`, `npm run test:run`, `npm run test:e2e`, `npm run build`.

**Files touched:**
- `docs/architecture/publishArch.md`
- `src/lib/blog/ssr.tsx` (add `requireServing` opt-out — step 3)
- `src/app/(blog-preview)/dashboard/blog/[slug]/[postId]/preview/page.tsx` (pass the opt-out — step 3)
- `src/lib/blog/__tests__/ssr.test.ts` (preview-survives-unpublish test — step 3)
- `e2e/helpers/seedDraft.ts` (publish-pacing wrapper — step 4)
- `e2e/dashboard-lifecycle.spec.ts` (steps 4, 5 + the flake timeout below)
- `src/app/api/projects/[tokenId]/duplicate/route.ts` (title clamp — step 5)

7. **De-flake the UI-unpublish toast assertion** (phase-7 review's top non-blocking; orchestrator
   took it). `e2e/dashboard-lifecycle.spec.ts:102` asserts the toast on Playwright's 5s default
   while a real Blob/KV teardown round-trip is in flight — it timed out once, then passed in
   isolation and in a clean 14/14 re-run. Give it (and any sibling assertion waiting on a real
   teardown/publish round-trip) an explicit `{ timeout: 15_000 }`. Weakens nothing — same text,
   same server truth. **Why it's worth doing before merge:** the audit otherwise instructs future
   readers to "expect an occasional red here", and a gate people are pre-authorized to ignore
   stops protecting anything. This suite is what guards the take-down path on every future push;
   a flaky gate teaches re-running instead of investigating, which is how gates die.

**Verification:** all gates green. Then **⛔ HUMAN GATE B — merge**: founder pass on
rename/duplicate + merge-to-main decision (merge is always a human gate; user pushes).

---

## Assumptions (conservative picks)

- All real published rows have `publishState: 'published'` (prod wiped 2026-06-16, all rows
  post-date the state machine); a live-but-`'draft'` legacy dev row starting to 404 after
  phase 2 is intended behavior, not a bug.
- `src/app/dashboard/layout.tsx` exists (S1 shell); if not, providers mount via a thin client
  wrapper inside the dashboard route segment.
- `'unpublishing'` as a transient `publishState` string is acceptable (String column, no
  migration; unknown values render harmlessly in the two admin readers).
- `FormSubmission`/`PageAnalytics` retained on delete; `Testimonial` rows survive with
  `projectId: null` (SetNull).
- `revalidatePath` from a route handler invalidates the ISR cache for the listed concrete
  paths (Next 14 App Router documented behavior); if a path shape resists targeted
  revalidation, fall back to `revalidatePath('/p/[slug]', 'page')` (blunter, still correct).
  It does NOT touch the blob-proxy CDN cache (DD1c handles that layer).
- A supported CDN purge mechanism may or may not exist (DD1c) — the plan is correct either
  way; the honest-window copy + Gate A verification method are unconditional.
- Admin audited override kept per D2 unless Gate A rules strict owner-only.

## Unresolved questions (for founder, at Gate A unless noted)

- DD1c: ~1h CDN stale window on unpublish (origin down immediately, best-effort purge only)
  acceptable for beta?
- Blog after unpublish: posts demoted to draft, re-publish of site does NOT auto-restore blog
  — acceptable? (DD2b)
- Slug squatting: unpublished slug blocks other users forever; Delete = only release. OK for
  beta? (DD12)
- Limit loosening: unpublished pages stop counting against the published-page plan limit
  (previously all rows counted) — confirm intended? (DD0b item 2)
- D2: keep audited admin override on unpublish/delete, or strict owner-only?

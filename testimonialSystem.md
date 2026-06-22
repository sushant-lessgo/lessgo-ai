# Testimonial System — Master Plan

> Single source of truth for the testimonial-collection track. Built in parallel on a
> feature branch, dark-launched behind a flag, not deployed until comfortable.
> Phase specs fold into THIS doc (no separate spec files).

_Last updated: 2026-06-20_

---

## 1. Vision & Guiding Principle

A native testimonial **collection + moderation + display** system, built into Lessgo.

**Primary focus = our USERS, not ourselves.** This is a feature for Lessgo customers:
each user collects their own customers' testimonials and feeds them onto their own
landing pages — collection → display in one tool, closing a loop standalone tools
(Senja/Testimonial.to) cannot, because they don't own the page.

We (the founder) are just the **first tenant** — dogfooding. Scope of the early phases
may be limited to our own use, but the **design is multi-tenant from day one**. Being
single-tenant is never an excuse to bake in assumptions that block per-user usage.

Why native (vs Senja $30/mo): no lock-in, $0 marginal cost, dogfoods the product, and —
critically — becomes a **user-facing differentiator**. Trust in a testimonial comes from
attribution quality (name/photo/role/specific outcome), NOT from which tool collected it;
there is no "collected via Senja" trust badge, so native carries equal trust.

---

## 2. Architecture — three parts + an existing seam

```
[1] COLLECTION              [2] ADMIN / MODERATION          [3] FEED TO PAGE
public, owner-scoped form   private, owner-scoped UI        reuse injectRealTestimonials()
/t/[collectToken]        →  /dashboard/testimonials      →  (ALREADY EXISTS in repo)
   ↓                           approve / reject / edit          ↓
new Testimonial table  ───────────────────────────────→  section content in Project.content
(superset of fields)                                           ↓
                                                          existing template blocks render
                                                               ↓
                                                          publish → frozen static HTML (Blob)
```

**Key de-risking fact:** the "feed to page" path already exists.
`injectRealTestimonials(sections, real)` lives in
`src/modules/audience/{product,service}/parseCopy.ts` and today injects website-import
testimonials into a page's testimonial section. Our system becomes a **new, better source**
feeding that same seam — we do NOT invent the render path.

**Snapshot/push model (not live pull).** Publishing freezes HTML to Vercel Blob, so pages
cannot query the DB live. Flow is: approve → inject into section content → re-publish.

---

## 3. Data Model — superset, owner-scoped

The `Testimonial` table is a **superset** of every field any template might ever render.
**Only the fields a given template renders are fed to it** at injection time; the rest are
stored for future use / other templates.

Draft shape (refined in Phase 1 plan):

```
Testimonial
  id
  ownerId        // Lessgo user (Clerk) — the tenant. Required.
  projectId?     // which project/page this belongs to (testimonials are per-page)
  collectToken?  // the public collect link that produced it (for collection source)

  authorName
  authorRole?
  authorCompany?
  authorPhotoUrl?   // Vercel Blob
  quote
  rating?           // 1-5, optional
  videoUrl?         // schema-ready; collection deferred to a later phase

  status            // pending | approved | rejected
  source            // collect-form | manual | imported
  createdAt
  updatedAt
```

Additive table — no existing feature touches it. Near-zero merge-conflict surface.

### Field mapping per template (v1)

Templates render different subsets today (do NOT edit the dual-renderer blocks in v1):

| Audience | Template(s) | Shape | Fields rendered today |
|---|---|---|---|
| Product | meridian, techpremium | collection 1–3 | quote, author_name, author_role |
| Service | hearth, lex | single best quote | quote, name, role, company, **photo** |

v1 injection feeds only what each template already renders. Therefore:
- **Photo renders on service templates** today (free), **not on product** (later template change).
- Product photo-on-card = a later, separate template enhancement (dual-renderer work).

---

## 4. Locked Agreements

1. **Multi-tenant by design, users are the focus.** First tenant = us (dogfood). No
   single-tenant shortcuts that block per-user usage.
2. **Superset table; feed only what the template needs.**
3. **Photo + text in v1.** Photo renders where templates already support it (service).
4. **Video deferred** — schema keeps `videoUrl`, but in-browser recording/transcription is
   genuinely hard; not worth blocking v1. Added in a later phase (or as an embed-URL paste,
   which is cheap, if pulled forward).
5. **Reuse `injectRealTestimonials`** as the page-feed seam; no new render path.
6. **Snapshot/push + re-publish**, not live DB pull (static-export constraint).

---

## 5. Isolation & Dev Strategy

- **Worktree, off main:** `feature/testimonials` lives in a separate **git worktree** at
  `../lessgo-testimonials`, branched off **main**. (Switched from "plain branch" because the
  active `feat/multipage-phase1` tree had uncommitted multi-page WIP — a worktree isolates the
  dir without touching that WIP.) The worktree has its own `node_modules` (`npm install` once).
- **Dark launch:** everything namespaced (`/api/testimonials/*`, `/dashboard/testimonials`,
  `/t/[token]`); gated behind `TESTIMONIALS_ENABLED` env flag (`src/lib/testimonials/flag.ts`).
  Safe to dark-merge to main; nothing links/shows until the flag flips.
  - Note: `.env.example` is **gitignored** in this repo, so the flag is documented here, not
    there. Set `TESTIMONIALS_ENABLED=true` in `.env.local` to enable; default-false when unset.
- **DB — do NOT `migrate dev` against shared dev:** the shared dev Neon DB is **drifted** —
  multi-page added a `ProjectPage` table via `db push` with **no migration record**. Running
  `prisma migrate dev` (any branch) would detect that drift and offer to **reset dev** (data loss).
  So the Testimonial migration was generated **DB-free** via
  `prisma migrate diff --from-schema-datamodel <baseline> --to-schema-datamodel <schema> --script`
  and committed unapplied. It applies later via `migrate deploy` on a clean DB / at launch.
  For integration testing, spin a dedicated **Neon dev branch** (clean DB) — don't touch shared dev.
- **Conflict hygiene:** `schema.prisma` is the only shared file touched (append-style, additive);
  sync `main` into the worktree periodically. Near-zero conflict surface.

---

## 6. Master Plan (phases)

Each phase is independently valuable and safe to merge (dark) before the next exists.

- **Phase 1 — Foundation. ✅ DONE (2026-06-20).** Worktree + `Testimonial` model (superset,
  additive migration, DB-free) + data-access layer + `TESTIMONIALS_ENABLED` flag + mocked test.
  No UI. _(as-built detail below)_
- **Phase 2 — Admin / Moderation. ✅ DONE (2026-06-20).** `/dashboard/testimonials`: list,
  filter, approve/reject/edit/delete, **manual add**. Owner-scoped API + Clerk auth, flag-gated.
  _(as-built detail below)_
- **Phase 3 — Collection.** Public `/t/[collectToken]` branded form; collect-token
  generation (per project); submit API → pending Testimonial; photo upload via Blob.
- **Phase 4 — Feed to page.** "Add to page" picker → inject approved testimonials into the
  section content via the existing seam (field-mapped per template) → re-publish.
- **Phase 5+ (later).** Video collection; product photo-on-card template change; email/automation
  "request a testimonial" at the publish/activation moment; per-page analytics; G2/PH push.

---

## 7. Open Questions (resolve as we go)

- Collect token scope: **per-project** (recommended — testimonials belong to a page) vs
  per-owner (one wall)? — leaning per-project.
- ~~Where does the moderation UI live in the existing dashboard IA?~~ → RESOLVED: `/dashboard/testimonials`,
  reached via a flag-gated `Header` nav link (Phase 2).
- Photo storage path/policy in Blob (reuse existing upload util?).
- Do we want a public "Wall of Love" page per project, or only section-injection, in early phases?

---

## Phase 1 — As Built (2026-06-20)

Foundation only: data layer, no UI/API/collection form. Verified by mocked unit test + build.

**Files (all in the `../lessgo-testimonials` worktree, branch `feature/testimonials`):**
- `prisma/schema.prisma` — `Testimonial` model (superset; `userId` = Clerk id, no FK;
  `projectId?` relation `onDelete: SetNull`; `status`/`source` as String w/ defaults) +
  `Project.testimonials` back-relation.
- `prisma/migrations/20260620195819_add_testimonial_model/migration.sql` — generated DB-free
  via `migrate diff` (schema→schema). **Unapplied** to any DB (see §5 dev-DB drift).
- `src/lib/testimonials/flag.ts` — `isTestimonialsEnabled()` (reads `TESTIMONIALS_ENABLED`).
- `src/lib/testimonials/repo.ts` — owner-scoped data access: `createTestimonial`,
  `listTestimonialsByOwner`, `getTestimonial`, `updateTestimonialStatus`, `updateTestimonial`,
  `deleteTestimonial`. Validates `status`/`source`/`rating` at the repo layer (DB has no enum);
  exports `TESTIMONIAL_STATUSES` / `TESTIMONIAL_SOURCES` constants for Phase 2 routes.
- `src/lib/testimonials/repo.test.ts` — Vitest, **mocks `@/lib/prisma`** (no DB). 9 tests pass:
  defaults, optional-null normalization, invalid status/source/rating rejected, owner-scoping +
  status filter, status update, delete.

**Decisions baked in (from PO review):** `onDelete: SetNull` (testimonials survive project
deletion); mocked test (no shared-dev pollution); repo-layer status/source validation;
`collectToken` is a denormalized ref (Phase 3 `CollectLink` entity is authoritative).

**Verification:** `npx vitest run src/lib/testimonials/repo.test.ts` → 9 passed.
`prisma generate` → client includes `Testimonial`. `npm run build` → (see commit/CI).

**Committed** as `8ffd3b1` on `feature/testimonials` (still dark; nothing on main).

## Phase 2 — As Built (2026-06-20)

Owner-scoped moderation surface. No public collection form (Phase 3), no page-injection (Phase 4).
Verified by `npm run build` (clean; routes present in build) + repo tests still 9/9 green.

**Files (worktree `../lessgo-testimonials`, branch `feature/testimonials`):**
- `src/app/dashboard/testimonials/page.tsx` — server component: flag-gate (`notFound()` if off) →
  `auth()` → `listTestimonialsByOwner(userId)` → Header/Footer shell + status stat cards +
  `<TestimonialModerationList>`. Mirrors `dashboard/forms/[slug]/page.tsx`.
- `src/app/api/testimonials/route.ts` — `POST` manual add (zod; defaults `source:'manual'`,
  `status:'approved'`).
- `src/app/api/testimonials/[id]/route.ts` — `PATCH` (edit/status) + `DELETE`. Ownership enforced
  **in-route** (`getTestimonial` → `userId` check → 403). Enum validated via `isTestimonialStatus`.
  All routes flag-gated (404 if off). Pattern from `api/domains/remove/route.ts`.
- `src/components/dashboard/testimonials/TestimonialModerationList.tsx` — client: filter tabs
  (all/pending/approved/rejected), cards w/ photo/quote/author/rating/`Badge`, Approve/Reject
  (`PATCH {status}`), Edit, Delete (confirm `Dialog`). `fetch` → `router.refresh()`, inline errors.
- `src/components/dashboard/testimonials/TestimonialFormDialog.tsx` — client: shared Add/Edit form
  in `Dialog` (name/role/company/quote/rating/photo-URL/status). Photo is a **pasted URL**
  (file upload deferred to Phase 3). Idiom from `domain/AddDomainForm.tsx`.
- `src/lib/testimonials/flag.ts` — added `isTestimonialsEnabledPublic()` (reads
  `NEXT_PUBLIC_TESTIMONIALS_ENABLED`) for the client nav link; server `isTestimonialsEnabled()`
  still gates page + routes (authoritative).
- `src/components/dashboard/Header.tsx` — flag-gated `Testimonials` nav link beside Settings.

**Decisions baked in (PO review):** manual-add defaults **approved** (owner-trusted; form can
override); **account-level** (`projectId` null — Phase 4 ties to a page); Reject = status `rejected`
(reversible), separate Delete = hard remove; route-layer enum validation via exported guards.

**Two flags now (both default false):** `TESTIMONIALS_ENABLED` (server: page + API),
`NEXT_PUBLIC_TESTIMONIALS_ENABLED` (client: nav link). Set both in `.env.local` to enable.

**Runtime-smoked** on a dedicated Neon dev branch `testimonials-dev` (migration applied via
`migrate deploy` over the direct URL); user confirmed the moderation flow works.

## Phase 2.5 — As Built (2026-06-20): project scoping

Makes testimonials **project-aware** (a Lessgo project = one business/site; separate projects =
separate businesses that must stay isolated). UI + API only — `Testimonial.projectId` and repo
support already existed, so **no schema/migration/repo change**. Build clean, tests 9/9.

- `src/app/dashboard/testimonials/page.tsx` — also loads the owner's projects
  (`prisma.user.findUnique({ where:{clerkId}, include:{projects} })`) → passes to the list.
- `TestimonialModerationList.tsx` — project **filter** (All / per-project / Unassigned) +
  per-card project label. Both **hidden when ≤1 project** (`showProjects`).
- `TestimonialFormDialog.tsx` — project **picker** (`<select>`); hidden when ≤1 project
  (auto-assigns the single project); add defaults to most-recent project, edit pre-selects current.
- `api/testimonials/route.ts` (POST) + `[id]/route.ts` (PATCH) — accept `projectId`; when set,
  **verify ownership** via `prisma.project.findFirst({ where:{ id, user:{ clerkId } } })` → 400
  `Invalid project` otherwise (the isolation guarantee). PATCH `projectId:null` = unassign.

**UX:** invisible for the common single-project user; the project dimension only appears with
multiple projects. Legacy Phase-2 null-project testimonials show under **"Unassigned"**, reassignable.

## Phase 3 — As Built (2026-06-20): public collection + photo upload

The customer-facing half. New `CollectLink` entity (per-project token); public branded form;
public submit with photo upload + spam defense; owner link management. Build clean, tests 9/9,
migration applied to the Neon `testimonials-dev` branch.

**Security model:** the `collectToken` is the **only capability** — the public submit resolves
owner `userId` + `projectId` **server-side** from the token (nothing trusted from the client,
unlike `forms/submit`).

- **`CollectLink` model** (migration `*_add_collect_link`): `token @unique`, `projectId @unique`
  (one link/project), `userId` (Clerk owner), `isActive`, `onDelete: Cascade`. + `Project.collectLink`.
- `src/lib/testimonials/collectLinks.ts` — `getOrCreateCollectLink` / `getCollectLinkByToken`
  (public) / `setCollectLinkActive` / `rotateCollectLinkToken`. Owner ops verify project ownership.
- `src/lib/testimonials/photo.ts` — `processAndUploadTestimonialPhoto`: ≤5MB, **Sharp always
  re-encodes to webp** (512px; the decode IS the MIME guard — **no SVG passthrough**), Vercel Blob
  `put` (dev FS fallback). Returns URL.
- `src/app/api/testimonials/collect/route.ts` — **PUBLIC** submit: `request.formData()` (multipart),
  honeypot (`website`), `withFormRateLimit` (10/min/IP), token→owner/project resolve, optional photo,
  `createTestimonial({ status:'pending', source:'collect-form' })`. No auth, no CSRF.
- `src/app/api/testimonials/collect-link/route.ts` — owner-only: `POST` get-or-create, `PATCH`
  toggle active / rotate.
- `src/app/t/[collectToken]/page.tsx` + `src/components/t/CollectFormClient.tsx` — public branded
  page (flag-gated; `notFound` on bad token, friendly message if inactive) + form → thank-you.
- `src/components/dashboard/testimonials/CollectLinksDialog.tsx` — "Collect link" button in the
  moderation toolbar: project picker → URL (built from `window.location.origin`) + Copy + Disable/
  Enable + Regenerate.
- `src/app/api/testimonials/[id]/route.ts` (DELETE) — best-effort `del()` of Lessgo-Blob-hosted
  photos on delete (no orphaned blobs).
- `src/middleware.ts` — `/t/(.*)` + `/api/testimonials/collect` added to `isPublicRoute`.

**Spam defense (v1):** honeypot + 10/min/IP rate limit. (hCaptcha later if needed.)

### Next: Phase 4 — Feed approved testimonials onto pages
"Add to page" picker → inject approved (project-scoped) testimonials into the page's testimonial
section via the existing `injectRealTestimonials` seam (field-mapped per template) → re-publish.

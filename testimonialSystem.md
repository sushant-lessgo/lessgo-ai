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
- **Phase 2 — Admin / Moderation.** `/dashboard/testimonials`: list, approve/reject/edit,
  **manual add** (lets us seed our own immediately). Owner-scoped API + Clerk auth.
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
- Where does the moderation UI live in the existing dashboard IA?
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

**NOT committed yet** — working tree only. Commit when ready (nothing is on main; fully dark).

### Next: Phase 2 — Admin / Moderation
`/dashboard/testimonials` (owner-scoped list + approve/reject/edit + **manual add** to seed our
own), API routes using `auth()` + `verifyProjectAccess` (`src/lib/security.ts`), all gated by
`isTestimonialsEnabled()`. Resolve open Q: where it slots in the dashboard IA / Header nav.

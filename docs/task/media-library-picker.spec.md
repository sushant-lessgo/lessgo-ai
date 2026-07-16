---
tier: full
tier-why: new `MediaAsset` Prisma model (schema change — risky surface) + touches editor image components + blob/upload path. Shared spine reused by Work-engine E2 ingestion → correctness matters.
---

# media-library-picker — spec  (Media library · pilot — t7 picker + asset spine)

## Problem / why
Image handling is scattered: `upload-image` (→ Vercel Blob) + `images/search` (Pexels) exist, but
there's no **media library** — no per-project asset registry, no unified picker, and images are
just blob URLs dropped inline into content. The handoff (t7 picker + t8 storage manager) unifies
this. This pilot also **de-risks Work-engine onboarding E2 ingestion** (upload + image pipeline +
a place to hold/pick a project's images) by building that shared plumbing once.

## Goal
Ship one **media picker** (Upload / Stock) backed by a **per-project asset registry** (`MediaAsset`)
and an **image pipeline**, wired into the main editor Replace flow and exposed for E2 ingestion.
The heavy storage-manager (folders/usage/replace-everywhere) is deferred.

## Approach (decided)
- **Picker-pilot (Q1):** build the t7 picker + asset registry + image pipeline; **defer the t8
  storage manager** (folders, multi-select, usage indicators, replace-everywhere) to a later slice.
- **Asset registry A (Q2):** add a lightweight **`MediaAsset` Prisma model** (per-project asset
  list: url + source + meta) as the shared spine both the picker and E2 read/write. Not blob-prefix
  enumeration.
- **Wire, don't rip (B):** route the **main Replace flow** + **E2 ingestion** through the new
  picker/registry now; **migrate the remaining image entry points** (`EditableLogo`,
  `AvatarEditableComponent`, `EditableImageCollection`, `ImageToolbar` stragglers) in a fast follow
  — avoids editor-wide churn colliding with `editor-shell-redesign`.

## Scope IN
- **`MediaAsset` model** (new Prisma model): per-project (token-scoped) registry of assets —
  url, source (`upload`/`stock`), dimensions/meta, createdAt. Migration via `prisma migrate dev`.
- **Media picker (t7)**: one component with tabs **Upload** + **Stock** (Pexels via existing
  `images/search`), each chosen image recorded in `MediaAsset`. **Crop** if cheap. "From CMS" tab
  present but **stubbed/hidden** (CMS boards not built — later).
- **Reuse the existing bulk-upload engine.** `bulkUploadImages` (editStore action, used by
  `EditableImageCollection` for naayom's `imageCollection` grids) already does multi-file upload
  → `{ url }[]`. The picker's Upload tab + E2's multi-image upload **build on `bulkUploadImages`**,
  not a new uploader. Extend it to **also record each result into `MediaAsset`** (today it returns
  URLs only, appended inline — no registry).
- **Image pipeline**: on upload, produce resized/modern-format output + **blur placeholder**
  (the E2-reusable plumbing). Reuse/extend `upload-image` processing; ensure `bulkUploadImages`
  runs uploads through it.
- **Wire into main Replace flow** (the primary editor image-replace path) + **expose an API/hook
  E2 ingestion consumes** (upload-from-computer + website-scraped images land in `MediaAsset` via
  the same pipeline).
- Ownership enforced (`assertProjectOwner`/token scope) on asset create/list/delete.
- Built on `ui-foundation` primitives.

## Scope OUT (non-goals)
- **t8 storage manager** — folders, multi-select, usage indicators, replace-everywhere → later slice.
- **Full unification** of every image entry point (logo/avatar/collection) — fast follow (B).
- **Unsplash** — Pexels already works; add later (handoff wants Unsplash+Pexels unified).
- **From-CMS tab depth** — depends on CMS boards (t12/t19/t22, not built); stub/hide for now.
- **Video library** (`upload-video` stays as-is).
- **Website-scrape ingestion UI** itself — that's E2; this only provides the pipeline + registry it uses.
- No responsive/mobile pass.

## Constraints
- **New Prisma model → `prisma migrate dev`** (never `db push`); dev/prod schemas reconciled via
  migration (see DB-migration workflow).
- **`MediaAsset` is the shared spine** — design the shape so **E2 ingestion** reads/writes the same
  model (don't build a picker-only structure E2 must refactor).
- **Blob prefix distinct from publish blobs** (`pages/…`) — asset uploads stay under `uploads/…`;
  don't collide with the publish path's blob keys.
- **Coordinate with `editor-shell-redesign` + toolbar lane** — B keeps overlap minimal (main
  Replace flow only); do NOT touch editor chrome/store internals.
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `src/app/api/upload-image/route.ts` (Vercel Blob `put`, image processing, dev fallback),
  `src/app/api/images/search/route.ts` (Pexels stock proxy), `proxy-image`, `blob-proxy`.
- `src/app/edit/[token]/components/toolbars/ImageToolbar.tsx`,
  `primitives/EditableImageCollection.tsx`, `EditableLogo.tsx`,
  `src/components/ui/AvatarEditableComponent.tsx` — existing image entry points (main Replace = wire now; rest = fast follow).
- **`bulkUploadImages` (editStore action)** — existing multi-file upload engine (`(files) →
  { file, url }[]`), used by `EditableImageCollection` (naayom `imageCollection` grids). **Reuse
  for the picker Upload tab + E2 multi-upload**; extend to write `MediaAsset` + run the pipeline.
- `prisma/schema.prisma` — where `MediaAsset` is added; token-scoped `Project` pattern.
- `docs/task/work-onboarding-shell.spec.md` + `workEndtoEnd.md` (Phase E, E2 ingestion) — the
  consumer this de-risks.
- Handoff `Lessgo Editor Redesign.dc.html` t7 (picker) + t8 (storage manager — deferred).
- `docs/architecture/publishArch.md` (blob key scheme — avoid collision).

## Open exploration questions (feeds scout)
- Exact `MediaAsset` shape E2 needs (upload + scraped images, meta the pipeline produces) — confirm
  with the E2 ingestion requirements so it's not picker-only.
- What image processing does `upload-image` already do vs what the pipeline must add (blur placeholder, format)?
- Where does `bulkUploadImages` live + upload to (per-file `upload-image`? does it apply any
  pipeline today?), and cleanest point to make it write `MediaAsset` without breaking the
  `EditableImageCollection` inline-array flow.
- Where the "main Replace flow" enters today (ImageToolbar? EditableImage?) — the one path to wire first.
- Token/ownership pattern for a new per-project model + its API routes.
- Does anything already list a project's uploaded assets (or is inline-URL the only current state)?

## Candidate human gates
- **MANDATORY: Prisma migration** (`MediaAsset`) — schema change; run `migrate dev`, reconcile dev/prod.
- Confirm `MediaAsset` shape with E2 before it's built on (cheap now, costly later).

## Acceptance criteria
- [ ] `MediaAsset` model added + migrated; per-project, token-scoped, ownership-enforced.
- [ ] Media picker (Upload + Stock/Pexels) works; chosen/uploaded images recorded in `MediaAsset`.
- [ ] Image pipeline produces resized/modern-format output + blur placeholder on upload.
- [ ] Picker wired into the main editor Replace flow; an image can be replaced via it end-to-end.
- [ ] E2 ingestion can consume the registry + pipeline (API/hook exposed; upload + scraped images
      land as `MediaAsset` via the same pipeline).
- [ ] Blob keys don't collide with the publish path; ownership enforced on asset routes.
- [ ] t8 storage manager, full unification, Unsplash, From-CMS depth NOT built (deferred).
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
This IS the pilot. Slice order for the planner: (1) `MediaAsset` model + migration + upload→registry
+ image pipeline (the E2-shared spine), (2) picker UI (Upload+Stock) wired into the main Replace
flow. Gate: an image can be uploaded, processed, stored in the registry, and picked in the editor;
E2 can reuse the same spine.

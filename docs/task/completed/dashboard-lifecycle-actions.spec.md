---
tier: full
tier-why: touches the publish pipeline (publishState machine, Vercel Blob, KV routes) + custom-domain guard + destructive DB delete + access control (assertProjectOwner). Irreversible surfaces → full pipeline + human gates.
---

# dashboard-lifecycle-actions — spec  (Dashboard redesign · Slice S2)

## Problem / why
Dashboard S1 (`dashboard-workspace-ia`, merged) shipped the projects grid + the ••• card menu
with **Rename / Duplicate / Delete greyed** and no unpublish anywhere. Users still can't manage
project lifecycle, and — the beta blocker — **a mispublish is permanent: no take-down path
exists**. This slice builds the actions layer and un-greys the menu. Supersedes the held
`dashboard-lifecycle.spec.md` (its requirements carry over; own-projects grid + card rebuild
already done by S1).

## Goal
Users can rename, duplicate, delete, and **unpublish** their own projects from the dashboard.
Deleting a published project also takes it down. Nothing leaves orphaned live pages, KV routes,
or blobs.

## Decisions (locked)
- **Unpublish = real user feature** (not admin-only). `publishState` → draft; KV routes + blob
  torn down atomically (reuse publish's cleanup path); re-publish works.
- **Custom-domain guard (Q1=A):** if the published page has a custom domain attached,
  **block** unpublish/delete with a clear message ("Remove the custom domain first"). Do NOT
  auto-detach the domain / SSL. Automated cascade teardown = deferred (post-beta).
- **Delete scope (Q2):** **any** project, with an **explicit confirm**. Deleting a *published*
  project cascades the same take-down as unpublish (subject to the custom-domain guard).

## Scope IN
- Wire S1's greyed ••• menu → live actions: **Rename**, **Duplicate**, **Delete**, + add
  **Unpublish** (shown when the project is published).
- **Rename** — update project title (existing `projects/[tokenId]` PATCH or new action).
- **Duplicate** — clone the Project (new token; copy content/themeValues/computedDesign/audience/
  template/variant/palette) as an unpublished draft.
- **Delete** — any project, explicit confirm dialog; published → cascade take-down first
  (guarded by custom domain).
- **Unpublish / take-down** — `publishState` → draft; remove KV routes (`kvRoutes.ts`) + Vercel
  Blob (`pages/{pageId}/{version}/index.html`); atomic, matching publish's failure-cleanup path.
- **Custom-domain guard** on unpublish + delete (block + message per Q1=A).
- **Correct live URL label** ("Published at" → real `slug.lessgo.site`, not `/p/slug`) if S1
  didn't already fix it.
- All mutations enforce **`assertProjectOwner`** (not the admin-all shortcut).
- Confirm dialogs + optimistic/refresh UI built on `ui-foundation` primitives.

## Scope OUT (non-goals)
- **Automated custom-domain teardown** (detach domain + SSL on unpublish) — deferred; beta uses
  the guard instead.
- Billing/credits surface (S3 `billing-beta`), rollups/leads inbox (S4).
- Analytics/forms/testimonials/blog screen changes.
- Auto-naming drafts / search / filter / pagination (P2 — fold only if trivial, else defer).
- No changes to the publish *happy path* (publish API stays; we add the inverse + reuse cleanup).
- No responsive/mobile pass.

## Constraints
- **Teardown must be atomic and reuse publish's cleanup path** — no partial KV/blob state
  (`publishState` machine: `draft → publishing → published | failed`). Match orphan-blob cleanup.
- **Delete-published must not leave orphaned KV routes / blobs / live pages.**
- **Custom-domain guard precedes any teardown** (unpublish + delete).
- **`assertProjectOwner` on every mutation** (token = routing not authz — see authz memory);
  admin god-view must not become a normal-user delete/unpublish bypass.
- Duplicate must produce a fully independent draft (new token, no shared published state).
- Green gates before merge: `tsc`, `test:run`, `npm run build`.

## References
- `docs/task/dashboard-lifecycle.spec.md` — held spec (requirements source, prior discuss decisions).
- `docs/task/dashboard-workspace-ia.spec.md` (S1, merged) — the grid + greyed ••• menu this wires.
- `/api/publish` + `publishState` machine; `src/lib/routing/kvRoutes.ts`; blob-proxy;
  `docs/architecture/publishArch.md` — the pipeline unpublish inverts + reuses cleanup from.
- `src/app/api/projects/[tokenId]/route.ts`, `published-slug/route.ts` — existing project routes.
- `assertProjectOwner` (authz pattern); `src/lib/admin.ts` `requireAdmin()`.
- `PublishedPage.customDomain*` fields — the guard reads these.
- `src/components/dashboard/*` + S1 grid/card components — where the menu lives.

## Open exploration questions (feeds scout)
- What does publish's failure-cleanup do (KV + blob) that unpublish should reuse verbatim?
- Where/how is `PublishedPage` + `PublishedPageVersion` + KV route written, to invert correctly?
- Does S1 already render the real `slug.lessgo.site` URL, or is that still `/p/slug`?
- How is a Project cloned safely (which JSON fields, new token issuance path)?
- Custom-domain detection: which `customDomain*` state means "attached" for the guard?
- Any existing admin unpublish/delete code to generalize?

## Candidate human gates
- **MANDATORY: unpublish / take-down** — irreversible on live pages (KV + blob teardown). Founder QA.
- **MANDATORY: delete project** — data loss; confirm cascade-takedown of published works.
- **Access-control** — own-projects-only mutation (plan-mode per project rule); verify non-owner
  + admin paths.
- **Custom-domain guard** — verify a page with a live custom domain cannot be torn down.

## Acceptance criteria
- [ ] ••• menu Rename / Duplicate / Delete are live (un-greyed); Unpublish shows on published projects.
- [ ] Rename updates the title; Duplicate creates an independent unpublished draft (new token).
- [ ] Delete (any project, explicit confirm) removes it; deleting a published project also takes
      it down (KV + blob cleaned).
- [ ] Unpublish takes a live page down → stops serving, `publishState` = draft, KV + blob cleaned;
      re-publish works.
- [ ] A page with a custom domain **cannot** be unpublished/deleted — clear "remove domain first"
      message; no partial teardown.
- [ ] Every mutation enforces `assertProjectOwner`; non-owner blocked.
- [ ] No orphaned live pages / KV routes / blobs after delete or unpublish.
- [ ] `tsc`, `test:run`, `npm run build` green.

## Pilot / smallest slice
Slice 1 (blockers): unpublish/take-down + delete (with cascade + custom-domain guard) +
assertProjectOwner on mutations. Gate: a mispublished page can be taken down, a project deleted
cleanly, and a custom-domain page is safely blocked. Slice 2 (fold if cheap): rename + duplicate.

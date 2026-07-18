# work-library-board — implementation plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-library-board`
- **Branch:** `feature/work-library-board`
- **Spec:** `docs/task/work-library-board.spec.md` (tier: full)

## Overview

Build the project-scoped **"Your work"** dashboard board (`/dashboard/[token]/work`) where a work
customer manages photos as a grouped library — reusing E2's `CorrectionBoard` UI and the
testimonials-board page/route/authz shape. Source of truth is `brief.facts.work.groups` written
through the existing rail door (`applyRailEdit({field:'groups'})`), never a second persistence
path; a save-time deterministic resync rewrites ALL THREE group-reference surfaces in stored
content — gallery `groups[]` cards, chrome cards, and the `/works` catalog `items[]` — plus each
`/works/<slug>` item page's photos, so a republish reflects board edits. The gallery block already
renders group references in both renderers (`WorkGalleryGridCore` single-source) — no renderer
change needed; parity holds by construction.

## Progress log

- phase 1 facts foundation (hidden + slug): done (commit ea37f416, review loops 1)
- phase 2 pure resync module: done (commit 29520e75, review loops 1)
- phase 3 work-library API route: done (commit aebbdaa3, review loops 1) — HUMAN GATE c pending founder sign-off
- phase 4 board verbs + CorrectionBoard extension: done (commit 15ab32ba, review loops 1)
- phase 5 dashboard page + tab + client host: pending
- phase 6 manage-link re-point + Update site: pending
- phase 7 deterministic QA + founder pilot: pending

## Load-bearing design decisions (scout-confirmed)

1. **Facts own grouping.** Board reads/writes `brief.facts.work.groups` (WorkGroupSchema). NO
   MediaGroup table; `MediaAsset.groupId` stays dangling — do not build on it. MediaAsset remains
   the blob registry (t7) for new-photo ingestion + blur placeholders only.
2. **Hide-not-destroy = `hidden?: boolean` on `WorkPhotoRefSchema`.** Facts are loose JSON — no DB
   migration. Dashboard hide sets the flag (photo stays in facts, restorable in-place); onboarding's
   remove-from-array `hidePhoto` (D12) is untouched. `deriveWorksEntries` filters `hidden` at the
   single choke point so a hidden photo never reaches covers/entries/item pages.
   *Coherence note:* a dashboard-hidden photo reopened in onboarding's CorrectionBoard renders
   dimmed with a Restore affordance (PhotoThumb keys the dim/Restore branch off `photo.hidden`,
   not `hideBehavior` — phase-4 impl choice, clearer than the originally-predicted
   "normal-visible"). Onboarding never sets the flag itself, so today's onboarding is unchanged;
   not data-losing; accepted for beta.
3. **Stable group identity = `slug?: string` on `WorkGroupSchema`.** Seeded from `slugify(name)` on
   first board save; rename preserves it → the `/works/<slug>` item page + gallery `href` survive a
   rename (JOIN by stored slug, falling back to `slugify(name)` for pre-board facts — today's
   name→slug join in `workCollections.ts` stays valid for untouched projects).
4. **Save-time deterministic resync, renderers untouched.** The board's PUT persists facts AND
   rewrites stored `Project.content` — every group-reference surface: gallery `groups[]` cards
   (order/name/cover/href), chrome group cards, the `workcatalog` singleton's `items[]`
   (`{id,name,cover,href}`), and each item page's `workdetail` `photos[]` — in one transaction.
   AI copy fields are never touched. The dual renderers keep rendering frozen content →
   editor↔published parity is structural (`WorkGalleryGrid.core.tsx` is single-source;
   `.tsx`/`.published.tsx` both call it).
5. **Server-authoritative writes through the rail door.** The PUT route runs
   `applyRailEdit({field:'groups'}, storedBrief.facts)` server-side against FRESH stored facts
   (rail.ts is a pure zod module — server-safe). Full-facts re-emit + Zod pre-validation come free;
   avoids the wizard's stale-client-facts hazard.
6. **Republish = standard `POST /api/publish`** (explicit "Update site"). Publish takes the export
   payload from the request; the board handler builds it from `loadDraft` + the existing pure
   export helpers (`buildPagesForExport`/`materializeIntoPages` — `pageHelpers.ts` takes a plain
   state-shaped object). Fallback if those prove store-coupled: "Update site" deep-links to the
   existing `/preview/[token]` publish flow (still spec-consistent). **Both paths must not clobber
   the resynced `workcatalog.items[]`** — see phase 6 step 2 (export-sweep guard; pre-existing
   latent bug).
7. **Board eligibility = `works`-CAPABLE template, not `isWorkCopyTemplate`.** Per
   `src/modules/templates/templateMeta.ts`, live `atelier` declares
   `['gallery','packages','multipage']` — NO `works`; only `atelier2` (skeleton, the Kundius
   atelier-on-skeleton pilot) declares `works` + `capabilitySections.works:'workcatalog'`. The
   item-page fan-out + gallery `href` stamping only exist on works-capable projects, so the board
   (tab, page, API) gates on works-capability; `isWorkCopyTemplate` alone would admit live-`atelier`
   projects where the resync would half-work (no `page-<slug>` pages, bare hrefs). No such helper
   exists today (`serveGate.ts` inlines `capabilities.includes(...)`) → add a tiny pure
   `templateHasCapability(templateId, cap)` helper in `templateMeta.ts` (data-only leaf,
   server-safe). The resync module still degrades gracefully on non-works content (phase 2) as
   defense in depth.
8. **Scope-OUT enforced:** no add-group verb, no new-group→copy-gen, no page promotion, no
   per-photo URLs, no generic products board, no new image pipeline, no new designer screen.
   Template migration (live-`atelier` → skeleton) is also OUT — if the pilot project isn't
   works-capable at phase 7, that's a founder-gate finding, not this branch's work.

---

## Phase 1 — Facts foundation: `hidden` + `slug` + hidden-aware entries

**Steps**
1. `WorkPhotoRefSchema`: add `hidden: z.boolean().optional()`. `WorkGroupSchema`: add
   `slug: z.string().optional()` (doc-comment both: board-owned, additive-optional — pre-existing
   facts must keep parsing; never emit `hidden: false` / empty slug).
2. `rail.ts`: `WorkGroupInput` gains `slug?: string` (carried verbatim like `photos`/`items`);
   `normalizeWorkGroup` preserves a non-empty trimmed `slug`. No behavior change for callers that
   omit it.
3. `workCollections.ts` `deriveWorksEntries`: (a) drop `hidden: true` photo refs before cap/cover;
   (b) entry slug = `group.slug ?? slugify(group.name)` (JOIN-law comment updated). `pickCover`
   unchanged (operates on already-filtered photos → a hidden cover falls back to first visible).
4. **Single-choke-point guard:** prove `deriveWorksEntries` is the ONLY reader that filters
   `hidden` — grep every reader of `facts.work.groups[*].photos` (covers/chrome/catalog seeders:
   `stampWorkGalleryBinding`, `buildCollectionCatalogSlice` entry seeding, `multiPageAssembly`
   item seeding, chrome card builders) and confirm each consumes `deriveWorksEntries` output
   rather than walking raw facts photos. Encode as a test in `workCollections.test.ts`: a facts
   fixture with a hidden photo → entries/covers/catalog-seed inputs never contain it; plus a
   source-level assertion (grep-style, like `multiPageAssembly.test.ts`'s `not.toContain` pattern)
   that no other module reads `.work.groups` photos directly. Any direct reader found = re-point
   it at `deriveWorksEntries`, don't fork the filter.
5. Tests: schema round-trips (old facts parse; hidden/slug survive `applyRailEdit` groups re-emit);
   `deriveWorksEntries` filters hidden, keeps stable slug across a rename, cover falls back when
   the flagged cover is hidden.

**Files touched**
- `src/lib/schemas/workFacts.schema.ts`
- `src/modules/wizard/work/rail.ts`
- `src/modules/wizard/work/rail.test.ts`
- `src/modules/generation/workCollections.ts`
- `src/modules/generation/workCollections.test.ts`

**Verification:** `npx tsc --noEmit` + `npm run test:run` (rail, workCollections, existing wizard/
generation suites green — proves additive-optional held) + `npm run lint` + `npm run build`; grep
sweep from step 4 documented in the phase audit.

---

## Phase 2 — Pure resync module: facts → stored content

**Steps**
1. New pure module `src/modules/generation/workLibrarySync.ts` (zod/types only — no react, no
   stores, no prisma; mirrors `workCollections.ts` firewall):
   - `resyncWorkContent(storedContent, facts)` operating on the SAVED `Project.content` shape
     (root `content` + `pages` map + `chrome`, the same tree `stampWorkGalleryBinding` walks;
     validate the exact shape against the `kundiusPages`/`multiPageAssembly` fixtures).
   - **Rebuild** every `groups[]` card array in trees that carry one (gallery sections, chrome):
     cards derive from `deriveWorksEntries(facts)` — facts order = card order; name verbatim;
     `cover_image` = entry cover; `href` = `/works/<slug>` only when the item page exists (D7a
     guard kept). Preserve an existing card's `id` when its slug matches (E.List stability); new
     cards get fresh ids. This extends today's stamp-only behavior to add/remove/reorder/rename.
   - **Rebuild the `workcatalog` catalog `items[]`** (third group-reference surface): locate the
     works catalog singleton page (`collectionKey:'works'`, section type `workcatalog` — the page
     `buildCollectionCatalogSlice` seeded) and rewrite its `items[]` from the SAME
     `deriveWorksEntries(facts)` result: `{id,name,cover,href}` per entry, order = facts order,
     merged-away groups pruned, `id` preserved on slug match (same stability rule as cards). Keeps
     the `/works` index consistent with gallery + chrome after every save (AC: "reflects on every
     page showing that group").
   - **Rewrite item-page photos:** for each entry with `page-<slug>` in `pages`, set the
     `workdetail` section's `photos` field from `entry.photos` (same verbatim shape
     `multiPageAssembly` seeds — `VERBATIM_ITEM_FIELDS` contract; confirm exact photo item shape
     from the assembly seeding before writing).
   - **Prune** item pages whose group no longer exists in facts (merge removed it) — remove the
     page entry; leave every other page/copy field untouched. (Open question #1 confirms this.)
   - **Graceful degrade on non-works content** (defense in depth; primary guard is the
     works-capable eligibility check, decision 7): if the stored content has NO `page-<slug>` item
     pages and/or NO `workcatalog` section (e.g. a live-`atelier` project that slipped past a
     guard, or pre-fan-out content), rebuild only the surfaces that exist — gallery/chrome
     `groups[]` cards with name/cover/order but NO `href` (D7a: href only when the target page
     exists) — and skip item-page + catalog rewrites entirely. Never throw, never write bare/dead
     hrefs. Doc-comment this degrade path in the module header.
   - Idempotent; re-running with unchanged facts is a no-op diff.
2. Vitest: fixture-driven — rename keeps slug/href + updates card name AND catalog item; merge
   drops the absorbed card + catalog item + prunes its page + concatenates photos on the
   survivor's page; hide removes the photo from the item page + never from facts; reorder of facts
   reorders cards AND catalog items identically; catalog/gallery/chrome stay mutually consistent
   after every op; AI copy fields byte-identical before/after; idempotency; **degrade fixture**
   (atelier-shaped content, no pages/no workcatalog) → no crash, cards updated without hrefs,
   nothing else touched.

**Files touched**
- `src/modules/generation/workLibrarySync.ts` (new)
- `src/modules/generation/workLibrarySync.test.ts` (new)

**Verification:** `npx tsc --noEmit` + `npm run test:run` + `npm run lint` + `npm run build`.

---

## Phase 3 — API route: `GET`/`PUT /api/work-library` 🚩 HUMAN GATE

**Steps**
1. `templateMeta.ts`: add pure helper `templateHasCapability(templateId: string | null | undefined,
   cap: CapabilityId): boolean` (safe on unknown ids → false; data-only module stays a leaf).
   Unit-cover in `templateMeta.test.ts` (atelier2→works true; atelier→works false; unknown id
   false).
2. New route `src/app/api/work-library/route.ts` — clone the media/testimonials route skeleton:
   `runtime='nodejs'`, `dynamic='force-dynamic'`, `auth()` → 401, `validateToken`,
   `assertProjectOwner` (the `gate()` helper pattern from `src/app/api/media/route.ts`), Zod
   safeParse, `createSecureResponse`. 0 credits (no LLM). **Eligibility guard: reject projects
   whose template is not works-capable** — `templateHasCapability(project.templateId, 'works')`
   (NOT `isWorkCopyTemplate`; live `atelier` must be rejected — decision 7) → 400 with a plain
   "this project's template doesn't support the work library" error.
3. `GET ?tokenId=` → `{ groups: WorkGroupInput[], blurByUrl }` — groups from
   `getWorkFacts(project.brief.facts)` (slugs backfilled in the RESPONSE only — never persisted on
   read); `blurByUrl` from `MediaAsset` rows joined by `url` (`blurDataUrl`, hidden rows included
   — the board shows its own hidden state from facts, not `hiddenAt`).
4. `PUT { tokenId, groups }` → new Zod schema in `src/lib/schemas/workLibrary.schema.ts`
   (`WorkGroupInput`-shaped, caps: ≤24 photos/group belt, ≤150 total — reuse the E2 cap constants)
   → load FRESH stored brief → seed missing `slug`s (`slugify(name)`, de-duped) →
   `applyRailEdit({field:'groups', value}, storedFacts)` → on `ok`, `resyncWorkContent` on stored
   `Project.content` → single `prisma.$transaction` updating `brief` + `content`. `{ok:false}` →
   400 with the rail's error string.
5. Route tests (vitest, mocked prisma like existing route tests): authz denials (401/403/wrong
   owner), **non-works-capable template 400 (atelier fixture explicitly — the isWorkCopyTemplate
   trap)**, PUT round-trip persists hidden refs + resynced content (incl. catalog items), invalid
   groups rejected with nothing written.

**🚩 HUMAN GATE (spec gate c — hide-not-destroy):** before proceeding, demonstrate on a dev-DB work
project: hide a photo via PUT → `brief.facts.work.groups[..].photos[..]` still contains the ref
with `hidden:true`; `MediaAsset` row + blob untouched; a second PUT un-setting `hidden` restores
it on the pages. First phase that writes customer-shaped persisted data — founder sign-off.

**Files touched**
- `src/app/api/work-library/route.ts` (new)
- `src/app/api/work-library/route.test.ts` (new)
- `src/lib/schemas/workLibrary.schema.ts` (new)
- `src/modules/templates/templateMeta.ts`
- `src/modules/templates/templateMeta.test.ts`

**Verification:** route tests + `npx tsc --noEmit` + `npm run test:run` + `npm run lint` +
`npm run build`; manual dev-DB hide/restore proof for the gate.

---

## Phase 4 — Board verbs + CorrectionBoard additive extension

**Steps**
1. `correctionReducer.ts` — three ADDITIVE pure verbs (existing five untouched; onboarding
   behavior identical):
   - `setPhotoHidden(groups, groupIndex, photoId, hidden)` — flag toggle (dashboard hide/restore).
   - `reorderPhoto(groups, groupIndex, photoId, toPos)` — within-group order (spec "reorder").
   - `moveGroup(groups, fromIndex, toIndex)` — group order (drives gallery card order).
2. `CorrectionBoard.tsx` — optional props, all defaulting to today's behavior so `ShowWorkStep`
   needs zero changes:
   - `hideBehavior?: 'remove' | 'flag'` (default `'remove'`); in `'flag'` mode hidden photos render
     dimmed with a Restore affordance (uses `setPhotoHidden`), and hide never removes.
   - `onAddPhotos?: (groupIndex) => void` → renders a per-group "Add photos" button when supplied.
   - Within-group reorder dnd (wired to `reorderPhoto`) + a simple group up/down reorder
     affordance (wired to `moveGroup`) — enabled via an `enableOrdering?: boolean` prop if the
     onboarding surface shouldn't grow them (implementer keeps onboarding visually unchanged).
   - `hideHeader?: boolean` (dashboard supplies its own frame; hard-coded "Tidy up your groups"
     header suppressed).
3. Reducer tests for the three new verbs (no-op on bad indices/ids, immutability, cover survives a
   reorder, hidden flag round-trip).

**Files touched**
- `src/components/onboarding/journey/engines/work/correctionReducer.ts`
- `src/components/onboarding/journey/engines/work/correctionReducer.test.ts`
- `src/components/onboarding/journey/engines/work/CorrectionBoard.tsx`

**Verification:** `npx tsc --noEmit` + `npm run test:run` (new + existing correction tests; E2
onboarding suites untouched-green) + `npm run lint` + `npm run build`; quick manual dev check that
onboarding ShowWorkStep renders identically (default props).

---

## Phase 5 — Dashboard page + tab + client host ("Your work")

**Steps**
1. `src/app/dashboard/[token]/work/page.tsx` — Server Component cloned from the testimonials page:
   `force-dynamic`; calls `getWorkspaceProject(params.token)` ITSELF (layout is not an auth
   boundary — keep the C2/ownership comments pattern); reads `templateId` by primary key
   (ownership already asserted) and `notFound()` unless
   **`templateHasCapability(templateId, 'works')`** (same predicate as the API route — decision 7;
   NOT `isWorkCopyTemplate`). Renders heading **"Your work"** + buyer-words subcopy (never
   "collection"/"gallery") + the client host.
2. `src/components/dashboard/work/WorkLibraryClient.tsx` (new, `'use client'`):
   - Load via `GET /api/work-library?tokenId=` → `groups` + `blurByUrl`.
   - Mount `CorrectionBoard` with `hideBehavior='flag'`, `enableOrdering`, `hideHeader`,
     `onAddPhotos`, `onCommit` = `PUT /api/work-library` (full rebuilt array; surface the rail
     error string on failure; busy state during flight).
   - **Add photos:** file input → `POST /api/upload-image` (multipart, `tokenId`) — t7 pipeline
     free (resize/format/blur + MediaAsset row); response `{url, metadata.assetId, blurDataUrl}` →
     append `WorkPhotoRef {id: assetId, url}` to the target group → commit through the same
     funnel. Multi-file sequential; per-file error toasts.
   - "Update site" CTA slot (handler lands in phase 6; render disabled with a why-tooltip until
     then — greyed-placeholder rule).
3. Tab: `WorkspaceTabs.tsx` accepts `showWorkTab?: boolean`; inserts `{label: 'Your work',
   segment: 'work'}` after Overview when true. `[token]/layout.tsx` fetches `templateId`
   (chrome-data read, mirrors its existing pattern) and passes
   `templateHasCapability(templateId, 'works')` as the flag — the tab shows ONLY for
   works-capable projects (a live-`atelier` work project sees no tab). Otherwise: tab absent
   (route itself still 404s — the page is the guard).
4. Component test (vitest/jsdom): host maps GET payload → CorrectionBoard props; commit sends the
   full array; hide renders restore affordance.

**Files touched**
- `src/app/dashboard/[token]/work/page.tsx` (new)
- `src/components/dashboard/work/WorkLibraryClient.tsx` (new)
- `src/components/dashboard/work/WorkLibraryClient.test.tsx` (new)
- `src/components/dashboard/WorkspaceTabs.tsx`
- `src/app/dashboard/[token]/layout.tsx`

**Verification:** `npx tsc --noEmit` + `npm run test:run` + `npm run lint` + `npm run build`;
manual dev: board loads a works-capable project's real groups, all verbs round-trip through PUT,
tab shows only on works-capable projects (verify absent on a live-`atelier` project), non-owner
404s.

---

## Phase 6 — Gallery manage-link re-point + "Update site" 🚩 HUMAN GATE

**Steps**
1. `WorkGalleryGrid.tsx` (EDIT wrapper only — `.core`/`.published` untouched): replace the
   `WORK_LIBRARY_BOARD_HREF = '/dashboard/library'` placeholder with the real board target —
   `/dashboard/${tokenId}/work`, tokenId read from the edit store (selector, one-shot read is
   fine). Keep the export (or convert to `workLibraryBoardHref(tokenId)`) so `manageSlot` stays
   edit-only; published output byte-identical.
2. **Export-sweep guard — the resynced catalog must survive publish (FIX, pre-existing latent
   bug):** `buildPagesForExport` (`pageHelpers.ts` ~L189) runs
   `materializeIntoPages(pages, key)` for every collection key found in pages — and works item
   pages DO carry `collectionKey:'works'` (`multiPageAssembly.ts` stamps `kind:'collectionItem'`
   + `collectionKey` on the fan-out pages), so the sweep re-derives `workcatalog.items[]` via
   `cardFromEntry` (`collectionHelpers.ts` L62), which reads `rec.images` — but `workdetail`
   records carry `photos`, and the written shape is `CatalogCard`
   (`{id,model,name,oneLiner,image,…}`), not WorkCatalog's `{id,name,cover,href}`. Result:
   blank-cover, wrong-shaped catalog cards. **This is PRE-EXISTING** (bites ANY editor
   save/publish of a works project today, independent of this feature — both the board's primary
   publish path AND the `/preview` fallback funnel through `buildPagesForExport`), and it would
   clobber the board's server-side resync, which is now authoritative for `workcatalog.items[]`.
   Fix via a **`catalogItemsAuthoritative` (works)** def-flag checked at BOTH `materializeCatalogItems`
   call sites in `collectionHelpers.ts` — `materializeIntoPages` (export/publish path, L~145) AND
   its twin `syncCollection` (live-editor `commitActivePage` path, L~138). Skip re-derivation for
   the `works` collection at both: its catalog `items[]` are seeded by `buildCollectionCatalogSlice`
   (D13) and maintained by `resyncWorkContent`; doc-comment why. Do NOT try to teach `cardFromEntry`
   the works shape in this branch. **Why both call sites (reviewer #1/#2):** `syncCollection('works')`
   is the identical twin — it clobbers stored `workcatalog.items[]` with the same blank-cover /
   wrong-shape corruption on live-editor collection ops (page switch / record edit), independent of
   publish. It does NOT fire on either republish path (export runs `buildPagesForExport` without
   `commitActivePage`, verified), so the board flow is correct even guarding only the export site —
   but one shared def-flag closes the export path AND neutralizes the pre-existing live-editor
   corruption for free (strictly better, cheap). Regression test: works-shaped pages fixture through
   `buildPagesForExport` → `workcatalog.items[]` byte-identical; products/services/case-studies
   collections still re-materialize at both sites.
3. "Update site" in `WorkLibraryClient.tsx`: handler builds the publish payload from
   `GET /api/loadDraft` + the pure export helpers (`buildPagesForExport` +
   `materializeIntoPages`/`materializeHomeTeasers` from `pageHelpers.ts`/`collectionHelpers.ts` —
   both take plain objects) and `POST /api/publish` with the project's existing slug/title
   (unpublished project → CTA reads "Publish from the editor first", greyed + tooltip).
   **Expectation check:** this primary path is LIKELY dead-on-arrival — `buildPagesForExport`
   consumes the EDITOR-STORE state shape, not the `loadDraft` response shape; budget for the
   fallback rather than building an adapter. **Fallback (pre-agreed, ruling #2):** the CTA
   deep-links to `/preview/[token]`'s publish flow instead — no half-built third path. The step-2
   guard makes the fallback safe too (preview publish also runs the export sweep).
4. Small pure helper `src/lib/workLibrary/publishFromDraft.ts` (new) so the payload assembly is
   unit-testable outside the component (skipped if the fallback is taken — then the CTA is a plain
   link and this file + its test drop out of the phase).
5. Tests: helper unit test (draft fixture → PublishSchema-valid payload) — or, on fallback, a
   host test that the CTA links to `/preview/[token]`; published-renderer snapshot unchanged for
   the gallery (no `manageSlot` leakage); step-2 regression test.

**🚩 HUMAN GATE (spec gate b — published rendering):** the resync + republish path now changes
LIVE published output. Founder sign-off on a dev/staging works-capable project: board edit
(rename + cover + hide + move + reorder) → Update site → live pages reflect it — gallery, chrome,
**`/works` catalog index**, and `/works/<slug>` pages; visual + editor↔published parity check
before phase 7.

**Files touched**
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.tsx`
- `src/components/dashboard/work/WorkLibraryClient.tsx`
- `src/hooks/editStore/collectionHelpers.ts`
- `src/hooks/editStore/collectionHelpers.works.test.ts` (new)
- `src/lib/workLibrary/publishFromDraft.ts` (new; dropped if fallback path taken)
- `src/lib/workLibrary/publishFromDraft.test.ts` (new; dropped if fallback path taken)

**Verification:** `npx tsc --noEmit` + `npm run test:run` (incl. the works-catalog export-guard
regression + existing collection/homeTeasers suites green) + `npm run lint` + `npm run build`;
manual publish round-trip for the gate.

---

## Phase 7 — Deterministic QA + founder pilot 🚩 HUMAN GATE

**Steps**
1. **Pilot pre-check (BEFORE the founder walkthrough):** confirm Kundius's project is board-ready —
   (a) its `templateId` is works-capable (`templateHasCapability(templateId,'works')` — i.e. on
   `atelier2`/the skeleton, per the atelier-on-skeleton pilot), AND (b) its stored
   `Project.content` already contains `page-<slug>` item pages + group-reference gallery cards +
   the `workcatalog` singleton. If either fails, STOP and report it as a founder-gate finding —
   template migration to the skeleton is OUT OF SCOPE for this branch (decision 8); the gate
   cannot pass on a live-`atelier` project (no item pages to reflect edits on).
2. **Playwright** `e2e/work-library.spec.ts` (authed, `auth.setup.ts` pattern from
   `publish.spec.ts`; seeded works-capable project): board loads groups → rename → hide (photo
   dims, Restore appears) → restore → move between groups → reorder → pick cover → save → reload →
   everything persisted (CRUD round-trip AC). Assert with mutation, not endpoint-only checks
   (inert-assertion lesson).
3. **Vitest parity/render**: extend `src/modules/skeletons/work/galleryGroups.test.tsx` — both
   renderers render the group-reference cards from identical content (name/cover/href), hidden
   photo absent from resynced item-page/gallery output, `manageSlot` absent in published. Extend
   `workDetailPhotos.test.tsx` for the resynced `photos[]` write. Catalog-consistency assertion:
   resynced content renders matching cards on gallery AND `workcatalog` (WorkCatalog block) from
   one fixture. (Group-reference-render AC.)
4. Full re-green sweep: `tsc` + `test:run` + `build` + `lint` + `test:e2e` (mock mode).
5. Docs touch-up: `src/modules/collections/README.md` note pointing the works flow at the board
   (+ the works catalog-authority rule from phase 6 step 2); spec AC checklist ticked in the spec
   file is NOT done here (orchestrator owns artifacts).

**🚩 HUMAN GATE (spec gate a — founder pilot verify, the decision gate):** on Kundius's project —
pre-check from step 1 passed; board shows her real groups (Weddings/Portraits…); founder adds a
photo (t7), moves one, hides one, picks a cover → Update site → her live gallery + `/works` index
+ `/works/<slug>` pages reflect it. Merge to main is the standard human gate after this passes.

**Files touched**
- `e2e/work-library.spec.ts` (new)
- `src/modules/skeletons/work/galleryGroups.test.tsx`
- `src/modules/skeletons/work/workDetailPhotos.test.tsx`
- `src/modules/collections/README.md`

**Verification:** `npm run test:e2e` (new spec green) + full `tsc`/`test:run`/`build`/`lint`;
pilot pre-check documented; founder pilot walkthrough.

---

## Unresolved questions — RESOLVED (orchestrator rulings, 2026-07-18)

1. **Merge prunes the absorbed group's `/works/<slug>` page** → old URL 404s after republish.
   **RULING: OK for beta** — no redirect infra in scope.
2. **"Update site" primary path** = direct publish from board via loadDraft + pure export helpers;
   fallback = deep-link to preview publish. **RULING: fallback PRE-APPROVED** — use primary if the
   export helpers are server-safe/pure, else the deep-link fallback; no half-built third path.
   (Plan-review addendum: primary likely DOA on shape mismatch — see phase 6 step 3; the
   pre-approved fallback stands.)
3. **Group reorder** (moveGroup verb, gallery card order). **RULING: KEEP** in beta scope (cheap,
   drives user-visible card order).
4. **Concurrent editor-open race**: editor saveDraft after a board save can overwrite resynced
   content until next board save. **RULING: ACCEPT for beta** — board is the management door by design.
5. **Tab placement**: "Your work" right after Overview, work-engine projects only. **RULING:
   CONFIRMED.** (Narrowed by review blocker 1: shown for works-CAPABLE projects — atelier2/skeleton
   — not all `isWorkCopyTemplate` projects.)
6. Chrome header `/works/<slug>` links on a pruned/renamed group — resync updates group CARDS in
   chrome; plain nav links (non-card) unaffected. **RULING: ACCEPTABLE for beta.**

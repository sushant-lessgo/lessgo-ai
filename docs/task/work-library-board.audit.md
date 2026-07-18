# work-library-board — implementation audit

## Phase 1 — Facts foundation: `hidden` + `slug` + hidden-aware entries

**Files changed**
- `src/lib/schemas/workFacts.schema.ts`
- `src/modules/wizard/work/rail.ts`
- `src/modules/wizard/work/rail.test.ts`
- `src/modules/generation/workCollections.ts`
- `src/modules/generation/workCollections.test.ts`

### Per-file changes

**`src/lib/schemas/workFacts.schema.ts`**
- `WorkPhotoRefSchema`: added `hidden: z.boolean().optional()` with a board-owned / additive-optional doc-comment (hide-not-destroy; never emit `hidden:false`; filtered at the `deriveWorksEntries` choke point).
- `WorkGroupSchema`: added `slug: z.string().optional()` with a doc-comment (stable group identity seeded from `slugify(name)`, preserved across a rename; pre-board facts fall back to name→slug; never emit an empty slug).
- Both are additive-optional — pre-existing facts that omit them still parse (z.object strips unknown keys, so the fields had to be declared to survive a re-emit).

**`src/modules/wizard/work/rail.ts`**
- `WorkGroupInput`: added `slug?: string`, carried verbatim like `photos`/`items` (doc-commented). Callers omitting it see no behavior change.
- `normalizeWorkGroup`: preserves a non-empty trimmed `slug`; blank/absent stays ABSENT (never `{slug:''}`), so pre-board facts still fall back to name→slug. No other logic changed.

**`src/modules/generation/workCollections.ts`**
- `deriveWorksEntries`: (a) drops `hidden:true` photo refs FIRST (`.filter(p => !p?.hidden)`) before the url-drop + 24-cap; (b) entry slug is now `group.slug ?? slugify(group.name)` (trimmed). `pickCover`/`toEntryPhoto`/`stampWorkGalleryBinding` unchanged — since the hidden refs are already gone from the entry photos, a hidden cover falls back to the first visible photo for free.
- Updated the module header JOIN LAW comment to describe the stable-slug join and added a HIDE LAW note documenting that `deriveWorksEntries` is the single hide-filter choke point.

**`src/modules/wizard/work/rail.test.ts`**
- New `describe('board-owned fields — slug + hidden ...')`: legacy facts (no slug/hidden) parse non-null and don't sprout the keys; `normalizeWorkGroup` preserves a trimmed slug and omits blank/absent; `normalizeWorkGroup` carries hidden refs verbatim; `applyRailEdit({field:'groups'})` re-emits both `slug` and `hidden` through the Zod gate.

**`src/modules/generation/workCollections.test.ts`**
- New `describe('deriveWorksEntries — hide-not-destroy filter ...')`: hidden refs dropped before cap/cover; cover falls back when the flagged cover is hidden; a hidden photo URL never appears in the JSON of gallery-stamp + `buildCollectionCatalogSlice` + `buildCollectionItemSlice` output (all three seeded from the SAME `deriveWorksEntries` result); a source-level guard reading `multiPageAssembly.ts` and `archetypes.ts` asserting neither contains the word `hidden` (the filter lives only at the choke point).
- New `describe('deriveWorksEntries — stable slug ...')`: `group.slug` wins over `slugify(name)` so a rename keeps the `/works/<slug>` join; pre-board facts fall back to `slugify(name)`.

### Single-choke-point grep result

Confirmed `deriveWorksEntries` is the ONLY reader that turns raw `facts.work.groups[*].photos` into render-surface inputs. Readers checked:
- **`stampWorkGalleryBinding`** (workCollections.ts) — consumes `CollectionEntry[]` (deriveWorksEntries output), not raw facts. OK.
- **`buildCollectionCatalogSlice`** (`src/hooks/editStore/archetypes.ts`) — takes `entries: CollectionEntry[]`. OK.
- **`buildCollectionItemSlice` / `multiPageAssembly` item seeding** — take `CollectionEntry`/`CollectionEntry[]`; `runWorksFanOut` (work.llm.ts) derives entries via `deriveWorksEntries(getWorkFacts(...))` (or persisted `onboardingData.collections.works` which is itself deriveWorksEntries output). OK.
- **Chrome card builders** — `stampWorkGalleryBinding` also stamps chrome header/footer trees, same entries. OK.
- `grep 'hidden'` in `multiPageAssembly.ts` and `archetypes.ts` → 0 occurrences (encoded as the source-guard test).

No direct raw-photos reader was found → **no re-pointing needed**. One non-render-surface reader noted and intentionally left alone: `buildWorkLibrary` (`src/modules/audience/work/workLibrary.ts`) reads `g.photos?.length` to tell the AI how many cards to write — a generation-time prompt COUNT, not a live-render surface, and not on the board-save resync path. Filtering hidden there is out of Phase 1 scope (the board never regenerates copy) and was left untouched.

### Deviations from the plan
None. (In-scope judgment call: the source-guard test targets `multiPageAssembly.ts` + `archetypes.ts` — the two render-surface seeder modules with the `not.toContain('hidden')` pattern the plan referenced — rather than every file, since those two are the item/catalog seeders enumerated in the plan.)

### Verification (all green, run in WORKDIR)
- `npx tsc --noEmit` → exit 0 (clean). Note: a first run surfaced a phantom `TS2307 @/assets/images/founder.jpg` from an empty `next-env.d.ts`; `npm run build` regenerated it and the re-run is clean. Pre-existing environment artifact, unrelated to touched files.
- `npm run test:run` → 246 passed | 1 skipped test files; 4190 passed | 18 skipped tests. Targeted suites: 55 passed (workCollections + rail).
- `npm run lint` → exit 0; only pre-existing warnings in untouched files (`<img>` LCP, one exhaustive-deps). Touched files lint clean.
- `npm run build` → success (build:published-css → build:assets → next build all green).

### Open risks
- `buildWorkLibrary` counts hidden photos in the AI card-count hint. Harmless for this feature (board doesn't regen copy); flagged only for completeness.
- Coherence note (per plan decision #2): a dashboard-hidden photo reopened in onboarding's default remove-mode CorrectionBoard renders visible while still filtered off the live site — accepted for beta, no Phase 1 code impact.

---

## Phase 2 — Pure resync module: facts → stored content

**Files changed**
- `src/modules/generation/workLibrarySync.ts` (new)
- `src/modules/generation/workLibrarySync.test.ts` (new)

### `resyncWorkContent(storedContent, facts)` — behavior per surface

Pure leaf module (zod/plain-types only — no react/store/prisma/template imports; mirrors `workCollections.ts`). Deep-clones the input via `structuredClone` (input never mutated; Date fields like `forms.createdAt` survive), derives entries once with `deriveWorksEntries(facts)` (phase 1 — hidden-filtered, stable-slug), then rebuilds each group-reference surface. Facts are read-only; AI copy fields are never read or written.

1. **Gallery + chrome cards** — `forEachGallerySection` walks the SAME trees `stampWorkGalleryBinding` does (`fc.content`, every `fc.pages[*].content`, `fc.chrome.header.data`, `fc.chrome.footer.data`) and rebuilds any section carrying `elements.groups[]`. Each card `{id,name,cover_image,href}` (frozen gallery contract); `href = /works/<slug>` only when `page-<slug>` exists (D7a guard kept); id reused when an existing card's slug matches (slug read from its `/works/<slug>` href, fallback `slugify(name)`), else fresh. `cover_image` is ALWAYS set to the entry cover (incl. `''`) so a hidden cover is cleared, not resurrected.
2. **`workcatalog` items[]** — `findWorkCatalogSection` locates the section of type `workcatalog` inside a `collectionKey:'works'` page; `items[]` rebuilt `{id,name,cover,href}` from the SAME entries with the same order/prune/id-stability + D7a rules. Skipped (no-op) when no such section exists.
3. **Item-page `workdetail` photos[]** — for each entry with a `page-<slug>` page, the `workdetail` section's `photos` is set from `entry.photos`, mapped to `{id,url,alt,cover}` (id `p.id ?? fresh`, alt `''`, cover `false` defaults).
4. **Prune** — `works` `collectionItem` pages (`page-<slug>`) whose slug is no longer an entry are deleted (merge absorbed the group). Only `works` collectionItem pages are touched; every other page/copy field untouched.

### Stored-content / photo shapes matched (confirmation sources)

- **Gallery card `{id,name,cover_image,href}`** — confirmed against `stampWorkGalleryBinding` (`workCollections.ts`, stamps `cover_image`/`href` on `elements.groups[]`) and `galleryGroups.test.tsx` (card contract). `href = /works/<slug>` shape from the same D7a stamp.
- **Catalog item `{id,name,cover,href}`** — confirmed against `buildCollectionCatalogSlice`'s `works` branch (`src/hooks/editStore/archetypes.ts` L528-536): `{id: rid('it'), name, cover: worksEntryCover(e), href: basePath + '/' + slug}`. `worksEntryCover` = `(photos.find(cover) ?? photos[0])?.url ?? ''` (mirrored as local `pickCover`).
- **Workdetail photo `{id,url,alt,cover}`** — confirmed against `buildCollectionItemSlice`'s `works` branch (`archetypes.ts` L572-578): `{id: p.id ?? rid('ph'), url: p.url, alt: p.alt ?? '', cover: p.cover ?? false}`, plus `workDetailPhotos.test.tsx` (photo grid render). `photos` is a `VERBATIM_ITEM_FIELDS` member (`multiPageAssembly.ts` L305).
- **Page topology** (`collectionKey:'works'`, `kind:'singleton'|'collectionItem'`, key `page-<slug>`, section type via `sec.type ?? sid.split('-')[0]`) — confirmed against `assembleCollectionPages` (`multiPageAssembly.ts` L351-398) and `mergeCollectionItemCopy`'s type resolution. Registry (`collections/registry.ts`) confirms works `catalogSectionType:'workcatalog'`, `itemSectionType:'workdetail'`, `basePath:'/works'`.
- The five-page `kundiusPages.test.tsx` fixture (home/work/prices/about/contact) confirmed the `work` gallery section carries `elements.groups` and chrome wraps header/footer as `{data:{elements:{...}}}`.

### Graceful degrade path (decision #7)

All four steps are natural no-ops on non-works content: no `workcatalog` section ⇒ catalog rewrite skipped; no `page-<slug>` pages ⇒ item-page rewrites skipped + `hasItemPage` false ⇒ cards get NO href (D7a); no `works` collectionItem pages ⇒ prune finds nothing. So an atelier-shaped tree (gallery cards, no pages/no catalog) has only its cards rebuilt (name+cover+order, no href), nothing else written, and never throws. Documented in the module header.

### In-scope judgment call (logged per rules)

`cover_image`/`cover` are set unconditionally from the entry cover (including `''`) rather than following `stampTree`'s "preserve on empty". Rationale: if a group's only visible cover is hidden, the entry cover becomes `''`; preserving the old value would resurrect a hidden photo as the cover, violating the load-bearing hide-not-destroy invariant. Blanking is the conservative choice for the hide law; a group that legitimately has no photos shows no cover (board is now authoritative for covers).

### Tests (`workLibrarySync.test.ts`, 11 tests)

unchanged-facts id-stable no-op · rename (name updated, slug/href/id preserved, page kept, catalog + chrome mirror) · merge (absorbed card + catalog item dropped, page pruned, photos concatenated on survivor) · hide (photo gone from item page + gallery cover falls back + catalog cover falls back + facts byte-identical) · reorder (gallery + catalog + chrome reorder identically, ids follow) · mutual consistency across gallery/chrome/catalog · AI copy byte-identical (hero + workdetail connective copy) + input never mutated · idempotency (rename+hide) · graceful degrade (cards rebuilt without href, no pages written, no throw) + degrade idempotency.

### Deviations from the plan
None (beyond the in-scope cover-blanking judgment call logged above).

### Verification (all green, run in WORKDIR)
- `npx tsc --noEmit` → exit 0, clean.
- `npm run test:run` → 247 passed | 1 skipped files; 4201 passed | 18 skipped tests (was 4190 in phase 1 — +11 new). New file: 11/11 pass.
- `npm run lint` → exit 0; only pre-existing `<img>`/exhaustive-deps warnings in untouched files. New files lint clean.
- `npm run build` → success (build:published-css → build:assets → next build all green).

### Open risks
- Republish paths (`buildPagesForExport` / `syncCollection`) can still clobber the resynced `workcatalog.items[]` via `cardFromEntry` — the pre-existing latent bug the plan flags for phase 6 step 2. Out of phase 2 scope; the resync is authoritative only until an export sweep runs, which phase 6 fixes.
- If `resyncWorkContent` is ever called with empty/null facts, every gallery surface is emptied (facts = source of truth). Not reachable via the board (no delete-all-groups verb; the route always passes validated stored facts), so left faithful rather than special-cased.

---

## Phase 3 — API route: `GET`/`PUT /api/work-library` (+ capability helper + schema)

**Files changed**
- `src/modules/templates/templateMeta.ts` (added `templateHasCapability` helper)
- `src/modules/templates/templateMeta.test.ts` (added `templateHasCapability` tests)
- `src/lib/schemas/workLibrary.schema.ts` (new — PUT body Zod schema)
- `src/app/api/work-library/route.ts` (new — GET/PUT route)
- `src/app/api/work-library/route.test.ts` (new — mocked-prisma route tests)

### Per-file changes

**`src/modules/templates/templateMeta.ts`**
- Added pure, data-only `templateHasCapability(templateId, cap): boolean`. Unknown/null/undefined ids to `false`; reads `meta.capabilities.includes(cap)`. No new non-type imports (`CapabilityId` was already imported as a type). Leaf-module invariant preserved.

**`src/modules/templates/templateMeta.test.ts`**
- Added a `templateHasCapability` describe block: `atelier2 to 'works'` true; `atelier to 'works'` false (the isWorkCopyTemplate trap — atelier declares gallery/packages/multipage, NOT works); unknown/null/undefined to false; plus a generic probe (`meridian to 'lead-form'` true, `meridian to 'works'` false).

**`src/lib/schemas/workLibrary.schema.ts`** (new)
- `WorkLibraryPutSchema = { tokenId: string.min(1), groups: GroupInput[] }`. `GroupInput` mirrors `WorkGroupInput` (name required; kind/price/photos/items/slug optional; PhotoRefInput carries `hidden`). Caps REUSE the E2 constants `PHOTOS_PER_GROUP_CAP` (24) / `PHOTOS_TOTAL_CAP` (150) imported from `src/modules/wizard/work/ingest/proposeGroups.ts` — per-group cap via `photos.max(24)`, total cap via a `superRefine`. Documented as a first-gate BELT; `applyRailEdit` to `WorkFactsSchema` remains the authoritative server gate.

**`src/app/api/work-library/route.ts`** (new)
- `runtime='nodejs'`, `dynamic='force-dynamic'`, 0 credits.
- Authz: cloned the `/api/media` `gate()` helper verbatim — `auth()` to 401, `validateToken` to 400, `assertProjectOwner` to its status. Owner derived server-side; no body `userId` is read.
- Eligibility (decision 7): after the gate, loads the project and rejects `!templateHasCapability(project.templateId, 'works')` with 400 ("This project's template doesn't support the work library") — NOT `isWorkCopyTemplate`, so a live-`atelier` project is rejected even though it runs the work engine.
- GET `?tokenId=` returns `{ groups, blurByUrl }`. `groups` from `getWorkFacts(project.brief.facts).groups` with slugs backfilled in the response only (`withResponseSlugs`, never persisted). `blurByUrl` = `MediaAsset` rows for the token joined by `url` to `blurDataUrl` (hidden rows included; null blur skipped).
- PUT `{ tokenId, groups }`: Zod safeParse (400 before any DB read) to gate to load FRESH project to eligibility to seed missing slugs (`slugify(name)`, de-duped, existing slugs preserved) to `applyRailEdit({field:'groups', value:seeded}, storedFacts)` (pure rail door). `{ok:false}` to 400 with the rail error string, nothing written. On `ok`: `resyncWorkContent(project.content.finalContent, getWorkFacts(result.facts))`, then a single `prisma.$transaction([...])` updating BOTH `brief` (facts re-emit) and `content` (`{...stored, finalContent: resynced}`).

**Transaction shape:** `await prisma.$transaction([ prisma.project.update({ where:{tokenId}, data:{ brief, content } }) ])` — one atomic update of both JSON columns; a partial write is impossible.

**Cap constant reused:** `PHOTOS_PER_GROUP_CAP` (24) + `PHOTOS_TOTAL_CAP` (150) from `src/modules/wizard/work/ingest/proposeGroups.ts` (the E2/D11 constants) — no fresh numbers hardcoded.

**Content-shape note:** `Project.content` is the `{ onboarding, finalContent, ... }` wrapper (`loadDraft`/`saveDraft`); the resync operates on `finalContent` (the page-data tree `content`/`pages`/`chrome` that phase 2 targets), and the result is written back into `content.finalContent` with the wrapper preserved via spread.

**`src/app/api/work-library/route.test.ts`** (new)
- Mocks the module boundaries only (`@clerk/nextjs/server` auth, `@/lib/security`, `@/lib/prisma`); the pure core runs FOR REAL, so the PUT round-trip pins the true facts to content transform, not a re-stated mock.
- Tests (13): 401 no-auth; 403 wrong-owner (GET + PUT, nothing written); 400 missing tokenId; ownership asserted with clerk id + action; live-`atelier` fixture to 400 on GET and PUT (nothing written) (the isWorkCopyTemplate trap); 404 project-not-found; GET payload (slugs backfilled, `blurByUrl` hidden-included/null-skipped); GET slug backfill is response-only (no write); PUT round-trip persists `hidden:true` ref in facts + resynced catalog items + resynced item-page photos in ONE transaction, wrapper key + AI copy preserved; restore (hidden unset) round-trips the photo back; rail-rejected blank-name groups to 400 + no write; schema-invalid body to 400 before any read/write; over-total-cap to 400 + no write.

### Deviations from the plan
- None. (The route returns the seeded groups alongside `{success:true}` on PUT so the client can adopt the server-assigned slugs — additive, no plan conflict.)

### Verification results
- `npx tsc --noEmit` — clean (no output).
- `npm run test:run` — 248 passed | 1 skipped (249 files); 4220 passed | 18 skipped tests. New: 29 pass across the two touched test files (13 route + 16 templateMeta incl. 4 new).
- `npm run lint` — no errors on any touched file (only pre-existing `<img>`/exhaustive-deps warnings elsewhere).
- `npm run build` — success; `/api/work-library/route.js` present in `.next/server/app/api/work-library/`.

### HUMAN-GATE PROOF STEPS (spec gate c — hide-not-destroy)

Run on a dev-DB works-capable project (`templateId: atelier2`) that already has `page-<slug>` item pages + a `workcatalog` singleton (e.g. Kundius's seeded project). Let `TOKEN` be its tokenId; be signed in as the owner in the session used for the request. Minimal API-only proof:

1. Read baseline (before): `GET /api/work-library?tokenId=TOKEN`. Note a target group + a `photo.id` under it (call it `PID`), and its `blurByUrl` entry.
2. Confirm the MediaAsset row + blob for that url are present (and stay untouched later). DB shell: `SELECT id, url, "blurDataUrl", "hiddenAt" FROM "MediaAsset" WHERE "tokenId" = 'TOKEN' AND url = '<PID url>';`. Record the row id + `hiddenAt` (null). The blob is the `url` itself.
3. Hide via PUT — send the FULL groups array from step 1 with `hidden:true` added to the `PID` photo: `PUT /api/work-library { "tokenId":"TOKEN", "groups":[ ...groups, that one photo set hidden:true ] }`. Expect `200 {success:true}`.
4. Assert facts KEPT the ref, flagged hidden (NOT destroyed): `SELECT brief->'facts'->'work'->'groups' FROM "Project" WHERE "tokenId" = 'TOKEN';`. The `PID` photo object is STILL in the array, now with `"hidden": true`.
5. Assert MediaAsset row + blob untouched: re-run the step-2 query — same row id, `hiddenAt` STILL null, `url`/`blurDataUrl` unchanged (the board's hide never calls `/api/media` DELETE). Loading the live `/works/<slug>` page shows the photo gone from the rendered pages (resynced `content` dropped it) while the source ref/blob persist.
6. Restore via a second PUT — resend the same array with `hidden` removed: `PUT /api/work-library { "tokenId":"TOKEN", "groups":[ ...same groups, PID photo NOT hidden ] }`. Expect `200`. Re-query facts (step 4): the `PID` photo has NO `hidden` flag again; reload `/works/<slug>`: the photo is back. MediaAsset row still untouched throughout.

**Pass criterion:** the photo ref survives in `brief.facts.work.groups` across hide to restore (only the `hidden` flag toggles), the `MediaAsset` row + blob are never modified, and the live pages reflect hide/restore via the resynced `content`.

---

# Phase 4 — Board verbs + CorrectionBoard additive extension

**Files changed**
- `src/components/onboarding/journey/engines/work/correctionReducer.ts` (added 3 verbs)
- `src/components/onboarding/journey/engines/work/correctionReducer.test.ts` (added tests)
- `src/components/onboarding/journey/engines/work/CorrectionBoard.tsx` (added optional props)

## correctionReducer.ts — three ADDITIVE pure verbs

Existing five (`renameGroup`, `mergeGroups`, `movePhoto`, `hidePhoto`, `pickCover`) untouched.
Same purity contract (fresh arrays, no input mutation, no-op → return input ref on bad
index/id). All fit the existing `WorkGroupInput`/`Photo` types (`hidden?` added in phase 1).

1. `setPhotoHidden(groups, groupIndex, photoId, hidden)` — flag toggle; the photo STAYS in
   `photos[]` (unlike onboarding's remove-from-array `hidePhoto`).
   - **RESTORE = remove-key, NOT `hidden:false`.** `withHidden(p,false)` deletes the `hidden`
     key entirely; `withHidden(p,true)` sets `{...p, hidden:true}`. This matches how
     `deriveWorksEntries` reads the flag (`workCollections.ts` L87: `.filter((p) => !p?.hidden)`)
     and the phase-1 "never emit `hidden:false`" decision — confirmed by reading the reader.
   - Extra no-op guard: if the target photo's flag already equals the requested state, the input
     array reference is returned unchanged (keeps the board's optimistic `drive()` no-op path,
     and is consistent with the other verbs' identity-on-no-op style). Other flags (cover)
     survive the toggle.
2. `reorderPhoto(groups, groupIndex, photoId, toPos)` — within-group reorder; array length
   unchanged. `toPos` is CLAMPED to `[0, len-1]` (over/under-shoot lands at the edge, never
   drops the photo). Cover/hidden flags ride on the photo ref, untouched. No-op on bad
   group/photo or a move to the current position.
3. `moveGroup(groups, fromIndex, toIndex)` — reorders the groups array (drives gallery/catalog
   card order). No-op on out-of-range index or same position. Each group's photos ride along.

## CorrectionBoard.tsx — optional props, all default to today's behavior

Additive-only. `ShowWorkStep` (NOT in files-touched) passes ONLY `groups`/`blurByUrl`/`onCommit`/
`busy` (verified at `ShowWorkStep.tsx` L345-351) → every new prop takes its default → onboarding
renders identically.

- `hideBehavior?: 'remove' | 'flag'` (default `'remove'`). Default → hide calls `hidePhoto`
  (remove-from-array, D12) EXACTLY as today. `'flag'` → hide calls `setPhotoHidden(...,true)`;
  hidden photos render dimmed (opacity 0.4) with a Restore button wired to
  `setPhotoHidden(...,false)`. The dimmed/Restore branch keys off `photo.hidden`, which is only
  ever set in flag mode → never triggers in onboarding.
- `onAddPhotos?: (groupIndex) => void` — renders a per-group "Add photos" button ONLY when
  supplied. Absent in onboarding → no button.
- `enableOrdering?: boolean` (default `false`). Off → photo drop-targets are `useDroppable({disabled:true})`
  (only cross-group moves fire, exactly as today) and no group up/down affordance renders.
  On → within-group reorder dnd (drop a photo onto another photo → `reorderPhoto`; cross-group
  drop onto a photo → `movePhoto`) + group up/down buttons wired to `moveGroup`.
- `hideHeader?: boolean` — suppresses ONLY the hard-coded "Tidy up your groups" `<p>`; the Merge
  button + its flex row stay (dashboard still needs merge). Default → header shown.

### How onboarding stays identical (verified)
- All four new props default to today's behavior; `ShowWorkStep` passes none of them.
- Photo `useDroppable` is `disabled: !enableOrdering` → in onboarding photos are NOT drop targets,
  so `onDragEnd` only ever hits the cross-group `movePhoto` branch (`to.kind === 'photo'` is
  gated by `enableOrdering`).
- Base thumbnail className recomposed to include an `isOver` border, but with ordering off
  `isOver` is always false → resolves to the original `border border-app-hairline bg-app-hairline`.
- Thumbnail opacity `isDragging ? 0.4 : hidden ? 0.4 : 1` — `hidden` never true in remove-mode →
  identical to the original `isDragging ? 0.4 : 1`.
- Drag handle `aria-label` is conditional: `enableOrdering ? '…reorder or to another group' :
  'Drag to another group'` (original text preserved when ordering off).

## Tests (correctionReducer.test.ts)
Added `describe` blocks for the three verbs (all under the existing gate-of-record file):
- `setPhotoHidden`: sets `hidden:true` without removing from array; restore removes the KEY
  (asserts `'hidden' in obj === false`); true→false round-trip preserves cover; already-visible
  restore is a same-ref no-op; unknown group/photo no-op; no input mutation; other groups untouched.
- `reorderPhoto`: move to front / move forward; cover survives a reorder; clamp over-shoot and
  negative; move-to-current no-op; unknown group/photo no-op; no input mutation.
- `moveGroup`: move later/earlier; photos ride along; same-position no-op; out-of-range no-op;
  no input mutation.

## Verification results (all in WORKDIR)
- `npx tsc --noEmit` — clean, no output.
- `npx vitest run correctionReducer.test.ts` — 41 passed.
- `npm run test:run` — **248 files passed | 1 skipped; 4241 tests passed | 18 skipped.** E2
  onboarding + wizard/generation suites green → additivity held.
- `npm run lint` — no errors; only pre-existing `<img>`/exhaustive-deps warnings in unrelated
  files (none in the three touched files).
- `npm run build` — succeeded (full route table emitted).

## Deviations
- `setPhotoHidden` got an extra no-op guard (return input ref when the flag already matches the
  requested state). In-scope judgment call: keeps identity-on-no-op consistent with the other
  verbs and preserves the board's `drive()` no-op short-circuit. Logged here.

## Open risks
- None for this phase. `enableOrdering` within-group reorder relies on dnd-kit's default collision
  picking the (smaller, on-top) photo droppable over the enclosing group droppable — validated by
  the pure-reducer tests but the drag wiring itself is exercised only in phase 7's Playwright spec
  (out of scope here).

---

# Phase 5 — Dashboard page + tab + client host ("Your work")

**Files changed**
- `src/app/dashboard/[token]/work/page.tsx` (new)
- `src/components/dashboard/work/WorkLibraryClient.tsx` (new)
- `src/components/dashboard/work/WorkLibraryClient.test.tsx` (new)
- `src/components/dashboard/WorkspaceTabs.tsx`
- `src/app/dashboard/[token]/layout.tsx`

## page.tsx — the guard
Cloned from the testimonials page. `force-dynamic`; calls `getWorkspaceProject(params.token)`
ITSELF (layout is chrome-only, not an auth boundary — the C2/ownership comment pattern kept). Reads
`templateId` by primary key (`prisma.project.findUnique({where:{id: project.id}})`) AFTER ownership
is asserted, then `notFound()` unless `templateHasCapability(templateId, 'works')` — the SAME
predicate as the API route (decision 7), NOT `isWorkCopyTemplate`. So live-`atelier` work projects
404 here even though they run the work engine. Heading = **"Your work"** with buyer-words subcopy
(sets/photos/publish — no "collection"/"gallery"/internal terms). Renders `<WorkLibraryClient>`.

## WorkLibraryClient.tsx — the client host
`'use client'`. Self-wraps its own `ToastProvider` (drop-in under any dashboard tree) around
`WorkLibraryInner`.
- **Load:** `GET /api/work-library?tokenId=` → `{groups, blurByUrl}` into a `LoadState`; loading /
  error / empty states. Empty-groups → buyer-words placeholder; non-empty → the board.
- **Commit funnel:** single `commit(groups)` = `PUT /api/work-library {tokenId, groups}`. On !ok it
  returns `{ok:false, error}` (the board reverts + surfaces the rail string); on ok it adopts the
  SERVER-returned `groups` (seeded slugs) via `setData`. This is the board's `onCommit` contract and
  also the funnel add-photos uses.
- **Board mount:** `hideBehavior='flag'`, `enableOrdering`, `hideHeader`, `onAddPhotos`,
  `busy={busy}` (busy = any PUT/upload in flight).
- **Add photos:** `onAddPhotos(groupIndex)` stashes the target group in a ref and clicks a hidden
  `<input type=file multiple accept="image/*">`. `onFilesSelected` uploads each file SEQUENTIALLY via
  `POST /api/upload-image` (multipart: `file` + `tokenId`) — the existing t7 pipeline, used as-is.
  **Confirmed upload response shape (read from the route):** top-level `url`, and `metadata:{assetId,
  blurDataUrl, width, height, size, format}` (`success:true`). I use `body.url` +
  `body.metadata.assetId` (→ `WorkPhotoRef {id: assetId, url}`) + `body.metadata.blurDataUrl` (merged
  into `blurByUrl` for instant paint). Per-file failure → error toast, skip that file. After all
  uploads, the new refs append to the target group's `photos` and go through the same `commit` funnel.
- **Update site placeholder:** a DISABLED button (`data-testid="work-update-site"`) wrapped in
  `AppTooltip` (+ native `title` fallback) with a why-tooltip — greyed-placeholder rule. No publish
  wiring (the handler lands in phase 6).

## Tab gating
- `WorkspaceTabs.tsx`: added optional `showWorkTab?: boolean` (default false); when true, inserts
  `{label:'Your work', segment:'work'}` after Overview (`[TABS[0], WORK_TAB, ...TABS.slice(1)]`) —
  the existing `TabDef` shape, unchanged rendering loop.
- `[token]/layout.tsx`: reads `templateId` by primary key (mirrors the testimonials page's
  read-by-id pattern — WorkspaceContext carries no templateId) and passes
  `templateHasCapability(templateId, 'works')` as `showWorkTab`. CHROME-DATA ONLY comment kept: the
  tab is visibility, the page re-gates. Non-works projects: no tab; the route still 404s via the
  page guard.

## Tests (WorkLibraryClient.test.tsx)
react-dom/client + `React.act` harness (no @testing-library in repo), `fetch` stubbed to serve
GET + echo PUT. Two `describe`s / 2 tests:
1. GET payload → board props: both groups render (verbatim names), the blurred thumbnail paints its
   blur data-url as `backgroundImage`, and the disabled Update-site placeholder is present.
2. Flag-mode hide: clicking hide fires exactly one PUT carrying the FULL rebuilt array (both groups,
   `tokenId`), the hidden ref stays in the array with `hidden:true` (hide-not-destroy), and the
   Restore affordance renders.

## Deviations
- The layout did NOT already fetch `templateId` (WorkspaceContext omits it), so I added a
  by-primary-key `prisma.project.findUnique` in `layout.tsx` (import `prisma` +
  `templateHasCapability`) — mirroring the testimonials page's own read-by-id pattern rather than
  widening the shared `getWorkspaceProject` context (out of my Files-touched list). Conservative,
  in-scope, logged here.
- Update-site tooltip: wrapped the disabled button in a `<span>` inside `AppTooltip` and added a
  native `title` fallback (disabled buttons can swallow hover events) so the "why" is always
  reachable.

## Verification (all in WORKDIR, all green)
- `npx tsc --noEmit` — clean, no output.
- `npm run test:run` — 249 files passed / 1 skipped; 4243 tests passed / 18 skipped (incl. the 2 new).
- `npm run lint` — pre-existing `<img>`/exhaustive-deps warnings only; none in the new/edited files;
  no errors.
- `npm run build` — succeeded; `/dashboard/[token]/work` route emitted (14.6 kB / 275 kB First Load).

## Open risks
- Add-photos drag/upload happy-path is unit-covered for the funnel wiring but the real
  multipart upload + t7 pipeline round-trip is exercised only manually / in phase 7's Playwright
  spec (out of scope here).
- `pipelineGuards.test.ts` known 5s-flake did not trigger this run (full suite green).

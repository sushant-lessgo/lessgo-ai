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

---

# Phase 6 — Gallery manage-link re-point + "Update site" + export-sweep guard

## Files changed
- `src/modules/skeletons/work/blocks/Gallery/WorkGalleryGrid.tsx` — manage-link re-point (edit wrapper only)
- `src/hooks/editStore/collectionHelpers.ts` — `catalogItemsAuthoritative('works')` export-sweep guard
- `src/hooks/editStore/collectionHelpers.works.test.ts` (new) — export-guard regression test
- `src/components/dashboard/work/WorkLibraryClient.tsx` — "Update site" CTA (fallback: deep-link to `/preview/[token]`)
- `src/components/dashboard/work/WorkLibraryClient.test.tsx` — updated host assertion (was phase-5 disabled-button; now asserts `/preview` link). **NOT on the phase-6 Files-touched list** — see Deviations.

## What changed, per file

### WorkGalleryGrid.tsx (manage-link re-point)
- Removed the `WORK_LIBRARY_BOARD_HREF = '/dashboard/library'` placeholder; added
  `workLibraryBoardHref(tokenId)` returning `/dashboard/<tokenId>/work` (falls back to `/dashboard` when null).
- Reads `tokenId` from the edit store via a narrow one-shot selector `useEditStore(s => s.tokenId)`
  (the store's meta-slice field; token-scoped factory).
- The href is still rendered ONLY inside `manageSlot`, which is passed only by the EDIT wrapper.
- **Published-parity confirmation:** `.core.tsx` and `.published.tsx` were NOT touched. The published
  wrapper (`WorkGalleryGrid.published.tsx`) calls `WorkGalleryGridCore` with NO `manageSlot`, so no
  manage href is ever emitted in published output — byte-identical by construction. `galleryGroups.test.tsx`
  (renders the published core without manageSlot) stays green, proving the published output has no
  manage markup. The explicit "manageSlot absent in published" test extension is phase-7's scope
  (its Files-touched owns `galleryGroups.test.tsx`); not editable here.

### collectionHelpers.ts (export-sweep guard — pre-existing latent bug FIX)
- Added pure `catalogItemsAuthoritative(collectionKey)` returning true for `works` ONLY.
- **Mechanism:** keyed on `collectionKey === 'works'` (a self-contained guard in this module), NOT a
  registry def-flag. The clean def-flag would require editing `src/modules/collections/registry.ts`,
  which is NOT on this phase's Files-touched list; per the phase instruction, the `key === 'works'`
  guard is the pre-approved in-scope alternative that avoids touching the registry.
- **Both call sites guarded** (both are the `materializeCatalogItems` writers):
  - `materializeIntoPages` (export/publish path) — skips the catalog `items[]` write for works.
  - `syncCollection` (live-editor `commitActivePage` path) — skips the catalog `items[]` write for works.
  - Per-item `related[]` (`materializeRelated`) writes are LEFT unguarded (plan scopes the guard to
    the `materializeCatalogItems` call sites only; `related` is a separate field resync never touches).
- **Why works-only:** `cardFromEntry` reads `rec.images` and emits a `CatalogCard`
  (`{id,model,name,oneLiner,image,...}`), but a works item page's `workdetail` record carries `photos`
  (not `images`) and the catalog surface is WorkCatalog's `{id,name,cover,href}` shape → re-deriving
  would write blank-cover, wrong-shaped cards and clobber the stored `workcatalog.items[]`, which are
  authoritative (seeded by `buildCollectionCatalogSlice` D13 + maintained by `resyncWorkContent`).
  products/services/case-studies MUST still re-materialize — the guard leaves them untouched.

### WorkLibraryClient.tsx ("Update site" CTA — FALLBACK path taken)
- Replaced the disabled placeholder button with an enabled `<a href="/preview/<tokenId>">Update site</a>`
  plus subcopy "Review and publish your changes on the preview page."
- Dropped the now-unused `AppTooltip` import.

## Which Update-site path + why
- **FALLBACK taken** (pre-approved, ruling #2). The primary direct-from-board publish is dead-on-arrival:
  `buildPagesForExport(state)` consumes the editor-STORE state shape (top-level `state.sections`,
  `state.content`, `state.pages`, `state.sectionLayouts`, `state.chrome`, `state.currentPageId`,
  `state.title`), whereas `GET /api/loadDraft` returns a persisted `finalContent` tree (the
  `{layout,sections,content,pages,chrome,...}` blob). Feeding one into the other requires a store-shape
  adapter — exactly what the plan told me NOT to build. So the CTA deep-links to `/preview/[token]`,
  the existing publish flow. The step-2 guard makes this safe: `/preview` publish runs
  `buildPagesForExport` → the export sweep, which now skips works catalog-item re-derivation.
- Used a plain `<a>` (not `next/link`) — /preview is a different route tree (full navigation is fine)
  and it avoids the App-Router-context hazard in the jsdom host test.
- **DROPPED** `src/lib/workLibrary/publishFromDraft.ts` + its test (not created) — fallback path, per
  the phase instruction.

## Deviations
- **Edited `WorkLibraryClient.test.tsx` (NOT on the phase-6 Files-touched list).** The mandated fallback
  CTA change breaks the phase-5 assertion `expect(cta.disabled).toBe(true)`, and step 5 explicitly
  requires "a host test that the CTA links to `/preview/[token]`" on the fallback. That host test can
  only live in this co-located test file, and leaving the suite red violates a hard rule. This is the
  intended substitute for the dropped `publishFromDraft.test.ts` (net test-file count unchanged). I
  edited ONLY the 4-line CTA assertion (disabled-button -> `/preview/tok_test` anchor). Flagging for
  orchestrator visibility; veto if undesired.
- **CTA is always-enabled, not greyed-when-unpublished.** The phase text suggested greying to
  "Publish from the editor first" for unpublished projects, but determining publish-state needs data
  not reachable from this component without editing `route.ts` or `page.tsx` (both out of scope).
  Conservative choice: an always-enabled link to `/preview/[token]` — the canonical publish flow that
  handles BOTH first-publish and republish, so it never wrongly blocks a legitimate publish.

## Test results
- New `collectionHelpers.works.test.ts` (4 describes): `catalogItemsAuthoritative` true-only-for-works;
  `materializeIntoPages` + `syncCollection` each leave works catalog `items[]` byte-identical
  (`toEqual(WORK_ITEMS)`) while re-materializing products (empty -> 1 card, image set); full
  `buildPagesForExport` sweep preserves works items byte-identical + works item pages intact while
  products re-derive. GREEN.
- Updated `WorkLibraryClient.test.tsx`: CTA is an `<a>` with `href="/preview/tok_test"`. GREEN.
- `galleryGroups.test.tsx` (published core, no manageSlot): GREEN (parity verified, not extended — phase 7 owns it).

## Verification (all in WORKDIR, all GREEN)
- `npx tsc --noEmit` — clean, no output.
- `npx vitest run` targeted (3 files) — 11/11 passed.
- `npm run test:run` — 250 passed | 1 skipped (251 files); 4249 passed | 18 skipped. pipelineGuards 5s-flake did not trigger.
- `npm run lint` — no errors (only pre-existing `no-img-element` / `exhaustive-deps` warnings, none in my files).
- `npm run build` — succeeded (full route table emitted).

## HUMAN-GATE PROOF STEPS (spec gate b — published rendering)
Run on a dev/staging **works-CAPABLE** project (atelier2/skeleton with existing `page-<slug>` item
pages + `workcatalog` singleton — verify first, per phase-7 pre-check):
1. Open `/dashboard/<token>/work` ("Your work"). Confirm the real groups load (e.g. Weddings/Portraits).
2. Perform a full board edit through the CorrectionBoard: **rename** a group, **pick a new cover**,
   **hide** a photo (it dims + shows Restore), **move** a photo to another group, **reorder** a group
   (up/down). Each verb funnels through `PUT /api/work-library` (busy state, then adopts server groups).
3. Open the editor at `/edit/<token>`, open the work gallery section, click **"Manage photos"** —
   confirm it deep-links to `/dashboard/<token>/work` (the board), NOT the old `/dashboard/library`.
4. Back on the board, click **"Update site"** -> lands on `/preview/<token>` -> publish from there.
5. On the LIVE published page verify the board edits are reflected on ALL group-reference surfaces:
   - the **gallery** section (renamed group, new cover, reordered card order, hidden photo absent),
   - the **chrome** group cards (header/nav group references),
   - the **`/works` catalog index** (`workcatalog` items[] — order/name/cover/href match the gallery),
   - each **`/works/<slug>`** item page (photos reflect hide/move; renamed group keeps its slug/URL).
6. **Editor<->published parity:** open `/edit/<token>` and confirm the gallery/catalog render identically
   to the published pages (same names/covers/order) — the manage link is present in edit only, absent
   in published. A merged-away group's `/works/<slug>` 404s (accepted, ruling #1).

## Open risks
- The `/preview` fallback means "Update site" leaves the dashboard for the editor's preview/publish UI
  rather than a one-click in-place republish; acceptable per ruling #2, but a future phase could add a
  loadDraft->store-shape adapter to enable the in-place primary path.
- The `related[]` per-item materialize for works remains unguarded (out of the plan's `materializeCatalogItems`
  scope); it writes a derived `related` field on `workdetail` that `resyncWorkContent` never touches and
  the work item page does not render as a catalog card — no observed corruption, but noting it.
- Published "manageSlot absent" is proven structurally + via the green published-core test; the explicit
  assertion extension is deferred to phase 7 (owns `galleryGroups.test.tsx`).

---

# Phase 7 — Deterministic QA + docs (steps 2–5)

## Files changed
- `e2e/work-library.spec.ts` (new) — authed board CRUD round-trip.
- `src/modules/skeletons/work/galleryGroups.test.tsx` — resync-driven parity + manageSlot-leak guard + catalog consistency.
- `src/modules/skeletons/work/workDetailPhotos.test.tsx` — resynced `photos[]` write (hidden dropped).
- `src/modules/collections/README.md` — "Your work" board pointer + works catalog-authority rule.

(Phase 7 step 1 = the founder pilot pre-check + live walkthrough on Kundius's REAL project — the LIVE gate, owned by the ORCHESTRATOR, not implemented here. A runnable pre-check procedure is provided below.)

## e2e/work-library.spec.ts — flow + assertions
Authed (Clerk session from `auth.setup.ts`, the `publish.spec.ts` pattern: `goto('/')` -> wait for `Clerk.user` -> `page.request`). Seeds a WORKS-CAPABLE project directly through the real `/api/saveDraft` route — `templateId: 'atelier2'` (works-capable per `templateMeta`), `brief.facts.work.groups` (Weddings [w1 cover, w2] + Portraits [p1]), and a works-shaped `finalContent` (gallery + `workcatalog` singleton + two `workdetail` item pages) so the PUT resync exercises the real path. No generation/onboarding drive needed — the board reads groups from `brief.facts.work`.

Round-trip, every step a MUTATION assertion (DOM/state change) + full re-verify after reload:
1. Seed -> `GET /api/work-library` returns the two seeded group names (sanity).
2. Open `/dashboard/<token>/work` -> `correction-board` visible; group names Weddings + Portraits.
3. RENAME group 0 -> "Wedding Films" (await PUT 200) -> name button text changes.
4. HIDE photo w2 (`correction-hide-0-1`) -> `correction-restore-0-1` appears, thumb `opacity: 0.4`, hide button gone.
5. RESTORE w2 -> hide button returns, `opacity: 1`.
6. MOVE p1 (pointer-drag from group-1 thumb into `correction-group-0`) -> group 0 gains p1, group 1 has 0 `[data-photo-url]`.
7. REORDER within group 0 (drag w1 onto w2) -> first thumb no longer w1's url.
8. PICK COVER on p1 (`correction-cover-0-<idx>`) -> `correction-cover-badge-0-<idx>` visible.
9. RELOAD -> assert persisted: rename holds; p1 in group 0 + group 1 empty; w2 present + not dimmed; p1 carries the "Cover" badge. Cross-checked against `GET /api/work-library` FACTS: group 0 = "Wedding Films" with photos {p1,w1,w2} and `cover` on p1; group 1 empty.

Each mutating step is wrapped in `commitAnd()` which awaits the board's `PUT /api/work-library` resolving **200** before asserting — so an assertion can never pass on stale optimistic UI without a real server commit.

### e2e EXECUTION BLOCKER (out-of-scope file — documented, NOT a fake green)
The spec is authored and **typechecks clean standalone** (`tsc --noEmit --strict e2e/work-library.spec.ts` -> exit 0; note the repo `tsconfig.json` EXCLUDES `e2e`, so `npm run tsc` does not cover it — verified separately). BUT it is **NOT executed**: `playwright.config.ts`'s `authed` project uses an explicit `testMatch` ALLOWLIST, and `work-library.spec.ts` is not listed — `npx playwright test --list` collects it under NO project (confirmed: "work-library.spec.ts is NOT collected"). Registering it is a **one-line** addition to that allowlist:
```
/work-library\.spec\.ts/,
```
`playwright.config.ts` is OUTSIDE this phase's Files-touched list, so per the hard file-scope rule it was NOT edited. **The orchestrator must add that line before the gate run**, else the suite goes green having never run this spec (the exact false-green the config's own comment warns about). Two residual notes once registered: (a) the pointer-drag steps (@dnd-kit PointerSensor) are the standard flake-prone area — a `pointerDrag` helper crosses the 4px activation threshold then travels in steps, but a first live run should confirm the two DnD steps land; (b) needs Clerk test creds in `.env.local` (present here) + `npx playwright install chromium`.

### REGISTRATION RESOLVED (follow-up, 2026-07-18)
Scoped follow-up granted `playwright.config.ts` as a Files-touched file. The one-line allowlist entry (`/work-library\.spec\.ts/,`, with a two-line comment) was added to the `authed` project's `testMatch`. Verified:
- `npx playwright test e2e/work-library.spec.ts --list` now collects it: `[authed] › work-library.spec.ts:145:5 › Your work board — full CRUD round-trip...` (previously matched NO project).
- **ACTUAL RUN (mock mode, the harness default): PASS.** `npx playwright test e2e/work-library.spec.ts` → `2 passed (54.8s)` — `[setup] authenticate` (9.0s) + `[authed] work-library.spec.ts ... full CRUD round-trip persists across reload` (12.2s). Real Clerk test creds present in this env; the full round-trip incl. both @dnd-kit pointer-drag steps (move + reorder) landed green. So this is a real green, not env-blocked.
- `npx tsc --noEmit` still exit 0.

Files changed by this follow-up: `playwright.config.ts` (allowlist entry only), this audit note.

## Vitest parity/render assertions added
`galleryGroups.test.tsx` (existing describes untouched; new describes appended, all fixtures produced by the REAL `resyncWorkContent` — no hand-built cards):
- **resynced cards render** — `WorkGalleryGridPublished` renders every resynced card's name + cover `src=` + `href="/works/<slug>"`; one `wk-gallery__group` cell per entry.
- **manageSlot edit-only (published-leak tripwire — the phase-6-deferred assertion):** the PUBLISHED wrapper output contains NO `data-wk-manage-photos`, NO "Manage photos", NO `class="wk-gallery__manage"` (attribute, not the CSS-rule string in `<style>`). A paired positive test injects the edit wrapper's exact `manageSlot` into the core and asserts the marker DOES appear — so the negative assertion is provably non-vacuous. If a future edit makes `WorkGalleryGrid.published.tsx` pass a `manageSlot`, the negative test FAILS.
- **hidden photo absent from gallery output** — hiding the Weddings cover (w1) -> resynced card `cover_image` falls back to w2; rendered gallery HTML never contains the hidden w1 url.
- **catalog consistency (one fixture)** — with a rename + reorder applied, `WorkGalleryGridPublished` and `WorkCatalogCore` (published primitives) agree on name/cover `src=`/`href=` for both entries AND agree on order (Portraits before Wedding Films) from the SAME resync output.

`workDetailPhotos.test.tsx` (existing describes untouched; new describe appended):
- **resynced `photos[]` write** — `resyncWorkContent` writes the full facts photo set {w1,w2,w3} onto the item page seeded with only w1; `WorkDetailCore` renders each url once, cover (w1) first.
- **hidden dropped from item page** — hiding w2 -> resynced item-page photos = {w1,w3}; the hidden url never renders; 2 `wk-detail__media` cells.

## Docs
`src/modules/collections/README.md` — new section "The `works` collection is managed from the 'Your work' board": points the works flow at `/dashboard/[token]/work` as the management door (source of truth `brief.facts.work.groups` via the rail + `resyncWorkContent`), and states the **works catalog-authority rule** from phase 6 — `workcatalog.items[]` is authoritative, the export/editor sweep skips re-materializing it via the `catalogItemsAuthoritative` (works) def-flag at BOTH `materializeCatalogItems` call sites (`materializeIntoPages` + `syncCollection`), with the `cardFromEntry` shape-mismatch reason. Spec AC checklist NOT ticked (orchestrator owns artifacts).

## Deviations
- **manageSlot guard asserts on `class="wk-gallery__manage"` (attribute), not the bare `wk-gallery__manage` string** — the latter also appears as a CSS rule inside the injected `<style>` block, so the bare-string check would false-fail. Same discipline the existing `count(html,'class="wk-gallery__group"')` test uses. Conservative + still fails on a real slot leak (the leaked element carries `class="wk-gallery__manage"` + `data-wk-manage-photos`).
- **`playwright.config.ts` NOT edited** (registration line) — out of Files-touched; flagged above + in the mailbox. This is the only reason the e2e spec is unexecuted.

## Verification (full re-green sweep, step 4)
- `npx tsc --noEmit` -> **exit 0** (note: excludes `e2e/`; the e2e spec typechecked standalone -> exit 0).
- `npm run test:run` -> **250 passed | 1 skipped (251) files; 4256 passed | 18 skipped tests**. The two extended parity files: 15 passed.
- `npm run build` -> **succeeded** (full route table emitted).
- `npm run lint` -> **no errors** (only pre-existing `@next/next/no-img-element` + one `react-hooks/exhaustive-deps` warnings, all pre-existing/unrelated).
- `npm run test:e2e` (mock) -> the new `work-library.spec.ts` is **NOT executed** pending the one-line `playwright.config.ts` registration (out-of-scope, see blocker above). No other e2e file was touched. NOT a fake green — honest unexecuted-pending-registration.

## Open risks
- e2e spec unverified in a live run until registered (+ the two DnD steps confirmed on a real browser). Everything deterministic (tsc/test:run/build/lint + the 4 new vitest assertions incl. the manageSlot-leak guard) is green.

---

# PILOT PRE-CHECK (for orchestrator/founder) — run BEFORE the live walkthrough

Confirm Kundius's REAL project is board-ready. If EITHER check fails, STOP and report a founder-gate finding — template migration (live-`atelier` -> skeleton) is OUT OF SCOPE for this branch (decision 8); the gate cannot pass on a project without works fan-out.

### (a) Template is works-capable
**[Updated 2026-07-18 post-merge: the atelier2→atelier cutover landed on main. `atelier` is now the works-capable template (`atelier2` was promoted to it and no longer exists). The pre-check below now targets `atelier`.]**

The board gates on `templateHasCapability(templateId, 'works')` — `atelier` declares `works` (a non-works template like `meridian`/`hearth` does NOT). SQL against the app DB:
```sql
SELECT p."tokenId", p."templateId"
FROM "Project" p
WHERE p."tokenId" = '<KUNDIUS_TOKEN>';
-- PASS iff templateId = 'atelier'  (post-cutover works-capable template)
```

### (b) Stored content has the works surfaces
`Project.content.finalContent` must contain `page-<slug>` item pages + group-reference gallery cards + the `workcatalog` singleton (else the resync has nothing to bind into). Save the script below as `scratch-precheck.js` at repo root and run `node scratch-precheck.js <KUNDIUS_TOKEN>` with the DATABASE_URL that owns her project (delete after — don't commit):
```js
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
(async () => {
  const token = process.argv[2];
  const p = await db.project.findUnique({ where: { tokenId: token }, select: { templateId: true, content: true, brief: true } });
  if (!p) { console.log("NO PROJECT for", token); process.exit(1); }
  const fc = (p.content && p.content.finalContent) || {};
  const pages = fc.pages || {};
  const keys = Object.keys(pages);
  const itemPages = keys.filter(k => k.startsWith("page-") && pages[k] && pages[k].collectionKey === "works" && pages[k].kind === "collectionItem");
  const hasCatalog = keys.some(k => {
    const cm = pages[k] && pages[k].content;
    return cm && Object.values(cm).some(s => (s && s.type) === "workcatalog");
  });
  const walk = (cm) => cm && Object.values(cm).some(s => Array.isArray(s && s.elements && s.elements.groups));
  const hasGalleryCards = walk(fc.content) || Object.values(pages).some(pg => walk(pg && pg.content)) ||
    (fc.chrome && (walk({ _: fc.chrome.header && fc.chrome.header.data }) || walk({ _: fc.chrome.footer && fc.chrome.footer.data })));
  const factGroups = (((p.brief || {}).facts || {}).work || {}).groups || [];
  console.log("templateId:", p.templateId, "(want atelier)");
  console.log("works item pages (page-<slug>):", itemPages.length, itemPages);
  console.log("workcatalog singleton present:", hasCatalog);
  console.log("group-reference gallery cards present:", hasGalleryCards);
  console.log("facts.work.groups count:", factGroups.length, factGroups.map(g => g.name));
  const ok = p.templateId === "atelier" && itemPages.length > 0 && hasCatalog && hasGalleryCards && factGroups.length > 0;
  console.log(ok ? "PASS — board-ready" : "FAIL — founder-gate finding (migration out of scope)");
  await db.$disconnect();
})();
```
PASS iff: `templateId = atelier` (post-cutover works-capable), >=1 `page-<slug>` works item page, `workcatalog` singleton present, gallery group-ref cards present, and `facts.work.groups` non-empty. Only then run the live founder walkthrough (spec gate a).

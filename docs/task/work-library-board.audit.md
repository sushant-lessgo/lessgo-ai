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

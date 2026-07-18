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

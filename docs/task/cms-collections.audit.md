# cms-collections — implementation audit

## Phase 1A (data core: models + Zod contract + slug + types/README + 2 pure-module tests)

Scope was phase 1 steps 1-4 plus the first two test bullets of step 6, stopping at the
mid-phase HUMAN GATE (schema sign-off). **The migration was NOT run** and no
`/api/collections/*` route was created — both belong to phase 1B, after the gate.

### Files changed

- `prisma/schema.prisma` (modified)
- `src/lib/schemas/collection.schema.ts` (new)
- `src/lib/schemas/collection.schema.test.ts` (new)
- `src/modules/cms/slug.ts` (new)
- `src/modules/cms/slug.test.ts` (new)
- `src/modules/cms/types.ts` (new)
- `src/modules/cms/README.md` (new)
- `docs/task/cms-collections.audit.md` (new — this file)

### What changed, per file

**`prisma/schema.prisma`** — added `Collection`, `CollectionGroup`, `CollectionItem`
(inserted after `MediaAsset`, whose FK shape they copy) plus the reverse relation
`collections Collection[]` on `Project`.

- `Collection`: `id` (cuid) · `projectId` + `project @relation(onDelete: Cascade)` ·
  `tokenId` (route key) · `name` · `slug` · `fieldSchema Json` · `roles Json` ·
  `detailPages Boolean @default(false)` · `layoutHint String?` · `order Int @default(0)` ·
  `createdAt`/`updatedAt`. `@@unique([tokenId, slug])`, `@@index([tokenId, order])`,
  `@@index([projectId])`.
- `CollectionGroup`: `id` · `collectionId` + FK cascade · `name` · `order Int @default(0)`.
  `@@index([collectionId, order])`.
- `CollectionItem`: `id` · `collectionId` + FK cascade · `groupId String?` + FK
  `onDelete: SetNull` (group delete → items become ungrouped) · `slug` · `values Json` ·
  `order Int @default(0)` · `slugLocked Boolean @default(false)` · timestamps.
  `@@unique([collectionId, slug])`, `@@index([collectionId, order])`, `@@index([groupId])`.
- Block comment above the models records the dual `projectId`+`tokenId` keying rationale
  and both coercion-proof invariants.

**`src/lib/schemas/collection.schema.ts`** — the contract. Closed `FIELD_TYPES` (9),
`FIELD_ID_REGEX = ^[A-Za-z][A-Za-z0-9_-]*$`, `FieldDefSchema`, `FieldSchemaArraySchema`
(unique ids), per-type value schemas (image `{url, assetId?}`, gallery `image[]`,
video/audio `{kind:'upload'|'link', url}`, text_short/text_long `string`, link
`{url,label}`, date ISO `string`, tags `string[]`), `makeItemValuesSchema(fields)` and
`makeRolesSchema(fields)` (cross-field type filtering: title→text_short,
cover→image|gallery, primaryLink→link), plus request-body schemas for the phase-1B routes.
Coercion-proof rule 1 is honoured: the only discriminator in a stored value is `kind`; no
schema emits a `{type, content}` string pair.

**`src/modules/cms/slug.ts`** — pure, zero imports: `slugifyName` (NFKD → combining-mark
strip → lowercase → collapse non-alnum to `-` → trim → cap 60) and
`uniqueSlug(base, taken)` (`base`, `base-2`, `base-3`…, clamped at 999).

**`src/modules/cms/types.ts`** — type-only re-exports from the Zod contract plus the
`CmsCollection` / `CmsGroup` / `CmsItem` / `CmsCollectionBundle` app-facing row shapes
(Prisma `Json` columns narrowed). No runtime imports, no Prisma import.

**`src/modules/cms/README.md`** — purpose, file map, the 5 invariants (closed 9, closed
3 type-filtered roles, alongside-not-extending `CollectionKey`, works-authority boundary,
never register a v2 layout schema for `cmscollection`/`cmscollectionitem`), the three
coercion-proof rules, and the image-object / non-destructive-schema-edit / slug-contract
decisions.

**Tests** — `collection.schema.test.ts` (24 cases): closed-enum assertion incl.
`price`/`richtext` rejected; letter-prefixed ids accepted and numeric/illegal ids rejected
(incl. an all-numeric `values` map rejected even for unknown fields); accept AND reject
cases for all 9 value shapes; bare-string image rejected (TRAP 1); a `{type, content}`
media value rejected; all-optional + orphan-key tolerance **with preservation asserted**;
role type-filtering incl. unknown field and unknown role key. `slug.test.ts` (13 cases):
diacritics, punctuation collapse, fallback, length cap, `SlugSchema` conformance, and the
collision clamp series incl. skipping an already-taken suffix.

### Deviations from the plan

1. **`src/lib/schemas/index.ts` export NOT added.** The plan's phase-1 file list includes
   it, but it is not on this phase's Files-touched list, so it was left untouched per the
   hard rule. `collection.schema.ts` is importable by its direct path today; phase 1B (or
   review) should decide whether to add the barrel export. Nothing currently breaks.
2. **Request-body schemas included in step 2's file** (`CollectionCreate/Patch`,
   `GroupCreate/Patch`, `ItemCreate/Patch/BulkPatch`, `SlugSchema`). The plan's step 5
   says route bodies are "parsed with the new Zod schemas", and `collection.schema.ts` is
   not on phase 1B's likely edit list — adding them now keeps 1B inside its own scope.
   They are additive exports; nothing else changed.
3. **Item `values` uses `z.record` + `superRefine`, not `z.object(...).passthrough()`.**
   Conservative choice: `z.record` never strips keys, so an orphaned value from a removed
   field survives a later PATCH round-trip (the plan's non-destructive schema-edit
   semantics). Consequence: every key — orphan or not — must still pass `FIELD_ID_REGEX`,
   which keeps coercion-proof rule 2 true for orphans too. Inferred type is
   `Record<string, unknown>`; readers narrow via `src/modules/cms/types.ts`.

### Decisions the plan did not pin (all conservative)

- **`order Int @default(0)`** on all three models — the plan said `order Int` without a
  default; a default keeps inserts from requiring an explicit order.
- **Indexes** beyond the pinned uniques: `@@index([tokenId, order])` + `@@index([projectId])`
  on `Collection`, `@@index([collectionId, order])` on group/item, `@@index([groupId])` on
  item — mirrors `MediaAsset`'s index posture; additive only.
- **`layoutHint` is nullable `String?`** (as pinned) with no enum — the seam stays open.
- **Value bounds**: text_short ≤500, text_long ≤20000, tags ≤50 entries/80 chars, fields
  ≤50 per collection. Sanity caps, not spec'd; loosen freely if the founder objects.
- **`date` accepts `YYYY-MM-DD` or a full ISO timestamp**, validated with `Date.parse`.
- **`slugifyName` fallback is `untitled`** when a name yields nothing (e.g. CJK-only);
  never returns an empty string.
- **`FieldSchemaArraySchema` has no minimum length** — an empty field list is accepted at
  the contract layer; the UI is where "a collection needs at least one field" belongs.

### Verification (actual output)

| Command | Result |
|---|---|
| `npx prisma format` | `Formatted prisma\schema.prisma in 44ms` |
| `npx prisma validate` | `The schema at prisma\schema.prisma is valid` |
| `npx vitest run src/lib/schemas/collection.schema.test.ts src/modules/cms/slug.test.ts` | **2 files / 37 tests passed** |
| `npx tsc --noEmit` | **1 error, pre-existing and unrelated:** `src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg'` |

On the `tsc` error: `src/app/page.tsx` is not in this phase's scope and was not touched;
`src/assets/images/founder.jpg` exists on disk. This is the known stale-`.next/types`
baseline noise (memory: "Pre-push hook: stale .next/types" → `rm -rf .next` clears it).
**No error references any file this phase created or modified.** Reported, not papered over.

`npm run test:run` (full suite) was NOT run in this phase — nothing here is imported by
existing code yet (all files are new; the only edit to an existing file is additive Prisma
models), so the blast radius is nil until the migration runs. The full suite is the phase-1B
gate.

### 🔶 What the founder should look at during the schema gate

1. **Dual keying** — `projectId` (relation, `onDelete: Cascade`) **and** `tokenId` (route
   key). Project delete cascades collections → groups → items. Confirm that's wanted (i.e.
   deleting a project destroys its CMS content with no recovery path).
2. **`{url, assetId?}` image values** (TRAP 1) — objects, not bare URL strings. Cheap now,
   a data migration later.
3. **`groupId onDelete: SetNull`** — deleting a group ungroups its items rather than
   deleting them.
4. **Uniqueness scopes** — collection slug unique per `tokenId` (per project), item slug
   unique per `collectionId`. Cross-project slug reuse is allowed.
5. **Deviation 1** — the `src/lib/schemas/index.ts` barrel export is deliberately not added;
   confirm whether it should be.

### Open risks carried into 1B

- The migration is unwritten: `npx prisma migrate dev --name cms_collections` must run
  after the gate, and `npx prisma generate` after that (nothing imports the generated
  Prisma types yet — `types.ts` deliberately hand-declares the row shapes so this phase
  typechecks without a client regen).
- Slug uniqueness is enforced by DB constraints + (phase 1B) route-side checks; the
  contract layer only validates slug FORMAT.
- Phase 4 adds a "must not shadow a top-level page slug" check to the same write paths —
  not present yet.

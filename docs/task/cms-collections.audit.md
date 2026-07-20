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

---

## Phase 1B (the five `/api/collections/*` routes + the authz regression)

Scope: plan phase 1 step 5 (routes) and step 6's third test bullet. Phase 1A
(models, migration, Zod contract, slug util) was already committed and was not
re-done; `prisma/schema.prisma` was NOT touched.

### Files changed

- `src/app/api/collections/route.ts` (new)
- `src/app/api/collections/[collectionId]/route.ts` (new)
- `src/app/api/collections/[collectionId]/groups/route.ts` (new)
- `src/app/api/collections/[collectionId]/items/route.ts` (new)
- `src/app/api/collections/[collectionId]/items/[itemId]/route.ts` (new)
- `src/app/api/collections/collections.authz.test.ts` (new)
- `docs/task/cms-collections.audit.md` (this section)

Not changed (deliberately): `src/lib/schemas/index.ts` (see Deviations #1),
`src/lib/schemas/collection.schema.ts` (no fix was needed — every request body
parsed cleanly against the phase-1A schemas as written).

### What changed, per file

**`route.ts` (list + create).** `GET ?tokenId` returns collections ordered by
`(order, createdAt)` with `itemCount`/`groupCount` from `_count`. `POST` parses
`CollectionCreateSchema`, then cross-validates `roles` against the submitted
`fieldSchema` with `makeRolesSchema` (400 on a role pointing at a missing or
wrongly-typed field). **`projectId` is resolved server-side** from the
ownership-verified token (`project.findUnique({where:{tokenId}})`); a body
`projectId` is never read — asserted by a test. Slug: explicit slug that collides
→ **409** (never silently clamped); derived slug → `uniqueSlug(slugifyName(name),
taken)`. `order` = max sibling order + 1. Prisma `P2002` (the
`@@unique([tokenId, slug])` race) is mapped to 409, not 500.

**`[collectionId]/route.ts` (get / patch / delete).** All three verbs go through
`loadOwnedCollection(collectionId, tokenId)` =
`collection.findFirst({where:{id, tokenId}})` — the file has **no**
`findUnique({where:{id}})` path, so a valid token for project A can never reach a
collection of project B (404, no existence oracle). `GET` also returns groups and
items, ordered. `PATCH` recomputes the effective field schema, re-checks a changed
slug for uniqueness within the token (409), and **never touches items** — a
removed field's values stay as orphan keys. `DELETE` relies on the FK cascade.

**`[collectionId]/groups/route.ts`.** `POST` (order defaults to max+1 via
`aggregate`), `PATCH` (bulk rename/reorder in one `$transaction`), `DELETE`
(`?groupId=`; items ungroup via the `onDelete: SetNull` FK). Every targeted group
id is verified to belong to the ownership-checked collection before any write.

**`[collectionId]/items/route.ts`.** `POST` type-checks `values` with
`makeItemValuesSchema(collection.fieldSchema)`, verifies any supplied `groupId`
belongs to the collection, and derives the slug from the **title-role** value
(falling back to the first non-empty `text_short`, then the collection name, then
`item`), clamped for uniqueness. Explicit slug collision → 409. `PATCH` is the
bulk reorder/regroup: all item ids and all target group ids are verified to belong
to this collection first, then one `$transaction`; `groupId: null` is honoured as
"move to ungrouped".

**`[itemId]/route.ts`.** `loadOwnedItem` enforces all three nesting levels in one
query: `{id: itemId, collectionId, collection: {tokenId}}`. `PATCH` **merges**
`values` over the stored map (explicit `null` deletes a key) rather than replacing
it, then validates the merged result; a changed slug is uniqueness-checked (409)
and sets `slugLocked: true`.

**`collections.authz.test.ts`** — 55 tests. The **real** `assertProjectOwner` and
`validateToken` run (only `createSecureResponse` is faked, to keep `NextResponse`
out of jsdom); clerk `auth`, `@/lib/prisma` and `@/lib/admin` are the only mocks.
Coverage: 13 route/verb entries × {403 + `{error:'Access denied'}` body, zero CMS
table calls before denial, 401 + body when unauthenticated}; six cross-project
nested cases (token A + collection B → 404, with `not.toHaveBeenCalled()` on the
corresponding write, and a direct assertion on the item route's WHERE clause);
slug-collision cases (explicit → 409, derived → clamped to `books-2`, P2002 race →
409, collection PATCH slug → 409, item explicit → 409, item derived → clamped);
plus three non-destructive-semantics tests (schema edit never rewrites items,
item PATCH preserves orphan keys, manual slug sets `slugLocked`).

### Deviations from the plan / decisions it did not pin

1. **`src/lib/schemas/index.ts` barrel export SKIPPED** (per the orchestrator's
   conditional ruling). The barrel exists, but its header is *"Export all schemas
   for structured outputs"* and it re-exports exactly six LLM structured-output
   schemas (`understand`, `understandService`, `copy`, `scrapeWebsite`,
   `scrapeWebsiteService`, `entryClassify`). The sibling non-LLM schemas —
   `brief`, `media`, `workLibrary`, `workFacts`, `productStrategy` — are **not**
   in it. So it does not follow a "re-export every sibling schema" pattern, and
   `collection.schema.ts` (not a structured-output schema) does not belong there.
   Adding a blanket `export *` would also risk name collisions in a widely-imported
   barrel. Phase 1A's open deviation is therefore resolved as: leave it out; import
   the contract by its direct path, as the routes do.
2. **The `gate()` helper is duplicated in all five route files** rather than
   extracted. A shared `src/app/api/collections/_gate.ts` is not on the
   Files-touched list, and exporting a non-handler symbol from a Next route module
   is unsafe. Each copy is byte-identical apart from its `action` string. Worth a
   follow-on extraction when a later phase legitimately touches the directory.
3. **Explicit slug ⇒ 409, derived slug ⇒ clamped.** The plan said "409 or clamped
   per your implementation". Both, split by intent: a caller who names a slug gets
   told it is taken; an auto-derived one is clamped so item creation never fails on
   a duplicate title.
4. **Creating an item with an explicit slug sets `slugLocked: true`.** The plan
   only pins the lock on a PATCH edit, but an explicitly chosen slug at create time
   is the same manual decision, and phase 4's re-materialization must not clobber
   it. Conservative extension; flagged here because it is not in the plan text.
5. **Item `values` PATCH is a MERGE, not a replace** (`null` deletes a key). A
   replace would silently drop orphan keys, contradicting the plan's
   non-destructive schema-edit semantics. The plan did not pin this.
6. **Collection PATCH prunes dangling roles when `roles` is not supplied.** If a
   `fieldSchema` edit removes or retypes a role's target field and the caller sends
   no new `roles`, the affected role is dropped rather than the request rejected —
   otherwise deleting a role-bearing field would be impossible in one call. When
   `roles` IS supplied it is validated strictly (400 on failure). The plan did not
   pin this either; it is the one place where a schema edit mutates something other
   than `fieldSchema`. **Reviewer: check this is the wanted behaviour.**
7. **Group DELETE takes `?groupId=` on the collection-scoped groups route** (there
   is no `[groupId]` route file in the plan's list).

### Verification (actual results)

| Command | Result |
|---|---|
| `git branch --show-current` | `feature/cms-collections` (matches) |
| `npx vitest run src/app/api/collections/collections.authz.test.ts` | **1 file / 55 tests passed** |
| Mutation check (replaced the `.ok` check in `route.ts`'s gate with `void access`) | **4 tests failed** — the suite bites; restored immediately |
| `npx tsc --noEmit` | 1 error, **pre-existing baseline**: `src/app/page.tsx(6,26): TS2307 … '@/assets/images/founder.jpg'`. No error references any file in this phase. |
| `npm run test:run` (full suite) | **266 files passed, 1 skipped; 4263 tests passed, 15 skipped** — green, no regressions |
| `npx next lint --file <all 6 phase files>` | `No ESLint warnings or errors` |

### Open risks / what the reviewer should scrutinise

- **Deviation 6 (role pruning on schema edit)** is the only silent data mutation in
  this phase. It is deliberate and tested, but it is a product decision.
- **Deviation 5 (values merge)** means a caller cannot clear a field by omitting
  it — it must send `null`. Phase 7's item editor has to honour that.
- The routes were exercised only through the mocked-Prisma vitest suite; **no live
  DB round-trip / curl pass was run** (the plan's manual verification bullet).
  Constraint behaviour (`@@unique([tokenId, slug])`, `@@unique([collectionId,
  slug])`, the `SetNull` group FK, the project-delete cascade) is asserted only via
  the P2002 mapping and the schema definition, not observed.
- **Phase 4 obligations not yet present:** the "collection slug must not shadow a
  top-level page slug" check, and the publish-side collision guard. Slug uniqueness
  today is scoped to `(tokenId, slug)` and `(collectionId, slug)` only.
- The demo token (`lessgodemomockdata`) short-circuits `assertProjectOwner`, so it
  passes every gate here with `project: null`. `POST /api/collections` then 404s at
  the server-side project lookup rather than writing anything, which is the safe
  outcome, but it is incidental rather than an explicit demo-token guard.

---

## Phase 2 — Render trio + shared-block registries + parity

### Files changed

**New**
- `src/lib/safeUrl.ts`
- `src/modules/cms/render/primitives.ts`
- `src/modules/cms/render/toRenderModel.ts`
- `src/modules/cms/render/toRenderModel.test.ts`
- `src/modules/cms/render/CollectionSection.core.tsx`
- `src/modules/cms/render/CollectionSection.tsx`
- `src/modules/cms/render/CollectionSection.published.tsx`
- `src/modules/cms/render/parity.test.tsx`

**Modified**
- `src/lib/staticExport/headTags.ts`
- `src/lib/publishSanitizer.ts`
- `src/modules/generatedLanding/sharedBlocks/registry.ts`
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts`
- `src/modules/generatedLanding/sharedBlocks/capabilities.ts`
- `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts`
- `docs/task/cms-collections.audit.md` (this entry)

No file outside the plan's Phase-2 Files-touched list was edited. `componentRegistry.*`
untouched, as pinned.

### Per file

**`src/lib/safeUrl.ts` (new)** — pure, ZERO imports. Houses BOTH predicates:
`isSafeURL` MOVED from `headTags.ts:48` and `isSafePublishedUrl` MOVED from
`publishSanitizer.ts:149-159` (bodies byte-identical to the originals; only the
JSDoc was extended with the which-one-to-use note and the CMS reject semantic).
This is the mechanism for the boundary law — `toRenderModel.ts` imports its
predicates from here and NEVER from `publishSanitizer.ts` (jsdom/dompurify).

**`headTags.ts`** — local `isSafeURL` deleted, replaced by a RE-export from
`@/lib/safeUrl`, so the existing `./headTags` callers (`htmlGenerator.ts`,
`buildPageMetadata.ts`, `headTags.test.ts`) stay green. The full contract JSDoc
moved to `safeUrl.ts` with a pointer left behind.

**`publishSanitizer.ts`** — three edits, all inside this server-only file:
(1) the `isSafeURL` import from `@/lib/staticExport/headTags` replaced by
`isSafePublishedUrl` from `@/lib/safeUrl`;
(2) added `export { isSafePublishedUrl };` — the plan said "import", but a
re-export is REQUIRED or `publishSanitizer.test.ts:4` (which imports it from
`./publishSanitizer`) breaks tsc; the brief called this out and it is what I did;
(3) the local `isSafePublishedUrl` definition deleted + the module-header line that
claimed the URL gate routes through `isSafeURL` corrected (it routes through
`isSafePublishedUrl`). One implementation of each predicate, no fork.

**`primitives.ts`** — TYPES ONLY (`CmsPrimitives` = Txt, Img, Link, List). The
SHAPE is copied from `WorkPrimitives`; there is NO import from
`src/modules/skeletons/work/blocks/primitives.ts`. Dropped `Logo`/`Nav` (not needed)
and the `elementKey` write-path (CMS items are never canvas-editable).

**`toRenderModel.ts`** — the single data feed. Coercion-proof by construction:
per-field shape is `{fieldId, name, fieldType, value}` (never `{type, content}`);
ordered data lives in ARRAYS (groups/items/fields), so there is no numeric-keyed map
anywhere in the model. Sanitization is INSIDE this function — NARROW `isSafeURL` on
image/gallery src, WIDE `isSafePublishedUrl` on link/video/audio — so editor and
publish consume the same already-sanitized model. Also exports
`CMS_MODEL_ELEMENT_KEY = 'cmsModel'` (the element key phase 3's materializer must
write) plus the reader helpers the core uses.

**`CollectionSection.core.tsx`** — plain server-safe layout, dispatched purely on
field TYPE, roles driving card composition (cover = lead media, title = h3,
primaryLink = CTA). Stacked groups with headers (Deviations #1). Styles ship inline
via a `<style>` tag (the FollowStrip/StoreBadges shared-block convention), so the
block needs NOTHING from `public/published.css` — no CSS build step is required for
this phase. Self-sets `data-surface="neutral"`.

**`CollectionSection.tsx`** — `'use client'` edit twin; edit primitives (inert
anchors) + the greyed "Manage items" placeholder button (`disabled` + `title`
why-tooltip), rendered OUTSIDE `[data-cms-body]`. No store access yet (phase 3);
no `model` prop renders the loading skeleton.

**`CollectionSection.published.tsx`** — flat props, no hooks; reads
`props[CMS_MODEL_ELEMENT_KEY]` (the published renderer's `extractContentFields`
spread — no nested `data` prop invented). Imports only the core + `resolveCtaHref`
(plain module). Missing model gives `EMPTY_CMS_MODEL` → empty block, never a crash.

**Registries** — `cmscollection` added to `registry.ts` (edit twin) and
`registry.published.ts` (published twin), `cmscollection: null` added to
`capabilities.ts` (followstrip precedent, no new `CapabilityId`), and
`capabilities.test.ts` (c) now asserts `sharedBlockCapability.cmscollection` is null
with `sharedBlockCapabilities` still `toHaveLength(2)`. Test (a) key-sync passes.

### Deviations / unpinned decisions I had to make

1. **`publishSanitizer.ts` re-exports rather than merely imports**
   `isSafePublishedUrl` — required by `publishSanitizer.test.ts:4`. Flagged in the
   brief; recorded here.
2. **Unsafe URL drops the FIELD**, it is not rewritten to `'#'` (the publish
   sanitizer's convention). Rationale: a CMS field is content, not a template CTA;
   a dead `#` link with a real label is a worse lie than an absent field. The
   defense-in-depth publish walker still runs downstream.
3. **Ungrouped bucket placement** (plan silent): FIRST when the collection has no
   groups at all (the common single-list case), LAST when named groups exist.
   Empty groups are dropped (no stray headers).
4. **video/audio v1 render as a labelled destination link**, not an inline player.
   Player is a follow-on; the stored value + wide predicate already support both.
5. **Role fallback is per-collection, not per-item** — resolved once from the field
   schema (first allowed-type field in order) and stored on `model.roles`. An
   explicit role pointing at a deleted or wrong-typed field falls back rather than
   erroring (defensive-defaults, matching phase 1's orphaned-key tolerance).
   Tested both ways.
6. **Edit twin takes `model` as a prop this phase.** Phase 3 replaces that with the
   store adapter (`elements.collectionId` → `cmsData` → `toRenderModel`). Building
   the store read now would have required editing phase-3 files.
7. **Parity comparison scope**: the `[data-cms-body]` subtree, comparing tag +
   class + `data-cms-*` attrs + text. `href`/`target`/`rel`/`loading`/`aria`/
   `data-lessgo-cta` are deliberately excluded — those are the sanctioned twin
   differences (inert edit anchors vs live published CTAs). Everything structural
   must match exactly.
8. `@testing-library/react` is NOT a dependency in this repo; the parity test uses
   `renderToStaticMarkup` + jsdom parsing, matching `followStrip.parity.test.tsx`.

### Verification (actual results)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **clean**, zero output |
| `npm run test:run` (FULL) | **268 files passed / 1 skipped (269)** · **4290 tests passed / 15 skipped (4305)** — baseline 266 files / 4263 tests, so +2 files (the two new test files) and +27 tests, zero regressions |
| `npx vitest run src/modules/cms src/modules/generatedLanding/sharedBlocks` | 7 files / 70 tests passed |
| `headTags` / staticExport / `publishSanitizer` suites (the predicate-move regression signal) | green inside the full run |
| `npx next lint --file <14 touched files>` | 0 errors; 2 warnings, both the repo-wide `@next/next/no-img-element` on the twin `<img>` emitters — identical to every other block twin (a published renderer cannot use `next/image`) |
| Published-CSS build | not needed: the block ships its CSS in an inline `<style>` tag, so there is no `public/published.css` dependency |

### Open risks / what the reviewer should scrutinise

- **The predicate move is the highest-blast-radius edit here.** Both bodies were
  copied verbatim; the regression signal is the existing `headTags.test.ts`
  `isSafeURL` block + `publishSanitizer.test.ts`, both green. Worth a reviewer
  eyeball on the diff to confirm no character drifted.
- **Boundary law**: `toRenderModel.ts` imports only `@/lib/safeUrl` plus type-only
  imports from `../types`. Nothing in `src/modules/cms/render/` (except the
  `'use client'` edit twin itself) is client-hostile. This is the invariant to
  re-check in phase 3 when the editor adapter lands.
- **`CMS_MODEL_ELEMENT_KEY = 'cmsModel'`** is now a cross-phase contract: phase 3's
  materializer MUST write the model under that exact key or the published twin
  silently renders "No items yet". The published twin reads it via the constant.
- The parity gate compares a *structural skeleton*, not byte-identical HTML. That
  is deliberate (twins legitimately differ on href/target/beacon attrs) but it does
  mean an attribute-only divergence would not be caught here — the byte-identical
  round-trip gate lands in phase 3.
- The block is **not yet reachable** from any UI or publish path (by design —
  phase 3 wires placement). Registry resolution is proven by the
  `capabilities.test.ts` key-sync test, not by a dispatch test through
  `componentRegistry` (not in this phase's Files touched).

---

## Phase 2 hardening

Additive tightening of the phase-2 test/doc surface, closing 4 non-blocking
impl-review nits. **No runtime behaviour changed** — no source file under
`render/` other than the two test files was touched.

**Files changed**

- `src/modules/cms/render/parity.test.tsx`
- `src/modules/cms/render/toRenderModel.test.ts`
- `src/modules/cms/README.md`
- `docs/task/cms-collections.audit.md` (this section)

### 1. `parity.test.tsx` — hardened the comparator (the important one)

`skeleton()` compared only tag + `class` + `data-cms-*` + text. Because the two
primitive factories are hand-duplicated ~60-line copies, the EXCLUDED attributes
were exactly where divergence can hide.

- Introduced `COMPARED_ATTRS = ['class', 'style', 'src', 'alt', 'href']` and
  folded it into the skeleton line format (`tag[class=…|style=…|src=…|alt=…|href=…]{data-cms…}`).
- Exclusion list shrunk to the genuinely sanctioned twin differences only:
  `target`, `rel` (published-only, from `externalLinkProps`), `data-lessgo-cta*`
  (published-only beacon), `aria-label`, and edit-only interaction hooks (inert
  `onClick`) / the `manageSlot` affordance (already outside `[data-cms-body]`).
- `href` un-excluded: it is byte-identical in both twins (`href || '#'` in each),
  so excluding it was over-broad.
- Header comment rewritten to match.

**Fixture already exercised everything newly compared** (verified, not assumed):
`blurb: 'A long\nblurb about focus.'` → multiline `text_long` → `pre-wrap`;
cover/gallery images carry a non-empty `alt` (`title` value / `field.name`);
`buy` carries `mailto:`/`tel:` hrefs. Added four explicit anti-theatre guards in
the parity test asserting `pre-wrap`, a real `src`, a non-empty `alt` and
`href=mailto:hi@acme.com` are actually present in the compared skeleton — so
widening `COMPARED_ATTRS` can never be vacuous.

**Proof the hardened gate bites.** Ran the divergence experiment two ways:

1. *Permanent meta-test* (new `describe('the parity comparator detects a real
   divergence')`, 3 tests): renders `CollectionSectionCore` with a deliberately
   diverged published `Txt` (pre-wrap dropped — the exact bug that would collapse
   `text_long` newlines in published only) and a diverged `Img` (alt dropped), and
   asserts the skeletons DIFFER; a third test asserts the REAL published
   primitives still match, so the mutations are the only difference.
2. *Confirming the widening is what bites*: temporarily narrowed
   `COMPARED_ATTRS` back to `['class']` and re-ran. Observed **4 failures**:
   both `renders an identical body skeleton …` cases failed on
   `expected '…' to contain 'pre-wrap'`, and BOTH meta-tests failed with
   `expected '…' not to be '…' // Object.is equality` — i.e. under the old
   comparator the pre-wrap divergence and the alt divergence produced
   **identical skeletons and sat green**. Exactly the inert-assertion class this
   repo has been bitten by. Restored immediately; verified byte-identical against
   a scratchpad backup (`diff` → no output) before proceeding.

### 2. `parity.test.tsx` — dispatch resolution asserted

New `describe('CMS collection block — shared-block dispatch resolves')`:
`resolveSharedBlock('cmscollection') === CollectionSection` and
`resolveSharedBlockPublished('cmscollection') === CollectionSectionPublished`
(the assertions `followStrip.parity.test.tsx:61-67` has and this lacked). Without
them a consistently mis-cased key (`cmsCollection` in BOTH registries AND
`capabilities.ts`) passes the key-sync test and then never resolves at runtime.

### 3. `toRenderModel.test.ts` — corrected the coercion predicate (live phase-3 trap)

The test asserted `keys.every(numeric)` ("all keys numeric"). The real rule in
`coercePublishValue` (`layoutElementSchema.ts:389-394`) is
`charKeys.length > 0 && charKeys.every(k => typeof val[k] === 'string')` over the
NUMERIC keys only — so **any single** numeric key holding a string collapses the
whole object into the concatenation of just its numeric keys, silently discarding
every non-numeric sibling. Changed to the stronger `keys.some(isNumeric) === false`
on every object in the model, with a comment stating the real rule. Matches the
orchestrator-corrected plan text. (`deepWalk` skips arrays before `visit()`, so
array indices do not false-positive — checked.)

### 4. `README.md` — cross-phase element-key contract documented

New prominent `## ⚠️ Element-key contract (cross-phase, silent on failure)`
section: the materialized model MUST be written under `CMS_MODEL_ELEMENT_KEY`
(`'cmsModel'`, `toRenderModel.ts:53-59`), imported as the constant, never
re-typed. Any other key does not throw, warn, or fail the publish — the page just
renders an empty **"No items yet"** block, because the published twin falls back
to `EMPTY_CMS_MODEL`. Names phase 3's `materializePublish.ts` as the consumer at
risk.

### Deviations

1. **The divergence proof lives in the test file, not as a transient edit to
   `CollectionSection.published.tsx`.** The brief suggested temporarily mutating
   the published primitive; that file is NOT on this phase's Files-touched list,
   and the Files-touched rule is a hard stop. I got the same evidence entirely
   in-scope — and strictly stronger, since the meta-test is now a PERMANENT guard
   that the comparator keeps biting, rather than a one-off manual check. I also
   ran the `COMPARED_ATTRS = ['class']` narrowing (in my own file) to prove the
   widening specifically is what catches it. Both experiments restored; working
   tree verified.
2. `href` guard asserts the `mailto:` case specifically rather than all hrefs —
   conservative, and the pre-existing wide-predicate test already covers
   `mailto:`/`tel:` end-to-end.

### Verification (actual)

- `npx tsc --noEmit` → **clean, zero output**.
- `npm run test:run` → **268 files passed | 1 skipped (269)**;
  **4295 tests passed | 15 skipped (4310)**, 74.5s.
  Baseline was 268 files / 4290 tests → **+5 tests, exactly the 5 added**
  (2 dispatch + 3 comparator meta-tests). **Zero regressions.**
- `src/modules/cms` alone: 3 files / 44 tests passed (was 41).

### Open risks

- The two primitive factories remain hand-duplicated; the hardened gate now
  *detects* divergence but does not *prevent* it. Deduping them is explicitly
  out of scope here and left for a later phase.
- `aria-label` is still excluded from the comparison. It is currently identical
  in both twins, so excluding it is over-broad the same way `href` was — a small
  follow-on could fold it in. Left alone to keep this pass minimal.
- The `.lg-cms__gframe` sizing nit and `CollectionSection.core.tsx` rendering
  were untouched, as instructed.

---

## Phase 3 — placement + publish materialization

**STATUS: code complete + green, EXCEPT one blocked out-of-scope edit — see
"Blocked (needs orchestrator approval)" below. `npm run test:run` is currently
RED on 4 pre-existing tests in `src/app/api/publish/route.test.ts`, a file that
is NOT on this phase's Files-touched list, so I did not touch it.**

### Files changed

| File | New? | What changed |
|---|---|---|
| `src/modules/cms/materializePublish.ts` | new | server-only publish materializer |
| `src/modules/cms/materializePublish.test.ts` | new | the binding publish gate (18 tests) |
| `src/app/api/publish/route.ts` | — | ownership gate + materializer call (+2 imports) |
| `src/app/api/publish/publish.authz.test.ts` | new | authz regression for the new gate (6 tests) |
| `src/hooks/editStore/cmsActions.ts` | new | `cmsData` cache + placement actions |
| `src/types/store/state.ts` | — | `CmsDataCache` + `cmsData?` on `LayoutSlice` |
| `src/types/store/actions.ts` | — | 4 action signatures (on `MetaActions`, see Deviations) |
| `src/stores/editStore.ts` | — | slice wiring + `cmsData: undefined` initial state (NOT `partialize`) |
| `src/modules/cms/render/CollectionSection.tsx` | — | store adapter (placement → `cmsData` → `toRenderModel`) |
| `e2e/cms-publish.spec.ts` | new | opportunistic e2e (not the gate) |
| `docs/task/cms-collections.audit.md` | — | this section |

### Per file

**`src/modules/cms/materializePublish.ts`** — `findCmsSections` walks BOTH
containers (root `content.content ?? content` via `content.layout.sections`, and
every `content.subpages[*]` via its own `layout.sections`), filtering on the
lowercased section-id TYPE prefix, so it is structurally incapable of rewriting
`works` / `products` / anything else. `materializeCmsContent` (PURE, no DB) sets
`elements = {collectionId, layoutHint?, cmsModel}` and **preserves `id` and
`layout`** (defaulting to `SharedCmsCollection` only when absent) plus every
other section prop. The model is written under the imported
`CMS_MODEL_ELEMENT_KEY` constant — never a retyped literal. `loadCmsBundles`
filters by `tokenId` as a second tenant boundary. `materializeCmsForPublish` has
a **zero-query fast path**: a payload with no cms sections issues no queries at
all, so every existing customer publish is unchanged in behaviour and DB load.

**`src/app/api/publish/route.ts`** — two insertions, both immediately before the
`sanitizeContentForPublish` call:

1. the pinned, result-checked
   `assertProjectOwner(userId, tokenId, { action: 'publish', allowMissing: true })`
   followed by `if (!owner.ok) return createSecureResponse(...)`. This gate did
   not exist before this phase.
2. `await materializeCmsForPublish(tokenId, content)` — after the gate, before
   both sanitize chokepoints.

`verifyProjectAccess` remains imported-but-unused (pre-existing; removing it was
out of scope).

**Store** — `cmsData` is runtime-only: absent from `partialize`, from
`finalContent`, from the publish payload; `persistenceActions.ts` untouched.
`addCmsSection` writes the **DUAL PIN** (`sectionLayouts[sid]` AND
`content[sid] = {id, layout, elements}`) and NO `sectionSpacing` entry.

**`CollectionSection.tsx`** — an injected `model` prop still wins (keeps
`parity.test.tsx` store-free and green); otherwise the placement
(`elements.collectionId`) is resolved against `cmsData` in a CHILD component, so
the `useEditStore` hook never runs on the injected path and the block stays
renderable outside an `EditProvider`. No markup/CSS change → `.published.tsx`
needed no edit (parity preserved; the parity suite still passes).

### Deviations from the plan

1. **Action signatures went on `MetaActions`, not `LayoutActions`** (plan said
   "where `navigationConfig`/`legalPages` and the existing action types live").
   `createLayoutActions` is annotated `: LayoutActions` and lives in
   `layoutActions.ts`, which is NOT on this phase's Files-touched list — adding
   required members to `LayoutActions` broke its return type (TS2739).
   `MetaActions` is the store's cross-cutting bag (reset/export/save/baseline),
   is composed from several creators, and required no out-of-scope edit.
   `state.ts` still carries `cmsData` on `LayoutSlice` as planned. Documented
   inline at the declaration.
2. **Unknown/deleted `collectionId` → the `cmsModel` key is OMITTED** rather than
   written as an empty model. The published twin already falls back to
   `EMPTY_CMS_MODEL` and renders "No items yet"; omitting avoids importing a
   `.tsx` renderer into the server-only materializer. Asserted by test.
3. **A DB failure inside the materializer fails the publish** (bubbles to the
   route's outer catch → 500) rather than publishing silently-stale content.
   Blast radius is nil for non-CMS projects (zero-query fast path). Flagged for
   the reviewer below.
4. `e2e/cms-publish.spec.ts` places the section by writing the persisted shape
   through `saveDraft` (there is no placement UI until phase 6).

### Verification (actual)

- `npx tsc --noEmit` → **clean, zero output**.
- `npm run test:run` → **269 passed | 1 failed | 1 skipped (271 files)**;
  **4315 passed | 4 failed | 15 skipped**.
  - The 4 failures are ALL in `src/app/api/publish/route.test.ts` (pre-existing
    file, not on Files-touched): its `vi.mock('@/lib/security', ...)` returns a
    hand-built object with only `createSecureResponse` / `validateSlug` /
    `verifyProjectAccess`, so the route's new `assertProjectOwner` call throws
    `[vitest] No "assertProjectOwner" export is defined on the "@/lib/security"
    mock`. It is a MOCK-COMPLETENESS gap, not a behaviour regression.
  - Every other pre-existing suite is green, including `collectionHelpers.works`,
    `naayomProducts`, `homeTeasers`, `collections.authz`, the cms parity suite,
    and the staticExport + persistence suites.
  - New tests: 18 (`materializePublish.test.ts`) + 6 (`publish.authz.test.ts`).
  - Note: the brief's stated baseline (268 files / 4295 tests) is stale; the
    actual pre-phase baseline on this branch is 269 files / 4310 tests.
- **Mutation check (the gate is not theatre):** deleting the
  `if (!owner.ok) return ...` line makes 3 of the 6 authz tests fail
  (403 / 401 / 404 + body). Restored immediately; `git diff --stat` confirms the
  file matches the intended 29-line insertion.
- `npx eslint` on all touched files → 0 errors, 1 warning (the pre-existing
  `no-img-element` warning in `CollectionSection.tsx`, untouched by this phase).
- **e2e NOT run** — Playwright needs a dev server + Clerk session + Blob/KV; not
  executed locally. I am not claiming it passes.

### Blocked (needs orchestrator approval)

`src/app/api/publish/route.test.ts` needs one entry added to its existing
`vi.mock('@/lib/security', ...)` factory:

```ts
assertProjectOwner: vi.fn(async () => ({
  ok: true, isDemo: false, adminOverride: false, userRecord: { id: 'u1' }, project: null,
})),
```

That is the whole fix (mock completeness — that file's 4 tests are about
static-export failure handling and are unrelated to ownership). The file is not
on this phase's Files-touched list, so per the scope rules I did NOT edit it.
**`npm run test:run` stays RED until this is approved.**

### What the reviewer should scrutinise

- The route insertion ORDER: gate → materializer → `sanitizeContentForPublish`
  (:54) → `sanitizeContentHtml` (:106). Anything reordered breaks the XSS and
  coercion arguments.
- `allowMissing: true` is load-bearing; the `TOKEN_ORPHANLESS` test covers it.
- Deviation 3 (materializer DB error fails the publish) is a judgment call —
  swap to fail-soft if the founder prefers publishing with a stale/empty block.
- The parity test in `materializePublish.test.ts` renders through
  `LandingPagePublishedRenderer` and includes a deliberate "delete the layout →
  the section vanishes" test proving the gate bites. Do not let a future pass
  simplify it to a direct registry render.
- Orphan-project pass-through (`security.ts:97-109`) is inherited, not
  introduced: any authed user still passes the gate on an unowned project.

---

## Phase 3 — follow-up (authorized scope extension)

### Files changed (this follow-up)

- `src/app/api/publish/route.test.ts`

### What changed

Added the missing `assertProjectOwner` entry to the file's existing
`vi.mock('@/lib/security', ...)` factory, unblocking module resolution for the
route's new call. Also added a 3-line comment above the factory explaining that
the factory REPLACES the whole module, so any omitted export resolves as
`undefined` and fails at call time — the next person adding a `security.ts`
export sees why it must stay in sync.

Verified against the REAL success shape in `src/lib/security.ts:47-55`
(`ProjectOwnerResult`). The proposed mock matched the real owner-path success
branch (`security.ts:94`) **exactly** — no difference to report. `project: null`
is valid per the type (`project: { userId: string | null } | null`) and is the
literal shape returned by the `allowMissing` branch (`security.ts:87`), which is
the branch this route triggers.

**No behavioural change to the 4 tests.** The route consumes the result only via
`if (!owner.ok) return ...` (`route.ts:68`) — it never reads `userRecord`,
`project`, `isDemo`, or `adminOverride`. An `ok: true` mock is therefore a pure
pass-through gate. All 4 tests still exercise static-export failure handling with
their original bodies and assertions untouched (case 1 throw → 500, case 1b
blob rollback via `del()`, case 2 KV-write sub-catch, case 3 happy-path pin).

Only the mock factory was edited. No assertion, test body, or unrelated mock was
altered.

### Rulings accepted (recorded, no action taken)

1. **Action signatures on `MetaActions`, not `LayoutActions`** — accepted as
   built. `createLayoutActions` is annotated in a file outside the phase's
   Files-touched list; forcing it there would have required an out-of-scope edit.
2. **Materializer DB error fails the publish (500) rather than publishing an
   empty block** — accepted, kept as built. This is a **deliberate fail-closed
   decision**: silently publishing a page with the user's catalog missing is
   worse than a retryable failed publish. The zero-query fast path (no
   `cmscollection` section placed → no DB call) means non-CMS publishes carry no
   new failure mode. Supersedes the "swap to fail-soft" note above.

### Test results (ACTUAL)

- `npx tsc --noEmit` — clean, no output, exit 0.
- `npx vitest run src/app/api/publish/route.test.ts` — **4 passed / 4**.
- `npm run test:run` — **FULLY GREEN: 270 passed | 1 skipped (271 files);
  4319 passed | 15 skipped (4334 tests)**, 75.09s.

Corrected baseline: pre-phase was **269 files / 4310 tests** (not 268/4295 —
that figure was stale). +2 files / +24 tests from this phase lands exactly on the
predicted 271 / 4334.

### Open risks

Unchanged from the Phase 3 section above. The mock-completeness class of bug
recurs whenever a route gains a `security.ts` import while a whole-module
`vi.mock` factory shadows it; the inline comment is the only guard (vitest does
not type-check factory completeness against the real module).

Not committed, per instructions.

---

## Phase 3 — BLOCKING fix: url-suffix key corruption at the SECOND publish chokepoint

### Files changed

- `src/modules/cms/render/toRenderModel.ts`
- `src/modules/cms/render/toRenderModel.test.ts`
- `src/modules/cms/render/CollectionSection.core.tsx`
- `src/modules/cms/render/CollectionSection.published.tsx`
- `src/modules/cms/render/parity.test.tsx` (one comment)
- `src/modules/cms/materializePublish.ts` (header note only)
- `src/modules/cms/materializePublish.test.ts`
- `src/modules/cms/README.md`
- `src/hooks/editStore/cmsActions.test.ts` (**new**)
- `e2e/cms-publish.spec.ts` (one comment)
- `docs/task/cms-collections.audit.md` (this section)

NOT changed: `src/hooks/editStore/cmsActions.ts` (no rename reached it — it only
writes placement `collectionId`/`layoutHint`), `src/modules/cms/render/CollectionSection.tsx`
(carries no renamed key), `src/modules/cms/render/primitives.ts` (see Deviations #1).

### The bug (confirmed, not theoretical)

The plan pinned coercion on ONE chokepoint (`sanitizeContentForPublish`,
`route.ts:82`). There is a SECOND: `sanitizeContentHtml` (`route.ts:133`), whose
`sanitizeItemObject` walks `elements` and key-dispatches strings by SUFFIX via
`isUrlContentKey` (`publishSanitizer.ts:173-181`: `href|url|link|slug`) then
`sanitizePublishedUrl`, which yields `'#'` for non-URLs.

`elements.cmsModel` is an object, so it is recursed with `allowRecurse=true`:
top-level string props AND the nested `roles` object are all dispatched. Two
render-model keys matched the suffix rule but are NOT URLs:

| key | value | became |
|---|---|---|
| `CmsResolvedRoles.primaryLink` | a FIELD ID (`"buy"`) | `'#'` |
| `CmsRenderModel.collectionSlug` | a slug (`"books"`) | `'#'` |

Published consequences: `data-cms-collection="#"` on every published CMS section,
and — because `fieldById(item, '#')` returns `null` (`CollectionSection.core.tsx:133`)
— **every card's CTA slot rendered empty on the published page while populated in
the editor**; the link field fell through to `nonRoleFields` and rendered as a
generic row. Hits ANY collection with a link field (`resolveRole` auto-falls-back
to the first link field even with no explicit role).

### Fix — approach (a): renamed the keys

Did NOT exempt `cmsModel` from the walk (that would lose the legitimate HTML pass
over `collectionName` + group names).

| was | now | carries |
|---|---|---|
| `CmsResolvedRoles.primaryLink` | `primaryCta` | a field id |
| `CmsRenderModel.collectionSlug` | `collectionRef` | the collection slug |
| `CmsItemRender.slug` | `itemRef` | the item slug |

`itemRef` was renamed too even though it escapes the walker today: it escapes only
by recursion DEPTH (`groups[].items` is reached with `allowRecurse=false`) — depth
luck, not design — and phase 4 renders item slugs into hrefs.

**Sweep result:** the only remaining suffix-matching keys anywhere in the model are
the genuine `url` keys inside image / gallery / video / audio / link values. Those
are real URLs; scheme-gating them is correct and desirable, so they were left
alone. Non-matching keys verified individually: `collectionId`, `collectionName`,
`detailPages`, `layoutHint`, `groupId`, `name`, `items`, `itemId`, `fields`,
`fieldId`, `fieldType`, `value`, `label`, `kind`, `assetId`, `title`, `cover`.
This sweep is now enforced permanently by a meta-test rather than by inspection.

The STORED `CollectionRoles.primaryLink` (Zod/DB contract) keeps its name — it
never enters `elements`. `toRenderModel()` bridges the two vocabularies at one
line, commented at the bridge.

Consumers updated: `toRenderModel.ts` (types, `ROLE_TYPES`, `toItemRender`,
`toRenderModel`, `nonRoleFields`), `CollectionSection.core.tsx` (`roles.primaryCta`,
`data-cms-collection={model.collectionRef}`), `CollectionSection.published.tsx`
(`EMPTY_CMS_MODEL`), and all phase-2/3 tests.

`materializePublish.ts` needed no code change (it never names these keys); it got a
header note pointing at the two-chokepoint hazard, because it is the module that
writes the model into `elements`.

Why-note recorded in BOTH `toRenderModel.ts` (a top-of-file block, where an author
renaming a field will actually be looking) and `src/modules/cms/README.md` (new
section "Render-model KEY NAMES are constrained"), including an explicit
"do NOT fix this by exempting `cmsModel`" instruction.

### The gate could not see this bug — fixed

`materializePublish.test.ts` ran only `sanitizeContentForPublish`. Both the
byte-identical round-trip AND the materialized-snapshot parity render now go
through a shared `runPublishSanitizers()` helper that runs **both chokepoints in
route order**. Added:

- named non-`'#'` assertions on exactly the corrupted values
  (`roles.primaryCta === 'buy'`, `collectionRef === 'books'`, `itemRef === 'deep-work'`);
- a "no model key was scheme-gated to `'#'`" test;
- **a permanent META-GUARD**: no key anywhere in a materialized `cmsModel` may match
  `isUrlContentKey` except `url` — imported from the real `publishSanitizer`, so it
  tracks the rule rather than duplicating it. Includes anti-vacuity assertions on
  both sides (>20 entries walked; the sanctioned `url` key must actually be present).
- CTA anti-vacuity in the parity test (`lg-cms__cta` + `mailto:hi@acme.com` present
  in the published skeleton) — the assertion the bug's symptom would break.

**Deliberate-revert evidence (ACTUAL, observed).** Reverted `primaryCta` back to
`primaryLink` across `toRenderModel.ts` + `CollectionSection.core.tsx`, then ran
`npx vitest run src/modules/cms/materializePublish.test.ts`:

```
Tests  4 failed | 16 passed (20)

x round-trips through BOTH publish chokepoints BYTE-IDENTICAL
x the SECOND chokepoint does not scheme-gate any model key to "#"
    AssertionError: expected [ [ 'primaryLink', '#' ] ] to deeply equal []
x META-GUARD: no model key ends in href/url/link/slug except sanctioned `url` values
    AssertionError: expected [ 'primaryLink' ] to deeply equal []
x publishes the SAME body skeleton the editor renders from the same tables
    AssertionError: expected 'div[class=lg-cms__in|...' to be 'div[class=lg-cms__in|...'
```

Four independent failures, including the parity skeleton diverging — i.e. the gate
now catches the real user-visible symptom (published CTA gone), not just the key
name. Rename restored; full suite re-run green (below). The pre-fix gate caught
NONE of these.

### Also fixed (from the same review)

1. **`e2e/cms-publish.spec.ts:87` comment corrected.** It claimed "Editor renders
   the collection from the runtime cache" while asserting only hero text. Nothing
   populates `cmsData` yet (`refreshCmsData` still has zero callers until the CMS
   panel lands), so a placed section shows the skeleton there. The comment now says
   the step asserts only that the page mounted, and points at `parity.test.tsx` for
   real editor-side collection rendering. **The assertion was NOT changed** — no
   faking in either direction.
2. **Dual-pin framing corrected + now actually tested.** The earlier audit
   overstated the protection: reverting `addCmsSection` to map-only would NOT have
   failed the suite, because `materializeCmsContent` defaults a missing layout to
   `CMS_COLLECTION_LAYOUT` (`materializePublish.ts:148`), so the section would
   publish as an EMPTY block rather than vanishing — green suite, broken page. New
   `src/hooks/editStore/cmsActions.test.ts` (4 tests, driven through the real
   `createEditStore`) asserts `addCmsSection` writes BOTH
   `sectionLayouts[sectionId]` AND `content[sectionId].layout` as independent
   assertions, on both the default and the `layoutHint`+`position` path, plus
   `removeCmsSection` clearing both. That file's header records why the publish-side
   test cannot cover this.

### Deviations

1. **`primitives.ts` left untouched.** It carries a stale doc-comment referring to
   the "primaryLink role". I edited it, then reverted it byte-for-byte on noticing
   the file is NOT on this phase's Files-touched list (`git diff` confirms zero
   diff). It is a comment-only inaccuracy in a prop doc; flagging rather than
   editing out of scope.
2. **`parity.test.tsx` got only a comment update.** Its `roles: {...primaryLink: 'buy'}`
   fixture is the STORED `CollectionRoles` shape (correct as-is); it makes no
   assertion on the renamed model keys, so no assertion changed.
3. **`cmsActions.ts` not modified** — no rename reached it, and the review asked for
   it "only if a rename touches it".
4. `cmsActions.test.ts` uses the real `createEditStore` (the `pageActions.test.ts`
   precedent) rather than a hand-rolled fake `set`, so it exercises the real
   immer/persist pipeline the bug would live in.

### Test results (ACTUAL)

- `npx tsc --noEmit` — **clean, no output, exit 0.**
- `npm run test:run` — **FULLY GREEN: 271 passed | 1 skipped (272 files);
  4326 passed | 15 skipped (4341 tests)**, 75.97s.
- Delta vs the stated baseline (270/1 files, 4319/15 tests): **+1 file** (new
  `cmsActions.test.ts`), **+7 tests** = 4 cmsActions + 1 `itemRef` in
  `toRenderModel.test.ts` + 2 in `materializePublish.test.ts` (scheme-gate check +
  meta-guard). Exactly as predicted; no test was deleted or weakened.
- Scoped re-run after restoring the rename:
  `npx vitest run src/modules/cms src/hooks/editStore/cmsActions.test.ts src/app/api/publish`
  → **7 files / 79 tests passed.**
- **e2e NOT run** — Playwright needs a dev server + Clerk session + Blob/KV. Not
  claiming it passes; the only change there is a comment.

### Open risks

1. **The suffix rule is a moving target.** The meta-guard imports the real
   `isUrlContentKey`, so widening the rule in `publishSanitizer.ts` (e.g. adding
   `endsWith('path')`) will fail the CMS gate rather than silently corrupting
   published pages. That is intended — but whoever widens it must be prepared to
   rename a CMS model key, not to add an exemption.
2. **The class of bug is broader than CMS.** Any future structured (non-flat-string)
   element payload hits the same `sanitizeItemObject` walk. Nothing outside
   `src/modules/cms` was audited for it in this pass; that sweep is out of scope
   here and worth queueing.
3. **`refreshCmsData` still has zero callers** — a placed section shows the skeleton
   in the editor until the CMS panel phase wires it. Known, expected, now honestly
   documented in the e2e spec instead of implied otherwise.
4. Item-level model keys are still only ONE recursion level away from the walker. If
   `sanitizeItemObject`'s `allowRecurse` depth is ever increased, `itemRef` is
   already safe but any NEW item-level key must obey the same naming rule — the
   meta-guard walks the whole model, so it covers that.

Not committed, per instructions.

---

## Phase 3 — cleanup (3 non-blocking nits from re-review)

**Files changed**
- `src/modules/cms/sectionKeys.ts` (NEW)
- `src/modules/cms/materializePublish.ts`
- `src/hooks/editStore/cmsActions.ts`
- `src/modules/cms/render/primitives.ts`
- `src/modules/cms/materializePublish.test.ts`
- `docs/task/cms-collections.audit.md` (this section)

No runtime behaviour, rendering, sanitize-chain, 403-gate or assertion strength changed.

### 1. `@prisma/client` out of the editor client bundle

`src/modules/cms/sectionKeys.ts` (new, zero imports) now OWNS `CMS_SECTION_TYPE`,
`CMS_COLLECTION_LAYOUT`, `isCmsSectionId`. `materializePublish.ts` imports them from
there and **re-exports all three** — required, not optional: `materializePublish.test.ts`
AND `cmsActions.test.ts` (the latter outside this phase's Files-touched list) both import
them from `materializePublish`. `cmsActions.ts` now imports from `sectionKeys`; a header
comment in both files pins WHY, so the slice doesn't become the precedent.

**Verified by build, before/after — with one correction to the reported magnitude:**

| | chunk | `PrismaClient` in chunk | size |
|---|---|---|---|
| before | `3500-929ca15c5e5332db.js` | 1 (`new eS.PrismaClient` immediately preceding `let ek="SharedCmsCollection"`) | 348,332 B |
| after | `3500-d2c0365b86f896a1.js` | **0** | 348,052 B |

After the fix, `PrismaClient` appears in **zero** files under `.next/static/chunks` (whole-dir
grep on a clean rebuild — the stale pre-fix chunk was not left behind, so this is a true
full-build result). The CMS constants are no longer colocated with Prisma: post-fix context
is `…return o}let ew="SharedCmsCollection"`, with the `new eS.PrismaClient` clause gone.

**Deviation from the brief's framing (measurement, not scope):** the actual byte saving is
**~280 B, not ~73 kB**. Webpack resolves `@prisma/client` via its `browser` field to
`index-browser.js` (19 kB unminified — the Proxy stub), not the full engine runtime, so the
73 kB figure in the review was overstated. The dead weight was real but small. The reason to
keep the fix is architectural (no Prisma-bearing import in an editor store slice, no
precedent), not the byte count. Flagging so nobody later cites a 73 kB win that isn't there.

### 2. Stale comment
`render/primitives.ts:46` `primaryLink` → `` `primaryCta` `` on `CmsLinkProps.isPrimaryCta`.
Comment only.

### 3. Widened meta-guard fixture
`materializePublish.test.ts` `FIELDS` gained `clip` (`video`) + `track` (`audio`), with
matching `MediaValue` values on item `i1` (`{kind:'link',url:'https://cdn.test/clip.mp4'}`,
`{kind:'upload',url:'/track.mp3'}` — shapes taken from `safeMedia`). All **9** field types
now flow through the KEY-NAME meta-guard, so a future `mediaUrl`-style key in the
video/audio branch would trip the no-suffix-match assertion. Added no new test cases and
changed no assertion — the wider fixture flows through the existing ones (hence +0 net
tests, as predicted).

### Test results (actual)
- `npx tsc --noEmit` → **exit 0, zero output**
- `npm run test:run` → **271 passed | 1 skipped (272 files); 4326 passed | 15 skipped (4341)** — exact baseline, +0 net
- `npm run build` → **succeeded**, plus the bundle observation above

### Open risks
- `sectionKeys.ts` stays safe only while it stays import-free; that invariant lives in a
  comment, not a lint rule. A future import there re-opens the hole silently.
- `cmsActions.test.ts` still imports the constants via the `materializePublish` re-export
  (out of scope to change). The re-export is therefore load-bearing — deleting it breaks
  two test files.

Not committed, per instructions.

---

## Phase 4 — detail pages + slugs

### Files changed

| File | Status |
|---|---|
| `src/modules/cms/render/CollectionDetail.core.tsx` | NEW |
| `src/modules/cms/render/CollectionDetail.tsx` | NEW |
| `src/modules/cms/render/CollectionDetail.published.tsx` | NEW |
| `src/modules/cms/render/CollectionSection.core.tsx` | modified (detail links, `FieldNode` exported) |
| `src/modules/cms/render/toRenderModel.ts` | modified (detail selector + path builder) |
| `src/modules/cms/render/toRenderModel.test.ts` | modified (selector unit tests) |
| `src/modules/cms/render/parity.test.tsx` | modified (detail dispatch + detail parity) |
| `src/modules/generatedLanding/sharedBlocks/registry.ts` | modified |
| `src/modules/generatedLanding/sharedBlocks/registry.published.ts` | modified |
| `src/modules/generatedLanding/sharedBlocks/capabilities.ts` | modified |
| `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts` | modified |
| `src/modules/cms/materializePublish.ts` | modified (fan-out + guards) |
| `src/modules/cms/materializePublish.test.ts` | modified (phase-4 suites) |
| `src/app/api/collections/route.ts` | modified (slug shadow check) |
| `src/app/api/collections/[collectionId]/route.ts` | modified (slug shadow check) |
| `src/app/api/collections/[collectionId]/items/[itemId]/route.ts` | modified (item slug shadow check) |
| `e2e/cms-publish.spec.ts` | modified (extended, NOT a second file) |
| `docs/task/cms-collections.audit.md` | this section |

No file outside the plan's Phase-4 Files-touched list was edited. `pageActions.ts`,
`src/app/api/publish/route.ts`, `sectionKeys.ts` and `src/modules/cms/README.md` are
untouched.

### What changed, per file

**`toRenderModel.ts`** — added `CMS_DETAIL_ELEMENT_KEY = 'cmsItem'`, `CmsDetailModel`,
`cmsDetailPath()`, `allRenderItems()`, `toDetailModel()`. The detail model is a pure
SELECTOR over `CmsRenderModel` (it reuses the *same* `roles` object and the *same*
`CmsItemRender` objects by reference — asserted in `toRenderModel.test.ts`), so there is
still exactly ONE shaping path and a card cannot disagree with its detail page.
Model shape `{collectionId, collectionName, collectionRef, roles, item}` — no key ends in
`href|url|link|slug`; the only `url` keys are the genuine value URLs.

**`CollectionSection.core.tsx`** — `ItemCard` gained `detailHref`; when `model.detailPages`
is on, the card's title is wrapped in an `E.Link` to `cmsDetailPath(collectionRef, itemRef)`.
Items with no title role get a standalone "View" link instead of being silently unreachable.
`FieldNode` is now exported so the detail core renders fields through the identical emitters.
Two CSS classes added to the inline stylesheet.

**Detail trio** — `.core` holds the layout once (cover -> h1 -> labelled fields in schema
order -> primaryCta), `.tsx` injects the edit primitives, `.published.tsx` the static ones.
`.published` imports `makeCmsPublishedPrimitives` from `CollectionSection.published` (a plain
module) — never the edit factory: the published/client boundary law holds.

**`materializePublish.ts`** — `CMS_ITEM_SECTION_TYPE`, `CMS_COLLECTION_ITEM_LAYOUT`,
`isCmsItemSectionId`, `isCmsDetailSubpage`, `CmsPathCollisionError`, `buildDetailSubpages`,
`applyCmsDetailPages`, `reservedPagePaths`, `collectionSlugShadowsPage`,
`itemSlugShadowsPage`. `materializeCmsForPublish` now reconciles detail subpages on both the
normal and the zero-section fast path.

**Routes** — write-time shadow guards so a collection slug cannot own a namespace a real page
already occupies (`/products` on naayom is the motivating case), and an item slug cannot land
exactly on an existing page path.

### Pins honoured (each with the test that proves it)

- **Key-naming law** — detail model keys are `collectionRef` / `itemRef`; the meta-guard
  importing the REAL `isUrlContentKey` now covers the detail model too.
- **Dual pin on every fan-out section** — every id in a subpage's `layout.sections` gets
  `{id, layout: 'SharedCmsCollectionItem', elements}`; asserted per-section, plus a
  "stripped layout DOES vanish" test proving the gate bites.
- **Path convention** — subpage KEY and card HREF both asserted leading-slash absolute, and
  `/p/` prefixes explicitly asserted absent.
- **Subpage entry shape** — `Object.keys(entry)` asserted to be exactly
  `['content','layout','title']`; `layout.theme` and `seo` asserted `undefined`.
- **Authority scoping** — non-cms subpages byte-identical; only structurally-cms entries are
  written or pruned; `isCmsDetailSubpage` has its own truth-table test.
- **Collision = fail loud** — throws `CmsPathCollisionError`, and a separate test asserts the
  payload is byte-identical after the throw (no half-written fan-out).
- **Both sanitize chokepoints in route order** — detail subpages round-trip
  `runPublishSanitizers()` byte-identical. Verified non-vacuous: both sanitizers do walk
  `content.subpages`.
- **Parity through `LandingPagePublishedRenderer`** — the detail parity test renders the
  materialized subpage through the real renderer (post-BOTH-chokepoints), never the registry
  component directly.
- **`pageActions.ts` untouched** — `pageActions.test.ts` + `naayomProducts.test.ts` +
  `collectionHelpers.works.test.ts` run green (38 tests).

### FINDING the reviewer should scrutinise — the naming law now BITES on detail pages

I probed `sanitizeContentHtml`'s recursion depth into a subpage section empirically:

```
elements.<key>                       -> rewritten
elements.cmsItem.<key>               -> rewritten
elements.cmsItem.item.<key>          -> rewritten    <- the detail model's itemRef lives HERE
elements.cmsItem.item.fields[].<key> -> NOT reached
```

The README currently says item-level keys "escape the walker TODAY only by recursion DEPTH...
that is luck". On a **detail page that luck has run out**: `collectionRef` (depth 2) and
`itemRef` (depth 3) are both actively dispatched by the walker, so the phase-3 defensive
renames are what keep item pages working — a rename back to `collectionSlug`/`slug` would
'#'-corrupt the published item page while the editor rendered it fine. I added a test that
plants those forbidden key names at exactly those depths and asserts they become `'#'` while
the real keys survive, so this can never be dismissed as theoretical.
The README is NOT in the phase-4 Files-touched list, so I did not update its
"luck, not design" wording — **recommend a one-line README amendment in a later phase.**

### Deviations / unpinned decisions (conservative option taken, logged)

1. **Detail constants live in `materializePublish.ts`, not `sectionKeys.ts`.**
   `sectionKeys.ts` is the natural home (it exists to keep prisma out of client bundles) but
   is not in the phase-4 Files-touched list. Nothing client-side needs these constants today
   (no editor placement of detail sections exists), so nothing is dragged into the browser
   bundle. If a later phase places one from the editor, move them to `sectionKeys.ts` then.
2. **Collision error surfaces as a generic 500, not a user-readable message.**
   `applyCmsDetailPages` throws `CmsPathCollisionError` with a clear message, but
   `/api/publish` is not in the Files-touched list and its fatal catch returns
   `{error:'Internal Server Error'}`. The message reaches server logs + Sentry only.
   Mitigated by the write-time shadow guards (which make the publish-time collision hard to
   reach). **Recommend a 3-line catch in `route.ts` in a follow-up phase.**
3. **Stale-page pruning runs on the zero-cms-section fast path too.** Without it, removing
   the last collection section would leave its item pages published forever. This is purely
   structural (no DB query), so the "zero cms sections => zero queries" pin still holds and a
   project that never used the CMS is byte-identical to today.
4. **Detail pages are produced only for PLACED collections** (the materializer only loads
   bundles for collections referenced by a placed section). A `detailPages: true` collection
   that is never placed publishes no pages. Conservative; matches "the listing is the entry
   point".
5. **Card link placement**: title-as-link, with a "View" link fallback when the collection
   has no title role — chosen over making the whole card clickable, which would have changed
   the existing card skeleton and the phase-2 parity baseline.
6. **`toRenderModel.test.ts` and `parity.test.tsx` were edited** (the plan allowed this "IF
   the detail-item selector requires it"): selector unit tests in the former; detail
   dispatch-resolution + detail twin parity in the latter. The dispatch assertions are the
   valuable half — a consistently mis-cased `cmsCollectionItem` key would pass the
   capabilities key-sync test and then never resolve at runtime, publishing blank pages.
7. **Bounded slug derivation loop** in `collections/route.ts` POST: `uniqueSlug`'s clamp
   fallback is time-based and could repeat within a millisecond, so the shadow-avoidance loop
   is capped at 50 iterations and then 409s rather than spinning.

### Verification (actual results)

- `npx tsc --noEmit` — **exit 0, zero output** (baseline preserved).
- `npm run test:run` — **271 passed | 1 skipped (272 files); 4366 passed | 15 skipped (4381)**.
  Baseline was 4326 passed / 4341 total; **+40 tests, zero new test files** (all extensions),
  skipped count unchanged. No pre-existing suite regressed.
- `pageActions.test.ts`, `naayomProducts.test.ts`, `collectionHelpers.works.test.ts` — 38
  passed, sources untouched.
- `npm run lint` (scoped to the changed files, via `next lint --file`) — clean. One
  pre-existing `@next/next/no-img-element` **warning** in `parity.test.tsx` (the phase-2
  diverged-`Img` meta-test); its line number shifted because of my insertion, the warning
  itself is not new.
- **e2e: NOT run locally** — `e2e/cms-publish.spec.ts` needs a dev server + a Clerk session +
  Blob/KV, none of which are available here. The file typechecks cleanly under the project
  tsconfig (verified with a temporary e2e-scoped tsconfig; the only errors reported were
  pre-existing ones in `dashboard-redirects` / `engine-decider` / `parity` / `workPlan`).
  Its new test is written to the same local-500 tolerance as the phase-3 test.

### Open risks

- The e2e detail test asserts `>= 400` for the item path after toggle-off. If a CDN/ISR window
  serves the stale blob, that could flake on preview. Binding coverage is the vitest prune
  test; treat an e2e failure there as a cache question, not a logic one.
- Republishing is idempotent because detail section ids are derived from the item cuid. If a
  future phase ever regenerates item ids, every detail section id changes (content is
  rewritten wholesale anyway, so this is cosmetic, but worth knowing).
- The founder's phase-4 human gate should specifically check: item page reachable from BOTH
  `/p/<slug>` and a custom-domain root, and naayom's `/products/*` pages unchanged.

Not committed, per instructions.

---

## Phase 4 — authorized follow-ups (collision 409, constant relocation, README fact-fix)

Three scoped follow-ups on top of the phase-4 work above. Branch verified
`feature/cms-collections` before any edit. Nothing committed.

### Files changed

- `src/app/api/publish/route.ts`
- `src/app/api/publish/route.test.ts`
- `src/modules/cms/sectionKeys.ts`
- `src/modules/cms/materializePublish.ts`
- `src/modules/cms/README.md`
- `docs/task/cms-collections.audit.md` (this section)

### 1. `CmsPathCollisionError` → 409 (`route.ts`)

The materializer call is now wrapped in a `try` that catches **only**
`cmsError instanceof CmsPathCollisionError` and returns
`createSecureResponse({ error: cmsError.message }, 409)`. Every other throw is
re-thrown unchanged and still lands in the outer fatal catch's generic 500 —
fail-closed semantics for DB errors are untouched.

Unchanged, as required: the ownership gate above it, the call order relative to
`sanitizeContentForPublish`, and the `if (content && typeof content === 'object')`
guard (the try sits *inside* it).

**Status choice: 409, not 400.** The route already speaks 409 for the one existing
"that name is taken" conflict (`'Slug already taken'`). The 400 precedent
(`findLocaleSubpageCollision`) is the closer *message* analogue but the weaker
*semantic* one — a locale collision is a malformed combination, a path collision is
a resource conflict. Logged here as the in-scope judgment call; flipping it to 400
is a one-line change plus one test constant if the reviewer disagrees.

The client needs no change: `usePublishFlow.ts:218` does
`if (!response.ok) throw new Error(result.error || …)` for any non-2xx, so the
message (which names the path) reaches `SlugModal`'s `publish-error` surface.

`materializePublish.ts`'s `CmsPathCollisionError` docblock now records that the
route catches it by class and renders `.message` verbatim — i.e. the message string
and the class export are a user-facing contract, not internal detail.

### 2. Detail constants moved to `sectionKeys.ts`

`CMS_ITEM_SECTION_TYPE`, `CMS_COLLECTION_ITEM_LAYOUT` and `isCmsItemSectionId`
moved out of `materializePublish.ts` into `sectionKeys.ts`, under a new
"DETAIL SECTIONS" heading beside their listing counterparts. `materializePublish.ts`
imports all six names and re-exports all six.

**The re-export is load-bearing — verified, not assumed.** `materializePublish.test.ts`
imports `isCmsItemSectionId` (:57) and `CMS_COLLECTION_ITEM_LAYOUT` (:66) from
`materializePublish`, and `hooks/editStore/cmsActions.test.ts` imports
`CMS_COLLECTION_LAYOUT`/`CMS_SECTION_TYPE` from it (:22). Both re-export comments
now name those files so a future cleanup can't mistake it for dead code.

No production consumer imports the detail constants from a client module today, so
there is no bundle change; the move is for consistency with the documented
prisma-free pattern.

### 3. README: the key-naming law is load-bearing, not defensive

Replaced the "escape the walker TODAY only by recursion DEPTH — that is luck"
paragraph with a section stating the current fact and the measured depths.

Findings, derived from `sanitizeItemObject` (`publishSanitizer.ts:286-300`, one
recursion level — `allowRecurse` flips false on first descent) against both section
shapes:

| Section | Path | Walked |
|---|---|---|
| listing | `elements.cmsModel.collectionRef` | yes |
| listing | `elements.cmsModel.roles.*` | yes |
| listing | `elements.cmsModel.groups[].{groupId,name}` | yes |
| listing | `…groups[].items[].itemRef` | **no** (`groups[]` spends the recursion) |
| detail | `elements.cmsItem.collectionRef` | yes |
| detail | `elements.cmsItem.roles.*` | yes |
| detail | `elements.cmsItem.item.itemRef` | **YES — the change** |
| detail | `…item.fields[].*` (incl. image `{url}`) | no |

Cause: `toDetailModel` hoists the item out of `groups[].items[]` onto a bare `item`
prop, so `itemRef` sits one level shallower on a detail page than on a listing —
inside the one-level budget. Same key, different depth, opposite outcome.
Consequence recorded in the README: violating the naming law now produces `'#'`
corruption on live item pages, invisible in the editor.

Also confirmed the detail sections are actually reached by that pass —
`sanitizeContentHtml` walks `content.subpages` first (`publishSanitizer.ts:371-382`).

### Deviations

1. **409 vs 400** — see above; conservative read of the route's existing vocabulary.
2. **Test file choice** — the new tests went in `route.test.ts`, not
   `publish.authz.test.ts`. `route.test.ts` already owns "what status/body does this
   route return for failure X", which is exactly this; `publish.authz.test.ts` owns
   the ownership gate, which this doesn't touch.
3. **`vi.hoisted` in the mock** — the `materializeCmsForPublish` stub had to be
   `vi.hoisted(...)`, not a plain const like its neighbours, because the new direct
   `import { CmsPathCollisionError }` resolves that mock factory before the module
   body's const initializers run (plain const → TDZ `ReferenceError`, observed).
   The factory uses `importOriginal` and spreads the real module so
   `CmsPathCollisionError` stays the REAL class — a hand-built fake would pass
   against a catch-all and fail against the correct narrow `instanceof` catch,
   inverting the test.
4. **`security` mock untouched** — the change needed no new `@/lib/security` export,
   so the hand-built factory is already in sync.
5. **Stale duplicate wording left in place (out of scope).**
   `src/modules/cms/render/toRenderModel.ts:46-48` carries the same now-false
   "escape the walker TODAY only by recursion DEPTH … that is luck" sentence. It is
   NOT on the Files-touched list, so it was not edited. **Follow-up owed:** point it
   at the README's new section, or it will re-mislead the next agent.

### Verification (actual)

- `npx tsc --noEmit` → exit 0, zero output.
- `npm run test:run` → **271 passed | 1 skipped (272 files); 4368 passed | 15 skipped (4383)**.
  Baseline was 4366/4381 → **+2 tests**, matching the two added cases; no file-count
  change, no regressions.
- `npx next lint` on the four changed source/test files → "No ESLint warnings or errors".
- Targeted re-run of `src/app/api/publish`, `src/modules/cms`,
  `src/hooks/editStore/cmsActions.test.ts` → 7 files, 121 passed (the two re-export
  consumers included).

### Open risks

- The 409 is pinned by a unit test with a mocked materializer; no end-to-end proof
  that a real collision produces one. The path to a real collision (a user page at
  exactly `/<collectionRef>/<itemRef>`) is worth one manual check at the founder gate.
- `item.fields[].*` is unreached by the url pass on BOTH shapes, so a genuine image
  `{url}` inside a CMS field value is not scheme-gated at publish. Pre-existing, not
  introduced here, and out of scope — but it is the next thing that will surprise
  someone, and the README's ❌ rows now say so explicitly.
- Deviation 5 leaves two docs disagreeing until the `toRenderModel.ts` header is
  updated.

Not committed, per instructions.

---

## Phase 4 nit-pass (post-impl-review honesty/correctness tightening)

**Files changed**

- `src/modules/cms/render/toRenderModel.ts` (comment only)
- `src/modules/cms/README.md`
- `src/modules/cms/materializePublish.test.ts`
- `src/modules/cms/render/parity.test.tsx`
- `docs/task/cms-collections.audit.md` (this file)

No runtime behaviour changed. The only non-comment/non-test edit is zero: `toRenderModel.ts`
is a header-comment-only change.

### Per file

**`toRenderModel.ts`** — replaced the stale "escape the walker TODAY only by recursion DEPTH …
that is luck" note (Deviation 5 of the phase-4 audit, left open). It now states the law is
LOAD-BEARING: on detail pages the walker actively reaches `collectionRef` (depth 2,
`elements.cmsItem.collectionRef`) and `itemRef` (depth 3, `elements.cmsItem.item.itemRef`,
hoisted out of `groups[].items[]` by `toDetailModel`); renaming either to a `slug`-suffixed
name yields `'#'` on every live item page. Points at the README for the full depth table.
The two docs no longer disagree.

**`README.md`** — the depth table named the detail element key `cmsDetail` in 4 places; the
exported constant is `CMS_DETAIL_ELEMENT_KEY = 'cmsItem'` (`toRenderModel.ts:338`, verified
against the source, not against either doc). Corrected to `elements.cmsItem.*` and the prose
path now cites the constant by name. Depths were already right; only the key name was wrong.

**`materializePublish.test.ts`** — the "respects slugLocked" case was INERT: nothing in the
phase-4 path reads `slugLocked` (`materializePublish.ts:458` only copies it into the bundle;
`buildDetailSubpages` derives the path from `item.itemRef`), so deleting the flag left the
test green. Made truthful rather than faked: renamed to "uses the stored item slug VERBATIM in
the subpage path (never re-derived)", the `slugLocked = true` line DROPPED (it contributed
nothing), and a header comment records that `slugLocked` is an **unguarded pin** with no
reader until the phase-7 item editor — whoever adds the reader owns its first real test.

**`parity.test.tsx`** — the bundle was `detailPages: false`, so the listing card's detail-link
branch (`lg-cms__titlelink` / `lg-cms__more`) was never parity-compared. Added
`rawBundleWithDetail()` (same fixture, `detailPages: true`, and i3's title value stripped so
the titleless `lg-cms__more` branch renders too) and ONE new case through the EXISTING
hardened comparator (`skeleton`/`COMPARED_ATTRS` — no second comparator). Anti-vacuity
assertions: the compared skeleton must contain `lg-cms__titlelink`, `href=/books/deep-work`,
`lg-cms__more` and `href=/books/loose`.

### Deviations

- None from the phase brief. Item 3 chose the "drop the line + comment" option over "keep it
  with a comment" (the conservative reading: an unread flag in a test body invites the same
  misreading again); the unguarded-pin fact is preserved in the comment either way.
- Item 4 additionally strips i3's title value inside the new fixture helper so BOTH detail-link
  branches are compared. This is a test-fixture-only change, scoped to the new helper — the
  pre-existing `rawBundle()` used by every other case is untouched.

### Test results (actual)

- `npx tsc --noEmit` → exit 0, zero output.
- `npm run test:run` → **271 passed | 1 skipped (272 files); 4369 passed | 15 skipped (4384)**.
  Baseline was 4368 passed / 4383 total → +1, the new parity case. No other delta.

### Non-vacuity evidence

Both new/fixed assertions were verified by MUTATION (mutations applied to the test files only,
then reverted; the restored files re-run green):

- Item 3 — removing `b.items[0].slug = 'my-custom-path'` (i.e. simulating a path re-derived
  from something other than the stored slug) FAILS:
  `FAIL … > uses the stored item slug VERBATIM in the subpage path (never re-derived)`
  `AssertionError: expected undefined to be truthy`.
- Item 4 — flipping the new helper back to `detailPages: false` FAILS at
  `expect(editSkeleton).toContain('lg-cms__titlelink')` (parity.test.tsx:299), confirming the
  new case is bound to the detail-link branch actually being in the compared output.
- Restored: `2 passed (2) / 69 passed (69)` for the two files.

### Open risks

- `slugLocked` remains an unguarded pin (recorded, deliberately not shadow-guarded here).
- Item CREATE shadow guards, blog-reserved-path and locale-collision behaviours untouched —
  still carried to later phases per the phase-4 audit.

Not committed, per instructions.

---

# Phase 5 — Authoring UI primitives

## Files changed

All NEW, all in `src/components/ui/` (nothing else touched — no CMS wiring, no
renderer/store/publish contact):

- `src/components/ui/field-row-list.tsx`
- `src/components/ui/field-row-list.test.tsx`
- `src/components/ui/date-field.tsx`
- `src/components/ui/date-field.test.tsx`
- `src/components/ui/tag-input.tsx`
- `src/components/ui/tag-input.test.tsx`
- `src/components/ui/link-pair-field.tsx`
- `src/components/ui/link-pair-field.test.tsx`
- `src/components/ui/media-or-link-field.tsx`
- `src/components/ui/media-or-link-field.test.tsx`
- `src/components/ui/slug-input.tsx`
- `src/components/ui/slug-input.test.tsx`
- `src/components/ui/item-pager.tsx`
- `src/components/ui/item-pager.test.tsx`
- `docs/task/cms-collections.audit.md` (this section)

## What each file does

**`field-row-list.tsx`** — t12's schema-builder row list. Row anatomy = drag handle ·
editable name · type-chip slot · trailing slot (role badge) / default delete button.
`renderTypeChip` / `renderTrailing` are render-prop slots so phase 6 composes t12's exact
row without forking. `onReorder` emits the FULL new id order (not from/to), so the caller
never re-derives. Exports the pure `reorderIds(ids, from, to)` that BOTH reorder paths
funnel through. dnd-kit `PointerSensor` drives pointer drag; ArrowUp/ArrowDown on the drag
handle drives keyboard reorder.

**`date-field.tsx`** — native `<input type="date">` on the app-input tokens. Value = ISO
`YYYY-MM-DD` or `""`. Clearing emits `""` explicitly (feeds the phase-1 carry: a field
cannot be cleared by omission).

**`tag-input.tsx`** — controlled `string[]` pill input. Enter/comma commits, ✕ removes,
Backspace-on-empty removes the last, Escape clears the draft without touching the value.
Blur also commits (a leftover draft silently vanishing on Save is the classic bug).
Duplicates + whitespace dropped.

**`link-pair-field.tsx`** — ruling #10. url + label side-by-side; value shape is the
stored `{url, label}` verbatim. Deliberately does NO URL validation — `toRenderModel` is
the single sanitization authority, and a second predicate here would reject legitimate
`mailto:`/`tel:`/`#` CTAs (the phase-2 narrow-predicate regression).

**`media-or-link-field.tsx`** — ruling #11. `{kind:'upload'|'link', url}` with a
`SegmentedControl` toggle. Upload side calls `onPickRequest()`; the CALLER opens
`MediaPickerModal`. The picker is NOT imported here.

**`slug-input.tsx`** — two exports. `SlugInput` (t12): name input + read-only mono slug
suffix inside the same box; the slug is passed IN (no second slugify —
`src/modules/cms/slug.ts` stays the one authority). `EditableSlugInput` (t19 permalink):
read-only mono prefix + editable mono segment.

**`item-pager.tsx`** — t19 "Item 3 of 24". Zero-based `index`, one-based label, emits the
absolute target index. Bounds enforced twice: native `disabled` AND inside the handler.
Left/Right arrows also move.

## Deviations / judgement calls (all in-scope, conservative option taken)

1. **Reorder is tested via the KEYBOARD path, not simulated pointer drag.** dnd-kit
   collision detection needs real layout (`getBoundingClientRect` is all-zero in jsdom), so
   a simulated drag would assert luck — one of the four documented inert-assertion
   patterns. Per the phase brief this was pre-authorised. The chosen route is *better* than
   a bare imperative callback: keyboard reorder on the handle is a real user-reachable a11y
   path AND it funnels through the identical `move()` → `reorderIds()` → `onReorder()`
   chain the pointer path uses. Pointer drag itself is therefore covered only indirectly
   (see Risks).
2. **`@dnd-kit/utilities` NOT imported** even though it is present in `node_modules`. It is
   a transitive dep, not in `package.json`; the 3-line `translate3d` transform is written
   by hand instead of importing a phantom dependency.
3. **`KeyboardSensor` is registered but does not own Arrow keys** (it activates on
   Space/Enter). Our handle `onKeyDown` owns Arrows. No conflict observed.
4. **`media-or-link-field` toggling is non-destructive**: the last url per kind is
   remembered locally, so an accidental toggle does not wipe a pasted link — but an upload
   url is never re-emitted as a user-typed link (and vice versa). Alternative (clear on
   toggle) loses user data; alternative (carry url across) mislabels a blob url as a link.
5. **No new Material Symbols glyphs.** Every icon used (`drag_indicator`, `delete`,
   `close`, `chevron_left/right`, `perm_media`, `upload`, `link`) is already in the
   committed `icons.txt` subset — no font regeneration needed.
6. Only `app-*` tokens used; no stock Tailwind key touched, no new styling system.

## Verification — actual results

- `npx tsc --noEmit` → **exit 0, zero output**.
- `npm run test:run` → **278 passed | 1 skipped (279 files); 4415 passed | 15 skipped (4430)**.
  Baseline was 271/272 files, 4369/4384 tests. Delta = exactly +7 files and +46 tests
  (9 field-row-list, 9 tag-input, 5 date-field, 4 link-pair, 7 media-or-link, 6 slug-input,
  6 item-pager). **Zero pre-existing tests changed state.**
- `npx eslint` on all 14 new files → clean, no output.
- `E2E_PORT=3117 npx playwright test ui-isolation` → **2 passed (54.0s)** — it DID run
  locally (playwright auto-starts the dev server via `webServer`); both the computed-style
  baseline and the "no app-chrome fonts/classes on the block surface" check are green.
- Isolation rule grepped on all 7 components: **zero** imports from `modules/templates/**`,
  `modules/generatedLanding/**`, `components/published/**`. Imports are only
  `@/lib/utils`, `./icon`, `./button`, `./input`, `./segmented-control`, `@dnd-kit/*`.

### Non-vacuity evidence (observed, not asserted)

Broke both stateful components' emit paths (replaced the callback invocation with
`void <same expression>`, leaving the computation intact so it was a *handler* break, not a
compile break) and re-ran:

- **9 failed | 9 passed** of 18.
- field-row-list failures: `ArrowDown … emits the full reordered id list`,
  `ArrowUp moves the row the other way`,
  `re-renders in the new order when the caller applies the emitted order`.
- tag-input failures: `Enter adds a pill and calls back with the NEW array`,
  `comma also commits`, `renders one pill per value … controlled round-trip`,
  `trims the committed tag`, `✕ removes the RIGHT pill`,
  `Backspace on an empty draft removes the LAST pill only`.
- The 9 that stayed green under the break are the ones that SHOULD: the pure `reorderIds`
  unit tests, the negative bounds/duplicate/Escape assertions, the delete/name-edit
  callbacks (different handlers), and the slot-rendering test.
- Handlers restored byte-identical from backup; re-run → **18 passed**.

## Open risks / what the reviewer should scrutinise

1. **Pointer drag is untested.** `handleDragEnd` maps `active`/`over` ids to indexes and
   calls the same `move()`, but nothing exercises dnd-kit's own event pipeline. A wiring
   bug in `handleDragEnd` (e.g. swapped indexes) would ship green. Covering it needs a
   real-layout e2e, which does not exist until phase 6 mounts the list on a route.
2. **`onNameChange` fires per keystroke** (no debounce, no Enter/blur gate) despite the
   prop doc calling it a "commit". Correct for a controlled parent that holds draft schema
   state — which is what phase 6 will do — but if phase 6 wires it straight to a PATCH it
   will write per keystroke. Flagged for phase 6, not fixed here (out of scope).
3. **`tag-input` commits on blur**, so clicking Save with an uncommitted draft produces an
   `onValueChange` *and* the Save in the same tick. Phase 7 must ensure Save reads the
   post-blur value (React event ordering makes this fine for a real pointer click; a
   programmatic save path might not blur first).
4. **`slug-input` derives nothing.** If phase 6 forgets to pass `slug`, the field silently
   renders with no suffix rather than erroring. Pinned by a test, but it is a quiet failure
   mode by design (the alternative was a second slugify implementation in `ui/`).
5. `media-or-link-field`'s per-kind memory lives in a `ref` mutated during render. It is
   idempotent and only caches, but it is not StrictMode-double-render-*pure*. Behaviour is
   unchanged under double render (same value written twice); called out for completeness.

Not committed, per instructions.

## Phase 5 nit pass (7 findings from impl-review)

Docs/tests-only except two behavioural extractions (`resolveDragEnd`, `KeyboardSensor` removal).
No value shapes changed. No debounce added. No url validator added.

### Files changed

- `src/components/ui/field-row-list.tsx` (modified)
- `src/components/ui/field-row-list.test.tsx` (modified)
- `src/components/ui/tag-input.test.tsx` (modified)
- `src/components/ui/link-pair-field.tsx` (modified — docblock only)
- `src/components/ui/media-or-link-field.tsx` (modified — docblock only)
- `docs/task/cms-collections.audit.md` (this entry)

### Per file

**`field-row-list.tsx`** — five of the seven findings:
1. `onNameChange` JSDoc rewritten. Was "Commit of an in-place name edit (blur or
   Enter)" — false and misleading toward wiring a PATCH. Now states plainly that it
   fires on every keystroke, that the parent must hold draft state (the input is
   controlled on `item.name`), and must not write per keystroke. No internal
   debounce — that would desync typed vs rendered text and fight the parent.
2. Extracted `resolveDragEnd(ids, activeId, overId) → string[] | null`;
   `handleDragEnd` is now a thin adapter over it. Returns `null` for the three
   no-op cases (`overId === null`, self-drop, unknown id).
4. `KeyboardSensor` DROPPED (and its false comment). It was fully inert: the row
   handle's explicit `onKeyDown` follows `{...listeners}` in JSX, so the later prop
   wins and dnd-kit's activator never ran. Chose removal over chaining because if
   the sensor *did* activate, its document-level Arrow handling would double-fire
   against the handle's own Arrow move. New comment states this. The Arrow-key a11y
   path is untouched and still tested. Top-of-file docblock updated to match.
5. Added `role="listitem"` to the row div (kept the container `role="list"` — the
   reviewer's preferred fix of the two).
7. `displayName = "FieldRowList"` set on the underlying `forwardRef` component
   before the generic-preserving cast (parity with the other six primitives).

**`link-pair-field.tsx` / `media-or-link-field.tsx`** (finding 3, the live phase-7
trap) — added the explicit empty→`null` caller contract that only `date-field` had,
concrete about the shape each control emits: link emits `{url:"",label:""}`; media
emits `{kind:'link',url:""}` on clear and `{kind:'upload',url:""}` on a toggle with
nothing remembered. All three 400 against `min(1)` schemas, because the item PATCH
merge deletes only on `v === null`. Controls unchanged — they are correct as
controls. No url predicate added anywhere; `toRenderModel` stays sole sanitizer.

**`field-row-list.test.tsx`** — new `describe("resolveDragEnd (pure …)")`, 4 tests:
normal move (both directions, so a swapped from/to fails), `overId === null`,
self-drop, unknown id either side. Notes in-file why mocking `DndContext` is not an
option (`useSortable` resolves dnd-kit internal context → degenerate rows).

**`tag-input.test.tsx`** — 2 tests for the previously untested blur-commit path:
blur commits a leftover draft; blur with an empty draft does not mutate.

### Deviations

- Finding 4 offered two options; chose removal (see reasoning above) rather than
  chaining to `listeners.onKeyDown`.
- Finding 6 asked for ~1 test; added 2 (the empty-draft negative was 4 extra lines
  and guards the obvious over-correction). Test delta is +6, not +5.
- First blur-test draft dispatched a `blur` event and failed. Root cause: React 17+
  delegates `onBlur` to native `focusout`. Switched to `focusout` and left an
  in-file comment — a `blur` dispatch here would have been a permanently-green
  inert assertion.

### Test results (actual)

- `npx tsc --noEmit` — exit 0, zero output.
- `npm run test:run` — **278 passed | 1 skipped (279 files); 4421 passed | 15
  skipped (4436)**. Baseline was 4415/4430 → +6 tests, 0 regressions.
- `npx next lint` on the 5 changed source/test files — "No ESLint warnings or errors".

### Non-vacuity evidence (finding 6, and finding 2 unprompted)

- Mutated `onBlur={() => commit(draft)}` → `onBlur={() => {}}`: blur test FAILED
  (`expected "vi.fn()" to be called 1 times, but got 0 times`), other 10 stayed
  green. Restored; `git diff --stat` clean; 11/11 green.
- Mutated `reorderIds(ids, from, to)` → `(ids, to, from)` inside `resolveDragEnd`:
  the mapping test FAILED, 12 others green. Restored; 13/13 green.

### Open risks

- dnd-kit's pointer event plumbing (sensor → collision detection → `DragEndEvent`)
  remains uncovered by unit tests; only the id→index mapping is now tested. Genuine
  e2e territory (jsdom `getBoundingClientRect` is all-zero).
- Findings 1 and 3 are DOCUMENTATION of caller obligations, not enforcement. Phase 6
  (draft state, no per-keystroke PATCH) and phase 7 (empty→`null` before PATCH) can
  still get these wrong; nothing in the type system stops them.

---

## Phase 6 — Schema builder + CMS entry point (t12)

### Files changed

| File | New? | What |
|---|---|---|
| `src/app/edit/[token]/components/cms/AddCollectionModal.tsx` | new | t12 schema-builder modal (create + edit) |
| `src/app/edit/[token]/components/cms/AddCollectionModal.test.tsx` | new | 14 behaviour tests (mutation-verified) |
| `src/app/edit/[token]/components/cms/CmsPanel.tsx` | new | CMS entry: collection list, place, delete, new |
| `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` | edit | mounts `<CmsPanel>` beside `<PageSwitcher>` (2 lines + import) |
| `src/hooks/editStore/cmsActions.ts` | edit | `removeCmsSectionsForCollection` |
| `src/types/store/actions.ts` | edit | its signature on `MetaActions` |
| `src/modules/cms/render/CollectionSection.tsx` | edit | greyed "Manage items" placeholder → live, event-dispatching button |
| `docs/task/cms-collections.audit.md` | edit | this section |

**BLOCKED — one out-of-scope file needs a 1-line change; NOT edited (see "Blocked" below):**
`src/modules/cms/render/parity.test.tsx`. `npm run test:run` is therefore **1 test red**.

### Per file

**`AddCollectionModal.tsx`** — 460px `dialog`. `SlugInput` NAME row with live `slugifyName()`
suffix (edit mode shows the STORED slug: re-deriving it would silently propose moving every
published item page). START FROM chips, `FieldRowList` for fields with an `AppPopoverMenu`
"+ Add field" listing the closed 9, per-row type chip + role menu + delete via `renderTrailing`,
`Switch` for detailPages, reactive CREATES-THESE-PAGES tiles, footer Cancel/Create.
Create → `POST /api/collections`; edit → `PATCH /api/collections/:id`.

Rulings applied verbatim: **#1** Blank enabled + 4 chips greyed via `<Coming>` with why-tooltips ·
**#2** no Price (closed 9 only) · **#3** `Text — long` is a plain type, no toolbar · **#4** no mono
variant · **#5** per-row role menu filtered through `ROLE_ALLOWED_TYPES` · **#6** `Switch` + reactive
tiles · **#9** no "Write with AI".

Contracts honoured:
- `onNameChange` fires per keystroke → the whole schema is **local draft state**, written exactly
  once on save. No handler in this file touches the network.
- Optional fields are omitted or sent explicitly; `layoutHint` is never sent as an empty string.
- Field ids are minted from the **type** (`text_short`, `text_short_2`, …) — letter-prefixed by
  construction, so `FIELD_ID_REGEX`-valid and stable while the user retypes the label. Deriving
  ids from the (per-keystroke-changing) name would have been both unstable and regex-risky.
- Deleting a field prunes any role pointing at it — the server's cross-field roles gate would 400
  on a dangling role.

**`CmsPanel.tsx`** — bar control (`aria-label="Collections"`) beside Pages, per plan step 1;
**no rail** (that is the ui-redesign track's) and **no capability gating** (shared block ⇒ renders
everywhere, Deviations #2 — `templateMeta.ts` untouched). Rows show `N items · M fields`, click →
edit modal, hover buttons → "Add to page" (`addCmsSection`, the phase-3 dual pin, unmodified) and
"Delete" (confirm → DELETE → `removeCmsSectionsForCollection` → refresh). `refreshCmsData` runs on
menu OPEN, never on mount, so mounting the panel adds no request to every editor load.

**`cmsActions.ts` / `actions.ts`** — `removeCmsSectionsForCollection(collectionId): number` sweeps
the active working set **and every stored `state.pages[*]` slice** (a placement made before a page
switch lives in the committed slice; a top-level-only sweep would strand it). Filters on the
`cmscollection-` id prefix + `elements.collectionId`, so it is structurally incapable of touching a
non-CMS section. Item values are untouched — deleting a *field* stays non-destructive per phase-1
semantics.

**`CollectionSection.tsx`** — `ManagePlaceholder` → `ManageButton`, dispatching the
`window` event `lessgo:manage-collections` (the `lessgo:manage-products` precedent). Renderer code
must not import app chrome, so the event is the seam; `CmsPanel` listens. Still rendered outside
`[data-cms-body]`, so the parity comparison is unaffected.

### Deviations

1. **`CmsPanel` uses `useEditStore` (hook object + selector), NOT `useEditStoreApi()`.**
   `GlobalAppHeader.menus.test.tsx` mocks `@/hooks/useEditStore` exporting only `useEditStore`;
   importing `useEditStoreApi` into the header's tree makes that (untouchable) suite throw. The
   hook-object path is already the header's own documented pattern. Selector reads and action calls
   are optional-chained for the same reason. Revisit if that mock ever gains the api export.
2. **Popover menus inside the dialog carry `style={{pointerEvents:'auto'}}`.** Radix Dialog sets
   `pointer-events:none` on `<body>`; portalled popover content is a body child and would be
   unclickable for real users (jsdom would not have caught it).
3. **"Delete field warns values will be hidden" is not implemented as a modal warning.** The
   destructive-sounding path is collection DELETE, which does confirm. Field delete is reversible
   before save (nothing is written until Save) and phase-1 semantics keep orphaned values intact, so
   a blocking confirm per field-removal would be noise. Conservative call; flag if the founder wants
   the copy at the gate.
4. **Presets are chips only** — no preset seeds anything (ruling #1 = Blank only).
5. **Icon `category`, not `database`.** `icons.txt` lists `database`, but that manifest is documented
   unreliable in both directions and a missing ligature renders as literal TEXT. `category` is
   proven present (live in `PageSwitcher`).

### Blocked — out-of-scope file

`src/modules/cms/render/parity.test.tsx:342-350` pins the OLD contract:

    it('the edit twin shows a DISABLED "Manage items" placeholder, …
        expect(btn.disabled).toBe(true);

Phase 6 step 4 explicitly requires that placeholder to become live ("the phase-2 greyed 'Manage
items' placeholder now routes to the CMS panel"), so this assertion is obsolete **by design** — but
the file is not on the Files-touched list, so it was NOT edited. Needed change (orchestrator call):
retitle to "…shows a LIVE 'Manage items' button…", replace `expect(btn.disabled).toBe(true)` with
`expect(btn.disabled).toBe(false)`, keep the `title` and the outside-`[data-cms-body]` assertions,
and ideally assert the click dispatches `lessgo:manage-collections`.

### Test results (actual)

- `npx tsc --noEmit` → **exit 0, zero output** (baseline held).
- `npm run test:run` → **1 failed | 278 passed | 1 skipped (280 files); 1 failed | 4434 passed |
  15 skipped (4450)**. The single failure is the blocked `parity.test.tsx` assertion above.
  Baseline was 278/4421 passed; +13 net new passing tests, no other movement.
  `GlobalAppHeader.menus.test.tsx` **green** (6/6) with `<CmsPanel>` mounted.
- `AddCollectionModal.test.tsx` → 14 passed.
- Lint on the 7 touched files → clean; one PRE-EXISTING `@next/next/no-img-element` warning at
  `CollectionSection.tsx:52` (the untouched edit primitive).

**Non-vacuity (mutation-checked, restored after each):**

| Mutation | Result |
|---|---|
| `fieldSchema: fields` → `fieldSchema: []` in the POST body | **3 red** (create payload, role-prune, edit-mode PATCH) |
| delete the `Team` preset chip from `PRESET_CHIPS` | **1 red** (greyed-preset contract) |
| `rolesForType` returns all `ROLE_KEYS` (no type filter) | **4 red** (pure filter + both menu tests + the no-role-trigger test) |

All 14 green again after restore.

### Open risks

- Phase-7 carries are untouched and still owed: `slugLocked` is an UNGUARDED pin; item CREATE has no
  top-level-slug shadow guard.
- `cmsData` is fetch-on-open, so a collection created in a second tab is not visible until the menu
  is reopened (the accepted v1 freshness risk).
- The panel lists collections but has no item authoring — "Manage items" opens this panel, which
  currently offers schema edit / place / delete only. Item editor is phase 7, as scoped.
- `nextFieldId` mints ids from the type, so an id can outlive a rename ("Title" renamed to
  "Headline" keeps id `text_short`). Harmless (ids are opaque) but visible to anyone reading raw
  item JSON.
- Detail-page fan-out is still unverified by a human (phase-4 gate folded into the phase-7 gate).

---

## Phase 6 — follow-up: retire the parity placeholder assertion (authorized scope extension)

### Files changed

| File | New? | What |
|---|---|---|
| `src/modules/cms/render/parity.test.tsx` | no | Retired the obsolete DISABLED-placeholder assertion; pinned the LIVE button + its dispatch wiring. |
| `docs/task/cms-collections.audit.md` | no | This entry. |

`src/modules/cms/render/CollectionSection.tsx` was temporarily mutated for the non-vacuity
check and **restored** — verified by grep (only `window.dispatchEvent` remains, no
`MUTATION-TEST` marker). It carries no net change from this follow-up.

### What changed in `parity.test.tsx`

1. Retitled `the edit twin shows a DISABLED "Manage items" placeholder…` →
   `the edit twin shows a LIVE "Manage items" button, outside the compared body`, and flipped
   `expect(btn.disabled).toBe(true)` → `toBe(false)`. The `title` (why-tooltip) assertion and
   the `bodyOf(container).querySelector('[data-cms-manage]')).toBeNull()` (outside
   `[data-cms-body]`) assertion are **unchanged** — those still hold and remain what keeps the
   edit-only affordance out of the parity-compared region.
2. Added a second test pinning the wiring: mount, click, assert a
   `lessgo:manage-collections` window event fired. `dom()` is `renderToStaticMarkup` (no React
   handlers attached), so this test uses a real client mount — `react-dom/client` `createRoot`
   + `act`, the repo convention (`ToolbarButton.test.tsx`), with `IS_REACT_ACT_ENVIRONMENT`
   set/restored locally so the other `renderToStaticMarkup` tests in the file are unaffected.
   Listener removal + unmount are in a `finally`.
3. Added `act` / `createRoot` imports.

No other assertion in the file was touched. The published twin is unchanged — the affordance
remains edit-only and outside the compared skeleton.

### Deviations

- **Asserted the payload SHAPE, not the literal collection id.** The brief suggested pinning the
  dispatch; I initially asserted `detail === { collectionId: 'c1' }` and it failed. Cause:
  `CollectionSection.tsx:206` takes the injected-`model` path via
  `if (model) return <Rendered sectionId={sectionId} model={model} />` — it does **not** forward
  `collectionId`, so `detail.collectionId` is `undefined` on that path. The store-backed path
  (line 181, the one the editor actually uses) *does* forward it, so this is not a live bug —
  the injected-`model` path is tests/future-callers only. `CollectionSection.tsx` is out of
  scope, so rather than edit it or pin the gap in place with a literal-`undefined` assertion
  (which would fail the day someone fixes line 206), the test asserts
  `expect(seen).toHaveLength(1)` + `expect(seen[0]).toHaveProperty('collectionId')`. That still
  fully catches an inert or deleted dispatch. Logged as a risk below.

### Non-vacuity evidence (dispatch broken, NOT the enabled flag)

Replaced the `window.dispatchEvent(...)` body in `ManageButton`'s `onClick` with a no-op
(`void collectionId;`), leaving the button enabled. Result:

```
FAIL  parity.test.tsx > clicking "Manage items" dispatches lessgo:manage-collections
AssertionError: expected [] to have a length of 1 but got +0
 Tests  1 failed | 18 passed (19)
```

The key observation: **only the new test failed — the `disabled).toBe(false)` test stayed
green.** An enabled-but-inert button is precisely the failure the enabled-flag assertion cannot
see, and the new test does see it. Dispatch restored; file back to 19 passed.

### Store-access confirmation (requested)

`CmsPanel.tsx` uses **selector form**, not a bare whole-store subscription. The only reactive
read is line 59:

```ts
const bundles = useEditStore(
  (s) => s.cmsData?.bundles as Record<string, CmsCollectionBundle> | undefined
);
```

All other accesses are one-shot `useEditStore.getState().<action>?.()` (lines 81, 115, 135),
which is not a subscription. There is no `useEditStore()` call anywhere in the file, so the
ESLint `no-restricted-syntax` ban is not tripped — consistent with lint passing.

### Test results (actual)

- `npx tsc --noEmit` → **exit 0, zero output**.
- `npm run test:run` → **279 passed | 1 skipped (280 files); 4436 passed | 15 skipped (4451
  tests); 0 failed.** Was 1 failed / 4434 passed: +1 from the retired assertion now passing,
  +1 new dispatch test.
- Not committed, per instruction.

### Open risks

- `CollectionSection.tsx:206` drops `collectionId` on the injected-`model` path. Inert today
  (only tests inject `model`), but any future caller that injects a model would get a
  Manage-items event with `collectionId: undefined`, and `CmsPanel` would open without
  targeting a collection. One-line fix (`collectionId={collectionId}`) when someone owns that
  file; deliberately not made here.

---

# Phase 6 — fix pass (BLOCKING id-recycling + 4 nits)

## Files changed
- `src/app/edit/[token]/components/cms/AddCollectionModal.tsx` (modified)
- `src/app/edit/[token]/components/cms/AddCollectionModal.test.tsx` (modified)
- `src/app/edit/[token]/components/cms/CmsPanel.tsx` (modified)
- `src/app/edit/[token]/components/cms/CmsPanel.test.tsx` (**new**)
- `src/hooks/editStore/cmsActions.test.ts` (modified)
- `src/modules/cms/render/CollectionSection.tsx` (modified)
- `docs/task/cms-collections.audit.md` (this entry)

## BLOCKING — field-id recycling resurrects orphaned item values

**Root cause.** `nextFieldId` clamped only against ids in the *draft*. Because field
deletion is deliberately non-destructive (items keep `values[fieldId]` forever), a
delete-then-add of the same type re-minted the deleted id and `toRenderModel`'s
`values[f.id]` served the old field's content under the new field's label — editor
and published output alike.

**Fix (two independent defences, both in `AddCollectionModal.tsx`).**
1. `reservedFieldIds(collection, items)` — the clamp floor is now the UNION of the
   draft's ids, the STORED `fieldSchema` ids, and every key present in any item's
   `values`. The item keys are the authoritative orphan record and are the only one
   that survives across sessions (a saved delete erases the schema entry).
2. `nextFieldId(type, existing, { unique: true })` — in EDIT mode new fields get a
   random suffix (`text_short_a3f9`) instead of the next ordinal, so the invariant
   does not depend on the item cache being complete or fresh. CREATE mode keeps the
   readable ordinal ids (no items exist yet → nothing to resurrect).

All minted ids remain letter-prefixed → `FIELD_ID_REGEX`-valid.
`CmsPanel.tsx` now passes the editing collection's `items` (from the store bundle)
into the modal — read-only, never written.

## Deletion warning (plan step 3, previously Deviation 3)

`droppedWithValues` = stored fields absent from the draft that at least one item holds
a **non-empty** value for. Rendered inline under the field list as
`[data-cms-field-drop-warning]` (`role="status"`): names the fields and states that the
values are *hidden, not deleted*, and that re-adding the field will not bring them back
(true by construction now — the new field gets a fresh id). Deletion stays entirely
non-destructive and draft-local until Save; nothing rewrites items.

## Nits
1. `removeCmsSectionsForCollection` — 5 new tests in `cmsActions.test.ts`: current-page
   removal (both pin halves + sections entry), sweep across every `state.pages[*]`,
   a DIFFERENT collection untouched, a non-cms section untouched even when its content
   carries a matching `collectionId` (the type-prefix gate), and a clean 0-removed no-op
   that does not dirty the draft.
2. `CmsPanel.test.tsx` (new, 8 tests): listing + item·field count, refresh-on-open not
   on-mount, `addCmsSection` placement, and the destructive path — confirm → DELETE →
   sweep, cancel writes nothing, and a **failed** DELETE must not sweep. Plus the
   `lessgo:manage-collections` listener opening the panel and unsubscribing on unmount.
   Uses the repo's `createRoot` + `act` pattern; no `@testing-library` added.
3. `CollectionSection.tsx:206` — `collectionId` now forwarded on the injected-`model`
   path (falls back to `elements?.collectionId`, matching the store-backed path).

## Deviations
- **Warning styling uses `bg-app-danger-bg`.** No `app-warning-*` token exists in
  `tailwind.config.js`; `danger-bg` is the repo's only soft alert surface. Paired with
  `text-app-ink` (not `text-app-danger`) so it reads as caution, not failure. Noted
  inline in the source.
- **Edit-mode ids are now random-suffixed**, so the pre-existing edit-mode test could no
  longer assert `id === 'tags'`; it asserts `/^tags_/` + regex validity instead. This is
  the conservative choice: it makes the never-recycle invariant unconditional rather than
  contingent on the item cache. Create-mode ids are unchanged.
- Nothing else touched: delete stays non-destructive, `addCmsSection`'s dual pin, the
  rulings and all value shapes are untouched.

## Test results (actual)
- `npx tsc --noEmit` → exit 0, **zero output**.
- `npm run test:run` → **280 passed | 1 skipped (281 files); 4456 passed | 15 skipped
  (4471); 0 failed.** vs baseline 279/1 (280) and 4436/15 (4451) → +1 file, +20 tests.
- `npx next lint --file …` on all 6 changed source/test files → only the pre-existing
  `@next/next/no-img-element` warning at `CollectionSection.tsx:52` (untouched line).
- **Non-vacuity evidence.** Reverted `addField` to the draft-only clamp
  (`nextFieldId(type, prev.map(f => f.id))`) and re-ran the modal suite: **3 failed | 18
  passed**, including the exact target assertion
  `AssertionError: expected 'text_short' not to be 'text_short'` in *"delete a valued
  field then add the same TYPE"* and in *"reserves an ORPHAN key present only on items"*,
  plus `expected "tags" to match /^tags_/`. Fix restored; suite back to green.

## Open risks
- The reserved set is only as complete as the store's `cmsData` bundle. If items failed
  to load, defence (1) is blind — defence (2) (the random suffix) is what actually
  guarantees the invariant in edit mode. Do not remove it in favour of the union clamp.
- Orphaned values still accumulate on item rows forever by design. No GC exists; a future
  "clean up unused values" affordance would need its own explicit destructive gate.
- The warning counts a value as present if it is non-empty (`null`/`''`/`[]` excluded).
  A structurally empty object (e.g. `{ url: '' }`) still counts as a value and will warn.

---

# Phase 7 — item editor + group management (t19/t22)

## Files changed
1. `src/app/edit/[token]/components/cms/ItemEditor.tsx` (new)
2. `src/app/edit/[token]/components/cms/ItemEditor.test.tsx` (new)
3. `src/app/edit/[token]/components/cms/CollectionBrowser.tsx` (new)
4. `src/app/edit/[token]/components/cms/GroupManager.tsx` (new)
5. `src/app/edit/[token]/components/cms/CmsPanel.tsx` (modified)
6. `src/hooks/editStore/cmsActions.ts` (modified)
7. `src/types/store/actions.ts` (modified)
8. `e2e/cms-authoring.spec.ts` (new)
9. `docs/task/cms-collections.audit.md` (this section)

Nothing outside the plan's Phase 7 list was edited. Two files that the work
*pointed at* were deliberately NOT touched — see **Deviations** 1 and 2.

## What changed, per file

### `ItemEditor.tsx` (new) — t19
412px-style panel: header/breadcrumb (+ back), `item-pager`, one control **per field
TYPE**, Category select, permalink, footer Save/Cancel. Create mode (`item === null`)
POSTs to `/items`; edit mode PATCHes `/items/:id`.

Control map — dispatched off `field.type` in one `switch`, never off the field name:

| type | control |
|---|---|
| `image` | thumb + Replace/Remove, empty state = dashed "Choose an image" -> shared `MediaPickerModal` |
| `gallery` | thumb strip w/ per-thumb remove + dashed "+" tile -> same picker |
| `video`/`audio` | `media-or-link-field` (upload side calls back to open the picker) |
| `text_short` | `Input` |
| `text_long` | plain `Textarea` — **ruling #3**, no toolbar |
| `link` | `link-pair-field` |
| `date` | `date-field` |
| `tags` | `tag-input` |

`MediaPickerModal` is opened by THIS component (`onPick(url)` -> stored as `{url}`,
`initialTab="library"`), preserving the primitives' picker-agnostic contract.
No status pill (**#8**), no Write-with-AI (**#9**). Group = the "Category" select
incl. "Ungrouped" (**#7**). Permalink (`EditableSlugInput`) renders only when
`collection.detailPages` is on AND the item exists.

**Debt 1 — the empty -> `null` contract.** `normalizeValue(type, draft)` (exported)
maps every empty shape to `null`: `''` date, `{url:'',label:''}` link,
`{kind,url:''}` media, `{url:''}` image, `[]` gallery, blank text. `tags` is the
documented exemption and always sends an array. `buildValuesPayload()` (exported)
then sends a non-empty value always, and the `null` **delete sentinel only when the
stored item still holds that key** — sending nulls for never-filled fields would be
payload noise with no effect. Create mode has nothing to delete, so empties are
simply omitted.

**Debt 2 — `slugLocked` is now READ, not just written.** While an item is unlocked
the permalink FOLLOWS the title field (`slugifyName`); once locked it never moves,
whatever the title does. A manual permalink edit locks it locally, mirroring what
the route does server-side. `slugLocked` is deliberately NOT sent in the body:
`ItemPatchSchema` has no such key, so Zod would strip it — the SLUG edit is what sets
the flag, on the server. Sending a stripped key would be decorative.

**Debt 3 — item-create slug shadowing.** The route file is outside this phase's list,
so the guard was NOT wired; instead the editor **surfaces the server error verbatim**
(409 included) in `[data-cms-item-error]`, with a code comment naming the gap. Covered
by a test that feeds a 409 and asserts the message reaches the user. The residual risk
is unchanged from phase 4: a created item can still mint a path that only fails at
publish.

### `CollectionBrowser.tsx` (new) — t22
Dialog hosting the browser (left, 400px) + the item editor (right). Header count
pill, search, "+ New", 2-col card grid (cover-role thumb, title-role title, **grey
GROUP sub-label — never a status**, ruling #8), selection ring, per-card delete.
Groups live in a collapsible footer section (`GroupManager`). Pure props in / events
out: it reads no store, so `CmsPanel` stays the single place that decides what
"fresh" means after a write.

### `GroupManager.tsx` (new)
Add / rename (commit on blur or Enter, never per keystroke) / delete / **up-down
reorder, no drag** (founder ruling). A move re-numbers the WHOLE list from 0 in one
PATCH — sending only the two swapped rows leaves ties/gaps whenever stored orders are
not already 0..n-1 (they are not, after a delete), and ties render in insertion order,
which reads as "the reorder silently failed". Delete confirm states that items are
kept and become Ungrouped (the FK's `SetNull`).

### `CmsPanel.tsx` (modified)
- **Debt 4** — the `lessgo:manage-collections` listener now consumes
  `e.detail.collectionId` and opens the browser on THAT collection (see Deviations 1
  for why the list also still opens).
- **Debt 5** — `editing` resets to `null` on modal close.
- New per-row "Manage items" action (`data-collection-items`) -> browser.
- The browser is resolved from `cmsData` by ID, so a Manage event arriving before the
  refresh lands simply opens once the bundle appears.

### `cmsActions.ts` + `actions.ts` (modified)
New `refreshCmsCollection(collectionId)`: re-fetches ONE bundle and merges it. The
item editor saves one item at a time; `refreshCmsData` would re-issue the list call
plus one call per collection (its documented N+1) for a change that can only have
touched one. A 404 drops the bundle; a transient failure keeps the previous one
(blanking the cache would empty a placed section on the canvas mid-save). Status is
NOT flipped to `loading` — a save must not blink the placed block back to skeleton.
This is what makes plan step 4 (live refresh) work: `onChanged` -> `refreshCmsCollection`
-> bundles update -> the adapter re-runs `toRenderModel` on the placed section.

### `e2e/cms-authoring.spec.ts` (new)
Success criterion #1 through the UI: create collection (t12) -> group -> two items
(t19) -> place -> the placed section shows both item titles in the editor. Publish leg
intentionally absent (it lives in `cms-publish.spec.ts`, opportunistic per the
local-500 caveat); the binding publish assertions stay in `materializePublish.test.ts`.

## Deviations from the plan

1. **The Manage event opens the collection LIST as well as the browser.** The plan's
   debt 4 says "Manage items on a placed block opens THAT collection". Implemented —
   but `src/app/edit/[token]/components/cms/CmsPanel.test.tsx` (phase 6, **not** in
   this phase's Files-touched list) dispatches that event WITH a `collectionId` and
   asserts the popover LIST row renders. Opening only the browser turned that test
   red. Rather than edit an out-of-scope file I made the listener do both: the list
   opens (it is also the sensible landing when the browser is dismissed) and the
   browser opens on top, targeted at the dispatched collection.
   ** CONSEQUENCE — an owed test:** the new targeting behaviour has NO vitest cover,
   because the only place to assert it is that out-of-scope file. `CmsPanel.test.tsx`
   should gain "the event with a collectionId opens the browser on THAT collection".
   Until then the behaviour is covered only by the (currently unrunnable) e2e spec and
   by manual QA.
2. **`e2e/cms-authoring.spec.ts` does not run — `playwright.config.ts` is out of
   scope.** That config's `authed.testMatch` is an explicit ALLOWLIST, and its own
   comment warns that an unlisted spec "silently matches no project and the suite goes
   green having never run it". Verified empirically:
   `npx playwright test cms-authoring --list` -> **"Total: 0 tests in 0 files"**.
   **`cms-publish.spec.ts` (phase 3/4) is unlisted too** — it has never run either.
   One edit is owed by whoever owns that file: add `/cms-authoring\.spec\.ts/` **and**
   `/cms-publish\.spec\.ts/` to the `authed` project.
3. **Category uses a native `<select>`, not the Radix `select` primitive.** The panel
   lives inside a Radix Dialog and the portalled Radix listbox needs pointer-event
   capabilities jsdom does not provide, which would make the ruling-#7 group contract
   untestable. Styled on the same app-chrome input tokens. Cosmetic divergence,
   recorded rather than hidden.
4. **The permalink is hidden in CREATE mode.** The slug is derived server-side from
   the title role on POST, so an editable permalink before the row exists would be a
   control with nothing behind it. It appears immediately after the first save.
5. **Auto-follow semantics (in-scope judgment call).** An unlocked permalink follows
   the title and IS sent on save — so a title rename does move the URL once, and that
   PATCH locks the slug server-side. The alternative (display-only follow) would show
   the user a permalink that is not what gets stored. Chose "what you see is what is
   saved". Worth a look at the founder UX gate.
6. **Item creation is a full create form, not "POST an empty row then edit".** Keeps
   the server free to derive a meaningful slug from the title role instead of minting
   `books`, `books-2`... from the collection name.

## Test results (actual)

- `npx tsc --noEmit` -> **exit 0, zero output.**
- `npm run test:run` -> **281 passed | 1 skipped (282 files); 4482 passed | 15 skipped
  (4497); 0 failed.** vs the stated baseline 280/1 (281) and 4456/15 (4471) -> +1 file,
  +26 tests.
  (One intermediate red: `CmsPanel.test.tsx` failed on the first full run — that is the
  Deviation-1 collision, resolved in `CmsPanel.tsx`, not by touching the test.)
- `npx next lint --file ...` on all 7 changed source/test files -> **"No ESLint warnings
  or errors."**
- `npm run test:e2e` — **NOT RUN, and cannot be**: it needs a dev server + a Clerk
  session, and the spec is unregistered (Deviation 2). It was standalone type-checked
  clean (`tsc --noEmit` on the file).

### Non-vacuity evidence (mutation sweep, each mutation applied then reverted)

| # | mutation to `ItemEditor.tsx` | result |
|---|---|---|
| 1 | `date` empty -> `''` instead of `null` | **4 failed** incl. *clearing a stored DATE sends null* |
| 2 | `link` empty -> `{url:'',label:''}` | **3 failed** incl. *clearing a stored LINK sends null* |
| 3 | `video`/`audio` empty -> `{kind,url:''}` | **4 failed** incl. *clearing a stored VIDEO/AUDIO link sends null* |
| 4 | `image` empty -> `{url:''}` | **4 failed** incl. *removing a stored IMAGE sends null* |
| 5 | `gallery` empty -> `[]` | **3 failed** incl. *emptying a stored GALLERY sends null* |
| 6 | text empty -> `''` | **5 failed** incl. *clearing stored TEXT sends null* |
| 7 | `tags` exemption dropped (`[]` -> `null`) | **4 failed** incl. *emptying TAGS sends []* |
| 8 | delete sentinel never sent (`out[f.id] = null` removed) | **7 failed** — every clear-a-stored-value test |
| 9 | `slugLocked` ignored (permalink always follows title) | **2 failed** incl. *a LOCKED permalink NEVER moves* |
| 10 | manual permalink edit does not lock locally | **1 failed** — *a manual permalink edit LOCKS it locally* |
| 11 | `slug` never put in the PATCH body | **3 failed** incl. *editing the permalink PATCHes the slug* |

Every empty->null test and both `slugLocked` tests bite. Full suite re-verified green
after the sweep (the file was restored from a pristine copy, and `git diff` on it is
the intended diff only).

One test was found to be **coincidentally green** during authoring and was fixed
before landing: the ruling-#8 status-pill check scanned `textContent` for
`/\bpublished\b/`, which never matched because the DOM concatenates to
`...itemPublishedCategory...` (no word boundary). It now asserts structurally over
button/span labels and keys on "Draft" — "Published" is unusable there because the
fixture deliberately contains a FIELD named "Published" (which is itself the proof
that controls key on type, not name).

## Open risks
- **Deviation 1's owed test** (targeting behaviour uncovered) and **Deviation 2's owed
  config line** (both cms e2e specs never run) are the two loose ends of this phase.
- Item CREATE still has no top-level-slug shadow guard (phase-4 carry, debt 3). The
  editor surfaces the 409; it does not prevent it.
- `CollectionBrowser` holds no optimistic state: after a save the UI waits on the
  single-collection refetch. On a slow connection a just-saved item can be stale for a
  beat. Accepted (matches the `cmsData` cache posture).
- Deleting the item currently open in the editor clears the selection; deleting the
  LAST item leaves the empty state. No undo anywhere in the CMS.
- The pager walks `items` in stored order; unsaved edits are DISCARDED when paging
  away (no dirty guard). Worth a look at the founder UX gate.
- Group rename fires a PATCH per blur; rapid tab-through of several groups issues
  several requests. Fine at pilot sizes.

## Reminder — this phase's HUMAN GATE also absorbs phase 4's
Per the plan's phase-4 entry, the founder gate here must ALSO cover: create a
collection with **detailPages ON via the UI** -> publish -> listing cards link
correctly -> item detail pages serve with the right slugs + content -> toggle
detailPages OFF -> item pages gone -> **naayom's products pages still publish
untouched**.

---

## Phase 7 — follow-ups (authorized scope extension: 2 files)

### Files changed
- `playwright.config.ts`
- `src/app/edit/[token]/components/cms/CmsPanel.test.tsx`
- `docs/task/cms-collections.audit.md` (this append)

(`src/app/edit/[token]/components/cms/CmsPanel.tsx` was temporarily mutated for a
non-vacuity check and **restored byte-for-byte** — it carries no net change from
these follow-ups.)

### 1. `playwright.config.ts` — registered the CMS e2e specs

Added `/cms-authoring\.spec\.ts/` and `/cms-publish\.spec\.ts/` to the **`authed`**
project's `testMatch` allowlist (both need a Clerk session: the collection/item routes
and `/api/publish`), with a comment matching the file's existing per-track style.

This closes the loose end recorded above. Both specs had matched **no project** since
they were written — `cms-publish.spec.ts` (phase 3, extended phase 4) and
`cms-authoring.spec.ts` (phase 7) were dead files. Four phases described them as
coverage; they were not.

**Registration verified (the deliverable):**
- `npx playwright test cms-authoring --list` -> **2 tests in 2 files**:
  `[authed] cms-authoring.spec.ts:26 "author a collection end to end through the CMS UI"`
  plus the `[setup] auth.setup.ts` dependency. => **1 CMS test**.
- `npx playwright test cms-publish --list` -> **3 tests in 2 files**:
  `[authed] cms-publish.spec.ts:20 "a placed CMS collection publishes with its items"`
  and `:135 "detailPages ON publishes an item page per item; OFF removes them"`,
  plus `[setup]`. => **2 CMS tests**.

Playwright parsed both specs with **no syntax or type error** — nothing to fix.

**Not claimed:** that they PASS. Neither was executed (needs a dev server + real Clerk
session). Execution is the founder's/CI's gate; registration is what changed here.

### 2. `CmsPanel.test.tsx` — targeting now has vitest cover

Added two tests to `describe('CmsPanel — firewall handoff')`. The phase-6 tests are
**unchanged** — both behaviours are real, so both are pinned:
- `opens the item browser on the collection named in detail.collectionId` — asserts
  `[data-cms-browser]` exists, its text contains `Books`, and `[data-item-card="it_1"]`
  is present (the RIGHT collection's item, not merely "a browser").
- `a detail-less event opens the list ONLY (no browser to dismiss)` — the fallback
  path, which nothing else covered.

**Non-vacuity verified.** Neutered the consumption in `CmsPanel.tsx`
(`if (collectionId)` -> `if (false && collectionId)`) and re-ran the file:
`1 failed | 9 passed`, the failure being exactly the new targeting test
(`Error: not found: [data-cms-browser]`). Notably the phase-6 test did NOT fail under
the mutation — confirming it pins only the list and never covered targeting, which was
the whole gap. Mutation reverted; file back to 10 passed.

### Deviations
- **+2 tests, not the expected +1.** The second (detail-less -> list only) is the
  negative half of the same branch; without it the targeting test alone can't
  distinguish "consumes detail" from "always opens the browser". Conservative addition,
  no existing assertion touched.

### Near-miss worth recording — third instance of a familiar failure family
The ruling-#8 status-pill assertion I wrote earlier in phase 7 scanned for
`/\bpublished\b/`. It was **coincidentally green**: the DOM concatenates the pill and
its neighbour to `itemPublishedCategory`, so `\b` never matched — the regex could never
have fired, pass or fail. Caught and fixed during phase 7 by mutating the source.

That is the **third** occurrence in this pipeline of a test that sits green while
asserting nothing (cf. the two dead e2e specs above, which are the same disease in a
different organ: a check nobody ever executed). The standing lesson holds — **mutate the
source or it isn't a test**; a green assertion proves nothing until you've watched it go
red.

### Test results (actual)
- `npx tsc --noEmit` -> **exit 0, zero output**.
- `npm run test:run` -> **281 passed | 1 skipped (282 files); 4484 passed | 15 skipped
  (4499); 0 failed.** Baseline was 4482/4497 -> **+2 tests, 0 regressions**.
- Playwright `--list` counts as above.

### Open risks
- The two CMS e2e specs are now registered but **still unproven** — first real execution
  may surface selector/timing breakage that four phases of never running has hidden.
  Budget for that at the founder gate rather than treating registration as coverage.
- Unlocked permalink following (and silently saving) the title remains a **taste call**
  carried to the founder's UX gate, per the orchestrator — not ruled on here.

---

## Phase 7 — FIX PASS (impl-review findings, pre-commit)

### Files changed
- `src/app/edit/[token]/components/cms/ItemEditor.tsx`
- `src/app/edit/[token]/components/cms/ItemEditor.test.tsx`
- `src/app/edit/[token]/components/cms/GroupManager.tsx`
- `src/app/edit/[token]/components/cms/GroupManager.test.tsx` *(new)*
- `e2e/cms-authoring.spec.ts`
- `docs/task/cms-collections.audit.md`

### 1. Stale `stored` silently dropped a clear — FIXED
`buildValuesPayload`'s `stored` came from the `item?.values` **prop**, which only
freshens when `refreshCmsCollection` lands — a fire-and-forget refresh whose failure is
swallowed to a `logger.warn` with the previous bundle left cached. Sequence that lost
data: fill X → save → refresh fails/lags → clear X → save → X absent from `stored` →
**no `null` sentinel sent** → server keeps the old value while the editor shows it
cleared. Silent editor↔published divergence.

Fix: a `storedRef`, seeded from the prop and re-seeded on the row-change effect, but
**advanced from each write's RESPONSE row** (`data.item.values`) — what the server
actually holds. `handleSave` now computes the payload against `storedRef.current`.

**Deviation (conservative, in-scope):** `storedRef` is advanced **only** when the
response carries a real `values` object. A response without one is ambiguous, and
treating it as "the row is empty" would drop the *next* clear — reintroducing the bug
from the other side. Covered by its own test. Consequence: `storedRef` never regresses
to a *fresher* prop either (e.g. an edit from another tab); the write-response is
authoritative for this editor's session, which is the conservative read.

The empty→`null` mapping semantics are untouched — only where `stored` comes from.

### 2. Title→slug auto-follow REMOVED (founder ruling)
The old behaviour let an unlocked title rename send `slug`; the route then set
`slugLocked: true`, after which the hint claimed *"Custom permalink"* for a permalink
the user never customized. And since `materializePublish` never re-derives slugs, this
editor was the **only** thing that could move an item slug — a title typo-fix relocated
a LIVE detail page's URL and 404'd `/collection/old-slug` with no redirect.

Now: slug is derived at CREATE only (phase-1 route); after that it moves **only** on an
explicit permalink edit, which still PATCHes `slug` and still lets the server set
`slugLocked`. Removed the auto-follow write path, the `titleFieldId` read and the
now-unused `slugifyName` import.

Hint copy rewritten to be true in **every** state — provenance, not behaviour:
"You set this permalink." / "Made from the title when this item was created.", both
followed by "Changing it changes this item's link — the old one stops working."

**Deviation (conservative, in-scope):** `slugLocked` is **kept** as local state and kept
read-in-UI (for that provenance copy) rather than deleted. Deleting it would have made
the editor stop reading the flag entirely, reverting the phase-4 carry; keeping it
preserves the read without letting it gate a rename it can no longer affect. Documented
in the file header.

Tests: `an UNLOCKED permalink follows the title` replaced by **`a title change alone
sends NO slug`**; the LOCKED-never-moves guard and the manual-edit-PATCHes guard both
kept; added a hint-copy test asserting the editor never says "Custom permalink" or
"Follows the title" for a derived slug.

### 3. Ruling-#8 guard tightened — the escape hatch is closed
The old assertion scanned `querySelectorAll('button, span')` for the exact string
`'Draft'`. `Badge` renders a **`<div>`**, so the scan could not see one at all, and any
label but exactly "Draft" walked past both it and the `[data-item-status]` check —
while `CollectionBrowser` already ships `<Badge variant="status">`, i.e. the realistic
way someone re-adds a pill.

Replaced with a **positive structural** check: no element in the editor carries the
`Badge` class signature (`inline-flex items-center gap-1 py-0.5 text-xs font-semibold`)
— catching a Badge of any variant with any text. Backed by a second test that asserts
that signature still holds for **every** `badgeVariants` variant, so a `badge.tsx`
restyle cannot silently narrow the guard to matching nothing. `[data-item-status]` and
the Write-with-AI checks retained (the latter widened from `button, span` to `*`).

### 4. Honesty fixes
- **`ItemEditor.test.tsx`** — `'image and gallery ask the SHARED media picker'` only
  clicked `[data-image-add]`. Now exercises **both**: image opens it, close, gallery
  opens it, and the pick is applied and asserted to land in the **gallery** field
  (`[data-gallery-thumb="0"]`) — which is what proves the second open was the
  gallery's. Renamed to match what it does.
- **`e2e/cms-authoring.spec.ts`** — the registration comment still told readers to add
  both specs to `playwright.config.ts`; verified they ARE listed (lines 114-115) and
  rewrote it as a rename warning. Line 61's "a title (text_short) and a cover (image)"
  corrected to `text_long`, which is what the loop adds.
- **`GroupManager.tsx`** — the rename input is uncontrolled (`defaultValue`, commit on
  blur), so a rejected PATCH left the **rejected name** on screen next to the error
  banner, reading as accepted. `run()` now resolves a boolean and `renameGroup` reverts
  the DOM node to the stored name on failure. **Extended (in-scope):** also reverts on a
  blank/whitespace-only commit, which had the same "shows what was never saved" defect.

### 5. GroupManager coverage — the load-bearing claim is now tested
`GroupManager.test.tsx` (new, 14 tests): reorder up/down emits the **full list
renumbered from 0**; the fixture deliberately uses **sparse post-delete orders (0, 5,
9)** so a two-row swap would pass an "ids moved" assertion while still emitting
gaps/ties, and the tests assert the whole array instead. Plus: sorts by stored order not
array position; first/last buttons disabled; rename payload; rename revert on 409 and on
network failure; delete confirms first, is a `DELETE` with the group in the **query
string** and no body, and writes nothing when declined; add trims and clears; `onChanged`
fires only after the server accepts.

### Out of scope, respected
No drag added to `GroupManager`; no `@testing-library`; `materializePublish.ts` and all
published-path code untouched; the empty→`null` semantics unchanged.

### Non-vacuity evidence (mutate or it isn't a test)
- **Item 1** — reverted `storedRef.current` to `item?.values ?? null`:
  `computes the delete sentinel against the SAVE RESPONSE, not the item prop` **FAILED**
  (`the clear was dropped: expected undefined to be null`). Restored → green.
- **Item 2** — re-added the auto-follow:
  `a title change alone sends NO slug` **FAILED**. Restored → green.
  ⚠️ **My first attempt at this mutation was itself a false green** — I injected the
  auto-follow via an inline `require()` inside a client module, which did not take
  effect, and the suite reported 30/30 pass. Re-done with a static import, it failed as
  expected. *A mutation that produces green is not evidence the test is vacuous — it may
  be evidence the mutation didn't land.* Verify the mutation before trusting its result.
  (This is the fourth entry in this file's coincidentally-green family.)
- **Item 3** — inserted `<Badge variant="status">Live</Badge>` into the editor header:
  the ruling-#8 test **FAILED** (`expected [ 'Live' ] to deeply equal []`). The OLD
  assertion would have missed it entirely (a `<div>`, and not the string "Draft").
  Restored → green.

### Test results (actual)
- `npx tsc --noEmit` → **exit 0, zero output**.
- `npm run test:run` → **282 passed | 1 skipped (283 files); 4502 passed | 15 skipped
  (4517); 0 failed.** Baseline 281/282 files, 4484/4499 → **+1 file, +18 tests, 0
  regressions, 0 failures**.
- `npx eslint` on the four changed source/test files → **exit 0, no output**. (The
  repo-wide `next lint` warnings are pre-existing `no-img-element`/`exhaustive-deps` in
  unrelated files; `ItemEditor.tsx`'s own `<img>` uses already carry inline disables.)
- E2E not executed (no server/Clerk session in this pass) — the two CMS specs remain
  registered-but-unproven, as flagged in the phase-7 section above.

### Open risks
- `storedRef` is per-mount session state: if the same item is edited concurrently in two
  tabs, this editor trusts its own last write-response over a fresher prop. That is the
  conservative choice for the clear-dropping bug but it is **not** last-write-wins
  conflict handling, which this feature does not have anywhere.
- The permalink is now immutable-by-default. There is still **no redirect** when a user
  *does* hand-edit a live item's permalink — the old URL 404s. The auto-follow removal
  shrinks how often that happens to "only when deliberate"; it does not solve it.
- The two CMS e2e specs are still unproven on a real run (unchanged from phase 7).

---

# Phase 8A — contracts + data (amendment items 1-4 + `listingPage` column)

**Files changed**

1. `prisma/schema.prisma`
2. `prisma/migrations/20260720150017_cms_amendment/migration.sql` (new)
3. `src/lib/schemas/collection.schema.ts`
4. `src/lib/schemas/collection.schema.test.ts`
5. `src/app/api/collections/route.ts`
6. `src/app/api/collections/[collectionId]/route.ts`
7. `src/app/api/collections/[collectionId]/items/[itemId]/route.ts`
8. `src/app/api/collections/collections.authz.test.ts`
9. `src/modules/cms/types.ts`
10. `src/modules/cms/README.md`
11. `src/app/edit/[token]/components/cms/AddCollectionModal.tsx` — *closed-at-9 sweep + the tsc consequence of a 10th type*
12. `src/app/edit/[token]/components/cms/AddCollectionModal.test.tsx` — *sweep*
13. `src/app/edit/[token]/components/cms/ItemEditor.tsx` — *comment only*
14. `src/app/edit/[token]/components/cms/ItemEditor.test.tsx` — *sweep*
15. `src/modules/cms/render/CollectionSection.core.tsx` — *comment only*
16. `src/modules/cms/render/parity.test.tsx` — *comments + one test NAME*
17. `src/modules/cms/materializePublish.test.ts` — *comment only*
18. `e2e/cms-authoring.spec.ts` — *comment only*
19. `docs/task/cms-collections.audit.md` (this entry)

(`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` shows as
modified in `git status` — it was ALREADY dirty at session start, untouched by this phase.)

NOT touched, deliberately: `docs/task/cms-collections.plan.md` (orchestrator owns it),
`materializePublish.ts`, `collectionHelpers.ts`, any renderer/component beyond the comment
sweep, `src/app/api/collections/[collectionId]/items/route.ts` (item CREATE).

## Per file

**`prisma/schema.prisma` + the migration.** ONE migration, `prisma migrate dev` (never
`db push`). `Collection.purposes Json @default("[]")`, `Collection.listingPage Boolean
@default(false)`, `CollectionItem.featuredOnHome Boolean @default(false)`. Purely additive
`ALTER TABLE … ADD COLUMN … NOT NULL DEFAULT`. Each column carries a schema comment saying
what reads it (nothing, for two of the three) and why.

**`collection.schema.ts`.** `stat` appended to `FIELD_TYPES` (closed set 9 → **10**);
`StatValueSchema = {key: string, value: string}`, both allowed EMPTY per the
all-values-optional law, with a docblock spelling out that the two property names are
load-bearing (neither ends in `href|url|link|slug`, so `sanitizeContentHtml` cannot rewrite
them to `'#'` — the phase-3 bug) and that `stat` needs no empty→null caller mapping.
`COLLECTION_PURPOSES` / `PurposeSchema` / `PurposesListSchema` (deduped, no default) /
`PurposesSchema` (deduped + `.default([])`). `purposes` + `listingPage` on
`CollectionCreateSchema` (defaults `[]` / `false`) and as optionals on
`CollectionPatchSchema`; `featuredOnHome` optional on `ItemPatchSchema`. The purposes block
carries a large "STORED, VALIDATED, READ BY NOTHING — do not delete, do not branch on it"
header.

**The three routes.** New fields destructured, validated and persisted. `assertProjectOwner`
gate shape untouched (result-checked, `allowMissing:false`, no `claimIfOrphan`); the nested
token-scoped lookups (`loadOwnedCollection` / `loadOwnedItem`) untouched. PATCH keeps its
`...(x !== undefined ? {x} : {})` discipline, so omitting a new field never resets it. GET
`/api/collections` now returns `purposes` + `listingPage` in the list projection. Route
docblocks record the preset-seeding path and the reserved/unread status of the new fields.

**`types.ts`.** Re-exports `StatValue`, `CollectionPurpose`, `CollectionPurposes`; adds
`purposes?` / `listingPage?` to `CmsCollection` and `featuredOnHome?` to `CmsItem`, each
with a why-it-is-unread docblock.

**`README.md`.** Closed set stated as **10** with the `stat` shape, its key-naming
constraint and its 8A-contract-only status. New section **"Two fields exist ON PURPOSE with
no reader — do not wire them up, do not delete them"**: a table giving, per field, the exact
state and the WHY (Deviation #1 for `purposes`; the products-hardcoded `materializeHome*`
helpers + the greyed-placeholder rule presupposing a destination for `featuredOnHome`),
plus an explicit "do NOT touch `materializeHome*` to hook this up".

**The sweep.** Every stale "closed at 9 / all 9 / ALL NINE" claim in live code, tests, the
module README and the e2e spec now reads correctly (either "10" or "the closed set"), each
noting that `stat` has no control/renderer until 8B.

## Deviations (all conservative, all logged)

1. **`stat` is a SINGLE `{key,value}` pair, not an array of pairs.** The amendment's safety
   note mentions "an ARRAY of pairs", but the plan step and the phase brief both specify the
   value schema as `{key, value}`. Implemented as the pair; a spec LIST is several `stat`
   fields. Documented in the schema docblock and the README. If 8B wants repeated pairs in
   ONE field, that is a contract change, not a rendering detail.
2. **`stat` is NOT offered in the "+ Add field" picker yet.** Adding a 10th type to
   `FIELD_TYPES` is a tsc error against `FIELD_TYPE_LABELS: Record<FieldType,string>`, so
   `AddCollectionModal.tsx` had to be touched (it is in Files-touched via the sweep clause —
   it literally carried "the closed 9"). Rather than expose a type the user could create but
   not fill (no `ItemEditor` control, no renderer until 8B), the picker iterates a new
   exported `PICKER_FIELD_TYPES = FIELD_TYPES.filter(t => t !== 'stat')`. Picker behaviour is
   byte-identical to phase 7. **Phase 8B must delete this filter** — the constant's docblock
   says so.
3. **`CmsCollection.purposes` / `.listingPage` / `CmsItem.featuredOnHome` are OPTIONAL in
   the TS interfaces.** Required fields broke `toCmsCollection` in `materializePublish.ts`,
   which this phase is explicitly forbidden to touch. Optional is honest (a pre-8A narrower
   omits them) and keeps `if (c.listingPage)` working for 8B. 8B may tighten when it edits
   the materializer.
4. **`featuredOnHome` was added to item PATCH only, not item CREATE.** The item-create route
   (`items/route.ts`) is not in Files touched. A `featuredOnHome` in a create body is
   silently stripped by Zod today; the column defaults to `false`. No caller sends it (there
   is no UI, by ruling).
5. **`ItemEditor.test.tsx`'s type-coverage assertion** now compares against
   `FIELD_TYPES.filter(t => t !== 'stat')` rather than `FIELD_TYPES`. It still bites for an
   11th type added without a control; 8B removes the filter when the `stat` control lands.

## Verification (actual)

- `npx prisma validate` → schema valid. `npx prisma migrate dev --name cms_amendment` →
  `20260720150017_cms_amendment` created and applied, client regenerated.
- `npx tsc --noEmit` → **exit 0, zero output**.
- `npm run test:run` → **282 passed | 1 skipped (283 files); 4522 passed | 15 skipped
  (4537); 0 failed.** Baseline was 4502/4517 → **+20 tests, no regressions, same file
  count**.
- `npx next lint` on all touched files → clean; the only output is a PRE-EXISTING
  `no-img-element` warning at `parity.test.tsx:451` (untouched line).
- **Live DB spot-check** (`information_schema` + a real probe row on the dev DB):
  defaults are `listingPage → false`, `purposes → '[]'::jsonb`, `featuredOnHome → false`,
  all `NOT NULL`. The 2 PRE-EXISTING `Collection` rows read back `purposes: []`,
  `listingPage: false`, and existing items read `featuredOnHome: false` — backfill correct.
  Probe rows deleted.

### Non-vacuity evidence (both probes bit)

1. **`StatValueSchema`** replaced with `z.any()` → `collection.schema.test.ts` went
   **1 failed | 38 passed**, failing exactly `"stat accepts a {key, value} pair and rejects
   other shapes"`. Restored → green.
2. **`PurposeSchema`** replaced with a `z.string()` cast (closed vocab defeated, types still
   compiling) → **2 failed | 98 passed** across both suites: `"REJECTS anything outside the
   closed vocab"` (schema) and `"a preset carrying an unknown purpose is refused (closed
   vocab)"` (route). Restored → green. Note the route-level test failed too, proving the
   closed vocab is enforced at the API edge and not only in isolation.

## Open risks / carries for 8B

- **`purposes` has no reader BY RULING.** Its guard is documentation only — nothing fails if
  a future agent branches rendering on it. The README section is the whole defence.
- **`featuredOnHome` likewise**, plus the specific trap that `collectionHelpers.ts`'s dormant
  `materializeHome*` functions look like the obvious place to "finish" it. They are
  products-hardcoded and spec §Out.
- **8B owes:** delete `PICKER_FIELD_TYPES`; add the `stat` control + emit path + renderer;
  extend the `materializePublish.test.ts` key-name meta-guard fixture and `parity.test.tsx`
  to cover `stat` (both currently say so in comments); restore `ItemEditor.test.tsx`'s
  coverage assertion to the full `FIELD_TYPES`; consider tightening the three optional type
  fields when `toCmsCollection` is edited.
- `stat` currently reaches the DB only via a programmatic/preset POST — no UI path creates
  one, so the type is unexercised end-to-end until 8B.

---

# Phase 8B — rail CMS tab + listing page + stat rendering

**Files changed**

1. `src/app/edit/[token]/components/layout/LeftPanel.tsx`
2. `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
3. `src/app/edit/[token]/components/cms/CmsPanel.tsx`
4. `src/app/edit/[token]/components/cms/CmsPanel.test.tsx`
5. `src/app/edit/[token]/components/cms/AddCollectionModal.tsx`
6. `src/app/edit/[token]/components/cms/AddCollectionModal.test.tsx`
7. `src/app/edit/[token]/components/cms/ItemEditor.tsx`
8. `src/app/edit/[token]/components/cms/ItemEditor.test.tsx`
9. `src/components/ui/key-value-field.tsx` *(new)*
10. `src/components/ui/key-value-field.test.tsx` *(new)*
11. `src/modules/cms/sectionKeys.ts`
12. `src/modules/cms/materializePublish.ts`
13. `src/modules/cms/materializePublish.test.ts`
14. `src/modules/cms/render/toRenderModel.ts`
15. `src/modules/cms/render/CollectionSection.core.tsx`
16. `src/modules/cms/render/CollectionSection.tsx`
17. `src/modules/cms/render/parity.test.tsx`
18. `src/modules/cms/README.md`
19. `e2e/cms-publish.spec.ts`
20. `docs/task/cms-collections.audit.md` (this entry)

NOT touched, deliberately: `prisma/schema.prisma` + migration, `collection.schema.ts`,
the collections routes (**8B step 2 was already delivered by 8A** — `listingPage` /
`purposes` / `stat` are in the schema, the DB and all three routes already);
`src/modules/cms/types.ts` (see deviation 4); `CollectionSection.published.tsx`,
`CollectionDetail.*`, `toRenderModel.test.ts`, `GlobalAppHeader.menus.test.tsx`,
`src/app/api/publish/route.ts` (see deviations 3 and 5).

(`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap` shows as
modified in `git status` — already dirty at session start, untouched by this phase.)

## Per file

**`LeftPanel.tsx` — step 1, the rail move.** The `cms` tab loses its `<Coming>` wrapper and
becomes real; `pages`/`theme` stay inert. `SegmentedControl` is now driven by a `railTab`
state with an allow-list `onValueChange` (a `<Coming>` accidentally deleted must not silently
become a selectable tab with no body). Body switches to `<CmsPanel>` on the CMS tab; the
header label reads "Collections"; the greyed add-section slot is hidden there (CMS has its
own New-collection row). Review mode still wins over everything. A `lessgo:manage-collections`
listener switches to the tab and forwards the target collection id.

**`GlobalAppHeader.tsx`.** `<CmsPanel>` mount and its import deleted, replaced by a comment
recording WHY there must not be a second entry point.

**`CmsPanel.tsx` — host change.** Popover trigger + `AppPopoverMenu`/`AppPopoverItem`/
`BAR_CTL_CLASS` removed; the list is inline rail markup carrying the SAME
`data-collection-{row,items,place,delete,new}` hooks and the same `N·M` count. Refresh moved
from open→mount (LeftPanel mounts it only while the tab is selected, so the "never one request
per editor load" property is preserved by the host instead of by a popover). New
`initialCollectionId` prop for the event-arrived-while-unmounted case. Every behaviour from
phases 6/7 is intact: `e.detail.collectionId` targeting, create/edit/delete (incl. the
DELETE-then-sweep ordering), Add-to-page, browser, item editor, group manager, `editing`
reset on close.

**`materializePublish.ts` — step 4, the listing page.** New `buildListingSubpage` /
`buildListingSubpages` / `isCmsListingSubpage` / `applyCmsListingPages`, structurally cloned
from the phase-4 detail set so every pin re-applies verbatim: dual pin, leading-slash
`/<collectionRef>` key, `{layout:{sections},content,title}` with `theme` omitted, no
url-suffixed keys, cms-only authority, `CmsPathCollisionError` before any mutation, toggle-off
prune. Also: new `assertNoCmsPathCollisions` pre-pass (below), `toCmsCollection` now carries
`listingPage`, and the collision message says "collection page" rather than "collection item
page" now that it covers both families.

**`sectionKeys.ts`.** `CMS_LISTING_MARKER` / `cmsListingSectionId` / `isCmsListingSectionId` /
`cmsListingPath`. The marker segment is the phase's one genuinely NEW piece of reasoning —
see "Findings" below. Module stays import-free.

**`toRenderModel.ts`.** `safeStat` + the `stat` case in `normalizeFieldValue`;
`StatValue` in `CmsRenderValue`; `listingPage` on `CmsRenderModel` (so publish decides from
the single shaped feed, not from the raw row).

**`CollectionSection.core.tsx`.** `FieldNode` case `stat` (two spans, shared by listing card
AND detail page — `CollectionDetail.core.tsx` renders fields through this same function, so
step 5b's detail-page half needed no edit there); three `lg-cms__stat*` styles; new
`emptySlot` prop rendered OUTSIDE `[data-cms-body]` when there are no items.

**`CollectionSection.tsx`.** `EmptyHint` — edit-only, outside the compared body, dispatches
the same window event as `ManageButton` (renderer code, no app-chrome import).

**`AddCollectionModal.tsx`.** `PICKER_FIELD_TYPES` deleted → picker is `FIELD_TYPES` (all 10).
Second `listingPage` switch; CREATES-THESE-PAGES tiles now react to BOTH toggles, with an
explicit line for the neither-on case. `purposes` chip row with copy stating it does not
affect rendering yet. Both new fields ride the existing create/patch payload.

**`ItemEditor.tsx`.** `stat` in `seedDraft`, `normalizeValue` (all-empty → `null`, half-filled
kept) and the `FieldControl` switch (`KeyValueField`).

**`key-value-field.tsx`.** Modelled on `link-pair-field.tsx`, same empty→`null` caller-contract
docblock — with the difference spelled out: `stat` does not 400 on an empty write, it silently
STORES an empty pair, so the mapping is required for a quieter reason.

**Tests.** Listing set mirrors the phase-4 detail set assertion for assertion (18 new cases);
`stat` added to the `materializePublish` meta-guard fixture (all 10 types now swept), to the
parity fixture and to `ItemEditor`'s coverage assertion (filter removed); 4 empty-state parity
cases; 4 rail-integration cases; 4 `KeyValueField` cases; e2e listing on/off + `stat`
end-to-end.

## Findings worth carrying

**🐛 The listing page's ownership test could NOT be structural — and copying phase 4's would
have deleted user pages.** Detail-page pruning is safe because a user cannot author a
`cmscollectionitem` section at all. But a user CAN "Add to page" a `cmscollection` block onto
their own subpage. A subpage whose only section is that block is *structurally
indistinguishable* from an auto-emitted listing page, so the obvious symmetric implementation
(`every section id has the cmscollection prefix`) would have made the first
`listingPage: false` **delete the user's page**. Fixed with a marker segment in the section id
(`cmscollection-listing-<collectionId>`); user placements are `cmscollection-<uuid>` and a
uuid can never start with `listing-`. Pinned by a dedicated test and by the README table.

**The collision guard needed a pre-pass.** `applyCmsDetailPages` runs first and mutates; a
LISTING collision thrown afterwards would leave detail pages already written, breaking the
stated "checked before any mutation" invariant (the publish route discards the payload on a
409, so this was invariant-drift, not a live bug). `assertNoCmsPathCollisions` now checks both
families up front; each `apply*` keeps its own guard for direct callers.

## Deviations (all conservative, all logged)

1. **Listing pages are coupled to PLACEMENT, like detail pages.** A collection with
   `listingPage: true` that is placed nowhere emits no page, because the authoritative set is
   built from the bundles publish already loaded. Alternative = query every collection on
   every publish, which breaks phase 3's celebrated zero-query fast path for non-CMS
   customers (naayom) on the highest-blast-radius route. Chose consistency with the existing
   `buildDetailSubpages` coupling. **Founder-visible at the gate:** toggling listing on
   without placing the block produces nothing. Documented in the README.
2. **The rail tab is LOCAL state, not `leftPanel.activeTab`.** The brief said to wire
   `leftPanel.activeTab === 'cms'`, but that store field is a different axis with a different
   closed union (`'pageStructure' | 'review' | …`) driving the Setup checklist, and widening
   it means editing `types/store/state.ts` + `actions.ts` — neither in Files touched. Nothing
   outside `LeftPanel` reads the rail tab, so local state is behaviourally identical.
3. **`CmsRenderModel.listingPage` is OPTIONAL, not required.** Required broke
   `EMPTY_CMS_MODEL` in `CollectionSection.published.tsx`, which is NOT in Files touched.
   `toRenderModel` always emits it; read as `!!model.listingPage`. **One line
   (`listingPage: false` in `EMPTY_CMS_MODEL`) tightens it — orchestrator's call.**
4. **`src/modules/cms/types.ts` NOT tightened** (8A's carry offered it). Making
   `listingPage`/`purposes`/`featuredOnHome` required would force fixture edits across
   `cmsActions.test.ts`, `CmsPanel.test.tsx` and others, several outside Files touched, for
   zero behavioural gain. `toCmsCollection` now populates `listingPage`, which was the actual
   point of the carry.
5. **8B step 2 (`listingPage` data) needed NO work** — phase 8A already shipped the column,
   the Zod schemas and all three routes. Verified by reading, not assumed.
6. **`toRenderModel.test.ts` not extended for `stat`.** Not in Files touched; `stat`'s emit
   path is covered by the `materializePublish` meta-guard + byte-identical round-trip and by
   two parity tests, and its empty→null mapping by `ItemEditor.test.tsx`.
7. **The published twin's empty state is UNCHANGED** — it still renders the plain
   `<p class="lg-cms__empty">No items yet.</p>` it rendered before. The brief said both
   "published twin must stay unchanged" and "publishes as nothing"; those conflict, so the
   conservative reading (no published-output change at all) won. The editor therefore shows
   the plain line inside the body AND the guidance hint above it — slightly redundant, but
   the hint cannot move into the body without entering the parity comparison.
8. **`CmsPanel.test.tsx` host adapted, assertions not weakened.** `openMenu()` deleted (the
   list is inline); "refreshes on OPEN not on mount" became "refreshes ONCE on mount", which
   is the same invariant under the new host; "opens on the event" became "refreshes on the
   event" plus a NEW stronger case pinning `initialCollectionId`. The targeting test and the
   failed-DELETE-must-not-sweep ordering guard are untouched.

## Verification (actual)

- `npx tsc --noEmit` → **exit 0, zero output**.
- `npm run test:run` → **283 passed | 1 skipped (284 files); 4566 passed | 15 skipped
  (4581); 0 failed.** Baseline 283 files / 4522+15 → **+1 file (`key-value-field.test.tsx`),
  +44 tests, no regressions.** `GlobalAppHeader.menus.test.tsx`, `naayomProducts.test.ts`,
  `collectionHelpers.works.test.ts`, staticExport and persistence suites all green and
  untouched.
- `npx next lint` on all 17 touched source/test files → **no errors**; two PRE-EXISTING
  `no-img-element` warnings (`CollectionSection.tsx:52`, the edit `Img` primitive; and the
  known `parity.test.tsx` one, line-shifted by additions).
- **e2e NOT RUN — stated honestly.** `e2e/cms-publish.spec.ts` gained
  `listingPage ON publishes /<collection>; OFF removes it`; `npx playwright test --list
  cms-publish` now lists **3** tests in that file (was 2), so it is registered, not orphaned
  (the phase-7 dead-file lesson). Executing it needs a dev server + a Clerk session + Blob/KV,
  none of which this session has; and per the file's own header a local run 500s on publish
  anyway. Every binding listing-page assertion is in vitest.
- **DB:** no migration in this phase (8A's `20260720150017_cms_amendment` already added
  `listingPage`, verified default `false` on existing rows in the 8A entry).

### Non-vacuity evidence (all three probes bit)

1. **Listing dual pin** — deleted `layout: CMS_COLLECTION_LAYOUT` from `buildListingSubpage`
   → **2 failed | 71 passed**: `"DUAL PIN: every id in layout.sections has a non-empty
   content[sid].layout"` AND `"publishes the SAME body skeleton the editor renders from the
   same tables"` (the latter through `LandingPagePublishedRenderer`, i.e. the silent vanish
   was observed end-to-end, not just as a missing property). Restored → green.
2. **Listing collision guard** — replaced both `throw new CmsPathCollisionError(path)` sites
   (the `applyCmsListingPages` guard and the listing half of the pre-pass) with no-ops →
   **3 failed | 70 passed**: fails-loud-before-mutation, the message-names-the-path case, and
   the `assertNoCmsPathCollisions` pre-pass case. Restored → green.
3. **Published twin has no empty-state chrome** — made the core emit a hardcoded
   `data-cms-empty-hint` when no `emptySlot` was passed (i.e. leaked editor chrome into the
   published twin) → **1 failed | 23 passed**, exactly `"the PUBLISHED twin carries NO editor
   chrome at all"`. Restored → green.

## Open risks / carries

- **Listing pages need the block placed** (deviation 1). If the founder's gate expects
  "toggle on → page exists" with nothing placed, that is a scope decision to revisit, not a
  bug — and undoing it costs the zero-query fast path.
- **`purposes` still has no reader.** It now has a CONTROL, which raises the stakes on the
  README section: a future agent who deletes the "does not change how it looks" copy without
  shipping per-purpose renderers turns a truthful control into a user-facing lie.
- **Two listeners on `lessgo:manage-collections`** (LeftPanel + CmsPanel). Both are needed
  and both are tested, but a third surface adding a listener should re-read the note in
  `CmsPanel.tsx` first.
- **The editor shows two empty messages** for an empty collection (deviation 7). Cosmetic;
  resolving it means a founder ruling on whether an empty collection should publish the
  `No items yet.` line at all.
- **`EMPTY_CMS_MODEL` keeps `listingPage` optional** (deviation 3) — a one-line tighten in a
  file this phase could not open.
- Unchanged from phase 7: no conflict handling, unbounded fan-out (now +1 page per
  listing-enabled collection, negligible), a hand-edited permalink still 404s the old URL.

---

# Phase 8B-decouple — page emission decoupled from placement (founder ruling)

Amends phase 8B **before commit**. Ruling: a collection with `listingPage` and/or
`detailPages` on must emit its pages on publish **regardless of placement**. This closes
phase 8B deviation 1 and, with it, the same defect `detailPages` had carried since phase 4.

## Files changed

- `src/modules/cms/materializePublish.ts`
- `src/modules/cms/materializePublish.test.ts`
- `src/modules/cms/render/CollectionSection.published.tsx`
- `src/modules/cms/render/toRenderModel.ts`  <-- **not on the Files-touched list — see Deviations #1**
- `src/modules/cms/README.md`
- `docs/task/cms-collections.audit.md`

## What changed, per file

### `materializePublish.ts`

- `loadCmsBundles(tokenId, collectionIds)` -> **`loadCmsBundlesForToken(tokenId)`**. The
  `where` is now `{ tokenId }` alone — covered by the existing `@@index([tokenId, order])` on
  `Collection` — with a matching `orderBy: { order: 'asc' }` so the emitted page set is
  deterministic run-to-run. `include` was replaced by an explicit nested **`select`** (11
  collection columns + 4 group + 7 item), so the stored-but-unread `purposes` column and the
  timestamps stay off the wire. Still ONE round trip; groups/items ride the same query. The
  old function had no callers outside this module (verified by grep), so the rename is inert.
- **`materializeCmsForPublish`** no longer derives collection ids from the payload. It loads
  by token, then runs the unchanged sequence: `assertNoCmsPathCollisions` -> `materializeCmsContent`
  -> `applyCmsDetailPages` -> `applyCmsListingPages`. The phase-3 zero-cms-sections early return
  is **deleted**.
- Nothing else moved. Every pin is untouched and still exercised: dual pin, leading-slash
  absolute keys, the key-naming law, authority scoping, the `cmscollection-listing-<id>` marker
  segment, fail-loud 409 before mutation, toggle-off pruning, the insertion point in
  `route.ts`, and both sanitize chokepoints via `runPublishSanitizers()`.
- Doc comments rewritten where they asserted the now-false coupling: the file header (new
  "DISCOVERY IS TOKEN-KEYED" block), the phase-4 detail preamble, the phase-8B "COUPLED TO
  PLACEMENT" block (now "DECOUPLED"), the `materializeCmsForPublish` docstring (states the
  cost and the byte-identity invariant that replaces the fast path), and a stale
  `loadCmsBundles` reference in the `materializeCmsContent` docstring.

### `materializePublish.test.ts` (+8 tests, 73 -> 81)

The `@/lib/prisma` mock became `{ collection: { findMany } }` (a `vi.hoisted` stub) so the
entry point can be driven end-to-end; every pre-existing gate still runs on fixtures and is
unchanged. A `beforeEach` resets the stub so a leftover `mockResolvedValueOnce` cannot leak.
Byte-identity is asserted on `JSON.stringify`, **not** `toEqual` — key order counts.

New gates:

| Test | Proves |
|---|---|
| zero collections -> byte-identical, subpages included | the invariant replacing the fast path |
| all-toggles-off -> byte-identical | same, with rows actually loaded |
| reads by `tokenId` only, exactly one `findMany` | tenant boundary + one round trip |
| listing AND item pages for a collection **placed nowhere** | the bug being fixed |
| placed AND toggled on -> exactly ONE listing page | no duplicate across the two routes; also asserts the placement keeps its uuid id while the page gets the marker id |
| toggle off -> pages pruned, nothing placed | prune works on the decoupled path |
| pruning cannot touch a user page containing a placed block | the marker segment, now through the **entry point** (wider surface) |
| unplaced collection colliding with a real page -> 409, payload unmutated | fail-loud survives decoupling |

### `CollectionSection.published.tsx`

`EMPTY_CMS_MODEL` gains `listingPage: false` (the one line phase 8B flagged and could not open).

### `toRenderModel.ts`

`CmsRenderModel.listingPage` tightened `?: boolean` -> `: boolean`, comment updated. See
Deviations #1.

### `README.md`

"The pages a collection publishes" rewritten: both families are decoupled, discovery is
`tokenId`-keyed, the ruling's rationale, the explicit cost (one indexed query per publish) and
the two byte-identity guarantees that replace the fast path — plus the corollary that the
pruning surface is now wider, which is what makes the listing marker load-bearing.

## Deviations

1. **Edited `src/modules/cms/render/toRenderModel.ts`, which is NOT on the Files-touched
   list.** The task authorized tightening `CmsRenderModel.listingPage` to required; that type
   is *declared* in `toRenderModel.ts`, not in the listed `CollectionSection.published.tsx`
   (which only holds `EMPTY_CMS_MODEL`). The tighten is impossible without it. I treated the
   explicit instruction as authorization-by-implication rather than stopping, because the edit
   is two lines (`?` removal + comment) in a file phase 8B had already modified. **Flagging
   loudly: revert both halves if that reading is wrong** — nothing else depends on them.
2. **"All toggles off -> byte-identical" is asserted on a payload with no placed block.** With
   a block placed, materialization legitimately writes its model, so byte-identity cannot hold
   and asserting it would be wrong. Conservative reading; noted in the test and the README.
3. **`route.ts:74-75` now carries a stale comment** — "Zero cms sections => zero queries =>
   existing publishes are byte-identical". The behaviour it describes is gone. `route.ts` is
   out of scope, so I did not touch it. **Owed follow-up** (comment only; no logic depends on
   it).

## Test results (actual)

- `npx tsc --noEmit` -> **exit 0, zero output**.
- `npm run test:run` -> **283 passed | 1 skipped (284 files); 4574 passed | 15 skipped (4589);
  0 failed**. Baseline was 4566 passed / 4581 total; delta is exactly the 8 new tests.
  `naayomProducts.test.ts`, `collectionHelpers.works.test.ts`, staticExport and persistence all
  green and untouched.
- `npx eslint` on the four changed source files -> **0 errors**, 1 pre-existing
  `@next/next/no-img-element` warning in `CollectionSection.published.tsx` (a published twin
  must emit a raw `<img>`; unchanged by this phase).

## Non-vacuity evidence (three deliberate breaks, each restored)

1. **Byte-identity** — appended `(content as any).cmsTouched = true;` at the end of
   `materializeCmsForPublish` -> **2 failed | 79 passed**: exactly the zero-collections and
   all-toggles-off gates. Confirms both compare the WHOLE payload and are wired to the
   function under test. Restored -> 81 passed.
2. **Placed-nowhere emission** — re-inserted the phase-3 coupling
   (`if (findCmsSections(content).length === 0) { ...empty reconcile...; return 0; }`) -> **3
   failed | 78 passed**: "placed NOWHERE", "toggle OFF prunes ... nothing is placed", and the
   unplaced-collision 409. Confirms the emission gate fails under the exact regression it
   guards. Restored -> 81 passed.
3. **Pruning / marker segment** (re-verified because the surface grew) — swapped
   `isCmsListingSectionId` for `isCmsSectionId` inside `isCmsListingSubpage` -> **2 failed | 79
   passed**: the phase-8B unit gate AND the new entry-point gate. Confirms a user's own
   subpage containing a placed block would be DELETED without the marker. Restored -> 81 passed.

## Open risks

- **Every publish now issues one collection query**, including for projects that have never
  used the CMS. Indexed and narrow, but it is a new unconditional dependency on the DB inside
  the highest-risk route: a `Collection` read failure now fails a publish that previously did
  not touch that table. It falls to the route's outer 500 (fail-closed), which is correct, but
  it is a genuinely new failure mode worth watching after deploy.
- **Fan-out is unbounded and now unconditional**: a collection with `detailPages` on and 500
  items emits 500 subpages whether or not the user ever placed the block. Previously placement
  was an accidental brake. No cap exists.
- **Collision blast radius widened**: a `listingPage`-on collection whose slug matches an
  existing page now 409s the publish even if the block was never placed. Correct per the
  ruling (the page is promised), but a user could hit a 409 on a collection they consider
  inactive. The message names the path, so it is actionable.
- Phase 8B's other carries are unchanged, except deviation 1 (listing needs placement) and
  the `EMPTY_CMS_MODEL` carry, both of which this amendment closes.

---

# Amendment 2 — decoupling close-out (rulings + fan-out cap)

## Files changed

- `src/modules/cms/materializePublish.ts`
- `src/modules/cms/materializePublish.test.ts`
- `src/app/api/publish/route.ts` (comment + error mapping only — no logic change beyond the
  added `instanceof` arm)
- `src/app/api/publish/route.test.ts`
- `src/modules/cms/README.md`
- `docs/task/cms-collections.audit.md` (this file)

`src/modules/cms/render/toRenderModel.ts` is NOT in this amendment — its `listingPage`-required
edit is from the previous amendment and was ruled approved. Untouched here.

## 1. `toRenderModel.ts` ruling — no action

Confirmed approved. No further edit made.

## 2. `src/app/api/publish/route.ts` — stale comment replaced

The comment claimed "Zero cms sections ⇒ zero queries ⇒ existing publishes are byte-identical".
That fast path no longer exists. Replaced with what is now true: the materializer loads THIS
project's collections by the ownership-verified `tokenId` on EVERY publish (one indexed query),
and the guarantee that stands in its place is byte-identity for a project with zero collections
or with all toggles off — enforced by tests, not by an early return.

The same comment block now documents TWO expected user-facing failures (collision + fan-out
cap) instead of one, and states explicitly why the catch is two explicit `instanceof` arms and
not a shared base class. No logic changed apart from the second arm.

## 3. NEW GUARD — detail-page fan-out cap

**`MAX_CMS_DETAIL_PAGES_PER_COLLECTION = 100`** (exported from `materializePublish.ts`).

Chosen value and why: publish does a static render + blob upload + KV write **per page,
serially, in one request**. At an observed-realistic ~100-300ms per page, 100 pages is ~10-30s,
which still fits a typical 60s serverless budget alongside the rest of publish (export, DB
writes, version cleanup). A few hundred does not. No concrete reason was found to deviate from
the suggested 100, so 100 it is.

Mechanism:

- `assertCmsFanOutWithinLimit(bundles)` — pure, no DB, no mutation. Called in
  `materializeCmsForPublish` **first**, before `assertNoCmsPathCollisions` and before any
  container is touched. Cap-before-collision because an over-cap collection is a refusal
  regardless of where its paths land, and it is the cheaper check.
- `CmsFanOutLimitError(collectionName, itemCount)` — a DISTINCT class (not a subclass of
  `CmsPathCollisionError`, not a shared base). Message names the collection, its item count and
  the limit, plus the two remedies.
- Route maps it to **409** — same shape and status as the collision precedent, via a narrow
  `instanceof cmsError instanceof CmsPathCollisionError || instanceof CmsFanOutLimitError`.
  DB/unexpected errors still fall through to the fail-closed 500 (case 5 pins this).
- **No truncation.** An over-cap collection refuses the whole publish.

## Deviations (in-scope judgment calls)

1. **Counted on ITEMS, not on emitted detail pages.** `bundle.items.length`, not
   `allRenderItems(toRenderModel(b)).filter(hasPath).length`. They differ only for slug-less
   items (which emit no page), so item-counting is the CONSERVATIVE side — it can trip slightly
   early, never late — and it keeps the message ("has N items") literally true against what the
   user sees in the collection editor. Also avoids running `toRenderModel` twice per publish.
2. **Only `detailPages`-on collections are counted.** A toggled-off collection emits no detail
   pages, so its size is irrelevant; listing pages are exactly one per collection and need no
   cap. Pinned by a test.
3. **Per-collection, not a global total.** Matches the founder's message wording ("limited to N
   per collection"). Pinned by a test so nobody "fixes" it into a total later. Noted as a
   residual risk below.
4. Chose 409 over 413/422 — reuses this route's existing conflict vocabulary as instructed.

## Tests

New in `src/modules/cms/materializePublish.test.ts` (`describe('detail fan-out cap')`), 6 gates:

- pure guard passes AT the cap, throws ONE over
- over-cap collection with `detailPages` OFF is exempt
- publishing AT the cap works and emits exactly N detail pages
- one over → rejects with `CmsFanOutLimitError`, message contains collection name, item count
  and the limit
- the over-cap failure **mutates NOTHING** — byte-identity via `JSON.stringify` (not `toEqual`),
  with anti-vacuity assertions that the payload really did carry subpages and a placed block
  that could have been damaged
- the cap is per-collection, not a total

New in `src/app/api/publish/route.test.ts`: case 6 — `CmsFanOutLimitError` → 409 whose body
names the collection, the count and the limit, with the same "no side effect" assertions as the
collision case (`renderPublishedExport` / `publishedPage.update|create` / `project.upsert` all
uncalled).

### Non-vacuity — observed, not assumed

- Broke the cap (`count > MAX * 1000`): **3 of the 6 new gates failed** — "the pure guard passes
  AT the cap and throws ONE over it", "ONE over the cap FAILS LOUD…", "the over-cap failure
  mutates NOTHING". The other 3 correctly stayed green (they assert the non-throwing side).
  Restored; back to green.
- Removed the `|| cmsError instanceof CmsFanOutLimitError` arm from the route: **route case 6
  failed** (1 failed | 6 passed). Restored; back to green.

## Verification (actual)

- `npx tsc --noEmit` → **exit 0, zero output**
- `npm run test:run` → **283 passed | 1 skipped (284 files); 4581 passed | 15 skipped (4596);
  0 failed**. Baseline was 4574/4589 — exactly +7 tests (6 cms + 1 route), no pre-existing test
  disturbed.
- `npx eslint` on the 4 changed source/test files → **exit 0, no output**
- Not committed.

## Open risks

- **The cap is a v1 SAFETY VALVE, not a product decision about collection size.** The real fix
  is batched or async fan-out (a later track). Until then a user with a 150-item collection
  simply cannot ship detail pages — they get a clear 409, but no path forward other than
  trimming. That is deliberate (loud beats an opaque timeout) but it IS a product-visible
  ceiling worth surfacing in the collections UI before beta.
- **Per-collection, not global.** Ten 100-item collections still fan out to 1000 pages in one
  request and will time out exactly as before. The per-collection framing came from the ruling's
  message wording; a global cap is the stricter guard if the timeout is the real concern. Flagged
  rather than changed — out of scope for this phase.
- The 100 figure is reasoned from typical per-page cost, **not measured** against a real publish
  of 100 pages. Worth one real timing run before beta; the constant is tunable in one place.
- No UI surface warns about the cap before the user hits publish. The collections modal's
  "CREATES THESE PAGES" tiles could show the count against the limit; not in scope here.

---

# Addendum — the GLOBAL fan-out cap (correction round)

## Files changed

- `src/modules/cms/materializePublish.ts`
- `src/modules/cms/materializePublish.test.ts`
- `src/app/api/publish/route.ts`
- `src/app/api/publish/route.test.ts`
- `src/modules/cms/README.md`
- `docs/task/cms-collections.audit.md` (this file)

## Why

The previous round's open risk ("per-collection, not global") was accepted by the founder: a
per-collection cap **cannot** be the binding constraint, because the timeout is a property of
the whole publish REQUEST. Ten collections of 100 items each are ten individually *legal*
collections that still fan out to 1000 pages and die as the same opaque timeout. This round adds
the global cap and keeps the per-collection one for message quality.

## What changed, per file

### `src/modules/cms/materializePublish.ts`

- New exported constant **`MAX_CMS_DETAIL_PAGES_TOTAL = 100`** — total detail pages across ALL
  collections in one publish.
- New exported error class **`CmsTotalFanOutLimitError`** — carries `totalItems`; message states
  the total, the limit and the remedy ("turn detail pages off for some collections, or reduce
  their items"). **Separate class, no shared base** with `CmsFanOutLimitError` (a hierarchy would
  silently enrol future error types into the route's 409 branch).
- `assertCmsFanOutWithinLimit` now accumulates a running total. Order is deliberate:
  per-collection check **first** (so a single oversized collection yields the message that NAMES
  it), global check after the loop (the check the request budget actually depends on). Still
  PURE, still called before the collision guard and before any mutation — unchanged insertion
  point.
- Header comment rewritten to state the two caps' distinct jobs and to record that both numbers
  are **arithmetic estimates, not measurements**.

### Sizing the global cap — 100, and the reasoning

Publish renders one blob **and** writes one KV route **per page, serially**, in one request.
Assume ~300ms/page worst case (~100ms typical). The same request must also fit the rest of
publish: root HTML render, both sanitize passes, KV route writes, DB work. Reserving roughly
half of a 60s serverless budget for that leaves ~30s for fan-out => **~100 pages** at the
worst-case per-page cost. Erring conservative deliberately: too low fails loud with an
actionable 409 and is a one-line raise; too high fails as the opaque timeout the cap exists to
eliminate.

Consequence worth stating plainly: with both caps at 100, the per-collection cap is
**subsumed** as a guard — it can only fire when the total would fire too. That is the intended
design (it exists for message quality), and the invariant `PER_COLLECTION <= TOTAL` is pinned by
a test so a future edit can't make it dead or make it permit what the total forbids.

### `src/app/api/publish/route.ts`

Imports the new class and adds it to the `instanceof` narrowing → 409 with `.message` verbatim.
Explicit third `instanceof`, still no catch-all, still no base class. Comment updated (TWO →
THREE expected user-facing failures) and states which class is the actual guard.

### `src/modules/cms/materializePublish.test.ts`

- **Removed** the gate "the cap is a per-COLLECTION limit, not a total across collections" — it
  asserted precisely the behaviour this round fixes (two 51-item collections passing). Keeping it
  would have pinned the bug.
- **New `describe('total fan-out cap (across ALL collections)')`, 8 gates:**
  - the load-bearing one — **throws when the TOTAL exceeds the cap even though EVERY collection is
    under the per-collection cap** (5 collections x 26 items), with an anti-vacuity loop asserting
    each bundle passes `assertCmsFanOutWithinLimit` alone, so only the global check can be what
    throws;
  - passes AT the total, throws ONE over;
  - a single oversized collection still gets the collection-NAMING error (`CmsFanOutLimitError`,
    NOT the aggregate one) — pins the check ORDER;
  - the two error classes are siblings (neither `instanceof` the other; both prototypes are
    `Error`) — pins "no shared base class";
  - `detailPages`-off collections don't count toward the total;
  - end-to-end publish AT the total emits exactly that many detail pages;
  - one over the total fails loud with a message containing the total and the limit;
  - the over-total failure **mutates NOTHING** — payload byte-identical after the throw, with the
    existing anti-vacuity assertions (the payload really does carry a placed block and an
    unrelated `/about` subpage that the throw must have spared).

### `src/app/api/publish/route.test.ts`

New `case 7: CmsTotalFanOutLimitError → 409 NAMING the total and the limit` — asserts 409, body
contains the total and the limit, is not "Internal Server Error", no `url`, and no side effect
(no export, no DB write). Header comment documents why: unmapped, this class would fall to the
fatal catch and surface as a bare 500 — the exact unactionable failure the cap replaces.

### `src/modules/cms/README.md`

"The fan-out cap" section rewritten: a two-row table of the two constants and their distinct
jobs, an explicit paragraph on **why a per-collection cap alone is not a guard** (recording that
this was the original design and it was wrong), the `PER_COLLECTION <= TOTAL` invariant and the
test that pins it, and the three-class `instanceof` narrowing. Adds the note that both numbers
are estimates and that **one real timing run against a seeded collection is owed before beta**,
with the measured per-page cost to be written back into the constants' comments.

## Deviations from the instruction

None on scope. One judgment call inside the Files-touched list: the instruction said "keep the
per-collection one", and doing so required **deleting** the existing test that asserted the cap
is explicitly *not* a total. Deleting a green test is normally a smell, so recording it: that
test encoded the exact defect being corrected, and its replacement (the "every collection under,
total over" gate) covers the same fixture shape with the now-correct expectation.

## Test results (actual)

- `npx tsc --noEmit` → **exit 0, zero output**
- `npm run test:run` → **283 passed | 1 skipped (284 files); 4590 passed | 15 skipped (4605);
  0 failed**. Baseline was 283/1 (284) and 4581/15 (4596) — exactly **+9 tests** (8 cms + 1
  route), no pre-existing test disturbed (1 deleted, 9 added, net +8 named gates).
- `npx eslint` on the 4 changed source/test files → **exit 0, no output**
- Not committed.

## Non-vacuity evidence

Mutated the global check in `assertCmsFanOutWithinLimit` to `if (false && total > MAX_...)` and
re-ran both files:

    Test Files  1 failed | 1 passed (2)
         Tests  4 failed | 99 passed (103)

The 4 failures were exactly the global-cap gates that can only pass because of that line
("throws when the TOTAL exceeds the cap even though EVERY collection is under the per-collection
cap", "passes AT the total and throws ONE over it", "ONE over the total FAILS LOUD...", "the
over-total failure mutates NOTHING..." — the last reporting `promise resolved "1" instead of
rejecting`, i.e. the publish went ahead and materialized). The other 99 (including every
per-collection-cap gate) stayed green, confirming the new gates are driven by the global check
specifically and not by the pre-existing one. Restored the line; both files back to 103 passed.

## Open risks (updated)

- **Both numbers remain arithmetic estimates.** Owed before beta: one timing run (seed a
  collection at the cap, publish, measure) with the measured per-page cost written back into the
  constants' comments, so the next person tunes from data. Recorded in the README too.
- **The ceiling is now lower in aggregate**, and product-visible: a user with several medium
  collections can be refused even though no single collection looks large. The message says so
  and names the total, but no UI surface warns before publish — the "CREATES THESE PAGES" tiles
  showing a running count against the limit is the obvious fast-follow; not in scope here.
- Batched/async fan-out is still the real fix and still a later track. Both constants remain
  tunable in one place.
- 60s is assumed, not read from a `maxDuration` export — `/api/publish` sets `runtime = 'nodejs'`
  and `dynamic = 'force-dynamic'` but no explicit `maxDuration`, so the effective ceiling is the
  Vercel plan default. Worth confirming during the same timing run.

---

## Nit pass — closing the combined 8A+8B impl-review findings (verdict `ship`)

Follow-up commits on top of the committed 8A/8B phases. No behaviour redesign; the caps' NUMBERS
(100/100), the two error classes' shape, the route's narrow `instanceof` arms, the fail-closed 500,
`purposes`/`featuredOnHome`, the CmsPanel targeting test and the failed-DELETE ordering guard are
all untouched.

**Files changed**

- `src/modules/cms/materializePublish.ts`
- `src/modules/cms/materializePublish.test.ts`
- `src/modules/cms/sectionKeys.ts`
- `src/hooks/editStore/cmsActions.test.ts`
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`
- `src/app/edit/[token]/components/cms/CmsPanel.test.tsx`
- `src/modules/cms/render/parity.test.tsx`
- `e2e/cms-publish.spec.ts`
- `docs/task/cms-collections.audit.md` (this entry)

### 1. `materializePublish.ts` — listing pages now count toward the total cap (nit 2)

The comment claimed listing pages "are exactly one per collection and need no cap", which made the
stated guarantee ("only a total can bound the request") false: nothing bounds the NUMBER of
collections (`POST /api/collections` has no ceiling), so N listing-page collections are N serial
blob renders + KV writes — the exact failure class the cap exists to eliminate.

`assertCmsFanOutWithinLimit` now adds `+1` per `listingPage`-on collection to `total`. The
PER-COLLECTION cap is unchanged (still detail-items only — it exists to name a culprit collection,
and a listing page cannot make one oversized). Counting is conservative in the same way item counts
are: a slug-less collection emits no listing page but is still counted, so the guard trips early,
never late.

Comment/doc updates that now say what is true: the two-caps block, the `MAX_CMS_DETAIL_PAGES_TOTAL`
docblock (name keeps `DETAIL` for continuity; the count is every cms page),
`CmsTotalFanOutLimitError`'s docblock, and the function docblock.

**Message wording** changed from "N collection detail pages … Turn detail pages off" to
"N collection pages … Turn detail or listing pages off" — required for the message to stay true now
that listing pages are counted. Class shape is untouched: `CmsTotalFanOutLimitError(totalItems)`
keeps its constructor signature and its public `totalItems` field (documented as now counting
pages). `publish/route.test.ts` asserts only the NUMBERS in that message, not the wording, so the
route contract tests are unaffected and that file was not edited.

### 2. `sectionKeys.ts` — corrected the WRONG rationale in the prune-safety comment (nit 3)

The comment claimed placements are `cmscollection-<uuid>` and that "a uuid is hex + hyphens, so it
can never begin with `listing-`". Factually wrong: `newCmsSectionId()`
(`hooks/editStore/cmsActions.ts:40-43`) mints `cmscollection-` +
`Math.random().toString(36).slice(2,10)` — base36, **no hyphen**. The code is safe for the OPPOSITE
reason: `parts.length > 2` in `isCmsListingSectionId`, which holds only because a placement id
contains no hyphen after the type prefix. Rewritten to name `parts.length > 2` as the invariant, to
state that placement ids MUST stay hyphen-free, and to call out that a switch to
`crypto.randomUUID()` (uuids DO contain hyphens) would break the guard that stops pruning from
deleting a user's own subpage. The `isCmsListingSectionId` docblock now points at that invariant too.

### 3. `cmsActions.test.ts` — hyphen-free id format is now pinned (nit 3, second half)

New gate `mints a HYPHEN-FREE id after the type prefix (the listing-prune invariant)`: 50 mints,
each asserted to split into exactly 2 parts with the `cmscollection` prefix, plus the consequence
that actually matters — `isCmsListingSectionId(sid) === false`. A future id-format change now fails
loudly instead of silently arming the prune. Imports `isCmsListingSectionId` through the existing
`materializePublish` re-export (the path this file already used).

### 4. `LeftPanel.tsx` — `cmsTarget` is consumed once (nit 4)

**Choice: clear once consumed, not on tab switch.** A new effect
(`if (isCmsMode && cmsTarget) setCmsTarget(null)`) clears the target right after the mount that used
it. Tab-switch clearing would have fixed only the reported repro; consume-once also covers panel
collapse/expand, which remounts `CmsPanel` the same way. Safe because `CmsPanel` reads
`initialCollectionId` ONLY in a `useState` initializer, which runs during the child's render — i.e.
before this parent effect — so the value is always spent before it is cleared. The already-mounted
case is unaffected (the panel's own listener handles it).

### 5. `CmsPanel.test.tsx` — strengthened the inert-tabs assertion + regression gate (nits 4, 5)

- `'Pages / Theme stay inert…'` now asserts the SECTIONS list is still rendered (the `Hero` row for
  the mocked `hero-abc12345`) in addition to `[data-cms-panel]` being null. Previously it would have
  passed if `Pages` had gone live with a body of its own — it did not test what its name claimed.
- New gate `the "Manage items" target is consumed ONCE — returning to CMS shows the list`:
  event → browser open → Sections → CMS → list, no browser.

### 6. `parity.test.tsx` — explicit `stat` detail-page assertion (nit 8)

`renders a 'stat' pair on the DETAIL page too (shared FieldNode), both twins` asserts
`[data-cms-field="stat"]` plus both halves (`Weight` / `4.2 kg`) inside `[data-cms-detail-body]` in
each twin. Previously true-but-inferred: the skeleton comparison pins edit==published and would stay
green if `stat` rendered NOWHERE on a detail page. (Placed here rather than in
`materializePublish.test.ts` because the claim is about rendered markup, which is this file's job.)

### 7. `materializePublish.test.ts` — two new fixture sets (nits 1, 5)

- Cap: `listing pages ALONE can exceed the total`, `a listing page tips an AT-the-cap detail
  collection over the total`, and `over-total listing pages FAIL LOUD through publish, mutating
  NOTHING` (rejects with `CmsTotalFanOutLimitError` — the class the route maps to 409 — payload
  byte-identical after the throw, with anti-vacuity checks that the payload really carried a subpage
  and a placed block). Each listing-only fixture is individually legal under the per-collection cap,
  so only the total can be what throws.
- Byte-identity: `a payload with NO 'content.subpages' key is byte-identical, and none is created`,
  run for BOTH zero collections and both-toggles-off, asserting `'subpages' in content === false`.
  Closes the gap where an edit that unconditionally did `content.subpages = {}` would have added a
  key to every single-page publish payload unnoticed.
- Adjusted `collections with detailPages OFF do not count toward the total` to also set
  `listingPage = false` — it was implicitly relying on the fixture default, which is now
  load-bearing.

### 8. `e2e/cms-publish.spec.ts` — stale coupling comment fixed (nit 7)

The listing test said the page "is emitted for a PLACED collection (same coupling detail pages have
had since phase 4), so place the block" — that coupling was REMOVED by this phase. Rewritten to say
placement is NOT required (emission is decoupled, and the ruling retro-fixed `detailPages` too), and
that the block is placed only so the root page also renders it inline. Harmless to the test; it was
misdescribing the contract in the file a future agent copies from.

### Deviations

1. **`CmsTotalFanOutLimitError`'s message wording changed** (see §1). Judged in-scope: keeping the
   old wording would have made the message lie about what it counts. Class shape, constructor
   signature, public field name and the route's `instanceof` arm are all unchanged.
2. **`MAX_CMS_DETAIL_PAGES_TOTAL` keeps its name** although it now bounds every cms page. Renaming
   would have rippled into `publish/route.ts` and `route.test.ts`, neither of which is on the
   Files-touched list. Documented in place instead.
3. **The CmsPanel regression test unmounts the file-level standalone `CmsPanel` first.** That panel
   is mounted for every test in the file by `beforeEach`, hears the same window event and portals its
   OWN Radix dialog to `document.body`, so a document-scoped browser assertion could not tell the two
   panels apart (and the dialog is portalled, so it cannot be rail-scoped either). Uses the existing
   `act(() => root.unmount())` … `root = createRoot(container)` pattern from the teardown test above
   it.

### Verification (actual results)

- `npx tsc --noEmit` → exit 0, ZERO output.
- `npm run test:run` → **283 passed | 1 skipped (284 files); 4597 passed | 15 skipped (4612); 0
  failed.** Baseline was 4590 passed / 4605 total ⇒ +7 tests, all new here (3 cap, 1 subpages-absent,
  1 hyphen-free id, 1 cmsTarget consume-once, 1 detail `stat`), 0 regressions.
- `npx next lint` on the changed `src/` files → clean except one PRE-EXISTING warning
  (`parity.test.tsx:557` `@next/next/no-img-element`, in code this pass did not touch).
- **Non-vacuity, nit 1 (required):** deleting the single new line
  `if (bundle.collection.listingPage) total += 1;` and re-running `materializePublish.test.ts` →
  **3 failed | 96 passed**, the three failures being exactly the three new listing-count gates; every
  pre-existing cap test stayed green (so the change is additive, not a re-shuffle). Line restored,
  suite back to 99 passed.
- **Non-vacuity, nit 4 (extra):** commenting out the `setCmsTarget(null)` effect →
  `CmsPanel.test.tsx` **1 failed | 15 passed**, the failure being the new consume-once gate.
  Restored, 16 passed.

### Open risks

- The cap numbers are still ARITHMETIC ESTIMATES, never timed (the pre-existing owed-before-beta note
  stands). Adding listing pages to the total makes the guard slightly stricter, which is the safe
  direction.
- `assertCmsFanOutWithinLimit` counts a listing page for a slug-less collection that would emit none.
  Deliberate (conservative, matches the item-count convention) but means the total can trip a few
  pages early on projects with slug-less collections.
- Consume-once means a rapid double "Manage items" on DIFFERENT collections while the panel is
  UNMOUNTED still lands on the last id — unchanged behaviour, and the panel's own listener covers the
  mounted case.
- e2e was not run (unchanged tolerance: local publish 500s without Blob/KV); only a comment changed
  in that file.

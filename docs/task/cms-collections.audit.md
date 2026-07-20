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

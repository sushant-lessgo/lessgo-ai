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

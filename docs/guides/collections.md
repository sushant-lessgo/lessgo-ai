# Collections — the user-authored CMS (guide)

> **Rewritten 2026-07-20 (cms-collections phase 9).** The previous version of this file described the LEGACY AI-derived collection registry as if it were the whole story. It was stale on every load-bearing point: it claimed one collection type (there are four), mapped `works` to writers at `/books` (the code has photographers/atelier at `/works`), and stated *"record schema = the item block's element contract"* — the exact premise the CMS replaced.
>
> **There are TWO collection systems in the codebase and they are unrelated.** This guide covers both, and the boundary between them, because confusing them corrupts live customer data.
>
> Code-level reference (deeper, agent-oriented, kept next to the code): `src/modules/cms/README.md`. Plan of record: `docs/task/cms-collections.plan.md`.

---

## The two systems at a glance

| | **CMS collections** (new, this guide's subject) | **Legacy collection registry** |
|---|---|---|
| Where | `src/modules/cms/`, `src/app/api/collections/*` | `src/modules/collections/registry.ts`, `src/hooks/editStore/collectionHelpers.ts` |
| Authored by | **the user, by hand. Zero AI.** | AI generation + editor panels; records derived from page content |
| Schema | user-composed from a **closed set of 10 field types** | the item block's element contract (fixed per type) |
| Storage | Prisma tables `Collection` / `CollectionGroup` / `CollectionItem` | inside each item PAGE's section content — no DB entity |
| Types | unlimited, user-named | **closed 4-key union**: `products`, `services`, `case-studies`, `works` |
| Rendering | ONE shared block, identical on every template | per-template index-grid + item-record block pairs |
| Pages | materialized **server-side at publish** | `ProjectPage` rows in the editor store |

Neither system reads the other. **Do not "generalize" one into the other opportunistically** — see [Works authority](#works-authority-the-one-that-bites) below.

---

## CMS collections — the core

A **Collection** is a user-named set of structured records. The user names it, composes its schema, optionally groups its items, and fills the items by hand.

### 1. Tables

Three Prisma models, all keyed by **BOTH** `projectId` (relation → `Project`, `onDelete: Cascade`) and `tokenId` (the route key) — the `MediaAsset` shape, so deleting a project never orphans rows.

- **`Collection`** — `name`, `slug`, `fieldSchema` (ordered field defs, JSON), `roles` (JSON), `purposes` (JSON), `detailPages`, `listingPage`, `layoutHint`, `order`. `@@unique([tokenId, slug])`.
- **`CollectionGroup`** — `name`, `order`. Cascade-deleted with the collection.
- **`CollectionItem`** — `groupId` (nullable, `onDelete: SetNull` → ungrouped), `slug`, `values` (JSON, keyed by field id), `order`, `slugLocked`, `featuredOnHome`. `@@unique([collectionId, slug])`.

The Zod contract — the single source of truth for every shape — is `src/lib/schemas/collection.schema.ts`; TS types are inferred from it in `src/modules/cms/types.ts`. Never hand-declare a collection shape.

### 2. The 10 field types are CLOSED

`image` · `gallery` · `video` · `audio` · `text_short` · `text_long` · `link` · `date` · `tags` · `stat`

No Price type, no rich text. **Extending the set is a spec change, not an implementation detail** — rendering keys off the field TYPE, so a new type means a new control, a new render-model emit path and a new node in both the listing card and the detail page.

Value shapes (all optional — an item may leave any field empty): image `{url, assetId?}` · gallery `{url, assetId?}[]` · video/audio `{kind:'upload'|'link', url}` · text_short/text_long `string` · link `{url, label}` · date ISO `string` · tags `string[]` · stat `{key, value}` (ONE pair; a spec *list* is several `stat` fields, never a numeric-keyed map — see the coercion law).

**Field ids must match `^[A-Za-z][A-Za-z0-9_-]*$`** and are **never reused**, even after a field is deleted. Deletion is deliberately non-destructive (orphaned values survive in items and are ignored on read), so recycling an id would resurrect a deleted field's values under a new field — in the editor *and* in published output. The schema builder reserves draft ids ∪ stored ids ∪ every key any item holds a value under.

### 3. Field roles — closed at 3, type-filtered

| Role | Eligible types | Drives |
|---|---|---|
| `title` | `text_short` | the card's prominent line, the item slug at create |
| `cover` | `image`, `gallery` | the card's top image |
| `primaryLink` | `link` | the card's CTA button |

Cross-validated at write time (`makeRolesSchema`). Unset roles fall back to the first eligible field by order. **The STORED key is `primaryLink`; the RENDER-MODEL key is `primaryCta`** — do not unify them (see the key-naming law).

### 4. `purposes` — stored, validated, read by NOTHING

Closed vocabulary `offer | proof | price`, set semantics. Persisted forward-compat by founder ruling: per-purpose rendering is deferred (v1 = one shared block everywhere). **Do not delete it as dead code, and do not branch any render path on it without a spec change.** `featuredOnHome` on items has the same status: a reserved column with no control and no reader.

### 5. Pages: listing + detail, both decoupled from placement

A collection can emit up to **two** page families, both authored SOLELY by the publish materializer — there are no editor page entries for either, so **detail/listing pages are not previewable in the editor in v1** (you see them on the live URL; the Item editor is the authoring surface).

| Toggle | Default | Path |
|---|---|---|
| `listingPage` | **off** | `/<collection-slug>` |
| `detailPages` | **off** | `/<collection-slug>/<item-slug>` |

**Both are DECOUPLED from placement** (founder ruling): a toggled-on collection emits its pages whether or not its block sits on any page. Placement drives only *inline* rendering. Coupling them made the "creates these pages" promise fail silently.

Fan-out is capped: **100 pages per publish in total** and **100 per collection**. Exceeding either fails LOUD with a 409 before any mutation — it never truncates, because a half-published collection is a silent lie. (Both numbers are arithmetic estimates, not measurements; a real timing run is owed before beta.)

### 6. Delivery: ONE shared block

The collection renders through `src/modules/generatedLanding/sharedBlocks/` — resolved **before** template dispatch — so it renders identically on **every** template. There is no per-template skin and no `CapabilityId` for it in v1; CMS is available on all templates. Group layout is stacked-only; `layoutHint` reserves the seam for tabs/accordion/filter later.

Parity is guaranteed at **two** layers, not one:

- **markup** — `CollectionSection.core.tsx` (+ `CollectionDetail.core.tsx`) is a plain server-safe walker consumed by both the `'use client'` `.tsx` twin and the `.published.tsx` twin;
- **data** — ONE shaping module, `render/toRenderModel.ts`, is called by the editor adapter **and** the publish materializer. The two feeds cannot diverge because there is only one shaping path.

URL sanitization lives inside `toRenderModel` (via the pure `src/lib/safeUrl.ts`), because nested values are out of reach of the publish walker. Two predicates, pinned per type: the **narrow** `isSafeURL` for `image`/`gallery` src; the **wide** `isSafePublishedUrl` for `link`/`video`/`audio`, so `mailto:` / `tel:` / `#anchor` CTAs survive.

`toRenderModel.ts` must **never** import `src/lib/publishSanitizer.ts` — that file is server-only (jsdom + dompurify) and the editor adapter is a client component.

### 7. Publish materialization

`src/modules/cms/materializePublish.ts` runs inside `POST /api/publish`, **after** a result-checked `assertProjectOwner(userId, tokenId, {action:'publish', allowMissing:true})` (added by this feature — the route previously had no ownership check on the body `tokenId`) and **before** both sanitize chokepoints. It reads the tables by the verified `tokenId` and rewrites every `cmscollection` section's content, plus reconciles the listing/detail subpages.

It preserves `content[sid].layout` and `id` when it replaces a section's content, and fails **closed** (500) on a DB error rather than publishing a silently empty block.

---

## Two laws you cannot violate

Both are about the same thing: **the publish path rewrites data that the editor does not**, so a mistake here looks perfect in the editor and is broken (or gone) on the live page.

### Law 1 — the coercion-proof shape

`coercePublishValue` (`layoutElementSchema.ts`) runs over every element value of every section at publish.

1. **Never emit an object carrying BOTH a string `content` key and a string `type` key** — it collapses to the bare `content` string. The render model uses **`{fieldType, value}`** per field. (Video/audio discriminate on `kind` for the same reason.)
2. **Any ONE numeric-string key whose value is a string collapses the WHOLE object** into the concatenation of only its numeric keys — every non-numeric sibling is silently discarded. It is *not* "all keys numeric". Hence the field-id regex, and hence "a spec list is several `stat` fields, never a map".
3. **Corollary: never register a v2 layout schema for `cmscollection` / `cmscollectionitem`.** The sanitizer preserves unknown keys, so a schema wouldn't strip the payload per se — the danger is the v2 whitelist/required-defaults machinery, built for flat string copy elements.

Binding protection: the materialized snapshot round-trips through `sanitizeContentForPublish` **byte-identical**.

### Law 2 — render-model key naming

There are **TWO** sanitize chokepoints. The second, `sanitizeContentHtml`, key-dispatches strings by **suffix**: any key ending in `href` / `url` / `link` / `slug` is routed through `sanitizePublishedUrl`, which rewrites anything non-URL to `'#'`.

**No key in the render model may end in `href`/`url`/`link`/`slug` — except the genuine `{url}` value keys.** This is not defensive; it already bit. `roles.primaryLink: "buy"` → `'#'` and `collectionSlug: "books"` → `'#'` silently emptied every published card's CTA while the editor rendered fine. Hence:

| Model key | NEVER call it | Carries |
|---|---|---|
| `roles.primaryCta` | `primaryLink` | a field id |
| `collectionRef` | `collectionSlug` | the collection slug |
| item `itemRef` | `slug` | the item slug |

Do **not** "fix" this by exempting `cmsModel` from the sanitizer — that would lose the legitimate HTML escaping of user-authored collection and group names. The full walk-depth table lives in `src/modules/cms/README.md`.

---

## Editing surfaces

| Surface | Route | Does |
|---|---|---|
| CMS rail tab | `/edit/[token]` → left rail → **CMS** | create/edit collections + schema, place a block on a page, manage items + groups |
| **CMS board** | `/dashboard/[token]/cms` | manage items of existing collections outside the editor (textual fields; media is read-only there and deep-links to the editor) |
| Works board | `/dashboard/[token]/work` | the **separate** works catalog — see below |

**Empty-value → `null` is the CALLER's job.** Zod rejects empty strings and the item PATCH deletes a key **only** on explicit `null`; a field cannot be cleared by omission (the PATCH is a MERGE). Every surface that edits item values owes this mapping. `tags` is exempt (`[]` is legal stored data).

---

## Works authority (the one that bites)

The **`works` catalog is AUTHORITATIVE** for photographer/atelier work and is **NOT** backed by the CMS tables. Its source of truth is `brief.facts.work.groups`; it is edited through `GET`/`PUT /api/work-library` → `applyRailEdit` → `resyncWorkContent`, and surfaced by the works board at `/dashboard/[token]/work`.

- The generic CMS board does **not** list `works` and issues **zero** calls to `/api/work-library`. That is enforced by a regression test asserting the *absence* of such calls, not merely the presence of the right ones.
- The publish materializer filters on the `cmscollection`/`cmscollectionitem` section-type prefix, so it is *structurally* incapable of touching works or products content.
- A future "unify works onto the CMS tables" pass is **explicitly deferred**. The two systems coexist. Generalizing one into the other without a spec corrupts a live customer's catalog.

---

## The legacy registry (still live — naayom's products)

`src/modules/collections/registry.ts` defines `CollectionDef {key, basePath, label, itemArchetypeKey, catalogArchetypeKey, catalogSectionType, itemSectionType}` over a **closed 4-key union**: `products`, `services`, `case-studies`, `works`. Its records live **inside each item page's content** (the item block's element contract), not in a table; index grids and "related" strips are derived by `collectionHelpers.ts` and fully replaced on sync (idempotent, and only after `commitActivePage` — syncing before it reads stale state).

It is AI/generation-coupled by design and remains live (naayom's products on techpremium). **Do NOT add keys to its `CollectionKey` union for CMS work** — the CMS core lives alongside it, in `src/modules/cms/`.

Pitfall carried over: `multiPageAssembly.ts`'s invariant that the AI assembler never sets `collectionKey`/`kind:'collectionItem'` still holds.

---

## Known limits (v1, accepted)

- Detail/listing pages are not previewable in the editor (publish-materialized only).
- No conflict handling anywhere: two tabs editing one item, or the dashboard board and the editor open at once, can go stale until reload.
- A hand-edited permalink on a LIVE item 404s the old URL — no redirect. Item slugs deliberately do **not** follow the title after creation.
- A collection slugged `blog` silently loses its detail pages; one slugged with a locale code (e.g. `nl`) fails publish with a misleading message (i18n projects only).
- Orphaned item values (from a schema edit) accumulate forever; there is no GC path.
- Gallery-vs-Collection is UX guidance only — nothing stops a 1-field image collection.

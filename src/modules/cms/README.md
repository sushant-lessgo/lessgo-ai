# `src/modules/cms` — user-authored CMS collections

The engine- and template-agnostic CMS core. A user names a **Collection**, composes its
schema from a **closed set of 9 field types**, optionally **groups** items, and fills
items by hand. **Zero AI.** Rendering keys off field TYPE, delivered as ONE shared block
that renders identically on every template.

Plan of record: `docs/task/cms-collections.plan.md`.

## What lives here

| File | Purpose |
|---|---|
| `slug.ts` | Pure slug helpers (`slugifyName`, `uniqueSlug`) — zero imports, client + server. |
| `types.ts` | TS surface, inferred from the Zod contract. Never hand-declare a shape. |
| `render/` | (phase 2) `toRenderModel.ts` + the `CollectionSection` core/edit/published trio. |
| `materializePublish.ts` | (phase 3) server-only publish materializer. |

The Zod contract itself lives at `src/lib/schemas/collection.schema.ts` (house convention:
schemas live in `src/lib/schemas/`). Data lives in the `Collection` / `CollectionGroup` /
`CollectionItem` Prisma tables, keyed by BOTH `projectId` (relation, `onDelete: Cascade`)
and `tokenId` (route key) — the `MediaAsset` shape.

## Invariants (read before touching anything)

1. **The 9 field types are CLOSED**: `image · gallery · video · audio · text_short ·
   text_long · link · date · tags`. No Price, no rich-text. Extending the set is a spec
   change, not an implementation detail.
2. **Roles are CLOSED at 3 and type-filtered**: `title` → `text_short`, `cover` →
   `image|gallery`, `primaryLink` → `link`. Cross-validated (`makeRolesSchema`).
   (The STORED key is `primaryLink`; the RENDER-MODEL key is `primaryCta` — see
   "Render-model KEY NAMES are constrained" below. Do not unify them.)
3. **This is ALONGSIDE, not an extension of, `src/modules/collections/registry.ts`.**
   Do NOT add keys to that module's closed `CollectionKey` union. The two systems coexist
   in v1.
4. **Works authority boundary.** The `works` catalog (`collectionHelpers.ts`,
   `modules/collections/README.md`) is authoritative for photographer/atelier work and is
   NOT backed by these tables. Nothing here may read or write `works` content. A future
   "unify works onto the CMS tables" pass is explicitly deferred — do not "generalize" it
   opportunistically; that corrupts a live customer catalog.
5. **NEVER register a v2 layout schema for `cmscollection` / `cmscollectionitem`.**
   (`src/modules/sections/layoutElementSchema.ts`.) `sanitizeContentForPublish` preserves
   unknown keys, so a schema wouldn't strip our payload per se — the danger is the v2
   whitelist/required-defaults machinery, which is built for flat string copy elements and
   would inject defaults into / mangle our structured payload. Binding protection = the
   byte-identical round-trip test in `materializePublish.test.ts` (phase 3).

## Coercion-proof render-model shape (load-bearing)

`coercePublishValue` (`layoutElementSchema.ts:380-397`) rewrites two shapes in EVERY
section at publish time, editor unaffected — the exact editor↔published divergence this
feature must avoid:

1. **Never emit an object carrying BOTH a string `content` key and a string `type` key** —
   it collapses to the bare `content` string. The render model therefore uses
   **`{fieldType, value}`** per field, never `{type, content}`. (The video/audio stored
   value discriminator is `kind` for the same reason.)
2. **Field ids must be non-numeric** — an object whose keys are all numeric strings gets
   reassembled into one concatenated string. Enforced by `FIELD_ID_REGEX`
   (`^[A-Za-z][A-Za-z0-9_-]*$`) in the Zod contract. Group/item ids are Prisma cuids
   (letter-prefixed) → safe by construction.
3. **Binding test:** the materialized snapshot round-trips through
   `sanitizeContentForPublish` **byte-identical** (phase 3) — not merely "placement
   elements survive".

## ⚠️ Render-model KEY NAMES are constrained (do not "improve" them)

There are **TWO** publish sanitize chokepoints, not one (`src/app/api/publish/route.ts`):
`sanitizeContentForPublish` (line 82, the coercion pass above) **and**
`sanitizeContentHtml` (line 133, `src/lib/publishSanitizer.ts`). The second one walks every
section's `elements` and key-dispatches strings by **suffix**: `isUrlContentKey`
(`publishSanitizer.ts:173-181`) matches any key ending in **`href` / `url` / `link` / `slug`**
(case-insensitive) and routes its value through `sanitizePublishedUrl`, which rewrites
anything that isn't a URL to **`'#'`**.

`elements.cmsModel` is an object, so the walker recurses into it: **every top-level string
prop of the model AND every string prop of the nested `roles` object is dispatched.** A model
key that merely *looks* url-ish is therefore corrupted at publish time only — the editor keeps
showing the true value. This actually happened: `roles.primaryLink: "buy"` → `'#'` and
`collectionSlug: "books"` → `'#'`, which put `data-cms-collection="#"` on every published CMS
section and — because `fieldById(item, '#')` returns `null` — **silently emptied every card's
CTA on the published page** while the editor rendered it fine.

Hence the deliberately non-matching names:

| Model key | NEVER call it | Carries |
|---|---|---|
| `roles.primaryCta` | `primaryLink` | a FIELD ID |
| `collectionRef` | `collectionSlug` | the collection slug |
| item `itemRef` | `slug` | the item slug |

The stored `CollectionRoles.primaryLink` (DB/Zod contract) keeps its name — it never enters
`elements`. `toRenderModel()` bridges the two vocabularies.

### The naming law is LOAD-BEARING, not defensive (phase 4 changed this)

An earlier version of this file said item-level keys escaped the walker "only by recursion
**depth** — that is luck, not design". **That luck has run out.** Phase 4's detail pages put
`itemRef` on a SHORTER path than the listing model does, and it is now genuinely walked.
Rename `collectionRef`/`itemRef` to anything ending in `slug` and you do not get a latent
risk — you get **`'#'` on every live item page**, in the editor-invisible way described above.

The walker is `sanitizeItemObject` (`publishSanitizer.ts:286-300`): it dispatches its own
object's string props, and recurses exactly **ONE** level (`allowRecurse` flips to `false` on
the first descent). Measured against that, per section shape:

| Section | Path | Walked? |
|---|---|---|
| listing `cmscollection` | `elements.cmsModel.collectionRef` | ✅ **yes** |
| listing | `elements.cmsModel.roles.{title,cover,primaryCta}` | ✅ yes |
| listing | `elements.cmsModel.groups[].{groupId,name}` | ✅ yes |
| listing | `…groups[].items[].itemRef` | ❌ no — `groups[]` spends the one recursion, so `items[]` is out of reach |
| detail `cmscollectionitem` | `elements.cmsItem.collectionRef` | ✅ **yes** |
| detail | `elements.cmsItem.roles.*` | ✅ yes |
| detail | `elements.cmsItem.item.itemRef` | ✅ **YES — this is the one that changed** |
| detail | `…item.fields[].*` (`{fieldType, value}`, image `{url}`) | ❌ no |

The detail model (`toDetailModel`) hoists the item OUT of `groups[].items[]` to a bare `item`
prop, so `itemRef` sits at `elements → cmsItem → item → itemRef` (the detail element key is
`CMS_DETAIL_ELEMENT_KEY = 'cmsItem'`, toRenderModel.ts): within the one-level
budget, where on the listing side it sat one level too deep. Same key, different depth,
opposite outcome.

Corollary for whoever extends the model: **do not reason about safety from the listing shape.**
A key that is unreachable there can be reachable on a detail page. Assume every model key is
walked, and obey the suffix rule unconditionally.

(The two ❌ rows are unreached *today*; treat that as an implementation detail of the current
shapes, not a guarantee — which is the whole lesson of this section.)

The **only** sanctioned url-suffixed keys are the genuine URL values inside image / gallery /
video / audio / link values (`{url, …}`) — gating those is correct and desirable. **Any new
model key must not end in `href`/`url`/`link`/`slug`.**

**Binding protection:** `materializePublish.test.ts` runs BOTH chokepoints in route order
(never just the first — running only the first is why this shipped green once) and carries a
permanent meta-guard asserting no key in a materialized `cmsModel` matches the suffix rule
except `url`.

Do NOT "fix" this by exempting `cmsModel` from `sanitizeContentHtml`: that would also lose the
legitimate HTML pass over `collectionName` and group names.

## ⚠️ Element-key contract (cross-phase, silent on failure)

The materialized render model MUST be written under the element key exported as
**`CMS_MODEL_ELEMENT_KEY`** (`= 'cmsModel'`, `render/toRenderModel.ts:53-59`). Import the
constant — never re-type the literal.

`LandingPagePublishedRenderer`'s `extractContentFields` spreads
`content[sectionId].elements` FLAT onto the published twin's props, and
`CollectionSection.published.tsx` reads `props[CMS_MODEL_ELEMENT_KEY]`, falling back to
`EMPTY_CMS_MODEL`. So writing the model under **any other key** (`cms_model`,
`collectionModel`, a nested `data` prop, …) does not throw, does not warn, and does not
fail the publish — the page just renders an empty **"No items yet"** block. The consumer at
risk is phase 3's publish materializer (`materializePublish.ts`), which produces the key.

## Other pinned decisions

- **Image values are objects** — `{url, assetId?}`, never bare URL strings. Renderers read
  `.url`.
- **Schema edits are non-destructive**: removing a field orphans its key in item `values`;
  reads ignore unknown keys, writes preserve them. No destructive rewrite of items.
- **Slug output contract**: `slugifyName`/`uniqueSlug` always return a value matching
  `SlugSchema` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`); slug uniqueness itself is enforced at WRITE
  time in the routes (`@@unique([tokenId, slug])`, `@@unique([collectionId, slug])`).

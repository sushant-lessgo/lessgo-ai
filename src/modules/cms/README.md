# `src/modules/cms` — user-authored CMS collections

The engine- and template-agnostic CMS core. A user names a **Collection**, composes its
schema from a **closed set of 10 field types**, optionally **groups** items, and fills
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

1. **The 10 field types are CLOSED**: `image · gallery · video · audio · text_short ·
   text_long · link · date · tags · stat`. No Price, no rich-text. Extending the set is a
   spec change, not an implementation detail. (`stat` = one `{key, value}` spec/stat PAIR,
   added by the 2026-07-20 spec amendment. Those two property names are load-bearing —
   see "Render-model KEY NAMES are constrained" below; anything ending in
   `href|url|link|slug` becomes `'#'` at publish. One field = one pair; a spec LIST is
   several `stat` fields, never a numeric-keyed map. Phase 8A shipped the contract; **phase
   8B shipped the rest** — `key-value-field.tsx` (the control), the `ItemEditor` type-switch
   branch, the `toRenderModel` emit path and a `FieldNode` case shared by the listing card
   and the detail page. 8A's `PICKER_FIELD_TYPES` filter is gone; the picker is the full 10
   again.)
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

## The pages a collection publishes (listing + detail)

A collection can emit up to **two** page families, both authored SOLELY by
`materializePublish.ts` (plan Deviation #3 — no editor page entries exist for either):

| Toggle | Path | Section id | Ownership marker |
|---|---|---|---|
| `listingPage` (phase 8B, default **OFF**) | `/<collectionRef>` | `cmscollection-listing-<collectionId>` | the `listing` marker segment |
| `detailPages` (phase 4, default OFF) | `/<collectionRef>/<itemRef>` | `cmscollectionitem-<itemId>` | the `cmscollectionitem` type prefix |

Both keys are **leading-slash absolute** (never slash-less, never `/p/<slug>/…`), both entries
are `{layout:{sections}, content, title}` with `theme` omitted (the root theme cascades), and
both get the **DUAL PIN**: a full `content[sid] = {id, layout, elements}` for every id in
`layout.sections`. A missing `layout` is a SILENT vanish
(`LandingPagePublishedRenderer.tsx:106-121` → `return null`), not an error.

**⚠️ The two ownership tests are NOT symmetric, and the asymmetry is the point.** A user
cannot author a `cmscollectionitem` section at all, so detail-page ownership is purely
structural. But a user CAN put a `cmscollection` block on their own subpage via "Add to page"
— so if listing ownership were also "every section has the `cmscollection` type prefix", the
first `listingPage: false` would **delete that user's page**. Hence
`cmsListingSectionId`/`isCmsListingSectionId` and the `listing` marker segment
(`sectionKeys.ts`); user placements are `cmscollection-<uuid>` and a uuid can never begin
with `listing-`. Pinned by "never prunes a USER subpage that merely CONTAINS a placed
collection block" in `materializePublish.test.ts`.

**Both families are DECOUPLED from placement** (founder ruling, phase 8B). Discovery is
`tokenId`-keyed — `loadCmsBundlesForToken(tokenId)` reads *every* collection of the project —
so a collection with a toggle on emits its pages whether or not its block sits on any page.
The modal's "CREATES THESE PAGES" tiles promise those pages the moment the toggle flips;
coupling them to placement made that promise fail **silently**. This retro-fixes `detailPages`
too, which had been coupled since phase 4. Placement still drives INLINE rendering exactly as
before: `materializeCmsContent` rewrites only sections actually present in the payload.

**What this cost, and what replaced it.** Phase 3 gave the materializer a **zero-query fast
path** (no cms sections in the payload ⇒ no queries at all) as an explicit blast-radius
mitigation on the highest-risk route in the codebase. Decoupling necessarily trades it for
**one indexed query per publish** (`where: {tokenId}`, covered by `@@index([tokenId, order])`,
explicit `select`, single round trip, run strictly AFTER `assertProjectOwner`). The guarantee
that stands in its place — and the thing to protect from here on — is **byte-identity**:

- a project with **zero collections** is byte-identical after materialization, whole payload
  and `subpages` included;
- a project whose collections all have **both toggles off** is byte-identical too (absent a
  placed block, which legitimately gets its model written).

Both hold structurally, because with an empty desired set the reconcilers only prune entries
they can PROVE they authored and never create `content.subpages`. Both are pinned by explicit
tests in `materializePublish.test.ts` ("the zero-query fast path is replaced by byte-identity").
Note the corollary: the **pruning surface is now wider** — the reconcilers run on payloads they
previously never touched — which is exactly why the listing marker segment above is
load-bearing rather than merely tidy.

Collisions with a real page throw `CmsPathCollisionError` → 409, and
`assertNoCmsPathCollisions` runs BOTH families' checks before EITHER reconciler mutates.

### The fan-out cap (the brake decoupling removed)

Placement used to be an **accidental brake** on detail-page fan-out: an unplaced collection
emitted nothing. Decoupling made fan-out both **unconditional and unbounded** — and publish
renders one blob **and** writes one KV route **per item, serially, inside a single serverless
request**. A few-hundred-item collection therefore doesn't get slow, it exhausts the function
timeout and dies as an **opaque timeout** on the highest-blast-radius route in the codebase.

So fan-out is capped by `assertCmsFanOutWithinLimit`, which runs **before** the collision guard
and before anything mutates. There are **TWO caps with two different jobs**, and only one of
them is the actual guard:

| Constant | Job | Over it → |
|---|---|---|
| `MAX_CMS_DETAIL_PAGES_TOTAL` (100) | **THE GUARD.** Total detail pages across **ALL** collections in one publish. | `CmsTotalFanOutLimitError` → 409 naming the **total**, the limit and the remedy |
| `MAX_CMS_DETAIL_PAGES_PER_COLLECTION` (100) | **The better error message.** Names the culprit when ONE collection is oversized. Checked **first** for that reason. | `CmsFanOutLimitError` → 409 naming the **collection**, its item count and the limit |

**Why a per-collection cap alone is not a guard** (this was the original design and it was
wrong): the timeout is a property of the **whole request**, so ten collections of 100 items
each are ten individually *legal* collections that still fan out to 1000 pages and time out
exactly as if there were no cap at all. Only a total can bound the request. The per-collection
cap is kept purely for message quality and is `<=` the total by construction, so it can never
permit something the total forbids. Pinned by the gate "throws when the TOTAL exceeds the cap
even though EVERY collection is under the per-collection cap" in `materializePublish.test.ts`.

The route narrows on the three error classes by explicit `instanceof` — **no shared base
class**, so a future error type can't silently enrol itself into a 409; DB failures still fall
through to the fail-closed 500.

**⚠️ Both numbers are arithmetic estimates, not measurements.** They come from an assumed
~100-300ms per page (static render + blob upload + KV write, serial) against roughly half a 60s
serverless budget — never timed against a real seeded collection. **Owed before beta:** one
timing run (seed a collection at the cap, publish, measure) with the **measured** per-page cost
written back into the constants' comments, so the next person tunes from data instead of
re-deriving the guess.

Two deliberate non-choices:

- **No silent truncation to the first N.** A half-published collection is worse than a refused
  one — the user gets a live page with items missing and no signal at all.
- **Counted on ITEMS, not on emitted pages.** They differ only for slug-less items (which emit
  no page), so counting items trips slightly early rather than late, and keeps the message
  ("has N items") true against what the collection editor shows. Applies to both caps;
  `detailPages`-off collections count toward neither.

This is a **v1 safety valve, not a product decision about collection size.** The real fix is
batched or async fan-out; that's a later track. Until then these two constants are the one
place to raise or retire the limits.

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

## ⚠️ Two fields exist ON PURPOSE with no reader — do not "wire them up", do not delete them

Both come from the **2026-07-20 spec amendment** (founder-confirmed rulings). They look
like dead code to a grep and to a linter. They are not.

| Field | State | WHY it is unread — and what changing it would require |
|---|---|---|
| `Collection.purposes` (`['offer'\|'proof'\|'price']`) | **Stored + validated + returned by the API. READ BY NOTHING.** | Marks what the collection is FOR. Rendering it would mean *per-purpose* renderers (e.g. case studies as a proof band), but v1 ships **ONE shared block that renders identically on every template** (plan Deviation #1). Founder ruling: "store it, unread for now." It is forward-compat, **not a delivered capability** — do not branch any render or materialization path on it without a spec change lifting Deviation #1, and do not present it to users as something that changes output. **Phase 8B added a schema-builder control for it** — that is deliberate (the greyed-placeholder rule needs a destination and per-purpose renderers are not one), and it ships with copy saying it does not change how the collection looks yet. Deleting that copy without shipping the renderers turns a truthful control into a lie. |
| `CollectionItem.featuredOnHome` | **Column + API field only. NO UI control, no read path, no promotion logic.** | The home-promotion machinery (`materializeHomeLineup` / `…Gallery` / `…Teasers` in `collectionHelpers.ts`) is **products + techpremium hardcoded** and explicitly spec §Out — there is no engine-agnostic home lineup to promote INTO. A checkbox promoting nothing is a fake affordance, and the greyed-placeholder rule presupposes the destination exists; here it does not. The column is reserved so a later feature needn't migrate a populated table. **Not** covered by Spec 2 `home-summary-links` (that promotes PAGES, not items). Do NOT touch the dormant `materializeHome*` helpers to "hook this up". |

Deleting either as unused re-opens a migration on a populated table; wiring either up ships
behaviour the spec explicitly deferred. Leave both alone absent a new ruling.

## Other pinned decisions

- **Image values are objects** — `{url, assetId?}`, never bare URL strings. Renderers read
  `.url`.
- **The CMS has ONE entry point: the left rail's `CMS` tab** (`LeftPanel.tsx` → `CmsPanel`).
  Phase 6 also mounted a "Collections" button in `GlobalAppHeader` on the false premise that
  no rail existed; phase 8B deleted it (founder ruling). Do not add a second entry — a
  greyed "coming soon" tab beside a working button is worse than either alone.
  `lessgo:manage-collections` now has TWO listeners by necessity: LeftPanel (switches to the
  tab, since an unmounted panel cannot hear its own cue) and CmsPanel (targets the
  collection). Both are load-bearing.
- **Schema edits are non-destructive**: removing a field orphans its key in item `values`;
  reads ignore unknown keys, writes preserve them. No destructive rewrite of items.
- **Slug output contract**: `slugifyName`/`uniqueSlug` always return a value matching
  `SlugSchema` (`^[a-z0-9]+(?:-[a-z0-9]+)*$`); slug uniqueness itself is enforced at WRITE
  time in the routes (`@@unique([tokenId, slug])`, `@@unique([collectionId, slug])`).

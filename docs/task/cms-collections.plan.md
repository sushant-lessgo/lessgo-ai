# cms-collections — implementation plan (rev 4, final)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\cms-collections`
- **Branch:** `feature/cms-collections`
- **Tier:** full (per-phase plan-review + impl-review)
- **Storage decision (locked, revised):** new Prisma tables `Collection` / `CollectionGroup` / `CollectionItem`, keyed by BOTH `projectId` (relation → Project, `onDelete: Cascade`) and `tokenId` (route key) — copying the `MediaAsset` shape (`schema.prisma:285-313`) so project delete (live since dashboard S2) never orphans rows. Item values = JSON validated by a closed 9-field-type Zod schema in `src/lib/schemas/collection.schema.ts`, enforced at the NEW `/api/collections/*` routes (never bolted onto `DraftSaveSchema`). **Placement rides the section itself:** a placed `cmscollection` section stores `collectionId` (+ `layoutHint`) in its own `content[sectionId].elements` — AND the section's layout NAME in `content[sectionId].layout` (the published renderer's ONLY layout source; see the phase-3 dual pin) — persisted `content` travels wholesale through load (`applySnapshot` assigns `content` in one shot, `persistenceActions.ts:123` — it does NOT whitelist keys; the wholesale assignment is exactly why placement survives), is partialized for autosave, and ships in the publish payload. **There is NO `cmsPlacements` store key, NO `applySnapshot`/`partialize` edit, NO new persisted slice.** Publish materializes Collection data **server-side in `/api/publish`** from the tables — behind a NEW result-checked `assertProjectOwner(userId, tokenId, {action:'publish', allowMissing:true})` gate that **phase 3 ADDS** (the route today has NO owner check on the body `tokenId`: `verifyProjectAccess` is imported at `route.ts:9` but never called, and the only owner comparison, `existing.userId !== userId` at :208, runs ~150 lines after our insertion point and only when the target slug already exists — see phase 3 step 1). Do NOT extend the closed `CollectionKey` union in `src/modules/collections/registry.ts` — the new core lives alongside it in `src/modules/cms/`.

## Overview

Build a user-authored, engine- and template-agnostic CMS: the user names a Collection, composes its schema from the closed set of 9 field types (+ ≤3 roles: title/cover/primaryLink), optionally groups items, and fills items by hand — zero AI. Rendering keys off field TYPE (closed), delivered as a **shared block** (`sharedBlocks/` registries) that renders identically on every template; dual-renderer parity is guaranteed at BOTH layers: markup via the proven `.core.tsx` + injected-primitives pattern, and the data feed via ONE shaping module (`toRenderModel.ts`) consumed by editor and publish alike. Detail pages ride the existing `pathSlug`-generic publish chain, materialized server-side as the sole authority (no editor page entries). 8 phases: data core → render trio → placement+publish → detail pages → UI primitives → schema builder → item editor+groups → generic CMS board.

## Spec deviations (explicit — v1 rulings, not omissions)

1. **One shared renderer, not one per template.** Spec Phase 2 says "one Collection renderer per template" and "group layout = the template's choice." v1 ships ONE shared block (`sharedBlocks/registry.ts` contract: "renders identically on EVERY template"), stacked-groups-only. Per-template skins + layout choice (tabs/accordion/filter) are a follow-on; `layoutHint` reserves the seam. Rationale: shared block resolves BEFORE template dispatch, so zero per-template code, zero `templateMeta` conformance risk (declaring a shared-block capability in `templateMeta` reds conformance group (b) — `templateConformance.ts:115-130` resolves only through the template's OWN resolver; atelier's own comment documents the trap at `templateMeta.ts:215-217`).
2. **No template capability, no shortlisting.** Because the shared block renders on every template, capability gating is moot in v1: NO new `CapabilityId` (closed array in `src/types/brief.ts:36-71` stays untouched), NO `templateMeta.ts` edit, `fit.ts`/`requiredCapabilitiesFromBrief` untouched — the spec's "only capable templates are offered/shortlisted" is consciously dropped for v1. New shared-block keys map to `null` in `sharedBlocks/capabilities.ts` (the `followstrip: null` precedent). CMS entry is available on all templates.
3. **Detail pages are not previewable in the editor (v1).** The publish materializer is the SOLE authority for item subpages; no store page entries are created (avoids touching `pageActions.ts`, naayom's LIVE products path, and `PageSwitcher.tsx:151` filters `collectionItem` rows out anyway). Editor-side authoring surface = the Item editor; detail pages are seen on the published URL. Deviation from "wired into PageSwitcher plumbing" — recorded, revisit post-v1.
4. **Sanitizer-survival invariant (corrected rationale).** `sanitizeContentForPublish` (`src/modules/sections/layoutElementSchema.ts:429`) does NOT strip unknown keys — non-schema element keys are preserved (:500-509), so a v2 layout schema would not strip `collectionId` per se. The invariant still stands, for two better reasons: (a) the v2 whitelist/required-defaults machinery is built for flat string copy elements — routing the cms section's structured payload through it invites default-injection and shape mangling; (b) the schema-INDEPENDENT `coercePublishValue` pass (:380-397, applied to every section via `coerceSectionElements` :402-407) already rewrites values regardless of schema — the pinned render-model shape below exists to survive it. **Invariant: never register a v2 layout schema for `cmscollection`/`cmscollectionitem`.** Stated in `src/modules/cms/README.md`; the BINDING protection is the byte-identical round-trip test (phase 3).

## Pinned render-model shape — coercion-proof (MUST hold everywhere)

`coercePublishValue` (`layoutElementSchema.ts:380-397`) runs over every element value of every section right after the publish insertion point and silently rewrites two shapes a naive type-driven model would use. These rules are load-bearing; the phase-3 byte-identical round-trip test enforces them:

1. **No object anywhere in persisted/materialized section content may carry BOTH a string `content` key and a string `type` key** — :386-388 collapses it to the bare `content` string. The render model therefore uses **`{fieldType, value}`** per field, never `{type, content}`.
2. **Field ids (the keys of item `values` and of materialized per-item maps) must be non-numeric** — :389-394. **CORRECTED (phase-2 impl-review nit #3 — the earlier wording understated this):** the real predicate is `charKeys.length > 0 && charKeys.every(k => typeof val[k] === 'string')`, i.e. **ANY ONE** numeric key whose value is a string collapses the WHOLE object into the concatenation of *only* its numeric keys — every non-numeric sibling key is silently DISCARDED. It is NOT "all keys numeric". A materialized map that is 99% safe field ids plus a single `"0"` key loses everything. Phase 3's materializer and its byte-identical round-trip test must assume this stronger rule; assert `keys.some(numeric) === false`, never the weaker `keys.every(numeric)`. Enforced in `collection.schema.ts`: field `id` must match `^[A-Za-z][A-Za-z0-9_-]*$` (starts with a letter). Group/item ids are Prisma cuids (letter-prefixed) — safe by construction, noted in the schema comment.
3. **Binding test:** the materialized snapshot round-trips through `sanitizeContentForPublish` **byte-identical** (phase 3 test) — not merely "placement elements survive."

## Progress log

```
phase 1 data core (tables + schema + routes): done (1A 3a4a077a, 1B 66d4518f, impl-review loops 0 → ship)
    ↳ schema human gate PASSED (founder go). Migration 20260720000717_cms_collections applied to dev.
    ↳ Live DB constraint spot-check PASSED (orchestrator, not just schema-text asserted):
      both @@uniques → P2002; group delete → item survives with groupId=null (SetNull);
      project delete → cascades collections/groups/items to 0. Closes impl-review nit #8.
    ↳ Carry into phase 7: item `values` PATCH MERGES (null = delete sentinel); a field
      cannot be cleared by omission — the item editor must send explicit null, not omit.
    ↳ Carry into any later phase touching src/app/api/collections/: extract the 5 duplicated
      gate() copies into a shared helper (impl-review nit #5 — drift risk on a security check).
    ↳ Deliberate omission: src/lib/schemas/index.ts NOT edited (it is an LLM-structured-output
      barrel; brief/media/workLibrary aren't in it either). Plan Files-touched delta, not creep.
phase 2 render trio + shared-block registries + parity: done (3f08b57c + hardening b9902e85, impl-review loops 0 → ship)
    ↳ Predicates isSafeURL/isSafePublishedUrl MOVED to pure src/lib/safeUrl.ts (zero imports);
      reviewer verified both byte-identical to originals; headTags + publishSanitizer re-export.
      Import closure of BOTH twins traced clean (no 'use client'/jsdom/dompurify/publishSanitizer).
    ↳ PARITY COMPARATOR WAS A FALSE GREEN — old skeleton() compared only tag/class/data-cms-*/text,
      so a published twin dropping whiteSpace:pre-wrap (text_long newlines collapse, published-only)
      or dropping alt was byte-identical. Widened to class/style/src/alt/href + permanent 3-test
      meta-guard proving the comparator bites + 4 anti-vacuity guards. THE lesson of this phase.
    ↳ Dispatch-resolution assertions added (mis-cased key in BOTH registries passes key-sync but
      never resolves at runtime — key-sync alone cannot see it).
    ↳ CROSS-PHASE CONTRACT for phase 3: materializer MUST write the model under the element key
      CMS_MODEL_ELEMENT_KEY = 'cmsModel' (toRenderModel.ts:53-59). Wrong key = silent "No items yet",
      no error. Documented in src/modules/cms/README.md.
    ↳ Coercion rule 2 CORRECTED in the pinned section above (ANY numeric key collapses + discards
      non-numeric siblings — NOT "all keys numeric"). Test predicate now keys.some(numeric)===false.
    ↳ Open (deferred, not blocking): the 2 primitive factories are still hand-duplicated — the gate
      now DETECTS divergence but does not PREVENT it. aria-label still excluded from comparison.
phase 3 placement + publish materialization: done (df26d10a, impl-review loops 1 → ship) — ⏸ AWAITING FOUNDER PUBLISH GATE
    ↳ /api/publish now has its FIRST ownership check (assertProjectOwner, result-checked,
      allowMissing:true). Route previously imported verifyProjectAccess and never called it.
      NEW failure mode: Clerk-authed caller with no User row → 404 (security.ts:75-77). Can only
      bite someone publishing a project they don't own (Project.userId is an FK to User.id).
    ↳ BLOCKING BUG FOUND IN REVIEW (loop 1) — publish-only corruption, empirically probed:
      sanitizeContentHtml (route.ts:133, the SECOND chokepoint the plan never pinned) rewrites any
      string whose KEY ends in href|url|link|slug → '#' via isUrlContentKey. roles.primaryLink (a
      FIELD ID) and collectionSlug were clobbered → data-cms-collection="#" and the card CTA slot
      EMPTY on published while populated in the editor. Fixed by rename, NOT by exempting cmsModel
      (which would have lost HTML escaping over user-authored collection/group names):
        roles.primaryLink → primaryCta · collectionSlug → collectionRef · item slug → itemRef
      Stored CollectionRoles.primaryLink (Zod/DB) KEEPS its name — never enters elements.
      ⚠️ NAMING CONSTRAINT IS PERMANENT: no key in the render model may end in href/url/link/slug
      except the genuine {url} value keys. Guarded by a meta-guard importing the REAL
      isUrlContentKey (tracks the rule, cannot drift) + binding gate now runs BOTH chokepoints in
      route order. Revert-proof: reverting one rename → 4 failures incl. the parity skeleton.
    ↳ GENERAL TRAP (not CMS-specific, nothing outside src/modules/cms audited): sanitizeItemObject
      corrupts ANY structured element payload this way. Flat string-copy elements are unaffected,
      which is why no existing block hit it. Candidate for the code-quality backlog.
    ↳ Materializer: zero-query fast path when no cms sections; filters on section-type prefix so it
      is STRUCTURALLY incapable of touching works/products (the works-authority gate, restated);
      preserves content[sid].layout + id; FAIL-CLOSED on DB error (500, not a silent empty block).
    ↳ Dual pin honestly scoped: the materializer's layout default is the REAL guard; the store pin
      is belt-and-braces (map-only would publish an empty block, not vanish). cmsActions.test.ts
      asserts both halves anyway.
    ↳ refreshCmsData has ZERO callers — nothing populates cmsData yet, so a placed section shows the
      skeleton until a later phase wires it. Expected (no placement UI until phase 6).
    ↳ Bundle hygiene: constants moved to prisma-free src/modules/cms/sectionKeys.ts (materializePublish
      RE-EXPORTS them — load-bearing, two test files import from there). Measured win ~280 bytes, NOT
      the ~73kB the review estimated (webpack resolves @prisma/client via its browser field to a Proxy
      stub). Kept on the architectural argument, not the number.
    ↳ tsc baseline is now FULLY clean (the old founder.jpg TS2307 noise no longer reproduces).
phase 4 detail pages + slugs: done (a69c42f2, impl-review loops 0 → ship) — ⏸ AWAITING FOUNDER DETAIL-PAGES GATE
    ↳ Server-side fan-out is SOLE authority; pageActions.ts NEVER opened → naayom's live products
      path untouched BY CONSTRUCTION (confirmed by diff scope, not by claim).
    ↳ DEPTH FINDING (the phase's crux, independently re-verified): toDetailModel hoists the item out
      of groups[].items[] onto a bare `item` prop, so on a DETAIL page itemRef sits at
      elements→cmsItem→item→itemRef — INSIDE sanitizeItemObject's one-level budget — where on the
      LISTING it was one level too deep. Same key, opposite outcome. collectionRef walked on both.
      ⇒ The phase-3 renames (primaryCta/collectionRef/itemRef) went from defensive to LOAD-BEARING.
      Had we not renamed itemRef proactively in phase 3, every detail page's links would ship '#'.
      Depth table now in src/modules/cms/README.md (element key is `cmsItem`, NOT `cmsDetail`).
    ↳ Collision guard: checks BEFORE any mutation (payload byte-identical after throw), maps to 409
      via a NARROW instanceof catch; DB errors keep fail-closed 500. Test uses importOriginal so the
      thrown class IS the real one — a hand-built fake would pass a catch-all and fail the correct
      narrow catch (inverted test). Client already surfaces result.error → user sees the colliding path.
    ↳ Single feed intact: toDetailModel returns model.roles and CmsItemRender BY REFERENCE (asserted
      with toBe) — no second shaping path.

    CARRIES (real, none blocking v1 — do not lose these):
    ↳ PHASE 7 OWES: `slugLocked` is an UNGUARDED pin. Nothing reads it until the item editor; the
      old test claiming to guard it was INERT (removing the flag left it passing) and has been made
      honest. If phase 7 ships an editor that ignores the flag, NOTHING will fail. Phase 7 must add
      the guarding test.
    ↳ PHASE 7 OWES: item CREATE has no top-level-slug shadow guard (collection POST/PATCH and item
      PATCH do). A created item can still mint a colliding path — caught at publish as the 409.
    ↳ A collection slugged `blog` SILENTLY loses its detail pages (renderPublishedExport.ts:271 skips
      isReservedBlogPath with only a console.warn; /blog isn't in content.pages so the shadow guard
      can't see it). Silent, not corrupting.
    ↳ A collection slugged with a locale code (e.g. `nl`) fails publish with a MISLEADING message
      telling the user to rename a page that doesn't exist (localeSlugCollision.ts:35-41 reads the
      first path segment). Only reachable on i18n projects (deferred track).
    ↳ SCALE: fan-out is unbounded — one blob render + one KV route per item, SERIALLY, on every
      publish (renderPublishedExport.ts:265). No item cap anywhere. Fine for pilot collections;
      needs a ceiling before anyone points this at a few hundred items.
    ↳ Vitest parity cannot reach: chrome injection into detail subpages, theme cascade, per-subpage
      metadata/blob path. Those are e2e-only (and e2e needs dev server + Clerk + Blob/KV).
phase 5 authoring UI primitives: pending
phase 6 schema builder + CMS entry point: pending
phase 7 item editor + group management: pending
phase 8 generic CMS board + docs: pending
```

---

## Phase 1 — CMS data core (tables + Zod schema + token routes)

Net-new data layer. No UI, no rendering. Nothing in this phase touches any live path.

> **Split decision (recorded):** reviewer offered splitting schema+migration from routes. Kept as ONE phase: the routes are mechanical CRUD over the just-defined Zod contract, and the schema human gate below already sits BEFORE the migration is committed — a split would add a review round without reducing risk. The implementer must sequence: models+Zod → gate → migration commit → routes.

### Steps
1. **Prisma models** in `prisma/schema.prisma` — copy the `MediaAsset` FK shape (`schema.prisma:285-313`):
   - `Collection`: `id`, `projectId` (relation → Project, **`onDelete: Cascade`**, indexed), `tokenId` (route key, indexed), `name`, `slug`, `fieldSchema Json` (ordered field defs), `roles Json` (`{title?, cover?, primaryLink?}` → field ids), `detailPages Boolean @default(false)`, `layoutHint String?`, `order Int`, timestamps. `@@unique([tokenId, slug])`.
   - `CollectionGroup`: `id`, `collectionId` (FK, cascade delete), `name`, `order Int`.
   - `CollectionItem`: `id`, `collectionId` (FK, cascade delete), `groupId String?` (FK, `onDelete: SetNull` → ungrouped), `slug`, `values Json`, `order Int`, `slugLocked Boolean @default(false)`, timestamps. `@@unique([collectionId, slug])`.
   - Migration via `npx prisma migrate dev --name cms_collections` (NEVER `db push`) — committed only after the human gate below.
2. **Zod contract** — `src/lib/schemas/collection.schema.ts` (model: `brief.schema.ts`):
   - `FieldTypeSchema` = closed enum of the 9: `image | gallery | video | audio | text_short | text_long | link | date | tags`.
   - `FieldDefSchema` = `{id, name, type}`; **`id` regex `^[A-Za-z][A-Za-z0-9_-]*$`** (coercion-proof rule 2 above — numeric-string ids get mangled by `coercePublishValue`); `FieldSchemaArraySchema` with unique field ids.
   - Per-type **value** schemas (discriminated on type): image `{url, assetId?}`, gallery `{url, assetId?}[]`, video/audio `{kind:'upload'|'link', url}`, text_short `string`, text_long `string`, link `{url, label}`, date ISO `string`, tags `string[]`. ALL values optional — item `values` validated as partial record keyed by field id, each value checked against its field's type. (Note the discriminator key in stored values, if any, is `fieldType` — never `type` alongside a `content` string; coercion-proof rule 1.)
   - Roles schema: title → only `text_short` fields, cover → only `image|gallery`, primaryLink → only `link` (validated cross-field).
   - **Decision recorded here (TRAP 1):** CMS image values store `{url, assetId?}` objects, NOT bare URL strings. New data, no legacy readers — richer shape is free now, saves a migration later; renderers consume `.url`.
3. **Slug utility** — `src/modules/cms/slug.ts`: `slugifyName()` (SEO-friendly: lowercase, ascii, hyphens, trimmed), `uniqueSlug(base, taken[])` (numeric suffix clamp). Pure module (used client + server).
4. **Types + module README** — `src/modules/cms/types.ts` (TS types inferred from Zod), `src/modules/cms/README.md` (agent-oriented: purpose, invariants — closed 9, roles, "alongside NOT extending `CollectionKey`", the layout-schema invariant from Deviations #4 + the pinned coercion-proof shape rules, works-authority boundary).
5. **API routes** — all: Clerk auth + result-checked `assertProjectOwner`. **Opts pinned once, consistent across all five collection route files** (actual signature `assertProjectOwner(clerkId, tokenId, opts)` at `src/lib/security.ts:57-61` — it returns a RESULT object `{ok:true,…} | {ok:false,status,error}`, it does NOT throw and does NOT 403 by itself):
   ```ts
   const owner = await assertProjectOwner(userId, tokenId, { action: '<route action>', allowMissing: false });
   if (!owner.ok) return createSecureResponse({ error: owner.error }, owner.status);
   ```
   Token-scoped reads/writes → `allowMissing: false`, NO `claimIfOrphan`. (The phase-3 publish call is the same shape and differs ONLY in `allowMissing: true`.) All bodies parsed with the new Zod schemas; slug uniqueness enforced here at WRITE time — see phase 4 risk.
   - `src/app/api/collections/route.ts` — GET list by token, POST create (derives slug, ensures unique per token; resolves + stores `projectId` server-side from the token).
   - `src/app/api/collections/[collectionId]/route.ts` — GET (with groups+items), PATCH (name/schema/roles/detailPages/layoutHint/slug — slug edit re-checked for uniqueness), DELETE.
   - `src/app/api/collections/[collectionId]/groups/route.ts` — POST create, PATCH reorder/rename, DELETE (items → ungrouped).
   - `src/app/api/collections/[collectionId]/items/route.ts` — POST create (item slug derived from title-role value; unique per collection), PATCH bulk reorder / group reassignment.
   - `src/app/api/collections/[collectionId]/items/[itemId]/route.ts` — GET, PATCH (values / slug w/ `slugLocked` set on manual edit / group), DELETE.
   - **Schema-edit semantics:** removing a field from `fieldSchema` orphans that key in item `values`; reads ignore unknown keys (defensive-defaults pattern) — no destructive rewrite of items on schema edit.
6. **Tests** (vitest):
   - `src/lib/schemas/collection.schema.test.ts` — all 9 type value shapes accept/reject, roles type-filtering, all-optional values, unknown-field-key tolerance, **numeric/illegal field id rejected by the regex**.
   - `src/modules/cms/slug.test.ts` — slugify + collision clamp.
   - `src/app/api/collections/collections.authz.test.ts` — **mandatory regression:** wrong-owner request → **403 status AND error body asserted** on every route; slug-collision POST → 409/clamped.

### Files touched
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_cms_collections/migration.sql` (generated)
- `src/lib/schemas/collection.schema.ts` (new)
- `src/lib/schemas/collection.schema.test.ts` (new)
- `src/lib/schemas/index.ts` (export)
- `src/modules/cms/types.ts` (new)
- `src/modules/cms/slug.ts` (new)
- `src/modules/cms/slug.test.ts` (new)
- `src/modules/cms/README.md` (new)
- `src/app/api/collections/route.ts` (new)
- `src/app/api/collections/[collectionId]/route.ts` (new)
- `src/app/api/collections/[collectionId]/groups/route.ts` (new)
- `src/app/api/collections/[collectionId]/items/route.ts` (new)
- `src/app/api/collections/[collectionId]/items/[itemId]/route.ts` (new)
- `src/app/api/collections/collections.authz.test.ts` (new)

### Verification
- `npx prisma migrate dev` applies clean; `npx prisma generate` OK.
- `npx tsc --noEmit` green; `npm run test:run` green (new tests included).
- Manual curl/thunder: create collection → group → item round-trip on a dev token; foreign-token request rejected; deleting the project cascades collections (spot-check).

### 🔶 HUMAN GATE
**Schema/migration gate:** founder signs off the Prisma model shape BEFORE the migration is committed. Show the three models, the dual `projectId`+`tokenId` keying, and the `{url, assetId?}` image-value decision.

---

## Phase 2 — Render trio + shared-block registries + parity

The type-driven renderer trio, the single data-shaping module, and shared-block registration. **No publish edits, no store edits — this phase is renderable-in-isolation** (verified by tests; wired into the editor in phase 3).

### Steps
1. **Primitives contract** — `src/modules/cms/render/primitives.ts`: TYPES ONLY, define `CmsPrimitives` mirroring the `WorkPrimitives` shape (`Txt, Img, Link, List`; add what the walker needs). Do NOT import from `src/modules/skeletons/work/blocks/primitives.ts` bodies — copy the shape, keep cms self-contained.
2. **Single data feed (parity at the DATA layer)** — `src/modules/cms/render/toRenderModel.ts` (new, plain module — **client-safe by contract**): `toRenderModel({collection, groups, items})` → the ONE render model both renderers consume (ordered fields per item resolved by type, roles resolved with fallbacks, empty values dropped, groups ordered). Model obeys the **pinned coercion-proof shape**: `{fieldType, value}` per field, never a `{type, content}` string pair; maps keyed by (letter-prefixed) field ids only.
   - **URL sanitization lives here** — every URL-bearing value is checked and hostile schemes dropped, because nested shapes are OUT of reach of the publish walker (`sanitizeItemObject`, `publishSanitizer.ts:294-308`, recurses exactly one level). **Two predicates, pinned per field type:** the NARROW `isSafeURL` (http(s) + root-relative only, `headTags.ts:48-56`) for `image`/`gallery` src; the WIDE `isSafePublishedUrl` (`= isSafeURL || mailto: || tel: || #`, `publishSanitizer.ts:149-159` — commented there as "the three schemes published pages legitimately need but isSafeURL rejects") for `link`/`video`/`audio` values. The narrow predicate alone would silently delete "Email me" (`mailto:`) / "Call us" (`tel:`) / `#anchor` CTA links with no user-visible reason — spec field type #7 (link) is a CTA button.
   - **Boundary law (BLOCKING in review): `toRenderModel.ts` must NOT import `src/lib/publishSanitizer.ts`** — that file is server-only and imports `jsdom` + `dompurify` (:1-6, :39-40); the phase-3 editor adapter is `'use client'` and calls `toRenderModel()`, so that import would drag jsdom into the client bundle (the published/client-boundary trap). Chosen mechanism — **single-sourced pure helper**: new `src/lib/safeUrl.ts` (pure, ZERO imports) housing **BOTH** `isSafeURL` (MOVED from `src/lib/staticExport/headTags.ts:48` — that file has zero imports today) **AND** `isSafePublishedUrl` (MOVED from `src/lib/publishSanitizer.ts:149-159`). `headTags.ts` re-points to import/re-export `isSafeURL` (all 4 existing callers import from `./headTags`, so the re-export keeps them green); `publishSanitizer.ts` re-points its `:42` usage and replaces its `:149-159` local definition with the `safeUrl.ts` import — ONE implementation of each predicate, no fork. `toRenderModel.ts` imports from `src/lib/safeUrl.ts` ONLY; the `publishSanitizer.ts` edit is inside that server-only file and does not weaken the boundary law. Parity survives because sanitization is INSIDE the single shaping function → editor and publish both consume the already-sanitized model.
   - Editor adapter (phase 3) and publish materializer (phase 3) BOTH call this function — the two feeds cannot diverge because there is only one shaping path.
3. **Core walker** — `src/modules/cms/render/CollectionSection.core.tsx`: plain server-safe module `({model, E, sectionId})` consuming the render model only. Emits by TYPE (image/gallery → `E.Img`, text_short → `E.Txt`, text_long → prose, link → button, date/tags → spans/pills); roles drive card composition (cover top, title prominent, primaryLink CTA); role fallback = first-short-text / first-image / first-link by order; empty values skipped. Group layout v1 = stacked groups with name headers (Deviations #1). `data-surface` attribute for tones.
4. **Edit + published pair**:
   - `src/modules/cms/render/CollectionSection.tsx` — `'use client'`, edit primitives, a "Manage items" `manageSlot` affordance (until phase 6 wires it: **greyed placeholder button with why-tooltip**). Items NOT inline-contentEditable — authored via CMS UI only; keeps parity trivially true.
   - `src/modules/cms/render/CollectionSection.published.tsx` — flat props, no hooks, plain emitters. Identical layout/CSS to `.tsx`.
   - **Published/client boundary law:** the published file imports ONLY the core + plain modules; never anything `'use client'`.
   - Note: the published renderer's `extractContentFields` (`LandingPagePublishedRenderer.tsx:33-38`) is a plain spread of `elements` into props — the structured payload arrives intact as FLAT props; do NOT invent a nested `data` prop.
5. **Shared-block registration** — the REAL maps (not `componentRegistry.*`, which only call `resolveSharedBlock`):
   - `src/modules/generatedLanding/sharedBlocks/registry.ts` — add `cmscollection: CollectionSection` (edit twin; lowercased key per registry contract).
   - `src/modules/generatedLanding/sharedBlocks/registry.published.ts` — add the published twin (firewall: this file never imports edit twins and vice-versa).
   - `src/modules/generatedLanding/sharedBlocks/capabilities.ts` — add `cmscollection: null` (no `CapabilityId` exists and none is added — Deviations #2; the `followstrip: null` precedent).
   - `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts` — update the key-sync test (a) implicitly passes; update exact-contents test (c): add `expect(sharedBlockCapability.cmscollection).toBeNull()`; `sharedBlockCapabilities` stays `toHaveLength(2)`.
   - `componentRegistry.ts` / `componentRegistry.published.ts` need NO edit (they dispatch via `resolveSharedBlock` before template dispatch) — deliberately NOT in Files touched.
6. **Tests — the BINDING parity gate (vitest, not e2e)**:
   - `src/modules/cms/render/parity.test.tsx` — build the model via `toRenderModel()` from a RAW fixture (collection+groups+items, all 9 types, roles set and unset), then render `.tsx` (edit chrome stripped/stubbed) AND `.published.tsx` from that same model output; assert identical markup skeleton. Driving both renderers from the real shaping function (not a hand-written model fixture) is the point — it catches feed divergence, not just markup divergence.
   - `src/modules/cms/render/toRenderModel.test.ts` — role fallbacks, empty-value drops, group ordering; **`javascript:`-URL fixture in a nested gallery value → sanitized out of the model** (proves the gate bites where the publish walker can't reach); **`mailto:` + `tel:` link-value fixtures SURVIVE the model** (wide predicate on link/video/audio — the narrow-predicate silent-delete regression); **deep-walk assertion: no object in the model carries both string `content` + string `type` keys** (coercion-proof rule 1).

### Files touched
- `src/modules/cms/render/primitives.ts` (new)
- `src/modules/cms/render/toRenderModel.ts` (new)
- `src/modules/cms/render/toRenderModel.test.ts` (new)
- `src/modules/cms/render/CollectionSection.core.tsx` (new)
- `src/modules/cms/render/CollectionSection.tsx` (new)
- `src/modules/cms/render/CollectionSection.published.tsx` (new)
- `src/modules/cms/render/parity.test.tsx` (new)
- `src/lib/safeUrl.ts` (new — pure `isSafeURL` + `isSafePublishedUrl`, zero imports)
- `src/lib/staticExport/headTags.ts` (re-point: import/re-export `isSafeURL` from `safeUrl.ts`, delete local copy)
- `src/lib/publishSanitizer.ts` (re-point: `:42` usage + `:149-159` local `isSafePublishedUrl` → import from `safeUrl.ts`, delete local copy)
- `src/modules/generatedLanding/sharedBlocks/registry.ts`
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts`
- `src/modules/generatedLanding/sharedBlocks/capabilities.ts`
- `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts`

(Rev-4 note: `publishSanitizer.ts` IS now touched — but ONLY the predicate re-point inside that server-only file. Rev-2's forbidden client-side `publishSanitizer` import remains forbidden per step 2's boundary law.)

### Verification
- `npx tsc --noEmit`, `npm run test:run` green — including `capabilities.test.ts` (updated), existing shared-block/dispatch/parity suites untouched-green, and existing `headTags`/staticExport tests AND `publishSanitizer` tests green after the predicate re-points.
- Published CSS check: if the block needs styles outside Tailwind utilities already compiled into `public/published.css`, run full `npm run build` (not bare `next build`) and confirm.

---

## Phase 3 — Placement + publish materialization

Wires the block into editor state and `/api/publish`. **This phase touches the publish route — the highest-blast-radius file in the feature.** Regression tests mandatory.

### Steps
1. **Publish ownership check — ADDED by this phase, it does NOT exist today.** Current facts the implementer must work from (do not assume otherwise): `route.ts:9` imports `verifyProjectAccess` but **never calls it**; the project is fetched by body-supplied `tokenId` at :120-123 with no owner comparison; the ONLY owner check is `existing.userId !== userId` at :208 — ~150 lines after our insertion point and only reached when the target slug already exists. A materializer reading Collection tables by body `tokenId` without a new check = **cross-tenant data leak** (any authenticated user POSTs someone else's `tokenId` and materializes that tenant's private CMS content into their own page). Fix — **pin this EXACT code** (signature: `assertProjectOwner(clerkId, tokenId, opts)` at `src/lib/security.ts:57-61` returns a RESULT object `{ok:true,…} | {ok:false,status,error}` — it does NOT throw and does NOT 403 by itself; discarding the result ships a gate that enforces nothing):
   ```ts
   const owner = await assertProjectOwner(userId, tokenId, { action: 'publish', allowMissing: true });
   if (!owner.ok) return createSecureResponse({ error: owner.error }, owner.status);
   ```
   as its **own explicit step in `/api/publish/route.ts`, immediately BEFORE the materialization call** (i.e. before the :54 insertion point); non-owner → 403 before any Collection table read. **`allowMissing: true` is load-bearing:** `/api/publish` tolerates a missing Project row today (`route.ts:120-123`; `projectId: project?.id || null` at :226) — without it, `security.ts:89` turns those publishes into a NEW 404 (this RESOLVES the former "watch on preview" open risk, see Open risks). NOT a behaviour change for admins (`security.ts:112-121` allows + audit-logs, matching the existing `route.ts:208-216` admin override); the demo token short-circuits (`security.ts:63-65`). This also hardens the pre-existing hole for non-CMS publishes.
2. **Store slice (runtime cache + actions; NOTHING persisted)** — `src/hooks/editStore/cmsActions.ts` (new):
   - Runtime cache `cmsData` (collections/groups/items fetched from `/api/collections` on editor load) — runtime-only state: NOT in `partialize`, NOT exported to `finalContent`. No `persistenceActions.ts` edit exists in this plan (note: `applySnapshot` assigns `content` wholesale, `persistenceActions.ts:123` — placement inside `content[sectionId]` survives load for free).
   - `addCmsSection(collectionId)` / `removeCmsSection(sectionId)`: insert/remove a `cmscollection-<uuid>` section in `state.sections`; **pin the FULL content entry AND the layout map — the DUAL pin:** `content[sectionId] = { id: sectionId, layout: 'SharedCmsCollection', elements: { collectionId, layoutHint? } }` **AND** `sectionLayouts[sectionId] = 'SharedCmsCollection'`. Both, never just the map — this is load-bearing: **the publish payload carries NO `sectionLayouts` map at all** (`usePublishFlow.ts:195-197` sends `content: {layout:{sections,theme}, content, title, seo}`); `LandingPagePublishedRenderer.tsx:106-113` rebuilds layouts EXCLUSIVELY from `content[sectionId]?.layout`, and `:121` is `if (!layout) return null; // Silent fallback`. The editor is forgiving (`LandingPageRenderer.tsx:300,331` = `sectionLayouts[sectionId] || content[sectionId]?.layout`), so pinning only `sectionLayouts` renders fine in the editor and the section silently VANISHES on publish — the asymmetric dual-renderer failure. Follow the shared-block precedent in FULL: `injectGoalSections.ts:122-129` sets `sectionLayouts[sectionId]` AND `content[sectionId] = {id, layout, elements}` (rev 3 had copied only half of it). The layout NAME keys nothing template-side — dispatch keys off the lowercased section TYPE; the name must NEVER gain a `layoutElementSchema` entry, per Deviations #4. **NO `sectionSpacing[sectionId]` entry** (renderer defaults apply — pinned here because shared blocks are generation-seeded today and there is no editor-insertion precedent).
   - Declare new state key + action signatures in `src/types/store/state.ts` (`cmsData`) and `src/types/store/actions.ts` (`addCmsSection`, `removeCmsSection`, cache refresh) — where `navigationConfig`/`legalPages` and the existing action types live.
   - Wire slice + initial `cmsData` into `src/stores/editStore.ts` (state factory only — **no `partialize` change**).
3. **Editor render adapter** — `CollectionSection.tsx` reads `elements.collectionId`, looks up `cmsData`, calls `toRenderModel()` (the SAME function publish uses), renders the core. Missing/stale data → skeleton placeholder.
4. **Publish materialization** — `src/modules/cms/materializePublish.ts` (new, server-only plain module): given the tokenId **already verified by step 1** + the client-sent snapshot, read the tables keyed by that verified tokenId, and replace every `cmscollection` section's content with the `toRenderModel()` output for `elements.collectionId`. **The materializer PRESERVES `content[sid].layout` (and `id`) when it replaces a section's content** — swapping in a bare elements payload would strip the published renderer's only layout source and re-open the silent-vanish path pinned in step 2.
   - **Walk scope (pinned — BOTH containers):** the payload has TWO section containers — the root page (`content.content` + `content.layout.sections`) AND every subpage (`content.subpages[*].content` + `.layout.sections`). The walk covers both; a cms section placed on a subpage (reachable via phase 6 "Add to page" on multi-page projects) must materialize, not publish empty.
   - Insertion point in `src/app/api/publish/route.ts`: **after the step-1 ownership check and BEFORE `sanitizeContentForPublish` at line 54** (so materialized content still flows through both sanitize chokepoints, :54 and `sanitizeContentHtml` :106; URL-bearing nested values are already sanitized inside `toRenderModel` via `safeUrl.ts` because the walker's one-level recursion can't reach them — stored-XSS defense in depth, not either/or). Because it runs before :54, materialized output MUST obey the pinned coercion-proof shape — enforced by the byte-identical test below.
   - **Authority rule enforced in code:** touches ONLY `cmscollection` sections (and, phase 4, cms subpage paths) — structurally incapable of rewriting `works`/`products`/any other section or page (the works-catalog authority gate, `collectionHelpers.ts:97`).
5. **Tests (mandatory regressions — the BINDING publish-parity gate is vitest, not e2e)**:
   - `src/app/api/publish/publish.authz.test.ts` (new) — **authz regression for step 1:** authenticated user B publishing with user A's `tokenId` → assert **status 403 AND the error response body** — NOT only "zero Collection reads", which passes trivially if the result object is discarded and the materializer stubbed; ADDITIONALLY assert no Collection table read / materializer call occurred. Owner publish passes; owner publish with a missing Project row passes (`allowMissing: true` regression).
   - `src/modules/cms/materializePublish.test.ts`:
     - injects into `cmscollection` sections only; a snapshot containing works/products sections + subpages passes through **byte-identical** outside cms sections; empty-tables project = no-op; unknown `collectionId` → section rendered empty, publish not failed.
     - **subpage placement:** a `cmscollection` section inside `content.subpages['/x'].content` gets materialized (walk-scope pin).
     - **byte-identical round-trip (coercion-proof rule 3):** materialize a fixture → run `sanitizeContentForPublish` over the result → assert the materialized cms sections (placement `elements` AND the full data payload) are **byte-identical** — this is what catches `coercePublishValue` mangling `{type, content}` pairs or numeric-keyed maps at publish-only.
     - **materialized-snapshot parity assertion:** take a tables fixture → materialize → render the materialized snapshot through **`LandingPagePublishedRenderer`** (the REAL publish path — NOT the registry component directly: a direct registry render bypasses the layout resolution + silent-null at `LandingPagePublishedRenderer.tsx:106-121` and would sit GREEN while publish drops the section); render the same fixture through the edit path (`cmsData` → `toRenderModel` → edit component); assert identical markup skeleton. At minimum — in ADDITION, never instead — assert `content[sid].layout` is a non-empty string post-materialization for every cms section. **Implementer: do NOT "simplify" this test back to a direct registry-component render.** This is the binding gate for "editor == published" on real feeds.
     - **`javascript:`-URL fixture** (nested gallery + link values) → asserts the hostile URL is absent from the materialized snapshot (proves the sanitize gate bites end-to-end).
   - `e2e/cms-publish.spec.ts` (new) — **opportunistic, NOT the gate** (decision: ONE cms e2e publish file; phase 4 extends it rather than adding a second — the binding assertions are all in vitest): seed collection via API, place section, publish, diff editor vs published DOM. `e2e/publish.spec.ts` tolerates a 500 locally (Blob/KV absent — its own comments, lines 93-100, 202), so this spec inherits that tolerance and is a bonus check on preview/CI-with-secrets only.

### Files touched
- `src/hooks/editStore/cmsActions.ts` (new)
- `src/types/store/state.ts`
- `src/types/store/actions.ts`
- `src/stores/editStore.ts` (state wiring only — NOT `partialize`)
- `src/modules/cms/render/CollectionSection.tsx` (adapter wiring)
- `src/modules/cms/materializePublish.ts` (new)
- `src/modules/cms/materializePublish.test.ts` (new)
- `src/app/api/publish/route.ts` (ownership check + materializer call)
- `src/app/api/publish/publish.authz.test.ts` (new)
- `e2e/cms-publish.spec.ts` (new)

### Verification
- `npx tsc --noEmit`, `npm run test:run` green — **including every pre-existing publish/persistence/collections test untouched-green** (`collectionHelpers.works.test.ts`, `naayomProducts.test.ts`, `homeTeasers.test.ts`, staticExport tests, persistence tests — which this plan no longer edits at all).
- `npm run test:e2e -- cms-publish publish` runs (opportunistic); existing `parity.spec.ts` green. Confirm existing `publish.spec.ts` still passes WITH the new ownership check (it publishes as the owner).
- Manual: dev project with a seeded Books collection renders in editor; publish → live page shows identical block (the section VISIBLE on the published page — the silent-vanish check). Negative manual check: second dev account publishing with the first account's tokenId → 403.

### 🔶 HUMAN GATE
**Publish-path gate:** `/api/publish` is production-critical for every live customer (naayom, Kundius) — and this phase adds a NEW ownership 403 to it. Founder does one real publish of an EXISTING non-CMS project on the branch and eyeballs the live page unchanged, before phase 4 builds on top.

---

## Phase 4 — Detail pages + slugs

`detailPages: on` → each item gets a published page. The publish materializer is the SOLE authority (Deviations #3): server-side fan-out into `content.subpages`, riding the existing `pathSlug`-generic chain (zero publish-chain changes — subpages flatten → blob → KV → `/p/[slug]/[...subpath]` already generic). **`pageActions.ts` is NOT touched** — no store page entries, no `renamePage` wiring; naayom's live products path is untouched by construction. Riskiest correctness point: **slug collisions silently overwrite subpages at publish** (`usePublishFlow.ts:177`) → uniqueness at write time (phase 1 routes) + a publish-side fail-loud guard here.

> **Path convention (pinned — BLOCKING in review):** subpage keys and hrefs are **leading-slash absolute bare paths**: key = `content.subpages['/<collectionSlug>/<itemSlug>']`, card href = `/<collectionSlug>/<itemSlug>`. This matches the existing contract — `subpages[p.pathSlug]` with values like `/contact` (`usePublishFlow.ts:171-183`) — and the ratified href convention (`href="/contact"`, NEVER `/p/<slug>/contact`; `staticExport/__tests__/multipageGoalRef.test.ts:13-15,148-151`). Slash-less keys would mismatch KV route derivation, the locale collision guard (`publish/route.ts:143-146`) and this phase's own collision guard; a slash-less `pathSlug` also fails `isSafeURL` in `publishSanitizer.ts:30-32` → coerced to `'#'`; relative hrefs resolve wrongly under the `/p/<slug>` SSR fallback. Asserted in the materializer tests.

### Steps
1. **Detail renderer trio** — `src/modules/cms/render/CollectionDetail.core.tsx` + `.tsx` + `.published.tsx`: type-driven full-item layout (cover large, title h1, remaining fields in schema order, primaryLink CTA), consuming a per-item model from `toRenderModel` (extend it with a detail-item selector — same single feed, same coercion-proof shape). Registered as shared block `cmscollectionitem` in `sharedBlocks/registry.ts` + `registry.published.ts`, declared `null` in `capabilities.ts`, exact-contents expectations updated in `capabilities.test.ts` (length stays 2 — `null` entries keep the length assertion valid). Same parity + boundary laws as phase 2.
2. **Listing → detail links** — `CollectionSection.core.tsx`: when `detailPages` on, cards link to **`/<collectionSlug>/<itemSlug>`** (leading-slash absolute per the pinned convention; inert in the edit renderer, live on published pages).
3. **Publish fan-out** — extend `src/modules/cms/materializePublish.ts`: for each detailPages-on collection, build authoritative subpage entries under **`content.subpages['/<collectionSlug>/<itemSlug>']`** from the tables (overwriting any stale client-sent copies of cms paths ONLY — same authority scoping). **Subpage entry shape (pinned):** `{ layout: { sections, theme? }, content, title }` — `theme` OPTIONAL (`renderPublishedExport.ts:262-278` falls back to the root theme), `layout.sections` NOT optional. **Every fan-out subpage section gets the SAME dual pin as phase 3:** `content[sid] = { id: sid, layout: '<detail layout name, e.g. SharedCmsCollectionItem>', elements: {…} }` for every id listed in `layout.sections` — subpage layouts are ALSO rebuilt exclusively from `content[sid].layout` at publish; a missing `layout` = the same silent `return null` vanish. (The detail layout name obeys the never-a-`layoutElementSchema` rule, Deviations #4.) **Publish-side collision guard:** computed cms subpage path colliding with an existing non-cms subpage path → fail the publish with a clear error, never silently overwrite. Fan-out runs at the same pinned insertion point (after the phase-3 ownership check, before sanitize :54).
4. **User-editable slug** — item slug edits flow through item PATCH only (`slugLocked: true`; re-materialization never clobbers a locked slug). Surfaced in the item editor (phase 7); until then API-only. No editor-page plumbing.
5. **Uniqueness hardening** — item/collection slug writes (phase 1 routes) additionally checked against the project's reserved top-level page slugs so a collection can't shadow an existing page path.
6. **Tests**:
   - `src/modules/cms/materializePublish.test.ts` — extend (all BINDING, vitest): fan-out shape **with leading-slash keys AND leading-slash card hrefs asserted**, subpage entries matching the pinned `{layout:{sections,theme?},content,title}` shape, **every subpage section's `content[sid].layout` a non-empty string**; stale-client-copy overwrite of cms paths only; non-cms subpages byte-identical; collision → error; toggle-off → no cms subpages; `slugLocked` respected; **detail-page parity**: materialized subpage rendered through **`LandingPagePublishedRenderer`** (NOT the registry component directly — same phase-3 rule, same silent-vanish bypass risk) == edit render of the same item model; detail subpages also round-trip `sanitizeContentForPublish` byte-identical.
   - `e2e/cms-publish.spec.ts` — **extend the phase-3 file** (one cms publish spec, decision recorded in phase 3; same local-500 tolerance as `publish.spec.ts`): publish a detailPages-on collection → item page serves at `/p/<slug>/<collection>/<item>`; toggle off → absent; duplicate-title items → distinct slugs; API duplicate-slug attempt → rejected. Binding versions of the slug assertions live in vitest (route tests + materializer tests).

### Files touched
- `src/modules/cms/render/CollectionDetail.core.tsx` (new)
- `src/modules/cms/render/CollectionDetail.tsx` (new)
- `src/modules/cms/render/CollectionDetail.published.tsx` (new)
- `src/modules/cms/render/CollectionSection.core.tsx` (detail links)
- `src/modules/cms/render/toRenderModel.ts` (detail-item selector)
- `src/modules/generatedLanding/sharedBlocks/registry.ts`
- `src/modules/generatedLanding/sharedBlocks/registry.published.ts`
- `src/modules/generatedLanding/sharedBlocks/capabilities.ts`
- `src/modules/generatedLanding/sharedBlocks/capabilities.test.ts`
- `src/modules/cms/materializePublish.ts`
- `src/modules/cms/materializePublish.test.ts`
- `src/app/api/collections/[collectionId]/items/[itemId]/route.ts` (slug edit + lock)
- `src/app/api/collections/route.ts` + `src/app/api/collections/[collectionId]/route.ts` (top-level-slug shadow check)
- `e2e/cms-publish.spec.ts` (extend)

### Verification
- `npx tsc --noEmit`, `npm run test:run` green; `pageActions.test.ts` + `naayomProducts.test.ts` untouched-green (their source files are untouched by construction).
- `npm run test:e2e -- cms-publish publish` runs (opportunistic).
- Manual: publish a project with detailPages on; click listing card → item page on the live URL (verify the link works from BOTH `/p/<slug>` and a custom-domain root if available); edit an item slug via API → republish → new path live, old path gone.

### 🔶 HUMAN GATE
**Detail-pages publish gate:** founder eyeballs one real published collection with item pages (links, slugs, content) before UI phases build on it. Also confirm naayom's products pages still publish untouched.

---

## Phase 5 — Authoring UI primitives

The missing form controls (scout E "primitives MISSING"), built as isolated `.app-chrome` components in `src/components/ui/`. Zero contact with renderers/templates/publish — **isolation rule: nothing here imports from `modules/templates/**`, `modules/generatedLanding/**`, `components/published/**`**. (`e2e/ui-isolation.spec.ts` is NOT touched — verified: it probes fixed meridian selectors on `/dev/meridian/blocks` against a computed-style baseline fixture; it does not enumerate `components/ui` files, so new files can't affect it.)

### Steps
1. `field-row-list.tsx` — reorderable row list for the schema builder (drag handle · editable name · type chip · trailing role badge/delete), using the existing `@dnd-kit` dep; rows render children slots so phase 6 composes t12's exact row.
2. `date-field.tsx` — date input (native `<input type=date>` styled to app-chrome; no new dep).
3. `tag-input.tsx` — string[] pill multi-input (type + Enter, ✕ per pill).
4. `link-pair-field.tsx` — url + label side-by-side pair (ruling #10, t19 short-pair pattern).
5. `media-or-link-field.tsx` — upload/link toggle for video/audio (ruling #11); upload side takes an `onPickRequest` callback so the caller opens the shared `MediaPickerModal` (component stays picker-agnostic, preserving isolation).
6. `slug-input.tsx` — text input with live mono slug suffix (t12) + editable-slug variant (t19 permalink line).
7. `item-pager.tsx` — "Item 3 of 24" strip + prev/next (t19).
8. Vitest per component (interaction-level: reorder emits new order, tag add/remove mutates value, toggle switches control — **assert mutations, not render-only**, per the inert-assertions lesson).

### Files touched
- `src/components/ui/field-row-list.tsx` (new)
- `src/components/ui/field-row-list.test.tsx` (new)
- `src/components/ui/date-field.tsx` (new)
- `src/components/ui/date-field.test.tsx` (new)
- `src/components/ui/tag-input.tsx` (new)
- `src/components/ui/tag-input.test.tsx` (new)
- `src/components/ui/link-pair-field.tsx` (new)
- `src/components/ui/link-pair-field.test.tsx` (new)
- `src/components/ui/media-or-link-field.tsx` (new)
- `src/components/ui/media-or-link-field.test.tsx` (new)
- `src/components/ui/slug-input.tsx` (new)
- `src/components/ui/slug-input.test.tsx` (new)
- `src/components/ui/item-pager.tsx` (new)
- `src/components/ui/item-pager.test.tsx` (new)

### Verification
- `npx tsc --noEmit`, `npm run test:run` green; `npm run test:e2e -- ui-isolation` green (untouched, run as a canary).
- Components verified in phase 6/7 composition (no temp route needed).

---

## Phase 6 — Schema builder + CMS entry point (t12)

The "New collection" flow + the CMS surface entry in the editor chrome. All designer-conflict RULINGS apply verbatim (do not re-litigate).

### Steps
1. **CMS panel host + entry** — `src/app/edit/[token]/components/cms/CmsPanel.tsx`: collection list (icon tile, name, `N items · M fields`, chevron) + dashed "New collection" row, per the designed rail. Entry point: mount alongside `PageSwitcher` in `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx` (current chrome hosts Pages there; a true left-rail is the ui-redesign track's concern — do NOT build a rail here). **No capability gating** — the shared block renders on every template (Deviations #2), so the entry is available everywhere.
2. **Add-collection modal (t12)** — `src/app/edit/[token]/components/cms/AddCollectionModal.tsx` (460px `dialog`):
   - NAME input with live slug suffix (`slug-input`).
   - START FROM chip row: **Blank enabled; Products/Team/Portfolio/Blog chips greyed+why-tooltip** (ruling #1).
   - FIELDS: `field-row-list`; "+ Add field ⌄" via `AppPopoverMenu` listing the closed 9 (ruling #2: no Price; ruling #3: Text — long is a plain textarea type; ruling #4: no mono variant). Field ids generated to satisfy the letter-prefixed regex (phase 1).
   - Per-row **role menu** (ruling #5): title/cover/primaryLink, type-filtered; role badge on the row.
   - **detailPages `switch`** (ruling #6); "CREATES THESE PAGES" tiles reactive — off → listing tile only.
   - Footer Cancel / Create → POST `/api/collections`, refresh `cmsData`.
3. **Edit-schema path** — same modal opened from a collection row (PATCH); deleting a field warns "values for this field will be hidden" (non-destructive per phase 1 semantics). Delete collection with confirm (cascades server-side; `cmsActions` removes any placed `cmscollection` sections referencing it).
4. **Place on page** — from the collection row: "Add to page" → `addCmsSection` (phase 3 action; sets the pinned DUAL entry — `sectionLayouts[sectionId]` AND the full `content[sectionId]` incl. `layout` — no `sectionSpacing`) inserts a `cmscollection` section on the CURRENT page (root or subpage — the phase-3 materializer walk covers both); the phase-2 greyed "Manage items" placeholder now routes to the CMS panel.
5. **Tests**: `AddCollectionModal.test.tsx` — create posts correct schema/roles/toggle payload (incl. regex-valid field ids); role menu type-filtering; greyed preset chips present-but-disabled (**assert disabled state exists — greyed-placeholder is a contract**).

### Files touched
- `src/app/edit/[token]/components/cms/CmsPanel.tsx` (new)
- `src/app/edit/[token]/components/cms/AddCollectionModal.tsx` (new)
- `src/app/edit/[token]/components/cms/AddCollectionModal.test.tsx` (new)
- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/hooks/editStore/cmsActions.ts` (delete-collection cleanup, placement from UI)
- `src/types/store/actions.ts` (any new action signatures)
- `src/modules/cms/render/CollectionSection.tsx` (manageSlot → CMS panel wiring, replacing greyed placeholder)

### Verification
- `npx tsc --noEmit`, `npm run test:run` green; `GlobalAppHeader.menus.test.tsx` untouched-green.
- Manual: create "Books" `{cover:image, title:text_short, blurb:text_long, buy:link}` from the closed set, set 3 roles, toggle detailPages, place on page — success criterion #1 front half.

---

## Phase 7 — Item editor + group management (t19/t22)

### Steps
1. **Collection browser (t22)** — `src/app/edit/[token]/components/cms/CollectionBrowser.tsx`: header + count pill, search input, "+ New", 2-col card grid (thumb from cover-role field, title from title-role, grey group sub-label), selection ring. **No status pill** (ruling #8).
2. **Item editor (t19)** — `src/app/edit/[token]/components/cms/ItemEditor.tsx` (412px panel): back/breadcrumb/✕, `item-pager`, then one control per schema field driven by field TYPE:
   - image/gallery → thumb + Replace/Remove + dashed "+" tile, opening the shared `MediaPickerModal` (`onPick(url)`; store `{url}` — engine-agnostic, `initialTab` media library); provenance caption "from Media library · <name>".
   - video/audio → `media-or-link-field`; text_short → `input`; text_long → plain `textarea` (**no toolbar**, ruling #3); link → `link-pair-field`; date → `date-field`; tags → `tag-input`.
   - Group assignment = "Category" `select` (ruling #7) incl. "Ungrouped".
   - Editable permalink line (`slug-input` variant) when detailPages on → item PATCH slug + `slugLocked` (phase 4 plumbing; API-only until here); hidden when off.
   - Footer "Saved …" + Cancel + Save → item PATCH; **no "Write with AI"** (ruling #9).
3. **Group management** — `src/app/edit/[token]/components/cms/GroupManager.tsx`: add/rename/delete groups, **simple up/down reorder, no drag** (founder ruling); wired to groups routes.
4. **Live refresh** — saves update `cmsData` → placed `cmscollection` sections re-render in the editor immediately (adapter re-runs `toRenderModel`).
5. **Tests**:
   - `ItemEditor.test.tsx` — control-per-type dispatch (all 9), save payload shape, group select PATCH, empty values allowed, permalink PATCH sets `slugLocked`.
   - `e2e/cms-authoring.spec.ts` (new) — end-to-end success-criterion #1: create collection → groups → items via UI → block renders items in the editor. (Publish leg opportunistic per the local-500 caveat; the binding publish parity stays in `materializePublish.test.ts`.)

### Files touched
- `src/app/edit/[token]/components/cms/CollectionBrowser.tsx` (new)
- `src/app/edit/[token]/components/cms/ItemEditor.tsx` (new)
- `src/app/edit/[token]/components/cms/ItemEditor.test.tsx` (new)
- `src/app/edit/[token]/components/cms/GroupManager.tsx` (new)
- `src/app/edit/[token]/components/cms/CmsPanel.tsx` (browser/editor navigation)
- `src/hooks/editStore/cmsActions.ts` (item/group mutations → cache refresh)
- `src/types/store/actions.ts` (any new action signatures)
- `e2e/cms-authoring.spec.ts` (new)

### Verification
- `npx tsc --noEmit`, `npm run test:run`, `npm run test:e2e -- cms-authoring cms-publish` green (e2e publish legs per caveat).
- Manual `/manual-test`-style pass: full Books flow, editor == published eyeball.

### 🔶 HUMAN GATE
**Authoring UX gate:** founder drives the whole flow (create → schema → groups → items → place → detail pages → publish) and signs off UX before phase 8 extends surfaces.

---

## Phase 8 — Generic CMS board (dashboard) + docs

Founder ruling: expand `work-library-board` into a **generic CMS board**. Highest works-corruption risk of the feature — the works catalog is authoritative (`collectionHelpers.ts:97`, `modules/collections/README.md`) and its board writes through `applyRailEdit`/`resyncWorkContent`, a pipeline the generic board must NOT touch.

### Steps
1. **New route** `/dashboard/[token]/cms` — `src/app/dashboard/[token]/cms/page.tsx` + `src/components/dashboard/cms/CmsBoardClient.tsx`: copy the work-board HOST pattern (load → optimistic local state → single write funnel) but write to `/api/collections/*` — typed-field rows/cards per collection, group columns/filters, item open → reuse `ItemEditor` composition where feasible. **HARD rule: the dashboard board must NOT import from `src/hooks/editStore/**`** — extract shared pieces into plain modules, or build a thin dashboard variant; there is no "if it doesn't drag deps" judgment call.
2. **`work-library-board` stays as-is** — `/dashboard/[token]/work` remains the photographer image specialization over `works`; the CMS board lists the NEW table-backed collections only. `works` does NOT appear in the generic board in v1 (unify pass later). In the CMS board's empty/index state, show a "Works library" row deep-linking to `/dashboard/[token]/work` — two surfaces read as one system, not a silent omission.
3. **Dashboard nav** — add CMS entry in `src/app/dashboard/[token]/layout.tsx` (greyed w/ why-tooltip when the project has no collections yet — never silently hidden; no template gating, per Deviations #2).
4. **Docs** — rewrite the STALE `docs/guides/collections.md`: new user-authored core (tables, closed 9, roles, detail pages, publish materialization, shared-block delivery + deviations + the coercion-proof shape rules), legacy registry relationship, works authority note. Update `docs/README.md` index line if the guide's summary changes.
5. **Tests**:
   - `CmsBoardClient.test.tsx` — write funnel PATCHes collections API; **mandatory regression: board mounted for a project WITH a works library performs zero calls to `/api/work-library`** and never mutates works content.
   - `e2e/work-library.spec.ts` must stay green untouched (proof the specialization survived).

### Files touched
- `src/app/dashboard/[token]/cms/page.tsx` (new)
- `src/components/dashboard/cms/CmsBoardClient.tsx` (new)
- `src/components/dashboard/cms/CmsBoardClient.test.tsx` (new)
- `src/app/dashboard/[token]/layout.tsx`
- `docs/guides/collections.md`
- `docs/README.md` (index line, if needed)

### Verification
- `npx tsc --noEmit`, `npm run test:run` green — including `WorkLibraryClient.test.tsx` and `collectionHelpers.works.test.ts` untouched-green.
- `npm run test:e2e -- work-library cms-authoring` green.
- `npm run build` full green (published CSS + assets + next build) — final pre-merge build.
- **Manual pass — success criterion #2 (one core, three shapes):** build and publish THREE differently-shaped collections on the same core — (a) photographer image-schema "Projects" `{cover:image, gallery, title, tags}`, (b) Naayom-shaped spec-schema "Products" `{cover, title, specs:text_long, buy:link, tags}`, (c) writer text-schema "Articles" `{title, date, body:text_long, link}` — each renders correctly inline + detail pages, editor == published.

### 🔶 HUMAN GATE
**Merge gate (standard):** founder QA on the branch/preview across all success criteria (#1–#6, incl. the three-shape pass above), then plain merge to main + manual push per branch rules. **Known scope note for the gate (no surprise):** criterion #4's "nav" half — detail pages appearing in editor navigation/PageSwitcher — is consciously OUT of v1 scope per Deviations #3 (detail pages are publish-materialized only, visible on the live URL, authored via the Item editor). The rest of #4 (pages exist, linked, published) is in.

---

## Riskiest steps & live-path blast radius (read before implementing)

1. **`/api/publish` edits (phases 3–4)** — every live customer publishes through this route, and phase 3 ADDS the route's first real `tokenId` ownership check — today `verifyProjectAccess` is imported-but-never-called and the only owner comparison (:208) is late + conditional on slug existence. The gate is the PINNED result-checked call (`{action:'publish', allowMissing:true}`; the result MUST be `.ok`-checked — `assertProjectOwner` returns a result object, it never throws/403s by itself; `allowMissing:true` keeps today's tolerated missing-Project-row publishes working). Mitigation: check added as its own step with an authz regression test (foreign tokenId → 403 + body asserted, before any table read); materializer is additive + structurally scoped to `cmscollection`/`cmscollectionitem` and cms subpage paths across BOTH containers (root + subpages); pinned insertion before sanitize :54; byte-identical pass-through test for non-CMS snapshots; human publish gate after phase 3 confirms existing owner publishes still work.
2. **Stored XSS on published pages (phases 3–4)** — CMS values are user-authored strings injected at publish. Mitigation: insertion BEFORE both sanitize chokepoints (:54, :106) + URL checks inside `toRenderModel` via the pure single-sourced `src/lib/safeUrl.ts` (`isSafeURL` moved from `headTags.ts:48` + `isSafePublishedUrl` moved from `publishSanitizer.ts:149-159`; WIDE predicate for `link`/`video`/`audio`, NARROW for `image`/`gallery` src; nested values are beyond `sanitizeItemObject`'s one-level walk) + mandatory `javascript:`-drop AND `mailto:`/`tel:`-survive fixtures in `toRenderModel.test.ts` and `materializePublish.test.ts`. **`toRenderModel` must never import `publishSanitizer.ts`** — server-only, jsdom/dompurify → client-bundle poison via the `'use client'` adapter (the phase-2 re-point edit lives INSIDE that server file and changes nothing about this law).
3. **Publish-only value coercion (phases 2–4)** — `coercePublishValue` (`layoutElementSchema.ts:380-397`) rewrites `{type, content}` pairs and numeric-keyed maps in EVERY section at publish, editor unaffected — the exact editor↔published divergence this feature must avoid. Mitigation: pinned coercion-proof model shape (`{fieldType, value}`, letter-prefixed field ids enforced by Zod regex) + the byte-identical `sanitizeContentForPublish` round-trip test.
4. **Shared-block registries + capabilities sync (phases 2, 4)** — `sharedBlocks/registry.ts`/`.published.ts` back every page render before template dispatch; `capabilities.test.ts` enforces key sync. Additive entries only, `null` capability values, exact-contents test updated in the same commit.
5. **Data-feed divergence (phases 2–4)** — the dual-renderer trap moved up a layer: editor fetch vs publish materialization are two paths. Mitigation by construction: ONE shaping module (`toRenderModel.ts`) called by both; parity tests drive renderers from its real output, never hand-written model fixtures.
6. **Silent section drop at publish (phases 3–4, NEW in rev 4)** — the publish payload carries NO `sectionLayouts` map (`usePublishFlow.ts:195-197`); the published renderer resolves layout ONLY from `content[sid].layout` with a silent `return null` (`LandingPagePublishedRenderer.tsx:106-121`), while the editor is forgiving (`LandingPageRenderer.tsx:300,331`) — the exact asymmetric "perfect in editor, gone when published" failure, self-inflictable by pinning only half the state. Mitigation: DUAL pin (`sectionLayouts[sid]` + full `content[sid]` entry incl. `layout`) on every placement (phase 3) and every fan-out subpage section (phase 4), materializer PRESERVES `content[sid].layout`, and parity tests render through `LandingPagePublishedRenderer` — never the registry component directly.
7. **Slug collisions + path convention (phase 4)** — publish silently overwrites duplicate subpage paths today (`usePublishFlow.ts:177`); slash-less keys/hrefs silently break KV routing and get `'#'`-coerced by `publishSanitizer.ts:30-32`. Enforced at write (routes) + fail-loud publish collision guard + pinned leading-slash convention asserted in vitest (e2e opportunistic).
8. **Works authority (phases 3, 8)** — a generic re-materializer/board that touches `works` corrupts Kundius' catalog. Enforced by scoping + two mandatory regression tests (materializer pass-through, board zero-`/api/work-library`-calls).
9. **Sanitizer-survival invariant (Deviations #4, corrected)** — never register a v2 layout schema for cms section types; unknown keys are preserved by the sanitizer, so the real dangers are the v2 whitelist/defaults machinery and `coercePublishValue` (risk #3). Locked by the byte-identical round-trip test + README warning.

(Removed from rev 1: the `persistenceActions`/`partialize` whitelist edit and the `pageActions.ts` `renamePage` wiring — both eliminated by design. Rev 3 deltas: publish ownership check is ADDED not assumed; `publishSanitizer` import replaced by `safeUrl.ts` extraction; coercion-proof model shape pinned; leading-slash path convention pinned; materializer walk covers root + subpages; one collapsed `e2e/cms-publish.spec.ts`. Rev 4 deltas (final): DUAL layout pin — `content[sid].layout` + `sectionLayouts` — because the publish payload has no `sectionLayouts` map, materializer preserves `layout`, parity tests go through `LandingPagePublishedRenderer`; exact result-checked `assertProjectOwner` call pinned with `allowMissing:true` (publish) / `allowMissing:false` (collection routes); `safeUrl.ts` now houses BOTH `isSafeURL` + `isSafePublishedUrl` with `publishSanitizer.ts` re-pointed; wide predicate for link/video/audio so `mailto:`/`tel:`/`#` CTA links survive.)

## Open risks

- **Editor data freshness:** `cmsData` is a fetch-on-load cache; concurrent edits (dashboard board open + editor open) can go stale until reload. Accepted for v1; no realtime sync planned.
- **Publish snapshot vs tables race:** items edited between editor-load and publish are picked up (server reads tables at publish); a just-removed-but-unsaved placement could briefly disagree — autosave (~1s) makes the window tiny. Accepted.
- **New publish gate on legacy flows — RESOLVED by `allowMissing: true`:** the phase-3 ownership check could have turned today's tolerated missing-Project-row publishes (`route.ts:120-123`; `projectId: project?.id || null` at :226) into a NEW 404 via `security.ts:89` — resolved by pinning `allowMissing: true` in the phase-3 call. Admin override semantics match the route's existing behaviour (`security.ts:112-121` ↔ `route.ts:208-216`); demo token short-circuits (`security.ts:63-65`); the phase-3 human gate + existing `publish.spec.ts` cover the owner path. No longer a preview watch item.
- **Orphan-project pass-through (pre-existing pattern, noted not redesigned):** `security.ts:97-109` lets ANY authenticated user pass `assertProjectOwner` on an orphan project (no owning user) — so CMS content on an orphan project is materializable by any authed caller. Same posture as the platform's other token routes; accepted.
- **Detail pages invisible in editor (Deviations #3):** users see item pages only after publish; the Item editor is the authoring surface. Accepted v1; editor preview is the natural follow-on if QA finds it confusing.
- **`GlobalAppHeader` as CMS entry** is a stopgap until the ui-redesign rail lands; the designed rail-tab IA (t-rail) will need a small relocation pass later. Follow-on, not in scope.
- **Gallery-vs-Collection boundary (success criterion #5)** is enforced only by UX guidance (no code stops a 1-field image collection). Acceptable; presets (deferred) will steer this later.
- **Template group-layout choice** ships stacked-only (Deviations #1); `layoutHint` reserves the seam, no second layout built. Greyed layout options where surfaced.
- **`works` unify pass** (works onto the new tables / generic board) explicitly deferred — the two catalog systems coexist; `docs/guides/collections.md` must state this loudly to prevent a future agent "generalizing" works into corruption.
- **Prisma migration on preview/prod DBs** rides standard `migrate deploy` postinstall; new tables are additive so old app versions coexist safely, but the migration still needs the founder's schema gate (phase 1) before commit.

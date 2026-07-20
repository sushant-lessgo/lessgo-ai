# cms-collections — spec (full tier)


## Problem
Work-engine businesses (photographers, writers, designers…) and catalog businesses (Naayom products) need to put their **own work** on the page as a browsable catalog. Today the only catalog machinery is techpremium/Naayom's **AI-derived, products-hardcoded, template-declared** collections — it generates records, is locked to one schema, and no live template outside techpremium fires it. There is no way for a user to author their own catalog of items.

## Solution in one line
A **user-authored, engine-agnostic, template-agnostic CMS**: the user names a **Collection**, builds its schema from a **closed set of 9 field-types**, optionally organizes items into **Groups**, and fills **Items** themselves. Templates render whatever schema the user built because rendering keys off **field TYPE (closed), not field name**.

## Core model

```
Collection  (user-names: "Books")
  ├─ fieldSchema[]     ← user arranges from the CLOSED 9 field-types
  ├─ field roles       ← user marks: title | cover | primaryLink (minimal)
  ├─ detailPages: on|off   ← per-collection toggle (each Item → own page)
  ├─ layout hint       ← template ultimately decides render
  └─ Group  (OPTIONAL, user-names: "Novels")   ← flat items allowed
       └─ Item          ← user fills schema; ALL fields optional
```

- **Schema lives at Collection level**; groups inherit it. Groups are label/organization only, never a different shape.
- **Group is optional** — a Collection may hold Items directly (implicit ungrouped bucket).
- **All fields optional** — render skips empty fields.
- **Many Collections per site.**

### The closed field-type set (LOCKED — 9)
| # | Type | Holds | Typical render |
|---|------|-------|----------------|
| 1 | Image | single image | photo / cover |
| 2 | Gallery | image[] | carousel / grid |
| 3 | Video | upload **or** link (YouTube/Vimeo) | player / thumb |
| 4 | Audio | upload **or** link (Spotify/SoundCloud) | player |
| 5 | Text — short | one line | title / label |
| 6 | Text — long | paragraphs | blurb / body |
| 7 | Link / button | url + label | CTA button |
| 8 | Date | date | year / timestamp |
| 9 | Tag / label | string[] | pills / filter keys |

Deferred (NOT in v1): price/number, file/PDF download, generic oEmbed. Price = short-text for now.

### Field roles (minimal)
User marks up to three roles on the schema so templates can build coherent cards across designs:
- **title** (a short-text field), **cover** (an image/gallery field), **primaryLink** (a link field).
Everything else renders in schema order. Roles optional; if unset, template falls back to first-short-text / first-image / first-link by order.

### The load-bearing insight (why user-schema + template-render coexist)
Templates render **field TYPES, not field names.** Because the type set is **closed (9)**, every template ships a renderer per type (image→`<img>`, gallery→carousel, long-text→prose, link→button…). A user-invented `Books {cover:image, blurb:long-text, buy:link}` is just image + long-text + link — all known. **No field is ever unknown.** User freedom = names + arrangement + roles; template freedom = how each type looks + how groups lay out.

### Collection vs Gallery-field boundary
- **Gallery field (type #2)** dropped in a normal section = a bare wall of images, no per-item structure. NOT a collection. (e.g. Naayom's "product in farms" photos, if unstructured.)
- **Collection** = repeating items *with a schema* (and maybe groups / detail pages).
- Rule: reach for a Collection only when content is a **catalog**; a bare image wall stays a Gallery field.

## Scope

### In
- New engine-agnostic data layer: Collection / Group / Item + user-built schema (closed 9 types) + field roles + detailPages toggle.
- Template render contract keyed on field-type + roles; **dual-renderer** (edit `.tsx` + published `.published.tsx`), group layout = **template choice**.
- **Item detail pages** as a per-collection toggle, wired into the existing multi-page fan-out / slug / `PageSwitcher` plumbing (the one part of the old machinery that cleanly survives).
- Dedicated **CMS authoring area** (designer **t19** item editor, **screen-12** add-collection), schema builder (name + arrange fields + set roles), group management.
- **Media reuse** — Item image/gallery/video fields reuse the `MediaAsset` / media-library pipeline. `work-library-board` (`/dashboard/[token]/work`) stays as an **image specialization** over the `works` collection, not the general model.
- Publish path: Collections render on published pages via the published renderer + static export.

### Out (explicit)
- **AI authoring of item content** — user supplies everything. No record generation, no AI-derived teasers. (The dormant `materializeHome*` / `cardFromEntry` / generation fan-out is NOT the core; reuse only as read-only display/promotion if it fits — otherwise leave it.)
- **User-invented field types** — closed at 9. User invents *collections and arrangements*, never new field types.
- **Presets** — blank-start v1; ship preset collection shapes ("Portfolio grid", "Book list", "Track list") later as pre-filled schemas.
- About / Packages dedicated pages — separate Spec 2 `home-summary-links` (non-CMS, authored independently, template auto-adds "Know more →").
- price/number, PDF, oEmbed field types (deferred).

## Phases (dependency order: data → render → UI)

### Phase 1 — CMS data core
Engine- and template-agnostic. Models for Collection / Group / Item, the closed 9 field-type schema representation, field roles, detailPages flag, ordering. Store + persistence + validation (types closed, all values optional). No UI, no rendering yet. Un-couple this from the products-hardcoded `collectionHelpers`/registry assumptions — this is a fresh authored-data core, reusing existing renderers only where they fit downstream.

### Phase 2 — Render contract + template integration + detail pages
- Template-agnostic **Collection render contract**: render by field-type + roles; group layout is the template's choice (stacked / tabs / accordion / filter).
- **Dual-renderer parity** — edit `.tsx` and published `.published.tsx`, identical layout/CSS, `data-surface` tones. Registries: `componentRegistry.ts` + `componentRegistry.published.ts`.
- **Detail pages**: when `detailPages: on`, each Item gets its own page via the surviving multi-page fan-out / slug-derivation / `PageSwitcher` plumbing.
- **Template capability**: a template declares "I render Collections" (+ its group-layout choices). Only such templates are offered for Collection-bearing sites ("shortlist templates that support it"). Because render keys on closed types, no per-schema template code is needed — one Collection renderer per template covers all user schemas.
- Reuse the `works` renderers (`WorkGalleryGrid.core.tsx`, `WorkDetail.core.tsx`, `WorkCatalog.core.tsx`) where they fit; keep single-source `.core.tsx` pattern.

### Phase 3 — CMS authoring UI
- Dedicated CMS area (designer **t19** item editor, **screen-12** add-collection).
- **Schema builder**: name the collection, pick fields from the closed 9, arrange order, set the ≤3 roles, toggle detailPages. Blank start.
- **Group management**: add/name/reorder groups (optional); items assignable to a group or ungrouped.
- **Item editor**: schema-driven fields; media fields use the media picker (reuse).
- Keep `work-library-board` as the photographer image specialization layered on the same `works` data.

## Constraints & invariants
- **Dual-renderer pitfall** — every Collection block edited in BOTH `.tsx` and `.published.tsx`, layout/CSS identical (published = server-safe, no hooks, flat props). CLAUDE.md #1 trap.
- **Published/client boundary** — no importing `'use client'` functions into the published renderer; shared helpers in plain modules.
- **Closed vocab law** — field types closed at 9; collections/groups/items are data, not new template code.
- **Token-scoped access** — Collections belong to a Project (token); use `assertProjectOwner` on any new token route (`memory/project_authz_token_fix`).
- **Greyed placeholder** for any capability not yet built, don't fake it (`memory/feedback_greyed_placeholder`).
- Rebuild published CSS/assets if published-page styling changes (`npm run build`, not bare `next build`).

## Success criteria
1. A user creates a Collection "Books", builds schema `{cover, title, blurb, buy}` from the closed set, adds Groups (Story/Poetry/Novels), fills Items — with zero AI and zero code.
2. The same mechanism holds a photographer's image-schema Projects **and** Naayom's spec-schema Products **and** a writer's text-schema Articles — one core, different user schemas.
3. A Collection renders correctly in a supporting template, **editor == published** (dual-renderer parity), groups laid out the template's way.
4. `detailPages: on` → each Item has a working dedicated page (nav + slug + publish); `off` → inline only. Both in v1.
5. Bare image walls stay Gallery *fields* (not forced into a Collection).
6. `tsc` + `test:run` green; published page builds and publishes.

## Reuse pointers (for scout/planner)
- Existing (to generalize/reuse, NOT to keep AI-coupled): `src/modules/collections/registry.ts`, `src/modules/generation/multiPageAssembly.ts` (fan-out/slug — detail-page path), `src/hooks/editStore/collectionHelpers.ts` (products-hardcoded — decouple), `src/modules/engines/workSections.ts` + `workPages.ts`, `src/modules/skeletons/work/`, `docs/guides/collections.md`.
- Renderers: `WorkGalleryGrid.core.tsx`, `WorkDetail.core.tsx`, `WorkCatalog.core.tsx`, `TechPremiumLineup.tsx`/`.published.tsx`.
- Media: `MediaAsset` pipeline + media-library picker; `work-library-board` at `/dashboard/[token]/work`.
- Designer: `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/.../Lessgo Editor Redesign.dc.html` screens **t12** (=screen-12 add-collection), **t19** (item editor), **t22** (photographer-portfolio example) + its README CMS section (~L119-161).

## Tier
**Full** — new data models + dual-renderer + template contracts + multi-page/publish path + dedicated editor UI. Three phases, per-phase plan-review + impl-review.

## Open questions (answer before /feature) - answered by founder
- Detail-page slug: reuse code-derived slug from `multiPageAssembly`, or user-editable slug per item? - reuse, should be seo friendly, user can also edit
- Group reorder / item-across-group move — drag (dnd-kit) in v1, or simple ordering? - keep it simple
- Does `work-library-board` write to the SAME new `works` data core, or stay on its current store until a later unify pass? Expand work library board to a generic CMS Board
- Which live templates get the Collection capability in v1 — Atelier (work) only, or also techpremium (migrate Naayom products onto the general core)? - doesnt matter for this spec

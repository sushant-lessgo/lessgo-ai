# language-item-nav-i18n (follow-up) — spec

Extend the locale overlay to reach the two text surfaces i18n Phase 1 left un-localizable:
**per-collection-item text** and **nav labels**. Newly relevant because cms-collections shipped —
a bilingual work/CMS site currently renders default-locale item cards + nav in every locale.
Stacks on **language-settings (F1)**; auto-translate (Spec 2) covers these once the write path
exists. Agreed 2026-07-21.

**Tier: full** (deepens the shared content/overlay model + CMS collection render + nav + both
renderers).

## Problem / why
Documented Phase-1 limitations (`i18nPlan.md` §v1 limitations):
- **"Per-collection-item card text NOT localizable — the overlay is whole-top-level-elementKey
  only; text inside `items[]`/`related[]` object arrays renders default-locale copy in every
  locale."** cms-collections made collections a first-class, user-authored surface → this now
  visibly breaks (a bilingual portfolio/CMS site shows English item titles on the NL page).
- **"Nav labels NOT localizable — `navigationConfig` slice + template `nav_items` collection have
  no overlay write path; locale-shared."** A multi-page NL site keeps English menu labels.

## What already exists (do NOT rebuild)
- Overlay model + `resolveLocaleElements` (`localeContent.ts`) — but keyed **sectionId →
  elementKey → string|string[]** only; no addressing for nested item fields or nav entries.
- cms-collections render: `CollectionSection.core` / `CollectionDetail.core` + item schema
  (`fieldSchema`/`values`, closed field-type set of 10) — the item text this spec must localize.
- Nav: `navigationConfig` + template `nav_items` collection.
- F1 Languages panel + editing toggle; Spec 2 auto-translate (reuses whatever write path this adds).

## Decisions (proposed — plan confirms)
1. **Deepen the overlay addressing** to reach nested item fields and nav entries. Candidate: extend
   the key path (e.g. `sectionId → elementKey → itemId → field`) or a parallel **collection-locale
   overlay** keyed by `(collectionId, itemId, field)`. Plan chooses — collections have their own
   identity (collection/item ids) distinct from section elements, so a parallel overlay may be
   cleaner than overloading the section overlay.
2. **Address items by stable id, not array index** — item arrays reorder; index-keyed overlays
   would mis-bind after a reorder. Reuse the item's schema id.
3. **Both renderers** — the collection/nav render on edit and published paths resolve through the
   same deepened resolver (parity invariant).
4. **Auto-translate (Spec 2) inherits it for free** — once the write path exists, the same
   per-field translate machinery fills item/nav overlays; this spec adds no new AI code.
5. **Detail-page slugs stay default-locale** in this spec (per-locale slugs = later; note only).

## Scope
IN: overlay addressing for `items[]`/`related[]` object-array text + `navigationConfig`/`nav_items`
labels · editor authoring of those in a non-default locale (via F1's active-locale toggle) ·
collection + nav render (edit + published) resolves per-locale · regression that a single-locale
project is byte-identical.
OUT: per-locale detail-page **slugs** · localizing non-text item fields (links/media — locale-shared
by design) · per-locale meta (Phase 3) · the AI translation itself (that's Spec 2's engine, reused).

## Constraints
- **Reorder-safe** item addressing (id-keyed, not index) — explicit test: reorder items, overlay
  still binds to the right item.
- **Dual-renderer parity** across collection section, collection detail page, and nav — the
  #1 trap surface (three render paths).
- Overlay-first resolve ordering preserved (`resolveLocaleElements` invariant) so parity holds.
- Single-locale + no-collection projects: **zero diff** (regression).
- Published/client boundary + bundle firewall stand.

## Acceptance
- [ ] A bilingual project translates a collection **item's** title/text; the non-default locale
      page renders the translated item card, default renders the original.
- [ ] Nav/menu labels render per-locale (NL menu shows NL labels).
- [ ] Reorder items after authoring translations → overlays still bind to the correct items.
- [ ] Collection **detail** page renders per-locale item text (not just the section teaser).
- [ ] Spec-2 auto-translate fills item/nav overlays with no new AI code.
- [ ] Single-locale / no-collection projects: zero visual/storage diff (regression test).

## Open questions
1. **Overlay shape** — extend the section-keyed overlay with nested paths, or a separate
   collection/nav-locale overlay keyed by stable ids? (Plan decides; collection identity argues
   for separate.)
2. **Detail-page slug localization** — confirmed OUT here? (per-locale slugs interact with the
   static-export route fan-out + KV; larger surface.)
3. Does `nav_items` localization belong to the **template** or the shared nav config? (Phase-1 note
   says both lack a write path — confirm the single home.)

## References
- `docs/tracks/Completed/i18nPlan.md` — §v1 limitations (the two gaps this closes).
- `docs/task/language-settings.spec.md` (F1) · `docs/task/language-autotranslate.spec.md` (Spec 2).
- `src/lib/i18n/localeContent.ts` — overlay + resolver to deepen.
- `src/modules/cms/` + `CollectionSection.core` / `CollectionDetail.core` — item render.
- Memory: [[project_i18n_multilingual]] · [[project_scale09_block_variants]] (dual-renderer parity discipline).

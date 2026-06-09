# Dev → PO: Phase 8 Pass-1 defects fixed

**Date:** 2026-06-09
**Branch:** `phase-7.5-multi-template` (not merged to main)
**Status:** ✅ All 4 defects fixed. `npm run build` clean. Manual re-test (both passes) green per your gate.

---

## Fixes (your priority order)

**2b — collection keys `""` (root cause).** Added schema-driven `backfillCollectionIds` to `processServiceCopy` (`audience/service/parseCopy.ts`), runs after schema-defaults, before italic-em fallback. Walks every collection the service schema declares with a `fillMode:'system'` field, assigns `${collectionKey}-${uuid8}` to any item missing an id. Idempotent. Covers nav_items / services / packages / social_links (+ future, schema-driven). No prompt change.

**3 — "Button Settings" never showed on CTA.** Your line cite was off — not the `:87-89` early-return. Real cause: single-click on the contenteditable CTA focused it → text toolbar; never selected as `type:'element'`. Validated selection path (`useEditor.determineClickTarget/determineElementType`). Fix: narrowly-scoped `isButton` mode on `HearthEditable` — single-click selects (→ element toolbar → existing `canConvertToForm` lights up Button Settings), double-click edits text. All other Hearth text unchanged (single-click-edit). Applied to "Book a call" CTAs in BookCallCTA + hero + nav. `InlineTextEditorV2` got 2 additive optional props (autoFocus/onEditingChange) — zero change for existing callers.
  - Note: entry path = CTA → **Button Settings** → **Native Form** radio → **Create New Form** → FormBuilder ("Start from a template"). Unblocked step 1; rest was already wired.

**2a — empty image looked broken in edit.** Gradient logic was identical edit/published; missing was an affordance. New reusable `HearthAddImageOverlay` (mirrors product `ResultsGallery` ImagePlaceholder, Hearth tokens, `pointer-events:none` so slot click still opens image toolbar). Wired into hero `hero_image` + testimonial `author_photo` (compact). Edit shows gradient + "Add image"; published unchanged. No Pexels auto-fill (out of scope; user-upload by design).

**1 — persona save dead-end.** Settings `next="/dashboard?personaUpdated=1"` + "← Back to dashboard" link. Dashboard shows dismissible `PersonaUpdatedBanner` (mirrors billing `?success=`; dismiss strips param). First-time `/api/start` flow untouched.

---

## Re-test gate — all confirmed

- Generate service page → **0 duplicate-key warnings**; collection items have unique ids.
- Inline-edit one list item → isolated, saves, survives reload.
- **2b through publish** → `/p/[slug]` renders collections with ids intact.
- CTA → Button Settings → FormBuilder → template populates fields.
- Empty hero/avatar in edit → gradient + "Add image"; published clean.
- Persona change → lands on `/dashboard` with confirmation; back link present.
- Phase 6 copy gates unaffected by backfill.

---

## Per your two corrections / answers

- Heal-on-load backfill: **skipped** (frozen `loadDraft` untouched; regenerate dev drafts).
- Double-click-to-edit on CTA: **shipped**, scoped to button/CTA elements only.
- Defect-3 diagnosis corrected (selection routing, not the early-return).

## Files touched

`audience/service/parseCopy.ts` · `editor/InlineTextEditorV2.tsx` · `templates/hearth/components/HearthEditable.tsx` · `templates/hearth/components/HearthAddImageOverlay.tsx` (new) · hearth blocks (BookCallCTA, PetalFramedHero, WarmNavHeader, PullQuoteWithMark) · `dashboard/page.tsx` · `dashboard/PersonaUpdatedBanner.tsx` (new) · `dashboard/settings/page.tsx`

Ready for merge review.

# Edit-Page Fix Plan (from QA reports 2026-07-07)

Sources: `docs/reports/edit-page-qa-naayom.md` (TechPremium, prod) + `docs/reports/qa-vestria.md` (Vestria, prod).
Both QA runs predate the 07-07 deploys — several findings already fixed in latest push.

**Execution (agreed 2026-07-07):** lite pipeline — orchestrator plans + implements directly; ONE plan-review pass (Opus/high); no impl-review loop. All work sequential on branch `feature/editpage-fixes`, one commit per batch, `tsc` + `test:run` green per batch. Merge to main = human gate, user pushes. Decisions: baseline backfill skipped (new pages only), regen copy quality = separate track, Vestria hamburger parked, QA-artifact deletion approved (do last, via existing unpublish/delete code paths).

## Already shipped (latest push, verify on prod once deployed)
- **Undo/Redo dead** (naayom F1/F2, vestria H1/H2) → `edit-header-actions` ph1-2 (history stack + wired buttons)
- **Reset Everything doesn't revert** (naayom F4) → ph4-5 (baseline capture + restore). ⚠️ pages generated BEFORE this deploy have no baseline — Reset may still no-op on them
- **Regen Copy not undoable** → ph3
- editpage.md original items: background-settings removed, Inputs panel removed, review→guide+verify shipped

## Status (2026-07-07): ALL 7 BATCHES BUILT on `feature/editpage-fixes` (7 commits, tsc+tests green). Merge = human gate.

Key root causes found during impl (differ from/refine the scouted ones):
- Corruption engine #1: `InlineTextEditorV2` rendered `{content}` as a React text child of the contentEditable — any mid-edit store write re-rendered formatted DOM as literal HTML text. Now fully uncontrolled (fixes ALL 8 template editables).
- Corruption engine #2: regenerateSection's merge spread a string element into an object → `{0:'H',1:'e',…,type,content}` — the exact React-#31 crash object (naayom had 2 regens pre-publish). Merge now shape-preserving.
- Element-card Delete/Duplicate/Style all routed to a V2 STUB (`console.warn`) — dead for every element, not just CTAs. Delete now = exclusion (`aiMetadata.excludedElements`); Duplicate/Style removed (can never work on fixed schema keys); publish strips exclusions for schema-less layouts.
- First-click regen no-op + regen toast: predates edit-header-actions ph3 (deployed after QA) — verify on prod, likely already fixed.
- QA cleanup blocked: NO delete path exists for published pages (no publishedPage.delete, projects API GET-only) — `naayomqatest.lessgo.site` needs manual removal or a proper unpublish feature (candidate for Before-Customer-2 list).

## Remaining — batches (each = one implementer pass, ordered)

### Batch 1 — P0: Publish hardening (ship-blocker, naayom §H)
Published page white-screens (React #31: `{type,content}` object reaches text slot) + no favicon fallback.
- **Coercion centralized in `sanitizeContentForPublish()`** (`src/modules/sections/layoutElementSchema.ts:352`) — already walks every section/element and runs on BOTH publish paths (static export + `/p/[slug]` SSR fallback at `p/[slug]/page.tsx:114`). Add object→string coercion there (extract `.content` from `{type,content}` shapes; `String()` fallback). Per-renderer guards NOT needed (TechPremium has 19 bespoke `.published.tsx` blocks — can't guard each).
- Default favicon in **both** renderers (dual-renderer parity): `faviconLinkTag()` (`headTags.ts:32`) AND `generateMetadata` icons (`p/[slug]/page.tsx:51`)
- Clerk-on-published-pages: **deferred** (see Deferred) — requires root-layout route-group restructure; console error is non-fatal, white-screen is the #31 above
- Verify: publish pristine fresh page + page with `{type,content}` object in content; both render
- Files: `src/modules/sections/layoutElementSchema.ts`, `src/lib/staticExport/headTags.ts`, `src/app/p/[slug]/page.tsx` (+ test in layoutElementSchema area)

### Batch 2 — P0: Rich-text toolbar corruption (naayom bug 1, vestria finding 1; upstream of Batch 1 crash)
Color/underline inject literal `<span>` text; 2nd format escapes to `&lt;span&gt;`; Vestria silently drops formats.
- Root cause A (scalar corruption, both templates): `TextToolbarMVP.applyFormatInternal()` whole-element path rebuilds stored HTML from `textContent` + raw markup string; `simpleSanitizeHTML()` in `textFormatting.ts` is a fragile regex unescape/re-escape pass that double-escapes on 2nd format
- Root cause B (Vestria silent drop): `TextToolbarMVP` writes via `store.updateElementContent(sectionId, elementKey, html)` directly (`:224`), bypassing `VestriaEditable`→`saveField` dotted-collection-key routing (`editPrimitives.tsx:55-60`) → collection fields (`values.<id>.description`) never land → formatting silently dropped
- Fix: format via real DOM nodes only, serialize `innerHTML` once, replace regex sanitizer with allowlist sanitize; route toolbar writes through the same dotted-key logic as `saveField` (or teach `updateElementContent` collection keys); store value always clean HTML string
- Fix must TOLERATE already-corrupted stored content (escaped `&lt;span&gt;` literals from prod pages) — render-side unescape/strip on load or leave-as-text, no crash
- Covers: bold/italic/underline/color/align/size, repeat-format on same word, both templates
- Files: `src/app/edit/[token]/components/toolbars/TextToolbarMVP.tsx`, `src/utils/textFormatting.ts`, `src/modules/templates/vestria/components/VestriaEditable.tsx`, `src/modules/templates/vestria/blocks/editPrimitives.tsx`, `src/hooks/editStore/contentActions.ts` (updateElementContent)

### Batch 3 — P1: CTA element actions + Button Settings (naayom bugs 2+5)
Hero CTA Delete/Duplicate no-op; secondary CTA shows "Primary" in settings.
- `useElementCRUD.removeElement/duplicateElement` early-return (`:277`) when `elements[elementKey]` undefined → handle CTA key shapes. ⚠️ Before fixing: grep ALL readers/renderers of hero CTA — block may render the button from section-level `cta` object, not `elements[secondary_cta_text]`; deleting the element key alone may not remove the rendered button. Re-point, don't just delete.
- `ButtonConfigurationModal` fixes BOTH sides: write — hardcoded `cta.variant:'primary'` on save (`:264-269`); read/seed — with no savedConfig, `ctaType` defaults `'primary'` (`:131,142`) → seed from element key (`secondary_cta_text` → secondary). Grep readers of `cta.variant` before changing (semantic-regression risk).
- Files: `src/hooks/useElementCRUD.ts`, `src/app/edit/[token]/components/content/ElementCRUD.tsx`, `src/components/toolbars/ButtonConfigurationModal.tsx` (+ hero block CTA render path if re-point needed)

### Batch 4 — P1: Native dialogs → in-app modal (fixes Vestria section-delete "freeze" E5 + UX)
Native `confirm`/`prompt` are SYNCHRONOUS and used inline (`if (confirm(...)) {...}`) — a declarative modal can't drop in. Build an **imperative promise API**: `await confirmDialog({title,...}): Promise<boolean>` + `await promptDialog(...): Promise<string|null>`, then invert control flow at each site.
- New: `src/components/ui/ConfirmDialog.tsx` (provider + hook/imperative fns)
- Replace at: `useSectionCRUD.ts:229,369` · `useElementCRUD.ts:283,799` · `ElementCRUD.tsx:403` · `PageSwitcher.tsx:84,98,103` (add/delete/rename page — prompt resolves string) · `ProductsModal.tsx:44,102,152` · `ExpertControls.tsx:404,422`
- (blog dashboard call sites optional, same pass if cheap)

### Batch 5 — P1: Editor fonts (vestria finding 2)
Vestria display serif (Bodoni Moda) correct on published, fallback slab in editor/preview.
- Root cause: `fonts-self-hosted.css` imported only by `p/layout.tsx`; editor renders under root layout → `@font-face` never loads
- Import fonts CSS for editor/preview; add missing `Hanken Grotesk` `@font-face` (check `public/fonts/` has the woff2 — add files if missing)
- Files: `src/app/layout.tsx` (or `src/app/globals.css` @import), `src/styles/fonts-self-hosted.css`, possibly `public/fonts/*`

### Batch 6 — P2: Regen reliability (naayom G2/G3, vestria B13/E8)
- First-click no-op: verify await/status-guard in `generationActions.regenerateAllContent()` (~:545-568) before section loop
- "Some sections failed to regenerate": surface per-section errors, retry affected sections
- Inline sparkle rewrites whole section instead of selected element → scope check
- Files: `src/hooks/editStore/generationActions.ts`, `EditHeaderRightPanel.tsx`, `TextToolbarMVP.tsx` (sparkle), `src/app/api/regenerate-section/route.ts`

### Batch 7 — P2: Small polish
- Slug strips hyphens: `src/components/SlugModal.tsx:105-112` — trailing `-+$` strip runs per keystroke so internal hyphens can never be typed → allow trailing hyphen while typing, sanitize fully on submit; optional live `/api/checkSlug`
- WhatsApp widget overlaps Publish button in preview (z-index/offset) — locate TechPremium widget block during impl (dual-renderer pair)
- Files: `src/components/SlugModal.tsx`, techpremium WhatsApp block `.tsx`+`.published.tsx`

## Deferred (decided 2026-07-07)
- Clerk on `/p/[slug]` SSR fallback — root layout wraps ALL routes in ClerkProvider; nested layout can't opt out (Next 14: one root layout). Real fix = route-group restructure (`(app)/` owns Clerk, `p/` sibling root layout) — whole-app blast radius. Console error non-fatal; revisit as own track.
- Regen copy QUALITY drift (generic SaaS boilerplate, loses business specificity) — separate track
- Vestria mobile hamburger nav — parked
- Baseline backfill for pre-deploy pages — skipped, new pages only
- "Text toolbar reimagine" (original item 3) — Batch 2 fixes correctness only; redesign later

## Cleanup
- Delete QA artifacts: `naayomqatest.lessgo.site` (broken live page), Vestria QA page's test form submission + duplicate Testimonials section

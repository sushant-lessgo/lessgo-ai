#Round 1 - complete

1. Login sussessful... Persona selected SaaS app founder
2. Create new page 
3. ISSUE/GAP: It did not ask me what assets I have + Didnt get any option to select the design (since it is only meridian, i SHOULD get option to select pallette and variation)
4. It directly goes to https://lessgo.ai/edit/zU83f_0EjVZ8.. First it should come to https://lessgo.ai/generate/zU83f_0EjVZ8 for a quick wow factor.. then user can edit
5. On edit, color mismatch.. preview has correct black background.. it has light gray and other colors mismatch as well
6. On edit, In the hero section.. a. what was supposed to be a mock up image on right side is overlapped on left with headline.. on preview it is correct b. Theme doesn't work in edit header, typography is outdated
7. In preview before and after CTA section there is light space.. which is not required.. it should be end to end black in the variation
8. In button settings, button text should come automatically as per CTA given by LLM or latest edited by user
9. Button settings not getting reflected back on edit page (both button text and URL)
10. Links in header, footer, subscribe button, pricing and primary CTA should work in sync
11. SUCCESSFUL: publish done, page loading fast... CTA click working.. UI looking beautiful

---

# Fix Plan — Phases

Decisions locked: #3 picker = keep locked/deferred (pilot stays mint/developer);
#4 reveal page = build; #10 = make each CTA independently functional first (no shared target yet).

## Phase 1 — Editor renders the Meridian theme  *(launch blocker; fixes #5, #6a, #6b)*
Root cause: `EditLayout` wraps the editor in legacy `VariableThemeInjector`, never the
Meridian `ThemeInjector`. So Meridian blocks in edit read CSS vars (`--ink`, `--bone`,
`--accent`, `--sec-pad-x`, container sizing) that are undefined → gray bg + collapsed
layout (overlapping hero). Preview/published inject them correctly.
- [ ] 1a. In `EditLayout`, when `usesTemplateModule(audienceType, templateId)`, wrap the
      shell in `tmpl.ThemeInjector` (palette/variant from store, same `effective*` fallback
      as `LandingPageRenderer`); skip `VariableThemeInjector` for template projects. → #5, #6a
- [ ] 1b. Edit header (#6b): for template tracks, hide/disable the legacy product
      ThemePopover + TypographyControls (they read the legacy theme store, meaningless for
      Meridian). Pilot has no picker, so show a static label, not stale controls.
- [ ] 1c. Verify in dev: black bg matches preview; hero mockup no longer overlaps headline.

## Phase 2 — CTA section seam in preview  *(#7)*  ✅ DONE
Root cause: `.mrd-cta { margin: 120px 0 }` collapsed through its zero-padding
`data-surface="ink"` wrapper, exposing the white `body` (`globals.css` bg-white; demo body
is `var(--ink)`). Fix: moved the 120px from a collapsing margin on `.mrd-cta` to padding on
`.mrd-cta-wrap` so it stays inside the dark surface. CTA was the only block with a
section-level margin. Files: `ArcCTA.tsx` + `ArcCTA.published.tsx`.

## Phase 3 — Button text + link plumbing  *(#8, #9, #10)*  — split into subphases
Root cause (3a): `ButtonConfigurationModal` read button text from `element.content` and config
from `element.metadata`, but V2 stores `elements[key]` as a plain string and config at
`elementMetadata[key].buttonConfig`. So modal always showed "Button Text", clobbered real copy
on save, and lost the URL on reopen. Shared by Meridian + Hearth + Lex (one modal).
- [x] **3a** — Modal read/save fix (#8 + #9). `ButtonConfigurationModal.tsx` L75–80. ✅ DONE
- [x] **3b** — Wire single-CTA published hrefs (header/hero/closing/secondary) to per-button
      buttonConfig via new shared `src/utils/resolveCtaHref.ts`. ✅ DONE. 12 buttons across 9
      `.published.tsx` (Meridian/Hearth/Lex header+hero+closing+secondary+signin); deduped the
      old copy-pasted `resolvePrimaryHref`. No edit-block changes (all already isButton+keyed).
- [x] **3c** — Pricing/package tier CTAs (Meridian + Hearth; Lex fee table has no tier CTA by
      design, left as-is). ✅ DONE. Made the modal collection-item aware (`<coll>_cta_<id>` →
      seed/write nested `cta_text`, array-guarded so single CTAs unaffected); added `isButton` to
      Hearth packages; wired per-tier published href via `resolveCtaHref`.
- [x] **3d** — Footer newsletter capture (Meridian only; Hearth/Lex footers are contact-only by
      design). ✅ DONE. Editor "⊕ Set up newsletter signup" button one-click auto-provisions a
      dashboard-backed form (`addForm`) + connects it to `newsletter_cta`. Published footer renders
      a new on-brand client widget `MeridianNewsletterCapture` that POSTs to `/api/forms/submit` →
      `/dashboard/forms/[slug]`. Forms persist via existing draft/publish pipeline.

**Phase 3 complete** (3a–3d). Remaining: Phase 4 (#4 `/generate` reveal); deferred #3 picker.

## Phase 4 — `/generate` reveal page before `/edit`  *(#4)*  ✅ DONE (both tracks)
The reveal page already existed (`/generate/[token]`: preview + `PageRevealAnimation` w/ confetti +
"Your page is ready!" toast + "Edit Page" → transition). Wired both onboarding success redirects
(product GeneratingStep L245, service L236) to `/generate/[token]` instead of `/edit`; made the
page's "return to setup" redirects track-aware (service vs product); friendlier action-bar copy.
Credit/error fallbacks still skip straight to `/edit` (nothing to reveal).

## Deferred (not bugs)
- #3 palette/variation picker + assets step — post-pilot (P6). Pilot stays mint/developer.



#Round 2 - in progress

1. On published page https://ceradistest.lessgo.ai/ hero headline is getting overlapped with right side image.. same for edit.. on preview it is correct though
2. The mock up image should be editable using existing replace image functionality in hero
3. in edit, the background color is light.. hero headline is not visible (light on light).. working correctly in preview and published
4. In header links are not clickable.. need away to configure them or auto configure
5. Footer links are also not working... how to solve it?

---

# Round 2 — Fix Plan (Phases)

Decisions locked: #2 deferred (terminal stays as-is, make lines editable later if demanded);
links = section-anchor + custom URL, auto-mapped by label at generation, user-editable.

## Phase 1 — Editor paints section surfaces  *(launch blocker; fixes #3)*  ✅ DONE
Root cause: preview/published wrap each template section in `<div data-surface=...>` so the
globally-injected `[data-surface="ink"]{background:var(--ink)}` rule paints. The edit renderer
(`EditablePageRenderer.tsx`) sets only `data-section-id/layout/background-type` — no
`data-surface` → transparent sections over the light editor canvas → light bg + invisible
`--bone` headline.
- [ ] 1a. `EditablePageRenderer.tsx`: when `usesTemplateModule`, add `data-surface={surface}` to
      the wrapper. Pull `tmpl` from `useTemplateModule`; `surface = tmpl?.getSurfaceForSection(
      extractSectionType(sectionId)) ?? 'cream'` (same default as published, no drift). Reuse
      `extractSectionType` from `componentRegistry.ts`.
- [ ] 1b. Verify in dev: edit hero dark + headline visible, matching preview.
(Genuine completion of Round-1 Phase 1: that defined `var(--ink)`; this paints it.)

## Phase 2 — Hero right gutter so headline can't overlap terminal  *(#1)*  ✅ DONE
Root cause: `.mrd-hero__vis` is `position:absolute; right; width:440px`; `.mrd-hero__inner` has
no reserved right column, so a long wrapped headline runs under the terminal. Length-dependent
(NOT the Round-1 both-from-left bug).
- [ ] 2a. In BOTH `TerminalHero.tsx` + `.published.tsx` STYLES: above the 1100px breakpoint,
      reserve the terminal lane on `.mrd-hero__inner` (`padding-right`/`max-width: calc(100% - 480px)`).
      Keep the `<=1100px` stack-to-static rule.
- [ ] 2b. Verify with a deliberately long headline (edit + published); mobile unchanged.

## Phase 3 — Header + footer link targets  *(#4, #5)*  ✅ DONE
Links already have an `href` field; published renders it directly; smooth-scroll JS already
exists. Gaps: (a) sections have no scroll `id`, (b) no edit UI, (c) no auto-map.
New shared util `src/utils/sectionAnchors.ts` (`buildSectionAnchorMap` dedup-aware +
`buildSectionLinkOptions` + `prettySectionLabel`) used by both renderers and the picker.
- [x] 3a. Section anchors: `id={anchorMap[sectionId]}` on the wrapper in
      `LandingPagePublishedRenderer.tsx` + `LandingPageRenderer.tsx` (dedup so duplicate section
      types get `-2/-3`). Dropped inner `id="cta"` in `ArcCTA.published.tsx` + Hearth
      `BookCallCTA.published.tsx` (only 2 hardcoded ids in all `*.published.tsx`). Anchors fire on
      published only.
- [x] 3b. New shared `LinkTargetPopover.tsx` (Radix popover + native select/radio + Input) wired
      into `MeridianNavHeader.tsx` (`updateNavHref`) + `HairlineFooter.tsx` (`updateLinkHref`),
      writing `href` via `handleCollectionUpdate`. Section dropdown from store `sections`.
- [x] 3c. `autoMapLinkHrefs()` in `parseCopy.ts`, called in `generate-copy/route.ts` (live + mock
      paths) after `processProductCopy` with `Set(Object.keys(uiblocks))`. Map:
      pricing/features/faq/testimonials(reviews)/contact/about; only when the section exists and
      href is unset.
- `npm run build` ✅ passes. Pending: manual verify on dev + published page.

### Phase 3 follow-up (retest fixes)  ✅ DONE
- Bug A (#1): header/footer link gear was near-invisible (`--bone-3` @0.6) — bumped to `--bone-2`,
  opacity 1, accent on hover, icon 14px. (Auto-link is generation-time only; existing pages = manual.)
- Bug B (#2): preview rendered links as `MeridianEditable` spans (dead). Now `mode !== 'edit'`
  renders real `<a href>` in `MeridianNavHeader` + `HairlineFooter` (mirrors published) → section
  anchors + external URLs navigate in preview. Added `scroll-margin-top:80px` to section wrappers
  (both renderers) so jumps clear the sticky header. `npm run build` ✅.

## Deferred / follow-up
- #2 editable hero terminal — defer.
- Service parity: Hearth/Lex (WarmNavHeader, ContactFooterRich) share the dead-link problem; 3a
  fixes anchors for free, 3b/3c are Meridian-only this round — service follow-up later.

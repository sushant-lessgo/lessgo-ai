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
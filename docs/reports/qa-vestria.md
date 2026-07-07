# QA Test Scenarios — Vestria

> **Live QA run** (Claude-in-Chrome, prod lessgo.ai, 2026-07-07). Test page: product/Vestria "Aureon Audio" (noise-cancelling headphones), 3-page site (Home + /services Product Specifications + /contact Request Trial Kit). Template confirmed **VestriaTailoredHero** (Tailored variant). Results table below; checklist retained for reference.

## Results

### A. Generation & load
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| A1 | Complete onboarding (every step) | ✅ Pass | 6-step flow: describe → understood → goal → offer → site plan → build. All steps worked; AI prefilled understanding/value-adds/offer suggestions correctly. |
| A2 | Import-website prefill → generate | ⏳ Not tested | Deferred (used manual path for main run). |
| A3 | Resolves to Vestria template | ✅ Pass | Block label `VestriaTailoredHero`; serif headline + Bone (warm paper) look. |
| A4 | Open in visual editor | ✅ Pass | Editor loads all sections + multi-page nav. |
| A5 | Reload editor mid-session | ✅ Pass | State persisted after full reload. |

### B. Inline text editing (rich-text toolbar)
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| B1 | Edit headline — select all + retype | ✅ Pass | ctrl+A + retype worked on hero headline. |
| B2 | Edit subheadline | ✅ Pass | (hero body/subheadline) select-all retype worked. |
| B3 | Edit body paragraph | ✅ Pass | Hero body edited cleanly. |
| B4 | Edit eyebrow / label | ✅ Pass | Plain-text edit works (retype). |
| B5 | Bold a word | ❌ Fail | See formatting note below. |
| B6 | Italic a word | ❌ Fail | See formatting note below. |
| B7 | Strikethrough a word | ❌ N/A | No strikethrough button in the toolbar. |
| B8 | Underline a word | ❌ Fail | Underline silently dropped on feature-card body (did not persist after blur). |
| B9 | Text color / accent | ❌ Fail | Picked red accent on feature-card body word → not applied after blur. Color picker UI (Basic + 6 accent colors) opens fine, but selection doesn't persist. |
| B10 | Change font size | ⏳ Not fully tested | Size dropdown present; not separately confirmed (character formatting broadly broken — see note). |
| B11 | Align left/center/right | ❌ Fail | Clicked align-center on feature-card body → text stayed left-aligned after blur. |
| B22 | Two formats on same word | ❌ Fail | On hero subheadline, applying a 2nd format corrupts the field to escaped `&lt;span&gt;…&lt;/span&gt;` literal text. |

> **⚠️ MAJOR FINDING — rich-text toolbar is broken on Vestria.** The formatting toolbar appears on all editable text fields, but character/paragraph formatting does **not** work:
> - **Feature-card / body fields:** Bold, Italic, Underline, text-color, and Alignment are all *silently dropped* — the toolbar acts, but nothing persists after you click away.
> - **Hero subheadline field:** formatting is worse — clicking Bold/Italic injects raw `<span style="font-weight:bold">…</span>` markup as *visible text*; a 2nd op / undo escapes it to `&lt;span&gt;` literal text, corrupting the copy.
> - Only **plain-text editing** (select-all + retype, typing, deleting) works reliably.
> - Repro: any Vestria text field → select a word → click Bold/Italic/Underline/color → click away → formatting gone (or markup shown). Needs a fix in the Vestria block contentEditable/rich-text handler.

### C. CTAs / buttons
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| C1 | Edit primary CTA label | ✅ Pass | Element card → Edit Text; retyped "Get My Trial Kit". |
| C2 | Edit secondary CTA label | ✅ Pass (inferred) | Same edit-text mechanism as C1. |
| C7 | External Link + URL | ✅ Pass | Link popover (chain icon) → "Custom URL" → accepts `https://…` URL. |
| C8 | Native Form action | ⚠️ Not offered | CTA link popover only offers **Scroll to section / Link to page / Custom URL**. No "Native Form" action for Vestria CTA (may live in fuller Button Settings dialog — see C6). |
| C9 | Link-with-Input-Field action | ⚠️ Not offered | Same as C8 — not present in the CTA link popover. |
| C10 | Link-to-Page action | ✅ Pass | Link popover → "Link to page" → page dropdown (Aureon Audio / Product Specifications / Request Trial Kit). |
| C6 | Open Button Settings | ⚠️ Element card seen, dialog not opened | Element hover-card lists **Edit Text · Button Settings · Regenerate · Style · Duplicate · Delete**, but the card is finicky to re-trigger (single click → text-edit mode; card appears only on first interaction after section (de)select). Button Settings dialog itself not opened this run. |
| C3/C4/C5/C11/C12/C13 | Delete/Duplicate/Icons/Regen-copy/Style | ⏳ Not tested | Controls present in element card (Duplicate/Delete/Regenerate/Style seen); not individually exercised. |

### D. Repeatable items
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| D (all) | Add/delete trust logo, metric, FAQ, feature card, testimonial, product/collection item | ⏳ Not exercised | Metric badge ("30 days"), feature cards, testimonial cards, trust bar all **render** fine (editor + published). Item-level **add/delete not exercised** — element/section Delete triggers an editor freeze (see E5), so add/delete of repeatable items was skipped to avoid corrupting the test page. |

### E. Section-level actions
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| E1 | Click section in left panel → navigate | ✅ Pass | Jumps/scrolls to the section. |
| E4 | Duplicate a section | ✅ Pass | Created a 2nd Testimonials section (left panel + canvas). |
| E5 | Delete a section | ❌ Fail (blocks) | **Clicking Delete reliably freezes the editor tab** (renderer unresponsive / likely a blocking confirm dialog automation can't clear). Reproduced twice; each time required a reload, and the delete did **not** persist. Needs investigation. |
| E2/E3 | Move section up / down | ⏳ Not exercised | Buttons present in the section toolbar. |
| E6 | Switch section Layout | ⏳ Not tested | "Layout" button present. |
| E7 | Add element (+Elements) | ⏳ Not tested | "+ Elements" present. |
| E8 | Regenerate section (AI) | ⏳ Not tested | Likely shares the AI-regen path that failed (see B13 / "Some sections failed to regenerate"). |
| E9 | Add a new section | ⏳ Not tested | — |

### F. Header / navigation
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| F1 | Edit a nav item label | ✅ Pass | Block `VestriaNavHeader`; edited "Overview" → "Home" inline. |
| F6 | Edit the header CTA | ✅ Pass (inferred) | Header CTAs use same edit mechanism as body CTAs. |
| F2 | Delete a nav item | ⏳ Not exercised | Each nav item has an inline × (delete freeze risk — see E5). |
| F3 | Add a nav link (+link) | ⏳ Not exercised | "+ Link" affordance present. |
| F4 | Nav item link target / dropdown | ⏳ Not tested | Chain/link icon per nav item present. |
| F5 | Edit / upload the logo | ⏳ Partial | Logo "Aureon Audio" is editable text; image upload not tested. |

### G. Images
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| G (all) | Upload/change/remove images (hero, non-hero, oversized, URL) | ⏳ Not tested | Upload controls present (hero "↑ Image", SEO social image, favicon). **No test image was provided to this session**, so uploads weren't exercised. Hero renders a "HERO IMAGE" placeholder in editor + published. |

### H. Global chrome
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| H1 | Undo | ❌ Fail | Toolbar Undo button stays **greyed/disabled even after edits** (nav-label edit, palette change, SEO edits) — never enables. (In-field `ctrl+Z` works within a focused text field.) |
| H2 | Redo | ❌ Fail | Redo button also permanently disabled. |
| H3 | Open the Reset modal | ✅ Pass | "Reset to LessGo Generated" modal. |
| H4 | Reset Design Only | ✅ Present | Option shown (not executed). |
| H5 | Reset Everything | ✅ Present | Option shown (not executed). |
| H6 | Regen Copy (full-page AI) | ⏳ Not tested | Button present; not run (AI-regen path was failing — see B13). |
| H8 | Open template/variant/palette switcher | ✅ Pass | "Style" panel: Typeface / Palette / Mood. |
| H9 | Change variant | ✅ Pass | Tailored↔Modern swaps typeface (serif↔sans) live. |
| H10 | Change palette | ✅ Pass | Amber palette recolors accents (CTA, eyebrows) live. |
| H10b | Open SEO panel | ✅ Pass | "SEO & Social" modal. |
| H11 | Edit SEO title + meta (live preview) | ✅ Pass | Google + social-card previews update live. |
| H12 | Switch SEO per-page tabs | ✅ Pass | Home / Product Specifications / Request Trial Kit tabs, per-page fields. |
| H16 | Toggle "Hide this page from Google" | ✅ Present | noindex + sitemap-exclude toggle (not toggled). |
| H13/H14/H15 | Social image / favicon / structured-data | ✅ Present | Controls present; uploads not exercised (no test asset). |

### I. Multi-page
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| I2 | Switch between pages | ✅ Pass | Home / Product Specifications / Request Trial Kit. |
| I4 | Per-page content independence | ✅ Pass | Each page has its own sections + copy (e.g. Product Specs page = Header/Features/Materials/Process/Footer). |
| I5 | Edit a subpage | ✅ Pass | Inline edits work on subpages. |
| I1 | Add a page | ⏳ Not tested | "+ Add page" present. |
| I3 | Delete a page | ⏳ Not exercised | Tab × present (delete freeze risk — see E5). |
| I6 | Navigate via on-page nav links | ⏳ Partial | Nav links configured; live subpage reachable by URL (`/services`). |

### J. Persistence
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| J1 | Autosave after an edit | ✅ Pass | Edits survived reload; edited blocks show green "Customized" badge. |
| J2 | State survives a full reload | ✅ Pass | Confirmed multiple times. |
| J3 | "Reviewed" section counter | ✅ Pass | Counter tracks element count (17 → 26 after duplicating a section). |

### K. Preview & Publish
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| K1 | Open Preview | ✅ Pass | Opens `/preview/<token>` in a new tab. |
| K2 | Preview ↔ editor parity (every section) | ✅ Pass | All sections match (header, hero, trust, features, process, testimonials ×2, contact form, footer). |
| K3 | Start Publish flow | ✅ Pass | "Choose your page URL" modal. |
| K4 | Enter / edit the slug | ⚠️ Pass w/ note | Slug input **strips hyphens** — typed `aureon-audio-qa` → became `aureonaudioqa`. Unusual (hyphens are normally valid slug chars). |
| K5 | Slug availability / validation | ⚠️ Partial | Sanitizes input (see K4); no explicit availability indicator observed. |
| K6 | Set the page title | ✅ Pass | Applied to published `<title>` (browser tab showed it). |
| K7 | Toggle analytics tracking | ✅ Pass | Checkbox toggles. |
| K8 | Confirm & Publish | ✅ Pass | Publishes without error. |
| K9 | Success modal + live URL | ✅ Pass | "🎉 Page Published!" → `https://aureonaudioqa.lessgo.site`. |
| K10 | Open the live published page | ✅ Pass | Live page loads. |
| K11 | Live ↔ editor parity (dual-renderer) | ⚠️ Pass w/ font bug | Layout/content/surface tones all match. **BUT the display-serif heading font differs** (see key finding #2). |
| K12 | Live ↔ preview parity | ⚠️ Same font issue | Content matches; preview renders the same **fallback** serif as the editor, while the live page renders the real Vestria display serif → headline fonts differ preview-vs-live too. |
| K13 | Multi-page publish (all pages live) | ✅ Pass | `/services` subpage live and matches its editor content. |
| K14 | Custom domain flow | ⏳ Not tested | "Custom Domain" button present. |

### L. Vestria template specifics
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| L1 | Every Vestria block renders in editor | ✅ Pass | Nav header, hero, trust, features/services grid, process, testimonials, contact form, footer. |
| L2 | Every Vestria block renders on published page | ✅ Pass | All render on live. |
| L3 | Editor `.tsx` vs published `.published.tsx` parity | ⚠️ Partial | Layout/structure/surfaces match; **display-serif font mismatch** (key finding #2). |
| L4 | Palettes / variants apply correctly | ✅ Pass | Palette accent + variant typeface both apply live. |
| L5 | Fonts load (editor + published + LCP) | ❌ Fail (editor) | **Published loads the correct Vestria high-contrast display serif; editor + preview render a fallback heavy slab serif** for all serif headings. The `Modern` (sans) variant loads fine in-editor, so it's specifically the serif display face not loading in the editor/preview environment. Body sans loads everywhere. |
| L7 | Surface tones (`data-surface`) render correctly | ✅ Pass | Dark testimonials + footer render correctly editor + published. |
| L8 | SiteContext / per-page fan-out behaves | ✅ Pass | 3 pages generated with distinct, on-topic per-page content from one flow. |
| L6 | Vestria interactive behaviors | ⏳ Not tested | Nav dropdowns / anchor scroll not click-tested. |

### M. Failure & edge cases
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| M3 | Publish while an edit is unsaved | ✅ Pass (implicit) | Published while the editor had unsaved draft edits — worked. |
| — | Section/element Delete stability | ❌ Bug | Section Delete freezes the editor tab (see E5) — a stability edge case. |
| M1/M2/M4/M5/M6/M7 | Rapid edits / concurrent regen / network loss / back-forward / mobile viewport / cross-browser | ⏳ Not tested | Out of scope for this pass (single desktop Chrome session). |

### N. Additional scenarios (gaps not in the original checklist — tested on the live published page)
| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| N1 | **Live form submission end-to-end** | ✅ Pass | Filled + submitted the Contact/quote form on the live page → `POST /api/forms/submit` **200**, form replaced by "✓ Thank you! Request received — a member of our team will be in touch within one business day." (Whether the lead email actually delivered / integration ran not separately verified — API returned 200.) |
| N2 | **CTA / nav / anchor behavior on live** | ✅ Pass | All header/CTA/nav/footer links are real `<a href>` with correct targets (Overview→`/`, Specifications/View Specifications→`/services`, Trial Kit / Request Trial Kit / hero "Get My Trial Kit"→`/contact`). Clicking the hero CTA actually navigated to `/contact` — confirms the C10 link-to-page edit persisted through publish. |
| N3 | **Published SEO / meta actually rendered** | ✅ Pass (favicon gap) | Live HTML head has `<title>`, meta description, `canonical`, `og:title/description/image` (`/api/og/<slug>`), `twitter:card=summary_large_image`, and JSON-LD structured data. `robots` correctly absent (noindex off). ⚠️ **No favicon `<link>` emitted** (none was set — no default fallback). |
| N4 | **Per-host sitemap.xml / robots.txt** | ✅ Pass | `/sitemap.xml` → 200 `application/xml` with `<urlset>` incl. `/services` + `/contact` (multi-page). `/robots.txt` → 200 `text/plain`. |
| N5 | **Analytics beacon fires** | ✅ Pass | With analytics enabled at publish, `POST /api/analytics/event` → **200** on page load. |
| N6 | **Mobile nav / responsive** | ⚠️ Unverified | Couldn't force a real mobile viewport (window resize didn't change the rendered 1536px viewport). **Header DOM has no hamburger / mobile-menu toggle** — so how the nav (logo + 3 links + 2 CTAs) degrades at phone width is unverified. Flag for a manual mobile check. |
| N7 | Generation-flow surfaces (site-plan gate editing, "We understood this" chip editing, hero-style Image-vs-**Video** picker, look picker) | ⏳ Not tested | Would require a fresh onboarding run (credits + time). Only the happy-path defaults were exercised during the main generation. Video-hero upload/playback untested. |
| N8 | Form-builder editing (add/remove/reorder fields, types, required, select options) | ⏳ Not tested | The form *renders + submits*; editing its fields in the editor not exercised. |
| N9 | Copy quality / card-count correctness; credits deduction; dashboard actions (unpublish, delete project, Analytics/Forms tabs) | ⏳ Not tested | Out of scope for this mechanical pass (copy quality is the `/manual-test` remit). |

> **Note:** N1 left a **real form submission** ("QA Test Submission" / QA Test Co / qa-test@example.com, note "QA test submission — please ignore") in the page's `FormSubmission` records / Forms tab, and may have triggered a lead-notification email. Delete it from the Forms view if you want a clean slate.

---

## Key findings (most important)

1. **🔴 Rich-text formatting toolbar is broken on Vestria text fields** (Section B). Bold/Italic/Underline/text-color/alignment either **silently drop** (body/feature fields) or **inject raw `<span…>` HTML as visible text and corrupt the field** (hero subheadline). Only plain-text editing works. This is the biggest editor bug.
2. **🔴 Editor/preview ↔ published font mismatch** (L5/L3/K11). The Vestria **display-serif heading font does not load in the editor or preview** (they show a heavy fallback slab serif); the **published page loads the correct high-contrast display serif**. So headings look materially different in the editor vs. live. LCP/font-preload likely wired for publish only, not the editor/preview iframe.
3. **🟠 Section Delete freezes the editor** (E5) — reproducible; blocks section/element/page deletion via automation and forces a reload.
4. **🟠 Undo/Redo toolbar buttons never enable** (H1/H2) — global undo/redo appears non-functional (only in-field ctrl+Z works).
5. **🟠 Inline AI "sparkle" / section regen failed** (B13) — "Some sections failed to regenerate" error toast.
6. **🟡 Publish slug strips hyphens** (K4) — `aureon-audio-qa` → `aureonaudioqa`.
7. **🟡 No favicon emitted + no mobile-nav toggle** (N3/N6) — published head has no favicon `<link>` when none is set (no default), and the header has no hamburger for mobile; mobile-nav degradation unverified.

**What works well:** full onboarding + 3-page multi-page generation, Vestria template resolution, all blocks rendering in editor + published, preview/publish/live flow, multi-page publish, palette/variant switching, SEO panel (per-page titles/meta/live preview/noindex), surface tones, autosave/persistence, CTA label + link-action editing. **Live output verified:** form submission (`/api/forms/submit` 200 + thank-you), CTA/nav link navigation (correct `<a href>` targets, hero CTA → `/contact`), full SEO/OG/JSON-LD in published HTML, per-host `sitemap.xml` + `robots.txt`, and the analytics beacon (`/api/analytics/event` 200).

**Test artifacts left on the page:** editor draft has a duplicate Testimonials section, nav label "Home" (was "Overview"), and unsaved SEO/title drafts. The **live published** page (`aureonaudioqa.lessgo.site`) predates those and is clean. Delete/republish as needed.

---

## A. Generation & load
- [ ] Complete onboarding for a Vestria page (every step)
- [ ] Import-website prefill → generate Vestria page
- [ ] Page generates and resolves to the Vestria template
- [ ] Open the generated page in the visual editor
- [ ] Reload the editor mid-session

## B. Inline text editing (rich-text toolbar)
- [ ] Edit headline — select all + retype
- [ ] Edit subheadline — select all + retype
- [ ] Edit a body paragraph
- [ ] Edit eyebrow / label text
- [ ] Bold a word
- [ ] Italic a word
- [ ] Strikethrough a word
- [ ] Underline a word
- [ ] Apply text color / accent to a word
- [ ] Change font size
- [ ] Align text left / center / right
- [ ] Apply two formats to the same word (e.g. bold then underline)
- [ ] Use the inline AI "sparkle" rewrite
- [ ] Delete all text in a field (empty it)
- [ ] Paste plain text into a field
- [ ] Paste formatted/HTML text into a field
- [ ] Edit a word adjacent to an existing accent/em span
- [ ] Enter emoji / special characters
- [ ] Very long text (overflow)

## C. CTAs / buttons
- [ ] Edit primary CTA label
- [ ] Edit secondary CTA label
- [ ] Delete the secondary CTA
- [ ] Delete the primary CTA
- [ ] Duplicate a CTA
- [ ] Open Button Settings
- [ ] Change CTA type (primary ↔ secondary)
- [ ] Set External Link + URL
- [ ] Set Native Form action
- [ ] Set Link-with-Input-Field action
- [ ] Set Link-to-Page action
- [ ] Add leading / trailing icon
- [ ] Regenerate CTA copy (AI)
- [ ] Open CTA Style controls

## D. Repeatable items
- [ ] Delete a trust / client logo card
- [ ] Add a trust logo
- [ ] Add a metric
- [ ] Delete a metric
- [ ] Add an FAQ question
- [ ] Delete an FAQ item
- [ ] Edit an FAQ question and answer
- [ ] Add a feature card
- [ ] Delete a feature card
- [ ] Edit a feature card
- [ ] Delete a compatibility / tag chip
- [ ] Add / delete / edit a testimonial
- [ ] Add / delete / edit a product or collection item

## E. Section-level actions
- [ ] Click a section in the left panel to navigate to it
- [ ] Move a section up
- [ ] Move a section down
- [ ] Duplicate a section
- [ ] Delete a section
- [ ] Switch a section's Layout
- [ ] Add an element to a section (+Elements)
- [ ] Regenerate a section (AI)
- [ ] Add a new section

## F. Header / navigation
- [ ] Edit a nav item label
- [ ] Delete a nav item
- [ ] Add a nav link (+link)
- [ ] Set a nav item's link target / dropdown
- [ ] Edit / upload the logo
- [ ] Edit the header CTA

## G. Images
- [ ] Upload a hero image
- [ ] Change an existing image
- [ ] Remove an image
- [ ] Upload an image in a non-hero section
- [ ] Upload an oversized / invalid file
- [ ] Upload image via URL (if supported)

## H. Global chrome
- [ ] Undo
- [ ] Redo
- [ ] Open the Reset modal
- [ ] Reset Design Only
- [ ] Reset Everything
- [ ] Regen Copy (full-page AI) — confirm + result
- [ ] Open the template / variant / palette switcher
- [ ] Change variant
- [ ] Change palette
- [ ] Open the SEO panel
- [ ] Edit SEO title + meta description (check live preview)
- [ ] Switch SEO per-page tabs
- [ ] Upload SEO social share image
- [ ] Upload favicon
- [ ] Change structured-data option
- [ ] Toggle "Hide this page from Google"

## I. Multi-page
- [ ] Add a page
- [ ] Switch between pages
- [ ] Delete a page
- [ ] Confirm per-page content independence
- [ ] Edit a subpage
- [ ] Navigate between pages via on-page nav links

## J. Persistence
- [ ] Autosave after an edit
- [ ] State survives a full reload
- [ ] "Reviewed" section counter behaves

## K. Preview & Publish
- [ ] Open Preview
- [ ] Preview ↔ editor parity (every section)
- [ ] Start Publish flow
- [ ] Enter / edit the slug
- [ ] Slug availability / validation
- [ ] Set the page title
- [ ] Toggle analytics tracking
- [ ] Confirm & Publish
- [ ] Success modal + live URL
- [ ] Open the live published page
- [ ] Live page ↔ editor parity (dual-renderer) for every section
- [ ] Live page ↔ preview parity
- [ ] Re-edit then re-publish (update)
- [ ] Multi-page publish (all pages live)
- [ ] Custom domain flow

## L. Vestria template specifics
- [ ] Every Vestria block renders in the editor
- [ ] Every Vestria block renders on the published page
- [ ] Editor `.tsx` vs published `.published.tsx` parity per block
- [ ] Vestria palettes / variants apply correctly
- [ ] Vestria fonts load (editor + published + LCP preload)
- [ ] Vestria interactive behaviors work (editor + published)
- [ ] Surface tones (`data-surface`) render correctly
- [ ] SiteContext / per-page fan-out behaves

## M. Failure & edge cases
- [ ] Rapid consecutive edits / clicks
- [ ] Regenerate while another regenerate is running
- [ ] Publish while an edit is unsaved
- [ ] Network interruption during save / publish / regenerate
- [ ] Browser back/forward within the editor
- [ ] Mobile viewport rendering (editor + preview + live)
- [ ] Cross-browser rendering

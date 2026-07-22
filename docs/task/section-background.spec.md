---
tier: full
tier-why: dual-renderer blocks (`.core.tsx` + both wrappers) + published static-export output + a shared app toolbar (`SectionToolbar`) consumed by every template + editor-store token surface. Any of these alone forces full.
---

# section-background — spec

## Problem / why

Three separate gaps, one surface:

1. **No section background control.** `SectionToolbar`'s `background` action has shipped as a
   disabled placeholder since phase 3.5 (`SectionToolbar.tsx:333-341`,
   *"Section backgrounds are coming with the design system"*). Multiple customers have now asked
   for colour control over sections. Its recorded blocker (`SectionToolbar.tsx:329` — *"`data-surface`
   is derived … with NO per-section override argument"* + *"none of the 8 served templates' blocks
   consume `var(--u-bg)`"*) is **stale on both counts** — see Constraints.

2. **Hero slideshow is unreachable by hand.** `work-contract-wave2` shipped the multi-slide hero
   renderer, but slide count is only ever set by the first-gen auto-derive (`stampHeroSlides`).
   The editor exposes per-slide *replace* and nothing else — no add, no remove, no reorder
   (documented deferred fast-follow, `work-contract-wave2.audit.md:521`). A user who wants a
   slideshow, or wants a different number of slides, cannot get one.

3. **A work customer can't find their own portfolio from the editor.** `cms-collections` required a
   cross-link so the works board and the CMS board *"read as one system, not a silent omission"*
   (`cms-collections.plan.md:746`). That shipped on the dashboard board
   (`CmsBoardClient.tsx:374-381`) and was missed on the editor rail — `CmsPanel.tsx` has zero works
   awareness. And the same system is labelled **"CMS"** in the editor rail but **"Content"** in the
   dashboard.

## Goal

A single Background control on the section toolbar that lets a user set what sits behind a section —
a colour the template already designed, or an image, or several images that become a slideshow —
without exposing a single technical knob and without any way to land on an unreadable result.
Ships on the work skeleton first. Folds in the two editor gaps above because they sit in the same
surface and are each a few lines.

## Scope IN

### A. Background control (work skeleton / `atelier` only)

Un-defer the `background` toolbar action. **Exactly three types**, per designer handoff §3·a:

| Type | Behaviour |
|---|---|
| **Color** | Pick one of the template's **own surfaces**. Not a picker. Work skeleton = `paper · paper-2 · dark · accent`. Contrast-safe by construction — `[data-surface]` paints background, foreground and hairlines together, so an unreadable pairing is unreachable. |
| **Image** | Media picker + an **always-visible** "Add image" slot hinting *"Add more to make a slideshow"*. |
| **Video** | **Greyed chip + why-tooltip.** `WorkHeroVideo` is a declared-but-NOT-built slot with no component (`resolveWorkBlock.ts` hero variants). Nothing behind it. |

**Slideshow is not a fourth type** — it is emergent from image count, matching the renderer's
existing fork (`WorkHeroSlider.core.tsx:61`, `slides.length >= 2`). At 2+ the Background chip reads
`Slideshow · N` so the state stays legible without a menu entry.

**Section → type mapping:** `hero` gets all three. **Every other section gets Color only.**

### B. Slides tray (the 2+ state of Image)

Same panel, grown — not a separate surface:

- Docked to the section, **not modal** (you judge crops against the surrounding layout).
- Horizontal **filmstrip**; **drag to reorder = play order**; numbered `01/02/03`.
- Per-card: **replace** (→ `MediaPickerModal`) and **delete**.
- Click a thumbnail → canvas **previews** that slide. **Preview only** (see Scope OUT).
- Cap 6 (already the contract constraint, `workSections.ts:189`).

### C. Mode resolution

Two axes, deliberately treated differently:

| Axis | Treatment | Why |
|---|---|---|
| Color ↔ Image ↔ Video | **STORED** — `styleTokens[sectionId].bgMode` | switching types is a visual experiment; it must be lossless. Deriving would mean "pick Color" destroys the user's images — and since generation stamps `portrait_image`/`slides` on every hero, that destructive path would be the **default** path, not an edge case. |
| Image ↔ Slideshow | **DERIVED** from count | the count *is* the meaning; matches the renderer's existing fork; no redundant field |

**Invariant: `slides` is either empty or ≥2 — never exactly 1.**
- Image mode writes scalar `portrait_image` (unchanged → existing drafts byte-identical).
- Adding a 2nd image **promotes**: `slides = [{portrait_image}, {new}]`.
- Deleting back to one **demotes**: survivor → `portrait_image`, clear `slides`.
- Without the demote rule, dropping to 1 slide falls into the `<2` branch and renders whatever
  stale `portrait_image` was left behind — possibly an image the user just deleted.

`bgMode` is optional with a graceful default: **absent → derive from data** (= today's exact
behaviour), so existing drafts and frozen fixtures are untouched.

### D. Folded-in editor gaps

- **`worksRow` into `CmsPanel`** — port the deep-link row from `CmsBoardClient.tsx:374-381`
  (`data-testid="cms-works-link"`, same `hasWorkLibrary` gate) into the editor rail's CMS panel.
- **Rail tab label "CMS" → "Content"** (`LeftPanel.tsx:140`) to match the dashboard tab.
  **Label only** — the tab `value`, `RailTab` type and `LIVE_RAIL_TABS` stay `'cms'` so the
  `lessgo:manage-collections` event plumbing is untouched.

## Scope OUT (non-goals)

Founder rulings — **do not reintroduce**, they are in the designer handoff but explicitly cut:

- **Autoplay toggle · Interval · Transition.** Users are not technical; hardcode best practice.
  Current defaults are already right (`SLIDER_INTERVAL_MS = 5000`;
  `.wk-hero__slide{transition:opacity .8s ease}`). This is *also* what keeps `work.v1.js` immutable.
- **Crop** and **focal point.** Neither exists anywhere; `slides` is `{id, image}` only.
- **Per-slide overlay text.** The handoff says *"hero text/overlay then targets it."* Hero copy is
  ONE set today (`role_line`/`name`/`quote`/CTAs) above all slides; per-slide copy forks the entire
  hero element contract and changes what the copy engine generates. Thumbnail click = preview only.
- **Video implementation.** Greyed chip only.
- **Backfill / re-stamp of pre-wave-2 drafts.** Founder ruled not needed. Existing drafts get the
  control, not retroactive slides.
- **The other 8 templates.** They keep today's greyed `background` placeholder, unchanged — no
  regression, no lie. Expansion is a later spec.
- **Raw hex / brand palette.** Designer ruling (`docs/temp/message.md`): *"a raw hex picker is the
  Wix move."* Accent is set once in the top-bar Design menu; per-site brand palettes are post-beta.
- **Derived tints/shades** of surfaces (handoff asks for 4–8 chips; the enum gives 2–4). Fewer chips
  is the accepted trade — it is what keeps contrast guaranteed for free.

## Constraints

- **`data-surface` is the mechanism, NOT `--u-bg`.** `--u-bg` sets background without foreground →
  contrast breakage. It has **0 refs** across all 8 served templates (only the work skeleton uses
  it). `[data-surface]` already carries the whole band. The `SectionToolbar.tsx:329` comment
  asserting otherwise is stale and should be corrected in place.
- **The override argument already exists.** `getSurfaceForSection(sectionType, overrides?)`
  (`sectionRules.ts:55`). What is missing: all three renderer call sites pass one argument —
  `EditablePageRenderer.tsx:80`, `LandingPageRenderer.tsx:523`,
  `LandingPagePublishedRenderer.tsx:156`.
- ⚠️ **Key-space trap.** The existing `overrides` param is keyed by section **TYPE** (a *skin*
  selection). A user override must be keyed by section **ID**, or every hero on every page changes
  together. This looks correct on a one-page site and breaks on multi-page — it will not be caught
  by a single-page test.
- **Dual-renderer law.** Layout lives once in `.core.tsx`; both wrappers must stay in parity.
  `MediaPickerModal` is `'use client'` and must never reach the published path
  (`editPrimitives.tsx:214` documents the existing guard).
- **`work.v1.js` is immutable.** Any semantic change to a shipped script demands a NEW filename
  (`scripts/buildAssets.js` contract). Nothing in this spec may touch it — the slider hooks
  (`.wk-hero__slide`/`.is-active`, `[data-wk-prev]`/`[data-wk-next]`, `[data-wk-dots]`,
  `[data-wk-interval]`) are frozen and must be emitted verbatim.
- **Existing drafts byte-identical** until the user changes something. The core is explicit:
  *"do NOT rewrap the single portrait in `.wk-hero__slide`"* (`WorkHeroSlider.core.tsx:60`).
- **Published output changes** → parity + republish path in scope for QA.
- **Surface labels are generic for v1** ("Paper / Subtle / Ink / Accent" style). Per-template
  naming + swatches is a designer round-trip, deliberately not blocking this build.

## References

- **Designer handoff §3·a** — `docs/Design/Lessgo AI UI redesign/design_handoff_lessgo_app/Lessgo Editor Redesign.dc.html`
  (updated 2026-07-22), anchor `#t3a`. Take: the three-type menu, the chip reading `Slideshow · N`,
  State A / State B panel growth, the always-visible Add-image slot, and the "Avoid the Wix trap"
  guardrail. **Ignore** its settings row, crop/focal actions, Video panel internals, and the
  overlay-targeting sentence.
- **Designer colour ruling** — `docs/temp/message.md` (palette-first, theme roles not raw values).
- `src/modules/skeletons/work/sectionRules.ts` — surface vocabulary + `getSurfaceForSection`.
- `src/modules/skeletons/work/tokenContract.ts:266` — the `[data-surface]` band rules.
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` — the count fork (`:61`), the
  byte-identical rule (`:60`), the frozen JS hooks (`:17-24`), `portrait_image` (`:91`).
- `src/modules/skeletons/work/blocks/editPrimitives.tsx` — `Img` → `MediaPickerModal` (`:187`),
  `List` add/remove via `updateCollection` (`:261-265`).
- `src/modules/skeletons/work/blocks/Header/WorkHeader.core.tsx:70` — **the storage precedent**: a
  stored design-state lever read from `styleTokens[sectionId]`, threaded to both renderers.
- `src/components/editor/SocialItemsEditor.tsx` — the t5 manage-items chrome precedent (add /
  remove / reorder / cap / `data-testid` hooks). Take the chrome, not the vertical-list shape.
- `src/components/dashboard/cms/CmsBoardClient.tsx:374-381` — the `worksRow` to port.
- `src/components/dashboard/WorkspaceTabs.tsx:20-29` — the standing discoverability rule
  (*"a tab that silently appears later is a capability the user never learns they have"*), which is
  why Add-image must be persistently visible rather than hover-revealed.

## Open exploration questions

- Where exactly do per-section `styleTokens` land today, and are they already threaded through the
  static export (work-skeleton D1 claims AC-L123 — verify)?
- What is the safest way to add an **id-keyed** user override alongside the existing **type-keyed**
  skin override without conflating the two key spaces?
- Does the top-bar Design menu currently expose accent for work-engine templates (the "Accent"
  surface chip depends on it)?
- Which drag-and-drop primitive should the filmstrip use — `@dnd-kit` is already a dependency; is
  there an existing reorder pattern in the editor to copy?
- Does `SectionToolbar`'s action-gating need a new mechanism to express "hero only", or can it reuse
  the existing `FOOTER_ONLY_ACTIONS`-style filter? (Note: gate on work-engine hero, **not** on
  template id, or the action leaks onto meridian/techpremium heroes.)
- Is there an existing confirm/undo pattern for destructive editor actions worth matching for
  slide delete?

## Candidate human gates

- **Founder visual sign-off** on the surface chips rendered against a real Kundius draft — colour
  choices are taste, not correctness.
- **Published parity QA** (`e2e/parity.spec.ts`) after the surface override lands — the band budget
  is <3%, and this changes published HTML.
- **Multi-page check** that a surface override on one page's hero does **not** move another page's
  hero (the key-space trap above).
- **Existing-draft byte-identity check** on Kundius before merge (`kundiusPages` /
  `oldContentFallback` tripwires must stay green untouched).
- Merge to main + push (standard human gate).

## Acceptance criteria

- [ ] `background` action is enabled on work-skeleton sections; still greyed on all other templates.
- [ ] Hero offers Color · Image · Video(greyed, with why-tooltip). Every non-hero section offers
      Color only.
- [ ] Color chips list the template's own surfaces (`paper · paper-2 · dark · accent`), and picking
      one changes the section's band in **both** the editor and the published page.
- [ ] No surface choice can produce an unreadable text/background pairing.
- [ ] A per-section override on one page's hero does **not** change another page's hero.
- [ ] Image mode: picker works, and an "Add image" slot is **always** visible with the
      slideshow hint.
- [ ] Adding a 2nd image promotes to the filmstrip; the chip reads `Slideshow · 2`.
- [ ] Filmstrip supports drag-reorder, replace, delete; order matches the published play order.
- [ ] Deleting down to one image demotes to a single image cleanly, with no stale image rendered.
- [ ] `slides` is never persisted with exactly 1 entry.
- [ ] Switching Color ↔ Image is lossless — no confirm dialog, images survive the round trip.
- [ ] No autoplay/interval/transition/crop/focal-point control appears anywhere.
- [ ] `work.v1.js` is byte-unchanged; `public/assets/` clean after `npm run build`.
- [ ] An untouched pre-existing draft (Kundius) renders byte-identically.
- [ ] Editor rail CMS panel shows the "Works library" deep-link row for works-capable projects.
- [ ] Editor rail tab reads "Content"; `lessgo:manage-collections` still switches to it.
- [ ] Gates green: `tsc --noEmit`, `test:run`, `lint`, `build`, `parity.spec.ts` all bands <3%.

## Pilot / smallest slice

**Slice 1 (the decision gate) — Colour only, hero only.**
Thread the id-keyed surface override through `getSurfaceForSection` + the three renderer call sites,
and ship the Background chip with the 4 Color surfaces on the work-skeleton hero. Nothing else.

This is the slice that proves the load-bearing unknowns: that the override reaches **both**
renderers and the static export, that the id-vs-type key space is right, that multi-page doesn't
bleed, and that published parity holds. It is also independently useful — it is the colour control
customers actually asked for.

**Gate:** founder eyeballs surfaces on a real Kundius draft + parity green + multi-page no-bleed.

Only then: Slice 2 = Image mode + promote/demote invariant; Slice 3 = filmstrip tray; Slice 4 =
the two folded-in editor gaps (independent of everything above — can land any time).

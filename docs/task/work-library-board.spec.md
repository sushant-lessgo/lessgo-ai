---
tier: full
tier-why: new dashboard surface + `works` collection/MediaAsset writes + display-by-reference means the gallery block renders a group reference in BOTH renderers (dual-renderer / published path) + a republish path — mandatory-full surfaces.
---

# work-library-board (§8a "Your work") — spec

## Problem / why
A work customer has no good way to manage their photos **after launch.** Today the only door is the
**page editor** — to add or reorganize a photo she must open the page and fiddle with the gallery
block. That's backwards (the editor is for *designing the page*, not *managing a collection*), and
it undercuts the "the portfolio stays alive after launch" promise. Kundius needs this to run her
site post-delivery — it's a chosen work-beta item.

This is the **missing "part 1"** of the CMS pattern (workEndtoEnd §8a). Parts 2+3 already exist:
**display-by-reference** and item-page plumbing are built (`src/modules/collections/`, scale-10 —
`works`/`products`/etc.), and the **testimonial dashboard board** is a working instance of exactly
this pattern (dashboard management → display-by-reference → republish). What's missing is the
**board** for work photos — build it and the same generic pattern later fixes Naayom's products.

## Goal
A project-scoped **"Your work"** dashboard board where a work customer manages their photos as a
library — grouped (Weddings/Portraits…), with add / hide / move-between-groups / reorder /
pick-cover — where **pages show a group by reference**, so a change in the board updates every page
showing that group on republish. Managed in the dashboard, never the page editor.

## Scope OUT (non-goals)
- **New-category → new-service → slot machinery (auto-generates price row / intro copy)** — DEFERRED.
  A new group is just a new gallery for beta; wiring it into the work copy engine is a fast-follow.
- **Category → page one-tap promotion** — DEFERRED (a group stays a gallery on existing pages).
- **Own-URL-per-item switch** — N/A for photos (OFF by design; the gallery is the unit, not the photo).
- **Generic products/case-studies board** — build **work-photos-first** (Kundius); generalize later
  (the Naayom-products win rides a fast-follow). Build cleanly enough to generalize, don't gold-plate.
- **New designer screen** — not needed; the visual is E2's onboarding grouping board (see Design source).
- A brand-new image pipeline — reuse the t7 MediaAsset pipeline.

## Constraints
- **Design source (no new mockup):** reuse **E2's onboarding grouping board UI** (§8a: "the same
  grouping board from onboarding — day 1 and forever, zero new learning") + the **testimonial
  dashboard board** pattern. Cite both; don't redesign.
- **Placement:** a **project-scoped** surface mirroring `dashboard/[token]/testimonials`, user-facing
  label **"Your work"** (buyer-words — never "collection"/"gallery"/internal terms).
- **Delete = HIDE, not destroy** — restorable; never lose her work.
- **New photos run the t7 image pipeline** (technical filter + speed: resize/modern-format/blur
  placeholder) — reuse, don't rebuild.
- **Display-by-reference:** the work gallery block renders a **group reference**, not an embedded
  photo list — in BOTH renderers (`.core.tsx` edit + published). Board edits reflect on **republish**
  (explicit "Update site", consistent with the publish model). Scout must confirm whether the atelier/
  work gallery already renders a group ref or needs wiring.
- Editor↔published parity holds for the gallery in both renderers.
- Owner-gated like every project surface (`assertProjectOwner` on the board's routes).
- Rides the big-bang batch. Re-green = tsc + test:run + build + lint.

## References
- **Testimonial board (the pattern to clone):** `src/app/dashboard/[token]/testimonials/page.tsx`,
  `src/components/dashboard/testimonials/{TestimonialModerationList,TestimonialFormDialog,FeatureOnPageDialog}.tsx`.
- **Collections plumbing (parts 2+3):** `src/modules/collections/registry.ts` (`works` key, item pages),
  `src/modules/collections/README.md`.
- **Photos:** `MediaAsset` model (`prisma/schema.prisma:285`) + the t7 media-library-picker pipeline.
- **The grouping UI to reuse:** E2 onboarding grouping board (`work-onboarding-ingestion`, merged
  `40e990e1`) — the visual cards + five verbs (rename/merge/drag/hide/cover).
- **The gallery block:** `src/modules/templates/atelier/blocks/Work/AtelierWorkGallery.core.tsx` +
  the work skeleton gallery — confirm/enable group-reference rendering.
- workEndtoEnd §8a (acceptance-criteria source).

## Open exploration questions (scout)
- Does the atelier/work gallery block ALREADY render a group reference, or embed photos? (Decides how
  much dual-renderer work — the tier hinge.)
- How do MediaAssets relate to the `works` collection + groups today — what's the grouping data model,
  and does E2 already persist groups the board can read?
- Exactly how the testimonial board does display-by-reference + republish — the seam to copy.
- Does republish already propagate a collection change to all pages showing the group?
- Is the E2 grouping component reusable as-is in a dashboard context, or onboarding-coupled?

## Candidate human gates
- **Founder pilot verify:** on Kundius's project — board shows her real groups, she adds/moves/hides a
  photo + picks a cover → republish → live gallery pages reflect it.
- Any change to the gallery **published rendering** (dual-renderer / publish path) — visual + parity sign-off.
- Deleting/hiding photos touches her real content — confirm hide-not-destroy actually preserves data.

## Acceptance criteria
- [ ] A project-scoped **"Your work"** board exists (mirrors the testimonials board), owner-gated.
- [ ] It shows the project's groups + photos using E2's grouping UI; **no page-editor door needed.**
- [ ] Operations work: add photo (t7 pipeline) · hide/remove (hide-not-destroy, restorable) · move
      photo between groups · reorder · pick cover.
- [ ] Pages render the gallery **by group reference** (both renderers); a board change reflects on the
      live pages after **republish**.
- [ ] Editor↔published parity holds for the gallery.
- [ ] Deferred items are NOT present (no auto copy-gen on new group, no page-promotion).
- [ ] tsc + test:run + build + lint green; tests cover the board CRUD + the group-reference render.

## Pilot / smallest slice
One project, the core loop end-to-end: **Kundius's groups** → board shows Weddings/Portraits + photos
→ add a photo (t7 pipeline) · move one between groups · pick a cover · hide one → **republish** → her
live gallery pages reflect the change. Full tier: scout (gallery group-ref state + grouping data model)
→ plan → plan-review → per-phase implement + impl-review. Decision gate = founder manages Kundius's
portfolio from the board and sees it land on the live site.

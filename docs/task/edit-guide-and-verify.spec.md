# edit-guide-and-verify — spec

## Problem / why
The edit screen's current "review" feature is one overloaded element-verification
checklist (`useReviewState`): a header pill (`X/Y reviewed`), a left-panel checklist
grouped by section, and inline canvas badges. It's confusing because it's built like a
QA scanner but was meant as a get-started guide. Concretely it:
- Words itself as passive QA ("reviewed") instead of actionable guidance.
- Dumps **every** flagged element into one long list (can be 15+) — opposite of "the
  minimum to do."
- Requires **manual ticking** (busywork), and confirmations are **in-memory only** so
  they reset on reload.
- Gates nothing (publish never consults it).

The original intent was two distinct jobs that got mashed together:
1. **Orientation** — new user lands on edit screen, shouldn't feel lost; wants the few
   minimum things to do.
2. **Trust** — AI sometimes invents specifics (a number/stat/claim as placeholder); user
   needs to spot exactly which value to change, not a vague "skim the copy."

## Goal
Split the one overloaded "review" system into two right-sized features: a short **curated
"Getting started" guide** that auto-checks itself and fades when done, and inline
**"verify AI-invented specifics" markers** on the canvas that auto-clear on edit. Remove
manual ticking, the passive "reviewed" wording, and the exhaustive per-element list.

## Scope OUT (non-goals)
- **No publish gate.** Both features stay advisory; publishing never blocks on them.
- No new "review workflow"/approval concept.
- Not touching the AI generation pipeline or how `ai_generated_needs_review` gets tagged
  (we consume the existing tag, we don't change what earns it).
- Not a full onboarding tour/coachmarks — just the checklist + inline markers.
- No testimonial/Surge `ReviewGrid` or onboarding `SitemapReviewStep` (unrelated "review").

## Constraints
- **Dual-renderer**: markers/guide are edit-only UI — must NOT leak into the published
  renderer or `.published.tsx` output.
- Progress should **survive reload**. Prefer deriving state from page content (no new DB
  field) wherever possible; the only non-derivable state is Job 2's "leave as-is" dismiss
  (see open questions).
- Reuse the existing scan in `useReviewState.initFromContent` rather than a second scanner
  — it already computes the three categories; we're re-routing them, not rebuilding.
- Keep it edit-store-consistent (`useEditStoreLegacy` / `EditProvider` init path).

## The two features

### Feature 1 — "Getting started" guide (replaces the checklist)
- **Curated & short (~5 tasks)**, task-worded, same for everyone. Starting set (refine in
  plan): *Add your logo · Link your CTA buttons · Replace stock photos · Add contact info ·
  Review your headline.* (Only show a task if the page actually has that surface — e.g. no
  "add logo" if there's no header.)
- **Auto-checks** from page content (logo present, CTA has a link, images non-stock/non-
  placeholder, contact filled). **No manual checkboxes.**
- Header pill reworded `X/Y reviewed` → e.g. **"Setup: 2 left"**; left-panel tab retitled
  from "Review" → "Getting started" / "Setup".
- **Fades**: pill + tab auto-hide once all tasks complete.
- Clicking a task scrolls to / focuses the relevant element (keep today's scroll-to
  behavior).

### Feature 2 — "Verify AI-invented specifics" markers
- **Inline canvas markers only** (no checklist rows) on elements tagged
  `ai_generated_needs_review` (the fabricated numbers/stats/claims).
- **Auto-clears on edit** — marker vanishes the moment the element's value changes from the
  AI original.
- **"Leave as-is" dismiss** — a tiny per-marker control to acknowledge "checked, it's
  correct" and clear it without editing (for correct-but-flagged values like a real
  founding year). This dismiss must persist (open question below).
- Stock-image / unconfigured items move OUT of the inline markers and into Feature 1's task
  list; only the AI-invented-data category stays inline.

## References
- `src/hooks/useReviewState.ts` — the existing scan/store; source of truth for the three
  categories (`needs_review` / `manual_preferred|stock_image` / `unconfigured`). Split its
  output: `needs_review` → Feature 2 inline markers; the rest → Feature 1 curated tasks.
- `src/app/edit/[token]/components/ui/ReviewPill.tsx` — header pill to reword + rewire.
- `src/app/edit/[token]/components/layout/LeftPanel.tsx` — `ReviewChecklist` component to
  convert into the curated "Getting started" list.
- `src/app/edit/[token]/components/selection/SelectionSystem.tsx` — applies per-element
  badge classes; home for Feature 2 markers + the dismiss control.
- `src/app/globals.css` (~205–290) — badge styling.
- `src/components/EditProvider.tsx` (~179) — `initFromContent` init hook.
- `src/app/edit/[token]/components/layout/EditHeader.tsx` (~65) — where the pill mounts.
- `src/hooks/README.md:77` — mislabels `useReviewState` as "testimonial/review UI"; fix.

## Open exploration questions (feeds scout)
- **Auto-check derivation**: for each Feature-1 task, what content signal proves "done"?
  (logo field set, CTA `*_link` non-empty, image src not placeholder/stock, contact fields
  filled.) Where do those values live per section/element?
- **Auto-clear derivation for Feature 2**: does editing an element flip its `fillMode`, or
  do we compare current value vs the AI-generated original? Is the AI original retained
  anywhere to diff against?
- **Persisting "leave as-is" dismiss**: not derivable from content. Store as a small
  `dismissedReviewFlags` array in the project `content` JSON (no schema change), or a DB
  column? Decide in plan.
- Does `initFromContent` re-run on every content change or only on load? (affects live
  auto-check/auto-clear.)

## Candidate human gates
- **If** the "leave as-is" dismiss needs a Prisma schema change (vs. living in the existing
  `content` JSON) — schema/migration sign-off.
- Any change to what draft/publish persists (persistence path touch).

## Acceptance criteria
- [ ] Header pill reads as actionable setup ("Setup: N left"), not "X/Y reviewed".
- [ ] Left-panel guide shows a **curated ~5-item** task list, not one-row-per-element.
- [ ] Guide tasks **auto-check** from content; no manual checkbox required.
- [ ] Pill + guide tab **auto-hide** when all tasks complete.
- [ ] Guide progress **survives page reload** (no reset-on-refresh).
- [ ] AI-invented specifics show **inline canvas markers**, not checklist rows.
- [ ] A marker **auto-clears** when its element is edited.
- [ ] Each marker has a **"leave as-is" dismiss** that clears it and **persists** across
      reload.
- [ ] Stock-image / unconfigured items are represented as guide tasks, not inline markers.
- [ ] Publish is **unchanged** (no gating); published output shows no guide/marker UI.
- [ ] `tsc` + `test:run` green; editor↔published parity unaffected.

## Pilot / smallest slice
Build both together (they're two halves of splitting one store), sequenced as:
1. **Slice 1 — Feature 1 guide**: re-route `useReviewState` output, convert the pill +
   left-panel checklist to the curated auto-checking guide, wire content-derived
   persistence. **Decision gate**: does the curated auto-checking guide feel like the
   "don't-feel-lost" thing on a real generated page?
2. **Slice 2 — Feature 2 markers**: inline markers for `ai_generated_needs_review`,
   auto-clear-on-edit, "leave as-is" dismiss + its persistence.

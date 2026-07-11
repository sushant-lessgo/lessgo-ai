# publish-checklist — spec

## Problem / why
The editor already has a full review system (`src/hooks/useReviewState.ts`): a curated
"Getting started" guide (4 auto-checked tasks) and `needs_review`/`unconfigured`/`stock_image`/
`manual_preferred` markers with severities and baseline-divergence auto-clear. But **all of it
dies in the editor** — the preview page and publish dialog consult none of it. QA (scale-1-10)
showed what slips through at the exact moment it matters: AI-drafted testimonials (F2), primary
CTAs with no destination (F14/F23), stock placeholders, empty links. The user's last screen
before going live says nothing.

## Goal
A **"Before you publish" checklist on the preview page** — the same review-state scan rendered
at the publish boundary. One derivation, two surfaces: fix an item in the editor and it
disappears from the checklist (auto-clear semantics preserved). **Purely advisory** — Publish
is never blocked and requires no acknowledgment, regardless of severity.

## Agreed decisions (2026-07-10)
- **Purely advisory.** No blocking, no "publish anyway" click, not even for high-severity
  items. ("Can't block publish if they want it anyway.") Revisit after ~100 users — founder
  discipline, no product instrumentation for it.
- Preview page is the surface (the natural pre-publish moment), not the slug/publish dialog.
- This checklist is the exit gate `docs/task/proof-truth.spec.md` refers to: unreviewed
  AI-drafted testimonials appear here as high-severity items.

## Scope OUT (non-goals)
- Any publish gating/acknowledgment (explicitly declined for now).
- New detection systems — the checklist renders what the existing scan derives. (One additive
  detector is in scope, see Constraints: param-less/unconfigured primary CTA, since it maps to
  the existing `unconfigured` status.)
- Editor-side UI changes (ReviewPill/LeftPanel stay as they are).
- Published-page changes (nothing renders on the live site).
- Metrics/telemetry on checklist interaction.
- Publish dialog changes (F29 checkbox fix already landed separately).

## Constraints
- **One source of truth**: reuse `useReviewState`'s scan/derivation (`initFromContent` and the
  ReviewItem/GuideTask shapes). If the preview page can't mount the same store trivially,
  extract the pure derivation into a plain module both surfaces call — do NOT fork the rules.
- Item classes and severity, from the existing vocabulary:
  - `needs_review` (high) — AI-invented specifics; includes drafted testimonials once
    proof-truth lands (no coupling: whatever the scan flags today shows today).
  - `unconfigured` (high for primary CTA) — primary CTA with no resolvable destination
    (param-less GOAL_REF from F14's "Skip for now" path); empty/`#` links (medium).
  - `stock_image` (medium) — placeholder/stock images.
  - Guide tasks not done (config) — logo, contact, etc.
- Each item links back to the editor at its target (`ReviewItem`/`GuideTask` already carry
  `{sectionId, elementKey}` scroll/focus targets) — "fix" = jump to editor, not inline editing
  on preview.
- Ordering: high → medium → config; collapsed/quiet when zero items ("Ready to publish").
- Preview page is app-side (store/content available) — no publish-flow or exporter changes.
- Multipage: items grouped or labeled per page (preview shows one page at a time — the
  checklist should cover the whole project, not just the visible page; label items with their
  page).

## References
- `src/hooks/useReviewState.ts` — the entire derivation, statuses, severities, guide tasks,
  auto-clear; `useReviewState.test.ts`.
- `src/app/edit/[token]/components/ui/ReviewPill.tsx`, `layout/LeftPanel.tsx` — how the editor
  renders the same data (visual reference, not shared code necessarily).
- `src/app/preview/[token]/page.tsx` — the surface (recently touched by F29 fix).
- `docs/task/proof-truth.spec.md` — feeds high-severity testimonial items.
- `docs/task/goal-ref-cta.spec.md` / plan D-C — param-less GOAL_REF degrades to inert `'#'`;
  that inert state is exactly what the `unconfigured` detector should catch.
- `reports/scale-1-10-findings.md` F14, F2, F6.

## Open exploration questions
- Can the preview page mount the edit store / run `initFromContent` as-is, or is extraction of
  a pure derivation module needed?
- Does the scan run over all pages or only the loaded one today (multipage coverage)?
- Where do guide-task "done" signals come from on preview (same content scan, or editor-only
  state)?
- Is there an existing "unconfigured CTA" detector, or does the primary-CTA case need the one
  additive rule (inert `'#'` href / missing GOAL_REF param)?

## Candidate human gates
- None irreversible. Suggested single gate: visual sign-off of the checklist panel on the two
  QA repro projects (one with drafted testimonials + param-less CTA, one clean) before merge.

## Acceptance criteria
- [ ] Preview page shows the checklist derived from the same scan the editor uses; zero-item
      state reads as ready-to-publish.
- [ ] A param-less primary CTA (F14 skip path) surfaces as a high item; configuring it in the
      editor clears it from both surfaces without re-derive drift.
- [ ] AI-flagged (`needsReview`) elements surface as high items and auto-clear when edited
      (baseline-divergence semantics intact).
- [ ] Stock images surface as medium; unfinished guide tasks as config.
- [ ] Each item click lands the user in the editor at the target element.
- [ ] Publish button behavior unchanged in every state (advisory-only verified).
- [ ] Multipage: items from non-visible pages appear, labeled with their page.
- [ ] `tsc` + full `test:run` green.

## Pilot / smallest slice
Single slice if the store mounts cleanly on preview; otherwise phase 1 = extract pure
derivation + render checklist (single-page), phase 2 = multipage labeling + CTA detector.

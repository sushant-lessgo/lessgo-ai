# proof-truth — spec

## Problem / why
F2 (`reports/scale-1-10-findings.md`, P0, confirmed on all 3 live engines): generation invents
attributed testimonials — fake people, job titles, client companies, and hard metrics ("284%
ROI" pinned to a named client) — whenever the proof toggle is ON, because the wizard collects
only a boolean+format and the copy fan-out fills the vacuum. On the URL path it's worse: the
toggle arrives pre-ON while `facts.testimonials` is null (nothing was actually scraped).
Fabricated attributed quotes on a customer's live site = legal/trust exposure.

Meanwhile a complete testimonial system exists (`docs/tracks/testimonialSystem.md` — collect →
moderate → project-scope → feed-to-page, dark-launched): a durable `Testimonial` table with
`source: collect-form | manual | imported` and the `applyToPage`/`injectRealTestimonials` seam.
The generation flow and this system are currently parallel universes.

## Goal
One truth model: **the `Testimonial` table is the single source of REAL proof; section content
is a render snapshot fed from it; AI-invented copy never enters the table and is always flagged
`needsReview` in content.** Scraped verbatim quotes become durable table rows at generation.
The proof toggle is a T2 capacity signal (exists / kind / count → section inclusion + UIBlock
choice), never a claim that proof content exists.

## Agreed decisions (2026-07-10)
- **No quote collection in the wizard** — out of the equation, permanently.
- **AI may draft testimonial copy at generation**, but every AI-drafted quote/attribution is
  flagged `needsReview` (the `{value, needsReview:true}` sentinel already exists in
  `copy.schema.ts` and `useReviewState` Feature 2 already renders such markers with
  baseline-divergence auto-clear). Mechanism will evolve; this is the v1.
- **scalePlan §8 law AMENDED**: from "proof is never generated" to "proof may be AI-drafted but
  is ALWAYS flagged needs-review and never enters the real-proof library; real proof always
  wins over drafted." Update scalePlan §8 wording as part of this feature so the old law isn't
  "restored" by a future fix.
- **Scraped verbatim testimonials auto-import** into the `Testimonial` table at generation:
  `source:'imported'`, `status:'approved'` (they come from the user's own site), project-scoped.
  Page injection then reads from the table-backed set.
- **Exit gate is the publish checklist** (separate spec `docs/task/publish-checklist.spec.md`)
  — purely advisory; no publish blocking here or there.

## Scope OUT (non-goals)
- Wizard quote collection (decided out).
- Publish blocking/acknowledgment of any kind (checklist spec owns the surface; advisory only).
- Un-darking the testimonial system (`TESTIMONIALS_ENABLED` flip stays a founder call).
- Video testimonials, template photo-on-card changes, moderation UI changes.
- The proof-drop rule for toggle OFF (works; F22 seed-path fix already landed).
- New UIBlocks for count-based selection — using the T2 signal to *choose among existing*
  blocks is in; designing new blocks is not.

## Constraints
- Invented rows NEVER written to `Testimonial` (no `source:'ai'` — the table is real-proof-only
  by definition).
- Real-vs-drafted precedence: when table-backed real quotes exist for the project (imported,
  approved collect-form, manual), generation/regeneration injects those and must NOT overwrite
  them with fresh inventions. Regenerating a section with real quotes keeps the real quotes.
- URL path integrity: the proof toggle may not arrive ON when `facts.testimonials` is null —
  toggle state derives from what was actually captured (or the user flips it consciously).
- The needsReview flag must survive the full pipeline: copy parse → content store → draft save →
  reload (it feeds `useReviewState` markers and the publish checklist). It must NOT render on
  the published page.
- Toggle T2 semantics: `hasTestimonials` + format + (new, if cheap) approximate count feed
  section inclusion + UIBlock selection (photo-friendly vs text-only; few vs many). Count from
  scrape/import when URL-entry, from the user's answer otherwise.
- Prompt side: drafted quotes must be plausible-generic, never claim named companies or hard
  metrics — the F2 trust-engine repro ("284% ROI" for "GlowSkin") is the class to forbid even
  in flagged drafts. Exact prompt technique is the planner's call.
- Engines: applies to all three live engines (thing/trust/work) — F2 confirmed on all.

## References
- `docs/tracks/testimonialSystem.md` — architecture, `Testimonial` model, `applyToPage`
  (page-store-aware, Phase 4b), `injectRealTestimonials` seam in
  `src/modules/audience/{product,service}/parseCopy.ts`.
- `src/lib/testimonials/repo.ts` — `createTestimonial` (validates source/status; `imported` is
  a valid source already).
- `src/lib/schemas/copy.schema.ts` — needsReview sentinel (+ new lone-object coercion, F27a).
- `src/hooks/useReviewState.ts` — Feature 2 `needs_review` markers, baseline auto-clear.
- `reports/scale-1-10-findings.md` F2 (three repros incl. tokens), F22 (sibling law, fixed).
- Scrape capture: `/api/v2/scrape-website` + `/api/v2/understand` already extract verbatim
  testimonials into facts.

## Open exploration questions
- Where exactly does the copy prompt request testimonial elements, per engine — the injection
  point for the "flag as needsReview + forbid named-company/metric claims" change.
- How does `facts.testimonials` flow to the proof step's toggle default today (the pre-ON bug)?
- Does the needsReview sentinel survive draft save/load round-trip today, or is it stripped?
- Where would auto-import live — parseCopy injection time vs Brief confirm — and what happens
  on regeneration (idempotency: don't re-import duplicates).
- Testimonial system is dark: auto-import writes table rows regardless of flag? (Rows are
  invisible until un-dark — acceptable? Planner should confirm no flag-gated write path breaks.)

## Candidate human gates
- Live generation check (real LLM) on the three F2 repro shapes: drafted quotes flagged, no
  named companies/metrics, URL entry imports real quotes. One gate before merge.

## Acceptance criteria
- [ ] One-liner entry, toggle ON, no real proof: testimonial section renders drafted quotes,
      every quote+attribution flagged `needsReview`; markers visible in editor; zero
      `Testimonial` rows created.
- [ ] URL entry with scraped testimonials: `Testimonial` rows created (`imported`/`approved`,
      project-scoped, deduped on regen); page injects the real quotes UNflagged; toggle
      reflects captured reality.
- [ ] URL entry with NO scraped testimonials: toggle not silently ON.
- [ ] Regeneration with real (table-backed) quotes present: real quotes preserved, not
      replaced by inventions.
- [ ] Drafted quotes contain no named client companies and no hard performance metrics.
- [ ] needsReview flags survive save/reload; absent from published HTML.
- [ ] scalePlan §8 wording updated to the amended law.
- [ ] `tsc` + full `test:run` green.

## Pilot / smallest slice
Phase 1 (with system dark): flag-all-drafted + prompt guard + toggle-integrity + auto-import.
Phase 2 (rides `TESTIMONIALS_ENABLED`): needsReview marker's fix-path points at the library /
collect-link ("replace with real ones") — the evolving mechanism's first evolution.

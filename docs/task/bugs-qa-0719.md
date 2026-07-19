# Bug round: qa-0719 (founder QA, 19 Jul)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\qa-0719`
- **Branch:** `fix/qa-0719` (off `main`)
- **Base rationale:** preview `qa/beta-big-bang` == `main` (0 commits apart); all QA'd code (engine-decider journey onboarding, UnderstoodRail, upload/ingestion, editor, publish) is on main. `next` (+14) is post-beta — NOT the base.
- **Source:** `docs/qaTest/bugs19thJuly.md` (founder end-user pass on preview `lessgo-ai-git-qa-beta-big-bang`).
- **Cross-ref:** my automated pass `docs/reports/qa-preview-bigbang-2026-07-19.md` (B-1..B-5). Founder B10 ≈ my B-2 (CLOUD_OFF icon leak).

## Progress log (resume anchor)
- B1 upload drops half the photos: FIXED (review 1→ship). NEW compressImageClient.ts (≤2400px WebP q0.85, safe passthrough SVG/GIF/decode-fail/not-smaller, never throws); uploadClient.ts compresses via injectable seam before POST, keeps original File for EXIF/grouping. 8 tests (pre-fix seam test fails). Server pipeline/route untouched. FAST-FOLLOW ticket: editor path formsImageActions.ts uploadImage (identical bug, editStore internals=risky, not founder-reported) should call same util.
- B2 pricing question confusing + no currency: FIXED (cluster; review 1→ship). Currency control in PriceAnswer (default $, set $/€/£/₹) threaded via commitGroupPrice; price label reworded for multi-service ("Your typical starting price…"). NEEDS-FOUNDER-SIGNOFF on preview: currency default + label wording.
- B3 answered-state inconsistent (name vanishes / charge stays "Answered"): FIXED (cluster; ship). Added `slot` to JourneyQuestion; StepQuestions tracks answered by slot (fallback id); work.ts sets slot per descriptor → identity no longer dropped, all answered questions stay answered-compact uniformly.
- B4 save-vs-chip inconsistency across steps: FIXED (cluster; ship). Single-select choice now buffers on tap + commits via Save (unified with multi/text/price). NEEDS-FOUNDER-SIGNOFF on preview: Save-everywhere UX.
- B5 dream-client extra chip selections missing from rail: FIXED (cluster; ship). ChoiceAnswer seeds selected from committed/suggested; multi commit carries full set; answeredSummary reads committed→friendly labels (post-review polish). Deselect round-trip pinned.
- B6 save blocked when field already pre-selected: FIXED (cluster; ship). Seeded selection → Save enabled on arrival.
- B7 rail "what you do" never answered (should prefill from one-liner): FIXED (review 1→ship). descriptorFromEntry precedence summary??categories??oneLiner??rawInput in seedWorkFactsFromEntry; applyRailEdit name case back-fills identity.descriptor from facts.entry when absent (guarded, no overwrite). Also folded NIT: priceLabel renders currency symbol adjacent to amount ("From $2400"). 5 tests. rail 49 pass / work module 120 pass.
- B8 out-of-credits: slow + technical copy + missed upsell moment: FIXED (review 1→ship). Shared src/lib/creditRunGate.ts upfront balance gate wired into BOTH fetchStrategy (thing/trust) AND work.llm.ts runWorkLLMGeneration (work engine — the founder's actual path) → fails fast before any charged AI call, zero partial charge; fail-open on balance hiccup (per-route 402 backstop). Warm OUT_OF_CREDITS_COPY constant + CTA→/dashboard/billing "Top up now" in GeneratingSlot+StructureSlot. 9 b8 tests + 107 existing green. NEEDS-FOUNDER-SIGNOFF on preview: copy wording. NB out-of-scope tickets: credit badge shows 10 but wizard charges 5 (2+3); multipage thing/trust page-count is an estimate at strategy time (per-route 402 backstop covers overflow).
- B9 logo renders badly in editor (want it good everywhere): FIXED (commit db0ca6d7, review loops 0→ship). Shared Logo.tsx → transparent wordmark + aspect-correct sizing; AppSidebar re-pointed to shared Logo; 5 call-sites height-adjusted. Regression test pins asset. NEEDS-VISUAL-REVIEW on preview: marketing Header + onboarding/PersonaPrompt top-bar heights.
- B10 can't find unpublish (CLOUD_OFF icon leak makes it look broken): FIXED (hotfix, diff-checked). ProjectCardMenu.tsx cloud_off→visibility_off; cloud_off added to icons.txt as pending-regen want. Subset-manifest regression test (fails pre-fix). No review per hotfix tier.

---

## Bugs

### B1 — Photo upload drops files (uploaded 8, only 4 saved)  [P1]
- **Symptom:** In onboarding, selected 8 photos to upload; only 4 were actually uploaded/kept.
- **Suspected area:** work-engine photo upload / ingestion step (`work-onboarding-ingestion`), upload handler — likely a cap, race, or partial-batch bug.
- **Expected:** all 8 selected photos upload (or a clear cap message).
- **Env:** preview (work/photographer flow).

### B2 — "Roughly what do you charge" question confusing + no currency  [P2]
- **Symptom:** Pricing question is unclear for a business with multiple services ("not sure what to write here"); no currency shown/selectable ("what currency?").
- **Suspected area:** engine step config (Offer/pricing step in the journey onboarding), step copy + input; currency handling.
- **Expected:** question makes sense for multi-service; currency is explicit.
- **Note:** carries a product/taste decision (currency handling, wording) — default applied, validate at preview re-test.

### B3 — Answered-state inconsistent across steps  [P1]
- **Symptom:** When "name" answered → the step/card went away completely. When "roughly what do you charge" answered → it stayed on the canvas showing "Answered" + a change option. Two different behaviors for the same act of answering.
- **Suspected area:** journey step → UnderstoodRail answered-state; per-step commit/collapse behavior (`JourneyShell` / step components / `UnderstoodRail`).
- **Expected:** one consistent answered-state pattern.
- **Env:** preview.

### B4 — Save-vs-chip inconsistency across steps  [P2]
- **Symptom:** Some steps require clicking a Save button; others commit just by clicking a chip (e.g. "are you established"). Inconsistent commit UX.
- **Suspected area:** journey step components — mixed commit patterns.
- **Expected:** one consistent commit pattern.

### B5 — Dream-client extra chip selections missing from rail  [P1]
- **Symptom:** On dream-client step, selected MORE chips than were pre-selected; the rail shows only the pre-selected ones (extra selections lost).
- **Suspected area:** dream-client/audience step selection state → rail/brief propagation (`UnderstoodRail`, step state, brief write-back).
- **Expected:** all selected chips reflected in rail/brief.
- **Env:** preview.

### B6 — Save blocked when field already pre-selected  [P1]
- **Symptom:** When something is already pre-selected, Save is disabled; user must (de/re)select to unlock Save.
- **Suspected area:** step save-enable/dirty-flag logic — treats a valid pre-filled value as "nothing to save".
- **Expected:** pre-selected valid value can be saved/accepted without a spurious change.

### B7 — Rail "what you do" never answered (should prefill from one-liner)  [P1]
- **Symptom:** On the rail, "what you do" stayed unanswered the whole time; it should have been filled from the one-liner entry but wasn't.
- **Suspected area:** one-liner (`EntryInputStep`) → understanding/brief mapping → `UnderstoodRail` "what you do" item.
- **Expected:** one-liner populates "what you do".
- **Env:** preview.

### B8 — Out-of-credits: slow + technical copy + missed upsell  [P1]
- **Symptom:** Took a long time to report "we couldn't build your site — you're out of credits"; copy is technical. This is the sell moment — the instant the user says "build my site" and has no credits, we should pitch a top-up ("great — top up now").
- **Suspected area:** generation/building step error path when credits exhausted; credit check placement (fail fast BEFORE the long generation), error copy, upsell CTA/top-up flow wiring.
- **Expected:** fast fail on no-credits + warm, sell-oriented copy + top-up CTA.
- **Note:** may touch credit-check placement (RISKY if it edits `creditSystem`/`planManager`/billing routes). Product copy default applied, validate at preview.

### B9 — Logo renders badly in editor (want it good everywhere)  [P2]
- **Symptom:** "Logo bad in editor." Wants it to look good in editor AND published.
- **Suspected area:** header/logo block or logo upload rendering (editor `.tsx` + published `.published.tsx` — DUAL-RENDERER).
- **Expected:** logo renders well in editor and published.
- **Founder clarification (intake):** "copy it from dashboard — there corrected in last round." The logo was fixed in the DASHBOARD in the qa-0718 round; the EDITOR still shows the old/bad version. Fix = port the dashboard's corrected logo component/treatment into the editor (and published). Look at qa-0718's dashboard logo fix as the reference.

### B10 — Can't find unpublish (icon leak makes it look broken)  [P2]
- **Symptom:** "Not finding option to unpublish my website."
- **Root-cause hint (from my QA B-2):** Unpublish DOES exist in the project ⋯ menu (`ProjectCardMenu.tsx`, `/api/projects/[tokenId]/unpublish`), but the row renders the raw Material-Symbols ligature `CLOUD_OFF` (large text) instead of the icon, and the "Unpublish" label is truncated/overflowing — so it reads as broken/unfindable. Other rows (Rename/Duplicate) render fine → the `cloud_off` glyph specifically isn't resolving.
- **Suspected area:** `ProjectCardMenu.tsx` icon usage for unpublish (Material-Symbols ligature vs the icon set other rows use).
- **Expected:** Unpublish row shows a proper icon + full label; discoverable.
- **Tier:** hotfix (obvious cause, ≤2 files).

---

## Triage table

| ID | Sev | Suspected area | Tier |
|----|-----|----------------|------|
| B1 | P1 | work upload/ingestion | standard |
| B2 | P2 | journey Offer/pricing step copy+currency | standard (product default) |
| B3 | P1 | journey answered-state / UnderstoodRail | standard |
| B4 | P2 | journey step commit pattern | standard |
| B5 | P1 | dream-client selection → rail/brief | standard |
| B6 | P1 | step save-enable/dirty logic | standard |
| B7 | P1 | one-liner → "what you do" mapping | standard |
| B8 | P1 | out-of-credits path (copy+speed+upsell) | standard → risky if touches creditSystem/billing |
| B9 | P2 | logo block (dual-renderer) | standard → risky (dual-renderer) |
| B10 | P2 | ProjectCardMenu unpublish icon | hotfix |

Tiers escalate only (re-check after each investigator returns Files-touched).

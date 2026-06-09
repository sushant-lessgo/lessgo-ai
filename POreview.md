Verified against code. Plan is approved — proceed — with 2 corrections and answers to the dev's 2 open questions. Diagnoses are mostly accurate; one citation is wrong
  in a way that could send the dev down the wrong path.

  What I confirmed in code

  ┌─────────────────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────────────────┐
  │                                  Claim                                  │                                         Status                                          │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2b: processServiceCopy has no ID backfill                               │ ✅ Confirmed (parseCopy.ts:21-27)                                                       │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2b: schema at audience/service/elementSchema.ts (not templates/hearth)  │ ✅ Confirmed — dev's "Files touched" path is right; moved in 7.5d                       │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2b: collections declare id: { fillMode: 'system' }                      │ ✅ Confirmed (elementSchema.ts:33,71,...) — schema-driven walk will work                │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
  │ 2b: no v3 pattern to mirror (product uses pipe-delimited strings)       │ ✅ Correct — separate backfill is the right call, not touching frozen                   │
  │                                                                         │ applyAllSchemaDefaults                                                                  │
  ├─────────────────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────────────────────────┤
  │ 3: canConvertToForm already lights up "Button Settings" for cta/button  │ ✅ Confirmed (ElementToolbar.tsx:156-175)                                               │
  │ keys                                                                    │                                                                                         │
  └─────────────────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────────────────────────┘

  Correction 1 — Defect 3 diagnosis cites the wrong lines

  Dev says the element toolbar is suppressed by "ElementToolbar early-returns when a text toolbar is active (ElementToolbar.tsx:87-89)." That's inaccurate. Lines 87-89
  return null only on image or form toolbar types — not text. A text toolbar does not trigger that early return.

  The real mechanism is upstream: single-clicking the contenteditable HearthEditable routes the click to text-edit selection, so the element is never selected as an
  'element' type — the ElementToolbar's element branch never activates. The fix direction (button affordance → single-click selects, double-click edits) is still correct,
  but the dev must validate the actual selection routing (determineElementType / useEditor) before coding, not the 87-89 early-return. Otherwise they may "fix" the
  early-return and the toolbar still won't show.

  Action: re-validate the selection path; keep the fix, correct the diagnosis.

  Correction 2 — Scope the button affordance narrowly

  The button-select-on-single-click affordance must apply only to actual button/cta elements, NOT all HearthEditable. Every other Hearth text element single-clicks to
  edit; if the CTA suddenly single-clicks to select, that's fine (matches product's button-vs-text model) — but only if it's scoped to the button. A blanket change would
  make all Hearth text require double-click to edit = regression. Dev's plan implies this but doesn't state the guard explicitly. Make it explicit.

  Answers to dev's 2 open questions

  Q1 — heal-on-load backfill for already-saved drafts?
  Skip it. Don't touch the frozen loadDraft surface. No live users; dev/test drafts with broken collection IDs just get regenerated. Fresh-generation backfill is
  sufficient. (Matches the plan's own fallback.)

  Q2 — double-click-to-edit on the CTA acceptable, or keep single-click + separate Button-Settings entry?
  Double-click-to-edit is acceptable — it matches how product buttons already behave (select vs edit split). Lower-risk than inventing a parallel entry point. Proceed
  with it, scoped per Correction 2.

  Everything else — approved as written

  - 2a (empty image): reuse ResultsGallery's ImagePlaceholder pattern, apply to both Hearth image slots (hero_image, author_photo). Good.
  - 1 (persona stranding): ?personaUpdated=1 banner on dashboard + back link, mirror billing ?success= convention. Good — minimal blast radius, leaves /api/start
  PersonaPrompt untouched.
  - Priority order (2b → 3 → 2a → 1), idempotent backfill, UUID-per-item over Date.now(), re-run both passes, re-check copy gates after 2b. All correct.

  One addition to the re-test gate

  After 2b, also confirm: publish a service page → /p/[slug] renders the collections (not just edit mode). The backfill runs at copy-gen; verify the IDs persist through
  save → publish → published render, since that's a different renderer path.

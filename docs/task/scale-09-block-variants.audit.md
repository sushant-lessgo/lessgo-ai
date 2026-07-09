# scale-09 block-variants — implementation audit

## Phase 1 — surge testimonials deterministic default

**Files changed**
- `src/modules/audience/service/selectUIBlocks.ts` — modified
- `src/modules/audience/service/selectUIBlocks.test.ts` — new

### What changed
- Removed the `Math.random() < 0.5 ? 'ReviewGrid' : 'PullQuoteWithMark'` nondeterminism in `pickTemplateLayout`.
- Surge + `testimonials` now returns a fixed deterministic default via `SURGE_TESTIMONIALS_DEFAULT = 'ReviewGrid'`.
- `pickTemplateLayout` shape/signature `(templateId, sectionType) => string | null` unchanged; `selectServiceUIBlocks` I/O unchanged.
- Updated the doc-comment to state selection is deterministic and that count/manifest-driven selection lands in later phases.

### Deterministic rule used
- `templateId === 'surge' && sectionType === 'testimonials'` ⇒ `'ReviewGrid'` (fixed).
- No testimonial-count hint exists in this function's current signature (live audience routes carry no `cardCounts`; count threading is phase 4). Per plan ("use testimonial count when available, else fixed default `ReviewGrid`"), with no hint available the rule resolves to the fixed default — matching orchestrator decision Q1 (ReviewGrid, count-based rule OK). No new params added, keeping shape stable this phase.
- All other template/section combos ⇒ `null` (unchanged), so they fall through to `PILOT_LAYOUT_NAMES`; the `if (layout)` guard still skips unknown sections.

### Tests added (`selectUIBlocks.test.ts`)
- Surge testimonials returns the SAME result across 50 repeated calls (single-element set, `ReviewGrid`).
- Fixed default is `ReviewGrid`.
- Non-surge template (hearth) testimonials unchanged (`PILOT_LAYOUT_NAMES.testimonials` = `PullQuoteWithMark`, not `ReviewGrid`).
- Non-testimonials sections on surge unchanged.
- Unknown section type skipped (the `if (layout)` guard) — empty uiblocks.

### Verification
- `npx tsc --noEmit` — clean, no output.
- `npm run test:run` (targeted `selectUIBlocks generationContract`) — 2 files, 22 tests passed. `generationContract.test.ts` frozen fixtures green (no re-freeze; it pins neither testimonials block).
- `npm run test:run` (full) — 99 passed | 1 skipped files; 1573 passed | 3 skipped tests.

### Deviations
- None. Count-hint parameter deliberately NOT added (out of phase-1 scope; keeps `pickTemplateLayout` shape per plan). Logged as conservative choice.

### Open risks
- None for this phase. `PullQuoteWithMark` variant is now never selected at generation for surge; that becomes reachable again via the editor swap (phase 5) and the manifest default (phases 2/4).

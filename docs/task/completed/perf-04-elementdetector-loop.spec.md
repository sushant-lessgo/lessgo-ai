# perf-04 — Kill the ElementDetector MutationObserver self-loop

**Status:** SPEC · follow-up to perf-02 (which shipped but fails its 6×-throttle acceptance because of this)
**Evidence:** `reports/perf-editor-throttled6x-2026-07-11.md` — 77% idle main-thread saturation at 6×; timer attribution pins **45% of all CPU** on one loop; also the prime suspect for the CRITICAL silent edit-loss found in that run.

---

## Problem

`src/app/edit/[token]/components/selection/ElementDetector.tsx` is mounted around **every section** (`MainContent.tsx:559` → 13 instances on a naayom-scale page). Each instance runs an infinite self-triggering loop:

1. MutationObserver watches `childList + subtree + attributes` with `attributeFilter: ['data-element-key', 'class']` (L132-137).
2. On any mutation → `setTimeout(100)` (L124 — **no clearTimeout**; not a debounce, timeouts pile up).
3. Callback runs `markSelectableElements()` (`classList.add` → mutates watched `class`), `removeElementHints()` + `addElementHints()` (remove/appendChild → childList mutations).
4. Its own work re-fires the observer → loop, forever, per section. Measured: **581 fires / 68.7 s ≈ 8.5/s, 30.7 s self-time**.
5. Leak: `addElementHints` attaches new `mouseenter`/`mouseleave` listeners every cycle, never removed.

Unthrottled each fire ≈ 9 ms → invisible to the longtask API but ~9% CPU always-on; at 6× (naayom-class hardware) the main thread saturates.

## What ElementDetector actually provides today

| Piece | Consumer | Keep? |
|---|---|---|
| `selectable-element` class sweep (L18-29) | `ElementDetectorStyles` hover/cursor CSS; `useEditor.ts:455,713` `closest('.selectable-element')` (both guarded) | Replace with CSS attr selector — blocks already render `data-element-key` |
| `data-selectable` attr | nothing (grep: only ElementDetector itself) | Drop |
| `role=button` + `tabindex=0` sweep | a11y only | Drop from sweep (see Q2) |
| Hover hint labels (`element-hint`, L32-94) | user-visible on hover: 10px monospace `elementKey/type` tag; positions computed once at attach → stale after any layout shift | Drop (see Q1) |
| MutationObserver + setTimeout(100) | drives the two sweeps above | **Delete** |
| Selection feedback useEffect (L150-173, React-driven, cheap) | `element-selected` / `section-selected` classes | Keep as-is |
| `handleNestedElementClick` (React onClick) | nested-element hover/depth feedback | Keep as-is |
| `ElementDetectorStyles` CSS | all edit-mode affordances | Keep, re-point selectors |

Note: `SelectableElementWrapper` (`EditablePageRenderer.tsx:57-87`) already does the React-side equivalent but is **dead code — never rendered**. Do not resurrect; delete it in this pass.

## Fix (single phase)

**Files touched:** `ElementDetector.tsx`, `useEditor.ts`, `EditablePageRenderer.tsx` (dead-code delete)

1. Delete from `ElementDetector.tsx`: the MutationObserver effect (L104-145), `markSelectableElements`, `addElementHints`, `removeElementHints`, hint CSS, and the mode-change cleanup that references them (L214-231 shrinks to class removal only).
2. `ElementDetectorStyles`: replace every `.selectable-element` selector with `[data-element-key]` (scoped under `.element-detector-section.edit-mode` as today). Same for `.element-selected` interplay — unchanged, it's already class-based and React-set.
3. `useEditor.ts:455` + `:713`: `closest('.selectable-element')` → `closest('[data-element-key]')`. Both already null-guarded.
4. Delete dead `SelectableElementWrapper` from `EditablePageRenderer.tsx`.
5. Leave `ElementBoundaryVisualizer` (Ctrl+Shift+B debug, no observer) untouched.

No store, renderer-pair, or template changes. Editor-only chunk (`app/edit/[token]`) → no published-page rebuild concerns.

## Acceptance (all at DevTools CPU 6×, prod or prod-build, methodology doc T2/T4)

1. **Idle:** long-task busy ratio over a 60 s idle window **< 10%** (was 77%); timer attribution shows no recurring `setTimeout(100)` from the edit chunk.
2. **Selection regression QA (manual, dev):** click text/image/button elements across hero + 2 other sections → element selected, toolbar opens; hover shows pointer cursor + outline affordance; section select ring works; inline text edit still enters/exits cleanly (InlineTextEditorV2 stays uncontrolled).
3. **Edit-loss re-test:** repro from throttled6x report §Edit-loss (type 1 char → blur → check draft + `saveDraft` POST) **5× at 6×**. If it still reproduces → open perf-05 targeting the InlineTextEditorV2 commit path; if gone → note in report, close as fixed-by-perf-04.
4. `tsc` / `npm run test:run` / `npm run build` green.

## Out of scope

- Image `width`/`height` dims (perf-03 residual) — separate small pass.
- The 2-writes-per-focus-blur residual (perf-01, target 0-1) — cosmetic, deferred.
- PostHog/Clerk timers — negligible (≤2% combined).

## Decisions (locked 2026-07-11)

1. Hover hint labels: **drop entirely.**
2. `role=button`/`tabindex=0` a11y loss: **accepted** (editor-only surface; revisit if a keyboard-nav editor user appears).
3. If edit-loss survives acceptance #3: **fix immediately** (perf-05, drops everything else — data-loss class).

**Scheduling:** run AFTER feature/i18n-phase-1 completes + merges. Do not interleave (same editor surface, needs clean 6× benchmark runs).

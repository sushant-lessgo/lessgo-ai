# editor-phase-4-store-finish — Step-B perf baseline

Pre-selector-ization baseline recorded by the reactivity/perf probe
(`e2e/tools/renderProbe.ts`). This is the number Gate B (phase 11G) compares
post-phase-7 and post-phase-10 against. Expectation across Step B: render churn
↓ (or flat), heap flat.

## How it was captured

- **Branch:** `feature/editor-phase-4-store-finish` (worktree). Editor **unchanged**
  (Step A merged; no Step-B batches applied yet).
- **Dev server:** worktree, port **3021** (NOT :3000), started with:
  ```
  PORT=3021 NEXT_PUBLIC_DEBUG_EDITOR=true NEXT_PUBLIC_USE_MOCK_GPT=true npm run dev
  ```
  (mock-GPT so the probe can seed a draft via the real routes with no credits/LLM,
  same as the e2e webServer; DEBUG_EDITOR so the store-mutation cross-check log fires.)
- **Probe run command:**
  ```
  PROBE_URL=http://localhost:3021 npx tsx e2e/tools/renderProbe.ts
  ```
- **Audience/template:** product / Meridian (seeded, hero exposes
  `[data-element-key="headline"]`). Authed via the same Clerk pattern as
  `e2e/auth.setup.ts` (creds from worktree `.env.local`).
- Recorded from **2 consecutive runs** (values stable across both).

## Render-churn metric — how it's measured

The edit page renders sections via `EditablePageRenderer`, which — unlike the
published `LandingPageRenderer` — emits **no** per-render debug log, so the plan's
"count section-render logs" approach has nothing to count on the edit path. The
probe instead counts **React commits** via an injected React-DevTools global-hook
stub (`onCommitFiberRoot`) — a framework-level render-churn signal, independent of
app logging. The EDITOR_DEBUG `updateElementContent CALLED` log is kept as a
secondary store-mutation cross-check.

**Note (commit-on-blur):** `InlineTextEditorV2` commits a text edit to the store on
**blur/Enter**, not per keystroke, so a pure 20-char typing burst drives very few
commits — "renders/keystroke" is low by construction here. The discriminating
store-subscription signal is `commitsOnCommit` (re-renders when the edit reaches
the store) and the palette/selection commit counts.

## Baseline numbers

| Metric | Value | Notes |
|---|---|---|
| React commits during 20-char burst | **6** | both runs |
| React commits / keystroke | **0.3** | 6 / 20 |
| React commits on commit (blur) | **3** | both runs |
| Store mutations observed (burst+commit) | **1** | one `updateElementContent` on blur — confirms commit-on-blur |
| JS heap delta (post-GC, across burst+commit) | **+0.6 – +0.9 MB** | run1 0.649 MB, run2 0.941 MB; heap essentially flat. GC forced via CDP `HeapProfiler.collectGarbage` before each read (without it, ±15 MB noise) |
| Palette-swap re-commits (popover swatch click) | **4–5** | store paletteId updates + canvas re-commits |

## Reactivity smoke subcommands — full pass (unmodified editor)

All 6 green in both runs:

| Smoke | Result | Assertion |
|---|---|---|
| `type` | PASS | typed marker shows live in the hero headline DOM before commit |
| `select` | PASS | click sets `store.textEditingElement` + a `[data-toolbar-type=text-mvp]` floating toolbar becomes visible |
| `undo` | PASS | Ctrl+Z reverts a committed headline edit |
| `redo` | PASS | redo reapplies the reverted edit |
| `palette` | PASS | header "Style" popover → click inactive swatch → `store.meta.paletteId` updates AND React re-commits (canvas repaints) |
| `modal` | PASS | "Style" popover opens and its active swatch reflects `store.meta.paletteId` (store → UI) |

`allPassed: true` — the probe is green against the UNCHANGED editor, confirming the
net itself is sound before any Step-B selector work.

## Re-measure checkpoints

- After **phase 7** (hot paths done) — `PROBE_URL=… npx tsx e2e/tools/renderProbe.ts`
- After **phase 10** (all batches done)

Record both columns here; Gate B reviews baseline vs post-7 vs post-10.

## Post-phase-7 (hot paths done) — perf checkpoint

Recorded after Batch B3 (`useEditor.ts` + `SectionCRUD.tsx`) — the HOT list is now
complete (B1 `useOptimizedEditStore`, B2 renderer/selection, B3 second aggregation
shim + section CRUD). Same probe/dev-server/method as baseline (worktree :3021,
`NEXT_PUBLIC_DEBUG_EDITOR=true NEXT_PUBLIC_USE_MOCK_GPT=true`, product/Meridian,
authed). Single full run (`--smoke=type,select,undo,redo,palette,modal`).

| Metric | Baseline | Post-phase-7 (hot paths done) | Verdict |
|---|---|---|---|
| React commits during 20-char burst | 6 | 6 | flat |
| React commits / keystroke | 0.3 | 0.3 | flat |
| React commits on commit (blur) | 3 | 3 | flat |
| Store mutations observed (burst+commit) | 1 | 1 | flat |
| JS heap delta (post-GC) | +0.6 – +0.9 MB | +0.667 MB | flat (in range) |
| Palette-swap re-commits | 4–5 | 4 | ≤ baseline |

All 6 reactivity smokes PASS (`allPassed: true`): type, select, undo, redo, palette,
modal. Authed edit-persistence E2E: **2/2 pass** (auth setup + throttled-edit-persists).
Commit counts ≤ baseline, heap flat — matches the phase-7 expectation. This is the
number Gate B reviews for the hot-path half.

## Post-phase-10 (all batches done) — FINAL perf checkpoint

Recorded after Batch B6 (header/chrome + preview + dev) — **all Step-B batches
(B1–B6) now applied; ZERO real bare `useEditStore()` call sites remain**. Same
probe/dev-server/method as baseline (worktree :3021, `NEXT_PUBLIC_DEBUG_EDITOR=true
NEXT_PUBLIC_USE_MOCK_GPT=true`, product/Meridian, authed). Single full run
(`--smoke=select,type,undo,redo,palette,modal`).

| Metric | Baseline | Post-phase-7 | Post-phase-10 (all done) | Verdict |
|---|---|---|---|---|
| React commits during 20-char burst | 6 | 6 | 6 | flat |
| React commits / keystroke | 0.3 | 0.3 | 0.3 | flat |
| React commits on commit (blur) | 3 | 3 | 3 | flat |
| Store mutations observed (burst+commit) | 1 | 1 | 1 | flat |
| JS heap delta (post-GC) | +0.6 – +0.9 MB | +0.667 MB | +0.671 MB | flat (in range) |
| Palette-swap re-commits | 4–5 | 4 | 4 | ≤ baseline |

All 6 reactivity smokes PASS (`allPassed: true`): select, type, undo, redo, palette,
modal. Authed edit-persistence E2E: **2/2 pass** (auth setup + throttled-edit-persists).
Commit counts ≤ baseline, heap flat across the whole selector-ization. This is the
final number Gate B reviews (baseline vs post-7 vs post-10). Dev server stopped
(:3021 free; :3000 untouched).

## Close-out (2026-07-14)

Gates B (reactivity + perf sign-off) and C (lint-rule flip) both **founder-approved
2026-07-14**. Spec acceptance met: renders/keystroke flat-or-down, heap flat across
all 6 Step-B batches. This doc is retained as the phase-4 perf record. The reusable
probe `e2e/tools/renderProbe.ts` is kept in-repo (unresolved Q3) as the editor
render-churn/heap measurement tool for future perf work.

# perf-02 — Phase 1 (debug strip & gate) — audit

**Branch:** `feature/perf-02-editor-overhead` (verified via `git branch --show-current` before any edit).

## Files changed
- `src/lib/debugFlags.ts` (NEW)
- `src/hooks/editStore/contentActions.ts`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `CLAUDE.md`

## Per-file changes

### `src/lib/debugFlags.ts` (NEW)
Plain module (NO `'use client'`). `export const EDITOR_DEBUG = process.env.NEXT_PUBLIC_DEBUG_EDITOR === 'true';`. Build-time inlined → `false` in prod → statement-form guards get Terser-DCE'd. Doc comment records the statement-form + NEXT_PUBLIC rules.

### `src/hooks/editStore/contentActions.ts`
- Added `import { EDITOR_DEBUG } from '@/lib/debugFlags';`.
- `updateElementContent` entry log (`🔄 ... CALLED`, incl. `new Error().stack` + `JSON.stringify` preview meta): wrapped in statement-form `if (EDITOR_DEBUG) { ... }`. Zero stack capture per commit by default (dev too).
- Nested-collection-path history gate (was `JSON.stringify(oldCollection) !== JSON.stringify(updatedCollection)`): replaced with a serialization-free direct field compare — `const oldItem = oldCollection.find(item => item.id === itemId); if (oldItem?.[fieldName] !== content) { pushContentHistoryEntry(...) }`. `deepCopy` history snapshots untouched.

### `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- Added `import { EDITOR_DEBUG } from '@/lib/debugFlags';`.
- Deleted the "✅ Built userContext" `console.log` outright (per-render success spam).
- Wrapped the "🔍 No validatedFields or hiddenFields" `console.log` in `if (EDITOR_DEBUG) { ... }` (kept as missing-taxonomy diagnostic).

### `src/modules/generatedLanding/LandingPageRenderer.tsx`
- Added `import { EDITOR_DEBUG } from '@/lib/debugFlags';`.
- `renderSection` per-section debug logs wrapped in `if (EDITOR_DEBUG) { ... }`, arg/meta-object construction inside the guard:
  - secondary-section log + alternated-section log + CSS-class log (contiguous background-logging block) wrapped in one statement-form guard.
  - hero-section log: guard folded into the existing condition → `if (EDITOR_DEBUG && sectionId === 'hero')`.
- Left the non-renderSection debug logs (`:262` color tokens, `:272` component-body debug, `:689` feature flags) untouched — out of the per-render renderSection hot path named by the phase.

### `CLAUDE.md`
Added `NEXT_PUBLIC_DEBUG_EDITOR=true` to the Debug Environment Variables block with a note (client-side → must be NEXT_PUBLIC; off by default → DCE'd in prod; flag in `src/lib/debugFlags.ts`).

## Sweep (step 7)
Grepped all 3 touched code files for `console.log` / `new Error().stack` in per-render/per-commit paths:
- `contentActions.ts`: only stack-capture site was the entry log (gated).
- `EditablePageRenderer.tsx`: both `console.log`s handled (one deleted, one gated); none remain unconditional.
- `LandingPageRenderer.tsx`: no `console.log`/stack-capture; only `logger.debug` (renderSection ones gated).

## Deviations
1. **Collection-path skip semantics — kept the assignment/queued/dirty unconditional; gated only the history push.** Plan step 4 wording says "skip both the update and the history push". The original code gated ONLY the history push on the stringify-diff; the collection assignment, `queuedChanges.push` (which references `updatedCollection`/`oldCollection`), `isDirty`, and `lastUpdated` were all unconditional. To keep behavior truly identical (no lost updates, no changed dirty/Immer re-render behavior, no orphaned refs) I replaced only the serialization-based history gate with the cheap `oldItem?.[fieldName] !== content` compare. This satisfies the stated verification exactly — no lost updates; undo pushes only on real change; no serialization. Conservative in-scope choice.
2. **CSS-class debug log (`🎨 Section ... CSS class`) also gated.** Plan step 6 names the heavy meta-object logs; this one has a cheap arg but runs unconditionally per section per render in the same block, so it was folded into the same `EDITOR_DEBUG` guard for a clean renderSection hot path. No behavior change (debug is prod-silent regardless).

## Test results
- `npx tsc --noEmit`: green (no output).
- `npm run test:run`: 127 files passed / 1 skipped; 2007 tests passed / 3 skipped. Green.

## Open risks
- DCE verification (prod bundle grep for gated strings absent) is deferred to the phase-5 final sweep per the plan; not run here.
- Manual dev QA (type in headline → console silent, undo/redo intact; `NEXT_PUBLIC_DEBUG_EDITOR=true` restores logs) not performed by the agent — left for the human gate.

# perf-01 — editor interaction cost (P0) — spec

## Problem / why
/edit/[token] unusable on low-end hardware (naayom's editor: 8GB RAM, i5 11th gen, Gurgaon). Investigated 2026-07-10 with file:line evidence. Root cause: every interaction does whole-document work. One store write (hero focus fires `setTextEditingMode` + `showToolbar`; blur fires again) →
1. **Whole-store subscription**: `useEditStoreLegacy()` (`src/hooks/useEditStoreLegacy.ts:35`) calls `useStore(store)` with NO selector; ~100+ call sites incl. every template block re-render on ANY store change. No `React.memo` on blocks. `useMeridianBlock.ts:29` builds a new `blockContent` object every render (defeats memoization).
2. **Per-mutation localStorage stringify**: persist middleware (`src/stores/editStore.ts:394-476`) partializes but still includes full `content`/`pages`/`theme`/`forms`; custom `setItem` does synchronous `JSON.stringify` + write of ~70+ KB on EVERY mutation — including toolbar toggles.
3. `orderedSections` memo keyed on whole `content` (`LandingPageRenderer.tsx:230-315`) → background re-assignment across all sections on any edit.

Naayom home page = 11 sections / 55 elements; each click re-renders all of it + stringifies ~70 KB. On 8GB the GC churn + main-thread stalls compound into "can't edit".

**Preview shares this** (separate user complaint 2026-07-10): `/preview/[token]` mounts the SAME `EditProvider` + edit `LandingPageRenderer` (`src/app/preview/[token]/page.tsx:32,431`) with `mode='preview'` — inherits whole-store subscription, background pass, template-import `return null` gate (blank until chunk loads). Does NOT inherit overlays/autosave. Preview slowness = initial load + first render; this spec's render fixes apply to it directly.

## Goal
Editing one section costs one section: interaction work proportional to what changed, not to page size. Editor UX unchanged — inline click-to-edit stays; no edit-mode buttons, no behavior change visible to users.

## Scope OUT (non-goals)
- No UX change (rejected per-section "Edit" button — cost driver is store writes, not editable surface).
- No published-renderer / dual-renderer changes (publish path not involved).
- No section virtualization / iframe canvas (future levers, only if this fails).
- No autosave/export changes (perf-02), no image work (perf-03), no baseline/finalContent split (`content-baseline-split.spec.md`).

## Constraints
- UI-chrome state (text-editing mode, toolbars) must stop triggering persisted-store serialization — move out of persisted slice or equivalent; localStorage persist debounced (~1s idle).
- Blocks subscribe to only their slice (selectors/`useShallow`); memoize `blockContent`; `React.memo` block components.
- MUST NOT reintroduce the InlineTextEditorV2 cursor-jump/corruption bug (it's uncontrolled by design — commit on blur/Enter only; see `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx:79-95`). Do not make it controlled.
- Old localStorage drafts must still load (persist shape back-compat or versioned migration).
- All 4 templates × both audiences must behave identically post-change; run through /feature pipeline; tsc/test:run/build green locally before merge (no CI).

## References
- Investigation evidence (this spec's Problem section) — file:line list is the map.
- `src/hooks/useEditStoreLegacy.ts`, `src/stores/editStore.ts` (persist 394-476), `src/modules/generatedLanding/LandingPageRenderer.tsx`, `src/modules/templates/meridian/hooks/useMeridianBlock.ts`, `src/hooks/editStore/uiActions.ts:232`.
- Test project: naayom prod token `Ix_Ki4FMSWKB` (13 pages / 44 sections / ~308 elements) — realistic load.

## Open exploration questions
- How many of the ~100+ `useEditStoreLegacy()` call sites are render-hot vs event handlers (handlers can keep whole-store reads via `getState`)?
- Do techpremium/hearth/lex have equivalents of `useMeridianBlock`'s per-render object creation?
- Where exactly does UI-chrome state live in the store shape — clean slice boundary available?
- Does publish still depend on scraping preview DOM (`preview/[token]/page.tsx:305` `previewElement.innerHTML`) vs `/api/publish` `generateStaticHTML()`? Constraint for ANY preview-renderer change — verify, don't touch preview's renderer choice in this spec.
- Template-import gate returns `null` (blank screen) until chunk loads (`LandingPageRenderer.tsx:136,866`) — cheap skeleton/spinner possible without behavior change?

## Candidate human gates
- localStorage persist shape change (if versioned migration needed) — sign-off before merge.

## Acceptance criteria
- [ ] Chrome CPU 6× throttle, naayom-scale project: hero focus + type + blur cycle visibly smooth (no lag).
- [ ] React Profiler: that cycle re-renders 1 section's blocks only (not all 11).
- [ ] Zero localStorage writes while typing; ≤1 debounced write after idle.
- [ ] Editor behavior pixel/behavior-identical (manual-test P0 pass on one product + one service template).
- [ ] /preview/[token] on 6× throttle: first render smooth after load; Profiler shows no full-tree re-render storms; preview visually identical.
- [ ] tsc, test:run, build green.

## Pilot / smallest slice
This IS the pilot of the perf track. Decision gate: profile on 6×-throttled Chrome after perf-01 — if already smooth, perf-02 shrinks to cleanup priority; if not, perf-02 proceeds as perf work.

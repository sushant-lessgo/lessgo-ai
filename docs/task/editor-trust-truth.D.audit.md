# editor-trust-truth — TASK D audit (commit-path + synchronous-flush guarantee)

## Files changed
- `src/app/edit/[token]/components/editor/InlineTextEditorV2.tsx` — added flush-on-exit safety net (beforeunload + visibilitychange(hidden)) plus two refs to drive it. No other files changed.

`useEditor.ts` and the store action file were NOT touched — the trace below shows nothing on the V2 commit path is deferred there, so no edit was warranted.

## Traced commit chain (blur → store)

Every hop is a direct synchronous call. No `setTimeout` / `debounce` / `queueMicrotask` / `rAF` sits between the DOM text and the store write.

1. `InlineTextEditorV2.tsx:handleBlur` (now ~L200) — on blur, after the toolbar-click guard, calls `saveContent()` **synchronously as its first action**, before `setIsEditing(false)` / `setTextEditingMode(false)` / `hideToolbar()`.
2. `InlineTextEditorV2.tsx:saveContent` (L110–140) — reads `editorRef.current.innerHTML` / `textContent`, computes `finalContent`, and if it differs from `originalContentRef` calls `onContentChange(finalContent)` synchronously.
3. `MeridianEditable.tsx:112` (and the 7 sibling `*Editable.tsx` wrappers, identical shape) — `onContentChange={(next) => onSave?.(next)}` → calls the block's `onSave`.
4. Block, e.g. `meridian/blocks/CTA/ArcCTA.tsx:56` — `onSave={(v) => handleContentUpdate('headline', v)}`.
5. `shared/useTemplateBlock.ts:96–101` — `handleContentUpdate` is a `useCallback` that calls `updateElementContent(sectionId, elementKey, value)` directly.
6. `hooks/editStore/contentActions.ts:80` — `updateElementContent` is `set((state) => …)`, a synchronous zustand/Immer store write.

Enter-to-save (`enterBehavior:'save'`) and the ESC path run through the same `saveContent()` (ESC restores DOM to original first, so `saveContent` is a no-op commit) — same synchronous chain.

## Deferrals found and dispositions

- **`InlineTextEditorV2.tsx` blur path** — no deferral. `saveContent` is called synchronously. PROVEN SAFE (chain above).
- **`InlineTextEditorV2.tsx:152` `requestAnimationFrame`** — only places the caret for `autoFocus`; not on the commit path. PROVEN SAFE.
- **`useEditor.ts` `enterTextEditMode`/`exitTextEditMode` (legacy contenteditable path, incl. the `setTimeout` at L576 and the `element.dataset.pendingContent` blur/exit commits)** — NOT the V2 path. For an InlineTextEditor the `enterTextEditMode` inlineEditor branch (L408) only focuses + shows the toolbar; it never installs the legacy `element.onblur`/`pendingContent` handlers, and V2 exits via its own React `onBlur`. So none of these deferrals participate in V2's commit. PROVEN SAFE (left untouched).
- **`toolbars/TextToolbarMVP.tsx` (formatting)** — out of scope (not in Files-touched). Inspected for completeness: formatting commits via `updateElementContent` are synchronous; the `setTimeout(…, 50/100)` only clears the `formattingInProgress` UI flag AFTER the commit, and no `isFormatting` guard wraps/skips `saveContent` or the blur commit. PROVEN SAFE — nothing to change.
- **`updateElementContent` (contentActions.ts)** — `set()` is synchronous; the only early-returns are guards (forbidden image src, missing section/elements) that reject a write by design, never defer it. PROVEN SAFE.

Net: the blur→store commit was already fully synchronous. The remaining gap was tab-exit/backgrounding while editing, where blur never fires.

## What changed

Added a flush-on-exit safety net in `InlineTextEditorV2.tsx`:
- `isEditingRef` + `saveContentRef`, refreshed every render, so the once-registered native listeners always see current editing state and the latest save closure (no stale closure over `onContentChange`).
- A `useEffect([])` registering `window` `beforeunload` and `document` `visibilitychange`; on unload, or on `visibilitychange` when `document.visibilityState === 'hidden'`, it calls `saveContentRef.current()` iff `isEditingRef.current` is true. This routes through the same synchronous `saveContent → onContentChange → updateElementContent` chain — a store write only, no network (compliant with beforeunload restrictions; persistence stays the autosave layer's job).

Kept the editor semi-controlled/uncontrolled (DOM = source of truth during edit) — no change to controlled-ness, no new abstractions, no store refactor.

## Guarantee now provided

- **blur → store commit is synchronous** because `handleBlur` calls `saveContent()` as its first statement, and every subsequent hop (`onContentChange` → wrapper `onSave` → `handleContentUpdate` → `updateElementContent`'s zustand `set`) is a direct synchronous call with no timer, debounce, microtask, or `isFormatting` guard in between. A blur commit can never sit behind a starvable/clearable timer.
- **tab-exit / backgrounding while editing → store commit is synchronous** via the new `beforeunload`/`visibilitychange(hidden)` listeners, which invoke the same synchronous `saveContent` chain (store write only).

## Test results
- `npx tsc --noEmit` — clean (no output).
- Vitest: grep found no tests covering `InlineTextEditorV2` or `useEditor`; none to run. (Full suite deferred to central gate per instructions.)

## Open risks
- `beforeunload` synchronous store `set` fires the store's subscribers; if any subscriber is heavy this runs on the unload path. In practice the commit is a single Immer write and the guard skips when `finalContent === originalContentRef` (no-op), so cost is negligible.
- The safety-net commit reaches the in-memory store only. Whether it is persisted before an actual unload still depends on the existing autosave/persistence layer (out of scope here; addressed by phase 3). `visibilitychange(hidden)` is the more reliable path since the page usually survives to let autosave run.

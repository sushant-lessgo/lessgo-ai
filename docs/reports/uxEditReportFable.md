All three scouts are back. Here's the UX assessment of /edit/[token].

TLDR: the editor's core loop (inline text edit, element regen w/ variations, image flow, theme popovers) is solid, but it ships a lot of dead UI (buttons that confirm-then-do-nothing), has no mobile preview, and has two data-loss-grade gaps (silent load-failure + last-write-wins save, no unsaved-changes guard).

1. Key functionality missing

- Device/mobile preview — DeviceToggle.tsx exists but is stubbed AND unmounted. Landing pages are majority-mobile traffic; users literally can't see mobile without resizing the window. Biggest single gap.
- Undo for section delete — delete says "cannot be undone" via native window.confirm. A localStorage backup is even written (useSectionCRUD.ts:516) but there's no restore affordance. Best practice is delete + "Undo" toast, no confirm at all.
- Drag-and-drop reorder — move up/down buttons only. @dnd-kit is in package.json with zero usage in src. Left-panel outline would be the natural drag surface.
- Unsaved-changes guard — no beforeunload, no nav guard. Close tab mid-edit = whatever the 1s poller didn't catch is gone.
- Live slug availability check — /api/checkSlug exists; SlugModal never calls it. Collisions surface only after clicking Publish.
- Credit transparency — zero credit UI in the editor. No cost shown before Regenerate (1–10 credits), no balance, no "out of credits → upgrade" state; insufficient credits lands in a generic "Failed to regenerate" error.
- Publish from the editor — publish lives only on /preview/[token]. Editor's terminal action is "Preview"; users must discover publish is one page away.
- Version history / restore — publish creates immutable versions server roll back to a previous version or previous generation (page-level"Regen Copy" has no compare/revert beyond generic undo).
- Alt-text that persists — the edit UI exists, but save routes throughp (ImageToolbar.tsx:55). Functionality missing despite UI present; alsoan SEO/a11y hole.

2. Implemented, but not per best practice

- Auto-save — a 1s setInterval polling isDirty, not a debounced save-on-idle. On failure: small static red "Save failed" text, no toast/backoff, and an implicit infinite
retry loop. Notably, a full-featured persistence system (retry, conflits, PersistenceStatusIndicator) exists inautoSaveDraft.ts/useAutoSave.ts but is not on the mounted path — the live save is a blind last-write-wins POST /api/saveDraft.
- Load-failure handling — non-404 /api/loadDraft errors are swallowed ditor renders empty. Combined with last-write-wins auto-save, atransient load failure can let the user unknowingly overwrite a real draft with a blank one. This is the scariest finding.
- Two tabs = silent clobber — tabManager only coordinates edit↔previewtection, though the machinery exists unused.
- Undo/redo coverage is partial — history push is limited to theme/section/layout/content ops, so some edits don't undo; users can't predict what Cmd+Z will do. (Also a literal bug: missing break on the Cmd+D case, uiActions.ts:881, falls
- Destructive-action pattern — native window.confirm for section delete: off-brand, blocking, and lies about permanence. Element "Delete" is worse — it confirms, then no-ops.
- Publish feedback — one spinner for a multi-stage publish (HTML gen → blob → KV); errors render only inside the SlugModal. Fine for happy path, opaque on slow/failed publishes.
- Regen feedback — no streaming, progress is a hardcoded 100. Element regen's 5-variations-with-current-as-option-0 is genuinely good UX; section and page regen of that (replace-in-place, no compare) — inconsistent mental model fort.
- Text formatting — the wired toolbar is TextToolbarMVP; a richer TextToolbar exists unwired. MVP covers B/I/U, align, size, color — no lists, links-in-text, or clear-formatting.

3. Bad UX (actively harmful today)

- Dead buttons shipped live — Element toolbar Style/Duplicate/Delete aection advanced "Regenerate Content" is a TODO no-op; Help menu ("Editor Guide", "Video Tutorials", "Live Chat Support", "⌘K Keyboard Shortcuts") is entirely dead buttons. Every one of these trains users that the product is broken. Confirm-then-nothing Delete is the worst offender.
- Debug artifacts visible to users — fixed bottom-right badges ("Edit Mode Active", "Variable System"…, LandingPageRenderer.tsx:718-751) render in normal edit mode, plus🔍 [DEBUG-BUG2] console logs on the save path.
- "Cannot be undone" fear messaging — punishes experimentation, which is the whole point of an AI-draft-then-edit product. The safety net (undo stack, backups) partiallyexists; the copy denies it.
- No guidance at all — no tour, no first-run hints; discoverability of click-to-edit, floating toolbars, and the Review checklist relies purely on title tooltips. For a founder-facing tool where the editor IS the product's second impressio real activation risk.
- Save-failure invisibility — the red text sits in the header; a user mid-page never sees it and keeps editing on a failing save.

Priority take: (1) fix the data-loss pair (load-failure swallow + no beforeunload), (2) remove/hide every dead button and debug badge — cheap, pure trust win, (3) mobile
preview, (4) credit surfacing pre-spend, (5) delete→undo-toast pattern
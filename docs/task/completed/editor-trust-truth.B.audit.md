# editor-trust-truth — Task B audit: delete dead FormToolbar

## Files changed
- `src/app/edit/[token]/components/toolbars/FormToolbar.tsx` — DELETED
- `src/app/edit/[token]/components/ui/FloatingToolbars.tsx` — removed FormToolbar import + mount block

## Reachability investigation (exact findings)
Callers of `showFormBuilder()` in editor UI:
- `FormToolbar.tsx:107` (deleted) — its only working button.
- `src/components/toolbars/ButtonConfigurationModal.tsx:478` (`handleCreateNewForm`) — **independent path**: button config → "Create New Form" opens the form-builder modal.

'form' toolbar-type trigger chain: `activeToolbar === 'form'` requires store `toolbar.type === 'form'` (see `selectionPriority.ts:66` + `getActiveToolbar`). That is only set by `showToolbar('form', …)`, called only from `showFormToolbar` (`uiActions.ts:373`). Grep for `showFormToolbar(` / `showToolbar('form'` → **zero callers**. So the 'form' toolbar was already unreachable via clicks; FormToolbar was dead in practice.

Conclusion: an independent, working path to the form-builder modal exists (ButtonConfigurationModal), so **delete-only** — no inline chip needed. Constraint (form-builder modal stays reachable) satisfied.

## What I did
- Delete-only. Removed the `FormToolbar` import and the `{shouldShowToolbar('form') && … <FormToolbar/>}` mount block from `FloatingToolbars.tsx`.
- Did NOT touch the FormBuilder modal, `useSelectionPriority`, or the 'form' toolbar-type plumbing (`showFormToolbar`/`hideFormToolbar`/`showToolbar` 'form' branch) per scope. These remain as inert plumbing (a substring match on "FormToolbar" but a different symbol).

## Deviations
- None to code scope. Out-of-scope note (not edited): `src/app/edit/[token]/README.md:214` documents FormToolbar's location — now stale. Not in Files-touched list, so left untouched; flag for a docs pass.

## Tests
- `npx tsc --noEmit` → exit 0 (clean).
- No test/spec files reference FormToolbar (grep clean).
- Full suite / build intentionally not run (orchestrator gates centrally).

## Open risks
- Low. FormToolbar was already unreachable by user interaction; deletion is behavior-preserving. Form-builder modal remains reachable via button configuration.
- The 'form' toolbar-type plumbing is now fully dead (no consumer component). Left in place per scope; candidate for a later cleanup once form-editing UX is rebuilt post-scale §6.

---
tier: standard
tier-why: deletes an editor-store action + its UI trigger (editor internals) and de-dups a modal mount — low blast radius, but one review pass to guarantee no dangling references to the removed feature.
---

# editor-defect-fixes — spec

## Problem / why
Two 🔴 editor defects surfaced by the toolbar track, owed before the big-bang push
(`docs/product/deploy-qa-checklist.md` §D):

1. **Convert-button-to-form crashes on use.** `convertCTAToForm` (`uiActions.ts:489`, triggered
   via `MainContent.tsx:320`) writes a phantom `state.forms.formBuilder.visible` → TypeError.
   The feature is the **wrong solution to a real problem**, so it is being **removed, not
   patched** — less code, no crash, no half-baked feature to maintain.
2. **Button-settings popup mounted twice.** `GlobalButtonConfigModal` is mounted at both
   `EditLayout.tsx:223` and `GlobalModals.tsx:99` → Radix cross-aria-hides the two instances →
   screen readers get no usable dialog + pointer interception (a11y).

## Goal
Remove the convert-button-to-form feature entirely (action + its UI trigger + any dead types),
and de-duplicate the button-config modal so it mounts exactly once. Pure removal/cleanup — no new
behavior added.

## Scope OUT (non-goals)
- **Publish-HTML sanitization** (the dead `sanitizeHtmlContent` layer) — split into its own
  `publish-sanitize` security spec; it needs an allow-policy decision, not a mechanical fix.
- **Building the real replacement** for convert-to-form (inline email+button in the hero for
  single-field capture) — backlogged (see `productBacklog.md`), not built here.
- Any new form functionality or form-builder changes beyond removing the broken path.

## Constraints
- Deleting `convertCTAToForm` must remove **all** references — the action, its declaration on the
  store action types, the caller, and any button/CTA toolbar/menu entry that offers "convert to
  form". Grep-clean: no dangling imports or dead types.
- Editor↔published parity must be unaffected — confirm no published-render path depends on the
  removed action (it writes editor-only UI state, so expected safe, but verify).
- Rides the big-bang batch (unpushed). Re-green = `tsc` + `test:run` + `build` + `lint`.

## References
- `src/app/edit/[token]/.../uiActions.ts:489` (`convertCTAToForm`) · `MainContent.tsx:320` (caller)
  · `src/types/store/actions.ts` (action type decl, if present).
- `EditLayout.tsx:223` + `GlobalModals.tsx:99` — the two `GlobalButtonConfigModal` mounts. Keep
  the canonical one (`GlobalModals` is the modal-aggregator by name — confirm in scout).
- `docs/product/deploy-qa-checklist.md` §D (the defect list this closes).

## Open exploration questions (scout)
- Every UI entry point that triggers `convertCTAToForm` (button toolbar? context menu?) — find all.
- Which of the two `GlobalButtonConfigModal` mounts is canonical / which to delete.
- Does any stored project `content` contain a CTA already converted to a form (would deletion
  orphan data)? Likely none — the feature crashes — but confirm.

## Candidate human gates
- None expected (no schema / auth / publish / prod-data). Founder eyeball that the button-settings
  popup still opens, edits, and closes correctly after the de-dup.

## Acceptance criteria
- [ ] `convertCTAToForm` action + all references removed (no dangling imports, dead types, or UI
      triggers) — grep-clean.
- [ ] The button/CTA toolbar/menu no longer offers "convert to form".
- [ ] `GlobalButtonConfigModal` mounts exactly once; the button-settings popup still opens / edits
      / closes correctly.
- [ ] a11y: single dialog in the accessibility tree (no cross-aria-hide).
- [ ] Editor↔published parity unaffected (no published render depends on the removed action).
- [ ] `tsc` + `test:run` + `build` + `lint` green.

## Pilot / smallest slice
Single phase — both are small removals. Standard tier: scout (find all refs + the canonical mount)
→ plan → implement → one impl-review over the diff (its only job: prove nothing still references
the deleted feature).

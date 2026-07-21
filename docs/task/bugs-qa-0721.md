# Bug round `qa-0721`

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\qa-0721`
- **Branch:** `fix/qa-0721`
- **Base:** `main`
- **Audit:** `docs/task/bugs-qa-0721.audit.md`

## Progress log

- B1 Preview mode still shows editing affordances: pending

---

## B1 — Preview mode still exposes editing UI

- **Severity:** P1
- **Env:** editor (`/edit/[token]`), preview mode toggle
- **Symptom:** Clicking **Preview** in the editor hides the toolbars, but the page
  is still editable/decorated with editing chrome. It does not read as a preview
  of the published page.
- **Repro steps:**
  1. Open a project in the editor `/edit/[token]`.
  2. Click **Preview** (mode toggle).
  3. Observe the rendered page.
- **Expected:** All editing affordances disappear — text is NOT editable, no
  remove/delete "cross" icons, no "Manage photos" link, no "Add a client
  testimonial" (or any add-item) control, no hover outlines/selection chrome.
  The page should look like the published page.
- **Actual:**
  - Toolbars ARE correctly hidden (this part works).
  - Text is still click-to-edit (contentEditable active, edits commit).
  - Cross / remove ("×") icons still render on items.
  - "Manage photos" link still renders.
  - "Add a client testimonial" (add-item) control still renders.
- **Suspected area:** preview-mode gating in the edit route —
  `src/app/edit/[token]/components/layout/EditLayout.tsx`,
  `src/utils/unifiedModeSelector.ts`, `src/hooks/editStore/uiActions.ts`,
  selection system, and the per-element editable/add/remove affordances rendered
  by block components (`IconEditableText`, `AvatarEditableComponent`, item
  add/remove controls). Likely the mode flag gates only the toolbar layer, not
  the per-element affordance layer.
- **Tier:** `risky` — editor store internals + editor/published render surface.

### Investigation notes (verdict: diagnosed)

**Root cause.** `mode` is an edit-store flag (`src/stores/editStore.ts:189`, set by
`EditHeaderRightPanel.tsx:191`). Renderer-level chrome honors it (left rail,
section chrome, SelectionSystem, LandingPageRenderer) — that's why toolbars
correctly vanish. But the **block-internal** affordances of three block families
never read it:

- `src/modules/skeletons/work/blocks/editPrimitives.tsx` (work/atelier)
- `src/modules/templates/granth/blocks/editPrimitives.tsx` (hard-codes `mode="edit"` @68)
- `src/modules/templates/vestria/blocks/editPrimitives.tsx` (hard-codes `mode="edit"` @75)

Their `Editable/Txt`, `Img`, `Link`, `List`, `Toggle` primitives render
`InlineTextEditorV2`, the `wk-list-x` "×", `wk-list-add` "+ Add", image
Replace/Remove + MediaPickerModal, and LinkPicker **unconditionally**.
`InlineTextEditorV2` itself has zero mode awareness (`tabIndex`, `role=textbox`,
onClick→focus→`contentEditable`), so click-to-edit works in preview and commits.

Two dead red herrings: `src/utils/unifiedModeSelector.ts` has **zero importers**;
`LandingPageRenderer` passes `isEditable={mode !== 'preview'}` into blocks but
**no template/skeleton block reads that prop**.

The 6 classic templates (meridian/techpremium/hearth/lex/surge/lumen) are already
correct (`const edit = mode === 'edit'` idiom) — out of scope.

Same leak affects `/preview/[token]` and the mobile-preview iframe; one fix covers
all three surfaces.

**Chokepoint exists:** 3 `editPrimitives` modules cover 39 block wrappers +
`InlineTextEditorV2` as an app-wide contentEditable chokepoint. Only 3 per-block
sites fall outside: `WorkGalleryGrid.tsx` ("Manage photos"),
`WorkProofTestimonials.tsx` ("Add a client testimonial"),
`VestriaTailoredHero.tsx` (media chrome).

**Dual-renderer:** NOT in scope — published output is already correct; this makes
preview converge on it.

**Tier re-check:** stays `risky` (editor store internals + editor render surface).

---
tier: full
tier-why: touches the publish path (/api/publish, publish state), XFO/middleware headers, editor store (mode/deviceMode + EditProvider bootstrap), and the onboarding→editor reveal seam — multiple risky surfaces, >15 files.
---

# editor-route-consolidation — spec

## Problem / why
Generate, reveal, and preview are scattered across three surfaces (`/generate/[token]`, `/preview/[token]`, and the work-journey STEP 06 iframe) plus the editor. The editor's "Publish" button is a shell that just opens `/preview` — the real publish flow lives only there (`EditHeaderRightPanel.tsx:91`). Result: extra routes to maintain, a new-tab hop to publish, no honest in-editor mobile preview, and two reveal paths. Founder decision (2026-07-16, `memory/project_editor_route_consolidation` + `project_preview_consolidates_into_editor`): the **edit route becomes the single home for generate + reveal + preview**, with preview as an in-editor mode.

## Goal
Make `/edit/[token]` the one place a page is generated-into, revealed, previewed (read-mode + true-viewport mobile), and **published** — proven first on the work journey. Preview becomes an in-editor mode toggle, not a separate route; the work-journey reveal becomes the editor's first-load state; the real publish flow moves into the editor header. Deleting the old routes is a gated follow-on, not part of this slice.

## Scope IN (the pilot — work journey)
- **Preview as in-editor mode** — a real Edit/Preview flip driving `setMode('preview')` for a clean read view, plus a **mobile-view toggle rendered through a narrowly-scoped iframe** (true viewport; inline can't fire real breakpoints). The store concepts exist but are inert/dead today: `setMode` (`coreActions.ts:196`), the inert Edit/Preview segmented control (`EditHeaderRightPanel.tsx:167-181`), the dead `DeviceToggle` (`DeviceToggle.tsx:23`) + unused `setDeviceMode` (`layoutActions.ts:698`).
- **Reveal folds onto the edit route** for the work journey — STEP 05 generation completion lands the user in the editor's first-load reveal state instead of routing to a separate surface; drop the STEP 06 `/preview?chrome=0` iframe (`StepReveal.tsx:120`). Preserve the one-drive-per-mount generation guard (`StepBuilding.tsx:66-90`) so generation doesn't double-fire.
- **Publish relocated into the editor** — wire the existing header button shell (`EditHeaderRightPanel.tsx:184-202`, currently `onClick=handlePreviewClick`) to the **real** publish flow (`/api/publish`, publish state machine, domain upsell) so publishing no longer requires the `/preview` hop.
- **XFO moves atomically** — re-point `X-Frame-Options: SAMEORIGIN` off `/preview/:token+` onto the new editor-preview surface, keeping the two `next.config.js` `headers()` sources mutually exclusive (negative-lookahead). Runtime header — verify with `curl -I`, not `npm run build`.

## Scope OUT (non-goals)
- **Deleting `/preview` and `/generate`** — decision gate AFTER this pilot proves the mechanics. They stay alive (admin, work-dashboard "Update site", error-boundary fallback, privacy preview, and the generic wizard still point at them).
- **Generic-wizard reveal migration** — the wizard (thing/trust/other engines) reveals via `/generate`; it moves when those engines move to the journey (separate track). `/generate` lingers until then.
- **Onboarding post-generation LOCK** — the committed "inputs LOCKED post-gen" guarantee is unimplemented (no guard; `/onboarding/[token]` can re-enter a confirmed brief). Deferred to its own spec.
- **Publish-options dropdown** — stays greyed (`Coming what="publish options"`).
- Migrating the non-journey consumers of `/preview` (admin `admin/page.tsx:287`, `WorkLibraryClient.tsx:246`, `EditLayoutErrorBoundary.tsx:84`, `/preview/[token]/privacy`) — part of the gated retirement follow-on, not the pilot.

## Constraints
- **`.app-chrome` bleed** — template output must never render under the app-chrome ancestry (fonts/tokens bleed; dual-renderer divergence). Read-mode inline is import-guarded today; mobile-view MUST be an iframe (separate document). See `memory/project_appchrome_font_family_bleed`.
- **Dual-renderer** — preview + edit share `LandingPageRenderer` + `useEditStore` (confirmed); published uses `LandingPagePublishedRenderer`. Mode-flag (store) and viewport (iframe) are separable — don't rearchitect rendering.
- **`EditProvider` baseline-split** — preview skips the ~68KB baseline (`preview/page.tsx:66-71`); edit loads it. A consolidated provider must serve both without losing that optimization.
- **`continueRouting` is verbatim-ported, load-bearing** (`continueRouting.ts:9-26`, "Do NOT simplify") — leave its `/generate` branch intact this slice (route not deleted yet).
- **`tabManager` singleton** (`PreviewButton.tsx:8-14`) — folding preview into the same tab changes the new-tab lifecycle; handle cleanup.
- Two stores at the seam: onboarding/journey = `useWizardStore`, editor = `useEditStore`; handoff is DB (`/api/loadDraft`) + `router.push`. Editor first-load reveal means `EditProvider` bootstraps from a just-generated draft.
- Full-tier /feature pipeline (scout → plan → plan-review → per-phase implement + impl-review + gates).

## References
- **Scout brief:** `docs/task/editor-route-consolidation.scout.md` (full route inventory, XFO verbatim, retirement blast radius, seams — read first).
- Committed decisions: `memory/project_editor_route_consolidation`, `memory/project_preview_consolidates_into_editor`.
- Interim iframe reveal already shipped by E1: `StepReveal.tsx` + the `/preview/:token+` SAMEORIGIN rule in `next.config.js` (carries a "MUST MOVE WITH THE REVEAL" note).
- Existing (inert) building blocks to reuse, not rebuild: `setMode` (`coreActions.ts:196`), `setDeviceMode`/`globalSettings.deviceMode` (`layoutActions.ts:698`), `DeviceToggle.tsx`, the Edit/Preview segmented control + Publish shell (`EditHeaderRightPanel.tsx`).
- Publish mechanics to relocate: the real publish action + state on `/preview` (`preview/page.tsx` action bar) → `/api/publish`.

## Open exploration questions (feeds scout/plan)
- Exact XFO re-point target: a narrow `/edit/[token]/preview` sub-route vs framing the whole `/edit/:token+` (widens the framable surface — prefer narrow).
- Hybrid boundary: read-mode = inline `setMode('preview')`; mobile-view = iframe. Confirm the iframe target (a chromeless editor-preview surface) and how it shares/reads the just-edited store state (same-origin postMessage vs re-load draft).
- How the editor's first-load distinguishes "fresh reveal" (animate, just-generated) from "returning to edit" — reuse of `PageRevealAnimation`?
- `EditProvider` config reconciliation (baseline-split + `resetOnTokenChange`) serving both preview-mode and edit in one mount.

## Candidate human gates
- **Publish path change** — relocating the real publish flow into the editor: publish end-to-end on a real project must be founder-verified on the QA preview deploy (creates `PublishedPage`/version, blob+KV, `/p/[slug]` serves).
- **XFO/middleware header change** — `curl -I` verification that SAMEORIGIN is on the new surface and DENY everywhere else, mutually exclusive; the reveal iframe actually renders (silent-blank trap).
- **Pilot decision gate** — founder sign-off that in-editor reveal + preview + publish works on the work journey, before the follow-on retires routes.

## Acceptance criteria
- [ ] In `/edit/[token]`, the Edit/Preview control flips to a clean read-mode (`setMode('preview')`) with no new-tab hop.
- [ ] A mobile-view toggle renders the page through a narrowly-scoped iframe at a true mobile viewport (real breakpoints fire), escaping `.app-chrome`.
- [ ] Completing a work-journey generation lands the user in the editor's first-load reveal state (not a separate route); generation fires exactly once.
- [ ] The editor header **Publish** button runs the real publish flow in-place (no `/preview` hop) — a page publishes and `/p/[slug]` serves it.
- [ ] `next.config.js` XFO: SAMEORIGIN on the editor-preview surface, DENY elsewhere, sources mutually exclusive; verified via `curl -I`; the iframe renders (not silently blocked).
- [ ] `/preview` and `/generate` still function for their remaining consumers (admin, work-dashboard, wizard) — nothing deleted this slice.
- [ ] Green gates: `tsc` · `test:run` · `build` · `lint`; editor↔published parity unaffected.

## Pilot / smallest slice
The whole IN-scope list **is** the pilot, scoped to the **work journey** only. It proves the three risky mechanics — in-editor mode-preview (incl. iframe mobile viewport), reveal-as-first-load-state, and in-editor publish — without deleting any route. **Decision gate:** founder verifies the work-journey path end-to-end on the QA preview. On pass, a follow-on spec retires `/preview` + `/generate` and migrates the remaining consumers (admin, work-dashboard, error-boundary, privacy, wizard→journey). On fail, the routes are still intact and nothing regressed.

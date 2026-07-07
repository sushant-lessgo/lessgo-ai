# kill-section-background-settings — spec

## Problem / why
The section toolbar's **Background Settings** option (`SectionBackgroundModal`) writes
`backgroundType` (primary/secondary/neutral/custom) + `sectionBackground` onto section
content, mapping to the **legacy** `theme.colors.sectionBackgrounds` system. Every current
template renders through the `usesTemplate` branch (`LandingPageRenderer.tsx:445`), where the
surface comes solely from `tmpl.getSurfaceForSection()` → `data-surface`. That branch never
reads `backgroundType`/`sectionBackground`. So on any real project today the modal **does
nothing visible** — it's dead UI that lies to the user.

## Goal
Remove the dead Background Settings entry point so the toolbar reflects reality. Record the
future "per-section surface override" idea in the product backlog so the capability isn't lost.
No behavior change to how pages render.

## Scope OUT (non-goals)
- NOT removing store actions `setBackgroundType`/`setSectionBackground` or the
  `sectionBackground`/`backgroundType` types — still referenced by legacy non-template renderer
  paths (`shouldUseVariableSystem`, `SmartTextSection`).
- NOT migrating or stripping persisted `backgroundType`/`sectionBackground` on existing projects
  — harmless, ignored by the template path.
- NOT touching the legacy renderer branches themselves (separate cleanup).
- NOT building the surface-override feature now (backlog only).

## Constraints
- Both edit + published render paths must be unaffected (template path already ignores this data).
- `tsc` + `test:run` must stay green; the toolbar and edit page must still build/render.
- Watch for any other caller of `showBackgroundModal` / import of `SectionBackgroundModal`.

## References
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx` — `background-settings` action (~L254).
- `src/app/edit/[token]/components/ui/SectionBackgroundModal.tsx` — modal to delete.
- `src/app/edit/[token]/components/ui/GlobalModals.tsx` — `showBackgroundModal` wiring.
- `src/modules/generatedLanding/LandingPageRenderer.tsx:445` — the `usesTemplate` branch proving surface comes from `getSurfaceForSection`, not the modal.

## Open exploration questions
- Any consumer of `showBackgroundModal` / `SectionBackgroundModal` beyond SectionToolbar + GlobalModals?
- Does `GlobalModals` register modal state (open flag/portal) that also needs cleanup?
- Does the edit `README.md` reference Background Settings (doc drift)?

## Candidate human gates
- None expected (pure UI removal, no schema/auth/publish/prod-data). Merge-to-main is the usual human gate.

## Acceptance criteria
- [ ] Background Settings action gone from the section toolbar.
- [ ] `SectionBackgroundModal.tsx` deleted; no dangling imports/refs (`showBackgroundModal`, `SectionBackgroundModal`).
- [ ] Edit page builds + renders; section toolbar opens without the option.
- [ ] `npm run test:run` and `tsc` green.
- [ ] Backlog item added to `docs/product/productBacklog.md`: per-section **surface override** (flip a section to another template surface via `data-surface`; needs a template-contract "list surfaces" method + override storage + edit & published renderers + per-template picker).
- [ ] Edit `README.md` updated if it references Background Settings.

## Pilot / smallest slice
Single phase — this IS the slice. Delete entry point + modal + wiring, add backlog note, verify build/tsc/tests.

## Backlog note (verbatim for productBacklog.md)
**Per-section surface override (reimagined Background Settings).** Let the founder flip an
individual section to a different template surface (e.g. cream/white/ink/accent) instead of the
`getSurfaceForSection()` default. Store as a per-section override; honor in BOTH edit
(`LandingPageRenderer`) and published (`LandingPagePublishedRenderer`) via the `data-surface`
attribute. Requires a new template-contract method to enumerate a template's available surfaces
(templates don't expose this today) + a per-template picker UI. Replaces the old dead
primary/neutral/custom modal killed 2026-07-07.
```
```

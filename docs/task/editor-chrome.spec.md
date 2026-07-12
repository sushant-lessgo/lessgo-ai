# editor-chrome — spec

> Source: `docs/reports/app-ui-ux-assessment.md` §1.4, §3 P1, §2 themes 1+2. Beta-quality polish (mostly P1).

## Problem / why
The editor is capable but leaks debug chrome and mixes two visual languages, making it feel half-2026 / half-2025-prototype:
- **On-canvas debug chrome**: "AI Generated" + "12:15:32 PM" timestamp chips on every section — QA leftovers, meaningless to users.
- Section rail labels are **raw ids** ("Cta"); no drag-reorder / add / hide affordance visible.
- **"+ Add page" opens a bare unstyled browser prompt** ("Page name" / OK / Cancel) — jarring vs the rest of the app.
- **Social Media Links modal is unstyled/legacy** vs the polished SEO modal (two visual languages side by side).
- Floating text toolbar **overlaps the top nav bar**.
- Selection state floods the whole hero with a heavy blue tint.

## Goal
The editor presents no internal/debug state to users and speaks one visual language — human section labels, styled dialogs, and non-overlapping, lighter-weight interaction chrome.

## Scope IN
- Remove (or repurpose into a useful tooltip) the "AI Generated" + timestamp chips on sections.
- Section rail: human labels ("Call to action" not "Cta"); expose reorder/hide affordance (at least labels for beta; reorder/hide if cheap).
- Replace the bare "+ Add page" browser prompt with a styled dialog matching the SEO modal.
- Restyle the Social Media Links modal to match the SEO modal's visual language.
- Fix floating text toolbar overlapping the top nav.
- Soften the hero selection tint.
- App-shell brand/year on editor surfaces ("Lessgo AI", current year) where they appear.

## Scope OUT (non-goals)
- Editor engine / store rework, world-class-editing primitives — owned by the editor track (`editorPlan.md`).
- Template/variant/palette switcher expansion — separate.
- Published-page output hygiene — owned by `published-output-hygiene`.
- Full section rail drag-reorder if it turns out non-trivial (defer to editor track; labels are the beta floor).

## Constraints
- Do not collide with in-flight editor-track work (`editorPlan.md` phases 0–3 merged, phase 4 next) — coordinate ordering; this is chrome/polish, not store changes.
- Timestamp chips may be behind `NEXT_PUBLIC_DEBUG_EDITOR` — verify they're not just a stray debug flag before ripping out.
- Human labels must map from section type ids without breaking `${type}-${uuid}` id contract.

## References
- `src/modules/generatedLanding/LandingPageRenderer.tsx` (edit renderer) + section rail component.
- SEO modal (the visual target) vs Social Media Links modal + Add-page prompt (the offenders).
- `src/lib/debugFlags.ts` / `NEXT_PUBLIC_DEBUG_EDITOR` (timestamp chip source?).
- `docs/tracks/editorPlan.md` (coordinate).
- Report §1.4.

## Open exploration questions
- Are the "AI Generated"/timestamp chips debug-flag-gated or always rendered? Where?
- Where does the section rail derive its labels, and is there existing reorder/hide plumbing?
- Where is the "+ Add page" prompt (native `prompt()`?) and the Social modal, vs the SEO modal component?
- What causes the floating toolbar to overlap the nav (z-index / positioning)?

## Candidate human gates
- None (UI-only, no schema/auth/publish/prod-data).

## Acceptance criteria
- [ ] No "AI Generated"/timestamp debug chips visible to users on canvas.
- [ ] Section rail shows human labels (not raw ids).
- [ ] "+ Add page" uses a styled dialog, not a native browser prompt.
- [ ] Social Media Links modal matches the SEO modal's styling.
- [ ] Floating text toolbar no longer overlaps the top nav.
- [ ] Hero selection tint is lighter/less flooding.

## Pilot / smallest slice
Slice 1 (visible leaks): remove debug chips + human rail labels + kill native add-page prompt. Slice 2: modal restyle + toolbar overlap + selection tint. Gate: a screen-record of the editor shows no debug chrome and one consistent visual language.

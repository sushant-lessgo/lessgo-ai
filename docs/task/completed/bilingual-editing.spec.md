---
tier: standard
tier-why: re-mounts already-wired locale components + a bilingual visibility-gate + an activeLocale reset; touches editor chrome + editStore activeLocale (editor-store surface) → one impl-review. Auto-escalates if scout finds the re-mount needs store surgery (unlikely — machinery is built).
---

# bilingual-editing — spec

## Problem / why
Kundius's site is **bilingual (NL/EN)**. To deliver it, both locales' content must be editable in
the editor. But editor-shell-redesign phase 4 (founder ruling 2026-07-16) **removed the Languages
control** from the editor chrome — the `LanguageToggle` + `LocaleSettings` mounts were deleted from
`EditHeader`. Result: **there is no way to switch which locale you're editing**, so the non-default
(NL) content can't be touched — a **Kundius delivery blocker**.

Worse, a **trap** sits on top: `activeLocale` is persisted store state; any project already parked
on a non-default locale shows **Regen Copy locked with no visible way back** (the regen locale-lock
in `EditHeaderRightPanel` reads `activeLocale`/`localeConfig` from the store, not a toggle).

Confirmed by blindspot pass: this is a **re-mount, not a rebuild.** The i18n machinery is fully
wired end-to-end — `localeContent`/`localeConfig` flow through saveDraft (with per-locale merge
mechanisms), loadDraft, publish, both renderers, the editStore, toolbars, and edit-delta capture
(there's an "i18n-phase-1"). Only the two UI controls were unmounted; both files still exist.

## Goal
Restore the ability to **edit a bilingual project's non-default locale** and clear the
`activeLocale` regen-lock trap — by re-mounting the locale controls **only when a project is
actually bilingual**, so single-locale projects (the ~99%) never see them (honoring the original
removal reason). Minimal slice to unblock Kundius bilingual delivery for beta.

## Scope OUT (non-goals)
- **naayom → Hindi assisted-translation** (the OTHER committed i18n mode) — stays deferred.
- **The full i18n platform** (`i18nPlan.md`) — deferred; this is not that.
- **New i18n behavior** — no new locale-merge logic, no new persistence, no renderer changes. The
  machinery works; this only restores the *controls* + the visibility gate + the trap reset.
- **Showing locale controls on single-locale projects** — explicitly gated OFF (the reason they
  were removed).
- Adding/authoring a *new* second locale onto a currently-single-locale project is a config action
  (LocaleSettings) — in scope only insofar as re-mounting the existing settings panel; not a new flow.

## Constraints
- **Visibility gate:** locale controls render ONLY when the project declares >1 locale
  (bilingual). Single-locale projects show nothing (no dead weight, no trap).
- **Placement (agreed):** `LanguageToggle` (switch active editing locale — frequent) = a compact
  affordance in the editor **top bar**, bilingual-only; `LocaleSettings` (configure/which locales —
  rare) = inside the editor **Settings modal**.
- **Trap fix:** reset `activeLocale` → default on editor load as a safety belt, so no project is
  ever stuck on a phantom non-default locale with Regen locked and no affordance.
- **Reuse the existing components as-is** (`LanguageToggle.tsx`, `LocaleSettings.tsx`) — re-mount,
  don't rewrite. Use `app-*`/editor-chrome tokens consistent with the redesigned shell.
- **Editor↔published parity + the locale-merge mechanisms must stay intact** — this is a controls
  re-mount, not a change to how `localeContent`/`localeConfig` persist or render.
- Rides the big-bang batch. Re-green = tsc + test:run + build + lint.

## References
- `src/app/edit/[token]/components/editor/LanguageToggle.tsx` + `LocaleSettings.tsx` — the components to re-mount.
- `src/app/edit/[token]/components/layout/EditHeader.tsx` — where they used to mount (removed); the redesigned top bar is the new home for the toggle.
- `src/app/edit/[token]/components/layout/EditHeaderRightPanel.tsx` — the regen locale-lock (`activeLocale`/`localeConfig` read) — the trap surface.
- `src/app/api/saveDraft/route.ts` (localeContent merge #1/#2, localeConfig) + `loadDraft` + `publish/route.ts` — the wired persistence (do NOT change; confirm the re-mount feeds them correctly).
- editStore `activeLocale`/`localeConfig` (contentActions/generationActions/persistenceActions/uiActions) — where the reset-on-load belt lands.
- Lumen template (EN/NL twin-fields) — the bilingual project shape; Kundius fixture.

## Open exploration questions (scout)
- How is "project is bilingual" determined (localeConfig with >1 locale?) — the exact gate signal.
- Where does the redesigned top bar accept a compact control, and where is the editor Settings modal, for the two mounts.
- Does `activeLocale` reset-on-load risk losing an in-progress non-default edit session? (Confirm it's safe — the overlay is persisted, so switching back is lossless.)
- Confirm the regen locale-lock behaves correctly once the toggle can clear `activeLocale`.
- Any other former caller of the removed mounts to reconcile.

## Candidate human gates
- **Founder verify (pilot):** on Kundius's NL/EN project — toggle appears, switch to NL, edit NL
  content, save, publish → both locales correct. On a single-locale project — no toggle, no lock.
- Visual sign-off that the top-bar toggle fits the redesigned chrome (bilingual-only).

## Acceptance criteria
- [ ] A bilingual (NL/EN) project shows the `LanguageToggle` in the editor top bar and
      `LocaleSettings` in the Settings modal; a single-locale project shows **neither**.
- [ ] Switching the active locale lets you edit the non-default (NL) content; save persists **both**
      locales (locale-merge intact); publish renders both.
- [ ] No project can be stuck on a non-default `activeLocale` with Regen locked and no way back
      (reset-on-load belt + the re-mounted toggle both clear it).
- [ ] Editor↔published parity holds for both locales; the localeContent/localeConfig persistence is
      unchanged.
- [ ] tsc + test:run + build + lint green; a test covers the bilingual-gate visibility + the
      activeLocale reset.

## Pilot / smallest slice
Single phase, one fixture: **Kundius NL/EN project** → editor shows the toggle (bilingual) → switch
to NL → edit → save (both locales persist) → publish renders both; **plus** a single-locale project
shows no toggle and can't be trapped. Standard tier: scout (bilingual-gate signal + mount points) →
plan → implement → one impl-review.

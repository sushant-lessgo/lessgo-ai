# bilingual-editing — plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\bilingual-editing`
- **Branch:** `feature/bilingual-editing`
- **Spec:** `docs/task/bilingual-editing.spec.md` (tier: standard, confirmed — one impl-review at end)

## Overview

Restore bilingual (NL/EN) editing — a Kundius delivery blocker — by re-mounting the two
existing, fully-wired locale controls (`LanguageToggle`, `LocaleSettings`) into the redesigned
editor top bar, gated so they render **only** when a project declares >1 locale
(`isMultiLocale(localeConfig)`). This is a presentation-only re-mount: the i18n machinery
(store overlay, saveDraft/loadDraft locale-merge, publish, both renderers) is untouched, and
the `activeLocale` reset-on-load "trap fix" the spec asks for **already exists** in
`src/hooks/editStore/persistenceActions.ts:464-468` — we lock it with a regression test
instead of writing new store code.

## Progress log

- phase 1 re-mount locale controls + bilingual gate: pending
- phase 2 visibility + reset regression tests, full green gate: pending

## Design decisions (locked for implementation)

1. **Gate signal:** `isMultiLocale(localeConfig)` from `src/lib/i18n/localeContent.ts:28-30`
   is the ONE source of truth. Never re-inline `.locales.length > 1`.
2. **Gate mechanism = component self-hide, not mount-site wrapping.** `LanguageToggle`
   already self-hides (`LanguageToggle.tsx:47`). `LocaleSettings` currently does NOT (it was
   designed as the always-visible entry point to *becoming* multi-locale). Per the spec's
   explicit constraint ("single-locale projects show **neither**") we add the identical
   two-line `if (!isMultiLocale(localeConfig)) return null` self-hide to `LocaleSettings`.
   Both components then self-gate the same way — one pattern, one source of truth, and the
   mount site stays unconditional/dumb. Consequence (spec-sanctioned, Scope-OUT bullet 4):
   there is no UI path for a single-locale project to add a 2nd locale; bilingual projects
   are declared via config/white-glove (how Kundius's already is).
3. **Mount site = inside `EditorDesignControls`** (`EditHeader.tsx:51-83`, the
   `flex items-center gap-2` div), which `GlobalAppHeader.tsx:154` already renders. The
   adjacent comment at `GlobalAppHeader.tsx:153` ("Design-system popover + i18n controls…")
   becomes true again — **no edit to GlobalAppHeader.tsx needed.**
4. **LocaleSettings placement deviates from the spec's letter, on purpose.** Spec says
   "Settings modal" — scout confirmed no Settings modal exists; it's a Popover *menu*
   (`GlobalAppHeader.tsx:158-195`) whose rows dispatch to singleton modals. `LocaleSettings`
   is itself a self-contained popover (own trigger button + own state); opening it from a
   menu row would require converting it to controlled-open props (a rewrite, violating the
   spec's "reuse as-is" constraint) and would recreate the overlapping-two-popovers hazard
   the file already documents (`GlobalAppHeader.tsx:132-135`). Decision: mount it in the top
   bar **beside** `LanguageToggle` (its original paired position), bilingual-gated. Since it
   self-hides on ~99% of projects, the original removal reason (dead weight in the bar) is
   fully honored. Flagged for founder at the phase-1 human gate + in Unresolved questions.
5. **Editor-chrome, not landing-page blocks:** these components render only inside
   `/edit/[token]` chrome. **No `.published.tsx` twin exists or is required** — the
   dual-renderer parity rule does not apply here. (Noted so impl-review doesn't flag it.)
6. **No store surgery.** `setActiveLocale` exists (`contentActions.ts:381-385`);
   `activeLocale` is not persisted and `load()` re-derives it to `defaultLocale`
   (`persistenceActions.ts:464-468`); locale switching is lossless (overlay is
   project-global, restored wholesale). The regen locale-lock
   (`EditHeaderRightPanel.tsx:107-108, 145, 147`) reads live store state and will
   re-enable reactively once the toggle sets the default locale — no change there.
7. **Token pass is minimal.** Spec asks for app-chrome-consistent tokens: swap only the
   legacy `gray-*` container/trigger classes in the two components for `app-*` equivalents
   (`border-app-hairline`, `hover:bg-app-hairline`, `text-app-icon-muted`,
   `rounded-app-ctl-sm` — same family as `BAR_CTL_CLASS` in `../ui/DesignMenuShell`).
   No structural/behavioral change; final look is judged at the phase-1 human gate.

---

## Phase 1 — re-mount locale controls + bilingual gate  **[HUMAN GATE]**

Human gate (before proceeding to phase 2 sign-off/merge): founder pilot verify per spec —
on Kundius's NL/EN project the toggle appears in the top bar, NL is editable, save/publish
carry both locales; on a single-locale project neither control appears; visual sign-off on
fit with the redesigned chrome **and** on the LocaleSettings top-bar placement (decision 4).

**Files touched**
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx`
- `src/app/edit/[token]/components/editor/LanguageToggle.tsx`

**Steps**
1. `EditHeader.tsx`: import `LanguageToggle` and `LocaleSettings` from `../editor/…`;
   render them inside `EditorDesignControls`'s existing flex div, after `designControls`
   (order: design popover → `LanguageToggle` → `LocaleSettings`).
2. `EditHeader.tsx:18-27`: REWRITE the "LANGUAGES CONTROL — REMOVED, do NOT restore
   (decision 8b)" note. New text: controls re-mounted by `bilingual-editing`
   (Kundius blocker), superseding 8b; both self-hide via `isMultiLocale(localeConfig)`
   so single-locale projects still render nothing — the 8b dead-weight rationale is
   preserved by the gate, not by absence. Keep the regen-lock pointer sentence.
3. `LocaleSettings.tsx`: add the self-hide — read `localeConfig` via a selector and
   `if (!isMultiLocale(localeConfig)) return null` before rendering the globe trigger
   (mirror `LanguageToggle.tsx:42-47`). Add a one-line comment: gated per
   bilingual-editing spec; adding a 2nd locale to a single-locale project is
   config/white-glove, not a UI flow.
4. Minimal token pass (decision 7) on `LanguageToggle`'s pill-group container and
   `LocaleSettings`'s trigger button classes only. No layout/DOM restructuring.
5. Do NOT touch: `GlobalAppHeader.tsx`, `EditHeaderRightPanel.tsx`, any store file, any
   persistence route, either renderer.

**Verification**
- `npx tsc --noEmit` clean; `npm run lint` clean (selector-style rules apply — no bare
  `useEditStore()`).
- Manual (`npm run dev`): bilingual fixture (localeConfig `{locales:['en','nl'], defaultLocale:'en'}`)
  → toggle + globe visible; switch to NL → Regen Copy disables with the locale tooltip;
  switch back to EN → Regen re-enables (confirms trap escape, scout §5). Single-locale
  project → neither control renders, bar byte-identical to today. Edit NL text → save →
  reload → NL edit persists and EN untouched (locale-merge intact, no code change expected).

---

## Phase 2 — visibility + reset regression tests, full green gate

**Files touched**
- `src/app/edit/[token]/components/editor/localeControls.visibility.test.tsx` (new)
- `src/hooks/editStore/i18nStoreState.test.ts` (extend)

**Steps**
1. New jsdom component test, following the established real-store pattern of
   `src/components/editor/SocialItemsEditor.test.tsx` (real `createEditStore`;
   `vi.mock('@/hooks/useEditStore')` re-pointing `useEditStore`/`useEditStoreApi` at the
   test instance via zustand `useStore`; `react-dom/client` + `act`, no
   @testing-library — genuinely absent from the repo). Cases:
   - bilingual config (`en`/`nl`) → `LanguageToggle` renders both pills AND
     `LocaleSettings` trigger renders;
   - single-locale / null `localeConfig` → BOTH render null (empty container);
   - clicking the `nl` pill calls through to the real `setActiveLocale` → store
     `activeLocale === 'nl'` and `aria-pressed` moves (real assertion, not endpoint
     theatre — per the inert-assertion lesson).
2. Extend `i18nStoreState.test.ts` with the reset-on-load invariant: seed bilingual
   store, `setActiveLocale('nl')`, re-run the load/hydrate path that contains
   `persistenceActions.ts:464-468` (use the same store-level entry the file's existing
   hydrate/back-compat cases use — `loadFromDraft`; if the reset sits only in `load()`,
   exercise the exported snapshot-apply used by it rather than mocking fetch theatre) →
   assert `activeLocale === 'en'` (defaultLocale) and the `nl` overlay content survived
   untouched (lossless switch). Also assert single-locale/no-config load →
   `activeLocale === 'en'` fallback.
3. No production-code edits in this phase. If a test exposes a real gap (e.g. the reset
   is unreachable from the tested path), STOP and report — do not patch store code
   without plan amendment.

**Verification (feature green gate — standard tier)**
- `npm run test:run` green (new tests + full suite).
- `npx tsc --noEmit` clean.
- `npm run lint` clean.
- `npm run build` green (full build incl. published-CSS/assets steps).

---

## Out of scope / do-not-touch (hard lines)

- `saveDraft` / `loadDraft` / `publish` routes and the locale-merge logic.
- Both renderers + component registries (editor-chrome only; no `.published.tsx` pair).
- editStore slice internals (reset belt exists; `setActiveLocale` exists).
- naayom→Hindi assisted translation; full i18n platform (`i18nPlan.md`); any new
  locale-authoring flow.

## Unresolved questions

1. LocaleSettings in top bar beside toggle (bilingual-gated) instead of nonexistent
   "Settings modal" — OK, or must it be a Settings-menu row (requires controlled-open
   rewrite of LocaleSettings)?
2. Token pass depth: minimal class swap enough, or full `BAR_CTL_CLASS` restyle?
3. Kundius prod project: `localeConfig` already set to `{en,nl}`? If not, who sets it
   (white-glove config) before the pilot verify?

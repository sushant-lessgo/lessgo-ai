# Task F audit — throttled edit-persistence e2e

## Files changed
- `e2e/edit-persistence.spec.ts` (new) — the regression spec.
- `playwright.config.ts` (1 edit) — added the spec to the `authed` project's `testMatch` (strictly required; otherwise no project matches the file and it never runs).

## What the spec does
Regression net for the silent-edit-loss bug class (reports/perf-editor-throttled6x-2026-07-11.md §Edit-loss): under CPU throttle a typed edit rendered in the DOM but never reached the store / localStorage / server.

Flow (mirrors publish.spec conventions):
1. Authed Clerk session from the `setup` project's `storageState` (`e2e/.clerk/user.json`). Loads `/` and waits for `window.Clerk.user` to refresh the short-lived JWT, then uses `page.request` — same rationale as publish.spec.
2. `POST /api/user/persona` (saas-founder) → `GET /api/start` → new throwaway token/project.
3. `seedDraft(api, token, cfg)` seeds a real Meridian draft via the mock-mode strategy→copy→saveDraft routes (reuses the existing helper + `AUDIENCES` config, meridian entry).
4. Open `/edit/<token>`, wait for the hero headline to render.
5. Enable 6× CPU throttle via CDP (`Emulation.setCPUThrottlingRate {rate:6}`).
6. Click the headline contenteditable, `End`, type a unique marker (`E2EPERSIST<Date.now()>`), assert the DOM shows it.
7. Arm `waitForResponse` for a `POST /api/saveDraft` whose request body contains the marker, then blur to commit.
8. Assert: (a) that saveDraft returned 200, (b) `localStorage['edit-store-<token>']` contains the marker (expect.poll), (c) after `page.reload()` the headline still contains the marker.

## Selector choices
- Text element: `[data-element-key="headline"]` (`.first()` = hero, the first section). In edit mode Meridian's hero headline is `InlineTextEditorV2` (`MeridianEditable` → `data-element-key="headline"`, `role="textbox"`, contenteditable on focus). Template-agnostic commit path, so one audience (Meridian) suffices.
- saveDraft identification: predicate matches URL + POST method + **request body contains the marker**, so it can only match our edit's autosave (not the open-time or unrelated writes). Autosave is the event-driven trailing debounce in `useAutoSave.ts` (1s), which fires `POST /api/saveDraft` after the blur commit sets `isDirty`.
- localStorage key: `edit-store-<token>` (`src/utils/storage.ts` PROJECT_KEY_PREFIX), written synchronously per store mutation.

## Deviations from the task (in-scope judgment calls)
1. **Throttle applied after initial load, before the edit interaction** (task listed throttle before the wait-for-visible). Rationale: the regression is in the edit→commit path, not initial load; dev-mode (unbundled webpack) hydration at 6× is prohibitively slow/flaky. The commit/blur/save path — where the bug lived — runs fully under 6×.
2. **Blur via programmatic `el.blur()` instead of clicking a "neutral gutter."** Rationale: a coordinate click on empty canvas is viewport/layout-fragile (left panel width, centered content gutters vary); `el.blur()` fires the identical `handleBlur → saveContent → onContentChange → store set → autosave arm` path a click-away triggers, deterministically under throttle. Faithful to the exact code path the bug was about.
3. **No marker cleanup.** The project is created fresh per run via `/api/start` (throwaway, same lifecycle as publish.spec which also creates a new project each run), so the edited draft is disposable — cleanup unnecessary.
4. Added a defensive `test.skip` when `E2E_CLERK_*`/`CLERK_SECRET_KEY` are absent, for graceful targeted runs (the shared `global.setup` still hard-requires them for the whole authed project — parity with publish.spec's reliance on global setup).

## Test results (ran locally)
`npx playwright test e2e/edit-persistence.spec.ts --project=authed` → **2 passed** (setup + spec) in 58.1s; the spec itself ran 32.4s (includes the 6× throttled interaction + reload). Green locally with real Clerk test creds + mock generation.
- All three assertions verified live: saveDraft 200 carrying the marker, localStorage draft contains the marker, marker survives reload.
- The `window is not defined` lines in dev-server output are pre-existing SSR-noise from `src/hooks/useEditStore.ts:300` (dev-only debug block) — unrelated to this change; the editor hydrates and the test passes.

## Open risks / notes
- Runs only under the `authed` project (needs the Clerk test instance env in `.env.local`); no coverage in the public/no-auth lane.
- Meridian-only. The commit path is template-agnostic, but a template that renders the headline via a different editor wrapper would need its own selector if ever asserted.
- Serial within the `authed` project alongside publish.spec (both create per-run projects via `/api/start` → DB rows accumulate, consistent with the existing publish.spec pattern).
- Throttle scoped to the interaction (not load) — see deviation 1; if a future load-time persistence bug is suspected, a separate spec should throttle from navigation.

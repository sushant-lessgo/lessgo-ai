# section-background — implementation audit

## Phase 1 — Surface-override plumbing + contrast pair (Slice 1a)

Branch: `feature/section-background` (verified before any edit).

### Files changed

Created:
- `src/modules/skeletons/styleTokens.test.ts`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.surface.test.tsx`
- `docs/task/section-background.audit.md` (this file)

Modified:
- `src/modules/skeletons/styleTokens.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`
- `src/types/store/actions.ts`
- `src/hooks/editStore/persistenceActions.ts`
- `src/app/edit/[token]/components/layout/EditLayout.tsx`
- `src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`
- `src/modules/generatedLanding/LandingPageRenderer.tsx`
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/app/p/[slug]/renderPublishedRoot.tsx`
- `src/app/p/[slug]/[...subpath]/page.tsx`
- `src/lib/staticExport/htmlGenerator.test.ts`

Incidentally touched by the test runner (NOT edited by me, `git diff` is EMPTY —
line-ending normalization only): `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`
(see Risks).

### Per-file

**`src/modules/skeletons/styleTokens.ts`**
- `BACKGROUND_CSS`: `paper` and `paper-2` now additionally emit `['--u-fg','var(--wk-ink)']`
  (D2 contrast pair). Every non-default surface now emits the complete bg+fg pair; a
  comment records WHY (dark-default block roots declare `color:var(--u-fg, …)` at the
  root and beat the wrapper's inherited colour).
- NEW `resolveSectionSurface(templateId, styleTokens, sectionId, fallback)` (D4):
  id-keyed override wins; absent / absent-section / `'default'` → fallback; returns the
  fallback UNCONDITIONALLY when `!isSkeletonBacked(templateId)` (R5 template-switch leak).
- Added the file's only import: `isSkeletonBacked` from `./ids` (pure data — the file's
  firewall-safety note stands; called out in a comment).
- Grep-verified D2's safety claim: **nothing in `src/` writes `styleTokens[*].background`**
  today (`grep -rn "styleTokens"` — all hits are type/thread/serialize/read sites plus the
  `headerMode` reads). No shipped UI ever wrote a background value, so changing its
  serialization cannot alter any existing draft.

**`src/types/store/actions.ts`** — added the `setSectionStyleTokens(sectionId, patch)`
signature next to `updateMeta`, with the "one merge owner" rationale in the doc comment.

**`src/hooks/editStore/persistenceActions.ts`** — impl beside `updateMeta`. Immer deep
merge into `themeValues.styleTokens[sectionId]` (creates `themeValues`/`styleTokens` when
absent), preserving every other `themeValues` key and every other section's tokens; bumps
`lastUpdated`/`version`, sets `persistence.isDirty = true`, then `get().triggerAutoSave?.()`
— exactly the i18nActions choreography (`triggerAutoSave` is gated on `isDirty`).
The composed `triggerAutoSave` is `uiActions`' (composed later than persistenceActions),
i.e. the 2s-debounced one.

**`src/app/edit/[token]/components/ui/EditablePageRenderer.tsx`** — added a scalar-ish
`useEditStore(s => s.themeValues?.styleTokens)` selector (no `useShallow`; the map's
identity only changes when the writer runs) and routed the existing `surface` computation
through `resolveSectionSurface`, keeping `tmpl.getSurfaceForSection(type) ?? 'cream'` as
the fallback. Wrapper attribute spread untouched.

**`src/modules/generatedLanding/LandingPageRenderer.tsx`** (preview call site, `:523`) —
same substitution; `themeValues` was already in scope. `id` + `data-surface` pair untouched.

**`src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`** (`:156`) — same
substitution using the existing `styleTokens` prop. No per-block prop was added (that is
phase 3, per D4).

**`src/app/edit/[token]/components/layout/EditLayout.tsx`** — closed the editor injector
gap: new `useStoreState(s => s.themeValues?.styleTokens)` selector (per N3 — this file uses
`useStoreState`, not `useEditStore`) passed as `styleTokens={styleTokens}` to
`tmpl.ThemeInjector`. Without it the edit route emits no `[data-sid]{--u-*}` CSS at all.

**`src/app/p/[slug]/renderPublishedRoot.tsx` / `src/app/p/[slug]/[...subpath]/page.tsx`** —
closed the SSR fallback gap: both now pass
`styleTokens={(page.themeValues as any)?.styleTokens ?? null}`.

### Tests added

1. `src/modules/skeletons/work/tokenContract.test.ts` (serializer's existing home — suite
   NOT split): table-driven `it.each` over all four non-default `UBackground` values
   asserting the emitted block contains BOTH a `--u-bg` and a `--u-fg` declaration, plus
   two exact-string cases pinning `paper`/`paper-2` → `var(--wk-ink)`. All pre-existing
   exact-string cases stay green unmodified (N7 held).
2. NEW `src/modules/skeletons/styleTokens.test.ts` (resolver only, cross-references the
   serializer's home): override wins · absent/`'default'` → fallback · **no-bleed**
   (`hero-aaa` override leaves `hero-bbb` at fallback) · **gating** (same tokens with
   `hearth`/`lex`/`meridian`/`techpremium`/null → fallback) · every non-default value round-trips.
3. `src/lib/staticExport/htmlGenerator.test.ts` — NEW describe block with a **LOCAL**
   two-section fixture (`renderTwoSections`); the shared `buildPage()`/`render()` helpers
   are untouched. Asserts CHANNEL 1 (the `[data-sid="about-…"]{…}` block contains BOTH
   `--u-bg:var(--wk-dark)` and `--u-fg:var(--wk-on-dark)`, and the unstyled sibling gets no
   block), CHANNEL 2 (that wrapper carries `data-surface="dark"` AND its `id` — the
   `analyticsGenerator.js:126` `[data-surface][id]` pair), no-bleed (sibling wrapper
   byte-identical to a no-override baseline render), and `'default'` ⇒ byte-identical wrapper.
4. NEW `src/app/edit/[token]/components/ui/EditablePageRenderer.surface.test.tsx` (jsdom,
   REAL `createEditStore`, react-dom/client + act per repo convention): skin default with no
   override · id-keyed override paints one section with no bleed · the real store writer
   `setSectionStyleTokens` updates the wrapper live (no remount) and merges · non-skeleton
   template ignores the override · a merge test proving sibling `themeValues` keys
   (`mood`) and other sections survive and that a second patch deep-merges.

**Mutation check (assertions are not inert):** with two deliberate mutants applied
temporarily — (a) `resolveSectionSurface` returning `fallback` unconditionally, (b) `paper`
dropping its `--u-fg` — **8 of the new assertions failed across all 4 files**; both mutants
were then reverted (verified by grep). Full suite re-run green afterwards.

### Verification (actual results)

- `npx tsc --noEmit` → **1 error, PRE-EXISTING and unrelated**:
  `src/app/page.tsx(6,26): TS2307: Cannot find module '@/assets/images/founder.jpg'`.
  The file exists on disk (`src/assets/images/founder.jpg`); this is the known stale
  `.next/types` / missing next-env image-declaration artifact in a fresh worktree
  (documented repo pitfall). **Zero errors in any file this phase touches.**
- `npm run test:run` → **310 passed | 1 skipped (311 files); 5008 passed | 15 skipped**.
  Zero failures. D9 tripwires green **UNMODIFIED**: `kundiusPages.test.tsx`,
  `oldContentFallback.test.tsx`, `coreParity.test.ts`, and
  `uiFoundationIsolation.test.tsx.snap` (no snapshot content change — see Risks).
- Lint on the touched source files (`npx next lint --file …`) → only 2 PRE-EXISTING
  warnings (`no-img-element` in EditablePageRenderer, an `exhaustive-deps` warning in
  LandingPageRenderer), no errors, none introduced by this phase.
- Not run (out of this phase's gate): `npm run build`, Playwright. No UI shipped, so no
  manual check applies.

### Deviations from the plan

1. **htmlGenerator no-bleed assertion re-shaped.** The plan's wording implies asserting the
   sibling is "not the override". The atelier skin's own hero default IS `dark`
   (`skin.selections.surfaceBySection`), so `expect(hero).not.toContain('data-surface="dark"')`
   failed on the first run and would have been vacuous anyway. Conservative fix: assert the
   sibling wrapper is **byte-identical to a no-override baseline render** — a strictly
   stronger no-bleed proof. (Wrapper `id` is the in-page ANCHOR from
   `buildSectionAnchorMap` — `hero`/`about` — not the sectionId; the helper matches on that.)
2. **Edit-side test mocks the template module + component registry.** Mounting the real
   atelier module in jsdom drags an async dynamic import and the whole block tree in for an
   assertion that is entirely about the wrapper attribute. The store is REAL, so the
   selector, the resolver and the writer are all genuinely exercised (the mutation check
   confirms). Recorded here because the plan didn't specify the mounting strategy.
3. **Two extra assertions** beyond the plan's list in the edit-side test (live reaction to
   `setSectionStyleTokens`, and the themeValues merge invariant) — the D3 merge obligation
   otherwise had no test anywhere.

### Deliberately NOT done (per plan / D9)

- No `bgMode` field, no writer of it, no per-block `styleTokens` prop (phase 3).
- No toolbar/UI change; `SectionToolbar.tsx`'s stale `:320-333` comment is phase 2's job.
- `getSurfaceForSection` signature untouched; `src/types/template.ts` and all 8 template
  `sectionRules.ts` files untouched (D6).
- `tokenContract.ts:399` (`--wk-header-bg`), `.wk-header`, `WorkHeader.*` untouched (D5).
- `src/stores/editStore.ts` untouched (slice composition only, D3).
- `scripts/`, `public/assets/` untouched → `work.v1.js` byte-unchanged.

### Out-of-scope observation the plan asked for

**`EditLayout.tsx` never passes `knobs` to `tmpl.ThemeInjector`,** while
`LandingPageRenderer.tsx:963` does (`knobs={(themeValues as …)?.knobs}`). This is the SAME
divergence class as the `styleTokens` gap this phase closed: any knob selection stored in
`Project.themeValues.knobs` renders in preview/published but NOT in the editor canvas.
Left untouched per the plan. Suggested follow-up: add
`knobs={(state.themeValues as any)?.knobs}` alongside the new `styleTokens` prop — a
one-line change with the same shape, but it needs its own parity check because knobs feed
`buildWorkStylesheet` and could shift the editor canvas for existing drafts.

### Risks / things for the reviewer to check

- **`uiFoundationIsolation.test.tsx.snap` shows as modified in `git status` but
  `git diff` is EMPTY** — Vitest rewrote the file with CRLF line endings on Windows. No
  content changed (git normalizes, hence the empty diff). I did not `git checkout` it (git
  state changes are the orchestrator's). Reviewer/orchestrator may want to leave it out of
  the commit to avoid a pure line-ending churn.
- **Fallback semantics on non-skeleton templates.** `resolveSectionSurface` returns the
  fallback for hearth/lex/meridian/etc., so those templates behave EXACTLY as before even
  if a project carries stale `styleTokens` from an atelier stint. Confirmed by test.
- **`--u-fg` now emitted for `paper`/`paper-2`.** This only affects sections that have an
  explicit background override — of which there are none in any existing draft (grep-verified
  no writer). Zero effect on existing published pages.
- **Autosave flush.** `setSectionStyleTokens` calls `triggerAutoSave` (2s debounce). Nothing
  calls the action yet in shipped code (phase 2 wires the UI), so no live behaviour change.
- **Selector churn.** `EditablePageRenderer` now subscribes to the `styleTokens` object.
  Its identity changes only when `setSectionStyleTokens` runs (or on draft hydration), so
  no per-keystroke re-render risk; worth a glance at phase 2's e2e for editor responsiveness.

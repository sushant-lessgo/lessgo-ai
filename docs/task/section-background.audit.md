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

---

## Phase 2 — Background toolbar UI, Colour on body sections (Slice 1b — the decision gate)

Branch: `feature/section-background` (verified with `git branch --show-current` before any edit).

### Files changed

Created:
- `e2e/section-background.spec.ts`
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`

Modified:
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `playwright.config.ts`
- `src/modules/skeletons/styleTokens.ts` — **justified addition** (the N8 fix; see below)
- `src/modules/skeletons/work/tokenContract.test.ts` — **justified addition** (the N8 fix's assertions + the one pre-existing exact-string case it necessarily changes)
- `src/lib/staticExport/htmlGenerator.test.ts` — **justified addition** (N10, which the task brief assigned to this phase)
- `docs/task/section-background.audit.md` (this file)

Shows as modified but NOT edited by me (`git diff` empty — Vitest CRLF rewrite on Windows, same as
phase 1): `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`.
Dirty from before this phase started: `docs/task/section-background.plan.md` (the orchestrator's
N8/N9/N10 addendum), `docs/temp/message.md`, the designer-handoff HTML.

### Scope additions (3 files outside the phase's Files-touched list) — why

The task brief authorised "plus whatever N8's fix requires", and assigned N10 to this phase.

1. **`styleTokens.ts`** — where the N8 fix landed. See "N8" below for why here and not in the block
   stylesheets.
2. **`tokenContract.test.ts`** — the serializer's test home (the plan forbids splitting that suite).
   The N8 fix necessarily changes the exact-string `dark` case; the rest are new assertions.
3. **`htmlGenerator.test.ts`** — N10 only.

Nothing else was touched. In particular `Footer/styles.ts`, `Hero/styles.ts`, `tokenContract.ts`,
`WorkHeader.*`, `scripts/`, `public/assets/` are all untouched.

### Per-file

**`src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`**
- Extracted `sectionTypeOf(sectionId)` (the `${type}-${uuid}` grammar) and re-pointed
  `sectionChipLabel` + `isFooterId` at it. No behaviour change.
- NEW `BACKGROUND_DENIED_SECTION_TYPES` — the section gate as a **DENYLIST** per N2. Keys: `hero`
  (phase 3), `header` (D5), `workcatalog` / `workdetail` (R1). Everything else is eligible, so the
  atelier gallery — section type **`work`**, not `gallery` — ships LIVE. An allowlist transcribed
  from D7's matrix would have shipped the centrepiece body section greyed.
- Template gate `isSkeletonBacked(templateId)` — the SAME predicate `resolveSectionSurface` uses, so
  toolbar and renderer cannot drift. Non-skeleton templates keep the EXACT string
  "Section backgrounds are coming with the design system." (pinned as a named constant with a
  comment saying why), so `toolbar-dispatch.spec.ts` stays green unmodified — verified by running it.
- The `background` action is now `disabled: Boolean(<reason>)` + `disabledTitle: <reason>`; the
  handler toggles the panel. A `useEffect` closes the panel if the gate flips underneath it.
- Render: the background button is wrapped in a `relative` div so the panel docks as an
  `absolute top-full left-0` sibling (N6's precedent — TextToolbarMVP's pickers, documented at
  `ToolbarShell.tsx:248`; the chrome box is `relative` with no `overflow-hidden` precisely for this).
  `active` lights the button while the panel is open. Every other action renders exactly as before.
- The stale `:320-333` comment is REPLACED with D2's two-channel truth (the CSS `[data-sid]{--u-*}`
  block is what paints, because block roots self-paint; the wrapper `data-surface` carries the
  hairline / template-agnostic consumers / the `[data-surface][id]` analytics pair; both resolved
  from the same stored value; the override is ID-keyed and `getSurfaceForSection` is left alone, D6).
- `'palette'` iconMap entry verified present (`:539`). No edit.

**`src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx` (new)**
- Toolbar-docked dropdown. Colour row ONLY. Chips `Auto - Paper - Subtle - Ink` are live and call
  `setSectionStyleTokens(sectionId, { background })` — `{background}` ONLY. **`bgMode` is never
  written** (D1). `Accent` ships greyed (`aria-disabled` + why-tooltip + inert onClick) per R3.
- Reads the stored value with a **scalar** selector (`...styleTokens?.[sectionId]?.background`), so
  the panel re-renders only when THIS section's value changes.
- Click-outside close via a `mousedown` document listener (TextToolbarMVP precedent). The Background
  BUTTON is deliberately excluded from "outside": otherwise its mousedown would close the panel and
  its click would immediately re-open it, making the toggle unclosable.
- `data-testid`s: `section-bg-panel`, `section-bg-chip-{auto,paper,paper-2,dark}`,
  `section-bg-chip-accent-disabled`.

**`src/modules/skeletons/styleTokens.ts` — the N8 fix**
`BACKGROUND_CSS`: every non-default surface now ALSO re-points the polarity-bound SKIN tokens inside
that one section's `[data-sid]` block:
- `paper` / `paper-2` → `--wk-on-dark`, `--wk-on-dark-soft`, `--wk-line-dark` point at the ink family.
- `dark` → `--wk-ink`, `--wk-ink-soft`, `--wk-ink-mute`, `--wk-line`, `--wk-line-soft` point at the
  on-dark family, and `--wk-paper` / `--wk-paper-2` point at `--wk-dark` (nested card + placeholder
  fills).
- `accent` → all of the above point at `var(--wk-accent-ink, #fff)` / `--wk-line-dark` /
  `--wk-accent`. `--wk-line-dark` is deliberately NOT re-declared under accent: a custom property
  pointing at itself is a CYCLE (guaranteed-invalid), which would delete the hairline rather than
  restyle it.

**`src/modules/skeletons/work/tokenContract.test.ts`** — updated the two exact-string surface cases
to the new output, and added 5 assertions: light surfaces re-point the on-dark family; `dark`
re-points the ink family + card fills; `accent` re-points everything to accent-ink and contains no
self-referential `--wk-line-dark`; and the **containment** case — a section with no `background`
override emits NO skin-token re-point at all.

**`src/lib/staticExport/htmlGenerator.test.ts`** — N10. The CHANNEL-2 no-bleed check compares the
hero wrapper byte-for-byte against a no-override baseline: exact, but value-vacuous for the value
under test (the atelier hero's skin default already IS `dark`). Added a second render with
`{[ABOUT]: {background:'paper'}}` asserting about reads `paper` while hero still reads `dark`.

**`playwright.config.ts`** — registered `/section-background\.spec\.ts/` under the **`authed`**
project (explicit allowlist; an unregistered spec matches nothing and goes green having never run).

### N8 — how it was fixed, and why in the serializer

N8 named the footer's on-dark children. Two mechanisms were considered:

- *(rejected)* surface-scoped descendant rules in `Footer/styles.ts`
  (`[data-surface="paper"] .wk-footer__note{...}`). Contained, but it fixes ONE block in ONE
  direction, and would have to be repeated in every block stylesheet forever as a list that rots.
- *(chosen)* re-point the polarity-bound skin tokens inside the `[data-sid]` block the serializer
  already emits. One place, no per-block selector lists, and it also covers the MIRROR case N8
  doesn't name but the Ink chip makes reachable on every body section: light-default blocks pin
  `--wk-ink-soft` / `--wk-ink-mute` / `--wk-line` and fill cards with `--wk-paper`, so a `dark`
  override would otherwise leave dark-grey labels and white cards on a dark band. The spec AC ("no
  surface choice can produce an unreadable text/background pairing") covers that direction too.

**Containment is the whole safety argument, and it is airtight:** a `[data-sid]` block is only ever
emitted for a section the user has EXPLICITLY overridden. With no override nothing is emitted, so no
skin token is ever re-pointed and every existing draft — including atelier's own skin-default `dark`
proof/contact/footer bands — renders exactly as before. There is a dedicated test for this.

### Tests added

`e2e/section-background.spec.ts`, 3 cases, all **computed-style** (`getComputedStyle` on the block
root `[data-sid]`), never attribute-presence — the attribute lands whether or not a pixel changes:

1. **Ink on a body section** — About's root `backgroundColor` AND `color` both change from a
   captured baseline, and each equals the RESOLVED value of `--wk-dark` / `--wk-on-dark` (read via a
   throwaway probe element, so it is a real comparison, not a tautology). Wrapper carries
   `data-surface="dark"` + `data-section-id`. **No-bleed at paint level**: the sibling gallery
   section's computed colours are unchanged. **Preview hop**: `/edit/{token}/preview`
   (LandingPageRenderer's usesTemplate branch — the third resolver call site) shows the same computed
   colours. **Reload**: the override comes back from the server.
2. **Paper on the DARK-default footer (N8)** — root pair equals resolved `--wk-paper` / `--wk-ink`;
   `.wk-footer__note` CHANGED from its on-dark baseline and equals resolved `--wk-ink-soft`;
   `.wk-footer__top`'s `borderBottomColor` equals resolved `--wk-line`.
3. **Gate** — the gallery (`work-...`, the N2 trap) is NOT greyed and opens the panel; the Accent
   chip is `aria-disabled` with a non-empty title; the hero is `aria-disabled` with an
   `/image mode/i` tooltip and is INERT on force-click (no panel).

Seeding follows **N1** exactly: `POST /api/user/persona` -> `GET /api/start` (the only place
`audienceType` is captured) -> `POST /api/saveDraft` with `templateId: 'atelier'`. `beforeEach`
asserts a `[data-sid]` block root exists — the N1 tripwire: if the editor ever falls back to the
legacy path there is no `data-sid`, no `data-surface` and no `[data-sid]{--u-*}` CSS, and the spec
fails loudly instead of testing nothing.

**Mutation check (the assertions are not inert):** removing two of the N8 re-points from
`BACKGROUND_CSS` turned **5 of the 28** tokenContract cases red; the mutant was reverted and the
suite re-run green (`git diff --stat` confirms only the intended edit remains).

### Verification (actual results, run in this worktree)

- `npx tsc --noEmit` -> **0 errors** (phase 1's stale `founder.jpg` TS2307 is gone — `.next/types`
  was regenerated by the build).
- `npm run test:run` -> **310 passed | 1 skipped (311 files); 5013 passed | 15 skipped**. Zero
  failures. D9 tripwires green **UNMODIFIED**: `kundiusPages.test.tsx`, `oldContentFallback.test.tsx`,
  `coreParity.test.ts`, `uiFoundationIsolation.test.tsx.snap` (no snapshot content change).
- `npx next lint --file ...` on the three touched source files -> 1 PRE-EXISTING warning
  (`react-hooks/exhaustive-deps` on SectionToolbar's validation `useMemo`), no errors, nothing new.
- **Playwright, actually run** (`E2E_PORT=3411`, `--project=authed --project=setup`):
  `e2e/section-background.spec.ts` + `e2e/toolbar-dispatch.spec.ts` -> **16 passed**. The runner
  reported all 3 section-background tests as EXECUTED (allowlist registration confirmed), and
  toolbar-dispatch passed **unmodified**, including its two `/design system/i` greyed-Background
  assertions on meridian/hearth.
- `npm run build` -> success. `git status --porcelain public/assets scripts/legacy
  public/published.css` -> **empty**. `work.v1.js` byte-unchanged.
- `npx playwright test e2e/parity.spec.ts --project=public` -> **4 passed, 3 failed, all
  PRE-EXISTING**:
  - `atelier/header 4.94% > 3%` — the known-accepted `atelier/header` parity red recorded by
    work-contract-wave2 ("don't re-flag").
  - `atelier2` x2 — the dev-only stage never renders `[data-parity-band="published"]` and times out.
  - Both are provably unrelated to this phase: the parity stage renders
    `<ThemeInjector ... styleTokens={undefined}>` (`TemplateBlocksStage.tsx:253`), so the serializer
    returns `''` and the only rendering-affecting change here is inert there. meridian + hearth
    bands are all well under 3%.

### Deviations from the plan

1. **N8 fixed in the serializer, not in the block stylesheets** (and generalised to the
   `dark`-on-light-block direction). Rationale + containment argument above. This is why
   `styleTokens.ts` + `tokenContract.test.ts` appear on the changed-file list.
2. **The e2e's HEADER greyed case was dropped** (the plan asked for "Hero + header toolbars:
   background action disabled"). Evidence-based: on the WORK skeleton, clicking the header section
   wrapper dispatches **no toolbar at all** — the wrapper is present and focusable (`role="button"`,
   `aria-selected`, confirmed in the failure's page snapshot) but `[data-toolbar-chrome]` never
   mounts. There is therefore no Background button on an atelier header to inspect; a header case
   would have been testing toolbar-wave-2's missing host, not this gate. The header entry in the
   denylist is the identical one-line lookup the hero case exercises, and `toolbar-dispatch.spec.ts`
   still covers the header toolbar on meridian (where it does dispatch). Recorded verbatim in the
   spec at the point of omission.
3. **Two e2e mechanics the plan didn't anticipate**, both documented inline because they look like
   noise otherwise: (a) `page.on('dialog', accept)` for the SaveStateChip `beforeunload` guard;
   (b) an `about:blank` hop before leaving the live editor — navigating straight from `/edit/{token}`
   to another route reliably yields `net::ERR_ABORTED`. Neither weakens an assertion: every hop is
   still followed by a computed-style comparison against server-restored state.
4. `data-testid` for the disabled accent chip is `section-bg-chip-accent-disabled` (the plan's own
   naming) while the live chips are `section-bg-chip-<value>`.

### Deliberately NOT done

- **No `bgMode`** — not in the type, not written, not read (D1: phase 3 owns it).
- No Image / Video tabs, no `MediaPickerModal`, no slides helpers, no filmstrip (phases 3-4).
- Hero, header, `workcatalog`, `workdetail` stay greyed; `WorkHeroCenter.*` and all hero cores
  untouched.
- `tokenContract.ts` (incl. `:399` `--wk-header-bg` and the `[data-surface]` rules), `.wk-header`,
  `WorkHeader.*`, `Footer/styles.ts`, `Hero/styles.ts`: untouched (D5 / D9).
- `getSurfaceForSection` signature, `src/types/template.ts`, all 8 template `sectionRules.ts`:
  untouched (D6).
- `scripts/`, `public/assets/`: untouched. No git state changes, no commit.

### Risks / open items for the reviewer and the founder gate

1. **The N8 fix re-points SKIN tokens from the USER token layer.** That is a layering step beyond
   "emit `--u-*`", and it is the single most reviewable decision in this phase. It is contained to
   overridden sections only (tested), but a reviewer should agree the mechanism is right before
   phase 3 builds on it.
2. **Nested light cards on a dark band are only PARTIALLY solved.** `--wk-paper` / `--wk-paper-2` are
   re-pointed to `--wk-dark`, so `.wk-proof__card` / `.wk-packages__card` no longer paint white on a
   dark band — but they then have little separation from the band beyond their border. That is a
   taste call, not a legibility one. **Founder-gate ASK, alongside the Accent question.**
3. **Pre-existing, NOT introduced here, but adjacent and worth logging:** atelier's skin already puts
   `proof` on a `dark` surface while `.wk-proof__eyebrow` / `__source` hard-code `var(--wk-ink-mute)`
   and `.wk-proof__card` fills `var(--wk-paper)`. That is a live contrast bug on Kundius TODAY, with
   no user override involved. The N8 fix deliberately does NOT touch it: fixing it means editing the
   shared `[data-surface]` rules, which changes existing drafts' rendering and would break the D9
   "untouched draft renders identically" contract. Suggested as its own ticket.
4. **Accent chip is greyed** pending the R3 decision (audit accent bands vs drop the chip). The
   serializer already emits a full accent re-point set, so un-greying it later is a one-line UI
   change — the contrast plumbing is in place.
5. **`atelier2` parity + `atelier/header` parity are red before and after this phase** (see
   Verification). If the gate run re-surfaces them, they are not this phase's.
6. **Autosave debounce.** The panel writes through `setSectionStyleTokens`, which triggers the 2s
   debounced autosave. The e2e waits for the `saveDraft` POST carrying `"styleTokens"`, so the
   round-trip is genuinely proven, but a user who closes the tab within 2s of a chip click relies on
   the same dirty-guard every other editor write does.

---

## Phase 2 polish (non-blocking review findings)

**Files changed**
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`
- `e2e/section-background.spec.ts`
- `src/modules/skeletons/styleTokens.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`
- `docs/task/section-background.audit.md` (this section)

### 1. Panel survived a section switch (real bug) — `SectionToolbar.tsx`
The toolbar shell RE-RENDERS this component on selection change (it does not remount), so
`showBackgroundPanel` outlived the switch: About → open panel → select gallery left the panel open,
now writing to the new section. Split the single effect in two:
- new `useEffect(() => setShowBackgroundPanel(false), [sectionId])` — closes unconditionally on any
  section switch (firing on mount is a no-op; initial state is already closed);
- the existing gate-flip effect keeps its `if (backgroundDisabledTitle)` guard, deps narrowed to
  `[backgroundDisabledTitle]` (the `sectionId` dep it carried was doing the new effect's job
  conditionally, which was the bug).

### 2. Accent chip swatch — `BackgroundPanel.tsx`
Replaced the literal `var(--wk-accent, #b45309)` with a runtime resolve: on mount the panel reads
`getComputedStyle(host).getPropertyValue('--wk-accent')` from the nearest ancestor `[data-palette]`,
falling back to `document.querySelector('[data-palette]')`. Unresolvable → a neutral 45° hatch
(`ACCENT_UNKNOWN_SWATCH`), deliberately not a plausible colour, so the founder is never asked to
judge Accent bands against a colour the site does not use. The three live chips
(`--wk-paper`/`--wk-paper-2`/`--wk-dark`, all on `:root`) are untouched.

Worth recording: the review's premise is only conditionally true. Edit-side, `makeWorkThemeInjector`
sets `data-palette` on `document.documentElement` (`work/ThemeInjector.tsx:59`), so `[data-palette]`
matches the ROOT element and the literal would in fact have resolved on `/edit`. The resolve-then-
hatch implementation is correct either way and does not depend on which is true, which is why it was
preferred over simply deleting the literal.

### 3. Stale comment — `SectionToolbar.tsx` (`FOOTER_ONLY_ACTIONS` filter)
Rewritten. It now says `background` is a whole-Section action (live on skeleton-backed body sections,
greyed elsewhere) rather than a "placeholder", and that **nothing** pins the header's behaviour in
e2e — the header case was dropped because an atelier header dispatches no toolbar at all today.

### 4. Footer hairline changed-from-baseline companion — `e2e/section-background.spec.ts`
Added `footerTopBorderColor(page, sectionId)` helper, captured `borderBefore` alongside `noteBefore`,
and added `expect(borderAfter).not.toBe(borderBefore)` before the existing equals-`--wk-line`
assertion. Comment states why both halves are needed (a skin with `line === lineDark` would make the
equals-half pass vacuously). The old inline `page.evaluate` is now the shared helper.

### 5. `:root`-derived-var hole documented + ratcheted
- `styleTokens.ts`: a **KNOWN HOLE** block next to the N8 contrast invariant, explaining that
  `var()` substitutes at the DECLARING element, so a `:root`-level derived colour that embeds a
  polarity-bound token (`--wk-ink*` / `--wk-on-dark*` / `--wk-line*` / `--wk-paper*`) can never
  follow a section-level re-point; states the constraint for skin authors and names the one inert
  offender (`--wk-about-eyebrow-color` under `aboutLayout:'stack'`).
- `tokenContract.test.ts`: new `describe` that parses the `:root{…}` block out of
  `serializeSkinTokens` and asserts no declaration outside a documented `KNOWN` set embeds a
  polarity-bound token, run over both a neutral and an atelier-shaped skin; plus a second case
  pinning both eyebrow values (`stack` → `var(--wk-ink-mute)`, `split-portrait` →
  `var(--wk-accent-ink,#fff)`).

### Deviations
- **The ratchet is an allowlist, not a clean assertion.** A strict "no `:root` derived colour embeds
  a polarity-bound token" test is RED today: `--wk-about-eyebrow-color` violates it under `stack`,
  and the three `--wk-header-*` vars violate it by design (the header is denied per-section
  backgrounds, plan D5). Fixing the emission means editing `work/tokenContract.ts`, which is **not**
  on this phase's Files-touched list, so the conservative option was taken: encode today's offenders
  in a documented `KNOWN` set so any NEW one fails. The test comment says to shrink `KNOWN` if the
  emission is ever fixed.
- **Non-vacuity checked by mutation**, not by inspection: removing `--wk-about-eyebrow-color` from
  `KNOWN` turns the suite red with
  `expected [ '--wk-about-eyebrow-color' ] to deeply equal []`. The file was restored afterwards
  (`git diff --stat` confirms additions only).

### Gates
- `npx tsc --noEmit` → **clean, zero output**. (Note: `tsconfig.json` excludes `**/*.test.ts` and
  `e2e`, so neither edited test file is covered by tsc — the vitest run and a Playwright compile
  cover them instead.)
- `npm run test:run` → **310 passed | 1 skipped (311 files); 5016 passed | 15 skipped (5031 tests)**,
  66.30s.
- `npx playwright test e2e/section-background.spec.ts --list` → compiles and lists all 3 cases
  (+ auth setup). **The Playwright suite itself was NOT re-run** — it needs a dev server, a Clerk
  session and a seeded work-skeleton project. The hairline companion assertion is therefore
  compile-verified only; it should go green on the founder-gate run (atelier's `line` is
  `rgba(0,0,0,…)` and `lineDark` is `rgba(255,255,255,…)`, so the before/after values differ).

### D9 ledger
Untouched: `work.v1.js`, `public/assets`, `scripts/legacy`. No serializer output changed (the only
`styleTokens.ts` edit is a comment), so absent-override DOM stays byte-identical.
`kundiusPages` / `oldContentFallback` / `coreParity` / `uiFoundationIsolation.snap` /
`toolbar-dispatch.spec.ts` all green and unmodified within the full `test:run`.

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

## Phase 2b — founder-gate fixes (G1 + G2)

**Files changed**
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`
- `e2e/section-background.spec.ts`

### BackgroundPanel.tsx
- **G1 — Auto now reads as a MODE, not a colour.** The Auto entry was pulled out of
  `COLOR_CHIPS` and rendered on its own, because its swatch is deliberately not a fill: a
  3.5×3.5 square with a **dashed grey ring, transparent interior, and a centred "A" glyph**
  (same grey/dashed idiom the app chrome already uses for "not set"). It can no longer be
  confused with Paper's solid swatch. Active/hover/pressed states are byte-identical to the
  other chips, so it still reads as one of the four.
- **G1 (second half) — Auto surfaces what it resolves to.** The panel now resolves the skin's
  TYPE-keyed default via `useTemplateModule(audienceType, templateId)` +
  `tmpl.getSurfaceForSection(extractSectionType(sectionId))` — the SAME call
  `EditablePageRenderer` feeds `resolveSectionSurface` as its fallback, so the hint cannot
  drift from what the canvas paints. Shown two ways: a new visible line
  (`data-testid="section-bg-auto-hint"`) — "Auto here = **Subtle**, your template's choice for
  this section." — and in the chip's `title`. The chip also exposes
  `data-auto-surface="<surface>"` for assertions. The hook resolves from the registry cache
  (the renderer already loaded the module), so no extra fetch.
- **G2 — Accent chip DROPPED.** Removed the greyed `section-bg-chip-accent-disabled` button,
  `ACCENT_WHY`, and `ACCENT_UNKNOWN_SWATCH`. Also removed the phase-2-polish
  `getComputedStyle`-off-`[data-palette]` accent resolution (`accentSwatch` state + effect,
  and the now-unused `useState` import) — it existed only to fill that chip's swatch and
  nothing else read it. Live chips are exactly **Auto · Paper · Subtle · Ink**. The live
  swatches are untouched (`--wk-paper`/`--wk-paper-2`/`--wk-dark` are on `:root`).
- **UI-ONLY.** `accent` remains valid in `UBackground` / `WorkSurface` / `BACKGROUND_CSS` and
  `[data-surface="accent"]` CSS is untouched; a stored `accent` still paints. Nothing in
  `styleTokens.ts` or the skeleton was edited.

### e2e/section-background.spec.ts
- In the gate test, replaced the "Accent ships greyed with a WHY" assertions with the inverse:
  neither `section-bg-chip-accent-disabled` nor `section-bg-chip-accent` exists. Added G1
  coverage: the Auto chip is visible, `data-auto-surface` is `paper` for the gallery (section
  type `work` → not in `defaultWorkSectionSurfaces`, and the atelier skin overrides only
  hero/proof/packages → `paper`), and the hint line names "Paper".
- The Auto chip kept its original `section-bg-chip-auto` testid, so the `pickChip()` helper
  (line 192) is unaffected.

### Deviations from the plan
None. Scope was exactly G1 + G2; no third file needed.

### Gates (real output)
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run` → `Test Files 310 passed | 1 skipped (311)`, `Tests 5016 passed | 15 skipped (5031)`, 60.35s.
- Playwright: **NOT executed** (needs a live authed session/server). Compile proven only:
  `npx playwright test e2e/section-background.spec.ts --list` → `Total: 4 tests in 2 files`.
  The three G1/G2 assertions above are therefore unverified at runtime — they should be
  confirmed on the next preview run.

### D9 ledger
Untouched: `work.v1.js`, `public/assets`, `scripts/legacy`. No serializer/DOM output changed —
this phase edits one editor-chrome panel and one e2e spec. `kundiusPages` /
`oldContentFallback` / `coreParity` / `uiFoundationIsolation.snap` / `toolbar-dispatch.spec.ts`
all green and unmodified within the full `test:run`.

### Open risks
- The `data-auto-surface`/hint values are only as good as `getSurfaceForSection`; if a skin
  later overrides a section type, the hint follows automatically (same source as the canvas).
- The e2e `'paper'` expectation for the gallery is skin-data-dependent — if the atelier skin
  ever adds a `work`/`gallery` surface override, that one assertion needs updating.

---

## Phase 3 — Hero: Color + Image mode + `bgMode` + slides invariant (Slice 2)

Branch: `feature/section-background` (verified with `git branch --show-current` BEFORE any edit).

### Files changed

Created:
- `src/modules/skeletons/work/heroSlides.ts`
- `src/modules/skeletons/work/heroSlides.test.ts`
- `src/modules/skeletons/work/blocks/__tests__/heroBackground.test.tsx`

Modified:
- `src/modules/skeletons/styleTokens.ts`
- `src/modules/skeletons/work/tokenContract.test.ts`
- `src/modules/generation/workCollections.ts`
- `src/modules/generation/workCollections.test.ts`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroImage.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSplit.core.tsx` / `.tsx` / `.published.tsx`
- `src/modules/skeletons/work/blocks/Hero/styles.ts`
- `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx`
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`
- `e2e/section-background.spec.ts`
- `docs/task/section-background.audit.md` (this section)

**No file outside the phase's Files-touched list was edited** (zero scope additions this phase).
Shows as modified but NOT edited by me (`git diff` empty — Vitest CRLF rewrite on Windows, same as
phases 1/2): `src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`.
Dirty from before the phase: the designer-handoff HTML + `docs/temp/message.md`.

### Per-file

**`styleTokens.ts`** — added `UBgMode = 'color' | 'image'` + `bgMode?: UBgMode` on
`SectionStyleTokens`, with the "stored, not derived / absent → derive from data / never `'video'`"
rationale. It is absent from `FIELD_ORDER`, so `serializeStyleTokens` emits nothing for it (the
`headerMode` pattern) — pinned by a new test. Delivering it as a CSS var was rejected in D8 for a
concrete reason now recorded in the code: a `display:none` hero image is still DOWNLOADED.

**`heroSlides.ts` (new)** — every D8 helper, pure, no React/store/skeleton imports:
`normalizeSlides` · `promoteToSlides` · `demoteToSingle` · `reorderSlides` · `replaceSlide` ·
`removeSlide` (+ `newSlideId`, `MAX_HERO_SLIDES=6`, `MIN_HERO_SLIDES=2`). Phase 4 adds none.
- `normalizeSlides` is the READ-side coercion: `>=2` → slideshow; otherwise single-image state with
  the **`portrait_image`-wins** tie-break (the core forks at `>=2`, so that is what the canvas
  shows, and the panel must agree with the user's eyes). It does NOT mutate its input (tested).
- Every mutation returns a two-shape `HeroSlidesPatch`: `{kind:'slides'}` (always >=2) or
  `{kind:'single', portraitImage}` = "set the scalar and DELETE the `slides` key".
- One private `settle()` is the single choke point that enforces "never length 1" on every return.
- `promoteToSlides` carries a pre-existing SINGLE slide over **id and all**; only a never-rendered
  orphan that lost the tie-break is dropped. It also APPENDS when already a slideshow and refuses
  to exceed the cap.
- Defensive `unwrap()` handles the raw value and a legacy wrapper.
  **CORRECTION (phase-3 review):** as shipped in phase 3 it unwrapped `{value}` ONLY — not the
  live `{content, …}` wrapper — so this line's "BOTH element storage shapes" claim was false.
  Fixed in "Phase 3 — review fixes" below.

**`workCollections.ts`** — `stampHeroSlides` now skips when the derived array is `< 2` (was
`=== 0`): the WRITE-side door on the invariant. A single-cover collection leaves the hero
byte-identical.

**Hero cores (3)** — each takes an optional `bgMode` and implements ITS OWN row of the D7 matrix:
- slider: `'color'` drops the `__slides`/`__media` layer **and** the `__scrim` (both are
  `position:absolute;inset:0` overlays) and suppresses `data-wk-interval`.
- image: same two overlay layers dropped.
- split: the media is a GRID COLUMN, so the core omits it **and** adds `wk-hero-split--no-media`.
- Absent or `'image'` → today's exact markup (proved byte-for-byte, see Tests).

**`Hero/styles.ts`** — ONE new selector,
`.wk-hero-split--no-media .wk-hero-split__in{ grid-template-columns:1fr; }`. No existing rule
changed. Without it the grid keeps an empty `0.95fr` track and squeezes the copy into the left half.

**Hero wrappers (6)** — edit wrappers read the D4 **scalar** selector
(`s.themeValues?.styleTokens?.[sectionId]?.bgMode`, no `useShallow`); published wrappers accept the
new per-section `styleTokens` prop (plus a flat `bgMode` fallback for stages that pass flat props,
e.g. the parity stage) and hand `bgMode` to the core. `WorkHeroSlider.tsx`'s slider effect gained
`bgMode` as a dep — Color mode removes the slide set from the DOM, and without it the interval
would keep firing against detached nodes.

**`LandingPagePublishedRenderer.tsx`** — the usesTemplate branch now passes
`styleTokens={styleTokens?.[sectionId]}` to `LayoutComponent`, placed **after** `{...flattenedData}`
(N4): the spread is last today, so anything before it can be clobbered by a same-named content key,
and the design channel must win a collision rather than lose it. Components that don't declare the
prop ignore it. **`WorkHeader` is deliberately NOT wired** (D5 — the header is denied per-section
backgrounds entirely; this prop is the correct channel when toolbar-wave-2 wants it, and its dead
`content[sectionId].styleTokens` read stays untouched).

**`SectionToolbar.tsx`** — `hero` removed from `BACKGROUND_DENIED_SECTION_TYPES` (the phase-2
tooltip's promise is now delivered); header / workcatalog / workdetail stay denied, and every
non-skeleton template keeps the verbatim `BACKGROUND_UNSUPPORTED_TITLE`. New dynamic chip label:
`Slideshow · N` when the section is a hero **and** the layout is the slider **and** `bgMode !==
'color'` **and** `normalizeSlides` says >=2 — otherwise `Background`. It runs the SAME normalizer
the panel does, so the chip cannot disagree with the canvas.

**`BackgroundPanel.tsx`** — hero-only tab strip `Color | Image | Video`:
- Video is greyed with a why (`WorkHeroVideo` is a declared-but-unbuilt slot; nothing behind it).
- Image is greyed with a why on `workherocenter` ("This hero layout doesn't display a background
  image.") and `bgMode` is NEVER written there — the D7 no-op.
- Default tab when `bgMode` is absent = `image` on variants that render media (that IS what the
  canvas shows) — derived, never persisted.
- Tab clicks write `{bgMode}` ONLY; chips write `{background}` ONLY. Images are never cleared, so
  Color <-> Image is lossless with no confirm dialog.
- Image tab: single-image "Choose/Replace image" slot; on the slider ALSO an always-visible
  "+ Add image" with the hint "Add more to make a slideshow." (2nd pick promotes) and an
  "N images" line once it is a slideshow. `MediaPickerModal` is mounted here (edit-only) with
  caller-owned `open` state + `tokenId` + `initialTab="library"`.
- **No Accent chip anywhere** (ruling G2 stands); the Auto mode-chip + hint (G1) are untouched.

### Deviations from the plan (all in-scope judgement calls)

1. **Writes go through `setSection({elements})`, not `updateElementContent`** (D8 says the latter).
   Two hard reasons: (a) N5 requires genuinely DELETING the `slides` key and `updateElementContent`
   cannot delete — it only assigns; (b) `updateElementContent` pushes its OWN `'content'` history
   entry, which would sit under the wrapper entry and muddy "one undo restores the pair".
   `setSection` pushes no history entry of its own, so ONE `executeUndoableAction('sectionSwap', …)`
   is the only stack entry per gesture. **`'sectionSwap'` is not cosmetic**: it is the only
   `UndoableAction` whose undo branch restores the whole `content` snapshot
   (`uiActions.ts:724-735`) — a `'theme'`-mapped type would restore theme ONLY and the undo would
   silently do nothing. This is the BlockVariantSelector precedent, matched exactly.
2. **N5 is fully satisfied** — `demoteToSingle` returns `{kind:'single'}`, and the caller writes an
   elements object without the `slides` key, so the key is genuinely gone. No `[]` is ever written.
   (The demote CALLER ships with phase 4's tray; phase 3 ships the helper + its test.)
3. **The e2e does not drive an actual image PICK.** The picker's Library grid depends on this
   project's uploaded assets and its Stock tab on a live Pexels key — neither is hermetic. The spec
   proves the Add slot is always visible and that it opens the picker; the promote MUTATION is
   proved deterministically in `heroSlides.test.ts` (and the `Slideshow · N` chip is asserted in the
   e2e from a 2-slide seed). Recorded inline at the point of omission.
4. **The e2e seed's layout names changed to PascalCase** (`WorkHeroSlider`, not `workheroslider`).
   Found the hard way: the element SCHEMA (`audience/work/elementSchema.ts`) is keyed PascalCase, so
   with lowercase layouts `getSchemaDefaults` returns `null`, `extractLayoutContent` yields `{}`, and
   **every block rendered placeholders with zero seeded content**. The phase-2 colour assertions
   passed anyway (they read computed colours), but the hero-media assertions would have tested
   nothing. `resolveWorkBlock` lowercases before its own lookup, so component dispatch is unaffected.
   A comment in the seed now says all this. *Worth flagging beyond this phase: any future e2e that
   asserts on seeded CONTENT must use PascalCase layouts.*
5. **The hero e2e picks Paper, not Ink.** The atelier skin's hero default already resolves to
   `dark`, so an Ink pick would be indistinguishable from the baseline and the "band repainted"
   assertion would be vacuous.
6. **`workCollections.test.ts`: three existing cases were adjusted.** Two asserted a length-1 stamp
   (`drops groups that have no cover`, `respects hidden photos`) — exactly the behaviour the guard
   now forbids — so each grew a second covered group and asserts 2 slides while keeping its original
   point (cover-less / hidden-only groups are dropped). The `NEVER overwrites user-edited slides`
   case also grew a second group, otherwise the new guard — not the no-clobber rule — would be what
   makes it pass (it would have gone vacuous).
7. **A single-image pick does not strip a pre-existing orphan `slides` entry.** Conservative choice:
   touch only the key the gesture is about. The orphan is invisible either way (`normalizeSlides`
   reports single-image state and the core forks at >=2).
8. **The hero panel is wider (`w-64` vs `w-56`)** to fit three tabs. Non-hero sections keep the
   phase-2 panel byte-for-byte.

### Deliberately NOT done

- **`WorkHeroCenter.core.tsx` / `.tsx` / `.published.tsx` are UNTOUCHED** (D7). The no-op is proved
  by test, not by assertion-free omission.
- No filmstrip tray, no drag-reorder, no per-slide delete UI, no canvas preview-on-click (phase 4).
  The helpers those need already exist and are tested.
- No autoplay / interval / transition / crop / focal-point / per-slide-overlay control anywhere —
  the e2e asserts none of those words appears in the panel.
- Nothing behind Video. No Accent chip. `getSurfaceForSection` signature, `src/types/template.ts`,
  all 8 template `sectionRules.ts`, `tokenContract.ts` (incl. `--wk-header-bg`), `.wk-header`,
  `WorkHeader.*`, `scripts/`, `public/assets/`: untouched. No git state changes, no commit.

### Tests added

1. **`heroSlides.test.ts`** (new): normalize (slideshow / single / LEGACY length-1 read with a
   no-mutation assertion / orphan-only / the `{value}` wrapper / junk) · promote (portrait first, a
   pre-existing single slide carried over id-and-all, tie-break, append, cap) · demote +
   `removeSlide` (survivor, auto-demote at 2, unknown id) · reorder/replace · and a table-driven
   **INVARIANT** block running every helper from every direction and asserting no return path ever
   carries a length-1 `slides` array.
2. **`heroBackground.test.tsx`** (new, 12 cases): per variant, absent `bgMode` === explicit
   `'image'` **byte-for-byte in BOTH renderers**; the frozen `work.v1.js` hooks emitted verbatim on
   a 2-slide hero; `'color'` drops media+scrim (slider/image, both renderers, including the
   multi-slide case) and drops the media COLUMN + adds the modifier (split, both renderers) with the
   new CSS rule present and NOT applied by default; the **center no-op proof**; published-side
   `bgMode` delivery off the per-section `styleTokens` prop, and an unrelated `styleTokens` payload
   changing nothing.
3. **`workCollections.test.ts`**: two new cases — a single-cover collection leaves the hero
   BYTE-IDENTICAL (JSON compare) and a multi-group set with only one cover is skipped too.
4. **`tokenContract.test.ts`**: `bgMode` is not serialized (both values), and it does not disturb
   the other coordinates of the same section.
5. **`e2e/section-background.spec.ts`**: two new hero cases — (a) Color mode repaints the band AND
   the `<img>`s are GONE (count 0, not `display:none`), scrim gone, copy intact, chip stops saying
   Slideshow, lossless round trip back to Image with both slides and the colour choice surviving,
   then a reload; (b) the Image tab's always-visible Add slot + slideshow hint + picker opens + the
   Scope-OUT word sweep. The phase-2 gate case now asserts the hero is LIVE.

**Mutation check (the new assertions are NOT inert).** Three mutants applied together — slider
`colorMode = false`, split `colorMode = false`, and the stamp guard reverted to `length === 0` —
turned **5 tests red** across `heroBackground.test.tsx` and `workCollections.test.ts`. All three
were reverted and the suites re-run green (`git diff --stat` confirms only the intended edits
remain).

**Real pre-change byte-identity check (temporary, then deleted).** `git show HEAD:` was used to
materialise the three PRE-change cores beside the new ones, and a throwaway vitest file rendered
both with the published primitives: slider (single + 2-slide) and image are identical **including
the inlined `<style>` block**; split markup is identical and its stylesheet differs only by the one
sanctioned new rule. The temp files were removed (`git status` clean).

### Verification (actual observed output, this worktree)

- `npx tsc --noEmit` → **clean, zero output**.
- `npm run test:run` → **312 passed | 1 skipped (313 files); 5056 passed | 15 skipped (5071)**,
  80.7s. Zero failures. D9 tripwires green **UNMODIFIED**: `kundiusPages.test.tsx`,
  `oldContentFallback.test.tsx`, `coreParity.test.ts`, `uiFoundationIsolation.test.tsx.snap`
  (no snapshot content change — the file shows dirty only from a CRLF rewrite; `git diff` is empty).
- `npx next lint --file …` on the 7 touched source files → **1 PRE-EXISTING warning**
  (`react-hooks/exhaustive-deps` on SectionToolbar's validation `useMemo`), no errors, nothing new.
- `npm run build` → **success**. `git status --porcelain public/assets scripts/legacy
  public/published.css` → **empty**. `work.v1.js` byte-unchanged.
- **Playwright, actually run** (`E2E_PORT`, `--project=setup --project=authed`):
  `e2e/section-background.spec.ts` → **6 passed** (all 5 tests + auth setup; both new hero cases
  executed for real). `e2e/toolbar-dispatch.spec.ts` → **17 passed, unmodified** (its greyed
  Background assertions on meridian/hearth still hold). `e2e/workWave2.spec.ts --project=public` →
  **4 passed** (incl. "multi-slide hero emits the exact work.v1.js hooks").
- `npx playwright test e2e/parity.spec.ts --project=public` → **4 passed, 3 failed, all
  PRE-EXISTING and identical to the phase-2 record**: `atelier/header 4.94% > 3%` (the
  known-accepted work-contract-wave2 red — "don't re-flag") and the two `atelier2` dev-only-stage
  timeouts. meridian (max 1.30%) and hearth (max 0.25%) bands are well under 3%. Both atelier
  parityBreak negative controls fired (46.8%), so the stage itself is live.

### Risks / open items for the reviewer

1. **The atelier parity run stops at `header`**, so the atelier HERO band is not measured by
   `parity.spec.ts` today (pre-existing: the first failing section aborts the loop). Hero
   edit<->published parity for this phase is covered instead by `heroBackground.test.tsx`, which
   compares the two wrappers' markup directly, per variant, in both modes.
2. **Undo can leave a second, older entry under the gesture entry** when a user edits a hero image
   via the CANVAS primitive and then via the panel — different writers, different history shapes.
   One undo still restores the whole panel gesture (the wrapper entry is on top and restores the
   full content snapshot); a second undo re-applies an older value that is already current, i.e. a
   no-op. Worth a glance when phase 4's tray adds rapid multi-gesture sequences.
3. **Default tab on a hero is Image, not Color.** That is the honest derivation from data (the
   canvas IS showing media), but it means the colour chips are one click away on heroes. Founder may
   want the opposite default — a one-line change if so.
4. **Cap 6 is enforced in the helper, not yet in the UI.** `promoteToSlides` silently returns the
   unchanged set at 6; the visible cap notice + hidden Add slot are phase 4's. Until then a 7th pick
   is a silent no-op.
5. **`styleTokens` is now spread onto every template-backed published block.** Harmless (unknown
   props are ignored; the only two `{...props}` forwarders in the repo forward to components, not to
   DOM nodes), but it is a widened prop surface and worth one reviewer glance.
6. **E2E seed casing** (deviation 4) is a trap that will bite the next spec author; it is now
   recorded in the spec file itself.

---

## Phase 3 — review fixes

Branch: `feature/section-background` (verified with `git branch --show-current` BEFORE any edit).
Scope: the reviewer's ONE blocking issue + the three cheap non-blocking ones. Nothing else.

### Files changed

Created:
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.picker.test.tsx` — the mandated
  regression test for the blocking fix (the only file outside phase 3's Files-touched list; the
  task brief authorised "plus the new test file").

Modified:
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx` (blocking fix + non-blocking #2)
- `src/modules/skeletons/work/heroSlides.ts` (non-blocking #1)
- `src/modules/skeletons/work/heroSlides.test.ts` (coverage for #1)
- `src/modules/generation/workCollections.ts` (non-blocking #3)
- `docs/task/section-background.audit.md` (this section + the corrected phase-3 `unwrap()` line)

### BLOCKING — the Image picker was dead in the browser

**Fix chosen: guard the dismiss, do NOT hoist the modal.** Hoisting `MediaPickerModal` into
`SectionToolbar` would have dragged the picking STATE (`picking`), the elements selector, the
`normalizeSlides`/`promoteToSlides` calls and the `writeElements` gesture up with it — i.e. moved
the whole image feature out of the panel that owns it — to solve a dismiss problem. The guard keeps
the panel self-contained and every other dismiss path intact.

The click-outside `useEffect` MOVED down the component (it now reads `picking`, whose `useState` sits
below where the effect used to be) and gained two early returns, in this order:

```ts
if (picking !== null) return;                        // a picker is open → never dismiss
if (target.closest?.('[role="dialog"]')) return;     // belt-and-braces for anything portaled
```

A comment at the site records the whole mechanism (the portal is outside `panelRef`; mousedown still
BUBBLES; `DialogContent` stops `click` only; the asset button's `onMouseDown` preventDefault does not
stop propagation) so the guard cannot be "cleaned up" by a later reader.

Dismiss behaviour is otherwise unchanged and deliberately narrow: with no picker open the listener is
the phase-2 one line-for-line (pinned by a third test case). Clicking the Radix overlay to close the
dialog is also unaffected — it hits guard 1, the panel stays open, Radix closes the dialog itself.

### Coverage that survives regression (and PROOF it bites)

`BackgroundPanel.picker.test.tsx` — jsdom, **REAL panel + REAL `MediaPickerModal` + REAL
`createEditStore`**. Only `useTemplateReady` (async dynamic import) and `componentRegistry`
(`extractSectionType` alone is used) are stubbed; `fetch` is stubbed to serve one `/api/media` asset
and to absorb the debounced autosave. The harness reproduces `SectionToolbar`'s mount shape exactly
(`{open && <BackgroundPanel onClose={() => setOpen(false)}/>}`), so `onClose` genuinely UNMOUNTS the
panel and, with it, the modal.

Three cases: Replace-image → library asset → `content[hero].elements.portrait_image` is the picked
URL · Add-image → library asset → `slides` promotes to exactly `['/old.jpg', <picked>]` · a mousedown
genuinely outside (no picker open) still dismisses.

**Two mechanics are load-bearing and are commented as such in the file:**

1. The press is driven as `mousedown` … then `mouseup` + `click`, in **SEPARATE `act()` calls**. In
   a browser React flushes discrete-event updates synchronously, so a mousedown handler that
   unmounts has already detached the button before `click` is dispatched. Batching both into ONE
   `act()` defers the unmount to the end of the batch — and the test then PASSES against the broken
   handler. Observed, not theorised: with a single combined `act()` the mutant run failed only on
   `closedCount` while the store-write assertion went green.
2. The test asserts a precondition — `panel.contains(dialog) === false` — so the portal premise is
   pinned rather than assumed.

**Proof it bites** (mutation applied, then reverted — `git diff` confirms the guard is back): with
the two guard lines deleted, `npx vitest run BackgroundPanel.picker.test.tsx` → **2 failed |
1 passed**, failing on the real symptom:

- `expected '/old.jpg' to be 'https://blob.test/library-pick.jpg'` (the pick never landed)
- `expected false to be true` on `Array.isArray(slides)` (the promote never happened)

With the guard restored: **3 passed**.

### Non-blocking #1 — `unwrap()` handled the wrong legacy wrapper key

`heroSlides.ts` `unwrap()` now unwraps `'content' in v` FIRST (the live wrapper — `getStringContent`,
`storeTypes.ts`; the repo precedent `WorkFooter.tsx` unwraps both), then `'value'`. The comment
records why it matters: with only the `value` branch, a `{content: url}` portrait made
`normalizeSlides` report NO image and `promoteToSlides` write an **empty first slide**.

Three new `heroSlides.test.ts` cases: a `{content}` portrait normalizes · promote off a `{content}`
portrait keeps the first slide non-empty (`['/p.jpg','/new.jpg']`) · a `{content}`-wrapped `slides`
array. The existing `{value}` case is kept unmodified (that shape is still accepted).

The phase-3 audit line claiming `unwrap()` "handles BOTH element storage shapes" is **corrected in
place** above, with a pointer to this section.

### Non-blocking #2 — empty panel body on `workherocenter`

`const tab: UBgMode = rendersImage ? storedBgMode ?? 'image' : 'color';` — `rendersImage` now GATES
the stored value instead of only supplying the default. Reachable exactly as the reviewer described
(hero variants are user-swappable): slider → Image (persists `bgMode:'image'`) → swap to "Centered
type" → previously `tab === 'image'` with `rendersImage === false` hid the chips AND gated off the
image block, leaving three tabs over an empty body. Rationale is in the comment.

No stored data changes: `setTab` still refuses to WRITE `'image'` on a variant that renders no media
(D7's no-op), and a stored `'image'` from the slider is left untouched — swapping back restores it.

### Non-blocking #3 — duplicated trailing comment

`workCollections.ts:157` — the doubled `// the ≥2 invariant (never stamp a lone slide)` is now
single. Comment-only.

### Deviations

None beyond the reviewer's brief. The one file outside phase 3's Files-touched list is the new test
file, which the brief authorised and asked to be noted here.

### Gates (real, observed output in this worktree)

- `npx tsc --noEmit` → **clean, zero output** (exit 0).
- `npm run test:run` (FULL suite, re-run to settle the b8 question) →
  **`Test Files 313 passed | 1 skipped (314)`, `Tests 5062 passed | 15 skipped (5077)`, 98.53s.**
  Zero failures. **`src/hooks/useWizardStore.b8.test.ts` PASSED inside this full-suite run** — the
  reported flake did not reproduce, and nothing in this phase touches it. D9 tripwires green and
  UNMODIFIED (`kundiusPages`, `oldContentFallback`, `coreParity`, `uiFoundationIsolation.snap`).
- **Playwright, actually run** (dev server on `E2E_PORT=3411`;
  `npx playwright test e2e/section-background.spec.ts --project=setup --project=authed`) →
  **6 passed (54.3s)** — auth setup + all 5 section-background cases executed, including both hero
  cases. The spec file was NOT modified this round.
- `git status --porcelain public/assets scripts/legacy public/published.css` → **empty**.
  `work.v1.js` byte-unchanged; `scripts/` and `public/assets/` untouched. No git state changes,
  no commit.

### Residual risks

- The guard keys on `picking !== null` plus a `[role="dialog"]` ancestor check. If a future control
  in this panel opens a NON-dialog portal (e.g. a popover portaled to body), it needs the same
  treatment — the `picking` guard covers only the media picker.
- The regression test stubs `fetch`: it proves the panel↔modal↔store wiring, not the real
  `/api/media` contract (that is `media-picker.spec.ts`'s job).
- Untouched and recorded as instructed: `.wk-hero__num` still rendering in Color mode (founder-eyeball
  item at the gate) and the `useWizardStore.b8` full-suite timeout (did not reproduce here).

---

## Phase 4 — Filmstrip tray (Slice 3)

Branch: `feature/section-background` (verified with `git branch --show-current` BEFORE any edit).

### Files changed

Created:
- `src/app/edit/[token]/components/toolbars/HeroSlidesTray.tsx`
- `src/app/edit/[token]/components/toolbars/HeroSlidesTray.test.tsx`

Modified:
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx`
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.tsx`
- `e2e/section-background.spec.ts`
- `docs/task/section-background.audit.md` (this section)

**Nothing outside phase 4's Files-touched list was edited.** `docs/task/section-background.plan.md`
shows dirty in `git status` — it was already dirty before this phase (the orchestrator's progress-log
line for phase 3); `git diff` confirms the only hunk is that line, none of it mine.

### Per-file

**`HeroSlidesTray.tsx` (new)** — the filmstrip. Docked inside the same `BackgroundPanel`, horizontal
`flex` strip, one card per slide, numbered `01/02/03` **derived from index** (position IS the number,
so it is never stored). Per card: a thumbnail button (preview), a dedicated drag HANDLE, replace, and
remove. dnd-kit setup copied from `EditableImageCollection.tsx`: `PointerSensor
{activationConstraint:{distance:6}}` + `KeyboardSensor`/`sortableKeyboardCoordinates`,
`SortableContext` with ids taken from the slide ids, `closestCenter`, `rectSortingStrategy`, plus
`restrictToHorizontalAxis` from `@dnd-kit/modifiers` (already installed) — `onDragEnd` resolves
from/to and emits ONE write carrying the FULL new order.
- **Zero store access.** Every mutation is computed by the phase-3 helpers and handed to a single
  injected `onApplyPatch(label, patch)` — the "one writer, fully contained" law from
  `EditableImageCollection.tsx:16-23`. Phase 4 adds **no helper** (D8).
- Delete has **no confirm dialog**; `removeSlide` auto-demotes at 2, and the strip says
  "Removing is instant; Undo puts it back."
- **Cap 6:** the trailing "+" card is HIDDEN at `MAX_HERO_SLIDES` and replaced by
  `hero-slides-cap-notice` (the `SocialItemsEditor` pattern). Before this phase the 7th pick was a
  silent no-op inside `promoteToSlides`.
- Chrome uses the app-chrome tokens (`bg-app-surface`, `border-app-border`, `rounded-app-ctl`,
  `text-app-muted/faint/ink`, `hover:text-app-danger`), every control carries an `aria-label` naming
  its slide (`Replace slide 02`), and the testids are the plan's kebab nouns: `hero-slides-tray`,
  `hero-slide` (+`data-slide-id`), `hero-slide-replace`, `hero-slide-remove`, `hero-slide-add`,
  `hero-slides-cap-notice` (+ two the plan did not name but the tests/e2e need: `hero-slide-preview`,
  `hero-slide-drag`).
- Canvas preview is a `window` CustomEvent, `lessgo:wk-hero-preview-slide`
  (`lessgo:manage-collections` precedent), exported as `HERO_PREVIEW_SLIDE_EVENT` +
  `dispatchHeroSlidePreview`. Clicking the same thumbnail again — or the tray unmounting — dispatches
  `slideId: null`, which RELEASES the preview; without that, autoplay would stay paused forever on a
  slide whose control is gone.

**`BackgroundPanel.tsx`** — four changes:
1. Renders `HeroSlidesTray` inside the Image tab whenever `normalizeSlides` reports slideshow state
   (spec §B "the same panel, grown"). The single-image `+ Add image` slot is now **state-A only**, so
   there is exactly one add control at any time (the tray's "+" card is the 2+ one, and it is the one
   that hides at the cap).
2. New `applyPatch(label, patch)` — the ONE place a `HeroSlidesPatch` becomes an elements write. The
   two shapes are asymmetric on purpose: `'single'` DELETES the `slides` key (note N5) rather than
   writing `[]`. It routes through the existing `writeElements`, so every tray gesture is still ONE
   `executeUndoableAction('sectionSwap', …)` — the only action type whose undo restores the whole
   `content` snapshot. `pickAdditional` was refactored onto it (same output).
3. **Carry-forward #1 (setTab on a no-media variant).** `if (next === 'image' && !rendersImage)` ->
   `if (!rendersImage) return;`. Phase 3 blocked only the `'image'` write, so a Color click on
   `workherocenter` persisted `bgMode:'color'` — inert there, but it becomes a colour hero the moment
   the user swaps back to the slider. Now `bgMode` is never written on a variant that renders no media
   (D7's no-op, honoured on both tabs). Colour chips are unaffected.
4. **Carry-forward #2 (`picking` silent-unmount).** New `useEffect` resets `picking` whenever the
   `isHero && rendersImage && tab === 'image'` mount condition goes false. Without it, a flip while the
   picker is open unmounts `MediaPickerModal` without `onOpenChange` firing, leaving `picking` set —
   and the phase-3 dismiss guard (`if (picking !== null) return`) would then make that panel instance
   permanently undismissable. Phase 4 makes it reachable (per-card replace = a second entry point).
   `picking` also changed shape (`'single' | 'add'` -> an object, so replace can carry its `slideId`).

**`WorkHeroSlider.tsx`** — the existing slider effect gained a `lessgo:wk-hero-preview-slide`
listener: matching `sectionId` + a known `slideId` -> `paused = true; stop(); go(i)`; `slideId: null`
-> resume. Edit-only, DOM-only, zero published impact and zero markup change.
- The DOM `.wk-hero__slide` nodes deliberately carry **no id attribute** — adding one would change
  published markup for untouched drafts (D9) — so the id->index map is resolved in the wrapper from
  the same array the core renders in order, threaded into the effect as a STABLE STRING dep
  (`slideIdsKey`); an array literal dep would re-run the effect every render.

**`e2e/section-background.spec.ts`** — one new case + one adjusted assertion (see Tests).

### Deviations from the plan (in-scope judgement calls)

1. **`horizontalListSortingStrategy` -> `rectSortingStrategy`.** The plan named the former; the task
   brief explicitly says `rectSortingStrategy` works for a horizontal strip and is the repo
   precedent. Took the precedent. `restrictToHorizontalAxis` IS used, as the plan asked.
2. **`arrayMove` is not called.** The brief's sketch was "onDragEnd -> arrayMove -> one onChange", but
   D8 is binding that phase 4 reuses the phase-3 helpers, and `reorderSlides(slides, from, to)` IS
   that splice move with the invariant + cap enforced inside it. Calling both would have meant either
   a duplicated order computation or a mutation of the helper's result. One writer, one computation.
3. **The tray renders whenever `normalizeSlides` says slideshow — not only on `workheroslider`.**
   Only the slider RENDERS a slide set, so this is the same set of drafts in practice; but if slides
   data ever exists on the image/split variants, the old code showed an "N images" line with no
   control at all. The tray is the correct editor for that data and its delete auto-demotes back to a
   renderable single image. Conservative in the sense that matters: it never creates slides where
   there were none.
4. **Two testids beyond the plan's list** (`hero-slide-preview`, `hero-slide-drag`) — the preview and
   drag affordances are separate controls (a card-wide drag would fight the thumbnail's click), and
   both the tests and the e2e need to address them.
5. **The two carry-forward regression tests live in `HeroSlidesTray.test.tsx`**, not in
   `BackgroundPanel.picker.test.tsx` (which is not in this phase's Files-touched list). They are in
   their own `describe` with a note saying why.

### Tests added

**`HeroSlidesTray.test.tsx` (new, 9 cases)** — real `BackgroundPanel`, real `createEditStore`, real
`MediaPickerModal`; only `useTemplateReady`, `componentRegistry.extractSectionType` and **dnd-kit**
are stubbed. The dnd-kit stub is narrow and justified in the file header: jsdom reports every rect as
0x0, so the library's own drop resolution cannot run there; the mock captures the `onDragEnd` WE pass
and invokes it with real slide ids, which exercises the part this phase owns (id lookup -> helper ->
single write). The real drag is covered in Playwright instead.
1. one numbered card per slide, in play order, `Slide 01/02/03` aria-labels, and the state-A add slot
   is NOT also rendered;
2. **reorder -> the FULL new order persists once, and the PUBLISHED play order matches** — the phase's
   acceptance criterion, asserted by rendering the real published hero wrapper off the resulting store
   state and reading `.wk-hero__slide img` in DOCUMENT order (which is what `work.v1.js` iterates).
   Also: a self-drop / null-over writes nothing;
3. delete down to one **demotes**: `portrait_image` is the survivor, `'slides' in elements === false`
   (not `[]`), tray gone, state-A controls back;
4. delete at 3 keeps a slideshow and **ONE `undo()` restores** the deleted slide;
5. **cap 6**: add card hidden + `hero-slides-cap-notice` present, and both revert below the cap;
6. thumbnail click dispatches the preview event for that slide, writes NOTHING, and a second click
   dispatches `slideId: null`;
7. the Scope-OUT word sweep (autoplay/interval/transition/crop/focal) over the whole panel;
8. **carry-forward #1**: a Color click on `WorkHeroCenter` writes no `bgMode` at all (while the colour
   chip still works);
9. **carry-forward #2**: open a picker from a tray card -> flip to the Color tab -> the panel is still
   dismissable by an outside mousedown.

Per the phase-3 lesson, every simulated press dispatches `mousedown` and `mouseup`/`click` in
**separate `act()` calls** (batching them lets an unmount-on-mousedown bug pass green).

**Mutation check — the new assertions BITE (observed, then reverted; `git diff` confirms).**
- Round 1, three mutants at once (`reorderSlides(slides, to, from)`; `slides.length > MAX_HERO_SLIDES`;
  `delete next.slides` -> `next.slides = []`) -> **3 failed | 4 passed**, failing exactly on the reorder
  order, the demote key, and the still-visible add card.
- Round 2, the two carry-forward fixes reverted to their phase-3 form -> **2 failed | 7 passed**:
  `expected 'color' to be undefined` and `the panel was left undismissable by a stale picking:
  expected +0 to be 1`.

**`e2e/section-background.spec.ts`** — new case *"the tray reorders the live slides and a thumbnail
previews one"*: opens the panel on the 2-slide hero, asserts the tray + `01/02` numbering, performs a
**REAL pointer drag** (mouse down -> intermediate moves past the 6px activation distance -> up), waits
for the `saveDraft`, then asserts BOTH that the strip re-ordered AND that the CANVAS did (the first
`.wk-hero__slide img` is now the src that was second) — an attribute-only check would have been inert.
Then it clicks a thumbnail, asserts that DOM slide gets `is-active`, and asserts it is STILL active 6s
later (the autoplay interval is 5s, so this fails if the preview did not pause it). One existing
assertion was adjusted: at 2+ the always-visible add control is now `hero-slide-add` and
`section-bg-add-image` is asserted ABSENT (one add control, never two).

### Verification (actual observed output, this worktree)

- `npx tsc --noEmit` -> **clean, zero output** (exit 0).
- `npm run test:run` -> **Test Files 314 passed | 1 skipped (315); Tests 5071 passed | 15 skipped
  (5086)**, 80.8s. Zero failures. D9 tripwires green and **UNMODIFIED**: `kundiusPages.test.tsx`,
  `oldContentFallback.test.tsx`, `coreParity.test.ts`, `uiFoundationIsolation.test.tsx.snap`.
- `npx next lint --file` on the three touched source files -> **"No ESLint warnings or errors"**.
- `npm run build` -> **success**; `git status --porcelain public/assets scripts/legacy
  public/published.css` -> **empty**. `work.v1.js` byte-unchanged; `scripts/` untouched.
- **Playwright, actually run** (dev server on `E2E_PORT=3412`):
  `e2e/section-background.spec.ts --project=setup --project=authed` -> **7 passed (1.8m)** — auth setup
  + all 6 cases including the new phase-4 drag/preview case.
  `e2e/workWave2.spec.ts --project=public` (`E2E_PORT=3413`) -> **4 passed**, including "multi-slide
  hero emits the exact work.v1.js hooks".
- No git state changes; nothing committed.

### D9 ledger

`work.v1.js` byte-unchanged and the frozen hooks (`.wk-hero__slide`/`.is-active`,
`[data-wk-prev]`/`[data-wk-next]`, `[data-wk-dots]`, `[data-wk-interval]`) still emitted verbatim
(`workWave2.spec.ts` + `heroBackground.test.tsx` both green, unmodified). `public/assets` and
`scripts/legacy` untouched. No core, no `.published.tsx`, no `styles.ts` was touched this phase — the
published markup is bit-for-bit what phase 3 shipped, so untouched drafts are unchanged. No slide id
attribute was added to the DOM. `MediaPickerModal` stays behind the edit-only panel; `HeroSlidesTray`
is `'use client'` and is imported by nothing but `BackgroundPanel`.

### Risks / open items for the reviewer

1. **The jsdom reorder test mocks dnd-kit.** It proves our handler + the write + the published order;
   it does NOT prove dnd-kit's own drop resolution. The Playwright case does that with a real drag —
   if that e2e is ever quarantined, the drag wiring loses its only real-browser proof.
2. **Preview is DOM state, not store state.** Re-rendering the hero (any content edit, an autosave
   round trip, a variant swap) re-runs the slider effect, which calls `go(0)` — the preview snaps back
   to slide 01 and autoplay resumes. Acceptable for a preview affordance, but it is why the tray's
   `previewing` highlight can briefly disagree with the canvas after an unrelated edit.
3. **The preview event is global (`window`), keyed by `sectionId`.** Two hero sliders on one page are
   fine (the id filter); a future second listener on the same event name is not.
4. **Cap 6 is now enforced in the UI for the tray path only.** Reaching 7 is impossible through this
   panel, but the helper's silent no-op is still the last line of defence for any other future caller.
5. **The e2e preview case spends 6 real seconds** waiting out the autoplay interval — that is the only
   way to prove "paused", but it makes that spec ~6s slower.
6. **Deferred deliberately** (plan/founder-ruled, not oversights): no autoplay/interval/transition
   control, no crop/focal point, no per-slide overlay text, nothing behind Video, no Accent chip. Drag
   FEEL against `npm run dev` remains the phase's declared manual check, as does the founder's
   publish -> live-slideshow gate.

---

## Phase 4b — two user-visible bugs from the phase-4 review

**Files changed**

- `src/app/edit/[token]/components/toolbars/HeroSlidesTray.tsx` (modified)
- `src/app/edit/[token]/components/toolbars/BackgroundPanel.tsx` (modified)
- `src/modules/skeletons/work/blocks/Hero/WorkHeroSlider.tsx` (modified)
- `src/app/edit/[token]/components/toolbars/HeroSlidesTray.test.tsx` (modified — 5 new cases)
- `src/modules/skeletons/work/blocks/__tests__/heroSliderPause.test.tsx` (NEW)
- `docs/task/section-background.audit.md` (this section)

### BUG 1 — tray unmount clobbered the EDIT pause

Two-sided fix, because either side alone leaves a hole:

- `HeroSlidesTray.tsx` — the unmount cleanup now dispatches the release **only when something was
  actually previewing**. `previewId` is mirrored into `previewIdRef` (the cleanup's dep is
  `[sectionId]`, so its closure never re-forms and the state value would be the mount-time one).
  `setPreview()` is the single writer of both.
- `WorkHeroSlider.tsx` — pause **provenance**: the single `paused` flag is split into `focusPaused`
  (set by `focusin`/`focusout`) and `previewPaused` (set by the filmstrip), with
  `isPaused() = focusPaused || previewPaused` read by `restart()`. A preview release now clears only
  `previewPaused`, so a focus pause survives it. Needed on top of the tray guard: previewing a slide
  and *then* clicking into hero copy would still have released the focus pause on unmount.

No markup change, no new DOM attribute, no dep-array change — the effect's deps and the frozen
`work.v1.js` hooks are untouched.

### BUG 2 — add/preview live on non-slider hero variants (R6)

`HeroSlidesTray` takes `allowAdd` / `allowPreview` (default `true`); `BackgroundPanel` passes
`isSlider` for both. Per the greyed-placeholder rule the controls stay **visible but inert**: the `+`
card and each thumbnail get `aria-disabled`, a `cursor-not-allowed opacity-60` treatment and a `title`
explaining that slideshows only play on the slider layout, plus an in-panel notice
(`hero-slides-not-slider-notice`) so the why is not tooltip-only. Reorder / replace / remove stay live
— they change stored content that becomes visible again the moment the hero is swapped back to the
slider. The tray's trailing help sentence drops "Click one to see it on the page" when preview is off.

### BUG 3 — stale preview highlight (was cheap, done)

One effect keyed on `ids.join('|')` clears `previewId`. That string is the exact signal
(`slideIdsKey`) the canvas slider re-runs on (`go(0)` + `restart()`), so tray highlight and canvas
cannot disagree after an add/remove/reorder. Note the review's framing ("after an unrelated content
edit") is slightly off: an unrelated edit recomputes `slideIdsKey` to the *same string*, so the slider
effect does **not** re-run; the real divergence path is a slide-set change, which is what this covers.

### Deviations

- Added one **new test file** (`heroSliderPause.test.tsx`) rather than editing
  `heroBackground.test.tsx`, which is a markup tripwire and had to stay unmodified. Counts as "their
  tests"; flagged here because it is a file the phase brief did not name explicitly.
- Bug 1 fixed on **both** sides rather than picking one, per the brief's "the focus/edit pause must
  survive a tray unmount" requirement (tray-only leaves the preview-then-focus hole).
- Bug 2 uses inert-with-a-why rather than hiding the controls (project greyed-placeholder rule).

### Tests — proven by mutation, not just green

| Mutation | Expected biter | Result |
|---|---|---|
| `previewPaused = false` → also `focusPaused = false` (old shared flag) | slider pause tests | 2 failed |
| unmount cleanup guard removed (always release) | "unmount with NOTHING previewed" | 1 failed |
| unmount cleanup never releases | "unmount WHILE previewing still releases" | 1 failed |
| panel stops passing `allowAdd`/`allowPreview` | "on a NON-slider hero … inert" | 1 failed |
| `[idsKey]` clear effect removed | "preview highlight clears" | 1 failed |

First draft of the slider tests was **inert**: `tick(15000)` with 3 slides at a 5000ms interval lands
back on the starting index, so a running slideshow read as "held" — the mutant passed. Replaced with
`expectHeldAt()`, which asserts after **each** interval.

### Gates (real output)

- `npx tsc --noEmit` — clean, no output.
- `npm run test:run` — `Test Files 315 passed | 1 skipped (316)`, `Tests 5081 passed | 15 skipped (5096)`, 74.91s.
- `npx playwright test e2e/section-background.spec.ts` — `7 passed (1.4m)` (ran, not skipped).

### D9 ledger

`work.v1.js` / `public/assets` / `scripts/legacy` untouched; no new DOM attribute on published markup
(all changes are edit-only chrome or in-effect JS state); frozen slider hooks verbatim; the
`heroBackground` byte-identity tripwire and every other tripwire ran **unmodified** and green.

### Open risks

1. **Pause provenance is closure-local.** A third future pause reason must add its own flag, not reuse
   one of these two — the same trap in a new coat.
2. **Reorder/replace/remove stay live off the slider layout.** Intentional (the content is real and
   becomes visible again after a layout swap), but a user can still reorder slides they cannot see;
   the in-panel notice is the only thing telling them so.
3. `allowAdd`/`allowPreview` default to `true`, so a future second caller that forgets them
   re-inherits bug 2. The panel is the only caller today.

---

# Phase 5 — Editor gaps: `worksRow` + "Content" label (Slice 4)

## Files changed

- `src/app/edit/[token]/components/cms/CmsPanel.tsx`
- `src/app/edit/[token]/components/cms/CmsPanel.test.tsx`
- `src/app/edit/[token]/components/layout/LeftPanel.tsx`

No other file touched (verified via `git diff --stat`; the two unrelated pre-existing working-tree
edits — `docs/Design/.../Lessgo Editor Redesign.dc.html`, `docs/temp/message.md` — predate this phase
and were NOT made here).

## What changed

### `CmsPanel.tsx` (D1 — works deep-link row)

- New import `templateHasCapability` from `@/modules/templates/templateMeta` (pure data module — no
  template import, so the bundle firewall is intact and it is client-safe).
- New reads: `const templateId = useEditStore((s) => s?.templateId)` (optional-chained, matching this
  file's documented store-access convention) → `hasWorkLibrary = templateHasCapability(templateId, 'works')`.
- Row rendered after the "New collection" button, inside the same padded column: `<a>` with
  `data-testid="cms-works-link"`, `href={/dashboard/${encodeURIComponent(tokenId)}/work}`, text
  "Works library" / "Your work →" — the same testid, href shape and gate as the dashboard board
  (`CmsBoardClient.tsx:374-384`, range verified: comment on :374, JSX :375-384).
- Header comment updated: the "NO CAPABILITY GATING" note now scopes itself to the collection LIST and
  names the works row as the one gated exception, so the next reader does not "fix" the gate away.

### `LeftPanel.tsx` (D2 — label only)

- `RAIL_TABS` entry: `label: 'CMS'` → `label: 'Content'`, with a comment stating that `value: 'cms'`,
  `RailTab` and `LIVE_RAIL_TABS` stay `'cms'` because `lessgo:manage-collections` keys off them.
  Nothing else in the file changed — value, type, allow-list and event wiring are byte-identical.

### `CmsPanel.test.tsx`

- `storeState` gained a mutable `templateId` (default `'meridian'` — a real template WITHOUT the
  `works` capability); the top-level `beforeEach` resets it so no test leaks the gate.
- Existing rail-integration selectors `tab('CMS')` → `tab('Content')` (3 call sites). Those tests are
  exactly the rename's proof: the live-tab check, the tab→panel body swap, the consume-once target and
  the `lessgo:manage-collections` auto-switch all still pass against the new label.
- New `describe('CmsPanel — works library deep link')` with BOTH directions:
  `atelier` (works-capable) → link present with `href="/dashboard/tok/work"` and "Works library" text;
  `meridian` → absent; `templateId: null` → absent.

## Deviations

1. **Type sizes, not the dashboard's.** The ported row keeps the dashboard's structure, testid, href,
   copy and border/radius tokens, but uses `text-[12.5px]` / `text-[11px]` and `mt-2` instead of
   `text-sm` / `text-xs` / `mt-3` — the rail's scale (its sibling "New collection" button is
   `text-[12.5px]`). Conservative in-scope call: a 14px row in a 300px rail would read as a different
   system, which is the opposite of the row's purpose. Logged rather than escalated (in Files-touched).
2. **Row placement below "New collection"** (dashboard renders it below the index column list) — the
   nearest equivalent position in the rail.

## Test results (real output)

- `npx vitest run src/app/edit/[token]/components/cms/CmsPanel.test.tsx` →
  `Test Files 1 passed (1)` / `Tests 19 passed (19)` (was 16).
- `npx tsc --noEmit` → clean, no output.
- `npm run test:run` → `Test Files 315 passed | 1 skipped (316)`, `Tests 5084 passed | 15 skipped (5099)`, 68.99s.
- Playwright, `E2E_PORT=3311 npx playwright test --project=authed`:
  - `cms-authoring.spec.ts` → **1 failed** at `e2e/cms-authoring.spec.ts:54`,
    `getByRole('button', { name: 'Collections' })` timed out. **PRE-EXISTING, not this phase.** That
    selector targets the GlobalAppHeader "Collections" button DELETED by cms-collections phase 8B
    (`394d461c`) when CMS moved into the rail; the spec's last touch is phase 8A (`a8aa8221`), i.e. it
    has been stale since before this branch. It never selected the string `CMS`, so the rename cannot
    have caused or worsened it. **Out of scope to fix (file not in Files touched) — reported.**
  - `cms-publish.spec.ts` → **1 failed, 2 did not run**: `expect(pub?.status())` received `undefined`
    at `:121` — the local `/p/<slug>` fetch, i.e. the absent-Blob/KV local-dev environment, not a
    selector. This spec never touches the rail tab.
- Rename safety, checked directly rather than assumed: `grep` over `src/` + `e2e/` for the literal tab
  label found only `CmsPanel.test.tsx` (updated) and the definition itself. No e2e spec selects the
  rail tab at all (`e2e/*.spec.ts` has no `[role="radio"]`/`Sections` rail selector outside
  link-picker's own panel). The `lessgo:manage-collections` → switch-to-tab flow is covered by the two
  vitest rail tests, both green post-rename.

## Open risks

1. `e2e/cms-authoring.spec.ts` is dead weight until its opening selector is repointed at the rail tab
   (now `Content`) — it will keep failing and cannot regression-test the CMS UI meanwhile. Needs its
   own ticket.
2. The works row is gated on the template's `works` CAPABILITY, matching the dashboard exactly. A
   works-capable project whose owner has not run ingestion still sees the link and lands on an empty
   board — same behaviour as the dashboard, deliberately not diverged.
3. The row's `href` is a plain full-page navigation OUT of the editor; unsaved-draft protection is
   whatever the editor's existing dirty-guard provides for external links (unchanged by this phase).

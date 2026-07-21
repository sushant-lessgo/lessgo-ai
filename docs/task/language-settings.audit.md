# language-settings — implementation audit

## Phase 1 — locale contracts + store actions

Branch verified before any edit: `feature/language-settings` (worktree
`C:\Users\susha\lessgo-ai\.claude\worktrees\language-settings`). No git state
commands run.

### Files changed

- `src/lib/i18n/localeNames.ts` (new)
- `src/lib/i18n/localeNames.test.ts` (new)
- `src/hooks/editStore/i18nActions.ts` (new)
- `src/app/edit/[token]/components/editor/LanguageToggle.tsx`
- `src/types/core/content.ts`
- `src/lib/validation.ts`
- `src/stores/editStore.ts`
- `src/types/store/actions.ts`
- `src/hooks/editStore/i18nStoreState.test.ts`
- `docs/task/language-settings.audit.md` (this file)

All within the phase's Files-touched list (plus the audit). Nothing else edited;
in particular the six audited reader files (`aiActions`, `generationActions`,
`contentActions`, `historyHelpers`, `uiActions`, `persistenceActions`) and
`LocaleSettings.tsx` are untouched.

### Per file

**`src/lib/i18n/localeNames.ts` (new)** — plain module, NO `'use client'`, and it
imports only `./localeContent` (itself plain). Carries:
- `LOCALE_DISPLAY_NAMES` + `localeLabel()` — moved verbatim (identical values)
  from `LanguageToggle.tsx`; native endonyms, UI-only.
- `LOCALE_ENGLISH_NAMES` — new English-exonym map, all 12 `SUPPORTED_LOCALES`
  (`nl→Dutch`, `ja→Japanese`, `id→Indonesian`, …). Prompt-only.
- `toPromptLanguage(code)` = `LOCALE_ENGLISH_NAMES[code] ?? code`.
- `LOCALE_LABEL_TO_CODE` (built from BOTH maps) + `labelToLocaleCode(label)`
  (trim/case-insensitive, tolerates non-string, `null` for unmapped e.g.
  `'Hindi'`). Codes are deliberately NOT accepted as labels.

**`LanguageToggle.tsx`** — now imports the two symbols from `localeNames.ts` and
**re-exports** them, so `LocaleSettings.tsx` (phase 2 deletes it) and any other
importer keep compiling. No behavior/JSX change.

**`src/types/core/content.ts`** — `LocaleConfig` gains
`switcherStyle?: 'dropdown' | 'none'` with the "absent ⇒ dropdown ⇒ today's
behavior; publish layer only" doc, plus a ruling-10 warning on the interface:
non-null ≠ multi-locale; gate multi-locale behavior on `isMultiLocale()`.

**`src/lib/validation.ts`** — `DraftSaveSchema.localeConfig` object branch gains
`switcherStyle: z.enum(['dropdown','none']).optional()`. `.nullable().optional()`
on the object is unchanged; no route change needed (saveDraft replaces the object
wholesale). Note the practical effect: zod strips unknown keys, so before this
change a `switcherStyle` would have been silently dropped at the server boundary.

**`src/hooks/editStore/i18nActions.ts` (new)** — `createI18nActions(set, get)`
exporting `addLocale` / `removeLocale` / `setSwitcherStyle`, confirmation-free
(the `confirmDialog` stays in the UI layer, phase 2).
- `addLocale` — verbatim move of `LocaleSettings.tsx:69-89` (first-declaration
  seeding, `localeEngaged`, `persistence.isDirty`, `triggerAutoSave` flush).
- `removeLocale` — moved from `:91-128`; the ONLY semantic change is the
  drop-to-single branch (ruling 10): surviving default `'en'` ⇒ `localeConfig =
  null` as today; surviving default ≠ `'en'` ⇒ `{locales:[def],
  defaultLocale:def}` preserved (carrying `switcherStyle` when set). Overlay
  drop, multi→multi branch, engaged/dirty/flush choreography unchanged.
- `setSwitcherStyle` — no-op when `localeConfig` is null (zero-diff guard).

**`src/stores/editStore.ts`** — import + one `...createI18nActions(set, get)`
line in the composition block. Nothing else.

**`src/types/store/actions.ts`** — the three action signatures are declared on
**`MetaActions`**, not `ContentActions`. See "Deviations".

**`src/hooks/editStore/i18nStoreState.test.ts`** — the two simulated closures are
gone:
- the clear-contract test (was `:323`) now calls the REAL `removeLocale('nl')`;
- the dirty-gate test (was `:354`) now calls the REAL `addLocale('nl')` and lets
  the action's own `triggerAutoSave` flush drive the debounced save.
A new describe block `locale mutator actions` adds 12 cases: addLocale seeding /
append / idempotence / NL-default seeding; ruling-10 branch A (en ⇒ null, overlay
dropped, still engaged) and branch B (nl ⇒ config preserved, `not.toBeNull()`,
and actually present in the save body); preserved-single-NL routes
`updateElementContent` to BASE with no overlay (proves the six audited readers
stay correct); multi→multi survival; `setSwitcherStyle` round-trip into the save
payload; null-config no-op asserting the save body has NO `localeConfig` key
(absence, not falsiness) and the store stays never-engaged/not-dirty; engaged
config without a style serializes with the `switcherStyle` key ABSENT;
`switcherStyle` survives the ruling-10 preservation.

**`src/lib/i18n/localeNames.test.ts` (new)** — map parity over `SUPPORTED_LOCALES`
(both maps), no stray codes, native≠exonym pins, `toPromptLanguage` matrix
(`'nl'→'Dutch'`, explicitly `not 'Nederlands'`, unknown ⇒ raw code),
`labelToLocaleCode` (exonyms, natives, case/whitespace, unmapped/empty/non-string
⇒ null, bare code ⇒ null), and `LOCALE_LABEL_TO_CODE` covering both maps.

### Anti-inert-test check (mutation-verified)

The ruling-10 tests were verified by mutating the implementation, not assumed:

- forced the clear branch always (`if (true)`) ⇒ **3 failures**: the NL-preserve
  test, the NL-preserve-in-save-body test, and the switcherStyle-survives test.
- forced the preserve branch always (`if (false)`) ⇒ **2 failures**: the
  EN-clears test and the explicit-null clear-contract test.

Both branches therefore genuinely discriminate. The mutation was reverted and the
suite re-run green.

### Deviations from the plan

1. **Action signatures went on `MetaActions`, not next to `setActiveLocale` on
   `ContentActions`.** The plan said "next to `setActiveLocale` at `:111`". That
   is inside `interface ContentActions`, and `createContentActions` is annotated
   `: ContentActions` — adding members there produced
   `TS2739: Type ... is missing the following properties from type 'ContentActions':
   addLocale, removeLocale, setSwitcherStyle`, and `contentActions.ts` is NOT in
   this phase's Files-touched. I followed the in-repo precedent for exactly this
   situation: the CMS actions are declared on `MetaActions` with a comment saying
   why. A pointer comment was left at `setActiveLocale` so the pair is findable.
   Still `actions.ts`, still not `state.ts`.
2. **`removeLocale` drop-to-single sets `activeLocale = def`** (the surviving
   locale) instead of the old `cfg.defaultLocale`. Identical in every reachable
   case (the UI cannot remove the default), but it keeps `activeLocale` inside the
   surviving declaration if a future caller removes a default. Noted inline.
3. **`addLocale` does not carry `switcherStyle` into a first declaration.** I
   briefly added that and reverted it, to keep the reviewer's "verbatim move"
   assertion literally true; the case (a config with a style but zero locales)
   is unreachable.

### Plan pointers verified against the tree

All phase-1 pointers checked; corrections:

- `LanguageToggle.tsx:17-34` display map — **correct**.
- `LocaleSettings.tsx:69-89` addLocale / `:91-128` removeLocale / `:110-115`
  drop-to-single — **correct**.
- `validation.ts` `DraftSaveSchema.localeConfig` "L60-66" — **correct**.
- `i18nStoreState.test.ts:324,357` simulated closures — **correct** (the setState
  recipes sit at those lines).
- `persistenceActions.ts:379-383` save branch / `:467-468` activeLocale
  re-derive — **correct**.
- `types/store/actions.ts:111` `setActiveLocale` — line is right, but the
  *interface* is wrong for new members (see Deviation 1). **Correction for later
  phases / the reviewer.**
- `types/state.ts` needs no change — **confirmed** (`localeConfig` there is typed
  via `import('@/types/core/content').LocaleConfig`, so `switcherStyle` flows in
  automatically).

### Deliberately not done

- No UI change (phase 2 owns `LanguagesPanel` / the globe retirement);
  `LocaleSettings.tsx` still exists and still uses its own local closures — it is
  deleted in phase 2, and it is not in this phase's Files-touched.
- No `projectLocale.ts` / prompt or route consumption of `toPromptLanguage`
  (phase 4); the helper ships unused-in-prod this phase, tested only.
- No publish-layer reading of `switcherStyle` yet (phase 5).

### Open risks

- `toPromptLanguage` and `labelToLocaleCode` have no production caller until
  phases 3-4; if those phases import the display map instead, the exonym contract
  silently regresses. The phase-4 tests (`'Dutch'`, not `'Nederlands'`) are the
  intended guard.
- `switcherStyle` is now accepted by the save schema but nothing emits it except
  `setSwitcherStyle` (no UI yet), so it cannot appear in stored rows before
  phase 2.

### Verification (actual output)

`npx tsc --noEmit`:

```
src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.
```

**Pre-existing / environmental, not caused by this phase.** `src/app/page.tsx` is
untouched and `src/assets/images/founder.jpg` exists on disk; the error is the
absence of `next-env.d.ts` in this worktree (never `next dev`/`next build`ed
here), which is what pulls in `next/image-types/global` (the `*.jpg` module
declarations). It is the only tsc diagnostic in the entire tree; zero errors in
any file this phase touched.

`npm run test:run`:

```
 Test Files  290 passed | 1 skipped (291)
      Tests  4665 passed | 15 skipped (4680)
   Duration  79.28s
```

---

## Phase 2 — Languages panel in Site Settings + retire the globe

Branch verified before any edit: `git branch --show-current` → `feature/language-settings`
(worktree `C:\Users\susha\lessgo-ai\.claude\worktrees\language-settings`). No git
state-changing commands run.

### Files changed

- `src/app/edit/[token]/components/ui/LanguagesPanel.tsx` (new)
- `src/app/edit/[token]/components/ui/languagesPanel.test.tsx` (new)
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx`
- `src/app/edit/[token]/components/layout/EditHeader.tsx`
- `src/app/edit/[token]/components/editor/LocaleSettings.tsx` (**deleted**)
- `src/app/edit/[token]/components/editor/localeControls.visibility.test.tsx` (rewritten)
- `src/components/ui/coming.tsx` (doc comment only)
- `src/components/DebugPanel.tsx` (comment only — see Deviations 1)
- `docs/task/language-settings.audit.md` (this file)

Nothing else. In particular `src/hooks/editStore/i18nActions.ts` is UNTOUCHED (not in
Files-touched — see Deviations 2), as are `LanguageToggle.tsx`, the six audited reader
files and everything under `src/lib/i18n/`.

### Per file

**`LanguagesPanel.tsx` (new)** — the designer's Languages pane, client component, no
props, mounted by `SeoSettingsModal`. Self-contained (own `Languages` heading + sub), so
it mounts standalone in tests.

- **NO `isMultiLocale` gate** — the headline acceptance. A `localeConfig === null` project
  renders a default-locale card derived from `localeConfig?.defaultLocale || activeLocale
  || 'en'` (deliberately the SAME expression `addLocale` uses to seed, so the card we draw
  is the locale that actually becomes the default) plus `+ Add language`.
- Store writes go **only** through the phase-1 actions via
  `useEditStoreApi().getState().addLocale / removeLocale / setSwitcherStyle`. Zero
  `api.setState` recipes. Reads are selector-based (`useShallow`), so the ESLint
  bare-`useEditStore` ban is respected.
- Left column: eyebrow, one card per declared locale (26px mono code + `localeLabel`
  name). Default card = sunken bg + blue `Default` pill + greyed change-site-language
  affordance (`<Coming what="changing the site language">`, `swap_horiz` glyph) and **no
  overflow menu at all**. Non-default card = `{n} translated field(s)` subline +
  `more_horiz` → one-item menu → `confirmDialog` (destructive copy carried verbatim from
  the deleted `LocaleSettings`) → `removeLocale`. Dashed `+ Add language` opens a listbox
  of `SUPPORTED_LOCALES` minus declared minus default.
- Right column: greyed `Auto-translate` row (`<Coming what="auto-translate">`, Switch
  rendered but `disabled`/unchecked/`tabIndex=-1`), and a locally-built `Dropdown | None`
  segmented control (no segmented primitive exists in the repo) wired to
  `setSwitcherStyle`, disabled on single-locale projects with a why-tooltip.
- **Zero-diff**: the panel renders from state and calls no action on mount. Pinned by the
  test "renders nothing new to the store just by being looked at" (`localeConfig` null,
  `localeEngaged` false, `isDirty` false after mount).

**`SeoSettingsModal.tsx`** — (a) both stale "NO Languages row" ruling comments (file
header, rail comment) deleted and replaced with the reversal + the branch-ordering
rationale; (b) new `section: 'seo' | 'languages'` state, SEO row now
`active={section==='seo'} onClick`; (c) new Languages `NavItem` (icon `language`,
`activeBar`, mono count badge `localeConfig?.locales.length ?? 1` selected as a PRIMITIVE
inside the existing `useShallow` selector so the shallow compare stays stable); (d) Domain
row icon `language` → `public` (icon collision — the handoff's own Domain frame uses
`public`); (e) window header renders `Site settings · Languages` + the `language` glyph
when that section is active; (f) the `section === 'languages'` pane branch is placed
**before** the `!page` "No pages found" guard, so a page-less project can reach it.

**`EditHeader.tsx`** — `LocaleSettings` import + mount removed; the LANGUAGES CONTROLS
comment block and the `EditorDesignControls` doc comment rewritten to say the globe is
retired and *why* `LanguageToggle` stays (only `setActiveLocale` UI). `<LanguageToggle />`
itself untouched.

**`LocaleSettings.tsx`** — deleted. Its mutators already live in `i18nActions.ts`
(phase 1); its confirm copy lives in the panel. Zero remaining imports (grep clean; only
historical mentions in comments).

**`localeControls.visibility.test.tsx`** — rewritten. Kept: the `LanguageToggle`
multi-locale gate (3 cases) and the real-store click interaction. Replaced the
globe-renders cases with a **retirement lock** that mounts the REAL
`EditorDesignControls` at all three locale states and asserts no `button[title="Languages"]`,
no `[role="dialog"][aria-label="Languages"]`, no `aria-haspopup="dialog"` trigger and no
"Languages" text in the header cluster — so re-mounting *any* languages popover in the bar
fails, not merely re-adding the old import. Plus one positive case: the pill group must
still be there. The store is set to `audienceType: 'writer'` so `EditorDesignControls`
renders no theme popover and the file doesn't drag in that tree.

**`coming.tsx`** — the never-grey list corrected: `Domain` removed from it (it IS greyed,
in this very modal), and a note that `Languages` is wired while two controls INSIDE the
panel are greyed. Doc comment only, no behavior.

**`DebugPanel.tsx`** — the mention-only comment now says `LanguageToggle` alone, with a
pointer to where declaring languages moved.

### Tests (all mutation-verified — this repo has an inert-assertion history)

`languagesPanel.test.tsx`, 15 cases, real `createEditStore`, `confirmDialog` mocked:
ungated add from a null-config project (+ non-English variant), zero-diff-on-mount,
default non-removable (no menu on the default card; exactly one removable card; default
absent from the add list), ruling-10 round trips (en ⇒ null, nl ⇒ declaration survives),
declined confirm is a no-op, honest subline (3 → `3 translated fields`, cleared → `0
translated fields`, and `Auto-translated` appears NOWHERE), Auto-translate greyed +
`aria-disabled` + `app-coming` + switch `data-state="unchecked"` + `disabled` + clicking it
writes nothing, change-language affordance greyed, switcher disabled/no-write on
single-locale and writing on multi-locale, plus two `SeoSettingsModal` cases (reachable
with `pages = {}`; rail badge shows `2` and Domain no longer carries the `language` glyph).

Mutations run against the implementation, each reverted after:

| Mutation | Result |
|---|---|
| re-add `if (!isMultiLocale(localeConfig)) return null;` | **7 failed** |
| default card renders the overflow menu (`isDefault ?` → `false ?`) | **4 failed** |
| move the Languages pane branch AFTER the `!page` guard | **1 failed** (the reachability case) |
| drop `disabled` from the switcher buttons + the Auto-translate Switch | **2 failed** |

### Deviations

1. **`DebugPanel.tsx` path.** The plan's Files-touched says
   `src/app/edit/[token]/components/DebugPanel.tsx`; **that file does not exist**. The real
   file is `src/components/DebugPanel.tsx` (which is what the scout doc says, and what the
   plan's own step 6 prose says). Comment-only edit; treated as an in-scope pointer error
   rather than an out-of-scope file. **Plan pointer correction.**
2. **The `if (code === cfg.defaultLocale) return;` guard did NOT land in
   `i18nActions.ts`** — that file is not in phase 2's Files-touched, so per the scope rule
   it was left alone. The invariant is enforced in the UI instead, twice: the default card
   renders **no** overflow menu (so there is no path to `onRemove` for it), and `onRemove`
   itself early-returns when `code === defaultLocale` as defence in depth. Both are
   test-pinned. **The self-enforcing store-level guard is still owed** — recommend folding
   it into a later phase that already owns `i18nActions.ts`, or a one-line follow-up.
3. **Auto-translate ships greyed and OFF**, where the designer's mock draws it live and ON
   (spec decision 5 / the greyed-placeholder rule). Founder gate item.
4. **Subline is `{n} translated fields`**, not the mock's `Auto-translated · 3 edits` —
   we do not auto-translate, and the count is of fields the author actually authored in
   the overlay. Founder gate item.
5. **Domain rail icon `language` → `public`.** The handoff wants `language` on the
   Languages row; the handoff's own Domain frame draws `public`. Founder gate item.
6. **The switcher control's single-locale tooltip uses `AppTooltip`, not `<Coming>`.**
   The plan said "disabled with a why-tooltip"; `<Coming>` would read "Coming soon — …",
   which would be a lie (the control is built, it just has nothing to apply to until a
   second language exists). Copy: "Add a second language — a switcher only appears on
   sites with more than one." The two genuinely-unbuilt controls (Auto-translate,
   change-site-language) DO use `<Coming>`.
7. **Remove sits behind a one-item overflow menu**, matching the mock's `more_horiz`,
   rather than the icon firing the destructive action directly. Trigger carries
   `aria-label="Language options for {name}"` / `aria-haspopup="menu"`.
8. **Window header title/icon change with the section** (`Site settings · Languages` +
   `language` glyph). The handoff draws the per-frame title; the plan only mentioned the
   text. Minor addition, no layout change.

### Plan pointers verified against the tree

- `SeoSettingsModal.tsx:16-17` stale ruling / `:383-385` rail comment / `:399`
  `AppIcon name="language"` / `:420` `!page` guard — **all correct**.
- `EditHeader.tsx:45` import, `:88` mount, `:87` `<LanguageToggle />`, `:20-24,:49-50`
  comments — **all correct**.
- `coming.tsx:26-29` never-grey list including "Languages" — **correct**.
- `localeControls.visibility.test.tsx:40,97,109,120` LocaleSettings mounts — **correct**.
- Handoff `§LANGUAGES L691-719` — **correct**; it also settles the icon question (its
  Domain frame header uses `public`).
- `DebugPanel.tsx` path — **wrong** (see Deviations 1).

### Deliberately not done

- No new editing indicator and no per-language Edit button (ruling 9) — `LanguageToggle`
  remains the only `setActiveLocale` UI.
- No `switcherStyle` consumption anywhere (publish layer, phase 5). The control writes the
  field; nothing reads it yet.
- No change to `EditHeaderRightPanel`'s regen locale-lock, and no `isMultiLocale` change.
- No z-index/focus-trap workaround for the nested `confirmDialog` — `DialogHost` portals to
  `document.body` at the edit-page root and should stack above the settings Dialog, but
  **this is a manual-QA item**, not something jsdom proves (the test mocks `confirmDialog`).

### Open risks

- **Store-level default-removal guard still absent** (Deviation 2). Today unreachable; a
  future caller of `removeLocale(defaultLocale)` would wipe a non-English declaration.
- Nested-dialog stacking (`confirmDialog` inside the settings `Dialog`) is unverified in a
  browser — first item for the phase-2 manual gate.
- `translatedFieldCount` counts overlay KEYS, so an overlay entry equal to the base string
  still counts as "translated". Acceptable for a subline; noted so nobody treats it as a
  translation-coverage metric.

### Verification (actual output)

`npx tsc --noEmit`:

```
src/app/page.tsx(6,26): error TS2307: Cannot find module '@/assets/images/founder.jpg' or its corresponding type declarations.
```

The known environmental diagnostic (no `next-env.d.ts` in this worktree — Next has never
run here). Unchanged from phase 1; zero errors in any file this phase touched.

`npm run test:run`:

```
 Test Files  291 passed | 1 skipped (292)
      Tests  4684 passed | 15 skipped (4699)
   Duration  82.93s
```

(Phase 1 baseline was 290/4665; +1 file and +19 net tests — the new panel suite (15) plus
the rewritten visibility suite going 4 → 8 cases.)

---

# Phase 2b — Languages entry in the header "Site settings" popover

Founder addition made at the phase-2 human gate ("in the settings (in header) dropdown
there should be a Languages option as well").

## Files changed

- `src/app/edit/[token]/components/layout/GlobalAppHeader.tsx`
- `src/app/edit/[token]/components/ui/GlobalModals.tsx`
- `src/app/edit/[token]/components/ui/SeoSettingsModal.tsx`
- `src/app/edit/[token]/components/layout/GlobalAppHeader.menus.test.tsx`
- `src/app/edit/[token]/components/ui/languagesPanel.test.tsx`

## Approach — how the section is threaded, and why

Chosen: **an optional argument on the existing `showSeoModal()`**, not a sibling
`showLanguagesModal()`.

Rationale: there is exactly ONE window (the site-settings window); a second `show*`
export would imply a second modal and would need its own `modalState` slot / hide
function to stay coherent, duplicating state for what is a *starting pane*. The
GlobalModals file's own idiom is one state slot per modal, so the pane belongs
inside `seoModal`'s slot. `showSeoModal(options?: { section?: SettingsSection })`
defaults to `'seo'`, so the single pre-existing no-arg caller (the header's SEO row)
is byte-identical in behavior.

Chain: header row → `showSeoModal({ section: 'languages' })` → `modalState.seoModal =
{ isOpen: true, section }` → `<SeoSettingsModal initialSection={…}>` → seeds the
phase-2 `section` useState. The modal unmounts on close (`{isOpen && <…/>}`), so the
initializer re-runs on every open — no stale-pane risk. `hideSeoModal()` also resets
the slot to `'seo'` for belt-and-braces.

## Per file

**`GlobalAppHeader.tsx`** — one new `AppPopoverItem` ("Languages", `AppIcon
name="language"`, `size={18}`), placed after `Social & sharing` so the popover order
matches the modal rail order (Domain / SEO / Social / Languages). Closes the menu
first (`setShowSettingsMenu(false)`), same as every other wired row. The `language`
glyph was freed by phase 2 (Domain moved to `public`), so no rail/menu glyph collision.

**`GlobalModals.tsx`** — `seoModal` slot gains `section: SettingsSection` (type
imported from the modal); `showSeoModal` takes the optional options object;
`hideSeoModal` resets it; the render passes `initialSection`.

**`SeoSettingsModal.tsx`** — exports `type SettingsSection = 'seo' | 'languages'`
(the union already existed inline); accepts `initialSection?: SettingsSection = 'seo'`
and seeds the existing `section` state from it. **No other change** — the rail's
`setSection` handlers are untouched, so the initial section is a starting point, not a
lock (explicitly asserted in the tests).

**`GlobalAppHeader.menus.test.tsx`** — new case: `Settings → Languages` calls
`showSeoModal` exactly once **with `{ section: 'languages' }`**, does not call
`showSocialModal`, and closes the menu. The existing SEO case now also asserts
`showSeoModal.mock.calls[0]` is `[]` (SEO stays a no-arg call).

**`languagesPanel.test.tsx`** — new `describe` running the REAL chain from
`showSeoModal` down: mounts `<GlobalModals />` (ProductsModal /
GlobalButtonConfigModal / SocialProfilesPanel mocked to null; real store as in the
rest of the file) and asserts (a) `{section:'languages'}` renders `Site settings ·
Languages` + the panel copy and **not** the SEO pane's `No pages found.`, (b) the rail
still switches both ways afterwards, (c) no-arg still opens on SEO and Languages is
one click away.

## Mutation checks (the tests can fail)

- `useState<SettingsSection>(initialSection)` → `('seo')`:
  `languagesPanel.test.tsx:450` red — received body text shows the SEO pane
  (`…languageLanguages1No pages found.`). 1 failed / 17 passed.
- header `showSeoModal({ section: 'languages' })` → `showSeoModal()`:
  `GlobalAppHeader.menus.test.tsx` red on the `toHaveBeenCalledWith` assertion.
  1 failed / 7 passed.
Both mutations reverted afterwards (verified by grep).

## Deviations from the brief

None. (The brief left the threading shape to the implementer; the choice and its
reasoning are above.)

## Verification

`npx tsc --noEmit` — clean, **zero output** (the brief's expected environmental
`src/app/page.tsx` TS2307 `.jpg` error did not appear in this worktree run):

```
$ npx tsc --noEmit
(no output)
```

`npm run test:run`:

```
 RUN  v4.1.8 C:/Users/susha/lessgo-ai/.claude/worktrees/language-settings

 Test Files  291 passed | 1 skipped (292)
      Tests  4688 passed | 15 skipped (4703)
   Start at  16:15:53
   Duration  78.89s
```

(Phase 2 baseline was 291 files / 4684 tests passing; now 4688 = +4 new cases — header
suite +1, panel suite +3. No file count change.)

## Open risks / notes for later phases

- `SettingsSection` now lives in `SeoSettingsModal.tsx` and is imported by
  `GlobalModals.tsx`. If a later phase adds a rail pane (e.g. the t16 Domain pane),
  extend that union in one place and both the modal state and the header keep working.
- Zero-diff holds: opening either pane still writes nothing to the store (pinned by
  the phase-2 zero-diff case, unchanged).
- No visual/CSS change to the modal or the popover beyond the one added row.

---

# Phase 3 — onboarding site-language capture (+ language on the generation payloads)

Branch verified before any edit: `git branch --show-current` → `feature/language-settings`
(worktree `C:\Users\susha\lessgo-ai\.claude\worktrees\language-settings`). No git
state-changing command run.

## Files changed

- `src/hooks/useWizardStore.ts`
- `src/components/onboarding/wizard/IdentitySlot.tsx`
- `src/components/onboarding/wizard/identityLanguage.test.tsx` (new)
- `src/modules/wizard/generation/finalize.ts`
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/trust.ts`
- `src/modules/wizard/generation/payloadLanguage.test.ts` (new)
- `src/modules/wizard/generation/work.ts`
- `src/modules/wizard/generation/work.llm.ts`
- `src/modules/wizard/generation/workLocale.test.ts` (new)
- `docs/task/language-settings.audit.md` (this file)

`src/components/onboarding/wizard/GeneratingSlot.tsx` was on the Files-touched list but
needed NO edit — see "Plan pointers checked against the tree". Nothing outside the list was
edited; in particular **zero diffs** under `journey/engines/`, `inputContracts.ts`,
`modules/wizard/work/rail.ts`, and no new `wizardSlots` member (ruling 8 /
uniform-journey collision avoidance). Pre-existing dirty files NOT touched by me:
`docs/task/language-settings.plan.md` (orchestrator's 2b sha fill) and
`src/modules/generatedLanding/__snapshots__/uiFoundationIsolation.test.tsx.snap`.

## A1 acceptance — the enumerated call-site coverage

**Every audience-route request body built in `thing.ts`/`trust.ts` now carries `language`.
Zero exceptions.** Line numbers below are post-change; A1's pre-change numbers were verified
against the tree first and had NOT shifted.

| # | Engine | Route | Body built at | How `language` lands | Test that fails if dropped |
|---|---|---|---|---|---|
| 1 | thing | product/strategy | `buildStrategyPayload` (thing.ts:245), fetched :415 | `payloadLanguage(input)` | `#1 strategy body carries the picked ISO code` |
| 2 | thing | product/generate-copy (single page) | `buildCopyPayload` (thing.ts:285), fetched :739 | `payloadLanguage(input)` | `#2 single-page copy body …` |
| 3 | thing | product/generate-copy (**multi-page fan-out**) | **INLINE** thing.ts:545 (fetch :522) | `payloadLanguage(input)` | `#3 MULTI-PAGE FAN-OUT …` |
| 4 | thing | product/generate-copy (**collection item**) | **INLINE** thing.ts:633 (fetch :618) | `payloadLanguage(input)` | `#4 COLLECTION-ITEM FAN-OUT …` |
| 5 | trust | service/strategy | `buildStrategyPayload` (trust.ts:261), fetched :347 | `payloadLanguage(input)` | `#5 strategy body …` |
| 6 | trust | service/generate-copy | `buildCopyPayload` (trust.ts:295), fetched :419 | `payloadLanguage(input)` | `#6 copy body …` |
| 7 | trust | service/generate-copy (**collection item**) | **INLINE** trust.ts:499 (fetch :485) | `payloadLanguage(input)` | `#7 COLLECTION-ITEM FAN-OUT …` |

Per A1's preference each file has ONE exported local resolver — `payloadLanguage(input)` in
`thing.ts` and in `trust.ts` — called from every site, so a future fan-out path that copies
a neighbouring body inherits it.

Two belt-and-braces sweeps also exist ("every product/service request body of a full run
carries language"): they iterate every captured `/api/audience/{product,service}/` call, so
a NEW call site added later without the field fails them too.

**The work routes (`/api/audience/work/{strategy,generate-copy}`) deliberately carry NO
`language` field** — the work prompt path consumes the `languages` LABEL server-side from
`brief.facts.work` (unchanged; ruling 5 / plan step 4: work is persistence-only here).

**Save-site coverage (no save path can drop the declaration):**

| Engine | Save site | File:line |
|---|---|---|
| thing | `saveFC` (skeleton + per-page + multipage final) | thing.ts:482 |
| thing | techpremium deterministic path | thing.ts:714 |
| thing | single-page final save | thing.ts:810 |
| trust | final save | trust.ts:467 |
| trust | collections `persist` | trust.ts:481 |
| work | granth generator save | work.ts:174 |
| work | granth collections `persist` | work.ts:195 |
| work | multipage SKELETON save | work.ts:293 |
| work | `saveFC` (every LLM fan-out save) | work.llm.ts:271 |

## Per file

**`src/hooks/useWizardStore.ts`** — adds `siteLanguage: string` (default `'en'`) and
`siteLanguagePersisted: boolean` to `WizardState`; `setSiteLanguage` + `persistSiteLanguage`
to `WizardActions`; both fields to `initialState` and to the explicit `reset()` assign list.
`buildThingInput` / `buildTrustInput` forward `siteLanguage: s.siteLanguage`.
`persistSiteLanguage` posts to the existing `/api/saveDraft` channel:
`nl` ⇒ `{tokenId, stepIndex, localeConfig:{locales:['nl'],defaultLocale:'nl'}}`;
revert to `en` after a prior non-en save ⇒ `localeConfig: null` (explicit clear);
untouched English ⇒ **no call at all**. Best-effort like `save()`; on a non-2xx it leaves
`siteLanguagePersisted` false so the next pick retries.

**`IdentitySlot.tsx`** — a `div.space-y-5` wrapping the UNCHANGED
`<SlotBody slot="identity" …/>` plus a local `SiteLanguageField`: a labelled `<select>` over
`SUPPORTED_LOCALES` rendered with `localeLabel`, defaulted to `en`, helper text "Your page
copy will be written in this language.", `onChange` ⇒ `setSiteLanguage` +
`void persistSiteLanguage()`. No contract / slot-vocabulary change.

**`finalize.ts`** — two new pure exports beside `saveDraft`:
`localeConfigPatch(siteLanguage?)` (`{}` for en / absent / **unsupported**; the single-locale
config otherwise) and `workLocaleConfigPatch(languages?)` (label → `labelToLocaleCode` →
`localeConfigPatch`; `{}` + ONE `console.warn` for an unmapped label such as `'Hindi'`).

**`thing.ts` / `trust.ts`** — optional `siteLanguage?: string` on the input interfaces, the
exported `payloadLanguage()` resolver, `language` on all 7 bodies (table above), and
`...localeConfigPatch(input.siteLanguage)` on all 5 save bodies.

**`work.ts`** — imports `getWorkFacts` + `workLocaleConfigPatch`; one file-local
`workLocalePatch(input)` resolved ONCE per run in each entry point (so an unmapped label
warns at most once), spread into all 3 save bodies.

**`work.llm.ts`** — the same derivation, spread into `saveFC` (the single funnel for every
save in that adapter). See Deviations #1 for why it is inlined rather than imported.

## Deviations from the plan

1. **`work.llm.ts` does NOT import `workLocaleConfigPatch` from `./finalize`** — it inlines
   the same 4-line derivation (label → `labelToLocaleCode` → config) using
   `@/lib/i18n/localeNames`. Reason: the pre-existing `work.llm.test.ts` FACTORY-mocks
   `'./finalize'` with `saveDraft` only, so ANY new export consumed by `work.llm.ts` throws
   `No "workLocaleConfigPatch" export is defined on the "./finalize" mock` — and that test
   file is **outside this phase's Files-touched list**, so I did not edit it (10 failures
   observed on the first full run; this was the fix). Importing from `./work` instead would
   have created a real runtime import cycle (`work.ts` re-exports `work.llm.ts`). Drift risk
   is mitigated by `workLocale.test.ts`, which asserts the canonical helper AND both
   adapters' save bodies with identical expectations (sites 1-3 exercise `finalize`'s copy,
   site 4 the inlined one). A future consolidation should switch `work.llm.test.ts`'s mock
   to `importOriginal` and re-point the import.
2. **`persistSiteLanguage` sends `stepIndex`** (the current slot index, exactly like the
   store's own `save()`) rather than a bare `{tokenId, localeConfig}` body — see the
   stepIndex finding below. The exact-body assertion in `identityLanguage.test.tsx` pins the
   shape, and a dedicated case proves the value is the CURRENT slot, not a hardcoded 0.
3. **`localeConfigPatch` drops UNSUPPORTED codes** (persists nothing for `'hi'`/`'xx'`) while
   the request payload still carries whatever was picked. Conservative: the picker cannot
   produce an unsupported code, `SUPPORTED_LOCALES` is the closed vocabulary every reader
   validates against, and phase 4 validates the payload value server-side with an `en`
   fallback. Pinned by a case in both `payloadLanguage` and `workLocale`.
4. **A new state field `siteLanguagePersisted`** (not named in the plan) exists solely to make
   the zero-diff rule expressible ("English never saved ⇒ no call" vs "revert ⇒ explicit
   null"). Session state; reset by `reset()`; never sent to the server.
5. **`GeneratingSlot.tsx` untouched** — see the next section.

## Plan pointers checked against the tree

- OK — A1's three inline bodies + four builder sites were exactly where A1 said
  (`thing.ts:493`, `thing.ts:584`, `trust.ts:464` pre-change).
- OK — work save sites `work.ts:150/:170/:267` + `work.llm.ts:234` confirmed; all four now
  spread the patch (`work.llm.ts:234` is `saveFC`, the funnel for every save there).
- WRONG — **`GeneratingSlot.tsx buildInput() (:72)` is not where `siteLanguage` belongs.**
  That function only dispatches to `buildThingInput`/`buildTrustInput`/`buildWorkInput`,
  which live in `useWizardStore.ts` (scale-07 phase 5 consolidated them so the pre-gate
  strategy fetch and generation share ONE projection). Threading the field in the slot would
  have MISSED the store's own `fetchStrategy` path — the pre-gate, CHARGED strategy call.
  The field is set in the two store projections instead; the slot needed no edit.
- CLARIFIED — the plan's "**five** final-save bodies (`thing.ts :445/:667/:761`,
  `trust.ts :436/:457`)" is right in count/location, but `:445` sits inside `saveFC`, which
  covers the `:557/:628/:803` callers. Recorded so a reviewer's grep expects 5, not 8.
- RESPECTED — phase 1's carry note that `labelToLocaleCode` takes LABELS only and returns
  `null` for a bare code: work only ever feeds it `facts.work.languages[0]` (a label), and
  the null branch is test-pinned (`'Hindi'` ⇒ no write + warn).

## The `stepIndex` finding (plan step 1 / round-2 note 7)

`api/saveDraft/route.ts:80` defaults `stepIndex = 0` and `:159-165` REWRITES
`content.onboarding.stepIndex` on **every** call. Repo-wide readers of the persisted value:
`api/loadDraft/route.ts:143` → `components/dashboard/continueRouting.ts:56-60` (the dashboard
"Continue" router) — and nothing else. **Nothing resumes off it mid-wizard** (the wizard
rehydrates from `brief`/`briefFacts`; the journey shell resumes off `journeyStep`). So a bare
body would not break resume, but it WOULD silently rewind the progress the store's own
`save()` maintains, which the dashboard reads. Conservative choice: `persistSiteLanguage`
sends `Math.max(0, slots.indexOf(currentSlot))` — byte-identical to `save()`'s body shape.

## Anti-inert-test check (mutation-verified, not assumed)

The A1 defect is exactly "a test that passes while the fan-out paths ship dead", so the new
assertions were mutated:

- deleted `language: payloadLanguage(input)` from BOTH inline collection-item bodies
  (`thing.ts`, `trust.ts`) ⇒ **4 failures** (`#3`, `#4`, `#7`, plus the trust every-body
  sweep). Reverted; suite green again.
- deleted `...localePatch` from `work.ts`'s collections-persist + skeleton saves and from
  `work.llm.ts`'s `saveFC` ⇒ **3 failures** (work save sites 1+2, 3, 4). Reverted; green.

Zero-diff cases assert **key absence** (`not.toHaveProperty('localeConfig')`) and **call
absence** (`saveCalls()).toHaveLength(0)`), never mere falsiness.

## Test results (verbatim)

`npx tsc --noEmit` — exit 0, no diagnostics:

```
TSC_CLEAN
```

`npm run test:run`:

```
 Test Files  294 passed | 1 skipped (295)
      Tests  4730 passed | 15 skipped (4745)
   Start at  16:37:20
   Duration  75.79s (transform 42.75s, setup 0ms, import 326.02s, tests 74.34s, environment 554.63s)
```

Phase-2b baseline was 291 files / 4688 tests. +3 files, +42 tests = exactly the three new
suites (`payloadLanguage` 19, `identityLanguage` 9, `workLocale` 14). No pre-existing test
was modified.

## Open risks / what phase 4 must know

- **The seam is live on the client and UNVALIDATED server-side.** All 7 thing/trust
  audience-route bodies now carry `language` as a bare ISO code (`'nl'`), ALWAYS present,
  defaulting to `'en'`. Phase 4 owns: the optional `language` string on the four route
  request schemas, `resolvePromptLanguage` (validate against `SUPPORTED_LOCALES`, lenient
  `'en'` fallback, `toPromptLanguage` → English exonym), and threading it into the builders.
  **Until phase 4 lands the field is inert** — the routes' zod schemas strip unknown keys,
  so nothing breaks and nothing changes today.
- Phase 4 must tolerate an **unsupported/garbage** `language` (the client is deliberately
  lenient and forwards whatever was picked): never a 400, always the `en` fallback, and the
  raw string must never reach a prompt.
- `payloadLanguage()` is exported from both `thing.ts` and `trust.ts` — any new
  product/service route call added later must call it.
- Regen's source is unchanged (`content.localeConfig.defaultLocale`); this phase is what
  makes that value EXIST for new projects. First-gen and regen derive from the same wizard
  pick, so they agree by construction (ruling 11).
- Work regen (ruling 4) now has a `localeConfig` to prefer over `facts.languages[0]` for
  Dutch work projects; for an unmapped label (`'Hindi'`) there is still no config, so the
  `facts.languages[0]` fallback stays load-bearing — do not delete it in phase 4.
- Manual QA still owed (not provable in jsdom): a real thing run with `nl` picked → the
  editor loads with `localeConfig.defaultLocale === 'nl'` and NO pills/switcher (single-locale
  is correct); an English run leaves `content` with no `localeConfig` key; the network tab
  shows `language: 'nl'` on the strategy + copy request bodies.

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

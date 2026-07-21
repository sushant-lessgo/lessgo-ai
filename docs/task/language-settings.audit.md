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

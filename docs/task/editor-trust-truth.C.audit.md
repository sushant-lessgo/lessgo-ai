# Task C audit — remove dead "Regenerate Content" advanced action

## Files changed
- `src/app/edit/[token]/components/toolbars/SectionToolbar.tsx`

## What was removed
Decision: remove (not wire) the dead section-level "Regenerate Content" action —
element-level regen works, page-level "Regen Copy" is in the top bar, section-level
regen returns with the editor shell rebuild.

Removed from `SectionToolbar.tsx` (line refs = original file):
1. `AdvancedActionsMenu` import (orig line 7). Component file kept.
2. `showAdvanced` state + `advancedRef` + `advancedTriggerRef` (orig 40, 43-44).
3. Debug-only `instanceId = Math.random()` ref + the two mount/unmount + showAdvanced
   logging `useEffect`s (orig 46-60) — hygiene item 2, zero-risk.
4. `regenLocaleLocked` const + its comment (orig 75-78) — only fed the dead action.
5. Click-outside effect that closed the advanced menu (orig 171-187).
6. `advancedActions` array — the menu's only item, handler was
   `logger.warn('...not yet implemented')` (orig 282-296).
7. The ⋯ trigger `<button>` + preceding divider (orig 408-429).
8. The `<AdvancedActionsMenu>` render block (orig 434-444).

## Untouched / deviations
- Store destructure still lists `activeLocale` + `localeConfig` (now unused since
  `regenLocaleLocked` removed). Left in place deliberately — editing the selector is
  phase 3 scope; `noUnusedLocals` is off so tsc stays clean. Logged as deviation.
- `ActionIcon` map keeps its now-unused `refresh` entry (same as pre-existing unused
  `palette` entry) — harmless lookup value, out of scope to prune.
- Primary actions (Layout, Elements, Move Up/Down, Duplicate, Delete), their filters,
  regeneration loading/completion UI, and ElementToggleModal — unchanged (JSX verified).
- `AdvancedActionsMenu` component file NOT deleted (per instructions).

## Tests
- `npx tsc --noEmit` — clean (no output).
- No build / full suite run (orchestrator gates centrally).

## Open risks
- None. Menu was empty except the dead item; removing the ⋯ trigger removes an
  affordance that did nothing. Other section toolbars/blocks do not import the removed
  symbols from this file.

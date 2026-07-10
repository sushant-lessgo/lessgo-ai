# QA quick-fixes — wizard findings (F20, F21, F14, F11)

Branch: `fix/qa-quick-fixes`. Scope: 4 wizard findings from `reports/scale-1-10-findings.md`.

## Files changed

- `src/components/onboarding/shared/GoalParamFields.tsx`
- `src/hooks/useWizardStore.ts`
- `src/components/onboarding/wizard/GoalSlot.tsx`
- `src/components/onboarding/wizard/WizardShell.tsx`
- `src/modules/businessTypes/config.ts`

## Per-file changes

### `GoalParamFields.tsx` (F14)
- Added `intentParamRequired(intent)` — true only when the intent's param is load-bearing for the primary CTA (download-app store links; M2/M3/M4-primary). `rsvp` and M1-primary optional-destination intents (e.g. request-demo → Calendly) return false.
- Extended `intentParamSatisfied` beyond download-app to check the actual value for M2 (phone|email), M3 (url), M4 (links[0]). Previously returned `true` for everything except download-app.

### `useWizardStore.ts` (F14)
- Added `goalParamSkipped: boolean` state (init `false`), `setGoalParamSkipped` action, reset in `reset()`.
- `setGoalIntent` now clears `goalParamSkipped` when the intent changes (a new goal re-arms the gate).

### `GoalSlot.tsx` (F20, F14)
- F20: `showAll` now also starts open when `likelyIntents.length === 0`, so the pre-selected default card is always visible instead of hiding behind the "Other goals…" link (the "silent default" case). The default intent was already written to the store on mount and shown selected via `selectedIntent` for non-empty likelyIntents; this closes the empty-likelyIntents hole.
- F14: when the selected intent's param is required + still empty + not skipped, renders a "Skip for now" button that sets `goalParamSkipped`.

### `WizardShell.tsx` (F14, F21)
- Added a per-slot `gateBlocked` computation driving `disabled={isLast || gateBlocked}` on Continue and an early-return in `handleNext`.
  - Goal slot: blocked while a required goal param is empty and not skipped.
  - Copy-fact slots: blocked while any `STRATEGY_REQUIRED_FIELD_IDS` field on the current slot is empty (mirrors the strategy API's `min(1)` guards: name, oneLiner, offer, capabilities/services, audience/whoProblem).

### `businessTypes/config.ts` (F11)
- Added a per-type `offer` entry to `wizardFields` for manufacturer, agency, consultant, coach, writer, photographer (resolved by `resolveFieldCopy` via the contract field id `offer`). saas + app deliberately keep the shared default ("Start a free 14-day trial").

## Deviations / judgment calls

- **F21 field set.** The API mirror uses an explicit allowlist (`STRATEGY_REQUIRED_FIELD_IDS`) rather than the contract's `requirement: 'required'` flag. This intentionally does NOT gate `differentiator`/`process`/`bioStory` (contract-required but not API-`min(1)`) nor `theWork` uploads, so the gate can never trap a user on a field the strategy call doesn't reject. `oneLiner` is gated on non-empty (not the API's `min(10)`) — the reachable dead-end is emptiness; enforcing exact length was out of the minimal-fix scope.
- **F21 bonus (name the failing field on 400).** Skipped. The task marked it optional; the gate prevents the dead-end, and wiring field-level 400 detail into the strategy error UI would touch out-of-scope files (StructureSlot/GeneratingSlot/error surface).
- **F20.** The store already pre-selected the default intent on mount for non-empty `likelyIntents`; the only remaining silent case was empty `likelyIntents`, now fixed by auto-expanding the list. No Continue-gating added for goal selection (a default is always selected), per the task's "prefer visible pre-selection."
- **F14 skip semantics.** "Skip for now" persists until the intent changes; editing the param after skipping does not re-arm the gate (skip already unblocked it). Conservative and matches the scale-05 audit intent.

## Tests

- `npx tsc --noEmit` — clean.
- `npx vitest run src/hooks/useWizardStore.test.ts src/modules/businessTypes/config.test.ts src/modules/businessTypes/pipelineGuards.test.ts` — 3 files, 72 passed.
- Did not run the full suite (parallel agents on disjoint files, per instructions).

## Open risks

- No component-level test exists for `WizardShell`/`GoalSlot` gating; correctness of `gateBlocked` and the "Skip for now" flow is covered by tsc + manual reasoning only. A jsdom render test for the goal/offer gate would be a worthwhile follow-up.
- F14 gate relies on `goalIntentMeta[intent].mechanisms[0]` being the true primary mechanism; if that ordering is ever wrong for an intent, the required/optional classification would follow it.

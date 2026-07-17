# work-onboarding-questions — audit

## Phase 1 — pure gating resolver + rail write paths

**Files changed**
- `src/modules/wizard/work/questionGating.ts` (NEW)
- `src/modules/wizard/work/questionGating.test.ts` (NEW)
- `src/modules/wizard/work/rail.ts` (extended `RailEdit` union + `applyRailEdit` switch)
- `src/modules/wizard/work/rail.test.ts` (new E3 edit round-trip cases)

### What was built
- `questionGating.ts` — PURE, firewall-safe module exporting `SlotPosture`, `QuestionPlanItem`,
  `QuestionPlanInput`, `buildQuestionPlan(...)`, and `resolveQuestionProfession(...)`. `buildQuestionPlan`
  is a deterministic zero-AI resolver that reads the frozen `WorkFacts` bag + `facts.entry` signals +
  `sessionAnswered` and emits the ordered STEP 03 question list. It wires the previously-dormant
  `workSlots[].mechanics`/`neverSilent`/`branch` intent via explicit per-slot rules: identity/groups ask
  only when absent; price required with D-C answered-detection (`suggested:['on-request']` once groups
  exist); languages required (`suggested:['English']`); establishment ask; dreamClient confirm-from-
  `entry.audiences` else open ask; praise confirm-ONLY when `entry.testimonials` exist else silent (D-F);
  contactMethod neverSilent confirm with the in-person/hybrid→whatsapp else form default. Items come out
  in `workSlotIds` order, capped at 5 by priority rank (D-F). `resolveQuestionProfession` thin-wraps
  `resolveWorkProfession`.
- `rail.ts` — extended the `RailEdit` union with `establishment`/`dreamClient`/`praise`/`contactMethod`
  (all already `WorkFactsSchema` keys, zero reshape) and added switch cases. `dreamClient` trims and
  rejects empty; `praise` empty array ⇒ unset; establishment/contactMethod are enum-constrained by the
  union type with `WorkFactsSchema` as the final gate. All route through the single `applyRailEdit`→
  `workFactsToBriefPatch` validation door, preserving `facts.entry`/`collections` siblings and group
  `photos`/`items`.

### Firewall verification
Verified `voice.ts`, `workVocabulary.ts`, `workSlots.ts` are import-pure (type-only imports, no
react/stores/templates) BEFORE wiring, so `resolveQuestionProfession` re-exports `resolveWorkProfession`
directly rather than inlining the 4-key map. Documented in the module header.

### Deviations from the plan
- None material. The four new `RailEdit` fields (establishment/dreamClient/praise/contactMethod) write
  independently of `identity` (unlike descriptor/location/reach), which is correct — they are top-level
  `WorkFacts` keys with no name dependency; a dedicated test pins this. Conservative in-scope choices
  (praise empty ⇒ unset like languages; dreamClient empty ⇒ `{ok:false}`) follow existing rail patterns.

### Test / tsc results
- `npm run test:run`: **3848 passed | 18 skipped** (226 files). Green.
- New tests: `questionGating.test.ts` + `rail.test.ts` new cases = 49 passing (asserts the exact 5-item
  Kundius set, postures/required/answered/suggestions, rich-facts fewer-questions, empty-facts cap-5,
  testimonials-present praise confirm, and the D-C price answered-detection rules).
- `npx tsc --noEmit`: my four files produce **zero** type errors. One PRE-EXISTING, out-of-scope error
  remains — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (an image-module
  type-declaration gap in an untouched file; reproduces independent of this phase). Not addressed — outside
  Files-touched.

### Open risks
- Phase 2/3 must respect that `buildQuestionPlan` emits ONLY renderable (`ask`/`confirm`) items; `known`/
  `skip` slots are filtered out (they still exist in the `SlotPosture` type for seam clarity).
- E2 reconciliation flag: `rail.ts` groups/`photos`/`items` preservation kept intact through the union
  extension; expect a merge touchpoint here with E2's groups/price paths.

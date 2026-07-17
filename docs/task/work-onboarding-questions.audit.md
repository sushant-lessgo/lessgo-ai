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

## Phase 2 — question contract + agnostic renderer + required gate

**Files changed**
- `src/components/onboarding/journey/engines/types.ts` — added `choice` kind to `JourneyQuestion`; common `required?`/`answered?` on every member; new `JourneyQuestionsContext`; `questions(vm, ctx)` signature.
- `src/components/onboarding/journey/engines/work.ts` — Phase-2 compile-keep only: `questions()` now takes the second `_ctx: JourneyQuestionsContext` param (unused, `// Phase 3` marker); added the type import. Placeholder question logic UNCHANGED.
- `src/components/onboarding/journey/steps/StepQuestions.tsx` — choice renderer (single/multi/allowCustom/suggested), answered-compact, ctx build, blocked reporting.
- `src/components/onboarding/journey/JourneyShell.tsx` — `onBlockedChange` on `JourneyStepProps`; `blocked` state; `journey-next` disabled on step 3 while blocked; reset on step change.
- `src/hooks/useWizardStore.ts` — added `selectBusinessTypeKey` selector.

**What changed, per file**

`types.ts` — Union extended from 3→4 kinds (D-A). `choice = { id; kind:'choice'; label; options:{value;label}[]; multi?; allowCustom?; suggested?; required?; answered?; commit(values:string[], liveFacts):RailCommit }`. `required?:true` + `answered?:boolean` added to text/group/price/choice. `JourneyQuestionsContext = { businessType:string|null; facts:Record<string,unknown>|undefined; sessionAnswered:readonly string[] }`. Seam `questions(vm)` → `questions(vm, ctx)`. Doc comment updated to record the deliberate E3 extension; union declared CLOSED at 4. Firewall preserved: still type-only imports (`Brief`, `WizardStore`), no react/store value edges.

`StepQuestions.tsx` — Selects `businessTypeKey`; holds `answeredIds` (session-answered, appended after each successful commit — feeds `ctx.sessionAnswered`) and `expandedIds` (which answered-compact rows are re-opened). Builds `ctx` and calls `seam.steps.questions(seam.rail.toVM(facts), ctx)`. Derives `blocked = questions.some(q => q.required && !q.answered)` and reports it via `useEffect` → `onBlockedChange`. New `ChoiceAnswer` renderer: single-select taps commit immediately; `multi` renders ALL options as toggle chips (suggested prominent) + Save; `suggested` options render prominent (border-app-primary/bg-app-tint) — never the only tappable ones (honors orchestrator ruling that multi renders Dutch+English); `allowCustom` → input + Add (single: adds = commits; multi: adds to selection). Answered questions render `AnsweredCompact` (value summary + Change), re-expand on tap. text/group/price renderers unchanged in behavior.

`JourneyShell.tsx` — Mirrors `onBuildingChange` exactly: `onBlockedChange?:(blocked:boolean)=>void` on `JourneyStepProps`; `const [blocked,setBlocked]=useState(false)`; `<Body … onBlockedChange={setBlocked} />`; `journey-next` `disabled={journeyStep===LAST_STEP || nextBlocked}` where `nextBlocked = journeyStep===3 && blocked`; `useEffect(()=>setBlocked(false),[journeyStep])` resets on step change.

`useWizardStore.ts` — `selectBusinessTypeKey = (s) => s.businessTypeKey` (returns `BusinessTypeKey | null`). No state added (field already present).

`journeyAgnostic.test.ts` — NOT modified. Its assertions are import-graph/firewall only (no question-shape assertions), and stayed green — the choice-kind addition added no banned import. No change was required.

**Renderer testids (phase-4 e2e targets):**
- `question-<id>` — the card wrapper
- `question-chip-<id>-<value>` — each choice option chip (single = tap-commit; multi = toggle)
- `question-save-<id>` — commit button (text/group/price Save; choice multi Save; choice single+allowCustom Add-is-commit uses `question-add-<id>` instead — see below)
- `question-change-<id>` — the answered-compact "Change" affordance (re-expands the row)
- `question-add-<id>` — the `allowCustom` free-text Add button (NEW; supplements the listed set — needed because multi needs both an Add and a Save; single+custom uses it as commit)
- (pre-existing, retained) `question-input-<id>`, `question-price-mode-<id>`, `question-price-amount-<id>`, `step-questions`, `questions-none`

**onBlockedChange threading:** identical pattern to `onBuildingChange` — optional prop on `JourneyStepProps`, `useState` in the shell, passed to `<Body>`, consumed to gate the agnostic Continue. Reset-on-step-change guarantees a block never outlives STEP 03.

**Store selector name:** `selectBusinessTypeKey`.

**Deviations:**
- Added a `question-add-<id>` testid (not in the plan's 4-testid list) for the `allowCustom` Add control. In-scope judgment call (StepQuestions): `multi` needs a distinct Save vs Add, so reusing `question-save-<id>` for both was impossible. Chose an additive, pattern-consistent testid; the plan's listed testids are all still present and unchanged. Logged here per the in-scope-ambiguity rule.
- `work.ts` second param named `_ctx` with an eslint-disable for no-unused-vars + a `// Phase 3` marker (as instructed — keeps tsc/lint green without implementing Phase 3 logic).
- Prominent-chip styling uses `app-primary`/`app-tint` (the defined app accent) rather than a non-existent `app-accent` key.

**Verification:**
- `npx tsc --noEmit` — clean except the pre-existing environmental `src/app/page.tsx` `founder.jpg` TS2307 (present on main; ignored per instructions). No new errors.
- `npm run test:run` — 225 files passed, 1 skipped; 3848 tests passed, 18 skipped. `journeyAgnostic.test.ts` green.
- `npm run lint` — warnings only (pre-existing img/hooks), no errors in touched files.

**Open risks:**
- The answered-compact "value summary" is best-effort (text→prefill, choice→suggested join; price/group show "Answered") — the `JourneyQuestion` descriptor carries no explicit answer-value field, and the contract wasn't extended beyond the specced fields. Phase 3 supplies whether this reads well; phase-4 e2e asserts the `question-change-<id>` affordance, not the summary text.
- Renderer has no unit harness today (per plan); first real exercise is phase-4 e2e.

## Phase 3 — work seam STEP 03 + rail widening

**Files changed**
- `src/components/onboarding/journey/engines/work.ts` — `questions(vm, ctx)` rewritten onto `buildQuestionPlan` + profession wording + `choice` descriptors; `toVM` widened with 4 read-only rows; new `buildWorkQuestion` + `dedupeOptions` helpers; new imports.
- `src/components/onboarding/journey/engines/work.test.ts` — toVM count/order tests updated (4→8 fields); STEP-03 tests rewritten for the gating + commit-routing behavior against the Kundius fixture.
- `docs/task/work-onboarding-questions.audit.md` — this section.
- (`UnderstoodRail.test.tsx` NOT touched — it pins no rail field count/order; verified its edit/render assertions stay green with the 4 new skeleton rows.)

### Question mapping (slot → kind → required → commit path)
- `identity` → `text` · not required · `workRailAdapter.applyEdit('name', …)` (E1 verbatim; NAME prefill from `vm`).
- `groups` → `group` · not required · `commitGroupChips([...liveChips, {label}])` (E1 append-through-chip-join verbatim). Label uses `professionWording[p].workGroup` → "What galleries do you offer?" for a photographer.
- `price` → `price` · **required** · `commitGroupPrice` (D-G blanket practice-level, unchanged). `answered` from the plan. Price kind carries no `suggested` field, so the plan's `suggested:['on-request']` confirm posture is realized by the price renderer already defaulting to `on-request` (noted as an in-scope choice below).
- `establishment` → `choice` (single) · options new/established · `applyRailEdit({field:'establishment', value: values[0]})`.
- `dreamClient` → `choice` (multi, allowCustom) · options = de-duped `entry.audiences` (suggested) + `dreamClientChips[p]` · `applyRailEdit({field:'dreamClient', value: values.join(', ')})` (contract field is one string).
- `praise` → `choice` (multi) · options = suggested testimonials · `applyRailEdit({field:'praise', value: values})`. Confirm-only; label forks on establishment (see branch below).
- `contactMethod` → `choice` (single) · options whatsapp/booking/form · suggested from the plan's region default · `applyRailEdit({field:'contactMethod', value: values[0]})`.
- `languages` → `choice` (multi, allowCustom) · **required** · options `English` + `Dutch` (orchestrator ruling), `suggested:['English']` · `applyRailEdit({field:'languages', value: values})`.

### Profession wording + firewall import path
`resolveQuestionProfession(ctx.businessType)` (re-exported from `@/modules/wizard/work/questionGating`, the pure `wizard/work/*` family) → key into `professionWording` / `dreamClientChips`. The seam's ONLY new module-top imports are `questionGating` (the sanctioned pure sibling of `rail.ts`) and, for the two wording maps that `questionGating` does not re-export, `@/modules/engines/workVocabulary` — verified import-pure (it imports nothing at runtime) and used type/data-only. No react/store/template edge added; `journeyAgnostic.test.ts` stays green.

### toVM rows added
After `pricePosition`, four `kind:'text'`, `editable:false` rows: LANGUAGES, ESTABLISHED, DREAM CLIENT, CONTACT — value from the rail projection, skeleton when unknown. Corrections for these happen in STEP 03's answered-compact state, not rail-side (D-E), hence read-only. Chip/groups rows untouched.

### Establishment branch behavior
`questions()` reads `getWorkFacts(ctx.facts)?.establishment` off the fresh bag each call; the praise question label forks pure-code: `new` → "What should clients expect from working with you?", else → "What do clients praise you for?". Since praise is confirm-only (testimonials present) it does not surface for Kundius, but the branch is live for any established/new bag with quotes.

### E2 reconciliation touchpoints preserved
- Groups path: `commitGroupChips` / `liveChips` / `commitGroupPrice` unchanged; the group question still appends through the chip join. The establishment-commit test asserts a group's `photos`/`items` and the sibling `entry` survive the STEP-03 write (landmine 4 + the photos/items wipe).
- Price stays ONE blanket practice-level question (D-G) — no per-group split.

### Deviations
- **dreamClient made `multi:true`** (D-A described it as single). The binding Phase-3 instruction says "join multi selections with ', '", which is only meaningful for a multi-select; the commit joins with ', ' (single-selection collapses to the one value, so behavior is a superset). Logged as the conservative reading of the newer instruction.
- **Price `suggested` not passed on the descriptor** — the `price` kind has no `suggested` field in the closed union; the on-request confirm posture is inherent to the price renderer's default. No type/contract change made (conservative, in-scope).
- **praise commit writes the selected `values`** (verbatim testimonials, since option values ARE the testimonials) rather than a fixed suggested array — lets the user drop a bad quote while keeping the rest verbatim. praise is untested/unwalked in this phase; noted for the phase-4 author.

### Verification
- `npx tsc --noEmit` — exit 0, no errors (the pre-existing `founder.jpg` TS2307 did not reproduce in this worktree).
- `npm run test:run` — 225 files passed | 1 skipped; **3853 passed | 18 skipped**. Green, incl. `work.test.ts`, `questionGating.test.ts`, `rail.test.ts`, `workBriefFixture.test.ts` (fixture NOT edited), `journeyAgnostic.test.ts`, `UnderstoodRail.test.tsx`.
- `npm run lint` (touched files) — exit 0, no errors.

### Open risks
- dreamClient multi + confirm suggested: a phase-4 e2e "tap suggested confirm" must tap-then-Save (multi needs Save); the phase-4 author owns that walk and should adjust the spec accordingly.
- Answered-compact summary for `choice` still best-effort (renderer derives from `suggested`); real read verified at phase-4 e2e.

## Phase 4 — Playwright e2e over the seeded STEP 01→03 walk

**Files changed**
- `e2e/work-onboarding.spec.ts` — added the `answerRequiredQuestions` helper, a new `describe('E3 — STEP 03 questions (deterministic gating)')` block (2 tests), and repaired THREE pre-existing tests that now hit the E3 required gate.
- `docs/task/work-onboarding-questions.audit.md` — this section.
- (`e2e/helpers/seedWorkBrief.ts` — NOT touched: the existing `seedWorkBrief` + `loadDraft` already cover seeding + DB facts-assert; no new helper was needed.)

### Question ids targeted (confirmed by reading `engines/work.ts`)
The 5 Kundius questions and their exact testid ids: `price` (native `price` kind — mode picker `question-price-mode-price` + amount; on-request is the one-tap confirm), `establishment` (choice SINGLE — tap `question-chip-establishment-new` commits immediately), `dreamClient` (choice MULTI — tap `question-chip-dreamClient-Couples getting married` THEN `question-save-dreamClient`), `contactMethod` (choice single), `languages` (choice MULTI, required — tap `question-chip-languages-English` then `question-save-languages`). The suggested dreamClient value comes verbatim from `entry.audiences` in `WORK_BRIEF_FIXTURE` (`'Couples getting married'`). `question-name`/`question-groups` are asserted ABSENT (the seed knows them).

### Seeding path reused
`authedApi(page)` → `seedWorkBrief(page.request)` (real `/api/start` → `/api/brief/confirm` serve gate) → `page.goto('/onboarding/{token}')` → wait `step-show-work` → click `show-work-skip` → `step-questions`. DB assertions read back through the existing `loadDraft(api, token)` (real `/api/loadDraft`). No new seed helper; identical idiom to the pre-existing P4 test.

### New describe assertions (deterministic only — real-LLM copy quality is the founder gate)
1. **"asks EXACTLY the 5 known gaps"** — `question-name`/`question-groups` count 0; the 5 expected `question-<id>` cards visible; and the CARD-wrapper count (`[data-testid="step-questions"] > [data-testid^="question-"]`, direct children only so chips/inputs don't inflate it) is exactly 5 (the D-F ceiling).
2. **"required gate + answers reach the rail & DB + never ask twice on reload"** — one seeded walk covering plan ACs 2–5:
   - `journey-next` DISABLED initially (AC 4 gate closed).
   - Tap establishment `new` → `rail-value-establishment` shows "Just starting out" (rail row updates from a STEP-03 answer).
   - Tap dreamClient suggested chip + Save → `question-change-dreamClient` visible (collapses to answered-compact, D-E). Gate still DISABLED (neither is required).
   - `answerRequiredQuestions` (price on-request + languages English) → `journey-next` ENABLED (AC 4 enforcement).
   - `loadDraft` ⇒ `facts.work.establishment === 'new'`, `dreamClient === 'Couples getting married'`, `languages === ['English']`, every group still `kind === 'category'`; `facts.entry.businessName` intact (landmine 4 through the real `/api/saveDraft`); `audienceType/templateId/copyEngine` stamps intact.
   - Reload → resumes at STEP 02 (confirmed-but-ungenerated) → re-skip to 03 → establishment/dreamClient/languages questions ABSENT (never ask twice), while `price` re-appears as a ONE-TAP confirm: `question-price` visible, its on-request radio `aria-checked=true`, and NO `question-input-price` (native mode picker, not an open free-text re-ask — the D-C degrade).

### The 02→04 repair (the regression that the gate EXISTS)
- **`the journey step machine walks 02 → 04 and back`** (the plan's named target): split the loop so STEP 03 asserts `journey-next` is DISABLED, calls `answerRequiredQuestions`, asserts it becomes ENABLED, then advances. A silently-green walk here would be gate theatre — this makes the gate load-bearing.
- **`the journey walks 02 → 04: answers land in the rail and in the DB, kind-valid`** (also in this file, ALSO broken by E3 — in-scope Files-touched, so repaired): (a) its stale "price disappears when groups are empty / `question-price` count 0" assertion was replaced — under E3 `price` is a REQUIRED question asked from the start regardless of groups (its commit refuses until groups exist); (b) added a languages answer (`English` + Save) after the price answer so the final `journey-next` → `step-plan` advance is un-blocked. All other assertions (DB kind-validity, sibling preservation, plan idempotency) unchanged.
- **`STEP 05 generates the site … editor opens`** (P5/P6, also in this file, ALSO now walks 02→03→04 via `journey-next`): added `answerRequiredQuestions` on STEP 03 before advancing. Minimal, same helper.

### Grep for other step-3 drivers (requested)
`grep -E "step-questions|journey-next|step-plan|show-work-skip" e2e/**` → **only** `e2e/work-onboarding.spec.ts` matches. No OTHER suite drives STEP 03 / clicks `journey-next` on step 3, so no other spec is blocked by the new required gate. All three affected tests live in this one file and are repaired here.

### Deviations
- Repaired TWO pre-existing tests beyond the plan's single named target (`the journey walks 02 → 04: answers land…` and the P5/P6 `STEP 05 generates…`). Both are IN the Files-touched file, both are broken by the E3 required gate this phase introduces, and the phase verification requires e2e green — so leaving them red was not an option. In-scope judgment call, logged here (no file outside Files-touched was edited).
- `seedWorkBrief.ts` left untouched (plan allowed a new facts-assert helper "only if needed" — it wasn't; `loadDraft` sufficed).

### Verification (honest)
- **`npm run test:run`** (before the e2e work; no src/unit files touched afterward): **3853 passed | 18 skipped** (225 files). Green.
- **`npm run test:e2e` FULL SUITE**: ran to a 1.2h **environment meltdown UNRELATED to these specs** — 26 tests across EVERY spec (parity, render, ui-isolation, dashboard, edit-persistence, media, publish, toolbar, and the pre-existing work-onboarding test #1) died with `worker process exited unexpectedly (code=3221225794 = 0xC0000374 STATUS_HEAP_CORRUPTION)` + `warmUpSession` goto('/') timeouts; 75 tests "did not run". This is the known Windows-worktree node-worker heap-corruption flake, not a test-logic failure — my E3 tests were in the "did not run" bucket. NOT counted as a result. (Note: `npm run test:e2e -- work-onboarding` does NOT filter — `test:e2e` is bare `playwright test` and npm did not forward the positional; the whole suite ran.)
- **`npx playwright test e2e/work-onboarding.spec.ts --workers=1`** (isolated — the honest result for this phase's file): **9 passed (3.0m)**. Includes both new E3 tests (2.9s, 5.7s), both repaired 02→04 walks (test 3 + test 5), the P5/P6 generation walk (1.4m), and the legacy-unchanged test. The `ReferenceError: window is not defined` lines in `[WebServer]` output are a pre-existing SSR log on the `/preview/[token]` route's `useEditStoreBootstrap` dev-only block — noise, the test passes through it.

### Open risks / findings
- **e2e infra flake (REPORTED, not mine to fix):** the full authed suite collapses with node-worker heap corruption under sustained load on this Windows worktree (1.2h, cross-spec). Per-spec isolation (`--workers=1`, single file) is green. This predates and is orthogonal to E3 — surfaced here only because the phase's verification is e2e.
- The two E3 tests + three repaired walks are proven green only in ISOLATION; a from-cold full-suite run remains subject to the above infra flake (Phase 5's full gate should run specs in isolation or on CI, not one 1.2h local sweep).

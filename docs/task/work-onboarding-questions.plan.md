# work-onboarding-questions — plan (E3)

## Overview

Replace the E1 STEP-03 placeholder (name / what-you-sell / one price) with the full 8-slot question step for the Work engine: a deterministic, zero-AI gating layer decides per slot whether we **know** (skip/pre-fill), are **almost sure** (one-tap confirm), or **don't know** (chips ask); price + language are required to proceed; every answer writes the frozen `WorkFacts` contract through the existing `commitRail` door and fills the rail progressively. Wording is static per profession (`professionWording` / `dreamClientChips` — consumed, not built). E2 is NOT landed — everything codes against the frozen contract + the Kundius fixture.

**Branch:** `feature/work-onboarding-questions` · **Worktree:** `.claude/worktrees/work-onboarding-questions`

## Progress log

- phase 1 pure gating resolver + rail write paths: done (commit cd0e4923; 49 new tests green; tsc clean re: E3 files)
- phase 2 question contract + agnostic renderer + required gate: done (commit ba6c9afa; choice kind + onBlockedChange gate; tsc/test/lint green; +question-add-<id> testid)
- phase 3 work seam STEP 03 + rail widening: done (commit 8aeda339; 5-question Kundius set + profession wording + establishment branch; tsc/test 3853/lint green; dev: dreamClient=multi, price=native kind)
- phase 4 playwright e2e over the STEP 01→03 walk: done (commit 3ff01310; work-onboarding.spec 9/9 green ISOLATED; 3 walks repaired; full authed sweep heap-corrupts on win worktree — run e2e per-spec in phase 5)
- phase 5 build/lint sweep + track doc + founder live-walk gate: done (commit 0fcfd44a; all 5 gates green — tsc/test3853/lint/build/e2e9-9 isolated); founder live-walk = pending human gate

## Central design decisions (locked here so phases don't re-litigate)

**D-A · Question kinds — extend the closed union with ONE new kind, `choice`.**
The existing `JourneyQuestion` union (`text | group | price`, `engines/types.ts:215`) cannot express chips, one-tap confirm, or the establishment branch. Option (b) — faking chips through `text` — would mean typed enum values, no tap UX, and no confirm posture; rejected. Option (a) is additive: one `choice` kind covers ALL new needs via its fields:

```
{ id; kind:'choice'; label; options:{value;label}[];
  multi?:boolean;            // languages
  allowCustom?:boolean;      // dream-client free-text escape
  suggested?:string[];       // present ⇒ renders as ONE-TAP CONFIRM posture
  commit(values:string[], liveFacts): RailCommit }
```

- establishment = `choice` single, 2 options (the branch is just a fact write; `questions()` re-projects after every commit, so praise wording forks off the new VM naturally).
- contactMethod = `choice` single + `suggested` (neverSilent confirm).
- dreamClient = `choice` single + profession chips + `allowCustom` + `suggested` from `entry.audiences`.
- languages = `choice` multi + `suggested`.
Additionally every union member gains two optional common fields: `required?: true` and `answered?: boolean` (drives the proceed gate + answered-compact rendering). **Watchpoint:** this touches the shared frame; the union's own comment sanctions deliberate extension. Only the work seam exists today; the renderer switch in `StepQuestions.tsx` adds one case — other engines never emit it. `journeyAgnostic.test.ts` must stay green.

**D-B · `questions()` signature gains a context arg.**
Profession wording needs `businessType` (lives on the brief/store, NOT in the facts bag, so `toVM` can't carry it) and confirm-suggestions need `facts.entry`. New signature: `questions(vm: RailVM, ctx: JourneyQuestionsContext)` with `ctx = { businessType: string | null; facts: Record<string,unknown> | undefined; sessionAnswered: readonly string[] }`. Update the "questions read only off the VM" doc comment honestly: the VM says what's unknown; ctx supplies upstream signals + wording key; commits still route ONLY through the rail adapter. Blast radius: `types.ts`, `work.ts`, `StepQuestions.tsx` — three files, one engine.

**D-C · "Answered" derivation (no schema reshape).**
`WorkFacts` stores values only. Per-slot rules: slot value present ⇒ answered/known. The one ambiguity is **price**: the entry seed defaults every group to `on-request`, indistinguishable from a real "on request" answer. Rule: price counts answered when `sessionAnswered` contains `'price'` OR any group price is non-default (`exact`/`from`/has amount). Consequence (accepted, documented): a genuine "on request" answer degrades to a one-tap confirm (`suggested: ['on-request']`) after a mid-step reload — one tap, never an open re-ask. No marker field is added to the frozen contract.

**D-D · Required-gate wiring.**
Continue lives in `JourneyShell` (agnostic). Follow the `onBuildingChange` precedent: `JourneyStepProps` gains `onBlockedChange?: (blocked:boolean)=>void`; `StepQuestions` reports `blocked = questions.some(q => q.required && !q.answered)`; the shell disables `journey-next` while step 3 is blocked (and resets on step change). Deterministic ⇒ e2e-assertable.

**D-E · Asked slots stay visible in answered-compact state.**
Within the step, an asked+answered slot collapses to "value — Change" instead of vanishing (correctable, and keeps the required questions tappable). Slots that were never asked (known upstream) never render — that IS "never ask twice". Slots the ceiling drops simply keep their defaults.

**D-F · Ceiling is structural, not counted.**
Praise is confirm-only: it appears ONLY when `entry.testimonials` exist (one-tap "use these quotes?"), never as an open ask (spec: carry only what the contract holds). With name+groups seeded, max candidates = price, languages, establishment, contactMethod, dreamClient = **exactly 5**. A hard cap-at-5 by priority rank (name, groups, price, languages, contactMethod, establishment, dreamClient, praise) guards the degenerate no-seed case. Kundius fixture ⇒ 5 questions: price (ask, required) · establishment (ask) · dreamClient (confirm from `audiences`) · contactMethod (confirm) · languages (ask, required).

**D-G · Price stays ONE practice-level blanket question.**
The E1 note in `work.ts:351` defers per-group price splitting until per-group pricing exists. E2 writes `photos`/`items`, never prices, so the blanket remains correct and re-answer-to-correct keeps working. Per-group pricing stays deferred (editor/E4).

**D-H · New writes go through `RailEdit`, not a new door.**
Extend the `RailEdit` union in `rail.ts` (pure module) with `establishment` / `dreamClient` / `praise` / `contactMethod` (all already fields of `WorkFactsSchema` — zero reshape; `languages` already exists). `applyRailEdit` remains the single validation gate.

**E2 reconciliation flags (expect merge conflicts here):** `work.ts` groups/price paths (`commitGroupChips` / `commitGroupPrice` / `questions()`), `rail.ts` groups normalization. Both preserve `photos`/`items` today — keep that property through any merge.

---

## Phase 1 — pure gating resolver + rail write paths

**Files touched**
- `src/modules/wizard/work/questionGating.ts` (NEW)
- `src/modules/wizard/work/questionGating.test.ts` (NEW)
- `src/modules/wizard/work/rail.ts` (extend `RailEdit` + `applyRailEdit`) — *E2 reconciliation flag*
- `src/modules/wizard/work/rail.test.ts` (new edit cases)

**Steps**
1. `questionGating.ts` — PURE module (zod/types/data only; header documents the firewall: this file is a sanctioned static import for the seam, like `rail.ts`). Exports:
   - `type SlotPosture = 'known' | 'confirm' | 'ask' | 'skip'`
   - `interface QuestionPlanItem { slot: WorkSlotId; posture: SlotPosture; required: boolean; answered: boolean; suggested?: string[] }`
   - `buildQuestionPlan(input: { work: WorkFacts | null; entry: Partial<EntryFacts> | null; sessionAnswered: readonly string[] }): QuestionPlanItem[]`
   Deterministic rules (keyed off `workSlots[].mechanics` + presence in `WorkFacts` — this WIRES the dormant `mechanics`/`neverSilent`/`branch` flags in `src/modules/engines/workSlots.ts`):
   - identity(name) / groups: ask only when absent (E1 parity).
   - **price (required):** answered per D-C; else ask, `suggested:['on-request']` once groups exist.
   - **languages (required):** present ⇒ answered; absent ⇒ ask (multi), `suggested:['English']`.
   - establishment (branch): present ⇒ skip; absent ⇒ ask (no upstream signal exists).
   - dreamClient: present ⇒ skip; `entry.audiences` non-empty ⇒ confirm (`suggested` = audiences); else open ask (profession chips).
   - praise: present ⇒ skip; `entry.testimonials` non-empty ⇒ confirm (`suggested` = testimonials verbatim); else SKIP entirely (D-F).
   - contactMethod (neverSilent): present ⇒ skip; absent ⇒ confirm with deterministic default — `deliveryModel` `in-person`/`hybrid` → `whatsapp`, else `form`.
   - Order by slot order (`workSlotIds`); cap 5 by priority rank (D-F).
   - Also export `resolveQuestionProfession(businessType)` — thin re-export/wrap of `resolveWorkProfession` (`src/modules/audience/work/voice.ts:151`) so the seam's only new static-import family stays `wizard/work/*`. **Verify** `voice.ts` + `workVocabulary.ts` + `workSlots.ts` are import-pure (no react/stores/templates) before wiring; if `voice.ts` isn't, inline the 4-key map instead of importing it.
2. `rail.ts` — extend `RailEdit` with `{field:'establishment', value:'new'|'established'}`, `{field:'dreamClient', value:string}`, `{field:'praise', value:string[]}`, `{field:'contactMethod', value:'whatsapp'|'booking'|'form'}`; add switch cases (trim/validate; empty string ⇒ `{ok:false}`; empty praise array ⇒ unset). Schema untouched.
3. Tests: `questionGating.test.ts` runs `buildQuestionPlan` against (a) the Kundius fixture facts (import `WORK_BRIEF_FIXTURE` from `e2e/helpers/workBriefFixture.ts` — precedent: `workBriefFixture.test.ts`) ⇒ exactly the 5 expected items, postures, required/answered flags, suggestions; (b) rich facts (all slots present) ⇒ only unanswered required items; (c) empty facts ⇒ cap-5 by priority; (d) testimonials present ⇒ praise confirm appears; (e) price answered-detection incl. the D-C session/non-default rules. `rail.test.ts`: new edit fields round-trip through `applyRailEdit` preserving siblings (`facts.entry`) + groups `photos`/`items`.

**Verification:** `npx tsc --noEmit` + `npm run test:run` green; new tests assert the exact Kundius question set.

---

## Phase 2 — question contract + agnostic renderer + required gate

**Files touched**
- `src/components/onboarding/journey/engines/types.ts` (`choice` kind, `required`/`answered` common fields, `JourneyQuestionsContext`, `questions(vm, ctx)` signature)
- `src/components/onboarding/journey/steps/StepQuestions.tsx` (choice renderer, answered-compact, ctx, blocked reporting)
- `src/components/onboarding/journey/JourneyShell.tsx` (`onBlockedChange` in `JourneyStepProps`; disable Continue on step 3 while blocked)
- `src/hooks/useWizardStore.ts` (add `selectBusinessTypeKey` selector only — state already holds `businessTypeKey`)
- `src/components/onboarding/journey/journeyAgnostic.test.ts` (only if its import/shape assertions need the new contract — no behavior change)

**Steps**
1. `types.ts` per D-A/D-B. Keep the union CLOSED at 4 kinds; update the "3 kinds closed for E1" comment to record this deliberate E3 extension.
2. `StepQuestions.tsx`:
   - Select `businessTypeKey`; hold local `answeredIds` state (append `question.id` after each successful `submit`); build `ctx` and call `seam.steps.questions(vm, ctx)`.
   - Render `choice`: single-select ⇒ tap commits immediately; `suggested` ⇒ suggested option rendered prominent (one-tap confirm) with the rest as quieter chips; `multi` ⇒ toggle chips + Save; `allowCustom` ⇒ small input + add. Reuse `Button`/`Input`; testids `question-<id>`, `question-chip-<id>-<value>`, `question-save-<id>` (keep existing testid patterns).
   - Answered-compact per D-E: `answered` questions collapse to value summary + "Change" (`question-change-<id>`), expanding on tap.
   - Report `onBlockedChange(questions.some(q => q.required && !q.answered))` via effect.
3. `JourneyShell.tsx`: `blocked` state; pass `onBlockedChange` to the body; `journey-next` disabled when `journeyStep === 3 && blocked`; reset `blocked` when the step changes. Nothing engine-specific enters the shell.

**Verification:** `npx tsc --noEmit`, `npm run test:run` (incl. `journeyAgnostic.test.ts` — the firewall assertions must stay green), `npm run lint`. Manual smoke deferred to phase 4's e2e (renderer has no unit harness today; the e2e covers it).

---

## Phase 3 — work seam STEP 03 + rail widening

**Files touched**
- `src/components/onboarding/journey/engines/work.ts` (questions() rewrite; toVM widening) — *E2 reconciliation flag (groups/price paths)*
- `src/components/onboarding/journey/engines/work.test.ts` (question-set + commit-routing tests)
- `src/components/onboarding/journey/UnderstoodRail.test.tsx` (only if it pins field count/order — update expectations)

**Steps**
1. `work.ts` `questions(vm, ctx)`:
   - `plan = buildQuestionPlan({ work: getWorkFacts(ctx.facts), entry: ctx.facts?.['entry'] ?? null, sessionAnswered: ctx.sessionAnswered })`.
   - Profession wording: `resolveQuestionProfession(ctx.businessType)` → `professionWording[p]` for labels (e.g. groups question says "galleries" for a photographer) + `dreamClientChips[p]` for slot-5 options. **Firewall:** the ONLY new module-top import into the seam is `questionGating` (a `wizard/work/*` pure sibling of `rail.ts` — sanctioned family); vocabulary/profession reach the seam THROUGH it, never directly. `journeyAgnostic.test.ts` / seam-import assertions updated if they enumerate.
   - Map plan items → descriptors + commits:
     - name/groups: E1 behavior verbatim (append-through-chip-join preserved).
     - price: `commitGroupPrice` unchanged (D-G); `required: true`, `answered` from plan; `suggested` renders the on-request confirm posture.
     - establishment / dreamClient / praise / contactMethod: `choice` questions committing via `workRailAdapter`-style `applyRailEdit` with the new `RailEdit` fields (dreamClient: join multi selections `', '` — the contract field is a single string; praise confirm commits the suggested testimonials verbatim).
     - languages: `choice` multi committing `applyRailEdit({field:'languages'})` (exists); `required: true`.
   - Branch behavior: after establishment commits, re-projection flips praise-related wording (established → "what clients praise", new → "what should clients expect") — pure code off the fresh facts.
2. `toVM` widening (the E1 comment explicitly reserves this for E2/E3): add read-only rows — LANGUAGES, ESTABLISHED, DREAM CLIENT, CONTACT (kind `'text'`, `editable:false`, skeleton when unknown). Corrections for these happen in STEP 03 (answered-compact) — rail editing for them is NOT in scope. Chip rows for groups untouched.
3. `work.test.ts`: against fixture facts — exactly 5 questions with expected ids/kinds/required/suggested; photographer wording asserted; establishment commit ⇒ `facts.work.establishment === 'new'` with `facts.entry` sibling preserved (landmine 4) and groups `photos`/`items` untouched; dreamClient confirm commit; languages commit; price blanket still `kind`-valid (landmine 6); empty-facts case caps at 5; a rich-facts case yields ONLY unanswered required questions (fewer questions for rich signal — AC 3).

**Verification:** `npx tsc --noEmit` + `npm run test:run` green (esp. `work.test.ts`, `journeyAgnostic.test.ts`, `rail.test.ts`, fixture drift guard `workBriefFixture.test.ts` — fixture itself is NOT edited).

---

## Phase 4 — Playwright e2e over the seeded STEP 01→03 walk

**Files touched**
- `e2e/work-onboarding.spec.ts` (new describe block + REPAIR of the existing 02→04 walk test)
- `e2e/helpers/seedWorkBrief.ts` (only if a loadDraft facts-assert helper is needed)

**Steps**
1. New describe "E3 — STEP 03 questions (deterministic gating)":
   - Seeded Kundius brief → step 3: exactly the 5 expected `question-*` testids visible; NO `question-name` / `question-groups` (never ask what the seed knows); count ≤5.
   - `journey-next` DISABLED; answer price (tap on-request confirm) + languages (tap English, save) → `journey-next` enabled. (Required enforcement — AC 4.)
   - Tap establishment "Just starting out" → rail row updates; `loadDraft` via API ⇒ `facts.work.establishment === 'new'` AND `facts.entry` still present (landmine 4 through the real `/api/saveDraft`).
   - Tap dreamClient suggested confirm → `facts.work.dreamClient` set; answered question collapses to compact state.
   - Reload the page → answered slots do NOT re-ask (establishment/dreamClient/languages absent from the ask list); price shows as one-tap confirm per D-C (assert confirm posture, not open input).
2. Repair the existing "journey step machine walks 02 → 04" test: it clicks Continue through step 3, which the required gate now blocks — have it answer price + languages first (this repair is itself the regression test that the gate exists; a silently-green walk here would be gate theatre).

**Verification:** `npm run test:e2e` green locally (authed project; serial). `npm run test:run` still green.

---

## Phase 5 — build/lint sweep + track doc + founder gate

**Files touched**
- `docs/tracks/workEndtoEnd.md` (§3 status: E3 built; note the D-C on-request reload nuance + praise confirm-only ruling)

**Steps**
1. Full local gate: `npx tsc --noEmit` · `npm run test:run` · `npm run lint` · `npm run build` (build ≠ next build — runs published-CSS/assets first) · `npm run test:e2e`.
2. Track doc status note.

**Verification:** all five commands green on the feature branch.

**HUMAN GATE (final — the pilot decision gate):** founder live STEP 01→03 walk on the Kundius fixture against `npm run dev`: sees ONLY real gaps, ≤5 questions, taps not typing, rail fills progressively, price+language required enforcement, "never ask twice" holds across back/forward + reload. If she sees a question we should already know, the GATING is wrong — fix before merge.

**HUMAN GATE (flagged, deferred verification):** new-vs-established branch — E3 only SETS `facts.work.establishment`; the copy engine already consumes it (`selectWorkVoice`), but proof-led vs fresh-eyes copy routing is fully verified only at a downstream generation run (founder checks generated copy reflects the branch at the same live walk, or at E4).

---

## Unresolved questions

- Price "on request" re-confirm after mid-step reload (D-C): acceptable one-tap, or want a persisted answered-marker (would need a contract addition — currently forbidden)?
- Languages `suggested:['English']` default OK, or derive NL suggestion from location text (fragile string-match — recommend no)?
- contactMethod default rule (in-person/hybrid → whatsapp, else form) — confirm the mapping.
- Rail rows for establishment/dreamClient/contact/languages read-only in E3 (corrections via STEP 03 compact state only) — fine, or need rail-side editing now?
- Existing 02→04 walk e2e now must answer required questions — confirm no other suite drives step 3 via Continue.

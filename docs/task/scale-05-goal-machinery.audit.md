# scale-05 goal machinery — implementation audit

## Phase 1 — Goal param plumbing (schema + capture + writeback)

**Files changed**
- `src/lib/schemas/brief.schema.ts` — modified
- `src/modules/brief/bridge.ts` — modified
- `src/components/onboarding/shared/GoalParamFields.tsx` — NEW
- `src/hooks/useProductGenerationStore.ts` — modified
- `src/hooks/useServiceGenerationStore.ts` — modified
- `src/app/onboarding/product/[token]/components/steps/GoalStep.tsx` — modified
- `src/app/onboarding/service/[token]/components/steps/GoalStep.tsx` — modified
- `src/app/onboarding/product/[token]/components/steps/GeneratingStep.tsx` — modified
- `src/app/onboarding/service/[token]/components/steps/GeneratingStep.tsx` — modified
- `src/modules/brief/bridge.test.ts` — modified
- `src/modules/goals/goalToDestination.test.ts` — modified

### Per-file
- **brief.schema.ts** — `goal.param` added: `z.object({phone,email,url,links,date,message}).partial().optional()`. Additive/optional; existing Briefs + frozen fixtures parse unchanged (asserted in bridge.test).
- **bridge.ts** — `SERVICE_GOAL_TO_INTENT` + `LANDING_GOAL_TO_INTENT` (TOTAL `Record`s, compiler-enforced), `GoalParamInput` type, `legacyGoalToBriefGoal(legacyGoal, param?)`. Intent-specific branches FIRST: `subscribe-newsletter` → forced `mechanism='M1'`, no param/destination (never derived from `goalIntentMeta`); `download-app` → `param.links` persisted verbatim (trimmed, empties dropped), `destination = links[0]`; `rsvp` → url+date, url present → M3 else M1. Then mechanism-generic fallback: phone/email → M2 (`wa.me/<digits>` / `mailto:`) when intent allows M2; url → M3 when intent allows M3; M4 → links; M1/M5 → none. `vocabulary.ts` untouched.
- **GoalParamFields.tsx** — NEW shared client component, controlled (value/onChange). Branch order mirrors writeback; `subscribe-newsletter` returns null before any fallback. download-app = two labeled store-URL fields (fixed 2-slot links array, 0=Play 1=App Store). Exports `intentHasParamFields` + `intentParamSatisfied` (download-app requires ≥1 link).
- **stores (both)** — `goalParam: GoalParamInput` (init `{}`) + `setGoalParam`.
- **product GoalStep** — param-less goals keep original auto-advance; param goals pause, show GoalParamFields + Continue (disabled until satisfied) + "Skip for now"; param cleared on goal switch.
- **service GoalStep** — GoalParamFields rendered above Continue when the mapped intent has fields (only book-call today: optional scheduling link); Continue gated on `intentParamSatisfied` (always true for the 3 offered goals).
- **service GeneratingStep** — saveDraft body gains `brief: { goal: legacyGoalToBriefGoal(goal, goalParam) }`; `goalParam` added to useCallback deps.
- **product GeneratingStep** — `briefPatch` computed once per run (`landingGoal ? {brief:{goal:...}} : {}`), spread into ALL THREE saveDraft bodies (saveFC multi-page, techpremium deterministic, single-page runCopyAndSave). Resumed runs (store reset → landingGoal null) send nothing, so saveDraft's shallow brief merge leaves the persisted goal untouched.
- **bridge.test.ts** — reverse-map totality (iterates both legacy enums), renamed-intent mappings, subscribe-newsletter override (incl. stray-param ignore), download-app two-links verbatim + destination=links[0], demo+Calendly M3 upgrade, wa.me/mailto composition, pure-M1 cases, BriefSchema acceptance, end-to-end phase-6 shape assertion (`goalParam` → `brief.goal.param.links`), newsletter → `mechanism==='M1'`.
- **goalToDestination.test.ts** — extended (not replaced): composed round-trip cases — wa.me→whatsapp, mailto→email, Calendly→external, download-app→external links[0] (param.links intact), newsletter override→M1 `#form-section` anchor, M4 social shape still resolves.

### Deviations / judgment calls (in-scope)
1. **M1-primary intents that allow M3 (request-demo, book-call, enroll) get an OPTIONAL destination-URL field**, and writeback upgrades M1→M3 when the url is present. The plan's generic fallback keyed on `mechanisms[0]` alone would render nothing for these, contradicting the phase's own verification ("demo goal + Calendly URL → destination + param persisted"). Conservative resolution: optional field, blank → M1 form fallback (previous behavior).
2. **`download-portfolio` (legacy ServiceGoal, not offered in UI) → `lead-magnet` intent** — plan didn't specify; closest M1 gated-resource fit.
3. **rsvp mechanism**: url present → M3 + destination, else M1 (mechanisms[0]); date stored only (plan open question #6). No legacy enum reaches rsvp today.
4. **download-app links stored as fixed 2-slot array in the store** (index 0=Play, 1=App Store) so the two inputs stay stable while typing; writeback trims + drops empties, so the PERSISTED `param.links` carries only real URLs ("verbatim" = the entered URL strings).
5. **phone param composes `wa.me/<digits>`** (not `tel:`) per design call #1's example; `tel:` remains resolver-only. M2 UI branch is dormant today (no M2-primary intent reachable from legacy enums) but implemented per plan for phase-8 reuse.

### Deferred (later phases, per plan)
- WhatsApp `param.message` materialization (phase 5), form auto-seed (phase 4), badge/strip injection (phases 6–7), intent-first GoalStep (phase 8). Regeneration paths untouched.

### Verification
- `npx tsc --noEmit` → clean (no output).
- `npm run test:run -- bridge goalToDestination brief` → `Test Files 4 passed (4) · Tests 80 passed (80)`.
- `npm run test:run -- generation` (fixture-safety extra) → `Test Files 5 passed (5) · Tests 34 passed (34)`.
- Manual wizard checks (demo+Calendly / download two links / newsletter) left for the orchestrator's phase gate.

### Open risks
- Product GoalStep UX changed for param goals (no auto-advance until Continue/Skip) — needs a quick manual look.
- `briefPatch` is sent on every multi-page saveFC call (idempotent shallow merge; harmless, slightly chatty).

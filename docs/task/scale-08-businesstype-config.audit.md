# scale-08 businessType config — audit

## Phase 1 — voiceHint in config + voice re-key end-to-end

### Files changed
- `src/modules/businessTypes/config.ts`
- `src/modules/businessTypes/config.test.ts`
- `src/modules/audience/product/voice.ts`
- `src/modules/audience/product/voice.test.ts` (NEW)
- `src/modules/wizard/generation/thing.ts`
- `src/modules/wizard/generation/thing.test.ts`
- `src/modules/generation/multiPageAssembly.ts`
- `src/hooks/useWizardStore.ts`
- `src/app/api/audience/product/strategy/route.ts`
- `src/app/api/audience/product/generate-copy/route.ts`

### Per-file changes

**config.ts** — Added optional `voiceHint?: string` to `BusinessTypeEntry` (documented: plain string to avoid a config↔audience cycle; thing-engine only). Set `saas.voiceHint = 'modern-tech'`, `manufacturer.voiceHint = 'tailored-trade'`. Scrubbed the stale "Nothing in the app imports this yet" header note (now lists serve gate / wizard hydrate / voice derivation as live consumers).

**config.test.ts** — Added a test: every `copyEngine === 'thing'` entry with a `voiceHint` has a value in the ProductVoiceId union `['modern-tech','tailored-trade']`; manufacturer=tailored-trade, saas=modern-tech.

**voice.ts** — Added `productVoiceForBusinessType(key?: string|null): ProductVoiceId` — reads `businessTypes[key].voiceHint`, returns it when valid, else `'modern-tech'`. Imports `businessTypes` from config (plain module, no cycle — config imports only `@/types/brief` + goals vocab). Added a firewall note to the header.

**voice.test.ts** (NEW) — Unit: manufacturer→tailored-trade, saas→modern-tech, undefined/null→modern-tech, garbage/agency(no voiceHint)→modern-tech.

**thing.ts** — Added `businessTypeKey?: string` to `ThingGenerationInput`. `buildStrategyPayload` now sends `brief` whenever a goal OR a businessType key exists (goal + businessType merged into one brief object). `buildCopyPayload` adds `businessType: input.businessTypeKey`. `buildOnboardingData` persists `businessTypeKey`. The multipage `ob` (MultiPageOnboardingData) construction carries `businessTypeKey`. `runFanOut` copy body adds `businessType: ob.businessTypeKey ?? 'manufacturer'` (transitional fallback for in-flight resumable drafts). Did NOT touch the `isManufacturerFlow` field-remap forks (buildStrategyPayload isMfr relabel, buildCopyPayload remap, saveFC gates, effectiveFeatures) — those are Phase 2; the `isManufacturerFlow` import stays.

**thing.test.ts** — Strategy/copy mirrors extended with optional `brief.businessType` / top-level `businessType`; mirror's `brief.goal` made optional (brief can now carry businessType alone). MANUFACTURER strategy test now sets `businessTypeKey:'manufacturer'`. New asserts: strategy payload carries `brief.businessType`; brief sent with businessType-only (no goal); no brief when neither present; copy payload carries `businessType`; multipage fan-out copy body carries `businessType:'manufacturer'`.

**multiPageAssembly.ts** — Added optional `businessTypeKey?: string` to `MultiPageOnboardingData`.

**useWizardStore.ts** — `buildThingInput` passes `businessTypeKey: s.businessTypeKey ?? undefined`.

**strategy/route.ts** — Replaced the `isManufacturerFlow(data.templateId)` voice fork with `productVoiceForBusinessType(data.brief?.businessType)`. Dropped the `isManufacturerFlow` import (its only use in this route was voice); now imports `productVoiceForBusinessType` from voice.ts.

**generate-copy/route.ts** — Added `businessType: z.string().optional()` to the request schema. Replaced `templateId === 'vestria'` voice line with `productVoiceForBusinessType(businessType)`. Kept `templateId` accepted-but-unused (removed from destructure since no longer read; schema field + comment updated to say accepted-but-unused post-re-key). Updated the step-3 prompt comment.

### Step 8 — businessTypeKey population finding (HARD CHECK)
PASS. `businessTypeKey` is SET only in `useWizardStore.hydrate` (`:606`) from `brief.businessType`. The wizard hydrates from the DB Project's persisted `brief` + `templateId`, written together by `/api/brief/confirm` (`:60-68`) ONLY on a `decideServe` SERVE outcome. `decideServe` (serveGate.ts:91,136) resolves ANY template — including vestria — only when `businessType` is KNOWN (∈ businessTypes). Therefore a resolved `templateId: 'vestria'` always coexists with `brief.businessType: 'manufacturer'`, so hydrate always sets `businessTypeKey`. No vestria/manufacturer entry path can reach generation without it. Voice fallback to modern-tech cannot silently occur on a served vestria run.

### Deviations
- Did NOT add `businessTypeKey` to the default `baseInput()` in thing.test.ts (would break the existing `'brief' absent when no intent` assert, since brief is now also emitted for businessType-only). Added it per-test instead. Conservative, in-scope.
- generate-copy: removed `templateId` from the handler destructure (unused after re-key; tsc flags unused vars). The schema field + senders are untouched — templateId remains accepted-but-unused per DECIDED note.

### Test results
- `npx tsc --noEmit`: clean.
- Targeted (`vitest run thing config voice`): 4 files, 38 tests passed.
- Full `npm run test:run`: 97 passed | 1 skipped (98 files); 1554 passed | 2 skipped (1556 tests).

### Open risks
- None for Phase 1. Legacy in-flight multipage drafts persisted before this change resume with `ob.businessTypeKey` undefined → fan-out falls back to `'manufacturer'` (correct today, the only multipage type). Documented transitional.

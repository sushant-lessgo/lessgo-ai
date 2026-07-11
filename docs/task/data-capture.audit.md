# Data Capture — Implementation Audit

## Phase 1 — Prisma migration + edit-distance util

### Files changed
- `prisma/schema.prisma` — added `aiBaseline Json?` to `Project`, `editDeltas EditDelta[]` back-relation, and the `EditDelta` model.
- `src/lib/editDelta/editDistance.ts` (new) — bounded Levenshtein util.
- `src/lib/editDelta/editDistance.test.ts` (new) — 12 unit tests.

- `prisma/migrations/20260711233848_data_capture_edit_delta/migration.sql` (new) — the applied migration SQL.

### What changed
- **schema.prisma**: `Project.aiBaseline Json?` (flat `{ [sectionId]: { [elementKey]: string } }` baseline); `editDeltas EditDelta[]` back-relation; `EditDelta` model exactly per plan — relation on `projectToken → Project.tokenId` (`onDelete: Cascade`), `audienceType String?` nullable, `isFounderEdit Boolean @default(false)`, `@@unique([projectToken, sectionId, elementKey])`, NO separate `@@index([projectToken])`.
- **editDistance.ts**: `editDistance(a, b): number`. Identical → 0. Two-row DP (O(min) space). Inputs > 2000 chars: DP runs on first 2000 chars of each, plus `abs(lenA - lenB)` for the untracked tail. Plain server module, no `'use client'`.
- **editDistance.test.ts**: identity (incl. empty), insert, delete, replace, kitten/sitting=3, symmetry, unicode (café/cafe, accented equality, emoji), and four >2000-char cap-path cases.

### Migration — APPLIED via db-execute + migrate-resolve (NOT migrate dev)
`npx prisma migrate dev` was initially **blocked by drift**: the shared dev DB has 3 migrations applied that are missing from this branch's local `prisma/migrations/` dir — `20260710105655_social_posts`, `20260710184339_add_email_sequence`, `20260710202106_cold_outreach` (plus tables `EmailSequence`, `OutreachIntake`, `OutreachMessage`, `ProspectScrape`, `SocialPost`, and `UserPlan.socialPostsLimit`). These come from the BUILT-but-HELD branches (social-posts / email-sequences / cold-outreach). `feature/data-capture` was branched before those files landed, so `migrate dev` wanted to reset (would wipe shared dev data — not permitted). I STOPPED and reported.

**PO decision: db-execute + migrate-resolve** (do NOT reset, do NOT import the 3 held migrations). Executed:
1. `git show HEAD:prisma/schema.prisma > <scratch>/schema.old.prisma` (HEAD == main; branch has no commits yet).
2. `npx prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel prisma/schema.prisma --script` — schema-vs-schema, no DB connection. SQL sanity-checked: contains ONLY the `EditDelta` table (+ its unique index + FK to `Project.tokenId` ON DELETE CASCADE) and `ALTER TABLE "Project" ADD COLUMN "aiBaseline" JSONB` — nothing from the held branches.
3. Wrote SQL to `prisma/migrations/20260711233848_data_capture_edit_delta/migration.sql` (timestamp AFTER the 07-10 held migrations, to keep prod `migrate deploy` ordering sane).
4. `npx prisma db execute --file <that>.sql --schema prisma/schema.prisma` → "Script executed successfully."
5. `npx prisma migrate resolve --applied 20260711233848_data_capture_edit_delta` → "marked as applied."
6. `npx prisma generate` → succeeded.

**Migration folder/name:** `20260711233848_data_capture_edit_delta`.
**SQL summary:** `ALTER TABLE "Project" ADD COLUMN "aiBaseline" JSONB;` + `CREATE TABLE "EditDelta"` (13 cols) + `CREATE UNIQUE INDEX "EditDelta_projectToken_sectionId_elementKey_key"` + `ADD CONSTRAINT "EditDelta_projectToken_fkey" FOREIGN KEY ("projectToken") REFERENCES "Project"("tokenId") ON DELETE CASCADE`.

### Verification results
- `npx prisma migrate status`: "Database schema is up to date!" (25 migrations found; no pending). It did not re-flag the 3 held migrations as a blocker.
- DB introspection (raw query): `EditDelta` table exists with all 13 columns; `Project.aiBaseline` column present; `prisma.editDelta.count()` = 0 (client accessor works ⇒ `EditDelta` type generated).
- `npx prisma generate`: succeeded.
- `npx tsc --noEmit`: one error, **pre-existing and unrelated** — `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (image-module type declaration; not in scope, not modified by me). The new editDelta files produce zero tsc errors.
- `npm run test:run`: GREEN — 139 files passed / 1 skipped; 2123 tests passed / 3 skipped; no new failures. New `editDistance.test.ts` = 12/12 passing.

### Deviations
- Migration created via `migrate diff` + `db execute` + `migrate resolve` instead of `migrate dev`, per PO decision, due to shared-dev-DB drift from the held branches. Semantically identical result; history now matches without a reset.
- Copied main repo `.env` (and `.env.local`) into the worktree (both gitignored — not committed) so `DATABASE_URL` resolves for prisma / `npm run dev`.

### Open risks
- The 3 held-branch migrations remain in the shared dev DB but absent from this branch's local migrations dir. `migrate status` currently reports clean, but a future `migrate dev` on this branch could re-surface the drift until those branches merge to main. Not a Phase 1 blocker.
- Legacy projects with no `aiBaseline`: first save will freeze current (possibly already-edited) text as baseline — a Phase 2 concern, noted in the plan's Unresolved questions.

## Phase 2 — Server-side baseline freeze + delta capture in saveDraft

### Files changed
- `src/lib/editDelta/capture.ts` (new) — `extractElementText`, `collectElements`, `computeNextBaseline`, `captureEditDeltas` + the parity-invariant documentation comment.
- `src/lib/editDelta/capture.test.ts` (new) — 20 vitest cases incl. the parity fixture.
- `src/app/api/saveDraft/route.ts` — wired baseline freeze + delta capture.
- `src/lib/admin.ts` — added exported `isAdminClerkId(clerkId)` (delegates to existing `isAdmin`; no `requireAdmin` change).

(Not mine: `docs/task/data-capture.plan.md` carries a pre-existing uncommitted 1-line progress-log edit from Phase 1 — SHA backfill `pending-sha → 29efec07` — left untouched.)

### PARITY EVIDENCE — the two element serializations found (statically traced)
- **Freeze side** — `finalContent.content[id].elements` (`finalize.ts:76` `elements = copy[type].elements`; multipage merge `multiPageAssembly.ts:423` `sec.elements[field] = value`). After `parseAiResponse` (`result.content[key] = processedElement.value`, parseAiResponse.ts:530) each value that actually reaches finalContent is a plain **`string`** (headline/subheadline/…) or **`string[]`** (pipe/collection fields, e.g. `feature_titles`). `form_id` etc. are plain strings. The `SectionCopy.elements` *type* (generation.ts:387) also admits `{ value, needsReview }` (ElementValueReview) and `Record<string,unknown>[]`, but those don't survive the parser into finalContent.
- **Diff side** — editor store `export()` (`persistenceActions.ts:569` → `autoSaveDraft.ts:155`). `SectionData.elements` (content.ts:129) is the **V2 direct format**: `contentActions.ts:306` writes `elements[key] = <string>` and list writes keep `<string[]>` — no wrapper. So the common path is ALSO `string | string[]` ⇒ parity holds trivially. The legacy flattened→legacy rebuild (`flattenedState.ts:256`) can emit `{ content, type, isEditable }` wrappers.
- **How the extractor unifies them:** `extractElementText` normalizes BOTH to one string — `string`→as-is, `string[]`→join `'\n'`, `{ content }`→recurse `.content` (legacy editor wrapper), `{ value }`→recurse `.value` (defensive, freeze-side review wrapper), everything else/empty→`null` (skipped). Because the SAME extractor runs on both the frozen baseline text and the current export text, differing wrappers are harmless as long as inner strings match. Proven by the automated parity fixture: a generate-copy-shaped section and its editor-export-shaped equivalent (incl. one `{ content }`-wrapped field + array field) `collectElements` to identical `{elementKey → text}` maps ⇒ `captureEditDeltas` writes ZERO upserts.

### What was wired in saveDraft
- Extended the `findUnique` select with `aiBaseline`, `templateId`, `audienceType`. **Owner clerkId NOT selected** — `assertProjectOwner` guarantees the saver is the project owner (or first-writer orphan-claim), so the authed `clerkId` already equals the owner's clerkId; `isFounderEdit = isAdminClerkId(clerkId)`. Cheapest option, documented in code.
- Read `body.aiBaselinePatch` from the RAW body (same pattern/comment as `baseline`; `DraftSaveSchema` untouched).
- Compute next baseline when `finalContent` OR a patch is present; write the `aiBaseline` column in BOTH upsert branches **only when `changed === true`** (skips large-JSON rewrites on no-op autosaves). Patch-only saves still merge + persist.
- After the upsert: `captureEditDeltas` in try/catch that logs-and-continues (`logger.warn`) — a capture failure never fails the autosave. Only invoked when `finalContent` produced collected elements. Effective `templateId = body.templateId ?? stored ?? null`; `audienceType = stored ?? null`.

### Key decisions / deviations
- `collectElements` single-walk: walks `pages[*].content` when `pages` is present & non-empty, ELSE top-level `content` — never both (avoids double-processing home on multipage). Global-unique section IDs ⇒ no page nesting in the baseline. Empty-skeleton pages (`content: {}`) yield nothing; `localeContent` (top-level i18n overlay) is never walked; a `META_KEYS` guard defensively skips non-section top-level keys if a flattened blob is ever passed.
- `EditDeltaPrisma` mock interface uses `any` (not `unknown`) arg types so the real Prisma client's precisely-typed `upsert`/`deleteMany` stay assignable (arg contravariance). Conservative in-scope call.
- `extractElementText` also unwraps `.value` (beyond the plan's `.content`): the freeze-side type explicitly allows `{ value, needsReview }`, so covering it improves parity robustness at zero risk. Logged here per the in-scope-ambiguity rule.
- Revert cleanup: one `deleteMany` over all at-baseline keys (idempotent; deletes 0 when no row exists), only when candidates exist.

### Verification results
- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx` `@/assets/images/founder.jpg` error; zero errors from the new/edited files.
- `npx vitest run src/lib/editDelta/capture.test.ts`: 20/20 pass.
- `npm run test:run`: 2142 passed / 3 skipped; the ONLY failure was the known env-flake `src/lib/i18n/i18nHonesty.test.ts` (its `generateStaticHTML` case hitting the hard 5000ms `testTimeout` under full-suite load). Confirmed environmental: with my `saveDraft`/`admin` edits stashed it passed in 2.86s, and with them restored it passed again (2.85s) — that test does not import any file I touched; the timeout is pure machine-load timing variance.

### Deferred to the final human gate (Phase 4 gate)
- **Live-dev zero-row acceptance check** (`npm run dev` → fresh real-LLM generate → no edits → autosave → 0 EditDelta rows via SQL) is intentionally NOT run here. The automated parity fixture in `capture.test.ts` is the rigorous proof of the invariant for Phase 2; the live end-to-end check remains pending for the final gate.

### Post-review follow-up (demo-token skip)
- **Demo-token capture skip added** (reviewer follow-up): the `lessgodemomockdata` demo path bypasses `assertProjectOwner` but previously still ran freeze + capture on the shared demo project — dataset noise. Guard: the baseline-compute block now gates on `!isDemo && (finalContent || aiBaselinePatch !== undefined)`. Because `nextAiBaseline` stays `undefined` when skipped, both the `aiBaseline` column write (`aiBaselineChanged` stays false) and `captureEditDeltas` (guarded by `nextAiBaseline && collectedElements.length > 0`) are naturally bypassed — one condition, no other change. `tsc` clean (only the known `founder.jpg` error); `capture.test.ts` 20/20 still pass.

### Accepted non-blocking items (NOT fixed — deliberate, beta-acceptable)
- **Revert `deleteMany` OR-fan-out:** on a fresh unedited page every at-baseline element becomes a revert candidate → one `deleteMany` with a large `OR` list per autosave (deletes 0 rows). Minor perf only, bounded by page element count (~tens); acceptable for beta volume.
- **`aiBaselinePatch` raw cast unvalidated:** read from raw body and cast (like the existing `baseline`/`brief` passthroughs). It is owner-scoped (post-`assertProjectOwner`) and defensively filtered inside `computeNextBaseline` (only `typeof val === 'string'` entries merge), so a malformed patch can't corrupt the baseline — consistent with the existing raw-body pattern. No schema change.

### Open risks
- Element shapes not covered by `extractElementText` (number/boolean values, object-array card structures) get no baseline and are silently excluded from capture — matches the plan (text-only). No corruption risk (same on both sides).
- Legacy projects with no `aiBaseline` freeze current (possibly already-edited) text as baseline on first post-deploy save (plan Unresolved question — accepted for minimum build).

## Phase 3 — Regen re-freeze plumbing + regen PostHog events

### Files changed
- `src/types/store/state.ts` — added `aiBaselinePatch` state field + `queueAiBaselinePatch` / `clearShippedAiBaselinePatch` action-type signatures to `PersistenceSlice` (colocated with `baseline`/`baselineDirty`; `EditStore extends StoreState` ⇒ methods land on the store type).
- `src/stores/editStore.ts` — `aiBaselinePatch: null` initial state (in `createInitialState`, beside `baseline`); the two action implementations in the "Token-specific actions" inline block.
- `src/hooks/editStore/aiActions.ts` — regen re-freeze queue calls + the 2 PostHog emits + module-scoped attempt counters + `trackRegen` helper.
- `src/utils/autoSaveDraft.ts` — ship `payload.aiBaselinePatch` (deep snapshot) in the baseline ship block; selective clear on save success.
- `src/hooks/editStore/persistenceActions.ts` — **UNTOUCHED** (see below).

### Patch queue / ship / clear wiring
- **Queue (aiActions.ts).**
  - `regenerateSection` success: after `data.content` is applied, read the applied `content[sectionId].elements` back from `get()`, normalize each with `extractElementText` (imported from `@/lib/editDelta/capture` — the SAME server extractor, so the re-frozen string is byte-identical to the server-side diff's `collectElements` output), and `queueAiBaselinePatch(sectionId, normalized, 'replace')`. Runs BEFORE the `completeSaveDraft` autosave so the patch ships in that save.
  - `regenerateElementWithVariations`: emits `element_regenerated` on the REQUEST (variations returned); no re-freeze here (per plan).
  - `applyVariation` (accept): `queueAiBaselinePatch(sectionId, { [elementKey]: variation })` — element-level merge; `variation` is already a string (normalized). Rides the autosave triggered by `updateElementContent`.
  - `queueAiBaselinePatch(sectionId, elements, mode='merge')`: `mode='replace'` (section regen) overwrites the section's queued map; `mode='merge'` (default, element accept) layers one element in. Filters to string values only. The optional `mode` param is the faithful implementation of plan step 3's "section-level replace, element-level merge" (the two call sites need distinct semantics; a single unconditional merge would leave orphaned keys on section regen, a single unconditional replace would drop a prior element-accept in the same section between saves).
- **Ship (autoSaveDraft.ts).** In the same `try` block as the `baseline` ship: if `aiBaselinePatch` is non-empty, `JSON.parse(JSON.stringify(...))` deep-snapshots it into a function-scoped `shippedAiBaselinePatch` and assigns the snapshot to `payload.aiBaselinePatch`. The deep snapshot is the crux — a `queueAiBaselinePatch` that lands after this read (immer produces a fresh object, but the snapshot is fully detached regardless) cannot mutate either what we ship or what we later clear.
- **Selective clear (deep-equal).** On the save-success path only (the `catch` returns without clearing → failure re-ships the whole accumulator), `clearShippedAiBaselinePatch(shippedAiBaselinePatch)` iterates the shipped snapshot's sections; for each, if the CURRENT accumulator section exists and deep-equals the shipped section (same key set + identical string values), it `delete`s that section; otherwise it survives. When the accumulator empties it is set to `null`. A section overwritten after the snapshot (regen-B while save-A in flight) has a different value ⇒ survives ⇒ ships on the next save. This is the exact anti-corruption guarantee: never blanket-clear, so no section's re-freeze is dropped and no regen masquerades as a giant user edit vs a stale baseline.

### persistenceActions.ts left untouched (deliberate)
The clear-after-save hook belongs in `autoSaveDraft.ts` (where the snapshot lives), NOT in `persistenceActions.save()`. Regen paths save via `completeSaveDraft` → `autoSaveDraft` (section regen calls it explicitly; element accept goes through `updateElementContent`'s autosave). `persistenceActions.save()` is a separate payload builder that does not ship (and never clears) `aiBaselinePatch`; if a save happens to go through it while a patch is queued, the patch is simply NOT dropped (never blanket-cleared) and ships on the next `autoSaveDraft` save. No data loss, so no edit needed there — matches the plan's "ONLY if the clear hook belongs there, else leave untouched".

### Same-store-instance evidence
Mirrors the proven `baseline`/`baselineDirty` round-trip through these exact files:
- **State** added in `editStore.ts` `createInitialState` + inline actions → part of the single token-scoped store instance built by `createEditStore(tokenId)`.
- **Queue** in `aiActions.ts` uses the store's own `get()` (the immer closure's getter) — definitionally the same instance the actions belong to. The autosave it triggers is keyed by `currentState.tokenId` (that same store's tokenId).
- **Ship + clear** in `autoSaveDraft.ts` resolve the store via `storeManager.getEditStore(tokenId).getState()` — the identical accessor the working `baseline` read (L184) and `markBaselineSaved()` clear (L289) already use. `storeManager.getEditStore` returns the per-token singleton, so the same `tokenId` yields the same instance the queue wrote to. Since `baseline` (which uses this identical wiring across all three files) already ships and clears correctly in Phase 1/2, `aiBaselinePatch` inherits the same guarantee.

### PostHog events (props + sources)
- `section_regenerated` `{ sectionType, attemptNumber, templateId, audienceType }` — emitted in `regenerateSection` success after the re-freeze. `sectionType` = `sectionId.split('-')[0]` (in scope as `sectionType`); `attemptNumber` from module-scoped `sectionAttempts` Map keyed `${sectionId}`; `templateId`/`audienceType` from the edit-store meta (`get().templateId`/`.audienceType`, same token-scoped store).
- `element_regenerated` `{ sectionType, elementKey, attemptNumber, templateId, audienceType }` — emitted in `regenerateElementWithVariations` after the variations response (the REQUEST). `attemptNumber` from `elementAttempts` Map keyed `${sectionId}.${elementKey}`; other props from store meta.
- Both via `trackRegen(event, props)` — a fire-and-forget wrapper (`posthog.capture` in try/catch, pattern from `src/utils/trackEdit.ts`) so a posthog failure never breaks a regen. `posthog-js` statically imported (same as `trackEdit.ts`); these actions only execute client-side.

### Deviations / judgment calls (in-scope)
- **`mode` param on `queueAiBaselinePatch`** (see above) — added to faithfully implement "section-level replace, element-level merge"; the plan's shorthand signature `(sectionId, elements)` is extended with an optional `mode?: 'replace'|'merge'` (default merge). Section regen passes `'replace'`.
- **`applyVariation` re-freezes unconditionally** (including index 0 = "keep current"). Implemented per the plan's explicit instruction (`applyVariation → queueAiBaselinePatch(sectionId, { [elementKey]: variation })`, no index guard). NUANCE noted for the human gate: index 0 is the current (possibly user-edited) content prepended by `regenerateElementWithVariations`; accepting it re-freezes the baseline to the current text, which would zero out a prior EditDelta for that element. This is defensible (the user actively re-selected that text) and matches the plan literally; flagging it in case the PO wants an index-!==-0 guard later.

### Verification results
- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx` `@/assets/images/founder.jpg` error; zero errors from the changed files.
- `npm run test:run`: GREEN — 140 files passed / 1 skipped; 2143 tests passed / 3 skipped. No failures (the known `i18nHonesty` env-flake passed this run; no re-run needed).

### Deferred / not done
- **Focused `clearShippedAiBaselinePatch` deep-equal unit test NOT added.** None of Phase 3's Files-touched are test files, and creating a new test file is outside the phase's Files-touched list (hard scope rule). Noted per the task's "or note why not". The deep-equal selective-clear logic is small and fully described above; recommend the orchestrator authorize a follow-up micro-scope (`src/hooks/editStore/aiBaselinePatch.test.ts`) to add the queue-A → snapshot-A → queue-B → clear(A) ⇒ B-survives/A-gone assertion as the automated race proof.
- Live regen→save re-freeze check + two-regens-in-flight race check + PostHog debug prop check: DEFERRED to the final human gate (no browser run attempted), per task.

### Open risks
- Index-0 variation-accept re-freeze (see Deviations) can erase a prior edit delta — accepted per plan, flagged for PO.
- `attemptNumber` is session/in-memory (module-scoped Map) — resets on reload; acceptable per plan (reasons inferred from inter-attempt deltas later).

### Phase 3 follow-up (coordinator-authorized, post-review)
Two small additions authorized by the coordinator after Phase 3 passed review:

1. **New test file `src/hooks/editStore/aiBaselinePatch.test.ts`** (coordinator authorized this single scope-expansion) — drives the REAL token-scoped store (`createEditStore('tok-aibp')`, same pattern as `setItemAlt.test.ts`) so it exercises the actual `queueAiBaselinePatch` / `clearShippedAiBaselinePatch` implementations (not a reimplementation). 9 cases proving:
   - (a) queue A → ship snapshot(A) → queue B (other section) → `clearShipped(A)` ⇒ B survives, A gone (the in-flight-race guarantee).
   - (b) ship(A `{headline:'v'}`) → re-queue same section `{headline:'v2'}` (replace) → `clearShipped(A)` ⇒ A' survives (deep-equal fails).
   - (b2) element-level merge into a shipped section (adds a key) also defeats deep-equal ⇒ that section survives whole.
   - (c) save FAILURE (clear never called) ⇒ A retained for re-ship.
   - clearing the last matching section ⇒ accumulator back to `null`.
   - matching section dropped while a non-shipped section is kept; `clearShipped(null/undefined/{})` no-ops; `replace` overwrites vs `merge` layers.
   This is the automated regression guard for the feature's core corruption-prevention mechanism (previously inspection-only). `npx vitest run src/hooks/editStore/aiBaselinePatch.test.ts` → 9/9 pass.

2. **Cast cleanup** — dropped the two `(get() as any).queueAiBaselinePatch(...)` casts in `aiActions.ts` (section regen + `applyVariation`), now `(get() as EditStore).queueAiBaselinePatch(...)` since the method is typed on `PersistenceSlice`. `EditStore` cast retained (that's the store's own type; `get()` is untyped `any` in the factory closure). tsc stays clean.

**Verification (follow-up):**
- `npx tsc --noEmit`: only the known `src/app/page.tsx` `founder.jpg` error; nothing from the new test or cast changes.
- `npx vitest run src/hooks/editStore/aiBaselinePatch.test.ts`: 9/9 pass.
- `npm run test:run`: 141 files passed / 1 failed / 1 skipped — 2151 passed / 1 failed / 3 skipped. The single failure is the known env-flake `src/lib/i18n/i18nHonesty.test.ts` (`generateStaticHTML` hitting the 5000ms `testTimeout` under full-suite load) — re-ran ISOLATED and it passed 15/15 in 3.72s. No NEW failures introduced; the new `aiBaselinePatch.test.ts` passed within the full run.

Files changed in this follow-up: `src/hooks/editStore/aiBaselinePatch.test.ts` (new), `src/hooks/editStore/aiActions.ts` (cast cleanup only).

## Phase 4 — Failure telemetry (PostHog)

### Files changed
- `src/utils/trackTelemetry.ts` (new) — `trackFailure(event, props)` fire-and-forget wrapper + `failureEventName(message)` parse/generation classifier.
- `src/modules/wizard/generation/thing.ts` — 4 emit sites (product strategy + 3 copy branches).
- `src/modules/wizard/generation/trust.ts` — 3 emit sites (service strategy + 2 copy branches).
- `src/app/onboarding/[token]/components/EntryInputStep.tsx` — 2 `scrape_failed` emit sites (server-error branch + network catch) + `hostOf()` hostname helper.

### Server error codes VERIFIED (and how each maps to the event NAME)
Key finding: **the audience routes never return a literal `parse_failed` error CODE.** The `error` field is `generation_failed` / `ai_error` / `internal_error`; a parse/schema failure surfaces ONLY inside the `message`. So the parse-vs-generation split is a **message-signature** decision, not a code decision (documented in `trackTelemetry.ts`).

Exact codes found:
- **product generate-copy** (`route.ts` L247-257): `error: 'generation_failed'`, `message: lastError` (the AI-loop error). Outer catch L305-316: `error: 'internal_error'`.
- **service generate-copy** (`route.ts` L198-208): `error: 'generation_failed'`, `message: lastError`. Outer catch L254+: `error: 'internal_error'`.
- **product strategy** (`route.ts` L179-190): AI-call catch → `error: 'ai_error'`, `message: aiError.message`. Outer catch L232-237: `error: 'internal_error'`. Also `validation_error` (L95), `unauthorized` (L105).
- **service strategy** (`route.ts` L143 region): `error: 'ai_error'`; outer catch `error: 'internal_error'`; `validation_error`/`unauthorized`.
- The AI-loop `message` originates in `src/lib/aiClient.ts` `generateRawJson`: `'No JSON found in response'` (L234), native `JSON.parse` SyntaxErrors (contain "JSON" / "Unexpected token"), or a zod `schema.parse` ZodError (message is a JSON issues array, i.e. starts with `[`).

**Event-name mapping (`failureEventName`)** — `reason` prop always carries the server `error` code (or `message` fallback); the event NAME is chosen by the message:
- message matches `/no json found|json|unexpected token/i` OR starts with `[` (zod issues array) → **`parse_failed`**.
- otherwise (generic `'AI generation failed'`, `'Failed to generate copy after multiple attempts'`, `'Empty response from Claude'`, network errors, etc.) → **`generation_failed`**.
- The generic generation fallbacks were checked to contain NONE of the parse markers, so the split is precise. Regex `/json/i` is safe because no non-parse fallback message contains "json".

### Emit sites + props
All emits are placed AFTER the `isCreditFail` early-return and BEFORE the existing `throw`/`return` — side-effect-only, control flow unchanged.

**thing.ts (product, `audienceType: 'product'`):**
1. `runStrategy` inline failure branch — `failureEventName(json.message)`; `{ reason: json.error ?? json.message ?? null, stage: 'strategy', templateId: input.templateId ?? null, audienceType: 'product' }`.
2. `runFanOut` per-page copy loop — `{ reason, stage: 'copy', templateId: resolvedTemplateId, audienceType: 'product', pageKey: page.archetypeKey }`.
3. `runCollectionFanOut` `generateItemCopy` (DORMANT — no product template declares a collection capability) — same shape, `pageKey: plan.pageKey`.
4. `runCopyAndSave` single-page copy — `{ reason, stage: 'copy', templateId: resolvedTemplateId, audienceType: 'product' }`.

**trust.ts (service, `audienceType: 'service'`):**
5. `runTrustStrategy` inline failure — `{ reason, stage: 'strategy', templateId: input.templateId ?? null, audienceType: 'service' }`.
6. `runTrustGeneration` single-page copy — `{ reason, stage: 'copy', templateId: input.templateId ?? null, audienceType: 'service' }`.
7. `runCollectionFanOut` `generateItemCopy` (DORMANT) — `{ reason, stage: 'copy', templateId: input.templateId ?? null, audienceType: 'service', pageKey: plan.pageKey }`.

**EntryInputStep.tsx (`scrape_failed`):**
8. Server-error branch (`!res.ok || !json.success || !json.briefDraft`) — `{ reason: json.error ?? json.message ?? null, provider: json.provider ?? null, sourceUrl_host: hostOf(normalizedUrl), audienceType: null, templateId: null }`. Guarded by `res.status !== 402` (defensive; these v2 routes have no 402/credit branch anyway).
9. Network `catch` — `{ reason: 'network_error', provider: null, sourceUrl_host: hostOf(normalizedUrl), audienceType: null, templateId: null }`.

`sourceUrl_host` is **hostname only** (`new URL(url).hostname` via `hostOf`, try/catch-guarded) — never the full URL (privacy). For the text/`understand` path `normalizedUrl` is null ⇒ host null.

### Credit-failures EXCLUDED — confirmed
- Every generation/copy emit sits AFTER `if (isCreditFail(res.status, json?.error)) return { status: 'credits' }`, so credit/insufficient-credit failures never emit. No emit was added to any credit branch.
- The save-draft failure branches (`'Could not save the draft.'`) are NOT generation/parse failures and get NO emit (out of the event table's scope).
- The v2 scrape/understand routes have **no credit-blocking branch** (credits consumed post-hoc, warn-only per `route.ts` L306/213), so no credit exclusion applies there; a defensive `res.status !== 402` guard is included regardless.

### Deviations (in-scope judgment calls)
- **No server `parse_failed` code exists** — plan assumed a distinct code in the parse-catch branches. Verified there is none (codes are `generation_failed`/`ai_error`/`internal_error`). Conservative resolution: route the event NAME by the VERIFIED message signature while keeping `reason` = the real server code. Documented inline in `trackTelemetry.ts`.
- **`scrape_failed.audienceType = null`** — the unified entry step runs before the serve gate resolves an audience; `EntryInputStep` has no audience in scope (props are only `onSuccess`). Passing null is the honest, corruption-free value (vs guessing from the url/text endpoint choice, which does not equal audience in the unified wizard). templateId also null (per plan).
- **`provider` is always null in practice** — verified neither v2 route returns a `provider` field; `json?.provider` reads defensively (plan: "when present") and yields null.
- **Emit placed at the inline `!res.ok || !json.success` branch, not the outer catch** — that is the single point where BOTH the server `error` code (for `reason`) and `message` (for the parse split) are in scope, giving exactly one emit per server-reported failure with full data. The surrounding catch (which only sees a generic re-thrown/network message) does NOT re-emit, avoiding double-emits. Genuine transport errors reaching the catch are not server-reported generation failures and intentionally do not emit in the wizard adapters (EntryInputStep's catch DOES emit `scrape_failed` with `reason: 'network_error'` per the plan's explicit "error branches" instruction).

### Verification results
- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx` `@/assets/images/founder.jpg` error; zero errors from the new/edited files.
- `npx vitest run src/modules/wizard`: 5 files / 69 tests pass (thing/trust adapter tests unaffected — emits are side-effect-only).
- `npm run test:run`: GREEN — 141 files passed / 1 skipped; 2152 passed / 3 skipped. No failures (the known `i18nHonesty` 5s env-flake did not surface this run).

### Deferred to the final human gate
- Live emit checks (force a scrape failure with a bogus URL → `scrape_failed` in PostHog debug; code-review the generation failure branches). The exact code→event mapping above lets the gate verify: a real AI JSON-parse/schema failure ⇒ `parse_failed`; a generic/empty/network generation failure ⇒ `generation_failed`.

### Open risks
- Parse classification is message-signature based (no server code); if a future aiClient change alters the throw message wording, a parse failure could be miscounted as `generation_failed`. Bounded — `reason` still carries the true server code for later SQL/analysis reclassification.
- `posthog-js` is statically imported by `trackTelemetry.ts` (client-only). Consumers (`thing.ts`/`trust.ts` run by `GeneratingSlot`, `EntryInputStep` a client component) are all client-side and never imported by a published renderer, so the boundary holds — same as `trackEdit.ts` / the phase-3 `trackRegen`.

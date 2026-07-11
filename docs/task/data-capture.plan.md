# Data Capture — Implementation Plan

- **Branch:** `feature/data-capture`
- **Worktree:** `C:\Users\susha\lessgo-ai\.claude\worktrees\feature-data-capture`
- **Spec:** `docs/task/data-capture.spec.md` — **"Build NOW" scope only** (items 1–3 + Prisma migration). Items 4–6 (prefill acceptance, structural edits, funnel config) and public-beta analysis are **deferred** — not planned here.

## Overview

Build the minimum data-capture layer before private beta: (1) an `EditDelta` table recording "AI wrote X, user changed it to Y" per element, fed by a server-side diff in the auto-save path against a frozen AI baseline; (2) PostHog regen events (`section_regenerated`, `element_regenerated`) as explicit AI-failure votes; (3) PostHog failure telemetry (`generation_failed`, `parse_failed`, `scrape_failed`). No UI, no admin viewer, no dashboards — query via SQL.

## Progress log

- phase 1 Prisma migration + edit-distance util: done (review loops 1, ship; migration applied via db-execute + migrate-resolve due to held-branch shared-DB drift; commit 29efec07)
- phase 2 server-side baseline freeze + delta capture in saveDraft: done (review loops 1, ship; parity invariant traced end-to-end + holds; demo-token capture skip added; commit 3720a0a8)
- phase 3 regen re-freeze plumbing + regen PostHog events: done (review loops 1, ship; pinned deep-equal selective clear + 9/9 race unit test; boundary-safe capture import; commit c8563db9)
- phase 4 failure telemetry (PostHog): done (review loops 1, ship; message-signature parse/generation split, reason carries true code; credit-fails excluded; hostname-only privacy; commit pending-sha)

## Coordination constraints (from PO — non-negotiable)

1. **This track OWNS the Prisma migration.** Among the parallel tracks (template-factory, tracking-pixels, app-subdomain, data-capture), this is the ONLY one allowed to run `npx prisma migrate dev` against the shared dev DB. The EditDelta table + baseline column migration is created HERE via `prisma migrate dev` (never `db push`).
2. Deps in this worktree came from a real `npm install` (no node_modules junction) — Prisma client resolves correctly. Do NOT re-create a junction; no other action needed.

## Resolved spec questions (decisions — final, do not reopen)

- **Q1 — baseline storage: new dedicated `Project.aiBaseline Json?` column.** It is a different concept from the existing `content.baseline` (editor-header Reset snapshot, whole-page immutable export with its own dirty-flag lifecycle) — colocating them invites merge-rule collisions in saveDraft's already-delicate `content` spread logic; a sibling column is independently readable/wipeable and keeps the hot `content` JSON untouched. Shape: flat `{ [sectionId]: { [elementKey]: string } }` (section IDs are `${type}-${uuid}` — globally unique, so multi-page needs no pageKey nesting). **Baseline values are stored as NORMALIZED strings** (output of `extractElementText`, see parity invariant below) — never raw element objects.
- **Q2 — diff cadence / row volume: diff on every save, but UPSERT with unique key `(projectToken, sectionId, elementKey)`** (`@@unique` in Prisma). Latest state wins; row count is bounded by the number of currently-edited elements per project (~tens), not by save count, so the 1s trailing debounce is harmless. Elements reverted to exactly the baseline get their row deleted → the table always equals "current divergence from latest AI attempt".
- **Q3 — founder edits: capture everything, flag with `isFounderEdit Boolean @default(false)` on EditDelta**, derived at write time in saveDraft from the project owner's clerkId ∈ `ADMIN_CLERK_IDS`. One boolean = trivial SQL filter later; excluding at capture would permanently lose the founder's ~5 dogfood pages, which are useful data too.

## Architecture decisions (explicit)

- **Where baseline freeze happens: server-side in `/api/saveDraft`, two mechanisms, no new endpoint.**
  1. **Initial freeze = additive first-sight freeze.** The generation fan-out (`src/modules/wizard/generation/thing.ts` product / `trust.ts` service) persists each page via saveDraft (`saveFC`) *before the user can edit*. So in saveDraft: any `(sectionId, elementKey)` present in incoming `finalContent` but absent from stored `aiBaseline` is frozen with its current value. Zero client changes for initial gen; also correctly *excludes* user-added sections/elements from delta capture (no AI baseline → no delta — which is what we want).
  2. **Regen re-freeze = explicit client patch.** Server-side inference can't distinguish regen from a user edit, and the client holds the exact regen output at apply time. Client queues `aiBaselinePatch: { [sectionId]: { [elementKey]: string } }` in the edit store (rides the same ship block as the existing `baseline` pattern, `src/utils/autoSaveDraft.ts` L178-190); saveDraft deep-merges the patch over `aiBaseline` (patch wins over additive freeze). Section regen patches the whole section; element-variation accept patches one element.
- **Empty-skeleton fact (reviewer-verified — do not re-flag):** the multipage skeleton save (`buildMultiPageSkeleton`) persists pages with `content: {}` — no elements — so the additive freeze finds nothing to freeze until real copy lands via `mergePageIntoFinalContent`. No placeholder/skeleton text can enter the baseline.
- **⚠️ ELEMENT-SHAPE PARITY INVARIANT (blocking — dataset integrity hinges on this).** Freeze side and diff side see DIFFERENT serializations of the same element:
  - *Freeze side:* wizard `finalContent` carries the raw generate-copy shape (`content[id].elements = copy[type].elements`, `finalize.ts` ~L76) — e.g. `elements.headline = "X"` or `string[]`.
  - *Diff side:* editor `export()` (`src/utils/autoSaveDraft.ts` L155) — a different code path that may normalize elements on load (e.g. `{ content: "X", type, isEditable, ... }` objects, nested card shapes).
  `extractElementText` MUST normalize BOTH shapes to the IDENTICAL string, else every row's `aiText`/`userText` come from mismatched serializations → dataset silently corrupted at the source. Implementer must inspect BOTH shapes (generate-copy response → wizard finalize/merge output, AND editor store `export()` after a loadDraft round-trip) and cover both in the extractor + tests. **Mandatory acceptance check (Phase 2 verification):** for an unedited freshly-generated element, normalized baseline text `===` normalized editor-export text ⇒ editDistance 0 ⇒ NO EditDelta row written.
- **Where the diff runs: server-side in `saveDraftHandler`**, after the merged `aiBaseline` is computed and the Project upsert succeeds. Compares normalized `finalContent` element text vs `aiBaseline`, writes only changed elements. Wrapped in try/catch — **a delta-capture failure must NEVER fail an autosave** (same conservatism as the existing `brief` passthrough comment at route L117-122).
- **Failure telemetry: client-side `posthog-js` only** (pattern: `src/utils/trackEdit.ts`). No `posthog-node` — server capture adds a dependency + flush-on-serverless complexity for zero extra signal, since every failure already surfaces to a client as an error response.

### PostHog event table (exact emits)

| Event | Props | Emit site |
|---|---|---|
| `section_regenerated` | `sectionType, attemptNumber, templateId, audienceType` | `src/hooks/editStore/aiActions.ts` → `regenerateSection` success path (~L97+, after content applied) |
| `element_regenerated` | `sectionType, elementKey, attemptNumber, templateId, audienceType` | `aiActions.ts` → `regenerateElementWithVariations` success (~L311+) |
| `generation_failed` | `reason` (server `error`/`message` code), `stage: 'strategy'\|'copy'`, `templateId, audienceType, pageKey?` | `thing.ts` copy-loop error branches (~L460-462, L491-493) + strategy failure branch; mirrored in `trust.ts` |
| `parse_failed` | same as above | same sites — emitted **instead of** `generation_failed` when the server error code indicates a parse failure (implementer: verify exact error strings in `audience/{product,service}/generate-copy/route.ts` parse-catch branches, product ~L238/247-257, service ~L189/198-208) |
| `scrape_failed` | `reason, provider, sourceUrl_host, audienceType` (no templateId yet at scrape time — pass `null`) | `src/app/onboarding/[token]/components/EntryInputStep.tsx` — error branches of `/api/v2/scrape-website` + `/api/v2/understand` calls |

`templateId`/`audienceType` on regen events come from the edit store meta (same token-scoped store the actions run in). `attemptNumber` = module-scoped in-memory counter in `aiActions.ts` keyed `${sectionId}` / `${sectionId}.${elementKey}` (session-scoped is fine; the spec infers reasons later from inter-attempt deltas anyway).

---

## Phase 1 — Prisma migration + edit-distance util (foundation)

**Files touched**
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_data_capture_edit_delta/migration.sql` (generated by `migrate dev`)
- `src/lib/editDelta/editDistance.ts` (new)
- `src/lib/editDelta/editDistance.test.ts` (new)

**Steps**
1. Schema: add `aiBaseline Json?` to `Project`. Add model:
   ```prisma
   model EditDelta {
     id           String   @id @default(cuid())
     projectToken String
     project      Project  @relation(fields: [projectToken], references: [tokenId], onDelete: Cascade)
     sectionId    String
     sectionType  String
     elementKey   String
     aiText       String
     userText     String
     editDistance Int
     templateId   String?
     audienceType String?
     isFounderEdit Boolean @default(false)
     createdAt    DateTime @default(now())
     updatedAt    DateTime @updatedAt
     @@unique([projectToken, sectionId, elementKey])
   }
   ```
   (Add the back-relation `editDeltas EditDelta[]` on `Project`.)
   Notes: `audienceType` is **nullable** — legacy Project rows can carry null; a required column would make the insert throw inside the swallowed capture try/catch → silent capture loss for exactly those pages. NO separate `@@index([projectToken])` — redundant with the leftmost column of the `@@unique`.
2. Run `npx prisma migrate dev --name data_capture_edit_delta`. **This is the migration-owning track** — the only parallel worktree permitted to touch the shared dev DB. Do not `db push`.
3. `src/lib/editDelta/editDistance.ts`: bounded Levenshtein — `editDistance(a: string, b: string): number`; identical → 0; if either input > 2000 chars, compute on the first 2000 + add `abs(lengthDiff)` for the tail (keeps O(n·m) bounded). Plain module, no `'use client'` (server-consumed).
4. Unit tests: identity, insert/delete/replace basics, unicode, the >2000-char cap path.

**Verification**
- `npx prisma migrate dev` applies cleanly; `npx prisma generate` succeeds.
- `npx tsc --noEmit` green; `npm run test:run` green (new editDistance tests pass).

**HUMAN GATE** — migration hit the shared dev DB; user eyeballs the generated SQL + confirms other worktrees still operate before phase 2.

---

## Phase 2 — Server-side baseline freeze + delta capture in saveDraft

**Files touched**
- `src/lib/editDelta/capture.ts` (new)
- `src/lib/editDelta/capture.test.ts` (new)
- `src/app/api/saveDraft/route.ts`
- `src/lib/admin.ts` (export `isAdminClerkId(clerkId): boolean` helper — parses `ADMIN_CLERK_IDS`, no behavior change to `requireAdmin`)

**Steps**
1. **Shape verification FIRST (parity invariant — blocking).** Before writing the extractor, inspect and document (code comment in `capture.ts`) BOTH serializations of an element:
   - freeze side: generate-copy `sections` → wizard merge (`mergePageIntoFinalContent` / `finalize.ts` ~L76) → `finalContent.content[id].elements`;
   - diff side: editor store `export()` after a loadDraft round-trip (`src/stores/editStore.ts`).
   Any shape found here that the extractor below misses must be added before wiring.
2. `capture.ts` (plain server module) exports:
   - `extractElementText(el: unknown): string | null` — normalizes BOTH shapes to the identical string: string → as-is; `{ content }` editor-element object → recurse on `.content`; `string[]` → join `'\n'`; other/empty → `null` (skipped).
   - `collectElements(finalContent): Array<{ sectionId, sectionType, elementKey, text }>` — walks BOTH single-page `finalContent.content` and multi-page `finalContent.pages[*].content`; sectionType = id prefix before first `-`; tolerates empty-skeleton pages (`content: {}` → no entries); **skips** `finalContent.localeContent` (i18n overlay — out of scope) and chrome/meta keys.
   - `computeNextBaseline(stored, collected, patch)` — additive first-sight freeze (stores NORMALIZED text) + deep-merge of `aiBaselinePatch` (patch wins). Returns `{ next, changed: boolean }`.
   - `captureEditDeltas({ prisma, tokenId, baseline, collected, templateId, audienceType, isFounderEdit })` — for each collected element WITH a baseline entry: differs → upsert (unique key from Q2) with `editDistance`, aiText/userText truncated to 20k chars; equals baseline → `deleteMany` for those keys (revert cleanup, only when candidate list non-empty). No baseline entry → skip.
3. `saveDraft/route.ts` wiring:
   - Extend the existing `findUnique` select (~L112-115) with `aiBaseline`, `templateId`, `audienceType`, `userId` (+ user clerkId via relation or a second cheap lookup — implementer picks the cheaper).
   - Read `body.aiBaselinePatch` from the RAW body (same pattern + comment style as `baseline`, ~L186-193; `DraftSaveSchema` strips unknown keys — do NOT modify the schema).
   - When `finalContent` present: compute next baseline; include `aiBaseline` in the existing upsert (create + update branches) **only when `changed === true`** — skip the column write when unmodified (avoids rewriting a large JSON on every 1s autosave; hot-path courtesy, one `if`). When only a patch arrives (no finalContent), still merge + persist it.
   - After the upsert: run `captureEditDeltas` inside try/catch; log-and-continue on failure (autosave must never fail because of capture). `isFounderEdit` = `isAdminClerkId(ownerClerkId)`.
   - Legacy projects with no `aiBaseline` and pre-existing edits: first save freezes current (already-edited) text as baseline → deltas start from there. Accepted for minimum build; note in code comment.
4. `capture.test.ts` (vitest, mock prisma): **parity fixture — a real generate-copy-shaped section AND its editor-export-shaped equivalent normalize to identical strings (unedited ⇒ 0 rows)**; additive freeze on first sight; patch overrides; changed element → upsert row with correct distance; reverted → delete; user-added element (no baseline) → no row; multi-page walk; empty-skeleton page (`content: {}`) → nothing frozen; localeContent skipped; capture throw doesn't propagate.

**Verification**
- `npx tsc --noEmit` + `npm run test:run` green.
- **Parity acceptance check (mandatory):** `npm run dev` → fresh generate → open editor → make NO edits → let an autosave fire → SQL: ZERO EditDelta rows (proves freeze-shape text === export-shape text for every element type on the page).
- Manual: then edit 2 elements → autosave → exactly 2 EditDelta rows, correct aiText/userText/editDistance; edit again → same 2 rows updated (no growth); revert one to original → row deleted; `Project.aiBaseline` populated with normalized strings.

---

## Phase 3 — Regen re-freeze plumbing + regen PostHog events

**Files touched**
- `src/types/store/state.ts` (add `aiBaselinePatch` state + action types)
- `src/stores/editStore.ts` (state: `aiBaselinePatch: Record<string, Record<string, string>> | null`; actions: `queueAiBaselinePatch(sectionId, elements)`, `clearShippedAiBaselinePatch(shipped)` — colocated with the existing `baseline`/`baselineDirty` slice ~L308-310)
- `src/hooks/editStore/aiActions.ts` (queue patches + emit events)
- `src/utils/autoSaveDraft.ts` (ship `payload.aiBaselinePatch` when non-null — same block as the baseline ship, ~L178-190; snapshot + selective clear per step 4)
- `src/hooks/editStore/persistenceActions.ts` (only if the clear-after-save hook lives there per the `markBaselineSaved` pattern — otherwise untouched)

**Steps**
1. `regenerateSection` success path: after applying `data.content` to `state.content[sectionId]` (~L97-152), `queueAiBaselinePatch(sectionId, <normalized regen element texts>)` — normalize with the same extraction rules as `capture.ts` (string values). Then emit `section_regenerated` (props per event table; `posthog-js` import pattern from `src/utils/trackEdit.ts`).
2. Element regen: `regenerateElementWithVariations` success → emit `element_regenerated`. `applyVariation` (~L429) → `queueAiBaselinePatch(sectionId, { [elementKey]: variation })` (re-freeze on ACCEPT, event on REQUEST).
3. Patch accumulator merges across multiple regens between saves (section-level replace, element-level merge).
4. **Clear semantics (PINNED — not implementer discretion): NEVER blanket-clear the accumulator on save success.** At ship time, `autoSaveDraft` snapshots the exact patch object placed in the payload. On THAT save's success, call `clearShippedAiBaselinePatch(shippedSnapshot)`: remove ONLY entries whose current accumulator value deep-equals the shipped snapshot's entry — entries queued or overwritten AFTER the snapshot (e.g. regen-B lands while save-A is in flight) survive and ship with the next save. Rationale: a blanket `clearAiBaselinePatch()` (the `markBaselineSaved()` mirror) would drop regen-B's re-freeze; since the additive freeze never re-freezes an already-frozen element, B's section would forever diff against the stale original-AI baseline and the whole regen would masquerade as a giant user edit. On save FAILURE, clear nothing (patch re-ships).
5. `attemptNumber`: module-scoped Map in `aiActions.ts` (see event table). No schema/type change to `AiGenerationMetadata` needed.
6. **Same-store-instance check (required):** the state added in `src/stores/editStore.ts`, the queue calls in `aiActions.ts`, and the ship-time read in `autoSaveDraft.ts` (via `storeManager.getEditStore(tokenId)`) must all resolve to the SAME token-scoped store instance — confirm by tracing how the existing `baseline`/`baselineDirty` fields already round-trip through these exact three files, plus a manual regen→save check. If any site resolves a different instance, the queued patch is never shipped.

**Verification**
- `npx tsc --noEmit` + `npm run test:run` green.
- Manual: regen a section → autosave → `Project.aiBaseline` for that section now equals the regen output; a prior EditDelta row for that section clears on the next unedited save (delta vs NEW baseline = 0); PostHog debug shows `section_regenerated` with all 4 props. Repeat for element variation accept.
- Manual race check: trigger regen-A, then regen-B on another section while A's save is in flight → after both saves settle, BOTH sections' `aiBaseline` entries equal their regen outputs (B's patch not dropped).

---

## Phase 4 — Failure telemetry (PostHog)

**Files touched**
- `src/utils/trackTelemetry.ts` (new — tiny wrapper: `trackFailure(event, props)` guarding for posthog availability; keeps emit sites one-liners)
- `src/modules/wizard/generation/thing.ts` (product: strategy + copy failure branches, incl. per-page loop ~L460-462 and catch ~L491-493)
- `src/modules/wizard/generation/trust.ts` (service: mirrored branches)
- `src/app/onboarding/[token]/components/EntryInputStep.tsx` (scrape/understand error branches)

**Steps**
1. Emit per the event table. Map server `error` codes → `parse_failed` vs `generation_failed` (verify exact strings in the generate-copy/strategy routes at impl time; scout refs: product L238/247-257/305, service L189/198-208/254). Credit failures (`isCreditFail`) are NOT failures — do not emit.
2. `scrape_failed`: include `provider` from the response when present, hostname only (no full URL — privacy), `audienceType`, `templateId: null`.
3. Failure emits must never alter control flow (fire-and-forget, wrapped).

**Verification**
- `npx tsc --noEmit` + `npm run test:run` green (existing wizard tests `thing.test.ts`/`trust.test.ts` still pass — emits are side-effect-only).
- Manual: force a scrape failure (bogus URL) → `scrape_failed` in PostHog debug; code-review the generation failure branches (hard to trigger live) confirming every non-credit failure path has exactly one emit.

**HUMAN GATE (final)** — end-to-end eyeball before merge: fresh generate → baseline frozen + zero-row parity check passes; edit → EditDelta rows correct via SQL; regen (incl. two-regens-in-flight race) → re-freeze verified; all 5 events visible in PostHog; `npm run build` green (no-PR workflow: everything green locally before user merges/pushes).

---

## Deferred (explicitly NOT in this build)

- Spec items 4–6: prefill acceptance events, structural-edit events, funnel/session-recording config + founder calls (private beta).
- Public-beta analysis (credit-wall, attribution, conversion join) — join keys (`templateId`/`audienceType` on EditDelta + events) are delivered by this build.
- Editor `MainContent.tsx` generate-copy path instrumentation (secondary path; add later if it survives).

## Unresolved questions

- User-added (non-AI) elements intentionally excluded from EditDelta (no baseline). OK?
- Legacy pre-existing projects: first post-deploy save freezes CURRENT (possibly edited) text as baseline. OK, or backfill-skip them?

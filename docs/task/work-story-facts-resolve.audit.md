# work-story-facts-resolve — audit

Phase 1 only ("route server-resolves `facts.work` + route tests"). Branch: `feature/work-story-facts-resolve` (verified before any edit).

## Files changed

- `src/app/api/audience/work/regenerate-story/route.ts` (modified)
- `src/app/api/audience/work/regenerate-story/route.test.ts` (modified)

Not a source change, noted for completeness: `next-env.d.ts` was generated in the worktree (gitignored build artifact, byte-identical to the main repo's). See "Deviations".

Phase 2 files (`aiActions.ts`, `actions.ts`, `StoryInterviewPanel.tsx`, `storyInterviewGuard.test.ts`) untouched.

## Body-`brief` reader inventory (re-grepped before coding)

`grep -n 'brief|Brief' route.ts` on the pre-change file returned 8 hits; the functional readers of the **body** `brief` binding are exactly TWO, as the plan claimed — independently confirmed, not assumed:

| Line | Reader | Disposition |
|---|---|---|
| `:98` | `const { …, brief } = validation.data` | destructure removed |
| `:101` | `brief.facts` → `getWorkFacts` | **re-pointed** → `storedBrief?.facts` |
| `:129-130` | `brief.businessType` → `professionRow` → `selectWorkVoice` | **re-pointed** → `storedBrief?.businessType` (NOT collapsed to `null`) |

Remaining hits were non-readers: header comment `:12`, import `:32`, schema comment/field `:65-66`, and the 400 message string `:107` (message text preserved verbatim).

## `route.ts` — what changed

1. **Schema trimmed**: `brief: BriefSchema` removed from `RegenerateStoryRequestSchema`; `BriefSchema` import dropped entirely (server side uses a plain cast, not a parse — `getWorkFacts` safeParses the `work` bag internally). Schema stays a plain `z.object` (no `.strict()`), so a still-sending old client is stripped, not rejected — this is what keeps Phase 1 independently landable.
2. **`prisma` imported**; inline project read follows the established pattern from `src/app/api/brief/route.ts:26-40` (no shared `loadBriefForToken()` helper exists).
3. **Sequence reordered** (load-bearing security work) to: `requireAICredits` → validate body → compute `isMock` → **mock branch (returns)** → `assertProjectOwner` → `prisma.project.findUnique` → `getWorkFacts` guard → price/voice → AI loop → `consumeCredits` → response. The DB read now sits **behind** the owner gate.
4. **`requireAICredits` stays first**, with the one-line rationale comment (authenticates + reads only the caller's OWN plan/usage; no cross-tenant read; the charge is `consumeCredits` after generation).
5. **Voice re-pointed**, same construction: `storedBrief?.businessType ? ({ key: storedBrief.businessType } as WorkProfessionRow) : null`.
6. **Header comment** updated: step 2 no longer claims the body carries the Brief; records server-side resolution instead.

**Error shapes/statuses preserved byte-identically**: body 400 `{success:false, error:'validation_error', details}`; facts 400 `{success:false, error:'validation_error', message:'brief.facts.work is required for work story regeneration'}` (message string unchanged, including the now-historical `brief.facts.work` wording); owner `{success:false, error: access.error}` at `access.status`; `generation_failed` 500; `charge_failed` 500; `insufficient_credits` 402; success payload and `meta` unchanged.

## Mock/demo path preservation

The mock branch was **deliberately relocated above** the price/voice derivation (it was at `:135`, after `:126-132`) so it can precede the owner gate, DB read, and facts guard. `isMock` is computed immediately after validation; when true the route returns from the mock branch having touched **no Project row and no facts**:

- `facts` → `{}` (`WorkFactsSchema` is all-optional; `generateMockWorkCopy` is documented facts-agnostic/canned).
- `parseWorkCopy(mockRaw, ABOUT_UIBLOCKS, undefined)` — the praise param is already optional on the non-mock empty-praise path.
- Rest byte-identical: `validateStoryAbout`, `creditsUsed: 0`, `creditsRemaining: 999`, `meta: { attempts: 0, mock: true }`.

This preserves today's demo contract: `assertProjectOwner` short-circuits the demo token precisely because it has NO Project row, so the new DB read must not resurrect that requirement. No fixture/demo Brief seeding introduced.

## `route.test.ts` — tests + what each catches

Added `@/lib/prisma` mock (`project.findUnique`, arrow-deferred so hoisting is safe) and a `selectWorkVoice` spy. `brief` removed from `BASE_BODY`. Default `findUnique` → `{ brief: kundiusBrief }`.

| Test | Catches |
|---|---|
| happy path (+ `findUnique` called with `{where:{tokenId},select:{brief:true}}`) | route not resolving the Brief server-side / wrong query |
| **body needs NO brief (200)** | schema still requiring `brief` → the original 400 defect |
| credits gate 402 | credit pre-gate regression |
| owner guard 403, no `generateRawJson` | gate removed |
| **(8d) sequencing: `findUnique` NOT called for a non-owner** | DB read drifting ahead of the owner gate |
| **(8b) demo path: 200, `meta.mock`, no `generateRawJson`, no `findUnique`** | mock path acquiring a Project-row / facts dependency |
| **(8c) voice: `professionRow` non-null, `key === kundiusBrief.businessType`** | `professionRow` collapsed to `null` (field-drop trap) |
| (8a) stored brief `facts:{}` → 400 + exact message, no AI call | facts guard shape drift |
| (8a) `brief: null` → same 400 | null-brief path |
| (8a) `findUnique` → `null` (missing row) → same 400 | defensive branch |
| malformed body → 400 | validation regression |
| post-AI 402 / `charge_conflict` 500 | billing-correctness M1 (unchanged) |
| generator-parity ×2 | contract drift (unchanged) |

**Voice-mock correctness (plan-reviewer note #1 applied):** the plan's step-8c guidance would have redded the suite — `storyInterview.ts:33` imports `formatWorkVoiceForPrompt` from the SAME module, so a partial factory breaks `buildStoryInterviewPrompt` everywhere. Used `importOriginal` + the real `selectWorkVoice` impl, spying via wrapper. (The `actual` binding is read inside the factory, not via a static import — a static import of a mocked module would self-recurse.)

### Inert-assertion mutation evidence (each new test proven to genuinely fail)

Three mutations applied to `route.ts`, run, then reverted:

| Mutation | Result |
|---|---|
| A: `professionRow` → `null` | `× voice sourcing…` → **1 failed / 15 passed** |
| B: owner gate moved BELOW the Brief read | `× sequencing…` → **1 failed / 15 passed** |
| C: `findUnique` left ahead of the mock branch | `× sequencing…` + `× demo/mock path…` → **2 failed / 14 passed** |

Tree restored after each (`git status` shows only the two Phase-1 files modified). Note: an earlier `perl -0pi` mutation attempt silently did NOT apply and reported a misleading 16-passed — re-done with exact edits and grep-verified, per the repo's inert-assertion lesson.

## Verification (actual output)

```
$ npx tsc --noEmit
TSC_EXIT:0                      # clean, no output

$ npm run test:run -- src/app/api/audience/work/regenerate-story/route.test.ts
 Test Files  1 passed (1)
      Tests  16 passed (16)

$ npm run test:run
 Test Files  220 passed | 1 skipped (221)
      Tests  3789 passed | 18 skipped (3807)

$ npx vitest run src/hooks/editStore/storyInterviewGuard.test.ts
 Test Files  1 passed (1)
      Tests  2 passed (2)
```

No cross-file fallout. `storyInterviewGuard.test.ts` passes untouched, confirming the Phase-1-alone landing story (client still sends `brief`; the plain `z.object` strips it).

## Deviations

1. **`next-env.d.ts` generated in the worktree.** `npx tsc --noEmit` initially reported one error — `src/app/page.tsx(6,26): TS2307: Cannot find module '@/assets/images/founder.jpg'` — in a file I never touched. Diagnosed as a fresh-worktree artifact, not a regression: the asset exists, and `next-env.d.ts` (which pulls in `next/image-types/global`, the `*.jpg` module declaration) is gitignored (`.gitignore:44`), generated by `next dev/build`, present in the main repo but never generated here. Recreated it byte-identically from the main repo so tsc gives a true signal → clean. It is gitignored, so the working tree is unaffected (`git status` shows only the two Phase-1 files). Conservative call under the in-scope-ambiguity rule: it is generated build state (like the `.next/` dir I also cleared), not a source file. Flagging it because it is technically outside Files-touched — revert by deleting the file if the reviewer prefers.
2. **Extra tests beyond the plan's list**: added the "body needs NO brief" test (directly pins the defect being fixed) and split the plan's 8a "no-brief variant" into two (`brief: null` and missing row) to cover the defensive branch separately. Additive only.
3. Plan-reviewer notes #1 (voice mock via `importOriginal`), #2 (defensive-branch comment noting the missing-row 400 is unreachable in production — `assertProjectOwner` 404s first without `allowMissing`, per `security.ts:85-90`; only reachable under test where the gate is mocked `ok:true`), #3 (deliberate mock-branch relocation), and #4 (reader re-grep) all applied as directed.

No `@/lib/security` exports beyond `createSecureResponse` + `assertProjectOwner` are used by the route, so the existing full-factory mock remains complete.

## Open risks

- **`getWorkFacts` reads `storedBrief.facts`** — this assumes the stored Brief persists facts under the same `facts.work` shape the client used to post. The happy-path test uses the real `kundiusBrief` fixture, but a **real** work project's persisted `Project.brief` shape is only proven by the founder's live smoke at the merge gate (which is exactly the plan's decision gate: was-400 → now-regenerates). If a real stored Brief lacks `facts.work`, the symptom moves from "always 400" to "clean 400 with the same message" — same status, so the smoke is the only discriminator.
- The 400 message still says `brief.facts.work` although `brief` is no longer a client input. Kept verbatim to preserve the exact error shape per the plan; mildly misleading to a future reader.
- Phase 2 still sends a dead `brief` body field until it lands (harmless — stripped).

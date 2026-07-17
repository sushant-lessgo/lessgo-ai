# work-story-facts-resolve — plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\work-story-facts-resolve`
- **Branch:** `feature/work-story-facts-resolve`
- **Tier:** FULL (escalated). Spec declared `standard`, but `src/hooks/editStore/aiActions.ts` is on the risky-surface list (editor store internals) → auto-escalation, never downgraded. Full tier = plan-review loop + per-phase impl-review loop.

## Overview

The work story-interview panel is 100% dead: `/api/audience/work/regenerate-story` requires a client-supplied `brief` in the body, but no caller ever sends one (`StoryInterviewPanel` → `MainContent` never passes it), so every submit 400s. Fix = server-side resolution: the route loads the project's stored Brief from the DB (after the ownership gate) and derives `facts.work` via `getWorkFacts`; voice input (`businessType`) re-points to the stored Brief too; the client `brief` param is deleted from the contract, the store action is trimmed and properly typed on the actions interface. Copy quality, credits, mock/demo path (which must keep working with NO Project row), and the about-section guard are untouched — this is plumbing.

## Progress log

```
phase 1 route server-resolves facts.work + route tests: done (commit 652b68fc, review loops 1, verdict ship)
phase 2 client/store cleanup + action typing + guard test: pending
final gate full green + live smoke (HUMAN GATE): pending
```

## Phasing rationale

Spec says "no phasing," but FULL tier means per-phase impl-review, and the two halves have different risk profiles: the route change (security-sequencing sensitive) and the editor-store change (the escalation trigger). Two phases keeps each impl-review sharply scoped. They are also independently landable **in this order**: after Phase 1 the client still sends `brief` but the schema is a plain `z.object` (no `.strict()`, verified) so the unknown key is stripped, not rejected — the old client keeps working against the new route; Phase 2 then removes the dead threading. (Reverse order would break: old route requires `brief`.)

---

## Phase 1 — route server-resolves `facts.work` + route tests

### Files touched
- `src/app/api/audience/work/regenerate-story/route.ts`
- `src/app/api/audience/work/regenerate-story/route.test.ts`

### Body-`brief` reader inventory (grep-verified, implementer re-greps before coding)

Exactly TWO readers of the body `brief` exist in this route — both must be re-pointed, neither silently dropped:

1. `brief.facts` → `getWorkFacts` (`:101`) — re-points to the stored Brief (step 4).
2. `brief.businessType` → `professionRow` → `selectWorkVoice` (`:129-132`) — re-points to the stored Brief (step 6). **Re-point, don't delete** — collapsing `professionRow` to `null` would compile but silently regress voice selection (the repo's known field-drop trap).

### Steps

1. **Trim the request schema.** Remove `brief: BriefSchema` from `RegenerateStoryRequestSchema` (`route.ts:61-67`, incl. the decision-#4 comment at `:65`). Safe: the schema is local to this route, not exported/imported anywhere. **Drop the `BriefSchema` import entirely** (`:32`) — the server side uses a plain cast, not a parse (step 4); `BriefSchema` is non-strict/all-optional and validates essentially nothing, so a `safeParse` here would be ceremony posing as a guard.
2. **Reorder to honor the route's own contract** (header comment `:10-11`: "owner gate BEFORE any charge/cross-tenant read"). New sequence:
   - validate body (Zod) → 400 `validation_error` + `details` as today (`:91-97`)
   - **compute `isMock` immediately after validation** (moved UP from `:115-116`; same expression: `NEXT_PUBLIC_USE_MOCK_GPT === 'true' || tokenId === DEMO_TOKEN`)
   - **`isMock === true` → skip the owner gate (as today), skip the DB brief read AND the facts guard entirely, and go straight to the existing mock branch** (step 3 — ORCHESTRATOR RULING, do not re-open)
   - else: ownership gate `assertProjectOwner` (`:118-124`) — **unchanged**, error shape `{success:false, error: access.error}` at `access.status` as today
   - **then** load the Brief (step 4) → facts guard (step 5) → voice derivation (step 6) → AI loop, charge, response — all byte-identical downstream.
   - `requireAICredits` at `:78` stays FIRST and out of scope — add a **one-line in-route comment** recording the rationale: it authenticates and reads only the caller's OWN plan/usage; no charge happens there (the charge is `consumeCredits` at `:210`) and no cross-tenant read, so it is safe ahead of the owner gate.
3. **Mock/demo branch — must not require a Project row or resolvable facts** (RULING: preserve today's demo contract — `assertProjectOwner` short-circuits for the demo token (`src/lib/security.ts:45+`) precisely because the demo token has NO Project row; the DB read/facts guard must not resurrect that requirement). In the mock branch, replace the body-derived `facts` with an empty `WorkFacts` (`{}` — `WorkFactsSchema` is all-optional, and `generateMockWorkCopy` is documented facts-agnostic/canned; `facts.praise` → `undefined` is fine, `parseWorkCopy`'s praise param is already optional on the non-mock empty-praise path). Do NOT introduce fixture facts (no kundius/demo Brief seeding). Rest of the mock branch (parse, `validateStoryAbout`, `creditsUsed: 0`, `meta.mock: true`) byte-identical.
4. **Server-side Brief load (non-mock only).** `assertProjectOwner`'s query selects `{userId}` only — no Brief comes back from it, so add a separate fetch (there is NO shared `loadBriefForToken()` helper; every route inlines this — follow the established inline pattern from `src/app/api/brief/route.ts:26-40`): `prisma.project.findUnique({ where: { tokenId }, select: { brief: true } })`. Add the `prisma` import. Then a **plain cast, not a parse**: `const storedBrief = project?.brief as { businessType?: string; facts?: Record<string, unknown> } | null;` (`getWorkFacts` already safeParses the `work` bag internally).
5. **Facts guard, server-derived.** `getWorkFacts(storedBrief?.facts)` — if project row missing, brief null, or `getWorkFacts` returns null → 400 with the EXACT existing shape (`:103-110`): `{success:false, error:'validation_error', message:'brief.facts.work is required for work story regeneration'}`. `getWorkFacts` never throws — no try/catch needed around it.
6. **Voice input re-point.** `professionRow` (`:129-131`) sources from `storedBrief?.businessType` instead of the body `brief.businessType` — same `({ key: businessType } as WorkProfessionRow) : null` construction, same `selectWorkVoice` call. No behavior change for a stored Brief that carries `businessType`; pinned by test (step 8c).
7. **Stale-comment cleanup (this file):** header line `:12` — drop "+ Brief" from "Validate the body (tokenId + sectionId + the 3 interview answers + Brief)" and note server-side Brief resolution instead. Keep the rest of the header accurate (owner-gate wording still true).
8. **Rewrite `route.test.ts`:**
   - **Add a `@/lib/prisma` mock** (none exists today). Default: `project.findUnique` resolves `{ brief: kundiusBrief }` (reuse the existing fixture import `@/modules/audience/work/__tests__/fixtures/kundiusBrief`). Note this default deliberately makes the happy path green — which is exactly why the demo test (8b) must assert `findUnique` is NOT called, or the default would mask a demo-path DB dependency (inert-assertion lesson).
   - **Remove `brief` from `BASE_BODY`** (`:63-72`) — every test currently ships `brief: kundiusBrief` in the body; the Brief moves body → prisma mock for ALL non-mock tests. Assert BASE_BODY without `brief` passes body validation (non-400 path with default mocks).
   - **(a) Rewrite the missing-facts test** (`:127-132`): instead of posting `brief:{businessType:'photographer', facts:{}}`, mock the prisma row as `{ brief: { businessType:'photographer', facts: {} } }` → assert 400 + the exact message. Keep a **no-brief variant**: prisma resolves `{ brief: null }` (and/or row not found) → same 400.
   - **(b) Demo/mock-path test (pins ruling #1):** POST with `tokenId: DEMO_TOKEN` (`'lessgodemomockdata'`), no `brief` → **200**, `meta.mock === true`, `generateRawJson` NOT called, **`prisma.project.findUnique` NOT called**. Proves mock needs no Project row and no resolvable facts.
   - **(c) Voice-sourcing test (pins re-point #6):** `vi.mock('@/modules/audience/work/voice')` with a spy on `selectWorkVoice` (factory must re-export `Establishment`/`WorkProfessionRow` types are type-only — only the fn needs mocking); with the default stored brief carrying `businessType`, assert `selectWorkVoice` was called with a **non-null `professionRow`** whose `key` equals the stored `businessType`. This fails if the implementer "fixes" the tsc break by dropping `professionRow` to null.
   - **(d) Sequencing test (kept — reviewer-confirmed it genuinely fails on a bad reorder):** on `assertProjectOwner` → `{ok:false, status:403}`, assert `prisma.project.findUnique` was NOT called (Brief read sits behind the gate). The existing owner-guard test (`:107-113`, `generateRawJson` not called) stays valid.
   - **Mock-factory pitfall:** `vi.mock('@/lib/security')` is a full factory replacement — if the route change adds/uses any additional `@/lib/security` export, it MUST be added to the factory (`:17-38`) or the route crashes under test. Same applies to the new `@/modules/audience/work/voice` mock: preserve every export the route imports (`selectWorkVoice` + keep type-only imports out of the factory).

### Verification
- `npx tsc --noEmit`
- `npm run test:run -- src/app/api/audience/work/regenerate-story/route.test.ts` (then a full `npm run test:run` for cross-file fallout)
- Note: `src/hooks/editStore/storyInterviewGuard.test.ts` still passes after Phase 1 (client untouched; extra body field harmless — schema strips it).

---

## Phase 2 — client/store cleanup + action typing + guard test

### Files touched
- `src/hooks/editStore/aiActions.ts`
- `src/types/store/actions.ts`
- `src/app/edit/[token]/components/StoryInterviewPanel.tsx`
- `src/hooks/editStore/storyInterviewGuard.test.ts`

### Steps

1. **`aiActions.ts` (`:285-289`, `:318-326`):** drop the third `brief: unknown` param from `regenerateStoryFromInterview`; drop `brief` from the fetch body (`{tokenId, sectionId, interviewAnswers}`). **Delete the stale NOTE at `:282-284`** (it documents the brief-threading gap this fix removes). **Scope discipline — this file is the escalation trigger:** the `set((state: EditStore)=>…)` (`:301`/`:338`) and `get() as EditStore` (`:310`) are the FILE-WIDE pattern, not story-specific; do NOT churn them. The spec's "drop the `as EditStore` casts" reads narrowly: the real defect is that `regenerateStoryFromInterview` is absent from the actions type (fixed in step 2). Keep the `about`-prefix section guard (`:295`) untouched.
2. **`src/types/store/actions.ts` — RULING (default, do not re-open):** declare `regenerateStoryFromInterview: (sectionId: string, interviewAnswers: { origin: string; moment: string; belief: string }) => Promise<void>;` on **`GenerationActions` (`:484-505`, the AI-owning interface)** — NOT `ContentActions`. Implementer verifies `GenerationActions` is composed into the store type (it must be for the typed panel access in step 3 to compile — `tsc` is the check).
3. **`StoryInterviewPanel.tsx`:** remove the `brief?: unknown` prop (`:28`) and the `brief` third arg at the call site (`:50`); replace the `(store.getState() as any)` cast (`:46`) with the now-typed action access. **Delete the stale NOTE at `:11-13`** (describes the missing-brief gap). `MainContent.tsx:674` needs NO change (it never passed `brief`) — not in Files touched.
4. **`storyInterviewGuard.test.ts`:** drop the `{}` third arg at `:54,60` (compile break otherwise); keep the fetch-URL assertion (`:63`); if the test asserts the fetch body, update it to the brief-less shape.

### Verification
- `npx tsc --noEmit` — also proves the typed action compiles at the panel call site with no casts (and that `GenerationActions` is composed into the store type).
- `npm run test:run -- src/hooks/editStore/storyInterviewGuard.test.ts`, then full `npm run test:run`.
- `npm run lint` — panel touches editor UI; bare-`useEditStore` ban must stay green.

---

## Final gate — full green + live smoke  **[HUMAN GATE]**

- `npx tsc --noEmit` + `npm run lint` + `npm run test:run` + `npm run build` all green (no CI — local green is THE gate before any merge/push, per repo rule).
- **[HUMAN GATE] Live work story-interview smoke — the FOUNDER runs it at the merge gate** on a real work project (Kundius/atelier) against `npm run dev` with real keys: open the About section's "Rewrite your story" panel, submit the 3 answers (origin/moment/belief) → About regenerates, **no 400**. Was-400→now-regenerates is the spec's decision gate. Merge to main only after this passes.
- **No Playwright e2e** for this surface — agreed with the pipeline note: a deterministic route-level Vitest (Phase 1) covers guard/sequencing/demo/voice; an e2e would need a real LLM + a seeded real work project for one interaction, which the manual smoke already covers. Adding one is ceremony, not coverage.

## Acceptance criteria → phase map

| Criterion (spec) | Satisfied by |
|---|---|
| Live story-interview submit succeeds, no 400 | Final gate (founder smoke); enabled by Phase 1 + 2 |
| Route resolves `facts.work` server-side; `brief` out of schema + no longer sent | Phase 1 (schema+resolve) + Phase 2 (client stops sending) |
| No-`facts.work` project still gets clean validation error, covered by updated route test | Phase 1 (8a) |
| Mock/demo path untouched — no Project row / no facts required | Phase 1 step 3 + demo test (8b): 200, `meta.mock:true`, no `generateRawJson`, no `findUnique` |
| Voice input (`businessType`) preserved, not silently dropped | Phase 1 step 6 + voice test (8c) |
| `regenerateStoryFromInterview` typed on actions; `as any` in panel + ad-hoc casts for this action gone | Phase 2 |
| Ownership gate, credit event, about-guard unchanged | Phase 1 (route diff review) — sequencing test (8d) pins gate-before-read |
| `tsc` + `test:run` green incl. updated route test | Per-phase verification + final gate |

## Landmine check (CLAUDE.md)
- No block components touched → no dual-renderer parity work.
- No 'use client' imports into published renderers.
- No schema/migration (Brief already `Project.brief Json?`) → no `migrate dev` needed, no schema human gate.
- `npm run build` in final gate = full build (published-css + assets + next build), not bare `next build`.
- Field-drop trap explicitly handled: both body-`brief` readers inventoried + re-pointed + test-pinned (grep re-run by implementer).

## Resolved-in-review notes (do not re-open)
- Demo/mock path: skip owner gate + DB read + facts guard when `isMock`; mock needs no Project row (ruling #1).
- `requireAICredits` before owner gate: out of scope, defensible (own-plan read, no charge/cross-tenant) — recorded as an in-route comment, not a TODO.
- Actions interface: `GenerationActions`, not `ContentActions` (ruling).
- Smoke runner: founder, at the merge gate.
- `BriefSchema.safeParse` on the stored brief: dropped for a plain cast (schema validates nothing; `getWorkFacts` safeParses internally).

## Unresolved questions
None — all three prior questions ruled (see Resolved-in-review notes).

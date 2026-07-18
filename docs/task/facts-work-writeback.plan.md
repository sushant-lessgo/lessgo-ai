# facts-work-writeback — plan

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\facts-work-writeback`
- **Branch:** `feature/facts-work-writeback`
- **Tier:** standard (scouted; NOT escalated — fix touches only plain generation modules + an API route read-time fallback; no editor-store internals, no `.published.tsx`, no schema/migration, no billing, no publish surface)
- **Spec:** `docs/task/facts-work-writeback.spec.md`

## Overview

In-editor work story-interview submit 400s (`"brief.facts.work is required..."`) because first-gen
never persists the Brief: `saveFC` in `src/modules/wizard/generation/work.llm.ts` saves
`finalContent` etc. but omits `brief`, so `Project.brief.facts.work` is empty when
`/api/audience/work/regenerate-story` reads it server-side. Fix = Option B: (1) persist the brief at
first-gen via `saveFC`, and (2) for already-generated projects (Kundius), a **server-side read-time
fallback** in the route that re-derives `facts.work` from stored `facts.entry` via
`seedWorkFactsFromEntry` — zero data mutation, self-healing, no customer-data gate needed. The
route's guard is supplied, never bypassed.

## Progress log

- phase 1 persist brief at first-gen + route read-time fallback + tests: done (impl-review verdict=ship, loops=0, full suite 4182 pass) | commit pending below
- phase 2 founder pilot verification (human gate): pending

## Design decision — fallback (i) chosen over backfill (ii)

Chosen: **(i) server-side read-time fallback** in the regen route. Justification:

- **Zero mutation of persisted customer data** → no human data-gate required (spec's backfill gate
  applies only if we write stored `Project.brief`; we don't).
- **Self-healing / complete coverage:** fixes ALL existing work projects AND any project generated
  in the window before phase-1's persistence lands — a one-off backfill (ii) only fixes rows that
  exist at run time and needs its own gated phase.
- **Legitimacy:** `seedWorkFactsFromEntry` is exactly how onboarding seeds `facts.work` from
  `facts.entry` at confirm time (`src/modules/wizard/work/rail.ts:294`; used by
  `components/onboarding/journey/engines/work.ts:566`). The route re-runs the same server-side
  derivation from server-stored data — never client input. **The guard is NOT weakened:** if
  neither `facts.work` nor a derivable `facts.entry` exists, the 400 stands unchanged.
- `rail.ts` is verified PURE (header contract: zod + types only — no react/stores/hooks/network,
  no `'use client'`) → safe to import into an API route (no published/client-boundary landmine).
- The derived facts are used **read-time only, not written back** — keeps this out of
  customer-data-mutation territory entirely.

**Residual gap (accepted, documented):** a work project with neither `facts.work` nor a parseable
`facts.entry` (`seedWorkFactsFromEntry` returns null for empty/invalid entry) still 400s — that is
the guard working correctly. If Kundius's row turns out to be in this state (phase-2 verify), a
manual admin patch or a gated backfill phase gets added then — not preemptively.

Backfill (ii) rejected: mutates persisted customer data (hard human gate), one-shot (window gap
above), and covers a strict subset of what (i) covers.

## Phase 1 — persist brief at first-gen + route read-time fallback + tests

### Files touched

- `src/modules/wizard/generation/work.llm.ts` — add `brief` to the `saveFC` saveDraft payload
- `src/app/api/audience/work/regenerate-story/route.ts` — read-time fallback via `seedWorkFactsFromEntry`
- `src/modules/wizard/generation/work.llm.test.ts` — assert brief persisted at first-gen
- `src/app/api/audience/work/regenerate-story/route.test.ts` — fallback success + guard-intact tests

No other file may be edited in this phase.

### Steps

1. **Persist at first-gen** (`work.llm.ts`, `saveFC` at ~227-235): include the wizard's resolved
   brief in the saveDraft payload — `...(input.brief ? { brief: input.brief } : {})`.
   - **Verify first** (scout instruction): confirm `input.brief.facts.work` is populated at this
     call site. Strong evidence already: `work.llm.ts:136` POSTs `{ brief: input.brief }` to the
     strategy route and `:179` reads `getWorkFacts(input.brief?.facts)` — the implementer confirms
     the same object reaches `saveFC`'s closure.
   - **Landmine A (full-facts):** `saveDraft` shallow-merges `body.brief` over the stored brief and
     REPLACES `facts` wholesale (rail.ts hard-rule 4; `saveDraft/route.ts:144-153`). `input.brief`
     is the wizard's COMPOSED brief (entry + work + collections), so sending it whole is correct —
     do NOT construct a partial `{facts:{work}}` patch.
   - **Landmine B (silent drop):** `saveDraft` validates `body.brief` with
     `BriefSchema.partial().safeParse` and silently skips the brief write on failure
     (`route.ts:145-153`). The route-level persistence is therefore proven by the DB-shape test in
     step 3, not assumed.
   - `saveFC` runs repeatedly during the per-page fan-out/resume — re-sending the same brief each
     save is idempotent and harmless; no first-save gating needed (keep the diff minimal).
2. **Read-time fallback** (`regenerate-story/route.ts`, after the null check at ~159): when
   `getWorkFacts(storedBrief?.facts)` returns null, attempt
   `seedWorkFactsFromEntry(storedBrief?.facts?.['entry'] ?? null)` (import from
   `@/modules/wizard/work/rail`, mirroring the cast pattern in
   `components/onboarding/journey/engines/work.ts:565-572`). Non-null → use as `facts` and
   continue; null → the existing 400 response, byte-identical message. Do not touch the mock/demo
   branch, ownership gate, credits, or prompt construction. Do NOT persist the derived facts.
3. **Tests** — route-level Vitest integration chosen over a Playwright e2e: the existing harness
   (`route.test.ts`, mocked prisma/aiClient/security) already exercises the exact editor request
   shape (`BASE_BODY` = `{tokenId, sectionId, interviewAnswers}`, no brief — matching
   `regenerateStoryFromInterview`'s POST), deterministically and without an authed work-project
   fixture + real LLM. Add/adjust:
   - **(acceptance) editor path succeeds with facts.work present:** the existing success test
     (`findUnique` → `kundiusBrief` with `facts.work`, ~line 99) already covers this — keep green.
   - **(acceptance, fallback) NEW:** stored brief with `facts.entry` (valid: businessName +
     offerings, per `rail.test.ts` ENTRY fixture) but NO `facts.work` → response 200, story
     regenerated (i.e., prompt built from server-derived facts), no 400.
   - **(guard intact) existing:** `facts: {}` (no work, no entry) → still 400 with the same
     message; `brief: null` → still 400. These tests already exist (~186, ~197) and must remain
     passing UNCHANGED — they now double as proof the guard wasn't weakened.
   - `work.llm.test.ts`: NEW assertion that the saveDraft call (however the test mocks it) receives
     a `brief` field equal to `input.brief`, and that `getWorkFacts(brief.facts)` on that payload
     is non-null (proves what's persisted actually satisfies the regen route's read).

### Verification (green gate)

- `npx tsc --noEmit` clean
- `npm run test:run` green — specifically `route.test.ts` (new fallback test + untouched 400 tests)
  and `work.llm.test.ts` (brief-persisted assertion)
- `npm run lint` clean
- `npm run build` green (rides the big-bang batch)
- Optional manual: `npm run dev`, fresh work onboarding → generate → confirm `Project.brief.facts.work`
  present in DB; then editor → story interview → submit → About regenerates.

## Phase 2 — founder pilot verification 【human gate】

Verification-only phase; no code.

### Files touched

- none

### Steps

1. Founder opens the Kundius work project in the editor → About/story section → story-interview
   panel → answer → submit.
2. Expected: About regenerates, no `brief.facts.work is required` 400. (Her stored brief likely
   lacks `facts.work`; success proves the read-time fallback on real data.)
3. If it STILL 400s → her row has neither `facts.work` nor a parseable `facts.entry` (the residual
   gap). Escalate to the orchestrator: either a one-line admin patch to her row or a new, separately
   planned backfill phase — **hard human gate** in either case (persisted customer data).

### Verification

- Founder sign-off on the live repro fix (this IS the acceptance pilot from the spec).

## Risky-surface note

Files touched are: a plain generation module (`work.llm.ts`), one API route + its test, and two
existing test files. None are editor-store internals, `.published.tsx`/renderer pairs, Prisma
schema/migrations, billing, or publish surfaces. `rail.ts` is imported (not edited) and is a pure
module — no `'use client'` import into server code. No escalation needed.

## Unresolved questions

- Kundius row: `facts.entry` present + parseable? (If not, phase 2 step 3 kicks in — gated patch.)
- OK that fallback-derived facts stay read-time-only (never written back to `Project.brief`)?
- Brief re-sent on every `saveFC` (idempotent) vs first-save-only — plan says every; object if you
  want minimal writes.

---
tier: standard
tier-why: one API route + small client cleanup (drop a request param, type one store action). No editor-store internals, no schema, no publish path. Server-resolve replaces client-trust → one adversarial diff review. Escalate only if scout finds the stored-Brief resolution is deeper than the existing ownership load.
---

# work-story-facts-resolve — spec

Fixes the "facts.work editor writeback gap" (productQueue bug; `work-copy-engine.audit.md:464`). Approach chosen at discuss: **server-side resolution (B)**, NOT the editor-carries-the-Brief projection the ticket assumed.

## Problem / why
A **live work story-interview submit 400s** today (`brief.facts.work is required for work story regeneration`), so the work "Rewrite your story" panel is broken and work-template editing is blocked. Root cause: `/api/audience/work/regenerate-story` requires `facts.work` to arrive inside a **client-supplied `brief`** in the request body (`RegenerateStoryRequestSchema.brief`), but the editStore does not carry that Brief (`StoryInterviewPanel.tsx:11` NOTE — the phase-5 field→facts writeback gap), so the client sends nothing → 400. This blocks Kundius work-site editing.

## Goal
The work story-interview regenerates the About section from the project's real facts with **no 400**, by having the route resolve `facts.work` **server-side from the project it already loads** (via `tokenId`, for the ownership check) instead of trusting a client-passed Brief. The fragile client-brief threading is deleted; the route becomes the single source of truth for facts. More correct, more secure, smaller blast radius than carrying the Brief through the editor.

## Scope OUT (non-goals)
- **Editor carrying `facts.work` / any "Brief→editStore projection."** Explicitly rejected — the story-interview panel only collects 3 freeform answers (origin/moment/belief); it edits **no** `facts.work` field, so there is no unsaved editor edit that needs projecting. The stored project Brief IS the source of truth.
- **The wizard `buildWorkInput` snapshot nuance** (`useWizardStore.ts:760` reads the hydrated Brief snapshot, not per-field wizard edits) — that's a separate onboarding-path concern, different surface; not this fix.
- **Any facts.work EDITING surface** in the editor.
- **Story-interview copy quality / prompt polish** — behavior unchanged; this is a plumbing fix.
- Other engines / other regen routes.

## Constraints
- **Server-resolve, don't client-trust.** The route reads `facts.work` from the project's stored Brief (the project is already loaded for `assertProjectOwner(userId, tokenId)` at `route.ts:118`). Mirror however `/api/audience/work/generate-copy` + `.../strategy` resolve the Brief's `facts.work` (all read via `getWorkFacts`).
- **Drop the client `brief` from the contract.** Remove `brief: BriefSchema` from `RegenerateStoryRequestSchema`; stop sending `brief` from the store action + panel; remove the now-unused `brief` prop on `StoryInterviewPanel`.
- **Preserve the guard, server-side.** A project with no resolvable `facts.work` (e.g. a non-work project, or genuinely missing facts) must still return a clean validation error — the 400 moves from "client didn't send it" to "the stored project has no work facts."
- **Type the action.** Declare `regenerateStoryFromInterview` on `src/types/store/actions.ts` and drop the `(store.getState() as any)` cast in `StoryInterviewPanel.tsx:46` + the `as EditStore` casts around `aiActions.ts:285`.
- Keep the existing ownership gate, credit event (`SECTION_REGEN`, no new event), mock/demo path, and the about-section target guard untouched.
- No CI gate — `tsc` + `test:run` green locally; plus a live work story-interview smoke on a real work project.

## References
- `src/app/api/audience/work/regenerate-story/route.ts` — the route: `:66` client `brief` param, `:101` `getWorkFacts(brief.facts)`, `:107` the 400, `:118` `assertProjectOwner` (proves the project is already loaded by `tokenId`).
- `src/app/api/audience/work/generate-copy/route.ts:109` + `.../strategy/route.ts:54` — how the sibling work routes resolve the Brief carrying `facts.work`; imitate their server-side resolution.
- `src/hooks/editStore/aiActions.ts:285` — `regenerateStoryFromInterview` action (sends `brief`; to be trimmed + typed).
- `src/app/edit/[token]/components/StoryInterviewPanel.tsx` — the UI + wiring entry point; the `brief` prop + `as any` cast to drop.
- `src/app/api/audience/work/regenerate-story/route.test.ts:127` — the "missing brief.facts.work is a 400" test whose premise changes (400 now comes from the stored project, not the body).
- `getWorkFacts` + `BriefSchema` — the facts accessor + Brief shape.

## Open exploration questions (feeds scout)
- Does the project object loaded for `assertProjectOwner` already expose the stored Brief/`facts.work`, or is a separate (cheap) project→Brief resolution needed inside the route? What exactly do the `generate-copy`/`strategy` routes call to get `facts.work` from `tokenId`?
- Is `StoryInterviewPanel`'s `brief` prop populated anywhere today (does `MainContent` pass it), or is it always `undefined`? Confirms the 400 mechanism.
- Any caller of `/regenerate-story` other than the store action? (Anything else relying on the `brief` body param.)
- What's the correct server-side error shape when a project genuinely lacks `facts.work` (non-work project reaching the route)?

## Candidate human gates
- **Live work story-interview smoke** on a real work project (Kundius/atelier): submit the 3 answers → About regenerates, no 400. (Agent-runnable with keys, else founder.)

## Acceptance criteria
- [ ] A live work story-interview submit on a real work project succeeds — the About section regenerates, **no 400**.
- [ ] The route resolves `facts.work` **server-side** from the project's stored Brief; `brief` is removed from `RegenerateStoryRequestSchema` and no longer sent by the client (panel + store action).
- [ ] A project with no resolvable `facts.work` still returns a clean validation error (guard preserved, now server-derived) — covered by an updated route test.
- [ ] `regenerateStoryFromInterview` is declared on `src/types/store/actions.ts`; the `as any` cast in `StoryInterviewPanel` and the ad-hoc casts in `aiActions.ts` for this action are gone.
- [ ] Ownership gate, credit event, mock/demo path, and about-section target guard unchanged.
- [ ] `tsc` + `test:run` green (incl. the updated `regenerate-story` route test).

## Pilot / smallest slice
Single self-contained fix — no phasing. Standard tier, one impl-review over the diff. Decision gate = the live story-interview smoke passing on a real work project (was 400, now regenerates).

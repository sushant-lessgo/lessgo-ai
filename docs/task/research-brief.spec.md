# research-brief — spec

## Problem / why
Copywriting is 80% research, but generation today goes straight to the strategy
phase on model training data. The old research layer (Tavily/Perplexity + IVOC
extraction) failed structurally — shallow search snippets + mini-model
paraphrase inside the synchronous onboarding path produced output
indistinguishable from the free fallback, and V3 cut it (it is now dead code:
`src/lib/tavily.ts`, `src/lib/perplexity.ts`, `src/lib/ivocExtractor.ts` have
zero callers; `useGenerationStore` skips the research step). The moat claim
("copywriting-led") needs real customer voice + competitor positioning, and it
needs to be *visible* to the user — hidden research can't be charged for.

## Goal
At the end of the wizard the user picks one of two paths: **Quick** (current
flow, unchanged) or **Research-backed** (premium). The research path runs an
agentic Claude research loop (customer VoC + competitor positioning) in the
background, presents the findings as an editable **Brief** (this IS the Brief
of the Scale track), the founder prunes/approves it, and generation #1 is
produced from the approved brief. Research happens before any page exists —
never as a post-edit regeneration.

## Scope OUT (non-goals)
- No full-page regeneration of an already-edited page, ever.
- No applying research to existing/edited pages (per-section suggestions =
  future follow-up, not this build).
- No revival of Tavily/Perplexity/IVOC pipeline — that code gets deleted.
- No agent-side competitor *discovery* as primary path (fallback only).
- No internal pilot phase — straight to full build (user decision).
- Exact price point / Pro-vs-credits gating decided at pricing-v2, not here
  (build the gate hook, keep the number configurable).

## Constraints
- **Engine:** Anthropic API (`@anthropic-ai/sdk` already a dependency), Claude
  **Sonnet** (`claude-sonnet-5`), one agentic call using server-side
  `web_search_20260209` + `web_fetch_20260209` tools. No client-side scraping
  infra for VoC.
- **Research scope v1:** both halves — (a) VoC: verbatim pains / desires /
  objections from Reddit, review sites, forums; (b) competitor positioning:
  founder names 2–3 competitor URLs in the wizard; agent-discovery fallback
  only if left blank.
- **Async:** run may take 3–10 min; must survive serverless request time
  limits (background job, not a single request). User sees a live progress
  screen (findings streaming in) but is free to leave — brief persists on the
  project, email notification on completion (Resend, env-gated), resume from
  dashboard.
- **Brief UX:** editable cards (pain/desire/objection/competitor-claim), each
  with source link; delete / star / add-your-own; explicit "Generate" approval
  step. Not a wall of prose.
- **Cost:** ~$0.50–1.00 per run (~15 searches @ $10/1k + tokens). Charged in
  credits (order of 15–20; final number at pricing-v2). Research failure →
  fall back to quick path + refund credits.
- **Quick path stays byte-identical** — no added friction, fork defaults to
  Quick.
- **Sequencing:** built after scale pilot (specs 01–03) lands; fork lives at
  the scale-06 wizard's end; spec slots into the scale build order.

## References
- Scale track: `docs/task/scale-*.md` + scalePlan — the Brief concept this
  implements; wizard end/handoff = scale-06 (`src/components/onboarding/wizard/`,
  `src/modules/wizard/`).
- Dead research layer (delete, but mine for the IVOC shape):
  `src/lib/ivocExtractor.ts` (pains/desires/objections/beliefs/commonPhrases
  taxonomy is good), `src/lib/tavily.ts` (`filterVoCResults` whitelist =
  which sources actually carry VoC), `src/lib/perplexity.ts`.
- Generation entry: `buildStrategyPrompt` / `buildStrategicCopyPrompt`
  (`src/modules/prompt/buildPrompt.ts`) — approved brief feeds both phases.
- Credit gating: `src/lib/creditSystem.ts` (`checkCredits`, existing
  `IVOC_RESEARCH` cost entry to repurpose/replace).
- Scrape import (`/api/v2/scrape-website`) — URL-import users are the best
  research seed; SSRF-safe crawl pattern if any direct fetch needed.

## Open exploration questions
- What background-job mechanism fits our Vercel setup for a 3–10 min run
  (maxDuration streaming route vs queue vs cron-poll)? What's already proven
  in the codebase?
- Where does scale-06 wizard terminate / hand off to generation — exact seam
  for the fork screen?
- Does scalePlan already define a Brief data shape/model, or is the Prisma
  model new? How does Brief relate to `Project.content`?
- How do strategy + copy prompts best consume the approved brief (dedicated
  prompt section vs merged into business context)?
- Wizard slot for competitor URLs — new slot in scale-06 or part of the fork
  screen?
- Email-on-completion path: reuse lead-notification Resend wiring?

## Candidate human gates
- New Prisma model/migration for Brief (schema change).
- Anthropic API key + billing in production env (new prod vendor in request
  path).
- Credit price + Pro-gating decision (defer to pricing-v2; hook must exist).
- Deleting dead IVOC/Tavily/Perplexity files + their env keys.
- Any change touching the wizard→generation handoff while scale-06 is in
  flight.

## Acceptance criteria
- [ ] Wizard end shows two-path fork: Quick (default) vs Research-backed
      (gated); quick path behavior unchanged.
- [ ] Research path kicks off a background agentic run (Sonnet + web
      search/fetch) that survives navigation/refresh and serverless limits.
- [ ] Progress screen streams findings live; user can leave; email arrives on
      completion; run resumable from dashboard.
- [ ] Brief renders as editable source-linked cards: delete, star, add-own,
      across VoC (pains/desires/objections, verbatim quotes) + competitor
      claims/positioning-gap.
- [ ] "Generate" uses the approved (edited) brief in both strategy and copy
      phases; resulting page demonstrably references brief items.
- [ ] Founder-named competitor URLs collected; agent-discovery fallback when
      blank.
- [ ] Credits checked & charged on start; research hard-failure → quick-path
      fallback + credit refund; failure visible, not silent.
- [ ] Dead IVOC/Tavily/Perplexity code deleted; build/tsc/tests green.
- [ ] No code path regenerates an edited page.

## Pilot / smallest slice
None — straight to full build (user decision). Natural internal checkpoint
anyway: backend run + brief feeding generation works end-to-end (verifiable
via admin/flag) before fork UI + billing polish.

---
tier: full
tier-why: rebuilds 3 live regen routes onto the modern Zod stack + gating, hardens shared aiClient.ts (affects modern audience routes too), then deletes ~4,200 lines of legacy (buildPrompt/parseAiResponse). Broad blast radius + real-LLM QA gate — full pipeline.
---

# regen-modernization — spec

## Problem / why
The three regeneration endpoints — the buttons users click **most** while editing (`regenerate-content`, `regenerate-section`, `regenerate-element`) — are frozen on the repo's legacy generation stack while initial full-page generation runs on a modern, Zod-validated path. Result: the most-used AI surface produces visibly worse copy than first generation, on a near-deprecated model, through a fragile parser — and one of the routes is an open cost-abuse hole. Source: `docs/reports/code-quality-report.md` findings H3, H4, H5, M14, and the regen slice of M16.

- **H3** — `regenerate-content` takes a client-supplied `prompt` and calls OpenAI directly with **no credit check, no consumption, no ownership** — only a rate limit. Any signed-in user gets unlimited completions on our API key. (It is live, called from `regenerationActions.ts` and `contentOnlyRegeneration.ts` — not dead.)
- **H4** — all 3 routes hardcode `gpt-3.5-turbo`/Mixtral and feed `parseAiResponse.ts` (1,833 lines, the repo's only `@ts-nocheck`, 4-fallback regex JSON extraction that silently ships filler copy like "Transform Your Business Today" on partial parse). Fed by `buildPrompt.ts` (2,347 lines).
- **H5** — the shared `aiClient.ts` raw-JSON extraction (greedy `match(/(\{[\s\S]*\})/)` + unguarded `JSON.parse`) throws untyped on malformed output, bypassing the typed-fallback contract engines rely on. Failed generations still get billed.
- **M14** — `isInfrastructureError` matches `'500'`/`'length'` in message text → triggers a wrong second paid backup call. Silent credit/latency waste.
- **M16 (regen slice only)** — `callAIProvider` triplicated across the 3 regen routes; model strings have already drifted.

## Goal
Rebuild all three regeneration routes on the modern generation stack (`generateRawJson` + Zod-validated structured output, current model, typed fallback), each properly gated (auth + ownership + pre-spend credit check + charge-on-success). Harden the shared `aiClient.ts` parse + infra-error matcher they depend on. Once all three are migrated, delete the orphaned legacy `buildPrompt.ts` + `parseAiResponse.ts` (~4,200 lines) — the biggest single-code-deletion win in the repo. Regen copy quality should match or beat first-generation quality.

## Scope OUT (non-goals)
- **Deleting the regen endpoints** — all three are live editor paths; they get rebuilt, not removed.
- **The non-regen M16 items** — product↔service `parseCopy` mirror-pairs and `wizard/generation/thing.ts` (408-line fn, ×3 fetch) are unrelated to regen; left for a later cleanup pass.
- **Billing-correctness bundle** (H1/H2/M1/M2) — separate spec; but the regen routes' *own* credit gating IS fixed here (they were explicitly carved out of the billing spec to avoid two specs editing the same files).
- No change to the element/section content schema or the section list — regen must produce the same validated shape the editor already stores.
- No new regen UX/buttons — same toolbar affordances, better engine behind them.

## Constraints
- Regen output must validate against the **same Zod/element schema** the modern engine uses and the editor store expects — a regenerated element/section must drop into existing storage with no shape translation.
- Credit gating pattern must match the **check-then-charge-on-success** model chosen in `billing-correctness.spec.md` (verify balance up front → run AI → charge only on success). Reuse the copy-rails pattern (`social`/`outreach`/`email-sequences`), the report's best route code.
- H3 fix: prompt construction moves server-side (or is otherwise constrained) so the route is no longer an arbitrary-prompt proxy; add auth + `assertProjectOwner` + credit gate.
- Legacy-file deletion (`buildPrompt.ts`, `parseAiResponse.ts`) is the **final** step, allowed only after scout confirms nothing else imports them.
- `aiClient.ts` hardening (H5/M14) affects modern audience routes too — must be a strict improvement (no regression to existing typed-fallback behavior); covered by existing generation-contract tests.
- No CI gate — `tsc` + `test:run` green locally before done; the pilot gate additionally requires real-LLM manual QA.

## References
- `src/app/api/regenerate-content/route.ts:9-83` — H3 ungated proxy
- `src/app/api/regenerate-{section,element}/route.ts` — H4 legacy routes
- `src/modules/prompt/parseAiResponse.ts:7,150-207` — `@ts-nocheck` regex parser to delete
- `src/modules/prompt/buildPrompt.ts` — 2,347-line legacy builder to delete
- `src/lib/aiClient.ts:229-238` (H5 parse), `:166-185` (M14 infra-match)
- `src/hooks/editStore/regenerationActions.ts:77,261`, `aiActions.ts:98,362`, `src/utils/regeneration/contentOnlyRegeneration.ts:26` — the editor callers (contracts these routes must keep)
- **Pattern to imitate:** modern audience routes (`src/modules/audience/*`, `src/modules/engines`, `brief`) + copy rails (`social`/`outreach`/`email-sequences`) — report §7 world-class.

## Open exploration questions
- What exactly does each editor caller send/expect (request body + response shape) for content/section/element regen? Those contracts must be preserved.
- Does the modern `generateRawJson`+engine path support **section-scoped** and **single-element-scoped** generation, or only full-page two-phase? If not, what's the smallest scoped-generation primitive to build?
- Full import graph of `buildPrompt.ts` + `parseAiResponse.ts` — anything besides the 3 regen routes? (blocks the deletion step)
- What does `regenerate-content`'s client-supplied `prompt` actually contain — can prompt construction move fully server-side without losing editor context?
- Which model/config do the modern routes use, and does regen need any different generation params (temperature, scope hints)?

## Candidate human gates
- **Pilot decision gate** (below) — real-LLM quality of modern-stack element regen vs. current, before extending to section/content.
- Deletion of the ~4,200 legacy lines — sign-off after confirming zero remaining importers + all 3 routes migrated + green.
- `aiClient.ts` changes touch the shared generation client all AI routes use — verify no modern-path regression before merge.

## Acceptance criteria
- [ ] All 3 regen routes run on the modern stack (current model, `generateRawJson`+Zod, typed fallback); no route references `buildPrompt.ts`/`parseAiResponse.ts`.
- [ ] Each regen route enforces auth + ownership (`assertProjectOwner`) + pre-spend credit check + charge-on-success; `regenerate-content` is no longer an ungated arbitrary-prompt proxy.
- [ ] Regenerated content validates against the existing element/section schema and stores with no shape translation; editor callers unchanged (or contract-compatible).
- [ ] `aiClient.ts` parse is guarded (no unguarded `JSON.parse`, no greedy match surfacing untyped throws); malformed output yields the typed fallback, not a billed infra error. `isInfrastructureError` no longer matches on `'500'`/`'length'` substrings.
- [ ] Filler-copy failure mode ("Transform Your Business Today" on partial parse) is gone.
- [ ] `buildPrompt.ts` + `parseAiResponse.ts` deleted; `callAIProvider` no longer triplicated across regen routes.
- [ ] Real-LLM `/manual-test`: regen quality ≥ first-generation quality across content/section/element on a real page.
- [ ] `tsc` + `test:run` green.

## Pilot / smallest slice
**Pilot = `regenerate-element`** (smallest surface: single element). Rebuild it on the modern stack, gate it, and run real-LLM `/manual-test` comparing modern-stack element regen against current output. **Decision gate:** quality is at least as good → proceed to rebuild `regenerate-section` then `regenerate-content` on the proven pattern, then harden `aiClient.ts` and delete the legacy files. Quality regresses → stop and reassess the scoped-generation approach before touching the section/full-content paths that hit live customer pages.

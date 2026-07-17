# Copy Quality Eval — promptfoo suite + model/prompt optimization

How to measure landing-copy quality objectively, pick the right model per pipeline step, and iterate prompts without regressing. Copy quality is the product's key differentiator — this is the harness that keeps it honest.

**Timing (agreed 2026-07-09):**
- **Private beta (now, 20 users):** skeleton only — collect real Briefs + outputs + user-edit data (see data-capture plan, separate doc). Few hours of setup. No optimization campaign.
- **Between private beta and public launch (100 users):** the full exercise below. 1–2 focused weeks. This is the window: real eval set exists, scale-06 engine prompts have stabilized, cost starts mattering (pricing-v2 margins), and quality is about to become unrecoverable (public users churn silently).
- **After public launch:** maintenance — re-run suite on every prompt change and model release (~30 min), refresh eval set quarterly from real Briefs.

---

## 1. Repo touchpoints

| What | Where |
|---|---|
| Model per endpoint (tier map, pinned IDs) | `src/lib/modelConfig.ts` — endpoints `understand · strategy · uiblock · copy · privacy`; tiers `cheap`/`production`; env `AI_MODEL_TIER`, `AI_MODEL_OVERRIDE` (global, no per-endpoint override — eval harness passes model per call instead) |
| Prompt builders | `src/modules/audience/{product,service,work}/copyPrompt.ts` (+ each audience's strategy builder). Regen reuses these via `src/modules/generation/scopedRegen.ts`. (The legacy shared `buildStrategyPrompt.ts`/`buildPrompt.ts` are **deleted** — scale-08 / regen-modernization.) |
| Parsers (reuse as structural asserts) | `src/modules/audience/{product,service,work}/parseCopy.ts`; `scopedRegen.ts`'s `validateScopedSubset` for regen subsets. (Legacy `parseStrategyResponse.ts`/`parseAiResponse.ts` are **deleted**.) |
| Brief (eval-set fixture shape) | `src/types/brief.ts` (zod source: `src/lib/schemas/brief.schema.ts`); engines `thing · trust · work` |
| Existing real-LLM capture | `src/modules/audience/__tests__/captureGolden.test.ts` (`CAPTURE=1`) |
| Debug logging | `DEBUG_AI_PROMPTS`, `DEBUG_AI_RESPONSES` in `.env.local` |
| Clients | `src/lib/openaiClient.ts` (OpenAI + Nebius/mistral), `@anthropic-ai/sdk` |

⚠️ scale-06 is restructuring wizard→engine payloads. Build the suite against the **post-scale-06 engine inputs** (Brief-backed), not the old product/service store shapes — otherwise you optimize prompts about to be deleted.

## 2. Setup + layout

```bash
npm i -D promptfoo            # pin the version; upgrades change grader behavior
```

Keys: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` in `.env.local` (promptfoo reads env). Set `PROMPTFOO_DISABLE_SHARING=1` — never upload customer Briefs to promptfoo cloud.

```
eval/
  promptfooconfig.yaml        # main suite (per-step)
  briefs/                     # eval set: one JSON per Brief fixture
    thing-richscrape-01.json
    thing-bareoneliner-02.json
    trust-.../ work-...
  holdout/                    # 5–10 Briefs NEVER used during iteration
  prompts/
    strategy.ts               # prompt fn → calls real buildStrategyPrompt
    copy.ts                   # prompt fn → calls real copy builder
  providers/
    e2e.ts                    # custom provider: full strategy→copy chain
  rubrics/
    copy-rubric.md            # the quality rubric (versioned prose)
  results/                    # gitignored eval outputs
```

Gitignore `eval/results/`; **commit** `briefs/` only if scrubbed of anything sensitive (they're customer data — default: gitignore `briefs/` + `holdout/` too, keep them in a local/private store).

npm scripts:

```json
"eval": "promptfoo eval -c eval/promptfooconfig.yaml",
"eval:view": "promptfoo view"
```

## 3. Eval set (the foundation — everything else is machinery)

- **20–30 real Briefs** harvested from private beta (data-capture doc covers logging). Synthetic Briefs = optimizing for imagined customers; don't.
- **Diversity matrix — cover every cell at least once:** engine (thing/trust/work) × input richness (rich scrape / bare one-liner / manual-fill) × category spread. Name files so the cell is readable: `thing-richscrape-saas-01.json`.
- Each fixture = the exact object the engine consumes (Brief + resolved wizard fields), plus a `_meta` block: source user (anonymized id), date, known user edits (what they rewrote — this seeds the rubric).
- **Holdout:** move 5–10 to `eval/holdout/`, never look at them during iteration; run once before shipping a prompt version. Guards overfitting.
- Refresh quarterly; retire fixtures whose engine payload shape has drifted.

## 4. Wire promptfoo to the REAL pipeline

Two layers. Never paste prompt text into YAML — it drifts from code immediately.

**Layer 1 — per-step (primary; used for model ablation + prompt iteration).** A promptfoo *prompt function* imports the real builder, so what's evaluated is exactly what production sends:

```ts
// eval/prompts/strategy.ts
// NOTE: keep imports relative or register tsconfig paths — promptfoo's node
// loader doesn't know the `@/` alias. If a builder drags in alias-heavy deps,
// write a thin alias-free adapter instead of fighting the resolver.
import { buildStrategyPrompt } from '../../src/modules/prompt/buildStrategyPrompt';

export default async function ({ vars }: { vars: Record<string, any> }) {
  return buildStrategyPrompt(vars.brief /* fixture object */);
}
```

```yaml
# eval/promptfooconfig.yaml (sketch)
prompts:
  - file://prompts/strategy.ts
providers:
  - anthropic:messages:claude-sonnet-4-5-20250929
  - openai:gpt-4o
  - openai:gpt-4o-mini
  - anthropic:messages:claude-haiku-4-5-20251001
tests: file://briefs/*.json        # each fixture = one test's vars
defaultTest:
  options:
    provider: anthropic:messages:claude-opus-4-8   # judge ≥ strongest candidate
```

**Layer 2 — end-to-end (secondary; catches cross-step interactions).** A custom provider that runs the real chain in-process: per-audience `strategy builder → model → strategy assembly → copyPrompt.ts → model → parseCopy.ts`, returns the final page copy JSON. Use it for final pairwise verdicts between full configs (e.g. "Sonnet strategy + 4o-mini copy" vs "Sonnet both"), not for iteration — it's slow and expensive.

```ts
// eval/providers/e2e.ts — sketch
export default class E2EProvider {
  constructor(private cfg: { strategyModel: string; copyModel: string }) {}
  id() { return `e2e:${this.cfg.strategyModel}+${this.cfg.copyModel}`; }
  async callApi(_prompt: string, ctx: any) {
    const brief = ctx.vars.brief;
    // real builders + parsers, direct SDK calls with per-step model — no server needed
    // return { output: JSON.stringify(pageCopy), tokenUsage: {...} }
  }
}
```

Run each Brief **2–3× per candidate** (`--repeat 3`) — single samples lie at generation temperatures.

## 5. Assertions — three tiers, cheapest first

1. **Structural (code, free — never spend judge tokens on these).** `javascript` asserts that call the real parsers/zod schemas: parses, card counts honored, element schema valid, required elements present, no markdown leakage. A structural failure short-circuits quality grading.
2. **Deterministic quality guards (code).** Banned-phrase list (generic filler: "unlock", "elevate", "seamless", "game-changer"…), headline length bounds, reading-level ceiling, **claim grounding**: every number/proper-noun in output must appear in the Brief (regex-extract + membership check — catches invented claims mechanically).
3. **LLM-graded (judge).**
   - `llm-rubric` per dimension, scored per section not per page: specificity · claim grounding · voice/audience match · hook strength. Keep the rubric in `eval/rubrics/copy-rubric.md`, referenced from YAML — it's a versioned artifact.
   - **Pairwise (`select-best`) for model/prompt comparisons** — judges are unreliable at absolute 1–10, reliable at "A vs B + why". promptfoo randomizes; still sanity-check for position bias by flipping once.

**Build the rubric from user-edit data, not intuition:** the sections private-beta users rewrote most define the failure modes; encode those as rubric dimensions first.

## 6. Calibrate the judge (do this before trusting any number)

1. Pick ~15 output pairs; blind-rank them yourself (founder taste = ground truth).
2. Run the judge on the same pairs; compute agreement.
3. **≥80% → trust judge at scale. <80% → fix the rubric wording (usually too vague), not the judge model.** Re-check after every major rubric edit.
4. Ties: treat judge deltas smaller than its self-disagreement (run judge twice on identical pairs to measure noise) as ties.

## 7. Model ablation per step

Goal: cheapest model per endpoint that holds quality. Method: **change ONE endpoint's model at a time**, hold the rest at the current production config (`modelConfig.ts` production tier = Sonnet primary), so deltas attribute cleanly.

- Endpoints worth ablating: `strategy`, `copy`, `understand` (scrape extraction). `uiblock`/`privacy` are low-stakes — cheapest model that passes structural asserts, done.
- Candidates per step: Sonnet 4.5, GPT-4o, Haiku 4.5, gpt-4o-mini (matches the pinned set in `modelConfig.ts`). Add new releases to the same matrix later.
- **Read the results as $/page vs pairwise win-rate,** not $/Mtok — verbosity differs per model. promptfoo records token usage; $/page for the two-phase pipeline = strategy(in+out) + copy(in+out) at list price. Find the knee; also note p50 latency (a human is waiting in onboarding).
- Expected shape (verify, don't assume): strategy = highest leverage → strongest model pays for itself; copy = volume → mid model may hold if strategy is strong; extraction/classification → cheap.
- Decision lands in `modelConfig.ts` production map — one line per endpoint. If a mixed config wins, that's already supported; per-endpoint env override is NOT (only global `AI_MODEL_OVERRIDE`) — add it only if you need live A/B, not for the eval.

## 8. Prompt optimization loop

Prerequisite: sections 3–6 done. Iterating without a scored eval set is vibes.

The loop (repeat until stop rule):
1. **Baseline:** `npm run eval`, record score + $/page against the current prompt version.
2. **Diagnose, don't invent:** read the 5 worst outputs; bucket failure modes (generic copy / wrong voice / invented claims / ignored Brief fields / weak hooks). Attack ONLY the top bucket.
3. **One change per iteration.** Two changes = unattributable.
4. Re-run; **keep if pairwise-better, revert if not.** Deltas below judge noise = tie = revert (prefer the shorter prompt).
5. Commit prompt + its score together (see §10).

Rules of thumb:
- **Failure-driven, not addition-driven.** Prompts accrete rules that dilute each other; 800 sharp words beat a 2000-word rule list. Prefer *rewriting* a section over appending an exception.
- **Examples > rules.** One excellent few-shot example often replaces 500 words of instruction. Test 0 vs 1 vs 2 examples explicitly — biggest token cost AND biggest quality lever.
- **Meta-prompting to draft candidates:** feed a strong model the current prompt + 5 bad outputs + why they're bad → "rewrite to fix". Eval the rewrite like any candidate; you stay gatekeeper. (This is the automated "goal loop" — it only works with the harness scoring it.)
- **Prune after quality stabilizes:** delete prompt sections one at a time; score holds → deletion stays. Mature prompts carry 30–50% dead weight.
- **Cache-aware ordering beats trimming:** static instructions/examples first, variable Brief last → stable prefix → Anthropic/OpenAI prompt caching cuts input cost more than word-cutting does. (Both providers require prefix stability.)
- **Stop rule:** two consecutive iterations inside judge noise → ship, run holdout, collect real Briefs, come back later.
- **Before shipping:** run `eval/holdout/` once. Holdout regression → you overfit; back up one version.

## 9. Regression gate (no CI — local, like everything else)

Before pushing any change to prompt builders, parsers, or `modelConfig.ts` to main (Vercel auto-deploys):

```bash
npm run eval        # full suite vs last committed baseline
```

Gate: no structural failures, pairwise vs previous prompt version not-worse, $/page within budget. This is the same discipline as build/tsc/tests-green-before-push. promptfoo's local cache makes unchanged cells free, so re-runs are cheap.

## 10. Versioning

- Prompt versions live in git (builders are code — already versioned). Tag eval baselines: commit `eval/results/baseline-<date>.json` summary (scores only, no customer text) or log score in the commit message: `prompt(copy): sharpen hook rules — pairwise +12% vs v14, $/page 3.1¢`.
- Rubric changes invalidate score comparability — bump a rubric version string in `copy-rubric.md` and re-baseline.
- Model IDs stay pinned (as `modelConfig.ts` already does); "latest" aliases silently shift under you.

## 11. Pitfalls

- **Optimizing prompts mid-restructure** (scale-06): wait for engine payload shape to settle; eval against post-scale-06 inputs.
- **Absolute scores across sessions:** judges drift; only trust pairwise within one eval run, and re-baseline after judge/rubric changes.
- **Synthetic Briefs:** you'll ship copy tuned to customers that don't exist.
- **Judge = candidate model:** self-preference bias; keep judge one tier above candidates.
- **Skipping repeats:** 1 sample per Brief at temp>0 = noise cosplay as signal.
- **Leaking Briefs:** `PROMPTFOO_DISABLE_SHARING=1`; keep `briefs/` out of git unless scrubbed.
- **`@/` alias in eval imports:** promptfoo's loader won't resolve it — relative imports or thin adapters.
- **Uploading rubric burden to the judge:** anything checkable in code (schema, banned words, number-grounding) is a code assert, always.

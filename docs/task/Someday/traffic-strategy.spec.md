---
tier: standard
tier-why: New self-contained API route + panel component + prompt builder over the Brief + one external Reddit search/verify call + a credit-cost constant. Low blast radius; touches no risky surface (no middleware/auth, dual-renderer, publish path, or billing schema — credit gating reuses existing checkCredits).
---

# traffic-strategy — spec

## Problem / why
Customers finish a landing page and are confused about the next step: *where do my ideal
clients actually hang out online, and what do I do to reach them?* They imagine wanting "a
list of every Facebook group / subreddit / etc." but the real gap is a prioritized, do-this
*strategy* — which channels to bet on given who they are and how much time they have.

## Goal
A self-contained "Get traffic" tool: customer sets a few inputs (time/day, on-camera comfort,
ad budget band), clicks once, and gets a prioritized traffic strategy built from their existing
Brief. Each channel/tactic is annotated with effort-vs-payoff and an automation tag
(*manual / automatable / agent-later*) — quietly pre-selling the execution agents Lessgo will
build next. Reddit recommendations are grounded in real, verified subreddits; the rest is
strategy.

## Scope OUT (non-goals)
- **No execution.** H1 is advisory only — we recommend, we don't post/DM/automate. The agents
  that run the automatable tactics are H2, later.
- **No live specific-place sourcing beyond Reddit.** X / LinkedIn / Facebook / SEO = strategy
  and channel guidance, NOT verified live links/groups. Facebook groups explicitly not sourced
  (ungettable — no API, login-walled).
- **No fixed placement / UI wiring.** Built as a pluggable module; it drops into the reserved
  space in the new UI redesign later. Do not couple to the in-flux redesign or add nav.
- No new persistence model / schema change for the pilot (stateless generation; reuse existing
  credit ledger for gating).
- No scheduling, no analytics-of-results, no multi-language.

## Constraints
- **Brief-driven.** Consumes the existing Brief as the primary context — do not re-interview the
  business. Only the 3 net-new inputs below are asked.
- **3 inputs only** (interview bloat is the enemy): time/day, on-camera comfort, ad-budget band
  (none / small / meaningful).
- **Real means verified.** Any Reddit subreddit shown must be verified to exist before display —
  an LLM naming `r/PlausibleSounding` that 404s is a trust-killer. Verify via a real lookup, drop
  the unverifiable ones (fewer-but-real beats big-but-fake).
- **Credit-gated.** It's an AI operation → gate with `checkCredits()` and add a cost constant in
  `creditSystem.ts` (propose a value; matches SECTION_REGEN-ish tier).
- SEO/content is a first-class channel in the mix, not an afterthought.
- Latency/cost of the Reddit verify step must be bounded (small N, timeout, graceful degrade to
  strategy-only if search fails).

## References
- **Brief** — the closed input contract (scale track, `scalePlan.md`; `src/modules/audience/*`
  builders). This tool is another consumer of the Brief.
- **Prompt-over-context pattern** — `/api/audience/{product,service}/strategy` builders and
  `/api/v2/understand` (single structured AI call over gathered context) are the shape to imitate.
- **Credit gating** — `src/lib/creditSystem.ts` (cost constants), `checkCredits()`, `UsageEvent`
  ledger.
- **Bounded external fetch** — `/api/v2/scrape-website` SSRF-safe pattern for the Reddit call.

## Open exploration questions
- Reddit sourcing: is `https://www.reddit.com/subreddits/search.json?q=` (unauthed public JSON)
  sufficient + reliable for finding + verifying real subreddits, or do we need the LLM to propose
  then a `/r/{name}/about.json` existence check? Which gives better trust with bounded calls?
- Where does the Brief live at read-time for a given project/token, and is it always populated by
  the time a customer would open this tool?
- Does an app-side credit-gated AI route already have a canonical skeleton to clone (auth + token
  scope + checkCredits + provider fallback)?
- Provider: reuse the OpenAI/Nebius generation chain, or is this a candidate for a different model?

## Candidate human gates
- Credit cost value for the new operation (product/pricing call).
- The output taxonomy of channels + the automation tags (manual/automatable/agent-later) — founder
  should eyeball once, since it's the roadmap customers will read.
- Real-LLM output-quality QA on 2–3 real Briefs before it's considered shippable (strategy must be
  genuinely useful, not generic "post on LinkedIn" filler).

## Acceptance criteria
- [ ] Given a project's Brief + {time/day, camera comfort, budget band}, one click returns a
      prioritized traffic strategy.
- [ ] Strategy covers social + communities + **SEO/content**, prioritized (not a flat list) for
      *this* ICP.
- [ ] Each tactic carries an effort-vs-payoff read and an automation tag
      (manual / automatable / agent-later).
- [ ] Reddit section shows only subreddits verified to exist; unverifiable ones are dropped, and a
      search failure degrades gracefully to strategy-only (no crash, no fake links).
- [ ] The 3 inputs materially change the output (video-averse ≠ video-comfortable; no-budget ≠
      meaningful-budget).
- [ ] Operation is credit-gated and writes a usage event.
- [ ] Delivered as a self-contained module (API route + panel component) with no fixed placement
      and no coupling to the UI redesign.
- [ ] `tsc` + `test:run` green; real-LLM quality QA passed on 2–3 Briefs.

## Pilot / smallest slice
The whole H1 above **is** the pilot — one prompt-over-Brief generation + a bounded Reddit
verify step, rendered in a standalone panel, credit-gated.

**Decision gate after pilot:** run it on 2–3 real customer Briefs. If the strategy reads as
genuinely useful and specific (not generic advice a blog could give), proceed to enrich other
channels and begin H2 (the execution agents). If it reads generic, the fix is prompt/context
depth before any expansion — do not build agents on top of weak advice.

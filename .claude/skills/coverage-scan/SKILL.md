---
name: coverage-scan
description: Runs the coverage-100 experiment — for each website in the user-provided list, spawns site-scraper (Sonnet/medium, raw capture) then site-analyzer (Opus/medium, taxonomy classification), one site at a time, resumable across sessions. Use when the user says "run the coverage scan", "scan the 100 sites", or wants to continue/resume the experiment. NOT for aggregation/synthesis (done manually in the main session when all sites are complete).
---
# coverage-scan

Drive the coverage-100 experiment: scrape + analyze every site in the list,
sequentially, resumable. Purpose: ground the template/section/capability
coverage north star in 100 real ICP websites (see docs/tracks/scalePlan.md §2,
docs/task/template-factory.spec.md).

## Data home: `docs/research/coverage-100/`
- `sites.md` — USER-provided list, one site per line: `<url>` or `<url> | <note>`.
  Lines starting with `#` are comments. Never edit the URLs yourself.
- `raw/<slug>.json` — site-scraper output (gitignored).
- `analyzed/<slug>.json` — site-analyzer output (committed).
- `progress.json` — `{ "<slug>": { "url": "", "scraped": bool, "analyzed": bool, "status": "done|scrape-failed|analyze-failed|blocked", "confidence": "", "note": "" } }`
- `findings.md` — final aggregation (written manually at the end, not by this skill).

## First run only (setup)
1. Create the directories. Ensure `.gitignore` contains the line
   `docs/research/coverage-100/raw/`. Create empty `progress.json` if absent.
2. If `sites.md` is missing → STOP and ask the user for the list. Never invent sites.

## Main loop
1. Read `sites.md` + `progress.json`. Derive slug from domain
   (`kemmetdental.com` → `kemmetdental`; dedupe with `-2` suffix).
2. For each site not yet `done`, ONE AT A TIME (sequential, never parallel —
   keeps failures attributable and load polite):
   a. If not scraped: spawn **site-scraper** via Agent
      (`subagent_type: "site-scraper"`) with prompt: the URL, the slug, output
      path `docs/research/coverage-100/raw/<slug>.json`.
   b. If scraped and not analyzed: spawn **site-analyzer**
      (`subagent_type: "site-analyzer"`) with prompt: the slug and raw path.
   c. Update `progress.json` after EACH agent returns (crash-safe resume).
   d. Failures: record status + reason, move on. Never retry more than once,
      never silently drop a site.
3. **Spot-check gate — after the first 5 sites, STOP.** Show the user a compact
   table (slug · engine · single/multi · confidence · gap findings) plus one
   raw/analyzed pair, and ask whether capture quality is good enough to
   continue. Only proceed past 5 on explicit go-ahead. (Agreed escalation: if
   scraper quality is the problem, bump site-scraper to a bigger model/effort
   in its frontmatter before burning the remaining 95.)
4. Batch size: process ~15–20 sites per session, then report progress and stop
   — the loop is resumable; don't blow the context window. On re-invocation,
   resume from `progress.json` automatically.

## Progress report (end of every session)
One table: done / scrape-failed / analyze-failed / remaining counts, plus the
running low-confidence list and any `proposed_new` capabilities or `unmapped`
sections seen so far (these are the experiment's live signal — surface them
early, don't sit on them).

## When ALL sites are done
Tell the user aggregation is ready to run in the main session (NOT a subagent):
frequency matrices (engine × section, capability counts, single-vs-multi %,
design-style distribution), gap list, and the build-priority read → written to
`findings.md`. That synthesis is deliberately human+main-model work.

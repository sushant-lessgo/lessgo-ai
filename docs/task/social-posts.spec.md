# social-posts — spec

## Problem / why
Landing pages are one-and-done → customers publish, then never log in. Meanwhile they need
social content continuously (their own calendar: multiple platforms, posts daily) and
re-prompting ChatGPT with brand context every time is unsustainable and drifts off-brand.
Lessgo already holds structured brand data per project (brief/strategy, testimonials,
products/features, offer, audience) that generic tools can't match without effort.
This is a Pro value-stack + retention play: "unlimited on-brand posts, included in Pro."

## Goal
Per-project on-brand social post generator. User opens a project, picks platform + input
mode, generates, gets on-brand text posts every time, copies out to their own
calendar/tools. Recurring weekly/daily use → retention + Pro conversion hook.

## Scope IN
- Platforms: **LinkedIn, X, Facebook** — as per-platform tone/length presets on one engine.
- Text only.
- 3 input modes:
  1. **Archetype only** — pick type (inspirational / product spotlight / testimonial quote / tip / announcement), generate from brand data alone.
  2. **Archetype + fresh context** — free-text box ("we just shipped X", "reacting to Y").
  3. **Polish my draft** — paste rough text → rewritten on-brand for chosen platform.
- Brand context source: **the project** (brief/copyStrategy, testimonials, products/features, offer). Per-project scoping; feature lives inside a project.
- **Minimal post library**: every generation saved per project; list, revisit, copy, delete. Nothing more.
- Gating: **Pro = included**, invisible soft abuse cap (~300 posts/mo). **Free = 10 posts total**, then upgrade wall. Do NOT charge from the page-generation credit pool — real COGS ~$0.002/post; charging per post would punish the daily use we're selling.

## Scope OUT (non-goals)
- Scheduling, auto-posting, platform OAuth (copy button is the ship mechanism)
- Images / quote cards / any visual generation
- Content calendar (customer keeps theirs externally)
- Instagram, WhatsApp, other platforms (later)
- Post analytics, hashtag research, best-time-to-post
- Library extras: folders, tags, search, sharing
- No pilot kill-gate: committed permanent feature, improved iteratively post-ship

## Constraints
- **Complete separate build**: own worktree + `feature/social-posts` branch; merge to main later (human gate as usual).
- Must not touch/destabilize the landing-page generation pipeline; reuse brand-context data read-only.
- Generation provider = existing chain (OpenAI gpt-4o-mini primary → Nebius fallback), consistent with the rest of the app.
- Gating must compose with pricing-v2 (Free 20 one-time credits / Pro 200cr) WITHOUT drawing from that credit pool — separate allowance/counter.
- Works for both audiences (product + service projects); degrade gracefully when a project lacks testimonials/products.

## References
- `src/modules/audience/*` strategy builders — how brand/business context is assembled into prompts today; the post engine should read the same sources.
- `src/modules/prompt/` — prompt builder + parser patterns to imitate (incl. mock generator for tests).
- `src/lib/planManager.ts` + `src/lib/creditSystem.ts` — feature-flag/limit patterns; add social allowance here, not as credit costs.
- `prisma/schema.prisma` `Project` / `FormSubmission` — table shape conventions for the new posts table.
- Dashboard project UI (`src/components/dashboard/`) — where the entry point lives.

## Open exploration questions
- Where exactly does per-project brand context live post-scale-08 (Brief? `Project.content` JSON? strategy output persisted?) and what's the cleanest read-only accessor?
- Existing per-user monthly counter pattern (`UserUsage`) — reusable for the ~300/mo soft cap + Free 10-total counter?
- Dashboard UI: best placement for a "Social posts" tab/panel per project (edit page vs dashboard project card)?
- Testimonial availability: which audiences/templates actually store testimonials, and in what shape?

## Candidate human gates
- Prisma migration for the posts table (schema change).
- Any edit to `planManager.ts` plan limits (touches billing surface).
- Merge `feature/social-posts` → main (standard workflow gate).

## Acceptance criteria
- [ ] From a project, user can generate a post for each platform (LinkedIn/X/Facebook) in each of the 3 input modes; output reflects that project's brand data (name, offer, voice; testimonials/products where present).
- [ ] Per-platform presets differ visibly (length/tone/format, e.g. X ≤ 280 chars).
- [ ] Generated posts persist per project; list view with copy + delete; survives refresh.
- [ ] Free user hits upgrade wall after 10 posts total; Pro user unaffected up to soft cap; page-generation credits untouched by post generation.
- [ ] Landing-page generation, editing, publishing unaffected (`tsc` + `test:run` + build green).
- [ ] Works on a service project without products and a product project without testimonials (no crash, sensible output).

## Pilot / smallest slice
No decision gate (committed feature). Build order still thinnest-first: engine + one
platform end-to-end (LinkedIn, all 3 input modes, library) → then X/Facebook presets →
then gating/caps. Dogfood on lessgo.ai's own socials + naayom from day one.

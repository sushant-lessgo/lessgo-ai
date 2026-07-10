# cold-outreach — spec

## Problem / why
Value-stack motion (social-posts → email-sequences → this). Customers need outreach to get their first leads, but generic AI cold messages have zero differentiation — every tool writes clever templates about the SENDER. Differentiation = making the RECIPIENT an input. We uniquely can: our SSRF-safe crawler already reads websites; pointing it at a prospect's site grounds the message in THEIR business.

## Goal
Generate platform-correct cold outreach copy grounded in a specific prospect: user pastes prospect's website URL (or raw text: LinkedIn about, bio), we scrape/read it, and produce messages that reference the prospect's actual business tied to the sender's offer (from Brief). Copy-only — user sends manually.

## Specificity ladder (the design spine)
1. **Brief (free)** — sender's offer, proof, category, ICP → tone + value prop. Alone = generic, never ship alone.
2. **Outreach intake (once per project)** — target descriptor (role/industry, prefilled from Brief ICP), platform(s), opener context. Stored, editable.
3. **Per-prospect grounding (the moat)** — prospect URL → reuse `/api/v2/scrape-website` crawl+extract machinery → message references their business ("you do X for Y — we help exactly that with Z"). Fallback: paste raw text instead of URL.

## Platform formats (prompt templates, all cheap once rail exists)
| Platform | Format constraints |
|---|---|
| Cold email | subject (the 80% job) + body ≤120 words + 1 CTA |
| LinkedIn connection note | ≤300 chars, no pitch |
| LinkedIn InMail/DM | short pitch, proof line, soft CTA |
| WhatsApp | 2–3 casual lines, no link-dump |
| Instagram DM | reference their content first, then bridge |

Per prospect: generate for user-selected platform(s); each message regeneratable; follow-up/bump message optional per platform.

## Scope OUT (non-goals)
- Sending anything (no email/DM automation, no bulk, no CSV import of prospect lists) — spam-cannon risk, deliberate
- Prospect discovery/list-building (we don't find prospects, user brings them)
- LinkedIn scraping (ToS; LinkedIn input = user pastes text, never we fetch)
- CRM/pipeline tracking of prospects
- Sequences/cadences beyond one optional bump message (email-sequences is the sequence product)

## Constraints
- Reuse social-posts scaffolding pattern (prompt builder + route + copy-block UI + regen) — same rail as email-sequences
- Reuse `/api/v2/scrape-website` crawl + structured-extraction internals for prospect scrape (SSRF guards mandatory); do NOT fork a second crawler
- Proof-truth rules: sender claims only from Brief; prospect facts only from scrape/pasted text — no invention on either side
- Credits: prospect scrape ≈ SCRAPE_WEBSITE=1 precedent; generation cost TBD
- Ship UNGATED like social-posts; gating with pricing-v2; kill-switch caveat applies
- Separate worktree/branch
- OpenAI/Nebius generation path

## References
- social-posts feature (branch `feature/social-posts`) — generation/UI/regen pattern
- `/api/v2/scrape-website` + its crawler lib — prospect grounding machinery
- `docs/task/email-sequences.spec.md` — sibling value-stack spec, same rail
- `src/lib/creditSystem.ts` — SCRAPE_WEBSITE credit precedent

## Open exploration questions
- Where scrape-website's crawl/extract internals live; how separable from onboarding-specific prompt (extraction here targets: what prospect does, for whom, notable specifics to reference)
- Social-posts UI surface — same tab pattern for outreach?
- Where outreach intake (level 2) persists — Brief extension vs separate store
- Prospect scrape results cache/persist per project? (re-generate without re-scrape)

## Candidate human gates
- Merge to main (standard)
- Deploy: gating/kill-switch stance (social-posts precedent)
- Any change touching scrape route/SSRF guards — review carefully

## Acceptance criteria
- [ ] Paste prospect URL → scraped → generated message references ≥1 concrete prospect-specific fact
- [ ] Paste raw text fallback works (no URL)
- [ ] Scrape fails/blocked → clean fallback to level-2 copy with visible "generic — add prospect info" notice, no error
- [ ] Per-platform format constraints respected (email subject+body, LI note ≤300 chars, etc.)
- [ ] Sender claims traceable to Brief; prospect facts traceable to scrape/paste (proof-truth)
- [ ] Each message regeneratable; copy button per message
- [ ] Credits charged for prospect scrape
- [ ] tsc + test:run + build green

## Pilot / smallest slice
Cold email + LinkedIn connection note only, URL-grounding path end-to-end (intake → scrape → 2 messages). Validate "references their business" quality on real prospects → then WhatsApp/IG/InMail formats + bump messages (prompt-template additions).

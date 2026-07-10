# email-sequences — spec

## Problem / why
Lessgo is copywriting-first; Pro needs value-stack beyond the page (social-posts was the first). Customers' pages end at the conversion click — what happens after (lead → warmed → shows up / buys) is copy they currently write badly or not at all. A goal-matched email sequence is the highest-want next artifact for current customers (esp. book-call → show-up sequence).

## Goal
For a project's Brief goal, generate ONE matched email sequence (copy only) the user can paste into Calendly Workflows / their ESP / Gmail. Same product pattern as social-posts: generate from Brief, show as copy blocks, regeneratable, credits-gated later.

**Copy-only v1 — Lessgo does NOT send these emails.** (Resend infra exists only for one-shot blog broadcast; sequences need scheduling + per-goal triggers we don't own — deliberately out.)

## Goal → sequence map (6 archetypes over the frozen 18-intent vocabulary)
| Archetype | Intents | Emails |
|---|---|---|
| Show-up | book-call, request-demo, book-me, rsvp | 4: confirm+agenda → proof → 24h reminder → 1h reminder |
| Follow-up nurture | enquiry, request-quote, apply | 4: instant reply → proof → objection-killer → direct CTA |
| Lead-magnet delivery | lead-magnet | 4: deliver → consume nudge → related proof → offer |
| Waitlist warm-keeper | waitlist | 3: you're in → update/story → early-access offer |
| Welcome series | subscribe-newsletter, enroll | 3: welcome+expectations → best content/story → soft offer |
| Activation | signup-free, free-trial | DEFERRED (not v1) |

Skip entirely (no email relationship): follow-social, buy-via-link, order-via-platform, pay-via-link, download-app. Archetype keyed by INTENT, not mechanism (M2/WhatsApp-mechanism goals still get their intent's archetype).

## Scope OUT (non-goals)
- Sending emails (no scheduler, no Resend sends, no Calendly OAuth/webhooks)
- Per-customer sender domains / deliverability work
- Unsubscribe/suppression for sequences (n/a — we don't send)
- Activation archetype (signup-free / free-trial)
- Skipped intents above
- A/B variants, sequence analytics

## Constraints
- Reuse the social-posts scaffolding/pattern (prompt builder + generation route + copy-block UI list + regenerate)
- Copy generated from Brief (offer, ICP, proof); respect proof-truth rules — no invented named companies / hard metrics
- Ship UNGATED like social-posts; credits/Pro gating lands with pricing-v2 — do NOT deploy without gating or kill-switch (same caveat as social-posts)
- Build on a separate worktree/branch (user directive)
- OpenAI/Nebius generation path (not Anthropic)

## References
- social-posts feature (branch `feature/social-posts`) — the whole pattern: generation, UI, regen
- `src/modules/goals/vocabulary.ts` — frozen 18-intent × M1–M5 vocabulary (archetype keying)
- `src/lib/email/sendBlogPostNotification.ts` — existing Resend usage, for context only (NOT used here)

## Open exploration questions
- Where social-posts' prompt builder / route / UI live and what to clone
- Where Brief fields (offer, ICP, proof) are read for social-posts generation
- Where sequence output should surface in dashboard/editor (same tab pattern as social-posts?)
- Per-email fields needed: subject + body; timing label ("send 24h before") as static per-archetype metadata, not AI-generated?

## Candidate human gates
- Merge to main (standard)
- Any deploy: confirm gating/kill-switch stance vs social-posts precedent

## Acceptance criteria
- [ ] Project with a mapped intent → generates its archetype's full sequence (subject + body per email + timing label)
- [ ] Copy uses Brief facts; no fabricated proof (proof-truth compliant)
- [ ] Unmapped/skipped intent → feature hidden or clean empty state (no error)
- [ ] Each email regeneratable individually
- [ ] Copy-paste friendly output (per-email copy button)
- [ ] tsc + test:run + build green

## Pilot / smallest slice
Show-up archetype only (book-call et al) end-to-end → validate quality with a real customer → then the other 4 archetypes (mostly prompt-template additions on the same rail).

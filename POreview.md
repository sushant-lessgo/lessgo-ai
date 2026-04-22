Strengths                                                                                                           
                                                                                                                      
  - Right scope for beta. No schema. Mirrors existing patterns.                                                       
  - notFound() over 403 — correct.                                                                                    
  - Env-var gate over isAdmin field — correct for solo stage.                                                         
  - Effort estimate realistic.                                                                                        
                                                                                                                      
  Issues / gaps                                                                                                       
                                                                                                                      
  P1 — existing /api/admin/* routes are PUBLIC in middleware (src/middleware.ts:22-25): migrate-project,              
  transfer-ownership, kv, env-check. Plan ignores these. If you're formalizing admin, gate them with same
  isAdmin(clerkId) helper. Otherwise anyone hitting those endpoints owns your data.

  P2 — you're leaving PMF signal on the table. Models exist, plan excludes:
  - UserUsage / UsageEvent — credits used per user = engagement proxy. Highest PMF signal you have. Add column.
  - FormSubmission count per published page — actual conversions.
  - UserPlan.tier + stripeCustomerId — you dismissed as scope creep but for PMF hunt, "who paid" is the single most
  important row. Reconsider.

  P3 — inputText in projects table. Can be long (full user prompt). Truncate to ~80 chars in cell; full text on hover
  or modal.

  P4 — PostHog free tier caps 5k recordings/month. Beta volume probably fine, but worth a mental note — no action
  needed yet.

  P5 — ph_is_internal localStorage hack at ph-provider.tsx:19-25 creates disposable identities that'll muddy replay
  attribution. Unrelated to this plan but worth flagging for cleanup.

  Nits

  - capture_pageleave: true redundant — you already do manual pageview. Drop or leave, no-op.
  - Plan line 17 says config at lines 12-17, actually 13-17. Minor.

  Answers to your unresolved Qs

  - Comma-sep list: yes.
  - maskAllInputs: false: yes for beta. Revisit before GA.
  - All-routes replay: yes, keep simple.
  - Billing in admin row: change to yes — see P2.

  Suggested reorder

  1. P1 (security) before anything else — 15 min.
  2. Session replay flip.
  3. Admin page with credits + plan tier columns added (P2).
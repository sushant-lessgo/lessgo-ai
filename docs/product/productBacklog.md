# Product Backlog

Things I want to build. Unspecced — moves to `productQueue.md` once a spec exists.

1. Lessgo.ai.. separate the app from marketing site
2. Branded sign up, log in page
3. Engine coverage — RULED 2026-07-11: all 4 engines before beta; work then place; see `docs/tracks/templatePlan.md` T5/T6
4. **Place engine** — restaurants/hotels/venues; build ASAP after work engine, before beta; bundles menu/multi-location/events capabilities (templatePlan T5, wave 2)
4. should be able to download something after filling a form
2. **lessgo.ai main website** — built WITH Lessgo (customer zero, gap-finder)
3. **Beta-public** — no-login create + marketing site live (scalePlan §11.10)
4. **Universe v1** — SPECCED as track: `docs/tracks/universePlan.md` (queue #5)
5. **Publish-modal title cleanup** — publish modal's free-text title input now redundant with per-page SEO title (SeoSettingsModal); remove it, but `PublishedPage.title` feeds dashboard listing/smart-title/existing-publish reuse — check blast radius (2026-07-10)
6. **DTR alternative** — instead of dynamic text replacement, generate N real pages per ad keyword
7. **Ad-platform integrations** — import/sync campaigns from Google/Meta
8. **Ad copy writing** — currently we consume ad copy, never generate it
9. **CRM webhooks / deeper GTM integration**
10. **"Ask AI to do something" button** — freeform AI command on edit page
11. **Per-section surface override** — flip a section to a different template surface (cream/white/ink/accent) vs `getSurfaceForSection()` default; both renderers via `data-surface`; needs template-contract method to enumerate surfaces + picker UI. Replaces dead background modal (killed 2026-07-07)
12. **Email continuation pages** — paste email → extract tone/offer/CTA → generate matching page reusing brand assets
13. **Landing page types by traffic source** — Main (current) / Ad-PPC (no nav, single CTA) / SEO (content-rich) / Social (platform tone)
14. **Problem section UIBlock gaps** — only 2 UIBlocks today; missing: simple bullets, statistics-driven, single emotional statement, cost-of-inaction, industry-specific
15. **Social media post writing** — BUILT (phases 1-6) on `feature/social-posts`, spec `docs/task/social-posts.spec.md`, plan `docs/task/social-posts.plan.md`. Engine + 3 platforms + 3 modes + library + dashboard UI, all green. **⚠️ SHIPPED UNGATED — phase 7 (gating/caps + upgrade wall) is DEFERRED behind `docs/task/pricing-v2.spec.md` (2026-07-10 PO call).** Until phase 7 lands, Free users have UNLIMITED post generation (no `checkLimit` in the POST route). Do NOT merge/deploy the branch without either phase 7 or a kill-switch. Phase 7 is fully specced in the plan (§Phase 7): `PLAN_CONFIGS.limits.socialPosts` FREE 10 / PRO 300 / AGENCY -1 / ENTERPRISE -1 (must equal the phase-2 backfill SQL), written by ALL FOUR limit-writers incl. `startTrial`, counts read the append-only `UsageEvent` ledger. Schema (`SocialPost` + `UserPlan.socialPostsLimit` + backfill) already migrated in phase 2.
16. **Pre-built IVOC database** — DB-first lookup keyed `(categoryKey, audienceKey)`, live search only on miss (Tavily removed scale-08, `IVOCCache` table retained)
17. **Competitor research** — per competitor: idea, USP, pain/desire focus, real praise+complaint quotes (G2/Capterra, Reddit, X, YouTube)
18. **Full live + RAG research layer** (~$0.25-0.30/gen) — live search + quote corpus, profile-similarity merge; premium tier
19. **A/B testing** — page variations + performance tracking (overlaps Universe track)
20. **Team collaboration** — multi-user accounts, roles/permissions
21. **Heatmaps** — beyond current conversion analytics
22. **SEO value-stack** — see `docs/tracks/seoPlan.md` §9
23. **Entity / AI-search pack** — see `docs/tracks/seoPlan.md` §10
24. **Lead enrichment** — lead submits form → scrape their domain → lead brief + drafted reply in the lead-notification email. Copy-only, no CRM
25. **Free-tools TOF** — flagship: landing-page analyzer (email-gated results + launch distribution); programmatic per-category fan-out as experiment only (founderpal data: tools convert, his SEO didn't — audience drove it)
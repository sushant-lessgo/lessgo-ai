# Product Backlog

Things I want to build. Unspecced — moves to `productQueue.md` once a spec exists.

1. **Branded sign up / log in page**
2. **Engine coverage** — RULED 2026-07-11: all 4 engines before beta; work then place; see `docs/tracks/templatePlan.md` T5/T6
3. **Place engine** — restaurants/hotels/venues; build ASAP after work engine, before beta; bundles menu/multi-location/events capabilities (templatePlan T5, wave 2)
4. **Download after form** — form submit → deliver a file/asset (lead magnet)
5. **lessgo.ai marketing site** — built WITH Lessgo (customer zero, gap-finder); apex already wired as customer #0 via app-subdomain
6. **Beta-public** — no-login create + marketing site live (scalePlan §11.10)
7. **Publish-modal title cleanup** — remove free-text title (dup of SeoSettingsModal); check `PublishedPage.title` blast radius (dashboard listing/smart-title/reuse)
8. **DTR alternative** — generate N real pages per ad keyword instead of dynamic text replacement
9. **Ad-platform integrations** — import/sync campaigns from Google/Meta
10. **Ad copy writing** — currently we consume ad copy, never generate it
11. **CRM webhooks / deeper GTM integration**
12. **"Ask AI to do something" button** — freeform AI command on edit page
13. **Per-section surface override** — flip a section to a different template surface vs `getSurfaceForSection()` default; both renderers via `data-surface`; needs contract method to enumerate surfaces + picker UI. Replaces dead background modal (killed 2026-07-07)
14. **Email continuation pages** — paste email → extract tone/offer/CTA → generate matching page reusing brand assets
15. **Landing page types by traffic source** — Main (current) / Ad-PPC (no nav, single CTA) / SEO (content-rich) / Social (platform tone)
16. **Problem section UIBlock gaps** — only 2 UIBlocks today; missing: simple bullets, statistics-driven, single emotional statement, cost-of-inaction, industry-specific
17. **Social-posts phase 7 (caps + upgrade wall)** — feature MERGED DARK w/ kill-switch 2026-07-12; before un-flag: real-LLM QA + phase-7 limits (`socialPosts` FREE 10 / PRO 300; plan §Phase 7, spec `docs/task/social-posts.spec.md`)
18. **Pre-built IVOC database** — DB-first lookup keyed `(categoryKey, audienceKey)`, live search only on miss (Tavily removed scale-08, `IVOCCache` table retained)
19. **Competitor research** — per competitor: idea, USP, pain/desire focus, real praise+complaint quotes (G2/Capterra, Reddit, X, YouTube)
20. **Full live + RAG research layer** (~$0.25-0.30/gen) — live search + quote corpus, profile-similarity merge; premium tier
21. **Team collaboration** — multi-user accounts, roles/permissions
22. **Heatmaps** — beyond current conversion analytics
23. **SEO value-stack** — see `docs/tracks/seoPlan.md` §9
24. **Entity / AI-search pack** — see `docs/tracks/seoPlan.md` §10
25. **Lead enrichment** — form submit → scrape lead's domain → lead brief + drafted reply in the lead-notification email. Copy-only, no CRM
26. **Free-tools TOF** — flagship: landing-page analyzer (email-gated results + launch distribution); programmatic per-category fan-out as experiment only

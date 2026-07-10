# Product Backlog

Things I want to build. Unspecced — moves to `productQueue.md` once a spec exists.

1. Lessgo.ai.. separate the app from marketing site
2. Branded sign up, log in page
3. Engine coverage
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
15. **Social media post writing** — marketing material beyond the page itself
16. **Pre-built IVOC database** — DB-first lookup keyed `(categoryKey, audienceKey)`, live search only on miss (Tavily removed scale-08, `IVOCCache` table retained)
17. **Competitor research** — per competitor: idea, USP, pain/desire focus, real praise+complaint quotes (G2/Capterra, Reddit, X, YouTube)
18. **Full live + RAG research layer** (~$0.25-0.30/gen) — live search + quote corpus, profile-similarity merge; premium tier
19. **A/B testing** — page variations + performance tracking (overlaps Universe track)
20. **Team collaboration** — multi-user accounts, roles/permissions
21. **Heatmaps** — beyond current conversion analytics
22. **SEO value-stack** — tiered brainstorm in `docs/tracks/seoPlan.md` §9 (alt text, llms.txt, FAQPage schema, keyword-mode regen, backlink outreach copy, SEO report card…); copywriting-shaped items = moat (2026-07-10)
23. **Entity / AI-search pack** — entity stacking: sameAs JSON-LD, entity kit (NAP+bios), per-platform profile copy, entity-rich About; `docs/tracks/seoPlan.md` §10 (2026-07-10)
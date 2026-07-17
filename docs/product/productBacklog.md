# Product Backlog

Things I want to build. Unspecced — moves to `productQueue.md` once a spec exists.

1. **Branded sign up / log in page** — SPECCED 2026-07-12 as `docs/task/app-entry.spec.md` (from app-UI assessment); now in queue
2. **Engine coverage** — RULED 2026-07-11: all 4 engines before beta; work then place; see `docs/tracks/Completed/templatePlan.md` T5/T6
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
17. **Dark-trio un-flag rollout** — QA done (`docs/temp/qa-pilot-darktrio.md`): social SHIP-ready but needs phase-7 caps first (`socialPosts` FREE 10 / PRO 300, plan §Phase 7); email needs Email-4 dead pseudo-link fix; outreach needs off-ICP mismatch handling
18. **Pre-built IVOC database** — DB-first lookup keyed `(categoryKey, audienceKey)`, live search only on miss (Tavily removed scale-08, `IVOCCache` table retained)
19. **Competitor research** — per competitor: idea, USP, pain/desire focus, real praise+complaint quotes (G2/Capterra, Reddit, X, YouTube)
20. **Full live + RAG research layer** (~$0.25-0.30/gen) — live search + quote corpus, profile-similarity merge; premium tier
21. **Team collaboration** — multi-user accounts, roles/permissions
22. **Heatmaps** — beyond current conversion analytics
23. **SEO value-stack** — see `docs/tracks/Completed/seoPlan.md` §9
24. **Entity / AI-search pack** — see `docs/tracks/Completed/seoPlan.md` §10
25. **Lead enrichment** — form submit → scrape lead's domain → lead brief + drafted reply in the lead-notification email. Copy-only, no CRM
26. **Free-tools TOF** — flagship: landing-page analyzer (email-gated results + launch distribution); programmatic per-category fan-out as experiment only
27. **Meridian terminal-mock hero content** — `TerminalHero` ships hardcoded "item one/two/three" filler on published page; parameterize with real business data or swap for static visual (OOO from app-UI hygiene = template-content work); `src/modules/templates/meridian/blocks/Hero/TerminalHero.tsx` (+ `.published.tsx`)
28. For TOF WebsiteExamples.com
29. **Harden `/api/forms/submit` attribution** — route takes `userId` + `publishedPageId` from the client request body (`route.ts:57`, written `:198-199`), so anyone can write a `FormSubmission` attributed to any user; derive both server-side from the form/page instead. Found during dashboard-rollups-inbox (S4a reads around it via own-page-ids, R-A); also strands null-`publishedPageId` orphans out of the inbox — consider a backfill
30. **Lint: forbid Tailwind utilities in `*.published.tsx` template/skeleton/sharedBlock blocks** — enforce the inline-`<style>`+BEM published-styling boundary as a rule, not a convention; kills the M5-class "class silently purged from published.css" bug at the source. From publish-trust phase-4 (2026-07-17)
31. **Shrink hand-maintained published-CSS safelist** (`scripts/buildPublishedCSS.js` L31-208) — now sensible after glob scope settled (publish-trust shipped guards + dead-glob cleanup, opt-C); the per-glob zero-match guard now backstops rot. From publish-trust
32. **Rate limiter: KV-backed store** — `rateLimitStore` is an in-memory Map (`src/lib/rateLimit.ts:24`) → per-lambda-instance on Vercel, so the real ceiling is non-deterministic and looser than configured; move to KV/Redis. From rate-limit hotfix (2026-07-17)
33. **Rate limit per generation, not per request** — one "generate" click is N+1 AI requests (multi-page fan-out), so a per-minute *request* cap can refuse a single legitimate action; the 5→15 ceiling raise only bought headroom. From rate-limit hotfix (2026-07-17)

| 3 | Research brief — premium research-backed path: agentic Claude VoC + competitor research → editable Brief → generation | `docs/task/research-brief.spec.md` | queued — HELD until atelier lands (generation-path conflict) |
| 4 | Universe v1 — variant fan-out (message-match / SEO keyword / audience), shared-edit propagation, universe view + per-variant analytics | `docs/tracks/Someday/universePlan.md` → universe-01… (spec required before /feature) | reserved, awaiting spec (**needs editorPlan phase 4 ops**) |
| 5 | Campaign/offer pages — time-bound promo variants (universe v2) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
| 6 | A/B testing — split traffic between variants (universe v3) | universePlan.md U2 (spec required before /feature) | reserved, awaiting spec |
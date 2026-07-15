# App UI Requirements — designer handoff scope

Updated: 2026-07-14. Context: `productQueue.md` UI-reimagine hold; screen inventory for designer brief.

Scope: **app.lessgo.ai screens only**. Excludes published output (`/p/[slug]*` — template design, `/new-template` pipeline) and internal `/admin`, `/dev/*`.

Source: `src/app` route glob + `docs/reports/app-ui-ux-assessment.md` (2026-07-12 walkthrough) + `docs/product/roughNotes.md` (toolbar/skeleton notes).

## Screens

**Entry**
1. Signed-out app landing (root currently serves dead waitlist page — needs real design)
2. Sign-in/Sign-up (Clerk-hosted, needs brand wrap)

**Dashboard**
3. Project list/home (cards: edit/view/analytics/forms, search/filter, delete/rename/dup)
4. Settings (persona + account/billing/integrations — currently persona-only)
5. Billing/plan/credits surface (doesn't exist yet — pricing-v2 has zero UI)

**Onboarding** (⚠️ path structure may get rebuilt around skeleton/engine concept per roughNotes — check before locking design)
6. Start screen
7. Steps: Understanding → Who/Goal → Offer → Proof → Style → Structure → Building (×2 product/service, may collapse/change)
8. Generating/building screen

**Editor** (biggest chunk — effectively its own design system)
9. Main canvas + section rail + page switcher
10. Toolbar shell + sub-toolbars (per roughNotes: Header/Logo/Menu/Button/Section/Box/Text/Image/Form/Footer/SocialBar/Portfolio — ~12 toolbars)
11. Modals: SEO (exists, good), Style popover (exists), Languages popover (exists), Social links (needs restyle), Add-page (needs restyle, currently raw prompt), Button config (969-line god component, needs UX pass), Form editor
12. Preview + publish flow (sticky bar, publish modal, success modal)

**Post-publish dashboards**
13. Analytics
14. Forms
15. Testimonials (+ public collection form `/t/[collectToken]`)
16. Blog (list + editor)
17. Social posts / Email sequences / Outreach dashboards (built dark, undesigned)

**Cross-cutting**
18. Empty states, 404/error, mobile (editor currently desktop-only, undecided if responsive)

## Not in scope
- `/p/[slug]*` published output — templates, separate track
- `/admin`, `/dev/*` — internal only

## Unresolved
1. Onboarding redesign wait on skeleton/engine restructure, or design current flow now?
2. Editor toolbars — full ~12-toolbar set, or beta-essentials subset first?
3. Mobile editor — design responsive, or just "desktop only" messaging?
4. Bundle as one big brief or split (dashboard+settings / onboarding / editor+toolbars / post-publish)?

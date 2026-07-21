# QA Report — QA/Beta Big-Bang Preview (end-user pass)

- **Date:** 2026-07-19
- **Environment:** Vercel Preview `lessgo-ai-git-qa-beta-big-bang` (`https://lessgo-ai-git-qa-beta-big-bang-sushants-projects-2046e160.vercel.app`)
- **Account:** Sushant Jain (sushantjain24@gmail.com), Free plan
- **Method:** Manual end-user walkthrough via Claude-in-Chrome (real LLM, not mock)
- **Scope:** New redesigned dashboard + engine-decider onboarding + editor + preview + publish + account/billing surfaces
- **Note on method:** Every "Create new site" CTA on the preview dashboard routes to **production** (see B-1). To exercise the create/onboarding flow **on preview**, I used an existing draft's **Continue** (real preview token `Pt9gmkleTbhM`), which enters the same one-liner → engine-decider → 7-step onboarding flow.

---

## Summary

The full happy path **works end-to-end on preview**: one-liner entry → engine decider → 7-step onboarding → AI generation → editor → inline edit + autosave → preview (editor↔published parity) → publish → live confirmation → dashboard/analytics/leads/billing all reflect state. Copy and design quality of the generated page were strong.

Found **1 environment/config blocker** (create CTAs point to prod), **1 medium UI bug** (icon-ligature leak in project menu), and a handful of low-severity UX issues.

**Verdict:** Core flows solid. B-1 and B-2 should be fixed before this preview goes to main / beta.

---

## Issues found

### B-1 — All "Create new site" CTAs navigate to PRODUCTION, not preview  `[Blocker for this preview]`
On the redesigned dashboard, **all three** create entry points open `https://app.lessgo.ai/dashboard` (production, old dashboard) in a new tab instead of starting onboarding on the preview host:
- Sidebar **"Create my new website"**
- Top-right **"New site"**
- **"Create a new site"** describe card

They are JS buttons (not `<a>`), so the target host looks hard-coded / env-derived to the prod app URL. Consequence: a fresh create is **unreachable** on the preview build; a prod token carried to `/onboarding/<token>` on preview just redirects to `/dashboard` (preview DB is correctly isolated, so the prod token doesn't resolve).
- **Impact:** Blocks the primary "new site" flow on any preview deploy; would send a real user from preview into prod mid-task.
- **Repro:** Dashboard → click any create CTA → new tab opens `app.lessgo.ai`.
- **Likely cause:** App/base URL env var pointing at prod in the preview environment.

### B-2 — Project "⋯" menu: Unpublish renders raw icon text "CLOUD_OFF"  `[Medium — visual]`
In the published project's **⋯** menu, the Unpublish row shows the literal Material-Symbols ligature **`CLOUD_OFF`** (large text) where the icon should be, and the actual "Unpublish" label is truncated/overflowing off the menu. Other rows (Rename ✎, Duplicate ⧉) render their icons correctly, so the `cloud_off` glyph specifically isn't resolving as an icon.
- **Impact:** Looks broken; the primary take-down action is mislabeled.
- **Repro:** Dashboard → published card ⋯ → 3rd item.

### B-3 — Concrete-numbers input splits on comma, corrupting numbers  `[Low/Med — UX/data]`
Onboarding step 5 (Proof) "Concrete numbers you can claim?" is a comma-delimited chip input. Entering `12,000+ meals planned weekly; 45 min saved per week` produced two chips: **`12`** and **`000+ meals planned weekly; 45 min saved per week`** — i.e. the comma inside `12,000` was treated as a delimiter.
- **Impact:** Any thousands-separated number ("$1,200", "10,000 users") is silently split into garbage claims. The generated Features/metric block also showed an **empty 3rd metric cell + large dark gap**, which may trace back to this.
- **Fix idea:** Don't split on comma inside this field (or only commit chips on Enter/tab), or strip/normalize numeric commas.

### B-4 — Publish modal: Page title defaults to "Untitled Page"  `[Low — SEO/UX]`
At publish, **Page title** pre-fills as `Untitled Page` rather than the business name (`MealMind`). A user who doesn't notice ships a page titled "Untitled Page" (bad `<title>`/SEO/share preview). Should default to the business/site name.

### B-5 — "Leave site?" guard fires after a successful save + publish  `[Low — UX]`
After the hero edit auto-saved ("Saving…" → saved) **and** the page was published, navigating away from `/edit/<token>` still triggered the browser `beforeunload` "unsaved changes" dialog. The dirty flag isn't cleared on save/publish.

### Env note (not a bug) — live `.lessgo.site` URL 404s from preview
"View site" after publish opened `page-1784419077602.lessgo.site` which returned the app's **404 Page not found**. This is expected: the page was written to the preview environment's **isolated** blob/KV, but `.lessgo.site` resolves through **production** infrastructure, which doesn't have it. Confirms data isolation is working; means the *rendered* live page cannot be verified from the preview env (only the publish pipeline success can).

### Worth verifying — credit accounting
Credits went **19 → 13** across one understand (stated "1 credit") + one full-page generation (spec: 10 credits) = expected ~11 spent, but only ~6 were deducted. Low confidence (didn't capture the exact pre-generation balance for this draft); flagging for a dev check of the full-page-generation charge on this path.

---

## Flows verified working (on preview)

| Area | Result |
|---|---|
| Redesigned dashboard | ✅ Projects grid, filters (All/Published/Drafts), credits badge, "Free plan · N of 1 sites used" |
| One-liner entry | ✅ "What are you building a page for?" + example chips |
| Engine decider | ✅ "Understanding…" → "Here's what we'll build" confirm; "Not quite right?" reveals business-type picker (SaaS/Manufacturer/Agency/Consultant/Coach/Writer/Photographer/Designer/Mobile app/Something else) |
| 7-step onboarding | ✅ Basics → Understanding (audience/features/differentiator **pre-filled from one-liner**) → Goal (context-aware: "Download the app" → store-link fields, Skip-for-now) → Offer → Proof (testimonials toggle + numbers) → Structure (page plan, reorder/remove) → Building (strategy → copy → save) |
| AI generation quality | ✅ Strong copy across Hero/Features/CTA/Footer; dark TechPremium "TerminalHero" template |
| Editor | ✅ Sections rail (Header/Hero/Features/Cta/Footer), Design/Settings menus, device toggles, quality score (7.4), pre-publish **Setup checklist** (Add logo / Link CTA / Add contact) |
| Inline editing | ✅ Rich-text toolbar (bold/italic/underline/align/size/color/Link/Ask-AI/Design) + per-element toolbar (Edit/Regenerate/Delete/Design); edit committed |
| Autosave | ✅ "Saving…" indicator on edit |
| Preview mode | ✅ `/preview/<token>` on preview host; **editor↔published parity held** across all sections |
| Publish | ✅ Modal (live target, slug, title, analytics opt-in, "3 setup steps — publish anyway") → "Publishing…" → **"You're live!"** with URL, Share, Version-restore, Connect-domain |
| Post-publish dashboard | ✅ Card flips to **Published** with title + slug + Open; **"1 of 1 sites used"**; credits decremented |
| All Analytics | ✅ 7d/30d/90d toggle, summary cards (Views/Visitors/Conversions/Conv. rate), per-site table incl. new site (zeroed) |
| All Leads | ✅ Clean empty state |
| Billing & plan | ✅ Free ($0, Active), 13 one-time credits, credit costs (Full page 10 / Section 2 / Element 1), Upgrade-to-Pro ($29/mo, 3 pages, custom domains), Top-up, Manage-billing greyed |
| Account settings | ✅ Persona picker ("What do you do?" — 11 roles) |
| Project ⋯ menu | ✅ Open editor / Visit site / Unpublish / Rename / Duplicate / Domain settings (greyed) / Archive (greyed) / Delete — (see B-2 for icon bug) |
| Gating / greyed placeholders | ✅ Domains nav, Domain settings, Appearance, Manage billing all correctly greyed on Free plan |

---

## Notes / observations
- **Data isolation confirmed:** preview dashboard drafts differ from prod; prod token doesn't resolve on preview; published page not visible via prod `.lessgo.site`.
- **Engine classification** of "AI-powered meal planning app…" → *thing/product* engine with "Download the app" goal and iOS/Android store fields — correct.
- **Project count** rose 5 → 7 during the session (extra draft rows created by the prod-routed create attempts); minor housekeeping, not user-facing on preview.
- Test artifact left live on preview: **MealMind — AI Meal Planning** (`page-1784419077602.lessgo.site`, token `Pt9gmkleTbhM`).

# App UI/UX Assessment — signup → publish (app.lessgo.ai)

**Date:** 2026-07-12 · **Method:** live walkthrough on prod (Chrome automation), desktop 1440px. Full journey executed: dashboard → create page → 8-step onboarding → generation → editor → preview → publish → live page → analytics/forms/testimonials/settings. Test artifact created: project "InvoiceKit UI Audit Test", published at `invoicekit-ui-audit-test.lessgo.site` (**no unpublish path exists — clean up manually**).

---

## 1. Screen-by-screen findings

### 1.1 App root `app.lessgo.ai/` — BROKEN ENTRY
- Serves the **old pre-launch waitlist page**: "Get Early Access!", "[Only 10 Spots Left - 1 Year Free Pro]", "© 2025 Lessgo.AI", founder story "Why I Quit My $150k Job".
- **No sign-in or sign-up link anywhere.** A signed-out visitor to the app subdomain has literally no path into the product.
- `/sign-up` and `/sign-in` → raw Next.js default 404 (Clerk is modal-only via layout buttons, but those buttons aren't rendered on this page).
- Below-fold sections rendered blank during scroll (scroll-triggered animations?) — verify by hand.

### 1.2 Dashboard `/dashboard`
Good: warm headline ("Hey Sushant, let's build a High-Converting page."), clear card actions (Edit / View Live / Analytics / Forms), Continue for drafts.
- **`owner: (orphan)` debug badge on every card** — admin-all single-tenant shortcut leaking into UI (known before-customer-2 item).
- **"Published at /p/slug"** label is stale — actual live URL is `slug.lessgo.site`. Users will copy the wrong link mentally.
- Flat unbounded list (~35 projects), no search/filter/pagination; a dozen junk "New Project" drafts.
- **No rename, no delete, no duplicate** on cards. Draft clutter is permanent.
- **No credits/plan/usage displayed anywhere in the app** (dashboard, editor, settings). Pricing-v2 has no UI surface.
- Create New Page opens a **new tab** (so does Preview later) — tab proliferation, back-button dead.

### 1.3 Onboarding `/onboarding/[token]` (start + 8 steps)
Overall: strongest surface in the app. Clean cards, honest microcopy ("Takes ~30 seconds", "nothing is written until you approve the shape"), example chips, progress bar, Back works.
- Start screen: good. No way back to dashboard (logo isn't a link on this screen; minor trap).
- Understanding step: condensed "AI-powered invoice tracking tool for freelance designers" → "your **Accounting software**" — technically right, loses the niche. It's the first AI impression; generic classification undermines the "conversion intelligence" promise. "Not quite right?" chip row is a nice recovery pattern.
- Step 2 (Who/why): prefilled audience + feature chips = good. Differentiator quick-picks good.
- Step 3 (Goal): card picker solid. Continue stays disabled until Destination link filled or "Skip for now" clicked — the skip link is easy to miss; users will stall here.
- Step 4 (Offer): prefill = product name ("AI-powered invoice tracking tool"), not an offer. Label asks "offer / next step" but seed is wrong shape.
- Step 5 (Proof): **"Concrete numbers you can claim?" prefilled with non-numeric fluff** ("Improved invoice tracking efficiency"). Contradicts its own label and plants unverifiable claims.
- **Step 6 (Style): stub step — zero controls**, just "we'll use a clean default theme". Dead click. Either put the typeface/palette picker here (it exists in the editor Style popover) or delete the step.
- Step 7 (Structure): plan = Hero, Features, CTA — **all REQUIRED, nothing togglable**, while the copy promises "Turn off anything you don't need". "Collections › Products · 0 items" is meaningless for a SaaS persona. Continue is clickable during the "Drafting…" spinner (unclear what it does mid-draft).
- Step 8 (Building): good 3-step progress. After completion all checks are green but the enabled-looking flow stalls ~5–10s before auto-redirect; Continue stays disabled. Momentary "is it stuck?" feeling.

### 1.4 Editor `/edit/[token]`
Good: setup checklist ("Setup: 3 left" → logo/CTA links/contact), Style popover (typeface trio + palettes), Languages popover (well explained), thorough SEO modal with Google + social preview, Saved indicator, inline editing with floating format toolbar, section rail.
- **On-canvas debug chrome: "AI Generated" + "12:15:32 PM" timestamp chips** on every section — QA leftovers, meaningless to users.
- **SEO preview leaks raw HTML: "Stop chasing invoices. Start `<em>designing</em>`."** in Google preview + social card = markup will ship in meta description.
- Section rail labels are raw ids ("Cta"); no drag-reorder/add/hide affordance visible in rail.
- "+ Add page" opens a **bare unstyled prompt** ("Page name" / OK / Cancel) — jarring vs the rest.
- Social Media Links modal is unstyled/legacy vs the polished SEO modal (two visual languages).
- Floating text toolbar overlaps the top nav bar.
- Selection state floods the whole hero with a blue tint — functional but heavy.
- No template/variant/palette switcher visible for this (product) flow beyond the 3 typefaces + 9 accent swatches.

### 1.5 Generated page content (editor + published)
Good: headline "Stop chasing invoices. Start designing." + benefit-led feature cards ("Never lose money to forgetfulness") — copy voice is genuinely decent.
- **Terminal mock ships placeholder filler**: "item one / item two / item three / metric a · b · c / status ok" — lorem-ipsum equivalent, live on the published page.
- **Footer: "© 2024 InvoiceKit"** — hardcoded wrong year (it's 2026).
- **Empty footer columns published**: PRODUCT / COMPANY / RESOURCES headers render with zero links under COMPANY and RESOURCES.
- Six "Learn more" ghost links that go nowhere.
- Header/footer CTAs ("Sign in", "Sign up free") are unlinked until user completes setup — expected, but nothing warns at publish time that CTAs are dead.

### 1.6 Preview `/preview/[token]` + Publish
Good: true-to-live render, sticky bar (Back to Edit / Custom Domain / Publish), publish completes in seconds, success modal with Copy Link / View Live is clean. Live page matched editor 1:1 (dual-renderer parity held on this template).
- **Publish modal defaults are throwaway**: slug `page-1783851507192`, title "Untitled Page" — the app knows the product is "InvoiceKit" from onboarding and uses neither. Most users will publish these defaults straight to their public URL/SEO title.
- "Enable analytics tracking" unchecked by default — most users want it; it's also the only place they'll ever see the option.
- Custom Domain button disabled with no tooltip/explanation (plan gate? publish-first? user can't tell).
- No publish preflight (dead CTA links, missing meta description, placeholder content) — exactly the checks a first-time founder needs.

### 1.7 Post-publish screens
- **Analytics**: good empty state (Share your page / Use UTM tags / View page). Correct subdomain URL shown here (inconsistent with dashboard's `/p/`).
- **Forms**: clean stat cards + honest empty state. Fine.
- **Testimonials**: best-in-app admin screen — stats, filters, project selector, Collect link, honest "public collection form comes next".
- **Settings** (`/dashboard/settings`): persona picker ONLY. No account, email, billing, credits, plan, integrations, delete-account. Also `/settings` 404s (nav uses `/dashboard/settings`; deep-link guess dies on raw 404).
- App footer: "This is a beta version…" good honesty; "© 2025 Lessgo.ai" — wrong year, and brand should be "Lessgo AI".

### 1.8 Not tested
- Mobile/responsive (window resize didn't hold in automation) — needs a manual pass.
- Regen Copy / Reset / section regen (credit cost), image upload, custom-domain full flow, form builder, Stripe surfaces (none exist in UI yet).

---

## 2. Cross-cutting themes

1. **Two products in one skin.** Onboarding/testimonials/analytics feel 2026; app root, dashboard badges, Social modal, add-page prompt feel 2025-prototype. The seam is visible everywhere.
2. **Debug/internal state leaks to users**: orphan badges, AI-Generated timestamp chips, raw section ids, `/p/` paths.
3. **Placeholder content reaches production output**: terminal mock filler, © 2024, empty footer columns, dead links. The product's whole pitch is "publish-ready page"; these directly contradict it.
4. **Dates/brand drift**: © 2024 (published page), © 2025 (app + waitlist), "Lessgo.AI"/"Lessgo.ai" vs brand "Lessgo AI".
5. **Monetization has zero UI.** No credits counter, no plan, no upgrade path, no gating messages. Pricing-v2 will need surfaces, not just APIs.
6. **New-tab navigation model** (create → tab, preview → tab) fragments the journey; a first-user ends the flow with 3 tabs.

---

## 3. Public-beta cut: blockers vs polish

### P0 — beta blockers (a stranger cannot succeed without these)
1. App root: replace waitlist page with signed-out landing → Clerk sign-up/sign-in (and make `/sign-in`, `/sign-up` resolve). Today a new visitor cannot enter at all.
2. Dashboard: remove `owner: (orphan)` badge + admin-all view → own-projects only (existing before-customer-2 item).
3. Publish modal defaults: slug + title from project name; analytics default ON.
4. SEO meta: strip HTML tags from generated title/description (`<em>` leak).
5. Published-output hygiene: current year in footer, drop empty footer columns, no dead "Learn more"/nav links by default, replace terminal-mock filler with business-derived content (or drop the block).
6. Project delete (at least drafts) + some unpublish/take-down path — currently a mispublish is permanent.
7. Minimal credits/plan surface (counter + "what costs what") before any paid user arrives.
8. Dashboard "Published at" → real subdomain URL.

### P1 — should fix for beta quality
- Style step 6: real picker or remove (8 steps → 7).
- Page plan: make optional sections actually togglable; hide "Products · 0 items" for non-ecom.
- Proof step: prefill only actual numbers or leave empty with placeholder.
- Offer step: seed with an offer-shaped phrase, not the product name.
- Goal step: make "Skip for now" prominent or make Continue always active with link optional.
- Custom Domain disabled state: explain why.
- Branded 404 + redirect unknown app routes to /dashboard.
- Restyle Social modal + Add-page prompt to match SEO modal.
- Section rail: human labels ("Call to action"), reorder/hide controls.
- Publish preflight warnings (dead CTAs, missing meta, placeholder content).
- Remove/redesign AI-Generated timestamp chips (or make them a useful "regenerated at" tooltip).
- Same-tab navigation (or at least stop double-spawning tabs).
- Consistent brand string + year everywhere.

### P2 — polish (post-beta)
- Dashboard search/filter/pagination; auto-name drafts from one-liner (kill "New Project" ×12).
- Onboarding step transitions/skeletons; understanding-step specificity (keep the niche words).
- Editor selection tint softening; toolbar positioning; empty-state illustrations.
- Waitlist-page scroll-animation audit (if any part of it survives anywhere).
- Mobile pass across dashboard/editor (editor likely desktop-only — say so explicitly in UI).

---

## 4. What's genuinely good (keep)
- Onboarding structure & microcopy; chip-based prefills; "Not quite right?" recovery.
- Generated copy voice (headline/feature benefits) is above template-tool baseline.
- Editor setup checklist; SEO modal with live Google/social previews; Languages popover.
- Publish speed + success modal; analytics/forms/testimonials empty states.
- Editor↔published parity held on this run (meridian/product template).

## Unresolved questions
1. App root: build new signed-out landing on app subdomain, or redirect signed-out → apex marketing site?
2. Unpublish: real feature for beta, or admin-only takeover tool acceptable?
3. Credits UI: minimal counter for beta, or full pricing-v2 surfaces in one go?
4. Terminal-mock hero asset: parameterize with real business data, or swap for static visual?
5. Editor on mobile: block with "desktop only" notice, or invest in responsive editor?
6. Delete test page `invoicekit-ui-audit-test.lessgo.site` + junk drafts — want me to script a cleanup?

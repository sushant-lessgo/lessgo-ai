# BUG B10 (S3) — product-name sweep audit

Branch: `fix/qa-0718`. Rule: product/brand NAME in prose = "Lessgo AI" (never bare
"Lessgo", never domain-style "Lessgo.ai"/"Lessgo.AI" as a name). Domain/URL/host
literals, identifiers, CSS, comments left untouched.

## Files changed (20)

- src/app/thanks/page.tsx
- src/app/blog/layout.tsx
- src/app/blog/[slug]/page.tsx
- src/app/terms/page.tsx
- src/app/privacy/page.tsx
- src/app/layout.tsx
- src/app/page.tsx
- src/app/pricing/page.tsx
- src/app/t/[collectToken]/page.tsx
- src/app/dashboard/outreach/[token]/page.tsx
- src/app/dashboard/emails/[token]/page.tsx
- src/app/components/WaitlistForm.tsx
- src/app/edit/[token]/components/ui/ModalActions.tsx
- src/app/edit/[token]/components/ui/PreviewSection.tsx
- src/components/domain/LiveStep.tsx
- src/components/domain/DnsStep.tsx
- src/components/auth/FounderAuthLayout.tsx
- src/components/shared/Footer.tsx
- src/components/shared/Logo.tsx
- src/lib/mdx.ts

## Per-line changes (old → new)

### src/app/thanks/page.tsx
- L10: `...founding circle of <span>Lessgo.ai</span>...` → `Lessgo AI`
- L18: `Try Lessgo.ai Now!` → `Try Lessgo AI Now!`
- L38: `early access to Lessgo.ai` → `Lessgo AI`

### src/app/blog/layout.tsx
- L14: header brand `<span>Lessgo.ai</span>` → `Lessgo AI`
- L50: footer `<h3>Lessgo.ai</h3>` → `Lessgo AI`
- L96: `© {year} Lessgo.ai. All rights reserved.` → `Lessgo AI`

### src/app/blog/[slug]/page.tsx
- L31: title `... | Lessgo.ai Blog` → `Lessgo AI Blog`
- L39: OG authors default `Lessgo.ai Team` → `Lessgo AI Team`
- L69: JSON-LD author name default `Lessgo.ai Team` → `Lessgo AI Team`
- L73: JSON-LD publisher name `Lessgo.ai` → `Lessgo AI`

### src/app/terms/page.tsx
- L5: title `Terms of Service - Lessgo.ai` → `Lessgo AI`
- L6: description `...using Lessgo.ai.` → `Lessgo AI`
- L17: `Welcome to Lessgo.ai (...) By using Lessgo.ai...` → both `Lessgo AI`
- L33: `Lessgo.ai allows users...` → `Lessgo AI`
- L62: `Lessgo.ai is currently free...` → `Lessgo AI`
- L91: `...law, Lessgo.ai shall not be liable...` → `Lessgo AI`

### src/app/privacy/page.tsx
- L5: title `Privacy Policy - Lessgo.ai` → `Lessgo AI`
- L6: description `Learn how Lessgo.ai handles...` → `Lessgo AI`
- L17: `...explains how Lessgo.ai (...) collects...` → `Lessgo AI`
- L44: `To provide and improve the Lessgo.ai service` → `Lessgo AI`

### src/app/layout.tsx
- L38: title `Lessgo.ai – The AI Landing Page Builder...` → `Lessgo AI`
- L40: description `Lessgo.ai is the AI landing page builder...` → `Lessgo AI`
- L53: OG title → `Lessgo AI`
- L55: OG description → `Lessgo AI`
- L57: OG siteName `Lessgo.ai` → `Lessgo AI`
- L63: OG image alt `Lessgo.ai - AI-powered...` → `Lessgo AI`
- L71: twitter title → `Lessgo AI`
- L73: twitter description `...with Lessgo.ai –...` → `Lessgo AI`
- L119 & L121: `Invite-only access to Lessgo.` → `Lessgo AI.` (founder-reported instance)

### src/app/page.tsx
- L27: active logo `alt="Lessgo Logo"` → `alt="Lessgo AI logo"`
- L77: `Watch Lessgo.ai craft your...` → `Lessgo AI`
- L223: `Lessgo.ai will research your market...` → `Lessgo AI`
- L379: `© 2025 Lessgo.AI. All rights reserved.` → `Lessgo AI`

### src/app/pricing/page.tsx
- L63: `“Made with Lessgo” badge` → `“Made with Lessgo AI” badge`
- L81 & L103: `No Lessgo badge` → `No Lessgo AI badge`

### src/app/t/[collectToken]/page.tsx
- L50: `Powered by Lessgo` → `Powered by Lessgo AI`

### src/app/dashboard/outreach/[token]/page.tsx
- L59: `...messages — Lessgo doesn't send them.` → `Lessgo AI doesn't send them.`

### src/app/dashboard/emails/[token]/page.tsx
- L87: `...your ESP — Lessgo doesn't send them.` → `Lessgo AI doesn't send them.`

### src/app/components/WaitlistForm.tsx
- L58: `(Look for: “Confirm your spot at Lessgo.ai” ...)` → `Lessgo AI`
- L61: `Try Lessgo.ai Now` → `Try Lessgo AI Now`

### src/app/edit/[token]/components/ui/ModalActions.tsx
- L51: `title="Reset to original Lessgo-generated background"` → `Lessgo AI-generated`

### src/app/edit/[token]/components/ui/PreviewSection.tsx
- L120: `Lessgo Generated` → `Lessgo AI Generated`

### src/components/domain/LiveStep.tsx
- L18: `Your Lessgo subdomain will become...` → `Lessgo AI subdomain`
- L64: `Your Lessgo subdomain (...) now redirects here.` → `Lessgo AI subdomain`

### src/components/domain/DnsStep.tsx
- L90: `Point your DNS to Lessgo` → `Point your DNS to Lessgo AI`

### src/components/auth/FounderAuthLayout.tsx
- L118: `Founder & CEO, Lessgo.ai` → `Founder & CEO, Lessgo AI`

### src/components/shared/Footer.tsx
- L23: `Want to shape the future of Lessgo?` → `Lessgo AI?`

### src/components/shared/Logo.tsx
- L7: `alt="Lessgo.ai Logo"` → `alt="Lessgo AI logo"`

### src/lib/mdx.ts
- L42 & L81: MDX author default `Lessgo.ai Team` → `Lessgo AI Team` (blog author byline)

## Left unchanged (why)

- **Domains/URLs/hosts (technical):** all `https://lessgo.ai`, `{slug}.lessgo.site`,
  `metadataBase`/`canonical`/`url` fields, `mailto:`/`hello@lessgo.ai`/`sushant@lessgo.ai`,
  twitter href `https://twitter.com/LessgoSushant`, badge href in `lessgoBadge.ts`,
  `USER_AGENT = 'LessgoBot/1.0 (+https://lessgo.ai)'` (fetchSite.ts).
- **Identifiers / code (never brand prose):** `isLessgoAppHost`, `lessgo_app_host`,
  `renderLessgoBadge`, `LessgoBot`, `@LessgoSushant` (twitter handle), CSS classes.
- **Comments (not user-facing):** api/publish/route.ts L369, dashboard emails L13 &
  outreach L11, ToolbarButton.tsx L10, TextToolbarMVP.tsx L783 ("Ask Lessgo AI" — a
  comment, already AI), hosts.ts L10, routing/types.ts L15, htmlGenerator.ts L89,
  renderPublishedExport.ts L89, middleware.ts L2/L93/L138/L206, FounderAuthLayout L10
  (doc path), clerkAppearance.ts L7 (doc path).
- **page.tsx L19 & L65:** inside `{/* ... */}` JSX comments (dead markup) — left per
  comment rule. (Active twin at L27 was fixed.)
- **Already correct "Lessgo AI":** layout.tsx publisher L83 & twitter alt L77;
  ManualOnboardStep.tsx; sign-in/sign-up/welcome/not-found titles+alts; pricing L171/L529;
  p/[slug] siteName; buildPageMetadata.ts siteName; lessgoBadge.ts; htmlGenerator og:site_name;
  DashboardEmptyState; JourneyEntryStep; AppSidebar; Footer L38; FounderAuthLayout L49/L73.
- **DID NOT TOUCH (out of scope, in-flight):** `JourneyShell.tsx` /
  `JourneyShell.test.tsx` (per instruction).

## Deviations

- **WaitlistForm.tsx L58** ("Confirm your spot at Lessgo.ai" — an email-subject the
  user is told to look for): changed to "Lessgo AI" for brand consistency. This assumes
  the actual confirmation email subject is/will be updated to match; no email-subject
  source exists in-repo (external ESP). Conservative flag for the founder to verify the
  live email subject matches.
- **Logo alt / page.tsx logo alt:** used "Lessgo AI logo" (brand alt, lowercase "logo")
  per rule preference; `src` paths untouched.

## Tests

- `npx tsc --noEmit`: only the known pre-existing `src/app/page.tsx` founder.jpg TS2307
  (unrelated to this sweep). No new errors.
- No test files assert any of the changed strings (verified by grepping `*.test.ts/tsx`
  and `e2e/*.spec.ts`): existing assertions target already-correct "Lessgo AI"
  (`buildPageMetadata.test.ts`, `lessgoBadge.test.ts`, `dashboard-shell.spec.ts` L201
  "Welcome to Lessgo AI") or technical identifiers (`hosts.test.ts`). No test updates
  needed.
- `npx vitest run src/lib/staticExport src/lib/blog`: 168 passed / 18 files.
- Per sweep-rules guidance, the changed strings + unchanged-and-still-green assertions
  are the guard; no new unit test added for copy.

## Open risks

- Live confirmation-email subject line (external ESP) must be updated to "Lessgo AI" to
  match WaitlistForm.tsx L58 copy (see Deviations).
- Marketing OG/title changes ("Lessgo.ai –" → "Lessgo AI –") alter search/social
  snippets; intended per rule but worth a founder eyeball.

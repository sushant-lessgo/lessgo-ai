# publish-trust — scout findings

Consolidated from 3 read-only scouts (M3 / M4 / M5). Orchestrator-owned artifact.
WORKDIR: `C:\Users\susha\lessgo-ai\.claude\worktrees\publish-trust` · branch `feature/publish-trust`

> **Tier note:** spec declares `standard`. AUTO-ESCALATED to **full** (one-way) — touches
> `src/app/api/publish/` + `src/lib/staticExport/`, both on the risky-surface list.

---

## M3 — false-success fall-through (`src/app/api/publish/route.ts`)

- `:513` outer static-export `catch` (wraps generateStaticHTML → upload → KV).
- `:514-519` log + `Sentry.captureException` (tags `area:'publish', phase:'static-export'`).
- `:521-530` orphaned-blob rollback: dynamic-import `del` from `@vercel/blob` if `uploadedBlobKey`; failure swallowed.
  - **Pre-existing bug (OUT OF SCOPE, note only):** deletes ROOT blob only — subpage blobs leak.
- `:532-542` re-fetch page by slug → set `publishState:'failed'` + `publishError: message`.
- `:544-545` comment `// Don't block publish - legacy SSR still works` → **deliberate swallow**, no rethrow.
- `:548-551` falls through to `createSecureResponse({ message: 'Page published successfully', url })` → **HTTP 200**.
- KV sub-catch `:459-491` DOES `throw` at `:488`, but `:513` catches + swallows it identically. KV path sets `failed` at `:479-485`, then `:533-542` sets it again (double-set).

**This is an intentional decision being reversed, not an accidental bug.** The comment states the rationale
(SSR fallback still serves). Plan must state why honest failure beats the silent-SSR-fallback tradeoff, and
preserve the rollback behavior per spec constraint.

### Callers — M4 UI work NOT needed
- **Only one client caller:** `src/app/preview/[token]/page.tsx:451` `handlePublish`.
  - Already checks `!response.ok` (`:481-483`), throws `result.error`, catch `:496-498` → `setPublishError`.
  - On 200: `setPublishedUrl(result.url); setPublishSuccess(true)` (`:485-486`).
  - Never reads `publishState`/`failed` — body has no such field.
  - **=> Returning non-2xx with `{ error }` (matching `:556`'s existing error shape) is already surfaced. No UI touch.**
- Editor/dashboard do NOT POST publish; editor reads `GET /api/projects/{tokenId}/published-slug`.
- **Success body shape today:** `{ message: string, url: string }` (`:548-551`) — that's all.

### Test callers (breakage risk of non-2xx)
- `e2e/helpers/seedDraft.ts:290` `publishSeed` → asserts `res.ok()` at `:305`. Hard-fails any non-ok.
- `e2e/dashboard-shell.spec.ts:279`.
- Rate-limit caveat for any new e2e: publish is 5/60s/user.

---

## M4 — head interpolation audit (`src/lib/staticExport/htmlGenerator.ts`)

**Escape helper:** `escapeHTML` — `src/lib/staticExport/headTags.ts:13-21`, exported, ALREADY imported by
htmlGenerator (line 16). Escapes `& < > " '`. **Confusable namesakes — do NOT import these:**
`escapeHtml` in `src/lib/email/sendLeadNotification.ts:43`, `src/lib/email/sendBlogPostNotification.ts:23`,
`src/utils/formatUtils.ts:90`, `src/lib/staticExport/formHandler.js:23`.

### Full inventory

| # | Value | Line | Context | Escaped? |
|---|---|---|---|---|
| 1 | `lang` (`options.locale`) | 372 | attr | YES `escapeHTML` |
| 2 | `a.hreflang` | 317 | attr | YES |
| 3 | `a.href` | 317 | **URL attr** | **RAW** |
| 4 | `metadata.title` | 378 | text `<title>` | YES |
| 5 | `metadata.description` | 379 | attr | YES |
| 6 | `canonicalURL` | 382, 386, 394 | **URL attr ×3** | **RAW** |
| 7 | `metadata.title` | 387, 395 | attr | YES |
| 8 | `metadata.description` | 388, 396 | attr | YES |
| 9 | `ogImage` | 389, 397 | **URL attr ×2** | **RAW** |
| 10 | `assetBase` (env) | 368,401,414,417,420,423,426 | URL attr | raw (env, not user-controlled) |
| 11 | `cssVariablesStyle` | 407 (built 441-455) | **inside `<style>`** | **RAW** — see below |
| 12 | `bodyHTML` | 410 | markup | YES (React `renderToStaticMarkup`) |
| 13 | `localeJson` | 368 (built 323-328) | **inside `<script>`** | partial: `<`→`<` only |
| 14 | `metadata.publishedPageId` | 431 | attr | raw (DB cuid) |
| 15 | `metadata.slug` | 431 | attr | **RAW** (user-chosen) |
| 16 | `faviconUrl` | 382 → `headTags.ts:33` | URL attr | YES (inside `faviconLinkTag`) |
| 17 | `jsonLd` | 407 → `headTags.ts:38` | **inside `<script>`** | raw by contract (caller pre-serializes) |
| 18 | `metaPixelId` | 407 → `headTags.ts:67,71` | JS string + URL | YES — regex-gated `^\d{5,20}$` |
| 19 | `ga4MeasurementId` | 407 → `headTags.ts:83,88` | JS string + URL | YES — regex-gated `^G-[A-Z0-9]{4,20}$` |

**Indirect sources:**
- `canonicalURL` = `https://${canonicalDomain || slug+'.'+PUBLISH_HOST}${canonicalPath}` (`canonicalUrl.ts:18-21`)
  → **slug, canonicalDomain, canonicalPath all reach an href raw.**
- `ogImage` = `seo.ogImage || previewImage || …` (`buildPageMetadata.ts:82-99`)
  → **`previewImage` is NOT schema-gated** the way `seo.ogImage` is.

### Double-escape risks — DO NOT naively wrap
- `title`/`description`: `buildPageMetadata.ts:144-145` `stripHTMLTags` strips but does NOT encode
  (comment `:141-143`). Already escaped at 378/379/387/388/395/396 → **wrapping again = double-escape.**
- `faviconUrl`: already escaped inside `faviconLinkTag` → wrapping at call site → `&amp;amp;`.
- `ogImage`: `resolveOgImage` `encodeURIComponent`s only the `?path=` segment (`buildPageMetadata.ts:91`);
  override branch untouched. Percent-encoding is orthogonal to HTML-escaping — no conflict.
- `bodyHTML`: React-escaped — never touch.

### Contexts where HTML-escaping is NOT sufficient (planner must rule on scope)
- **URL attrs (`a.href` 317, `canonicalURL` 382/386/394, `ogImage` 389/397):** escaping stops attribute
  breakout but NOT `javascript:` / `data:` scheme injection. `seo.ogImage`/`faviconUrl` are `https://`-gated
  by `HttpsUrl` (`validation.ts:68-72`), but **`previewImage` and `canonicalDomain` are NOT** → need a
  scheme allow-list, not just escaping.
- **`cssVariablesStyle` (407):** theme colour values go raw into `<style>`; `escapeHTML` is INERT in CSS
  context (`</style>` breakout, `expression()`). Needs a CSS-value validator.
- **`localeJson` (323-328)** + **`jsonLd` (`headTags.ts:38`)**: inside `<script>`; HTML-escaping would
  CORRUPT them. `localeJson` escapes `<` but not U+2028/U+2029. `jsonLd` trusts caller — verify `structuredData.ts`.
- **`metadata.slug` (431):** attribute-escape correct here; regex-validate at source is better.

**Biggest live gap:** `canonicalDomain` → raw `href` ×3 + raw `https://${host}` build. Confirm where custom
domains are validated before treating as trusted.

---

## M5 — published-CSS globs (`scripts/buildPublishedCSS.js`)

**Current globs (L25-30):**
- L26 `src/modules/UIBlocks/**/*.published.tsx` — **DIR REMOVED, matches ZERO files**
- L27 `src/components/published/**/*.tsx` — exists (13 files)
- L28 `LandingPagePublishedRenderer.tsx` — exists
- L29 `componentRegistry.published.ts` — exists

**Confirms M5:** the ONLY glob that ever matched block markup (L26) is dead. Everything still rendering
correctly does so via the hand-maintained **safelist (L31-208)** + `src/components/published/**`.

Setup: temp `tailwind.published.config.js` (L281-285), inline JIT config + big safelist + `theme.extend`
(CSS-var-backed colors/fontSizes). Input CSS `published.input.css` (L289-301, imports
`src/styles/color-variables.css` + `fonts-self-hosted.css`). Runs `npx tailwindcss -c … --minify` (L314-317)
→ `public/published.css` (L312, **checked in**). Warns >100KB (L329). Temp files deleted (L337-338).
Invoked: `package.json:7` `build:published-css`, chained in `package.json:9` `build`.

### Dirs shipping `.published.tsx` (111 files) — ALL currently unscanned
- `src/modules/templates/**/blocks/**` — ~90 files (`atelier, granth, hearth, lex, lumen, meridian, surge, techpremium, vestria`)
- `src/modules/skeletons/work/blocks/**` — 17
- `src/modules/generatedLanding/sharedBlocks/**` — 3 (`FollowStrip`, `LeadForm`, `StoreBadges`)

**Why no static chain saves us:** `componentRegistry.published.ts:15,41` → `sharedBlocks/registry.published`;
`:49-53` → `getLoadedTemplate(...).resolveBlock(type,'published',layout)`. Template modules load via the
**dynamic-import firewall** → no static import chain for Tailwind to follow → every dir must be globbed explicitly.

### Non-`.published.tsx` class sources (also need scanning)
- `src/modules/skeletons/work/blocks/**/*.core.tsx` (17) + `src/modules/templates/{atelier,granth,vestria}/blocks/**/*.core.tsx` (27)
  — single-source pattern: classes live in `.core.tsx`, `.published.tsx` is a thin wrapper.
- Template non-block files: `tokens.ts`, `variants.ts`, `palettes.ts`, `sectionRules.ts`, `ThemeInjector.tsx`, `SSRTokens`.
- `src/modules/Design/**` (`designTokens.ts`, `background/*`) — legacy class-name helpers.
- `src/lib/staticExport/*.js` behavior scripts (`workBehaviors.js`, `atelierSliderBehaviors.js`,
  `lumenBehaviors.js`, `naayomBehaviors.js`, `formHandler.js`) toggle classes **at runtime** —
  Tailwind cannot see these; need scanning or safelisting.
- `src/lib/staticExport/htmlGenerator.ts` (wrapper markup).

### Tests
- `e2e/parity.spec.ts` (editor↔published), `e2e/publish.spec.ts`, `e2e/render.spec.ts` exist.
- **None assert `published.css` contents/size.** Parity runs against rendered DOM → a purged-class
  regression can PASS if both sides lack the style or the spec only compares structure.
- No vitest covers the build script. `public/published.css` is checked in.

**Scout's recommended shape:** replace L26 with globs over `src/modules/{templates,skeletons}/**/*.{published,core}.tsx`
+ template token/rule files + `src/modules/Design/**`; keep L27-29; add a build-time assertion (min size /
marker-class presence) so future dir moves fail loudly instead of silently purging.

---

## Orchestrator scope rulings (logged per pipeline rules)

1. **M3 needs NO client/UI work** — `preview/[token]/page.tsx` already handles non-2xx + `{ error }`. Confirmed,
   closes spec open-question #1.
2. **URL scheme allow-list is IN scope for M4.** Spec goal says "no published-page field can inject markup";
   escaping alone leaves `javascript:`/`data:` live on ungated fields (`previewImage`, `canonicalDomain`).
   Escaping-only would ship a fix that does not meet the stated goal.
3. **`cssVariablesStyle` CSS-context injection + `jsonLd`/`localeJson` script-context gaps:** planner to assess.
   Default ruling if non-trivial → record as findings for a FOLLOW-UP spec, do not expand this bundle.
   These are real but distinct sinks from the spec's "head attributes" framing.
4. **Subpage-blob rollback leak (M3, `:521-530`)** — OUT of scope, note in audit for follow-up.
5. **Spec was untracked on main** — copied into worktree; commit it with phase 1 so the branch is self-contained.

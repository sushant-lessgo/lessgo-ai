# publish-sanitize — plan (rev 3, post plan-review ×2)

- **WORKDIR:** `C:\Users\susha\lessgo-ai\.claude\worktrees\publish-sanitize`
- **Branch:** `feature/publish-sanitize`
- **Tier:** full
- **Spec:** `docs/task/publish-sanitize.spec.md`

## Overview

Published pages currently ship user-authored HTML raw — a stored-XSS hole (64 `.published.tsx`
blocks inject content via `dangerouslySetInnerHTML`; import/scrape pulls verbatim attacker-reachable
markup) — AND ship user-authored URLs raw into `href=`/`<iframe src=`: CTA `buttonConfig.url` →
`resolveDestination` with zero scheme validation, plus MANY flat element keys read straight into
`href=` (`cta_href`, `signin_url`, `book_call_url`, `whatsapp_href`, `calendly_url`, …) and embed
keys into iframe src (`map_embed`). This plan adds ONE canonical publish-side chokepoint with TWO
passes: (1) a server-side DOMPurify+jsdom HTML engine with a keep-links allow-policy, and (2) a
**pattern-based URL scheme-gate** (suffix-matched key detector, not a hand-list) over every
url-bearing field incl. `buttonConfig`/`dest` and embed keys — both deep-walked over the full
content tree inside `/api/publish`, positioned AFTER chrome injection so injected header/footer
sections are covered, plus a separate pass over the render-only i18n `localeContent` overlay. Dead
`sanitizeHtmlContent` is deleted. Content stays raw at rest — publish is the gate.

## Progress log

- phase 1 server sanitizer engine (HTML allow-policy + pattern URL/embed scheme-gate): done (commit 87421a7f, review loops 1, ship; class attr KEPT, rel=noopener via afterSanitizeAttributes). ALLOW-POLICY HUMAN GATE PASSED 2026-07-18 — founder approved all defaults (HTML keep/strip as-is; URLs allow mailto/tel/#fragment, unsafe href→'#', unsafe embed→''; video_url exemption + N1 first-republish normalization acknowledged).
- phase 2 deep-tree chokepoint (post-chrome + locale overlay) + sink grep + publish wiring + dead-sanitizer cleanup: done (review loops 1, ship; 107 href/src hits all bucket-a, EXTRA_URL_KEYS empty; main call route.ts:105, overlay route.ts:363; sanitizeHtmlContent DELETED). Nit for phase 3: lowercase the EXEMPT_URL_KEYS check for consistency.
- phase 3 tests (payload matrix, URL-gate matrix incl. flat href/embed keys, benign fixture, chrome/locale/metadata tree, idempotency, e2e assert): pending

---

## Phase 1 — Server sanitizer engine: HTML allow-policy + pattern URL/embed scheme-gate  **[HUMAN GATE: allow-policy sign-off]**

Build the one real engine. New module `src/lib/publishSanitizer.ts`.

### Steps

1. Create `src/lib/publishSanitizer.ts` (server-only module — NO `'use client'`, never imported by
   published renderers or client components; called only from the publish API flow):
   - Lazy-init singleton: `createDOMPurify(new JSDOM('').window)` — mirror the jsdom idiom already
     used at `src/lib/scrape/fetchSite.ts`. Lazy so publish cold-start doesn't pay jsdom cost until
     first sanitize; module-level cache thereafter.
   - Export `sanitizePublishedHtml(html: string): string` — DOMPurify config = the spec's
     allow-policy, adapted from `EDITOR_PROFILE` in `src/lib/htmlSanitizer.ts` (the only profile
     keeping `<a>`), NOT reinvented:
     - **ALLOWED_TAGS:** `a, b, strong, i, em, u, s, br, p, div, span, h1–h6, ul, ol, li, blockquote`
     - **ALLOWED_ATTR:** `href, target, rel, style, class` (class kept — editor spans may carry it;
       confirm vs EDITOR_PROFILE during impl; drop if EDITOR_PROFILE omits it and toolbar never emits it)
     - **FORBID:** `script, style (tag), iframe, object, embed, form, link, meta, base, svg, math`
       + all `on*` attributes (DOMPurify default) + `srcdoc`.
       (NOTE: forbidding `<iframe>` here only blocks USER-authored iframe markup. Template-authored
       JSX iframes whose `src` comes from content — `map_embed`, `video_url` — are NOT touched by
       this pass; they are the embed-gate's job, step 3.)
   - **Hooks** (`uponSanitizeAttribute`):
     - `style` attr → run through `sanitizeStyleAttribute` (whitelist ~20 props; blocks
       `expression(`, `url(javascript:`, `data:text/html`); drop attr if it returns empty.
     - `href` attr → validate with `isSafePublishedUrl` (below); drop attr on failure.
     - If `target="_blank"` survives, ensure `rel` contains `noopener` (add if missing) — cheap
       tab-nabbing hardening, zero visual impact.
   - **Fast-path guard:** `if (!html.includes('<')) return html;` — a no-`<` string cannot contain
     elements; skipping avoids DOMPurify entity-normalizing plain copy (`a & b` → `a &amp; b`) that
     some blocks render as React text children, not innerHTML. This is the idempotency/no-mangle
     guarantee for the ~90% plain-text fields.
     - Known accepted tradeoff (document in module JSDoc): a plain-text field legitimately
       containing `<` (e.g. "price < 5") gets entity-encoded. Rare; safe direction; explicitly
       exercised by the phase-3 benign fixture (N5).
     - NOTE this fast-path is exactly why URLs need their OWN gate: a bare
       `"javascript:alert(1)"` string has no `<` and sails through HTML sanitization untouched.
2. **URL scheme-gate** (B1 fix — closes the CTA-link vector). Export from the same module:
   - `isSafePublishedUrl(url: string): boolean` — wrap, don't fork, the single-sourced `isSafeURL`
     from `src/lib/staticExport/headTags.ts` (https/http/root-relative; rejects
     javascript:/data:/vbscript:/protocol-relative; strips control chars), OR'd with the three
     allowances `isSafeURL` rejects but published pages legitimately need (N4 — ALL THREE, not
     just mailto): `mailto:` · `tel:` (real CTA pattern for call-conversion sites) · `#fragment`
     (in-page anchors — the whole section-scroll CTA system). All three on the gate table.
   - `sanitizePublishedUrl(url: string): string` — returns `url` if safe or empty, else the inert
     replacement **`'#'`** (link stays clickable-but-dead; page layout unbroken; nothing throws
     downstream in `resolveDestination`). This replace-with-`'#'` policy is a **gate-table item**
     for founder sign-off.
   - **`isUrlContentKey(key)` — the pattern-based URL-key detector (PRIMARY defense; replaces
     rev-2's fixed `{href,url,fileUrl,link}` set, which missed most raw-href sinks).** Exact
     predicate, coded verbatim:

     ```
     const k = key.toLowerCase();
     return k.endsWith('href')   // href, cta_href, secondary_cta_href, whatsapp_href, …
         || k.endsWith('url')    // url, fileurl, signin_url, book_call_url, calendly_url, …
         || k.endsWith('link')   // link, cta_link, …
         || k.endsWith('slug');  // slug, pathslug
     ```

     (Suffix-match subsumes the exact names `href`/`url`/`link`/`fileUrl`/`slug`/`pathSlug` and the
     `_href`/`_url` variants — case-insensitive by lowercasing first.) Two companion pieces:
     - `EXTRA_URL_KEYS: string[]` — explicit escape hatch, seeded EMPTY; the phase-2 sink grep
       reconciles: any grep-found href/iframe-src key NOT matching the pattern goes here (or the
       pattern is widened) — the audit MUST record the reconciliation either way.
     - `EXEMPT_URL_KEYS = ['video_url']` — exemption criteria (state in JSDoc): a key may be
       exempt ONLY if EVERY reader (grep-verified in audit) routes it through a render-side
       normalizer that is safe by construction. `video_url` qualifies: `ytEmbed()`
       (`src/modules/templates/techpremium/blocks/Explainer/ytEmbed.ts`) regex-extracts an
       11-char `[\w-]` YouTube id and interpolates it into a FIXED
       `https://www.youtube-nocookie.com/embed/…` string, or returns `''` — no input scheme can
       survive. Exemption is REQUIRED, not optional: users legitimately store bare 11-char video
       IDs (accepted by ytEmbed), which fail `isSafeURL` → gating would turn them into `'#'` →
       breaks live videos on re-publish and violates the N1 no-semantic-change guarantee.
       Implementer re-verifies ytEmbed + greps that all `video_url` readers use it (currently
       TechPremiumExplainer + TechPremiumProcess, both renderer halves); pinned by a ytEmbed unit
       test in phase 3; recorded in audit.
     - **Over-gate bias (state in JSDoc + audit):** an unsafe/unmatched value → `'#'` is a
       visible-in-QA dead link; under-gating is silent stored XSS. When in doubt, GATE. Two
       accepted over-gate tradeoffs, documented in JSDoc alongside N5: (a) a hypothetical prose
       field whose key ends in `url`/`link` would be scheme-gated — grep confirms none exist
       today; (b) a `pathSlug`/`slug`/`dest.pathSlug` value without a leading `/` fails
       `isSafeURL` → `'#'` — rare (pickers emit `/`-prefixed); NOT a bug.
3. **Embed-src gate** (B2 fix — content-derived `<iframe src>`). Keys where template JSX renders
   the value into an iframe are NOT plain URLs by product design — `map_embed` accepts EITHER a
   bare Google-Maps embed URL OR a full pasted `<iframe src="…">` snippet, normalized at render by
   `mapEmbedSrc` (`src/modules/templates/techpremium/blocks/Contact/mapEmbedSrc.ts` — https-only +
   `*.google.com` host-pin + `/maps/embed` path check, unit-tested incl. the iframe-paste case).
   A plain URL-gate would replace every legit iframe-paste with `'#'` → breaks live maps. So:
   - `isEmbedContentKey(key)`: `key.toLowerCase().endsWith('embed')`. Checked BEFORE
     `isUrlContentKey` in dispatch.
   - `sanitizePublishedEmbed(value: string): string` — extract the candidate src: if the value
     contains `<`, apply the same `/src=["']([^"']+)["']/i` extraction `mapEmbedSrc` uses; else the
     candidate is the raw value. Candidate must parse as a URL with protocol `https:` (iframes get
     no `mailto:`/`tel:`/`#`/relative allowance; http = mixed content anyway). Safe → return the
     ORIGINAL value unchanged (render-side `mapEmbedSrc` keeps doing the extraction — no stored
     rewrite, no semantic change). Unsafe (`javascript:`, `data:text/html`, no extractable src,
     unparseable) → **`''`** (blocks already render "no embed" for empty — graceful; `'#'` is
     meaningless as an iframe src). Idempotent (`'' → ''`). The render-side `mapEmbedSrc` host-pin
     remains as verified defense-in-depth (note in audit); the content-level gate is the
     chokepoint-level guarantee and covers any future non-host-pinned embed reader.
   - **`<img src>` is NOT an executable sink — do NOT gate image keys** (`image`, `avatar`,
     `logo`, …; none match the suffixes). The gate is for `<a href>` + `<iframe src>` only.
4. **Gating location decision** (unchanged from rev 2): gate at the **publish walk** (phase 2), NOT
   inside `resolveDestination` (`src/utils/resolveCtaHref.ts:33-54`) and NOT per-block. Rationale:
   one content-level chokepoint cleans BOTH the rendered HTML and the `PublishedPage.content`
   snapshot (which feeds verify-dns regeneration + SSR fallback); a render-level gate would leave
   poisoned snapshots at rest and also alter the editor path. Render-level defense-in-depth in
   `resolveDestination` = audit-noted future hardening ticket, out of scope.
5. Edit `src/lib/htmlSanitizer.ts`: **export** `sanitizeStyleAttribute` (currently module-private,
   ~line 179). No other behavior change to that file. Do NOT touch its regex server path.
6. Module JSDoc: state this is THE publish-gate engine; regex paths (`sanitizeHTMLServer`,
   `src/utils/htmlSanitization.ts`) are explicitly NOT security boundaries and are out of scope;
   plus the three documented tradeoffs (plain-text `<` / N5, over-gate bias + prose-key risk,
   slash-less slug → `'#'`).

### Files touched

- `src/lib/publishSanitizer.ts` (new)
- `src/lib/htmlSanitizer.ts` (export `sanitizeStyleAttribute` only)

### Verification

- `npx tsc --noEmit` green.
- Quick REPL/inline sanity (implementer, no committed script): `sanitizePublishedHtml` on
  `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `<a href="javascript:alert(1)">x</a>`,
  `<span style="color:red;background:expression(alert(1))">x</span>` — all neutralized;
  `<a href="https://x.com" target="_blank">x</a><b>hi</b>` survives with `rel="noopener"` added.
  `sanitizePublishedUrl` on `javascript:alert(1)` → `'#'`; on `https://…`, `mailto:…`, `tel:…`,
  `#form-section`, `/contact` → unchanged. `isUrlContentKey` true for `cta_href`, `signin_url`,
  `book_call_url`, `pathSlug`; false for `headline`, `cta_text`, `image`. `sanitizePublishedEmbed`
  on a Google-Maps iframe paste → unchanged; on `data:text/html,<script>` → `''`.
- `npm run test:run` green (no regressions in existing htmlSanitizer tests from the export change).

### HUMAN GATE — allow-policy sign-off

Present founder the final keep/strip table BEFORE phase 2 wires it into publish:

| Decision | Plan default |
|---|---|
| HTML tags/attrs keep-list + style-prop whitelist | as above |
| `mailto:` hrefs | allow |
| `tel:` hrefs | allow |
| `#fragment` hrefs | allow |
| Unsafe-scheme URL (`javascript:` etc. in buttonConfig/any url-key field) | replace with inert `'#'` (not empty, not publish-fail) |
| **URL-key detection = suffix pattern** (`…href`/`…url`/`…link`/`…slug`, case-insensitive) + empty extra-keys list, over-gate bias | as above — grep reconciles; over-gating fails visible-safe |
| **Embed keys** (`…embed`, content-derived iframe src) | https-only; legit URL-or-iframe-paste kept verbatim; unsafe → `''` (embed dropped, not `'#'`) |
| **`video_url` exemption** | exempt from gate — every reader goes through safe-by-construction `ytEmbed` (audit-verified + unit-pinned); gating would break bare-ID videos |
| `class` attr | keep iff EDITOR_PROFILE/toolbar uses it |
| **First-republish normalization (N1)** | acknowledged: every ALREADY-LIVE page's first re-publish after this ships gets one-time DOMPurify normalization byte-changes (attr order/quoting, `<br>`→`<br />`, entities) even when clean. Guarantee = **no visible/semantic change**; byte-no-op holds only from the SECOND re-publish on. |

---

## Phase 2 — Deep-tree chokepoint (post-chrome + locale overlay) + sink grep + publish wiring + dead-sanitizer cleanup

### Data-flow map (from `src/app/api/publish/route.ts` — drives placement)

| Line | Event |
|---|---|
| 52-54 | `sanitizeContentForPublish(content)` — structural gate |
| 88-98 | `injectChromeIntoPage` writes `chrome.header.data`/`chrome.footer.data` into root + every subpage `content` map (`src/lib/staticExport/injectChrome.ts:13,18`) — **user nav labels/footer copy enter the tree HERE, after line 53** |
| 209-225 / 244-260 | `PublishedPage` update/create persists `content` (chrome already injected → in snapshot) |
| 353-355 | `content.localeContent = projectLocaleContent` — i18n overlay seeded from `Project.content` **after** the DB write, **before** render → render-only, never in the persisted snapshot |
| 372+ | `renderPublishedExport({ content, … })` → `generateStaticHTML()` |

**Why one call can't cover everything:** the main chokepoint must run after chrome injection (98)
and before the DB writes (209/244) to clean both the snapshot AND the render input — but
`localeContent` doesn't exist on `content` until line 353-355 (sourced from the DB-side project
draft, post-snapshot). So: one main call + one overlay call. Two calls, stated below.

### Steps

1. **De-risking sink grep (widened — do FIRST, before writing the walk).** Enumerate EVERY content
   field that ANY `.published.tsx` renders into an `href=` OR executable `src=` (iframe) sink,
   across **ALL template dirs** — `src/modules/templates/{meridian, techpremium, hearth, lex,
   lumen, vestria, granth, surge, atelier, atelier2, blockMocks}` (i.e. every dir under
   `src/modules/templates/`, current AND any added since; not just the 4 CLAUDE.md-listed ones):
   - Grep `href=` and `src=` in `**/*.published.tsx`; trace each hit to the content key it reads
     (direct prop, collection-item field, or helper like `resolveDestination`/`ytEmbed`/`mapEmbedSrc`).
   - Known flat href sinks the pattern MUST catch (spot-checks): `cta_href`/`secondary_cta_href`
     (`TechPremiumExplainer.published.tsx:75`, `TechPremiumNav.published.tsx:58`; also
     vestria/granth hero + header), `signin_url` (`TechPremiumNav.published.tsx:59`),
     `book_call_url` (`LumenFooter.published.tsx:49→114`), `whatsapp_href` + `calendly_url`
     (hearth Contact/CTA blocks). Known iframe-src sinks: `map_embed`
     (`TechPremiumContact.published.tsx:101` via `mapEmbedSrc`), `video_url`
     (`TechPremiumExplainer.published.tsx:48` + `TechPremiumProcess.published.tsx:30` via `ytEmbed` — exempt, step 1 of phase 1).
   - **Reconcile in the audit:** lock the full grep-found URL-key set; every key must be
     (a) matched by `isUrlContentKey`/`isEmbedContentKey`, or (b) added to `EXTRA_URL_KEYS` (or the
     pattern widened), or (c) on `EXEMPT_URL_KEYS` with a verified safe-by-construction normalizer.
     No fourth bucket. `<img src>` keys are recorded as out-of-scope (non-executable).
2. Extend `src/lib/publishSanitizer.ts` with `sanitizeContentHtml(content): void` — the deep walk,
   MIRRORING `sanitizeContentForPublish`'s traversal (`src/modules/sections/layoutElementSchema.ts:429–513`),
   same order (subpages first, then root). **Mutates in place** (matches how `sanitizeContentForPublish`
   is called at route line 53; avoids re-threading `content` through 300 lines of route; and — load-bearing —
   the injected chrome sections ALIAS `chrome.header.data` by reference (`injectChrome.ts:13,18`), so
   in-place cleaning of the injected sections also cleans the residual `content.chrome` copy that
   persists in the DB snapshot):
   - **Subpages:** `content.subpages` values → `sub.layout.sections` → `subContainer = sub.content ?? sub`
     → per section.
   - **Root:** `content.layout.sections` → `container = content.content ?? content` → per section.
   - **Chrome residual (defensive):** also run the per-section pass over
     `content.chrome.header.data` / `content.chrome.footer.data` when present — normally a no-op
     via the aliasing above, but guards against any future copy-not-alias change in injectChrome.
   - **Per section** (`{ layout, elements, elementMetadata, aiMetadata }`) — ONE shared key-aware
     dispatch for every string field, applied everywhere below (precedence order):
     1. `isEmbedContentKey(key)` → `sanitizePublishedEmbed`
     2. key in `EXEMPT_URL_KEYS` → `sanitizePublishedHtml` (harmless: URL/ID values have no `<` →
        fast-path byte-identical; `<`-bearing junk still gets HTML-sanitized)
     3. `isUrlContentKey(key)` or key in `EXTRA_URL_KEYS` → `sanitizePublishedUrl`
     4. else → `sanitizePublishedHtml`
     Applied to:
     - `elements[key]` bare strings. (HTML sanitize is WRONG for URL fields — the no-`<` fast-path
       passes `javascript:` verbatim; that's why dispatch precedes it.)
     - `elements[key]` arrays (collections) → per item object, same dispatch on every string-valued
       field (covers `l.href`/`s.href` read raw by `LumenFooter.published.tsx` /
       `ColophonFooter.published.tsx`, flat `cta_href`/`video_url` on techpremium/vestria/granth
       row items, and prose fields `quote`/`title`/… via HTML pass). Walk ALL string props
       generically; nested objects: recurse one level defensively.
     - **`elementMetadata[key]` walk (B1 core):** run the same dispatch over the string props of
       `buttonConfig` — the pattern catches legacy `buttonConfig.url` + `buttonConfig.pathSlug`
       (a non-`/` pathSlug round-trips verbatim through `resolveDestination` → gated; `'#'`
       fail-safe noted) + `buttonConfig.fileUrl` (`src/utils/resolveCtaHref.ts:18-27`,
       `destinationShim.ts:22-42`) — AND over new-vocabulary `buttonConfig.dest.{url, fileUrl,
       pathSlug}` when `dest` is an object (`Destination` kinds `external`/`social`/`download`/`page`
       — `src/types/destination.ts:12-20`; `whatsapp`/`call`/`email` compose safe schemes in
       `resolveDestination`, their non-URL fields fall to the HTML pass, harmless). Implementer
       greps `elementMetadata` writers/readers for any OTHER url-bearing key (e.g. nav-link
       metadata in header chrome data) — step-1 reconciliation covers these too; enumerate in audit.
     - Never touch `layout`, `aiMetadata`, section keys, or non-string values.
3. Extend `src/lib/publishSanitizer.ts` with `sanitizeLocaleOverlay(overlay): overlay` — walks the
   `LocaleContentOverlay` shape (`locale → sectionId → elementKey → string | string[]`,
   `src/types/core/content.ts:87-93`) applying the SAME key-aware dispatch (arrays per item).
   Small pure helper.
4. Wire into `src/app/api/publish/route.ts` — **two calls**:
   - **Main chokepoint:** insert `sanitizeContentHtml(content)` **immediately AFTER the chrome
     injection block (after current line 98), before `cleanTitle` (line ~100)** — i.e. after
     `sanitizeContentForPublish` (structural) + seo/pixel passes + chrome injection, before the
     `PublishedPage` writes. One call now covers (a) base root+subpage content and (b) injected
     chrome sections, for BOTH the DB snapshot and `generateStaticHTML`. (NOT at line 53 — that
     was rev-1's bug B2: chrome lands at 88-98, after it.)
   - **Overlay call:** at the seeding site (current lines 353-355), change to
     `(content as any).localeContent = sanitizeLocaleOverlay(projectLocaleContent)` — covers the
     render-only translated text (spec's highest-severity class: verbatim import path). Only-when-
     present semantics unchanged (no key added for single-locale publishes).
5. Resolve the dead sanitizer:
   - Remove the unused `sanitizeHtmlContent` import at `src/app/api/publish/route.ts:9`.
   - Delete `sanitizeHtmlContent` from `src/lib/security.ts` (~line 146) — dead wrapper to the
     STRICT profile (would strip `<a>`; wrong policy). Grep-verify zero remaining importers first;
     if any other caller exists, repoint it to `sanitizePublishedHtml` and note in audit.
   - **N3:** `src/app/api/publish/route.test.ts:35` mocks `sanitizeHtmlContent` in its whole-module
     `vi.mock('@/lib/security', …)` factory — orphaned-but-harmless after deletion (extra key
     ignored). **Decision: remove the orphaned mock key** (one line) so no one chases it later.
   - **Non-blocking note (audit only, NO code):** after the deletion, `sanitizePublishedContent` +
     `STRICT_PROFILE` in `src/lib/htmlSanitizer.ts` may become unused — harmless; out of scope;
     record as a future-cleanup note, do not delete in this feature.
   - `src/utils/htmlSanitization.ts` (second regex sanitizer, misleadingly named
     `sanitizeWithDOMPurify`): NOT on the publish path — leave alone; audit notes it as a known
     non-boundary for a future cleanup ticket.
6. Template `<style>` constants / hand-authored CSS are outside the content tree — the walk never
   touches them by construction (assert in audit, no code).

### Files touched

- `src/lib/publishSanitizer.ts` (edit — tree walk + shared key-dispatch + elementMetadata URL pass + locale overlay helper)
- `src/app/api/publish/route.ts` (two wire calls; remove dead import)
- `src/app/api/publish/route.test.ts` (remove orphaned `sanitizeHtmlContent` mock key)
- `src/lib/security.ts` (delete dead `sanitizeHtmlContent`)

(The step-1 sink grep is read-only across all template dirs — it edits nothing, only feeds
`EXTRA_URL_KEYS`/pattern decisions inside `publishSanitizer.ts` + the audit.)

### Verification

- `npx tsc --noEmit` + `npm run test:run` green.
- Grep: no remaining references to `sanitizeHtmlContent` anywhere (src + tests).
- Audit contains the reconciled sink table (grep-found key → bucket a/b/c from step 1).
- Manual dev check (`npm run dev`): publish a project with (a) `<b>bold</b>` +
  `<a href="https://example.com">` in a hero field → `/p/[slug]` intact; (b) `<img src=x onerror=alert(1)>`
  in a field → no `onerror` in published HTML; (c) Button Config Modal URL set to
  `javascript:alert(1)` → published CTA renders `href="#"` (confirm via one of the raw readers, e.g.
  `meridian/…/ArcCTA.published.tsx:44` output); (d) a techpremium page: `cta_href` set to
  `javascript:alert(1)` → published `href="#"`; a legit Google-Maps iframe paste in `map_embed` →
  map still renders; (e) a page WITH shared header/footer chrome → chrome nav labels sanitized
  (seed a payload in a nav label via draft save to confirm).

---

## Phase 3 — Tests: payload matrix, URL-gate matrix (incl. flat href/embed keys), benign fixture, deep tree (chrome/locale/metadata), idempotency, e2e assert

### Steps

1. New `src/lib/publishSanitizer.test.ts` (Vitest):
   - **HTML payload matrix** — each neutralized: `<script>`, `<img onerror>`, `<svg onload>`,
     `<a href="javascript:...">`, `<a href="data:text/html,...">`, `<iframe>`, `<object>`,
     `<embed>`, inline `<style>` tag, style attr `expression()`, style attr `url(javascript:)`,
     obfuscated scheme `java\tscript:` (isSafeURL control-char strip).
   - **URL-gate matrix** (`sanitizePublishedUrl`): `javascript:alert(1)`, `data:text/html,…`,
     `vbscript:…`, `//evil.com`, obfuscated `java\nscript:` → all `'#'`; `https://x`, `http://x`,
     `/contact`, `#form-section`, `mailto:a@b.c`, `tel:+15551234`, empty string → unchanged.
     (Asserts all three N4 allowances — mailto AND tel AND fragment.)
   - **Key-detector matrix** (`isUrlContentKey`/`isEmbedContentKey`): true for `href`, `cta_href`,
     `secondary_cta_href`, `whatsapp_href`, `url`, `fileUrl`, `signin_url`, `book_call_url`,
     `calendly_url`, `link`, `slug`, `pathSlug`; embed-true for `map_embed`; FALSE for `headline`,
     `cta_text`, `description`, `image`, `avatar` (no over-gating of prose/image keys).
   - **Embed-gate matrix** (`sanitizePublishedEmbed`): bare Google-Maps embed URL → unchanged;
     full `<iframe src="https://www.google.com/maps/embed?...">` paste → byte-identical;
     `javascript:alert(1)` → `''`; `data:text/html,<script>…` → `''`;
     `<iframe src="javascript:alert(1)">` paste → `''`; `http://` (non-https) → `''`; `''` → `''`.
   - **ytEmbed exemption pin** (new `src/modules/templates/techpremium/blocks/Explainer/ytEmbed.test.ts`):
     `ytEmbed('javascript:alert(1)')` → `''`; `ytEmbed('data:text/html,x')` → `''`;
     `ytEmbed('https://youtu.be/dQw4w9WgXcQ')` and bare `'dQw4w9WgXcQ'` → the exact
     `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ` string. This is the load-bearing proof
     behind `EXEMPT_URL_KEYS = ['video_url']`.
   - **Benign fixture survives semantically unchanged — asserted against DOMPurify-NORMALIZED
     expected strings, NOT raw editor input (N2):** build expected values by running the raw
     fixture through the sanitizer once at fixture-authoring time and hard-coding the normalized
     output (attr order/quoting, `<br />`, entity forms) as the assertion target; a raw-string
     equality assert would false-green (fast-path cases) or spurious-fail (normalized cases).
     Fixture contents: links (https + mailto + tel + `#anchor` + root-relative),
     `b/strong/i/em/u`, nested spans with allowed style props (`font-weight/color/text-align/font-size`
     — the exact set `TextToolbarMVP` emits), `ul/ol/li`, `h1–h6`, `blockquote`, `target="_blank"`
     (gains `rel="noopener"` — assert explicitly, it's the one allowed delta).
   - **Plain-text no-mangle:** `"Fast & simple"`, `"100% free"` round-trip byte-identical (fast-path).
   - **Plain-prose `<` tradeoff (N5):** a field containing `"price < 5"` (no tags) → assert the
     actual output (entity-encoded `price &lt; 5`) so the documented tradeoff is visible + pinned.
   - **Idempotency:** `f(f(x)) === f(x)` for the benign fixture, each payload output, each
     URL-gate output (incl. `'#'` → `'#'`), and each embed-gate output (incl. `'' → ''`).
   - **Deep-tree coverage** via `sanitizeContentHtml` on a fixture shaped like the real tree:
     - HTML payloads in: root section element string, root collection item field (`quote`),
       a `subpages` entry's section element, a subpage collection item field → all sanitized.
     - **Flat URL keys (B1 rev-3):** section elements `cta_href`, `secondary_cta_href`,
       `signin_url`, `book_call_url` each seeded with `javascript:alert(1)` or
       `data:text/html,…` → all become `'#'`; the SAME keys seeded with `https://…` → byte-identical.
       `map_embed` with `data:text/html,…` → `''`; with a legit maps iframe paste → byte-identical.
       `video_url` with a bare 11-char ID → byte-identical (exemption holds). A prose element
       (`headline` = plain sentence) → byte-identical (no over-gating).
     - **elementMetadata (B1):** `elementMetadata[key].buttonConfig.url = 'javascript:…'` (legacy),
       `buttonConfig.pathSlug = 'javascript:…'`, and a new-shape `buttonConfig.dest =
       { kind:'download', fileUrl:'javascript:…' }` — root AND subpage → all become `'#'`; a safe
       `https://` url and a `{kind:'call'}` dest pass untouched.
     - **Bare href fields in collections:** item `{ href: 'javascript:…' }` → `'#'`;
       `{ href: 'https://…' }` untouched (proves URL dispatch, not HTML fast-path); item
       `{ cta_href: 'javascript:…' }` → `'#'` (pattern applies inside collections too).
     - **Chrome:** build fixture via a real `injectChromeIntoPage` call with a payload in a nav
       label, then walk → injected header/footer sections AND `content.chrome.*.data` clean
       (asserts the aliasing/in-place design).
     - `layout`/`aiMetadata`/non-strings untouched; structure/order preserved.
   - **Locale overlay:** `sanitizeLocaleOverlay` on `{ nl: { 'hero-abc': { headline:
     '<img onerror=…>', ctaHref: 'javascript:…', bullets: ['<script>…', 'ok'] } } }` →
     HTML pass on prose keys, URL pass on url-named keys (`ctaHref` matches the suffix pattern),
     arrays per item; safe values byte-stable.
   - **Mutation-resistant assertions** (per inert-test lesson): assert exact expected output
     strings / `not.toContain('onerror')` / `toBe('#')` / `toBe('')` on OUTPUT, not "function ran".
2. Extend `e2e/publish.spec.ts` (authed Playwright): after publish, fetch the published HTML and
   assert (a) no `<script>alert` / `onerror=` from a payload seeded into a content field, (b) a
   benign `<a href="https://...">` is present, (c) no `href="javascript:` anywhere. Lean addition
   to the existing flow — no new spec file, no new auth plumbing; seed via the same draft-save path
   the spec already uses. If disproportionate, drop to unit-only and record why in the audit (the
   deploy-QA human smoke covers the live path regardless).

### Files touched

- `src/lib/publishSanitizer.test.ts` (new)
- `src/modules/templates/techpremium/blocks/Explainer/ytEmbed.test.ts` (new — exemption pin)
- `e2e/publish.spec.ts` (edit — payload + benign + javascript:-href assertions)

### Verification

- `npm run test:run` green (new suites included).
- `npx tsc --noEmit` green.
- `npm run test:e2e` — run locally if the Clerk harness is available; NOT part of the hard green
  gate (gate = tsc + test:run + build + lint), but must not be committed red.
- **Final full gate for the feature:** `npx tsc --noEmit` + `npm run test:run` + `npm run build` +
  `npm run lint` all green.

---

## Post-merge manual QA (not a code phase — deploy-qa §A, human)

**[HUMAN GATE: preview-deploy XSS smoke]** On preview deploy: publish one payload page (script /
`<img onerror>` / `javascript:` link in a FIELD / `javascript:` in a flat `cta_href` / `javascript:`
URL in the Button Config Modal / style `expression()`) → all neutralized on `/p/[slug]`, CTA hrefs
= `#`; publish one benign **multi-page atelier/lumen** page WITH chrome + a translated locale if
available → every link/format/inline style intact, zero visible regression; one techpremium page
with a real Google-Maps embed + a YouTube video (bare ID) → both still render; re-publish the clean
page **twice** — first re-publish may show a one-time normalization byte-diff (N1, expected +
founder-acknowledged at the phase-1 gate), the SECOND re-publish must be a no-op diff. Acceptance =
no visible/semantic change ever; byte-identity only from pass 2.

---

## Landmine checklist (baked in)

- No `'use client'` imports into publish path; `publishSanitizer.ts` is a plain server module.
  (`ytEmbed.ts`/`mapEmbedSrc.ts` are already plain modules — referenced, never modified.)
- No block `.tsx`/`.published.tsx` edits at all → dual-renderer parity untouched. (`resolveCtaHref.ts`
  also untouched — gating is content-level, deliberately. Only NEW test files land under a template dir.)
- No schema/DB change → no migrations.
- `npm run build` (full script), not bare `next build`, in the final gate.
- Engine = DOMPurify+jsdom; regex paths never used as the boundary. URL boundary = `isSafeURL`
  single-source, wrapped not forked. URL-key boundary = suffix pattern + audit-reconciled grep,
  never a hand-list alone.

## Unresolved questions

1. Unsafe-scheme URL → inert `'#'` (not empty / not publish-fail) — OK? (phase-1 gate)
2. Allow `tel:` + `#fragment` + `mailto:` hrefs — confirm all three? (phase-1 gate)
3. N1: acknowledge one-time byte-diff on FIRST re-publish of already-live pages? (phase-1 gate)
4. Keep `class` attr in allow-list? (keep iff EDITOR_PROFILE/toolbar uses it — confirm at gate)
5. e2e payload assert: OK to drop to unit-only if publish.spec seeding is disproportionate?
6. Delete vs repoint if a second `sanitizeHtmlContent` caller surfaces — plan says repoint; OK?
7. URL-key suffix pattern (`…href`/`…url`/`…link`/`…slug`) + over-gate bias — OK? (phase-1 gate)
8. Embed keys: unsafe → `''` (embed dropped) rather than `'#'` — OK? (phase-1 gate)
9. `video_url` exemption (ytEmbed = the boundary, unit-pinned) — OK? (phase-1 gate)

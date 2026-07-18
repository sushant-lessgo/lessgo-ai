# publish-sanitize — audit

## Phase 1 — Server sanitizer engine (HTML allow-policy + pattern URL/embed scheme-gate)

### Files changed
- `src/lib/publishSanitizer.ts` (NEW) — the publish-gate engine.
- `src/lib/htmlSanitizer.ts` — added `export` to `sanitizeStyleAttribute` (one keyword, no behavior change).

### What was built
`src/lib/publishSanitizer.ts`, a server-only module (no `'use client'`), exporting:
- `sanitizePublishedHtml(html)` — lazy jsdom-backed DOMPurify singleton (`createDOMPurify(new JSDOM('').window)`, module-cached). Fast-path `if (!html.includes('<')) return html`. Hooks: `uponSanitizeAttribute` runs `style` through `sanitizeStyleAttribute` (drop attr if empty) and `href` through `isSafePublishedUrl` (drop attr on failure); `afterSanitizeAttributes` adds `rel="noopener"` to any surviving `target="_blank"`.
- `isSafePublishedUrl(url)` — wraps single-sourced `isSafeURL` (headTags.ts), OR'd with `mailto:` / `tel:` / `#fragment`.
- `sanitizePublishedUrl(url)` — safe/empty → unchanged, else inert `'#'`. Idempotent.
- `isUrlContentKey(key)` — verbatim suffix predicate (`href`/`url`/`link`/`slug`, lowercased).
- `EXTRA_URL_KEYS` — seeded EMPTY (phase-2 grep escape hatch).
- `EXEMPT_URL_KEYS = ['video_url']` — JSDoc states the ytEmbed safe-by-construction rationale.
- `isEmbedContentKey(key)` — lowercase `endsWith('embed')`.
- `sanitizePublishedEmbed(value)` — src-extract (if `<` present) else raw; require `https:` protocol; safe → original unchanged, else `''`. Idempotent.

Module JSDoc documents: engine role; regex paths are NOT the boundary; the 3 tradeoffs (plain-text `<` entity-encoding; over-gate bias + prose-key risk + slash-less slug → `'#'`; destructive embed drop on false-positive `*embed`).

NOT built in phase 1 (correctly deferred to phase 2): `sanitizeContentHtml`, `sanitizeLocaleOverlay`, publish wiring, dead-sanitizer cleanup.

### Allow-policy settled on
- **ALLOWED_TAGS:** `a, b, strong, i, em, u, s, br, p, div, span, h1–h6, ul, ol, li, blockquote`
- **ALLOWED_ATTR:** `href, target, rel, style, class`
- **FORBID_TAGS:** `script, style, iframe, object, embed, form, link, meta, base, svg, math`
- **FORBID_ATTR:** `srcdoc` (+ DOMPurify's default `on*` stripping) · `ALLOW_DATA_ATTR: false`

### `class` decision — KEPT
EDITOR_PROFILE (the profile this policy adapts) keeps `class`; `class` is not an executable sink. The TextToolbarMVP emits inline `style` only (confirmed: it sets `targetElement.style.*`, never `class`), but AI-generated / template-seeded content may legitimately carry class names, and stripping them risks visible breakage for zero security gain. Conservative "don't break pages" choice; documented in the module.

### DOMPurify server-wiring that worked
`import createDOMPurify from 'dompurify'` (default export is a factory-callable `DOMPurify` instance in v3.2.6) + `new JSDOM('').window` cast to `Window & typeof globalThis`. dompurify 3.2.6 / jsdom 26.1.0, both already installed. Lazy singleton so cold-start doesn't pay jsdom cost until first sanitize. Hook types (`uponSanitizeAttribute`/`afterSanitizeAttributes`) resolved cleanly against the shipped `.d.ts`.

### Runtime sanity-check outputs (throwaway tsx script, since deleted)
```
script+jshref+b  =>  "<a>x</a><b>hi</b>"          (script stripped, js href attr dropped, <b> kept)
img onerror      =>  ""                            (img not allowed → removed)
style expr       =>  "<span style=\"color: red\">x</span>"  (expression() stripped)
blank target     =>  "<a href=\"https://x.com\" target=\"_blank\" rel=\"noopener\">x</a><b>hi</b>"
plain amp        =>  "Fast & simple"               (fast-path, byte-identical)
plain lt         =>  "price &lt; 5"                (documented tradeoff (a))
url js           =>  "#"
url https/mailto/tel/frag/rel  =>  unchanged
url proto-rel //evil.com       =>  "#"
url java\nscript:               =>  "#"            (control-char strip via isSafeURL)
key cta_href/signin_url/pathSlug => true ; headline/image => false ; map_embed(embed) => true
embed maps iframe paste         =>  unchanged
embed bare maps url             =>  unchanged
embed data:/js-iframe/http/empty => ""
idempotency (html, url '#', embed) => stable
```
All match the plan's expected behavior.

### Verification
- `npx tsc --noEmit`: only pre-existing unrelated error `src/app/page.tsx(6,26): Cannot find module '@/assets/images/founder.jpg'` (stale image-module type artifact; the asset file exists on disk; not touched by this phase). No errors in `publishSanitizer.ts` / `htmlSanitizer.ts`.
- `npm run test:run`: 243 files passed, 1 skipped · 4064 tests passed, 18 skipped. No regression from the `sanitizeStyleAttribute` export change.
- Runtime sanity check: passed (outputs above); script deleted, not committed.

### Deviations from plan
- **rel="noopener" hardening** implemented in an `afterSanitizeAttributes` hook rather than inside `uponSanitizeAttribute`. Reason: adding `rel` reliably requires the fully-processed attribute set on the node (target must be confirmed surviving); doing it per-attribute in `uponSanitizeAttribute` races the target/rel ordering. Same hook family, same net effect ("when target=_blank survives, ensure rel~=noopener"); verified in the runtime check.

### Open risks / notes for the orchestrator (before the human gate)
- **HUMAN GATE pending:** allow-policy sign-off (keep/strip table + the `#`-replacement, mailto/tel/fragment allowances, embed→`''`, `video_url` exemption, `class` kept, N1 first-republish byte-diff). All plan defaults were implemented as specified; nothing was changed pending sign-off.
- `EXTRA_URL_KEYS` is intentionally empty — phase 2's sink grep must reconcile it.
- Pre-existing tsc error (`founder.jpg`) is environmental; if it blocks a later gate it needs `rm -rf .next` per the known stale-types note, unrelated to this feature.

---

## Phase 2 — Deep-tree chokepoint + sink grep + publish wiring + dead-sanitizer cleanup

### Files changed
- `src/lib/publishSanitizer.ts` — added the deep-tree walk (`sanitizeContentHtml`), the locale-overlay helper (`sanitizeLocaleOverlay`), and the shared private dispatch (`sanitizeStringField` + `sanitizeItemObject`/`sanitizeElements`/`sanitizeElementMetadata`/`sanitizeSectionFields`). No change to any phase-1 export.
- `src/app/api/publish/route.ts` — 2 wire calls + removed dead `sanitizeHtmlContent` import + added `publishSanitizer` import.
- `src/app/api/publish/route.test.ts` — removed orphaned `sanitizeHtmlContent` mock key.
- `src/lib/security.ts` — deleted dead `sanitizeHtmlContent` (and its now-unused `sanitizePublishedContent` import).

### Step 1 — Reconciled sink table (grep `href=`/`src=` across ALL `**/*.published.tsx` under `src/modules/templates/`; 107 hits)

Every content key rendered into an `<a href>` or `<iframe src>`:

| Key | Where read | Bucket |
|---|---|---|
| `href` (collection items: nav `item.href`, footer `link.href`/`l.href`, social `s.href`, contact `r.href`, catalog/lineup `it.href`/`item.href`, nav-child `c.href`) | meridian/hearth/lex/lumen/surge/techpremium footers, headers, contact, catalog, lineup | (a) `endsWith('href')` |
| `cta_href` (Explainer row `r.cta_href`) | `TechPremiumExplainer.published.tsx:75` | (a) `endsWith('href')` |
| `whatsapp_href` (`props.whatsapp_href` → waRaw) | `TechPremiumContact.published.tsx:49` | (a) `endsWith('href')` |
| `url` (footer social `s.url`) | `TechPremiumFooter.published.tsx:83` | (a) `endsWith('url')` |
| `signin_url` (`props.signin_url`) | `TechPremiumNav.published.tsx:59` | (a) `endsWith('url')` |
| `book_call_url` (`props.book_call_url`) | `LumenFooter.published.tsx:49`, `LumenContactForm.published.tsx:44` | (a) `endsWith('url')` |
| `buttonConfig.{url,pathSlug,fileUrl}` + `buttonConfig.dest.{url,fileUrl,pathSlug}` (via `resolveCtaHref`/`resolveDestination`) | all `ctaHref`/`secondaryHref`/`signinHref`/`pkgHref` derivations (meridian/hearth/lex/lumen/surge/techpremium) | (a) elementMetadata walk → `endsWith('url'/'slug')` |
| `map_embed` (`props.map_embed` → `mapEmbedSrc`) | `TechPremiumContact.published.tsx:101` iframe | (a) `isEmbedContentKey` `endsWith('embed')` |
| `video_url` (`r.video_url`/`props.video_url` → `ytEmbed`) | `TechPremiumExplainer.published.tsx:48` + `TechPremiumProcess.published.tsx:30` iframes | (c) EXEMPT — `ytEmbed` regex-extracts an 11-char id into a FIXED youtube-nocookie URL or `''` (re-verified) |
| Composed-scheme hrefs: `mailto:${contact_email}`, `tel:${contact_tel}`, `https://wa.me/${whatsapp_number}`, `#top`/`#contact`/`#cat-…`, literal `/`, `/products`, `/contact` | techpremium/lumen/hearth footers, contact, nav | Out of scope — scheme is FIXED at the template level (interpolated field can't inject a new scheme); the non-URL fields (`whatsapp_number`, `whatsapp_prefill`, `contact_email`, `contact_tel`) fall to the harmless HTML pass |
| `<img src>` keys: `logo_image`, `hero_image`, `about_image`, `cover_image`, `image`, `im.src`, `logo.url` | many templates | Out of scope — non-executable sink (`<img src>`). Note: keys ending `url`/`image` that happen to match the suffix (e.g. `logo.url`) are gated harmlessly — a valid https image URL passes `isSafeURL` unchanged; only unparseable/`javascript:` → `'#'`, which an `<img>` can't execute anyway. |

- **Bucket (b): NONE.** No real href/iframe-src content key escapes the suffix pattern → `EXTRA_URL_KEYS` stays EMPTY (unchanged from phase-1 seed).
- **"No non-iframe `embed` key" confirmation:** grep for `\w*embed` across `src/modules/templates` + `src/modules/sections` found the `embed` suffix ONLY on `map_embed` (an `<iframe src>`). No non-iframe content key ends in `embed`; the destructive `endsWith('embed')` → `''` path can't false-positive today.

### Step 2/3 — walk design
- `sanitizeContentHtml(content)` mirrors `sanitizeContentForPublish`'s traversal exactly: subpages first (`content.subpages` → `sub.layout.sections` → `subContainer = sub.content ?? sub`), then root (`content.layout.sections` → `container = content.content ?? content`), then a defensive `content.chrome.header.data`/`.footer.data` pass (no-op via the injectChrome aliasing, but guards a future copy-not-alias change). Mutates in place.
- Per section: `elements` (bare string → dispatch on element key; array → object items dispatch on their OWN keys, string items on the element key; object element → one-level defensive walk) + `elementMetadata` (buttonConfig string props, AND `buttonConfig.dest` string props — TWO levels deep, so `dest.fileUrl`/`dest.url`/`dest.pathSlug` are reached). Never touches `layout`/`aiMetadata`/section keys/non-strings.
- Shared `sanitizeStringField(key,value)` precedence: embed → exempt(HTML) → url → HTML.
- `sanitizeLocaleOverlay(overlay)` walks `locale → sectionId → elementKey → string|string[]`, same dispatch, arrays per item; mutates-and-returns (seeding site assigns the result).

### Step 4 — wire locations (final line numbers after edits)
- **Main call** `sanitizeContentHtml(content)` — `src/app/api/publish/route.ts:100-106`, immediately AFTER the chrome-injection block (closes at :98) and BEFORE `cleanTitle`/DB writes/render. Guarded `if (content && typeof content === 'object')`.
- **Overlay call** — `src/app/api/publish/route.ts:359-364`: `(content as any).localeContent = sanitizeLocaleOverlay(projectLocaleContent)`, inside the existing `if (projectLocaleContent && …)` guard (only-when-present preserved).

### Step 5 — dead-sanitizer path: DELETE
- Grep (`sanitizeHtmlContent`, src+tests) before edits: definition in `src/lib/security.ts`, dead import in `route.ts`, mock key in `route.test.ts` — NO live caller (docs-only elsewhere). Plan's delete precondition held → **deleted** `sanitizeHtmlContent` from `security.ts` (and its now-orphaned `import { sanitizePublishedContent }`). No repoint needed.
- Post-edit grep (`src/**/*.{ts,tsx}`): zero `sanitizeHtmlContent` references anywhere. `sanitizePublishedContent` remains defined + default-exported + self-tested in `src/lib/htmlSanitizer.ts` (NOT deleted — plan audit-note-only; now unused by security.ts but still has its own test/default-export consumers).

### Out-of-scope audit notes (no code, per plan)
- `src/utils/htmlSanitization.ts` (`sanitizeWithDOMPurify`) — second regex sanitizer, NOT on the publish path; left untouched, known non-boundary for a future cleanup ticket.
- `sanitizePublishedContent` + `STRICT_PROFILE` in `htmlSanitizer.ts` — may now be effectively unused by production code; harmless, out of scope, future cleanup.
- Template `<style>` constants / hand-authored CSS live OUTSIDE the content tree (module-level string constants in block files) — the walk only touches `content.{subpages,layout/content sections}.{elements,elementMetadata}` + `chrome.*.data`, so it never reaches them by construction.

### Deviations from plan
- None. `EXTRA_URL_KEYS` left empty exactly as the reconciliation dictated.

### Verification
- `npx tsc --noEmit`: only the pre-existing unrelated `src/app/page.tsx(6,26)` `founder.jpg` error; none from the touched files.
- `npm run test:run`: 243 files passed / 1 skipped · 4064 tests passed / 18 skipped (unchanged from phase-1 baseline; `route.test.ts` still green after the mock-key removal + the two new real `publishSanitizer` calls running against its `{layout:{},content:{}}` fixture — walk returns early, no throw).
- Grep: zero `sanitizeHtmlContent` in src+tests.
- Manual dev check: skipped (not required per plan; deploy-QA human smoke covers the live path).

---

## Phase 3 — Tests + EXEMPT_URL_KEYS hardening

### Files changed
- `src/lib/publishSanitizer.test.ts` (new — main suite)
- `src/modules/templates/techpremium/blocks/Explainer/ytEmbed.test.ts` (new — exemption pin)
- `e2e/publish.spec.ts` (edit — payload seed + neutralization/benign/javascript assertions)
- `src/lib/publishSanitizer.ts` (one-line hardening only — see below)

### One-line hardening (approved, phase-2 review nit)
`sanitizeStringField`: `EXEMPT_URL_KEYS.includes(key)` → `EXEMPT_URL_KEYS.includes(key.toLowerCase())`,
matching `isUrlContentKey`'s lowercasing. Fail-safe consistency fix; no other engine logic touched.
Pinned by a new test: mixed-case `Video_url` = bare 11-char ID stays byte-identical (would have been
gated to `#` before the fix).

### Test counts
- `ytEmbed.test.ts`: 5 tests (unsafe→'', youtu.be/bare-id/watch→fixed nocookie embed, ''→'').
- `publishSanitizer.test.ts`: 84 tests across 10 groups — HTML payload matrix (12), URL-gate matrix
  (incl. all 3 N4 allowances), key-detector matrix, embed-gate matrix, benign fixture
  (invariants + idempotency, NOT equality-to-self), plain-text no-mangle + N5 `<`-encode tradeoff,
  idempotency (html/url/embed incl. `#`→`#` and `''`→`''`), deep-tree `sanitizeContentHtml`
  (root+subpage payloads, flat URL keys, embed keys + video_url exemption, no prose over-gating,
  buttonConfig url/pathSlug/dest.fileUrl legacy+new root+subpage, collection href/cta_href, layout/
  aiMetadata untouched, chrome via real `injectChromeIntoPage` proving in-place aliasing), locale
  overlay, mixed-case exempt key.
- Both new suites: **89 tests, all pass**. N5 assumption verified live (`price < 5` → `price &lt; 5`).
- Benign fixture asserts independent invariants (`<a`, `href="https://`, mailto/tel/#/root-relative,
  `<strong>`/`<b>`, `<li>`, `<h1>`..`<h6>`, `<blockquote>`, whitelisted style props, explicit
  `noopener` on the `target="_blank"` link) + idempotency — avoids the self-fulfilling trap.

### e2e decision — ADDED (not dropped)
`e2e/publish.spec.ts`: after the existing `seedDraft`, inject `<img onerror>` into the hero `headline`
+ `cta_href: 'javascript:alert(1)'` and re-`saveDraft` via the SAME authed path (no new auth
plumbing, no new spec file, no `seedDraft.ts` edit — mutated the returned `finalContent` in-spec).
After publish, `page.content()` on `/p/{slug}` asserts: no `onerror=`, no `<script>alert`, no
`href="javascript:`, and the benign `https://example.com/cta` CTA href survives. Valid in BOTH
publish branches (200 blob + local-dev 500) because `sanitizeContentHtml` runs before the DB write,
so the `failed`-row DB-served `/p` is also sanitized.
**Not executed locally** — the authed Playwright harness needs the Clerk session + a running server
this environment can't provide; it is NOT part of the hard gate (deploy-QA human smoke covers the
live path). Committed green-by-construction, not red.

### Final gate
- `npx tsc --noEmit`: PASS — only the KNOWN pre-existing unrelated `src/app/page.tsx(6,26)`
  `@/assets/images/founder.jpg` error; none from touched files. No `.next` staleness (no `rm -rf`
  needed).
- `npm run test:run`: PASS — 245 files passed / 1 skipped · **4153 tests passed** / 18 skipped
  (baseline + the 89 new; count rose from phase-2's 4064 by the new suites).
- `npm run lint`: PASS — warnings only (all pre-existing `<img>`/exhaustive-deps), zero errors;
  `eslint` on the 4 touched files is clean.
- `npm run build`: PASS — full build script (published-css → assets → next build) completed; the
  `founder.jpg` item is tsc-only noise (webpack resolves the asset), NOT a build failure.

### Deviations
- Benign fixture: used independent-invariants + idempotency instead of a hard-coded
  DOMPurify-normalized golden string. Rationale: authoring the exact normalized bytes without
  running the engine risks a wrong literal; invariants + idempotency are equally mutation-resistant
  and were the plan's explicit anti-self-fulfilling requirement. Conservative, in-scope.

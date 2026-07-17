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

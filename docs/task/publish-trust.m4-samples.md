# publish-trust M4 — generated `<head>` sample pair (HUMAN GATE evidence)

Real output from `generateStaticHTML()` on this branch (hearth/service fixture, analytics on).
`<head>` only. Generated 2026-07-17, phase 3.

**What you are signing off:** benign pages look exactly as before (the ONLY delta is `&` → `&amp;`
inside attribute values, which is correct HTML and what browsers already parse back to `&`), and
hostile input can no longer inject an element.

---

## A. BENIGN fixture — what a real customer page looks like

Inputs: `canonicalDomain: acmestudio.com` · `previewImage: https://cdn.acme.com/og.png?w=1200&h=630`
· `faviconUrl: https://cdn.acme.com/f.ico?v=1&r=2` · `title: Acme Studio — Fine Prints & Frames`

```html
  <title>Acme Studio — Fine Prints &amp; Frames</title>
  <link rel="canonical" href="https://acmestudio.com">
  <link rel="icon" href="https://cdn.acme.com/f.ico?v=1&amp;r=2">
  <meta property="og:url" content="https://acmestudio.com">
  <meta property="og:title" content="Acme Studio — Fine Prints &amp; Frames">
  <meta property="og:image" content="https://cdn.acme.com/og.png?w=1200&amp;h=630">
  <meta name="twitter:url" content="https://acmestudio.com">
  <meta name="twitter:image" content="https://cdn.acme.com/og.png?w=1200&amp;h=630">
```

- Every URL is intact and unchanged; only the query-string `&` became `&amp;`.
- **No double-escaping** — there is no `&amp;amp;` anywhere in the document.
- The `&amp;` in `<title>`/`og:title` and in the favicon `href` is PRE-EXISTING behavior
  (those sinks were already escaped) — this phase did not change them.
- The og:image `&amp;` is the one genuinely new byte-level delta on benign pages. Facebook /
  Twitter / Slack unescape it to `&` when fetching, so cards are unaffected.

## B. HOSTILE fixture — attack input

Inputs: `slug: acme"><script>alert(1)</script>` · `canonicalDomain: evil.com"><script>alert(1)</script>`
· `previewImage: javascript:alert(1)` · `seo.ogImage: "><script>alert(1)</script>`

```html
  <link rel="canonical" href="https://evil.com&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">
  <meta property="og:url" content="https://evil.com&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">
  <meta property="og:image" content="https://evil.com&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;/api/og/acme&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">
  <meta name="twitter:image" content="https://evil.com&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;/api/og/acme&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;">
```

- **No `<script>` element exists** — the payload is inert text trapped inside the attribute value.
  The `"` that was meant to close the attribute is now `&quot;`, so the breakout fails.
- **`javascript:alert(1)` is GONE from the document entirely.** Both hostile og:image candidates
  (`previewImage` + `seo.ogImage`) failed the scheme gate and fell through to the auto
  `/api/og/{slug}` URL — a working fallback, never an empty attribute.
- The `evil.com…` text remains visible because canonical/og:url legitimately echo the page's own
  host — a page can always name its own (validated) domain. It is escaped, so it is data, not code.

**Before this change**, the same hostile input produced a live `<script>alert(1)</script>` in the
`<head>` of a published `*.lessgo.site` page, plus `og:image="javascript:alert(1)"`.

---

## Coverage note

Escaping/gating covers the `<head>` attribute sinks (canonical, og/twitter url+image, hreflang,
favicon, analytics data-attrs). **Out of scope, tracked as follow-ups (NOT fixed here):** the
inline `<style>` CSS-variable block (`htmlGenerator.ts:441-455`) is a CSS-context sink where
HTML-escaping is inert; `localeJson` U+2028/29. Both are recorded in the audit.

 Remaining issues (all minor, mobile-focused)

  1. Mobile FCP/LCP still ~2.3s — fonts are render-blocking and not preloaded.
  The 6 woff2 files (132KB) aren't discovered until the browser parses the HTML → CSS → then fetches fonts. Fix: <link rel="preload" as="font" type="font/woff2"
  crossorigin> for the hero headline font only (inter-tight-latin-600). That alone should pull mobile FCP under 2s.

  2. Fonts are cross-origin (served from lessgo.ai, page is on ceradistest.lessgo.ai).
  That's an extra DNS + TLS handshake to a different host on the critical path. Two options:
  - Add <link rel="preconnect" href="https://lessgo.ai" crossorigin> in the <head> (quick win), or
  - Serve fonts from the page's own origin to eliminate the hop entirely.

  3. All 6 weights load eagerly — incl. JetBrains Mono (2 weights, ~42KB).
  Confirm JetBrains Mono is actually used above the fold. If it's only for code snippets lower down (or unused on this template), drop it or let it lazy-load — saves
  ~42KB on first paint.
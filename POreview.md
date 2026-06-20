Verdict: Approve Phase 1 — strong plan, fix the scoping before you commit effort.

  The architecture read is unusually good. I verified every load-bearing seam against code: privacy-subpage precedent, middleware path-preservation (L79/L97), path-aware
  KV reads, blob key scheme, single store identity, and a genuinely path-agnostic published renderer all check out. The instinct — de-risk the store axis + publish loop 
  first, defer collections/blocks/chrome — is the right sequencing. Most of the "is this even possible cheaply" risk is retired.

  Corrections to fold in (verified inaccuracies)

  1. Store mutation surface is ~10× the estimate. Plan says "wrap the ~15 direct mutations." Reality: ~213 state.sections|content|sectionLayouts references across the 5
  named action files (sectionCRUD 52, layout 57, content 51, core 37, persistence 16) — not all writes, but the surface is an order of magnitude bigger. This is the
  single biggest under-scope, and it's the heart of Phase 1. The "mirror top-level → active page" trick is what keeps you from editing all 213 sites — but mirror-sync is
  exactly the shallow-merge/stale-state trap PO-Handover.md flags repeatedly. Budget for it and make the mirror invariant a tested contract, not a footnote.
  2. The publish route has no loop today — it's a single generateStaticHTML + single uploadStaticSite (L222/L241). Plan's "loop root + ProjectPage rows" reads as if a
  loop exists to extend; it must be built. Minor, but don't budget it as an edit.
  3. uploadStaticSite has no pageName param (key hardcoded to index.html) and KV writers hardcode :/ (atomicPublish L142, retry L204). Plan acknowledges both — just
  confirming they're net-new, not tweaks.
  4. Static serving of subpages isn't free. Middleware preserves subpaths only on the SSR fallback; the fast blob-proxy path is root-only today (comment: "subpaths fall
  through"). Your subpage KV writes should light up the fast path — but verify it actually serves subpages from blob, or you ship multi-page that silently SSRs every hit.
  Add that to the Phase-1 gate explicitly (plan currently only verifies "/contact reaches the catch-all" = the SSR path).
# `src/lib/blog/`

Native blogging (Blog Phase 1 + P2). Posts publish **independently of the site**: each
`BlogPost` has its own draft→publish lifecycle and blob versions. See
`docs/tracks/blogFeature.md`.

| File | Purpose |
|------|---------|
| `access.ts` | Shared ownership gate for `/api/blog/*` — wraps `assertProjectOwner` and loads the project row handlers need. Demo token gets no blog. |
| `buildBlogPages.ts` | **Single source of truth** for renderable blog page defs — feeds both the static-export publish pipeline and the SSR fallback, so blob and SSR output can't diverge (the blog analogue of the dual-renderer rule). |
| `publishBlogPost.ts` | Per-post publish/unpublish + `/blog` index regen. Uploads article + index under a fresh `blog-*` blob version (never registered in `PublishedPageVersion`, so `versionCleanup` ignores it — this flow does its own stale-blob cleanup), writes `route:{host}:/blog/*` KV keys per live host. Order: upload → KV → DB → delete-stale. |
| `ssr.tsx` | SSR-fallback plumbing for `/p/[slug]/blog[/postSlug]` using live DB data, rendered through the same page defs as static export. |
| `jsonLd.ts` | `BlogPosting` JSON-LD builder (pure; every article emits it — not a user-picked structured-data type). |
| `schemas.ts` | Zod validation for `/api/blog/*` (markdown-only body in P1; SEO reuses `PageSeoSchema`). |

Key invariant: article publish and site publish are decoupled, but both render blog pages
via `buildBlogPages.ts` — parity by construction.

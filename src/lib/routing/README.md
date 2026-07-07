# `src/lib/routing/`

Edge-compatible KV routing for published pages and custom domains. Resolves an
incoming `{host}:{path}` to a Vercel Blob URL so `src/middleware.ts` / the blob-proxy
can serve static HTML without hitting the DB.

- **`kvRoutes.ts`** — read/write route + redirect config in Vercel KV **via the REST
  API directly**, not the `@vercel/kv` package, because this runs in the Edge runtime
  where the SDK isn't available. Keep it dependency-light and edge-safe. Route keys are
  `route:{host}:{path}`.
- **`types.ts`** — `RouteConfig` / `RedirectConfig`, the shapes stored in KV.
  `RouteConfig` **embeds `blobUrl`** deliberately so request-time serving needs no
  per-request `head()` call against Blob.

Written atomically after a successful publish/blob upload; read on every published-page
request. See root `CLAUDE.md` → "Publishing & Static Export" and "Custom Domains".

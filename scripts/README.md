# scripts/

Standalone Node/TS scripts. The two build scripts are part of `npm run build`; the
rest are one-off dev/ops utilities run manually.

## Build scripts (part of `npm run build`)

`npm run build` = `build:published-css` → `build:assets` → `next build`. The first
two steps produce the standalone CSS/JS/fonts that ship with **published** pages
(the static-export renderer, not the editor). If you change published-page styling
or the injected form/analytics assets, you must rebuild for it to take effect.

- **buildPublishedCSS.js** (`npm run build:published-css`) — compiles a Tailwind CSS
  bundle scoped to the published components and writes it to `public/published.css`
  (target ~30–50KB uncompressed). This is the CSS embedded in / linked by statically
  exported pages so they render without the full app shell.

- **buildAssets.js** (`npm run build:assets`) — minifies the client scripts that get
  injected into published pages and copies the self-hosted fonts CSS into
  `public/assets/`:
  - `formHandler.js` → `public/assets/form.v2.js` (published-page form submit handler)
  - `analyticsGenerator.js` → `public/assets/a.v2.js` (analytics beacon)
  - `legacy/form.v1.src.js` → `public/assets/form.v1.js`, `legacy/a.v1.src.js` →
    `public/assets/a.v1.js` — FROZEN sources for already-published immutable blobs.
    A shipped asset filename never changes semantics: bump to a new version instead
    (see the versioning contract at the top of `buildAssets.js`).
  - `src/styles/fonts-self-hosted.css` → `public/assets/fonts-self-hosted.css` (copied
    verbatim; published HTML loads `https://lessgo.ai/assets/fonts-self-hosted.css`)
  Uses `terser` when installed; falls back to copying unminified with a warning.

## Publishing / preview

- **preview.js** — publishes a standalone HTML file to a `*.lessgo.site` subdomain
  with no project/DB/deploy, reusing the KV → blob-proxy pipeline (uploads HTML to
  Vercel Blob, writes `route:{host}:/` in KV). Usage:
  `node scripts/preview.js <subdomain> <file.html>` (publish) /
  `node scripts/preview.js --rm <subdomain>` (take down).

## KV / Blob / DB diagnostics (tsx, `.env.local`)

Run with `npx tsx scripts/<name>.ts <slug>` (default slug `page1`). They load
`.env.local` and hit the live KV / Blob / Postgres.

- **checkKV.ts** — inspects the KV route entry (`route:{slug}.lessgo.site:/`).
- **fixKV.ts** — repairs a KV route entry for a slug from the DB.
- **checkBlob.ts** — checks the Vercel Blob object backing a published slug.
- **checkDuplicates.ts** — finds duplicate `PublishedPage` rows for a slug.

## Service-generation harnesses (tsx)

In-process runs of the service copy-generation pipeline (no HTTP/auth/credits).
Mock mode via `NEXT_PUBLIC_USE_MOCK_GPT=true`; real LLM is the intended mode.

- **testServicePipeline.ts** — end-to-end service pipeline (strategy → copy →
  defaults/fallback), pretty-prints the assembled JSON a renderer would receive.
- **dogfoodServicePipeline.ts** — runs N sample inputs through the full pipeline,
  dumps each to `dogfoodOutput/{slug}.json`, and reports italic-`<em>` emit metrics
  + forbidden-word leak counts.

## One-off console-log cleanup (historical)

Ad-hoc codemods used to migrate `console.*` calls to the `logger` utility. Not part
of any build; kept for reference.

- **migrate-console-logs.js** — identifies/optionally migrates console statements.
- **batch-console-fix.js** — bulk-replaces console calls with logger equivalents.
- **safe-console-cleanup.js** — removes console.logs while preserving error handling.

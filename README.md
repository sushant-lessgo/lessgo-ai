# Lessgo

Lessgo is a Next.js 14 app that generates, edits, publishes, and manages AI-written landing pages for founders. It is built around a **3-tier template model** (`audienceType → templateId → variant + palette`), a two-phase AI copy-generation pipeline, a visual inline editor, and a static-export publishing system (Vercel Blob + KV) with custom-domain support.

## Stack

Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma / PostgreSQL (Neon) · Clerk auth · Zustand + Immer state · Stripe billing · PostHog analytics · OpenAI / Nebius for generation · Vercel Blob + KV for publishing.

## Getting started

```bash
npm install
npm run dev        # dev server on http://localhost:3000
```

Set required secrets in `.env.local` (Clerk, database URLs, OpenAI/Nebius, Stripe, Vercel Blob/KV, etc.). See `docs/architecture/STRIPE_SETUP.md` for billing setup.

## Key commands

```bash
npm run dev          # Dev server
npm run build        # build:published-css → build:assets → next build (see scripts/README.md)
npm start            # Production server
npm run lint         # ESLint

npm run test:run     # Vitest unit/integration (single run)
npm run test:e2e     # Playwright E2E (see e2e/README.md)

npx prisma migrate dev   # Local DB migrations (prefer over db push)
```

> `npm run build` is not just `next build` — it first runs `scripts/buildPublishedCSS.js` and `scripts/buildAssets.js` to produce the standalone CSS bundle and minified JS/fonts that ship with published pages. See `scripts/README.md`.

## Where to read next

- **`CLAUDE.md`** (repo root) — full architecture overview: 3-tier template model, dual-renderer pitfall, generation pipeline, publishing, billing, state management. Start here.
- **`docs/README.md`** — index of all project docs (`architecture/`, `guides/`, `tracks/`, `product/`).

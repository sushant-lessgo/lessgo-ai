# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lessgo** is a Next.js 14 application that generates, edits, publishes, and manages AI-written landing pages for founders. It is built around a **3-tier template model** (`audienceType → templateId → variant + palette`), a two-phase AI copy-generation pipeline, a visual inline editor, and a static-export publishing system (Vercel Blob + KV) that supports custom domains.

Stack: Next.js 14 (App Router) · TypeScript · TailwindCSS · Prisma/PostgreSQL · Clerk auth · Zustand+Immer state · Stripe billing · PostHog analytics · OpenAI/Nebius for generation.

## Development Commands

```bash
npm run dev                  # Dev server
npm run build                # build:published-css → build:assets → next build
npm start                    # Production server
npm run lint                 # ESLint

# Tests
npm test                     # Vitest (watch)
npm run test:run             # Vitest (single run) — unit/integration: src/**/*.test.{ts,tsx}
npm run test:e2e             # Playwright E2E (e2e/**/*.spec.ts)

# Database
npx prisma migrate dev       # Local dev migrations (ALWAYS prefer over db push)
npm run postinstall          # prisma generate && prisma migrate deploy
```

> **Build is not just `next build`.** It first runs `scripts/buildPublishedCSS.js` (compiles the
> standalone CSS bundle shipped with published pages → `public/published.css`) and
> `scripts/buildAssets.js` (minifies `formHandler.js`/`analyticsGenerator.js` → `public/assets/`,
> copies self-hosted fonts CSS). Changes to published-page styling/assets require a rebuild to take effect.

## Feature Workflow (`/feature`)

Non-trivial features run through a delegation pipeline (agents in `.claude/agents/`, orchestrated by the `/feature` skill): **discuss** (`/discuss` skill, Opus/high, PO-style interrogation → spec) → **scout** (Opus/medium, read-only explore) → **plan** (Fable/high, phased plan with a per-phase *Files touched* list + human-gate markers) → **plan-review** (Opus/xhigh, loop ×3) → **implement** per phase (Fable/medium, edits only its Files-touched, writes an `audit.md`) → **impl-review** (Opus/high, scoped diff + `tsc`/`test:run` gate, loop ×3). Model philosophy: Fable is the scarce budget — spend it only on plan + implement; everything else runs Opus at max useful effort. Run the orchestrating session itself on Opus (`/model opus`).

Usage: `/discuss <idea>` → agree → it writes `docs/task/<feature>.spec.md` → run `/feature docs/task/<feature>.spec.md`. Artifacts (`spec`/`plan`/`audit`) live in `docs/task/`.

**Branch rules:** all pipeline work happens on `feature/<feature>` (created by the orchestrator at start; subagents hard-stop if `git branch --show-current` mismatches — they never checkout/switch). Per-phase commits land on the feature branch only. Merge to main is a **human gate** (plain merge, no squash); the user pushes manually; then `deploy-watcher` (Haiku/low) polls the Vercel deployment — green → branch deleted, failure → condensed build-log summary. The pipeline never commits on main and never pushes.

## Architecture Overview

### 3-Tier Template Model (core mental model)

A landing page is rendered from three orthogonal inputs:

| Tier | Values | Chosen at |
|------|--------|-----------|
| `audienceType` | `product`, `service`, (`ecommerce` reserved) | Onboarding persona/route |
| `templateId` | `meridian`, `techpremium` (product); `hearth`, `lex` (service) | Product = locked to template; Service = picker |
| `variantId` + `paletteId` | Spacing/feel variant + accent palette | Picker, or template defaults |

- **Type contracts:** `src/types/service.ts` (audience + templateIds + defaults), `src/types/product.ts` (product palettes/variants), `src/types/template.ts` (`TemplateModule` contract).
- **Registry:** `src/modules/templates/registry.ts` — each `templateId` is loaded via an **async dynamic-import loader** so template code never enters the main bundle (the "dispatch firewall"). Module surface: `resolveBlock()`, `ThemeInjector`, `SSRTokens`, `getSurfaceForSection()`, palette/variant defaults.
- **Templates live in** `src/modules/templates/{meridian,techpremium,hearth,lex}/` — each with `tokens.ts`, `palettes.ts`, `sectionRules.ts`, `ThemeInjector.tsx`, `resolve*Block.ts`, `index.ts`, and `blocks/<Section>/`.
- A **template is a skin**: it supplies tokens/palettes/variants/block components but consumes the audience's existing content contract. It does NOT change copy generation, the element schema, or the section list. See the `/new-template` skill (`.claude/skills/new-template/SKILL.md`) for the full guide to adding one.

### ⚠️ Dual-Renderer Pitfall (the #1 architectural trap)

Every block exists as a **pair** and is rendered by one of **two renderers**:

- **Edit renderer:** `src/modules/generatedLanding/LandingPageRenderer.tsx` → block's `.tsx` (`'use client'`, hooks, contentEditable).
- **Published renderer:** `src/modules/generatedLanding/LandingPagePublishedRenderer.tsx` → block's `.published.tsx` (server-safe, no hooks, flat props, `ReactDOMServer.renderToStaticMarkup`).
- Two component registries back these: `componentRegistry.ts` and `componentRegistry.published.ts`.

**If the two renderers diverge, a change "looks right in the editor but wrong when published" (or vice-versa).** When editing any block, update BOTH `.tsx` and `.published.tsx` and keep their layout/CSS identical. Surface tones use a template-agnostic `data-surface` attribute.

### AI Generation Pipeline (`/api/generate-landing`)

Two-phase strategic generation:

1. **Strategy phase** — `buildStrategyPrompt()` builds business context + brand positioning + layout requirements; AI returns `copyStrategy` (big idea) + per-section `cardCounts`. Parsed by `parseStrategyResponse()`.
2. **Copy phase** — `buildStrategicCopyPrompt()` (in `src/modules/prompt/buildPrompt.ts`) instructs the AI to fill each section's elements per the card counts; parsed by `parseAiResponse()`, validated by the layout schema, manual-preferred defaults applied.

- **Element selection:** `getCompleteElementsMap()` (`src/modules/sections/elementDetermination.ts`) maps every section→layout→all elements and marks excluded optional elements by business context. The AI sees all elements + the exclusion map.
- **Section selection:** Product uses a fixed section list (`src/modules/sections/sectionList.ts`). Service uses awareness-driven ordering (`src/modules/audience/service/sectionSelection.ts`).
- **Providers (fallback chain):** OpenAI (`gpt-4o-mini`, primary when `USE_OPENAI=true`) → Nebius/Mixtral → mock response. **Note: the generation pipeline uses OpenAI/Nebius, not Anthropic.** (`@anthropic-ai/sdk` is a dependency but not used in the generation path.)
- Prompt builders, parsers, and mock generators live in `src/modules/prompt/`.

### Onboarding Flow

- Routes: `/onboarding/product/[token]` and `/onboarding/service/[token]`. `/api/start` is the persona gate (non-pilot service personas → waitlist).
- ~5 steps (one-liner → understanding → goal → offer → generating). Product uses `useProductGenerationStore`; service uses `useServiceGenerationStore`.
- **Website import:** `/api/v2/scrape-website` (product) and `/api/v2/understand` (service) do an SSRF-safe bounded crawl + one structured AI call to pre-fill fields (one-liner, name, categories, audiences, features, offer, **verbatim testimonials**, goal). Costs 1 credit.
- **Field validation:** `/api/validate-fields` checks taxonomy fields. **Market insights:** `/api/market-insights` generates features + infers hidden copywriting fields; backed by IVOC research (see below).

### State Management (Zustand + Immer)

- `useOnboardingStore` (`src/hooks/`) — onboarding fields: confirmed/validated/inferred, dependencies, AI features.
- `useEditStoreLegacy` (`src/hooks/`) — **still the active editor store**: layout/sections, content, UI/toolbars, meta, persistence/auto-save.
- `useModalManager` (`src/hooks/`) — modal queue + field-edit dialogs.
- `src/stores/`: `editStore.ts` (token-scoped store factory), `useThemeStore.ts`, `storeManager.ts`.
- Generation stores: `useProductGenerationStore`, `useServiceGenerationStore`, `useGenerationStore`.

### Publishing & Static Export

Flow: edit `/edit/[token]` → preview `/preview/[token]` → publish → live `/p/[slug]`.

- `POST /api/publish` creates/updates `PublishedPage` + a new immutable `PublishedPageVersion`, runs `generateStaticHTML()` (`src/lib/staticExport/htmlGenerator.ts`) via the **published renderer**, uploads to Vercel Blob (`blobKey = pages/{pageId}/{version}/index.html`), then atomically writes KV routes.
- `publishState` machine: `draft → publishing → published | failed`; orphaned blobs are cleaned up on DB failure.
- `/p/[slug]` is ISR (`revalidate = 3600`); a blob-proxy edge route serves the static HTML by KV lookup.
- Published pages embed minified `form.v1.js` and `a.v1.js` (analytics beacon).

### Custom Domains

- `PublishedPage.customDomain*` fields track status: `pending_ownership → pending_dns → issuing_ssl → live | failed`.
- `/api/domains/verify-ownership` (TXT record `_lessgo-verify.{apex}`) → adds domain via Vercel API → `/api/domains/verify-dns` polls Vercel `getDomainConfig` until SSL is live.
- Routing: `src/lib/routing/kvRoutes.ts` (edge-compatible KV REST). `src/middleware.ts` resolves custom-domain requests via KV → blob-proxy, with SSR fallback through a slug-for-host lookup.

### Billing, Plans & Credits

- Models: `UserPlan` (tier FREE/PRO/AGENCY/ENTERPRISE, Stripe IDs, feature flags, limits), `UserUsage` (monthly credit/token tracking), `UsageEvent` (per-operation ledger).
- Config in `src/lib/planManager.ts`; credit costs in `src/lib/creditSystem.ts` (e.g. FULL_PAGE_GEN=10, SECTION_REGEN=2, ELEMENT_REGEN=1, IVOC_RESEARCH=3, SCRAPE_WEBSITE=1). `checkCredits()` gates AI operations.
- Stripe: `/api/stripe/webhooks` (updates plan/status, resets credits on renewal), checkout + portal session routes. Endpoints under `/api/billing` and `/api/credits`.

### Analytics, Forms & Integrations

- **Analytics:** `PageAnalytics` (daily per-slug aggregation: views, unique visitors, conversions, device split, top referrers/UTM). `POST /api/analytics/event` is a privacy-first beacon (no raw IP/UA stored). PostHog used app-side for tracking + feature flags.
- **Forms:** `POST /api/forms/submit` validates + stores `FormSubmission`, runs integrations. `UserIntegration` holds encrypted API keys (ConvertKit live: `src/lib/integrations/convertkit.ts`).
- **IVOC (Voice-of-Customer):** `IVOCCache` caches pains/desires/objections/beliefs/phrases keyed by `(categoryKey, audienceKey)`. `src/lib/tavily.ts` searches; `src/lib/ivocExtractor.ts` extracts via `gpt-4o-mini` with a GPT fallback when Tavily is unavailable.

### Admin

- `requireAdmin()` (`src/lib/admin.ts`) gates `/api/admin/*` via `ADMIN_CLERK_IDS` or `CRON_SECRET`. Endpoints: KV diagnostics/repair (`/api/admin/kv`), `env-check`, `migrate-project` (dev→prod copy), `transfer-ownership`. Admin UI under `src/app/admin/`.

### Design System v3

- **Self-hosted fonts** under `public/fonts/` (Inter, Inter Tight, JetBrains Mono, DM Sans, Lora, EB Garamond, Fraunces, Source Serif 4); `@font-face` in `src/styles/fonts-self-hosted.css`. The legacy dynamic font system was removed; LCP hero-headline font is preloaded per template (`CriticalFontPreload.tsx`).
- **Tokens/variants:** each template's `tokens.ts` + `variants.ts` define CSS-variable design tokens (neutrals, hairlines, type, spacing, radius, section rhythm, accent trio applied via `[data-palette]`).
- **Palettes:** template palettes in `src/modules/templates/*/palettes.ts`; legacy 30-palette v3 background system in `src/modules/Design/background/` (`palettes.ts`, `textures.ts`, `backgroundIntegration.ts`). Shared design tokens: `src/modules/Design/designTokens.ts`.
- Color system, button shapes, card styles under `src/modules/Design/`.

## Database (`prisma/schema.prisma`)

Key models: `User`, `Project` (token-scoped; `audienceType`/`templateId`/`variantId`/`paletteId` + `content`/`themeValues`/`computedDesign` JSON), `Token`, `PublishedPage` (+ static-export & custom-domain fields), `PublishedPageVersion`, `TaxonomyEmbedding`, `FormSubmission`, `UserIntegration`, `PageAnalytics`, `UserPlan`, `UserUsage`, `UsageEvent`, `IVOCCache`.

Token-based project access is core to the architecture. **Use `prisma migrate dev`, not `db push`** — dev/prod schemas are reconciled via migrations.

## Testing & Quality

- **Vitest** (`vitest.config.ts`, jsdom): unit/integration `src/**/*.test.{ts,tsx}`. Coverage includes utils/validation, template **dispatch** regression, **palette-selection** regression, service **section selection**, **generation contract** (frozen-fixture shape), and **golden** tests (`captureGolden.test.ts`, opt-in real-LLM via `CAPTURE=1`).
- **Playwright** (`playwright.config.ts`, serial/1 worker): `e2e/` has public specs (`generation.spec.ts`, `render.spec.ts`, mock mode) + an authed `publish.spec.ts` using a Clerk session from `auth.setup.ts` (`@clerk/testing`). Toggles: `E2E_LLM=real`, `E2E_PORT`. See `e2e/README.md`.
- The **`/manual-test` skill** (`.claude/skills/manual-test/SKILL.md`) is the manual pre-launch checklist (P0/P1/P2) covering what automation can't: real-LLM quality, **editor↔published parity**, editor interactions — run against `npm run dev`, not mocked.

## API Routes (`src/app/api/`)

Generation/content: `generate-landing`, `regenerate-content`, `regenerate-section`, `regenerate-element`, `validate-fields`, `market-insights`, `v2/*` (scrape-website, understand). Persistence: `saveDraft`, `loadDraft`, `projects`. Publishing/domains: `publish`, `checkSlug`, `domains/*`, `blob-proxy`. Commerce: `stripe/*`, `billing/*`, `credits/*`. Other: `forms/submit`, `analytics/event`, `images`/`upload-image`/`proxy-image`, `og`, `audience`, `admin/*`, `subscribe`, `start`, `generate-privacy-policy`, `csrf`.

## Debug Environment Variables

Set in `.env.local` for enhanced AI debugging (logs are verbose — disable in production):

```bash
DEBUG_AI_PROMPTS=true           # Full strategy + copy generation prompts
DEBUG_AI_RESPONSES=true         # Full AI responses with token usage / parsing steps
DEBUG_ELEMENT_SELECTION=true    # Element scoring, rule evaluation, included/excluded decisions
```

When unset/false: prompts/responses are smart-truncated (~800/~1000 chars) but metadata is still logged; element selection runs silently.

## Component Organization

- `src/components/ui/` — base UI (Radix). `src/components/forms/` — form builder + placement. `src/components/layout/`, `src/components/dashboard/`.
- `src/modules/templates/` — template skins (blocks + tokens). `src/modules/sections/` — section/layout schemas & rules. `src/modules/Design/` — design system. `src/modules/prompt/`, `src/modules/audience/`, `src/modules/generation/`, `src/modules/inference/`, `src/modules/generatedLanding/` (renderers + registries).
- Drag & drop via `@dnd-kit`. Section IDs follow `${type}-${uuid}` (e.g. `hero-abc12345`).

## Documentation (`docs/`)

All project docs live under `docs/` (see `docs/README.md` for the full index):

- `docs/architecture/` — evergreen references: `publishArch.md`, `pricingSystem.md`, `design-system-v3.md`, `newServiceOnboarding.md`, `phase11aArchitectureGaps.md` (multi-template firewall + dual-renderer notes), `TROUBLESHOOTING.md`, `STRIPE_SETUP.md`.
- `docs/guides/` — how-to guides. (Two former guides are now skills: manual pre-launch checklist → `/manual-test` (`.claude/skills/manual-test/SKILL.md`); adding a template — clone an existing one — → `/new-template` (`.claude/skills/new-template/SKILL.md`).)
- `docs/tracks/` — one plan doc per active track (product=`meridianPlan.md`, service=`nsoPlan.md`, plus multi-page, blog, SEO, testimonials, writer, i18n, newGeneration). Fold new phase specs into the track's existing doc; don't create separate spec files.
- `docs/product/` — `productBacklog.md`, `brandMessage.md`.
- Completed/stale plans are deleted (recoverable via git history). Scratch files (dev logs, review verdicts like `POreview.md`) are written at repo root when needed and deleted after use — don't commit them long-term.

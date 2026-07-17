# E2E (Playwright)

Smoke tests for the template release. Vitest covers unit + generation-contract
logic; these cover what needs a running server / real browser.

## Setup (first time)
```bash
npx playwright install chromium
```

## Run
```bash
npm run test:e2e                       # everything (public + authed publish)
npm run test:e2e -- --project=public   # generation + render smoke (no auth)
npm run test:e2e -- --project=setup    # Clerk sign-in only → writes e2e/.clerk/user.json
npm run test:e2e -- --project=authed   # publish flow (runs setup first)
```
The config auto-starts `npm run dev` (mock mode). If a dev server is already
running on :3000 it reuses it.

## Auth (authed project)
The publish spec needs a real Clerk session. Setup is automated via `@clerk/testing`:
- `e2e/global.setup.ts` runs `clerkSetup()` (mints the Clerk Testing Token) and
  idempotently creates the E2E test user via the Clerk Backend API.
- `e2e/auth.setup.ts` (the `setup` project) signs that user in (password strategy)
  and saves the session to `e2e/.clerk/user.json` (gitignored); the `authed`
  project reuses it.

Required in `.env.local` (Clerk **test** instance — `pk_test_`/`sk_test_`):
`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_USER_EMAIL`
(use a `...+clerk_test@example.com` address), `E2E_CLERK_USER_PASSWORD`.

## Publish flow (publish.spec.ts)
Hybrid: for **each audience** (service/Hearth + product/Meridian) it sets persona →
`GET /api/start` → seeds a publish-ready draft via the real authed routes
(`helpers/seedDraft.ts`) → drives the real Publish UI (Preview → Publish → SlugModal)
→ asserts `/p/[slug]` renders the template. Uses deterministic slugs
(`e2e-{template}-smoke`) so reruns republish the same pages.

### Local dev publish honestly 500s (publish-trust M3)
Vercel Blob/KV are absent locally, so the static export throws. `POST /api/publish`
**used** to swallow that and return 200 "published" anyway; M3 removed the lie — it
now returns **500** `{ error: 'Publish failed. Your changes were saved — please try
publishing again.' }` (see the export catch in `src/app/api/publish/route.ts`).

What did NOT change is the DB outcome: that same catch still writes the row as
`publishState: 'failed'` **before** returning, and `failed` is a **SERVING** state
(`isServingPublishState`) — so `/p/{slug}` still renders (SSR fallback) and the
dashboard still shows the page. So locally, expect:

| | local dev | Blob/KV-provisioned env |
|---|---|---|
| `POST /api/publish` | 500 | 200 `{ message, url }` |
| row `publishState` | `failed` (serving) | `published` |
| `GET /p/{slug}` | renders | renders |
| publish UI | `publish-error` in the modal, no live card | live card |

The specs therefore accept **`200 || (500 && GET /p/{slug} < 400)`** — never a blanket
500. A publish that leaves no serving row still fails loudly. `publish.spec.ts` branches
on the real `/api/publish` status and asserts BOTH outcomes properly (its 500 branch is
the M3 "honest failure is surfaced" acceptance test). The deterministic guard on the
route's catch is a vitest: `src/app/api/publish/route.test.ts`.

## What's covered
- **generation.spec.ts** — POSTs the real `service/strategy` + `service/generate-copy`
  routes (mock mode via the `lessgodemomockdata` token → bypasses Clerk auth,
  canned copy, no credits) and asserts every routed section has non-empty content.
- **render.spec.ts** — loads the public `/dev/*` template surfaces in Chromium and
  asserts they mount without a crash / Next error overlay.

## Toggles
- `E2E_LLM=real` — point generation at the live model instead of mock. Requires a
  real Clerk session bearer in `E2E_AUTH` (the routes 401 otherwise); the real
  test self-skips if it's missing. NOTE: real-LLM *output* correctness is more
  directly covered by the vitest capture: `CAPTURE=1 npx vitest run captureGolden`.
- `E2E_PORT` — dev server port (default 3000).

## Still out of scope
- Driving the onboarding wizard UI (covered by `generation.spec` + the Vitest
  generation-contract test) — the publish spec seeds the draft via API instead.
- Lex publish (no `/dev/lex`; Lex shares the service path — add a 3rd audience
  config in `helpers/seedDraft.ts` later).
- Real-LLM publish — mock only here; real-LLM output is the Vitest
  `CAPTURE=1 npx vitest run captureGolden` path.

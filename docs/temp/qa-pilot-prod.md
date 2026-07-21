# QA Pilot — PROD Smoke (HTTP-only)

Date: 2026-07-12 ~08:18 UTC · Agent: qa-runner (pilot) · Method: curl GET/HEAD only, browser UA (+ Sec-Fetch nav headers where noted). No DB, no writes, no sign-ins.

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| 1 | `https://lessgo.ai` marketing home | PASS | 200. `<title>Lessgo.ai – The AI Landing Page Builder for Startup Founders</title>`; hero h1 "Your code rocks. Your …" |
| 2 | `https://app.lessgo.ai/dashboard` | PASS (note) | With browser UA only: 404 (`X-Clerk-Auth-Reason: protect-rewrite` — Clerk 404s non-navigation requests). With full nav headers (`Sec-Fetch-Dest: document`): **307 → `https://accounts.lessgo.ai/sign-in?redirect_url=https%3A%2F%2Fapp.lessgo.ai%2Fdashboard`**; accounts sign-in itself returns 200. Not a 500; correct signed-out behavior. |
| 3 | `https://lessgo.ai/dashboard` apex cutover | PASS | 307, `Location: https://app.lessgo.ai/dashboard` |
| 4 | Dark-feature gates (GET) | PASS | `GET /api/social/test/posts` → 404 · `GET /api/email-sequences/test` → 404 · `GET /api/outreach/test` → 404. All Next.js HTML 404 (routes absent on prod, as expected — branches unmerged). No 405s, no 200s. |
| 5 | `https://scalifixai.com` custom domain | PASS | 200, 64,976 bytes. `<title>Scalifix AI | Complete Digital Marketing Solutions</title>`; `published.css` link present; `fbq(` count = 0, `gtag(` count = 0 (pixel absence confirmed, as expected). |
| 6 | `https://lessgo.ai/pricing` old cards | **FAIL — FINDING** | Page is NOT publicly reachable: plain request → 404 (Clerk protect rewrite); browser-nav request → **307 → `https://accounts.lessgo.ai/sign-in?redirect_url=https%3A%2F%2Flessgo.ai%2Fpricing`**. Root cause: `/pricing` missing from `isPublicRoute` matcher in `src/middleware.ts` (list at line 14; page exists on main since commit a0ccf5a9). Card names (Launch/Pro/Scale/Custom) unverifiable without auth — but the finding stands regardless: prospects can't see pricing. No evidence of unmerged pricing-v2 content on prod (routes/pages 404, not new cards). |
| 7 | `/p/some-nonexistent-slug-qa-check` | PASS | 301 → `https://some-nonexistent-slug-qa-check.lessgo.site/` → 404 with styled Lessgo 404 page ("404: This page could not be found"). No 500. |

## Findings
1. **F-QA-1 (check 6): `/pricing` auth-gated on prod.** Anonymous visitors get sign-in redirect (or bare 404). Fix = add `'/pricing'` to `isPublicRoute` in `src/middleware.ts` — unless intentionally hidden pre-pricing-v2.

## Notes
- Clerk requires `Sec-Fetch-Dest: document` + `Accept: text/html` (not just a browser UA) to issue sign-in redirects; UA-only curl gets protect-rewrite 404s. Affects checks 2/6 methodology only.
- `app.lessgo.ai/sign-in` → 404; sign-in is hosted at `accounts.lessgo.ai` (Clerk account portal) — dashboard redirect targets it correctly, so not flagged.

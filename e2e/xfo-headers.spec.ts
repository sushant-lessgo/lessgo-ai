import { test, expect } from '@playwright/test';

/**
 * editor-route-consolidation phase 3: X-Frame-Options route-gate check.
 *
 * WHAT THIS PINS: the two mutually-exclusive `headers()` sources in `next.config.js`
 * resolve to EXACTLY one XFO value per URL. XFO is a RUNTIME header — a malformed
 * path-to-regexp `source` compiles fine but ships the wrong header (or two), and the
 * failure mode downstream is a SILENTLY BLANK same-origin iframe (phase 4 mobile view).
 * So this is a request-context assertion against the real running server, not a unit test.
 *
 * The matrix (phase 5 — the legacy `/preview` SAMEORIGIN rule was REMOVED once the
 * reveal folded onto the editor, so `/preview` is now DENY like every non-framed route):
 *   /edit/{token}/preview → SAMEORIGIN   (the editor preview sub-route — the ONLY framable surface)
 *   /edit/{token}         → DENY         (bare editor — NOT framable)
 *   /preview/{token}      → DENY         (reveal no longer frames it; plain-nav only)
 *   /                     → DENY
 *   /dashboard            → DENY
 *
 * Assertions are EXACT-match on the single header value. No browser, no auth: the header
 * is attached by Next's config layer before any route/middleware auth runs, so a 200 vs a
 * 307/401 body is irrelevant — only the response header matters.
 *
 * PUBLIC project (no Clerk session). Self-skips when no dev server is reachable, matching
 * the other phase-1/2 e2e specs (they need `npm run test:e2e` to spin the webServer).
 */

const TOKEN = 'xfo-probe-token';

const CASES: Array<{ path: string; expected: 'SAMEORIGIN' | 'DENY' }> = [
  { path: `/edit/${TOKEN}/preview`, expected: 'SAMEORIGIN' },
  { path: `/edit/${TOKEN}`, expected: 'DENY' },
  { path: `/preview/${TOKEN}`, expected: 'DENY' },
  { path: `/`, expected: 'DENY' },
  { path: `/dashboard`, expected: 'DENY' },
];

test.describe('XFO route gate (phase 3)', () => {
  for (const { path, expected } of CASES) {
    test(`${path} → X-Frame-Options: ${expected}`, async ({ request }) => {
      // `maxRedirects: 0` so we read the header off the FIRST response (auth redirects
      // for protected routes still carry the config header). If the app is unreachable
      // (no dev server), skip rather than fail — mirrors the other consolidation specs.
      let response;
      try {
        response = await request.get(path, { maxRedirects: 0, failOnStatusCode: false });
      } catch (err) {
        test.skip(true, `no server reachable for ${path}: ${(err as Error).message}`);
        return;
      }

      const xfo = response.headers()['x-frame-options'];
      expect(xfo, `x-frame-options header for ${path}`).toBe(expected);
    });
  }
});

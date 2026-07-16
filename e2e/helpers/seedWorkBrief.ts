import { expect, type APIRequestContext } from '@playwright/test';
import { WORK_BRIEF_FIXTURE, WORK_BRIEF_EXPECTED_SERVE } from './workBriefFixture';

// Seeds a CONFIRMED, SERVED work project via the REAL authed routes
// (/api/start → /api/brief/confirm), so the journey e2e can resume the shell
// from a real DB state. Avoids importing app modules (no `@/` alias in the
// Playwright runner) — the fixture it uses is a deliberately zero-import module
// for exactly this reason.
//
// Decision 9 / landmine 13: this is SEEDED-RESUME, not mocked-entry. Mock mode
// cannot classify work (/api/v2/understand returns the agency-shaped
// ENTRY_DEMO_SIGNALS fixture), and understand/scrape-website are out of scope.
// STEP 01 is covered by Vitest (JourneyEntryStep.test.tsx) + founder QA.
//
// ⚠️ Pass `page.request`, NOT the standalone `request` fixture: the standalone
// context cannot refresh Clerk's short-lived (~60s) session JWT and 401s on
// later calls (documented in publish.spec.ts).

export interface SeededWorkProject {
  token: string;
  audienceType: string;
  templateId: string;
}

/** Mint a fresh project + token (same idiom as publish.spec.ts). */
export async function startProject(api: APIRequestContext): Promise<string> {
  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  expect(url, 'no url from /api/start').toBeTruthy();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
  expect(token, `bad token from ${url}`).toBeTruthy();
  return token;
}

/**
 * Create a project and confirm the work fixture through the authoritative serve
 * gate. Asserts the SERVE verdict here so a gate/fixture drift fails loudly at
 * the seed — not later as an unhelpful "the shell never mounted" UI timeout.
 * (The Vitest drift guard `workBriefFixture.test.ts` catches it earlier still.)
 */
export async function seedWorkBrief(api: APIRequestContext): Promise<SeededWorkProject> {
  const token = await startProject(api);

  const res = await api.post('/api/brief/confirm', {
    data: { tokenId: token, brief: WORK_BRIEF_FIXTURE },
  });
  expect(res.ok(), `/api/brief/confirm: ${res.status()} ${await res.text()}`).toBeTruthy();
  const json = await res.json();

  // work is an ENGINE: the served project is service-audience + atelier.
  expect(json.outcome, `expected serve, got ${JSON.stringify(json)}`).toBe(
    WORK_BRIEF_EXPECTED_SERVE.outcome
  );
  expect(json.redirectTo).toBe(`/onboarding/${token}`);

  return {
    token,
    audienceType: WORK_BRIEF_EXPECTED_SERVE.audienceType,
    templateId: WORK_BRIEF_EXPECTED_SERVE.templateId,
  };
}

/** Read the persisted project back (what the dispatch + stamping asserts use). */
export async function loadDraft(api: APIRequestContext, token: string) {
  const res = await api.get(`/api/loadDraft?tokenId=${encodeURIComponent(token)}`);
  expect(res.ok(), `/api/loadDraft: ${res.status()}`).toBeTruthy();
  return res.json();
}

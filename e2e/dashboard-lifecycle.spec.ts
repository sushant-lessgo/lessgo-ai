import { randomUUID } from 'node:crypto';
import { test, expect, request as playwrightRequest, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { AUDIENCES, seedDraft, publishSeed } from './helpers/seedDraft';

/**
 * Lifecycle API contract: POST /api/projects/[tokenId]/unpublish + DELETE /api/projects/[tokenId].
 *
 * WHAT THIS SPEC HONESTLY COVERS: the authz ladder as the STACK actually resolves it (anonymous
 * callers are stopped by middleware, non-owners by the route), the demo-token rejection, the
 * custom-domain 409 guard, and the SSR take-down — i.e. `/p/{slug}` (the localhost-reachable
 * render path) 404s after unpublish and serves again after re-publish.
 *
 * WHAT IT DOES *NOT* COVER (deliberately — do not read more into a green run):
 *  - The routes' own `auth()` → 401 branch. It is unreachable for an anonymous API caller:
 *    middleware `protect()` gets there first and 404s (see the test below). It is
 *    defense-in-depth, not a tested contract.
 *  - `{slug}.lessgo.site` going down. Host-based subdomain routing runs through middleware +
 *    KV, which is not reproducible on localhost, and the CDN layer in front of the blob-proxy
 *    (the DD1c ~1h cache window) does not exist locally AT ALL.
 *  - Real KV route / Blob deletion. Both are absent in local dev; publish's static export
 *    fails non-fatally here. KV/blob teardown is pinned by `src/lib/staticExport/teardown.test.ts`
 *    (unit, mocked) and verified for real at Gate A on a deployed host.
 *
 * Serial: one shared Clerk test user + deterministic slugs.
 */
test.describe.configure({ mode: 'serial' });

const CFG = AUDIENCES.find((a) => a.templateId === 'meridian')!;
const PORT = Number(process.env.E2E_PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;

// Direct DB access is used ONLY for what no API can do locally: planting a custom domain
// (the real path needs live Vercel domain calls) and fabricating a project owned by SOMEONE
// ELSE (the suite has a single Clerk user). Everything else goes through the real routes.
const db = new PrismaClient();
test.afterAll(async () => {
  await db.$disconnect();
});

/** Signed-in API context with a freshly refreshed Clerk session (see publish.spec.ts). */
async function authedApi(page: import('@playwright/test').Page): Promise<APIRequestContext> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  return page.request;
}

/** Create a project + seed a publish-ready draft; returns its token. */
async function newSeededProject(api: APIRequestContext) {
  const personaRes = await api.post('/api/user/persona', { data: { persona: CFG.persona } });
  expect(personaRes.ok(), `persona: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

  const finalContent = await seedDraft(api, token, CFG);
  return { token, finalContent };
}

test('unauthenticated → rejected by middleware (404) on both lifecycle routes', async () => {
  // A cookie-less context: the `authed` project's storageState is NOT applied here.
  const anon = await playwrightRequest.newContext({ baseURL: BASE_URL });

  // ASSERTS WHAT THE STACK ACTUALLY DOES. `/api/projects/*` is not in `isPublicRoute` and the
  // middleware matcher covers `/(api|trpc)(.*)`, so `auth.protect()` is the FIRST gate. For an
  // API-style request Clerk's handleUnauthenticated() sees a non-page request (no
  // `sec-fetch-dest: document` / html accept / next-url) → notFound() → 404, never the routes'
  // own 401. That route-level 401 is defense-in-depth the middleware pre-empts here.
  // NOT weakened to "any non-200": a 200/500 here is a real regression and must fail.
  const unpub = await anon.post('/api/projects/some-token/unpublish');
  expect(unpub.status(), 'unauthenticated unpublish must be blocked by middleware').toBe(404);

  const del = await anon.delete('/api/projects/some-token');
  expect(del.status(), 'unauthenticated delete must be blocked by middleware').toBe(404);

  await anon.dispose();
});

test('demo token → 404 on both lifecycle routes, demo project NOT destroyed', async ({ page }) => {
  const api = await authedApi(page);

  // `assertProjectOwner` short-circuits the demo token to ok:true for ANY caller BEFORE any
  // ownership check, and a real (shared, un-owned) Project row exists for it. Without an
  // explicit isDemo reject, any signed-in user could delete the shared demo — the Token row
  // delete is unrecoverable. 404 (not 403) matches src/lib/blog/access.ts.
  const DEMO_TOKEN = 'lessgodemomockdata';
  const before = await db.project.findUnique({ where: { tokenId: DEMO_TOKEN } });

  const unpub = await api.post(`/api/projects/${DEMO_TOKEN}/unpublish`);
  expect(unpub.status(), 'demo unpublish must 404').toBe(404);

  const del = await api.delete(`/api/projects/${DEMO_TOKEN}`);
  expect(del.status(), 'demo delete must 404').toBe(404);

  // The 404 must be the GUARD, not the not-found branch: if the demo row exists in this DB, it
  // must SURVIVE. (If it doesn't exist locally, the status assertions above still stand but
  // can't distinguish the two branches — the guard is pinned honestly only when seeded.)
  if (before) {
    expect(
      await db.project.findUnique({ where: { tokenId: DEMO_TOKEN } }),
      'demo project destroyed — the isDemo guard is missing'
    ).not.toBeNull();
    expect(await db.token.findUnique({ where: { value: DEMO_TOKEN } })).not.toBeNull();
  }
});

test('non-owner token → 403 on both lifecycle routes', async ({ page }) => {
  const api = await authedApi(page);

  // A project owned by a different app user. assertProjectOwner: not owner, not orphan,
  // not admin → 403. (If this 200s, check the E2E user isn't in ADMIN_CLERK_IDS — an admin
  // override is allowed BY DESIGN per D2 and would legitimately change this expectation.)
  const otherToken = `e2e-foreign-${randomUUID().slice(0, 8)}`;
  const otherUser = await db.user.upsert({
    where: { clerkId: 'e2e_foreign_owner' },
    update: {},
    create: { clerkId: 'e2e_foreign_owner', email: 'foreign@e2e.local' },
  });
  await db.token.create({ data: { value: otherToken } });
  await db.project.create({
    data: { tokenId: otherToken, userId: otherUser.id, title: 'Foreign project' },
  });

  try {
    const unpub = await api.post(`/api/projects/${otherToken}/unpublish`);
    expect(unpub.status(), 'non-owner unpublish must 403').toBe(403);

    const del = await api.delete(`/api/projects/${otherToken}`);
    expect(del.status(), 'non-owner delete must 403').toBe(403);

    // The 403 is real, not cosmetic: the project survives.
    expect(await db.project.findUnique({ where: { tokenId: otherToken } })).not.toBeNull();
  } finally {
    await db.project.deleteMany({ where: { tokenId: otherToken } });
    await db.token.deleteMany({ where: { value: otherToken } });
  }
});

test('unpublish takes /p/{slug} down (404), then re-publish serves it again', async ({ page }) => {
  const api = await authedApi(page);
  const { token, finalContent } = await newSeededProject(api);
  const slug = `e2e-lifecycle-unpub-${randomUUID().slice(0, 6)}`;

  try {
    await publishSeed(api, token, slug, CFG, finalContent);

    // Baseline: the SSR path serves.
    expect((await page.goto(`/p/${slug}`))?.status(), 'seeded page not serving').toBeLessThan(400);

    const res = await api.post(`/api/projects/${token}/unpublish`);
    expect(res.status(), `unpublish: ${await res.text()}`).toBe(200);
    expect((await res.json()).unpublished).toBe(true);

    // DD0: publishState 'draft' ⇒ non-serving ⇒ the SSR route 404s (the KV/blob half of the
    // take-down is unverifiable locally — see the file header).
    expect((await page.goto(`/p/${slug}`))?.status(), 'unpublished page still serves').toBe(404);

    // The project is back to a draft the owner can keep editing.
    const projectRes = await api.get(`/api/projects/${token}`);
    expect(projectRes.status()).toBe(200);
    expect((await projectRes.json()).status).toBe('draft');

    // DD12: the PublishedPage row (and its slug) is KEPT for re-publish.
    const kept = await db.publishedPage.findUnique({ where: { slug } });
    expect(kept, 'slug reservation lost on unpublish').not.toBeNull();
    expect(kept!.publishState).toBe('draft');

    // Idempotent: a second unpublish is a 200 no-op, not a 404/500.
    const again = await api.post(`/api/projects/${token}/unpublish`);
    expect(again.status()).toBe(200);
    expect((await again.json()).unpublished).toBe(false);

    // Re-publish through the real route → serving again on the SAME slug.
    await publishSeed(api, token, slug, CFG, finalContent);
    expect((await page.goto(`/p/${slug}`))?.status(), 're-published page not serving').toBeLessThan(400);
  } finally {
    await api.delete(`/api/projects/${token}`);
    await db.publishedPage.deleteMany({ where: { slug } });
  }
});

test('delete removes the project and takes /p/{slug} down', async ({ page }) => {
  const api = await authedApi(page);
  const { token, finalContent } = await newSeededProject(api);
  const slug = `e2e-lifecycle-del-${randomUUID().slice(0, 6)}`;

  try {
    await publishSeed(api, token, slug, CFG, finalContent);
    expect((await page.goto(`/p/${slug}`))?.status(), 'seeded page not serving').toBeLessThan(400);

    const res = await api.delete(`/api/projects/${token}`);
    expect(res.status(), `delete: ${await res.text()}`).toBe(200);

    // Project gone (GET 404 — the route's own not-found branch) …
    expect((await api.get(`/api/projects/${token}`)).status()).toBe(404);
    // … and the live page with it.
    expect((await page.goto(`/p/${slug}`))?.status(), 'deleted page still serves').toBe(404);

    // DD11 rows: PublishedPage + Project + Token all gone (slug released — the only path
    // that ever releases it).
    expect(await db.publishedPage.findUnique({ where: { slug } })).toBeNull();
    expect(await db.project.findUnique({ where: { tokenId: token } })).toBeNull();
    expect(await db.token.findUnique({ where: { value: token } })).toBeNull();
  } finally {
    await db.publishedPage.deleteMany({ where: { slug } });
    await db.project.deleteMany({ where: { tokenId: token } });
    await db.token.deleteMany({ where: { value: token } });
  }
});

test('custom domain attached → 409 custom_domain_attached, page STILL serves (zero writes)', async ({ page }) => {
  const api = await authedApi(page);
  const { token, finalContent } = await newSeededProject(api);
  const slug = `e2e-lifecycle-domain-${randomUUID().slice(0, 6)}`;

  try {
    await publishSeed(api, token, slug, CFG, finalContent);

    // D1: the guard keys off `customDomain !== null`, NOT the status — a half-attached
    // (pending) domain still holds the @unique slot + a Vercel registration.
    await db.publishedPage.update({
      where: { slug },
      data: { customDomain: `e2e-${randomUUID().slice(0, 6)}.example.com`, customDomainStatus: 'pending_dns' },
    });

    const unpub = await api.post(`/api/projects/${token}/unpublish`);
    expect(unpub.status(), 'domain-attached unpublish must 409').toBe(409);
    expect((await unpub.json()).code).toBe('custom_domain_attached');

    const del = await api.delete(`/api/projects/${token}`);
    expect(del.status(), 'domain-attached delete must 409').toBe(409);
    expect((await del.json()).code).toBe('custom_domain_attached');

    // The point of a ZERO-WRITE guard: nothing was half-torn-down.
    expect((await page.goto(`/p/${slug}`))?.status(), 'blocked page must keep serving').toBeLessThan(400);
    const row = await db.publishedPage.findUnique({ where: { slug } });
    expect(row!.publishState, 'guard must not write the unpublishing marker').not.toBe('unpublishing');
    expect(await db.project.findUnique({ where: { tokenId: token } }), 'project deleted despite 409').not.toBeNull();

    // Remove the domain → unpublish now goes through (the documented escape hatch).
    await db.publishedPage.update({
      where: { slug },
      data: { customDomain: null, customDomainStatus: null },
    });
    expect((await api.post(`/api/projects/${token}/unpublish`)).status()).toBe(200);
  } finally {
    await db.publishedPage.updateMany({ where: { slug }, data: { customDomain: null } });
    await api.delete(`/api/projects/${token}`);
    await db.publishedPage.deleteMany({ where: { slug } });
  }
});

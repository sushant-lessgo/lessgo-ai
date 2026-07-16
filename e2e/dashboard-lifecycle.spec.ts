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
 * Phase 5 adds the DASHBOARD UI path on top of the same contract: `••• → confirm → toast →
 * router.refresh()`. Those tests assert the DD1c honest-window copy verbatim-ish, because that
 * sentence is the only signal a user gets about the ~1h edge cache window and a silent reword
 * would remove it without breaking anything else.
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

/**
 * Every meridian seed is titled 'Meridian', so a name locator would be ambiguous in this
 * shared-user grid. Cards are scoped by `data-testid=project-card-{tokenId}` instead — the
 * tokenId is the handle the test already holds.
 */
const cardFor = (page: import('@playwright/test').Page, token: string) =>
  page.getByTestId(`project-card-${token}`);

async function openCardMenu(page: import('@playwright/test').Page, token: string) {
  const card = cardFor(page, token);
  await expect(card, 'project card missing from the dashboard grid').toBeVisible();
  await card.getByRole('button', { name: 'Project actions' }).click();
}

test('UI: ••• → Unpublish → confirm (with the cached-copy sentence) → toast → card flips to Draft', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token, finalContent } = await newSeededProject(api);
  const slug = `e2e-lifecycle-ui-unpub-${randomUUID().slice(0, 6)}`;

  try {
    await publishSeed(api, token, slug, CFG, finalContent);

    await page.goto('/dashboard');
    await expect(cardFor(page, token).getByText('Published')).toBeVisible();

    await openCardMenu(page, token);
    await page.getByRole('menuitem', { name: 'Unpublish' }).click();

    // DD1c: the ONLY honest signal about the ~1h edge window. If this assertion fails because
    // the copy was reworded, the replacement MUST still say take-down is immediate but a cached
    // copy can linger ~an hour — do not just delete the assertion.
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toContainText('cached copy for up to an hour');
    await dialog.getByRole('button', { name: 'Unpublish' }).click();

    await expect(page.getByRole('status')).toContainText('up to an hour to clear');

    // router.refresh() re-derives the card from the server (DD4 slot predicate), no optimistic
    // client mutation — so a green here means the SERVER really says draft.
    await expect(cardFor(page, token).getByText('Draft')).toBeVisible();
    expect((await page.goto(`/p/${slug}`))?.status(), 'unpublished page still serves').toBe(404);
  } finally {
    await api.delete(`/api/projects/${token}`);
    await db.publishedPage.deleteMany({ where: { slug } });
  }
});

test('UI: ••• → Delete → destructive confirm → toast → card disappears', async ({ page }) => {
  const api = await authedApi(page);
  const { token, finalContent } = await newSeededProject(api);
  const slug = `e2e-lifecycle-ui-del-${randomUUID().slice(0, 6)}`;

  try {
    await publishSeed(api, token, slug, CFG, finalContent);

    await page.goto('/dashboard');
    await openCardMenu(page, token);
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const dialog = page.getByRole('alertdialog');
    // Published delete tears the live page down too — the dialog must SAY so (and inherits the
    // same DD1c window, since it runs the identical teardown).
    await expect(dialog).toContainText('live page taken down');
    await expect(dialog).toContainText('cached copy for up to an hour');
    await dialog.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('status')).toContainText('deleted');
    await expect(cardFor(page, token), 'deleted card still in the grid').toHaveCount(0);

    // The UI told the truth: the rows really are gone.
    expect(await db.project.findUnique({ where: { tokenId: token } })).toBeNull();
  } finally {
    await db.publishedPage.deleteMany({ where: { slug } });
    await db.project.deleteMany({ where: { tokenId: token } });
    await db.token.deleteMany({ where: { value: token } });
  }
});

test('UI: custom-domain card pre-disables Unpublish + Delete (DD7)', async ({ page }) => {
  const api = await authedApi(page);
  const { token, finalContent } = await newSeededProject(api);
  const slug = `e2e-lifecycle-ui-domain-${randomUUID().slice(0, 6)}`;

  try {
    await publishSeed(api, token, slug, CFG, finalContent);
    await db.publishedPage.update({
      where: { slug },
      data: { customDomain: `e2e-${randomUUID().slice(0, 6)}.example.com`, customDomainStatus: 'live' },
    });

    await page.goto('/dashboard');
    await openCardMenu(page, token);

    // Pre-disable is a COURTESY only — the 409 guard (asserted in the API test above) is the
    // real gate. Both items still RENDER (completeness principle), just disabled.
    for (const label of ['Unpublish', 'Delete']) {
      const item = page.getByRole('menuitem', { name: label });
      await expect(item).toHaveAttribute('data-disabled', /.*/);
      await expect(item).toHaveAttribute('title', 'Remove the custom domain first');
    }
  } finally {
    await db.publishedPage.updateMany({ where: { slug }, data: { customDomain: null } });
    await api.delete(`/api/projects/${token}`);
    await db.publishedPage.deleteMany({ where: { slug } });
  }
});


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

  // Phase 6: rename is a MUTATION of the shared mock (it would retitle the demo for everyone);
  // duplicate is only read-then-create, but is rejected too — the demo short-circuit leaves no
  // `userRecord` to own the copy, and it would be an unmetered project factory.
  const rename = await api.patch(`/api/projects/${DEMO_TOKEN}`, { data: { title: 'pwned' } });
  expect(rename.status(), 'demo rename must 404').toBe(404);

  const dup = await api.post(`/api/projects/${DEMO_TOKEN}/duplicate`);
  expect(dup.status(), 'demo duplicate must 404').toBe(404);

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

    const rename = await api.patch(`/api/projects/${otherToken}`, { data: { title: 'pwned' } });
    expect(rename.status(), 'non-owner rename must 403').toBe(403);

    const dup = await api.post(`/api/projects/${otherToken}/duplicate`);
    expect(dup.status(), 'non-owner duplicate must 403').toBe(403);

    // The 403 is real, not cosmetic: the project survives, unrenamed, uncopied.
    const survivor = await db.project.findUnique({ where: { tokenId: otherToken } });
    expect(survivor).not.toBeNull();
    expect(survivor!.title, 'non-owner rename went through').toBe('Foreign project');
    expect(
      await db.project.count({ where: { title: 'Foreign project (copy)' } }),
      'non-owner duplicate went through'
    ).toBe(0);
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


// ---------------------------------------------------------------------------
// Phase 6 (Rename + Duplicate) lives at the END of this file ON PURPOSE. /api/publish is
// rate-limited to 5 requests/minute per user, and the publish-backed tests above already spend
// that whole budget; inserting these fast, publish-free tests earlier re-times the run and tips
// one of THOSE tests into a 429. Nothing below publishes — keep it that way, and keep it last.
// ---------------------------------------------------------------------------

test('rename: PATCH 200 writes the title, and the card shows it (DD10)', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await newSeededProject(api);
  const newName = `E2E Renamed ${randomUUID().slice(0, 6)}`;

  try {
    const res = await api.patch(`/api/projects/${token}`, { data: { title: newName } });
    expect(res.status(), `rename: ${await res.text()}`).toBe(200);
    expect((await res.json()).title).toBe(newName);

    // DD10: the explicit title must beat the dashboard's smart-name derivation chain — a seeded
    // project HAS onboarding content, so a regression there (unconditional derivation) would
    // overwrite the rename on screen while the DB row stays correct. Assert the SCREEN.
    await page.goto('/dashboard');
    await expect(cardFor(page, token)).toContainText(newName);

    // Trimming + the 1–120 bound are the route's contract, not the client's.
    expect((await api.patch(`/api/projects/${token}`, { data: { title: '   ' } })).status()).toBe(400);
    expect((await api.patch(`/api/projects/${token}`, { data: { title: 'x'.repeat(121) } })).status()).toBe(400);
    const trimmed = await api.patch(`/api/projects/${token}`, { data: { title: `  ${newName}  ` } });
    expect((await trimmed.json()).title).toBe(newName);
  } finally {
    await api.delete(`/api/projects/${token}`);
  }
});

test('UI: ••• → Rename → prompt → toast → card shows the new name', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await newSeededProject(api);
  const newName = `E2E UI Rename ${randomUUID().slice(0, 6)}`;

  try {
    await page.goto('/dashboard');
    await openCardMenu(page, token);
    await page.getByRole('menuitem', { name: 'Rename' }).click();

    // A prompt renders role="dialog" (only `confirm` is an alertdialog) — DD5: ConfirmDialog is
    // used as-is, not restyled.
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('textbox').fill(newName);
    await dialog.getByRole('button', { name: 'Rename' }).click();

    await expect(page.getByRole('status')).toContainText('renamed');
    // router.refresh() re-derives from the server — green here means the SERVER says so.
    await expect(cardFor(page, token)).toContainText(newName);
  } finally {
    await api.delete(`/api/projects/${token}`);
  }
});

test('duplicate: new Draft with a NEW token, pages cloned, original untouched (DD9)', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token } = await newSeededProject(api);
  const slug = `e2e-lifecycle-dup-${randomUUID().slice(0, 6)}`;
  let copyToken: string | undefined;

  try {
    // The ORIGINAL gets a PublishedPage row so we can prove the copy does NOT inherit it.
    // Planted directly, NOT via publishSeed: /api/publish is rate-limited to 5/min and this
    // serial suite already spends that budget on the tests that genuinely need a real blob.
    // Duplicate never touches publish infra, so a real publish would buy nothing here but flake.
    const src = (await db.project.findUnique({ where: { tokenId: token } }))!;
    const owner = (await db.user.findUnique({ where: { id: src.userId! } }))!;
    await db.publishedPage.create({
      data: {
        userId: owner.clerkId, // PublishedPage.userId is the CLERK id, not User.id
        slug,
        projectId: src.id,
        htmlContent: '<html></html>',
        publishState: 'published',
      },
    });

    // A second page on the source. THE trap DD9 flags: cloning the Project row but not its
    // `pages` silently loses every extra page of a multi-page site, with no error anywhere.
    const source = src;
    await db.projectPage.create({
      data: {
        projectId: source.id,
        archetypeKey: 'contact',
        pathSlug: '/contact',
        title: 'Contact',
        order: 1,
        content: { sections: ['contact-e2e'] },
      },
    });

    const res = await api.post(`/api/projects/${token}/duplicate`);
    expect(res.status(), `duplicate: ${await res.text()}`).toBe(200);
    copyToken = (await res.json()).tokenId as string;
    expect(copyToken, 'duplicate must return a NEW token').not.toBe(token);

    const copy = (await db.project.findUnique({ where: { tokenId: copyToken } }))!;
    expect(copy, 'copy row missing').not.toBeNull();
    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toBe(`${source.title} (copy)`);
    expect(copy.status).toBe('draft');
    expect(copy.userId).toBe(source.userId);
    // Carried design/content identity (a copy the user recognises, not a blank).
    expect(copy.audienceType).toBe(source.audienceType);
    expect(copy.templateId).toBe(source.templateId);
    expect(copy.paletteId).toBe(source.paletteId);
    expect(JSON.stringify(copy.content)).toBe(JSON.stringify(source.content));

    // The multi-page clone.
    const copiedPages = await db.projectPage.findMany({
      where: { projectId: copy.id },
      orderBy: { order: 'asc' },
    });
    const sourcePages = await db.projectPage.findMany({
      where: { projectId: source.id },
      orderBy: { order: 'asc' },
    });
    expect(copiedPages.length, 'pages NOT cloned — multi-page site silently lost').toBe(
      sourcePages.length
    );
    expect(copiedPages.map((p) => p.pathSlug)).toEqual(sourcePages.map((p) => p.pathSlug));
    expect(copiedPages.some((p) => p.pathSlug === '/contact')).toBe(true);

    // NOT cloned: the copy is an independent UNPUBLISHED draft.
    expect(
      await db.publishedPage.findFirst({ where: { projectId: copy.id } }),
      'copy inherited the published page'
    ).toBeNull();

    // Independence: editing the copy must not touch the original.
    await api.patch(`/api/projects/${copyToken}`, { data: { title: 'Copy edited' } });
    expect((await db.project.findUnique({ where: { id: source.id } }))!.title).toBe(source.title);

    // The ORIGINAL's published row is untouched — duplicating never disturbs the live page.
    // (Real SSR take-down/serving is pinned by the publish-backed tests below; this test
    // deliberately spends no publish budget.)
    const originalPage = await db.publishedPage.findUnique({ where: { slug } });
    expect(originalPage!.projectId, 'duplicate re-pointed the original published page').toBe(
      source.id
    );
    expect(originalPage!.publishState).toBe('published');

    // The copy lands as a Draft card in the grid.
    await page.goto('/dashboard');
    await expect(cardFor(page, copyToken).getByText('Draft')).toBeVisible();
  } finally {
    if (copyToken) {
      await db.project.deleteMany({ where: { tokenId: copyToken } });
      await db.token.deleteMany({ where: { value: copyToken } });
    }
    // The planted row goes FIRST: the DELETE route would otherwise run a real teardown on a
    // fabricated 'published' page and could refuse (teardown_incomplete), leaking the project.
    await db.publishedPage.deleteMany({ where: { slug } });
    await api.delete(`/api/projects/${token}`);
  }
});

test('UI: ••• → Duplicate → toast → a new Draft card appears', async ({ page }) => {
  const api = await authedApi(page);
  const { token } = await newSeededProject(api);

  try {
    await page.goto('/dashboard');
    const before = await page.getByTestId(/^project-card-/).count();

    await openCardMenu(page, token);
    await page.getByRole('menuitem', { name: 'Duplicate' }).click();

    // No confirm dialog — duplicate creates, it never destroys.
    await expect(page.getByRole('status')).toContainText('Duplicated');
    await expect(page.getByTestId(/^project-card-/)).toHaveCount(before + 1);
  } finally {
    // The copy is the only OTHER project holding this project's cloned title.
    const src = await db.project.findUnique({ where: { tokenId: token } });
    if (src) {
      const copies = await db.project.findMany({
        where: { title: `${src.title} (copy)`, userId: src.userId },
        select: { tokenId: true },
      });
      await db.project.deleteMany({ where: { tokenId: { in: copies.map((c) => c.tokenId) } } });
      await db.token.deleteMany({ where: { value: { in: copies.map((c) => c.tokenId) } } });
    }
    await api.delete(`/api/projects/${token}`);
  }
});
import { test, expect, type Page } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// dashboard-workspace-ia PHASE 4 (analytics/leads) + PHASE 5 (blog/testimonials) —
// slug → token redirect shims + the C1/D1 no-hop rule.
//
// Registered on the `authed` project in playwright.config.ts (a spec that isn't listed
// there matches no project and silently never runs). Run just this file:
//   npx playwright test e2e/dashboard-redirects.spec.ts --project=authed
//
// ⚠️ GOTCHA: `AppIcon` renders the Material Symbols LIGATURE NAME as element text
// (`src/components/ui/icon.tsx:33` → `{name}`, aria-hidden), so a whole-string
// `toHaveText('X')` can NEVER pass on an icon-bearing element. Use an end-anchored
// regex or `getByRole(..., { name })` (accessible names exclude aria-hidden nodes).
//
// What e2e canNOT cover here: non-owner 404, orphan rejection and admin god-view on
// the re-homed surfaces (single Clerk session, no orphan seeding) → founder gate 1-3.
//
// Serial: the published fixture is built ONCE and shared (publishing is slow — the
// local Blob/KV calls run to their timeouts before the non-fatal fallback returns).
test.describe.configure({ mode: 'serial' });

const CFG = AUDIENCES[0];
// Deterministic slug → republishes the same page every run instead of accumulating
// published pages against the plan limit (the `publish.spec.ts` convention).
const SLUG = 'e2e-redirect-smoke';

interface Fixture {
  token: string;
  slug: string;
}

/** undefined = not attempted yet; null = attempted and failed (→ skip, never pass silently). */
let fixture: Fixture | null | undefined;
let draftToken: string | null | undefined;
let postId: string | null | undefined;

/**
 * Create an UNPUBLISHED project (the R10 locked-state fixture) and return its token.
 *
 * Self-sufficient by design: it POSTs the persona itself rather than inheriting one
 * from an earlier `describe` — `audienceType` is captured on the Project at
 * `/api/start`, so relying on serial file order would break the moment a test is
 * filtered or reordered.
 *
 * Memoised: unlike the published fixture (deterministic slug → republishes one page),
 * a draft has no natural dedupe key, so each RUN accumulates one throwaway draft
 * project. Accepted — drafts are unpublished and so cost nothing against the plan's
 * published-page limit — but memoising keeps it to one per run, not one per test.
 */
async function getDraftToken(page: Page): Promise<string | null> {
  if (draftToken !== undefined) return draftToken;
  draftToken = null;

  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });

  const personaRes = await page.request.post('/api/user/persona', { data: { persona: CFG.persona } });
  if (!personaRes.ok()) return null;

  const startRes = await page.request.get('/api/start');
  if (!startRes.ok()) return null;
  const { url } = await startRes.json();
  draftToken = new URL(url).pathname.split('/').filter(Boolean).pop() ?? null;
  return draftToken;
}

/**
 * Build (once) a PUBLISHED project: persona → /api/start → seed draft → drive the real
 * publish UI. A `PublishedPage` is what gives us a slug for the shims and an unlocked
 * analytics tab. Mirrors `publish.spec.ts`.
 */
async function getPublishedFixture(page: Page): Promise<Fixture | null> {
  if (fixture !== undefined) return fixture;
  fixture = null; // don't retry a failed build for every test

  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const api = page.request;

  const personaRes = await api.post('/api/user/persona', { data: { persona: CFG.persona } });
  if (!personaRes.ok()) return null;

  const startRes = await api.get('/api/start');
  if (!startRes.ok()) return null;
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop();
  if (!token) return null;

  await seedDraft(api, token, CFG);

  await page.goto(`/preview/${token}`);
  const publishBtn = page.getByRole('button', { name: 'Publish', exact: true });
  await expect(publishBtn, 'Publish never enabled (isPublishReady false?)').toBeEnabled({
    timeout: 45_000,
  });
  await publishBtn.click();

  const modal = page
    .locator('div.shadow-lg')
    .filter({ hasText: /Choose your page URL|Republish Your Page/ });
  await expect(modal).toBeVisible();
  await modal.getByRole('textbox').first().fill(SLUG);
  await modal.getByPlaceholder('e.g., Design Tools for Social Media Marketers').fill(CFG.title);
  await modal.getByRole('button', { name: /Confirm & Publish|Update Published Page/ }).click();
  await expect(page.getByText(/Page Published/i)).toBeVisible({ timeout: 120_000 });

  fixture = { token, slug: SLUG };
  return fixture;
}

/**
 * Create (once) a blog post on the published fixture project, returning its id.
 * Posts are token-keyed (`/api/blog/posts` takes `tokenId`), so no slug is needed —
 * but the blog TAB is publish-gated (R18), hence the published fixture.
 */
async function getPostId(page: Page): Promise<string | null> {
  if (postId !== undefined) return postId;
  postId = null;

  const f = await getPublishedFixture(page);
  if (!f) return null;

  const res = await page.request.post('/api/blog/posts', {
    data: { tokenId: f.token, title: `e2e phase5 post ${Date.now()}` },
  });
  if (!res.ok()) return null;
  const data = await res.json();
  postId = data?.post?.id ?? null;
  return postId;
}

test.describe('slug → token redirect shims (phase 4)', () => {
  test('/dashboard/analytics/{slug} → /dashboard/{token}/analytics', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');

    await page.goto(`/dashboard/analytics/${f!.slug}`);
    await expect(page).toHaveURL(`/dashboard/${f!.token}/analytics`);
  });

  test('/dashboard/forms/{slug} → /dashboard/{token}/leads', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');

    await page.goto(`/dashboard/forms/${f!.slug}`);
    await expect(page).toHaveURL(`/dashboard/${f!.token}/leads`);
  });

  // The shim dirs must stay REAL — deleting one lets `/dashboard/analytics/foo` fall
  // through to `[token]` and "analytics" gets read as a project token. This pins the
  // unknown-slug contract: 404, no redirect, no leak (same as before the re-home).
  test('unknown slug → 404 (both shims)', async ({ page }) => {
    const a = await page.goto('/dashboard/analytics/definitely-not-a-real-slug-xyz');
    expect(a?.status(), 'unknown analytics slug must 404').toBe(404);

    const f = await page.goto('/dashboard/forms/definitely-not-a-real-slug-xyz');
    expect(f?.status(), 'unknown forms slug must 404').toBe(404);
  });
});

test.describe('D1 — analytics date pills never hop through the shim (phase 4)', () => {
  test('?days pills stay on the token URL and preserve the query', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');

    await page.goto(`/dashboard/${f!.token}/analytics`);

    // A verbatim body copy would have aimed these at `/dashboard/analytics/{slug}?days=`
    // — the shim, which preserves no query string.
    for (const d of [7, 30, 90]) {
      await expect(page.getByRole('link', { name: `${d}d`, exact: true })).toHaveAttribute(
        'href',
        `/dashboard/${f!.token}/analytics?days=${d}`
      );
    }

    // Click one: no bounce (URL + query intact) and the range really changed — the 7d
    // pill now carries the active style. Through the shim we'd land on the default 30d
    // range with the query dropped, so both halves of this assertion bite.
    await page.getByRole('link', { name: '7d', exact: true }).click();
    await expect(page).toHaveURL(`/dashboard/${f!.token}/analytics?days=7`);
    await expect(page.getByRole('link', { name: '7d', exact: true })).toHaveClass(/bg-brand-text/);
    await expect(page.getByRole('link', { name: '30d', exact: true })).not.toHaveClass(
      /bg-brand-text/
    );
  });
});

test.describe('R10 — locked states before publish (phase 4)', () => {
  test('unpublished project: analytics + leads render locked, not an error', async ({ page }) => {
    const token = await getDraftToken(page);
    test.skip(!token, 'persona//api/start failed — cannot build a draft fixture');

    const a = await page.goto(`/dashboard/${token}/analytics`);
    expect(a?.status(), 'a draft workspace tab must render, not 404').toBeLessThan(400);
    await expect(page.getByText('Publish to see analytics', { exact: true })).toBeVisible();

    const l = await page.goto(`/dashboard/${token}/leads`);
    expect(l?.status(), 'a draft workspace tab must render, not 404').toBeLessThan(400);
    await expect(
      page.getByText('Publish to start collecting leads', { exact: true })
    ).toBeVisible();
  });
});

test.describe('blog slug → token redirect shims (phase 5)', () => {
  test('/dashboard/blog/{slug} → /dashboard/{token}/blog', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');

    await page.goto(`/dashboard/blog/${f!.slug}`);
    await expect(page).toHaveURL(`/dashboard/${f!.token}/blog`);
  });

  test('/dashboard/blog/{slug}/{postId} → /dashboard/{token}/blog/{postId}', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');
    const id = await getPostId(page);
    test.skip(!id, 'could not create a blog post via /api/blog/posts');

    await page.goto(`/dashboard/blog/${f!.slug}/${id}`);
    await expect(page).toHaveURL(`/dashboard/${f!.token}/blog/${id}`);
  });

  // Both blog shim dirs must stay REAL — deleting one lets `/dashboard/blog/foo` fall
  // through to `[token]` and "blog" gets read as a project token.
  test('unknown slug → 404 (both blog shims)', async ({ page }) => {
    const a = await page.goto('/dashboard/blog/definitely-not-a-real-slug-xyz');
    expect(a?.status(), 'unknown blog slug must 404').toBe(404);

    const b = await page.goto('/dashboard/blog/definitely-not-a-real-slug-xyz/some-post-id');
    expect(b?.status(), 'unknown blog post slug must 404').toBe(404);
  });
});

test.describe('C1 — in-tab blog nav never hops through a shim (phase 5)', () => {
  test('table row → post → back-link are all token URLs', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');
    const id = await getPostId(page);
    test.skip(!id, 'could not create a blog post via /api/blog/posts');

    await page.goto(`/dashboard/${f!.token}/blog`);

    // The HREF is the assertion that bites: a verbatim component copy would have kept
    // `/dashboard/blog/{slug}/{postId}`, which redirects to the SAME final URL — so
    // checking only the landing URL would pass while the hop was still there.
    const row = page.locator(`a[href="/dashboard/${f!.token}/blog/${id}"]`).first();
    await expect(row, 'blog table row must link straight at the token URL').toBeVisible();
    await row.click();
    await expect(page).toHaveURL(`/dashboard/${f!.token}/blog/${id}`);

    const back = page.getByRole('link', { name: 'All posts' });
    await expect(back).toHaveAttribute('href', `/dashboard/${f!.token}/blog`);
    await back.click();
    await expect(page).toHaveURL(`/dashboard/${f!.token}/blog`);
  });
});

test.describe('B2 — blog SSR preview is NOT re-homed and stays chrome-free (phase 5)', () => {
  test('preview URL 200s on the OLD slug path, no redirect, no .app-chrome', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');
    const id = await getPostId(page);
    test.skip(!id, 'could not create a blog post via /api/blog/posts');

    const url = `/dashboard/blog/${f!.slug}/${id}/preview`;
    const res = await page.goto(url);
    expect(res?.status(), 'the preview route must render, not 404').toBeLessThan(400);

    // Deliberately NOT shimmed: this URL is live, not a hop (the post editor links here).
    await expect(page).toHaveURL(url);

    // It renders real template markup — app chrome must never wrap it (fonts/colors
    // would leak in and break parity with the live page).
    await expect(page.locator('.app-chrome')).toHaveCount(0);
  });

  test('the post editor still points its preview link at the old slug URL', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');
    const id = await getPostId(page);
    test.skip(!id, 'could not create a blog post via /api/blog/posts');

    await page.goto(`/dashboard/${f!.token}/blog/${id}`);
    // D3: the slug comes from the wrapper's publishedPage.slug, not a route param.
    await expect(page.getByRole('link', { name: 'Preview saved draft' })).toHaveAttribute(
      'href',
      `/dashboard/blog/${f!.slug}/${id}/preview`
    );
  });
});

test.describe('C2 — testimonials tab avoids the third ID space (phase 5)', () => {
  // The silent-zero-rows guard. `Testimonial.userId` is a CLERK id while
  // `project.userId` is an internal `User.id`: passing the wrong one is tsc-green and
  // returns ZERO rows with no error. Only a NON-EMPTY assertion catches that.
  test('a project-scoped testimonial actually renders in the tab', async ({ page }) => {
    const f = await getPublishedFixture(page);
    test.skip(!f, 'could not build a published fixture (persona/start/seed/publish failed)');

    const projectRes = await page.request.get(`/api/projects/${f!.token}`);
    test.skip(!projectRes.ok(), 'could not resolve the project id via /api/projects');
    const { id: projectId } = await projectRes.json();

    const quote = `e2e phase5 quote ${Date.now()}`;
    const created = await page.request.post('/api/testimonials', {
      data: { authorName: 'E2E Author', quote, projectId },
    });
    // 404 = TESTIMONIALS_ENABLED unset in this run's env — skip loudly, never pass mute.
    test.skip(
      created.status() === 404,
      'TESTIMONIALS_ENABLED is not "true" in this env — testimonials surface is dark'
    );
    expect(created.ok(), `seeding a testimonial failed: ${created.status()}`).toBeTruthy();

    const res = await page.goto(`/dashboard/${f!.token}/testimonials`);
    expect(res?.status(), 'the testimonials tab must render').toBeLessThan(400);
    await expect(page.getByText(quote, { exact: false })).toBeVisible();
  });
});

test.describe('R18 — blog tab locked before publish (phase 5)', () => {
  test('unpublished project: blog renders locked, not an error', async ({ page }) => {
    const token = await getDraftToken(page);
    test.skip(!token, 'persona//api/start failed — cannot build a draft fixture');

    const b = await page.goto(`/dashboard/${token}/blog`);
    expect(b?.status(), 'a draft workspace tab must render, not 404').toBeLessThan(400);
    await expect(page.getByText('Publish to start blogging', { exact: true })).toBeVisible();
  });
});

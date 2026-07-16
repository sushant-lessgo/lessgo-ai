import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// dashboard-workspace-ia PHASE 1 — dashboard shell (sidebar + top bar) guards.
//
// Authed: reuses the Clerk session saved by auth.setup.ts (same pattern as
// publish.spec.ts). Serial — shares one test user with the publish spec.
//
// Registered on the `authed` project in playwright.config.ts — a spec that isn't
// listed there matches no project and silently never runs. Run just this file:
//   npx playwright test e2e/dashboard-shell.spec.ts --project=authed
test.describe.configure({ mode: 'serial' });

const APP_CHROME = '.app-chrome';

test.describe('dashboard shell', () => {
  test('sidebar + top bar render, exactly one .app-chrome, old header gone', async ({ page }) => {
    await page.goto('/dashboard');

    // Exactly one shell wrapper — the layout is the ONLY .app-chrome attach point.
    // >1 would mean a page re-attached it; 0 would mean the shell never mounted.
    await expect(page.locator(APP_CHROME)).toHaveCount(1);

    // Sidebar: logo → /dashboard, CTA, workspace + account nav.
    await expect(page.getByRole('button', { name: /New site with AI/i })).toBeEnabled();
    await expect(page.getByRole('link', { name: 'Projects', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Billing & plan/i })).toBeVisible();
    await expect(page.getByText('WORKSPACE', { exact: true })).toBeVisible();
    await expect(page.getByText('ACCOUNT', { exact: true })).toBeVisible();

    // Top bar title block (root = Workspace / Projects).
    await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();

    // The retired <Header/> markup must be gone — it rendered a "Lessgo" home link
    // plus its own nav; the shell's chrome replaces it. Assert its distinctive
    // greeting/CTA from DashboardHeader is absent.
    await expect(page.getByText(/let.s build a High-Converting page/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /\+ Create New Page/i })).toHaveCount(0);
  });

  test('un-built controls are greyed in place (All Analytics / All Leads / Domains / bell)', async ({
    page,
  }) => {
    await page.goto('/dashboard');

    for (const name of ['All Analytics', 'All Leads', 'Domains']) {
      const item = page.getByRole('button', { name, exact: true });
      await expect(item, `${name} should render (completeness principle)`).toBeVisible();
      await expect(item, `${name} should be disabled`).toBeDisabled();
      await expect(item).toHaveAttribute('aria-disabled', 'true');
    }

    const bell = page.getByRole('button', { name: 'Notifications' });
    await expect(bell).toBeVisible();
    await expect(bell).toBeDisabled();

    // R14: All Leads must NOT carry a count pill (no real rollup data this slice).
    const allLeads = page.getByRole('button', { name: 'All Leads', exact: true });
    await expect(allLeads).toHaveText('All Leads');
  });

  test('nested screens render inside the shell with no second nav', async ({ page }) => {
    for (const route of ['/dashboard/settings', '/dashboard/testimonials']) {
      const res = await page.goto(route);
      // testimonials 404s when its flag is off — that's fine, skip the assert then.
      if ((res?.status() ?? 500) >= 400) continue;
      await expect(page.locator(APP_CHROME), `${route}: chrome count`).toHaveCount(1);
      // One sidebar only → the CTA appears exactly once.
      await expect(page.getByRole('button', { name: /New site with AI/i })).toHaveCount(1);
    }
  });
});

// B2 — the blog SSR preview must NOT inherit the dashboard shell.
//
// It returns real blog TEMPLATE markup; an `.app-chrome` ancestor would apply
// Onest/ink/canvas inherited defaults and break parity with the live page. It is
// kept URL-identical but physically outside src/app/dashboard/, in the
// (blog-preview) root route group.
test.describe('blog preview escapes the dashboard shell (B2)', () => {
  // Structural guard — cheap, deterministic, and it catches the actual regression
  // (someone moving the page back under src/app/dashboard/). A runtime-404-based
  // check would be VACUOUS here: src/app/not-found.tsx is the ROOT boundary, so a
  // notFound() renders without the dashboard layout either way.
  test('preview page file lives outside the dashboard route tree', () => {
    const root = path.join(__dirname, '..', 'src', 'app');
    const escaped = path.join(
      root,
      '(blog-preview)',
      'dashboard',
      'blog',
      '[slug]',
      '[postId]',
      'preview',
      'page.tsx'
    );
    const underShell = path.join(
      root,
      'dashboard',
      'blog',
      '[slug]',
      '[postId]',
      'preview',
      'page.tsx'
    );
    expect(fs.existsSync(escaped), 'preview page missing from the (blog-preview) route group').toBe(
      true
    );
    expect(
      fs.existsSync(underShell),
      'preview page is back under src/app/dashboard/ — it would inherit .app-chrome (B2)'
    ).toBe(false);
  });

  // Runtime guard against a real published page + post. Skips (never silently
  // passes) if the fixture can't be built in this environment.
  test('rendered preview has no .app-chrome ancestor', async ({ page }) => {
    const cfg = AUDIENCES[0];
    const slug = `e2e-shell-blog-${cfg.templateId}`;

    await page.goto('/');
    await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
    const api = page.request;

    await api.post('/api/user/persona', { data: { persona: cfg.persona } });
    const startRes = await api.get('/api/start');
    test.skip(!startRes.ok(), `/api/start failed: ${startRes.status()}`);
    const { url } = await startRes.json();
    const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

    await seedDraft(api, token, cfg);

    // Publish via the API (publish.spec covers the real publish UI; here we only
    // need a PublishedPage row so the blog SSR context resolves).
    const draftRes = await api.get(`/api/loadDraft?tokenId=${token}`);
    test.skip(!draftRes.ok(), `loadDraft failed: ${draftRes.status()}`);
    const draft = await draftRes.json();
    const publishRes = await api.post('/api/publish', {
      data: {
        slug,
        title: cfg.title,
        content: draft.finalContent,
        themeValues: draft.themeValues ?? {},
        tokenId: token,
      },
      timeout: 120_000,
    });
    test.skip(!publishRes.ok(), `publish failed: ${publishRes.status()} ${await publishRes.text()}`);

    const postRes = await api.post('/api/blog/posts', {
      data: { tokenId: token, title: 'E2E shell preview post' },
    });
    test.skip(!postRes.ok(), `blog post create failed: ${postRes.status()} ${await postRes.text()}`);
    const post = await postRes.json();
    const postId = post.id ?? post.post?.id;
    test.skip(!postId, `no post id in ${JSON.stringify(post)}`);

    const res = await page.goto(`/dashboard/blog/${slug}/${postId}/preview`);
    expect(res?.status(), 'preview route status').toBeLessThan(400);
    // The URL must be unchanged — no shim, no redirect (B2).
    expect(page.url()).toContain(`/dashboard/blog/${slug}/${postId}/preview`);
    // THE guard: template markup must carry no app-chrome ancestor.
    await expect(page.locator(APP_CHROME)).toHaveCount(0);
  });
});

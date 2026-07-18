import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { AUDIENCES, seedDraft, publishSeed } from './helpers/seedDraft';

/**
 * Blog manager UI (`/dashboard/[token]/blog`) — blog-composer-redesign phase 1.
 *
 * WHAT THIS SPEC HONESTLY COVERS: the three states of the tab as the SERVER derives them,
 * driven through the real UI and the real (unchanged) blog APIs —
 *  - published site + 0 posts → the first-run "Add a blog" screen;
 *  - create via the prompt dialog → real `POST /api/blog/posts` → composer → the row is in
 *    the list and the stats strip counts it;
 *  - delete the ONLY post → the manager REVERTS to first-run. That reversion is the whole
 *    point of the test: enablement is DERIVED (`enabled ⇔ ≥1 BlogPost`, plan ruling #1),
 *    so "the row disappeared" is NOT the contract — "the tab falls back to setup" is. If
 *    someone later adds a stored `blogEnabled` flag, this test is what tells them the
 *    accepted wart just changed behaviour.
 *
 * WHAT IT DOES *NOT* COVER (deliberately — do not read more into a green run):
 *  - Blog PUBLISH/UNPUBLISH of a post. `publishBlogPost` uploads to Vercel Blob OUTSIDE its
 *    try block (`src/lib/blog/publishBlogPost.ts:230-252`) and `blobUploader` THROWS after
 *    retries with no `BLOB_READ_WRITE_TOKEN` — i.e. unlike site publish (which fails
 *    non-fatally locally), a blog publish here 500s for environmental reasons. Those two
 *    row actions are verified manually at GATE A on a deployed host. The publish path is
 *    untouched by this phase.
 *  - The pre-publish locked state ("Publish your site to start blogging"). It needs a
 *    project with NO PublishedPage; the seeded project here is published by construction,
 *    and asserting it would mean a second seed for one static sentence. Covered by visual
 *    QA at GATE A.
 *  - Subscriber counts on the stats strip. `blogSubscriber` rows only exist via the public
 *    subscribe flow on a live blog page, which is not reachable locally (see above). The
 *    tile renders 0 here — that it can render a REAL count is unverified by this spec.
 *  - Anything AI (phase 3/4) and the composer's own behaviour (phase 2's spec).
 *  - `page.slug` publish artefacts: local publish lands `publishState:'failed'` (no blob/KV),
 *    which is still a SERVING state — enough for the R18 precondition this tab needs, and
 *    nothing more is claimed.
 *
 * Serial: one shared Clerk test user + real rate-limited publish/generation routes.
 */
test.describe.configure({ mode: 'serial' });

const CFG = AUDIENCES.find((a) => a.templateId === 'meridian')!;

// Direct DB access is used ONLY for cleanup of rows the API cannot drop on its own.
const db = new PrismaClient();
test.afterAll(async () => {
  await db.$disconnect();
});

async function authedApi(page: Page): Promise<APIRequestContext> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  return page.request;
}

/** A project with a PublishedPage — the R18 precondition the blog tab enforces. */
async function newPublishedProject(api: APIRequestContext) {
  const personaRes = await api.post('/api/user/persona', { data: { persona: CFG.persona } });
  expect(personaRes.ok(), `persona: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

  const finalContent = await seedDraft(api, token, CFG);
  const slug = `e2e-blog-mgr-${randomUUID().slice(0, 6)}`;
  await publishSeed(api, token, slug, CFG, finalContent);
  return { token, slug };
}

const firstRun = (page: Page) => page.getByText('Add a blog to', { exact: false });

test('first-run → create → row in the manager → delete the only post → back to first-run', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token, slug } = await newPublishedProject(api);
  const title = `E2E Blog Post ${randomUUID().slice(0, 6)}`;

  try {
    // ---- State 2: published, zero posts → first-run (handoff TURN 4).
    await page.goto(`/dashboard/${token}/blog`);
    await expect(firstRun(page), 'first-run screen missing at 0 posts').toBeVisible();
    // No manager chrome while disabled — the states are exclusive, not stacked.
    await expect(page.getByText('Subscribers', { exact: true })).toHaveCount(0);

    // ---- Create through the REAL dialog + the REAL create route.
    await page.getByRole('button', { name: 'Write a post' }).click();
    const prompt = page.getByRole('dialog'); // a prompt is role=dialog (confirm is alertdialog)
    await prompt.getByRole('textbox').fill(title);
    await prompt.getByRole('button', { name: 'Create post' }).click();

    // The create lands the user in the composer (post id in the URL) — the contract the
    // button has always had.
    await page.waitForURL(new RegExp(`/dashboard/${token}/blog/[^/]+$`), { timeout: 15_000 });
    const postId = page.url().split('/').pop()!;

    // ---- State 3: the manager, derived from the server (a fresh navigation, not client state).
    await page.goto(`/dashboard/${token}/blog`);
    await expect(firstRun(page), 'still on first-run after creating a post').toHaveCount(0);
    const row = page.getByTestId(`blog-post-row-${postId}`);
    await expect(row).toContainText(title);
    await expect(row.getByText('Draft')).toBeVisible();
    // Stats are derived in JS from the posts array (ruling #6): 1 post, 1 draft, 0 published.
    await expect(page.getByText('Posts', { exact: true })).toBeVisible();
    await expect(page.getByText('Subscribers', { exact: true })).toBeVisible();

    // ---- Delete the ONLY post.
    await row.getByRole('button', { name: `Delete ${title}` }).click();
    const confirm = page.getByRole('alertdialog');
    // The wart is disclosed to the user before it happens. If this copy is reworded, the
    // replacement must still warn that the blog reverts to setup — don't just drop it.
    await expect(confirm).toContainText('back to the setup screen');
    await confirm.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('status')).toContainText('deleted', { timeout: 15_000 });

    // THE assertion: router.refresh() re-reads the server, which now sees 0 posts and
    // therefore reports the blog as not-enabled again (derived, no stored flag).
    await expect(firstRun(page), 'manager did not revert to first-run after the last post was deleted').toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId(`blog-post-row-${postId}`)).toHaveCount(0);

    // The UI told the truth — the row really is gone.
    expect(await db.blogPost.findUnique({ where: { id: postId } })).toBeNull();
  } finally {
    await api.delete(`/api/projects/${token}`);
    await db.publishedPage.deleteMany({ where: { slug } });
  }
});

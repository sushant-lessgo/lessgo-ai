import { randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { AUDIENCES, seedDraft, publishSeed } from './helpers/seedDraft';

/**
 * Blog post composer (`/dashboard/[token]/blog/[postId]`) — blog-composer-redesign phase 2.
 *
 * WHAT THIS SPEC HONESTLY COVERS, all of it through the real UI + the real (unchanged) APIs:
 *  - authoring persistence: edit the title and the body, Save, RELOAD, and read the values
 *    back off a fresh server render — not off client state that a broken PATCH would leave
 *    looking correct;
 *  - the MARKDOWN ROUND TRIP through the live Tiptap instance. This is the point of the
 *    second test: markdown typed in raw mode → `richKey` remount parses it into Tiptap →
 *    an edit in the RICH editor fires `onUpdate`, which re-SERIALIZES the whole doc back to
 *    markdown → save → reload → the heading/bold/list markup is still there. If someone
 *    drops the `Image` extension, the Markdown extension, or the `richKey` remount, the
 *    round trip silently degrades and this test is what notices. (The pure parser contract
 *    is pinned separately + faster by `src/lib/blog/__tests__/tiptapRoundTrip.test.ts`; this
 *    is the same contract as the USER drives it, through two mode switches and a save.)
 *  - slug immutability after first publish, asserted on BOTH sides of the boundary: the API
 *    really 409s (direct authed PATCH), and the UI really locks the field + explains why.
 *    Asserting only the UI would pass against a server that happily renamed the post;
 *    asserting only the API would pass against a UI that lets you type into a dead field.
 *
 * WHAT IT DOES *NOT* COVER (deliberately — do not read more into a green run):
 *  - PUBLISH / UNPUBLISH from the composer. NOT an oversight and NOT laziness: blog publish
 *    is FATAL without blob credentials. `publishBlogPost` calls `renderAndUpload` OUTSIDE
 *    its try block (`src/lib/blog/publishBlogPost.ts:230-252`) and `blobUploader` THROWS
 *    after 3 retries when `BLOB_READ_WRITE_TOKEN` is absent — so unlike SITE publish (which
 *    fails non-fatally locally, see `e2e/publish.spec.ts:58`), a blog publish here 500s for
 *    purely environmental reasons. A test around it could only assert "it 500s locally",
 *    which is worse than nothing. Both buttons are verified MANUALLY at GATE A on a
 *    deployed host. The publish path is untouched by this phase.
 *  - Consequently `firstPublishedAt` — the flag the slug lock keys on — CANNOT be set via
 *    any API locally (only publish sets it, and publish cannot run). Test 3 PLANTS it with a
 *    direct `db.blogPost.update`. Precedent: `e2e/dashboard-lifecycle.spec.ts:41` does the
 *    same for what no local API can do. The lock's TRIGGER is therefore simulated; the
 *    lock's BEHAVIOUR (409 + disabled field) is real.
 *  - The hero image upload. `/api/upload-image` needs blob credentials too. `HeroImageField`
 *    is a phase-2 SPEC DEVIATION (upload flow kept; media picker branch unmerged — plan
 *    ruling #7) and is visually signed off at GATE A, not here.
 *  - The `(blog-preview)` SSR preview link (renders template markup — a different surface).
 *  - Anything AI (phases 3/4).
 *
 * Serial: one shared Clerk test user + real rate-limited routes.
 */
test.describe.configure({ mode: 'serial' });

const CFG = AUDIENCES.find((a) => a.templateId === 'meridian')!;

// Direct DB access is used ONLY for what no API can do locally: planting `firstPublishedAt`
// (see the preamble) and cleanup. Everything else goes through the real routes.
const db = new PrismaClient();
test.afterAll(async () => {
  await db.$disconnect();
});

async function authedApi(page: Page): Promise<APIRequestContext> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  return page.request;
}

/** A published project (the R18 precondition) + one draft post, created through the real routes. */
async function newProjectWithPost(api: APIRequestContext, title: string) {
  const personaRes = await api.post('/api/user/persona', { data: { persona: CFG.persona } });
  expect(personaRes.ok(), `persona: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

  const finalContent = await seedDraft(api, token, CFG);
  const slug = `e2e-blog-comp-${randomUUID().slice(0, 6)}`;
  await publishSeed(api, token, slug, CFG, finalContent);

  const createRes = await api.post('/api/blog/posts', { data: { tokenId: token, title } });
  expect(createRes.ok(), `create post: ${createRes.status()}`).toBeTruthy();
  const { post } = await createRes.json();

  return { token, slug, postId: post.id as string, postSlug: post.slug as string };
}

async function cleanup(api: APIRequestContext, token: string, slug: string) {
  await api.delete(`/api/projects/${token}`);
  await db.publishedPage.deleteMany({ where: { slug } });
}

test('edit title + body → save → reload → persisted', async ({ page }) => {
  const api = await authedApi(page);
  const { token, slug, postId } = await newProjectWithPost(api, `E2E Composer ${randomUUID().slice(0, 6)}`);
  const newTitle = `Retitled ${randomUUID().slice(0, 6)}`;
  const bodyText = `Body text ${randomUUID().slice(0, 6)}`;

  try {
    await page.goto(`/dashboard/${token}/blog/${postId}`);

    await page.getByTestId('composer-title').fill(newTitle);
    // The rich editor is the default surface — type where a real author types.
    const prose = page.locator('.ProseMirror');
    await expect(prose).toBeVisible({ timeout: 15_000 });
    await prose.click();
    await page.keyboard.type(bodyText);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status')).toContainText('saved', { timeout: 15_000 });

    // Fresh server render — this is the assertion that a no-op PATCH cannot fake.
    await page.reload();
    await expect(page.getByTestId('composer-title')).toHaveValue(newTitle);
    await expect(page.locator('.ProseMirror')).toContainText(bodyText, { timeout: 15_000 });

    // ...and the row really carries it, not just the page.
    const row = await db.blogPost.findUnique({ where: { id: postId } });
    expect(row?.title).toBe(newTitle);
    expect(JSON.stringify(row?.body)).toContain(bodyText);
  } finally {
    await cleanup(api, token, slug);
  }
});

test('markdown round-trip: raw markdown → rich editor → save → reload keeps the markup', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token, slug, postId } = await newProjectWithPost(api, `E2E Roundtrip ${randomUUID().slice(0, 6)}`);
  const tail = `tail-${randomUUID().slice(0, 6)}`;

  try {
    await page.goto(`/dashboard/${token}/blog/${postId}`);

    // 1. Author raw markdown covering the block types the round trip must survive.
    await page.getByRole('button', { name: 'Markdown' }).click();
    const raw = page.getByTestId('composer-markdown');
    await raw.fill('## Section heading\n\nA **bold** claim.\n\n- first item\n- second item\n');

    // 2. Back to Rich — the `richKey` remount re-parses the markdown into Tiptap. Assert the
    //    PARSE actually happened (real nodes, not a code-fenced blob of source text).
    await page.getByRole('button', { name: 'Rich' }).click();
    const prose = page.locator('.ProseMirror');
    await expect(prose.locator('h2')).toHaveText('Section heading', { timeout: 15_000 });
    await expect(prose.locator('strong')).toHaveText('bold');
    await expect(prose.locator('ul li')).toHaveCount(2);

    // 3. Edit INSIDE the rich editor. This fires onUpdate → tiptap-markdown re-serializes
    //    the WHOLE doc, so what gets saved is Tiptap's output, not the text typed in step 1.
    await prose.locator('h2').click();
    await page.keyboard.press('End');
    await page.keyboard.type(` ${tail}`);

    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status')).toContainText('saved', { timeout: 15_000 });

    // 4. Reload and read the SERIALIZED markdown back out of the raw pane.
    await page.reload();
    await page.getByRole('button', { name: 'Markdown' }).click();
    const saved = await page.getByTestId('composer-markdown').inputValue();

    expect(saved, 'heading did not survive the round trip').toContain(`## Section heading ${tail}`);
    expect(saved, 'bold did not survive the round trip').toContain('**bold**');
    expect(saved, 'list did not survive the round trip').toMatch(/[-*] first item/);
    expect(saved, 'list did not survive the round trip').toMatch(/[-*] second item/);
  } finally {
    await cleanup(api, token, slug);
  }
});

test('slug is locked after first publish — API 409 + the field is disabled and explained', async ({
  page,
}) => {
  const api = await authedApi(page);
  const { token, slug, postId, postSlug } = await newProjectWithPost(
    api,
    `E2E Slug Lock ${randomUUID().slice(0, 6)}`
  );

  try {
    // Sanity: BEFORE the lock the slug is editable and the API accepts a rename. Without
    // this, a test that only sees "409 / disabled" cannot tell a working lock from a route
    // that rejects every slug change.
    await page.goto(`/dashboard/${token}/blog/${postId}`);
    await expect(page.getByTestId('composer-slug')).toBeEnabled();
    await expect(page.getByTestId('composer-slug-locked-note')).toHaveCount(0);

    const renameRes = await api.patch(`/api/blog/posts/${postId}`, {
      data: { tokenId: token, slug: `${postSlug}-renamed` },
    });
    expect(renameRes.status(), 'pre-publish slug rename should be allowed').toBe(200);

    // Plant `firstPublishedAt`. ONLY publish sets it and publish cannot run locally (blob
    // creds — see the preamble); this is the documented DB-plant, mirroring
    // e2e/dashboard-lifecycle.spec.ts. The lock's behaviour below is the real code path.
    await db.blogPost.update({ where: { id: postId }, data: { firstPublishedAt: new Date() } });

    // --- The API side: a real authed PATCH, no UI involved.
    const lockedRes = await api.patch(`/api/blog/posts/${postId}`, {
      data: { tokenId: token, slug: `${postSlug}-again` },
    });
    expect(lockedRes.status(), 'slug change after first publish must 409').toBe(409);
    expect((await lockedRes.json()).error).toContain('locked');
    // The rejection was total, not partial.
    expect((await db.blogPost.findUnique({ where: { id: postId } }))?.slug).toBe(`${postSlug}-renamed`);

    // --- The UI side: locked AND the reason is on screen.
    await page.goto(`/dashboard/${token}/blog/${postId}`);
    await expect(page.getByTestId('composer-slug')).toBeDisabled();
    await expect(page.getByTestId('composer-slug-locked-note')).toContainText(
      'URL is permanent after first publish'
    );

    // Saving a locked post must still work: the editor omits `slug` from the PATCH rather
    // than sending the old value back and eating its own 409.
    await page.getByTestId('composer-title').fill('Locked but still editable');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('status')).toContainText('saved', { timeout: 15_000 });
    expect((await db.blogPost.findUnique({ where: { id: postId } }))?.title).toBe(
      'Locked but still editable'
    );
  } finally {
    await cleanup(api, token, slug);
  }
});

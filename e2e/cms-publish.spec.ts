import { test, expect } from '@playwright/test';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// CMS collections — placement → publish, end to end.
//
// ⚠️ OPPORTUNISTIC, NOT THE GATE. Locally Vercel Blob/KV are absent, so
// `/api/publish` returns 500 after the export throws (see e2e/publish.spec.ts,
// which documents the same tolerance) — this spec inherits that tolerance and is
// a bonus check on preview/CI-with-secrets. Every BINDING assertion for this
// feature lives in vitest:
//   • src/modules/cms/materializePublish.test.ts  (materialization + parity +
//     the byte-identical sanitize round-trip, rendered through the REAL
//     LandingPagePublishedRenderer)
//   • src/app/api/publish/publish.authz.test.ts   (the new ownership 403)
//
// Phase 4 EXTENDS this file (detail pages) rather than adding a second cms spec.

test.describe.configure({ mode: 'serial' });

test('a placed CMS collection publishes with its items', async ({ page }) => {
  const cfg = AUDIENCES.find((c) => c.templateId === 'meridian')!;
  const slug = 'e2e-cms-collection-smoke';
  const ITEM_TITLE = 'Deep Work E2E';

  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const api = page.request;

  const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
  expect(personaRes.ok(), `persona: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

  // 1. Seed a publish-ready draft (real routes, mock copy).
  const finalContent = await seedDraft(api, token, cfg);

  // 2. Create a collection + one item through the REAL /api/collections routes.
  const colRes = await api.post('/api/collections', {
    data: {
      tokenId: token,
      name: `E2E Books ${Date.now()}`,
      fieldSchema: [
        { id: 'title', name: 'Title', type: 'text_short' },
        { id: 'blurb', name: 'Blurb', type: 'text_long' },
      ],
      roles: { title: 'title' },
    },
  });
  expect(colRes.ok(), `create collection: ${colRes.status()}`).toBeTruthy();
  const { collection } = await colRes.json();

  const itemRes = await api.post(`/api/collections/${collection.id}/items`, {
    data: { tokenId: token, values: { title: ITEM_TITLE, blurb: 'Focus, deeply.' } },
  });
  expect(itemRes.ok(), `create item: ${itemRes.status()}`).toBeTruthy();

  // 3. Place the section — the persisted shape `addCmsSection` writes, THE DUAL
  //    PIN included (content[sid].layout is the published renderer's only layout
  //    source; sectionLayouts never reaches publish).
  const sectionId = 'cmscollection-e2e0001';
  finalContent.layout.sections.push(sectionId);
  (finalContent.layout as any).sectionLayouts = {
    ...((finalContent.layout as any).sectionLayouts || {}),
    [sectionId]: 'SharedCmsCollection',
  };
  finalContent.content[sectionId] = {
    id: sectionId,
    layout: 'SharedCmsCollection',
    elements: { collectionId: collection.id },
  } as any;

  const saveRes = await api.post('/api/saveDraft', {
    data: {
      tokenId: token,
      title: cfg.title,
      paletteId: cfg.paletteId,
      templateId: cfg.templateId,
      variantId: cfg.variantId,
      finalContent,
    },
  });
  expect(saveRes.ok(), `saveDraft: ${saveRes.status()}`).toBeTruthy();

  // 4. The editor loads the draft. NOTE: this step asserts ONLY that the page
  //    mounted (hero copy visible) — it does NOT assert the collection rendered.
  //    Nothing populates the `cmsData` runtime cache yet (`refreshCmsData` has no
  //    caller until the CMS panel lands), so a placed section shows the loading
  //    skeleton here. Editor-side collection rendering is covered by
  //    `src/modules/cms/render/parity.test.tsx` (injected-model path).
  await page.goto(`/edit/${token}`);
  await expect(page.getByText(cfg.heroText).first()).toBeVisible({ timeout: 45_000 });

  // 5. Publish from the editor header.
  const publishBtn = page.getByTestId('editor-publish-trigger');
  await expect(publishBtn).toBeEnabled({ timeout: 15_000 });
  await publishBtn.click();

  const modal = page.getByTestId('publish-confirm-card');
  await expect(modal).toBeVisible();
  await modal.getByTestId('publish-slug-input').fill(slug);
  await modal.getByTestId('publish-title-input').fill(cfg.title);

  const publishResPromise = page.waitForResponse(
    (r) => r.url().includes('/api/publish') && r.request().method() === 'POST',
    { timeout: 120_000 },
  );
  await modal.getByRole('button', { name: 'Publish now' }).click();

  const publishStatus = (await publishResPromise).status();
  // 200 in a Blob/KV-provisioned env, 500 locally — both leave a SERVING row.
  expect([200, 500], `/api/publish -> ${publishStatus}`).toContain(publishStatus);

  // 6. The published page carries the MATERIALIZED collection: the section is
  //    present (not silently dropped for want of a layout) and shows the item the
  //    editor never sent in the payload — proof the server materialized it.
  const pub = await page.goto(`/p/${slug}`);
  expect(pub?.status(), `/p/${slug} status`).toBeLessThan(400);
  await expect(page.locator('[data-cms-body]')).toHaveCount(1);
  await expect(page.getByText(ITEM_TITLE).first()).toBeVisible();

  // 7. Edit-only chrome must NOT ship to the published page.
  await expect(page.locator('[data-cms-manage]')).toHaveCount(0);
});

// ── phase 4: detail pages + slugs ───────────────────────────────────────────
//
// Same tolerance caveat as above. The BINDING versions of every assertion here
// (fan-out shape, leading-slash key AND href, dual pin, collision guard,
// toggle-off pruning, detail parity through the real published renderer) live in
// `src/modules/cms/materializePublish.test.ts`.

test('detailPages ON publishes an item page per item; OFF removes them', async ({ page }) => {
  const cfg = AUDIENCES.find((c) => c.templateId === 'meridian')!;
  const slug = 'e2e-cms-detail-smoke';
  const TITLE = 'Deep Work Detail';
  const BLURB = 'Focus, deeply, on a detail page.';

  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const api = page.request;

  const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
  expect(personaRes.ok(), `persona: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;

  const finalContent = await seedDraft(api, token, cfg);

  // Collection with detail pages ON.
  const colRes = await api.post('/api/collections', {
    data: {
      tokenId: token,
      name: 'E2E Detail Books',
      slug: `e2e-detail-${Date.now()}`,
      fieldSchema: [
        { id: 'title', name: 'Title', type: 'text_short' },
        { id: 'blurb', name: 'Blurb', type: 'text_long' },
      ],
      roles: { title: 'title' },
      detailPages: true,
    },
  });
  expect(colRes.ok(), `create collection: ${colRes.status()}`).toBeTruthy();
  const { collection } = await colRes.json();

  const mkItem = async (values: Record<string, unknown>) => {
    const res = await api.post(`/api/collections/${collection.id}/items`, {
      data: { tokenId: token, values },
    });
    expect(res.ok(), `create item: ${res.status()}`).toBeTruthy();
    return (await res.json()).item;
  };

  const item1 = await mkItem({ title: TITLE, blurb: BLURB });
  // DUPLICATE TITLE → the derived slug must be CLAMPED, never reused (two items
  // sharing a slug would silently collapse to one published page).
  const item2 = await mkItem({ title: TITLE, blurb: 'The second one.' });
  expect(item2.slug).not.toBe(item1.slug);

  // An EXPLICIT duplicate slug is rejected outright (409), not clamped.
  const dupRes = await api.post(`/api/collections/${collection.id}/items`, {
    data: { tokenId: token, slug: item1.slug, values: { title: 'Clash' } },
  });
  expect(dupRes.status(), 'explicit duplicate item slug').toBe(409);

  // Place the listing section (dual pin, as in the first test).
  const sectionId = 'cmscollection-e2e0002';
  finalContent.layout.sections.push(sectionId);
  finalContent.content[sectionId] = {
    id: sectionId,
    layout: 'SharedCmsCollection',
    elements: { collectionId: collection.id },
  } as any;

  const save = async () => {
    const res = await api.post('/api/saveDraft', {
      data: {
        tokenId: token,
        title: cfg.title,
        paletteId: cfg.paletteId,
        templateId: cfg.templateId,
        variantId: cfg.variantId,
        finalContent,
      },
    });
    expect(res.ok(), `saveDraft: ${res.status()}`).toBeTruthy();
  };
  await save();

  await page.goto(`/edit/${token}`);
  await expect(page.getByText(cfg.heroText).first()).toBeVisible({ timeout: 45_000 });

  const publish = async () => {
    const btn = page.getByTestId('editor-publish-trigger');
    await expect(btn).toBeEnabled({ timeout: 15_000 });
    await btn.click();
    const modal = page.getByTestId('publish-confirm-card');
    await expect(modal).toBeVisible();
    await modal.getByTestId('publish-slug-input').fill(slug);
    await modal.getByTestId('publish-title-input').fill(cfg.title);
    const resPromise = page.waitForResponse(
      (r) => r.url().includes('/api/publish') && r.request().method() === 'POST',
      { timeout: 120_000 },
    );
    await modal.getByRole('button', { name: 'Publish now' }).click();
    const status = (await resPromise).status();
    expect([200, 500], `/api/publish -> ${status}`).toContain(status);
  };
  await publish();

  // The item page serves at /p/<slug>/<collectionSlug>/<itemSlug> — the pinned
  // leading-slash path, derived server-side from the tables.
  const detailUrl = `/p/${slug}/${collection.slug}/${item1.slug}`;
  const detail = await page.goto(detailUrl);
  expect(detail?.status(), `${detailUrl} status`).toBeLessThan(400);
  await expect(page.locator('[data-cms-detail-body]')).toHaveCount(1);
  await expect(page.getByText(BLURB).first()).toBeVisible();

  // …and the listing card links to it with the SAME leading-slash href.
  await page.goto(`/p/${slug}`);
  await expect(page.locator(`a.lg-cms__titlelink[href="/${collection.slug}/${item1.slug}"]`))
    .toHaveCount(1);

  // Toggle detail pages OFF → republish → the item page is gone.
  const offRes = await api.patch(`/api/collections/${collection.id}`, {
    data: { tokenId: token, detailPages: false },
  });
  expect(offRes.ok(), `toggle off: ${offRes.status()}`).toBeTruthy();

  await page.goto(`/edit/${token}`);
  await expect(page.getByText(cfg.heroText).first()).toBeVisible({ timeout: 45_000 });
  await publish();

  const gone = await page.goto(detailUrl);
  expect(gone?.status(), `${detailUrl} after toggle-off`).toBeGreaterThanOrEqual(400);
});

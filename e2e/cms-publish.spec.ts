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

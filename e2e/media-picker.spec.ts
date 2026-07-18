import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { AUDIENCES, seedDraft } from './helpers/seedDraft';

// media-library-picker PHASE 4 — the picker wired into ImageToolbar's Replace action.
//
// Registered on the `authed` project in playwright.config.ts (pre-registered by phase 3).
// Run just this file:  E2E_PORT=3021 npx playwright test e2e/media-picker.spec.ts --project=authed
//
// Two legs:
//   - Library (REAL): pre-upload an asset → Replace → pick the tile → the hero image's
//     src changes and the edit persists (saveDraft + reload).
//   - Stock (INTERCEPTED): /api/images/search has NO mock mode (503 without PEXELS_API_KEY,
//     otherwise LIVE + rate-limited Pexels), so it is page.route()-stubbed. The intercepted
//     request BODIES are what we assert on: curated-on-mount, palette-ENRICHED free-text
//     query, palette-ENRICHED category query — the three StockPhotosPanel behaviors the
//     picker had to carry forward. A silent drop of enrichment is exactly the kind of
//     regression no other test would catch.
//
// The expected enriched strings are HARDCODED: the Playwright runner has no `@/` alias, so
// getServiceImageQuery cannot be imported. The fixture is deterministic (seedDraft posts
// templateId 'hearth' + paletteId 'terracotta' explicitly).
test.describe.configure({ mode: 'serial' });

const prisma = new PrismaClient();

const HAS_AUTH_ENV = Boolean(
  process.env.E2E_CLERK_USER_EMAIL &&
    process.env.E2E_CLERK_USER_PASSWORD &&
    process.env.CLERK_SECRET_KEY,
);

// Hearth is the only image-bearing hero among the seed fixtures (PetalFramedHero carries
// data-image-id; Meridian's hero has no image element at all).
const cfg = AUDIENCES.find((a) => a.templateId === 'hearth')!;

// getServiceImageQuery(q, undefined, palettePhrase) =
//   `${q} ${SERVICE_IMAGE_KEYWORDS.default} ${PALETTE_IMAGE_KEYWORDS.terracotta}`
const SERVICE_SUFFIX = 'warm professional craft natural light'; // audience/service/imageKeywords.ts → default
const PALETTE_SUFFIX = 'warm earthy natural'; // templates/hearth/imageKeywords.ts → terracotta
const enriched = (q: string) => `${q} ${SERVICE_SUFFIX} ${PALETTE_SUFFIX}`;

const STOCK_PICK_URL = 'https://example.com/e2e-stock-proxied.webp';

const createdTokens = new Set<string>();

// Both tests share ONE seeded project (serial mode). Seeding runs the rate-limited
// generation routes, and a second seed usually costs a ~30s 429 back-off — which also
// ages the shared Clerk session for every spec that runs after this file.
let sharedToken: string | null = null;

/** Fresh authed session + a seeded Hearth draft. Reuses the project across tests. */
async function ensureSeededProject(page: Page): Promise<string> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  if (sharedToken) return sharedToken;

  const api = page.request;
  const personaRes = await api.post('/api/user/persona', { data: { persona: cfg.persona } });
  expect(personaRes.ok(), `persona ${cfg.persona}: ${personaRes.status()}`).toBeTruthy();

  const startRes = await api.get('/api/start');
  expect(startRes.ok(), `/api/start: ${startRes.status()}`).toBeTruthy();
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop()!;
  expect(token, `bad token from ${url}`).toBeTruthy();
  createdTokens.add(token);

  await seedDraft(api, token, cfg);
  sharedToken = token;
  return token;
}

test.afterAll(async () => {
  for (const token of createdTokens) {
    // Test-only HARD delete (the product's DELETE is a soft-hide, forever) + the dev-fs
    // upload dir, so repeat runs don't litter the worktree/DB.
    await prisma.mediaAsset.deleteMany({ where: { tokenId: token } }).catch(() => {});
    await fs
      .rm(path.join(process.cwd(), 'public', 'uploads', token), { recursive: true, force: true })
      .catch(() => {});
  }
  await prisma.$disconnect();
});

async function uploadFixture(request: APIRequestContext, tokenId: string, name: string) {
  const buffer = await sharp({
    create: { width: 320, height: 200, channels: 3, background: { r: 200, g: 60, b: 30 } },
  })
    .png()
    .toBuffer();
  const res = await request.post('/api/upload-image', {
    multipart: { tokenId, file: { name, mimeType: 'image/png', buffer } },
  });
  const json = await res.json().catch(() => ({}));
  expect(res.ok(), `upload -> ${res.status()} ${JSON.stringify(json)}`).toBeTruthy();
  return json.url as string;
}

const heroImage = (page: Page) => page.locator('[data-image-id$="-hero-image"]').first();

async function openPicker(page: Page, action: 'Replace' | 'Stock Photos') {
  await heroImage(page).click();
  const btn = page.getByRole('button', { name: action, exact: true }).first();
  await expect(btn, `${action} action never appeared in the image toolbar`).toBeVisible({
    timeout: 15_000,
  });
  await btn.click();
  await expect(page.getByTestId('media-picker')).toBeVisible({ timeout: 15_000 });
}

async function heroBackground(page: Page) {
  return heroImage(page).evaluate((el) => (el as HTMLElement).style.backgroundImage);
}

test('picker replaces the hero image from the Library tab and the edit persists', async ({
  page,
}) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  const token = await ensureSeededProject(page);

  // The library needs a row to show: upload through the REAL route (the phase-2 seam
  // writes the MediaAsset row, /api/media lists it).
  const assetUrl = await uploadFixture(page.request, token, 'picker-library-fixture.png');

  await page.goto(`/edit/${token}`);
  await expect(heroImage(page), 'hero image never rendered in the editor').toBeVisible({
    timeout: 60_000,
  });

  await openPicker(page, 'Replace');

  const tile = page.locator(`[data-testid="media-picker-asset"][data-asset-url="${assetUrl}"]`);
  await expect(tile, 'the uploaded asset was not listed in the Library tab').toBeVisible({
    timeout: 15_000,
  });

  // Arm the autosave listener BEFORE the pick: replaceImage → updateElementContent →
  // autosave. No extra save() call exists in the picker path, so this proves the write
  // really reaches the server on its own.
  const savePromise = page.waitForResponse(
    (r) =>
      r.url().includes('/api/saveDraft') &&
      r.request().method() === 'POST' &&
      (r.request().postData() || '').includes(assetUrl),
    { timeout: 60_000 },
  );

  await tile.click();
  await expect(page.getByTestId('media-picker'), 'picker should close on pick').toBeHidden();

  await expect
    .poll(() => heroBackground(page), {
      timeout: 15_000,
      message: 'hero background never changed to the picked asset',
    })
    .toContain(assetUrl);

  const saveRes = await savePromise;
  expect(saveRes.status(), 'saveDraft did not return 200').toBe(200);

  await page.reload();
  await expect(heroImage(page)).toBeVisible({ timeout: 60_000 });
  await expect
    .poll(() => heroBackground(page), { timeout: 15_000, message: 'pick lost after reload' })
    .toContain(assetUrl);
});

test('Stock tab: curated on open, palette-enriched search + category, pick goes through the proxy', async ({
  page,
}) => {
  test.skip(!HAS_AUTH_ENV, 'authed env (E2E_CLERK_* / CLERK_SECRET_KEY) not configured');

  const searchBodies: any[] = [];

  // NEVER hit live Pexels from e2e (ruling 7).
  await page.route('**/api/images/search', async (route) => {
    searchBodies.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        photos: [
          {
            id: '424242',
            url: 'https://example.com/e2e-thumb.jpg',
            alt: 'e2e fixture photo',
            width: 800,
            height: 600,
            avgColor: '#cc4422',
            author: 'E2E',
            authorUrl: 'https://example.com/author',
            downloadUrl: 'https://example.com/e2e-large.jpg',
            tags: [],
            attribution: 'Photo by E2E on Pexels',
          },
        ],
      }),
    });
  });

  // The proxy (blob copy) is stubbed too — the REAL Pexels→proxy→blob path is on the
  // founder's manual pass. What matters here: the pick goes through /api/proxy-image and
  // the PROXIED url (never the Pexels thumb) lands on the page.
  let proxyBody: any = null;
  await page.route('**/api/proxy-image', async (route) => {
    proxyBody = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, url: STOCK_PICK_URL, cached: false }),
    });
  });

  const token = await ensureSeededProject(page);

  await page.goto(`/edit/${token}`);
  await expect(heroImage(page)).toBeVisible({ timeout: 60_000 });

  await openPicker(page, 'Stock Photos');

  // (a) curated-on-mount — the tab opens with results, not an empty grid.
  await expect
    .poll(() => searchBodies.length, { timeout: 15_000, message: 'no search fired on tab open' })
    .toBeGreaterThan(0);
  expect(searchBodies[0]).toMatchObject({ searchType: 'curated', per_page: 12 });
  await expect(page.getByTestId('media-picker-stock-photo').first()).toBeVisible();

  // Match by searchType rather than by index: React StrictMode double-invokes the
  // curated-on-mount effect in dev, so the request COUNT is not deterministic.
  const bodyOfType = (type: string) => searchBodies.filter((b) => b.searchType === type).pop();

  // (b) free-text search is ENRICHED with the service hint + the terracotta palette phrase.
  await page.getByTestId('media-picker-stock-search').fill('mountains');
  await expect
    .poll(() => bodyOfType('search'), { timeout: 15_000, message: 'search fired no request' })
    .toBeTruthy();
  const searchBody = bodyOfType('search');
  expect(searchBody.query, 'free-text query must be palette-enriched, not raw').toBe(
    enriched('mountains'),
  );
  expect(searchBody.query).not.toBe('mountains');

  // (c) category buttons are enriched the same way.
  await page.getByTestId('media-picker-category-business').click();
  await expect
    .poll(() => bodyOfType('business'), { timeout: 15_000, message: 'category fired no request' })
    .toBeTruthy();
  expect(bodyOfType('business').query, 'category query must be palette-enriched').toBe(
    enriched('business'),
  );

  // (d) pick → proxy → the proxied (our-blob) url lands on the page.
  await page.getByTestId('media-picker-stock-photo').first().click();
  await expect
    .poll(() => heroBackground(page), {
      timeout: 20_000,
      message: 'hero background never changed to the proxied stock url',
    })
    .toContain(STOCK_PICK_URL);
  expect(proxyBody, 'pick must go through /api/proxy-image, never hotlink').toMatchObject({
    pexelsPhotoId: '424242',
    tokenId: token,
  });
});

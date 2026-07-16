import { test, expect, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// media-library-picker PHASE 3 — /api/media (list / soft-delete / restore) + ownership.
//
// Registered on the `authed` project in playwright.config.ts — a spec that isn't listed
// there matches NO project and silently never runs. Run just this file:
//   npx playwright test e2e/media.spec.ts --project=authed
//
// Covers the phase-2 seam too: uploading through /api/upload-image must yield a registry
// row that GET /api/media lists (incl. blurDataUrl).
//
// Cleanup discipline: in dev without a BLOB token, uploads write REAL files to
// public/uploads/<token>/ and REAL rows to the dev DB on every run. afterAll hard-deletes
// both (hard delete is test-only — the product's DELETE is soft, forever).
test.describe.configure({ mode: 'serial' });

const prisma = new PrismaClient();

interface MediaAssetDto {
  id: string;
  url: string;
  source: string;
  blurDataUrl: string | null;
  bytes: number;
  format: string;
  alt: string | null;
}

const createdTokens = new Set<string>();
let foreignToken: string | null = null;
let foreignUserId: string | null = null;

/** Create a real, owned project via the app's own route and return its token. */
async function createProject(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/');
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user), null, { timeout: 30_000 });
  const startRes = await page.request.get('/api/start');
  if (!startRes.ok()) return null;
  const { url } = await startRes.json();
  const token = new URL(url).pathname.split('/').filter(Boolean).pop() ?? null;
  if (token) createdTokens.add(token);
  return token;
}

async function uploadImage(request: APIRequestContext, tokenId: string, name: string) {
  const buffer = await sharp({
    create: { width: 320, height: 200, channels: 3, background: { r: 10, g: 120, b: 200 } },
  })
    .png()
    .toBuffer();

  const res = await request.post('/api/upload-image', {
    multipart: {
      tokenId,
      file: { name, mimeType: 'image/png', buffer },
    },
  });
  const json = await res.json().catch(() => ({}));
  expect(res.ok(), `upload -> ${res.status()} ${JSON.stringify(json)}`).toBeTruthy();
  return json as { url: string; metadata?: { assetId?: string; blurDataUrl?: string | null } };
}

async function listMedia(
  request: APIRequestContext,
  tokenId: string,
  includeHidden = false
): Promise<MediaAssetDto[]> {
  const res = await request.get(
    `/api/media?tokenId=${tokenId}${includeHidden ? '&includeHidden=1' : ''}`
  );
  expect(res.ok(), `GET /api/media -> ${res.status()}`).toBeTruthy();
  const { assets } = await res.json();
  return assets;
}

test.afterAll(async () => {
  for (const token of createdTokens) {
    // Test-only HARD delete: the product's DELETE is a soft-hide and must stay that way.
    await prisma.mediaAsset.deleteMany({ where: { tokenId: token } }).catch(() => {});
    await fs
      .rm(path.join(process.cwd(), 'public', 'uploads', token), { recursive: true, force: true })
      .catch(() => {});
  }
  if (foreignToken) {
    await prisma.mediaAsset.deleteMany({ where: { tokenId: foreignToken } }).catch(() => {});
    await prisma.project.deleteMany({ where: { tokenId: foreignToken } }).catch(() => {});
    await prisma.token.deleteMany({ where: { value: foreignToken } }).catch(() => {});
  }
  if (foreignUserId) {
    await prisma.user.deleteMany({ where: { id: foreignUserId } }).catch(() => {});
  }
  await prisma.$disconnect();
});

test.describe('/api/media lifecycle (phase 3)', () => {
  test('upload → listed with blur → soft-delete hides → restore brings it back', async ({
    page,
    request,
  }) => {
    const token = await createProject(page);
    test.skip(!token, '/api/start failed — cannot build a project fixture');

    // Registry-row-on-upload: the phase-2 seam is what puts the row there; /api/media reads it.
    const uploaded = await uploadImage(request, token!, 'library-fixture.png');

    let assets = await listMedia(request, token!);
    const asset = assets.find((a) => a.url === uploaded.url);
    expect(asset, `uploaded url not listed: ${JSON.stringify(assets)}`).toBeTruthy();
    expect(asset!.source).toBe('upload');
    expect(asset!.format).toBe('webp');
    expect(asset!.bytes).toBeGreaterThan(0);
    expect(asset!.blurDataUrl).toMatch(/^data:image\/webp;base64,/);

    // DELETE = soft-delete: gone from the default list…
    const del = await request.delete('/api/media', {
      data: { tokenId: token, assetId: asset!.id },
    });
    expect(del.ok(), `DELETE -> ${del.status()}`).toBeTruthy();

    assets = await listMedia(request, token!);
    expect(assets.some((a) => a.id === asset!.id)).toBe(false);

    // …but NEVER destroyed (workEndtoEnd §8a): still there with includeHidden.
    const hidden = await listMedia(request, token!, true);
    expect(hidden.some((a) => a.id === asset!.id)).toBe(true);

    // POST restore + alt.
    const restore = await request.post('/api/media', {
      data: { tokenId: token, assetId: asset!.id, restore: true, alt: 'a blue rectangle' },
    });
    expect(restore.ok(), `POST restore -> ${restore.status()}`).toBeTruthy();

    assets = await listMedia(request, token!);
    const restored = assets.find((a) => a.id === asset!.id);
    expect(restored, 'restored asset must reappear in the library').toBeTruthy();
    expect(restored!.alt).toBe('a blue rectangle');
  });

  test('rejects a body with nothing to update', async ({ page, request }) => {
    const token = await createProject(page);
    test.skip(!token, '/api/start failed — cannot build a project fixture');

    const res = await request.post('/api/media', { data: { tokenId: token, assetId: 'nope' } });
    expect(res.status()).toBe(400);
  });
});

test.describe('/api/media ownership (phase 3)', () => {
  test('another user’s token → 403', async ({ page, request }) => {
    const token = await createProject(page);
    test.skip(!token, '/api/start failed — cannot build a project fixture');

    // Seed a project owned by somebody else. The single Clerk session can't sign in as a
    // second user, so the foreign owner is created directly (test-only) and torn down.
    foreignToken = `e2emediaforeign${randomUUID().replace(/-/g, '')}`.slice(0, 40);
    const foreignUser = await prisma.user.create({
      data: { clerkId: `e2e_foreign_${randomUUID()}` },
    });
    foreignUserId = foreignUser.id;
    await prisma.token.create({ data: { value: foreignToken } });
    await prisma.project.create({
      data: { tokenId: foreignToken, userId: foreignUser.id, title: 'e2e foreign project' },
    });

    const list = await request.get(`/api/media?tokenId=${foreignToken}`);
    expect(list.status(), 'must not list another user’s media').toBe(403);

    const del = await request.delete('/api/media', {
      data: { tokenId: foreignToken, assetId: 'whatever' },
    });
    expect(del.status(), 'must not hide another user’s media').toBe(403);

    const post = await request.post('/api/media', {
      data: { tokenId: foreignToken, assetId: 'whatever', restore: true },
    });
    expect(post.status()).toBe(403);
  });

  test('unknown token → 404', async ({ request }) => {
    const res = await request.get('/api/media?tokenId=definitely-not-a-real-token-xyz');
    expect(res.status()).toBe(404);
  });

  test('missing tokenId → 400', async ({ request }) => {
    const res = await request.get('/api/media');
    expect(res.status()).toBe(400);
  });
});

test.describe('/api/media unauthenticated', () => {
  // Drop the saved Clerk session for this block only.
  test.use({ storageState: { cookies: [], origins: [] } });

  // /api/media is NOT in middleware's isPublicRoute, so `auth.protect()` rejects the
  // request before the handler runs — and Clerk answers API requests with 404, not 401.
  // The handler's own `!clerkId → 401` therefore only ever fires if that list changes;
  // it stays as defence in depth. What matters here: anonymous callers get NOTHING.
  test('no session → rejected (Clerk protect: 404, never a 200)', async ({ request }) => {
    const res = await request.get('/api/media?tokenId=some-token');
    expect([401, 404], `anonymous callers must be rejected, got ${res.status()}`).toContain(
      res.status()
    );
  });
});

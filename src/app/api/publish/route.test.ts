// publish-trust M3: POST /api/publish used to return 200 "Page published
// successfully" even when the static export threw (deliberate fall-through, since
// removed). That lie hid dead KV routes on a first publish and stale bytes on a
// republish, and contradicted the row the same catch writes as 'failed'.
//
// These tests pin the honest contract deterministically (no e2e, no Blob/KV):
//   1. export throws            → 500 { error }, no `url`, blob rolled back, row 'failed'
//   2. KV write throws          → same 500 + 'failed' row (KV sub-catch rethrows)
//   3. everything succeeds      → 200 { message, url }   (regression pin)
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@clerk/nextjs/server', () => ({ auth: vi.fn(async () => ({ userId: 'user_1' })) }));

vi.mock('@sentry/nextjs', () => ({ setUser: vi.fn(), captureException: vi.fn() }));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn(), upsert: vi.fn() },
    publishedPage: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), count: vi.fn() },
    token: { upsert: vi.fn() },
  },
}));

vi.mock('@/lib/rateLimit', () => ({ withPublishRateLimit: (h: any) => h }));

vi.mock('@/lib/validation', () => ({
  PublishSchema: { safeParse: (b: any) => ({ success: true, data: b }) },
  sanitizeForLogging: (x: any) => x,
  sanitizeSeo: (x: any) => x,
}));

vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: any, status = 200) => ({ __body: body, __status: status }),
  validateSlug: () => ({ valid: true }),
  sanitizeHtmlContent: (x: any) => x,
  verifyProjectAccess: vi.fn(async () => true),
}));

vi.mock('@/lib/planManager', () => ({
  getUserPlan: vi.fn(async () => ({ tier: 'FREE' })),
  checkLimit: vi.fn(async () => ({ allowed: true, limit: 1, current: 0 })),
  hasTrackingPixels: vi.fn(async () => false),
  getPlanConfig: vi.fn(() => ({ features: { removeBranding: false } })),
  PlanTier: {},
}));

vi.mock('@/lib/admin', () => ({ isAdmin: () => false, logAdminOverride: vi.fn() }));

vi.mock('@/lib/staticExport/injectChrome', () => ({ injectChromeIntoPage: vi.fn() }));

vi.mock('@/lib/i18n/localeSlugCollision', () => ({ findLocaleSubpageCollision: () => null }));

// generateStaticHTML is reached via renderPublishedExport (the route's actual
// dynamic-import seam); both are mocked so either can be made to throw.
vi.mock('@/lib/staticExport/htmlGenerator', () => ({ generateStaticHTML: vi.fn(async () => '<html></html>') }));

const renderPublishedExport = vi.fn();
vi.mock('@/lib/staticExport/renderPublishedExport', () => ({ renderPublishedExport }));
vi.mock('@/lib/staticExport/versionCleanup', () => ({ cleanupOldVersions: vi.fn(async () => {}) }));
vi.mock('@/lib/blog/publishBlogPost', () => ({ syncBlogAfterSitePublish: vi.fn(async () => {}) }));

const del = vi.fn(async () => {});
vi.mock('@vercel/blob', () => ({ del }));

const atomicPublishWithRetry = vi.fn(async () => ({ attempts: 1, verified: true }));
vi.mock('@/lib/routing/kvRoutes', () => ({
  atomicPublishWithRetry,
  writeRedirect: vi.fn(async () => {}),
  writeSlugForHost: vi.fn(async () => {}),
  removeRedirect: vi.fn(async () => {}),
}));

import { prisma } from '@/lib/prisma';
import { POST } from './route';

const db = prisma as any;

const BLOB_KEY = 'pages/page_1/3/index.html';

function makeReq(body: any) {
  return {
    method: 'POST',
    url: 'http://localhost/api/publish',
    headers: { get: (k: string) => (k.toLowerCase() === 'host' ? 'localhost:3000' : null) },
    json: async () => body,
  } as any;
}

const BODY = {
  slug: 'my-page',
  title: 'My Page',
  content: { layout: {}, content: {} },
  themeValues: {},
  tokenId: 'tok_1',
  inputText: 'hi',
  analyticsEnabled: false,
};

/** The row returned for every publishedPage.findUnique in the happy/failed paths. */
const PAGE_ROW = { id: 'page_1', userId: 'user_1', publishState: 'draft', customDomain: null, customDomainStatus: null, customDomainLiveAt: null };

function failedUpdateCalls() {
  return db.publishedPage.update.mock.calls.filter((c: any[]) => c[0]?.data?.publishState === 'failed');
}

describe('/api/publish — honest failure on static-export error (publish-trust M3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.project.findUnique.mockResolvedValue({ id: 'proj_1', audienceType: 'product', templateId: 'meridian', variantId: null, paletteId: null, themeValues: {}, content: {} });
    db.project.upsert.mockResolvedValue({});
    db.token.upsert.mockResolvedValue({});
    db.publishedPage.findUnique.mockResolvedValue(PAGE_ROW);
    db.publishedPage.update.mockResolvedValue(PAGE_ROW);
    db.publishedPage.create.mockResolvedValue(PAGE_ROW);
    db.publishedPage.count.mockResolvedValue(0);
    renderPublishedExport.mockResolvedValue({ version: 3, blobKey: BLOB_KEY, blobUrl: 'https://blob/x', sizeBytes: 1024, extraRoutes: {} });
    atomicPublishWithRetry.mockResolvedValue({ attempts: 1, verified: true } as any);
  });

  it('case 1: generateStaticHTML/export throws → 500 { error }, no url, row failed (no blob to roll back)', async () => {
    renderPublishedExport.mockRejectedValue(new Error('render blew up'));

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(500);
    expect(typeof res.__body.error).toBe('string');
    expect(res.__body.error.length).toBeGreaterThan(0);
    expect(res.__body.url).toBeUndefined();
    expect(res.__body.message).toBeUndefined();

    // Failure DURING generation self-cleans inside the helper: no blobKey recorded yet.
    expect(del).not.toHaveBeenCalled();

    const failed = failedUpdateCalls();
    expect(failed.length).toBe(1);
    expect(failed[0][0].data.publishError).toContain('render blew up');
  });

  it('case 1b: throw AFTER a successful upload → uploaded blob key is rolled back via del()', async () => {
    // Blob is uploaded (blobKey recorded), then the KV import/write path throws.
    atomicPublishWithRetry.mockRejectedValue(new Error('kv down'));

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(500);
    expect(del).toHaveBeenCalledWith(BLOB_KEY);
  });

  it('case 2: KV write throws (KV sub-catch path) → 500 + failed write', async () => {
    atomicPublishWithRetry.mockRejectedValue(new Error('kv down'));

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(500);
    expect(res.__body.url).toBeUndefined();

    // KV sub-catch writes 'failed' with the KV detail, then rethrows; the outer
    // export catch writes 'failed' again (documented, deliberate double-set).
    const failed = failedUpdateCalls();
    expect(failed.length).toBeGreaterThanOrEqual(1);
    expect(failed.some((c: any[]) => String(c[0].data.publishError).includes('kv down'))).toBe(true);
  });

  it('case 3: happy path → 200 { message, url } (regression pin)', async () => {
    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(200);
    expect(res.__body.message).toBe('Page published successfully');
    expect(typeof res.__body.url).toBe('string');
    expect(res.__body.url).toContain('my-page');
    expect(res.__body.error).toBeUndefined();
    expect(failedUpdateCalls().length).toBe(0);
    expect(del).not.toHaveBeenCalled();
  });
});

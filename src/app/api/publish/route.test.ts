// publish-trust M3: POST /api/publish used to return 200 "Page published
// successfully" even when the static export threw (deliberate fall-through, since
// removed). That lie hid dead KV routes on a first publish and stale bytes on a
// republish, and contradicted the row the same catch writes as 'failed'.
//
// These tests pin the honest contract deterministically (no e2e, no Blob/KV):
//   1. export throws            → 500 { error }, no `url`, blob rolled back, row 'failed'
//   2. KV write throws          → same 500 + 'failed' row (KV sub-catch rethrows)
//   3. everything succeeds      → 200 { message, url }   (regression pin)
//
// cms-collections phase 4 adds the CMS materializer's error mapping:
//   4. CmsPathCollisionError    → 409 naming the colliding PATH (actionable)
//   5. any OTHER materializer error → still 500 (fail-closed, catch stays narrow)
//   6. CmsFanOutLimitError      → 409 naming the COLLECTION + the limit (the
//      detail-page fan-out cap; uncapped this is an opaque function timeout)
//   7. CmsTotalFanOutLimitError → 409 naming the TOTAL + the limit. THIS is the
//      class that actually guards the timeout: the budget belongs to the whole
//      REQUEST, so many individually-legal collections still blow it and only a
//      global total can catch that. Unmapped, it would 500 as "Internal Server
//      Error" — indistinguishable from the opaque failure the cap replaced.
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

// NOTE: this factory REPLACES the whole '@/lib/security' module — any export the
// route imports but this mock omits resolves as `undefined` and blows up at call
// time. Keep it in sync with the real export surface when adding to security.ts.
vi.mock('@/lib/security', () => ({
  createSecureResponse: (body: any, status = 200) => ({ __body: body, __status: status }),
  validateSlug: () => ({ valid: true }),
  verifyProjectAccess: vi.fn(async () => true),
  // Mirrors the ProjectOwnerResult success branch (owner path) in src/lib/security.ts.
  // The route only branches on `.ok`, so this is a pass-through gate for these tests.
  assertProjectOwner: vi.fn(async () => ({
    ok: true, isDemo: false, adminOverride: false, userRecord: { id: 'u1' }, project: null,
  })),
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

// The route's real export seam is `renderPublishedExport` (route.ts :344/:372) — it does
// NOT import `generateStaticHTML` itself, so mocking htmlGenerator here would be inert.
// Throw from the real seam instead.
const renderPublishedExport = vi.fn();
vi.mock('@/lib/staticExport/renderPublishedExport', () => ({ renderPublishedExport }));
vi.mock('@/lib/staticExport/versionCleanup', () => ({ cleanupOldVersions: vi.fn(async () => {}) }));
vi.mock('@/lib/blog/publishBlogPost', () => ({ syncBlogAfterSitePublish: vi.fn(async () => {}) }));

// CMS materializer: only `materializeCmsForPublish` is stubbed. `importOriginal`
// keeps the REAL `CmsPathCollisionError` class in the module graph — the route
// narrows with `instanceof`, so a hand-built fake class would make the test pass
// against a catch-all and fail against the real (correct) narrow catch. That
// inversion is exactly the bug this file exists to prevent.
// `vi.hoisted` (not a plain const): this factory is evaluated by the direct
// `import { CmsPathCollisionError }` below, which resolves BEFORE the module body's
// const initializers run — a plain const TDZ-crashes there. The other mocks in this
// file get away with plain consts only because nothing imports their module directly.
const materializeCmsForPublish = vi.hoisted(() => vi.fn(async () => 0));
vi.mock('@/modules/cms/materializePublish', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/modules/cms/materializePublish')>()),
  materializeCmsForPublish,
}));

const del = vi.fn(async () => {});
vi.mock('@vercel/blob', () => ({ del }));

const atomicPublishWithRetry = vi.fn(async () => ({ attempts: 1, verified: true }));
vi.mock('@/lib/routing/kvRoutes', () => ({
  atomicPublishWithRetry,
  writeRedirect: vi.fn(async () => {}),
  writeSlugForHost: vi.fn(async () => {}),
  removeRedirect: vi.fn(async () => {}),
}));

import * as Sentry from '@sentry/nextjs';
import { prisma } from '@/lib/prisma';
import {
  CmsPathCollisionError,
  CmsFanOutLimitError,
  CmsTotalFanOutLimitError,
  MAX_CMS_DETAIL_PAGES_TOTAL,
  MAX_CMS_DETAIL_PAGES_PER_COLLECTION,
} from '@/modules/cms/materializePublish';
import { POST } from './route';

const db = prisma as any;

/** The exact user-facing string the route returns from the export catch (contract). */
const FAIL_MESSAGE = 'Publish failed. Your changes were saved — please try publishing again.';

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
    materializeCmsForPublish.mockResolvedValue(0 as any);
  });

  it('case 1: static export throws → 500 { error }, no url, row failed (no blob to roll back)', async () => {
    renderPublishedExport.mockRejectedValue(new Error('render blew up'));

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(500);
    // Pin the EXACT string, not `typeof === 'string'`: status + typeof would also pass on the
    // outer fatal catch's generic 500 ('Internal Server Error'), i.e. it wouldn't prove we came
    // through the honest export-failure path at all. The message is also the user-facing
    // contract (`preview/[token]/page.tsx` → setPublishError → SlugModal `publish-error`).
    expect(res.__body.error).toBe(FAIL_MESSAGE);
    expect(res.__body.url).toBeUndefined();
    expect(res.__body.message).toBeUndefined();

    // Spec M3 constraint: Sentry capture is PRESERVED behavior — an honest 500 must still
    // report the underlying cause (the body deliberately leaks no internals).
    expect(Sentry.captureException).toHaveBeenCalled();

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

// cms-collections phase 4. A detail-page path collision is the one CMS failure the
// user can actually FIX, and only if we tell them which path collided. Before this
// mapping it escaped to the outer fatal catch as a bare 500 'Internal Server Error'
// — the real message reached Sentry and nobody else.
describe('/api/publish — CMS detail-path collision surfaces as an actionable 409', () => {
  const COLLIDING_PATH = '/products/widget-9';

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
    materializeCmsForPublish.mockResolvedValue(0 as any);
  });

  it('case 4: CmsPathCollisionError → 409 whose body NAMES the colliding path', async () => {
    materializeCmsForPublish.mockRejectedValue(new CmsPathCollisionError(COLLIDING_PATH) as any);

    const res: any = await POST(makeReq(BODY));

    // 409 = the route's existing conflict vocabulary ('Slug already taken').
    expect(res.__status).toBe(409);
    // THE point of the mapping: the user must learn WHICH path collided, or they
    // cannot act. Assert the path itself, not merely that some error string exists.
    expect(res.__body.error).toContain(COLLIDING_PATH);
    expect(res.__body.error).not.toBe('Internal Server Error');
    expect(res.__body.url).toBeUndefined();

    // Fail-closed BEFORE any side effect: nothing published, nothing written.
    expect(renderPublishedExport).not.toHaveBeenCalled();
    expect(db.publishedPage.update).not.toHaveBeenCalled();
    expect(db.publishedPage.create).not.toHaveBeenCalled();
    expect(db.project.upsert).not.toHaveBeenCalled();
  });

  // The fan-out cap is the brake that placement-coupling used to provide for
  // free. Uncapped, an over-size collection does not 409 — it exhausts the
  // function timeout and the user sees nothing actionable at all.
  it('case 6: CmsFanOutLimitError → 409 NAMING the collection and the limit', async () => {
    const over = MAX_CMS_DETAIL_PAGES_PER_COLLECTION + 240;
    materializeCmsForPublish.mockRejectedValue(new CmsFanOutLimitError('Books', over) as any);

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(409);
    // Actionability: WHICH collection, HOW many it has, and WHAT the limit is.
    expect(res.__body.error).toContain('Books');
    expect(res.__body.error).toContain(String(over));
    expect(res.__body.error).toContain(String(MAX_CMS_DETAIL_PAGES_PER_COLLECTION));
    expect(res.__body.error).not.toBe('Internal Server Error');
    expect(res.__body.url).toBeUndefined();

    // Fail-closed BEFORE any side effect — nothing published, nothing written.
    expect(renderPublishedExport).not.toHaveBeenCalled();
    expect(db.publishedPage.update).not.toHaveBeenCalled();
    expect(db.publishedPage.create).not.toHaveBeenCalled();
    expect(db.project.upsert).not.toHaveBeenCalled();
  });

  // The GLOBAL cap is the one that actually prevents the timeout — a
  // per-collection cap cannot, since ten legal collections still blow the
  // request budget. If this class were left out of the route's `instanceof`
  // narrowing it would fall to the fatal catch and surface as a bare 500,
  // i.e. exactly the unactionable failure the cap exists to replace.
  it('case 7: CmsTotalFanOutLimitError → 409 NAMING the total and the limit', async () => {
    const total = MAX_CMS_DETAIL_PAGES_TOTAL + 137;
    materializeCmsForPublish.mockRejectedValue(new CmsTotalFanOutLimitError(total) as any);

    const res: any = await POST(makeReq(BODY));

    expect(res.__status).toBe(409);
    // Actionability: HOW many pages it would create, WHAT the limit is, and the
    // remedy — no single collection is at fault, so the total has to reach them.
    expect(res.__body.error).toContain(String(total));
    expect(res.__body.error).toContain(String(MAX_CMS_DETAIL_PAGES_TOTAL));
    expect(res.__body.error).not.toBe('Internal Server Error');
    expect(res.__body.url).toBeUndefined();

    // Fail-closed BEFORE any side effect — nothing published, nothing written.
    expect(renderPublishedExport).not.toHaveBeenCalled();
    expect(db.publishedPage.update).not.toHaveBeenCalled();
    expect(db.publishedPage.create).not.toHaveBeenCalled();
    expect(db.project.upsert).not.toHaveBeenCalled();
  });

  it('case 5: a NON-collision materializer error still 500s (the catch stays narrow)', async () => {
    materializeCmsForPublish.mockRejectedValue(new Error('collection read failed') as any);

    const res: any = await POST(makeReq(BODY));

    // Falls through to the outer fatal catch — unchanged behaviour, no leak of
    // internals. A catch-all in the route would have turned this into a 409.
    expect(res.__status).toBe(500);
    expect(res.__body.error).toBe('Internal Server Error');
    expect(res.__body.error).not.toContain('collection read failed');
    expect(Sentry.captureException).toHaveBeenCalled();
    expect(renderPublishedExport).not.toHaveBeenCalled();
  });
});

// language-settings phase 6 — publish PERSISTENCE of the locale declaration.
//
// Before this phase `PublishedPage.content` carried neither `localeConfig` nor
// `localeContent`: the row was written from the request `content`, and the locale
// data was only ever handed to the static export. The `/p/{slug}` SSR renderer and
// the verify-dns go-live regen read PublishedPage.content — so they had no data
// source at all. These cases pin (a) the bilingual round-trip, (b) that ONE object
// feeds both the row write and the export (no persisted-vs-rendered drift), and
// (c) the monolingual zero-diff contract: NO new keys on the row, ever.
describe('/api/publish — locale persistence onto PublishedPage.content (phase 6)', () => {
  const LOCALE_CONFIG = { locales: ['en', 'nl'], defaultLocale: 'en', switcherStyle: 'dropdown' };
  const OVERLAY = { nl: { 'hero-1': { headline: 'Hallo<script>alert(1)</script>' } } };

  const projectRow = (projectContent: any) => ({
    id: 'proj_1',
    audienceType: 'product',
    templateId: 'meridian',
    variantId: null,
    paletteId: null,
    themeValues: {},
    content: projectContent,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    db.project.upsert.mockResolvedValue({});
    db.token.upsert.mockResolvedValue({});
    db.publishedPage.findUnique.mockResolvedValue(PAGE_ROW);
    db.publishedPage.update.mockResolvedValue(PAGE_ROW);
    db.publishedPage.create.mockResolvedValue(PAGE_ROW);
    db.publishedPage.count.mockResolvedValue(0);
    renderPublishedExport.mockResolvedValue({ version: 3, blobKey: BLOB_KEY, blobUrl: 'https://blob/x', sizeBytes: 1024, extraRoutes: {} });
    atomicPublishWithRetry.mockResolvedValue({ attempts: 1, verified: true } as any);
    materializeCmsForPublish.mockResolvedValue(0 as any);
  });

  /** The `content` the row was written with (update path — `existing` is found). */
  function writtenContent(): any {
    const call = db.publishedPage.update.mock.calls.find((c: any[]) => c[0]?.data?.content !== undefined);
    return call?.[0]?.data?.content;
  }

  it('bilingual project ⇒ the persisted row carries localeConfig + the SANITIZED overlay', async () => {
    db.project.findUnique.mockResolvedValue(
      projectRow({ localeConfig: LOCALE_CONFIG, finalContent: { localeContent: OVERLAY } }),
    );

    const res: any = await POST(makeReq(BODY));
    expect(res.__status).toBe(200);

    const stored = writtenContent();
    expect(stored.localeConfig).toEqual(LOCALE_CONFIG);
    // The overlay is a verbatim-import path: it must go through sanitizeLocaleOverlay
    // BEFORE it is stored (the SSR renderer reads this map straight out of the row).
    expect(stored.localeContent).toBeDefined();
    const storedHeadline = stored.localeContent.nl['hero-1'].headline;
    expect(storedHeadline).toContain('Hallo');
    expect(storedHeadline).not.toContain('<script>');
  });

  it('the row write and the static export get the SAME object (no persisted-vs-rendered drift)', async () => {
    db.project.findUnique.mockResolvedValue(
      projectRow({ localeConfig: LOCALE_CONFIG, finalContent: { localeContent: OVERLAY } }),
    );

    await POST(makeReq(BODY));

    const exported = renderPublishedExport.mock.calls[0][0] as any;
    expect(exported.content).toBe(writtenContent());
    expect(exported.localeConfig).toEqual(LOCALE_CONFIG);
  });

  it('creating a NEW page persists the locale keys too (create path, not just update)', async () => {
    db.publishedPage.findUnique
      .mockResolvedValueOnce(null)          // `existing` lookup → create branch
      .mockResolvedValue(PAGE_ROW);         // subsequent lookups (pageId, guards)
    db.project.findUnique.mockResolvedValue(
      projectRow({ localeConfig: LOCALE_CONFIG, finalContent: { localeContent: OVERLAY } }),
    );

    await POST(makeReq(BODY));

    const created = db.publishedPage.create.mock.calls[0][0].data.content;
    expect(created.localeConfig).toEqual(LOCALE_CONFIG);
    expect(created.localeContent).toBeDefined();
  });

  it('MONOLINGUAL project ⇒ the persisted content gains NO new keys (zero-diff pin)', async () => {
    db.project.findUnique.mockResolvedValue(projectRow({}));

    await POST(makeReq(BODY));

    const stored = writtenContent();
    expect('localeConfig' in stored).toBe(false);
    expect('localeContent' in stored).toBe(false);
    // Presence-gated: it is the request content object itself, untouched.
    expect(stored).toBe((renderPublishedExport.mock.calls[0][0] as any).content);
    expect((renderPublishedExport.mock.calls[0][0] as any).localeConfig).toBeNull();
  });

  it('declared config but NO overlay yet ⇒ localeConfig persists, localeContent key is absent', async () => {
    db.project.findUnique.mockResolvedValue(projectRow({ localeConfig: LOCALE_CONFIG }));

    await POST(makeReq(BODY));

    const stored = writtenContent();
    expect(stored.localeConfig).toEqual(LOCALE_CONFIG);
    expect('localeContent' in stored).toBe(false);
  });
});

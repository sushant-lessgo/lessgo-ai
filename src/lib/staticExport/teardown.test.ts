// Teardown (DD1–DD4): the inverse of the publish pipeline. Everything external is
// mocked (prisma / KV / blob / Sentry / revalidatePath) — this pins:
//   • the FULL route-key set (the `removeRoutes` root-only trap): every (host × path)
//     across ALL versions incl. subpages/locales + a legacy blobKey-only version + blog,
//   • that teardown NEVER uploads a blob (the B3 regression guard),
//   • KV → blob → DB ordering and the DB-finalize-last invariant,
//   • `currentVersionId` nulled BEFORE the version rows are deleted,
//   • failure mid-blob → stays 'unpublishing', no finalize, Sentry capture, retry completes,
//   • the custom-domain guard short-circuits with zero writes.
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Vitest runs jsdom (client condition), so `server-only`'s guard module throws on import.
// Stub it — the guard exists for the Next bundler, not for this unit test.
vi.mock('server-only', () => ({}));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    publishedPage: { findUnique: vi.fn(), update: vi.fn() },
    publishedPageVersion: { findMany: vi.fn(), deleteMany: vi.fn() },
    blogPost: { findMany: vi.fn(), updateMany: vi.fn() },
    project: { updateMany: vi.fn() },
  },
}));
vi.mock('@vercel/blob', () => ({ del: vi.fn().mockResolvedValue(undefined) }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@sentry/nextjs', () => ({ captureMessage: vi.fn(), captureException: vi.fn() }));
vi.mock('@/lib/routing/kvRoutes', () => ({ deleteRoutes: vi.fn(), removeRoutes: vi.fn() }));
// Deterministic host set regardless of env (LESSGO_PUBLISH_HOST).
vi.mock('@/lib/domains/hosts', () => ({
  publishSubdomainHosts: (slug: string) => [`${slug}.lessgo.site`, `${slug}.lessgo.ai`],
}));
// B3 guard: mocked ONLY so the test can assert teardown never reaches for them.
vi.mock('@/lib/staticExport/blobUploader', () => ({ uploadStaticSite: vi.fn() }));
vi.mock('@/lib/staticExport/htmlGenerator', () => ({ generateStaticHTML: vi.fn() }));
vi.mock('@/lib/blog/publishBlogPost', () => ({
  unpublishBlogPost: vi.fn(),
  syncBlogAfterSitePublish: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import * as Sentry from '@sentry/nextjs';
import { deleteRoutes, removeRoutes } from '@/lib/routing/kvRoutes';
import { uploadStaticSite } from '@/lib/staticExport/blobUploader';
import { generateStaticHTML } from '@/lib/staticExport/htmlGenerator';
import { unpublishBlogPost, syncBlogAfterSitePublish } from '@/lib/blog/publishBlogPost';
import { teardownPublishedPage } from './teardown';

const db = prisma as any;
const blobDel = del as unknown as ReturnType<typeof vi.fn>;
const kvDeleteRoutes = deleteRoutes as unknown as ReturnType<typeof vi.fn>;
const kvRemoveRoutes = removeRoutes as unknown as ReturnType<typeof vi.fn>;
const revalidate = revalidatePath as unknown as ReturnType<typeof vi.fn>;
const captureMessage = Sentry.captureMessage as unknown as ReturnType<typeof vi.fn>;

const PAGE = {
  id: 'page_1',
  slug: 'acme',
  projectId: 'proj_1',
  customDomain: null,
  publishState: 'published',
  blogIndex: { version: 'blog-1', blobKey: 'blobs/blog-index.html', blobUrl: 'https://b/i' },
};

// v1 = legacy single-page (blobKey only, no metadata.blobs) → contributes '/'.
const VERSION_LEGACY = { id: 'v1', blobKey: 'pages/page_1/v1/index.html', metadata: null };
// v2 = older multi-page: has an /about subpage the CURRENT version dropped. Its KV keys
// are still live — the union across versions is what makes them get deleted.
const VERSION_OLD = {
  id: 'v2',
  blobKey: 'pages/page_1/v2/index.html',
  metadata: {
    blobs: [
      { path: '/', blobKey: 'pages/page_1/v2/index.html' },
      { path: '/about', blobKey: 'pages/page_1/v2/about.html' },
    ],
  },
};
// v3 = current: root + /pricing + an /nl locale doc.
const VERSION_CURRENT = {
  id: 'v3',
  blobKey: 'pages/page_1/v3/index.html',
  metadata: {
    blobs: [
      { path: '/', blobKey: 'pages/page_1/v3/index.html' },
      { path: '/pricing', blobKey: 'pages/page_1/v3/pricing.html' },
      { path: '/nl', blobKey: 'pages/page_1/v3/nl.html' },
    ],
  },
};

const POSTS = [
  { id: 'post_1', slug: 'hello', blobKey: 'blobs/blog-hello.html' },
  { id: 'post_2', slug: 'world', blobKey: 'blobs/blog-world.html' },
];

function arm(overrides: { page?: any; versions?: any[]; posts?: any[] } = {}) {
  db.publishedPage.findUnique.mockResolvedValue(
    overrides.page === undefined ? PAGE : overrides.page
  );
  db.publishedPage.update.mockResolvedValue({});
  db.publishedPageVersion.findMany.mockResolvedValue(
    overrides.versions ?? [VERSION_LEGACY, VERSION_OLD, VERSION_CURRENT]
  );
  db.publishedPageVersion.deleteMany.mockResolvedValue({ count: 3 });
  db.blogPost.findMany.mockResolvedValue(overrides.posts ?? POSTS);
  db.blogPost.updateMany.mockResolvedValue({ count: 2 });
  db.project.updateMany.mockResolvedValue({});
  blobDel.mockResolvedValue(undefined);
  kvDeleteRoutes.mockResolvedValue(undefined);
  kvRemoveRoutes.mockResolvedValue(undefined);
}

/** All (host,path) pairs handed to deleteRoutes, as "host path" strings. */
function deletedKeys(): string[] {
  return kvDeleteRoutes.mock.calls
    .flatMap(([keys]: [Array<{ host: string; path: string }>]) => keys)
    .map((k) => `${k.host} ${k.path}`)
    .sort();
}

const publishStateWrites = () =>
  db.publishedPage.update.mock.calls
    .map(([args]: [any]) => args.data.publishState)
    .filter(Boolean);

beforeEach(() => {
  vi.clearAllMocks();
  arm();
});

describe('teardownPublishedPage — guard (D1)', () => {
  it('blocks when a custom domain is attached, with ZERO writes', async () => {
    arm({ page: { ...PAGE, customDomain: 'acme.com', publishState: 'published' } });

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({ status: 'blocked', reason: 'custom_domain' });
    expect(db.publishedPage.update).not.toHaveBeenCalled();
    expect(kvDeleteRoutes).not.toHaveBeenCalled();
    expect(kvRemoveRoutes).not.toHaveBeenCalled();
    expect(blobDel).not.toHaveBeenCalled();
    expect(db.publishedPageVersion.deleteMany).not.toHaveBeenCalled();
    expect(db.project.updateMany).not.toHaveBeenCalled();
  });

  it('blocks regardless of customDomainStatus (pending/failed still hold the slot)', async () => {
    arm({ page: { ...PAGE, customDomain: 'acme.com', customDomainStatus: 'pending_dns' } });
    const result = await teardownPublishedPage('page_1', { mode: 'delete' });
    expect(result).toEqual({ status: 'blocked', reason: 'custom_domain' });
    expect(kvRemoveRoutes).not.toHaveBeenCalled();
  });

  it('is a no-op when the page row is already gone (idempotent retry)', async () => {
    arm({ page: null });
    const result = await teardownPublishedPage('page_1', { mode: 'delete' });
    expect(result).toEqual({ status: 'done', mode: 'delete' });
    expect(db.publishedPage.update).not.toHaveBeenCalled();
    expect(blobDel).not.toHaveBeenCalled();
  });
});

describe('teardownPublishedPage — route enumeration (DD2)', () => {
  it('deletes every non-root (host × path) key across ALL versions + blog, then the root trio', async () => {
    await teardownPublishedPage('page_1', { mode: 'unpublish' });

    // Union: /about (dropped by the current version) + /pricing + /nl + blog keys,
    // on BOTH hosts. The legacy version contributes '/' (handled by removeRoutes).
    expect(deletedKeys()).toEqual(
      [
        'acme.lessgo.ai /about',
        'acme.lessgo.ai /blog',
        'acme.lessgo.ai /blog/hello',
        'acme.lessgo.ai /blog/world',
        'acme.lessgo.ai /nl',
        'acme.lessgo.ai /pricing',
        'acme.lessgo.site /about',
        'acme.lessgo.site /blog',
        'acme.lessgo.site /blog/hello',
        'acme.lessgo.site /blog/world',
        'acme.lessgo.site /nl',
        'acme.lessgo.site /pricing',
      ].sort()
    );
    // Root ('/' + redirect + slug-for) goes through removeRoutes for both hosts.
    expect(kvRemoveRoutes).toHaveBeenCalledWith(['acme.lessgo.site', 'acme.lessgo.ai']);
    // Root is never passed to deleteRoutes (removeRoutes owns it).
    expect(deletedKeys().some((k) => k.endsWith(' /'))).toBe(false);
  });

  it('includes /blog when an index blob exists but no post is published', async () => {
    arm({ posts: [] });
    await teardownPublishedPage('page_1', { mode: 'unpublish' });
    expect(deletedKeys()).toContain('acme.lessgo.site /blog');
    expect(deletedKeys().some((k) => k.includes('/blog/'))).toBe(false);
  });

  it('omits blog keys entirely for a site with no blog', async () => {
    arm({ page: { ...PAGE, blogIndex: null }, posts: [] });
    await teardownPublishedPage('page_1', { mode: 'unpublish' });
    expect(deletedKeys().some((k) => k.includes('/blog'))).toBe(false);
  });

  it('handles a legacy blobKey-only version alone (root-only site)', async () => {
    arm({ versions: [VERSION_LEGACY], page: { ...PAGE, blogIndex: null }, posts: [] });
    await teardownPublishedPage('page_1', { mode: 'unpublish' });
    expect(kvDeleteRoutes).toHaveBeenCalledWith([]);
    expect(kvRemoveRoutes).toHaveBeenCalledWith(['acme.lessgo.site', 'acme.lessgo.ai']);
    expect(blobDel).toHaveBeenCalledWith('pages/page_1/v1/index.html');
  });
});

describe('teardownPublishedPage — ISR invalidation (DD1 3b)', () => {
  it('revalidates root, privacy, every subpath and every blog path', async () => {
    await teardownPublishedPage('page_1', { mode: 'unpublish' });

    const paths = revalidate.mock.calls.map(([p]: [string]) => p).sort();
    expect(paths).toEqual(
      [
        '/p/acme',
        '/p/acme/privacy',
        '/p/acme/about',
        '/p/acme/pricing',
        '/p/acme/nl',
        '/p/acme/blog',
        '/p/acme/blog/hello',
        '/p/acme/blog/world',
      ].sort()
    );
  });
});

describe('teardownPublishedPage — blobs + versions (DD3 / DD2b)', () => {
  it('deletes every version blob (incl. legacy fallback) + blog post & index blobs', async () => {
    await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(blobDel.mock.calls.map(([k]: [string]) => k).sort()).toEqual(
      [
        'pages/page_1/v1/index.html', // legacy: metadata-less version.blobKey fallback
        'pages/page_1/v2/index.html',
        'pages/page_1/v2/about.html',
        'pages/page_1/v3/index.html',
        'pages/page_1/v3/pricing.html',
        'pages/page_1/v3/nl.html',
        'blobs/blog-hello.html',
        'blobs/blog-world.html',
        'blobs/blog-index.html',
      ].sort()
    );
  });

  it('nulls currentVersionId BEFORE deleting the version rows', async () => {
    const order: string[] = [];
    db.publishedPage.update.mockImplementation(async ({ data }: any) => {
      if (data.currentVersionId === null) order.push('null-pointer');
      return {};
    });
    db.publishedPageVersion.deleteMany.mockImplementation(async () => {
      order.push('delete-versions');
      return { count: 3 };
    });

    await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(order).toEqual(['null-pointer', 'delete-versions']);
  });

  it('NEVER uploads a blob and never calls unpublishBlogPost (B3 regression guard)', async () => {
    // `unpublishBlogPost` re-renders + UPLOADS a fresh index blob for every non-last post
    // (an N-post teardown would upload N−1 blobs it then deletes) and its deletes are
    // best-effort `safeDel` — invisible to the strict-failure contract. Teardown enumerates
    // blog blobs itself and only ever deletes.
    await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(uploadStaticSite).not.toHaveBeenCalled();
    expect(generateStaticHTML).not.toHaveBeenCalled();
    expect(unpublishBlogPost).not.toHaveBeenCalled();
    expect(syncBlogAfterSitePublish).not.toHaveBeenCalled();
    // ...yet the blog blobs ARE gone.
    const deleted = blobDel.mock.calls.map(([k]: [string]) => k);
    expect(deleted).toContain('blobs/blog-index.html');
    expect(deleted).toContain('blobs/blog-hello.html');
  });
});

describe('teardownPublishedPage — ordering + DB finalize (DD1 / DD4)', () => {
  it('writes the "unpublishing" marker before any external deletion', async () => {
    const order: string[] = [];
    db.publishedPage.update.mockImplementation(async ({ data }: any) => {
      if (data.publishState) order.push(`state:${data.publishState}`);
      return {};
    });
    kvDeleteRoutes.mockImplementation(async () => void order.push('kv'));
    kvRemoveRoutes.mockImplementation(async () => void order.push('kv-root'));
    blobDel.mockImplementation(async () => void order.push('blob'));

    await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(order[0]).toBe('state:unpublishing');
    // KV before blob before the finalizing DB write.
    expect(order.indexOf('kv')).toBeLessThan(order.indexOf('blob'));
    expect(order.indexOf('blob')).toBeLessThan(order.indexOf('state:draft'));
    expect(order[order.length - 1]).toBe('state:draft');
  });

  it('unpublish finalize: draft + publishError cleared + blogIndex DbNull, isPublished untouched', async () => {
    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({ status: 'done', mode: 'unpublish' });
    const finalize = db.publishedPage.update.mock.calls
      .map(([a]: [any]) => a)
      .find((a: any) => a.data.publishState === 'draft');
    expect(finalize.where).toEqual({ id: 'page_1' });
    expect(finalize.data.publishState).toBe('draft');
    expect(finalize.data.publishError).toBeNull();
    expect(finalize.data.blogIndex).toBeDefined(); // Prisma.DbNull
    expect(finalize.data).not.toHaveProperty('isPublished'); // DD0b: never written
    expect(finalize.data).not.toHaveProperty('lastPublishAt'); // kept as history
    // Project demoted; blog posts demoted keeping firstPublishedAt (slug stays locked).
    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'proj_1' },
      data: { status: 'draft' },
    });
    expect(db.blogPost.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['post_1', 'post_2'] } },
      data: { status: 'draft', publishedVersion: null, blobKey: null, blobUrl: null },
    });
  });

  it('delete mode stops after cleanup: no finalize, no demote (caller owns DD11)', async () => {
    const result = await teardownPublishedPage('page_1', { mode: 'delete' });

    expect(result).toEqual({ status: 'done', mode: 'delete' });
    expect(kvRemoveRoutes).toHaveBeenCalled();
    expect(blobDel).toHaveBeenCalled();
    expect(db.publishedPageVersion.deleteMany).toHaveBeenCalled();
    expect(publishStateWrites()).toEqual(['unpublishing']); // never finalized to draft
    expect(db.blogPost.updateMany).not.toHaveBeenCalled();
    expect(db.project.updateMany).not.toHaveBeenCalled();
  });
});

describe('teardownPublishedPage — failure semantics (DD1)', () => {
  it('KV failure: stays unpublishing, no blob/DB damage, Sentry captured', async () => {
    kvDeleteRoutes.mockRejectedValue(new Error('kv down'));

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({
      status: 'retryable_failure',
      step: 'kv_routes',
      error: 'kv down',
    });
    expect(blobDel).not.toHaveBeenCalled();
    expect(publishStateWrites()).toEqual(['unpublishing']);
    expect(captureMessage).toHaveBeenCalledWith(
      'teardown_incomplete',
      expect.objectContaining({ extra: expect.objectContaining({ step: 'kv_routes' }) })
    );
  });

  it('mid-blob failure: leaves unpublishing, does NOT finalize, captures Sentry', async () => {
    blobDel.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('blob 500'));

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({
      status: 'retryable_failure',
      step: 'blob_delete',
      error: 'blob 500',
    });
    // The invariant: never 'draft' with external state remaining.
    expect(publishStateWrites()).toEqual(['unpublishing']);
    expect(db.publishedPageVersion.deleteMany).not.toHaveBeenCalled();
    expect(db.project.updateMany).not.toHaveBeenCalled();
    expect(captureMessage).toHaveBeenCalledWith(
      'teardown_incomplete',
      expect.objectContaining({
        level: 'error',
        extra: expect.objectContaining({ pageId: 'page_1', slug: 'acme', step: 'blob_delete' }),
      })
    );
  });

  it('retry after a failure resumes and completes (every step is idempotent)', async () => {
    blobDel.mockRejectedValueOnce(new Error('blob 500'));
    const first = await teardownPublishedPage('page_1', { mode: 'unpublish' });
    expect(first.status).toBe('retryable_failure');

    // Re-invoked on the stuck row: marker already set → no redundant state write.
    vi.clearAllMocks();
    arm({ page: { ...PAGE, publishState: 'unpublishing' } });

    const second = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(second).toEqual({ status: 'done', mode: 'unpublish' });
    expect(publishStateWrites()).toEqual(['draft']);
    expect(kvRemoveRoutes).toHaveBeenCalled();
    expect(captureMessage).not.toHaveBeenCalled();
  });

  it('db finalize failure: retryable, page still unpublishing (never a lying draft)', async () => {
    db.project.updateMany.mockRejectedValue(new Error('pg down'));

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({
      status: 'retryable_failure',
      step: 'db_finalize',
      error: 'pg down',
    });
    expect(publishStateWrites()).toEqual(['unpublishing']);
  });

  // `PublishedPage.projectId` has no FK (DD11), so it can point at a Project that is already
  // gone. With `project.update` that threw P2025 → 'db_finalize' retryable → and every retry
  // re-ran the same failing statement, wedging the row at 'unpublishing' FOREVER. `updateMany`
  // matches zero rows instead, so teardown converges on the first attempt.
  it('dangling projectId (project already deleted) still finalizes to draft — no wedge', async () => {
    // updateMany's real behaviour against a non-existent id: matches nothing, no throw.
    db.project.updateMany.mockResolvedValue({ count: 0 });

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({ status: 'done', mode: 'unpublish' });
    expect(db.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'proj_1' },
      data: { status: 'draft' },
    });
    expect(publishStateWrites()).toEqual(['unpublishing', 'draft']);
    expect(captureMessage).not.toHaveBeenCalled();
  });
});

describe('teardownPublishedPage — honest failure labels', () => {
  it('marker-write failure reports step "marker" at warning level (nothing was changed)', async () => {
    db.publishedPage.update.mockRejectedValueOnce(new Error('pg down'));

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    // NOT 'kv_routes': no KV call has happened at this point.
    expect(result).toEqual({ status: 'retryable_failure', step: 'marker', error: 'pg down' });
    expect(kvDeleteRoutes).not.toHaveBeenCalled();
    expect(kvRemoveRoutes).not.toHaveBeenCalled();
    expect(blobDel).not.toHaveBeenCalled();
    // Nothing to clean up ⇒ not an incomplete teardown ⇒ not error-level.
    expect(captureMessage).toHaveBeenCalledWith(
      'teardown_incomplete',
      expect.objectContaining({
        level: 'warning',
        tags: expect.objectContaining({ step: 'marker' }),
      })
    );
  });

  it('enumeration-read failure reports step "db_read" at error level (marker already written)', async () => {
    db.publishedPageVersion.findMany.mockRejectedValue(new Error('pg read timeout'));

    const result = await teardownPublishedPage('page_1', { mode: 'unpublish' });

    expect(result).toEqual({
      status: 'retryable_failure',
      step: 'db_read',
      error: 'pg read timeout',
    });
    expect(kvDeleteRoutes).not.toHaveBeenCalled();
    // The marker IS written → row parked non-serving with KV/blobs live = incomplete teardown.
    expect(publishStateWrites()).toEqual(['unpublishing']);
    expect(captureMessage).toHaveBeenCalledWith(
      'teardown_incomplete',
      expect.objectContaining({ level: 'error', tags: expect.objectContaining({ step: 'db_read' }) })
    );
  });
});

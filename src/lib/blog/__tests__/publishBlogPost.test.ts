// Blog (Phase 1): the per-post publish/unpublish pipeline. Everything external
// is mocked (prisma / blob / KV / HTML generation) — this pins the ORDERING
// (upload → KV → DB → stale-delete), the rollback (KV failure deletes the new
// blobs and leaves the post row untouched), the blog-* version prefix that keeps
// blobs invisible to versionCleanup, and the per-host route fan-out including
// the durable custom-domain gate.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findUnique: vi.fn() },
    blogPost: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    publishedPage: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock('@vercel/blob', () => ({ del: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/staticExport/htmlGenerator', () => ({
  generateStaticHTML: vi.fn().mockResolvedValue({ html: '<html/>', metadata: { size: 10, cssVariableCount: 0 } }),
}));
vi.mock('@/lib/staticExport/blobUploader', () => ({ uploadStaticSite: vi.fn() }));
vi.mock('@/lib/routing/kvRoutes', () => ({ setRoutes: vi.fn(), deleteRoutes: vi.fn() }));
vi.mock('@/lib/email/sendBlogPostNotification', () => ({ sendBlogPostNotification: vi.fn().mockResolvedValue(undefined) }));

import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { uploadStaticSite } from '@/lib/staticExport/blobUploader';
import { setRoutes, deleteRoutes } from '@/lib/routing/kvRoutes';
import { sendBlogPostNotification } from '@/lib/email/sendBlogPostNotification';
import { publishBlogPost, unpublishBlogPost, BlogPublishError } from '../publishBlogPost';

const notifyMock = sendBlogPostNotification as unknown as ReturnType<typeof vi.fn>;

/** The notify call is detached (un-awaited dynamic import) — flush microtasks. */
const flush = () => new Promise((r) => setTimeout(r, 0));

const db = prisma as any;
const upload = uploadStaticSite as unknown as ReturnType<typeof vi.fn>;
const kvSet = setRoutes as unknown as ReturnType<typeof vi.fn>;
const kvDel = deleteRoutes as unknown as ReturnType<typeof vi.fn>;
const blobDel = del as unknown as ReturnType<typeof vi.fn>;

const PROJECT = { id: 'proj_1' };
const POST = {
  id: 'post_1',
  projectId: 'proj_1',
  slug: 'hello',
  title: 'Hello',
  excerpt: 'x',
  heroImage: null,
  body: { format: 'markdown', markdown: '# Hi' },
  seo: null,
  status: 'draft',
  publishedAt: null,
  firstPublishedAt: null,
  publishedVersion: null,
  blobKey: 'pages/page_1/blog-old/blog/hello.html', // previous revision (republish case)
  blobUrl: 'https://blob/old-post',
};
const PAGE = {
  id: 'page_1',
  userId: 'user_1',
  slug: 'acme',
  title: 'Acme',
  content: { layout: { sections: [], theme: { t: 1 } }, content: {}, forms: {} },
  audienceType: 'service',
  templateId: 'hearth',
  variantId: null,
  paletteId: null,
  analyticsEnabled: false,
  publishState: 'published', // DD0b: loadContext filters on publishState, not isPublished
  customDomain: 'acme.com',
  customDomainStatus: 'failed', // durable gate: liveAt below still counts
  customDomainLiveAt: new Date('2026-01-01'),
  blogIndex: { version: 'blog-old', blobKey: 'pages/page_1/blog-old/blog/index.html', blobUrl: 'https://blob/old-index' },
};

function arm(overrides: { post?: any; page?: any } = {}) {
  db.project.findUnique.mockResolvedValue(PROJECT);
  db.blogPost.findUnique.mockResolvedValue({ ...POST, ...(overrides.post || {}) });
  db.publishedPage.findFirst.mockResolvedValue(overrides.page === undefined ? PAGE : overrides.page);
  db.blogPost.findMany.mockResolvedValue([]);
  db.blogPost.update.mockResolvedValue({});
  db.publishedPage.update.mockResolvedValue({});
  let n = 0;
  upload.mockImplementation(async ({ version, pageName }: any) => ({
    version,
    blobKey: `pages/page_1/${version}/${pageName}.html`,
    blobUrl: `https://blob/new-${++n}`,
    sizeBytes: 10,
  }));
  kvSet.mockResolvedValue(undefined);
  kvDel.mockResolvedValue(undefined);
}

beforeEach(() => {
  vi.clearAllMocks();
  arm();
});

describe('publishBlogPost', () => {
  it('uploads post + index under one blog-* version, then KV, then DB, then stale delete', async () => {
    const result = await publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://lessgo.ai' });

    // Two uploads, shared blog-prefixed version, correct page names.
    expect(upload).toHaveBeenCalledTimes(2);
    const [postCall, indexCall] = upload.mock.calls.map((c: any[]) => c[0]);
    expect(postCall.version).toMatch(/^blog-/);
    expect(indexCall.version).toBe(postCall.version);
    expect(postCall.pageName).toBe('blog/hello');
    expect(indexCall.pageName).toBe('blog/index');

    // KV fan-out: 3 hosts (2 subdomains + custom domain via durable gate) × 2 paths.
    expect(kvSet).toHaveBeenCalledTimes(1);
    const entries = kvSet.mock.calls[0][0];
    const keys = entries.map((e: any) => `${e.host}:${e.path}`).sort();
    expect(keys).toEqual(
      [
        'acme.lessgo.site:/blog/hello', 'acme.lessgo.site:/blog',
        'acme.lessgo.ai:/blog/hello', 'acme.lessgo.ai:/blog',
        'acme.com:/blog/hello', 'acme.com:/blog',
      ].sort()
    );
    for (const e of entries) expect(e.config.version).toBe(postCall.version);

    // Ordering: KV before DB writes.
    expect(kvSet.mock.invocationCallOrder[0]).toBeLessThan(db.blogPost.update.mock.invocationCallOrder[0]);

    // DB: status flips, firstPublishedAt set once, blob pointers recorded.
    const postUpdate = db.blogPost.update.mock.calls[0][0].data;
    expect(postUpdate.status).toBe('published');
    expect(postUpdate.firstPublishedAt).toBeInstanceOf(Date);
    expect(postUpdate.publishedVersion).toBe(postCall.version);
    expect(db.publishedPage.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ blogIndex: expect.objectContaining({ version: postCall.version }) }) })
    );

    // Stale cleanup: previous post + index blobs deleted.
    expect(blobDel).toHaveBeenCalledWith('pages/page_1/blog-old/blog/hello.html');
    expect(blobDel).toHaveBeenCalledWith('pages/page_1/blog-old/blog/index.html');

    expect(result.postUrl).toBe('https://acme.com/blog/hello');
  });

  it('rolls back the new blobs and leaves the post row untouched when KV fails', async () => {
    kvSet.mockRejectedValue(new Error('kv down'));

    await expect(publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' })).rejects.toThrow('kv down');

    expect(db.blogPost.update).not.toHaveBeenCalled();
    expect(db.publishedPage.update).not.toHaveBeenCalled();
    // The two NEW blobs (from this attempt) deleted; stale ones kept.
    const deleted = blobDel.mock.calls.map((c: any[]) => c[0]);
    expect(deleted.some((k: string) => k.includes('/blog/hello.html') && !k.includes('blog-old'))).toBe(true);
    expect(deleted.some((k: string) => k.includes('/blog/index.html') && !k.includes('blog-old'))).toBe(true);
    expect(deleted).not.toContain('pages/page_1/blog-old/blog/hello.html');
  });

  it('409s when the site was never published', async () => {
    arm({ page: null });
    await expect(publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' })).rejects.toMatchObject({
      status: 409,
    });
    expect(upload).not.toHaveBeenCalled();
  });

  it('422s for legacy product pages (no template module)', async () => {
    arm({ page: { ...PAGE, audienceType: 'product', templateId: null } });
    await expect(publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' })).rejects.toMatchObject({
      status: 422,
    });
  });

  it('keeps firstPublishedAt on republish (slug stays locked)', async () => {
    const first = new Date('2026-06-01');
    arm({ post: { ...POST, status: 'published', firstPublishedAt: first } });
    await publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' });
    expect(db.blogPost.update.mock.calls[0][0].data.firstPublishedAt).toBe(first);
  });

  it('notifies subscribers on FIRST publish only (P2)', async () => {
    await publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' });
    await flush();
    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(notifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        publishedPageId: 'page_1',
        canonicalHost: 'acme.com', // custom domain wins as reader-facing host
        post: expect.objectContaining({ slug: 'hello', title: 'Hello' }),
      })
    );
  });

  it('republish sends NO subscriber notification (P2)', async () => {
    arm({ post: { ...POST, status: 'published', firstPublishedAt: new Date('2026-06-01') } });
    await publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' });
    await flush();
    expect(notifyMock).not.toHaveBeenCalled();
  });

  it('notification failure never fails the publish (P2, detached)', async () => {
    notifyMock.mockRejectedValueOnce(new Error('resend down'));
    await expect(publishBlogPost({ postId: 'post_1', tokenId: 'tok', baseUrl: 'https://x' })).resolves.toBeTruthy();
    await flush();
  });
});

describe('unpublishBlogPost', () => {
  it('last post: removes /blog + /blog/{slug} routes on every host, clears blogIndex, keeps firstPublishedAt', async () => {
    arm({ post: { ...POST, status: 'published', firstPublishedAt: new Date('2026-06-01') } });
    db.blogPost.findMany.mockResolvedValue([]); // no remaining published posts

    await unpublishBlogPost({ postId: 'post_1', tokenId: 'tok' });

    const deletedKeys = kvDel.mock.calls.flatMap((c: any[]) => c[0]).map((e: any) => `${e.host}:${e.path}`);
    for (const host of ['acme.lessgo.site', 'acme.lessgo.ai', 'acme.com']) {
      expect(deletedKeys).toContain(`${host}:/blog`);
      expect(deletedKeys).toContain(`${host}:/blog/hello`);
    }
    expect(upload).not.toHaveBeenCalled(); // no index regen at zero posts

    const postUpdate = db.blogPost.update.mock.calls[0][0].data;
    expect(postUpdate.status).toBe('draft');
    expect(postUpdate.blobKey).toBeNull();
    expect(postUpdate).not.toHaveProperty('firstPublishedAt'); // untouched → slug stays locked
  });

  it('remaining posts: regenerates the index under a fresh version, only removes the post route', async () => {
    arm({ post: { ...POST, status: 'published' } });
    db.blogPost.findMany.mockResolvedValue([{ ...POST, id: 'post_2', slug: 'other', status: 'published' }]);

    await unpublishBlogPost({ postId: 'post_1', tokenId: 'tok' });

    expect(upload).toHaveBeenCalledTimes(1);
    expect(upload.mock.calls[0][0].pageName).toBe('blog/index');
    expect(upload.mock.calls[0][0].version).toMatch(/^blog-/);

    const setKeys = kvSet.mock.calls.flatMap((c: any[]) => c[0]).map((e: any) => e.path);
    expect(new Set(setKeys)).toEqual(new Set(['/blog']));

    const deletedKeys = kvDel.mock.calls.flatMap((c: any[]) => c[0]).map((e: any) => e.path);
    expect(deletedKeys).toContain('/blog/hello');
    expect(deletedKeys).not.toContain('/blog');
  });
});

// Blog (Phase 1) — per-post publish/unpublish + site-publish sync.
//
// Posts publish INDEPENDENTLY of the site: each publish uploads the article +
// regenerated /blog index under a fresh `blog-*` version (a blob folder that is
// never registered in a PublishedPageVersion row, so versionCleanup can't touch
// it — this flow does its own stale-blob cleanup), then writes route:{host}:/blog/*
// KV keys for every live host. Ordering: upload → KV → DB → delete-stale; a
// mid-flight failure serves stale content, never broken routes.
// See docs/tracks/blogFeature.md.
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';
import { nanoid } from 'nanoid';
import type { BlogPost, PublishedPage } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { generateStaticHTML } from '@/lib/staticExport/htmlGenerator';
import { uploadStaticSite } from '@/lib/staticExport/blobUploader';
import { buildPageMetadata, flattenContent } from '@/lib/staticExport/buildPageMetadata';
import { liveHostsForPage } from '@/lib/domains/liveHosts';
import { setRoutes, deleteRoutes } from '@/lib/routing/kvRoutes';
import type { RouteConfig } from '@/lib/routing/types';
import { usesTemplateModule } from '@/types/service';
import { sanitizeSeo } from '@/lib/validation';
import { serializeJsonLd, extractLogoUrl } from '@/lib/staticExport/structuredData';
import { buildBlogPostingJsonLd } from './jsonLd';
import {
  buildBlogPostPageDef,
  buildBlogIndexPageDef,
  type BlogPostPageData,
  type BlogPageDef,
} from './buildBlogPages';

export class BlogPublishError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'BlogPublishError';
  }
}

function toPageData(post: BlogPost, publishedAtOverride?: Date): BlogPostPageData {
  const body = (post.body as any) || {};
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    heroImage: post.heroImage,
    markdown: typeof body.markdown === 'string' ? body.markdown : '',
    publishedAtISO: (publishedAtOverride || post.publishedAt || new Date()).toISOString(),
  };
}

function newBlogVersion(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('Z', '');
  return `blog-${timestamp}-${nanoid(6)}`;
}

interface BlogContext {
  post: BlogPost;
  page: PublishedPage;
  pageContentFlat: any;
  hosts: string[];
  canonicalDomain?: string;
}

async function loadContext(postId: string, tokenId: string): Promise<BlogContext> {
  const project = await prisma.project.findUnique({
    where: { tokenId },
    select: { id: true },
  });
  if (!project) throw new BlogPublishError(404, 'Project not found');

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post || post.projectId !== project.id) throw new BlogPublishError(404, 'Post not found');

  const page = await prisma.publishedPage.findFirst({
    where: { projectId: project.id, isPublished: true },
  });
  if (!page) {
    throw new BlogPublishError(409, 'Publish your site first — the blog lives on your published site');
  }
  if (!usesTemplateModule(page.audienceType as any, page.templateId as any)) {
    throw new BlogPublishError(422, 'Blog requires a template-based site');
  }

  const { hosts, canonicalDomain } = liveHostsForPage(page);
  return { post, page, pageContentFlat: flattenContent(page.content), hosts, canonicalDomain };
}

/** Render one blog page def to HTML and upload it under the given blog version. */
async function renderAndUpload(opts: {
  page: PublishedPage;
  pageContentFlat: any;
  def: BlogPageDef;
  canonicalPath: string;
  canonicalDomain?: string;
  baseUrl: string;
  version: string;
  pageName: string;
  seo?: ReturnType<typeof sanitizeSeo>;
  previewImage?: string | null;
  /** P2: when set (article pages only), a BlogPosting JSON-LD script is baked in. */
  jsonLdPost?: { title: string; firstPublishedAt: Date | null; publishedAt: Date };
}): Promise<{ blobKey: string; blobUrl: string }> {
  const { page, def } = opts;

  const meta = buildPageMetadata({
    slug: page.slug,
    pageTitle: def.title,
    content: { ...def.content, layout: { sections: def.sections } },
    previewImage: opts.previewImage,
    canonicalDomain: opts.canonicalDomain,
    canonicalPath: opts.canonicalPath,
    baseUrl: opts.baseUrl,
    seo: opts.seo,
    rootSeo: opts.pageContentFlat?.seo, // favicon cascades from the site root
  });

  // BlogPosting JSON-LD (P2). Index pages get none (a bare Blog type adds no
  // rich-result value). datePublished = original publish; dateModified = this one.
  let jsonLd: string | undefined;
  if (opts.jsonLdPost) {
    jsonLd = serializeJsonLd(
      buildBlogPostingJsonLd({
        headline: opts.jsonLdPost.title,
        description: opts.seo?.description || def.description || meta.description,
        url: meta.canonicalURL,
        imageUrl: meta.ogImage,
        datePublishedISO: (opts.jsonLdPost.firstPublishedAt ?? opts.jsonLdPost.publishedAt).toISOString(),
        dateModifiedISO: opts.jsonLdPost.publishedAt.toISOString(),
        authorName: page.title || page.slug,
        publisherLogoUrl: extractLogoUrl(opts.pageContentFlat) || undefined,
      })
    );
  }

  const html = await generateStaticHTML({
    sections: def.sections,
    content: def.content,
    theme: def.theme,
    publishedPageId: page.id,
    pageOwnerId: page.userId,
    slug: page.slug,
    title: meta.title,
    description: opts.seo?.description || def.description || meta.description,
    previewImage: opts.previewImage ?? undefined,
    seo: opts.seo,
    faviconUrl: meta.faviconUrl,
    jsonLd,
    analyticsOptIn: page.analyticsEnabled,
    baseURL: opts.baseUrl,
    audienceType: page.audienceType as 'product' | 'service',
    templateId: page.templateId,
    paletteId: page.paletteId,
    variantId: page.variantId,
    canonicalDomain: opts.canonicalDomain,
    canonicalPath: opts.canonicalPath,
  });

  const upload = await uploadStaticSite({
    pageId: page.id,
    html: html.html,
    assetBundleVersion: 'v1',
    version: opts.version,
    pageName: opts.pageName,
  });
  return { blobKey: upload.blobKey, blobUrl: upload.blobUrl };
}

async function renderIndex(opts: {
  page: PublishedPage;
  pageContentFlat: any;
  posts: Array<{ post: BlogPost; publishedAt?: Date }>;
  canonicalDomain?: string;
  baseUrl: string;
  version: string;
}): Promise<{ blobKey: string; blobUrl: string }> {
  const siteTitle = opts.page.title || opts.page.slug;
  const def = buildBlogIndexPageDef(
    opts.pageContentFlat,
    opts.posts.map(({ post, publishedAt }) => toPageData(post, publishedAt)),
    siteTitle
  );
  return renderAndUpload({
    page: opts.page,
    pageContentFlat: opts.pageContentFlat,
    def,
    canonicalPath: '/blog',
    canonicalDomain: opts.canonicalDomain,
    baseUrl: opts.baseUrl,
    version: opts.version,
    pageName: 'blog/index',
  });
}

function safeDel(blobKey: string | null | undefined, label: string) {
  if (!blobKey) return;
  del(blobKey).catch((err) => console.error(`[blog] stale blob delete failed (${label}):`, blobKey, err));
}

/** Published posts of a project, newest first. */
async function publishedPosts(projectId: string, excludeId?: string): Promise<BlogPost[]> {
  return prisma.blogPost.findMany({
    where: { projectId, status: 'published', ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: { publishedAt: 'desc' },
  });
}

/**
 * Publish (or republish) one post: article blob + regenerated index blob under a
 * fresh blog version, KV routes per live host, then DB. Instant — no site republish.
 */
export async function publishBlogPost(opts: {
  postId: string;
  tokenId: string;
  baseUrl: string;
}): Promise<{ postUrl: string; version: string }> {
  const ctx = await loadContext(opts.postId, opts.tokenId);
  const { post, page, pageContentFlat, hosts, canonicalDomain } = ctx;

  const version = newBlogVersion();
  const now = new Date();
  const seo = sanitizeSeo(post.seo);

  // 1-2. Render + upload article, then index (includes the in-flight post).
  const postDef = buildBlogPostPageDef(pageContentFlat, toPageData(post, post.publishedAt || now));
  const postUpload = await renderAndUpload({
    page,
    pageContentFlat,
    def: postDef,
    canonicalPath: `/blog/${post.slug}`,
    canonicalDomain,
    baseUrl: opts.baseUrl,
    version,
    pageName: `blog/${post.slug}`,
    seo,
    previewImage: post.heroImage,
    jsonLdPost: { title: post.title, firstPublishedAt: post.firstPublishedAt, publishedAt: now },
  });

  const others = await publishedPosts(post.projectId, post.id);
  const indexUpload = await renderIndex({
    page,
    pageContentFlat,
    posts: [{ post, publishedAt: post.publishedAt || now }, ...others.map((p) => ({ post: p }))],
    canonicalDomain,
    baseUrl: opts.baseUrl,
    version,
  });

  // 3. KV routes for every live host, then 4. DB — roll back the new blobs on failure.
  const publishedAtMs = Date.now();
  try {
    const entries: Array<{ host: string; path: string; config: RouteConfig }> = [];
    for (const host of hosts) {
      entries.push({
        host,
        path: `/blog/${post.slug}`,
        config: { pageId: page.id, version, blobUrl: postUpload.blobUrl, publishedAt: publishedAtMs },
      });
      entries.push({
        host,
        path: '/blog',
        config: { pageId: page.id, version, blobUrl: indexUpload.blobUrl, publishedAt: publishedAtMs },
      });
    }
    await setRoutes(entries);

    const previousPostBlobKey = post.blobKey;
    const previousIndexBlobKey = (page.blogIndex as any)?.blobKey as string | undefined;

    await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        status: 'published',
        publishedAt: now,
        firstPublishedAt: post.firstPublishedAt ?? now,
        publishedVersion: version,
        blobKey: postUpload.blobKey,
        blobUrl: postUpload.blobUrl,
      },
    });
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: { blogIndex: { version, blobKey: indexUpload.blobKey, blobUrl: indexUpload.blobUrl } },
    });

    // 5. Fire-and-forget stale-blob cleanup.
    if (previousPostBlobKey !== postUpload.blobKey) safeDel(previousPostBlobKey, 'post');
    if (previousIndexBlobKey !== indexUpload.blobKey) safeDel(previousIndexBlobKey, 'index');

    // 6. Subscriber notification (P2) — FIRST publish only (republish is silent),
    // detached + self-contained (the lib never throws; publish never waits).
    if (!post.firstPublishedAt) {
      import('@/lib/email/sendBlogPostNotification')
        .then(({ sendBlogPostNotification }) =>
          sendBlogPostNotification({
            publishedPageId: page.id,
            siteTitle: page.title || page.slug,
            canonicalHost: canonicalDomain || hosts[0],
            post: { slug: post.slug, title: post.title, excerpt: post.excerpt },
          })
        )
        .catch((e) => console.error('[blog] subscriber notification failed (non-fatal):', e));
    }
  } catch (err) {
    // KV or DB failed: remove the just-uploaded blobs; the post row is untouched.
    safeDel(postUpload.blobKey, 'rollback post');
    safeDel(indexUpload.blobKey, 'rollback index');
    throw err;
  }

  const canonicalHost = canonicalDomain || hosts[0];
  return { postUrl: `https://${canonicalHost}/blog/${post.slug}`, version };
}

/**
 * Unpublish one post: remove its routes + blob; regenerate the index (or remove
 * /blog entirely when this was the last published post). Slug stays locked.
 */
export async function unpublishBlogPost(opts: {
  postId: string;
  tokenId: string;
  baseUrl?: string;
}): Promise<void> {
  const ctx = await loadContext(opts.postId, opts.tokenId);
  const { post, page, pageContentFlat, hosts, canonicalDomain } = ctx;
  const baseUrl = opts.baseUrl || 'https://lessgo.ai';

  const remaining = await publishedPosts(post.projectId, post.id);
  const previousIndexBlobKey = (page.blogIndex as any)?.blobKey as string | undefined;

  if (remaining.length > 0) {
    // Regenerate index without this post.
    const version = newBlogVersion();
    const indexUpload = await renderIndex({
      page,
      pageContentFlat,
      posts: remaining.map((p) => ({ post: p })),
      canonicalDomain,
      baseUrl,
      version,
    });
    const publishedAtMs = Date.now();
    await setRoutes(
      hosts.map((host) => ({
        host,
        path: '/blog',
        config: { pageId: page.id, version, blobUrl: indexUpload.blobUrl, publishedAt: publishedAtMs },
      }))
    );
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: { blogIndex: { version, blobKey: indexUpload.blobKey, blobUrl: indexUpload.blobUrl } },
    });
    if (previousIndexBlobKey !== indexUpload.blobKey) safeDel(previousIndexBlobKey, 'index');
  } else {
    // Last published post: /blog disappears (mirrors the auto-enable on first publish).
    await deleteRoutes(hosts.map((host) => ({ host, path: '/blog' })));
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: { blogIndex: Prisma.DbNull },
    });
    safeDel(previousIndexBlobKey, 'index');
  }

  await deleteRoutes(hosts.map((host) => ({ host, path: `/blog/${post.slug}` })));

  const previousPostBlobKey = post.blobKey;
  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      status: 'draft',
      publishedVersion: null,
      blobKey: null,
      blobUrl: null,
      // firstPublishedAt intentionally kept — the slug stays locked (URL permanence).
    },
  });
  safeDel(previousPostBlobKey, 'post');
}

/**
 * Site republish / domain change: re-render every published post + the index so
 * chrome/theme/canonical stay in sync, and re-emit routes for the CURRENT host set.
 *
 * MUST be called detached (un-awaited) and never throw into the caller — a blog
 * re-render can never delay or fail a site publish or a domain go-live.
 */
export async function syncBlogAfterSitePublish(pageId: string, baseUrl: string): Promise<void> {
  try {
    const page = await prisma.publishedPage.findUnique({ where: { id: pageId } });
    if (!page || !page.projectId) return;

    const posts = await publishedPosts(page.projectId);
    if (posts.length === 0) return;
    if (!usesTemplateModule(page.audienceType as any, page.templateId as any)) return;

    const pageContentFlat = flattenContent(page.content);
    const { hosts, canonicalDomain } = liveHostsForPage(page);
    const version = newBlogVersion();
    const publishedAtMs = Date.now();

    // Upload everything first; KV + DB only after all renders succeed.
    const entries: Array<{ host: string; path: string; config: RouteConfig }> = [];
    const staleKeys: Array<string | null> = [];
    const postUploads: Array<{ postId: string; blobKey: string; blobUrl: string }> = [];

    for (const post of posts) {
      const seo = sanitizeSeo(post.seo);
      const def = buildBlogPostPageDef(pageContentFlat, toPageData(post));
      const upload = await renderAndUpload({
        page,
        pageContentFlat,
        def,
        canonicalPath: `/blog/${post.slug}`,
        canonicalDomain,
        baseUrl,
        version,
        pageName: `blog/${post.slug}`,
        seo,
        previewImage: post.heroImage,
        jsonLdPost: {
          title: post.title,
          firstPublishedAt: post.firstPublishedAt,
          publishedAt: post.publishedAt || new Date(),
        },
      });
      for (const host of hosts) {
        entries.push({
          host,
          path: `/blog/${post.slug}`,
          config: { pageId: page.id, version, blobUrl: upload.blobUrl, publishedAt: publishedAtMs },
        });
      }
      staleKeys.push(post.blobKey);
      postUploads.push({ postId: post.id, blobKey: upload.blobKey, blobUrl: upload.blobUrl });
    }

    const indexUpload = await renderIndex({
      page,
      pageContentFlat,
      posts: posts.map((p) => ({ post: p })),
      canonicalDomain,
      baseUrl,
      version,
    });
    for (const host of hosts) {
      entries.push({
        host,
        path: '/blog',
        config: { pageId: page.id, version, blobUrl: indexUpload.blobUrl, publishedAt: publishedAtMs },
      });
    }
    staleKeys.push((page.blogIndex as any)?.blobKey ?? null);

    await setRoutes(entries);
    for (const u of postUploads) {
      await prisma.blogPost.update({
        where: { id: u.postId },
        data: { publishedVersion: version, blobKey: u.blobKey, blobUrl: u.blobUrl },
      });
    }
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: { blogIndex: { version, blobKey: indexUpload.blobKey, blobUrl: indexUpload.blobUrl } },
    });

    for (const key of staleKeys) safeDel(key, 'sync stale');
  } catch (err) {
    // Self-contained: swallow + log. Blog sync must never fail the site publish.
    console.error('[blog] syncBlogAfterSitePublish failed (non-fatal):', err);
  }
}

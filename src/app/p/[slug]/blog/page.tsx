import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildBlogIndexPageDef } from '@/lib/blog/buildBlogPages';
import { loadBlogSsr, renderBlogSsrPage, toSsrPostData } from '@/lib/blog/ssr';
import { resolveCanonicalURL } from '@/lib/staticExport/canonicalUrl';

// Blog index SSR fallback (blob fast path via KV route:{host}:/blog is primary).
// Static segment — wins over the [...subpath] catch-all. Live DB data: 404s the
// moment the last post is unpublished. See docs/tracks/blogFeature.md.

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

async function publishedPosts(projectId: string) {
  return prisma.blogPost.findMany({
    where: { projectId, status: 'published' },
    orderBy: { publishedAt: 'desc' },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const ctx = await loadBlogSsr(params.slug);
  if (!ctx) return {};
  const siteTitle = ctx.page.title || ctx.page.slug;
  const title = `Blog — ${siteTitle}`;
  const description = `Articles and updates from ${siteTitle}.`;
  const canonicalURL = resolveCanonicalURL({
    slug: params.slug,
    canonicalDomain: ctx.canonicalDomain,
    canonicalPath: '/blog',
  });
  return {
    title,
    description,
    alternates: { canonical: canonicalURL },
    openGraph: { title, description, url: canonicalURL, siteName: 'Lessgo AI', type: 'website' },
  };
}

export default async function BlogIndexPage({ params }: PageProps) {
  const ctx = await loadBlogSsr(params.slug);
  if (!ctx) return notFound();

  const posts = await publishedPosts(ctx.page.projectId!);
  if (posts.length === 0) return notFound();

  const def = buildBlogIndexPageDef(
    ctx.pageContentFlat,
    posts.map(toSsrPostData),
    ctx.page.title || ctx.page.slug
  );
  return renderBlogSsrPage(ctx, def);
}

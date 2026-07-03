import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { buildBlogPostPageDef, markdownToDescription } from '@/lib/blog/buildBlogPages';
import { loadBlogSsr, renderBlogSsrPage, toSsrPostData } from '@/lib/blog/ssr';
import { resolveCanonicalURL } from '@/lib/staticExport/canonicalUrl';
import { resolveOgImage } from '@/lib/staticExport/buildPageMetadata';
import { sanitizeSeo } from '@/lib/validation';

// Blog article SSR fallback (blob fast path via KV route:{host}:/blog/{postSlug}
// is primary). Static segment — wins over the [...subpath] catch-all. Live DB
// data: an unpublished post 404s immediately. See blogFeature.md.

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string; postSlug: string };
}

async function loadPost(projectId: string, postSlug: string) {
  const post = await prisma.blogPost.findUnique({
    where: { projectId_slug: { projectId, slug: postSlug } },
  });
  return post && post.status === 'published' ? post : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const ctx = await loadBlogSsr(params.slug);
  if (!ctx) return {};
  const post = await loadPost(ctx.page.projectId!, params.postSlug);
  if (!post) return {};

  const seo = sanitizeSeo(post.seo);
  const body = (post.body as any) || {};
  const markdown = typeof body.markdown === 'string' ? body.markdown : '';

  const title = seo?.title || `${post.title} — ${ctx.page.title || ctx.page.slug}`;
  const description = seo?.description || post.excerpt || markdownToDescription(markdown);
  const canonicalPath = `/blog/${post.slug}`;
  const canonicalURL = resolveCanonicalURL({
    slug: params.slug,
    canonicalDomain: ctx.canonicalDomain,
    canonicalPath,
  });
  const ogImage = resolveOgImage({
    slug: params.slug,
    previewImage: seo?.ogImage || post.heroImage,
    canonicalDomain: ctx.canonicalDomain,
    baseUrl: 'https://lessgo.ai',
    canonicalPath,
  });
  const faviconUrl = seo?.faviconUrl || ctx.pageContentFlat?.seo?.faviconUrl;

  return {
    title,
    description,
    alternates: { canonical: canonicalURL },
    ...(seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
    ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
    openGraph: {
      title,
      description,
      url: canonicalURL,
      siteName: 'Lessgo.ai',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const ctx = await loadBlogSsr(params.slug);
  if (!ctx) return notFound();

  const post = await loadPost(ctx.page.projectId!, params.postSlug);
  if (!post) return notFound();

  const def = buildBlogPostPageDef(ctx.pageContentFlat, toSsrPostData(post));
  return renderBlogSsrPage(ctx, def);
}

// Blog (Phase 1) — shared SSR-fallback plumbing for /p/[slug]/blog[/postSlug].
// The blob fast path (KV route → blob-proxy) serves most traffic; these helpers
// back the SSR fallback with LIVE DB data (an unpublished post 404s immediately)
// while rendering through the exact same page defs as the static export
// (buildBlogPages — parity by construction).
import React from 'react';
import { prisma } from '@/lib/prisma';
import type { PublishedPage } from '@prisma/client';
import { flattenContent } from '@/lib/staticExport/buildPageMetadata';
import { liveHostsForPage } from '@/lib/domains/liveHosts';
import { usesTemplateModule, type TemplateId } from '@/types/service';
import type { BlogPageDef, BlogPostPageData } from './buildBlogPages';

export interface BlogSsrContext {
  page: PublishedPage;
  pageContentFlat: any;
  canonicalDomain?: string;
}

export async function loadBlogSsr(slug: string): Promise<BlogSsrContext | null> {
  const page = await prisma.publishedPage.findUnique({ where: { slug } });
  if (!page || !page.content || !page.projectId) return null;
  const audienceType = page.audienceType === 'service' ? 'service' : 'product';
  if (!usesTemplateModule(audienceType, page.templateId as any)) return null;

  const { canonicalDomain } = liveHostsForPage(page);
  return { page, pageContentFlat: flattenContent(page.content), canonicalDomain };
}

export function toSsrPostData(post: {
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  body: any;
  publishedAt: Date | null;
}): BlogPostPageData {
  const body = (post.body as any) || {};
  return {
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    heroImage: post.heroImage,
    markdown: typeof body.markdown === 'string' ? body.markdown : '',
    publishedAtISO: post.publishedAt?.toISOString(),
  };
}

/** Render a blog page def through the published renderer (server component). */
export async function renderBlogSsrPage(ctx: BlogSsrContext, def: BlogPageDef) {
  const { page } = ctx;
  const audienceType = page.audienceType === 'service' ? 'service' : 'product';
  const templateId = page.templateId || (audienceType === 'service' ? 'hearth' : null);

  const { LandingPagePublishedRenderer } = await import(
    '@/modules/generatedLanding/LandingPagePublishedRenderer'
  );
  const { CriticalFontPreload } = await import('@/modules/templates/CriticalFontPreload');
  if (usesTemplateModule(audienceType, templateId as any)) {
    const { preloadTemplate } = await import('@/modules/templates/registry');
    await preloadTemplate(templateId as any);
  }

  return (
    <>
      <CriticalFontPreload templateId={templateId as TemplateId | null} variantId={page.variantId} />
      <LandingPagePublishedRenderer
        sections={def.sections}
        content={def.content}
        theme={def.theme || {}}
        publishedPageId={page.id}
        pageOwnerId={page.userId}
        slug={page.slug}
        analyticsEnabled={page.analyticsEnabled || false}
        audienceType={audienceType}
        templateId={templateId}
        variantId={page.variantId}
        paletteId={page.paletteId}
      />
    </>
  );
}

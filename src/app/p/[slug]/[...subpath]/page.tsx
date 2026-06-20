import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import { usesTemplateModule, type TemplateId } from '@/types/service';

// Multi-page subpage route. Serves content.subpages[pathSlug] from a published
// project. The blob fast path (KV route:{host}:{path} → blob-proxy) handles most
// hits; this SSR route is the fallback (and what local /p/{slug}/{path} uses).
// See multiPagePlan.md.

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string; subpath: string[] };
}

function subPathFromParams(subpath: string[]): string {
  return '/' + (subpath || []).join('/');
}

function getSubpage(content: any, pathSlug: string): any | null {
  const subpages = content?.subpages;
  if (!subpages || typeof subpages !== 'object') return null;
  return subpages[pathSlug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: { title: true, content: true, previewImage: true },
  });
  if (!page) return {};

  const content = page.content as any;
  const sub = getSubpage(content, subPathFromParams(params.subpath));
  if (!sub) return {};

  const sections: string[] = sub?.layout?.sections || [];
  const heroId = sections.find((id: string) => id.includes('hero'));
  const heroElements = heroId ? sub?.content?.[heroId]?.elements || {} : {};
  const headline = heroElements.headline?.content || sub?.title || page.title || 'Page';
  const subheadline = heroElements.subheadline?.content || '';
  const description = subheadline
    ? subheadline.length > 160
      ? subheadline.slice(0, 157) + '...'
      : subheadline
    : `Check out ${headline}`;
  const pageTitle = sub?.title ? `${sub.title} — ${page.title}` : page.title || headline;
  const ogImageUrl = page.previewImage || `/api/og/${params.slug}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url: `https://${params.slug}.lessgo.ai${subPathFromParams(params.subpath)}`,
      siteName: 'Lessgo.ai',
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: pageTitle }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: pageTitle, description, images: [ogImageUrl] },
  };
}

export default async function PublishedSubpage({ params }: PageProps) {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      userId: true,
      content: true,
      analyticsEnabled: true,
      audienceType: true,
      templateId: true,
      variantId: true,
      paletteId: true,
    },
  });

  if (!page || !page.content) return notFound();

  const content = page.content as any;
  const pathSlug = subPathFromParams(params.subpath);
  const sub = getSubpage(content, pathSlug);
  if (!sub) return notFound();

  sanitizeContentForPublish(content);

  const { LandingPagePublishedRenderer } = await import('@/modules/generatedLanding/LandingPagePublishedRenderer');
  const { CriticalFontPreload } = await import('@/modules/templates/CriticalFontPreload');

  const audienceType = page.audienceType === 'service' ? 'service' : 'product';
  const templateId = page.templateId || (audienceType === 'service' ? 'hearth' : null);
  if (usesTemplateModule(audienceType, templateId)) {
    const { preloadTemplate } = await import('@/modules/templates/registry');
    await preloadTemplate(templateId as any);
  }

  // Subpage section data + shared forms/legalPages from the root.
  const mergedContent = {
    ...(sub.content || {}),
    forms: content.forms || {},
    legalPages: content.legalPages || undefined,
  };

  return (
    <>
      <CriticalFontPreload templateId={templateId as TemplateId | null} variantId={page.variantId} />
      <LandingPagePublishedRenderer
        sections={sub.layout?.sections || []}
        content={mergedContent}
        theme={sub.layout?.theme || content.layout?.theme || {}}
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

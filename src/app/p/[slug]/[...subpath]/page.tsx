import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import { usesTemplateModule, type TemplateId } from '@/types/service';
import { resolveCanonicalURL } from '@/lib/staticExport/canonicalUrl';
import { resolveOgImage } from '@/lib/staticExport/buildPageMetadata';

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
    select: {
      title: true,
      content: true,
      previewImage: true,
      customDomain: true,
      customDomainStatus: true,
    },
  });
  if (!page) return {};

  const content = page.content as any;
  const subPath = subPathFromParams(params.subpath);
  const sub = getSubpage(content, subPath);
  if (!sub) return {};

  const sections: string[] = sub?.layout?.sections || [];
  const heroId = sections.find((id: string) => id.includes('hero'));

  // Canonical/og:url resolve to the live custom domain when active, at this subpage's own path
  // (shared with the static generator so the SSR fallback can't drift).
  const canonicalDomain =
    page.customDomainStatus === 'live' && page.customDomain ? page.customDomain : undefined;
  const canonicalURL = resolveCanonicalURL({ slug: params.slug, canonicalDomain, canonicalPath: subPath });

  // Product-detail pages have no hero — derive SEO from the Product entry record.
  const pdId = sections.find((id: string) => /^productdetail/i.test(id));
  const pdEl = pdId ? sub?.content?.[pdId]?.elements || {} : null;

  // Per-page seo overrides (sanitized at publish; subpage seo lives on the sub entry).
  const seo = sub?.seo || undefined;

  let headline: string;
  let description: string;
  let ogImageUrl = resolveOgImage({
    slug: params.slug,
    previewImage: page.previewImage,
    canonicalDomain,
    baseUrl: 'https://lessgo.ai',
    canonicalPath: subPath,
  });

  if (pdEl) {
    const model = typeof pdEl.model === 'string' ? pdEl.model : '';
    const name = typeof pdEl.name === 'string' ? pdEl.name : '';
    headline = [model, name].filter(Boolean).join(' ') || sub?.title || page.title || 'Product';
    const intro = (typeof pdEl.oneLiner === 'string' && pdEl.oneLiner) || (typeof pdEl.lede === 'string' && pdEl.lede) || '';
    description = intro ? (intro.length > 160 ? intro.slice(0, 157) + '...' : intro) : `Learn more about the ${headline}.`;
    const firstImg = Array.isArray(pdEl.images) ? pdEl.images.find((im: any) => im?.src)?.src : undefined;
    if (firstImg) ogImageUrl = firstImg;
  } else {
    const heroElements = heroId ? sub?.content?.[heroId]?.elements || {} : {};
    headline = heroElements.headline?.content || sub?.title || page.title || 'Page';
    const subheadline = heroElements.subheadline?.content || '';
    description = subheadline
      ? subheadline.length > 160
        ? subheadline.slice(0, 157) + '...'
        : subheadline
      : `Check out ${headline}`;
  }
  const pageTitle =
    seo?.title || (sub?.title ? `${sub.title} — ${page.title}` : page.title || headline);
  if (seo?.description) description = seo.description;
  if (seo?.ogImage) ogImageUrl = seo.ogImage;

  const faviconUrl = seo?.faviconUrl || content?.seo?.faviconUrl;

  return {
    title: pageTitle,
    description,
    alternates: { canonical: canonicalURL },
    ...(seo?.noIndex ? { robots: { index: false, follow: false } } : {}),
    ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
    openGraph: {
      title: pageTitle,
      description,
      url: canonicalURL,
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

  const audienceType =
    page.audienceType === 'service' ? 'service'
    : page.audienceType === 'writer' ? 'writer'
    : 'product';
  const templateId = page.templateId || (
    audienceType === 'service' ? 'hearth'
    : audienceType === 'writer' ? 'granth'
    : null
  );
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

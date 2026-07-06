import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import { usesTemplateModule, type TemplateId } from '@/types/service';
import { buildPageMetadata, flattenContent } from '@/lib/staticExport/buildPageMetadata';
import { buildStructuredData, serializeJsonLd, extractLogoUrl } from '@/lib/staticExport/structuredData';

// ISR configuration - revalidate every hour
export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
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

  // Single source of truth (shared with the static generator). Canonical/og:url resolve to the
  // live custom domain when one exists — otherwise the SSR fallback would point authority at the
  // wrong host and omit the canonical entirely.
  const canonicalDomain =
    page.customDomainStatus === 'live' && page.customDomain ? page.customDomain : undefined;
  const meta = buildPageMetadata({
    slug: params.slug,
    pageTitle: page.title || '',
    content: flattenContent(page.content),
    previewImage: page.previewImage,
    canonicalDomain,
    canonicalPath: '/',
    baseUrl: 'https://lessgo.ai',
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonicalURL },
    ...(meta.noIndex ? { robots: { index: false, follow: false } } : {}),
    ...(meta.faviconUrl ? { icons: { icon: meta.faviconUrl } } : {}),
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.canonicalURL,
      siteName: meta.siteName,
      images: [{ url: meta.ogImage, width: 1200, height: 630, alt: meta.title }],
      type: meta.ogType,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [meta.ogImage],
    },
  };
}

export default async function PublishedPage({ params }: PageProps) {
  const page = await prisma.publishedPage.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      slug: true,
      htmlContent: true,
      title: true,
      userId: true,
      content: true,
      analyticsEnabled: true,
      audienceType: true,
      templateId: true,
      variantId: true,
      paletteId: true,
      themeValues: true,
      customDomain: true,
      customDomainStatus: true,
    },
  });

  if (!page) return notFound();

  // Backward compatibility: Use static HTML if exists and no content structure
  if (page.htmlContent && !page.content) {
    return (
      <main
        className="published-page"
        dangerouslySetInnerHTML={{ __html: page.htmlContent }}
      />
    );
  }

  // Dynamic rendering with Server Components + Client Islands
  if (!page.content) {
    // Fallback if neither htmlContent nor content exists
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Page Not Ready</h1>
        <p>This page needs to be republished. Please contact the page owner.</p>
      </div>
    );
  }

  const content = page.content as any;
  sanitizeContentForPublish(content); // Sanitize for pages published before this feature

  const { LandingPagePublishedRenderer } = await import('@/modules/generatedLanding/LandingPagePublishedRenderer');
  const { CriticalFontPreload } = await import('@/modules/templates/CriticalFontPreload');

  // Preload the template module so the sync renderer can resolve blocks.
  // STRICT: keep templateId as stored (no default-synthesis) — a legacy
  // product page (templateId=null + 47-block content) must stay on the legacy
  // path. Only default to 'hearth' for service (its null-templateId legacy).
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

  // Merge section content and forms for renderer
  const mergedContent = {
    ...(content.content || {}),  // Section data
    forms: content.forms || {},   // Forms data
    legalPages: content.legalPages || undefined,  // Page-level legal pages (privacy etc.)
  };

  // JSON-LD (SEO Phase 3): same builder as the static export so the SSR fallback
  // matches the blob HTML. Root page only; JSON-LD in <body> is valid for Google.
  const flat = flattenContent(content);
  const jsonLdMeta = buildPageMetadata({
    slug: params.slug,
    pageTitle: page.title || '',
    content: flat,
    canonicalDomain:
      page.customDomainStatus === 'live' && page.customDomain ? page.customDomain : undefined,
    canonicalPath: '/',
    baseUrl: 'https://lessgo.ai',
  });
  const jsonLd = buildStructuredData({
    type: (content.seo as any)?.structuredDataType,
    audienceType,
    name: jsonLdMeta.title,
    description: jsonLdMeta.description,
    url: jsonLdMeta.canonicalURL,
    logoUrl: extractLogoUrl(flat),
    imageUrl: jsonLdMeta.ogImage,
  });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
        />
      )}
      {/* Preload the hero-headline (LCP) display face for this template/variant —
          p/layout only preloads the shared near-body faces. */}
      <CriticalFontPreload templateId={templateId as TemplateId | null} variantId={page.variantId} />
      <LandingPagePublishedRenderer
        sections={content.layout?.sections || []}
        content={mergedContent}
        theme={content.layout?.theme || {}}
        publishedPageId={page.id}
        pageOwnerId={page.userId}
        slug={page.slug}
        analyticsEnabled={page.analyticsEnabled || false}
        audienceType={audienceType}
        templateId={templateId}
        variantId={page.variantId}
        paletteId={page.paletteId}
        mood={(page.themeValues as any)?.mood ?? null}
      />
    </>
  );
}

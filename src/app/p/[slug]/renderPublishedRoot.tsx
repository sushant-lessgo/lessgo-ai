// src/app/p/[slug]/renderPublishedRoot.tsx — language-settings phase 6.
//
// SERVER-ONLY shared helper. The published ROOT document is now rendered from TWO
// routes: `/p/{slug}` (default locale) and `/p/{slug}/{loc}` (a declared
// non-default locale, handled by the [...subpath] route). Copying the ~50-line
// root-render body into the second route would guarantee drift, so it lives here
// once: JSON-LD, merged content assembly, template preload, font preload and the
// published renderer invocation.
//
// Published/client boundary: NO `'use client'` import may enter this module — it
// runs inside the published SSR path (see docs/architecture/phase11aArchitectureGaps.md).

import type { TemplateId } from '@/types/service';
import { usesTemplateModule } from '@/types/service';
import { buildPageMetadata, flattenContent } from '@/lib/staticExport/buildPageMetadata';
import { buildStructuredData, serializeJsonLd, extractLogoUrl } from '@/lib/staticExport/structuredData';
import { getPublishedGoal } from '@/lib/staticExport/getPublishedGoal';
import { resolveLocaleElements } from '@/lib/i18n/localeContent';

/** The PublishedPage columns the root render needs (both routes select these). */
export interface PublishedRootRow {
  id: string;
  slug: string;
  userId: string;
  title: string | null;
  analyticsEnabled: boolean | null;
  audienceType: string | null;
  templateId: string | null;
  variantId: string | null;
  paletteId: string | null;
  themeValues: unknown;
  customDomain: string | null;
  customDomainStatus: string | null;
}

/**
 * Render the published ROOT page for `content`, optionally in a non-default
 * locale.
 *
 * `locale` undefined ⇒ the default-locale document, byte-for-byte the pre-phase-6
 * output. When set, the locale text OVERLAY is applied through the SHARED
 * `resolveLocaleElements` primitive — the same call renderPublishedExport makes,
 * so the SSR document and the baked blob resolve copy identically.
 */
export async function renderPublishedRoot(args: {
  page: PublishedRootRow;
  slug: string;
  /** Sanitized PublishedPage.content (nested shape: { layout, content, forms, … }). */
  content: any;
  /** Declared non-default locale to render, or undefined for the default locale. */
  locale?: string;
  /** Extra head/body nodes (e.g. the locale switcher) appended after the renderer. */
  extras?: React.ReactNode;
}) {
  const { page, slug, content, locale } = args;

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
  const baseSections = (content.content || {}) as Record<string, any>;
  // i18n (phase 6): overlay-over-base with default-locale fallback. Absent
  // overlay / absent locale ⇒ the SAME object reference back (no-op).
  const localizedSections = resolveLocaleElements(
    baseSections,
    content.localeContent,
    locale,
  );
  const mergedContent = {
    ...localizedSections,               // Section data (locale-resolved)
    forms: content.forms || {},         // Forms data
    legalPages: content.legalPages || undefined,  // Page-level legal pages (privacy etc.)
  };

  // JSON-LD (SEO Phase 3): same builder as the static export so the SSR fallback
  // matches the blob HTML. Root page only; JSON-LD in <body> is valid for Google.
  // Locale docs derive their JSON-LD from the LOCALIZED sections (the blob path
  // does the same via `locRoot`), so the structured data is not stuck in the
  // default language. Default-locale render ⇒ `localizedSections === baseSections`
  // ⇒ identical to the pre-phase-6 `flattenContent(content)`.
  const flat = locale ? flattenContent({ ...content, content: localizedSections }) : flattenContent(content);
  const jsonLdMeta = buildPageMetadata({
    slug,
    pageTitle: page.title || '',
    content: flat,
    canonicalDomain:
      page.customDomainStatus === 'live' && page.customDomain ? page.customDomain : undefined,
    canonicalPath: locale ? `/${locale}` : '/',
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

  // scale-04 (phase 3): resolve the project goal via the shared helper (same as
  // the blob-bake path) so GOAL_REF primaries resolve on the SSR fallback too and
  // don't diverge from the baked blob. Null goal → legacy fallback.
  const goal = await getPublishedGoal(page.id);

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
        goal={goal}
      />
      {args.extras}
    </>
  );
}

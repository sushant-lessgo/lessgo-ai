import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import { buildPageMetadata, flattenContent } from '@/lib/staticExport/buildPageMetadata';
import { isServingPublishState } from '@/lib/publishState';
import { renderPublishedRoot } from './renderPublishedRoot';
import { buildLocaleAlternateMap, switcherTagsForSsr } from '@/lib/i18n/publishedLocale';

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
      publishState: true,
    },
  });

  if (!page || !isServingPublishState(page.publishState)) return {};

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

  // i18n (phase 6): reciprocal hreflang for every declared locale + x-default,
  // same map the static export bakes. Single/absent locale config ⇒ {} ⇒ the key
  // is omitted and this metadata is byte-identical to before.
  const languages = buildLocaleAlternateMap({
    config: (page.content as any)?.localeConfig,
    slug: params.slug,
    canonicalDomain,
    barePath: '/',
  });

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.canonicalURL,
      ...(Object.keys(languages).length ? { languages } : {}),
    },
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
      publishState: true,
    },
  });

  // DD0: a KV-route miss falls through to this SSR route, so "not published" must
  // mean 404 here — the row is deliberately retained on unpublish.
  if (!page || !isServingPublishState(page.publishState)) return notFound();

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

  // i18n (phase 6): the SSR fallback now injects the same locale switcher the blob
  // HTML carries, with the SAME suppression semantics (single/absent config or
  // switcherStyle 'none' ⇒ nothing at all) and the SAME `slug` — otherwise the two
  // published surfaces would disagree. `basePath` is stamped server-side (this doc
  // IS served at /p/{slug} unless middleware rewrote a publish subdomain / custom
  // domain onto it), so the client never has to guess it.
  const switcher = switcherTagsForSsr({
    config: content?.localeConfig,
    current: content?.localeConfig?.defaultLocale || 'en',
    slug: params.slug,
    // Lazy: only a page that actually emits a switcher reads headers() (which
    // would otherwise opt this ISR route into dynamic rendering for everyone).
    host: () => headers().get('host'),
  });

  return renderPublishedRoot({
    page,
    slug: params.slug,
    content,
    extras: switcher ? (
      <>
        <script dangerouslySetInnerHTML={{ __html: switcher.configScript }} />
        <script src={switcher.scriptSrc} defer />
      </>
    ) : null,
  });
}

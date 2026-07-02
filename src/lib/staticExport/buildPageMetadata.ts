/**
 * Single source of truth for a published page's SEO/social metadata.
 *
 * Consumed by BOTH renderers so they can't drift (the #1 architectural trap):
 *  - the static generator (`renderPublishedExport` → `htmlGenerator`), which bakes the
 *    `<head>` string at publish time, and
 *  - the dynamic SSR-fallback routes (`/p/[slug]` + `/p/[slug]/[...subpath]`), whose
 *    `generateMetadata` used to hardcode the subdomain host and omit the canonical entirely.
 *
 * Title/description derivation, canonical/og:url resolution, and og:image precedence all live
 * here. Pure + dependency-light (only the equally-pure `canonicalUrl` helper) so it unit-tests
 * without the server-only render stack.
 *
 * ⚠️ INPUT CONTRACT: `content` must be the FLATTENED page shape — section data at the root
 * (`content[sectionId].elements`) and the section list at `content.layout.sections`. The DB
 * stores a nested shape (`content.content[sectionId]`); pass it through `flattenContent()` first.
 * The static path already flattens before calling; the dynamic routes must flatten explicitly.
 */
import { resolveCanonicalURL } from './canonicalUrl';
import type { PageSeo } from '@/types/store/pages';

export interface BuildPageMetadataInput {
  slug: string;
  /** Resolved page title (already cleaned). Also the description/title fallback. */
  pageTitle: string;
  /** FLATTENED content (see contract above). Use flattenContent() if unsure. */
  content: any;
  /** Manual OG image override (absolute URL); wins over the auto /api/og image. */
  previewImage?: string | null;
  /** Live custom domain (no scheme) when active; unset → `{slug}.{PUBLISH_HOST}` subdomain. */
  canonicalDomain?: string;
  /** This page's path (leading slash; '/' for root) so subpages self-report their own URL. */
  canonicalPath?: string;
  /** Origin for the auto /api/og fallback when no custom domain is live. */
  baseUrl: string;
  /**
   * This page's SEO overrides (SEO track, Phase 2). Defaults to `content.seo`
   * when omitted — the root page gets its overrides for free via flattenContent.
   */
  seo?: PageSeo | null;
  /** Root page's seo — favicon is site-wide, so subpages fall back to it. */
  rootSeo?: PageSeo | null;
}

export interface PageMetadata {
  title: string;
  description: string;
  canonicalURL: string;
  ogImage: string;
  siteName: string;
  ogType: 'website';
  noIndex: boolean;
  faviconUrl?: string;
}

/**
 * Flatten the DB's nested content shape (`{ layout, content: { [id]: … } }`) into the flat shape
 * the builder + published renderer expect (`{ layout, [id]: … }`). Idempotent: already-flat
 * content (no nested `.content` object) is returned unchanged. Non-mutating (shallow copy).
 */
export function flattenContent(raw: any): any {
  if (raw && typeof raw === 'object' && raw.content && typeof raw.content === 'object') {
    const { content: nested, ...rest } = raw;
    return { ...rest, ...nested };
  }
  return raw;
}

// First body (non-header/footer) hero section id, for the meta description.
// Identical to the derivation the static path has always used.
function findHeroId(sections: string[] = []): string | undefined {
  return sections.find((id) => /^hero/i.test(id)) || sections.find((id) => !/^(header|footer)/i.test(id));
}

/**
 * OG image precedence: manual `previewImage` > auto `/api/og/{slug}` served from the live custom
 * domain (so the absolute URL matches the host the page lives on) > auto `/api/og/{slug}` on baseUrl.
 * Lifted verbatim from the static generator so no-custom-domain output stays byte-identical.
 * `canonicalPath` (non-root) appends `?path=` so multi-page subpages get their own auto OG image.
 */
export function resolveOgImage(opts: {
  slug: string;
  previewImage?: string | null;
  canonicalDomain?: string;
  baseUrl: string;
  canonicalPath?: string;
}): string {
  const pathQuery =
    opts.canonicalPath && opts.canonicalPath !== '/'
      ? `?path=${encodeURIComponent(opts.canonicalPath)}`
      : '';
  return (
    opts.previewImage ||
    (opts.canonicalDomain
      ? `https://${opts.canonicalDomain}/api/og/${opts.slug}${pathQuery}`
      : `${opts.baseUrl}/api/og/${opts.slug}${pathQuery}`)
  );
}

export function buildPageMetadata(input: BuildPageMetadataInput): PageMetadata {
  const content = input.content || {};
  // Per-page seo overrides. `content.seo` is the sanitized blob the publish route
  // stored; explicit input.seo wins (subpages, whose seo lives on the sub entry).
  const seo: PageSeo | undefined = input.seo ?? content?.seo ?? undefined;
  const sections: string[] = content?.layout?.sections || [];
  const heroId = findHeroId(sections);
  const heroEls = heroId ? content?.[heroId]?.elements : undefined;

  // Description: seo override → subheadline → headline → title, capped at 160 for
  // the auto path (matches the static path exactly); overrides render verbatim
  // (schema caps them at 200).
  const rawDesc = heroEls?.subheadline?.content || heroEls?.headline?.content || input.pageTitle;
  const autoDescription =
    typeof rawDesc === 'string' ? rawDesc.slice(0, 160) : input.pageTitle.slice(0, 160);
  const description = seo?.description || autoDescription;

  // Title: seo override → the resolved page title → hero headline → generic label.
  // For the static path pageTitle is always set, so the fallbacks are inert there
  // (byte-identical head); they only benefit the dynamic route where page.title may be empty.
  const headline = heroEls?.headline?.content;
  const title =
    seo?.title || input.pageTitle || (typeof headline === 'string' ? headline : '') || 'Landing Page';

  const canonicalURL = resolveCanonicalURL({
    slug: input.slug,
    canonicalDomain: input.canonicalDomain,
    canonicalPath: input.canonicalPath,
  });

  // OG image precedence: seo.ogImage > previewImage > auto /api/og. Implemented by
  // feeding the override through resolveOgImage's previewImage slot so the helper
  // (and the no-seo output) stays byte-identical.
  const ogImage = resolveOgImage({
    slug: input.slug,
    previewImage: seo?.ogImage || input.previewImage,
    canonicalDomain: input.canonicalDomain,
    baseUrl: input.baseUrl,
    canonicalPath: input.canonicalPath,
  });

  return {
    title,
    description,
    canonicalURL,
    ogImage,
    siteName: 'Lessgo.ai',
    ogType: 'website',
    noIndex: !!seo?.noIndex,
    faviconUrl: seo?.faviconUrl || input.rootSeo?.faviconUrl || undefined,
  };
}

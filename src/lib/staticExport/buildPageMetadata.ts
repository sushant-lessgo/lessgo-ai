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
}

export interface PageMetadata {
  title: string;
  description: string;
  canonicalURL: string;
  ogImage: string;
  siteName: string;
  ogType: 'website';
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
 */
export function resolveOgImage(opts: {
  slug: string;
  previewImage?: string | null;
  canonicalDomain?: string;
  baseUrl: string;
}): string {
  return (
    opts.previewImage ||
    (opts.canonicalDomain
      ? `https://${opts.canonicalDomain}/api/og/${opts.slug}`
      : `${opts.baseUrl}/api/og/${opts.slug}`)
  );
}

export function buildPageMetadata(input: BuildPageMetadataInput): PageMetadata {
  const content = input.content || {};
  const sections: string[] = content?.layout?.sections || [];
  const heroId = findHeroId(sections);
  const heroEls = heroId ? content?.[heroId]?.elements : undefined;

  // Description: subheadline → headline → title, capped at 160 (matches the static path exactly).
  const rawDesc = heroEls?.subheadline?.content || heroEls?.headline?.content || input.pageTitle;
  const description =
    typeof rawDesc === 'string' ? rawDesc.slice(0, 160) : input.pageTitle.slice(0, 160);

  // Title: the resolved page title, falling back to the hero headline then a generic label.
  // For the static path pageTitle is always set, so this is inert there (byte-identical head);
  // it only benefits the dynamic route where page.title may be empty.
  const headline = heroEls?.headline?.content;
  const title = input.pageTitle || (typeof headline === 'string' ? headline : '') || 'Landing Page';

  const canonicalURL = resolveCanonicalURL({
    slug: input.slug,
    canonicalDomain: input.canonicalDomain,
    canonicalPath: input.canonicalPath,
  });

  const ogImage = resolveOgImage({
    slug: input.slug,
    previewImage: input.previewImage,
    canonicalDomain: input.canonicalDomain,
    baseUrl: input.baseUrl,
  });

  return { title, description, canonicalURL, ogImage, siteName: 'Lessgo.ai', ogType: 'website' };
}

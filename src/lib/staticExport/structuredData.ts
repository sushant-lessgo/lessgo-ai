/**
 * Structured-data (JSON-LD) helpers for published pages (SEO track, Phase 3).
 *
 * Type policy: 'auto' (the default) emits a safe generic Organization — rich
 * types (Product/LocalBusiness) are explicit user picks only, because e.g. a
 * Product block without offers/reviews draws Search Console warnings. JSON-LD
 * renders on the ROOT page only.
 *
 * Pure + dependency-free so it unit-tests without the server-only render stack.
 */
import type { StructuredDataType } from '@/types/store/pages';

export interface StructuredDataInput {
  /** Page's seo.structuredDataType; undefined behaves as 'auto'. */
  type?: StructuredDataType;
  audienceType?: 'product' | 'service';
  name: string; // resolved page title
  description: string;
  url: string; // canonical URL
  logoUrl?: string;
  imageUrl?: string; // resolved OG image
}

/** Build the schema.org object for a page, or null when type is 'none'. */
export function buildStructuredData(input: StructuredDataInput): Record<string, unknown> | null {
  const type = input.type || 'auto';
  if (type === 'none') return null;

  const base = {
    '@context': 'https://schema.org',
    name: input.name,
    description: input.description,
    url: input.url,
  };

  switch (type) {
    case 'Service':
      return {
        ...base,
        '@type': 'Service',
        provider: { '@type': 'Organization', name: input.name },
      };
    case 'LocalBusiness':
      return {
        ...base,
        '@type': 'LocalBusiness',
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
      };
    case 'Product':
      return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: input.name,
        description: input.description,
        ...(input.imageUrl ? { image: input.imageUrl } : {}),
      };
    case 'auto':
    case 'Organization':
    default:
      return {
        ...base,
        '@type': 'Organization',
        ...(input.logoUrl ? { logo: input.logoUrl } : {}),
      };
  }
}

/** Script-breakout-safe serialization for embedding in a <script> tag. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * The uploaded site logo, from the header section's `logo_image` element.
 * Chrome (header/footer) is injected into every page's content at publish, so
 * this works for the root AND subpages. `content` must be the FLAT shape:
 * section data at the root, section list at `content.layout.sections`.
 * https-only — anything else (empty, relative, data:) returns undefined.
 */
export function extractLogoUrl(content: any): string | undefined {
  const sections: string[] = content?.layout?.sections || [];
  const headerId = sections.find((id) => /^header/i.test(id));
  const logo = headerId ? content?.[headerId]?.elements?.logo_image?.content : undefined;
  return typeof logo === 'string' && logo.startsWith('https://') ? logo : undefined;
}

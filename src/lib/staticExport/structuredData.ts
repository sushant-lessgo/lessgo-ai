/**
 * Structured-data helpers for published pages (SEO track).
 *
 * extractLogoUrl ships first (used by the OG image route); the JSON-LD builders
 * (buildStructuredData / serializeJsonLd) land with the structured-data phase.
 *
 * Pure + dependency-free so it unit-tests without the server-only render stack.
 */

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

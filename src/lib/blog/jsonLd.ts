// Blog (P2) — BlogPosting JSON-LD builder. Separate from buildStructuredData
// (whose type union is the user-facing StructuredDataType enum; BlogPosting is
// never a user pick — every article emits it). Pure + dependency-free so it
// unit-tests without the render stack; serialize with serializeJsonLd (script-
// breakout-safe) at the emission site.

export interface BlogPostingInput {
  /** post.title — the article headline (NOT the seo.title override). */
  headline: string;
  description: string;
  /** Canonical URL of the article. */
  url: string;
  /** Resolved OG image (heroImage / seo.ogImage / auto /api/og URL). */
  imageUrl?: string;
  /** firstPublishedAt ?? publishedAt — the original publish date. */
  datePublishedISO: string;
  /** publishedAt (last republish); omitted from output when equal to datePublished. */
  dateModifiedISO?: string;
  /** Site title fallback — BlogPost has no author field. */
  authorName: string;
  publisherLogoUrl?: string;
}

export function buildBlogPostingJsonLd(input: BlogPostingInput): Record<string, unknown> {
  const org = { '@type': 'Organization', name: input.authorName };
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: input.headline,
    description: input.description,
    url: input.url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': input.url },
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    datePublished: input.datePublishedISO,
    ...(input.dateModifiedISO && input.dateModifiedISO !== input.datePublishedISO
      ? { dateModified: input.dateModifiedISO }
      : {}),
    author: org,
    publisher: {
      ...org,
      ...(input.publisherLogoUrl
        ? { logo: { '@type': 'ImageObject', url: input.publisherLogoUrl } }
        : {}),
    },
  };
}

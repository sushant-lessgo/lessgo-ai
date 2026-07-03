// Blog (Phase 1) — synthesize renderable page defs for blog article + index pages.
//
// SINGLE SOURCE OF TRUTH for both the per-post publish pipeline (static export)
// and the /p/[slug]/blog SSR fallback pages: both feed the same page def into
// LandingPagePublishedRenderer / generateStaticHTML, so blob and SSR output can
// never diverge (parity by construction — the blog analogue of the dual-renderer
// rule).
//
// Section content shape mirrors what the published renderer expects:
//   content[sectionId] = { layout: '<truthy string>', elements: {...flat props} }
// Section ids use the exact-lowercase type tokens 'blogpostbody'/'blogindex'
// registered in every template's resolveBlock map (silent casing trap — see
// blogRegistration.test.ts).
import { injectChromeIntoPage } from '@/lib/staticExport/injectChrome';

export const BLOG_SUBSCRIBE_FORM_ID = 'blog-subscribe';

export interface BlogPostPageData {
  slug: string;
  title: string;
  excerpt?: string | null;
  heroImage?: string | null;
  markdown: string;
  /** ISO string; rendered as the byline date. */
  publishedAtISO?: string | null;
}

export interface BlogPageDef {
  sections: string[];
  content: Record<string, any>;
  theme: any;
  title: string;
  description?: string;
}

/** Strip markdown syntax for a plain-text description fallback. */
export function markdownToDescription(markdown: string, max = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Shared scaffolding: base content map carrying root forms/legalPages (so the
 * footer's privacy link + form.v1.js injection keep working) plus the synthetic
 * blog-subscribe form (its presence makes generateStaticHTML embed form.v1.js;
 * /api/forms/submit stores submissions for unknown formIds, integrations skipped).
 */
function baseContent(pageContent: any): Record<string, any> {
  const root = pageContent || {};
  return {
    forms: {
      ...(root.forms && typeof root.forms === 'object' ? root.forms : {}),
      [BLOG_SUBSCRIBE_FORM_ID]: {
        name: 'Blog subscribe',
        successMessage: 'Thanks — you are subscribed!',
      },
    },
    legalPages: root.legalPages,
  };
}

function withChromeAndTheme(
  pageContent: any,
  sectionId: string,
  sectionDef: { layout: string; elements: Record<string, any> }
): { sections: string[]; content: Record<string, any>; theme: any } {
  const content = baseContent(pageContent);
  content[sectionId] = sectionDef;
  const layout = { sections: [sectionId] };

  const chrome = pageContent?.chrome;
  if (chrome && (chrome.header || chrome.footer)) {
    injectChromeIntoPage(layout, content, chrome);
  }

  return { sections: layout.sections, content, theme: pageContent?.layout?.theme };
}

/** Page def for a single article: [header?] blogpostbody [footer?]. */
export function buildBlogPostPageDef(pageContent: any, post: BlogPostPageData): BlogPageDef {
  const { sections, content, theme } = withChromeAndTheme(pageContent, 'blogpostbody-main', {
    layout: 'BlogPostBody',
    elements: {
      post: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt || undefined,
        heroImage: post.heroImage || undefined,
        markdown: post.markdown,
        publishedAtISO: post.publishedAtISO || undefined,
      },
      subscribeFormId: BLOG_SUBSCRIBE_FORM_ID,
    },
  });

  return {
    sections,
    content,
    theme,
    title: post.title,
    description: post.excerpt || markdownToDescription(post.markdown) || undefined,
  };
}

/** Page def for the /blog index: [header?] blogindex [footer?]. */
export function buildBlogIndexPageDef(
  pageContent: any,
  posts: BlogPostPageData[],
  siteTitle: string
): BlogPageDef {
  const cards = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt || markdownToDescription(p.markdown, 200) || undefined,
    heroImage: p.heroImage || undefined,
    publishedAtISO: p.publishedAtISO || undefined,
  }));

  const { sections, content, theme } = withChromeAndTheme(pageContent, 'blogindex-main', {
    layout: 'BlogIndex',
    elements: { posts: cards, siteTitle },
  });

  return {
    sections,
    content,
    theme,
    title: siteTitle ? `Blog — ${siteTitle}` : 'Blog',
    description: `Articles and updates${siteTitle ? ` from ${siteTitle}` : ''}.`,
  };
}

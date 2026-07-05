// Blog (Phase 1) — server-entry validation for /api/blog/* routes.
// See docs/tracks/blogFeature.md. Body is markdown-only in P1; seo reuses the PageSeo gate.
import { z } from 'zod';
import { PageSeoSchema } from '@/lib/validation';

export const BLOG_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BlogSlugSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(BLOG_SLUG_REGEX, 'Slug must be lowercase letters, numbers, and single hyphens');

const HttpsUrl = z
  .string()
  .max(500)
  .url()
  .refine((u) => u.startsWith('https://'), 'Must be an https:// URL');

export const BlogBodySchema = z.object({
  format: z.literal('markdown'),
  // 200k chars keeps the rendered page well under the 2MB blob cap
  markdown: z.string().max(200_000),
});

export const BlogPostCreateSchema = z.object({
  tokenId: z.string().min(1).max(100),
  title: z.string().min(1).max(200),
  slug: BlogSlugSchema.optional(), // auto-generated from title when omitted
  excerpt: z.string().max(300).optional(),
  heroImage: HttpsUrl.optional(),
  body: BlogBodySchema.optional(), // defaults to empty markdown
  seo: PageSeoSchema.optional(),
});

export const BlogPostUpdateSchema = z.object({
  tokenId: z.string().min(1).max(100),
  title: z.string().min(1).max(200).optional(),
  slug: BlogSlugSchema.optional(), // rejected by the route once firstPublishedAt is set
  excerpt: z.string().max(300).nullable().optional(),
  heroImage: HttpsUrl.nullable().optional(),
  body: BlogBodySchema.optional(),
  seo: PageSeoSchema.nullable().optional(),
});

/** Slugify a post title: ascii-fold, lowercase, hyphen-separate, bounded. */
export function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
      .replace(/-+$/g, '') || 'post'
  );
}

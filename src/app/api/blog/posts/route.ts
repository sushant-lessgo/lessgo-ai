export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Blog (Phase 1): list + create posts. Token-keyed, owner-gated. See docs/tracks/blogFeature.md.
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { withDraftRateLimit } from '@/lib/rateLimit';
import { requireBlogProject } from '@/lib/blog/access';
import { BlogPostCreateSchema, slugifyTitle } from '@/lib/blog/schemas';

export async function GET(req: NextRequest) {
  try {
    const tokenId = req.nextUrl.searchParams.get('tokenId') || '';
    if (!tokenId) return createSecureResponse({ error: 'tokenId is required' }, 400);

    const access = await requireBlogProject(tokenId, 'blog.list');
    if (!access.ok) return createSecureResponse({ error: access.error }, access.status);

    const posts = await prisma.blogPost.findMany({
      where: { projectId: access.project.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        heroImage: true,
        status: true,
        publishedAt: true,
        firstPublishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return createSecureResponse({ posts });
  } catch (error) {
    console.error('[blog:list] error:', error);
    return createSecureResponse({ error: 'Internal server error' }, 500);
  }
}

async function createHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = BlogPostCreateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: parsed.error.issues },
        400
      );
    }
    const { tokenId, title, excerpt, heroImage, seo } = parsed.data;

    const access = await requireBlogProject(tokenId, 'blog.create');
    if (!access.ok) return createSecureResponse({ error: access.error }, access.status);

    // Auto-slug from title; uniquify against @@unique([projectId, slug]).
    const base = parsed.data.slug || slugifyTitle(title);
    let slug = base;
    for (let i = 2; i <= 50; i++) {
      const clash = await prisma.blogPost.findUnique({
        where: { projectId_slug: { projectId: access.project.id, slug } },
        select: { id: true },
      });
      if (!clash) break;
      slug = `${base.slice(0, 76)}-${i}`;
    }

    const post = await prisma.blogPost.create({
      data: {
        projectId: access.project.id,
        slug,
        title,
        excerpt: excerpt ?? null,
        heroImage: heroImage ?? null,
        body: parsed.data.body ?? { format: 'markdown', markdown: '' },
        seo: seo ?? undefined,
      },
    });
    return createSecureResponse({ post }, 201);
  } catch (error) {
    console.error('[blog:create] error:', error);
    return createSecureResponse({ error: 'Internal server error' }, 500);
  }
}

export const POST = withDraftRateLimit(createHandler);

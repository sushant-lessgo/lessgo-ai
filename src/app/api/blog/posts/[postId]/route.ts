export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Blog (Phase 1): read/update/delete a post. Token-keyed, owner-gated; the post
// must belong to the token's project. Slug is immutable once firstPublishedAt is
// set (URL permanence). Deleting a published post unpublishes it first.
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { withDraftRateLimit } from '@/lib/rateLimit';
import { requireBlogProject } from '@/lib/blog/access';
import { BlogPostUpdateSchema } from '@/lib/blog/schemas';
import { unpublishBlogPost } from '@/lib/blog/publishBlogPost';

type Params = { params: { postId: string } };

async function loadOwnedPost(postId: string, tokenId: string, action: string) {
  const access = await requireBlogProject(tokenId, action);
  if (!access.ok) return { error: access.error, status: access.status } as const;
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post || post.projectId !== access.project.id) {
    return { error: 'Post not found', status: 404 } as const;
  }
  return { post, project: access.project } as const;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const tokenId = req.nextUrl.searchParams.get('tokenId') || '';
    if (!tokenId) return createSecureResponse({ error: 'tokenId is required' }, 400);

    const result = await loadOwnedPost(params.postId, tokenId, 'blog.read');
    if ('error' in result) return createSecureResponse({ error: result.error }, result.status);
    return createSecureResponse({ post: result.post });
  } catch (error) {
    console.error('[blog:get] error:', error);
    return createSecureResponse({ error: 'Internal server error' }, 500);
  }
}

async function patchHandler(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json();
    const parsed = BlogPostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: parsed.error.issues },
        400
      );
    }
    const { tokenId, slug, ...fields } = parsed.data;

    const result = await loadOwnedPost(params.postId, tokenId, 'blog.update');
    if ('error' in result) return createSecureResponse({ error: result.error }, result.status);
    const { post } = result;

    if (slug && slug !== post.slug) {
      if (post.firstPublishedAt) {
        return createSecureResponse(
          { error: 'Slug is locked after first publish (URL permanence)' },
          409
        );
      }
      const clash = await prisma.blogPost.findUnique({
        where: { projectId_slug: { projectId: post.projectId, slug } },
        select: { id: true },
      });
      if (clash) return createSecureResponse({ error: 'Slug already in use' }, 409);
    }

    const updated = await prisma.blogPost.update({
      where: { id: post.id },
      data: {
        ...(fields.title !== undefined && { title: fields.title }),
        ...(slug && !post.firstPublishedAt && { slug }),
        ...(fields.excerpt !== undefined && { excerpt: fields.excerpt }),
        ...(fields.heroImage !== undefined && { heroImage: fields.heroImage }),
        ...(fields.body !== undefined && { body: fields.body }),
        ...(fields.seo !== undefined && { seo: fields.seo ?? undefined }),
      },
    });
    return createSecureResponse({ post: updated });
  } catch (error) {
    console.error('[blog:patch] error:', error);
    return createSecureResponse({ error: 'Internal server error' }, 500);
  }
}

async function deleteHandler(req: NextRequest, { params }: Params) {
  try {
    const tokenId =
      req.nextUrl.searchParams.get('tokenId') ||
      (await req.json().catch(() => ({})))?.tokenId ||
      '';
    if (!tokenId) return createSecureResponse({ error: 'tokenId is required' }, 400);

    const result = await loadOwnedPost(params.postId, tokenId, 'blog.delete');
    if ('error' in result) return createSecureResponse({ error: result.error }, result.status);
    const { post } = result;

    // Published posts go offline (routes/blobs removed, index regenerated) before the row dies.
    if (post.status === 'published') {
      await unpublishBlogPost({ postId: post.id, tokenId });
    }

    await prisma.blogPost.delete({ where: { id: post.id } });
    return createSecureResponse({ deleted: true });
  } catch (error) {
    console.error('[blog:delete] error:', error);
    return createSecureResponse({ error: 'Internal server error' }, 500);
  }
}

// withRateLimit drops the (req, ctx) second arg, so bind params per request.
export async function PATCH(req: NextRequest, ctx: Params) {
  return withDraftRateLimit((r) => patchHandler(r, ctx))(req);
}
export async function DELETE(req: NextRequest, ctx: Params) {
  return withDraftRateLimit((r) => deleteHandler(r, ctx))(req);
}

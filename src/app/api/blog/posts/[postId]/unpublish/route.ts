export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Blog (Phase 1): take a post offline. Removes its routes/blob and regenerates
// (or removes) the /blog index. Slug stays locked (firstPublishedAt kept).
import type { NextRequest } from 'next/server';
import { createSecureResponse } from '@/lib/security';
import { withPublishRateLimit } from '@/lib/rateLimit';
import { requireBlogProject } from '@/lib/blog/access';
import { unpublishBlogPost, BlogPublishError } from '@/lib/blog/publishBlogPost';

type Params = { params: { postId: string } };

async function unpublishHandler(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}));
    const tokenId = typeof body?.tokenId === 'string' ? body.tokenId : '';
    if (!tokenId) return createSecureResponse({ error: 'tokenId is required' }, 400);

    const access = await requireBlogProject(tokenId, 'blog.unpublish');
    if (!access.ok) return createSecureResponse({ error: access.error }, access.status);

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.headers.get('host') || 'localhost:3000'}`;

    await unpublishBlogPost({ postId: params.postId, tokenId, baseUrl });
    return createSecureResponse({ unpublished: true });
  } catch (error) {
    if (error instanceof BlogPublishError) {
      return createSecureResponse({ error: error.message }, error.status);
    }
    console.error('[blog:unpublish] error:', error);
    return createSecureResponse({ error: 'Unpublish failed' }, 500);
  }
}

// withRateLimit drops the (req, ctx) second arg, so bind params per request.
export async function POST(req: NextRequest, ctx: Params) {
  return withPublishRateLimit((r) => unpublishHandler(r, ctx))(req);
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Blog (Phase 1): per-post instant publish. Owner-gated; thin wrapper over
// publishBlogPost (upload → KV → DB → stale cleanup). See blogFeature.md.
import type { NextRequest } from 'next/server';
import { createSecureResponse } from '@/lib/security';
import { withPublishRateLimit } from '@/lib/rateLimit';
import { requireBlogProject } from '@/lib/blog/access';
import { publishBlogPost, BlogPublishError } from '@/lib/blog/publishBlogPost';

type Params = { params: { postId: string } };

async function publishHandler(req: NextRequest, { params }: Params) {
  try {
    const body = await req.json().catch(() => ({}));
    const tokenId = typeof body?.tokenId === 'string' ? body.tokenId : '';
    if (!tokenId) return createSecureResponse({ error: 'tokenId is required' }, 400);

    const access = await requireBlogProject(tokenId, 'blog.publish');
    if (!access.ok) return createSecureResponse({ error: access.error }, access.status);

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.headers.get('host') || 'localhost:3000'}`;

    const result = await publishBlogPost({ postId: params.postId, tokenId, baseUrl });
    return createSecureResponse(result);
  } catch (error) {
    if (error instanceof BlogPublishError) {
      return createSecureResponse({ error: error.message }, error.status);
    }
    console.error('[blog:publish] error:', error);
    return createSecureResponse({ error: 'Publish failed' }, 500);
  }
}

// withRateLimit drops the (req, ctx) second arg, so bind params per request.
export async function POST(req: NextRequest, ctx: Params) {
  return withPublishRateLimit((r) => publishHandler(r, ctx))(req);
}

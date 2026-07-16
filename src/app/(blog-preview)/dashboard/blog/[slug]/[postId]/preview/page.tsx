import '@/styles/fonts-self-hosted.css'; // /p layout provides this for live pages; this route is outside it
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { buildBlogPostPageDef } from '@/lib/blog/buildBlogPages';
import { loadBlogSsr, renderBlogSsrPage, toSsrPostData } from '@/lib/blog/ssr';

// Blog (P2): owner-only preview of a post in ANY status (drafts included) —
// Clerk-gated dashboard route (no signed-token scheme exists; don't invent one).
// Renders through the exact same page def as publish/SSR, minus analytics.
//
// ⚠️ ROUTE-GROUP ESCAPE (dashboard-workspace-ia phase 1, B2): this file lives in
// the `(blog-preview)` root route group — NOT under `src/app/dashboard/` — even
// though its URL is `/dashboard/blog/{slug}/{postId}/preview` (route groups are
// URL-invisible). Reason: this is NOT a dashboard screen; it returns real blog
// TEMPLATE markup and must render byte-identical to the live page. The dashboard
// shell (`src/app/dashboard/layout.tsx`) attaches `.app-chrome`, which would
// inherit Onest/ink/canvas onto this template output and break editor↔published
// parity (see src/components/ui/README.md "Attach rules"). Only the root layout
// wraps this route. DO NOT move it back under `src/app/dashboard/`.

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string; postId: string };
}

export default async function BlogPostPreviewPage({ params }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const ctx = await loadBlogSsr(params.slug);
  if (!ctx || ctx.page.userId !== userId) return notFound();

  const post = await prisma.blogPost.findUnique({ where: { id: params.postId } });
  if (!post || post.projectId !== ctx.page.projectId) return notFound();

  const previewCtx = { ...ctx, page: { ...ctx.page, analyticsEnabled: false } };
  const def = buildBlogPostPageDef(ctx.pageContentFlat, toSsrPostData(post));

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: '#111827',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13,
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <span>
          Draft preview — not live · status: <strong>{post.status}</strong>
        </span>
      </div>
      <div style={{ paddingTop: 36 }}>{await renderBlogSsrPage(previewCtx, def)}</div>
    </>
  );
}

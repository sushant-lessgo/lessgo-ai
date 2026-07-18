import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

/**
 * REDIRECT SHIM — `/dashboard/blog/{slug}` → `/dashboard/{token}/blog`.
 *
 * The blog manager moved into the token workspace as the "Blog" tab. This file only
 * exists to keep old bookmarks/links working (e.g.
 * `edit/[token]/components/layout/PageSwitcher.tsx:43` — D5: correct via this shim,
 * one extra hop, re-pointing is a later cleanup slice).
 *
 * 🚨 Why a server PAGE and not middleware / `next.config` redirects:
 *   - slug → token lives ONLY in Postgres. `src/middleware.ts` is EDGE runtime with no
 *     Prisma; `next.config` redirects are static. Neither can do the lookup.
 *
 * 🚨 This directory must STAY REAL, or `/dashboard/blog/foo` falls through to `[token]`
 * and "blog" gets treated as a project token. Its `components/` folder moved WITH the
 * page (C3) — a shim dir holds only the shim.
 *
 * 🚨 The sibling `.../[postId]/preview` route is NOT shimmed and NOT re-homed (B2): it
 * lives in the `(blog-preview)` root route group, its URL is unchanged and still live.
 *
 * Authz: redirects UNCONDITIONALLY on a resolvable slug — the target enforces ownership
 * via `getWorkspaceProject` (orphans + demo token rejected, B3/D2). Unknown/unmapped
 * slug → `notFound()`, exactly as today.
 *
 * ⚠️ Shims preserve NO query string — in-tab links must target the token URL directly.
 */

interface PageProps {
  params: { slug: string }
}

export default async function BlogSlugRedirect({ params }: PageProps) {
  const publishedPage = await prisma.publishedPage.findFirst({
    where: { slug: params.slug },
    select: { projectId: true },
  })

  if (!publishedPage?.projectId) notFound()

  const project = await prisma.project.findUnique({
    where: { id: publishedPage.projectId },
    select: { tokenId: true },
  })

  if (!project) notFound()

  redirect(`/dashboard/${project.tokenId}/blog`)
}

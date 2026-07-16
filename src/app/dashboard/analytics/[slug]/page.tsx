import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

/**
 * REDIRECT SHIM — `/dashboard/analytics/{slug}` → `/dashboard/{token}/analytics`.
 *
 * The analytics surface moved into the token workspace. This file only exists to keep
 * old bookmarks/links (e.g. `admin/page.tsx`) working.
 *
 * 🚨 Why a server PAGE and not middleware / `next.config` redirects:
 *   - slug → token lives ONLY in Postgres. `src/middleware.ts` is EDGE runtime with no
 *     Prisma (its KV holds slug→blob routes, not slug→token).
 *   - `next.config` redirects are static — they cannot do a DB lookup.
 *   ⇒ a Node-runtime server component doing the lookup is the only option.
 *
 * 🚨 This directory must STAY REAL. Delete it and `/dashboard/analytics/foo` falls
 * through to `[token]` (Next resolves static segments first), which would try to treat
 * the literal string "analytics" as a project token.
 *
 * Authz: the shim redirects UNCONDITIONALLY on a resolvable slug — the target enforces
 * ownership via `getWorkspaceProject` (which post-B3/D2 also rejects orphans + the demo
 * token). It leaks nothing beyond slug existence, which `/p/{slug}` already publishes.
 * An unknown/unmapped slug still `notFound()`s exactly as today.
 *
 * ⚠️ Shims preserve NO query string. Any in-tab link (e.g. the analytics `?days=`
 * pills) must target the token URL directly and never hop through here.
 */

interface PageProps {
  params: {
    slug: string
  }
}

export default async function AnalyticsSlugRedirect({ params }: PageProps) {
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

  redirect(`/dashboard/${project.tokenId}/analytics`)
}

import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

/**
 * REDIRECT SHIM — `/dashboard/forms/{slug}` → `/dashboard/{token}/leads`.
 *
 * The form-submissions surface moved into the token workspace as the "Leads" tab.
 * This file only exists to keep old bookmarks/links (e.g. `admin/page.tsx`) working.
 *
 * 🚨 Why a server PAGE and not middleware / `next.config` redirects:
 *   - slug → token lives ONLY in Postgres. `src/middleware.ts` is EDGE runtime with no
 *     Prisma; `next.config` redirects are static. Neither can do the lookup.
 *
 * 🚨 This directory must STAY REAL, or `/dashboard/forms/foo` falls through to
 * `[token]` and "forms" gets treated as a project token.
 *
 * Authz: redirects UNCONDITIONALLY on a resolvable slug — the target enforces ownership
 * via `getWorkspaceProject` (orphans + demo token rejected, B3/D2). Unknown/unmapped
 * slug → `notFound()`, exactly as today.
 *
 * ⚠️ Shims preserve NO query string — in-tab links must target the token URL directly.
 */

interface PageProps {
  params: {
    slug: string
  }
}

export default async function FormsSlugRedirect({ params }: PageProps) {
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

  redirect(`/dashboard/${project.tokenId}/leads`)
}

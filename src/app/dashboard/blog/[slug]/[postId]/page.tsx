import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

/**
 * REDIRECT SHIM — `/dashboard/blog/{slug}/{postId}` → `/dashboard/{token}/blog/{postId}`.
 *
 * The post editor moved into the token workspace. This file only exists to keep old
 * bookmarks/links working.
 *
 * 🚨 This directory must STAY REAL — see the parent shim. Its `components/` folder
 * (BlogPostEditor + BlogRichTextEditor) moved WITH the page (C3).
 *
 * 🚨 The CHILD route `.../preview` is deliberately NOT shimmed and NOT re-homed (B2):
 * it lives in the `(blog-preview)` root route group, outside the dashboard tree, so no
 * `.app-chrome` ancestor can leak app styling into real template markup. Its URL is
 * unchanged and it is still the live preview target (`BlogPostEditor.tsx` links to it).
 * Next.js resolves that group's `/dashboard/blog/[slug]/[postId]/preview` independently
 * of this page — this shim only matches the exact `[postId]` segment.
 *
 * Authz: redirects UNCONDITIONALLY on a resolvable slug — the target enforces ownership
 * (`getWorkspaceProject`) AND that the post belongs to the project. `postId` is passed
 * through unvalidated on purpose: validating it here would duplicate the target's check.
 * Unknown/unmapped slug → `notFound()`.
 *
 * ⚠️ Shims preserve NO query string — in-tab links must target the token URL directly.
 */

interface PageProps {
  params: { slug: string; postId: string }
}

export default async function BlogPostSlugRedirect({ params }: PageProps) {
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

  redirect(`/dashboard/${project.tokenId}/blog/${params.postId}`)
}

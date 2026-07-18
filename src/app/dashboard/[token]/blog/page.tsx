import { getWorkspaceProject } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { AppIcon } from '@/components/ui/icon'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { publishedSubdomainHost } from '@/lib/domains/hosts'
import BlogPostsTable from './components/BlogPostsTable'
import NewPostButton from './components/NewPostButton'

/**
 * Blog tab (`/dashboard/[token]/blog`) — body moved from the retired
 * `dashboard/blog/[slug]/page.tsx` (no reskin). `/dashboard/blog/{slug}` is now a
 * redirect shim onto this route.
 *
 * 🚨 This page calls `getWorkspaceProject` ITSELF. The `[token]/layout.tsx` call is
 * chrome data only and is NOT an auth boundary (Next.js does not re-run layouts as a
 * guard). Within one request the wrapper's React `cache()` dedupes the two calls.
 * The old route's `publishedPage.findFirst({slug, userId})` ownership scope + its
 * slug→token hop (`:29-34`) are both replaced by the wrapper — do NOT re-add a userId
 * filter (`PublishedPage.userId` is a CLERK id; `project.userId` is an internal
 * `User.id` — a wrong-space compare is tsc-green and silently returns zero rows).
 *
 * R18 — locked until published: status quo, not a new restriction. The old route was
 * publish-gated by construction, and both the public blog index host and the subscriber
 * count key on a `PublishedPage`. Posts themselves are already token-reachable
 * (`BlogPost.projectId`), so pre-publish blogging is a viable later slice.
 */

interface PageProps {
  params: { token: string }
}

export default async function BlogPage({ params }: PageProps) {
  const { project, publishedPage } = await getWorkspaceProject(params.token)

  // R18 — locked until published (no slug ⇒ no public blog index, no subscribers).
  if (!publishedPage) {
    return (
      <div className="px-[26px] pb-[26px] pt-[22px]">
        <div className="flex flex-col items-center gap-2 rounded-[13px] border border-app-border bg-app-surface px-6 py-[52px] text-center">
          <span className="mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-app-tint">
            <AppIcon name="article" size={20} className="text-app-primary" />
          </span>
          <p className="font-app-sans text-[13px] font-bold text-app-ink">No blog yet</p>
          <p className="font-app-sans text-[12px] text-app-faint">Publish to start blogging</p>
        </div>
      </div>
    )
  }

  const posts = await prisma.blogPost.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      status: true,
      publishedAt: true,
      updatedAt: true,
    },
  })

  const subscriberCount = await prisma.blogSubscriber.count({
    where: { publishedPageId: publishedPage.id, status: 'subscribed' },
  })

  const host = publishedSubdomainHost(publishedPage.slug)

  return (
    <div className="flex flex-col bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header — moved as-is; `/dashboard` back-link needs no re-point (D1). */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Blog — {stripHTMLTags(publishedPage.title || 'Untitled Page')}
            </h1>
            <a
              href={`https://${host}/blog`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-blue-600"
            >
              {host}/blog ↗
            </a>
            <span className="ml-3 text-sm text-gray-500">
              {subscriberCount} subscriber{subscriberCount === 1 ? '' : 's'}
            </span>
          </div>
          <NewPostButton tokenId={project.tokenId} />
        </div>

        <BlogPostsTable
          posts={posts.map((p) => ({
            ...p,
            publishedAt: p.publishedAt?.toISOString() ?? null,
            updatedAt: p.updatedAt.toISOString(),
          }))}
          tokenId={project.tokenId}
        />
      </main>
    </div>
  )
}

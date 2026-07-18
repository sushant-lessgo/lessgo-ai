import { getWorkspaceProject } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { AppIcon } from '@/components/ui/icon'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { publishedSubdomainHost } from '@/lib/domains/hosts'
import BlogPostsTable from './components/BlogPostsTable'
import BlogFirstRun from './components/BlogFirstRun'
import BlogStatsStrip from './components/BlogStatsStrip'
import NewPostButton from './components/NewPostButton'

/**
 * Blog tab (`/dashboard/[token]/blog`) — reskinned onto app-chrome
 * (blog-composer-redesign phase 1: handoff 3b first-run + 3c manager).
 *
 * 🚨 This page calls `getWorkspaceProject` ITSELF. The `[token]/layout.tsx` call is
 * chrome data only and is NOT an auth boundary (Next.js does not re-run layouts as a
 * guard). Within one request the wrapper's React `cache()` dedupes the two calls.
 * The old route's `publishedPage.findFirst({slug, userId})` ownership scope + its
 * slug→token hop are both replaced by the wrapper — do NOT re-add a userId
 * filter (`PublishedPage.userId` is a CLERK id; `project.userId` is an internal
 * `User.id` — a wrong-space compare is tsc-green and silently returns zero rows).
 *
 * R18 — locked until published: status quo, not a new restriction. The old route was
 * publish-gated by construction, and both the public blog index host and the subscriber
 * count key on a `PublishedPage`. Posts themselves are already token-reachable
 * (`BlogPost.projectId`), so pre-publish blogging is a viable later slice.
 *
 * 🚨 THREE STATES, one derived rule (plan ruling #1 — `enabled ⇔ ≥1 BlogPost`; there is
 * no stored `blogEnabled` flag and adding one needs a migration + a second source of
 * truth):
 *   1. no publishedPage → "publish your site first" (R18 above)
 *   2. published + 0 posts → <BlogFirstRun /> (handoff TURN 4)
 *   3. ≥1 post → stats strip + posts list
 * State 3 → state 2 on deleting the last post. Accepted wart, pinned by
 * `e2e/blog-manager.spec.ts`.
 *
 * 🚨 The stats are DERIVED IN JS from `posts` below — that select already carries
 * `status` + `publishedAt` for every row. Do NOT add a `groupBy`/extra query to feed
 * `BlogStatsStrip` (ruling #6); the data is already in memory.
 *
 * The project name + back-navigation are NOT repeated here: `[token]/layout.tsx` renders
 * `WorkspaceHeader` + `WorkspaceTabs` above every tab. The legacy gray-50/max-w-6xl body
 * and its duplicate `Dashboard` back-link were removed with this reskin.
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
        <div className="flex flex-col items-center gap-2 rounded-app-card border border-app-border bg-app-surface px-6 py-[52px] text-center">
          <span className="mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-app-tint">
            <AppIcon name="article" size={20} className="text-app-primary" />
          </span>
          <p className="font-app-sans text-[13px] font-bold text-app-ink">No blog yet</p>
          <p className="font-app-sans text-[12px] text-app-faint">
            Publish your site to start blogging
          </p>
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
  const projectName = stripHTMLTags(publishedPage.title || 'this site')

  // Derived enablement — no stored flag (ruling #1).
  if (posts.length === 0) {
    return (
      <div className="px-[26px] pb-[26px] pt-[22px]">
        <BlogFirstRun tokenId={project.tokenId} projectName={projectName} host={host} />
      </div>
    )
  }

  // Derived in JS from the rows already fetched above — no extra round trips (ruling #6).
  const publishedCount = posts.filter((p) => p.status === 'published').length
  const lastPublishedAt = posts.reduce<Date | null>(
    (latest, p) => (p.publishedAt && (!latest || p.publishedAt > latest) ? p.publishedAt : latest),
    null
  )

  return (
    <div className="flex flex-col gap-4 px-[26px] pb-[26px] pt-[22px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-app-sans text-[15px] font-bold text-app-ink">Blog</h1>
          <a
            href={`https://${host}/blog`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-app-sans text-[12px] text-app-faint hover:text-app-primary"
          >
            {host}/blog ↗
          </a>
        </div>
        {/* Phase 4 adds the "Write a post with AI" CTA beside this one. */}
        <NewPostButton tokenId={project.tokenId} />
      </div>

      <BlogStatsStrip
        total={posts.length}
        published={publishedCount}
        drafts={posts.length - publishedCount}
        lastPublishedAt={lastPublishedAt?.toISOString() ?? null}
        subscribers={subscriberCount}
      />

      <BlogPostsTable
        posts={posts.map((p) => ({
          ...p,
          publishedAt: p.publishedAt?.toISOString() ?? null,
          updatedAt: p.updatedAt.toISOString(),
        }))}
        tokenId={project.tokenId}
      />
    </div>
  )
}

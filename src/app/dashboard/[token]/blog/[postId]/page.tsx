import { getWorkspaceProject } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AppIcon } from '@/components/ui/icon'
import BlogPostEditor from './components/BlogPostEditor'

/**
 * Blog post composer (`/dashboard/[token]/blog/[postId]`) — reskinned onto app-chrome
 * (blog-composer-redesign phase 2: handoff TURN 5 article view). Body originally moved
 * from the retired `dashboard/blog/[slug]/[postId]/page.tsx`. That URL is now a redirect
 * shim onto this route.
 *
 * 🚨 SERVER CONTRACT FROZEN by the phase-2 reskin — everything below the chrome is the
 * pre-reskin code, unchanged: the `getWorkspaceProject` auth boundary, the
 * `post.projectId !== project.id` integrity check, the R18 publish gate, the
 * `body.markdown` flatten, and the `slugLocked = post.firstPublishedAt != null`
 * computation. Only the wrapper markup was retokenized.
 *
 * 🚨 This page calls `getWorkspaceProject` ITSELF (the `[token]/layout.tsx` call is
 * chrome data only, NOT an auth boundary). The old slug+userId page lookup is replaced
 * by the wrapper's ladder; the post-belongs-to-project integrity check is PRESERVED —
 * `post.projectId === project.id` is the exact equivalent of the old
 * `post.projectId !== publishedPage.projectId` check, now that ownership of `project`
 * has already been asserted. Without it, any owned token could open any other project's
 * post by id.
 *
 * R18 — same publish gate as the blog index: `BlogPostEditor`'s preview link needs a
 * slug, so an unpublished project has nothing to render here.
 *
 * D3 — `slug` comes from the wrapper's `publishedPage.slug`, NOT a route param (the
 * token URL has no slug segment). Non-null because of the publish gate above.
 */

interface PageProps {
  params: { token: string; postId: string }
}

export default async function BlogPostEditorPage({ params }: PageProps) {
  const { project, publishedPage } = await getWorkspaceProject(params.token)

  // R18 — a post editor without a published page has no preview URL to link to.
  if (!publishedPage) notFound()

  const post = await prisma.blogPost.findUnique({ where: { id: params.postId } })
  if (!post || post.projectId !== project.id) notFound()

  const body = (post.body as any) || {}

  return (
    <div className="flex flex-col gap-3 px-[26px] pb-[26px] pt-[22px]">
      {/*
        The composer is a sub-page of the Blog tab, not a tab itself — `WorkspaceTabs`
        highlights "Blog" but offers no way back OUT of a post, so (unlike the manager,
        where phase 1 dropped its duplicate back-link) this one carries its weight.
        C1 — back into the tab, never through the `/dashboard/blog/{slug}` shim.
      */}
      <Link
        href={`/dashboard/${project.tokenId}/blog`}
        className="inline-flex w-fit items-center gap-1.5 font-app-sans text-[12px] font-medium text-app-faint transition-colors hover:text-app-ink"
      >
        <AppIcon name="arrow_back" size={15} />
        All posts
      </Link>
      <BlogPostEditor
        tokenId={project.tokenId}
        slug={publishedPage.slug}
        post={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? '',
          heroImage: post.heroImage ?? '',
          markdown: typeof body.markdown === 'string' ? body.markdown : '',
          status: post.status,
          slugLocked: post.firstPublishedAt != null,
          seo: (post.seo as any) ?? {},
        }}
      />
    </div>
  )
}

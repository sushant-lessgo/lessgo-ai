import { getWorkspaceProject } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BlogPostEditor from './components/BlogPostEditor'

/**
 * Blog post editor (`/dashboard/[token]/blog/[postId]`) — body moved from the retired
 * `dashboard/blog/[slug]/[postId]/page.tsx`. That URL is now a redirect shim onto this
 * route.
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
    <div className="flex flex-col bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          {/* C1 — back into the tab, never through the `/dashboard/blog/{slug}` shim. */}
          <Link
            href={`/dashboard/${project.tokenId}/blog`}
            className="flex items-center text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All posts
          </Link>
        </div>
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
      </main>
    </div>
  )
}

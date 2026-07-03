import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BlogPostEditor from './components/BlogPostEditor'

// Blog (Phase 1): post editor shell. Ownership: slug+userId (page) → project →
// post must belong to the same project.

interface PageProps {
  params: { slug: string; postId: string }
}

export default async function BlogPostEditorPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const publishedPage = await prisma.publishedPage.findFirst({
    where: { slug: params.slug, userId },
    select: { projectId: true },
  })
  if (!publishedPage || !publishedPage.projectId) notFound()

  const project = await prisma.project.findUnique({
    where: { id: publishedPage.projectId },
    select: { tokenId: true },
  })
  if (!project) notFound()

  const post = await prisma.blogPost.findUnique({ where: { id: params.postId } })
  if (!post || post.projectId !== publishedPage.projectId) notFound()

  const body = (post.body as any) || {}

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <Header />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/blog/${params.slug}`}
            className="flex items-center text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            All posts
          </Link>
        </div>
        <BlogPostEditor
          tokenId={project.tokenId}
          slug={params.slug}
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

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { publishedSubdomainHost } from '@/lib/domains/hosts'
import BlogPostsTable from './components/BlogPostsTable'
import NewPostButton from './components/NewPostButton'

// Blog (Phase 1): per-site post manager. Slug-keyed like forms/analytics —
// requires the site to be published once (per-post publish needs it anyway).

interface PageProps {
  params: { slug: string }
}

export default async function BlogManagerPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const publishedPage = await prisma.publishedPage.findFirst({
    where: { slug: params.slug, userId },
    select: { id: true, title: true, projectId: true },
  })
  if (!publishedPage || !publishedPage.projectId) notFound()

  const project = await prisma.project.findUnique({
    where: { id: publishedPage.projectId },
    select: { tokenId: true },
  })
  if (!project) notFound()

  const posts = await prisma.blogPost.findMany({
    where: { projectId: publishedPage.projectId },
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

  const host = publishedSubdomainHost(params.slug)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <Header />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
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
          <NewPostButton tokenId={project.tokenId} slug={params.slug} />
        </div>

        <BlogPostsTable
          posts={posts.map((p) => ({
            ...p,
            publishedAt: p.publishedAt?.toISOString() ?? null,
            updatedAt: p.updatedAt.toISOString(),
          }))}
          tokenId={project.tokenId}
          slug={params.slug}
        />
      </main>
      <Footer />
    </div>
  )
}

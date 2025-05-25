import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import ProjectCard from '@/components/dashboard/ProjectCard'
import EmptyState from '@/components/dashboard/EmptyState'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) return null

  // 1. Fetch draft projects
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      projects: {
        include: { token: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  const draftProjects = user?.projects.map((project) => ({
    id: project.id,
    name: project.title || 'Untitled Project',
    status: 'Draft' as const,
    updatedAt: project.updatedAt.toISOString(),
    tokenId: project.token.value,
    slug: null,
    type: 'draft' as const,
  })) ?? []

  // 2. Fetch published pages
  const publishedPages = await prisma.publishedPage.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })

  const publishedItems = publishedPages.map((page) => ({
    id: page.id,
    name: page.title || 'Untitled Page',
    status: 'Published' as const,
    updatedAt: page.updatedAt.toISOString(),
    tokenId: null,
    slug: page.slug,
    type: 'published' as const,
  }))

  // 3. Merge and sort
  const allItems = [...draftProjects, ...publishedItems].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      <Header />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8">
        <DashboardHeader />

        {allItems.length > 0 ? (
          <section className="space-y-4 mt-4">
            <h2 className="text-sm uppercase text-brand-mutedText tracking-wide">
              Recent Projects
            </h2>
            {allItems.map((item) => (
              <ProjectCard
                key={`${item.type}-${item.id}`}
                project={item}
              />
            ))}
          </section>
        ) : (
          <EmptyState />
        )}
      </main>
      <Footer />
    </div>
  )
}

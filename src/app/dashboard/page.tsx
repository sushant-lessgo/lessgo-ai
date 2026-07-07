import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import ProjectCard from '@/components/dashboard/ProjectCard'
import EmptyState from '@/components/dashboard/EmptyState'
import PersonaUpdatedBanner from '@/components/dashboard/PersonaUpdatedBanner'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { personaUpdated?: string }
}) {
  const { userId } = await auth()
  if (!userId) return null

  // Unified query: Projects with published info + persona for blocking gate
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      projects: {
        select: {
          id: true,
          title: true,
          content: true,
          inputText: true,
          updatedAt: true,
          token: { select: { value: true } },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })

  const viewerIsAdmin = isAdmin(userId)

  // scale-02: the persona gate is removed — self-serve users (persona=null)
  // go straight to the dashboard; the universal entry's serve gate handles
  // routing. Persona editing survives in /dashboard/settings.

  type SourceProject = {
    id: string
    title: string
    content: unknown
    inputText: string | null
    updatedAt: Date
    token: { value: string }
    ownerEmail?: string | null
  }

  let sourceProjects: SourceProject[]
  let publishedPages: { slug: string; title: string | null; updatedAt: Date; projectId: string | null }[]

  if (viewerIsAdmin) {
    // Admin god-view: every project, regardless of owner, with the owner's email for labelling.
    const all = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        inputText: true,
        updatedAt: true,
        token: { select: { value: true } },
        user: { select: { email: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    })
    sourceProjects = all.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      inputText: p.inputText,
      updatedAt: p.updatedAt,
      token: p.token,
      ownerEmail: p.user?.email ?? null,
    }))
    publishedPages = await prisma.publishedPage.findMany({
      where: { projectId: { in: all.map((p) => p.id) } },
      select: { slug: true, title: true, updatedAt: true, projectId: true },
    })
  } else {
    sourceProjects = (user?.projects ?? []).map((p) => ({ ...p, ownerEmail: undefined }))
    publishedPages = await prisma.publishedPage.findMany({
      where: { userId },
      select: { slug: true, title: true, updatedAt: true, projectId: true },
    })
  }

  // Create lookup map: projectId → publishedPage
  const publishedByProjectId = new Map(
    publishedPages
      .filter(p => p.projectId)
      .map(p => [p.projectId, p])
  )

  // Transform projects into unified items
  const allItems = sourceProjects.map((project) => {
    const publishedPage = publishedByProjectId.get(project.id)

    // Generate smart project name from available data
    let smartName = project.title

    if (!smartName || smartName === 'Untitled Project') {
      const content = project.content as any
      const onboarding = content?.onboarding || {}
      const validatedFields = onboarding.validatedFields || {}
      const confirmedFields = onboarding.confirmedFields || {}

      // Helper function to capitalize and clean field values
      const formatField = (field: string) => {
        return field.split(/[-_\s]+/)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }

      // Try different naming strategies in order of preference
      if (validatedFields.marketCategory && validatedFields.targetAudience) {
        smartName = `${formatField(validatedFields.marketCategory)} for ${formatField(validatedFields.targetAudience)}`
      } else if (confirmedFields.marketCategory?.value && confirmedFields.targetAudience?.value) {
        smartName = `${formatField(confirmedFields.marketCategory.value)} for ${formatField(confirmedFields.targetAudience.value)}`
      } else if (validatedFields.marketCategory) {
        smartName = `${formatField(validatedFields.marketCategory)} Tool`
      } else if (confirmedFields.marketCategory?.value) {
        smartName = `${formatField(confirmedFields.marketCategory.value)} Tool`
      } else if (project.inputText) {
        // Extract first meaningful part of inputText (up to 50 chars)
        const shortInput = project.inputText.slice(0, 50).trim()
        smartName = shortInput.length === 50 ? `${shortInput}...` : shortInput
      } else if (onboarding.oneLiner) {
        // Extract first meaningful part of oneLiner (up to 50 chars)
        const shortOneLiner = onboarding.oneLiner.slice(0, 50).trim()
        smartName = shortOneLiner.length === 50 ? `${shortOneLiner}...` : shortOneLiner
      } else {
        smartName = 'New Project'
      }
    }

    return {
      id: project.id,
      name: smartName,
      status: publishedPage ? ('Published' as const) : ('Draft' as const),
      updatedAt: project.updatedAt.toISOString(),
      tokenId: project.token.value,
      slug: publishedPage?.slug || null,
      type: 'unified' as const,
      publishedAt: publishedPage?.updatedAt.toISOString(),
      owner: viewerIsAdmin ? (project.ownerEmail ?? '(orphan)') : undefined,
    }
  })

  return (
    <div className="flex flex-col min-h-screen bg-white text-brand-text font-body">
      <Header />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 py-8">
        {searchParams?.personaUpdated === '1' && <PersonaUpdatedBanner />}
        <DashboardHeader />

        {allItems.length > 0 ? (
          <section className="space-y-4 mt-4">
            <h2 className="text-sm uppercase text-brand-mutedText tracking-wide">
              Recent Projects
            </h2>
            {viewerIsAdmin && sourceProjects.length === 200 && (
              <p className="text-xs text-brand-mutedText">Showing first 200 projects</p>
            )}
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

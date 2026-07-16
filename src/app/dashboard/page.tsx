import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'
import ProjectsBoard from '@/components/dashboard/ProjectFilters'
import DashboardEmptyState from '@/components/dashboard/DashboardEmptyState'
import PersonaUpdatedBanner from '@/components/dashboard/PersonaUpdatedBanner'

// dashboard-workspace-ia phase 2: <DashboardHeader/> is gone — the shell top bar
// (phase 1) + the filter row's "New site" CTA replace it. `ProjectCard` and the old
// `EmptyState` are superseded by ProjectsBoard/DashboardEmptyState; those three
// files are deleted in phase 6.
//
// ⚠️ The data fetch below is UNCHANGED (R16): same admin god-view branch, same
// take:200, same smart-name fallback chain, same item shape. Filtering is
// client-side in ProjectsBoard — no new query, no per-card analytics read.

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
  // DD7 — `publishState` + `customDomain` drive the card menu: the status pill uses the
  // slot predicate (below) and Unpublish/Delete pre-disable when a domain is attached.
  // Both branches below select them; they are SEPARATE queries, so a field added to one
  // and not the other silently ships a stale menu for admins (or for owners).
  let publishedPages: {
    slug: string
    title: string | null
    updatedAt: Date
    projectId: string | null
    publishState: string
    customDomain: string | null
  }[]

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
      select: {
        slug: true,
        title: true,
        updatedAt: true,
        projectId: true,
        publishState: true,
        customDomain: true,
      },
    })
  } else {
    sourceProjects = (user?.projects ?? []).map((p) => ({ ...p, ownerEmail: undefined }))
    publishedPages = await prisma.publishedPage.findMany({
      where: { userId },
      select: {
        slug: true,
        title: true,
        updatedAt: true,
        projectId: true,
        publishState: true,
        customDomain: true,
      },
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

    // DD4/DD0 — the row is KEPT on unpublish (slug reservation, DD12), so
    // `publishedPage ? 'Published' : 'Draft'` would keep calling a torn-down page
    // "Published" forever. The slot predicate is `publishState !== 'draft'`: a page stuck
    // at `'unpublishing'` still shows Published (it holds its slot) and offers Unpublish
    // as the retry, even though SSR already 404s it.
    const publishState = publishedPage?.publishState ?? 'draft'
    const occupiesSlot = Boolean(publishedPage) && publishState !== 'draft'

    return {
      id: project.id,
      name: smartName,
      status: occupiesSlot ? ('Published' as const) : ('Draft' as const),
      updatedAt: project.updatedAt.toISOString(),
      tokenId: project.token.value,
      // Only a serving page gets a live address: an unpublished row keeps its slug
      // reserved, but "Visit site" must not offer a link that 404s.
      slug: occupiesSlot ? publishedPage?.slug ?? null : null,
      type: 'unified' as const,
      publishState,
      hasCustomDomain: Boolean(publishedPage?.customDomain),
      publishedAt: publishedPage?.updatedAt.toISOString(),
      owner: viewerIsAdmin ? (project.ownerEmail ?? '(orphan)') : undefined,
    }
  })

  if (allItems.length === 0) {
    return (
      <>
        {searchParams?.personaUpdated === '1' && (
          <div className="px-[26px] pt-[22px]">
            <PersonaUpdatedBanner />
          </div>
        )}
        <DashboardEmptyState />
      </>
    )
  }

  return (
    <div className="px-[26px] py-[22px]">
      {searchParams?.personaUpdated === '1' && <PersonaUpdatedBanner />}
      <ProjectsBoard
        items={allItems}
        showTruncationNotice={viewerIsAdmin && sourceProjects.length === 200}
      />
    </div>
  )
}

import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getWorkspaceProject } from '@/lib/workspace'
import { templateHasCapability } from '@/modules/templates/templateMeta'
import WorkLibraryClient from '@/components/dashboard/work/WorkLibraryClient'

/**
 * "Your work" tab (`/dashboard/[token]/work`) — the project-scoped work-library
 * board where a work customer manages their photos as grouped sets. Reuses E2's
 * `CorrectionBoard`; source of truth is `brief.facts.work.groups`, edited through
 * `GET`/`PUT /api/work-library`.
 *
 * 🚨 Calls `getWorkspaceProject` ITSELF: `[token]/layout.tsx` is chrome only, not an
 * auth boundary (Next.js does not re-run layouts as a guard on every nested render).
 * Ownership is asserted BEFORE `templateId`/`project.id` are used.
 *
 * ── ELIGIBILITY (decision 7 — the isWorkCopyTemplate trap) ───────────────────
 *   The board gates on `templateHasCapability(templateId, 'works')` — the SAME
 *   predicate the API route uses — NOT `isWorkCopyTemplate`. Live `atelier` is a
 *   work-ENGINE template but declares gallery/packages/multipage, NOT `works`; it
 *   has no `page-<slug>` fan-out for the resync to bind into, so it 404s here.
 *   Only `atelier2` (the work-skeleton pilot) declares `works`.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { token: string }
}

export default async function WorkspaceWorkPage({ params }: PageProps) {
  const { project } = await getWorkspaceProject(params.token)

  // `templateId` is not part of the workspace context; read it by primary key
  // (already ownership-asserted above).
  const projectRow = await prisma.project.findUnique({
    where: { id: project.id },
    select: { templateId: true },
  })

  // Same guard as the API route — the page is the real security + eligibility
  // boundary; the tab is only visibility.
  if (!templateHasCapability(projectRow?.templateId, 'works')) notFound()

  return (
    <div className="flex flex-col bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Your work</h1>
          <p className="text-sm text-gray-500">
            Organise your photos into sets, add new ones, and choose what shows on
            your site. Changes save as you go; publish them with Update site.
          </p>
        </div>

        <WorkLibraryClient tokenId={project.tokenId} />
      </main>
    </div>
  )
}

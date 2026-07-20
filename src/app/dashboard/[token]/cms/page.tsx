import { prisma } from '@/lib/prisma'
import { getWorkspaceProject } from '@/lib/workspace'
import { templateHasCapability } from '@/modules/templates/templateMeta'
import CmsBoardClient from '@/components/dashboard/cms/CmsBoardClient'

/**
 * "Content" tab (`/dashboard/[token]/cms`) — the GENERIC CMS board over the
 * user-authored Collection tables (`Collection`/`CollectionGroup`/`CollectionItem`),
 * edited through `/api/collections/*`.
 *
 * 🚨 Calls `getWorkspaceProject` ITSELF: `[token]/layout.tsx` is chrome only, not an
 * auth boundary (Next.js does not re-run layouts as a guard on every nested render).
 * Ownership is asserted BEFORE `project.id`/`tokenId` are used. The API routes each
 * re-gate with `assertProjectOwner` — this page is not their security boundary.
 *
 * ── NOT THE WORKS BOARD ──────────────────────────────────────────────────────
 * `/dashboard/[token]/work` remains the photographer image specialization over the
 * AUTHORITATIVE `works` catalog (`brief.facts.work.groups` → `/api/work-library` →
 * `applyRailEdit`/`resyncWorkContent`). That is a completely different pipeline and
 * this board must never touch it: `works` does NOT appear here in v1 (plan phase 9
 * step 2; unify pass deferred). The only relationship is a deep-link row, rendered
 * ONLY for works-capable projects — a link to a page that `notFound()`s would be
 * worse than the omission.
 *
 * ── NO TEMPLATE GATING ───────────────────────────────────────────────────────
 * The collection block is a SHARED block (renders on every template), so there is
 * no `CapabilityId` for it and no capability gate here (plan Deviations #2). Every
 * project can author collections.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { token: string }
}

export default async function WorkspaceCmsPage({ params }: PageProps) {
  const { project } = await getWorkspaceProject(params.token)

  // `templateId` is not part of the workspace context; read it by primary key
  // (already ownership-asserted above). Used ONLY to decide whether the works
  // deep-link row is honest for this project — never to gate the CMS board.
  const projectRow = await prisma.project.findUnique({
    where: { id: project.id },
    select: { templateId: true },
  })
  const hasWorkLibrary = templateHasCapability(projectRow?.templateId, 'works')

  return (
    <div className="flex flex-col bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Content</h1>
          <p className="text-sm text-gray-500">
            Your collections — products, projects, team, articles. Edit items here;
            they update everywhere the collection appears the next time you publish.
          </p>
        </div>

        <CmsBoardClient tokenId={project.tokenId} hasWorkLibrary={hasWorkLibrary} />
      </main>
    </div>
  )
}

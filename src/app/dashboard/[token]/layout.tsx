import { stripHTMLTags } from '@/utils/htmlSanitization'
import { prisma } from '@/lib/prisma'
import { getWorkspaceProject } from '@/lib/workspace'
import { templateHasCapability } from '@/modules/templates/templateMeta'
import WorkspaceHeader from '@/components/dashboard/WorkspaceHeader'
import WorkspaceTabs from '@/components/dashboard/WorkspaceTabs'

/**
 * Project workspace shell — `/dashboard/[token]/*`.
 *
 * ⚠️ NOT AN AUTH BOUNDARY. This `getWorkspaceProject` call exists for CHROME DATA
 * ONLY. Next.js does not re-run layouts as a guard on every nested render, so a
 * check here guarantees nothing for the pages below. **Every page under this layout
 * calls `getWorkspaceProject` itself and owner-scopes its own query.** Do not delete
 * a page's own call "because the layout already checks".
 *
 * Within a request the two calls are deduped by the wrapper's React `cache()`.
 *
 * `.app-chrome` is NOT attached here — it lives once, on `dashboard/layout.tsx`
 * (phase 1). The root `DashboardTopBar` self-suppresses on token paths, so the
 * workspace header below is the only bar.
 *
 * Route-shadow note (scout §B): `[token]` resolves AFTER literal siblings
 * (`billing`, `settings`, `analytics`, `forms`, `blog`, …) — static-first, so no
 * collision today. A token literally equal to one of those words would be shadowed.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { token: string }
}) {
  const { project, publishedPage } = await getWorkspaceProject(params.token)
  const name = stripHTMLTags(project.title || 'Untitled Project')

  // `templateId` isn't part of the workspace context — read it by primary key
  // (ownership already asserted above) to decide whether the "Your work" tab
  // shows. CHROME DATA ONLY: this is not the auth boundary; the work page
  // re-gates on the same predicate.
  const projectRow = await prisma.project.findUnique({
    where: { id: project.id },
    select: { templateId: true },
  })
  const showWorkTab = templateHasCapability(projectRow?.templateId, 'works')

  // Does this project have any collections? CHROME DATA ONLY — it decides whether
  // the "Content" tab LINKS or renders greyed, nothing more; `[token]/cms` re-gates
  // itself. Deliberately NOT template-gated: the collection block is a shared block
  // that renders on every template, so every project can author collections.
  //
  // ⚠️ A count must never 500 the whole workspace shell. This layout wraps EVERY
  // page under `/dashboard/[token]`, so a transient DB hiccup here would take out
  // Overview, Leads and Analytics too — for a tab's enabled/disabled state. On
  // failure we degrade to the greyed state (the honest "we can't show you anything"
  // answer) and log; we never let it propagate.
  let hasCollections = false
  try {
    hasCollections =
      (await prisma.collection.count({ where: { projectId: project.id }, take: 1 })) > 0
  } catch (err) {
    console.warn('[WorkspaceLayout] collection count failed; Content tab greyed', err)
  }

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceHeader
        projectId={project.id}
        tokenId={project.tokenId}
        name={name}
        slug={publishedPage?.slug ?? null}
      />
      <WorkspaceTabs
        tokenId={project.tokenId}
        showWorkTab={showWorkTab}
        hasCollections={hasCollections}
      />
      <div className="flex-1">{children}</div>
    </div>
  )
}

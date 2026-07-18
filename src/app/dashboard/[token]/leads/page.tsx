import { getWorkspaceProject } from '@/lib/workspace'
import { prisma } from '@/lib/prisma'
import { AppIcon } from '@/components/ui/icon'
import FormSubmissionsTable from '@/components/dashboard/FormSubmissionsTable'
import ExportFormCSV from './components/ExportFormCSV'
import { ArrowLeft, FileText, ClipboardList, Calendar } from 'lucide-react'
import Link from 'next/link'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { publishedSubdomainHost } from '@/lib/domains/hosts'

/**
 * Leads tab (`/dashboard/[token]/leads`) — body moved from the retired
 * `dashboard/forms/[slug]/page.tsx` (no reskin). `/dashboard/forms/{slug}` is now a
 * redirect shim onto this route.
 *
 * 🚨 This page calls `getWorkspaceProject` ITSELF. The `[token]/layout.tsx` call is
 * chrome data only and is NOT an auth boundary (Next.js does not re-run layouts as a
 * guard). Within one request the wrapper's React `cache()` dedupes the two calls.
 *
 * 🚨 The old query filtered `formSubmission.findMany({ userId, publishedPageId })`.
 * The `userId` filter is DELIBERATELY DROPPED (plan phase 4 step 4, reviewer-cleared):
 *   - `publishedPage.id` is a PRIMARY KEY handed back by `getWorkspaceProject` AFTER
 *     its authz ladder passed, so `where:{ publishedPageId }` can only ever match rows
 *     belonging to that one asserted-owned page. The `userId` filter added no security
 *     — it was redundant scoping.
 *     ⚠️ NOT because of a DB constraint: `FormSubmission.publishedPageId`
 *     (`prisma/schema.prisma:232`) is a **nullable, indexed scalar with NO relation and
 *     NO unique constraint**. The guarantee comes from the value's provenance (a PK
 *     from the post-authz wrapper), not from the schema — do not relax this query on
 *     the assumption that a FK is enforcing anything.
 *   - `FormSubmission.userId` is a CLERK id, while `project.userId` is an internal
 *     `User.id`. A wrong-space filter here would be tsc-green and silently return
 *     ZERO rows.
 *   - The filter is exactly what blanks admin god-view (R8): an admin's own clerkId
 *     matches none of the owner's submissions.
 *   - It was never a real defence anyway: `/api/forms/submit` used to take the owner
 *     `userId` straight from the client-supplied request body. (Fixed by
 *     secrets-forms-security phase 1: the route now IGNORES body `userId` and derives
 *     the owner server-side from `publishedPageId` → `PublishedPage.userId`, gated on
 *     `isServingPublishState`. So `FormSubmission.userId` is trustworthy for rows
 *     written after that deploy — but forged rows may predate it, and the filter is
 *     still redundant given the PK-provenance argument above.)
 * Do NOT "restore" it.
 */

interface PageProps {
  params: {
    token: string
  }
}

export default async function LeadsPage({ params }: PageProps) {
  const { publishedPage } = await getWorkspaceProject(params.token)

  // R10 — locked until published: submissions are keyed on a `PublishedPage`.
  if (!publishedPage) {
    return (
      <div className="px-[26px] pb-[26px] pt-[22px]">
        <div className="flex flex-col items-center gap-2 rounded-[13px] border border-app-border bg-app-surface px-6 py-[52px] text-center">
          <span className="mb-1 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-app-tint">
            <AppIcon name="move_to_inbox" size={20} className="text-app-primary" />
          </span>
          <p className="font-app-sans text-[13px] font-bold text-app-ink">No leads yet</p>
          <p className="font-app-sans text-[12px] text-app-faint">
            Publish to start collecting leads
          </p>
        </div>
      </div>
    )
  }

  const slug = publishedPage.slug

  const submissions = await prisma.formSubmission.findMany({
    where: {
      publishedPageId: publishedPage.id,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Group submissions by form
  const submissionsByForm = submissions.reduce((acc, submission) => {
    const formId = submission.formId
    if (!acc[formId]) {
      acc[formId] = {
        formName: submission.formName,
        submissions: [],
      }
    }
    acc[formId].submissions.push(submission)
    return acc
  }, {} as Record<string, { formName: string; submissions: typeof submissions }>)

  const totalSubmissions = submissions.length
  const uniqueForms = Object.keys(submissionsByForm).length
  const thisMonth = submissions.filter(s => {
    const d = new Date(s.createdAt)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return (
    <div className="flex flex-col bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        {/* Header — moved as-is; `/dashboard` back-link needs no re-point (D1). */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-500 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {stripHTMLTags(publishedPage.title || 'Untitled Page')}
          </h1>
          <a
            href={`https://${publishedSubdomainHost(slug)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-blue-600"
          >
            {publishedSubdomainHost(slug)} ↗
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{totalSubmissions}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <ClipboardList className="w-4 h-4" />
              <span className="text-sm font-medium">Forms</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{uniqueForms}</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-3">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">This Month</span>
            </div>
            <span className="text-3xl font-bold text-gray-900">{thisMonth}</span>
          </div>
        </div>

        {/* Export */}
        {totalSubmissions > 0 && (
          <div className="flex justify-end mb-4">
            <ExportFormCSV submissions={submissions} slug={slug} />
          </div>
        )}

        {/* Form Submissions */}
        {totalSubmissions > 0 ? (
          <div className="space-y-6">
            {Object.entries(submissionsByForm).map(([formId, { formName, submissions }]) => (
              <div key={formId} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-sm font-medium text-gray-900">
                    {formName}
                    <span className="ml-2 text-gray-400 font-normal">
                      {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
                    </span>
                  </h3>
                </div>
                <FormSubmissionsTable submissions={submissions} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12">
            <div className="max-w-md mx-auto text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No submissions yet
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                When visitors submit forms on your page, they appear here.
              </p>
              <Link
                href={`/p/${slug}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
              >
                View page
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

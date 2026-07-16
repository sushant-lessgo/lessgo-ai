import { notFound } from 'next/navigation'
import { MessageSquare, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getWorkspaceProject } from '@/lib/workspace'
import { isTestimonialsEnabled } from '@/lib/testimonials/flag'
import { listTestimonialsByOwner } from '@/lib/testimonials/repo'
import TestimonialModerationList from '@/components/dashboard/testimonials/TestimonialModerationList'

/**
 * Testimonials tab (`/dashboard/[token]/testimonials`) — a per-PROJECT view of the
 * account-level moderation surface. Same components, filtered to one project.
 *
 * R19 — the account-level `/dashboard/testimonials` page stays live and unchanged
 * (just unlinked from the sidebar). This is an addition, not a replacement.
 *
 * 🚨 THIRD ID SPACE (C2) — the one trap this file exists to avoid.
 * `Testimonial.userId` is a **CLERK id** (`prisma/schema.prisma:600` "Clerk User ID
 * (owner / tenant)"), while `project.userId` is an internal **`User.id`**
 * (`schema.prisma:22`). Both are `string`, so passing the wrong one is tsc-green, throws
 * nothing, and silently returns ZERO ROWS — an empty tab that looks like "no
 * testimonials yet".
 *
 *   ✅ `listTestimonialsByOwner(clerkId, { projectId: project.id })`
 *   ❌ `listTestimonialsByOwner(project.userId, ...)`   ← silent zero rows
 *
 * `clerkId` here is the wrapper's — i.e. the **project OWNER's** Clerk id, resolved via
 * `project.user.clerkId`, NOT the requesting admin's. That is what keeps admin god-view
 * (R8) showing the owner's testimonials instead of a blank page.
 *
 * `listTestimonialsByOwner` already accepts `{ projectId }` (`src/lib/testimonials/
 * repo.ts:93`, also used by `autoImport.ts:58`) — the util needs no change.
 *
 * 🚨 Calls `getWorkspaceProject` ITSELF: `[token]/layout.tsx` is chrome only, not an
 * auth boundary. Ownership is asserted BEFORE `project.id` is used as a filter.
 */

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { token: string }
}

export default async function WorkspaceTestimonialsPage({ params }: PageProps) {
  if (!isTestimonialsEnabled()) notFound()

  const { project, clerkId } = await getWorkspaceProject(params.token)

  const [testimonials, projectRow] = await Promise.all([
    // C2 — owner's CLERK id + this project's internal id. Never cross the spaces.
    listTestimonialsByOwner(clerkId, { projectId: project.id }),
    // `audienceType` is not part of the workspace context; read it by primary key
    // (already ownership-asserted above).
    prisma.project.findUnique({
      where: { id: project.id },
      select: { audienceType: true },
    }),
  ])

  const counts = {
    total: testimonials.length,
    pending: testimonials.filter((t) => t.status === 'pending').length,
    approved: testimonials.filter((t) => t.status === 'approved').length,
    rejected: testimonials.filter((t) => t.status === 'rejected').length,
  }

  const stats = [
    { label: 'Total', value: counts.total, Icon: MessageSquare },
    { label: 'Pending', value: counts.pending, Icon: Clock },
    { label: 'Approved', value: counts.approved, Icon: CheckCircle2 },
    { label: 'Rejected', value: counts.rejected, Icon: XCircle },
  ]

  return (
    <div className="flex flex-col bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Testimonials</h1>
          <p className="text-sm text-gray-500">
            Collect, moderate, and manage customer testimonials for this site.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {stats.map(({ label, value, Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </div>
              <span className="text-3xl font-bold text-gray-900">{value}</span>
            </div>
          ))}
        </div>

        <TestimonialModerationList
          initial={testimonials}
          projects={[
            {
              id: project.id,
              title: project.title,
              audienceType: projectRow?.audienceType ?? 'product',
              // `Project.tokenId` IS the token value (`schema.prisma:23` — the relation
              // targets `Token.value`), so this is the same string the account-level
              // page passes as `token`.
              token: project.tokenId,
            },
          ]}
        />
      </main>
    </div>
  )
}

import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import { prisma } from '@/lib/prisma'
import { assertProjectOwner } from '@/lib/security'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import { BriefSchema } from '@/lib/schemas/brief.schema'
import { getSequencePlanForIntent, type EmailArchetypeId } from '@/modules/email/archetypes'
import EmailSequencePanel from './EmailSequencePanel'

// Email-sequence manager: per-project goal-matched sequence generator (copy only —
// Lessgo does not send). Keyed on tokenId (NOT a published slug) so drafts work too.
// The page owns the "not available for this goal" empty state (decision #3/#4); the
// nav button in ProjectCard shows for every project regardless of intent.

interface PageProps {
  params: { token: string }
}

// Human-readable archetype names for the header (decision #2 — static metadata).
const ARCHETYPE_LABELS: Record<EmailArchetypeId, string> = {
  'show-up': 'Show-up sequence',
  'follow-up-nurture': 'Follow-up nurture',
  'lead-magnet-delivery': 'Lead-magnet delivery',
  'waitlist-warm-keeper': 'Waitlist warm-keeper',
  'welcome-series': 'Welcome series',
  activation: 'Activation series',
}

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_EMAIL_SEQUENCES_DISABLED === 'true'
}

/** Resolve the project's intent → 3-state plan from its Brief (defensive, never throws). */
function resolvePlan(brief: unknown) {
  const parsed = BriefSchema.safeParse(brief)
  const intent = parsed.success ? parsed.data.goal?.intent ?? null : null
  if (!intent) return { status: 'skipped' as const, archetype: null as EmailArchetypeId | null }
  const plan = getSequencePlanForIntent(intent)
  if (plan.status === 'available') return { status: 'available' as const, archetype: plan.def.archetype }
  return { status: plan.status, archetype: null as EmailArchetypeId | null }
}

export default async function EmailSequenceManagerPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const tokenId = params.token

  // Ownership gate (maps clerkId → internal user, handles orphan/admin/demo).
  const access = await assertProjectOwner(userId, tokenId, { action: 'email-sequences.view' })
  if (!access.ok) notFound()

  // assertProjectOwner does not return display data — load it separately.
  // Project has NO `name` column; the display field is `title`.
  const project = await prisma.project.findUnique({
    where: { tokenId },
    select: { title: true, brief: true },
  })
  if (!project) notFound()

  const title = stripHTMLTags(project.title || 'Untitled Project')

  // Kill-switch OR unmapped intent → clean "not available" state (never an error).
  const { status, archetype } = resolvePlan(project.brief)
  const available = !isDisabled() && status === 'available' && archetype !== null

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <Header />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        {available ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {ARCHETYPE_LABELS[archetype]} — {title}
              </h1>
              <p className="text-sm text-gray-500">
                Copy-only email sequence for this project&apos;s goal. Paste each email into
                Calendly Workflows or your ESP — Lessgo doesn&apos;t send them.
              </p>
            </div>
            <EmailSequencePanel token={tokenId} />
          </>
        ) : (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Email sequences — {title}</h1>
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-base font-medium text-gray-900 mb-1">
                Email sequences aren&apos;t available for this project&apos;s goal
              </p>
              <p className="text-sm text-gray-500">
                Goal-matched sequences are only offered for goals where a follow-up email flow
                helps (like booking a call or a demo). You can still edit and publish this project
                as usual.
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

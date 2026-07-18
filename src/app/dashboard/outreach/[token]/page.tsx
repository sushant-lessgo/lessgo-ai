import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { assertProjectOwner } from '@/lib/security'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import OutreachPanel from './OutreachPanel'

// Cold-outreach manager: per-project prospect-grounded outreach copy generator
// (copy only — Lessgo does not send). Keyed on tokenId (NOT a published slug) so
// drafts work too. Mirrors the email-sequences page shell.

interface PageProps {
  params: { token: string }
}

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_COLD_OUTREACH_DISABLED === 'true'
}

export default async function ColdOutreachManagerPage({ params }: PageProps) {
  // Kill-switch FIRST (decision #7) — feature disabled → 404, never an error.
  if (isDisabled()) notFound()

  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const tokenId = params.token

  // Ownership gate (maps clerkId → internal user, handles orphan/admin/demo).
  const access = await assertProjectOwner(userId, tokenId, { action: 'outreach.view' })
  if (!access.ok) notFound()

  // assertProjectOwner does not return display data — load it separately.
  // Project has NO `name` column; the display field is `title`.
  const project = await prisma.project.findUnique({
    where: { tokenId },
    select: { title: true },
  })
  if (!project) notFound()

  const title = stripHTMLTags(project.title || 'Untitled Project')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Cold outreach — {title}</h1>
          <p className="text-sm text-gray-500">
            Prospect-grounded outreach copy for this project. Paste a prospect&apos;s website URL or
            About text and generate platform-correct messages — Lessgo doesn&apos;t send them.
          </p>
        </div>

        <OutreachPanel token={tokenId} />
      </main>
    </div>
  )
}

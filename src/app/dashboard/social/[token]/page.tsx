import { auth } from '@clerk/nextjs/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/dashboard/Header'
import Footer from '@/components/shared/Footer'
import { prisma } from '@/lib/prisma'
import { assertProjectOwner } from '@/lib/security'
import { stripHTMLTags } from '@/utils/htmlSanitization'
import SocialPostsPanel from './components/SocialPostsPanel'
import PostLibrary from './components/PostLibrary'

// Social posts manager: per-project on-brand post generator + minimal library.
// Keyed on tokenId (NOT a published slug) so drafts work too (D1).
// Kill-switch (phase 7): NEXT_PUBLIC_SOCIAL_POSTS_DISABLED → clean "not available"
// state (never an error) — mirrors the email-sequences kill-switch.

interface PageProps {
  params: { token: string }
}

function isDisabled(): boolean {
  return process.env.NEXT_PUBLIC_SOCIAL_POSTS_DISABLED === 'true'
}

export default async function SocialManagerPage({ params }: PageProps) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const tokenId = params.token

  // Ownership gate (maps clerkId → internal user, handles orphan/admin/demo).
  const access = await assertProjectOwner(userId, tokenId, { action: 'social-posts.view' })
  if (!access.ok) notFound()

  // assertProjectOwner does not return display data — load it separately.
  // NOTE: Project has NO `name` column; the display field is `title`.
  const project = await prisma.project.findUnique({
    where: { tokenId },
    select: { title: true },
  })
  if (!project) notFound()

  const title = stripHTMLTags(project.title || 'Untitled Project')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900 font-body">
      <Header />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/dashboard" className="flex items-center text-gray-500 hover:text-gray-900 transition">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>

        {isDisabled() ? (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Social posts — {title}</h1>
            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-8 text-center">
              <p className="text-base font-medium text-gray-900 mb-1">
                Social posts aren&apos;t available right now
              </p>
              <p className="text-sm text-gray-500">
                This feature is temporarily unavailable. You can still edit and publish this
                project as usual.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Social posts — {title}
              </h1>
              <p className="text-sm text-gray-500">
                Generate on-brand posts from this project&apos;s data. Copy and paste them where you post.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SocialPostsPanel tokenId={tokenId} />
              <PostLibrary tokenId={tokenId} />
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { isTestimonialsEnabled } from '@/lib/testimonials/flag'
import { getCollectLinkByToken } from '@/lib/testimonials/collectLinks'
import CollectFormClient from '@/components/t/CollectFormClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { collectToken: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!isTestimonialsEnabled()) return {}
  const link = await getCollectLinkByToken(params.collectToken)
  const name = link?.project?.title?.trim() || 'this product'
  return {
    title: `Share your experience with ${name}`,
    robots: { index: false }, // collect pages aren't for search indexing
  }
}

export default async function CollectPage({ params }: PageProps) {
  if (!isTestimonialsEnabled()) notFound()

  const link = await getCollectLinkByToken(params.collectToken)
  if (!link) notFound()

  const projectTitle = link.project?.title?.trim() || 'us'

  if (!link.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">This link is no longer active</h1>
          <p className="text-sm text-gray-500">The owner has stopped collecting testimonials here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-brand-text mb-2">Share your experience with {projectTitle}</h1>
          <p className="text-sm text-gray-500">Your words help others. It only takes a minute.</p>
        </div>
        <CollectFormClient collectToken={params.collectToken} />
        <p className="mt-8 text-center text-xs text-gray-400">Powered by Lessgo</p>
      </main>
    </div>
  )
}

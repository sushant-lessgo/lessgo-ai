'use client'

import { BarChart3, Share2, MousePointer } from 'lucide-react'
import Link from 'next/link'

interface Props {
  slug: string
  publishedPageTitle: string
}

export default function EmptyState({ slug }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-12">
      <div className="max-w-md mx-auto text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-7 h-7 text-gray-400" />
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No analytics yet
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Start driving traffic to your page. Analytics appear as visitors arrive.
        </p>

        <div className="space-y-3 text-left mb-6">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <Share2 className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Share your page</p>
              <p className="text-xs text-gray-500">Social media, email, communities</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <MousePointer className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Use UTM tags</p>
              <p className="text-xs text-gray-500">Track which campaigns work best</p>
            </div>
          </div>
        </div>

        <Link
          href={`/p/${slug}`}
          target="_blank"
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800 transition"
        >
          View page
        </Link>
      </div>
    </div>
  )
}

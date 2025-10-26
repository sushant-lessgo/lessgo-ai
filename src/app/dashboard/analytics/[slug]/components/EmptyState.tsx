'use client'

import { BarChart3, Users, Share2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface Props {
  slug: string
  publishedPageTitle: string
}

export default function EmptyState({ slug, publishedPageTitle }: Props) {
  return (
    <div className="bg-white border border-brand-border rounded-lg p-12">
      <div className="max-w-2xl mx-auto text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="w-10 h-10 text-blue-600" />
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-brand-text mb-3">
          Analytics data coming soon
        </h3>

        {/* Description */}
        <p className="text-brand-mutedText mb-8">
          We collect analytics data daily at 2am UTC. Your first data will appear tomorrow morning.
          In the meantime, start driving traffic to your page!
        </p>

        {/* Action Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-semibold text-brand-text mb-1">1. Share Your Page</h4>
            <p className="text-sm text-brand-mutedText">
              Share your landing page on social media, email, or ads to start getting visitors.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <Share2 className="w-5 h-5 text-green-600" />
            </div>
            <h4 className="font-semibold text-brand-text mb-1">2. Use UTM Tags</h4>
            <p className="text-sm text-brand-mutedText">
              Track which campaigns drive the most traffic with UTM parameters in your links.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <h4 className="font-semibold text-brand-text mb-1">3. Check Back Daily</h4>
            <p className="text-sm text-brand-mutedText">
              Analytics update every morning. Come back to see your performance metrics.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center justify-center gap-4">
          <Link
            href={`/p/${slug}`}
            target="_blank"
            className="inline-flex items-center px-6 py-3 bg-brand-accentPrimary text-white rounded-md hover:bg-brand-logo transition font-medium"
          >
            View Published Page →
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-brand-border text-brand-text rounded-md hover:bg-gray-50 transition"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-8 pt-6 border-t border-brand-border">
          <p className="text-sm text-brand-mutedText">
            <strong>Pro tip:</strong> It takes about 50-100 visitors to get meaningful insights.
            Share your page with your target audience to start collecting data faster.
          </p>
        </div>
      </div>
    </div>
  )
}

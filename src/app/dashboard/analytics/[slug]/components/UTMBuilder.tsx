'use client'

import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'

interface Props {
  baseUrl: string
  slug: string
}

export default function UTMBuilder({ baseUrl, slug }: Props) {
  const [source, setSource] = useState('')
  const [medium, setMedium] = useState('')
  const [campaign, setCampaign] = useState('')
  const [copied, setCopied] = useState(false)

  const fullUrl = `${baseUrl}/p/${slug}`
  const hasParams = source || medium || campaign

  const buildUrl = () => {
    if (!hasParams) return fullUrl

    const params = new URLSearchParams()
    if (source) params.append('utm_source', source)
    if (medium) params.append('utm_medium', medium)
    if (campaign) params.append('utm_campaign', campaign)

    return `${fullUrl}?${params.toString()}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const presets = [
    { label: 'Twitter', source: 'twitter', medium: 'social' },
    { label: 'LinkedIn', source: 'linkedin', medium: 'social' },
    { label: 'Email', source: 'email', medium: 'email' },
    { label: 'Product Hunt', source: 'producthunt', medium: 'referral' },
  ]

  const handlePreset = (preset: { source: string; medium: string }) => {
    setSource(preset.source)
    setMedium(preset.medium)
  }

  return (
    <div className="bg-white border border-brand-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Link2 className="w-5 h-5 text-brand-accentPrimary" />
        <h3 className="text-lg font-semibold text-brand-text">UTM Campaign Builder</h3>
      </div>

      <p className="text-sm text-brand-mutedText mb-4">
        Create trackable links to measure which campaigns drive the most traffic and conversions.
      </p>

      {/* Quick Presets */}
      <div className="mb-4">
        <label className="text-xs font-medium text-brand-mutedText uppercase mb-2 block">
          Quick Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePreset(preset)}
              className="px-3 py-1 text-sm border border-brand-border rounded-md hover:bg-gray-50 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Fields */}
      <div className="space-y-3 mb-4">
        <div>
          <label className="text-xs font-medium text-brand-mutedText uppercase mb-1 block">
            Campaign Source *
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="e.g., twitter, newsletter, google"
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accentPrimary"
          />
          <p className="text-xs text-brand-mutedText mt-1">
            Where the traffic comes from (required for tracking)
          </p>
        </div>

        <div>
          <label className="text-xs font-medium text-brand-mutedText uppercase mb-1 block">
            Campaign Medium
          </label>
          <input
            type="text"
            value={medium}
            onChange={(e) => setMedium(e.target.value)}
            placeholder="e.g., social, email, cpc"
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accentPrimary"
          />
          <p className="text-xs text-brand-mutedText mt-1">Marketing medium</p>
        </div>

        <div>
          <label className="text-xs font-medium text-brand-mutedText uppercase mb-1 block">
            Campaign Name
          </label>
          <input
            type="text"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            placeholder="e.g., spring_sale, launch_week"
            className="w-full px-3 py-2 text-sm border border-brand-border rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accentPrimary"
          />
          <p className="text-xs text-brand-mutedText mt-1">Specific campaign identifier</p>
        </div>
      </div>

      {/* Generated URL */}
      <div className="bg-gray-50 border border-brand-border rounded-lg p-3">
        <label className="text-xs font-medium text-brand-mutedText uppercase mb-2 block">
          Generated URL
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 font-mono text-xs text-brand-text break-all bg-white px-3 py-2 rounded border border-gray-200">
            {buildUrl()}
          </div>
          <button
            onClick={handleCopy}
            disabled={!hasParams}
            className={`flex-shrink-0 p-2 rounded-md transition ${
              hasParams
                ? 'bg-brand-accentPrimary text-white hover:bg-brand-logo'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
        {!hasParams && (
          <p className="text-xs text-brand-mutedText mt-2">
            Add at least a campaign source to generate a trackable URL
          </p>
        )}
      </div>
    </div>
  )
}

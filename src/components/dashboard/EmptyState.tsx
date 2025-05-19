'use client'

import posthog from 'posthog-js'

export default function EmptyState() {
  const handleStart = () => {
    posthog.capture('start_from_empty_state_clicked')
    // Optional: trigger navigation or callback here
  }

  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-brand-border rounded-md py-12 px-6 text-center bg-white">
      <div className="text-4xl mb-4">📄</div>

      <h2 className="text-heading3 font-heading text-brand-text mb-2">
        No pages yet
      </h2>

      <p className="text-sm text-brand-mutedText mb-6 max-w-md">
        You haven’t created any landing pages yet. Start fresh and launch your first page in minutes.
      </p>

      <button
        onClick={handleStart}
        className="bg-brand-accentPrimary text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-orange-500 transition shadow-sm"
      >
        Start with a new landing page
      </button>
    </div>
  )
}

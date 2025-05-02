"use client"

import { useState } from "react"
import type { GPTOutput } from "@/modules/prompt/types"

type PromptFormProps = {
  onSuccess: (data: GPTOutput) => void
}

export default function PromptForm({ onSuccess }: PromptFormProps) {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/generate-landing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIdea: input }),
      })

      if (!res.ok) throw new Error("API call failed")

      const data = await res.json()
      onSuccess(data as GPTOutput)
    } catch (err) {
      setError("Something went wrong. Try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow-md border border-gray-200">


    <label htmlFor="idea" className="block text-lg font-semibold">
      Step 1 of 2: what's your idea?
    </label>

  
    <textarea
  id="idea"
  value={input}
  onChange={(e) => setInput(e.target.value)}
  placeholder="e.g., AI tool for lawyers that reduces contract review time by 75%"
  rows={4}
  className="w-full px-0 py-1.5 min-h-[96px] min-height: 44px bg-transparent text-black caret-black focus:outline-none focus:ring-2 "
  style={
    input.length === 0
      ? {
          animation: 'pulseBorder 2s infinite',
          boxShadow: 'none',
        }
      : {}
  }
/>


  
<button
  type="submit"
  className="mt-4 w-full md:w-auto px-6 py-3 bg-brand-accentPrimary text-white rounded-md hover:bg-orange-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accentPrimary disabled:opacity-50"
  disabled={loading}
>
  {loading ? 'Generating...' : 'Build My Page Now!'}
</button>


  
      {error && <p className="text-red-600">{error}</p>}
    </form>
  )
  
}

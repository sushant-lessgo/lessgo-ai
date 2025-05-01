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
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-lg font-semibold">What's your product idea?</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="My app converts YouTube videos into tweet threads..."
        rows={4}
        className="w-full p-3 border border-gray-300 rounded"
      />
      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Landing Page"}
      </button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  )
}

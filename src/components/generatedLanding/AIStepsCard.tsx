"use client"

import { useEffect, useRef } from "react"
import { Brain } from "lucide-react"
import posthog from "posthog-js"

const steps = [
  {
    title: "Scanned Indirect Voice of Customers",
    description: "The AI looked at how your target users talk about their problems across forums, reviews, and social media.",
  },
  {
    title: "Analyzed Similar Products",
    description: (
      <>
        Reviewed landing pages of top competitors like{" "}
        <a href="https://example.com" target="_blank" className="text-blue-600 underline">FitCoach</a>,{" "}
        <a href="https://example.com" target="_blank" className="text-blue-600 underline">QuickBurn</a>, and{" "}
        <a href="https://example.com" target="_blank" className="text-blue-600 underline">StrongAI</a>.
      </>
    ),
  },
  {
    title: "Extracted User Pain Points",
    description: "Identified emotional triggers and problem patterns that resonate most with your audience.",
  },
  {
    title: "Matched Copywriting Best Practices",
    description: "Applied proven landing page patterns for your market to improve clarity, persuasion, and trust.",
  },
]

export default function AIStepsCard() {
  const ref = useRef<HTMLDivElement>(null)

  // Track once when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          posthog.capture("ai_steps_viewed")
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="bg-white border border-gray-200 rounded-md shadow-sm px-5 py-4 space-y-6">
      <div className="flex items-center gap-2">
        <Brain className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight">
          What the AI Did
        </h3>
      </div>

      <ol className="space-y-6 list-decimal list-inside ml-2">
        {steps.map((step, i) => (
          <li key={i} className="space-y-1">
            <p className="text-sm font-medium text-gray-800">{step.title}</p>
            <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}

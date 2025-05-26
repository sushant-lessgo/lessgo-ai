"use client"

import { useEffect, useRef } from "react"
import { InfoIcon, Sparkles, Edit3, Zap, Rocket, Wand2 } from "lucide-react"
import posthog from "posthog-js"

export default function InstructionNote() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          posthog.capture("how_it_works_viewed")
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const steps = [
    {
      icon: <Sparkles className="w-4 h-4 text-gray-500" />,
      title: "Write One Sentence",
      description: "Describe your product idea in a single line... that’s all we need.",
    },
    {
      icon: <Wand2 className="w-4 h-4 text-gray-500" />,
      title: "Lessgo AI Thinks for You",
      description: "It analyzes your product, market, and competitors to write conversion-optimized copy.",
    },
    {
      icon: <Edit3 className="w-4 h-4 text-gray-500" />,
      title: "Click and Edit",
      description: "Click on any part of your landing page to instantly edit it... no coding required.",
    },
    {
      icon: <Rocket className="w-4 h-4 text-gray-500" />,
      title: "Instant publish",
      description: "Publish your landing page with one click. No hosting or setup needed.",
    },
    {
      icon: <Zap className="w-4 h-4 text-gray-500" />,
      title: "More Power Coming",
      description: "Multiple layouts, analytics and more features on the way. Stay tuned!",
    },
  ]

  return (
    <div ref={ref} className="bg-white border border-gray-200 rounded-md shadow-sm px-5 py-4 space-y-6">
      <div className="flex items-center gap-2">
        <InfoIcon className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight">
          How This Works
        </h3>
      </div>

      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-4">
            <div className="flex-none pt-1">{step.icon}</div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-800">{step.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

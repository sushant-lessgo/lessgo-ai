"use client"

import { useState } from "react"
import PromptForm from "@/modules/prompt/PromptForm"
import GeneratedLanding from "@/components/generatedLanding/GeneratedLanding"

console.log("PromptForm:", PromptForm)
console.log("GeneratedLanding:", GeneratedLanding)

import type { GPTOutput } from "@/modules/prompt/types"

export default function PromptPage() {
  const [gptOutput, setGptOutput] = useState<GPTOutput | null>(null)

  return (
    <main className="min-h-screen w-full p-8">
      {!gptOutput ? (
        <PromptForm onSuccess={setGptOutput} />
      ) : (
        <GeneratedLanding data={gptOutput} />
      )}
    </main>
  )
}

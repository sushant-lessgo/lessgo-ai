"use client"

import { useState } from "react"
import PromptForm from "@/modules/prompt/PromptForm"
import GeneratedLanding from "@/components/generatedLanding/GeneratedLanding"
import type { GPTOutput } from "@/modules/prompt/types"
import Logo from "@/components/shared/Logo"
import PageIntro from "@/components/shared/PageIntro"

export default function PromptPage() {
  const [gptOutput, setGptOutput] = useState<GPTOutput | null>(null)
  const [userInput, setUserInput] = useState<string>("")


  return (
    <main className="min-h-screen w-full bg-[#F5F6FA] flex flex-col items-center justify-start md:justify-center px-4 md:px-8 pb-12 pt-6">


      {!gptOutput ? (
        <div className="w-full max-w-4xl flex flex-col items-center">
          <div className="mb-12">
            <Logo size={240} />
          </div>
          <PageIntro
            
          />
         <section className="w-full bg-[#F5F5F5] p-6 md:p-8">
          <PromptForm onSuccess={(gptResult, input) => {
            setGptOutput(gptResult)
            setUserInput(input)
          }} />
          <p className="text-sm  text-gray-600 mt-2 pb-4 inline md:hidden">Engineered with high-conversion principles.</p>
          <p className="text-sm  text-gray-600 mt-2 pb-4 hidden md:inline">Engineered with high-conversion principles from 100+ successful landing pages.</p>
        </section>

          

        </div>
      ) : (
        <GeneratedLanding data={gptOutput} input={userInput} />

      )}
    </main>
  )
}

"use client"

import { useState } from "react"
import PromptForm from "@/modules/prompt/PromptForm"
import LandingPageRenderer from "@/modules/generatedLanding/LandingPageRenderer"
import type { GPTOutput } from "@/modules/prompt/types"
import Logo from "@/components/shared/Logo"
import PageIntro from "@/components/shared/PageIntro"
import { predefinedThemes } from "@/components/theme/predefinedThemes"


export default function PromptPage() {
  const [gptOutput, setGptOutput] = useState<GPTOutput | null>(null)
  const [userInput, setUserInput] = useState<string>("")

const [themeValues, setThemeValues] = useState<{
    primary: string;
    background: string;
    muted: string;
  } | null>(null)

  const handleSuccess = (gptResult: GPTOutput, input: string) => {
    setGptOutput(gptResult)
    setUserInput(input)

    // 🔍 Extract theme name
    const themeName = gptResult.theme

    // 🎨 Convert themeName to themeValues
    const matched = predefinedThemes.find(t => t.name === themeName)

    const derivedTheme = matched || {
      primary: '#14B8A6',
      background: '#F9FAFB',
      muted: '#6B7280',
    }

    setThemeValues(derivedTheme)
  }

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
        <LandingPageRenderer />

      )}
    </main>
  )
}

"use client"

import { useReducer } from "react"
import type { GPTOutput } from "@/modules/prompt/types"
import Header from "@/components/shared/Header"
import LeftPanel from "@/components/generatedLanding/LeftPanel"
import RightPanel from "@/modules/generatedLanding/RightPanel"
import Footer from "@/components/shared/Footer"

import {
  landingPageReducer,
  LandingPageState,
  Action
} from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  data: GPTOutput
  input: string
}

export default function GeneratedLanding({ data, input }: Props) {
  const [state, dispatch] = useReducer(landingPageReducer, data)

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-brand-text">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[30%] min-w-[280px] max-w-sm bg-slate-50 border-r border-gray-200 p-4 overflow-y-auto">
          <LeftPanel data={state} input={input} />
        </aside>

        {/* Right Panel */}
        <section className="w-[70%] flex-1 overflow-y-auto p-6 bg-white ring-1 border-l-2 border-gray-200 ring-slate-100">
          <div id="landing-page-preview">
            <RightPanel data={state} dispatch={dispatch} />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <Footer />
      </footer>
    </div>
  )
}

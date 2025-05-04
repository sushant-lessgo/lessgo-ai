"use client"

import { useReducer } from "react"
import type { GPTOutput } from "@/modules/prompt/types"
import Header from "@/components/shared/Header"
import LeftPanel from "@/components/generatedLanding/LeftPanel"
import RightPanel from "@/modules/generatedLanding/RightPanel"
import Footer from "@/components/shared/Footer"
import ActionButtons from "@/modules/generatedLanding/ActionButtons"
import {
  landingPageReducer,
  LandingPageState,
  Action
} from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  data: GPTOutput
}

export default function GeneratedLanding({ data }: Props) {
  const [state, dispatch] = useReducer(landingPageReducer, data)

  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-text">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[30%] min-w-[280px] max-w-sm border-r overflow-y-auto p-4 bg-brand-highlightBG">
          <LeftPanel data={state} />
        </aside>

        {/* Right Panel */}
        <section className="w-[70%] flex-1 overflow-y-auto p-6 bg-[#FFFCF8]">
          <div id="landing-page-preview">
            <RightPanel data={state} dispatch={dispatch} />
          </div>
          {/* <ActionButtons /> */}
        </section>
      </main>

      <footer className="border-t">
        <Footer />
      </footer>
    </div>
  )
}

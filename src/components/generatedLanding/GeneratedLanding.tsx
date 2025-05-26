"use client"

import { useReducer, useState } from "react";


import type { GPTOutput } from "@/modules/prompt/types"
import Header from "@/components/dashboard/Header"
import LeftPanel from "@/components/generatedLanding/LeftPanel"
import RightPanel from "@/modules/generatedLanding/RightPanel"
import Footer from "@/components/shared/Footer"
import { useEffect } from "react";
import { useThemeStore } from "@/stores/useThemeStore";

import {
  landingPageReducer,
  LandingPageState,
  Action
} from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  data: GPTOutput
  input: string
  themeValues: {
    primary: string;
    background: string;
    muted: string;
  }
}

export default function GeneratedLanding({ data, input, themeValues }: Props) {

console.log("🧩 visibleSections in generatedLanding data:", data.visibleSections);

  const [state, dispatch] = useReducer(landingPageReducer, data)
  const [inputText, setInputText] = useState<string>(input);

  
  const { setTheme, getFullTheme } = useThemeStore();

  useEffect(() => {
  if (!themeValues) return;

  const { primary, background, muted } = themeValues;

  // 1. Set in Zustand
  setTheme({ primary, background, muted });

  // 2. Inject CSS variables
  const fullTheme = getFullTheme();
  Object.entries(fullTheme).forEach(([key, val]) => {
    document.documentElement.style.setProperty(key, val);
  });
}, [themeValues]);






  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-brand-text">
      <Header />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-[30%] min-w-[280px] max-w-sm bg-slate-50 border-r border-gray-200 p-4 overflow-y-auto">
          <LeftPanel
            data={state}
            input={inputText}
            onUserInputRegenerate={(newInput) => {
              // TODO: Trigger GPT request here using newInput
              console.log("Regenerating from new input:", newInput)
            }}
            onMarketDetailsRegenerate={(updated) => {
              // TODO: Trigger GPT request here using updated values
              console.log("Regenerating from updated market details:", updated)
            }}
          />

        </aside>

        {/* Right Panel */}
        <section className="w-[70%] flex-1 overflow-y-auto p-6 bg-white ring-1 border-l-2 border-gray-200 ring-slate-100">
          <div id="landing-page-preview">
            <RightPanel data={state} dispatch={dispatch} inputText={input} />
          </div>
        </section>
      </main>

      <footer className="border-t">
        <Footer />
      </footer>
    </div>
  )
}

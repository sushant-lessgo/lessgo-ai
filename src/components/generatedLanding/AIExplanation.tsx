"use client"

import { useState } from "react"
import { BrainCircuit } from "lucide-react"

import type {
  CopywritingStrategy,
  MarketPositioning,
  TargetPersona,
} from "@/modules/prompt/types"

import AssumptionsCard from "@/components/generatedLanding/AIExplanation/AssumptionsCard"
import PersonaCard from "@/components/generatedLanding/AIExplanation/PersonaCard"
import MarketPositioningCard from "@/components/generatedLanding/AIExplanation/MarketPositioningCard"
import CopywritingStrategyCard from "@/components/generatedLanding/AIExplanation/CopywritingStrategyCard"

type Props = {
  criticalAssumptions: string[]
  targetPersona: TargetPersona
  marketPositioning: MarketPositioning
  copywritingStrategy: CopywritingStrategy
}

export default function AIExplanation({
  criticalAssumptions,
  targetPersona,
  marketPositioning,
  copywritingStrategy,
}: Props) {
  const [openCard, setOpenCard] = useState<string | null>("assumptions")

  const toggle = (key: string) => {
    setOpenCard(openCard === key ? null : key)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4">
        <BrainCircuit className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight">AI Thought Process</h3>
      </div>

      <div className="px-5 pb-4 pt-0 space-y-4">
        <AssumptionsCard
          open={openCard === "assumptions"}
          onToggle={() => toggle("assumptions")}
          assumptions={criticalAssumptions}
        />
        <PersonaCard
          open={openCard === "persona"}
          onToggle={() => toggle("persona")}
          persona={targetPersona}
        />
        <MarketPositioningCard
          open={openCard === "positioning"}
          onToggle={() => toggle("positioning")}
          positioning={marketPositioning}
        />
        <CopywritingStrategyCard
          open={openCard === "strategy"}
          onToggle={() => toggle("strategy")}
          strategy={copywritingStrategy}
        />
      </div>
    </div>
  )
}

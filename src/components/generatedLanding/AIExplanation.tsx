"use client"

import { useState } from "react"
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
    <div className="space-y-4">
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
  )
}

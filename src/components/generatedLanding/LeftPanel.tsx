import type { GPTOutput } from "@/modules/prompt/types"
import UserInputCard from "@/components/generatedLanding/UserInputCard"
import MarketDetailsCard from "@/components/generatedLanding/MarketDetailsCard"
import InstructionNote from "@/components/generatedLanding/InstructionNote"
import AIStepsCard from "@/components/generatedLanding/AIStepsCard"

type Props = {
  data: GPTOutput
  input: string
  onUserInputRegenerate: (newInput: string) => void
  onMarketDetailsRegenerate: (updated: {
    marketCategory: string
    marketSubcategory: string
    targetAudience: string
    problem: string
  }) => void
}

export default function LeftPanel({
  data,
  input,
  onUserInputRegenerate,
  onMarketDetailsRegenerate,
}: Props) {
  return (
    <div className="space-y-8 max-h-screen overflow-y-auto pr-2">
      {/* Section 1: User Input */}
      <section>
        <UserInputCard input={input} onRegenerate={onUserInputRegenerate} />
      </section>

      {/* Section 2: Market Details */}
      <section>
        <MarketDetailsCard
          marketCategory={data.meta.marketCategory}
          // marketSubcategory={data.explanation.market_positioning.subcategory || ""}
          // targetAudience={data.explanation.target_persona.target_user}
          // problem={data.explanation.target_persona.pain_point}
          marketSubcategory={data.meta.marketSubcategory}
          targetAudience={data.meta.targetAudience}
          problem={data.meta.problemBeingSolved}
          onRegenerate={onMarketDetailsRegenerate}
        />
      </section>

      {/* Section 3: AI Steps */}
      <section>
        <AIStepsCard />
      </section>

      {/* Section 4: Instructions */}
      <section>
        <InstructionNote />
      </section>
    </div>
  )
}

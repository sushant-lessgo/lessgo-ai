import type { GPTOutput } from "@/modules/prompt/types"
import UserInputCard from "@/components/generatedLanding/UserInputCard"
import AIExplanation from "@/components/generatedLanding/AIExplanation"
import InstructionNote from "@/components/generatedLanding/InstructionNote"

type Props = {
  data: GPTOutput
  input: string
}

export default function LeftPanel({ data, input }: Props) {
  return (
    <div className="space-y-8">
      {/* Zone 1: User Input */}
      <section>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Lessgo Controls
        </div>
        <UserInputCard input={input} />
      </section>

      {/* Zone 2: AI Thought Process */}
      <section>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          AI Breakdown
        </div>
        <AIExplanation
          criticalAssumptions={data.explanation.critical_assumptions}
          targetPersona={data.explanation.target_persona}
          marketPositioning={data.explanation.market_positioning}
          copywritingStrategy={data.explanation.copywriting_strategy}
        />
      </section>

      {/* Zone 3: Instruction */}
      <section>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Instructions
        </div>
        <InstructionNote />
      </section>
    </div>
  )
}

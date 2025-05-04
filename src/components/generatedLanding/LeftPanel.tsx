import type { GPTOutput } from "@/modules/prompt/types"
import UserInputCard from "./UserInputCard"
import AIExplanation from "./AIExplanation"
import InstructionNote from "./InstructionNote"

type Props = {
  data: GPTOutput
  input: string
}

export default function LeftPanel({ data, input }: Props) {
  return (
    <div className="space-y-6">
  <div>
    <h2 className="text-xs font-body font-bold text-gray-500 uppercase tracking-wide">
      Lessgo Controls
    </h2>
  </div>



    <div className="flex flex-col gap-6">
      <UserInputCard input={input} />

      <AIExplanation
        criticalAssumptions={data.explanation.critical_assumptions}
        targetPersona={data.explanation.target_persona}
        marketPositioning={data.explanation.market_positioning}
        copywritingStrategy={data.explanation.copywriting_strategy}
      />

      <InstructionNote />
    </div>
    </div>
  )
  
}

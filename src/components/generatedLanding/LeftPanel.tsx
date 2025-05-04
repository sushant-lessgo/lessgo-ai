import type { GPTOutput } from "@/modules/prompt/types"
import UserInputCard from "./UserInputCard"
import AIExplanation from "./AIExplanation"
import InstructionNote from "./InstructionNote"

type Props = {
  data: GPTOutput
}

export default function LeftPanel({ data }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <UserInputCard input={data.input} />

      <AIExplanation
        criticalAssumptions={data.explanation.critical_assumptions}
        targetPersona={data.explanation.target_persona}
        marketPositioning={data.explanation.market_positioning}
        copywritingStrategy={data.explanation.copywriting_strategy}
      />

      <InstructionNote />
    </div>
  )
}

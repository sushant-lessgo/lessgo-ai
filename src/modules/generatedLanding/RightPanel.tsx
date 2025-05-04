import type { GPTOutput } from "@/modules/prompt/types"
import LandingPagePreview from "@/components/generatedLanding/LandingPagePreview"
import ActionButtons from "@/modules/generatedLanding/ActionButtons"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  data: GPTOutput
  dispatch: React.Dispatch<Action>
}

export default function RightPanel({ data, dispatch }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <LandingPagePreview data={data} dispatch={dispatch} />

      <ActionButtons />
    </div>
  )
}

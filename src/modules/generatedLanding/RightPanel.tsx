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
    <div className="flex flex-col items-center gap-8 px-6 py-8  bg-slate-100 min-h-screen">
      {/* Label + Preview Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md w-full max-w-[800px] p-6 space-y-6 mb-6 ">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
          Live Preview – Your Landing Page
        </h2>

        <div className="rounded-xl shadow-xl p-8 bg-white">
          <LandingPagePreview data={data} dispatch={dispatch} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-[800px] sticky bottom-0 z-10 bg-slate-50 border-t border-gray-200 py-4 px-4 flex justify-end gap-4 shadow-sm">
        <ActionButtons />
      </div>
    </div>
  )
}




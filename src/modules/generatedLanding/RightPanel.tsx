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
    <div className="flex flex-col items-center px-6 py-10 bg-slate-100 min-h-screen">
      
      {/* Preview Block */}
      <div className="w-full max-w-5xl bg-white border border-gray-200 rounded-xl shadow-md mb-8 overflow-hidden">
        <div className="px-6 pt-6 pb-2 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Live Preview – Your Landing Page
          </h2>
        </div>

        <div className="bg-white p-8">
          <LandingPagePreview data={data} dispatch={dispatch} />
        </div>
      </div>

      {/* Sticky Action Buttons */}
      <div className="w-full max-w-5xl sticky bottom-0 z-10 bg-slate-50 border-t border-gray-200 py-4 px-4 flex justify-end gap-4 shadow-sm">
        <ActionButtons />
      </div>
    </div>
  )
}

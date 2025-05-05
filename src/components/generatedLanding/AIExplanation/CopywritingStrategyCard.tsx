import { PenLine, ChevronDown, ChevronRight } from "lucide-react"
import type { CopywritingStrategy } from "@/modules/prompt/types"

type Props = {
  strategy: CopywritingStrategy
  open: boolean
  onToggle: () => void
}

export default function CopywritingStrategyCard({ strategy, open, onToggle }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 tracking-tight">Copywriting Strategy</h3>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-4 pt-0">
          <ul className="text-sm text-gray-700 leading-relaxed space-y-1">
            <li>
              <strong className="font-medium text-gray-600">Tone:</strong> {strategy.tone}
            </li>
            <li>
              <strong className="font-medium text-gray-600">Structure:</strong> {strategy.structure_choice}
            </li>
            <li>
              <strong className="font-medium text-gray-600">Persuasion Focus:</strong> {strategy.persuasion_focus}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

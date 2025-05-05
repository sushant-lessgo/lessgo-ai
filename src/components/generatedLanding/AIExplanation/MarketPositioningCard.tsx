import { BarChart3, ChevronDown, ChevronRight } from "lucide-react"
import type { MarketPositioning } from "@/modules/prompt/types"

type Props = {
  positioning: MarketPositioning
  open: boolean
  onToggle: () => void
}

export default function MarketPositioningCard({ positioning, open, onToggle }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 tracking-tight">Market Positioning</h3>
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
              <strong className="font-medium text-gray-600">Category:</strong> {positioning.category}
            </li>
            <li>
              <strong className="font-medium text-gray-600">Competitors:</strong> {positioning.primary_competitors.join(", ")}
            </li>
            <li>
              <strong className="font-medium text-gray-600">You’re Different Because:</strong> {positioning.key_differentiation}
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

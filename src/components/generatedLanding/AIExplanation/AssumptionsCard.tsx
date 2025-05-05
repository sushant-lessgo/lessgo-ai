import { ChevronDown, ChevronRight, Sparkles } from "lucide-react"

type Props = {
  assumptions: string[]
  open: boolean
  onToggle: () => void
}

export default function AssumptionsCard({ assumptions, open, onToggle }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 tracking-tight">Key Assumptions</h3>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {open && (
        <div className="px-5 pb-4 pt-0">
          <ul className="list-disc list-inside text-sm text-gray-700 leading-relaxed space-y-1">
            {assumptions.map((assumption, i) => (
              <li key={i}>{assumption}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

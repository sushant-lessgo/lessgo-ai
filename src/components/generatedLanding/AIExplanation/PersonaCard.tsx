import { UserRound, ChevronDown, ChevronRight } from "lucide-react"
import type { TargetPersona } from "@/modules/prompt/types"

type Props = {
  persona: TargetPersona
  open: boolean
  onToggle: () => void
}

export default function PersonaCard({ persona, open, onToggle }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-5 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <UserRound className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-700 tracking-tight">Target Persona</h3>
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
              <strong className="font-medium text-gray-600">Role:</strong> {persona.role}
            </li>
            <li>
              <strong className="font-medium text-gray-600">Pain:</strong> {persona.pain_points}
            </li>
            <li>
              <strong className="font-medium text-gray-600">Aspiration:</strong> {persona.aspirations}
            </li>
            <li>
              <strong className="font-medium text-gray-600">Skill Level:</strong> {persona.sophistication_level}/5
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

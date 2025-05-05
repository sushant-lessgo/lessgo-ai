import { Info } from "lucide-react"

export default function InstructionNote() {
  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4">
        <Info className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight">How This Works</h3>
      </div>

      <div className="px-5 pb-4 pt-0">
        <ul className="list-disc list-inside text-sm text-gray-700 leading-relaxed space-y-1">
          <li>
            This page was generated from a single line of input. Every word is optimized for conversion.
          </li>
          <li>
            Double-click any text to edit. Font, color, and layout controls are coming soon.
          </li>
          <li>
            Download the HTML and customize anything—images, styles, code.
          </li>
          <li>
            Features in progress: login, dashboards, one-click publish.
          </li>
          <li>
            Want influence? Book a 15-minute call with the founder.
          </li>
        </ul>
      </div>
    </div>
  )
}

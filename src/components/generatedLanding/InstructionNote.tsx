import { InfoIcon, Sparkles, Edit3, Download, Rocket, Handshake } from "lucide-react"
import { ReactNode } from "react"


export default function InstructionNote() {
  const steps: {
    icon: JSX.Element
    title: string
    description: ReactNode
  }[] = [
    {
      icon: <Sparkles className="w-4 h-4 text-gray-500" />,
      title: "One-Line Input",
      description: "You write one sentence. AI builds a high-conversion landing page.",
    },
    {
      icon: <Edit3 className="w-4 h-4 text-gray-500" />,
      title: "Live Editing",
      description: "Double-click any text to change it directly. No coding needed.",
    },
    {
      icon: <Download className="w-4 h-4 text-gray-500" />,
      title: "Full Export",
      description: "Download HTML and customize further—images, layout, anything.",
    },
    {
      icon: <Rocket className="w-4 h-4 text-gray-500" />,
      title: "What’s Coming",
      description: "One-click publish, dashboard, custom themes, and more.",
    },
    {
      icon: <Handshake className="w-4 h-4 text-gray-500" />,
      title: "Shape the Roadmap",
      description: (
        <>
          Book a 15-minute call with the founder.{" "}
          <a
            href="https://t.co/kx0zFbtbri"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline"
          >
            Pick a time
          </a>
          .
        </>
      ),
    }
  ]

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-sm px-5 py-4 space-y-6">
      <div className="flex items-center gap-2">
  <InfoIcon className="w-4 h-4 text-gray-500" />
  <h3 className="text-sm font-semibold text-gray-700 tracking-tight">How This Works</h3>
</div>

      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-4">
            <div className="flex-none pt-1">{step.icon}</div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-800">{step.title}</p>
              <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

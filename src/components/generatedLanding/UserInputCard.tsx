import { Sparkles } from "lucide-react"

type Props = {
    input: string
  }
  
  export default function UserInputCard({ input }: Props) {
    return (
      <div className="bg-white rounded-md border border-gray-200 text-gray-800 p-5 shadow-sm space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 tracking-tight flex items-center gap-2">
  <Sparkles className="w-4 h-4 text-gray-500" />
  Your Product Idea
</h3>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{input}</p>
      </div>
    )
  }
  
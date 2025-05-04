type Props = {
    input: string
  }
  
  export default function UserInputCard({ input }: Props) {
    return (
      <div className="bg-white rounded-md border border-gray-200 text-gray-800 p-5 shadow-sm space-y-2">
        <h3 className="text-heading4 text-brand-logo">Your Product Idea</h3>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{input}</p>
      </div>
    )
  }
  
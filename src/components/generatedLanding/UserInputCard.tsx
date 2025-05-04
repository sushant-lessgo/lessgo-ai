type Props = {
    input: string
  }
  
  export default function UserInputCard({ input }: Props) {
    return (
      <div className="bg-white border border-gray-200 rounded p-4">
        <h3 className="text-heading4 text-brand-logo mb-2">Your Product Idea</h3>
        <p className="text-sm text-gray-800 whitespace-pre-wrap">{input}</p>
      </div>
    )
  }
  
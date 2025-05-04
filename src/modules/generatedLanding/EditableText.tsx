type Props = {
    value: string
    onChange: (value: string) => void
    className?: string
  }
  
  export default function EditableText({ value, onChange, className = "" }: Props) {
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.innerText.trim())}
        className={`outline-none cursor-text focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        {value}
      </div>
    )
  }
  
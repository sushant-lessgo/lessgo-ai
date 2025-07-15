type Props = {
    value: string
    onChange: (value: string) => void
    className?: string
    isEditable: boolean
    sectionId?: string
    elementKey?: string
  }
  
  // export default function EditableText({ value, onChange, className = "" }: Props) {
  //   return (
  //     <div
  //       contentEditable
  //       suppressContentEditableWarning
  //       onBlur={(e) => onChange(e.currentTarget.innerText.trim())}
  //       className={`outline-none cursor-text focus:ring-2 focus:ring-blue-500 ${className}`}
  //     >
  //       {value}
  //     </div>
  //   )
  // }
  

  export default function EditableText({ value, onChange, className = "", isEditable, sectionId, elementKey}: Props) {
    if (!isEditable) {
      return (
        <div 
          className={className}
          data-section-id={sectionId}
          data-element-key={elementKey}
        >
          {value}
        </div>
      );
    }
  
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onChange(e.currentTarget.innerText.trim())}
        className={`px-3 py-2 rounded-md outline-none cursor-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        style={{ minHeight: '44px' }}
        data-section-id={sectionId}
        data-element-key={elementKey}
      >
        {value}
      </div>
    );
  }
  
  
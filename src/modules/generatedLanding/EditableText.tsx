type Props = {
    value: string
    onChange: (value: string) => void
    className?: string
    style?: React.CSSProperties
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
  

  export default function EditableText({ value, onChange, className = "", style, isEditable, sectionId, elementKey}: Props) {
    if (!isEditable) {
      return (
        <div 
          className={className}
          style={style}
          data-section-id={sectionId}
          data-element-key={elementKey}
        >
          {value}
        </div>
      );
    }

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
      const newValue = e.currentTarget.innerText.trim();
      console.log('📝 EditableText handleBlur called');
      console.log('📝 Original value:', value);
      console.log('📝 New value:', newValue);
      
      // Only call onChange if value actually changed to prevent unnecessary re-renders
      if (newValue !== value) {
        console.log('📝 EditableText: Value changed, calling onChange');
        onChange(newValue);
      } else {
        console.log('📝 EditableText: Value unchanged, skipping onChange');
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Save content on Enter key
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const newValue = e.currentTarget.innerText.trim();
        if (newValue !== value) {
          onChange(newValue);
        }
        e.currentTarget.blur();
      }
      // Cancel editing on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        e.currentTarget.innerText = value; // Restore original value
        e.currentTarget.blur();
      }
    };
  
    return (
      <div
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`px-3 py-2 rounded-md outline-none cursor-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
        style={{ minHeight: '44px', ...style }}
        data-section-id={sectionId}
        data-element-key={elementKey}
      >
        {value}
      </div>
    );
  }
  
  
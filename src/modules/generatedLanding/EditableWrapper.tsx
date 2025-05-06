import { Pencil } from 'lucide-react';

export default function EditableWrapper({ children }: { children: React.ReactNode }) {
    return (
      <div className="group inline-block align-top w-full">
        <div className="relative cursor-text px-1 py-1 transition-colors hover:bg-editable-bg hover:outline-editable hover:outline-dashed hover:outline-1">
          {children}
  
          {/* Pencil icon: visible on hover or focus within */}
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
  <Pencil className="w-editable-icon h-editable-icon text-editable-icon" strokeWidth={1.8} />
</div>
        </div>
      </div>
    );
  }
  
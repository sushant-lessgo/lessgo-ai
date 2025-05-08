import { Pencil } from 'lucide-react';

export default function EditableWrapper({
  children,
  useAltHover = false,
  isEditable = true,
}: {
  children: React.ReactNode;
  useAltHover?: boolean;
  isEditable?: boolean;
}) {
  if (!isEditable) {
    return <div>{children}</div>;
  }

  return (
    <div className="group inline-block align-top w-full">
      <div
        className={`relative cursor-text px-1 py-1 transition-colors hover:outline-editable hover:outline-dashed  ${
          useAltHover ? 'hover:bg-editable-primaryBg hover:text-black' : 'hover:bg-editable-bg'
        }`}
      >
        {children}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 ease-in-out pointer-events-none">
          <Pencil
            className={`w-editable-icon h-editable-icon ${
              useAltHover ? 'text-editable-primaryIcon' : 'text-editable-icon'
            }`}
            strokeWidth={1.8}
          />
        </div>
      </div>
    </div>
  );
}


  
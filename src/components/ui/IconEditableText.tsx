import React, { useState, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { EditableAdaptiveText } from '@/components/layout/EditableContent';
import IconPicker from './IconPicker';
import { decodeIcon } from '@/lib/iconStorage';
import { lucideNameToPascalCase } from '@/lib/iconStorage';

interface IconEditableTextProps {
  mode: 'edit' | 'preview';
  value: string;
  onEdit: (value: string) => void;
  backgroundType?: 'neutral' | 'primary' | 'secondary' | 'divider' | 'theme' | 'custom';
  colorTokens?: any;
  variant?: 'body' | 'muted';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  sectionId?: string;
  elementKey?: string;
  sectionBackground?: string;
  // Icon-specific props
  iconSize?: 'sm' | 'md' | 'lg' | 'xl';
  showIconButton?: boolean;
}

const IconEditableText: React.FC<IconEditableTextProps> = ({
  mode,
  value,
  onEdit,
  backgroundType = 'neutral',
  colorTokens = {},
  variant = 'body',
  className = '',
  style = {},
  placeholder = '🎯',
  sectionId,
  elementKey,
  sectionBackground,
  iconSize = 'md',
  showIconButton = true,
  ...props
}) => {
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const iconButtonRef = useRef<HTMLButtonElement>(null);

  // Size classes for different icon sizes
  const sizeClasses = {
    sm: 'text-base min-w-[1.5rem] min-h-[1.5rem]',
    md: 'text-xl min-w-[2rem] min-h-[2rem]',
    lg: 'text-2xl min-w-[3rem] min-h-[3rem]',
    xl: 'text-3xl min-w-[4rem] min-h-[4rem]'
  };

  const handleIconButtonClick = () => {
    if (iconButtonRef.current) {
      const rect = iconButtonRef.current.getBoundingClientRect();
      setTriggerRect(rect);
      setShowIconPicker(true);
    }
  };

  const handleIconChange = (newIcon: string) => {
    onEdit(newIcon);
    setShowIconPicker(false);
  };

  // Render icon value (emoji or Lucide component)
  const renderIconValue = (iconValue: string) => {
    if (!iconValue) {
      return null;
    }

    const decoded = decodeIcon(iconValue);

    // Case 1: Lucide icon
    if (decoded.type === 'lucide') {
      const componentName = lucideNameToPascalCase(decoded.name);
      const IconComponent = (LucideIcons as any)[componentName];

      if (IconComponent) {
        const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 };
        const size = sizeMap[iconSize];
        return <IconComponent size={size} strokeWidth={2} className="inline-block" />;
      } else {
        // Fallback for missing Lucide icon
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[IconEditableText] Lucide icon not found: ${decoded.name}`);
        }
        return <span title={`Missing icon: ${decoded.name}`}>❓</span>;
      }
    }

    // Case 2: Legacy SVG format - convert to emoji fallback
    if (decoded.type === 'svg') {
      const svgToEmojiMap: Record<string, string> = {
        'target': '🎯',
        'bolt': '⚡',
        'lock-closed': '🔒',
        'star': '⭐',
        'check-circle': '✅',
        'color-swatch': '🎨',
        'link': '🔗',
        'light-bulb': '💡',
        'rocket': '🚀',
        'currency-dollar': '💰',
        'chart-bar': '📊',
        'wrench': '🔧'
      };
      return <span>{svgToEmojiMap[decoded.name] || '⭐'}</span>;
    }

    // Case 3: Emoji (direct render)
    return <span>{decoded.name}</span>;
  };

  // Enhanced className for icon display
  const iconClassName = `
    ${className} 
    ${sizeClasses[iconSize]} 
    flex items-center justify-center text-center cursor-text
    ${mode !== 'preview' ? 'hover:bg-gray-50 rounded border border-transparent hover:border-gray-200' : ''}
  `.trim();

  if (mode === 'preview') {
    return (
      <span
        className={iconClassName}
        style={style}
      >
        {renderIconValue(value || placeholder)}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center group/icon-edit">
      {/* Icon display (not text-editable, use picker instead) */}
      <div
        className={iconClassName}
        style={style}
      >
        {renderIconValue(value || placeholder)}
      </div>

      {/* Icon picker trigger button */}
      {showIconButton && (
        <button
          ref={iconButtonRef}
          onClick={handleIconButtonClick}
          className="
            opacity-0 group-hover/icon-edit:opacity-100
            ml-1 p-1 rounded
            bg-blue-500 hover:bg-blue-600
            text-white text-xs
            transition-all duration-200
            flex items-center justify-center
            min-w-[20px] h-5
            shadow-sm hover:shadow-md
          "
          title="Choose icon"
          type="button"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      )}

      {/* Icon picker modal */}
      {showIconPicker && (
        <IconPicker
          value={value}
          onChange={handleIconChange}
          onClose={() => setShowIconPicker(false)}
          triggerRect={triggerRect || undefined}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export default IconEditableText;
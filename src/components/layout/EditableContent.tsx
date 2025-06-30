// components/layout/EditableContent.tsx - ENHANCED with Dynamic Text Colors
// Combines ModeWrapper with content update logic and styling

import React from 'react';

interface EditableContentProps {
  mode: 'edit' | 'preview';
  value: string;
  onEdit: (value: string) => void;
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  children?: React.ReactNode;
}

export function EditableContent({
  mode,
  value,
  onEdit,
  element: Element,
  className = '',
  style = {},
  placeholder,
  required = false,
  multiline = false,
  children
}: EditableContentProps) {
  
  // Determine if content should be shown (in preview mode or edit mode with content/required)
  const shouldShow = mode === 'preview' || value || required;
  
  if (!shouldShow) return null;

  if (mode === 'edit') {
    return (
      <Element
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onEdit(e.currentTarget.textContent || '')}
        className={`
          outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
          rounded px-1 min-h-[24px] cursor-text hover:bg-gray-50 
          ${!value && 'opacity-50'} 
          ${className}
        `}
        style={style}
        data-placeholder={placeholder || 'Click to edit'}
      >
        {value || placeholder || 'Click to edit'}
      </Element>
    );
  }

  // Preview mode
  return (
    <Element className={className} style={style}>
      {children || value}
    </Element>
  );
}

// ✅ ENHANCED: Specialized versions with dynamic text color support
export function EditableHeadline({ 
  mode, 
  value, 
  onEdit, 
  level = 'h1',
  colorClass, // ✅ Can now be dynamic from useLayoutComponent
  textStyle,
  dynamicColor, // ✅ NEW: Dynamic color from background-aware system
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  level?: 'h1' | 'h2' | 'h3' | 'h4',
  colorClass?: string,
  textStyle?: React.CSSProperties,
  dynamicColor?: string // ✅ NEW: For background-aware text colors
}) {
  
  // ✅ Use dynamic color if provided, fallback to colorClass
  const finalColorClass = dynamicColor || colorClass || 'text-gray-900';
  
  console.log(`🎨 EditableHeadline using color: ${finalColorClass}`, {
    dynamicColor,
    colorClass,
    finalColor: finalColorClass,
    isDynamic: !!dynamicColor
  });
  
  return (
    <EditableContent
      mode={mode}
      value={value}
      onEdit={onEdit}
      element={level}
      className={`font-bold leading-tight ${finalColorClass}`}
      style={textStyle}
      required
      {...props}
    />
  );
}

export function EditableText({ 
  mode, 
  value, 
  onEdit, 
  colorClass,
  textStyle,
  dynamicColor, // ✅ NEW: Dynamic color from background-aware system
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  colorClass?: string,
  textStyle?: React.CSSProperties,
  dynamicColor?: string // ✅ NEW: For background-aware text colors
}) {
  
  // ✅ Use dynamic color if provided, fallback to colorClass
  const finalColorClass = dynamicColor || colorClass || 'text-gray-600';
  
  
  return (
    <EditableContent
      mode={mode}
      value={value}
      onEdit={onEdit}
      element="p"
      className={`leading-relaxed ${finalColorClass}`}
      style={textStyle}
      {...props}
    />
  );
}

export function EditableBadge({ 
  mode, 
  value, 
  onEdit, 
  colorTokens,
  textStyle,
  accentBased = false, // ✅ NEW: Use accent colors instead of generic blue
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  colorTokens?: any,
  textStyle?: React.CSSProperties,
  accentBased?: boolean // ✅ NEW: Whether to use accent colors
}) {
  
  // ✅ ENHANCED: Use accent colors when available
  let badgeClasses = '';
  
  if (accentBased && colorTokens?.ctaBg) {
    // Extract color name from accent CSS (e.g., "bg-purple-600" -> "purple")
    const accentColorMatch = colorTokens.ctaBg.match(/bg-(\w+)-\d+/);
    const accentColorName = accentColorMatch ? accentColorMatch[1] : 'blue';
    
    badgeClasses = `bg-${accentColorName}-100 text-${accentColorName}-800 border-${accentColorName}-200 border`;
    
    console.log(`🎨 EditableBadge using accent colors:`, {
      accentCSS: colorTokens.ctaBg,
      extractedColor: accentColorName,
      finalClasses: badgeClasses
    });
  } else {
    // Fallback to generic blue
    badgeClasses = 'bg-blue-100 text-blue-800';
  }
  
  return (
    <EditableContent
      mode={mode}
      value={value}
      onEdit={onEdit}
      element="span"
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium 
        ${badgeClasses}
      `}
      style={textStyle}
      {...props}
    />
  );
}

// ✅ NEW: Enhanced Badge specifically for accent-based designs
export function AccentBadge({ 
  mode, 
  value, 
  onEdit, 
  colorTokens,
  textStyle,
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  mode: 'edit' | 'preview',
  value: string,
  onEdit: (value: string) => void,
  colorTokens?: any,
  textStyle?: React.CSSProperties
}) {
  return (
    <EditableBadge
      mode={mode}
      value={value}
      onEdit={onEdit}
      colorTokens={colorTokens}
      textStyle={textStyle}
      accentBased={true}
      {...props}
    />
  );
}

// ✅ NEW: Editable content with automatic color adaptation
export function EditableAdaptiveHeadline({
  mode,
  value,
  onEdit,
  level = 'h1',
  backgroundType,
  colorTokens,
  textStyle,
  ...props
}: Omit<EditableContentProps, 'element'> & {
  level?: 'h1' | 'h2' | 'h3' | 'h4',
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any,
  textStyle?: React.CSSProperties
}) {
  
  // ✅ Auto-select text color based on background
  const getAdaptiveTextColor = () => {
    switch(backgroundType) {
      case 'primary':
        return colorTokens.textOnDark || colorTokens.dynamicHeading || 'text-white';
      case 'secondary':
      case 'neutral':
      case 'divider':
        return colorTokens.textOnLight || colorTokens.dynamicHeading || 'text-gray-900';
      default:
        return colorTokens.textPrimary || 'text-gray-900';
    }
  };
  
  const adaptiveColor = getAdaptiveTextColor();
  
  console.log(`🎨 EditableAdaptiveHeadline auto-selected color:`, {
    backgroundType,
    selectedColor: adaptiveColor,
    availableColors: {
      textOnDark: colorTokens.textOnDark,
      textOnLight: colorTokens.textOnLight,
      dynamicHeading: colorTokens.dynamicHeading
    }
  });
  
  return (
    <EditableHeadline
      mode={mode}
      value={value}
      onEdit={onEdit}
      level={level}
      dynamicColor={adaptiveColor}
      textStyle={textStyle}
      {...props}
    />
  );
}

export function EditableAdaptiveText({
  mode,
  value,
  onEdit,
  backgroundType,
  colorTokens,
  textStyle,
  variant = 'body', // 'body' or 'muted'
  ...props
}: Omit<EditableContentProps, 'element'> & {
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any,
  textStyle?: React.CSSProperties,
  variant?: 'body' | 'muted'
}) {
  
  // ✅ Auto-select text color based on background
  const getAdaptiveTextColor = () => {
    switch(backgroundType) {
      case 'primary':
        return variant === 'muted' ? 
          (colorTokens.textInverse || colorTokens.dynamicMuted || 'text-gray-200') :
          (colorTokens.textOnDark || colorTokens.dynamicBody || 'text-white');
      case 'secondary':
      case 'neutral':
      case 'divider':
        return variant === 'muted' ? 
          (colorTokens.textMuted || colorTokens.dynamicMuted || 'text-gray-500') :
          (colorTokens.textSecondary || colorTokens.dynamicBody || 'text-gray-600');
      default:
        return variant === 'muted' ? 
          (colorTokens.textMuted || 'text-gray-500') :
          (colorTokens.textSecondary || 'text-gray-600');
    }
  };
  
  const adaptiveColor = getAdaptiveTextColor();
  
  return (
    <EditableText
      mode={mode}
      value={value}
      onEdit={onEdit}
      dynamicColor={adaptiveColor}
      textStyle={textStyle}
      {...props}
    />
  );
}
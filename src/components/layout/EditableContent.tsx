import React, { useCallback, useState, useMemo } from 'react';
import { InlineTextEditor, defaultEditorConfig } from '@/app/edit/[token]/components/editor/InlineTextEditor';
import { useTextToolbarIntegration } from '@/hooks/useTextToolbarIntegration';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEditStore } from '@/hooks/useEditStore';
import { generateAccessibleBadgeColors } from '@/utils/textContrastUtils';
import type { TextFormatState, AutoSaveConfig, InlineEditorConfig, TextSelection } from '@/app/edit/[token]/components/editor/InlineTextEditor';

interface EditableContentProps {
  mode: 'edit' | 'preview';
  value: string;
  onEdit: (value: string) => void;
  element: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  children?: React.ReactNode;
  
  // Enhanced props for inline editor
  sectionId?: string;
  elementKey?: string;
  formatState?: TextFormatState;
  onFormatChange?: (format: TextFormatState) => void;
  editorConfig?: Partial<InlineEditorConfig>;
  autoSave?: Partial<AutoSaveConfig>;
  enableInlineEditor?: boolean;
}

const defaultFormatState: TextFormatState = {
  bold: false,
  italic: false,
  underline: false,
  color: '#000000',
  fontSize: '16px',
  fontFamily: 'inherit',
  textAlign: 'left',
  lineHeight: '1.5',
  letterSpacing: 'normal',
  textTransform: 'none',
};

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
  children,
  sectionId,
  elementKey,
  formatState = defaultFormatState,
  onFormatChange,
  editorConfig = {},
  autoSave = {},
  enableInlineEditor = true,
  onDragStart,
  onDragEnd,
  onDrop,
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormatState, setCurrentFormatState] = useState(formatState);
  
  // Get showTextToolbar from the store
  const showTextToolbar = useEditStore(state => state.showTextToolbar);
  
  // Determine if content should be shown
  const shouldShow = mode === 'preview' || value || required;
  
  // Create final configurations
  const finalEditorConfig: InlineEditorConfig = useMemo(() => ({
    ...defaultEditorConfig,
    ...editorConfig,
  }), [editorConfig]);
  
  const finalAutoSaveConfig: AutoSaveConfig = useMemo(() => ({
    enabled: true,
    debounceMs: 1000,
    onSave: onEdit,
    ...autoSave,
  }), [autoSave, onEdit]);
  
  // Handle format changes
  const handleFormatChange = useCallback((newFormat: TextFormatState) => {
    setCurrentFormatState(newFormat);
    onFormatChange?.(newFormat);
  }, [onFormatChange]);
  
  // Handle focus and blur
  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);
  
  const handleBlur = useCallback(() => {
    setIsEditing(false);
  }, []);
  
  // Handle selection changes
  const handleSelectionChange = useCallback((selection: TextSelection | null) => {
    if (selection && !selection.isCollapsed) {
      // Calculate position for the text toolbar
      const rect = selection.containerElement.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };
      
      // Show the text toolbar
      showTextToolbar(position);
    }
  }, [showTextToolbar]);
  
  if (!shouldShow) return null;

  // Use inline editor in edit mode if enabled and required props are provided
  if (
    mode === 'edit' && 
    enableInlineEditor && 
    sectionId && 
    elementKey
  ) {
    return (
      <InlineTextEditor
        content={value}
        onContentChange={onEdit}
        element={Element}
        elementKey={elementKey}
        sectionId={sectionId}
        formatState={currentFormatState}
        onFormatChange={handleFormatChange}
        autoSave={finalAutoSaveConfig}
        config={finalEditorConfig}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSelectionChange={handleSelectionChange}
        className={`
          ${className}
          ${isEditing ? 'editing' : ''}
        `}
        style={style}
        placeholder={placeholder}
      />
    );
  }
  
  // Fallback to original simple contentEditable for edit mode
  if (mode === 'edit') {
    const editableElement = (
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
        data-section-id={sectionId}
        data-element-key={elementKey}
      >
        {value || placeholder || 'Click to edit'}
      </Element>
    );
    
    return editableElement;
  }

  // Preview mode
  return (
    <Element className={className} style={style}>
      {children || value}
    </Element>
  );
}

// Enhanced specialized versions with drag-drop support
export function EditableHeadline({ 
  mode, 
  value, 
  onEdit, 
  level = 'h1',
  colorClass, 
  textStyle,
  dynamicColor,
  sectionId,
  elementKey,
  formatState,
  onFormatChange,
  editorConfig,
  autoSave,
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  level?: 'h1' | 'h2' | 'h3' | 'h4',
  colorClass?: string,
  textStyle?: React.CSSProperties,
  dynamicColor?: string,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {
  
  const finalColorClass = dynamicColor || colorClass || 'text-gray-900';
  
  // Enhanced format state for headlines
  const headlineFormatState = useMemo(() => ({
    bold: true,
    italic: false,
    underline: false,
    color: dynamicColor || '#000000',
    fontSize: level === 'h1' ? '2rem' : level === 'h2' ? '1.5rem' : level === 'h3' ? '1.25rem' : '1rem',
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    lineHeight: level === 'h1' ? '1.2' : '1.3',
    letterSpacing: 'normal',
    textTransform: 'none' as const,
    ...formatState,
  }), [level, dynamicColor, formatState]);
  
  const headlineEditorConfig: Partial<InlineEditorConfig> = useMemo(() => ({
    enterKeyBehavior: 'save',
    allowedFormats: ['bold', 'italic', 'underline', 'color', 'fontSize', 'textAlign'],
    validation: {
      maxLength: 200,
      minLength: 1,
    },
    ...editorConfig,
  }), [editorConfig]);
  
  return (
    <EditableContent
      mode={mode}
      value={value}
      onEdit={onEdit}
      element={level}
      className={`font-bold leading-tight ${finalColorClass}`}
      style={textStyle}
      required
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={headlineFormatState}
      onFormatChange={onFormatChange}
      editorConfig={headlineEditorConfig}
      autoSave={autoSave}
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
  dynamicColor,
  sectionId,
  elementKey,
  formatState,
  onFormatChange,
  editorConfig,
  autoSave,
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  colorClass?: string,
  textStyle?: React.CSSProperties,
  dynamicColor?: string,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {
  
  const finalColorClass = dynamicColor || colorClass || 'text-gray-600';
  
  // Enhanced format state for text
  const textFormatState = useMemo(() => ({
    bold: false,
    italic: false,
    underline: false,
    color: dynamicColor || '#000000',
    fontSize: '1rem',
    fontFamily: 'inherit',
    textAlign: 'left' as const,
    lineHeight: '1.6',
    letterSpacing: 'normal',
    textTransform: 'none' as const,
    ...formatState,
  }), [dynamicColor, formatState]);
  
  const textEditorConfig: Partial<InlineEditorConfig> = useMemo(() => ({
    enterKeyBehavior: 'new-line',
    allowedFormats: ['bold', 'italic', 'underline', 'color', 'fontSize', 'textAlign'],
    validation: {
      maxLength: 1000,
    },
    autoFormatting: {
      enabled: true,
      rules: [
        {
          pattern: /\*\*(.*?)\*\*/g,
          replacement: '$1',
          formatApplied: { bold: true },
        },
        {
          pattern: /\*(.*?)\*/g,
          replacement: '$1',
          formatApplied: { italic: true },
        },
      ],
    },
    ...editorConfig,
  }), [editorConfig]);
  
  return (
    <EditableContent
      mode={mode}
      value={value}
      onEdit={onEdit}
      element="p"
      className={`leading-relaxed ${finalColorClass}`}
      style={textStyle}
      multiline
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={textFormatState}
      onFormatChange={onFormatChange}
      editorConfig={textEditorConfig}
      autoSave={autoSave}
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
  accentBased = false,
  sectionId,
  elementKey,
  formatState,
  onFormatChange,
  editorConfig,
  autoSave,
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  colorTokens?: any,
  textStyle?: React.CSSProperties,
  accentBased?: boolean,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {
  
  let badgeClasses = '';
  
  if (accentBased && colorTokens?.ctaBg) {
    const accentColorMatch = colorTokens.ctaBg.match(/bg-(\w+)-\d+/);
    const accentColorName = accentColorMatch ? accentColorMatch[1] : 'blue';
    
    // ✅ NEW: Use generateAccessibleBadgeColors for safe badge colors
    badgeClasses = generateAccessibleBadgeColors(accentColorName);
  } else {
    // ✅ NEW: Use safe default badge colors
    badgeClasses = 'bg-blue-50 text-blue-900 border-blue-200 border';
  }
  
  const badgeFormatState = useMemo(() => ({
    bold: false,
    italic: false,
    underline: false,
    color: accentBased ? colorTokens?.ctaBg || '#1E40AF' : '#1E40AF',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    textAlign: 'center' as const,
    lineHeight: '1.4',
    letterSpacing: 'normal',
    textTransform: 'none' as const,
    ...formatState,
  }), [accentBased, colorTokens, formatState]);
  
  const badgeEditorConfig: Partial<InlineEditorConfig> = useMemo(() => ({
    enterKeyBehavior: 'save',
    allowedFormats: ['bold', 'italic', 'color', 'textTransform'],
    validation: {
      maxLength: 50,
      minLength: 1,
    },
    ...editorConfig,
  }), [editorConfig]);
  
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
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={badgeFormatState}
      onFormatChange={onFormatChange}
      editorConfig={badgeEditorConfig}
      autoSave={autoSave}
      {...props}
    />
  );
}

// Enhanced Badge specifically for accent-based designs
export function AccentBadge({ 
  mode, 
  value, 
  onEdit, 
  colorTokens,
  textStyle,
  sectionId,
  elementKey,
  formatState,
  onFormatChange,
  editorConfig,
  autoSave,
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  mode: 'edit' | 'preview',
  value: string,
  onEdit: (value: string) => void,
  colorTokens?: any,
  textStyle?: React.CSSProperties,
  sectionId?: string,
  elementKey?: string,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {
  return (
    <EditableBadge
      mode={mode}
      value={value}
      onEdit={onEdit}
      colorTokens={colorTokens}
      textStyle={textStyle}
      accentBased={true}
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={formatState}
      onFormatChange={onFormatChange}
      editorConfig={editorConfig}
      autoSave={autoSave}
      {...props}
    />
  );
}

// Enhanced adaptive components with drag-drop support
export function EditableAdaptiveHeadline({
  mode,
  value,
  onEdit,
  level = 'h1',
  backgroundType,
  colorTokens,
  textStyle,
  sectionId,
  elementKey,
  formatState,
  onFormatChange,
  editorConfig,
  autoSave,
  ...props
}: Omit<EditableContentProps, 'element'> & {
  level?: 'h1' | 'h2' | 'h3' | 'h4',
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any,
  textStyle?: React.CSSProperties,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {
  
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
  
  return (
    <EditableHeadline
      mode={mode}
      value={value}
      onEdit={onEdit}
      level={level}
      dynamicColor={adaptiveColor}
      textStyle={textStyle}
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={formatState}
      onFormatChange={onFormatChange}
      editorConfig={editorConfig}
      autoSave={autoSave}
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
  variant = 'body',
  sectionId,
  elementKey,
  formatState,
  onFormatChange,
  editorConfig,
  autoSave,
  ...props
}: Omit<EditableContentProps, 'element'> & {
  backgroundType: 'primary' | 'secondary' | 'neutral' | 'divider',
  colorTokens: any,
  textStyle?: React.CSSProperties,
  variant?: 'body' | 'muted',
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {
  
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
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={formatState}
      onFormatChange={onFormatChange}
      editorConfig={editorConfig}
      autoSave={autoSave}
      {...props}
    />
  );
}
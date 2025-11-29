import React, { useCallback, useState, useMemo } from 'react';
import { InlineTextEditorV2 } from '@/app/edit/[token]/components/editor/InlineTextEditorV2';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useTypography } from '@/hooks/useTypography';
import { generateAccessibleBadgeColors } from '@/utils/textContrastUtils';
import { getTextColorForBackground } from '@/modules/Design/background/enhancedBackgroundLogic';
import { getSmartTextColor } from '@/utils/improvedTextColors';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import type { BackgroundType } from '@/types/sectionBackground';

import { logger } from '@/lib/logger';
import { sanitizeFormattingContent } from '@/lib/htmlSanitizer';

// Type definitions for backward compatibility
export interface TextFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  color: string;
  fontSize: string;
  fontFamily: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: string;
  letterSpacing: string;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface TextSelection {
  start: number;
  end: number;
  text: string;
  isCollapsed: boolean;
  containerElement: HTMLElement;
  range: Range;
}

export interface InlineEditorConfig {
  enterKeyBehavior: 'new-line' | 'save' | 'ignore';
  escapeKeyBehavior: 'cancel' | 'save' | 'ignore';
  allowedFormats: (keyof TextFormatState)[];
  restrictedFormats: (keyof TextFormatState)[];
  autoFormatting: {
    enabled: boolean;
    rules: any[];
  };
  validation: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    customValidator?: (content: string) => boolean;
  };
  accessibility: {
    announceChanges: boolean;
    keyboardNavigation: boolean;
    screenReaderSupport: boolean;
  };
}

export interface AutoSaveConfig {
  enabled: boolean;
  debounceMs: number;
  onSave: (content: string) => void;
}

export const defaultEditorConfig: InlineEditorConfig = {
  enterKeyBehavior: 'new-line',
  escapeKeyBehavior: 'save',
  allowedFormats: ['bold', 'italic', 'underline', 'color', 'fontSize', 'textAlign'],
  restrictedFormats: [],
  autoFormatting: {
    enabled: false,
    rules: [],
  },
  validation: {},
  accessibility: {
    announceChanges: false,
    keyboardNavigation: true,
    screenReaderSupport: true,
  },
};

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
  backgroundType?: string;
  colorTokens?: any;
  sectionBackground?: string;
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
  backgroundType = 'primary',
  colorTokens = {},
  sectionBackground,
}: EditableContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormatState, setCurrentFormatState] = useState(formatState);

  // Get showTextToolbar from the store
  const { showTextToolbar } = useEditStore();

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

  // Handle selection changes - toolbar buttons handle selection preservation via onMouseDown
  const handleSelectionChange = useCallback((selection: TextSelection | null) => {
    if (selection && !selection.isCollapsed) {
      // Calculate position for the text toolbar
      const rect = selection.containerElement.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      };

      // Show the text toolbar - buttons will preserve selection via their onMouseDown handlers
      showTextToolbar(position);
    }
  }, [showTextToolbar]);
  
  // Preview mode styles - merge formatState styles with style prop
  const previewStyle = useMemo(() => {
    if (!formatState || formatState === defaultFormatState) {
      return style;
    }
    
    return {
      fontSize: formatState.fontSize,
      fontWeight: formatState.bold ? 'bold' : 'normal',
      fontStyle: formatState.italic ? 'italic' : 'normal',
      textDecoration: formatState.underline ? 'underline' : 'none',
      color: formatState.color,
      fontFamily: formatState.fontFamily,
      textAlign: formatState.textAlign,
      lineHeight: formatState.lineHeight,
      letterSpacing: formatState.letterSpacing,
      textTransform: formatState.textTransform,
      ...style, // Allow style prop to override formatState
    };
  }, [formatState, style]);
  
  if (!shouldShow) return null;

  // Use inline editor in edit mode if enabled and required props are provided
  if (
    mode !== 'preview' &&
    enableInlineEditor &&
    sectionId &&
    elementKey
  ) {
    // Determine enter behavior from config
    const enterBehavior = finalEditorConfig.enterKeyBehavior === 'save' ? 'save' : 'newline';

    return (
      <InlineTextEditorV2
        content={value}
        onContentChange={onEdit}
        element={Element}
        elementKey={elementKey}
        sectionId={sectionId}
        enterBehavior={enterBehavior}
        className={className}
        style={style}
        placeholder={placeholder}
        backgroundType={backgroundType}
        colorTokens={colorTokens}
        sectionBackground={sectionBackground}
      />
    );
  }
  
  // Fallback to original simple contentEditable for edit mode
  if (mode !== 'preview') {
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

  // Preview mode - check if value contains HTML and render appropriately
  const isHtmlContent = typeof value === 'string' && /<[^>]*>/g.test(value);
  
  if (isHtmlContent) {
    // Render HTML content with DOMPurify sanitization
    const sanitizedHtml = sanitizeFormattingContent(value);
    return (
      <Element 
        className={className} 
        style={previewStyle}
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }

  return (
    <Element className={className} style={previewStyle}>
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
  backgroundType,
  colorTokens,
  className: propsClassName,
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
  backgroundType?: string,
  colorTokens?: any,
}) {
  const { getTextStyle } = useTypography();
  const finalColorClass = dynamicColor || colorClass || 'text-gray-900';
  
  
  // Enhanced format state for headlines
  const headlineFormatState = useMemo(() => {
    // ✅ FIX: Don't set inline color if we're using CSS classes for adaptive colors
    // Only use inline color if explicitly provided in formatState, not for adaptive colors
    const shouldUseInlineColor = formatState?.color && !colorClass;

    // Get typography styles from landingTypography system
    const typographyStyle = getTextStyle(level);

    // ✅ FIX: Check if formatState has a custom px fontSize (not clamp)
    // This prevents typography system from overriding user-selected toolbar sizes
    const hasCustomFontSize = formatState?.fontSize &&
      !formatState.fontSize.includes('clamp') &&
      formatState.fontSize.includes('px');

    const baseState = {
      bold: formatState?.bold ?? (typographyStyle.fontWeight === '700'),
      italic: formatState?.italic ?? false,
      underline: formatState?.underline ?? false,
      color: shouldUseInlineColor ? formatState.color : undefined,
      // ✅ FIX: Use custom fontSize if provided, otherwise typography system
      // Don't apply typography fontSize when user has set a custom px size
      fontSize: hasCustomFontSize ? formatState.fontSize :
                (formatState?.fontSize || typographyStyle.fontSize),
      fontFamily: formatState?.fontFamily || typographyStyle.fontFamily || 'inherit',
      textAlign: (formatState?.textAlign || (textStyle?.textAlign as any) || 'left') as 'left' | 'center' | 'right' | 'justify',
      lineHeight: formatState?.lineHeight || typographyStyle.lineHeight,
      letterSpacing: formatState?.letterSpacing || typographyStyle.letterSpacing,
      textTransform: (formatState?.textTransform || 'none') as 'none' | 'uppercase' | 'lowercase' | 'capitalize',
    };


    return baseState;
  }, [level, colorClass, formatState, textStyle?.textAlign, getTextStyle]);
  
  // Debug logging for headline color issues (reduced)
  
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
      className={`font-bold leading-tight ${finalColorClass} ${propsClassName || ''}`}
      style={textStyle}
      required
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={headlineFormatState}
      onFormatChange={onFormatChange}
      editorConfig={headlineEditorConfig}
      autoSave={autoSave}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
      {...(props as any)}
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
  backgroundType,
  colorTokens,
  className: propsClassName,
  ...props 
}: Omit<EditableContentProps, 'element'> & { 
  colorClass?: string,
  textStyle?: React.CSSProperties,
  dynamicColor?: string,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
  backgroundType?: string,
  colorTokens?: any,
}) {
  
  const finalColorClass = dynamicColor || colorClass || 'text-gray-600';
  
  // Enhanced format state for text
  const textFormatState = useMemo(() => ({
    bold: false,
    italic: false,
    underline: false,
    color: dynamicColor || undefined,
    fontSize: '1rem',
    fontFamily: 'inherit',
    textAlign: (textStyle?.textAlign as any) || 'left' as const,
    lineHeight: '1.6',
    letterSpacing: 'normal',
    textTransform: 'none' as const,
    ...formatState,
  }), [dynamicColor, formatState, textStyle?.textAlign]);
  
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
      className={`leading-relaxed ${finalColorClass} ${propsClassName || ''}`}
      style={textStyle}
      multiline
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={textFormatState}
      onFormatChange={onFormatChange}
      editorConfig={textEditorConfig}
      autoSave={autoSave}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
      {...(props as any)}
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
// Helper function to extract inline styles from HTML content
const extractInlineStyles = (htmlContent: string): Partial<TextFormatState> => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const styledElement = tempDiv.querySelector('[style]') as HTMLElement;
  if (!styledElement) return {};

  const computedStyle = styledElement.style;
  const extracted: Partial<TextFormatState> = {};

  if (computedStyle.fontSize) extracted.fontSize = computedStyle.fontSize;
  if (computedStyle.fontWeight) extracted.bold = parseInt(computedStyle.fontWeight) >= 600;
  if (computedStyle.fontStyle) extracted.italic = computedStyle.fontStyle === 'italic';
  if (computedStyle.textDecoration) extracted.underline = computedStyle.textDecoration.includes('underline');
  if (computedStyle.color) extracted.color = computedStyle.color;
  if (computedStyle.fontFamily) extracted.fontFamily = computedStyle.fontFamily;
  if (computedStyle.textAlign) extracted.textAlign = computedStyle.textAlign as any;
  if (computedStyle.lineHeight) extracted.lineHeight = computedStyle.lineHeight;
  if (computedStyle.letterSpacing) extracted.letterSpacing = computedStyle.letterSpacing;
  if (computedStyle.textTransform) extracted.textTransform = computedStyle.textTransform as any;

  return extracted;
};

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
  backgroundType: BackgroundType,
  colorTokens: any,
  textStyle?: React.CSSProperties,
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {

  // Extract inline styles from HTML content if present
  const extractedStyles = useMemo(() => {
    if (typeof value === 'string' && /<[^>]*>/g.test(value)) {
      return extractInlineStyles(value);
    }
    return {};
  }, [value]);

  // Debug logging (reduced)
  
  const getAdaptiveTextColor = () => {
    // ✅ PRIORITY: Check for stored text colors from colorTokens first
    if (colorTokens?.textColors && backgroundType && backgroundType !== 'custom') {
      // Map background types to storage keys
      const mapping: Record<string, string> = {
        'primary-highlight': 'primary',
        'secondary-highlight': 'secondary',
        'divider-zone': 'divider',
        'neutral': 'neutral',
        'primary': 'primary',
        'secondary': 'secondary',
        'divider': 'divider'
      };
      const storageKey = mapping[backgroundType] || backgroundType;
      const storedTextColors = colorTokens.textColors[storageKey as keyof typeof colorTokens.textColors];
      if (storedTextColors && storedTextColors.heading) {
        const smartColor = storedTextColors.heading;
        const colorClass = hexToTailwindClass(smartColor);
        return { class: colorClass, value: smartColor };
      }
    }
    
    // ✅ FALLBACK: Use dynamic text color calculation
    const sectionBackground = props.sectionBackground || colorTokens?.bgPrimary || 'bg-white';
    const smartColor = getSmartTextColor(sectionBackground, 'heading');
    
    // Generate CSS class name from color (simplified mapping) - ✅ FIX: Added text-gray-50
    const colorClass = smartColor === '#ffffff' ? 'text-white' : 
                      smartColor === '#e5e7eb' ? 'text-gray-200' :
                      smartColor === '#374151' ? 'text-gray-700' : 
                      smartColor === '#111827' ? 'text-gray-900' : 
                      smartColor === '#f9fafb' ? 'text-gray-50' : 'text-gray-900';
    
    return { class: colorClass, value: smartColor };
  };
  
  // Helper function to convert hex to Tailwind classes for headlines
  const hexToTailwindClass = (hex: string): string => {
    const colorMap: Record<string, string> = {
      '#ffffff': 'text-white',
      '#f9fafb': 'text-gray-50',
      '#f3f4f6': 'text-gray-100',
      '#e5e7eb': 'text-gray-200',
      '#d1d5db': 'text-gray-300',
      '#9ca3af': 'text-gray-400',
      '#6b7280': 'text-gray-500',
      '#4b5563': 'text-gray-600',
      '#374151': 'text-gray-700',
      '#1f2937': 'text-gray-800',
      '#111827': 'text-gray-900',
      '#000000': 'text-black'
    };
    return colorMap[hex] || 'text-gray-900';
  };
  
  // Helper function to extract hex values from Tailwind classes
  const extractColorValue = (colorClass: string): string => {
    if (colorClass.includes('text-gray-900')) return '#111827';
    if (colorClass.includes('text-gray-800')) return '#1f2937';
    if (colorClass.includes('text-gray-700')) return '#374151';
    if (colorClass.includes('text-gray-600')) return '#4b5563';
    if (colorClass.includes('text-gray-500')) return '#6b7280';
    if (colorClass.includes('text-white')) return '#ffffff';
    if (colorClass.includes('text-gray-200')) return '#e5e7eb';
    return '#000000'; // Default fallback
  };
  
  const adaptiveColor = getAdaptiveTextColor();

  // Merge extracted styles with provided formatState
  const mergedFormatState = useMemo(() => {
    return {
      ...formatState,
      ...extractedStyles, // Extracted styles take precedence
    };
  }, [formatState, extractedStyles]);

  return (
    <EditableHeadline
      mode={mode}
      value={value}
      onEdit={onEdit}
      level={level}
      colorClass={adaptiveColor.class}  // ✅ FIX: Pass colorClass instead of dynamicColor
      textStyle={textStyle}
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={mergedFormatState}  // ✅ FIX: Pass merged formatState with extracted styles
      onFormatChange={onFormatChange}
      editorConfig={editorConfig}
      autoSave={autoSave}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
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
  backgroundType: BackgroundType,
  colorTokens: any,
  textStyle?: React.CSSProperties,
  variant?: 'body' | 'muted',
  formatState?: TextFormatState,
  onFormatChange?: (format: TextFormatState) => void,
  editorConfig?: Partial<InlineEditorConfig>,
  autoSave?: Partial<AutoSaveConfig>,
}) {

  // Extract inline styles from HTML content if present
  const extractedStyles = useMemo(() => {
    if (typeof value === 'string' && /<[^>]*>/g.test(value)) {
      return extractInlineStyles(value);
    }
    return {};
  }, [value]);

  const getAdaptiveTextColor = () => {
    // ✅ PRIORITY: Check for stored text colors from colorTokens first
    const textType = variant === 'muted' ? 'muted' : 'body';
    
    if (colorTokens?.textColors && backgroundType && backgroundType !== 'custom') {
      // Map background types to storage keys
      const mapping: Record<string, string> = {
        'primary-highlight': 'primary',
        'secondary-highlight': 'secondary',
        'divider-zone': 'divider',
        'neutral': 'neutral',
        'primary': 'primary',
        'secondary': 'secondary',
        'divider': 'divider'
      };
      const storageKey = mapping[backgroundType] || backgroundType;
      const storedTextColors = colorTokens.textColors[storageKey as keyof typeof colorTokens.textColors];
      if (storedTextColors && storedTextColors[textType]) {
        const smartColor = storedTextColors[textType];
        const colorClass = hexToTailwindClass(smartColor);
        return { class: colorClass, value: smartColor };
      }
    }
    
    // ✅ FALLBACK: Use dynamic text color calculation
    const sectionBackground = props.sectionBackground || colorTokens?.bgPrimary || 'bg-white';
    const smartColor = getSmartTextColor(sectionBackground, textType);
    
    // Generate CSS class name from color (simplified mapping)
    const colorClass = smartColor === '#ffffff' ? 'text-white' : 
                      smartColor === '#e5e7eb' ? 'text-gray-200' :
                      smartColor === '#6b7280' ? 'text-gray-500' :
                      smartColor === '#374151' ? 'text-gray-700' : 
                      smartColor === '#111827' ? 'text-gray-900' : 'text-gray-700';
    
    return { class: colorClass, value: smartColor };
  };
  
  // Helper function to convert hex to Tailwind classes for text
  const hexToTailwindClass = (hex: string): string => {
    const colorMap: Record<string, string> = {
      '#ffffff': 'text-white',
      '#f9fafb': 'text-gray-50',
      '#f3f4f6': 'text-gray-100',
      '#e5e7eb': 'text-gray-200',
      '#d1d5db': 'text-gray-300',
      '#9ca3af': 'text-gray-400',
      '#6b7280': 'text-gray-500',
      '#4b5563': 'text-gray-600',
      '#374151': 'text-gray-700',
      '#1f2937': 'text-gray-800',
      '#111827': 'text-gray-900',
      '#000000': 'text-black'
    };
    return colorMap[hex] || 'text-gray-700';
  };
  
  // Helper function to extract hex values from Tailwind classes
  const extractColorValue = (colorClass: string): string => {
    if (colorClass.includes('text-gray-900')) return '#111827';
    if (colorClass.includes('text-gray-800')) return '#1f2937';
    if (colorClass.includes('text-gray-700')) return '#374151';
    if (colorClass.includes('text-gray-600')) return '#4b5563';
    if (colorClass.includes('text-gray-500')) return '#6b7280';
    if (colorClass.includes('text-white')) return '#ffffff';
    if (colorClass.includes('text-gray-200')) return '#e5e7eb';
    return '#000000'; // Default fallback
  };
  
  const adaptiveColor = getAdaptiveTextColor();

  // Merge extracted styles with provided formatState
  const mergedFormatState = useMemo(() => {
    return {
      ...formatState,
      ...extractedStyles, // Extracted styles take precedence
    };
  }, [formatState, extractedStyles]);

  return (
    <EditableText
      mode={mode}
      value={value}
      onEdit={onEdit}
      colorClass={adaptiveColor.class}  // ✅ FIX: Pass colorClass instead of dynamicColor
      textStyle={textStyle}
      sectionId={sectionId}
      elementKey={elementKey}
      formatState={mergedFormatState}  // ✅ FIX: Pass merged formatState with extracted styles
      onFormatChange={onFormatChange}
      editorConfig={editorConfig}
      autoSave={autoSave}
      backgroundType={backgroundType}
      colorTokens={colorTokens}
      {...props}
    />
  );
}
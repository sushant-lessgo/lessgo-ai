// TextToolbarMVP.tsx - Step 4: MVP Text Toolbar Implementation
// Clean, focused toolbar with only essential features + partial selection support
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { logger } from '@/lib/logger';
import { useShallow } from 'zustand/react/shallow';
import { useEditStore } from '@/hooks/useEditStore';
import { useSelectionPreserver } from '@/hooks/useSelectionPreserver';
import {
  formatSelectedText,
  toggleFormatOnSelection,
  getSelectionFormatting,
  removeFormattingFromSelection,
  wrapElementContentWithStyles,
  type PartialFormatResult
} from '@/utils/textFormatting';
import { ToolbarButton, ToolbarDivider } from './ToolbarButton';

interface TextToolbarMVPProps {
  elementSelection: any;
}

// MVP Feature Set (as agreed)
interface MVPFormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  fontSize: string;
  color: string;
}

// Font size presets (10 options - including large headline sizes)
const FONT_SIZE_PRESETS = [
  { value: '14px', label: 'Small', shortLabel: 'S' },
  { value: '16px', label: 'Default', shortLabel: 'M' },
  { value: '18px', label: 'Medium', shortLabel: 'L' },
  { value: '24px', label: 'Large', shortLabel: 'XL' },
  { value: '32px', label: 'X-Large', shortLabel: '2XL' },
  { value: '40px', label: 'XX-Large', shortLabel: '3XL' },
  { value: '48px', label: 'Hero', shortLabel: '4XL' },
  { value: '60px', label: 'Display', shortLabel: '5XL' },
  { value: '72px', label: 'Jumbo', shortLabel: '6XL' },
  { value: '96px', label: 'Massive', shortLabel: '8XL' },
];

// Basic color palette + accent colors for highlighting
const COLOR_PALETTE = [
  // Basic colors
  { value: '#000000', label: 'Black', group: 'basic' },
  { value: '#374151', label: 'Gray', group: 'basic' },
  { value: '#ffffff', label: 'White', group: 'basic' },
  
  // Accent colors for highlighting (key use case)
  { value: '#3b82f6', label: 'Blue Accent', group: 'accent' },
  { value: '#10b981', label: 'Green Accent', group: 'accent' },
  { value: '#f59e0b', label: 'Yellow Accent', group: 'accent' },
  { value: '#ef4444', label: 'Red Accent', group: 'accent' },
  { value: '#8b5cf6', label: 'Purple Accent', group: 'accent' },
  { value: '#f97316', label: 'Orange Accent', group: 'accent' },
];

// Phase-3: the ToolbarShell decides visibility and owns positioning. This outer
// gate keeps only the valid-selection check (above zero hooks, rules-of-hooks);
// the inner is a dumb child of the shell's floating container.
export function TextToolbarMVP(props: TextToolbarMVPProps) {
  if (!props.elementSelection || !props.elementSelection.sectionId || !props.elementSelection.elementKey) {
    logger.warn('TextToolbarMVP: Invalid elementSelection', props.elementSelection);
    return null;
  }

  return <TextToolbarMVPInner {...props} />;
}

function TextToolbarMVPInner({
  elementSelection,
}: TextToolbarMVPProps) {
  const [formatState, setFormatState] = useState<MVPFormatState>({
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'left',
    fontSize: '16px',
    color: '#000000',
  });

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const fontSizePickerRef = useRef<HTMLDivElement>(null);
  const variationsRef = useRef<HTMLDivElement>(null);

  // Narrow selector: pull ONLY the fields/actions this toolbar reads (actions are
  // stable refs). `setFormattingInProgress` is read imperatively below via
  // getState() — deliberately NOT subscribed.
  const {
    updateElementContent,
    regenerateElementWithVariations,
    elementVariations,
    applyVariation,
    hideElementVariations,
    setVariationSelection,
    aiGeneration,
    announceLiveRegion,
    activeLocale,
    localeConfig,
  } = useEditStore(
    useShallow((s) => ({
      updateElementContent: s.updateElementContent,
      regenerateElementWithVariations: s.regenerateElementWithVariations,
      elementVariations: s.elementVariations,
      applyVariation: s.applyVariation,
      hideElementVariations: s.hideElementVariations,
      setVariationSelection: s.setVariationSelection,
      aiGeneration: s.aiGeneration,
      announceLiveRegion: s.announceLiveRegion,
      activeLocale: s.activeLocale,
      localeConfig: s.localeConfig,
    })),
  );
  // i18n-phase-1 (Phase 4): AI variations write DEFAULT-locale base copy only;
  // disable the sparkle on a non-default locale (store guard also no-ops it).
  const regenLocaleLocked =
    !!localeConfig && activeLocale !== localeConfig.defaultLocale;
  const setFormattingInProgress = useEditStore.getState().setFormattingInProgress; // Get directly, no subscription
  const { saveSelection, restoreSelection, hasSelection, cleanup: cleanupSelection } = useSelectionPreserver();

  // Track if user has text selected within the element
  const [hasTextSelection, setHasTextSelection] = useState(false);

  // Debug logging removed to prevent log spam

  // Track render count removed for type safety

  // Detect current formatting from selected element - FIXED: Only update if values actually changed
  useEffect(() => {
    if (!elementSelection) return;

    const targetElement = document.querySelector(
      `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
    ) as HTMLElement;

    if (!targetElement) return;

    const computedStyle = window.getComputedStyle(targetElement);
    
    const newFormatState = {
      bold: computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600,
      italic: computedStyle.fontStyle === 'italic',
      underline: computedStyle.textDecoration.includes('underline'),
      textAlign: computedStyle.textAlign as 'left' | 'center' | 'right',
      fontSize: computedStyle.fontSize,
      color: computedStyle.color,
    };
    
    // Only update if format state actually changed to prevent infinite loops
    const hasChanged = 
      formatState.bold !== newFormatState.bold ||
      formatState.italic !== newFormatState.italic ||
      formatState.underline !== newFormatState.underline ||
      formatState.textAlign !== newFormatState.textAlign ||
      formatState.fontSize !== newFormatState.fontSize ||
      formatState.color !== newFormatState.color;
      
    if (hasChanged) {
      setFormatState(newFormatState);
    }
  }, [elementSelection, formatState]); // Keep formatState dependency for change detection

  // Check for active text selection within the element - DISABLED to prevent infinite loops
  // This was causing cascading selectionchange events with useSelectionPreserver
  useEffect(() => {
    const checkSelection = () => {
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount || selection.isCollapsed) {
        setHasTextSelection(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const targetElement = document.querySelector(
        `[data-section-id="${elementSelection?.sectionId}"] [data-element-key="${elementSelection?.elementKey}"]`
      ) as HTMLElement;

      if (targetElement && targetElement.contains(range.commonAncestorContainer)) {
        setHasTextSelection(true);
      } else {
        setHasTextSelection(false);
      }
    };

    // Check on mount only - no selectionchange listener to prevent infinite loops
    checkSelection();
    // DISABLED: document.addEventListener('selectionchange', checkSelection);
    
    // return () => {
    //   document.removeEventListener('selectionchange', checkSelection);
    // };
  }, [elementSelection]);

  // Enhanced format application with leading debounce and state management
  const applyFormatInternal = (newFormat: Partial<MVPFormatState>) => {
    if (!elementSelection) {
      return;
    }

    try {
      // Set formatting in progress flag (Fix #2: Split User Intent)
      setFormattingInProgress(true);

      // Check if user has text selected
      const selection = window.getSelection();
      const hasActiveSelection = selection && selection.rangeCount > 0 && !selection.isCollapsed;

      if (hasActiveSelection && hasTextSelection) {
        // PARTIAL SELECTION FORMATTING - Apply to selected text only
        
        // Convert MVPFormatState to TextFormatState for compatibility
        const textFormatState = {
          bold: newFormat.bold,
          italic: newFormat.italic,
          underline: newFormat.underline,
          color: newFormat.color,
          fontSize: newFormat.fontSize,
          textAlign: newFormat.textAlign,
        };

        const result = formatSelectedText(textFormatState);
        
        if (result.success && result.formattedHTML) {
          // Update store with HTML content instead of plain text
          updateElementContent(
            elementSelection.sectionId, 
            elementSelection.elementKey, 
            result.formattedHTML
          );
        }
      } else {
        // WHOLE ELEMENT FORMATTING - Apply to entire element
        
        const targetElement = document.querySelector(
          `[data-section-id="${elementSelection.sectionId}"] [data-element-key="${elementSelection.elementKey}"]`
        ) as HTMLElement;

        if (!targetElement) return;

        const updatedFormat = { ...formatState, ...newFormat };
        
        // Apply styles directly to DOM element
        if (newFormat.bold !== undefined) {
          targetElement.style.fontWeight = newFormat.bold ? '600' : 'normal';
        }
        if (newFormat.italic !== undefined) {
          targetElement.style.fontStyle = newFormat.italic ? 'italic' : 'normal';
        }
        if (newFormat.underline !== undefined) {
          targetElement.style.textDecoration = newFormat.underline ? 'underline' : 'none';
        }
        if (newFormat.textAlign) {
          targetElement.style.textAlign = newFormat.textAlign;
        }
        if (newFormat.fontSize) {
          targetElement.style.fontSize = newFormat.fontSize;
        }
        if (newFormat.color) {
          targetElement.style.color = newFormat.color;
        }

        setFormatState(updatedFormat);
        
        // Update store for persistence — wrap the element's inner HTML in one
        // styled span (merging into an existing wrapper span instead of
        // nesting). Preserves inner markup (<em> accents, partial-selection
        // spans); the old textContent rebuild dropped them and emitted a raw
        // markup string that fed the literal-`<span>` corruption.
        const styles: Record<string, string> = {};
        if (targetElement.style.color) styles['color'] = targetElement.style.color;
        if (targetElement.style.fontSize) styles['font-size'] = targetElement.style.fontSize;
        // CRITICAL: Save font-weight even if 'normal' to override h1/h2 defaults
        if (targetElement.style.fontWeight) styles['font-weight'] = targetElement.style.fontWeight;
        if (targetElement.style.fontStyle) styles['font-style'] = targetElement.style.fontStyle;
        // CRITICAL: Save text-decoration even if 'none' to persist un-underline
        if (targetElement.style.textDecoration) styles['text-decoration'] = targetElement.style.textDecoration;
        // Alignment was never persisted (QA: align silently dropped). A span is
        // inline, so persist it as a block-level wrapper.
        if (targetElement.style.textAlign) {
          styles['text-align'] = targetElement.style.textAlign;
          styles['display'] = 'block';
        }

        let contentToSave: string;
        if (Object.keys(styles).length > 0) {
          contentToSave = wrapElementContentWithStyles(targetElement.innerHTML, styles);
        } else {
          // No formatting — save plain text
          contentToSave = targetElement.textContent || '';
        }

        updateElementContent(
          elementSelection.sectionId, 
          elementSelection.elementKey, 
          contentToSave
        );
      }
    } catch (error) {
      throw error;
    } finally {
      // Always clear formatting flag after a delay
      setTimeout(() => {
        setFormattingInProgress(false);
      }, 50);
    }
  };

  // Leading debounce wrapper (Fix from suggestions: leading: true, trailing: false)
  const debouncedFormat = useMemo(
    () => debounce(applyFormatInternal, 100, { 
      leading: true, 
      trailing: false 
    }),
    [elementSelection, formatState, hasTextSelection, setFormattingInProgress, updateElementContent]
  );

  // Apply format immediately (simplified without interaction tracking)
  const applyFormatImmediate = (formatOptions: Partial<MVPFormatState>) => {
    // Set formatting in progress
    setFormattingInProgress(true);

    // Apply format immediately
    applyFormatInternal(formatOptions);

    // Clear formatting flag after a delay
    setTimeout(() => {
      setFormattingInProgress(false);
    }, 100);
  };

  // Simple format functions
  const toggleBold = (e?: React.MouseEvent) => {
    if (hasTextSelection) {
      restoreSelection();
    }
    
    applyFormatImmediate({ bold: !formatState.bold });
  };
  
  const toggleItalic = (e?: React.MouseEvent) => {
    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ italic: !formatState.italic });
  };
  
  const toggleUnderline = (e?: React.MouseEvent) => {
    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ underline: !formatState.underline });
  };
  
  const setAlignment = (align: 'left' | 'center' | 'right', e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ textAlign: align });
  };
  
  const setFontSize = (size: string, e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ fontSize: size });
    setShowFontSizePicker(false);
  };
  
  const setColor = (color: string, e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (hasTextSelection) {
      restoreSelection();
    }
    applyFormatImmediate({ color });
    setShowColorPicker(false);
  };

  // AI Sparkle: generate text variations
  const handleSparkle = async () => {
    if (!elementSelection || aiGeneration.isGenerating) return;
    try {
      await regenerateElementWithVariations(
        elementSelection.sectionId,
        elementSelection.elementKey,
        5
      );
      announceLiveRegion('Generated text variations');
    } catch {
      announceLiveRegion('Failed to generate variations');
    }
  };

  const handleApplyVariation = () => {
    const variation = elementVariations.variations[elementVariations.selectedIndex];
    if (!variation) return;

    applyVariation(
      elementVariations.sectionId,
      elementVariations.elementKey,
      elementVariations.selectedIndex
    );

    // Force DOM sync — InlineTextEditorV2 won't sync while isEditing=true
    // data-element-key is directly on the contenteditable div, no child query needed
    const el = document.querySelector(
      `[data-section-id="${elementVariations.sectionId}"] [data-element-key="${elementVariations.elementKey}"]`
    ) as HTMLElement;
    if (el) {
      if (/<[^>]*>/g.test(variation)) {
        el.innerHTML = variation;
      } else {
        el.textContent = variation;
      }
    }

    announceLiveRegion(`Applied variation ${elementVariations.selectedIndex + 1}`);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
      
      if (
        fontSizePickerRef.current &&
        !fontSizePickerRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        setShowFontSizePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close variations panel on click outside
  useEffect(() => {
    if (!elementVariations.visible) return;
    const handleVariationsClickOutside = (event: MouseEvent) => {
      if (
        variationsRef.current &&
        !variationsRef.current.contains(event.target as Node) &&
        !toolbarRef.current?.contains(event.target as Node)
      ) {
        hideElementVariations();
      }
    };
    document.addEventListener('mousedown', handleVariationsClickOutside);
    return () => document.removeEventListener('mousedown', handleVariationsClickOutside);
  }, [elementVariations.visible, hideElementVariations]);

  // Cleanup on unmount (Fix #4: Hard Cleanup)
  useEffect(() => {
    return () => {
      // Cancel any pending debounced operations
      debouncedFormat.cancel();
      // Perform hard cleanup of selection state
      cleanupSelection();
      hideElementVariations();
    };
  }, [debouncedFormat, cleanupSelection, hideElementVariations]);

  return (
    <>
      {/* The t2 chrome box (bg/border/radius/shadow) is the SHELL's now. The
          fixed 52px height went with it — the shell's pill sizes itself. The
          mousedown/mouseup preventDefault below is load-bearing (it stops the
          toolbar from stealing the text selection) and stays exactly as-is. */}
      <div
        ref={toolbarRef}
        className="flex items-center gap-0.5"
        style={{
          whiteSpace: 'nowrap',
          userSelect: 'none', // Prevent text selection on toolbar
        }}
        data-toolbar-type="text-mvp"
        data-editor-id={elementSelection ? `editor-${elementSelection.sectionId}-${elementSelection.elementKey}` : ''}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="flex items-center gap-0.5">
          {/* Format Controls */}
          <div className="flex items-center gap-0.5">
            {/* Bold, Italic, Underline */}
            <ToolbarButton
              data-action="bold"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveSelection();
                toggleBold(e as any);
              }}
              active={formatState.bold}
              icon={<BoldIcon />}
              title={`Bold${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
            />

            <ToolbarButton
              data-action="italic"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveSelection();
                toggleItalic(e as any);
              }}
              active={formatState.italic}
              icon={<ItalicIcon />}
              title={`Italic${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
            />

            <ToolbarButton
              data-action="underline"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveSelection();
                toggleUnderline(e as any);
              }}
              active={formatState.underline}
              icon={<UnderlineIcon />}
              title={`Underline${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
            />

            <ToolbarDivider />

            {/* Text Alignment */}
            <ToolbarButton
              data-action="align-left"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onPointerDown={(e) => setAlignment('left', e)}
              active={formatState.textAlign === 'left'}
              icon={<AlignLeftIcon />}
              title="Align Left (Note: alignment applies to whole element)"
            />

            <ToolbarButton
              data-action="align-center"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onPointerDown={(e) => setAlignment('center', e)}
              active={formatState.textAlign === 'center'}
              icon={<AlignCenterIcon />}
              title="Align Center (Note: alignment applies to whole element)"
            />

            <ToolbarButton
              data-action="align-right"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
              }}
              onPointerDown={(e) => setAlignment('right', e)}
              active={formatState.textAlign === 'right'}
              icon={<AlignRightIcon />}
              title="Align Right (Note: alignment applies to whole element)"
            />
          </div>

          <ToolbarDivider />

          {/* Font Size & Color */}
          <div className="flex items-center gap-0.5">
            {/* Font Size */}
            <div className="relative">
              <ToolbarButton
                data-action="font-size"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowFontSizePicker(!showFontSizePicker);
                }}
                active={showFontSizePicker}
                icon={<FontSizeIcon />}
                label={
                  FONT_SIZE_PRESETS.find(p => p.value === formatState.fontSize)?.shortLabel || 'M'
                }
                trailing={<ChevronDownIcon />}
                title={`Font Size${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
              />

              {showFontSizePicker && (
                <div 
                  ref={fontSizePickerRef}
                  className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-32"
                >
                  {FONT_SIZE_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveSelection();
                      }}
                      onPointerDown={(e) => setFontSize(preset.value, e)}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors select-none ${
                        formatState.fontSize === preset.value 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{preset.label}</span>
                      <span className="text-xs text-gray-500">{preset.value}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Color Picker */}
            <div className="relative">
              <ToolbarButton
                data-action="text-color"
                onMouseDown={(e) => {
                  e.preventDefault();
                  saveSelection();
                }}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowColorPicker(!showColorPicker);
                }}
                active={showColorPicker}
                icon={
                  <span className="flex items-center gap-1">
                    <ColorIcon />
                    <span
                      className="w-3 h-3 rounded-sm border border-white/25"
                      style={{ backgroundColor: formatState.color }}
                    />
                  </span>
                }
                trailing={<ChevronDownIcon />}
                title={`Text Color${hasTextSelection ? ' (selected text)' : ' (whole element)'}`}
              />

              {showColorPicker && (
                <div 
                  ref={colorPickerRef}
                  className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-48 p-3"
                >
                  <div className="space-y-3">
                    {/* Selection Mode Indicator */}
                    {hasTextSelection && (
                      <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        💡 Color will be applied to selected text only
                      </div>
                    )}
                    
                    {/* Basic Colors */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-2">Basic</div>
                      <div className="flex space-x-1">
                        {COLOR_PALETTE.filter(c => c.group === 'basic').map((color) => (
                          <button
                            key={color.value}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onPointerDown={(e) => setColor(color.value, e)}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 select-none ${
                              formatState.color === color.value 
                                ? 'border-blue-500 shadow-sm' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                    
                    {/* Accent Colors for Highlighting */}
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-2">Accent Colors</div>
                      <div className="grid grid-cols-3 gap-1">
                        {COLOR_PALETTE.filter(c => c.group === 'accent').map((color) => (
                          <button
                            key={color.value}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              saveSelection();
                            }}
                            onPointerDown={(e) => setColor(color.value, e)}
                            className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 select-none ${
                              formatState.color === color.value 
                                ? 'border-blue-500 shadow-sm' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: color.value }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Text → Link: GREYED PLACEHOLDER (phase 3.5, founder ruling 9) ──
                Sits here because toolbarPlan's Beta column order is
                `… color · align · Link · Ask AI`, so Link belongs between the
                colour picker and the sparkle.

                It is DISABLED and carries ZERO functionality on purpose. Phase 3
                shipped the shared t4 LinkPicker, but there is nowhere to put a
                text link: NO text element in any schema has a link field (every
                `href` in the element schema is inside a collection — `nav_items.href`
                — or is a `*_cta_href`). The only mechanism would be injecting `<a>`
                into the saved text HTML, which needs `<a>`-injection machinery in
                `textFormatting.ts` (does not exist), would DISCARD `Link.source`,
                and collides with the published sanitizer's STRICT_PROFILE (no `'a'`
                tag) — i.e. it is a published-output change, which this spec forbids.

                Ruling 9: ship it greyed rather than omit it — the anatomy should
                show its intended shape, and a tooltip that says WHY reads as
                "coming", not as the broken button QA naayom C2 flagged. */}
            <ToolbarDivider />
            <ToolbarButton
              data-action="link"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              disabled
              disabledTitle="Text links are coming — the text schema has no link field yet."
              icon={<LinkIcon />}
              label="Link"
            />

            {/* Divider + AI Sparkle. NOTE: this is the EXISTING sparkle →
                variations flow, not the phase-5 "Ask Lessgo AI" instruction
                prompt (which lands in the shell's hidden trailing slot). */}
            <ToolbarDivider />
            <ToolbarButton
              data-action="ai-variations"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              // phase 3.5: the ONLY disabled ToolbarButton with a live handler and
              // no consumer-side guard. Native `disabled` used to protect
              // handleSparkle for free; with the aria-disabled convention that
              // protection is ToolbarButton's onClick guard alone. Guard here too,
              // matching Section/Image/ElementToolbar — a double-fired regen (mid-
              // generation) or a silent no-op regen (non-default locale) is a real
              // bug, not a placeholder no-op.
              onClick={(e) => {
                if (aiGeneration.isGenerating || regenLocaleLocked) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                handleSparkle();
              }}
              disabled={aiGeneration.isGenerating || regenLocaleLocked}
              disabledTitle={
                regenLocaleLocked
                  ? 'Switch to the default language to regenerate.'
                  : 'Generating…'
              }
              active={elementVariations.visible}
              className={aiGeneration.isGenerating ? 'animate-pulse' : ''}
              icon={<SparkleIcon />}
              title="AI text variations"
            />
          </div>
        </div>
      </div>

      {/* Variations Panel */}
      {elementVariations.visible && (
        <div
          ref={variationsRef}
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
          style={{
            top: '100%',
            left: 0,
            marginTop: 8,
            width: 380,
            maxHeight: 300,
          }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">Choose Variation</h3>
              <button
                onClick={() => hideElementVariations()}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {elementVariations.variations.map((variation: any, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    elementVariations.selectedIndex === index
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setVariationSelection(index)}
                >
                  <div className="flex items-start space-x-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      elementVariations.selectedIndex === index
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {elementVariations.selectedIndex === index && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {index === 0 ? 'Current' : `Variation ${index}`}
                      </div>
                      <div className="text-sm text-gray-600 line-clamp-2">
                        {variation}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => hideElementVariations()}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyVariation}
                className="px-4 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Variation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// MVP Icon Components (simple, clean)
function BoldIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
    </svg>
  );
}

function ItalicIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 4l4 16M14 4l4 16" />
    </svg>
  );
}

function UnderlineIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 20h12M8 4v8a4 4 0 008 0V4" />
    </svg>
  );
}

function AlignLeftIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8M4 18h12" />
    </svg>
  );
}

function AlignCenterIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M7 12h10M6 18h12" />
    </svg>
  );
}

function AlignRightIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M12 12h8M6 18h12" />
    </svg>
  );
}

function FontSizeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h6M4 7v10a1 1 0 001 1h4a1 1 0 001-1V7M15 12h6m0 0l-3-3m3 3l-3 3" />
    </svg>
  );
}

function ColorIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// The natural lucide-style link glyph — phase 3.5 deliberately does NOT invent a
// "disabled" icon; greying is carried by colour + cursor + aria-disabled alone.
function LinkIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}
// components/ui/SectionBackgroundModal.tsx - Simplified section background with radio buttons
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { SolidColorPicker } from './ColorPicker/SolidColorPicker';
import { validateBackgroundAccessibility } from '@/utils/contrastValidator';
import { getSectionBackgroundType } from '@/modules/Design/background/backgroundIntegration';
import {
  BackgroundType,
  SectionBackground,
  BackgroundValidation,
  ThemeColorType,
} from '@/types/core';
import { logger } from '@/lib/logger';

interface SectionBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
}

type SelectionMode = 'auto' | 'primary' | 'secondary' | 'neutral' | 'custom';

export function SectionBackgroundModal({ isOpen, onClose, sectionId }: SectionBackgroundModalProps) {
  const { content, setBackgroundType, setSectionBackground, theme, sections, onboardingData } = useEditStore();

  const section = content[sectionId];

  // Position-based auto value
  const autoBackgroundType = getSectionBackgroundType(sectionId, sections, undefined, onboardingData as any);

  // Determine current selection mode from stored state
  const getInitialMode = (): SelectionMode => {
    if (!section) return 'auto';
    if (section.backgroundType === 'custom' && section.sectionBackground?.type === 'custom') {
      return 'custom';
    }
    const stored = section.backgroundType as string;
    if (stored === 'primary' || stored === 'secondary' || stored === 'neutral') {
      // If stored matches auto, treat as auto
      if (stored === autoBackgroundType) return 'auto';
      return stored as SelectionMode;
    }
    return 'auto';
  };

  const [mode, setMode] = useState<SelectionMode>(getInitialMode);
  const [customColor, setCustomColor] = useState<string>(
    section?.sectionBackground?.custom?.solid || '#ffffff'
  );
  const [validation, setValidation] = useState<BackgroundValidation | null>(null);

  // Re-initialize on open
  useEffect(() => {
    if (isOpen && section) {
      setMode(getInitialMode());
      if (section.sectionBackground?.custom?.solid) {
        setCustomColor(section.sectionBackground.custom.solid);
      }
    }
  }, [isOpen, sectionId]);

  // Validate custom color contrast
  useEffect(() => {
    if (mode === 'custom' && customColor) {
      const bg: SectionBackground = { type: 'custom', custom: { solid: customColor } };
      const result = validateBackgroundAccessibility(bg, 'black');
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [mode, customColor]);

  const handleApply = useCallback(() => {
    logger.dev('SectionBG Apply:', () => ({ sectionId, mode, customColor }));

    if (mode === 'custom') {
      if (setBackgroundType) setBackgroundType(sectionId, 'custom' as any);
      if (setSectionBackground) {
        setSectionBackground(sectionId, { type: 'custom', custom: { solid: customColor } });
      }
    } else {
      const themeColor: ThemeColorType = mode === 'auto' ? autoBackgroundType as ThemeColorType : mode as ThemeColorType;
      if (setBackgroundType) setBackgroundType(sectionId, themeColor as any);
      if (setSectionBackground) {
        setSectionBackground(sectionId, { type: 'theme' as BackgroundType, themeColor });
      }
    }

    onClose();
  }, [sectionId, mode, customColor, autoBackgroundType, setBackgroundType, setSectionBackground, onClose]);

  const handleReset = useCallback(() => {
    setMode('auto');
  }, []);

  if (!isOpen) return null;

  const themeColors = theme?.colors?.sectionBackgrounds;

  const radioOptions: { key: SelectionMode; label: string; sublabel: string; preview?: string }[] = [
    {
      key: 'auto',
      label: `Auto (${autoBackgroundType})`,
      sublabel: 'Position-based default',
      preview: themeColors?.[autoBackgroundType as keyof typeof themeColors] || undefined,
    },
    {
      key: 'primary',
      label: 'Primary',
      sublabel: 'Hero/CTA surface',
      preview: themeColors?.primary || undefined,
    },
    {
      key: 'secondary',
      label: 'Secondary',
      sublabel: 'Content surface',
      preview: themeColors?.secondary || undefined,
    },
    {
      key: 'neutral',
      label: 'Neutral',
      sublabel: 'Chrome surface',
      preview: themeColors?.neutral || undefined,
    },
    {
      key: 'custom',
      label: 'Custom',
      sublabel: 'Solid hex color',
    },
  ];

  const sectionType = sectionId.split('-')[0];

  const modalContent = (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Section Background</h2>
            <p className="mt-1 text-sm text-gray-500 capitalize">{sectionType} section</p>
          </div>

          {/* Radio options */}
          <div className="px-6 py-4 space-y-2">
            {radioOptions.map((opt) => (
              <label
                key={opt.key}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  mode === opt.key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="sectionBg"
                  checked={mode === opt.key}
                  onChange={() => setMode(opt.key)}
                  className="sr-only"
                />
                {opt.preview && (
                  <div
                    className="w-8 h-8 rounded-md border border-gray-200 mr-3 flex-shrink-0"
                    style={{ background: opt.preview }}
                  />
                )}
                {!opt.preview && opt.key === 'custom' && (
                  <div
                    className="w-8 h-8 rounded-md border border-gray-200 mr-3 flex-shrink-0"
                    style={{ background: customColor }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500">{opt.sublabel}</div>
                </div>
                {mode === opt.key && (
                  <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </label>
            ))}

            {/* Custom color picker (expanded when custom selected) */}
            {mode === 'custom' && (
              <div className="mt-3 pl-11">
                <SolidColorPicker
                  value={{ color: customColor }}
                  onChange={(bg) => setCustomColor(bg.color)}
                />

                {/* Contrast warning */}
                {validation && validation.contrastRatio !== undefined && validation.contrastRatio < 4.5 && (
                  <div className="mt-2 p-2 rounded bg-orange-50 border border-orange-200">
                    <p className="text-xs text-orange-700">
                      Low text contrast ({validation.contrastRatio.toFixed(1)}:1). Text may be hard to read.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-3 flex justify-between">
            <button
              onClick={handleReset}
              disabled={mode === 'auto'}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40"
            >
              Reset to auto
            </button>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return null;
}

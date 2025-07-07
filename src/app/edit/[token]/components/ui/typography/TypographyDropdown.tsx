// /app/edit/[token]/components/ui/typography/TypographyDropdown.tsx
import React, { useEffect, useRef } from 'react';
import { TypographyTriggerButton } from './TypographyTriggerButton';
import { FontThemeOption } from './FontThemeOption';
import { useTypographyDropdown, useTypographySelector } from './useTypographySelector';
import type { FontTheme } from '@/types/core/index';

export function TypographyDropdown() {
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    isOpen, 
    previewTheme, 
    setPreviewTheme, 
    toggleDropdown, 
    closeDropdown 
  } = useTypographyDropdown();
  
  const {
    availableOptions,
    currentTheme,
    currentTone,
    applyTypography,
    previewTypography,
    restoreCurrentTypography
  } = useTypographySelector();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        if (previewTheme) {
          restoreCurrentTypography();
        }
        closeDropdown();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (previewTheme) {
          restoreCurrentTypography();
        }
        closeDropdown();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, previewTheme, closeDropdown, restoreCurrentTypography]);

  const handleOptionClick = (theme: FontTheme) => {
    applyTypography(theme);
    closeDropdown();
  };

  const handleOptionHover = (theme: FontTheme) => {
    setPreviewTheme(theme);
    previewTypography(theme);
  };

  const handleOptionLeave = () => {
    if (previewTheme) {
      restoreCurrentTypography();
      setPreviewTheme(null);
    }
  };

  const isCurrentTheme = (theme: FontTheme) => 
    theme.headingFont === currentTheme.headingFont && 
    theme.bodyFont === currentTheme.bodyFont;

  const primaryOptions = availableOptions.filter(option => option.toneId === currentTone);
  const secondaryOptions = availableOptions.filter(option => option.toneId !== currentTone);

  return (
    <div className="relative" ref={dropdownRef}>
      <TypographyTriggerButton
        currentTheme={currentTheme}
        isOpen={isOpen}
        onClick={toggleDropdown}
      />

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-h-80 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Typography Style
              </h4>
              
              {primaryOptions.length > 0 && (
                <div className="space-y-2 mb-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {currentTone.replace('-', ' ')} Options
                  </p>
                  {primaryOptions.map((option, index) => (
                    <FontThemeOption
                      key={`${option.toneId}-${index}`}
                      theme={option}
                      isSelected={isCurrentTheme(option)}
                      onClick={() => handleOptionClick(option)}
                      onMouseEnter={() => handleOptionHover(option)}
                      onMouseLeave={handleOptionLeave}
                    />
                  ))}
                </div>
              )}
              
              {secondaryOptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    Compatible Options
                  </p>
                  {secondaryOptions.map((option, index) => (
                    <FontThemeOption
                      key={`${option.toneId}-${index}`}
                      theme={option}
                      isSelected={isCurrentTheme(option)}
                      onClick={() => handleOptionClick(option)}
                      onMouseEnter={() => handleOptionHover(option)}
                      onMouseLeave={handleOptionLeave}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
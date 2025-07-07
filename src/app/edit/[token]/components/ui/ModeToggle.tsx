// /app/edit/[token]/components/ui/ModeToggle.tsx
"use client";

import React from 'react';

export type BackgroundSelectorMode = 'generated' | 'brand' | 'custom';

interface ModeToggleProps {
  mode: BackgroundSelectorMode;
  onModeChange: (mode: BackgroundSelectorMode) => void;
  disabled?: boolean;
}

interface ModeOption {
  id: BackgroundSelectorMode;
  label: string;
  description: string;
  icon: string;
  badge?: string;
  comingSoon?: boolean;
}

const modeOptions: ModeOption[] = [
  {
    id: 'generated',
    label: 'Generated',
    description: 'AI-selected backgrounds optimized for your content',
    icon: '🤖',
    badge: 'Recommended',
  },
  {
    id: 'brand',
    label: 'Brand Colors',
    description: 'Backgrounds compatible with your brand palette',
    icon: '🎨',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Full control over background selection',
    icon: '⚙️',
    badge: 'Advanced',
  },
];

export function ModeToggle({ mode, onModeChange, disabled = false }: ModeToggleProps) {
  const handleModeClick = (newMode: BackgroundSelectorMode) => {
    if (disabled || newMode === mode) return;
    
    onModeChange(newMode);
  };

  return (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      {modeOptions.map((option) => {
        const isActive = mode === option.id;
        const isDisabled = disabled || option.comingSoon;
        
        return (
          <button
            key={option.id}
            onClick={() => handleModeClick(option.id)}
            disabled={isDisabled}
            className={`
              relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
              ${isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : isDisabled
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
            `}
            title={option.description}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xs">{option.icon}</span>
              <span>{option.label}</span>
              
              {/* Mode badges */}
              {option.badge && (
                <span className={`
                  inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                  ${option.badge === 'Recommended'
                    ? 'bg-green-100 text-green-700'
                    : option.badge === 'Advanced'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {option.badge}
                </span>
              )}
              
              {/* Coming soon badge */}
              {option.comingSoon && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                  Soon
                </span>
              )}
            </div>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
                <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Compact version for smaller spaces
 */
interface CompactModeToggleProps {
  mode: BackgroundSelectorMode;
  onModeChange: (mode: BackgroundSelectorMode) => void;
  disabled?: boolean;
}

export function CompactModeToggle({ mode, onModeChange, disabled = false }: CompactModeToggleProps) {
  const currentOption = modeOptions.find(opt => opt.id === mode);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleModeSelect = (newMode: BackgroundSelectorMode) => {
    onModeChange(newMode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors
          ${disabled
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
      >
        <span className="text-xs">{currentOption?.icon}</span>
        <span>{currentOption?.label}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {modeOptions.map((option) => {
              const isActive = mode === option.id;
              const isDisabled = disabled || option.comingSoon;
              
              return (
                <button
                  key={option.id}
                  onClick={() => handleModeSelect(option.id)}
                  disabled={isDisabled}
                  className={`
                    w-full px-4 py-2 text-left transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-700'
                      : isDisabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{option.label}</span>
                        {option.badge && (
                          <span className={`
                            inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium
                            ${option.badge === 'Recommended'
                              ? 'bg-green-100 text-green-700'
                              : option.badge === 'Advanced'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-600'
                            }
                          `}>
                            {option.badge}
                          </span>
                        )}
                        {option.comingSoon && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                            Soon
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {option.description}
                      </div>
                    </div>
                    
                    {/* Active checkmark */}
                    {isActive && (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Utility function to get mode configuration
 */
export function getModeConfig(mode: BackgroundSelectorMode) {
  return modeOptions.find(opt => opt.id === mode);
}

/**
 * Utility function to check if mode requires special handling
 */
export function isBrandMode(mode: BackgroundSelectorMode): boolean {
  return mode === 'brand';
}

export function isCustomMode(mode: BackgroundSelectorMode): boolean {
  return mode === 'custom';
}

export function isGeneratedMode(mode: BackgroundSelectorMode): boolean {
  return mode === 'generated';
}
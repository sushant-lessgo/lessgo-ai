// /app/edit/[token]/components/ui/TierToggle.tsx
"use client";

import React from 'react';
import type { ColorSelectorTier } from '@/types/core';

interface TierToggleProps {
  activeTier: ColorSelectorTier;
  onTierChange: (tier: ColorSelectorTier) => void;
  disabled?: boolean;
}

export function TierToggle({ activeTier, onTierChange, disabled = false }: TierToggleProps) {
  const tiers: Array<{ tier: ColorSelectorTier; label: string; description: string }> = [
    { 
      tier: 1, 
      label: 'Quick', 
      description: 'Simple semantic controls for common adjustments' 
    },
    { 
      tier: 2, 
      label: 'Advanced', 
      description: 'Category-level controls for fine-tuning' 
    },
    { 
      tier: 3, 
      label: 'Expert', 
      description: 'Full access to all color tokens' 
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        {tiers.map(({ tier, label }) => (
          <button
            key={tier}
            onClick={() => onTierChange(tier)}
            disabled={disabled}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
              ${activeTier === tier
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-600">
        {tiers.find(t => t.tier === activeTier)?.description}
      </div>

      {activeTier === 3 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <div className="text-sm font-medium text-amber-800">Expert Mode Warning</div>
              <div className="text-xs text-amber-700 mt-1">
                Direct token access can break design relationships. Changes may impact accessibility and brand consistency.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
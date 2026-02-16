"use client";

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import {
  palettes,
  getPalettesByMode,
  type Palette,
} from '@/modules/Design/background/palettes';
import { usePaletteSwap } from './usePaletteSwap';

type ModeFilter = 'all' | 'light' | 'dark';

const MODE_TABS: { value: ModeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

interface StyleBrowserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StyleBrowserModal({ open, onOpenChange }: StyleBrowserModalProps) {
  const [mode, setMode] = useState<ModeFilter>('all');
  const { theme } = useEditStore();
  const paletteId = theme?.colors?.paletteId;
  const handlePaletteSwap = usePaletteSwap();

  const filtered = useMemo(() => {
    if (mode === 'all') return palettes;
    return getPalettesByMode(mode);
  }, [mode]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Browse styles</DialogTitle>
        </DialogHeader>

        {/* Mode tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-full p-1 w-fit">
          {MODE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMode(tab.value)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                mode === tab.value
                  ? 'bg-white text-gray-900 shadow-sm font-medium'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Palette grid */}
        <div className="grid grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {filtered.map((palette) => {
            const isActive = palette.id === paletteId;
            return (
              <button
                key={palette.id}
                onClick={() => handlePaletteSwap(palette)}
                className={`relative rounded-lg border-2 overflow-hidden transition-all hover:scale-105 hover:shadow-md ${
                  isActive
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-1'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Color bands */}
                <div className="relative">
                  <div className="h-7" style={{ background: palette.primary }} />
                  <div className="h-7" style={{ background: palette.secondary }} />
                  <div className="h-7" style={{ background: palette.neutral }} />

                  {/* Active checkmark */}
                  {isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <svg className="w-6 h-6 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="px-2 py-1.5 text-xs text-gray-900 truncate text-left border-t border-gray-200 bg-white">
                  {palette.label}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

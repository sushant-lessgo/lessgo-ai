'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { predefinedThemes } from './predefinedThemes';
import posthog from 'posthog-js';

export default function ThemeCustomizer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { primary, background, muted, setTheme, resetTheme, getFullTheme } = useThemeStore();
  const [localPrimary, setLocalPrimary] = useState(primary);
  const [localBackground, setLocalBackground] = useState(background);
  const [localMuted, setLocalMuted] = useState(muted);

  // Apply current theme when panel opens
  useEffect(() => {
    if (isOpen) {
      setLocalPrimary(primary);
      setLocalBackground(background);
      setLocalMuted(muted);
    }
  }, [isOpen]);

  const applyCSSVariables = (theme: Record<string, string>) => {
    Object.entries(theme).forEach(([key, val]) => {
      document.documentElement.style.setProperty(key, val);
    });
  };

  const handleHover = (theme: { primary: string; background: string; muted: string }) => {
    const temp = useThemeStore.getState();
    const full = temp.getFullTheme.call({ ...temp, ...theme });
    applyCSSVariables(full);
  };

  const handleHoverEnd = () => {
    const full = getFullTheme();
    applyCSSVariables(full);
  };

  const handleClickTheme = (theme: { primary: string; background: string; muted: string }) => {
    setTheme(theme);
    const full = useThemeStore.getState().getFullTheme();
    applyCSSVariables(full);
    posthog.capture('theme_applied_from_swatches', { theme });
    setLocalPrimary(theme.primary);
    setLocalBackground(theme.background);
    setLocalMuted(theme.muted);
  };

  const handleSave = () => {
    setTheme({
      primary: localPrimary,
      background: localBackground,
      muted: localMuted,
    });
    const full = useThemeStore.getState().getFullTheme();
    applyCSSVariables(full);
    posthog.capture('theme_saved', { source: 'customizer' });
    onClose();
  };

  const handleReset = () => {
    resetTheme();
    const full = useThemeStore.getState().getFullTheme();
    applyCSSVariables(full);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 w-[320px] h-full bg-white border-l shadow-lg z-50 p-4 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">🎨 Customize Theme</h2>
        <button onClick={onClose}><X /></button>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Predefined Themes</label>
        <div className="grid grid-cols-3 gap-2">
          {predefinedThemes.map((theme) => (
            <button
              key={theme.name}
              onMouseEnter={() => handleHover(theme)}
              onMouseLeave={handleHoverEnd}
              onClick={() => handleClickTheme(theme)}
              className="rounded border border-gray-200 p-2 hover:shadow transition"
              title={theme.name}
            >
              <div className="w-full h-6 rounded mb-1" style={{ backgroundColor: theme.primary }} />
              <div className="flex gap-1">
                <div className="w-1/2 h-3 rounded" style={{ backgroundColor: theme.background }} />
                <div className="w-1/2 h-3 rounded" style={{ backgroundColor: theme.muted }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium">Primary Color</label>
          <input
            type="color"
            value={localPrimary}
            onChange={(e) => setLocalPrimary(e.target.value)}
            className="w-full h-10 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Background Color</label>
          <input
            type="color"
            value={localBackground}
            onChange={(e) => setLocalBackground(e.target.value)}
            className="w-full h-10 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Muted Text Color</label>
          <input
            type="color"
            value={localMuted}
            onChange={(e) => setLocalMuted(e.target.value)}
            className="w-full h-10 rounded"
          />
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <button
          onClick={handleReset}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          className="flex-1 bg-black text-white px-4 py-2 rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}

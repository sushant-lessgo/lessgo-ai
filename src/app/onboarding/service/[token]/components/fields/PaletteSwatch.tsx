'use client';

import { Check, Lock } from 'lucide-react';
import type { HearthPalette } from '@/types/service';
import { hearthPaletteConfigs } from '@/modules/templates/hearth/palettes';

interface PaletteSwatchProps {
  paletteId: HearthPalette;
  label: string;
  selected: boolean;
  enabled: boolean;
  onSelect: (id: HearthPalette) => void;
}

export default function PaletteSwatch({
  paletteId,
  label,
  selected,
  enabled,
  onSelect,
}: PaletteSwatchProps) {
  const cfg = hearthPaletteConfigs[paletteId];

  const handleClick = () => {
    if (!enabled) return;
    onSelect(paletteId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!enabled}
      title={enabled ? label : `${label} — coming soon`}
      aria-pressed={selected}
      className={`group relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${
        selected
          ? 'border-brand-accentPrimary ring-2 ring-brand-accentPrimary/20'
          : enabled
            ? 'border-gray-200 hover:border-gray-400'
            : 'border-gray-200 cursor-not-allowed opacity-50'
      }`}
      style={{ background: cfg.accentWash }}
    >
      <div
        className="absolute inset-3 rounded-lg"
        style={{ background: cfg.accent }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{ background: cfg.accentDeep }}
      />

      {selected && enabled && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
          <Check className="w-3 h-3 text-brand-accentPrimary" />
        </div>
      )}

      {!enabled && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-white/90 flex items-center justify-center">
          <Lock className="w-3 h-3 text-gray-500" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-white/90 backdrop-blur-sm">
        <span className="text-xs font-medium text-gray-700 capitalize">
          {label}
        </span>
      </div>
    </button>
  );
}

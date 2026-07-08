'use client';

// scale-06 phase 8 — COPY of the service field component
// (src/app/onboarding/service/[token]/components/fields/PaletteSwatch.tsx).
// Copied, not moved, so the old service wizard keeps working until phase 10
// (plan D "shared field components are copied into shared/, originals deleted
// with the fork"). Template-agnostic: swatch colors are passed in.

import { Check, Lock } from 'lucide-react';

interface PaletteSwatchProps {
  paletteId: string;
  label: string;
  selected: boolean;
  enabled: boolean;
  /** Swatch colors — passed in so the swatch is template-agnostic (Hearth + Lex). */
  accent: string;
  accentDeep: string;
  /** Optional soft wash behind the swatch (Hearth has one; Lex falls back). */
  wash?: string;
  onSelect: (id: string) => void;
}

export default function PaletteSwatch({
  paletteId,
  label,
  selected,
  enabled,
  accent,
  accentDeep,
  wash,
  onSelect,
}: PaletteSwatchProps) {
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
      style={{ background: wash ?? '#f8f8f8' }}
    >
      <div className="absolute inset-3 rounded-lg" style={{ background: accent }} />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3"
        style={{ background: accentDeep }}
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
        <span className="text-xs font-medium text-gray-700 capitalize">{label}</span>
      </div>
    </button>
  );
}

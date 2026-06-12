'use client';

import type { Palette } from '@/modules/Design/background/palettes';

const ACCENT_HEX: Record<string, string> = {
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  emerald: '#10b981',
  purple: '#8b5cf6',
  orange: '#f97316',
  amber: '#f59e0b',
  indigo: '#6366f1',
};

function getAccentHex(palette: Palette): string {
  const first = palette.compatibleAccents[0];
  return ACCENT_HEX[first] || '#3b82f6';
}

interface PalettePreviewCardProps {
  palette: Palette;
  productName: string;
  oneLiner: string;
  ctaText: string;
  selected?: boolean;
  onClick: () => void;
}

export default function PalettePreviewCard({
  palette,
  productName,
  oneLiner,
  ctaText,
  selected,
  onClick,
}: PalettePreviewCardProps) {
  const isDark = palette.mode === 'dark';
  const textColor = isDark ? '#ffffff' : '#1f2937';
  const mutedColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(31,41,55,0.6)';
  const accentHex = getAccentHex(palette);

  // Card surface color — lighter/darker than secondary
  const cardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer
        transition-all duration-200
        w-[210px] min-w-[210px] flex-shrink-0
        ${selected
          ? 'ring-2 ring-blue-500 ring-offset-2 scale-[1.02]'
          : 'hover:scale-[1.01] hover:shadow-lg'
        }
      `}
      style={{ height: 280 }}
    >
      {/* Primary zone — hero */}
      <div
        className="flex flex-col items-start justify-end px-3 pb-2 pt-4"
        style={{ background: palette.primary, height: '45%' }}
      >
        <p
          className="text-xs font-bold leading-tight truncate w-full text-left"
          style={{ color: textColor }}
        >
          {productName || 'Your Product'}
        </p>
        <p
          className="text-[9px] leading-tight mt-0.5 line-clamp-2 text-left w-full"
          style={{ color: mutedColor }}
        >
          {oneLiner || 'Your one-liner goes here'}
        </p>
        <div
          className="mt-1.5 px-2 py-0.5 rounded text-[8px] font-semibold"
          style={{ backgroundColor: accentHex, color: '#ffffff' }}
        >
          {ctaText}
        </div>
      </div>

      {/* Secondary zone — cards */}
      <div
        className="flex items-center justify-center gap-1.5 px-3"
        style={{ background: palette.secondary, height: '30%' }}
      >
        <div
          className="rounded w-[45%] h-[70%]"
          style={{ backgroundColor: cardBg }}
        />
        <div
          className="rounded w-[45%] h-[70%]"
          style={{ backgroundColor: cardBg }}
        />
      </div>

      {/* Neutral zone — footer CTA */}
      <div
        className="flex items-center justify-center px-3"
        style={{ background: palette.neutral, height: '25%' }}
      >
        <div
          className="px-2 py-0.5 rounded text-[8px] font-semibold"
          style={{ backgroundColor: accentHex, color: '#ffffff' }}
        >
          {ctaText}
        </div>
      </div>
    </button>
  );
}

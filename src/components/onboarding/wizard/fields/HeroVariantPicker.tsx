'use client';

// HeroVariantPicker — onboarding2 Phase 3 (Axis B, generation-time pick).
// Two-card visual chooser shown NON-BLOCKINGLY while copy streams on the
// manufacturer/vestria flow: tailored image hero vs full-bleed video hero.
// Prop-controlled — the wizard StyleSlot binds it to useWizardStore.heroVariant;
// GeneratingSlot applies the value into the saved finalContent
// (content[heroId].layout — the authoritative field) on save.
//
// Re-homed from src/app/onboarding/product/[token]/components/fields/ in
// scale-06 phase 10 (the old product wizard tree was deleted). Behavior unchanged.

import type { VestriaHeroVariant } from '@/types/product';

interface HeroVariantPickerProps {
  value: VestriaHeroVariant;
  onChange: (variant: VestriaHeroVariant) => void;
}

interface VariantCard {
  id: VestriaHeroVariant;
  title: string;
  description: string;
}

const VARIANTS: VariantCard[] = [
  {
    id: 'VestriaTailoredHero',
    title: 'Image hero',
    description: 'Two-column opening with a large photo',
  },
  {
    id: 'VestriaFullBleedHero',
    title: 'Video hero',
    description: 'Full-screen background video (upload your clips later)',
  },
];

/** Miniature layout sketch for the tailored (two-column image) hero. */
function TailoredThumb({ active }: { active: boolean }) {
  const accent = active ? 'bg-brand-accentPrimary' : 'bg-gray-400';
  return (
    <div
      aria-hidden
      className="w-full h-16 rounded-md bg-gray-100 border border-gray-200 p-2 flex gap-2"
    >
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className={`h-1.5 w-3/4 rounded-sm ${accent}`} />
        <div className="h-1 w-full rounded-sm bg-gray-300" />
        <div className="h-1 w-5/6 rounded-sm bg-gray-300" />
        <div className={`h-2 w-8 rounded-sm mt-0.5 ${accent}`} />
      </div>
      <div className="w-2/5 rounded-sm bg-gray-300" />
    </div>
  );
}

/** Miniature layout sketch for the full-bleed video hero. */
function FullBleedThumb({ active }: { active: boolean }) {
  const accent = active ? 'bg-brand-accentPrimary' : 'bg-gray-400';
  return (
    <div
      aria-hidden
      className="relative w-full h-16 rounded-md bg-gray-800 border border-gray-700 p-2 flex flex-col items-center justify-center gap-1.5 overflow-hidden"
    >
      {/* play glyph = video */}
      <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
        <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-white/90 ml-0.5" />
      </div>
      <div className={`h-1.5 w-1/2 rounded-sm ${accent}`} />
      <div className="h-1 w-2/3 rounded-sm bg-gray-500" />
      <div className={`h-2 w-8 rounded-sm ${accent}`} />
    </div>
  );
}

export default function HeroVariantPicker({ value, onChange }: HeroVariantPickerProps) {
  return (
    <div className="mt-8 border-t border-gray-100 pt-6">
      <p className="text-sm font-medium text-gray-900 text-center mb-1">
        While we write — pick your hero style
      </p>
      <p className="text-xs text-gray-500 text-center mb-4">
        Optional. You can change it later in the editor.
      </p>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Hero style">
        {VARIANTS.map((v) => {
          const active = value === v.id;
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(v.id)}
              className={`text-left rounded-lg border p-3 transition-colors ${
                active
                  ? 'border-brand-accentPrimary ring-1 ring-brand-accentPrimary bg-orange-50/40'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {v.id === 'VestriaTailoredHero' ? (
                <TailoredThumb active={active} />
              ) : (
                <FullBleedThumb active={active} />
              )}
              <div className="mt-2 text-sm font-medium text-gray-900">{v.title}</div>
              <div className="mt-0.5 text-xs text-gray-500 leading-snug">{v.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

// VestriaHeroVariantSelector — onboarding2 Phase 4 (editor hero swap).
// Bespoke 2-card selector rendered by LayoutChangeModal ONLY for the vestria
// hero section. Both variants share the same copy element keys (Phase 1), so
// the swap is content-preserving: we only change the layout id (the caller
// writes it via the existing updateSectionLayout, which updates BOTH
// content[sectionId].layout and sectionLayouts[sectionId] and autosaves).
// We deliberately do NOT use the legacy LayoutChangeSelector here — it is
// built for the 47-block legacy layout library (layoutRegistry / migration
// scoring) and would misbehave for template-module layouts.

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/** The only two vestria hero layouts — used by LayoutChangeModal's gate. */
export const VESTRIA_HERO_LAYOUTS: readonly string[] = [
  'VestriaTailoredHero',
  'VestriaFullBleedHero',
];

interface VestriaHeroVariantSelectorProps {
  isOpen: boolean;
  currentLayout: string;
  onClose: () => void;
  onSelect: (layoutId: string) => void;
}

interface VariantCard {
  id: string;
  title: string;
  description: string;
}

const VARIANTS: VariantCard[] = [
  {
    id: 'VestriaTailoredHero',
    title: 'Tailored',
    description: 'Two-column opening with a large photo.',
  },
  {
    id: 'VestriaFullBleedHero',
    title: 'Full-bleed',
    description: 'Full-screen background video with centered copy. Upload your clips after switching.',
  },
];

/** Miniature layout sketch for the tailored (two-column image) hero. */
function TailoredThumb() {
  return (
    <div
      aria-hidden
      className="w-full h-24 rounded-md bg-muted/30 border p-3 flex gap-3"
    >
      <div className="flex-1 flex flex-col justify-center gap-1.5">
        <div className="h-2 w-3/4 rounded-sm bg-muted-foreground/40" />
        <div className="h-1 w-full rounded-sm bg-muted-foreground/20" />
        <div className="h-1 w-5/6 rounded-sm bg-muted-foreground/20" />
        <div className="h-2.5 w-10 rounded-sm mt-1 bg-primary/50" />
      </div>
      <div className="w-2/5 rounded-sm bg-muted-foreground/25" />
    </div>
  );
}

/** Miniature layout sketch for the full-bleed video hero. */
function FullBleedThumb() {
  return (
    <div
      aria-hidden
      className="relative w-full h-24 rounded-md bg-gray-800 border border-gray-700 p-3 flex flex-col items-center justify-center gap-1.5 overflow-hidden"
    >
      {/* play glyph = video */}
      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
        <div className="w-0 h-0 border-y-[3px] border-y-transparent border-l-[5px] border-l-white/90 ml-0.5" />
      </div>
      <div className="h-2 w-1/2 rounded-sm bg-white/70" />
      <div className="h-1 w-2/3 rounded-sm bg-white/40" />
      <div className="h-2.5 w-10 rounded-sm bg-primary/60" />
    </div>
  );
}

export function VestriaHeroVariantSelector({
  isOpen,
  currentLayout,
  onClose,
  onSelect,
}: VestriaHeroVariantSelectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change hero style</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your headline, copy and uploaded media are kept when you switch.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2" role="radiogroup" aria-label="Hero style">
          {VARIANTS.map((variant) => {
            const isCurrent = variant.id === currentLayout;
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={isCurrent}
                onClick={() => onSelect(variant.id)}
                className={cn(
                  'relative text-left rounded-lg border p-3 transition-all',
                  'hover:ring-2 hover:ring-primary hover:shadow-lg',
                  isCurrent
                    ? 'ring-2 ring-primary bg-primary/5'
                    : 'bg-background'
                )}
              >
                {isCurrent && (
                  <Badge className="absolute top-2 right-2 text-xs z-10" variant="default">
                    Current
                  </Badge>
                )}
                {variant.id === 'VestriaTailoredHero' ? <TailoredThumb /> : <FullBleedThumb />}
                <div className="mt-3 text-sm font-medium">{variant.title}</div>
                <div className="mt-1 text-xs text-muted-foreground leading-snug">
                  {variant.description}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

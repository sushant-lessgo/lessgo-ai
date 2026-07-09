"use client";

// BlockVariantSelector — scale-09 phase 5 (generalized editor block swap).
//
// Manifest-driven successor to the bespoke VestriaHeroVariantSelector. For ANY
// section whose template manifest declares >1 copy-compatible block (variant),
// this renders a card picker and applies the swap with ZERO regen: swapping only
// changes the stored layout name (updateSectionLayout writes BOTH
// content[sectionId].layout and sectionLayouts[sectionId]); the section's element
// content is preserved and re-rendered by the newly-selected block (phase 3 made
// resolveBlock honor the stored layout). Vestria hero + surge testimonials now
// flow through this same generic path.
//
// ── eligibility (asset facts, NOT capacity) ─────────────────────────────────
// We list only variants ELIGIBLE w.r.t. asset facts derived from the CURRENT
// editor state — presence of uploaded image/logo/video URLs (or a testimonials
// collection) in the section's content (plan Q5: presence proxy is acceptable).
// This is how a `requiresAssets: ['photos']` variant "appears after photos are
// uploaded". Capacity does NOT filter here — it CLAMPS on swap (see below): a
// smaller-capacity target is always offered; picking it drops trailing cards.
// We reuse blockEligibility.isBlockEligible with NO cardCountHint, so its
// capacity check is a no-op and only asset needs gate the list. The CURRENT
// variant is always shown even if its assets are momentarily absent.
//
// ── clamp-with-warning ──────────────────────────────────────────────────────
// If the target's capacity.maxCards < the section's current card count, we show
// an inline warning ("keeps first N cards; undo restores") and, on confirm, wrap
// updateSectionLayout + setSection(clamped elements) in ONE executeUndoableAction
// so a single undo restores both the layout and the dropped cards. No clamp
// needed ⇒ layout-only swap, content untouched.

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { blockManifests, type BlockDeclaration, type SectionBlockSet } from '@/modules/templates/blockManifest';
import { isBlockEligible, type AssetFacts } from '@/modules/generation/blockEligibility';
import { clampSectionCards, sectionCardCount, type ClampableSection } from './clampSectionCards';

// ── manifest lookup helpers (shared with LayoutChangeModal + SectionToolbar) ──

/** Resolve the manifest SectionBlockSet + section type that OWNS a stored layout name. */
export function getVariantSetForLayout(
  templateId: string | null | undefined,
  layoutName: string | null | undefined
): { sectionType: string; set: SectionBlockSet } | null {
  if (!templateId || !layoutName) return null;
  const manifest = blockManifests[templateId as keyof typeof blockManifests];
  if (!manifest) return null;
  for (const [sectionType, set] of Object.entries(manifest)) {
    if (set.variants.some((v) => v.layoutName === layoutName)) {
      return { sectionType, set };
    }
  }
  return null;
}

/** True when the section owning `layoutName` declares MORE THAN ONE variant (swap-eligible). */
export function hasMultipleVariants(
  templateId: string | null | undefined,
  layoutName: string | null | undefined
): boolean {
  const found = getVariantSetForLayout(templateId, layoutName);
  return !!found && found.set.variants.length > 1;
}

// ── editor-side asset facts (presence proxy over current section content) ─────

const isNonEmptyUrl = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;

/** Does an array of card-like objects carry any non-empty image/photo/src URL? */
function arrayHasImage(arr: unknown[]): boolean {
  return arr.some(
    (item) =>
      item &&
      typeof item === 'object' &&
      Object.entries(item as Record<string, unknown>).some(
        ([k, val]) => /image|photo|src|avatar|logo|url/i.test(k) && isNonEmptyUrl(val)
      )
  );
}

/**
 * Derive normalized AssetFacts from the CURRENT section content (editor state).
 * Pilot proxy: an asset "exists" when a matching non-empty URL / non-empty
 * collection is present in the section's elements. Deliberately generous — the
 * gate only decides whether an asset-requiring VARIANT is offered.
 */
export function deriveEditorAssetFacts(section: ClampableSection | null | undefined): AssetFacts {
  const elements = section?.elements ?? {};
  let hasPhotos = false;
  let hasLogos = false;
  let hasTestimonials = false;
  let hasTestimonialPhotos = false;

  for (const [key, value] of Object.entries(elements)) {
    const k = key.toLowerCase();
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      if (/testimonial|review|quote/.test(k)) {
        hasTestimonials = true;
        if (arrayHasImage(value)) hasTestimonialPhotos = true;
      }
      if (/logo/.test(k)) hasLogos = true;
      if (/image|photo|gallery|video/.test(k) || arrayHasImage(value)) hasPhotos = true;
    } else if (isNonEmptyUrl(value)) {
      if (/logo/.test(k)) hasLogos = true;
      if (/image|photo|video|gallery|hero|cover/.test(k)) hasPhotos = true;
    }
  }

  return { hasPhotos, hasLogos, hasTestimonials, hasTestimonialPhotos };
}

// ── generic thumb (pilot: a neutral layout sketch; per-variant art is future) ──
function GenericThumb({ dark }: { dark?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        'w-full h-24 rounded-md border p-3 flex flex-col justify-center gap-1.5',
        dark ? 'bg-gray-800 border-gray-700' : 'bg-muted/30'
      )}
    >
      <div className={cn('h-2 w-3/4 rounded-sm', dark ? 'bg-white/70' : 'bg-muted-foreground/40')} />
      <div className={cn('h-1 w-full rounded-sm', dark ? 'bg-white/30' : 'bg-muted-foreground/20')} />
      <div className={cn('h-1 w-5/6 rounded-sm', dark ? 'bg-white/30' : 'bg-muted-foreground/20')} />
      <div className={cn('h-2.5 w-10 rounded-sm mt-1', dark ? 'bg-primary/60' : 'bg-primary/50')} />
    </div>
  );
}

interface BlockVariantSelectorProps {
  isOpen: boolean;
  sectionId: string;
  /** Section type owning the variant set (from the manifest lookup). */
  sectionType: string;
  templateId: string | null | undefined;
  /** Current stored layout name (content[sectionId].layout). */
  currentLayout: string;
  /** Current section content (for asset facts + card-count clamp). */
  sectionContent: ClampableSection | null | undefined;
  set: SectionBlockSet;
  onClose: () => void;
  updateSectionLayout: (sectionId: string, layoutId: string) => void;
  setSection: (sectionId: string, updates: { elements: Record<string, unknown> }) => void;
  executeUndoableAction: (actionType: any, actionName: string, action: () => void) => void;
}

/** A section header label for the dialog title, derived from section type. */
function titleForSection(sectionType: string): string {
  const nice = sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
  return `Change ${nice.toLowerCase()} style`;
}

export function BlockVariantSelector({
  isOpen,
  sectionId,
  sectionType,
  templateId,
  currentLayout,
  sectionContent,
  set,
  onClose,
  updateSectionLayout,
  setSection,
  executeUndoableAction,
}: BlockVariantSelectorProps) {
  // Pending clamp confirmation: target layout + how many cards would be dropped.
  const [pendingClamp, setPendingClamp] = useState<{ layoutId: string; dropped: number; keep: number } | null>(null);

  const assetFacts = useMemo(() => deriveEditorAssetFacts(sectionContent), [sectionContent]);

  // Eligible variants = asset-facts pass (capacity ignored: no cardCountHint) OR
  // the currently-selected variant (always shown). Declaration order preserved.
  const variants = useMemo(() => {
    return set.variants.filter(
      (v) => v.layoutName === currentLayout || isBlockEligible(v, { assetFacts })
    );
  }, [set, currentLayout, assetFacts]);

  const currentCardCount = useMemo(() => sectionCardCount(sectionContent), [sectionContent]);

  const applyLayoutOnly = (layoutId: string) => {
    executeUndoableAction('section-layout-update' as any, `Changed ${sectionType} block to ${layoutId}`, () => {
      updateSectionLayout(sectionId, layoutId);
    });
    onClose();
  };

  const applyWithClamp = (layoutId: string, maxCards: number) => {
    const { content: clamped } = clampSectionCards(sectionContent ?? { elements: {} }, maxCards);
    const clampedElements = (clamped.elements ?? {}) as Record<string, unknown>;
    executeUndoableAction('section-layout-update' as any, `Changed ${sectionType} block to ${layoutId}`, () => {
      updateSectionLayout(sectionId, layoutId);
      setSection(sectionId, { elements: clampedElements });
    });
    setPendingClamp(null);
    onClose();
  };

  const handleSelect = (decl: BlockDeclaration) => {
    const layoutId = decl.layoutName;
    if (layoutId === currentLayout) {
      onClose();
      return;
    }
    const maxCards = decl.capacity?.maxCards;
    if (maxCards !== undefined && maxCards < currentCardCount) {
      // Smaller-capacity target: confirm the trailing-card drop first.
      setPendingClamp({ layoutId, dropped: currentCardCount - maxCards, keep: maxCards });
      return;
    }
    applyLayoutOnly(layoutId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{titleForSection(sectionType)}</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your headline, copy and uploaded media are kept when you switch.
          </p>
        </DialogHeader>

        {pendingClamp ? (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <div className="text-sm font-medium text-amber-900">
              This style shows fewer cards
            </div>
            <p className="mt-1 text-xs text-amber-800 leading-snug">
              We&apos;ll keep the first {pendingClamp.keep} card{pendingClamp.keep === 1 ? '' : 's'} and drop{' '}
              {pendingClamp.dropped} at the end. Undo restores the removed card{pendingClamp.dropped === 1 ? '' : 's'}.
            </p>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingClamp(null)}
                className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-background"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => applyWithClamp(pendingClamp.layoutId, pendingClamp.keep)}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                Switch &amp; keep first {pendingClamp.keep}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mt-2" role="radiogroup" aria-label={`${sectionType} style`}>
            {variants.map((variant, idx) => {
              const isCurrent = variant.layoutName === currentLayout;
              const dark = /video|fullbleed|full-bleed|dark/i.test(variant.layoutName + ' ' + (variant.blurb ?? ''));
              return (
                <button
                  key={variant.layoutName}
                  type="button"
                  role="radio"
                  aria-checked={isCurrent}
                  onClick={() => handleSelect(variant)}
                  className={cn(
                    'relative text-left rounded-lg border p-3 transition-all',
                    'hover:ring-2 hover:ring-primary hover:shadow-lg',
                    isCurrent ? 'ring-2 ring-primary bg-primary/5' : 'bg-background'
                  )}
                >
                  {isCurrent && (
                    <Badge className="absolute top-2 right-2 text-xs z-10" variant="default">
                      Current
                    </Badge>
                  )}
                  <GenericThumb dark={dark} />
                  <div className="mt-3 text-sm font-medium">{variant.label}</div>
                  {variant.blurb && (
                    <div className="mt-1 text-xs text-muted-foreground leading-snug">{variant.blurb}</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

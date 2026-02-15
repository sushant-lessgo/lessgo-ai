// app/edit/[token]/components/ui/ElementToggleModal.tsx - Toggle section elements on/off
"use client";

import { useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useEditStoreLegacy as useEditStore } from '@/hooks/useEditStoreLegacy';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import {
  getSectionElementRequirements,
  mapStoreToVariables,
} from '@/modules/sections/elementDetermination';

interface ElementToggleModalProps {
  sectionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatElementLabel = (name: string): string =>
  name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export function ElementToggleModal({
  sectionId,
  open,
  onOpenChange,
}: ElementToggleModalProps) {
  const {
    content,
    sections,
    sectionLayouts,
    setSection,
  } = useEditStore();
  const onboardingStore = useOnboardingStore();

  const sectionData = content[sectionId];
  const layoutType = sectionData?.layout;

  // Get all possible elements for this section
  const allElements = useMemo(() => {
    if (!layoutType) return [];

    try {
      const variables = mapStoreToVariables(onboardingStore, {
        layout: { sections, sectionLayouts },
        meta: {
          onboardingData: {
            oneLiner: onboardingStore.oneLiner,
            validatedFields: onboardingStore.validatedFields,
            featuresFromAI: onboardingStore.featuresFromAI,
          },
        },
      });

      const requirements = getSectionElementRequirements(sectionId, layoutType, variables);
      // Filter out card sub-elements (dot-separated like highlights.title) —
      // card-level delete is a separate feature via hover crosses
      return requirements.allElements.filter(el => !el.includes('.'));
    } catch {
      return [];
    }
  }, [sectionId, layoutType, sections, sectionLayouts, onboardingStore]);

  // Determine if each element is currently ON (not in excludedElements)
  const isElementOn = useCallback(
    (elementName: string): boolean => {
      const elements = sectionData?.elements || {};
      const meta = sectionData?.aiMetadata;
      const excluded = Array.isArray(meta?.excludedElements) ? meta.excludedElements : [];
      return (elementName in elements) && !excluded.includes(elementName);
    },
    [sectionData]
  );

  const handleToggle = useCallback(
    (elementName: string, checked: boolean) => {
      const meta = sectionData?.aiMetadata || {};
      const currentExcluded = Array.isArray(meta.excludedElements) ? meta.excludedElements : [];

      if (checked) {
        // Turn ON — remove from excludedElements
        const excluded = currentExcluded.filter((e: string) => e !== elementName);
        setSection(sectionId, { aiMetadata: { ...meta, excludedElements: excluded } });
      } else {
        // Turn OFF — add to excludedElements
        if (!currentExcluded.includes(elementName)) {
          const excluded = [...currentExcluded, elementName];
          setSection(sectionId, { aiMetadata: { ...meta, excludedElements: excluded } });
        }
      }
    },
    [sectionId, sectionData, setSection]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Section Elements</DialogTitle>
        </DialogHeader>

        <div className="space-y-1 mt-1">
          {allElements.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              No configurable elements for this section.
            </p>
          ) : (
            allElements.map(el => (
              <div
                key={el}
                className="flex items-center justify-between py-2 px-1"
              >
                <span className="text-sm text-gray-700">{formatElementLabel(el)}</span>
                <Switch
                  checked={isElementOn(el)}
                  onCheckedChange={(checked) => handleToggle(el, checked)}
                />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

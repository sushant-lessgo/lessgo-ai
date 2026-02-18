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
import { layoutElementSchema, isV2Schema } from '@/modules/sections/layoutElementSchema';

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
    updateElementContent,
  } = useEditStore();
  const onboardingStore = useOnboardingStore();

  const sectionData = content[sectionId];
  const layoutType = sectionData?.layout;

  // Get all possible elements and mandatory set for this section
  const { allElements, mandatorySet } = useMemo(() => {
    if (!layoutType) return { allElements: [], mandatorySet: new Set<string>() };

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

      // Get grouped elements to hide from modal (controlled by parent toggle)
      const groupedElements = new Set<string>();
      const schema = layoutElementSchema[layoutType];
      if (schema && isV2Schema(schema)) {
        for (const [key, def] of Object.entries(schema.elements)) {
          if (def.toggleGroup) groupedElements.add(key);
        }
        if (schema.collections) {
          for (const [key, col] of Object.entries(schema.collections)) {
            if (col.toggleGroup) groupedElements.add(key);
          }
        }
      }

      return {
        allElements: requirements.allElements
          .filter(el => !el.includes('.'))
          .filter(el => !groupedElements.has(el)),
        mandatorySet: new Set(requirements.mandatoryElements),
      };
    } catch {
      return { allElements: [], mandatorySet: new Set<string>() };
    }
  }, [sectionId, layoutType, sections, sectionLayouts, onboardingStore]);

  // Determine if each element is currently ON
  const isElementOn = useCallback(
    (elementName: string): boolean => {
      // Required elements are always ON
      if (mandatorySet.has(elementName)) return true;

      const elements = sectionData?.elements || {};
      const meta = sectionData?.aiMetadata;
      const excluded = Array.isArray(meta?.excludedElements) ? meta.excludedElements : [];
      return (elementName in elements) && !excluded.includes(elementName);
    },
    [sectionData, mandatorySet]
  );

  const handleToggle = useCallback(
    (elementName: string, checked: boolean) => {
      const meta = sectionData?.aiMetadata || {};
      const currentExcluded = Array.isArray(meta.excludedElements) ? [...meta.excludedElements] : [];
      const schema = layoutElementSchema[layoutType || ''];
      const v2 = schema && isV2Schema(schema) ? schema : null;

      // Collect children if this is a group parent
      const children: string[] = [];
      const childCollections: string[] = [];
      if (v2) {
        for (const [key, def] of Object.entries(v2.elements)) {
          if (def.toggleGroup === elementName) children.push(key);
        }
        if (v2.collections) {
          for (const [key, col] of Object.entries(v2.collections)) {
            if (col.toggleGroup === elementName) childCollections.push(key);
          }
        }
      }

      // Helper: write schema-appropriate default for an element
      const writeDefault = (key: string) => {
        const elements = sectionData?.elements || {};
        if (key in elements) return; // already has content
        const def = v2?.elements[key];
        if (def?.type === 'boolean') {
          updateElementContent(sectionId, key, def.default ?? true);
        } else {
          updateElementContent(sectionId, key, def?.default || formatElementLabel(key));
        }
      };

      if (checked) {
        // Turn ON — remove parent + all children from excludedElements
        const toRemove = new Set([elementName, ...children, ...childCollections]);
        const excluded = currentExcluded.filter(e => !toRemove.has(e));
        setSection(sectionId, { aiMetadata: { ...meta, excludedElements: excluded } });

        // Write defaults for parent
        writeDefault(elementName);

        // Write defaults for children
        for (const child of children) writeDefault(child);

        // Seed collections generically from schema field templates
        const elements = sectionData?.elements || {};
        for (const colName of childCollections) {
          if (!(colName in elements) && v2?.collections?.[colName]) {
            const col = v2.collections[colName];
            const seedCount = col.constraints.min || 4;
            const seedItems = Array.from({ length: seedCount }, (_, i) => {
              const item: Record<string, any> = { id: `${colName}-${Date.now()}-${i}` };
              for (const [field, fieldDef] of Object.entries(col.fields)) {
                if (fieldDef.fillMode !== 'system') item[field] = fieldDef.default || '';
              }
              return item;
            });
            updateElementContent(sectionId, colName, seedItems as any);
          }
        }
      } else {
        // Turn OFF — add parent + all children to excludedElements
        const toExclude = [elementName, ...children, ...childCollections];
        for (const key of toExclude) {
          if (!currentExcluded.includes(key)) currentExcluded.push(key);
        }
        setSection(sectionId, { aiMetadata: { ...meta, excludedElements: currentExcluded } });
      }
    },
    [sectionId, sectionData, setSection, updateElementContent, layoutType]
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
                  disabled={mandatorySet.has(el)}
                />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

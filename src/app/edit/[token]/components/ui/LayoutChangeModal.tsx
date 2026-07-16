"use client";

import React from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { LayoutChangeSelector } from './LayoutChangeSelector';
import { BlockVariantSelector, getVariantSetForLayout } from './BlockVariantSelector';
import { builtVariantCount } from '@/modules/templates/blockManifest';
import type { EditableElement } from '@/types/core';
import { usesTemplateModule } from '@/types/service';

export function LayoutChangeModal() {
  const { store } = useEditStoreContext();
  
  // Use useStoreState without passing store as first parameter
  const layoutChangeModal = useStoreState(state => state.layoutChangeModal);
  const executeUndoableAction = useStoreState(state => state.executeUndoableAction);
  const updateSectionLayout = useStoreState(state => state.updateSectionLayout);
  const setSection = useStoreState(state => state.setSection);
  const hideLayoutChangeModal = useStoreState(state => state.hideLayoutChangeModal);
  const audienceType = useStoreState(state => state.audienceType);
  const templateId = useStoreState(state => state.templateId);
  // Authoritative current layout for the open section — content[sectionId].layout
  // is what the renderers and getSchemaDefaults read (not the modal snapshot).
  const currentContentLayout = useStoreState(state =>
    state.layoutChangeModal.sectionId
      ? state.content[state.layoutChangeModal.sectionId]?.layout
      : undefined
  );
  // Full section content for the variant selector (asset facts + card-count clamp).
  const currentSectionContent = useStoreState(state =>
    state.layoutChangeModal.sectionId
      ? state.content[state.layoutChangeModal.sectionId]
      : undefined
  );

  const handleLayoutChange = (layoutId: string, migratedData: Record<string, EditableElement>) => {
    if (!layoutChangeModal.sectionId) return;

    // Use the store actions
    executeUndoableAction(
      'sectionSwap',
      `Changed layout to ${layoutId}`,
      () => {
        // Update the layout (skipHistory: the outer sectionSwap owns the single undo entry)
        updateSectionLayout(layoutChangeModal.sectionId!, layoutId, { skipHistory: true });

        // Update the section content with migrated data
        setSection(layoutChangeModal.sectionId!, { elements: migratedData });
      }
    );

    // Hide the modal
    hideLayoutChangeModal();
  };

  if (!layoutChangeModal.visible || !layoutChangeModal.sectionId) {
    return null;
  }

  // Template-backed projects use a fixed 1-block-per-section library — no legacy
  // layout-swap UI. EXCEPTION: sections whose template manifest declares MORE
  // THAN ONE copy-compatible block (variant) get the generic, manifest-driven
  // BlockVariantSelector (scale-09). We resolve the owning section set from the
  // section's ACTUAL stored layout name (not sectionType, which is unreliable —
  // SectionToolbar's getSectionTypeFromLayout() defaults unknown template-module
  // layouts to 'hero'). Vestria hero (2 hero variants) + surge testimonials (2
  // testimonials variants) both flow through this same path; single-variant
  // sections (meridian/hearth defaults, lex/lumen/techpremium name-map fallbacks)
  // resolve to null → no swap UI, unchanged behavior.
  if (usesTemplateModule(audienceType, templateId)) {
    const effectiveLayout = currentContentLayout ?? layoutChangeModal.currentLayout;
    const found = getVariantSetForLayout(templateId, effectiveLayout);

    // Count BUILT (non-slot) variants — a declared-but-not-built SLOT must never
    // open a dead 1-block swap modal (work-skeleton phase 1).
    if (!found || builtVariantCount(found.set) <= 1 || !effectiveLayout) {
      return null;
    }

    return (
      <BlockVariantSelector
        isOpen={layoutChangeModal.visible}
        sectionId={layoutChangeModal.sectionId}
        sectionType={found.sectionType}
        templateId={templateId}
        currentLayout={effectiveLayout}
        sectionContent={currentSectionContent}
        set={found.set}
        onClose={() => hideLayoutChangeModal()}
        updateSectionLayout={updateSectionLayout}
        setSection={setSection}
        executeUndoableAction={executeUndoableAction}
      />
    );
  }

  return (
    <LayoutChangeSelector
      isOpen={layoutChangeModal.visible}
      onClose={() => hideLayoutChangeModal()}
      sectionType={layoutChangeModal.sectionType!}
      currentLayout={layoutChangeModal.currentLayout!}
      currentData={layoutChangeModal.currentData!}
      onLayoutChange={handleLayoutChange}
    />
  );
}
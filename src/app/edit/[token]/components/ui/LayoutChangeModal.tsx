"use client";

import React from 'react';
import { useEditStoreContext, useStoreState } from '@/components/EditProvider';
import { LayoutChangeSelector } from './LayoutChangeSelector';
import { VestriaHeroVariantSelector, VESTRIA_HERO_LAYOUTS } from './VestriaHeroVariantSelector';
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

  const handleLayoutChange = (layoutId: string, migratedData: Record<string, EditableElement>) => {
    if (!layoutChangeModal.sectionId) return;

    // Use the store actions
    executeUndoableAction(
      'section-layout-update' as any,
      `Changed layout to ${layoutId}`,
      () => {
        // Update the layout
        updateSectionLayout(layoutChangeModal.sectionId!, layoutId);
        
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

  // Template-backed projects use a fixed 1-block-per-section library — no
  // layout-swap UI, with ONE exception: the vestria hero, which has two
  // variants (tailored image / full-bleed video) sharing the same copy keys.
  // That case gets a bespoke 2-card selector — NOT the legacy
  // LayoutChangeSelector (built for the legacy layout library).
  // NOTE: SectionToolbar's getSectionTypeFromLayout() defaults unknown
  // (template-module) layouts to 'hero', so sectionType alone is unreliable
  // here — we ALSO require the section's current layout to be one of the two
  // vestria hero layouts. Every other template module (surge/hearth/lex/
  // lumen/meridian/techpremium) and every non-hero vestria section stays null.
  if (usesTemplateModule(audienceType, templateId)) {
    const effectiveLayout = currentContentLayout ?? layoutChangeModal.currentLayout;
    const isVestriaHero =
      templateId === 'vestria' &&
      layoutChangeModal.sectionType === 'hero' &&
      !!effectiveLayout &&
      VESTRIA_HERO_LAYOUTS.includes(effectiveLayout);

    if (!isVestriaHero) {
      return null;
    }

    return (
      <VestriaHeroVariantSelector
        isOpen={layoutChangeModal.visible}
        currentLayout={effectiveLayout!}
        onClose={() => hideLayoutChangeModal()}
        onSelect={(layoutId) => {
          // Content-preserving swap: updateSectionLayout writes BOTH
          // content[sectionId].layout and sectionLayouts[sectionId], marks
          // dirty (autosave) and pushes undo history. No setSection call —
          // element content (incl. uploaded hero_video_* URLs) is untouched.
          if (layoutChangeModal.sectionId && layoutId !== effectiveLayout) {
            updateSectionLayout(layoutChangeModal.sectionId, layoutId);
          }
          hideLayoutChangeModal();
        }}
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
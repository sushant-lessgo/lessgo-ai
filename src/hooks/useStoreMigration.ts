// hooks/useStoreMigration.ts - One-time migration from PageStore to EditStore
import { useCallback } from 'react';
import { usePageStore } from './usePageStore';
import { useEditStore } from './useEditStore';

export const useStoreMigration = () => {
  const pageStore = usePageStore();
  const editStore = useEditStore();

  const migrateToEditStore = useCallback(async (tokenId: string) => {
    try {
      console.log('🔄 Starting migration from PageStore to EditStore...');
      
      // PageStore is already the store state, not the store instance
      const pageStoreState = pageStore;
      
      // Check if PageStore has data
      if (!pageStoreState.layout?.sections || pageStoreState.layout.sections.length === 0) {
        throw new Error('No page data found in PageStore to migrate');
      }

      console.log('📦 PageStore data to migrate:', {
        sections: pageStoreState.layout.sections.length,
        content: Object.keys(pageStoreState.content || {}).length,
        theme: !!pageStoreState.layout.theme,
      });

      // Prepare migration data structure
      const migrationData = {
        finalContent: {
          layout: {
            sections: pageStoreState.layout.sections,
            sectionLayouts: pageStoreState.layout.sectionLayouts || {},
            theme: pageStoreState.layout.theme,
            globalSettings: pageStoreState.layout.globalSettings,
          },
          content: pageStoreState.content || {},
          meta: pageStoreState.meta || {},
        },
        tokenId,
        title: pageStoreState.meta?.title || 'Untitled Project',
        inputText: pageStoreState.meta?.onboardingData?.oneLiner || '',
        validatedFields: pageStoreState.meta?.onboardingData?.validatedFields || {},
        featuresFromAI: pageStoreState.meta?.onboardingData?.featuresFromAI || [],
        hiddenInferredFields: {}, // Will be populated if available
        lastUpdated: Date.now(),
      };

      // Extract section layouts from PageStore state
      if (pageStoreState.layout.sectionLayouts) {
        migrationData.finalContent.layout.sectionLayouts = pageStoreState.layout.sectionLayouts;
      }

      console.log('📋 Migration data prepared:', {
        hasFinalContent: !!migrationData.finalContent,
        sectionsCount: migrationData.finalContent.layout.sections.length,
        contentCount: Object.keys(migrationData.finalContent.content).length,
      });

      // Load data into EditStore
      await editStore.loadFromDraft(migrationData);

      // Update EditStore meta
      editStore.updateMeta({
        tokenId,
        title: migrationData.title,
        lastUpdated: Date.now(),
      });

      console.log('✅ Migration completed successfully');
      
      // Verify migration
      const editData = editStore.export();
      // console.log('🔍 EditStore after migration:', {
      //   sections: editData.sections?.length || 0,
      //   content: Object.keys(editData.content || {}).length,
      //   hasTheme: !!editData.theme,
      // });

      return true;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }, [pageStore, editStore]);

  const checkMigrationNeeded = useCallback(() => {
    const hasPageData = pageStore.layout.sections.length > 0;
    const hasEditData = editStore.sections.length > 0;
    
    return hasPageData && !hasEditData;
  }, [pageStore.layout.sections.length, editStore.sections.length]);

  return {
    migrateToEditStore,
    checkMigrationNeeded,
  };
};
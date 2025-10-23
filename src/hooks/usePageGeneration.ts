import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { storeManager } from '@/stores/storeManager';
import type { EditStoreInstance } from '@/stores/editStore';
import type { AssetAvailability } from '@/types/core/index';
import { getSectionsFromRules } from '@/modules/sections/getSectionsFromRules';
import { generateSectionLayouts } from '@/modules/sections/generateSectionLayouts';
import { getCompleteElementsMap } from '@/modules/sections/elementDetermination';
import { buildFullPrompt } from '@/modules/prompt/buildPrompt';
import { parseAiResponse } from '@/modules/prompt/parseAiResponse';
import { autoSaveDraft } from '@/utils/autoSaveDraft';
import { generateCompleteBackgroundSystem } from '@/modules/Design/background/backgroundIntegration';
import { calculateSectionSpacing } from '@/modules/sections/objectionFlowEngine';
import { logger } from '@/lib/logger';
// Progress steps for UX - Customer psychology focused
const PROGRESS_STEPS = [
  { id: 1, label: "Getting into your customer's mind...", duration: 800 },
  { id: 2, label: "Uncovering their pains, desires, and hidden objections...", duration: 1000 },
  { id: 3, label: "Selecting sections to guide them from curiosity to conversion...", duration: 1200 },
  { id: 4, label: "Choosing backgrounds and colors to spark emotion...", duration: 2000 },
  { id: 5, label: "Writing persuasive copy for every section...", duration: 2500 },
  { id: 6, label: "Assembling your high-converting landing page...", duration: 1500 },
  { id: 7, label: "Finalizing touches for maximum impact...", duration: 1000 }
];

interface GenerationState {
  isGenerating: boolean;
  isNavigating: boolean;
  currentStep: number;
  currentLabel: string;
  wireframeVisible: boolean;
  sectionsGenerated: string[];
  layoutsVisible: boolean;
  copyStreaming: boolean;
  error: string | null;
  warnings: string[];
}

interface GenerationResult {
  success: boolean;
  sections: string[];
  sectionLayouts: Record<string, string>;
  generatedContent?: any;
  errors: string[];
  warnings: string[];
  isPartial: boolean;
}

export function usePageGeneration(tokenId: string) {
  const router = useRouter();
  const onboardingStore = useOnboardingStore();
  
  // Get token-scoped store instance
  const getEditStore = (): EditStoreInstance => {
    if (!tokenId) {
      throw new Error('Token ID is required for page generation');
    }
    return storeManager.getEditStore(tokenId);
  };
  
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
    isNavigating: false,
    currentStep: 0,
    currentLabel: '',
    wireframeVisible: false,
    sectionsGenerated: [],
    layoutsVisible: false,
    copyStreaming: false,
    error: null,
    warnings: []
  });

  // Step 1: Analyze business and generate sections
  const generateSections = async (directAssetAvailability?: AssetAvailability | null): Promise<{ sections: string[], errors: string[] }> => {
    try {
      const { validatedFields, hiddenInferredFields, featuresFromAI } = onboardingStore;

      // Use direct parameter if provided, otherwise read from store
      // This fixes timing issues where store update hasn't propagated yet
      const assetAvailability = directAssetAvailability !== undefined
        ? directAssetAvailability
        : useOnboardingStore.getState().assetAvailability;

      // console.log('🎨 [ASSET-DEBUG] generateSections - Asset availability source:', {
      //   wasPassedDirectly: directAssetAvailability !== undefined,
      //   assetAvailability,
      //   hasAssetAvailability: !!assetAvailability,
      //   assetAvailabilityType: typeof assetAvailability,
      //   assetAvailabilityKeys: assetAvailability ? Object.keys(assetAvailability) : null,
      //   testimonials: assetAvailability?.testimonials,
      //   customerLogos: assetAvailability?.customerLogos,
      //   integrationLogos: assetAvailability?.integrationLogos
      // });

      // Fix: Filter out undefined values from hiddenInferredFields with proper typing
      const cleanHiddenFields: Record<string, string> = {};
      Object.entries(hiddenInferredFields).forEach(([key, value]) => {
        if (value !== undefined && typeof value === 'string') {
          cleanHiddenFields[key] = value;
        }
      });

      // console.log('🎨 [ASSET-DEBUG] Calling getSectionsFromRules with assetAvailability:', assetAvailability);

      const sections = getSectionsFromRules({
        validatedFields,
        hiddenInferredFields: cleanHiddenFields,
        featuresFromAI,
        assetAvailability,  // Sprint 7: Pass asset availability for section exclusions
      });

      // console.log('🎨 [ASSET-DEBUG] getSectionsFromRules returned sections:', {
      //   sections,
      //   sectionCount: sections.length,
      //   hasTestimonials: sections.includes('testimonials'),
      //   hasSocialProof: sections.includes('socialProof'),
      //   hasIntegrations: sections.includes('integrations')
      // });

      if (!sections || sections.length === 0) {
        throw new Error('No sections could be generated from your business data');
      }

      // Ensure required sections are present
      const requiredSections = ['hero', 'cta'];
      const missingSections = requiredSections.filter(section => !sections.includes(section));
      
      if (missingSections.length > 0) {
        logger.warn('Adding missing required sections:', missingSections);
        sections.unshift(...missingSections);
      }

      return { sections, errors: [] };
    } catch (error) {
      logger.error('Section generation failed:', error);
      return { 
        sections: ['hero', 'features', 'testimonials', 'cta'], // Fallback sections
        errors: [`Section generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  };

  const generateThemeAndBackgrounds = async (sections: string[]): Promise<{ 
  backgroundSystem: any, 
  errors: string[] 
}> => {
  try {
    logger.debug('🎨 [GENERATE-DEBUG] Starting background generation for sections:', sections);
    
    // Prepare onboarding data for background generation
    const onboardingInput = {
      // Required InputVariables fields with defaults
      marketCategory: (onboardingStore.validatedFields.marketCategory || 'Business Productivity Tools') as any,
      marketSubcategory: onboardingStore.validatedFields.marketSubcategory || 'Project & Task Management',
      targetAudience: onboardingStore.validatedFields.targetAudience || 'early-stage-founders',
      keyProblem: onboardingStore.validatedFields.keyProblem || '',
      startupStage: onboardingStore.validatedFields.startupStage || 'mvp-development',
      landingPageGoals: onboardingStore.validatedFields.landingPageGoals || 'signup',
      pricingModel: onboardingStore.validatedFields.pricingModel || 'freemium',

      // Optional HiddenInferredFields (spread as-is since they're optional)
      ...onboardingStore.hiddenInferredFields
    };
    
    logger.debug(() => '🎨 [GENERATE-DEBUG] Onboarding input for background generation:', () => ({
      validatedFields: onboardingStore.validatedFields,
      hiddenInferredFields: onboardingStore.hiddenInferredFields,
      processedInput: onboardingInput
    }));
    
    const backgroundSystem = generateCompleteBackgroundSystem(onboardingInput);
    
    logger.debug(() => '🎨 [GENERATE-DEBUG] Generated background system:', () => ({
      primary: backgroundSystem.primary,
      secondary: backgroundSystem.secondary,
      neutral: backgroundSystem.neutral,
      divider: backgroundSystem.divider,
      baseColor: backgroundSystem.baseColor,
      accentColor: backgroundSystem.accentColor,
      accentCSS: backgroundSystem.accentCSS
    }));

    const editStore = getEditStore();
    const { updateTheme, getColorTokens } = editStore.getState();
    
    // Log theme before update
    const themeBefore = editStore.getState().theme;
    logger.debug(() => '🎨 [GENERATE-DEBUG] Theme before update:', () => ({
      colors: themeBefore?.colors,
      typography: {
        headingFont: themeBefore?.typography?.headingFont,
        bodyFont: themeBefore?.typography?.bodyFont
      }
    }));
    
    // Calculate text colors for each background type
    const calculateTextColors = () => {
      const { getSmartTextColor } = require('@/utils/improvedTextColors');
      
      const calculateForBackground = (bg: string) => ({
        heading: getSmartTextColor(bg, 'heading'),
        body: getSmartTextColor(bg, 'body'),
        muted: getSmartTextColor(bg, 'muted')
      });
      
      return {
        primary: calculateForBackground(backgroundSystem.primary),
        secondary: calculateForBackground(backgroundSystem.secondary),
        neutral: calculateForBackground(backgroundSystem.neutral),
        divider: calculateForBackground(backgroundSystem.divider),
      };
    };
    
    const textColors = calculateTextColors();
    logger.debug('🎨 [GENERATE-DEBUG] Calculated text colors:', textColors);
    
    updateTheme({
      colors: {
        baseColor: backgroundSystem.baseColor,
        accentColor: backgroundSystem.accentColor,
        accentCSS: backgroundSystem.accentCSS,
        sectionBackgrounds: {
          primary: backgroundSystem.primary,
          secondary: backgroundSystem.secondary,
          neutral: backgroundSystem.neutral,
          divider: backgroundSystem.divider,
        },
        textColors // Store calculated text colors
      } as any
    });
    
    // Log theme after update
    const themeAfter = editStore.getState().theme;
    logger.debug(() => '🎨 [GENERATE-DEBUG] Theme after update:', () => ({
      colors: themeAfter?.colors,
      typography: {
        headingFont: themeAfter?.typography?.headingFont,
        bodyFont: themeAfter?.typography?.bodyFont
      }
    }));
    
    // Log color tokens
    try {
      const colorTokens = getColorTokens();
      logger.debug('🎨 [GENERATE-DEBUG] Generated color tokens:', colorTokens);
    } catch (error) {
      logger.warn('🎨 [GENERATE-DEBUG] Failed to generate color tokens:', error);
    }

    return { backgroundSystem, errors: [] };
  } catch (error) {
    logger.error('Theme generation failed:', error);
    return { 
      backgroundSystem: null, 
      errors: [`Theme generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

  // Step 2: Generate layouts for each section
  const generateLayouts = async (sections: string[]): Promise<{ layouts: Record<string, string>, errors: string[] }> => {
    try {
      const editStore = getEditStore();
      
      // This function updates the editStore directly
      generateSectionLayouts(sections, editStore);
      
      // Get fresh state after layout generation
      const { sectionLayouts } = editStore.getState();
      
      logger.debug(() => '🎯 Layout generation complete:', () => ({
        sections,
        sectionLayouts,
        layoutKeys: Object.keys(sectionLayouts),
        heroLayout: sectionLayouts.hero,
        allLayoutAssignments: Object.entries(sectionLayouts).map(([section, layout]) => `${section}: ${layout}`)
      }));
      
      // Validate that all sections have layouts
      const missingLayouts = sections.filter(sectionId => !sectionLayouts[sectionId]);
      const errors: string[] = [];
      
      if (missingLayouts.length > 0) {
        errors.push(`Some sections missing layouts: ${missingLayouts.join(', ')}`);
        logger.warn('Sections missing layouts:', missingLayouts);
      }

      return { layouts: sectionLayouts, errors };
    } catch (error) {
      logger.error('Layout generation failed:', error);
      
      // Create fallback layouts
      const fallbackLayouts: Record<string, string> = {};
      sections.forEach(sectionId => {
        const fallbackMapping: Record<string, string> = {
          hero: 'leftCopyRightImage',
          features: 'IconGrid',
          testimonials: 'QuoteGrid',
          cta: 'CenteredHeadlineCTA',
          problem: 'StackedPainBullets',
          results: 'StatBlocks',
          pricing: 'TierCards',
          faq: 'AccordionFAQ'
        };
        fallbackLayouts[sectionId] = fallbackMapping[sectionId] || 'default';
      });
      
      return { 
        layouts: fallbackLayouts, 
        errors: [`Layout generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  };

  // Step 3: Generate AI copy
  const generateCopy = async (sections: string[], layouts: Record<string, string>): Promise<{
    content: any,
    errors: string[],
    warnings: string[],
    isPartial: boolean
  }> => {
    try {
      // Extract layout requirements for card count strategy
      const { getLayoutRequirements } = await import('@/modules/sections/getLayoutRequirements');
      const layoutRequirements = getLayoutRequirements(
        sections,
        layouts,
        onboardingStore.featuresFromAI?.length || 0
      );

      logger.debug('📋 Layout requirements extracted:', {
        sectionsWithRequirements: layoutRequirements.sections.length,
        userFeatures: layoutRequirements.userProvidedFeatures
      });

      // Prepare page store with sections and layouts
      const tempPageStore = {
        layout: {
          sections,
          sectionLayouts: layouts
        },
        meta: {
          onboardingData: {
            oneLiner: onboardingStore.oneLiner,
            validatedFields: onboardingStore.validatedFields,
            featuresFromAI: onboardingStore.featuresFromAI,
            targetAudience: onboardingStore.validatedFields.targetAudience,
            businessType: onboardingStore.validatedFields.marketCategory
          }
        },
        content: {}
      };

      // Use 2-phase strategic generation
      logger.debug(() => '🧠 Starting 2-phase strategic copy generation:', () => ({
        sections: tempPageStore.layout.sections,
        layouts: tempPageStore.layout.sectionLayouts,
        featuresCount: onboardingStore.featuresFromAI?.length || 0,
        oneLiner: onboardingStore.oneLiner,
        layoutRequirements: layoutRequirements.sections.map(s => `${s.layoutName}: ${s.cardRequirements?.min}-${s.cardRequirements?.max} ${s.cardRequirements?.type}`)
      }));

      // Call AI API with 2-phase approach
      logger.debug('🌐 Making API call to /api/generate-landing (2-phase)');
      const response = await fetch('/api/generate-landing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenId}`
        },
        body: JSON.stringify({
          onboardingStore,
          pageStore: tempPageStore,
          layoutRequirements, // Pass layout requirements to API
          use2Phase: true
        })
      });

      logger.debug('📡 API Response status:', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('❌ API Error response:', errorText);
        throw new Error(`AI API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      logger.debug('🌐 API Response received:', {
        success: result.success,
        hasContent: !!result.content,
        contentKeys: result.content ? Object.keys(result.content) : [],
        errors: result.errors,
        warnings: result.warnings,
        isPartial: result.isPartial,
        rawResult: result
      });
      
      // Filter content to only include requested sections
      const filteredContent: any = {};
      if (result.content) {
        sections.forEach(sectionId => {
          if (result.content[sectionId]) {
            filteredContent[sectionId] = result.content[sectionId];
          }
        });
      }
      
      logger.debug('🎯 Content filtering:', {
        requestedSections: sections,
        receivedSections: Object.keys(result.content || {}),
        filteredSections: Object.keys(filteredContent),
        filteredCount: Object.keys(filteredContent).length
      });
      
      return {
        content: filteredContent,
        errors: result.errors || [],
        warnings: result.warnings || [],
        isPartial: result.isPartial || false
      };

    } catch (error) {
      logger.error('AI copy generation failed:', error);
      
      // Generate minimal fallback content
      const fallbackContent: any = {};
      sections.forEach(sectionId => {
        fallbackContent[sectionId] = {
          headline: `Welcome to ${onboardingStore.validatedFields.marketCategory || 'Your Business'}`,
          subheadline: 'Transform your business with our innovative solution',
          cta_text: 'Get Started',
          description: 'Discover how our platform can help you achieve your goals.'
        };
      });

      return {
        content: fallbackContent,
        errors: [`AI generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: ['Using template content. You can customize everything in edit mode.'],
        isPartial: true
      };
    }
  };

  // Step 4: Transfer data to page store - FIXED VERSION
  const transferDataToPageStore = async (result: GenerationResult) => {
    try {
      const editStore = getEditStore();
      const storeState = editStore.getState();
      
      logger.debug('Transferring data to token-scoped store:', { tokenId, result });

      // CRITICAL FIX: Use proper initialization for first-time setup
      logger.debug('🏗️ Initializing sections in EditStore:', {
        sections: result.sections,
        layouts: result.sectionLayouts,
        heroLayoutFromResult: result.sectionLayouts.hero,
        layoutEntries: Object.entries(result.sectionLayouts).map(([section, layout]) => `${section}: ${layout}`)
      });
      
      // Use initializeSections for fresh setup instead of reorderSections
      storeState.initializeSections(result.sections, result.sectionLayouts);

      // Calculate and apply smart spacing for sections
      const sectionSpacing = calculateSectionSpacing(result.sections);
      
      // Update store with spacing information
      editStore.setState({ sectionSpacing });

      // Update meta data - Create proper meta object
      const metaData = {
        id: tokenId,
        title: `${onboardingStore.validatedFields.marketCategory || 'Landing'} Page`,
        slug: tokenId,
        description: onboardingStore.oneLiner,
        lastUpdated: Date.now(),
        version: 1,
        onboardingData: {
          oneLiner: onboardingStore.oneLiner,
          validatedFields: onboardingStore.validatedFields,
          featuresFromAI: onboardingStore.featuresFromAI,
          targetAudience: onboardingStore.validatedFields.targetAudience || '',
          businessType: onboardingStore.validatedFields.marketCategory || ''
        }
      };
      
      // Set AI generation status
      storeState.setAIGenerationStatus({
        isGenerating: false,
        warnings: result.warnings,
        errors: result.errors,
        lastGenerated: Date.now()
      } as any);

      // CRITICAL: Update content using the store's updateFromAIResponse method
      if (result.generatedContent) {
        logger.debug('🤖 Updating store with AI content:', {
          contentKeys: Object.keys(result.generatedContent),
          sampleContent: Object.entries(result.generatedContent).slice(0, 2),
          success: result.success,
          isPartial: result.isPartial
        });

        storeState.updateFromAIResponse({
          success: result.success,
          content: result.generatedContent,
          isPartial: result.isPartial,
          warnings: result.warnings,
          errors: result.errors
        });
      } else {
        logger.warn('⚠️ No generated content found in result:', result);
      }

      // Debug: Verify store state after updates
      const storeAfterUpdate = storeState.export();
      logger.debug('Store state after transfer:', {
        tokenId,
        sections: storeState.sections.length,
        content: Object.keys(storeState.content).length,
        hasData: storeState.sections.length > 0,
        fullStore: storeAfterUpdate
      });

      // Auto-save the draft (Fixed: removed pageData parameter)
      // Auto-save the draft with complete onboarding data
      await autoSaveDraft({
        tokenId,
        inputText: onboardingStore.oneLiner,
        stepIndex: 999, // Special value indicating generation complete
        validatedFields: onboardingStore.validatedFields,
        featuresFromAI: onboardingStore.featuresFromAI,
        hiddenInferredFields: onboardingStore.hiddenInferredFields,
        includePageData: true,  // ✅ NEW: Save the complete page state
      });

    } catch (error) {
      logger.error('Data transfer failed:', error);
      throw new Error(`Failed to prepare page data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Main generation function with animation
  const handleGeneratePage = async (directAssetAvailability?: AssetAvailability | null) => {
    logger.debug('🚀 [GENERATE-DEBUG] handleGeneratePage called!', {
      tokenId,
      timestamp: new Date().toISOString(),
      directAssetAvailability,
      hasDirectAssetAvailability: directAssetAvailability !== undefined,
      onboardingData: {
        oneLiner: onboardingStore.oneLiner,
        validatedFieldsCount: Object.keys(onboardingStore.validatedFields).length,
        featuresCount: onboardingStore.featuresFromAI.length
      }
    });
    logger.debug('Starting page generation for token:', tokenId);

    setGenerationState(prev => ({
      ...prev,
      isGenerating: true,
      currentStep: 1,
      currentLabel: PROGRESS_STEPS[0].label,
      wireframeVisible: true,
      error: null,
      warnings: []
    }));

    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    try {
      // Step 1: Analyze business (show wireframe)
      await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[0].duration));

      // Step 2: Generate sections
      setGenerationState(prev => ({
        ...prev,
        currentStep: 2,
        currentLabel: PROGRESS_STEPS[1].label
      }));

      const { sections, errors: sectionErrors } = await generateSections(directAssetAvailability);
      allErrors.push(...sectionErrors);
      logger.debug('Generated sections:', sections);
      
      // Show sections appearing in wireframe
      setGenerationState(prev => ({
        ...prev,
        sectionsGenerated: sections
      }));
      
      await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[1].duration));
      
      // Step 3: Generate layouts
      setGenerationState(prev => ({
        ...prev,
        currentStep: 3,
        currentLabel: PROGRESS_STEPS[2].label
      }));
      
      const { layouts, errors: layoutErrors } = await generateLayouts(sections);
      allErrors.push(...layoutErrors);
      logger.debug('Generated layouts:', layouts);
      
      // Show layouts appearing
      setGenerationState(prev => ({
        ...prev,
        layoutsVisible: true
      }));
      
      await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[2].duration));
      
      // Steps 4-6: Generate copy with streaming effect
      for (let i = 3; i < 6; i++) {
        setGenerationState(prev => ({
          ...prev,
          currentStep: i + 1,
          currentLabel: PROGRESS_STEPS[i].label,
          copyStreaming: i === 4 // Show streaming on step 5 (writing copy)
        }));
        
        await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[i].duration));
      }
      
      
    
    logger.debug('🎨 [GENERATE-DEBUG] About to generate theme and backgrounds...');
    const { backgroundSystem, errors: themeErrors } = await generateThemeAndBackgrounds(sections);
    allErrors.push(...themeErrors);
    logger.debug('🎨 [GENERATE-DEBUG] Theme generation complete:', {
      backgroundSystem,
      themeErrors,
      hasErrors: themeErrors.length > 0
    });
    
    // Check if theme was actually applied to store
    const storeAfterTheme = getEditStore().getState();
    logger.debug(() => '🎨 [GENERATE-DEBUG] Store theme after generation:', () => ({
      theme: storeAfterTheme.theme,
      colors: storeAfterTheme.theme?.colors,
      backgrounds: storeAfterTheme.theme?.colors?.sectionBackgrounds
    }));
    
    await new Promise(resolve => setTimeout(resolve, 800)); // Short step

      // Generate all copy at once (but user sees progressive steps)
      const { content, errors: copyErrors, warnings: copyWarnings, isPartial } = await generateCopy(sections, layouts);
      allErrors.push(...copyErrors);
      allWarnings.push(...copyWarnings);
      logger.debug('Generated content:', content);
      
      // Step 7: Finalize
      setGenerationState(prev => ({
        ...prev,
        currentStep: 7,
        currentLabel: PROGRESS_STEPS[6].label,
        copyStreaming: false
      }));
      
      const result: GenerationResult = {
        success: allErrors.length === 0,
        sections,
        sectionLayouts: layouts,
        generatedContent: content,
        errors: allErrors,
        warnings: allWarnings,
        isPartial: isPartial || allErrors.length > 0
      };
      
      logger.debug('📊 Final generation result:', {
        success: result.success,
        sectionsCount: result.sections.length,
        sectionsArray: result.sections,
        layoutsCount: Object.keys(result.sectionLayouts).length,
        contentKeys: Object.keys(result.generatedContent || {}),
        errorsCount: result.errors.length,
        isMockMode: process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true"
      });
      
      // Transfer data to page store
      logger.debug('🎨 [GENERATE-DEBUG] About to transfer data to store...');
      await transferDataToPageStore(result);
      logger.debug('🎨 [GENERATE-DEBUG] Data transfer complete');
      
      await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[6].duration));
      
      // Success - keep modal open during navigation
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        isNavigating: true,
        currentStep: 8, // Add a new step for navigation
        currentLabel: 'Almost done... preparing your preview',
        warnings: allWarnings
      }));
      
      // Add debug log right before navigation
      const finalEditStore = getEditStore();
      const finalStoreState = finalEditStore.getState();
      logger.debug('🎨 [GENERATE-DEBUG] Final store state before navigation:', {
        sections: finalStoreState.sections.length,
        content: Object.keys(finalStoreState.content).length,
        hasContent: Object.keys(finalStoreState.content).length > 0,
        theme: finalStoreState.theme,
        backgrounds: finalStoreState.theme?.colors?.sectionBackgrounds,
        baseColor: finalStoreState.theme?.colors?.baseColor
      });
      
      // Navigate to generate
      router.push(`/generate/${tokenId}`);
      
      // Fallback timeout to hide modal after 5 seconds
      setTimeout(() => {
        setGenerationState(prev => ({
          ...prev,
          isNavigating: false,
          currentStep: 0
        }));
      }, 5000);
      
    } catch (error) {
      logger.error('Page generation failed:', error);
      
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        isNavigating: false,
        currentStep: 0,
        error: error instanceof Error ? error.message : 'Generation failed',
        warnings: allWarnings
      }));
      
      // Even on error, try to navigate to generate page with whatever we have
      setTimeout(() => {
        router.push(`/generate/${tokenId}`);
      }, 2000);
    }
  };

  return {
    generationState,
    handleGeneratePage,
    isGenerating: generationState.isGenerating,
    isNavigating: generationState.isNavigating
  };
}
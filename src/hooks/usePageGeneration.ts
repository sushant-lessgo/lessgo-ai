import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore } from '@/hooks/useOnboardingStore';
import { usePageStore } from '@/hooks/usePageStore';
import { getSectionsFromRules } from '@/modules/sections/getSectionsFromRules';
import { generateSectionLayouts } from '@/modules/sections/generateSectionLayouts';
import { getCompleteElementsMap } from '@/modules/sections/elementDetermination';
import { buildFullPrompt } from '@/modules/prompt/buildPrompt';
import { parseAiResponse } from '@/modules/prompt/parseAiResponse';
import { autoSaveDraft } from '@/utils/autoSaveDraft';

// Progress steps for UX
const PROGRESS_STEPS = [
  { id: 1, label: "Analyzing your business...", duration: 800 },
  { id: 2, label: "Selecting optimal sections...", duration: 1000 },
  { id: 3, label: "Choosing layouts...", duration: 1200 },
  { id: 4, label: "Writing your hero section...", duration: 2000 },
  { id: 5, label: "Generating features & benefits...", duration: 2500 },
  { id: 6, label: "Adding testimonials & proof...", duration: 2000 },
  { id: 7, label: "Finalizing your page...", duration: 1500 }
];

interface GenerationState {
  isGenerating: boolean;
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
  const pageStore = usePageStore();
  
  const [generationState, setGenerationState] = useState<GenerationState>({
    isGenerating: false,
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
  const generateSections = async (): Promise<{ sections: string[], errors: string[] }> => {
    try {
      const { validatedFields, hiddenInferredFields, featuresFromAI } = onboardingStore;
      
      // Fix: Filter out undefined values from hiddenInferredFields with proper typing
      const cleanHiddenFields: Record<string, string> = {};
      Object.entries(hiddenInferredFields).forEach(([key, value]) => {
        if (value !== undefined && typeof value === 'string') {
          cleanHiddenFields[key] = value;
        }
      });
      
      const sections = getSectionsFromRules({
        validatedFields,
        hiddenInferredFields: cleanHiddenFields,
        featuresFromAI
      });

      if (!sections || sections.length === 0) {
        throw new Error('No sections could be generated from your business data');
      }

      // Ensure required sections are present
      const requiredSections = ['hero', 'cta'];
      const missingSections = requiredSections.filter(section => !sections.includes(section));
      
      if (missingSections.length > 0) {
        console.warn('Adding missing required sections:', missingSections);
        sections.unshift(...missingSections);
      }

      return { sections, errors: [] };
    } catch (error) {
      console.error('Section generation failed:', error);
      return { 
        sections: ['hero', 'features', 'testimonials', 'cta'], // Fallback sections
        errors: [`Section generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  };

  // Step 2: Generate layouts for each section
  const generateLayouts = async (sections: string[]): Promise<{ layouts: Record<string, string>, errors: string[] }> => {
    try {
      // This function updates the pageStore directly
      generateSectionLayouts(sections);
      
      const { sectionLayouts } = pageStore.layout;
      
      // Validate that all sections have layouts
      const missingLayouts = sections.filter(sectionId => !sectionLayouts[sectionId]);
      const errors: string[] = [];
      
      if (missingLayouts.length > 0) {
        errors.push(`Some sections missing layouts: ${missingLayouts.join(', ')}`);
        console.warn('Sections missing layouts:', missingLayouts);
      }

      return { layouts: sectionLayouts, errors };
    } catch (error) {
      console.error('Layout generation failed:', error);
      
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

      // Build the prompt
      const prompt = buildFullPrompt(onboardingStore, tempPageStore as any);
      
      // Call AI API
      const response = await fetch('/api/generate-copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenId}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(`AI API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        content: result.content || {},
        errors: result.errors || [],
        warnings: result.warnings || [],
        isPartial: result.isPartial || false
      };

    } catch (error) {
      console.error('AI copy generation failed:', error);
      
      // Generate minimal fallback content
      const fallbackContent: any = {};
      sections.forEach(sectionId => {
        fallbackContent[sectionId] = {
          headline: `Welcome to ${onboardingStore.validatedFields.businessName || 'Your Business'}`,
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
      console.log('Transferring data to store:', result);

      // CRITICAL FIX: Use store actions instead of direct mutation
      pageStore.reorderSections(result.sections);
      pageStore.setSectionLayouts(result.sectionLayouts);

      // Update meta data - Create proper meta object
      const metaData = {
        id: tokenId,
        title: `${onboardingStore.validatedFields.businessName || 'Landing'} Page`,
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

      // Update meta using proper assignment
      Object.assign(pageStore.meta, metaData);

      // Set AI generation status
      pageStore.setAIGenerationStatus({
        isGenerating: false,
        success: result.success,
        isPartial: result.isPartial,
        warnings: result.warnings,
        errors: result.errors,
        sectionsGenerated: result.sections,
        lastGenerated: Date.now()
      });

      // CRITICAL: Update content using the store's updateFromAIResponse method
      if (result.generatedContent) {
        console.log('Updating store with AI content:', result.generatedContent);
        pageStore.updateFromAIResponse({
          success: result.success,
          content: result.generatedContent,
          isPartial: result.isPartial,
          warnings: result.warnings,
          errors: result.errors
        });
      }

      // Debug: Verify store state after updates
      const storeAfterUpdate = pageStore.export();
      console.log('Store state after transfer:', {
        sections: pageStore.layout.sections.length,
        content: Object.keys(pageStore.content).length,
        hasData: pageStore.layout.sections.length > 0,
        fullStore: storeAfterUpdate
      });

      // Auto-save the draft (Fixed: removed pageData parameter)
      await autoSaveDraft({
        tokenId,
        inputText: onboardingStore.oneLiner,
        confirmedFields: onboardingStore.validatedFields,
      });

    } catch (error) {
      console.error('Data transfer failed:', error);
      throw new Error(`Failed to prepare page data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Main generation function with animation
  const handleGeneratePage = async () => {
    console.log('Starting page generation for token:', tokenId);
    
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
      
      const { sections, errors: sectionErrors } = await generateSections();
      allErrors.push(...sectionErrors);
      console.log('Generated sections:', sections);
      
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
      console.log('Generated layouts:', layouts);
      
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
          copyStreaming: i === 3
        }));
        
        await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[i].duration));
      }
      
      // Generate all copy at once (but user sees progressive steps)
      const { content, errors: copyErrors, warnings: copyWarnings, isPartial } = await generateCopy(sections, layouts);
      allErrors.push(...copyErrors);
      allWarnings.push(...copyWarnings);
      console.log('Generated content:', content);
      
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
      
      // Transfer data to page store
      await transferDataToPageStore(result);
      
      await new Promise(resolve => setTimeout(resolve, PROGRESS_STEPS[6].duration));
      
      // Success - navigate to preview
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        currentStep: 0,
        warnings: allWarnings
      }));
      
      // Add debug log right before navigation
      console.log('About to navigate to preview. Final store state:', {
        sections: pageStore.layout.sections.length,
        content: Object.keys(pageStore.content).length,
        hasContent: Object.keys(pageStore.content).length > 0
      });
      
      // Navigate to preview
      router.push(`/preview/${tokenId}`);
      
    } catch (error) {
      console.error('Page generation failed:', error);
      
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        currentStep: 0,
        error: error instanceof Error ? error.message : 'Generation failed',
        warnings: allWarnings
      }));
      
      // Even on error, try to navigate with whatever we have
      setTimeout(() => {
        router.push(`/preview/${tokenId}`);
      }, 2000);
    }
  };

  return {
    generationState,
    handleGeneratePage,
    isGenerating: generationState.isGenerating
  };
}
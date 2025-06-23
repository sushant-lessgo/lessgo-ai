"use client";
import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import FieldConfirmationCard from "./FieldConfirmationCard";
import InputStep from "./InputStep";
import Logo from "@/components/shared/Logo";
import PageIntro from "@/components/shared/PageIntro";
import { getOptionsForField } from "@/utils/getOptionsForField";
import { autoSaveDraft } from "@/utils/autoSaveDraft";
import { useParams } from "next/navigation";
import FeatureEditor from "./FeatureEditor";
import LoadingButtonBar from "@/components/shared/LoadingButtonBar";
import { Button } from "@/components/ui/button";
import { usePageGeneration } from '@/hooks/usePageGeneration';
import GenerationAnimation from './GenerationAnimation';

// ===== FIELD CONFIGURATION =====
// Internal field names for consistent data structure
const FIELD_ORDER = [
  "marketCategory",
  "marketSubcategory",
  "targetAudience", 
  "keyProblem",
  "startupStage",
  "landingGoal",
  "pricingModel",
] as const;

// Display names for UI
const FIELD_DISPLAY_NAMES: Record<string, string> = {
  marketCategory: "Market Category",
  marketSubcategory: "Market Subcategory",
  targetAudience: "Target Audience",
  keyProblem: "Key Problem Getting Solved",
  startupStage: "Startup Stage", 
  landingGoal: "Landing Page Goals",
  pricingModel: "Pricing Category and Model",
};

// ===== TYPE DEFINITIONS =====
interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

type FeatureItem = {
  feature: string;
  benefit: string;
};

type InternalFieldName = typeof FIELD_ORDER[number];

// ===== COMPONENT =====
export default function RightPanel() {
  const {
    oneLiner,
    setOneLiner,
    confirmedFields, // AI guesses with confidence (internal names as keys)
    validatedFields, // User-confirmed values (internal names as keys)
    setConfirmedFields,
    setValidatedFields,
    confirmField,
    stepIndex,
    setStepIndex,
    featuresFromAI,
    setFeaturesFromAI,
  } = useOnboardingStore();

  const params = useParams();
  const tokenId = params?.token as string;

  // Page generation hook
  const { generationState, handleGeneratePage: generatePage, isGenerating } = usePageGeneration(tokenId);

  const isStep1 = !oneLiner;
  const isFinalStep = stepIndex >= FIELD_ORDER.length;
  
  // ✅ UPDATED: Use internal field names consistently
  const currentInternalField: InternalFieldName | undefined = FIELD_ORDER[stepIndex];
  const currentDisplayField = currentInternalField ? FIELD_DISPLAY_NAMES[currentInternalField] : undefined;
  const currentFieldData = currentInternalField ? confirmedFields[currentInternalField] : undefined;
  
  const aiGuess = currentFieldData?.value || "";
  const confidence = currentFieldData?.confidence || 0;
  const alternatives = currentFieldData?.alternatives || [];
  
  const [showFeatureEditor, setShowFeatureEditor] = useState(false);

  // ✅ UPDATED: Auto-advance logic for high confidence fields
  useEffect(() => {
    if (!currentInternalField || isFinalStep || !currentFieldData) return;

    // Auto-confirm and advance if confidence >= 0.85 and not already validated
    if (currentFieldData.confidence >= 0.85 && !validatedFields[currentInternalField]) {
      console.log(`Auto-confirming ${currentDisplayField} with confidence ${currentFieldData.confidence}`);
      
      // Move from confirmedFields → validatedFields
      confirmField(currentDisplayField!, currentFieldData.value);
      
      // Auto-advance to next field after a brief delay
      setTimeout(() => {
        setStepIndex(stepIndex + 1);
      }, 1500); // Slightly longer delay so user can see what was auto-confirmed
    }
  }, [stepIndex, currentInternalField, currentDisplayField, currentFieldData, confirmField, setStepIndex, isFinalStep, validatedFields]);

  // ✅ UPDATED: Handle user confirmation
  const handleConfirm = async (value: string) => {
    if (!currentInternalField || !currentDisplayField) return;
    
    // Move from confirmedFields → validatedFields  
    confirmField(currentDisplayField, value);
    
    // Auto-advance to next field
    setStepIndex(stepIndex + 1);
    
    // Update auto-save with current validated fields
    const updatedValidatedFields = { ...validatedFields, [currentInternalField]: value };
      await autoSaveDraft({
        tokenId,
        inputText: oneLiner,
        stepIndex: stepIndex + 1, // Save new step index
        validatedFields: updatedValidatedFields, // Use validatedFields, not confirmedFields
      });
  };

  // ✅ UNCHANGED: Handle initial input success - populate confirmedFields only
  const handleInputSuccess = async (input: string, confirmedFieldsData: Record<string, ConfirmedFieldData>) => {
    setOneLiner(input);
    setConfirmedFields(confirmedFieldsData); // Store AI guesses (with internal names as keys)
    setStepIndex(0); // Start field confirmation process
    
    await autoSaveDraft({
      tokenId,
      inputText: input,
      stepIndex: 0,
      confirmedFields: confirmedFieldsData, // Store AI guesses
      validatedFields: {}, // Start with empty validated fields
    });
      };

  // ✅ UPDATED: Market insights API call (using internal field names)
  useEffect(() => {
    const {
      marketCategory: category,
      marketSubcategory: subcategory,
      keyProblem: problem,
      targetAudience: audience,
      startupStage: startupStage,
      pricingModel: pricing,
      landingGoal: goal,
    } = validatedFields;

    if (isFinalStep && featuresFromAI.length === 0) {
      const fetchFeatures = async () => {
        try {
          const res = await fetch("/api/market-insights", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              category,
              subcategory,
              problem,
              audience,
              startupStage,
              pricing,
              goal,
            }),
          });

          if (!res.ok) {
            throw new Error('Failed to fetch features');
          }

          const { features } = await res.json();
          setFeaturesFromAI(features || []);

          setTimeout(() => setShowFeatureEditor(true), 2000);
        } catch (error) {
          console.error('Error fetching features:', error);
          setTimeout(() => setShowFeatureEditor(true), 500);
        }
      };

      fetchFeatures();
    }
  }, [isFinalStep, featuresFromAI.length, validatedFields, setFeaturesFromAI]);

  // Calculate progress including auto-confirmed fields
  const totalFields = FIELD_ORDER.length;
  const completedFields = Object.keys(validatedFields).length;
  const progressPercentage = Math.min((completedFields / totalFields) * 100, 100);

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('RightPanel Debug:', {
      currentInternalField,
      currentDisplayField,
      hasFieldData: !!currentFieldData,
      confirmedFieldsKeys: Object.keys(confirmedFields),
      validatedFieldsKeys: Object.keys(validatedFields),
    });
  }

  return (
    <div className="flex flex-col h-full justify-start md:justify-center items-center text-brand-text px-4 md:px-8 pt-6 pb-12 bg-white">
      <div className="w-full max-w-4xl flex flex-col items-center">
        {/* Step 1: Input */}
        {isStep1 ? (
          <>
            <div className="mb-12">
              <Logo size={240} />
            </div>

            <PageIntro />

            <section className="w-full bg-[#F5F5F5] p-6 md:p-8 rounded-lg shadow-sm mt-4">
              <InputStep onSuccess={handleInputSuccess} />
            </section>
          </>
        ) : (
          // Step 2: Field-by-field confirmation
          <div className="w-full space-y-6">
            <header className="mb-2">
              {isFinalStep ? (
                showFeatureEditor ? null : (
                  <>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                      ✅ All fields confirmed!
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      You've confirmed all inputs. Now we will do detailed market research.
                    </p>
                  </>
                )
              ) : (
                <>
                  <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                    Step 2: Review Lessgo.ai Suggestions
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    We've inferred your input. High-confidence fields are auto-confirmed, review the rest.
                  </p>
                  <div className="mt-4 w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-400 text-right mt-1">
                    Step {Math.min(stepIndex + 2, totalFields + 2)} of {totalFields + 2}
                  </div>
                </>
              )}
            </header>

            <section className="w-full space-y-6">
              {isFinalStep ? (
                showFeatureEditor ? (
                  <>
                    <FeatureEditor
                      initialFeatures={featuresFromAI}
                      onChange={setFeaturesFromAI}
                    />
                    
                    <div className="flex justify-end mt-8">
                      <Button
                        onClick={generatePage}
                        disabled={isGenerating}
                        className={`
                          text-base font-semibold py-3 px-6 rounded-lg shadow transition-all duration-200
                          ${isGenerating 
                            ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                            : 'bg-brand-accentPrimary text-white hover:bg-orange-500 hover:shadow-lg transform hover:scale-105'
                          }
                        `}
                      >
                        {isGenerating ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Generating...</span>
                          </div>
                        ) : (
                          'Generate My Page'
                        )}
                      </Button>
                    </div>

                    {/* Generation Animation */}
                    <GenerationAnimation
                      currentStep={generationState.currentStep}
                      currentLabel={generationState.currentLabel}
                      wireframeVisible={generationState.wireframeVisible}
                      sectionsGenerated={generationState.sectionsGenerated}
                      layoutsVisible={generationState.layoutsVisible}
                      copyStreaming={generationState.copyStreaming}
                      isGenerating={generationState.isGenerating}
                    />

                    {/* Error Display */}
                    {generationState.error && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <h4 className="text-red-800 font-medium">Generation Error</h4>
                            <p className="text-red-600 text-sm mt-1">{generationState.error}</p>
                            <p className="text-red-500 text-xs mt-2">Don't worry! You'll be redirected to edit your page manually.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Warnings Display */}
                    {generationState.warnings.length > 0 && !generationState.isGenerating && (
                      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <div>
                            <h4 className="text-yellow-800 font-medium">Partial Generation</h4>
                            <ul className="text-yellow-700 text-sm mt-1 space-y-1">
                              {generationState.warnings.map((warning, index) => (
                                <li key={index}>• {warning}</li>
                              ))}
                            </ul>
                            <p className="text-yellow-600 text-xs mt-2">Your page was created with some template content. You can edit everything in the next step!</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full mt-4">
                    <p className="text-base text-gray-800 mb-2">
                      Conducting market research and extracting features...
                    </p>
                    
                    <LoadingButtonBar
                      label="🧠 Conducting market research and extracting features..."
                      duration={2000}
                    />
                  </div>
                )
              ) : (
                // ✅ UPDATED: Current field confirmation with confidence-based logic
                currentInternalField && currentDisplayField && (
                  <>
                    {/* Show auto-confirmation message for high confidence */}
                    {confidence >= 0.85 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm">🤖</span>
                          </div>
                          <div>
                            <p className="text-blue-800 font-medium">
                              Auto-confirming {currentDisplayField}: "{aiGuess}"
                            </p>
                            <p className="text-blue-600 text-sm">
                              High confidence ({(confidence * 100).toFixed(0)}%) - advancing automatically
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Show field confirmation card for medium/low confidence */}
                    {confidence < 0.85 && (
                      <FieldConfirmationCard
                        key={stepIndex}  
                        fieldName={currentDisplayField}
                        aiGuess={aiGuess}
                        confidence={confidence}
                        alternatives={alternatives}
                        options={getOptionsForField(currentDisplayField)}
                        onConfirm={handleConfirm}
                      />
                    )}
                  </>
                )
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
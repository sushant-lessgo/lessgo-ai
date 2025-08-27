// /app/create/[token]/components/InputStep.tsx
"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { autoSaveDraft } from "@/utils/autoSaveDraft";
import { useParams } from "next/navigation";
import { DISPLAY_TO_CANONICAL, type CanonicalFieldName } from "@/types/core/index";

import { logger } from '@/lib/logger';
// ===== TYPE DEFINITIONS =====
interface ValidationResult {
  value: string | null;
  confidence: number;
  alternatives?: string[];
}

interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface APIResponse {
  success: boolean;
  data: {
    raw: Record<string, string>;
    validated?: Record<string, ValidationResult>;
  };
  error?: string;
}

interface InputStepProps {
  onSuccess: (input: string, confirmedFields: Record<string, ConfirmedFieldData>) => void;
  onProcessingStart?: () => void;
}

// ===== FIELD MAPPING =====
// ✅ FIXED: Use canonical mappings from types/core/index.ts
const EXPECTED_DISPLAY_FIELDS = Object.keys(DISPLAY_TO_CANONICAL);

// ===== COMPONENT =====
export default function InputStep({ onSuccess, onProcessingStart }: InputStepProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const tokenId = params?.token as string;

  // ===== FORM SUBMISSION =====
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validation
    if (!input.trim()) {
      setError("Please enter your startup idea");
      return;
    }

    if (input.trim().length < 10) {
      setError("Please provide more details about your startup idea");
      return;
    }

    setLoading(true);
    setError(null);
    
    // Notify parent that processing has started
    if (onProcessingStart) {
      onProcessingStart();
    }

    try {
      // Analytics tracking
      posthog.capture('input_submitted', {
        input_length: input.length,
        has_token: !!tokenId,
      });

      // Store input immediately
      const setOneLiner = useOnboardingStore.getState().setOneLiner;
      setOneLiner(input);

     // console.log('🚀 Submitting input:', input.substring(0, 100) + '...');

      // ===== API CALL =====
      const response = await fetch('/api/infer-fields', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          input: input.trim(),
          includeValidation: true
        }),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const apiResult: APIResponse = await response.json();

      // Handle API-level errors
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'API returned success: false');
      }

      logger.debug('✅ API Response received:', {
        hasRaw: !!apiResult.data.raw,
        hasValidated: !!apiResult.data.validated,
        validatedKeys: apiResult.data.validated ? Object.keys(apiResult.data.validated) : []
      });

      // ===== DATA PROCESSING =====
      const confirmedFields: Record<CanonicalFieldName, ConfirmedFieldData> = {} as Record<CanonicalFieldName, ConfirmedFieldData>;
      
      if (apiResult.data.validated) {
        // Validate API response structure
        const receivedFields = Object.keys(apiResult.data.validated);
        const missingFields = EXPECTED_DISPLAY_FIELDS.filter(field => !receivedFields.includes(field));
        const unexpectedFields = receivedFields.filter(field => !EXPECTED_DISPLAY_FIELDS.includes(field));
        
        if (missingFields.length > 0) {
          logger.warn('⚠️ Missing expected fields from API:', missingFields);
        }
        
        if (unexpectedFields.length > 0) {
          logger.warn('⚠️ Unexpected fields from API:', unexpectedFields);
        }

        // ✅ FIXED: Convert display names to canonical names using type-safe mapping
        Object.entries(apiResult.data.validated).forEach(([displayFieldName, validationResult]) => {
          const canonicalFieldName = DISPLAY_TO_CANONICAL[displayFieldName as keyof typeof DISPLAY_TO_CANONICAL];
          
          if (!canonicalFieldName) {
            logger.warn(`⚠️ Unknown field from API: "${displayFieldName}"`);
            return;
          }

          // Only store fields that have values
          if (validationResult.value && validationResult.value.trim()) {
            // Extract only the needed properties, excluding 'field' to avoid React rendering errors
            confirmedFields[canonicalFieldName] = {
              value: validationResult.value.trim(),
              confidence: Math.max(0, Math.min(1, validationResult.confidence || 0)), // Clamp 0-1
              alternatives: validationResult.alternatives?.filter(alt => alt && alt.trim()) || [],
            };

           // console.log(`📝 Stored ${canonicalFieldName}: "${validationResult.value}" (confidence: ${validationResult.confidence})`);
          } else {
            logger.warn(`⚠️ Skipping empty field: ${displayFieldName}`);
          }
        });
      }

      // Validate we got some useful data
      const fieldCount = Object.keys(confirmedFields).length;
      if (fieldCount === 0) {
        throw new Error('No valid fields were extracted from your input. Please try rephrasing your idea.');
      }

     // console.log(`✅ Successfully processed ${fieldCount} fields:`, Object.keys(confirmedFields));

      // ===== AUTO-SAVE =====
      try {
        await autoSaveDraft({
          tokenId,
          inputText: input.trim(),
          stepIndex: 0,
          confirmedFields, // Pass the AI-inferred fields with canonical names
          validatedFields: {}, // Start with empty validated fields
        });
        logger.debug('✅ Auto-save completed');
      } catch (saveError) {
        logger.error('⚠️ Auto-save failed (non-critical):', saveError);
        // Don't block the flow if auto-save fails
      }

      // ===== SUCCESS =====
      // Pass processed data to parent component
      onSuccess(input.trim(), confirmedFields);
      
      // Analytics tracking
      posthog.capture('input_processing_success', {
        fields_extracted: fieldCount,
        avg_confidence: Object.values(confirmedFields).reduce((sum, field) => sum + field.confidence, 0) / fieldCount,
      });

    } catch (err) {
      logger.error('❌ InputStep error:', err);
      
      // User-friendly error messages
      let userErrorMessage = 'Something went wrong while processing your input.';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch')) {
          userErrorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('timeout')) {
          userErrorMessage = 'Request timed out. Please try again.';
        } else if (err.message.includes('No valid fields')) {
          userErrorMessage = err.message; // Use the specific message
        } else if (err.message.includes('API request failed')) {
          userErrorMessage = 'Server error. Please try again in a moment.';
        }
      }
      
      setError(userErrorMessage);
      
      // Analytics tracking
      posthog.capture('input_processing_error', {
        error_message: err instanceof Error ? err.message : 'Unknown error',
        input_length: input.length,
      });
      
    } finally {
      setLoading(false);
    }
  }

  // ===== RENDER =====
  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow-md border border-gray-200"
      noValidate
    >
      <label 
        htmlFor="startup-idea" 
        className="block text-lg font-semibold text-brand-text"
      >
        Step 1 of 2: What's your startup idea?
      </label>

      <div className="relative">
        <textarea
          id="startup-idea"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            // Clear error when user starts typing
            if (error && e.target.value.trim()) {
              setError(null);
            }
          }}
          placeholder="e.g., AI tool for lawyers that reduces contract review time by 75%"
          rows={3}
          maxLength={500}
          className={`
            w-full px-4 py-3 min-h-[96px] bg-transparent text-black caret-black 
            focus:outline-none focus:ring-2 border rounded-md transition-all duration-200
            ${error 
              ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
              : 'border-gray-300 focus:ring-brand-accentPrimary focus:border-brand-accentPrimary'
            }
            ${input.length === 0 ? 'animate-pulse-border' : ''}
          `}
          disabled={loading}
          aria-describedby={error ? "input-error" : "input-help"}
        />
        
        {/* Character counter */}
        <div className="absolute bottom-2 right-3 text-xs text-gray-400">
          {input.length}/500
        </div>
      </div>

      {/* Help text */}
      {!error && (
        <p id="input-help" className="text-sm text-gray-500">
          Describe your startup idea in 1-2 sentences. We'll analyze it and guide you through building your landing page step by step.
        </p>
      )}

      {/* Error message */}
      {error && (
        <div id="input-error" className="flex items-center space-x-2 text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        className={`
          mt-4 w-full md:w-auto px-6 py-3 text-white rounded-md font-medium
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
          ${loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-brand-accentPrimary hover:bg-orange-500 focus:ring-brand-accentPrimary transform hover:scale-105'
          }
        `}
        disabled={loading || !input.trim()}
      >
        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Analyzing...</span>
          </div>
        ) : (
          "Start Building!"
        )}
      </button>

      {/* Development info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-4 text-xs text-gray-400">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
            {JSON.stringify({
              inputLength: input.length,
              hasToken: !!tokenId,
              expectedFields: EXPECTED_DISPLAY_FIELDS,
              canonicalMappings: DISPLAY_TO_CANONICAL,
            }, null, 2)}
          </pre>
        </details>
      )}
    </form>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { getOptionsForField } from "@/utils/getOptionsForField";

type FieldConfirmationCardProps = {
  fieldName: string;
  aiGuess: string;
  confidence: number; // 0-1 confidence score
  alternatives?: string[]; // Top 3 alternatives for low confidence
  options?: readonly string[]; // Full options fallback
  onConfirm: (value: string) => void;
};



// Pricing model grouping with proper typing
const pricingModelGroups: Record<string, string[]> = {
  'Free & Trial Options': [
    'Free Forever', 
    'Freemium (limited features)', 
    'Free Trial', 
    'Paid Trial ($1 or more)'
  ],
  'Standard Subscription': [
    'Flat Monthly Fee', 
    'Tiered Plans (Basic / Pro / Enterprise)'
  ],
  'Usage & Scale Based': [
    'Per Seat Pricing', 
    'Usage-Based Pricing'
  ],
  'Enterprise Sales': [
    'Custom Quote / Talk to Sales'
  ]
};

export default function FieldConfirmationCard({
  fieldName,
  aiGuess,
  confidence,
  alternatives = [],
  options,
  onConfirm,
}: FieldConfirmationCardProps) {
  const [mode, setMode] = useState<"confirm" | "edit" | "show-all">("confirm");
  const [selected, setSelected] = useState(aiGuess);
  const confirmField = useOnboardingStore((s) => s.confirmField);
  const onboardingStore = useOnboardingStore();
  const stepIndex = onboardingStore.stepIndex;
  const setStepIndex = onboardingStore.setStepIndex;


  
useEffect(() => {
  if (!aiGuess || confidence < 0.7) {
    // Low confidence - check if we have alternatives
    if (alternatives.length > 0) {
      setMode("edit"); // Show alternatives
    } else {
      setMode("show-all"); // No alternatives, show all options
    }
  } else {
    setMode("confirm"); // High confidence, show confirm flow
  }
  setSelected(aiGuess || "");
}, [aiGuess, stepIndex, confidence, alternatives.length]);

  const handleConfirmAIGuess = () => {
    onConfirm(aiGuess);
    confirmField(fieldName, aiGuess);
  };

  const handleConfirmSelected = () => {
    onConfirm(selected);
    confirmField(fieldName, selected);
    setMode("confirm");
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  // Get fallback options if not passed
  const fallbackOptions = getOptionsForField(fieldName);
  const availableOptions = options ?? fallbackOptions ?? [];

  // Group options for pricing model
  const isGroupedField = fieldName === "Pricing Category and Model";
  const groupedOptions: Record<string, string[]> = isGroupedField ? pricingModelGroups : {};

  // Confidence-based rendering logic
  const isHighConfidence = confidence >= 0.85;
  const isMediumConfidence = confidence >= 0.7 && confidence < 0.85;
  const isLowConfidence = confidence < 0.7;
console.log(mode, isLowConfidence, alternatives.length);
console.log('FieldConfirmationCard render:', {
  fieldName,
  aiGuess,
  confidence,
  alternatives: alternatives?.length || 0,
  mode,
  isLowConfidence,
  stepIndex
});
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 capitalize">{fieldName}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isHighConfidence ? 'bg-green-100 text-green-700' :
          isMediumConfidence ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {(confidence * 100).toFixed(0)}% confidence
        </span>
      </div>

      {/* HIGH CONFIDENCE: Standard confirm flow */}
      {mode === "confirm" && isMediumConfidence && (
        <>
          <p className="text-base text-gray-800">
            Our AI suggests:&nbsp;
            <span className="font-semibold text-brand-accentPrimary">{aiGuess}</span>
          </p>

          <div className="flex gap-3 mt-2">
            <button
              onClick={handleConfirmAIGuess}
              className="px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition"
            >
              ✅ Confirm
            </button>
            <button
              onClick={() => setMode("edit")}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100 transition"
            >
              ✏️ Edit
            </button>

            {stepIndex > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-100 transition"
              >
                ⬅️ Back
              </button>
            )}
          </div>
        </>
      )}
      


      {/* LOW CONFIDENCE: Show alternatives first */}
      {mode === "edit" && isLowConfidence && alternatives.length > 0 && (
        <>
          <p className="text-sm text-gray-600">
            We found multiple good matches. Choose the best one:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {alternatives.map((alternative) => (
              <button
                key={alternative}
                onClick={() => setSelected(alternative)}
                className={`p-3 border rounded-md text-sm transition text-left ${
                  selected === alternative
                    ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                    : "border-gray-300 hover:border-brand-accentPrimary"
                }`}
              >
                {alternative}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setMode("show-all")}
            className="text-sm text-blue-600 hover:underline"
          >
            Show all {fieldName.toLowerCase()} options ({availableOptions.length})
          </button>

          <button
            onClick={handleConfirmSelected}
            disabled={!selected}
            className="mt-4 w-full px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm {selected ? `"${selected}"` : "Selection"}
          </button>
        </>
      )}

      {/* MEDIUM CONFIDENCE EDIT MODE: Standard options */}
      {mode === "edit" && isMediumConfidence && (
        <>
          <p className="text-sm text-gray-500">Choose the most accurate option:</p>
          
          {isGroupedField ? (
            // Grouped options for pricing model
            <div className="space-y-4">
              {Object.entries(groupedOptions).map(([groupName, items]) => (
                <div key={groupName}>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(items as string[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelected(option)}
                        className={`p-3 border rounded-md text-sm transition text-left ${
                          selected === option
                            ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                            : "border-gray-300 hover:border-brand-accentPrimary"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular grid for other fields
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelected(option)}
                  className={`p-3 border rounded-md text-sm transition text-left ${
                    selected === option
                      ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                      : "border-gray-300 hover:border-brand-accentPrimary"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleConfirmSelected}
            disabled={!selected}
            className="mt-4 w-full px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm {selected ? `"${selected}"` : "Selection"}
          </button>
        </>
      )}

      {/* SHOW ALL OPTIONS (expanded from low confidence) */}
      {mode === "show-all" && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-500">All available options:</p>
            <button
              onClick={() => setMode("edit")}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              ← Back to suggestions
            </button>
          </div>

          {isGroupedField ? (
            // Grouped options for pricing model
            <div className="space-y-4">
              {Object.entries(groupedOptions).map(([groupName, items]) => (
                <div key={groupName}>
                  <h4 className="text-sm font-medium text-gray-600 mb-2">{groupName}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(items as string[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => setSelected(option)}
                        className={`p-3 border rounded-md text-sm transition text-left ${
                          selected === option
                            ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                            : "border-gray-300 hover:border-brand-accentPrimary"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular grid for other fields
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelected(option)}
                  className={`p-3 border rounded-md text-sm transition text-left ${
                    selected === option
                      ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                      : "border-gray-300 hover:border-brand-accentPrimary"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleConfirmSelected}
            disabled={!selected}
            className="mt-4 w-full px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm {selected ? `"${selected}"` : "Selection"}
          </button>
        </>
      )}

      {/* FREE TEXT FIELD (Key Problem) */}
      {fieldName === "Key Problem Getting Solved" && (
        <>
          <p className="text-sm text-gray-500">You can freely edit this field:</p>
          <input
            type="text"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accentPrimary"
          />
          <button
            onClick={handleConfirmSelected}
            disabled={!selected.trim()}
            className="mt-4 w-full px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm
          </button>
        </>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useOnboardingStore, getCanonicalFieldOrder, getCanonicalFieldForDisplayName } from "@/hooks/useOnboardingStore";
import { getOptionsForField, getGroupedOptionsForField } from "@/utils/getOptionsForField";
import { getDisplayLabelForId, getIdForDisplayLabel, fieldUsesIds } from "@/utils/taxonomyDisplayUtils";

type FieldConfirmationCardProps = {
  fieldName: string;
  aiGuess: string;
  confidence: number; // 0-1 confidence score
  alternatives?: string[]; // Top 3 alternatives for low confidence
  options?: readonly string[]; // Full options fallback
  onConfirm: (value: string) => void;
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
  const isFieldForceManual = onboardingStore.isFieldForceManual;
  const validatedFields = onboardingStore.validatedFields; // ✅ Get current validated values

  // ✅ Get canonical field name for ID/label conversion
  const canonicalField = getCanonicalFieldForDisplayName(fieldName);
  const usesIds = canonicalField ? fieldUsesIds(canonicalField) : false;

  // ✅ Convert ID to label for display (if field uses IDs)
  const getDisplayValue = (value: string) => {
    if (!value || !usesIds || !canonicalField) return value;
    return getDisplayLabelForId(canonicalField, value);
  };

  // ✅ Convert label to ID for storage (if field uses IDs)
  const getStorageValue = (value: string) => {
    if (!value || !usesIds || !canonicalField) return value;
    return getIdForDisplayLabel(canonicalField, value);
  };

  // ✅ Display label for aiGuess
  const aiGuessDisplay = getDisplayValue(aiGuess);

  useEffect(() => {
    // ✅ BUG FIX 1: Check if field is force manual (user clicked edit) - go directly to edit mode
    const canonicalField = getCanonicalFieldForDisplayName(fieldName);
    const isForceManual = canonicalField ? isFieldForceManual(canonicalField) : false;
    
    if (isForceManual) {
      // ✅ BUG FIX 2: User explicitly clicked edit - use current validated value if available, otherwise use AI guess
      setMode("edit");
      const currentValidatedValue = canonicalField ? validatedFields[canonicalField] : null;
      // For force manual fields, start with the previously validated value if it exists
      setSelected(currentValidatedValue || aiGuess || "");
      return;
    }
    
    // Original logic for non-force-manual fields
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
  }, [aiGuess, stepIndex, confidence, alternatives.length, fieldName, isFieldForceManual, validatedFields]);

  // ✅ Additional useEffect to handle aiGuess prop changes for force manual fields
  useEffect(() => {
    const canonicalField = getCanonicalFieldForDisplayName(fieldName);
    const isForceManual = canonicalField ? isFieldForceManual(canonicalField) : false;
    
    if (isForceManual && mode === "edit") {
      // For force manual fields in edit mode, use validated value if available
      const currentValidatedValue = canonicalField ? validatedFields[canonicalField] : null;
      setSelected(currentValidatedValue || aiGuess || "");
    }
  }, [aiGuess, fieldName, isFieldForceManual, validatedFields, mode]);

  // ✅ ADDITIONAL FIX: Ensure selected value updates when aiGuess prop changes
  useEffect(() => {
    const canonicalField = getCanonicalFieldForDisplayName(fieldName);
    const isForceManual = canonicalField ? isFieldForceManual(canonicalField) : false;
    
    if (isForceManual) {
      const currentValidatedValue = canonicalField ? validatedFields[canonicalField] : null;
      setSelected(currentValidatedValue || aiGuess || "");
    } else {
      setSelected(aiGuess || "");
    }
  }, [aiGuess, fieldName, isFieldForceManual, validatedFields]);

  const handleConfirmAIGuess = () => {
    // ✅ aiGuess is already an ID (from validation), pass as-is
    onConfirm(aiGuess);
    confirmField(fieldName, aiGuess);
  };

  const handleConfirmSelected = () => {
    // ✅ selected might be a label (from UI), convert to ID if needed
    const valueToStore = getStorageValue(selected);
    onConfirm(valueToStore);
    confirmField(fieldName, valueToStore);
    setMode("confirm");
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      const newStepIndex = stepIndex - 1;
      setStepIndex(newStepIndex);
      
      // ✅ Force manual confirmation for any field we navigate back to
      const canonicalFieldOrder = getCanonicalFieldOrder();
      const targetCanonicalField = canonicalFieldOrder[newStepIndex];
      if (targetCanonicalField) {
        onboardingStore.addForceManualField(targetCanonicalField);
      }
    }
  };

  // ✅ Use taxonomy-based options
  const fallbackOptions = getOptionsForField(fieldName);
  const availableOptions = options ?? fallbackOptions ?? [];

  // ✅ Get grouped options from taxonomy (single source of truth)
  const groupedOptions = getGroupedOptionsForField(fieldName);
  const isGroupedField = groupedOptions !== null;

  // Confidence-based rendering logic
  const isHighConfidence = confidence >= 0.85;
  const isMediumConfidence = confidence >= 0.7 && confidence < 0.85;
  const isLowConfidence = confidence < 0.7;

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

      {/* HIGH & MEDIUM CONFIDENCE: Standard confirm flow */}
      {mode === "confirm" && (isMediumConfidence || isHighConfidence) && (
        <>
          <p className="text-base text-gray-800">
            Our AI suggests:&nbsp;
            <span className="font-semibold text-brand-accentPrimary">{aiGuessDisplay}</span>
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
            We found <span className="font-semibold">{aiGuessDisplay}</span> with {Math.round(confidence * 100)}% confidence.
            Select the best match for your use case:
          </p>
          <div className="grid grid-cols-1 gap-3">
            {/* Include AI guess as first option with recommendation badge */}
            <button
              onClick={() => setSelected(aiGuess)}
              className={`p-3 border rounded-md text-sm transition text-left relative ${
                selected === aiGuess
                  ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                  : "border-gray-300 hover:border-brand-accentPrimary"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{aiGuessDisplay}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                  ⭐ AI Recommended ({Math.round(confidence * 100)}%)
                </span>
              </div>
            </button>

            {/* Show alternatives */}
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
                {getDisplayValue(alternative)}
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
            ✅ Confirm {selected ? `"${getDisplayValue(selected)}"` : "Selection"}
          </button>
        </>
      )}

      {/* EDIT MODE: Standard options (any confidence level when explicitly editing) */}
      {mode === "edit" && !isLowConfidence && fieldName !== "Key Problem Getting Solved" && (
        <>
          <p className="text-sm text-gray-500">Choose the most accurate option:</p>
          
          {isGroupedField && groupedOptions ? (
            // Enhanced grouped options with better visual hierarchy
            <div className="space-y-6">
              {Object.entries(groupedOptions).map(([groupName, items]) => (
                <div key={groupName} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3 pb-2 border-b border-gray-300">
                    <div className="w-2 h-2 bg-brand-accentPrimary rounded-full mr-3"></div>
                    <h4 className="text-base font-semibold text-gray-800">
                      {groupName}
                    </h4>
                    <span className="ml-2 text-xs text-gray-500 bg-white px-2 py-1 rounded-full font-medium">
                      {items.length} option{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map((option) => {
                      const optionId = getStorageValue(option);
                      return (
                        <button
                          key={option}
                          onClick={() => setSelected(optionId)}
                          className={`p-3 border rounded-lg text-sm transition-all duration-200 text-left hover:shadow-md ${
                            selected === optionId
                              ? "border-brand-accentPrimary bg-white shadow-md ring-2 ring-brand-accentPrimary ring-opacity-20 font-semibold"
                              : "border-gray-300 bg-white hover:border-brand-accentPrimary hover:bg-gray-50"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular grid for ungrouped fields
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableOptions.map((option) => {
                const optionId = getStorageValue(option);
                return (
                  <button
                    key={option}
                    onClick={() => setSelected(optionId)}
                    className={`p-3 border rounded-md text-sm transition text-left ${
                      selected === optionId
                        ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                        : "border-gray-300 hover:border-brand-accentPrimary"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleConfirmSelected}
            disabled={!selected}
            className="mt-4 w-full px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm {selected ? `"${getDisplayValue(selected)}"` : "Selection"}
          </button>
        </>
      )}

      {/* SHOW ALL OPTIONS (expanded from low confidence) */}
      {mode === "show-all" && fieldName !== "Key Problem Getting Solved" && (
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

          {isGroupedField && groupedOptions ? (
            // Enhanced grouped options with better visual hierarchy
            <div className="space-y-6">
              {Object.entries(groupedOptions).map(([groupName, items]) => (
                <div key={groupName} className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3 pb-2 border-b border-gray-300">
                    <div className="w-2 h-2 bg-brand-accentPrimary rounded-full mr-3"></div>
                    <h4 className="text-base font-semibold text-gray-800">
                      {groupName}
                    </h4>
                    <span className="ml-2 text-xs text-gray-500 bg-white px-2 py-1 rounded-full font-medium">
                      {items.length} option{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {items.map((option) => {
                      const optionId = getStorageValue(option);
                      return (
                        <button
                          key={option}
                          onClick={() => setSelected(optionId)}
                          className={`p-3 border rounded-lg text-sm transition-all duration-200 text-left hover:shadow-md ${
                            selected === optionId
                              ? "border-brand-accentPrimary bg-white shadow-md ring-2 ring-brand-accentPrimary ring-opacity-20 font-semibold"
                              : "border-gray-300 bg-white hover:border-brand-accentPrimary hover:bg-gray-50"
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Regular grid for ungrouped fields
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableOptions.map((option) => {
                const optionId = getStorageValue(option);
                return (
                  <button
                    key={option}
                    onClick={() => setSelected(optionId)}
                    className={`p-3 border rounded-md text-sm transition text-left ${
                      selected === optionId
                        ? "border-brand-accentPrimary bg-brand-highlightBG font-semibold"
                        : "border-gray-300 hover:border-brand-accentPrimary"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={handleConfirmSelected}
            disabled={!selected}
            className="mt-4 w-full px-4 py-2 bg-brand-accentPrimary text-white text-sm font-medium rounded-md hover:bg-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Confirm {selected ? `"${getDisplayValue(selected)}"` : "Selection"}
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
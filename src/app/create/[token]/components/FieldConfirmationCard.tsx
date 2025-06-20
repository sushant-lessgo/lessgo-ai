"use client";

import { useState, useEffect } from "react";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { taxonomy } from "@/modules/inference/taxonomy";
import { getOptionsForField } from "@/utils/getOptionsForField";

type FieldConfirmationCardProps = {
  fieldName: string;
  aiGuess: string;
  // confidence: number; // 0–1
  options?: readonly string[]; // optional now, generated if not provided
  onConfirm: (value: string) => void;
};

export default function FieldConfirmationCard({
  fieldName,
  aiGuess,
  // confidence,
  options,
  onConfirm,
}: FieldConfirmationCardProps) {
  const [mode, setMode] = useState<"confirm" | "edit">("confirm");
  const [selected, setSelected] = useState(aiGuess);
  const confirmField = useOnboardingStore((s) => s.confirmField);
  const onboardingStore = useOnboardingStore();
  const stepIndex = onboardingStore.stepIndex;
  const setStepIndex = onboardingStore.setStepIndex;

  useEffect(() => {
    // Reset both mode and selection when aiGuess changes
    if (!aiGuess) {
      setMode("edit");
    } else {
      setMode("confirm");
    }

    setSelected(aiGuess || "");
  }, [aiGuess, stepIndex]);

  const handleConfirmAIGuess = () => {
    onConfirm(aiGuess);
    confirmField(fieldName, aiGuess);
  };

  const handleConfirmSelected = () => {
    onConfirm(selected);
    confirmField(fieldName, selected);
    setMode("confirm");
    // setSelected(aiGuess);
  };

  const handleBack = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  // Dynamically get fallback options if not passed
  const fallbackOptions = getOptionsForField(fieldName);
  console.log("Fallback options:", fallbackOptions);
  console.log("Field Name:", fieldName);
  console.log("Options prop:", options);

  // Ensure we always have an array to work with
  const availableOptions = options ?? fallbackOptions ?? [];
  
  // Add debugging to help identify the issue
  if (!Array.isArray(availableOptions)) {
    console.error("Available options is not an array:", availableOptions);
    console.error("fieldName:", fieldName);
    console.error("getOptionsForField result:", fallbackOptions);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 capitalize">{fieldName}</h3>
        {/* <span className="text-xs text-gray-400">Confidence: {(confidence * 100).toFixed(0)}%</span> */}
      </div>

      {mode === "confirm" ? (
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
      ) : stepIndex === 3 ? (
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
      ) : (
        <>
          <p className="text-sm text-gray-500">Choose the most accurate option:</p>
          {availableOptions.length > 0 ? (
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
          ) : (
            <div className="p-4 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-500">No options available for field: {fieldName}</p>
              <input
                type="text"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                placeholder="Enter custom value"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-accentPrimary"
              />
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
    </div>
  );
}
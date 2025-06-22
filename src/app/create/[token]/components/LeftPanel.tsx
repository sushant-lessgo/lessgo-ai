"use client";

import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { useEffect, useState } from "react";
import ConfirmedFieldTile from "./ConfirmedFieldTile";

// Display name mapping for better UX
const displayNameMap: Record<string, string> = {
  "marketCategory": "Market Category",
  "marketSubcategory": "Market Subcategory", 
  "targetAudience": "Target Audience",
  "keyProblem": "Key Problem Getting Solved",
  "startupStage": "Startup Stage",
  "landingGoal": "Landing Page Goals",
  "pricingModel": "Pricing Category and Model",
};

export default function LeftPanel() {
  const oneLiner = useOnboardingStore((s) => s.oneLiner);
  const validatedFields = useOnboardingStore((s) => s.validatedFields); // ✅ Only user-confirmed fields
  const confirmedFields = useOnboardingStore((s) => s.confirmedFields); // AI guesses with confidence
  const reopenFieldForEditing = useOnboardingStore((s) => s.reopenFieldForEditing);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  if (!mounted || !oneLiner) return null;

  console.log("validatedFields (user-confirmed):", validatedFields);
  console.log("confirmedFields (AI guesses):", confirmedFields);

  // ✅ CORRECT: Only show fields from validatedFields (user-confirmed)
  const confirmedFieldsData = Object.entries(validatedFields).map(([internalField, value]) => {
    const displayName = displayNameMap[internalField] || internalField;
    
    // Check if this field was auto-confirmed (high confidence) or user-confirmed
    const originalFieldData = confirmedFields[internalField];
    const isAutoConfirmed = originalFieldData && originalFieldData.confidence >= 0.85;
    
    return {
      internalField,
      displayName,
      value,
      isAutoConfirmed,
      confidence: originalFieldData?.confidence || 1.0,
    };
  });

  // Sort fields by completion order
  const sortedFields = confirmedFieldsData.sort((a, b) => {
    const fieldOrder = [
      "marketCategory",
      "marketSubcategory", 
      "targetAudience",
      "keyProblem",
      "startupStage",
      "landingGoal",
      "pricingModel",
    ];
    return fieldOrder.indexOf(a.internalField) - fieldOrder.indexOf(b.internalField);
  });

  const handleEditField = (internalField: string) => {
    console.log(`Editing field: ${internalField}`);
    reopenFieldForEditing(internalField);
  };

  return (
    <aside className="space-y-6 overflow-y-auto pr-2 max-h-[calc(100vh-64px)]">
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Product Description and Inputs</h2>

        {/* User's One-Liner Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="text-sm text-gray-500 font-medium mb-1">Your Product Description</div>
          <p className="text-base font-semibold text-gray-900">{oneLiner}</p>
        </div>
      </div>

      {/* Confirmed Fields */}
      {sortedFields.length === 0 ? (
        <div className="text-sm text-gray-400 italic">No fields confirmed yet.</div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Confirmed Fields</h3>
          {sortedFields.map(({ internalField, displayName, value, isAutoConfirmed, confidence }) => (
            <ConfirmedFieldTile 
              key={internalField}
              field={displayName}
              value={value}
              isAutoConfirmed={isAutoConfirmed}
              confidence={confidence}
              onEdit={() => handleEditField(internalField)}
            />
          ))}
          
          {/* Progress indicator */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {sortedFields.length} of 7 fields confirmed
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((sortedFields.length / 7) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
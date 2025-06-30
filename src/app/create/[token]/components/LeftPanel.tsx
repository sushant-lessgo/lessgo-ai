"use client";

import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { useEffect, useState } from "react";
import ConfirmedFieldTile from "./ConfirmedFieldTile";
import { FIELD_DISPLAY_NAMES, CANONICAL_FIELD_NAMES, type CanonicalFieldName } from "@/types/core/index";

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

  // ✅ FIXED: Use canonical field names and type-safe mapping
  const confirmedFieldsData = Object.entries(validatedFields).map(([canonicalField, value]) => {
    // Type-safe canonical field name
    const canonicalFieldName = canonicalField as CanonicalFieldName;
    
    // Get display name from canonical mapping
    const displayName = FIELD_DISPLAY_NAMES[canonicalFieldName] || canonicalField;
    
    // Check if this field was auto-confirmed (high confidence) or user-confirmed
    const originalFieldData = confirmedFields[canonicalFieldName];
    const isAutoConfirmed = originalFieldData && originalFieldData.confidence >= 0.85;
    
    return {
      canonicalField: canonicalFieldName,
      displayName,
      value,
      isAutoConfirmed,
      confidence: originalFieldData?.confidence || 1.0,
    };
  });

  // ✅ FIXED: Sort fields using canonical field order
  const sortedFields = confirmedFieldsData.sort((a, b) => {
    const indexA = CANONICAL_FIELD_NAMES.indexOf(a.canonicalField);
    const indexB = CANONICAL_FIELD_NAMES.indexOf(b.canonicalField);
    return indexA - indexB;
  });

  const handleEditField = (canonicalField: CanonicalFieldName) => {
    console.log(`Editing field: ${canonicalField}`);
    // Pass the canonical field name directly to reopenFieldForEditing
    reopenFieldForEditing(canonicalField);
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
          {sortedFields.map(({ canonicalField, displayName, value, isAutoConfirmed, confidence }) => (
            <ConfirmedFieldTile 
              key={canonicalField}
              field={displayName}
              value={value}
              isAutoConfirmed={isAutoConfirmed}
              confidence={confidence}
              onEdit={() => handleEditField(canonicalField)}
            />
          ))}
          
          {/* Progress indicator */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {sortedFields.length} of {CANONICAL_FIELD_NAMES.length} fields confirmed
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((sortedFields.length / CANONICAL_FIELD_NAMES.length) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
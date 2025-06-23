"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";

// ✅ UPDATED: Use internal field names to match new API structure
const FIELD_ORDER = [
  "marketCategory",
  "marketSubcategory",
  "targetAudience",
  "keyProblem",
  "startupStage",
  "landingGoal",
  "pricingModel",
];

console.log("outside startpage working");

export default function StartPage() {
  const params = useParams();
  const tokenId = params?.token as string;

  const {
    setOneLiner,
    setConfirmedFields,
    setValidatedFields,
    setStepIndex,
    setFeaturesFromAI,
    setHiddenInferredFields,
    reset,
  } = useOnboardingStore();
  
  console.log("StartPage mounted");
  console.log("params:", params);
  console.log("tokenId:", tokenId);

  useEffect(() => {
    if (!tokenId) return;

    const loadDraft = async () => {
      try {
        console.log("Calling loadDraft for token:", tokenId);
        const res = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
        
        if (!res.ok) {
          console.log("No existing draft found, starting fresh");
          return;
        }
        
        const data = await res.json();
        console.log("Loaded draft data:", data);

        // ✅ FIXED: Use new API response structure
        setOneLiner(data.inputText || "");
        
        // ✅ FIXED: Set confirmedFields (AI guesses with confidence)
        setConfirmedFields(data.confirmedFields || {});
        
        // ✅ FIXED: Set validatedFields (user-confirmed values)  
        setValidatedFields(data.validatedFields || {});
        
        // ✅ FIXED: Set stepIndex directly from API
        setStepIndex(data.stepIndex || 0);
        
        // ✅ NEW: Set additional onboarding data
        setFeaturesFromAI(data.featuresFromAI || []);
        setHiddenInferredFields(data.hiddenInferredFields || {});

        console.log("✅ Store populated from draft:", {
          inputText: data.inputText,
          stepIndex: data.stepIndex,
          confirmedFieldsCount: Object.keys(data.confirmedFields || {}).length,
          validatedFieldsCount: Object.keys(data.validatedFields || {}).length,
          featuresCount: (data.featuresFromAI || []).length,
        });

      } catch (err) {
        console.error("❌ Draft load failed:", err);
        // Don't reset on error - let user start fresh
      }
    };

    loadDraft();
  }, [tokenId, setOneLiner, setConfirmedFields, setValidatedFields, setStepIndex, setFeaturesFromAI, setHiddenInferredFields]);

  return <></>; // No UI here — it's handled in RightPanel
}
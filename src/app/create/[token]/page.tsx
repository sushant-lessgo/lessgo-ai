"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { autoSaveDraft } from "@/utils/autoSaveDraft";
import { getOptionsForField } from "@/utils/getOptionsForField";

const FIELD_ORDER = [
  "Market Category",
  "Market Subcategory",
  "Target Audience",
  "Key Problem Getting Solved",
  "Startup Stage",
  "Landing Page Goals",
  "Pricing Category and Model",
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
    reset,
  } = useOnboardingStore();
  
  console.log("StartPage mounted");
  console.log("params:", params);
  console.log("tokenId:", tokenId);


  useEffect(() => {
  if (!tokenId) return; // ✅ Guard moved back

  const loadDraft = async () => {
    try {
      console.log("Calling loadDraft for token:", tokenId); // ✅ Debug
      const res = await fetch(`/api/loadDraft?tokenId=${tokenId}`);
      if (!res.ok) return;
      const data = await res.json();

      setOneLiner(data.inputText || "");

      const filteredContent = Object.fromEntries(
        FIELD_ORDER
          .filter((field) => data.content?.[field])
          .map((field) => [field, data.content[field]])
      );

      setValidatedFields(filteredContent);

      const filledSteps = FIELD_ORDER.findIndex((field) => !(field in filteredContent));
      setStepIndex(filledSteps === -1 ? FIELD_ORDER.length : filledSteps);
    } catch (err) {
      console.error("Draft load failed", err);
    }
  };

  loadDraft();
}, [tokenId]); // ✅ Depend on tokenId



  return <></>; // No UI here — it's handled in RightPanel
}

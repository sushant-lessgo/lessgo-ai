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
const FIELD_ORDER = [
  "Market Category",
  "Market Subcategory",
  "Target Audience",
  "Key Problem Getting Solved",
  "Startup Stage",
  "Landing Page Goals",
  "Pricing Category and Model",
];



type FeatureItem = {
  feature: string;
  benefit: string;
};


export default function RightPanel() {
  const {
    oneLiner,
    setOneLiner,
    confirmedFields,
    validatedFields,
    setConfirmedFields,
    setValidatedFields,
    confirmField,
    stepIndex,
    setStepIndex,
  } = useOnboardingStore();

  const isStep1 = !oneLiner;
  const isFinalStep = stepIndex >= FIELD_ORDER.length;
  const params = useParams();
const tokenId = params?.token as string;


  const currentField = FIELD_ORDER[stepIndex];
  const aiGuess = validatedFields[currentField] ?? confirmedFields[currentField] ?? "";
  
  const [showFeatureEditor, setShowFeatureEditor] = useState(false);


  const handleConfirm = async (value: string) => {
    confirmField(currentField, value);
    const updated = { ...validatedFields, [currentField]: value };
    setValidatedFields(updated);
    setStepIndex(stepIndex + 1);
    await autoSaveDraft({
      tokenId,
      inputText: oneLiner,
      confirmedFields: updated, // Saving validated fields
    });
  };

  const {
  
  featuresFromAI,
  setFeaturesFromAI,
} = useOnboardingStore();

 






useEffect(() => {

   const {
  "Market Category": category,
  "Market Subcategory": subcategory,
  "Key Problem Getting Solved": problem,
  "Target Audience": audience,
  "Startup Stage": startupStage,
  "Pricing Category and Model": pricing,
  "Landing Page Goals": goal,
} = validatedFields;

   if (isFinalStep && featuresFromAI.length === 0) {
    const fetchFeatures = async () => {
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

      const { features } = await res.json();
      setFeaturesFromAI(features);

      setTimeout(() => setShowFeatureEditor(true), 2000);
    };

    fetchFeatures();
  }
}, [isFinalStep]);

const handleGeneratePage = () => {
  alert("✅ Submitted! Your landing page is being generated...");
};

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
              <InputStep
                onSuccess={async (input, inferred) => {
                  setOneLiner(input);
                  setStepIndex(0);
                  setValidatedFields({});
                  setConfirmedFields(inferred);
                  await autoSaveDraft({
                    tokenId,
                    inputText: input,
                    confirmedFields: {},
                  });
                }}
              />
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
            You’ve confirmed all inputs. Now we will do detailed market reaserch.
          </p>
        </>
      )
    ) : (
      <>
        <h2 className="text-lg md:text-xl font-semibold text-gray-900">
          Step 2: Review Lessgo.ai Suggestions
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          We’ve inferred your input. Confirm or edit each field to continue.
        </p>
        <div className="mt-4 w-full h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${(stepIndex / FIELD_ORDER.length) * 100}%` }}
          />
        </div>
        <div className="text-xs text-gray-400 text-right mt-1">
          Step {Math.min(stepIndex + 2, FIELD_ORDER.length + 2)} of {FIELD_ORDER.length + 2}
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
        onClick={handleGeneratePage}
        className="text-base font-semibold bg-brand-accentPrimary text-white py-3 px-6 rounded-lg shadow hover:bg-orange-500 transition"
      >
        Generate My Page
      </Button>
    </div>

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
      <FieldConfirmationCard
        fieldName={currentField}
        aiGuess={aiGuess}
        options={getOptionsForField(currentField)}
        onConfirm={handleConfirm}
      />
    )}
  </section>
</div>

        )}
      </div>
    </div>
  );
}

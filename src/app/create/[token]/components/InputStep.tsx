// /app/start/[token]/components/InputStep.tsx
"use client";

import { useState } from "react";
import type { GPTOutput } from "@/modules/prompt/types";
import posthog from "posthog-js";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { autoSaveDraft } from "@/utils/autoSaveDraft";
import { useParams } from "next/navigation";
import { inferFields, InferredFields } from '@/modules/inference/inferFields';
import { validateInferredFields } from '@/modules/inference/validateOutput';


interface InputStepProps {
  onSuccess: (input: string, validatedFields: InferredFields) => void;
}

export default function InputStep({ onSuccess }: InputStepProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const params = useParams();
const tokenId = params?.token as string;
  

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!input.trim()) return;

  setLoading(true);
  setError(null);

  try {
    posthog.capture('input_submitted', {
      input_length: input.length,
    });

    const setOneLiner = useOnboardingStore.getState().setOneLiner;
    setOneLiner(input);

    // 🔍 Call server API to infer fields
    const res = await fetch('/api/infer-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const json = await res.json();

    if (!json.success) throw new Error(json.error || 'Inference failed');

    console.log('raw inference output', json.data);

    const validatedFields = validateInferredFields(json.data);

    await autoSaveDraft({
      tokenId,
      inputText: input,
      confirmedFields: validatedFields,
    });

    // ✅ Pass to next step
    onSuccess(input, validatedFields);
  } catch (err) {
    setError('Something went wrong. Try again.');
    console.error(err);
  } finally {
    setLoading(false);
  }
}



  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-6 bg-white rounded-lg shadow-md border border-gray-200"
    >
      <label htmlFor="idea" className="block text-lg font-semibold text-brand-text">
        Step 1 of 2: what's your idea?
      </label>

      <textarea
        id="idea"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g., AI tool for lawyers that reduces contract review time by 75%"
        rows={3}
        className="w-full px-4 py-2 min-h-[96px] bg-transparent text-black caret-black focus:outline-none focus:ring-2 border border-gray-300 rounded-md"
        style={
          input.length === 0
            ? {
                animation: "pulseBorder 2s infinite",
                boxShadow: "none",
              }
            : {}
        }
      />

      <button
        type="submit"
        className="mt-4 w-full md:w-auto px-6 py-3 bg-brand-accentPrimary text-white rounded-md hover:bg-orange-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accentPrimary disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Generating..." : "Build My Page Now!"}
      </button>

      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}

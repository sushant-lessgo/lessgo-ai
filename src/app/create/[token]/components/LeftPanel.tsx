"use client";

import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { useEffect, useState } from "react";
import ConfirmedFieldTile from "./ConfirmedFieldTile";

export default function LeftPanel() {
  const oneLiner = useOnboardingStore((s) => s.oneLiner);
  const validatedFields = useOnboardingStore((s) => s.validatedFields);


  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !oneLiner) return null;

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
      {Object.entries(validatedFields).length === 0 ? (
  <div className="text-sm text-gray-400 italic">No fields confirmed yet.</div>
) : (
  <div className="space-y-4">
    {Object.entries(validatedFields).map(([field, value]) => (
      <ConfirmedFieldTile key={field} field={field} value={value} />
    ))}
  </div>
)}

    </aside>
  );
}

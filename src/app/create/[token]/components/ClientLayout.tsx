"use client";

import { OnboardingUIProvider, useOnboardingUI } from "./OnboardingUIContext";
import LeftPanel from "./LeftPanel";
import RightPanel from "./RightPanel";
import type { ReactNode } from "react";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <OnboardingUIProvider>
      <ClientInnerLayout>{children}</ClientInnerLayout>
    </OnboardingUIProvider>
  );
}

function ClientInnerLayout({ children }: { children: ReactNode }) {
  const oneLiner = useOnboardingStore((s) => s.oneLiner);
  const showLeftPanel = !!oneLiner;

  return (
    <div
      className={`min-h-screen bg-gray-50 text-brand-text ${
        showLeftPanel
          ? "grid grid-cols-1 md:grid-cols-[40%_60%] lg:grid-cols-[35%_65%]"
          : "w-full"
      }`}
    >
      {showLeftPanel && (
        <aside className="h-full border-r border-gray-200 bg-white px-6 py-8 overflow-y-auto">
          <LeftPanel />
        </aside>
      )}

      <main className="h-full w-full bg-white px-6 py-8 overflow-y-auto">
        <RightPanel />
        {children}
      </main>
    </div>
  );
}

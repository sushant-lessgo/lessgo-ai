// layout.tsx
import { OnboardingUIProvider, useOnboardingUI } from "./components/OnboardingUIContext";
import LeftPanel from "./components/LeftPanel";
import RightPanel from "./components/RightPanel";
import type { ReactNode } from "react";
import ClientLayout from "./components/ClientLayout";

export default function CreateLayout({ children }: { children: ReactNode }) {
  return (
    <ClientLayout>{children}</ClientLayout>
  );
}


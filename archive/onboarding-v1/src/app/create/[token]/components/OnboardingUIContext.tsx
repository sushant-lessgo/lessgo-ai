import { createContext, useContext, useState, useEffect } from "react";

type UIContextType = {
  showLeftPanel: boolean;
  setShowLeftPanel: (val: boolean) => void;
};

const OnboardingUIContext = createContext<UIContextType | null>(null);

export function OnboardingUIProvider({ children }: { children: React.ReactNode }) {
  // Initialize from localStorage if present, otherwise false
  const [showLeftPanel, setShowLeftPanelRaw] = useState(
    () => {
      if (typeof window === "undefined") return false;
      const stored = localStorage.getItem("showLeftPanel");
      return stored === "true";
    }
  );

  // Save to localStorage whenever value changes
  useEffect(() => {
    localStorage.setItem("showLeftPanel", String(showLeftPanel));
  }, [showLeftPanel]);

  // Provide a stable setter function
  const setShowLeftPanel = (val: boolean) => {
    setShowLeftPanelRaw(val);
    // Save to localStorage immediately as well (optional redundancy)
    localStorage.setItem("showLeftPanel", String(val));
  };

  return (
    <OnboardingUIContext.Provider value={{ showLeftPanel, setShowLeftPanel }}>
      {children}
    </OnboardingUIContext.Provider>
  );
}

export function useOnboardingUI() {
  const ctx = useContext(OnboardingUIContext);
  if (!ctx) throw new Error("useOnboardingUI must be used within OnboardingUIProvider");
  return ctx;
}

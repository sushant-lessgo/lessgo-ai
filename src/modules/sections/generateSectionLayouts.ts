
import { layoutPickers } from "./layoutPickers";
import { useOnboardingStore } from "@/hooks/useOnboardingStore";
import { usePageStore } from "@/hooks/usePageStore";
import type { LayoutPickerInput } from "./layoutPickerInput";

export function generateSectionLayouts(sectionIds: string[]) {
  const onboarding = useOnboardingStore.getState();
  const setSectionLayouts = usePageStore.getState().setSectionLayouts;

  const input: LayoutPickerInput = {
    awarenessLevel: onboarding.hiddenInferredFields.awarenessLevel as LayoutPickerInput["awarenessLevel"],
    toneProfile: onboarding.hiddenInferredFields.toneProfile as LayoutPickerInput["toneProfile"],
    startupStageGroup: onboarding.validatedFields.startupStageGroup as LayoutPickerInput["startupStageGroup"],
    marketCategory: onboarding.validatedFields.marketCategory as LayoutPickerInput["marketCategory"],
  };

  const layouts: Record<string, string> = {};

  sectionIds.forEach((sectionId) => {
    const picker = layoutPickers[sectionId];
    if (picker) {
      layouts[sectionId] = picker(input);
    } else {
      layouts[sectionId] = "layoutA"; // fallback default
    }
  });

  setSectionLayouts(layouts);
}

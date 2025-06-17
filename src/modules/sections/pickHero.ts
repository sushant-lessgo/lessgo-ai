// types.ts (if used separately)
export type HeroLayoutVariant =
  | "leftCopyRightImage"
  | "centerStacked"
  | "splitScreen"
  | "imageFirst";

export interface SupportingElement {
  name: string;
  copy: string | string[];
}

// Main file: pickHero.ts
interface PickHeroInput {
  supportingElements: SupportingElement[];
  toneProfile: string;
  awarenessLevel:
    | "Unaware"
    | "Problem-Aware"
    | "Solution-Aware"
    | "Product-Aware"
    | "Most-Aware";
}

export function pickHeroLayout({
  supportingElements,
  toneProfile,
  awarenessLevel,
}: PickHeroInput): HeroLayoutVariant {
  // Check if there's any kind of image or visual support
  const hasImage = supportingElements.some(
    (e) =>
      e.name === "productScreenshotOrUIMockup" ||
      e.name === "heroIllustrationOrMascot"
  );

  // Layout decision logic
  if (!hasImage) {
    return "centerStacked";
  }

  if (toneProfile.toLowerCase().includes("playful")) {
    return "imageFirst";
  }

  if (awarenessLevel === "Product-Aware") {
    return "splitScreen";
  }

  return "leftCopyRightImage"; // Default fallback
}

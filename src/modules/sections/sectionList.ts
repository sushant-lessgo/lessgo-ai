// Section spacing levels for better visual rhythm
export type SectionSpacing = 'compact' | 'normal' | 'spacious' | 'extra';

export type SectionMeta = {
  id: string;
  label: string;
  order: number;
  background: "primary-highlight" | "secondary-highlight" | "neutral" | "divider-zone";
  required?: boolean;
  // Default spacing after this section (can be overridden by smart spacing algorithm)
  defaultSpacingAfter?: SectionSpacing;
  // Content density hint for spacing algorithm
  contentDensity?: 'light' | 'medium' | 'heavy';
};

export const sectionList: SectionMeta[] = [
  { id: "header", label: "Header", order: 0, background: "neutral", required: true, defaultSpacingAfter: 'compact', contentDensity: 'light' },
  { id: "beforeAfter", label: "Before / After", order: 3, background: "neutral", defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "closeSection", label: "Close Section", order: 24, background: "primary-highlight", defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "comparisonTable", label: "Comparison Table", order: 12, background: "neutral", defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "cta", label: "Primary CTA Section", order: 23, background: "primary-highlight", required: true, defaultSpacingAfter: 'extra', contentDensity: 'light' },
  { id: "features", label: "Features & Benefits", order: 5, background: "secondary-highlight", defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "faq", label: "FAQ", order: 22, background: "divider-zone", defaultSpacingAfter: 'normal', contentDensity: 'heavy' },
  { id: "founderNote", label: "Founder Note / Human Touch", order: 19, background: "neutral", defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "hero", label: "Hero", order: 1, background: "primary-highlight", required: true, defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "howItWorks", label: "How It Works", order: 7, background: "neutral", defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "integrations", label: "Integrations", order: 14, background: "neutral", defaultSpacingAfter: 'normal', contentDensity: 'light' },
  { id: "objectionHandling", label: "Objection Handling Section", order: 13, background: "secondary-highlight", defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "pricing", label: "Pricing Plans", order: 16, background: "secondary-highlight", defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "problem", label: "Problem / Pain Point", order: 2, background: "neutral", defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "results", label: "Results / Outcomes", order: 8, background: "neutral", defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "security", label: "Security / Compliance", order: 15, background: "neutral", defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "socialProof", label: "Social Proof Logos / Stats", order: 10, background: "divider-zone", defaultSpacingAfter: 'compact', contentDensity: 'light' },
  { id: "testimonials", label: "Testimonials", order: 9, background: "neutral", defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "uniqueMechanism", label: "Unique Mechanism / Why Different", order: 6, background: "secondary-highlight", defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "useCases", label: "Use Cases & Target Users", order: 4, background: "neutral", defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "footer", label: "Footer", order: 25, background: "neutral", required: true, defaultSpacingAfter: 'normal', contentDensity: 'light' },
];

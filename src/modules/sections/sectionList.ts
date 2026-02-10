// Section spacing levels for better visual rhythm
export type SectionSpacing = 'compact' | 'normal' | 'spacious' | 'extra';

export type SectionMeta = {
  id: string;
  label: string;
  order: number;
  required?: boolean;
  // Default spacing after this section (can be overridden by smart spacing algorithm)
  defaultSpacingAfter?: SectionSpacing;
  // Content density hint for spacing algorithm
  contentDensity?: 'light' | 'medium' | 'heavy';
};

export const sectionList: SectionMeta[] = [
  { id: "header", label: "Header", order: 0, required: true, defaultSpacingAfter: 'compact', contentDensity: 'light' },
  { id: "beforeAfter", label: "Before / After", order: 3, defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "closeSection", label: "Close Section", order: 24, defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "comparisonTable", label: "Comparison Table", order: 12, defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "cta", label: "Primary CTA Section", order: 23, required: true, defaultSpacingAfter: 'extra', contentDensity: 'light' },
  { id: "features", label: "Features & Benefits", order: 5, defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "faq", label: "FAQ", order: 22, defaultSpacingAfter: 'normal', contentDensity: 'heavy' },
  { id: "founderNote", label: "Founder Note / Human Touch", order: 19, defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "hero", label: "Hero", order: 1, required: true, defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "howItWorks", label: "How It Works", order: 7, defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "integrations", label: "Integrations", order: 14, defaultSpacingAfter: 'normal', contentDensity: 'light' },
  { id: "objectionHandling", label: "Objection Handling Section", order: 13, defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "pricing", label: "Pricing Plans", order: 16, defaultSpacingAfter: 'spacious', contentDensity: 'heavy' },
  { id: "problem", label: "Problem / Pain Point", order: 2, defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "results", label: "Results / Outcomes", order: 8, defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "security", label: "Security / Compliance", order: 15, defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "socialProof", label: "Social Proof Logos / Stats", order: 10, defaultSpacingAfter: 'compact', contentDensity: 'light' },
  { id: "testimonials", label: "Testimonials", order: 9, defaultSpacingAfter: 'spacious', contentDensity: 'medium' },
  { id: "uniqueMechanism", label: "Unique Mechanism / Why Different", order: 6, defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "useCases", label: "Use Cases & Target Users", order: 4, defaultSpacingAfter: 'normal', contentDensity: 'medium' },
  { id: "miscellaneous", label: "Miscellaneous / Announcements", order: 21, defaultSpacingAfter: 'normal', contentDensity: 'light' },
  { id: "footer", label: "Footer", order: 25, required: true, defaultSpacingAfter: 'normal', contentDensity: 'light' },
];

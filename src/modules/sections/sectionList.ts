export type SectionMeta = {
  id: string;
  label: string;
  order: number;
  background: "primary-highlight" | "secondary-highlight" | "neutral" | "divider-zone";
  required?: boolean;
};

export const sectionList: SectionMeta[] = [
  { id: "beforeAfter", label: "Before / After", order: 3, background: "neutral" },
  { id: "closeSection", label: "Close Section", order: 24, background: "primary-highlight" },
  { id: "comparisonTable", label: "Comparison Table", order: 12, background: "neutral" },
  { id: "cta", label: "Primary CTA Section", order: 23, background: "primary-highlight", required: true },
  { id: "features", label: "Features & Benefits", order: 5, background: "secondary-highlight" },
  { id: "faq", label: "FAQ", order: 22, background: "divider-zone" },
  { id: "founderNote", label: "Founder Note / Human Touch", order: 19, background: "neutral" },
  { id: "hero", label: "Hero", order: 1, background: "primary-highlight", required: true },
  { id: "howItWorks", label: "How It Works", order: 7, background: "neutral" },
  { id: "integrations", label: "Integrations", order: 14, background: "neutral" },
  { id: "objectionHandling", label: "Objection Handling Section", order: 13, background: "secondary-highlight" },
  { id: "pricing", label: "Pricing Plans", order: 16, background: "secondary-highlight" },
  { id: "problem", label: "Problem / Pain Point", order: 2, background: "neutral" },
  { id: "results", label: "Results / Outcomes", order: 8, background: "neutral" },
  { id: "security", label: "Security / Compliance", order: 15, background: "neutral" },
  { id: "socialProof", label: "Social Proof Logos / Stats", order: 10, background: "divider-zone" },
  { id: "testimonials", label: "Testimonials", order: 9, background: "neutral" },
  { id: "uniqueMechanism", label: "Unique Mechanism / Why Different", order: 6, background: "secondary-highlight" },
  { id: "useCases", label: "Use Cases & Target Users", order: 4, background: "neutral" },
];

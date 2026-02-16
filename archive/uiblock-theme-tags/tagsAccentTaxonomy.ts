export const tagsAccentTaxonomy = {
  colorTheory: [
    "complementary",
    "analogous",
    "triadic",
    "split-complementary",
    "monochromatic"
  ],
  contrast: [
    "high-contrast",
    "medium-contrast",
    "low-contrast"
  ],
  temperature: [
    "warm",
    "cool",
    "neutral"
  ],
  industry: [
    "fintech",
    "healthcare",
    "enterprise",
    "consumer",
    "creative",
    "technical",
    "ecommerce"
  ],
  personality: [
    "professional",
    "trustworthy",
    "innovative",
    "friendly",
    "bold",
    "minimal",
    "playful"
  ],
  weight: [
    "subtle",
    "moderate",
    "strong",
    "dramatic"
  ],
  format: [
    "solid",
    "gradient",
    "dual-tone"
  ]
} as const;

export type TagCategory = keyof typeof tagsAccentTaxonomy;

export type Tag = typeof tagsAccentTaxonomy[TagCategory][number];

import type { LayoutPickerInput } from "./layoutPickerInput";


import { pickBeforeAfterLayout } from "./pickBeforeAfter";
import { pickCloseLayout } from "./pickCloseLayout";
import { pickComparisonLayout } from "./pickComparisonLayout";
import { pickFAQLayout } from "./pickFAQLayout";
import { pickFeatureLayout } from "./pickFeature";
import { pickFounderNoteLayout } from "./pickFounderNoteLayout";
import { pickHeaderLayout } from "./pickHeader";
import { pickHeroLayout } from "./pickHero";
import { pickHowItWorksLayout } from "./pickHowItWorks";
import { pickIntegrationLayout } from "./pickIntegrationLayout";
import { pickObjectionLayout } from "./pickObjectionLayout";
import { pickPricingLayout } from "./pickPricingLayout";
import { pickPrimaryCTALayout } from "./pickPrimaryCTALayout";
import { pickProblemLayout } from "./pickProblemLayout";
import { pickResultsLayout } from "./pickResultsLayout";
import { pickSecurityLayout } from "./pickSecurityLayout";
import { pickSocialProofLayout } from "./pickSocialProofLayout";
import { pickTestimonialLayout } from "./pickTestimonialLayout";
import { pickUniqueMechanismLayout } from "./pickUniqueMechanism";
import { pickUseCaseLayout } from "./pickUseCaseLayout";
import { pickFooterLayout } from "./pickFooter";

type LayoutPicker = (input: LayoutPickerInput) => string;

export const layoutPickers: Record<string, LayoutPicker> = {
  header: pickHeaderLayout,
  beforeAfter: pickBeforeAfterLayout,
  closeSection: pickCloseLayout,
  comparisonTable: pickComparisonLayout,
  faq: pickFAQLayout,
  features: pickFeatureLayout,
  founderNote: pickFounderNoteLayout,
  hero: pickHeroLayout,
  howItWorks: pickHowItWorksLayout,
  integrations: pickIntegrationLayout,
  objectionHandling: pickObjectionLayout,
  pricing: pickPricingLayout,
  cta: pickPrimaryCTALayout,
  problem: pickProblemLayout,
  results: pickResultsLayout,
  security: pickSecurityLayout,
  socialProof: pickSocialProofLayout,
  testimonials: pickTestimonialLayout,
  uniqueMechanism: pickUniqueMechanismLayout,
  useCases: pickUseCaseLayout,
  footer: pickFooterLayout,
};

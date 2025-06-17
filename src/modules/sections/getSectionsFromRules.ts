
import { SectionMeta, sectionList } from "./sectionList";

type FeatureItem = { feature: string; benefit: string };

type RuleInput = {
  validatedFields: Record<string, string>;
  hiddenInferredFields: Record<string, string>;
  featuresFromAI: FeatureItem[];
};

export function getSectionsFromRules({
  validatedFields,
  hiddenInferredFields,
  featuresFromAI,
}: RuleInput): string[] {
  const {
    landingGoalType: goal = "",
    targetAudienceGroup: targetAudience = "",
    pricingModel = "",
    startupStageGroup: stage = "",
    marketCategory: category = "",
  } = validatedFields;

  const {
    awarenessLevel: awareness = "",
    copyIntent: intent = "",
    sophisticationLevel: sophistication = "",
  } = hiddenInferredFields;

  const selectedSections = new Set<string>(["hero", "cta"]);

  // TIER 1: Core logic
  addGoalBasedSections(selectedSections, goal);
  addAwarenessBasedSections(selectedSections, awareness);
  addAudienceBasedSections(selectedSections, targetAudience);

  // TIER 2: Strategic modifiers
  addMarketSophisticationSections(selectedSections, sophistication);
  addCategorySpecificSections(selectedSections, category);

  // TIER 3: Fine-tuning
  addStageBasedSections(selectedSections, stage);
  addIntentBasedSections(selectedSections, intent);
  addPricingBasedSections(selectedSections, pricingModel, goal);

  // Feature-based logic (independent)
  if (featuresFromAI.length > 0) {
    selectedSections.add("features");
  }

  // Final ordered result based on sectionList priority
  return sectionList
    .filter((s) => selectedSections.has(s.id))
    .sort((a, b) => a.order - b.order)
    .map((s) => s.id);
}

// Claude's logic functions

function addGoalBasedSections(sections: Set<string>, goal: string) {
  const goalSectionMap: Record<string, string[]> = {
    waitlist: ["problem", "socialProof", "testimonials"],
    "early-access": ["problem", "socialProof", "uniqueMechanism"],
    signup: ["features", "socialProof", "testimonials"],
    "free-trial": ["features", "howItWorks", "testimonials", "pricing"],
    demo: ["features", "useCases", "testimonials", "results"],
    "book-call": ["problem", "results", "testimonials", "objectionHandling"],
    "contact-sales": ["features", "useCases", "results", "objectionHandling"],
    "buy-now": ["features", "pricing", "testimonials", "objectionHandling"],
    subscribe: ["features", "pricing", "testimonials"],
    download: ["problem", "results", "socialProof"],
    "join-community": ["useCases", "socialProof", "testimonials"],
    "watch-video": ["problem", "results", "socialProof"],
  };

  const goalSections = goalSectionMap[goal] || ["features", "socialProof"];
  goalSections.forEach((section) => sections.add(section));
}

function addAwarenessBasedSections(sections: Set<string>, awareness: string) {
  switch (awareness) {
    case "unaware":
      sections.add("problem");
      sections.add("useCases");
      sections.add("howItWorks");
      break;
    case "problem-aware":
      sections.add("problem");
      sections.add("uniqueMechanism");
      sections.add("howItWorks");
      sections.add("results");
      break;
    case "solution-aware":
      sections.add("uniqueMechanism");
      sections.add("comparisonTable");
      sections.add("features");
      sections.add("testimonials");
      break;
    case "product-aware":
      sections.add("testimonials");
      sections.add("results");
      sections.add("objectionHandling");
      sections.add("pricing");
      break;
    case "most-aware":
      sections.add("pricing");
      sections.add("testimonials");
      sections.add("objectionHandling");
      break;
  }
}

function addAudienceBasedSections(sections: Set<string>, targetAudience: string) {
  if (targetAudience.includes("founders") || targetAudience.includes("startup")) {
    sections.add("founderNote");
    sections.add("results");
    sections.add("testimonials");
  }

  if (targetAudience.includes("enterprise")) {
    sections.add("security");
    sections.add("integrations");
    sections.add("comparisonTable");
    sections.add("objectionHandling");
  }

  if (targetAudience.includes("creators")) {
    sections.add("useCases");
    sections.add("socialProof");
    sections.add("testimonials");
    sections.add("results");
  }

  if (targetAudience.includes("marketers") || targetAudience.includes("agencies")) {
    sections.add("features");
    sections.add("results");
    sections.add("useCases");
    sections.add("integrations");
  }

  if (targetAudience.includes("builders") || targetAudience.includes("developers")) {
    sections.add("integrations");
    sections.add("howItWorks");
    sections.add("features");
  }
}

function addMarketSophisticationSections(sections: Set<string>, sophistication: string) {
  switch (sophistication) {
    case "level-1":
      sections.add("problem");
      sections.add("howItWorks");
      sections.add("useCases");
      break;
    case "level-2":
      sections.add("uniqueMechanism");
      sections.add("results");
      break;
    case "level-3":
      sections.add("uniqueMechanism");
      sections.add("comparisonTable");
      sections.add("features");
      break;
    case "level-4":
      sections.add("testimonials");
      sections.add("results");
      sections.add("socialProof");
      sections.add("objectionHandling");
      break;
    case "level-5":
      sections.add("testimonials");
      sections.add("results");
      sections.add("socialProof");
      sections.add("objectionHandling");
      sections.add("founderNote");
      break;
  }
}

function addCategorySpecificSections(sections: Set<string>, category: string) {
  if (category === "AI Tools") {
    sections.add("howItWorks");
    sections.add("uniqueMechanism");
    sections.add("useCases");
  }

  if (category === "Marketing & Sales Tools") {
    sections.add("results");
    sections.add("integrations");
    sections.add("useCases");
  }

  if (category === "Engineering & Development Tools") {
    sections.add("integrations");
    sections.add("security");
    sections.add("howItWorks");
  }

  if (category === "Design & Creative Tools") {
    sections.add("results");
    sections.add("useCases");
    sections.add("beforeAfter");
  }

  if (category === "No-Code & Low-Code Platforms") {
    sections.add("howItWorks");
    sections.add("useCases");
    sections.add("testimonials");
  }

  if (category === "Data & Analytics Tools") {
    sections.add("security");
    sections.add("results");
    sections.add("integrations");
  }

  if (category === "Industry-Specific SaaS") {
    sections.add("security");
    sections.add("useCases");
    sections.add("testimonials");
  }
}

function addStageBasedSections(sections: Set<string>, stage: string) {
  if (stage.includes("idea") || stage.includes("mvp") || stage.includes("early")) {
    sections.add("founderNote");
    sections.add("problem");
  }

  if (stage.includes("growth") || stage.includes("traction")) {
    sections.add("socialProof");
    sections.add("testimonials");
    sections.add("results");
  }

  if (stage.includes("scale") || stage.includes("series")) {
    sections.add("integrations");
    sections.add("security");
    sections.add("comparisonTable");
  }
}

function addIntentBasedSections(sections: Set<string>, intent: string) {
  if (intent === "pain-led") {
    sections.add("problem");
    sections.add("results");
    sections.add("objectionHandling");
  } else if (intent === "desire-led") {
    sections.add("results");
    sections.add("beforeAfter");
    sections.add("socialProof");
  }
}

function addPricingBasedSections(sections: Set<string>, pricingModel: string, goal: string) {
  if (["buy-now", "subscribe", "free-trial"].includes(goal)) {
    sections.add("pricing");
  }

  if (pricingModel === "custom-quote") {
    sections.add("objectionHandling");
  }

  if (["per-seat", "custom-quote"].includes(pricingModel)) {
    sections.add("security");
    sections.add("integrations");
  }
}

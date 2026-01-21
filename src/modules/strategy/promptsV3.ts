// Simplified strategy prompt for V3 onboarding flow
// Reference: SecondOpinion.md

import type { LandingGoal } from '@/types/generation';

export interface SimplifiedStrategyPromptInput {
  productName: string;
  oneLiner: string;
  features: string[];
  landingGoal: LandingGoal;
  offer: string;
  primaryAudience: string;
  otherAudiences: string[];
  categories: string[];
}

/**
 * Build simplified strategy prompt for V3 onboarding
 * Combines awareness detection, oneReader, oneIdea, vibe, featureAnalysis, and section decisions
 */
export function buildSimplifiedStrategyPrompt(input: SimplifiedStrategyPromptInput): string {
  const {
    productName,
    oneLiner,
    features,
    landingGoal,
    offer,
    primaryAudience,
    otherAudiences,
    categories,
  } = input;

  const isWaitlist = landingGoal === 'waitlist';

  return `You are a landing page strategist. Analyze the product and create a conversion-optimized strategy.

## Product Information

**Name:** ${productName}
**Description:** ${oneLiner}
**Landing Goal:** ${landingGoal}
**Offer:** ${offer}
**Categories:** ${categories.join(', ')}

## Target Audience

**Primary:** ${primaryAudience}
${otherAudiences.length > 0 ? `**Other audiences:** ${otherAudiences.join(', ')}` : ''}

## Features

${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

---

## Your Task

Generate a JSON response with the following structure:

### Step 1: awareness
Choose ONE awareness level that will resonate with the most number of users:

- "problem-aware-cold": Knows problem exists but low emotional intensity. Not urgently seeking solutions. Needs to be reminded why this matters.
- "problem-aware-hot": Feels the pain intensely. Actively frustrated. Urgently wants relief. "Hair on fire" problem.
- "solution-aware-skeptical": Knows solutions exist. Has seen/tried alternatives. Hesitant, needs convincing why THIS one is different.
- "solution-aware-eager": Knows solutions exist. Ready to act. Just needs to confirm this is the right choice.

### Step 2: oneReader
Define the ONE ideal reader:
- personaDescription: Who they are (job title, situation, context) - be specific
- pain: Array of 3-5 pain points using their exact words/phrases
- desire: Array of 3-5 desires using their exact words/phrases
- objections: Array of 3-5 likely objections they'd have

### Step 3: oneIdea
Define the core value proposition:
- bigBenefit: The ultimate outcome they want (emotional/tangible result)
- uniqueMechanism: WHY/HOW this product works differently
- reasonToBelieve: The proof point that makes it credible

### Step 4: vibe
Choose the design personality:
- "Dark Tech": Modern, sophisticated, tech-forward
- "Light Trust": Clean, trustworthy, professional
- "Warm Friendly": Approachable, human, casual
- "Bold Energy": Dynamic, exciting, energetic
- "Calm Minimal": Simple, peaceful, focused

### Step 5: featureAnalysis
For each feature provided, create:
- feature: The raw feature (from input)
- benefit: What the user directly gets from this feature
- benefitOfBenefit: The emotional/life impact of that benefit

### Step 6: sectionDecisions
Decide which optional sections to include.

IMPORTANT: Be selective. Include AT MOST 1-2 of the first three sections. Default to false unless there's a STRONG case. More sections ≠ better conversion.

- includeBeforeAfter: true/false
  YES when: Transformation is VISUAL and emotionally striking. Clear painful "before" state and aspirational "after" state.
  Examples: fitness (body transformation), design tools (ugly→beautiful), productivity (chaos→organized)
  NO when: Abstract/technical products. B2B tools where transformation isn't visual. "After" is just "it works better".

- includeUniqueMechanism: true/false
  YES when: Genuinely novel approach that can be explained in ONE sentence. Clear differentiation from obvious competitors.
  Examples: Proprietary algorithm, contrarian methodology, unique framework
  NO when: "AI-powered" (not unique anymore). Standard technology. Mechanism is too technical to explain simply.

- includeObjectionHandle: true/false
  YES when: You chose "solution-aware-skeptical" above AND there are specific, well-known objections you can actually overcome.
  Examples: "I've tried similar tools before", "My team won't adopt it", "It's too expensive"
  NO when: Audience is eager (don't plant doubts). Objections would raise concerns they didn't have. You can't convincingly address them.

- isB2B: true/false - Is this a B2B product targeting businesses/professionals? Consider: categories include "SaaS", "Enterprise", "B2B"; audiences mention "teams", "companies", "businesses", "founders", "developers".

${isWaitlist ? `
NOTE: This is a WAITLIST page (pre-product). The section decisions still matter for understanding the product, but the actual sections used will follow the Waitlist template.
` : ''}

---

Output valid JSON only. No explanations or markdown.`;
}

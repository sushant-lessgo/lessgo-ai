/**
 * Strategy generation prompt templates.
 */
import type { IVOC, LandingGoal, AssetAvailability } from '@/types/generation';

interface StrategyPromptInput {
  productName: string;
  oneLiner: string;
  features: string[];  // Simple list - AI extracts benefits
  landingGoal: LandingGoal;
  offer: string;
  ivoc: IVOC;
  primaryAudience: string;
  otherAudiences: string[];
  assets: AssetAvailability;
}

export function buildStrategyPrompt(input: StrategyPromptInput): string {
  const {
    productName,
    oneLiner,
    features,
    landingGoal,
    offer,
    ivoc,
    primaryAudience,
    otherAudiences,
    assets,
  } = input;

  const featuresFormatted = features
    .map((f) => `- ${f}`)
    .join('\n');

  const audiencesFormatted = otherAudiences.length > 0
    ? `Primary: ${primaryAudience}\nOther personas: ${otherAudiences.join(', ')}`
    : `Primary: ${primaryAudience}`;

  return `You are a landing page strategist.

## Product
- Name: ${productName}
- Description: ${oneLiner}
- Goal: ${landingGoal}
- Offer: ${offer}

## Target Audience
${audiencesFormatted}

## Features
${featuresFormatted}

## Voice of Customer Research
Pains: ${JSON.stringify(ivoc.pains)}
Desires: ${JSON.stringify(ivoc.desires)}
Objections: ${JSON.stringify(ivoc.objections)}
Firm Beliefs: ${JSON.stringify(ivoc.firmBeliefs)}
Shakable Beliefs: ${JSON.stringify(ivoc.shakableBeliefs)}
Common Phrases: ${JSON.stringify(ivoc.commonPhrases)}

## Available Assets
- Testimonials: ${assets.hasTestimonials ? 'yes' : 'no'}
- Social proof (logos, user count): ${assets.hasSocialProof ? 'yes' : 'no'}
- Concrete results (stats, case studies): ${assets.hasConcreteResults ? 'yes' : 'no'}

## Your Task

1. Define ONE READER (the primary target from the research):
   - who: Specific person description (job, situation, context)
   - coreDesire: What they want most (use their words from research)
   - corePain: What hurts most (use their words from research)
   - beliefs: What they believe about this problem
   - awareness: One of: unaware, problem-aware, solution-aware, product-aware, most-aware
   - sophistication: One of: low, medium, high
   - emotionalState: How they feel (frustrated, overwhelmed, motivated, skeptical, etc.)

2. Define ONE IDEA (value proposition):
   - bigBenefit: Ultimate outcome they get
   - uniqueMechanism: Why/how this product works differently
   - reasonToBelieve: Proof point or credibility

3. Analyze FEATURES:
   For each feature listed, derive:
   - benefit: What the user gets from this feature
   - benefitOfBenefit: Emotional/life impact (why it matters)

4. Select VIBE:
   Choose one: "Dark Tech", "Light Trust", "Warm Friendly", "Bold Energy", "Calm Minimal"
   Based on audience expectations and product personality.

5. Generate OBJECTIONS + SECTION MAPPING:
   Role-play as the One Reader seeing the One Idea.
   What thoughts/concerns arise in sequence as they read?
   For each thought, pick the BEST section to address it.

   Available sections for mapping:
   - Problem: "Do you understand my pain?"
   - BeforeAfter: "What transformation do I get?"
   - Features: "What do I get?"
   - UniqueMechanism: "Why is this different?"
   - HowItWorks: "How do I use it?"
   - Testimonials: "Are there people like me?" (only if hasTestimonials)
   - SocialProof: "Is this legit? Who else uses this?" (only if hasSocialProof)
   - Results: "Does it work?" (only if hasConcreteResults)
   - Pricing: "How much?"
   - ObjectionHandle: "What about [risk]?"
   - FAQ: "Small questions"
   - UseCases: "Is this for me?"
   - FounderNote: "Who's behind this?"

6. Output SECTION ORDER:
   Fixed structure: Header (first), Hero (second), [middle sections], CTA (near end), Footer (last)
   Fill middle with sections from objection mapping, deduplicated, in the order objections arise.
   Do NOT include sections for assets the user doesn't have.

Output valid JSON matching this exact schema:
{
  "vibe": "one of the 5 vibes",
  "oneReader": {
    "who": "...",
    "coreDesire": "...",
    "corePain": "...",
    "beliefs": "...",
    "awareness": "unaware|problem-aware|solution-aware|product-aware|most-aware",
    "sophistication": "low|medium|high",
    "emotionalState": "..."
  },
  "oneIdea": {
    "bigBenefit": "...",
    "uniqueMechanism": "...",
    "reasonToBelieve": "..."
  },
  "featureAnalysis": [
    { "feature": "...", "benefit": "...", "benefitOfBenefit": "..." }
  ],
  "objections": [
    { "thought": "reader's thought/concern", "section": "SectionName" }
  ],
  "sections": ["Header", "Hero", "...", "CTA", "Footer"]
}

Output JSON only, no explanation.`;
}

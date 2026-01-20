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

/**
 * Build the enhanced strategy prompt with two-phase objection flow.
 * Phase 1: List ALL objections (pure psychology)
 * Phase 2: Group objections → map to sections (many:1)
 */
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

  // Build available proof sections based on assets
  const proofSections: string[] = [];
  if (assets.hasTestimonials) proofSections.push('Testimonials');
  if (assets.hasSocialProof) proofSections.push('SocialProof');
  if (assets.hasConcreteResults) proofSections.push('Results');

  return `You are a landing page strategist specializing in conversion psychology.

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

---

## Your Task

### Step 1: Define ONE READER
Create a specific target persona from the research:
- who: Specific person (job, situation, context)
- coreDesire: What they want most (use their words)
- corePain: What hurts most (use their words)
- beliefs: What they believe about this problem
- awareness: unaware | problem-aware | solution-aware | product-aware | most-aware
- sophistication: low | medium | high
- emotionalState: frustrated | overwhelmed | motivated | skeptical | hopeful | etc.

### Step 2: Define ONE IDEA
Core value proposition:
- bigBenefit: Ultimate outcome they get
- uniqueMechanism: Why/how this product works differently
- reasonToBelieve: Proof point or credibility

### Step 3: Analyze FEATURES
For each feature, derive:
- benefit: What the user gets
- benefitOfBenefit: Emotional/life impact (why it matters)

### Step 4: Select VIBE
Choose one: "Dark Tech" | "Light Trust" | "Warm Friendly" | "Bold Energy" | "Calm Minimal"

### Step 5: Assess FRICTION
Based on the landing goal and offer, determine how much convincing is needed.
- Low friction: free trial, no credit card, waitlist, download
- Medium friction: free trial with CC, freemium signup, demo booking
- High friction: paid plans, annual commitments, enterprise deals

Output your assessment as:
- level: low | medium | high
- reasoning: Brief explanation of why

### Step 6: List ALL OBJECTIONS (Pure Psychology)
Role-play as the One Reader landing on this page for the first time.
List EVERY thought, concern, question, or hesitation that arises as they read.

For each objection:
- thought: The reader's internal question/concern
- theme: Categorize as one of: trust | risk | fit | how | what | price | effort
- intensity: low (generic concern) | medium (shakable belief) | high (firm belief from research)
- preHandledByHero: true if the Hero/offer already addresses this (e.g., "free trial no CC" handles risk objections)

**Principles for objection listing:**
- Be exhaustive - list every concern, even small ones
- Firm beliefs from research = high intensity
- Shakable beliefs = medium intensity
- Generic concerns not in research = low intensity
- Common objections pre-handled by Hero: free trial risk, no CC commitment, money-back guarantee

### Step 7: Group Objections → Map to Sections (Many:1)
Now strategically group objections and assign sections to address them.

**Available sections:**
- Problem: "Do you understand my pain?" → Empathy, recognition
- BeforeAfter: "What transformation do I get?" → Outcome visualization
- Features: "What do I get?" → Concrete deliverables
- UniqueMechanism: "Why is this different?" → Differentiation
- HowItWorks: "How do I use it?" → Process clarity
- Testimonials: "Are there people like me?" → Social proof (only if available)
- SocialProof: "Is this legit? Who else uses this?" → Trust signals (only if available)
- Results: "Does it work?" → Proof of effectiveness (only if available)
- Pricing: "How much?" → Value/cost clarity
- ObjectionHandle: "What about [risk]?" → Risk mitigation
- FAQ: "Small practical questions" → Cleanup
- UseCases: "Is this for me / my situation?" → Fit confirmation
- FounderNote: "Who's behind this?" → Personal connection

**Principles for section selection:**
1. **Many:1 mapping**: Multiple related objections can be resolved by ONE section. Group them.
2. **Hero pre-handles**: Skip sections for objections already handled by the offer (e.g., if "free trial no CC", don't add ObjectionHandle for risk).
3. **Proof sections**: Pick at most 1-2 proof sections (Testimonials/SocialProof/Results). Choose the strongest for this audience. Don't include all three.
4. **FAQ leniency**: Include FAQ if there are 3+ practical how-to questions in the research.
5. **Earn your place**: Each section must resolve at least one meaningful objection. No filler.
6. **Friction-based grouping**:
   - Low friction → aggressive grouping, fewer sections (5-7)
   - High friction → more sections to address each concern (7-9)
7. **Skip unavailable**: Never include Testimonials/SocialProof/Results if not available.

For each group:
- theme: The primary objection theme this group addresses
- objections: Array of related objections being resolved
- resolvedBy: The single section that addresses all these objections
- reasoning: Why this section is the best choice for this group

### Step 8: Output middleSections
Extract the unique sections from your objection groups.
Header, Hero, CTA, Footer are added automatically - do NOT include them.

---

## Output Schema

Output valid JSON matching this exact structure:

{
  "vibe": "one of 5 vibes",
  "oneReader": {
    "who": "...",
    "coreDesire": "...",
    "corePain": "...",
    "beliefs": "...",
    "awareness": "...",
    "sophistication": "...",
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
  "frictionAssessment": {
    "level": "low|medium|high",
    "reasoning": "..."
  },
  "allObjections": [
    { "thought": "...", "theme": "trust|risk|fit|how|what|price|effort", "intensity": "low|medium|high", "preHandledByHero": false }
  ],
  "objectionGroups": [
    {
      "theme": "trust",
      "objections": [{ "thought": "...", "theme": "trust", "intensity": "high" }],
      "resolvedBy": "Testimonials",
      "reasoning": "..."
    }
  ],
  "middleSections": ["Features", "HowItWorks", "..."]
}

Output JSON only, no explanation.`;
}

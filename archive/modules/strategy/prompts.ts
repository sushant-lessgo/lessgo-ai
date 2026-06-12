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
 * Objection flow mode - controls how AI processes objections to select sections
 * - grouped: Group objections by theme → assign section per group (original)
 * - sequential: Process each objection individually → argue resolution → minimize sections
 */
type ObjectionFlowMode = 'grouped' | 'sequential';

/**
 * Get objection flow mode from environment variable
 */
function getObjectionFlowMode(): ObjectionFlowMode {
  const mode = process.env.OBJECTION_FLOW_MODE;
  return mode === 'sequential' ? 'sequential' : 'grouped';
}

/**
 * Build strategy prompt - delegates to appropriate mode
 */
export function buildStrategyPrompt(input: StrategyPromptInput): string {
  const mode = getObjectionFlowMode();
  console.log(`[DEV] [strategy] Using objection flow mode: ${mode}`);
  return mode === 'sequential'
    ? buildSequentialStrategyPrompt(input)
    : buildGroupedStrategyPrompt(input);
}

/**
 * Build the enhanced strategy prompt with two-phase objection flow.
 * Phase 1: List ALL objections (pure psychology)
 * Phase 2: Group objections → map to sections (many:1)
 */
function buildGroupedStrategyPrompt(input: StrategyPromptInput): string {
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

/**
 * Build strategy prompt with sequential objection resolution.
 * AI processes each objection individually and argues whether to add a section.
 */
function buildSequentialStrategyPrompt(input: StrategyPromptInput): string {
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

For each objection, output ONLY:
- thought: The reader's internal question/concern
- intensity: low (generic concern) | medium (shakable belief) | high (firm belief from research)

**Principles for objection listing:**
- Be exhaustive - list every concern, even small ones
- Firm beliefs from research = high intensity
- Shakable beliefs = medium intensity
- Generic concerns not in research = low intensity
- Do NOT categorize by theme yet - you will analyze this in Step 7

### Step 7: Sequential Objection Resolution

Process EACH objection from Step 6 one by one. For each objection, analyze and argue:

1. **Infer theme**: What type of concern is this? (trust | risk | fit | how | what | price | effort)
2. **Pre-handled check**: Does the Hero/offer already address this? (e.g., "free trial no CC" handles risk/price concerns)
3. **Candidate sections**: Which section(s) COULD address this objection?
4. **Already covered?**: Has a previously chosen section already resolved this?
5. **Decision**: ADD a new section, or SKIP (already covered / pre-handled / too low priority)

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

**Decision principles:**
1. **Minimum viable sections**: Only add if truly needed - fewer sections = better
2. **High intensity first**: Firm beliefs (high) deserve dedicated sections
3. **Coverage check**: If a section you already chose handles this, skip
4. **Pre-handled = skip**: If Hero/offer already addresses it, skip
5. **Low intensity = aggressive skip**: Generic concerns often handled by other sections
6. **Asset constraints**: Never add Testimonials/SocialProof/Results if not available
7. **Proof limit**: At most 1-2 proof sections total
8. **Friction awareness**:
   - Low friction → aim for 5-6 middle sections
   - High friction → can go up to 7-8 middle sections

### Step 8: Output middleSections
Extract the unique sections from your resolutions where decision = "add".
Order them in persuasion sequence: Problem → BeforeAfter → UniqueMechanism → Features → HowItWorks → [Proof] → Pricing → FAQ → UseCases
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
    { "thought": "...", "intensity": "low|medium|high" }
  ],
  "objectionResolutions": [
    {
      "thought": "Is this just another fitness app that will sit unused?",
      "intensity": "high",
      "inferredTheme": "trust",
      "preHandledByHero": false,
      "candidateSections": ["Testimonials", "SocialProof"],
      "alreadyCoveredBy": null,
      "decision": "add",
      "chosenSection": "Testimonials",
      "reasoning": "High intensity trust concern - firm belief that apps don't work. Needs social proof from real users."
    },
    {
      "thought": "Will customer service help if I have issues?",
      "intensity": "low",
      "inferredTheme": "trust",
      "preHandledByHero": false,
      "candidateSections": ["Testimonials", "FAQ"],
      "alreadyCoveredBy": "Testimonials",
      "decision": "skip",
      "chosenSection": null,
      "reasoning": "Low intensity, already covered by Testimonials showing real user experiences."
    }
  ],
  "middleSections": ["Features", "HowItWorks", "..."]
}

Output JSON only, no explanation.`;
}

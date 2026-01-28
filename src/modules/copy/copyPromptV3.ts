// src/modules/copy/copyPromptV3.ts
// V3 copy prompt builder - uses SimplifiedStrategyOutput

import type { SimplifiedStrategyOutput, SectionType, LandingGoal, Vibe } from '@/types/generation';
import {
  layoutElementSchema,
  getAllElements,
  getCardRequirements,
  type LayoutElement,
  type CardRequirements,
} from '@/modules/sections/layoutElementSchema';
import { getToneProfileForVibe } from '@/modules/Design/vibeMapping';

export interface CopyPromptV3Input {
  strategy: SimplifiedStrategyOutput;
  uiblocks: Record<string, string>;
  productName: string;
  oneLiner: string;
  offer: string;
  landingGoal: LandingGoal;
  features: string[];
}

/**
 * Format element for prompt with constraints
 */
function formatElement(element: LayoutElement): string {
  const parts: string[] = [];

  parts.push(`- ${element.element}`);

  if (element.charLimit) {
    parts.push(`(max ${element.charLimit} chars)`);
  }

  parts.push(element.mandatory ? '[REQUIRED]' : '[optional, null to exclude]');

  if (element.generation === 'ai_generated_needs_review') {
    parts.push('[NEEDS_REVIEW]');
  }

  return parts.join(' ');
}

/**
 * Format card requirements for prompt
 */
function formatCardRequirements(req: CardRequirements | null): string {
  if (!req) return '';
  return `Cards: min ${req.min}, max ${req.max}, optimal ${req.optimal[0]}-${req.optimal[1]}`;
}

/**
 * Get AI-generatable elements for a layout
 */
function getAIElements(layoutName: string): LayoutElement[] {
  const schema = layoutElementSchema[layoutName];
  if (!schema) return [];

  const elements = getAllElements(schema);
  return elements.filter(
    (e) =>
      e.generation === 'ai_generated' ||
      e.generation === 'ai_generated_needs_review'
  );
}

/**
 * Build section specification for prompt
 */
function buildSectionSpec(section: SectionType, layoutName: string): string {
  const schema = layoutElementSchema[layoutName];
  if (!schema) {
    return `### ${section} (${layoutName})\nNo schema available`;
  }

  const elements = getAIElements(layoutName);
  const cardReq = getCardRequirements(schema);

  const lines: string[] = [`### ${section} (${layoutName})`];

  if (cardReq) {
    lines.push(formatCardRequirements(cardReq));
  }

  lines.push('Elements:');
  for (const el of elements) {
    lines.push(formatElement(el));
  }

  return lines.join('\n');
}

/**
 * Get tone guidance based on vibe
 */
function getToneGuidance(vibe: Vibe): string {
  const toneMap: Record<string, string> = {
    'minimal-technical': 'Be precise, direct, no fluff. Use technical terminology where appropriate. Short sentences.',
    'friendly-helpful': 'Warm but professional. Empathetic to pain points. Clear value propositions.',
    'confident-playful': 'Energetic and engaging. Use conversational tone. Light humor ok if appropriate.',
    'bold-persuasive': 'Strong claims backed by specifics. Action-oriented. Create urgency naturally.',
    'luxury-expert': 'Sophisticated language. Imply exclusivity. Focus on outcomes over features.',
  };

  const toneProfile = getToneProfileForVibe(vibe);
  return toneMap[toneProfile] || 'Match the vibe in tone and word choice.';
}

/**
 * Get element schemas for repeaters
 */
function getElementSchemas(): string {
  return `
Element schemas (for repeaters/arrays):
- faq_items: array of { question: string, answer: string }
- features: array of { id: string, title: string, description: string } (IconGrid - id is auto-generated, icon computed at render)
- feature_cards: array of { headline: string, description: string, icon?: string }
- testimonial_cards: array of { quote: string, author: string, title?: string, company?: string } [NEEDS_REVIEW]
- pricing_tiers: array of { name: string, price: string, features: string[], cta: string } [NEEDS_REVIEW]
- stat_blocks: array of { value: string, label: string, description?: string } [NEEDS_REVIEW]
- steps: array of { title: string, description: string, number?: number }
- pain_items: array of { id: string, point: string, description: string } (StackedPainBullets - id auto-generated)
- trust_items: array of { id: string, text: string } (Hero sections - id auto-generated)
- before_points: array of { id: string, text: string }
- after_points: array of { id: string, text: string }
- benefits: array of { text: string, icon?: string }`;
}

/**
 * Map V3 awareness to emotional context
 */
function getEmotionalContext(awareness: string): string {
  const contextMap: Record<string, string> = {
    'problem-aware-cold': 'Reader knows the problem exists but isn\'t actively seeking solutions. Needs to be reminded why this matters.',
    'problem-aware-hot': 'Reader feels the pain intensely and urgently wants relief. "Hair on fire" situation.',
    'solution-aware-skeptical': 'Reader has seen/tried alternatives and is hesitant. Needs convincing why THIS is different.',
    'solution-aware-eager': 'Reader is ready to act. Just needs to confirm this is the right choice.',
  };
  return contextMap[awareness] || 'Reader is exploring options.';
}

/**
 * Build the V3 copy generation prompt
 */
export function buildCopyPromptV3(input: CopyPromptV3Input): string {
  const { strategy, uiblocks, productName, oneLiner, offer, landingGoal, features } = input;

  // Build section specs
  const sectionSpecs = strategy.sections
    .map((section) => {
      const layout = uiblocks[section];
      if (!layout) return null;
      return buildSectionSpec(section, layout);
    })
    .filter(Boolean)
    .join('\n\n');

  // Build feature analysis section
  const featureAnalysis = strategy.featureAnalysis
    .map((f) => `- ${f.feature}: ${f.benefitOfBenefit}`)
    .join('\n');

  const prompt = `## IDENTITY
You are a conversion copywriter creating landing page copy for a ${strategy.vibe} style page.

## PRODUCT
Name: ${productName}
One-liner: ${oneLiner}
Offer: ${offer}
Goal: ${landingGoal}

## TARGET READER
${strategy.oneReader.personaDescription}

Awareness Level: ${strategy.awareness}
${getEmotionalContext(strategy.awareness)}

## THEIR PAIN POINTS
${strategy.oneReader.pain.map((p) => `- ${p}`).join('\n')}

## THEIR DESIRES
${strategy.oneReader.desire.map((d) => `- ${d}`).join('\n')}

## THEIR LIKELY OBJECTIONS
${strategy.oneReader.objections.map((o) => `- ${o}`).join('\n')}

## ONE IDEA (Core Message)
Big Benefit: ${strategy.oneIdea.bigBenefit}
Unique Mechanism: ${strategy.oneIdea.uniqueMechanism}
Reason to Believe: ${strategy.oneIdea.reasonToBelieve}

## FEATURE ANALYSIS
${featureAnalysis}

## USER-PROVIDED FEATURES
${features.map((f) => `- ${f}`).join('\n')}

## TONE
${getToneGuidance(strategy.vibe)}

## SECTIONS TO GENERATE

${sectionSpecs}

${getElementSchemas()}

## RULES (MUST FOLLOW)
1. Respect character limits strictly
2. Respect card count min/max - aim for optimal range
3. NO placeholder text - all copy must be real, usable content
4. NO invented statistics, customer names, company names, or exact numbers
5. For NEEDS_REVIEW elements: write realistic copy but use general terms (e.g., "significant increase" not "47% increase")
6. For arrays: return the actual array, respecting min/max counts
7. Return ONLY valid JSON. No markdown, no commentary, no explanation.
8. Every section listed must have output
9. Use the user's feature list to inform feature-related sections
10. Address their objections naturally in relevant sections

## OUTPUT FORMAT
Return a JSON object where each key is a section name and value has "elements" object:

{
  "Hero": {
    "elements": {
      "headline": "Your compelling headline",
      "subheadline": "Supporting text here",
      "trust_items": [
        { "id": "t1", "text": "Free trial" },
        { "id": "t2", "text": "No credit card" }
      ]
    }
  },
  "Features": {
    "elements": {
      "headline": "Features headline",
      "features": [
        { "id": "f1", "title": "Feature 1", "description": "Desc 1" },
        { "id": "f2", "title": "Feature 2", "description": "Desc 2" }
      ]
    }
  }
}

Optional elements can be set to null to exclude them.
NEEDS_REVIEW elements should still have good copy, just without invented specifics.

Generate copy now:`;

  return prompt;
}

/**
 * Build retry prompt when parsing fails
 */
export function buildCopyRetryPromptV3(
  originalPrompt: string,
  parseError: string,
  invalidSnippet: string
): string {
  return `${originalPrompt}

---
PREVIOUS ATTEMPT FAILED TO PARSE

Error: ${parseError}
Invalid snippet: ${invalidSnippet.slice(0, 500)}

Please fix and return valid JSON only. Common issues:
- Trailing commas
- Unescaped quotes in strings
- Missing closing braces
- Comments in JSON

Return the complete, valid JSON response:`;
}

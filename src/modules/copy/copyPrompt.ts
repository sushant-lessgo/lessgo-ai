// src/modules/copy/copyPrompt.ts
// Builds prompt for AI copy generation

import type { StrategyOutput, SectionType, LandingGoal, Vibe } from '@/types/generation';
import {
  layoutElementSchema,
  isUnifiedSchema,
  getAllElements,
  getCardRequirements,
  type LayoutElement,
  type CardRequirements,
} from '@/modules/sections/layoutElementSchema';
import { getToneProfileForVibe } from '@/modules/Design/vibeMapping';

export interface CopyPromptInput {
  strategy: StrategyOutput;
  uiblocks: Record<SectionType, string>;
  productName: string;
  oneLiner: string;
  offer: string;
  landingGoal: LandingGoal;
  features: string[];  // Simple list - benefits in strategy.featureAnalysis
}

/**
 * Format element for prompt with constraints
 */
function formatElement(element: LayoutElement): string {
  const parts: string[] = [];

  // Element name
  parts.push(`- ${element.element}`);

  // Character limit
  if (element.charLimit) {
    parts.push(`(max ${element.charLimit} chars)`);
  }

  // Required/optional
  parts.push(element.mandatory ? '[REQUIRED]' : '[optional, null to exclude]');

  // Needs review flag
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
 * Excludes manual_preferred elements
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
function buildSectionSpec(
  section: SectionType,
  layoutName: string
): string {
  const schema = layoutElementSchema[layoutName];
  if (!schema) {
    return `### ${section} (${layoutName})\nNo schema available`;
  }

  const elements = getAIElements(layoutName);
  const cardReq = getCardRequirements(schema);

  const lines: string[] = [
    `### ${section} (${layoutName})`,
  ];

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
 * Build element schema reference for common repeaters
 */
function getElementSchemas(): string {
  return `
Element schemas (for repeaters/arrays):
- faq_items: array of { question: string, answer: string }
- feature_cards: array of { headline: string, description: string, icon?: string }
- testimonial_cards: array of { quote: string, author: string, title?: string, company?: string } [NEEDS_REVIEW]
- pricing_tiers: array of { name: string, price: string, features: string[], cta: string } [NEEDS_REVIEW]
- stat_blocks: array of { value: string, label: string, description?: string } [NEEDS_REVIEW]
- steps: array of { title: string, description: string, number?: number }
- pain_points: array of { text: string, icon?: string }
- benefits: array of { text: string, icon?: string }`;
}

/**
 * Build the complete copy generation prompt
 */
export function buildCopyPrompt(input: CopyPromptInput): string {
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

## ONE READER
Who: ${strategy.oneReader.who}
Core Desire: ${strategy.oneReader.coreDesire}
Core Pain: ${strategy.oneReader.corePain}
Beliefs: ${strategy.oneReader.beliefs}
Awareness: ${strategy.oneReader.awareness}
Emotional State: ${strategy.oneReader.emotionalState}

## ONE IDEA
Big Benefit: ${strategy.oneIdea.bigBenefit}
Unique Mechanism: ${strategy.oneIdea.uniqueMechanism}
Reason to Believe: ${strategy.oneIdea.reasonToBelieve}

## OBJECTIONS TO ADDRESS
${strategy.objections.map((o) => `- ${o.thought} (address in ${o.section})`).join('\n')}

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

## OUTPUT FORMAT
Return a JSON object where each key is a section name and value has "elements" object:

{
  "Hero": {
    "elements": {
      "headline": "Your compelling headline",
      "subheadline": "Supporting text here"
    }
  },
  "Features": {
    "elements": {
      "headline": "Features headline",
      "feature_cards": [
        { "headline": "Feature 1", "description": "Desc 1" },
        { "headline": "Feature 2", "description": "Desc 2" }
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
export function buildCopyRetryPrompt(
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

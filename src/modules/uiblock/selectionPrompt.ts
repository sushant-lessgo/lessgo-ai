// src/modules/uiblock/selectionPrompt.ts
// Builds the prompt for AI UIBlock selection

import type { StrategyOutput, SectionType } from '@/types/generation';
import { getLayoutNames } from './layoutNames';
import { formatLayoutWithTags, getTags } from './uiblockTags';

// Map SectionType to registry key
const sectionTypeToRegistryKey: Record<SectionType, string> = {
  Header: 'header',
  Hero: 'hero',
  CTA: 'cta',
  Footer: 'footer',
  Problem: 'problem',
  BeforeAfter: 'beforeAfter',
  Features: 'features',
  UniqueMechanism: 'uniqueMechanism',
  HowItWorks: 'howItWorks',
  Testimonials: 'testimonials',
  SocialProof: 'socialProof',
  Results: 'results',
  FounderNote: 'founderNote',
  Pricing: 'pricing',
  ObjectionHandle: 'objectionHandling',
  FAQ: 'faq',
  UseCases: 'useCases'
};

/**
 * Get available layouts for a section type
 */
export function getLayoutsForSection(sectionType: SectionType): string[] {
  const registryKey = sectionTypeToRegistryKey[sectionType];
  if (!registryKey) return [];
  return getLayoutNames(registryKey);
}

/**
 * Format layouts with tags for prompt
 */
function formatLayoutsWithTags(layouts: string[]): string {
  return layouts.map(layout => `  - ${formatLayoutWithTags(layout)}`).join('\n');
}

/**
 * Build candidates section for prompt
 */
function buildCandidatesSection(sections: SectionType[]): string {
  const lines: string[] = ['CANDIDATES (with tags):'];

  for (const section of sections) {
    const layouts = getLayoutsForSection(section);
    if (layouts.length > 0) {
      lines.push(`\n${section}:`);
      lines.push(formatLayoutsWithTags(layouts));
    }
  }

  return lines.join('\n');
}

/**
 * Count personas from strategy
 */
function countPersonas(strategy: StrategyOutput): number {
  // One Reader is always 1, plus any other audiences
  const otherAudiences = (strategy as any).otherAudiences;
  if (Array.isArray(otherAudiences)) {
    return 1 + otherAudiences.length;
  }
  return 1;
}

/**
 * Build the UIBlock selection prompt
 */
export function buildSelectionPrompt(
  strategy: StrategyOutput,
  productName: string
): string {
  const personasCount = countPersonas(strategy);
  const personaNote = personasCount > 1 ? 'prefer persona-aware blocks' : '';

  const prompt = `You are selecting UIBlock layouts for a landing page.

Product: ${productName}
Vibe: ${strategy.vibe}
Reader: ${strategy.oneReader.who} (${strategy.oneReader.awareness})
Personas: ${personasCount} ${personaNote ? `(${personaNote})` : ''}

Sections to assign: ${strategy.sections.join(', ')}

RULES (MUST FOLLOW):
- Max 2 text-heavy blocks in sequence
- Max 1 accordion-style per page
- At least 1 image-based in middle third
- If personasCount > 1, prefer persona-aware blocks
- Return EXACTLY one layout (or null) per section listed. Do not invent sections.

${buildCandidatesSection(strategy.sections)}

Tag key: text-heavy, accordion, image, persona-aware

Output JSON (valid JSON only, no markdown):
{
  "selections": { "Section": "Layout" | null },
  "questions": [
    { "id": "Section.reason", "section": "Section", "question": "...", "options": ["LayoutA", "LayoutB"] }
  ]
}

Use null + question if uncertain. Options must be layout IDs from candidates.
This is a ONE-TIME question pass. No follow-up questions.`;

  return prompt;
}

/**
 * Build prompt for second pass with user answers
 */
export function buildSelectionPromptWithAnswers(
  strategy: StrategyOutput,
  productName: string,
  previousSelections: Partial<Record<SectionType, string | null>>,
  answers: Record<string, string>
): string {
  const basePrompt = buildSelectionPrompt(strategy, productName);

  const answersSection = Object.entries(answers)
    .map(([questionId, answer]) => `- ${questionId}: ${answer}`)
    .join('\n');

  const selectionsSection = Object.entries(previousSelections)
    .filter(([_, layout]) => layout !== null)
    .map(([section, layout]) => `- ${section}: ${layout}`)
    .join('\n');

  return `${basePrompt}

PREVIOUS SELECTIONS (already decided):
${selectionsSection || '(none yet)'}

USER ANSWERS:
${answersSection}

Now complete the remaining selections based on the user's answers.
Output only the remaining selections. Do not ask more questions.`;
}

/**
 * Parse AI response for UIBlock selection
 */
export interface ParsedSelectionResponse {
  selections: Partial<Record<SectionType, string | null>>;
  questions: Array<{
    id: string;
    section: SectionType;
    question: string;
    options: string[];
  }>;
}

export function parseSelectionResponse(responseText: string): ParsedSelectionResponse | null {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in selection response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate structure
    if (!parsed.selections || typeof parsed.selections !== 'object') {
      console.error('Invalid selections in response');
      return null;
    }

    return {
      selections: parsed.selections,
      questions: Array.isArray(parsed.questions) ? parsed.questions : []
    };
  } catch (error) {
    console.error('Failed to parse selection response:', error);
    return null;
  }
}

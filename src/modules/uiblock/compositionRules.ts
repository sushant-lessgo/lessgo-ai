// src/modules/uiblock/compositionRules.ts
// Validates and auto-fixes UIBlock composition rule violations

import type { SectionType } from '@/types/generation';
import { isTextHeavy, isAccordion, isImageBased, getTags } from './uiblockTags';
import { getLayoutsForSection } from './selectionPrompt';

export interface CompositionViolation {
  rule: string;
  description: string;
  affectedSections: SectionType[];
  suggestedFix?: string;
}

export interface CompositionValidationResult {
  valid: boolean;
  violations: CompositionViolation[];
}

/**
 * Validate composition rules for a set of UIBlock selections
 *
 * Rules:
 * 1. Max 2 text-heavy blocks in sequence
 * 2. Max 1 accordion-style block per page
 * 3. At least 1 image-based block in middle third
 */
export function validateComposition(
  sections: SectionType[],
  selections: Record<SectionType, string>
): CompositionValidationResult {
  const violations: CompositionViolation[] = [];

  // Rule 1: Max 2 text-heavy blocks in sequence
  const textHeavySequences = findTextHeavySequences(sections, selections);
  for (const sequence of textHeavySequences) {
    if (sequence.length > 2) {
      violations.push({
        rule: 'text-heavy-sequence',
        description: `${sequence.length} text-heavy blocks in sequence (max 2)`,
        affectedSections: sequence,
        suggestedFix: `Replace one of [${sequence.slice(2).join(', ')}] with an image-based layout`
      });
    }
  }

  // Rule 2: Max 1 accordion-style block per page
  const accordionSections = sections.filter(s =>
    selections[s] && isAccordion(selections[s])
  );
  if (accordionSections.length > 1) {
    violations.push({
      rule: 'accordion-limit',
      description: `${accordionSections.length} accordion blocks (max 1)`,
      affectedSections: accordionSections,
      suggestedFix: `Keep only one accordion: ${accordionSections[0]}`
    });
  }

  // Rule 3: At least 1 image-based block in middle third
  const middleThird = getMiddleThirdSections(sections);
  const hasImageInMiddle = middleThird.some(s =>
    selections[s] && isImageBased(selections[s])
  );
  if (!hasImageInMiddle && middleThird.length > 0) {
    violations.push({
      rule: 'image-in-middle',
      description: 'No image-based block in middle third',
      affectedSections: middleThird,
      suggestedFix: `Add image-based layout in one of [${middleThird.join(', ')}]`
    });
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Find sequences of text-heavy blocks
 */
function findTextHeavySequences(
  sections: SectionType[],
  selections: Record<SectionType, string>
): SectionType[][] {
  const sequences: SectionType[][] = [];
  let currentSequence: SectionType[] = [];

  for (const section of sections) {
    const layout = selections[section];
    if (layout && isTextHeavy(layout)) {
      currentSequence.push(section);
    } else {
      if (currentSequence.length > 0) {
        sequences.push([...currentSequence]);
        currentSequence = [];
      }
    }
  }

  // Don't forget the last sequence
  if (currentSequence.length > 0) {
    sequences.push(currentSequence);
  }

  return sequences;
}

/**
 * Get sections in the middle third of the page
 */
function getMiddleThirdSections(sections: SectionType[]): SectionType[] {
  const len = sections.length;
  if (len < 3) return sections;

  const startIdx = Math.floor(len / 3);
  const endIdx = Math.floor(2 * len / 3);

  return sections.slice(startIdx, endIdx);
}

/**
 * Auto-fix composition violations by swapping layouts
 */
export function autoFixComposition(
  sections: SectionType[],
  selections: Record<SectionType, string>
): Record<SectionType, string> {
  const fixed = { ...selections };
  let changed = true;
  let iterations = 0;
  const maxIterations = 10;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    const validation = validateComposition(sections, fixed);
    if (validation.valid) break;

    for (const violation of validation.violations) {
      if (violation.rule === 'accordion-limit') {
        // Keep only the first accordion
        const accordionSections = sections.filter(s =>
          fixed[s] && isAccordion(fixed[s])
        );
        for (let i = 1; i < accordionSections.length; i++) {
          const section = accordionSections[i];
          const alternatives = getLayoutsForSection(section)
            .filter(l => !isAccordion(l));
          if (alternatives.length > 0) {
            fixed[section] = alternatives[0];
            changed = true;
          }
        }
      }

      if (violation.rule === 'text-heavy-sequence') {
        // Swap third+ text-heavy in sequence to image-based
        const affectedSections = violation.affectedSections.slice(2);
        for (const section of affectedSections) {
          const alternatives = getLayoutsForSection(section)
            .filter(l => isImageBased(l));
          if (alternatives.length > 0) {
            fixed[section] = alternatives[0];
            changed = true;
            break; // Fix one at a time
          }
        }
      }

      if (violation.rule === 'image-in-middle') {
        // Try to swap one middle section to image-based
        for (const section of violation.affectedSections) {
          const alternatives = getLayoutsForSection(section)
            .filter(l => isImageBased(l));
          if (alternatives.length > 0) {
            fixed[section] = alternatives[0];
            changed = true;
            break;
          }
        }
      }
    }
  }

  return fixed;
}

/**
 * Check if selections need fixing and return fixed version
 */
export function ensureValidComposition(
  sections: SectionType[],
  selections: Record<SectionType, string>
): {
  selections: Record<SectionType, string>;
  wasFixed: boolean;
  originalViolations: CompositionViolation[];
} {
  const validation = validateComposition(sections, selections);

  if (validation.valid) {
    return {
      selections,
      wasFixed: false,
      originalViolations: []
    };
  }

  const fixed = autoFixComposition(sections, selections);

  return {
    selections: fixed,
    wasFixed: true,
    originalViolations: validation.violations
  };
}

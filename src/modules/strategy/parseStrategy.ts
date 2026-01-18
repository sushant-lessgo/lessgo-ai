/**
 * Parse and normalize strategy output from LLM.
 */
import { logger } from '@/lib/logger';
import type {
  StrategyOutput,
  Vibe,
  AwarenessLevel,
  SophisticationLevel,
  SectionType,
  isValidVibe,
  isValidAwarenessLevel,
  isValidSophisticationLevel,
  isValidSectionType,
} from '@/types/generation';
import {
  vibes,
  awarenessLevels,
  sophisticationLevels,
  sectionTypes,
} from '@/types/generation';

/**
 * Normalize awareness level from LLM output.
 * Handles variations like "Solution-aware" -> "solution-aware"
 */
function normalizeAwareness(value: string): AwarenessLevel {
  const normalized = value.toLowerCase().trim();
  if (awarenessLevels.includes(normalized as AwarenessLevel)) {
    return normalized as AwarenessLevel;
  }
  // Default to solution-aware if unknown
  logger.warn(`Unknown awareness level: ${value}, defaulting to solution-aware`);
  return 'solution-aware';
}

/**
 * Normalize sophistication level from LLM output.
 */
function normalizeSophistication(value: string): SophisticationLevel {
  const normalized = value.toLowerCase().trim();
  if (sophisticationLevels.includes(normalized as SophisticationLevel)) {
    return normalized as SophisticationLevel;
  }
  logger.warn(`Unknown sophistication level: ${value}, defaulting to medium`);
  return 'medium';
}

/**
 * Normalize vibe from LLM output.
 */
function normalizeVibe(value: string): Vibe {
  // Try exact match first
  if (vibes.includes(value as Vibe)) {
    return value as Vibe;
  }
  // Try case-insensitive match
  const found = vibes.find(v => v.toLowerCase() === value.toLowerCase());
  if (found) return found;

  logger.warn(`Unknown vibe: ${value}, defaulting to Light Trust`);
  return 'Light Trust';
}

/**
 * Normalize section type from LLM output.
 */
function normalizeSectionType(value: string): SectionType | null {
  // Try exact match first
  if (sectionTypes.includes(value as SectionType)) {
    return value as SectionType;
  }
  // Try case-insensitive match
  const found = sectionTypes.find(
    (s) => s.toLowerCase() === value.toLowerCase()
  );
  if (found) return found;

  logger.warn(`Unknown section type: ${value}, skipping`);
  return null;
}

/**
 * Parse raw LLM response into StrategyOutput.
 */
export function parseStrategyResponse(
  content: string
): { success: true; data: StrategyOutput } | { success: false; error: string } {
  try {
    const parsed = JSON.parse(content);

    // Validate required fields
    if (!parsed.vibe || !parsed.oneReader || !parsed.oneIdea || !parsed.sections) {
      return { success: false, error: 'Missing required fields in strategy output' };
    }

    // Normalize values
    const strategy: StrategyOutput = {
      vibe: normalizeVibe(parsed.vibe),
      oneReader: {
        who: parsed.oneReader.who || '',
        coreDesire: parsed.oneReader.coreDesire || '',
        corePain: parsed.oneReader.corePain || '',
        beliefs: parsed.oneReader.beliefs || '',
        awareness: normalizeAwareness(parsed.oneReader.awareness || 'solution-aware'),
        sophistication: normalizeSophistication(parsed.oneReader.sophistication || 'medium'),
        emotionalState: parsed.oneReader.emotionalState || 'neutral',
      },
      oneIdea: {
        bigBenefit: parsed.oneIdea.bigBenefit || '',
        uniqueMechanism: parsed.oneIdea.uniqueMechanism || '',
        reasonToBelieve: parsed.oneIdea.reasonToBelieve || '',
      },
      featureAnalysis: Array.isArray(parsed.featureAnalysis)
        ? parsed.featureAnalysis.map((f: any) => ({
            feature: f.feature || '',
            benefit: f.benefit || '',
            benefitOfBenefit: f.benefitOfBenefit || '',
          }))
        : [],
      objections: Array.isArray(parsed.objections)
        ? parsed.objections
            .map((o: any) => {
              const section = normalizeSectionType(o.section);
              if (!section) return null;
              return {
                thought: o.thought || '',
                section,
              };
            })
            .filter(Boolean)
        : [],
      sections: Array.isArray(parsed.sections)
        ? parsed.sections
            .map((s: string) => normalizeSectionType(s))
            .filter((s: SectionType | null): s is SectionType => s !== null)
        : [],
    };

    return { success: true, data: strategy };
  } catch (error: any) {
    logger.error('Failed to parse strategy response:', error);
    return { success: false, error: error.message || 'JSON parse error' };
  }
}

// src/modules/copy/parseCopy.ts
// Parse and validate AI copy generation response

import type { SectionType, SectionCopy, ElementValue, ElementValueReview } from '@/types/generation';
import {
  layoutElementSchema,
  getAllElements,
  getCardRequirements,
  isUnifiedSchema,
  type CardRequirements,
} from '@/modules/sections/layoutElementSchema';

export interface ParseCopyResult {
  success: true;
  sections: Record<string, SectionCopy>;
}

export interface ParseCopyError {
  success: false;
  error: string;
  partialSections?: Record<string, SectionCopy>;
}

export type ParseCopyResponse = ParseCopyResult | ParseCopyError;

/**
 * Elements that should be marked with needsReview
 * Pattern: stats, testimonials, pricing, specific numbers
 */
const NEEDS_REVIEW_PATTERNS = [
  'stat_', 'metric_', 'number_', 'count_', 'percentage_',
  'quote', 'testimonial', 'author', 'company',
  'price', 'tier_', 'amount_',
  'result_', 'outcome_',
];

/**
 * Check if an element key should be marked needsReview
 */
function shouldMarkNeedsReview(key: string, layoutName: string): boolean {
  // Check schema first
  const schema = layoutElementSchema[layoutName];
  if (schema) {
    const elements = getAllElements(schema);
    const element = elements.find((e) => e.element === key);
    if (element?.generation === 'ai_generated_needs_review') {
      return true;
    }
  }

  // Fallback to pattern matching
  return NEEDS_REVIEW_PATTERNS.some((pattern) =>
    key.toLowerCase().includes(pattern)
  );
}

/**
 * Wrap a value with needsReview if applicable
 */
function maybeWrapNeedsReview(
  key: string,
  value: unknown,
  layoutName: string
): ElementValue {
  if (value === null) return null;

  const needsReview = shouldMarkNeedsReview(key, layoutName);

  // Handle arrays (testimonials, stats, pricing tiers)
  if (Array.isArray(value)) {
    if (needsReview) {
      // Each item in the array gets needsReview
      return value.map((item) => {
        if (typeof item === 'object' && item !== null) {
          return { ...item, needsReview: true };
        }
        return { value: String(item), needsReview: true };
      });
    }
    return value as Record<string, unknown>[];
  }

  // Handle strings
  if (typeof value === 'string') {
    if (needsReview) {
      return { value, needsReview: true } as ElementValueReview;
    }
    return value;
  }

  // Handle objects (shouldn't typically happen at top level)
  if (typeof value === 'object') {
    return value as Record<string, unknown>[];
  }

  return String(value);
}

/**
 * Validate and fix array lengths against schema requirements
 */
function validateArrayLength(
  arr: unknown[],
  requirements: CardRequirements
): { array: unknown[]; trimmed: boolean; belowMin: boolean } {
  let trimmed = false;
  let belowMin = false;

  // Trim to max if over
  if (arr.length > requirements.max) {
    arr = arr.slice(0, requirements.max);
    trimmed = true;
  }

  // Check if below min (will need retry or warning)
  if (arr.length < requirements.min) {
    belowMin = true;
  }

  return { array: arr, trimmed, belowMin };
}

/**
 * Process a section's elements
 */
function processSection(
  sectionName: string,
  layoutName: string,
  rawElements: Record<string, unknown>
): { elements: Record<string, ElementValue>; warnings: string[] } {
  const schema = layoutElementSchema[layoutName];
  const cardReq = schema ? getCardRequirements(schema) : null;
  const warnings: string[] = [];

  const elements: Record<string, ElementValue> = {};

  for (const [key, value] of Object.entries(rawElements)) {
    // Validate array lengths
    if (Array.isArray(value) && cardReq) {
      const { array, trimmed, belowMin } = validateArrayLength(value, cardReq);
      if (trimmed) {
        warnings.push(
          `${sectionName}.${key}: trimmed from ${value.length} to ${cardReq.max}`
        );
      }
      if (belowMin) {
        warnings.push(
          `${sectionName}.${key}: only ${array.length} items, minimum is ${cardReq.min}`
        );
      }
      elements[key] = maybeWrapNeedsReview(key, array, layoutName);
    } else {
      elements[key] = maybeWrapNeedsReview(key, value, layoutName);
    }
  }

  return { elements, warnings };
}

/**
 * Extract JSON from response (handles markdown code blocks)
 */
function extractJSON(text: string): string {
  // Try to find JSON in code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  return text.trim();
}

/**
 * Parse copy generation response
 */
export function parseCopyResponse(
  responseText: string,
  uiblocks: Record<SectionType, string>
): ParseCopyResponse {
  try {
    // Extract JSON from response
    const jsonText = extractJSON(responseText);

    // Parse JSON
    let parsed: Record<string, { elements: Record<string, unknown> }>;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      return {
        success: false,
        error: `JSON parse error: ${parseError.message}`,
      };
    }

    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) {
      return {
        success: false,
        error: 'Response is not an object',
      };
    }

    const sections: Record<string, SectionCopy> = {};
    const allWarnings: string[] = [];

    // Process each section
    for (const [sectionName, sectionData] of Object.entries(parsed)) {
      if (!sectionData || typeof sectionData !== 'object') {
        allWarnings.push(`${sectionName}: invalid section data`);
        continue;
      }

      const rawElements = sectionData.elements || sectionData;
      if (typeof rawElements !== 'object') {
        allWarnings.push(`${sectionName}: no elements found`);
        continue;
      }

      const layoutName = uiblocks[sectionName as SectionType];
      if (!layoutName) {
        // Section not in uiblocks, skip silently
        continue;
      }

      const { elements, warnings } = processSection(
        sectionName,
        layoutName,
        rawElements as Record<string, unknown>
      );

      sections[sectionName] = { elements };
      allWarnings.push(...warnings);
    }

    // Log warnings if any
    if (allWarnings.length > 0) {
      console.warn('Copy parse warnings:', allWarnings);
    }

    return {
      success: true,
      sections,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
    };
  }
}

/**
 * Validate that all required sections have copy
 */
export function validateCompleteness(
  sections: Record<string, SectionCopy>,
  uiblocks: Record<SectionType, string>
): { complete: boolean; missingSections: string[] } {
  const missingSections: string[] = [];

  for (const section of Object.keys(uiblocks)) {
    if (!sections[section]) {
      missingSections.push(section);
    }
  }

  return {
    complete: missingSections.length === 0,
    missingSections,
  };
}

/**
 * Build error context for retry prompt
 */
export function getErrorContext(response: ParseCopyError): {
  error: string;
  snippet: string;
} {
  return {
    error: response.error,
    snippet: response.error.includes('JSON')
      ? 'Check JSON syntax'
      : 'Unknown error',
  };
}

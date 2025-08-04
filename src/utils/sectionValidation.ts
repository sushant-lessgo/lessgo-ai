// utils/sectionValidation.ts - Section validation utilities
import type { SectionType } from '@/types/core';
import type { ValidationResult, ValidationError, ValidationWarning } from '@/types/store';

export interface SectionValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  validate: (section: any) => boolean;
  getMessage: (section: any) => string;
}

export interface SectionValidationConfig {
  sectionType: SectionType;
  requiredElements: string[];
  optionalElements: string[];
  validationRules: SectionValidationRule[];
  completionWeights: Record<string, number>;
}

export interface DetailedValidationResult extends ValidationResult {
  sectionId: string;
  sectionType: SectionType;
  completionPercentage: number;
  missingRequired: string[];
  missingOptional: string[];
  ruleViolations: Array<{
    ruleId: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
  }>;
  suggestions: string[];
  lastValidated: number;
}

/**
 * Section validation configurations by type
 */
const SECTION_VALIDATION_CONFIGS: Record<SectionType, SectionValidationConfig> = {
  hero: {
    sectionType: 'hero',
    requiredElements: ['headline'],
    optionalElements: ['subheadline', 'cta', 'image', 'video'],
    completionWeights: {
      headline: 40,
      subheadline: 20,
      cta: 30,
      image: 10,
    },
    validationRules: [
      {
        id: 'hero-headline-length',
        name: 'Headline Length',
        description: 'Headlines should be between 5-60 characters',
        severity: 'warning',
        validate: (section) => {
          const headline = section.elements?.headline?.content;
          if (!headline || typeof headline !== 'string') return true;
          return headline.length >= 5 && headline.length <= 60;
        },
        getMessage: (section) => {
          const headline = section.elements?.headline?.content || '';
          if (headline.length < 5) return 'Headline is too short (minimum 5 characters)';
          if (headline.length > 60) return 'Headline is too long (maximum 60 characters)';
          return '';
        },
      },
      {
        id: 'hero-cta-present',
        name: 'Call to Action',
        description: 'Hero sections should have a clear call to action',
        severity: 'warning',
        validate: (section) => {
          return !!(section.elements?.cta?.content);
        },
        getMessage: () => 'Consider adding a call-to-action button to improve conversions',
      },
      {
        id: 'hero-visual-content',
        name: 'Visual Content',
        description: 'Hero sections benefit from visual content',
        severity: 'info',
        validate: (section) => {
          return !!(section.elements?.image?.content || section.elements?.video?.content);
        },
        getMessage: () => 'Consider adding an image or video to make the hero more engaging',
      },
    ],
  },

  features: {
    sectionType: 'features',
    requiredElements: ['headline'],
    optionalElements: ['subheadline', 'features', 'cta'],
    completionWeights: {
      headline: 30,
      subheadline: 20,
      features: 40,
      cta: 10,
    },
    validationRules: [
      {
        id: 'features-list-count',
        name: 'Feature Count',
        description: 'Should have 3-6 features for optimal readability',
        severity: 'warning',
        validate: (section) => {
          const features = section.elements?.features?.content;
          if (!Array.isArray(features)) return true;
          return features.length >= 3 && features.length <= 6;
        },
        getMessage: (section) => {
          const features = section.elements?.features?.content || [];
          if (features.length < 3) return 'Consider adding more features (3-6 recommended)';
          if (features.length > 6) return 'Consider reducing features for better readability (3-6 recommended)';
          return '';
        },
      },
      {
        id: 'features-content-quality',
        name: 'Feature Content',
        description: 'Each feature should have descriptive content',
        severity: 'warning',
        validate: (section) => {
          const features = section.elements?.features?.content;
          if (!Array.isArray(features)) return true;
          return features.every(feature => 
            typeof feature === 'string' && feature.trim().length >= 10
          );
        },
        getMessage: () => 'Some features lack detailed descriptions (minimum 10 characters each)',
      },
    ],
  },

  testimonials: {
    sectionType: 'testimonials',
    requiredElements: ['headline'],
    optionalElements: ['subheadline', 'testimonials', 'cta'],
    completionWeights: {
      headline: 30,
      subheadline: 20,
      testimonials: 40,
      cta: 10,
    },
    validationRules: [
      {
        id: 'testimonials-count',
        name: 'Testimonial Count',
        description: 'Should have 2-5 testimonials',
        severity: 'warning',
        validate: (section) => {
          const testimonials = section.elements?.testimonials?.content;
          if (!Array.isArray(testimonials)) return true;
          return testimonials.length >= 2 && testimonials.length <= 5;
        },
        getMessage: (section) => {
          const testimonials = section.elements?.testimonials?.content || [];
          if (testimonials.length < 2) return 'Add more testimonials for stronger social proof (2-5 recommended)';
          if (testimonials.length > 5) return 'Consider reducing testimonials for better focus (2-5 recommended)';
          return '';
        },
      },
      {
        id: 'testimonials-authenticity',
        name: 'Testimonial Authenticity',
        description: 'Testimonials should include specific details',
        severity: 'info',
        validate: (section) => {
          const testimonials = section.elements?.testimonials?.content;
          if (!Array.isArray(testimonials)) return true;
          return testimonials.every(testimonial => 
            typeof testimonial === 'string' && testimonial.length >= 20
          );
        },
        getMessage: () => 'Consider adding more detailed testimonials for better credibility',
      },
    ],
  },

  cta: {
    sectionType: 'cta',
    requiredElements: ['headline', 'cta'],
    optionalElements: ['subheadline', 'features', 'form'],
    completionWeights: {
      headline: 40,
      cta: 40,
      subheadline: 20,
    },
    validationRules: [
      {
        id: 'cta-urgency',
        name: 'CTA Urgency',
        description: 'CTA buttons should create urgency or value',
        severity: 'info',
        validate: (section) => {
          const ctaText = section.elements?.cta?.content;
          if (typeof ctaText !== 'string') return true;
          const urgencyWords = ['now', 'today', 'free', 'limited', 'instant', 'immediately'];
          return urgencyWords.some(word => ctaText.toLowerCase().includes(word));
        },
        getMessage: () => 'Consider adding urgency or value words to your CTA (e.g., "Start Free Trial")',
      },
      {
        id: 'cta-clarity',
        name: 'CTA Clarity',
        description: 'CTA should clearly state what happens next',
        severity: 'warning',
        validate: (section) => {
          const ctaText = section.elements?.cta?.content;
          if (typeof ctaText !== 'string') return true;
          const vagueCTAs = ['click here', 'learn more', 'continue', 'next'];
          return !vagueCTAs.some(vague => ctaText.toLowerCase().includes(vague));
        },
        getMessage: () => 'Make your CTA more specific about what users will get',
      },
    ],
  },

  faq: {
    sectionType: 'faq',
    requiredElements: ['headline'],
    optionalElements: ['subheadline', 'questions', 'cta'],
    completionWeights: {
      headline: 30,
      subheadline: 20,
      questions: 40,
      cta: 10,
    },
    validationRules: [
      {
        id: 'faq-question-count',
        name: 'Question Count',
        description: 'Should have 4-8 frequently asked questions',
        severity: 'warning',
        validate: (section) => {
          const questions = section.elements?.questions?.content;
          if (!Array.isArray(questions)) return true;
          return questions.length >= 4 && questions.length <= 8;
        },
        getMessage: (section) => {
          const questions = section.elements?.questions?.content || [];
          if (questions.length < 4) return 'Add more questions to address common concerns (4-8 recommended)';
          if (questions.length > 8) return 'Consider reducing questions for better usability (4-8 recommended)';
          return '';
        },
      },
      {
        id: 'faq-question-format',
        name: 'Question Format',
        description: 'Questions should end with question marks',
        severity: 'warning',
        validate: (section) => {
          const questions = section.elements?.questions?.content;
          if (!Array.isArray(questions)) return true;
          return questions.every(q => 
            typeof q === 'string' && q.trim().endsWith('?')
          );
        },
        getMessage: () => 'Ensure all FAQ items are formatted as questions ending with "?"',
      },
    ],
  },

  custom: {
    sectionType: 'custom',
    requiredElements: [],
    optionalElements: ['headline', 'subheadline', 'text', 'cta', 'image', 'list'],
    completionWeights: {},
    validationRules: [
      {
        id: 'custom-has-content',
        name: 'Content Present',
        description: 'Custom sections should have at least one content element',
        severity: 'warning',
        validate: (section) => {
          const elements = section.elements || {};
          return Object.keys(elements).length > 0 && 
                 Object.values(elements).some((el: any) => 
                   el.content && (
                     typeof el.content === 'string' ? el.content.trim().length > 0 :
                     Array.isArray(el.content) && el.content.length > 0
                   )
                 );
        },
        getMessage: () => 'Add content elements to this custom section',
      },
    ],
  },
};

/**
 * Validate a single section
 */
export function validateSection(section: any, sectionId: string): DetailedValidationResult {
  const sectionType = section.type || 'custom';
  const config = SECTION_VALIDATION_CONFIGS[sectionType];
  
  if (!config) {
    return {
      sectionId,
      sectionType: 'custom',
      valid: false,
      isValid: false,
      errors: [{
        elementKey: 'sectionType',
        code: 'UNKNOWN_SECTION_TYPE',
        message: `Unknown section type: ${sectionType}`,
        severity: 'error' as const
      }],
      warnings: [],
      completionPercentage: 0,
      missingRequired: [],
      missingOptional: [],
      ruleViolations: [],
      suggestions: [],
      lastValidated: Date.now(),
    };
  }

  const elements = section.elements || {};
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const ruleViolations: Array<{ ruleId: string; severity: 'error' | 'warning' | 'info'; message: string }> = [];
  const suggestions: string[] = [];

  // Check required elements
  const missingRequired = config.requiredElements.filter(elementKey => {
    const element = elements[elementKey];
    return !element || !element.content || (
      typeof element.content === 'string' ? element.content.trim().length === 0 :
      Array.isArray(element.content) && element.content.length === 0
    );
  });

  // Check optional elements
  const missingOptional = config.optionalElements.filter(elementKey => {
    const element = elements[elementKey];
    return !element || !element.content || (
      typeof element.content === 'string' ? element.content.trim().length === 0 :
      Array.isArray(element.content) && element.content.length === 0
    );
  });

  // Add errors for missing required elements
  missingRequired.forEach(elementKey => {
    errors.push({
      elementKey,
      code: 'MISSING_REQUIRED_ELEMENT',
      message: `Missing required element: ${elementKey}`,
      severity: 'error' as const
    });
  });

  // Run validation rules
  config.validationRules.forEach(rule => {
    if (!rule.validate(section)) {
      const message = rule.getMessage(section);
      
      ruleViolations.push({
        ruleId: rule.id,
        severity: rule.severity,
        message,
      });

      if (rule.severity === 'error') {
        errors.push({
          elementKey: 'section',
          code: rule.id,
          message,
          severity: 'error' as const
        });
      } else if (rule.severity === 'warning') {
        warnings.push({
          elementKey: 'section',
          code: rule.id,
          message,
          autoFixable: false
        });
      } else if (rule.severity === 'info') {
        suggestions.push(message);
      }
    }
  });

  // Calculate completion percentage
  const totalElements = [...config.requiredElements, ...config.optionalElements];
  const completedElements = totalElements.filter(elementKey => {
    const element = elements[elementKey];
    return element && element.content && (
      typeof element.content === 'string' ? element.content.trim().length > 0 :
      Array.isArray(element.content) && element.content.length > 0
    );
  });

  let completionPercentage = 0;
  if (totalElements.length > 0) {
    if (Object.keys(config.completionWeights).length > 0) {
      // Use weighted completion
      let totalWeight = 0;
      let completedWeight = 0;
      
      Object.entries(config.completionWeights).forEach(([elementKey, weight]) => {
        totalWeight += weight;
        const element = elements[elementKey];
        if (element && element.content && (
          typeof element.content === 'string' ? element.content.trim().length > 0 :
          Array.isArray(element.content) && element.content.length > 0
        )) {
          completedWeight += weight;
        }
      });
      
      completionPercentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    } else {
      // Use simple completion
      completionPercentage = Math.round((completedElements.length / totalElements.length) * 100);
    }
  } else {
    // No elements defined, consider complete if any content exists
    completionPercentage = Object.keys(elements).length > 0 ? 100 : 0;
  }

  const isValid = errors.length === 0 && missingRequired.length === 0;

  return {
    sectionId,
    sectionType,
    valid: isValid,
    isValid,
    errors,
    warnings,
    completionPercentage,
    missingRequired,
    missingOptional,
    ruleViolations,
    suggestions,
    lastValidated: Date.now(),
  };
}

/**
 * Validate multiple sections
 */
export function validateSections(sections: Record<string, any>): DetailedValidationResult[] {
  return Object.entries(sections).map(([sectionId, section]) => 
    validateSection(section, sectionId)
  );
}

/**
 * Get validation summary
 */
export function getValidationSummary(validationResults: DetailedValidationResult[]) {
  const total = validationResults.length;
  const valid = validationResults.filter(r => r.isValid).length;
  const errors = validationResults.reduce((sum, r) => sum + r.errors.length, 0);
  const warnings = validationResults.reduce((sum, r) => sum + r.warnings.length, 0);
  const avgCompletion = total > 0 ? 
    Math.round(validationResults.reduce((sum, r) => sum + r.completionPercentage, 0) / total) : 0;

  return {
    total,
    valid,
    invalid: total - valid,
    errors,
    warnings,
    avgCompletion,
    validPercentage: total > 0 ? Math.round((valid / total) * 100) : 0,
  };
}

/**
 * Get sections that need attention
 */
export function getSectionsNeedingAttention(validationResults: DetailedValidationResult[]) {
  return validationResults
    .filter(r => !r.isValid || r.completionPercentage < 80)
    .sort((a, b) => {
      // Sort by severity: errors first, then low completion
      const aScore = a.errors.length * 100 + (100 - a.completionPercentage);
      const bScore = b.errors.length * 100 + (100 - b.completionPercentage);
      return bScore - aScore;
    });
}

/**
 * Get validation config for section type
 */
export function getValidationConfig(sectionType: SectionType): SectionValidationConfig {
  return SECTION_VALIDATION_CONFIGS[sectionType] || SECTION_VALIDATION_CONFIGS.custom;
}

/**
 * Check if element is required for section type
 */
export function isElementRequired(sectionType: SectionType, elementKey: string): boolean {
  const config = getValidationConfig(sectionType);
  return config.requiredElements.includes(elementKey);
}

/**
 * Get completion weight for element
 */
export function getElementWeight(sectionType: SectionType, elementKey: string): number {
  const config = getValidationConfig(sectionType);
  return config.completionWeights[elementKey] || 0;
}

/**
 * Get suggestions for improving section
 */
export function getSectionImprovementSuggestions(
  section: any, 
  sectionId: string
): Array<{ type: 'error' | 'warning' | 'suggestion'; message: string; action?: string }> {
  const validation = validateSection(section, sectionId);
  const suggestions: Array<{ type: 'error' | 'warning' | 'suggestion'; message: string; action?: string }> = [];

  // Add error suggestions
  validation.errors.forEach(error => {
    suggestions.push({
      type: 'error',
      message: error.message,
      action: getActionForError(error.message),
    });
  });

  // Add warning suggestions
  validation.warnings.forEach(warning => {
    suggestions.push({
      type: 'warning',
      message: warning.message,
      action: getActionForWarning(warning.message),
    });
  });

  // Add improvement suggestions
  validation.suggestions.forEach(suggestion => {
    suggestions.push({
      type: 'suggestion',
      message: suggestion,
    });
  });

  // Add completion suggestions
  if (validation.completionPercentage < 100) {
    validation.missingOptional.forEach(elementKey => {
      suggestions.push({
        type: 'suggestion',
        message: `Consider adding ${elementKey} to improve the section`,
        action: `add-${elementKey}`,
      });
    });
  }

  return suggestions;
}

/**
 * Get action for error message
 */
function getActionForError(error: string): string {
  if (error.includes('Missing required element')) {
    const elementKey = error.split(': ')[1];
    return `add-${elementKey}`;
  }
  return 'review';
}

/**
 * Get action for warning message
 */
function getActionForWarning(warning: string): string {
  if (warning.includes('Headline')) return 'edit-headline';
  if (warning.includes('CTA')) return 'edit-cta';
  if (warning.includes('features')) return 'edit-features';
  if (warning.includes('testimonials')) return 'edit-testimonials';
  if (warning.includes('questions')) return 'edit-questions';
  return 'review';
}

/**
 * Validate section content format
 */
export function validateSectionContent(content: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || typeof content !== 'object') {
    errors.push('Section content must be an object');
    return { isValid: false, errors };
  }

  if (!content.id || typeof content.id !== 'string') {
    errors.push('Section must have a valid ID');
  }

  if (!content.type || typeof content.type !== 'string') {
    errors.push('Section must have a valid type');
  }

  if (!content.elements || typeof content.elements !== 'object') {
    errors.push('Section must have an elements object');
  } else {
    // Validate individual elements
    Object.entries(content.elements).forEach(([elementKey, element]: [string, any]) => {
      if (!element || typeof element !== 'object') {
        errors.push(`Element ${elementKey} must be an object`);
        return;
      }

      if (!element.hasOwnProperty('content')) {
        errors.push(`Element ${elementKey} must have content property`);
      }

      if (!element.type || typeof element.type !== 'string') {
        errors.push(`Element ${elementKey} must have a valid type`);
      }

      if (typeof element.isEditable !== 'boolean') {
        errors.push(`Element ${elementKey} must have isEditable boolean`);
      }

      if (!element.editMode || !['inline', 'modal'].includes(element.editMode)) {
        errors.push(`Element ${elementKey} must have valid editMode (inline or modal)`);
      }
    });
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Get validation score for section
 */
export function getSectionValidationScore(section: any, sectionId: string): number {
  const validation = validateSection(section, sectionId);
  
  let score = validation.completionPercentage;
  
  // Deduct points for errors and warnings
  score -= validation.errors.length * 20;
  score -= validation.warnings.length * 10;
  
  // Bonus points for exceeding minimum requirements
  if (validation.completionPercentage === 100 && validation.errors.length === 0) {
    score += 10;
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Check if section meets minimum quality standards
 */
export function meetsQualityStandards(section: any, sectionId: string): boolean {
  const validation = validateSection(section, sectionId);
  
  return (
    validation.isValid &&
    validation.completionPercentage >= 80 &&
    validation.errors.length === 0 &&
    validation.warnings.length <= 2
  );
}

/**
 * Get recommended next actions for section
 */
export function getRecommendedActions(section: any, sectionId: string): Array<{
  action: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  elementKey?: string;
}> {
  const validation = validateSection(section, sectionId);
  const actions: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    elementKey?: string;
  }> = [];

  // High priority: Fix errors
  validation.missingRequired.forEach(elementKey => {
    actions.push({
      action: 'add-required-element',
      priority: 'high',
      description: `Add required ${elementKey}`,
      elementKey,
    });
  });

  // Medium priority: Address warnings
  validation.ruleViolations
    .filter(v => v.severity === 'warning')
    .forEach(violation => {
      actions.push({
        action: 'fix-warning',
        priority: 'medium',
        description: violation.message,
      });
    });

  // Low priority: Improve completion
  if (validation.completionPercentage < 100) {
    validation.missingOptional.slice(0, 2).forEach(elementKey => {
      actions.push({
        action: 'add-optional-element',
        priority: 'low',
        description: `Consider adding ${elementKey}`,
        elementKey,
      });
    });
  }

  return actions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

/**
 * Export validation utilities
 */
export const ValidationUtils = {
  validateSection,
  validateSections,
  validateSectionContent,
  getValidationSummary,
  getSectionsNeedingAttention,
  getValidationConfig,
  isElementRequired,
  getElementWeight,
  getSectionImprovementSuggestions,
  getSectionValidationScore,
  meetsQualityStandards,
  getRecommendedActions,
};
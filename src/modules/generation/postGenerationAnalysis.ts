/**
 * Post-Generation Analysis and Field Classification
 *
 * This module analyzes generated content and provides recommendations
 * for manual field review and customization.
 */

import { layoutElementSchema, getAllElements } from '../sections/layoutElementSchema';

export interface SectionAnalysis {
  sectionId: string;
  sectionType: string;
  fieldClassifications: { field: string; generation: string; mandatory: boolean }[];
  recommendations: {
    message: string;
    priority: 'low' | 'medium' | 'high';
    actions: string[];
  };
  manualReviewRequired: boolean;
  estimatedCustomizationTime: string;
}

export interface PostGenerationReport {
  totalSections: number;
  sectionsNeedingReview: number;
  totalManualFields: number;
  highPrioritySections: string[];
  overallRecommendation: string;
  sectionAnalyses: SectionAnalysis[];
}

/**
 * Analyzes generated content and provides field classification insights using unified schema
 */
export function analyzeGeneratedContent(elementsMap: any): PostGenerationReport {
  const sectionAnalyses: SectionAnalysis[] = [];
  let totalManualFields = 0;
  let sectionsNeedingReview = 0;
  const highPrioritySections: string[] = [];

  Object.entries(elementsMap).forEach(([sectionId, section]: [string, any]) => {
    const { sectionType, layoutName } = section;
    const schema = layoutElementSchema[layoutName || sectionType];

    if (!schema) {
      // Skip sections without schema
      return;
    }

    const allElements = getAllElements(schema);
    const fieldClassifications = allElements.map(element => ({
      field: element.element,
      generation: element.generation || 'ai_generated',
      mandatory: element.mandatory
    }));

    const manualFieldsCount = fieldClassifications.filter(
      field => field.generation === 'manual_preferred' || field.generation === 'hybrid'
    ).length;

    const recommendations = generateRecommendationsFromSchema(fieldClassifications, manualFieldsCount);
    const manualReviewRequired = manualFieldsCount > 0;

    if (manualReviewRequired) {
      sectionsNeedingReview++;
      totalManualFields += manualFieldsCount;
    }

    if (recommendations.priority === 'high') {
      highPrioritySections.push(sectionType);
    }

    const estimatedCustomizationTime = getEstimatedCustomizationTime(manualFieldsCount);

    sectionAnalyses.push({
      sectionId,
      sectionType,
      fieldClassifications,
      recommendations,
      manualReviewRequired,
      estimatedCustomizationTime
    });
  });

  const overallRecommendation = generateOverallRecommendation(
    sectionAnalyses.length,
    sectionsNeedingReview,
    totalManualFields,
    highPrioritySections.length
  );

  return {
    totalSections: sectionAnalyses.length,
    sectionsNeedingReview,
    totalManualFields,
    highPrioritySections,
    overallRecommendation,
    sectionAnalyses
  };
}

/**
 * Gets estimated time required for manual customization
 */
function getEstimatedCustomizationTime(manualFieldsCount: number): string {
  if (manualFieldsCount === 0) return 'No customization needed';
  if (manualFieldsCount <= 2) return '2-5 minutes';
  if (manualFieldsCount <= 5) return '5-10 minutes';
  if (manualFieldsCount <= 10) return '10-20 minutes';
  return '20+ minutes';
}

/**
 * Generates overall recommendation based on analysis
 */
function generateOverallRecommendation(
  totalSections: number,
  sectionsNeedingReview: number,
  totalManualFields: number,
  highPrioritySections: number
): string {
  const reviewPercentage = (sectionsNeedingReview / totalSections) * 100;

  if (reviewPercentage === 0) {
    return '🎉 Your landing page is ready to go! All content has been AI-generated and requires no manual review.';
  }

  if (reviewPercentage <= 25) {
    return `✨ Excellent! Only ${sectionsNeedingReview} out of ${totalSections} sections need manual review. Your landing page is mostly complete.`;
  }

  if (reviewPercentage <= 50) {
    return `👍 Good progress! ${sectionsNeedingReview} sections need manual customization. Focus on the high-priority sections first.`;
  }

  if (highPrioritySections > 0) {
    return `⚠️ This landing page requires significant customization. ${highPrioritySections} sections are high-priority and need real business data.`;
  }

  return `📋 Moderate customization needed. ${totalManualFields} fields across ${sectionsNeedingReview} sections require manual input for best results.`;
}

/**
 * Generates recommendations based on schema field classifications
 */
function generateRecommendationsFromSchema(
  fieldClassifications: { field: string; generation: string; mandatory: boolean }[],
  manualFieldsCount: number
): { message: string; priority: 'low' | 'medium' | 'high'; actions: string[] } {
  const actions: string[] = [];
  let priority: 'low' | 'medium' | 'high' = 'low';
  let message = 'Section is ready to use';

  const manualPreferred = fieldClassifications.filter(f => f.generation === 'manual_preferred');
  const hybrid = fieldClassifications.filter(f => f.generation === 'hybrid');

  if (manualPreferred.length > 0) {
    priority = 'high';
    message = `${manualPreferred.length} fields require real business data`;
    actions.push(`Update ${manualPreferred.map(f => f.field).join(', ')} with actual business information`);
  }

  if (hybrid.length > 0) {
    if (priority === 'low') priority = 'medium';
    if (message === 'Section is ready to use') {
      message = `${hybrid.length} fields can be customized for better results`;
    }
    actions.push(`Consider customizing ${hybrid.map(f => f.field).join(', ')} for your brand`);
  }

  if (manualFieldsCount === 0) {
    message = 'All fields are AI-generated and ready to use';
    actions.push('Review content for brand alignment');
  }

  return { message, priority, actions };
}

/**
 * Gets specific field guidance for manual review
 */
export function getFieldCustomizationGuidance(fieldName: string): {
  guidance: string;
  examples: string[];
  priority: 'low' | 'medium' | 'high';
} {
  const field = fieldName.toLowerCase();

  if (field.includes('avatar') || field.includes('image')) {
    return {
      guidance: 'Upload real customer photos or professional headshots for authenticity',
      examples: ['Customer profile photos', 'Team member headshots', 'Generated avatars with tools like ThisPersonDoesNotExist'],
      priority: 'medium'
    };
  }

  if (field.includes('rating') || field.includes('score')) {
    return {
      guidance: 'Use actual ratings from your review platforms for credibility',
      examples: ['G2 scores: 4.6/5', 'Capterra ratings: 4.8/5', 'App store ratings: 4.9/5'],
      priority: 'high'
    };
  }

  if (field.includes('customer_name')) {
    return {
      guidance: 'Use real customer names (with permission) or realistic placeholder names',
      examples: ['Real customers: "Sarah Johnson, VP Marketing"', 'Realistic placeholders: "Michael R., Senior Developer"'],
      priority: 'high'
    };
  }

  if (field.includes('location')) {
    return {
      guidance: 'Use real customer locations or representative major cities',
      examples: ['Customer cities: "Austin, TX"', 'Major markets: "San Francisco, CA", "London, UK"'],
      priority: 'medium'
    };
  }

  if (field.includes('date')) {
    return {
      guidance: 'Use recent dates for testimonials and reviews to maintain freshness',
      examples: ['Recent dates: "2 days ago", "Last week", "This month"', 'Specific dates: "January 2024"'],
      priority: 'medium'
    };
  }

  if (field.includes('pricing') || field.includes('price')) {
    return {
      guidance: 'Enter your actual pricing tiers and values',
      examples: ['SaaS pricing: "$29/month", "$99/month"', 'Service pricing: "Starting at $2,500"'],
      priority: 'high'
    };
  }

  return {
    guidance: 'Review and customize based on your specific business needs',
    examples: ['Use real business data when available', 'Ensure consistency with brand voice'],
    priority: 'medium'
  };
}

/**
 * Generates a post-generation checklist for users
 */
export function generatePostGenerationChecklist(report: PostGenerationReport): {
  immediate: string[];
  beforeLaunch: string[];
  ongoing: string[];
} {
  const immediate: string[] = [];
  const beforeLaunch: string[] = [];
  const ongoing: string[] = [];

  // Immediate actions based on high-priority sections
  if (report.highPrioritySections.length > 0) {
    immediate.push(`Review ${report.highPrioritySections.join(', ')} sections - they contain critical business data`);
  }

  if (report.totalManualFields > 0) {
    immediate.push(`Update ${report.totalManualFields} manual fields with real business data`);
  }

  // Before launch actions
  beforeLaunch.push('Test all forms and CTAs for functionality');
  beforeLaunch.push('Verify all customer testimonials are accurate');
  beforeLaunch.push('Ensure pricing and contact information is current');
  beforeLaunch.push('Review brand voice consistency across all sections');

  // Ongoing actions
  ongoing.push('Update testimonials and reviews regularly');
  ongoing.push('Refresh statistics and metrics quarterly');
  ongoing.push('A/B test headlines and CTAs for optimization');

  return { immediate, beforeLaunch, ongoing };
}
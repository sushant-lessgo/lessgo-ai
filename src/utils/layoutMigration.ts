import { layoutElementSchema, getAllElements } from '@/modules/sections/layoutElementSchema';
import type { EditableElement, SectionData } from '@/types/core';

export interface MigrationResult {
  migratedData: Record<string, EditableElement>;
  preservedFields: string[];
  newRequiredFields: string[];
  warnings: string[];
}

export function migrateLayoutData(
  currentData: Record<string, EditableElement>,
  fromLayout: string,
  toLayout: string
): MigrationResult {
  const fromSchema = layoutElementSchema[fromLayout] || [];
  const toSchema = layoutElementSchema[toLayout] || [];
  
  const migratedData: Record<string, EditableElement> = {};
  const preservedFields: string[] = [];
  const newRequiredFields: string[] = [];
  const warnings: string[] = [];

  // Create mapping of target fields using helper function
  const allElements = getAllElements(toSchema);
  const targetFields = new Set(allElements.map(item => item.element));
  const requiredTargetFields = new Set(
    allElements.filter(item => item.mandatory).map(item => item.element)
  );

  // Migrate existing data where fields match
  Object.entries(currentData).forEach(([fieldName, fieldData]) => {
    if (targetFields.has(fieldName)) {
      // Ensure the content is in the right format
      if (fieldData && typeof fieldData === 'object' && 'content' in fieldData) {
        migratedData[fieldName] = { ...fieldData };
      } else {
        // Handle cases where the data might be in a different format
        migratedData[fieldName] = {
          content: fieldData,
          type: isListField(fieldName) ? 'list' : 'text',
          isEditable: true,
          editMode: 'inline'
        };
      }
      preservedFields.push(fieldName);
    } else {
      warnings.push(`Field '${fieldName}' will be lost in new layout`);
    }
  });

  // Identify new required fields that need values
  allElements.forEach(({ element, mandatory }) => {
    if (mandatory && !migratedData[element]) {
      newRequiredFields.push(element);
      
      // Create placeholder for new required fields
      migratedData[element] = {
        content: getDefaultContentForElement(element),
        type: isListField(element) ? 'list' : 'text',
        isEditable: true,
        editMode: 'inline'
      };
    }
  });

  return {
    migratedData,
    preservedFields,
    newRequiredFields,
    warnings
  };
}

function getDefaultContentForElement(element: string): string | string[] {
  // Handle list-type fields that use pipe-separated values
  const listFields = [
    'feature_titles',
    'feature_descriptions',
    'benefit_titles',
    'benefit_descriptions',
    'faq_questions',
    'faq_answers',
    'questions',
    'answers',
    'tier_names',
    'tier_prices',
    'tier_features',
    'cta_texts',
    'testimonial_quotes',
    'customer_names',
    'customer_companies',
    'integration_names',
    'step_titles',
    'step_descriptions'
  ];

  // Check if this is a list field
  for (const listField of listFields) {
    if (element.includes(listField)) {
      // Return pipe-separated default values
      if (element.includes('titles') || element.includes('names')) {
        return 'Item 1|Item 2|Item 3';
      } else if (element.includes('descriptions') || element.includes('quotes')) {
        return 'Description for item 1|Description for item 2|Description for item 3';
      } else if (element.includes('questions')) {
        return 'Question 1?|Question 2?|Question 3?';
      } else if (element.includes('answers')) {
        return 'Answer to question 1|Answer to question 2|Answer to question 3';
      } else if (element.includes('prices')) {
        return '$9|$29|$99';
      }
    }
  }

  // Single value defaults
  const defaults: Record<string, string> = {
    headline: 'Your Headline Here',
    subheadline: 'Your subheadline here',
    cta_text: 'Get Started',
    supporting_text: 'Add your supporting text here',
    description: 'Add description here',
    title: 'Add title here',
    text: 'Add text here',
    // BeforeAfter specific defaults
    before_label: 'Before',
    after_label: 'After',
    before_description: 'Describe the current state, challenges, or pain points here. Example: Manual processes taking 3+ hours daily',
    after_description: 'Describe the improved state, benefits, or solutions here. Example: Automated workflow completed in minutes',
    before_placeholder_text: 'Time-consuming manual workflow',
    after_placeholder_text: 'Efficient automated system',
    interaction_hint_text: 'Click buttons above to switch views'
  };

  // Check for pattern matches
  for (const [pattern, defaultValue] of Object.entries(defaults)) {
    if (element.toLowerCase().includes(pattern)) {
      return defaultValue;
    }
  }

  // More helpful fallback message based on field name
  if (element.includes('before')) {
    return 'Add your "before" state content here (e.g., current challenges, pain points, or existing process)';
  } else if (element.includes('after')) {
    return 'Add your "after" state content here (e.g., solutions, improvements, or desired outcome)';
  } else if (element.includes('label')) {
    return 'Add label text here';
  } else if (element.includes('visual') || element.includes('image')) {
    return '/placeholder-image.jpg';
  }

  return 'Add your content here - be specific about the value this provides';
}

// Helper to determine if a field is a list-type field
function isListField(fieldName: string): boolean {
  const listPatterns = [
    '_titles', '_descriptions', '_names', '_quotes', 
    '_questions', '_answers', '_features', '_prices',
    '_texts', '_companies', 'questions', 'answers'
  ];
  
  return listPatterns.some(pattern => fieldName.includes(pattern));
}

export function getLayoutCompatibilityScore(
  fromLayout: string,
  toLayout: string
): number {
  const fromSchema = layoutElementSchema[fromLayout];
  const toSchema = layoutElementSchema[toLayout];

  if (!fromSchema || !toSchema) return 0;

  const fromElements = getAllElements(fromSchema);
  const toElements = getAllElements(toSchema);

  if (fromElements.length === 0 || toElements.length === 0) return 0;

  const fromFields = new Set(fromElements.map(item => item.element));
  const toFields = new Set(toElements.map(item => item.element));
  
  const intersection = new Set([...fromFields].filter(x => toFields.has(x)));
  const union = new Set([...fromFields, ...toFields]);
  
  return intersection.size / union.size;
}
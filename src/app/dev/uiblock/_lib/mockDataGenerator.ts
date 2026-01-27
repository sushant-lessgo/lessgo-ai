/**
 * Mock data generator for UIBlock testing
 * Generates realistic mock data from V2 schema definitions
 */

import {
  layoutElementSchema,
  isV2Schema,
  UIBlockSchemaV2,
  ElementDef,
  CollectionDef,
} from '@/modules/sections/layoutElementSchema';

// Placeholder text by element key patterns
const placeholderText: Record<string, string> = {
  headline: 'Transform Your Business with Smart Automation',
  subheadline: 'Streamline workflows, boost productivity, and scale effortlessly with our intelligent platform.',
  cta_text: 'Start Free Trial',
  secondary_cta_text: 'Watch Demo',
  supporting_text: 'Join 10,000+ teams already using our platform.',
  badge_text: 'New Feature',
  customer_count: '500+ happy customers',
  rating_value: '4.9/5',
  rating_count: 'from 127 reviews',
  title: 'Feature Title',
  description: 'A brief description of this feature and its benefits.',
  text: 'Trust indicator text',
  name: 'Customer Name',
  question: 'What is the most frequently asked question?',
  answer: 'Here is a helpful and informative answer to the question.',
  quote: '"This product changed everything for our team. Highly recommended!"',
  author: 'Jane Smith',
  role: 'CEO at TechCorp',
  company: 'TechCorp',
  stat_value: '99%',
  stat_label: 'Customer Satisfaction',
  price: '$29',
  period: '/month',
  plan_name: 'Pro Plan',
};

// Get placeholder text for an element key
function getPlaceholderForKey(key: string, type: 'string' | 'boolean' | 'number'): any {
  if (type === 'boolean') return true;
  if (type === 'number') return 0;

  // Try exact match first
  if (placeholderText[key]) return placeholderText[key];

  // Try partial matches
  for (const [pattern, value] of Object.entries(placeholderText)) {
    if (key.toLowerCase().includes(pattern.toLowerCase())) {
      return value;
    }
  }

  // Default fallback
  return `Sample ${key.replace(/_/g, ' ')}`;
}

// Generate items for a collection
function generateMockCollection(
  collectionName: string,
  collection: CollectionDef,
  count: number
): Array<Record<string, any>> {
  const items: Array<Record<string, any>> = [];

  for (let i = 0; i < count; i++) {
    const item: Record<string, any> = {};

    for (const [fieldKey, fieldDef] of Object.entries(collection.fields)) {
      if (fieldDef.fillMode === 'system') {
        // Generate system ID
        item[fieldKey] = `${collectionName.charAt(0)}${i + 1}`;
      } else if (fieldDef.default !== undefined) {
        item[fieldKey] = fieldDef.default;
      } else {
        item[fieldKey] = getPlaceholderForKey(fieldKey, fieldDef.type);
      }
    }

    items.push(item);
  }

  return items;
}

/**
 * Generate mock data from a V2 schema
 */
export function generateMockFromSchema(layoutName: string): Record<string, any> {
  const schema = layoutElementSchema[layoutName];
  if (!schema) {
    console.warn(`[MockDataGenerator] No schema found for layout: ${layoutName}`);
    return {};
  }

  if (!isV2Schema(schema)) {
    console.warn(`[MockDataGenerator] Schema is not V2 format for layout: ${layoutName}`);
    // Return minimal fallback for legacy schemas
    return {
      headline: placeholderText.headline,
      subheadline: placeholderText.subheadline,
      cta_text: placeholderText.cta_text,
    };
  }

  const result: Record<string, any> = {};

  // Generate element values
  for (const [key, def] of Object.entries(schema.elements)) {
    if (def.fillMode === 'system') continue;

    if (def.default !== undefined) {
      result[key] = def.default;
    } else {
      result[key] = getPlaceholderForKey(key, def.type);
    }
  }

  // Generate collection items
  if (schema.collections) {
    for (const [collectionName, collection] of Object.entries(schema.collections)) {
      // Generate between min and optimal number of items
      const count = Math.max(collection.constraints.min, 2);
      result[collectionName] = generateMockCollection(collectionName, collection, count);
    }
  }

  return result;
}

/**
 * Get mock data with a specific scenario (minimal, full, etc.)
 */
export function getMockScenario(
  layoutName: string,
  scenario: 'default' | 'minimal' | 'full' = 'default'
): Record<string, any> {
  const schema = layoutElementSchema[layoutName];
  if (!schema || !isV2Schema(schema)) {
    return generateMockFromSchema(layoutName);
  }

  const result: Record<string, any> = {};

  // Generate based on scenario
  for (const [key, def] of Object.entries(schema.elements)) {
    if (def.fillMode === 'system') continue;

    const isRequired = def.requirement === 'required';
    const isOptional = def.requirement === 'optional';

    if (scenario === 'minimal') {
      // Only required elements
      if (isRequired) {
        result[key] = def.default ?? getPlaceholderForKey(key, def.type);
      }
    } else if (scenario === 'full') {
      // All elements including optional
      result[key] = def.default ?? getPlaceholderForKey(key, def.type);
    } else {
      // Default: required + some optional
      if (isRequired || (isOptional && Math.random() > 0.3)) {
        result[key] = def.default ?? getPlaceholderForKey(key, def.type);
      }
    }
  }

  // Handle collections
  if (schema.collections) {
    for (const [collectionName, collection] of Object.entries(schema.collections)) {
      let count: number;

      if (scenario === 'minimal') {
        count = collection.constraints.min;
      } else if (scenario === 'full') {
        count = collection.constraints.max;
      } else {
        count = Math.max(collection.constraints.min, 2);
      }

      if (count > 0 || scenario !== 'minimal') {
        result[collectionName] = generateMockCollection(collectionName, collection, count);
      }
    }
  }

  return result;
}

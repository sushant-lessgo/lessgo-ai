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

// ============================================================
// REALISTIC MOCK DATA OVERRIDES
// Hand-crafted content for designer review
// ============================================================

const realisticMockData: Record<string, Record<string, any>> = {
  // ─────────────────────────────────────────────────────────
  // SideBySideBlocks - Compact horizontal comparison
  // ─────────────────────────────────────────────────────────
  SideBySideBlocks: {
    headline: 'Stop Wrestling with Spreadsheets',
    subheadline: 'See what happens when you switch from manual tracking to automated insights.',
    before_label: 'Without Flowtrack',
    after_label: 'With Flowtrack',
    before_description: 'Scattered data across 12+ spreadsheets, weekly status meetings, constant "where is that file?" messages.',
    after_description: 'One dashboard, real-time updates, automated reports delivered to your inbox every Monday.',
    before_icon: '😤',
    after_icon: '😌',
    summary_text: 'Teams using Flowtrack save an average of 8 hours per week on reporting alone.',
    before_points: [
      { id: 'bp1', text: 'Hours wasted hunting for data' },
      { id: 'bp2', text: 'Outdated numbers in presentations' },
      { id: 'bp3', text: 'Manual copy-paste errors' },
    ],
    after_points: [
      { id: 'ap1', text: 'All metrics in one place' },
      { id: 'ap2', text: 'Always up-to-date dashboards' },
      { id: 'ap3', text: 'Zero manual data entry' },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // SplitCard - Premium card-based comparison with visuals
  // ─────────────────────────────────────────────────────────
  SplitCard: {
    headline: 'From Chaos to Clarity',
    subheadline: 'Experience the difference professional project management makes.',
    before_label: 'The Old Way',
    after_label: 'The Projex Way',
    before_description: 'Endless email threads, missed deadlines, and that sinking feeling when you realize nobody knows who\'s doing what.',
    after_description: 'Crystal-clear task ownership, automated deadline reminders, and a team that actually ships on time.',
    before_visual: '',
    after_visual: '',
    before_icon: '📧',
    after_icon: '🚀',
    upgrade_icon: '→',
    upgrade_text: 'Transform',
    premium_badge_text: 'Pro',
    premium_features_text: 'Includes unlimited projects',
    premium_feature_icon: '✓',
    summary_text: 'Join 2,500+ teams who switched to Projex and never looked back.',
  },

  // ─────────────────────────────────────────────────────────
  // StackedTextVisual - Vertical stacked transformation
  // ─────────────────────────────────────────────────────────
  StackedTextVisual: {
    headline: 'Your Morning Routine, Transformed',
    subheadline: 'See how our meal planning app changes the daily breakfast scramble.',
    before_label: 'Every Morning Before',
    after_label: 'Every Morning After',
    before_text: 'Standing in front of an open fridge at 7:15 AM, wondering what to make while the kids ask "what\'s for breakfast?" for the fifth time. Ending up with the same boring cereal again.',
    after_text: 'Wake up knowing exactly what\'s for breakfast. Ingredients prepped the night before. A calm 15-minute cooking session while the kids set the table. Variety that keeps everyone excited.',
    before_icon: '😩',
    after_icon: '☀️',
    transition_icon: '↓',
    transition_text: 'One simple app changes everything',
    summary_text: 'Families using MealPlan report 73% less morning stress and actually look forward to breakfast again.',
    show_summary_box: true,
  },

  // ─────────────────────────────────────────────────────────
  // StackedPainBullets - Pain point identification
  // ─────────────────────────────────────────────────────────
  StackedPainBullets: {
    headline: 'Sound Familiar?',
    subheadline: 'These daily frustrations are costing you more than you realize.',
    conclusion_text: 'You\'re not alone. We built Flowtrack to fix exactly this.',
    pain_items: [
      {
        id: 'p1',
        point: 'Spending 3+ hours every week just finding the right spreadsheet',
        description: 'Version control nightmare—which one is "final_FINAL_v3_updated"?'
      },
      {
        id: 'p2',
        point: 'Your tools don\'t talk to each other',
        description: 'Copy-pasting between Slack, email, and your PM tool like it\'s 2005.'
      },
      {
        id: 'p3',
        point: 'Important updates get buried in endless threads',
        description: 'That critical deadline change? Somewhere in a 47-message Slack thread.'
      },
      {
        id: 'p4',
        point: 'Your team is burning out on busywork',
        description: 'Smart people doing repetitive tasks that should be automated.'
      },
    ],
  },

  // ─────────────────────────────────────────────────────────
  // LetterStyleBlock - Personal founder letter
  // ─────────────────────────────────────────────────────────
  LetterStyleBlock: {
    letter_header: 'A Personal Note from Our Founder',
    letter_greeting: 'Dear Fellow Builder,',
    letter_body: 'Three years ago, I sat exactly where you are now—staring at a landing page that just wouldn\'t convert.\n\nI\'d tried everything. Hired expensive copywriters. A/B tested until my eyes crossed. Read every marketing book I could find.\n\nThen it hit me: the problem wasn\'t my copy. It was the process. Great landing pages need great strategy first.\n\nThat\'s why I built Lessgo. To give founders like us the strategic foundation we need before writing a single word.',
    letter_signature: 'Sushant Jain',
    founder_title: 'Founder',
    company_name: 'Lessgo',
    date_text: 'January 2025',
    ps_text: 'P.S. Every founder who joins gets a personal strategy review from me. Just reply to your welcome email.',
    founder_image: '/images/founder.jpg',
  },
};

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
  // LetterStyleBlock
  letter_header: 'A Personal Note from Our Founder',
  letter_greeting: 'Dear Fellow Builder,',
  letter_body: 'Three years ago, I sat exactly where you are now—staring at a landing page that just wouldn\'t convert.\n\nI\'d tried everything. Hired expensive copywriters. A/B tested until my eyes crossed. Read every marketing book I could find.\n\nThen it hit me: the problem wasn\'t my copy. It was the process. Great landing pages need great strategy first.\n\nThat\'s why I built Lessgo. To give founders like us the strategic foundation we need before writing a single word.',
  letter_signature: 'Sushant Jain',
  founder_title: 'Founder',
  company_name: 'Lessgo',
  date_text: 'January 2025',
  ps_text: 'P.S. Every founder who joins gets a personal strategy review from me. Just reply to your welcome email.',
  founder_image: '/images/founder.jpg',
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
 * Uses realistic mock data overrides when available
 */
export function generateMockFromSchema(layoutName: string): Record<string, any> {
  // Check for hand-crafted realistic mock data first
  if (realisticMockData[layoutName]) {
    return { ...realisticMockData[layoutName] };
  }

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
 * For 'default' and 'full' scenarios, uses realistic mock data when available
 */
export function getMockScenario(
  layoutName: string,
  scenario: 'default' | 'minimal' | 'full' = 'default'
): Record<string, any> {
  // For default/full scenarios, use realistic mock data if available
  if ((scenario === 'default' || scenario === 'full') && realisticMockData[layoutName]) {
    return { ...realisticMockData[layoutName] };
  }

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

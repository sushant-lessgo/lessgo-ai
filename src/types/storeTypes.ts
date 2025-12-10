// Base types for content elements
export type StringElement = string;
export type ArrayElement = string[];
export type ContentElement = StringElement | ArrayElement;

// Import layout element schema for mandatory/optional checking
import { layoutElementSchema, getAllElements } from '@/modules/sections/layoutElementSchema';
import { logger } from '@/lib/logger';

// Store element definitions based on layoutElementSchema
export interface StoreElementTypes {
  // Single string elements (most common)
  headline: StringElement;
  subheadline: StringElement;
  supporting_text: StringElement;
  cta_text: StringElement;
  description: StringElement;
  
  // Before/After elements (strings)
  before_label: StringElement;
  after_label: StringElement;
  before_description: StringElement;
  after_description: StringElement;
  before_text: StringElement;
  after_text: StringElement;
  transition_text: StringElement;
  before_title: StringElement;
  after_title: StringElement;
  
  // Array elements for lists/multiple items
  questions: ArrayElement;
  answers: ArrayElement;
  feature_titles: ArrayElement;
  feature_descriptions: ArrayElement;
  feature_benefits: ArrayElement;
  stat_values: ArrayElement;
  stat_labels: ArrayElement;
  stat_descriptions: ArrayElement;
  testimonial_quotes: ArrayElement;
  customer_names: ArrayElement;
  customer_titles: ArrayElement;
  customer_companies: ArrayElement;
  
  // Lists and collections
  before_list_items: ArrayElement;
  after_list_items: ArrayElement;
  pain_points: ArrayElement;
  pain_descriptions: ArrayElement;
  benefit_list: ArrayElement;
  feature_list: ArrayElement;
  company_names: ArrayElement;
  integration_names: ArrayElement;
  
  // Step-based content (arrays)
  step_titles: ArrayElement;
  step_descriptions: ArrayElement;
  step_numbers: ArrayElement;
  timeline_periods: ArrayElement;
  timeline_descriptions: ArrayElement;
  story_steps: ArrayElement;
 
  
  // Rating and review content
  rating_scores: ArrayElement;
  rating_sources: ArrayElement;
  review_snippets: ArrayElement;
  review_dates: ArrayElement;
  
  // Pricing and tier content
  tier_names: ArrayElement;
  tier_prices: ArrayElement;
  tier_descriptions: ArrayElement;
  cta_texts: ArrayElement; // Multiple CTAs
  feature_lists: ArrayElement;
  
  // Security and compliance
  compliance_names: ArrayElement;
  security_items: ArrayElement;
  audit_titles: ArrayElement;
  audit_descriptions: ArrayElement;
  auditor_names: ArrayElement;
  
  // Social proof
  media_names: ArrayElement;
  mention_quotes: ArrayElement;
  location_names: ArrayElement;
  usage_stats: ArrayElement;
  
  // Use case and persona content
  persona_names: ArrayElement;
  persona_descriptions: ArrayElement;
  use_case_examples: ArrayElement;
  scenario_titles: ArrayElement;
  scenario_descriptions: ArrayElement;
  
  // Single values that might sometimes be confused as arrays
  user_count: StringElement;
  count_description: StringElement;
  video_title: StringElement;
  video_description: StringElement;
  founder_name: StringElement;
  founder_title: StringElement;
  founder_quote: StringElement;
  company_context: StringElement;
  
  // Specialized single elements
  slider_instruction: StringElement;
  transformation_arrow_text: StringElement;
  conclusion_text: StringElement;
  urgency_text: StringElement;
  guarantee_text: StringElement;
  privacy_text: StringElement;
  
  // Mixed content that could be either (need special handling)
  badge_text: StringElement; // Usually single
  badge_texts: ArrayElement; // Multiple badges
  tab_labels: ArrayElement;
  tab_descriptions: ArrayElement;
  
  // Special elements for specific layouts
  before_stats: ArrayElement;
  after_stats: ArrayElement;
  improvement_labels: ArrayElement;
  metric_values: ArrayElement;
  outcome_titles: ArrayElement;
  outcome_descriptions: ArrayElement;
  emoji_labels: ArrayElement;
  icon_labels: ArrayElement;
  
  // Comparison content
  comparison_categories: ArrayElement;
  your_approach: ArrayElement;
  traditional_approach: ArrayElement;
  competitor_names: ArrayElement;
  
  // Form and contact elements
  form_labels: ArrayElement;
  form_placeholders: ArrayElement;
  contact_methods: ArrayElement;
  
  // Hero image elements (layout-specific to avoid conflicts)
  hero_image: StringElement;              // For leftCopyRightImage layout
  center_hero_image: StringElement;       // For centerStacked layout
  image_first_hero_image: StringElement;  // For imageFirst layout
  split_hero_image: StringElement;        // For splitScreen layout
}

// Updated section content interface
export interface SectionContent {
  elements: Partial<StoreElementTypes>;
}

// Theme type definition
export type Theme = {
  typography: {
    headingFont: string;
    bodyFont: string;
    scale: 'small' | 'normal' | 'large' | 'xl';
  };
  colors: {
    baseColor: string;        // "gray", "slate", "stone"
    accentColor: string;      // "purple", "blue", "emerald"
    accentCSS?: string;       // "bg-purple-600"
    sectionBackgrounds: SectionBackgroundInput;
  };
  spacing: {
    unit: number;
    scale: 'compact' | 'comfortable' | 'spacious';
  };
  corners: {
    radius: number;
  };
  // NEW: Text color override system
  textColorMode?: 'auto' | 'manual';
  textColorOverrides?: {
    heading?: string;
    body?: string;
    muted?: string;
  };
  textContrastLevel?: number; // 0-100, default 50
  // NEW: UIBlock theme override (warm/cool/neutral)
  uiBlockTheme?: 'warm' | 'cool' | 'neutral';
};

// Theme colors subset type for color modal
export type ThemeColors = Theme['colors'];

// Section background input type (you may need to adjust this)
export interface SectionBackgroundInput {
  primary: string;
  secondary: string;
  neutral: string;
  divider: string;
}

// Updated page store interface
export interface PageStore {
  content: {
    [sectionId: string]: SectionContent;
  };
  ui: {
    mode: 'edit' | 'preview';
  };
  layout: {
    theme: Theme;
    sections: string[];
    sectionLayouts: Record<string, string>;
  };
  meta: {
    onboardingData: {
      oneLiner: string;
      validatedFields: Record<string, string>;
      featuresFromAI: Array<{
        feature: string;
        benefit: string;
      }>;
      targetAudience?: string;
      businessType?: string;
    };
  };
  updateElementContent: (sectionId: string, elementKey: string, value: string) => void;
}

// Helper type to get the expected type for an element
export type ElementType<K extends keyof StoreElementTypes> = StoreElementTypes[K];

// Type guard functions
export const isStringElement = (value: ContentElement): value is StringElement => {
  return typeof value === 'string';
};

export const isArrayElement = (value: ContentElement): value is ArrayElement => {
  return Array.isArray(value);
};

// Enhanced helper functions with proper typing
export const getStringContent = <K extends keyof StoreElementTypes>(
  value: StoreElementTypes[K] | undefined, 
  defaultValue: string = ''
): string => {
  // Handle element objects with {content, type, isEditable, editMode} structure
  if (value && typeof value === 'object' && !Array.isArray(value) && 'content' in value) {
    const content = (value as any).content;
    if (Array.isArray(content)) {
      return content.length > 0 ? content[0] : defaultValue;
    }
    return content || defaultValue;
  }
  
  if (Array.isArray(value)) {
    // For arrays that should be strings, take first item
    return value.length > 0 ? value[0] : defaultValue;
  }
  return value || defaultValue;
};

export const getArrayContent = <K extends keyof StoreElementTypes>(
  value: StoreElementTypes[K] | undefined, 
  defaultValue: string[] = []
): string[] => {
  // Handle element objects with {content, type, isEditable, editMode} structure
  if (value && typeof value === 'object' && !Array.isArray(value) && 'content' in value) {
    const content = (value as any).content;
    if (Array.isArray(content)) {
      return content.length > 0 ? content : defaultValue;
    }
    return content ? [content] : defaultValue;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? value : defaultValue;
  }
  // If it's a single string, convert to array
  return value ? [value] : defaultValue;
};

// Type-safe element extractor
export const extractElement = <K extends keyof StoreElementTypes>(
  elements: Partial<StoreElementTypes>,
  key: K,
  defaultValue: StoreElementTypes[K]
): StoreElementTypes[K] => {
  const value = elements[key];
  return value !== undefined ? value : defaultValue;
};

// Layout-specific content interfaces (examples)
export interface SideBySideContent {
  headline: string;
  before_label: string;
  after_label: string;
  before_description: string;
  after_description: string;
  subheadline: string;
  supporting_text: string;
}

export interface FAQContent {
  headline: string;
  questions: string[];
  answers: string[];
  subheadline: string;
}

export interface FeatureGridContent {
  headline: string;
  feature_titles: string[];
  feature_descriptions: string[];
  subheadline: string;
}

export interface StatBlocksContent {
  headline: string;
  stat_values: string[];
  stat_labels: string[];
  stat_descriptions: string[];
  subheadline: string;
}

// Example of how to use these types in components
export interface LayoutComponentProps {
  sectionId: string;
  className?: string;
  backgroundType?: 'primary' | 'secondary' | 'neutral' | 'divider' | 'custom';
  sectionBackgroundCSS?: string; // ✅ NEW: CSS class calculated in renderer
  userContext?: {  // ✅ NEW: Full taxonomy context for theme selection
    marketCategory: import('@/modules/inference/taxonomy').MarketCategory;
    targetAudience: import('@/modules/inference/taxonomy').TargetAudience;
    landingPageGoals: import('@/modules/inference/taxonomy').LandingGoalType;
    startupStage: import('@/modules/inference/taxonomy').StartupStage;
    toneProfile: import('@/modules/inference/taxonomy').ToneProfile;
    awarenessLevel: import('@/modules/inference/taxonomy').AwarenessLevel;
    pricingModel: import('@/modules/inference/taxonomy').PricingModel;
  };
  manualThemeOverride?: 'warm' | 'cool' | 'neutral'; // ✅ NEW: Manual theme override from store
}

/**
 * Check if an element is mandatory based on layout schema
 */
function isElementMandatory(layout: string, elementKey: string): boolean {
  const schema = layoutElementSchema[layout];
  if (!schema) {
    logger.dev(`⚠️ isElementMandatory: No schema found for layout "${layout}"`);
    return false;
  }

  // Use helper function to get all elements (works with both old and new schema formats)
  const allElements = getAllElements(schema);
  const element = allElements.find(el => el.element === elementKey);
  const isMandatory = element?.mandatory ?? false;
  
  // DEBUG: Log mandatory checks for step elements
  if (elementKey === 'step_titles' || elementKey === 'step_descriptions') {
    logger.dev(`🔍 isElementMandatory check:`, {
      layout,
      elementKey,
      found: !!element,
      isMandatory,
      schemaKeys: Object.keys(layoutElementSchema).filter(k => k.includes('Step')).slice(0, 5)
    });
  }
  
  return isMandatory;
}

// Helper to check if an element exists in the schema at all
function isElementInSchema(layout: string, elementKey: string): boolean {
  const schema = layoutElementSchema[layout];
  if (!schema) {
    return false;
  }

  // Use helper function to get all elements (works with both old and new schema formats)
  const allElements = getAllElements(schema);
  return allElements.some(el => el.element === elementKey);
}

// Generic content extractor for any layout
export const extractLayoutContent = <T extends Record<string, any>>(
  elements: Partial<StoreElementTypes>,
  contentSchema: { [K in keyof T]: { type: 'string' | 'array' | 'boolean' | 'number'; default: T[K] } },
  layout?: string,  // Optional layout name to check mandatory/optional elements
  excludedElements?: string[]  // Optional list of elements to explicitly exclude
): T => {
  const result = {} as T;
  
  // Guard against null or undefined contentSchema
  if (!contentSchema || typeof contentSchema !== 'object') {
    logger.error('extractLayoutContent: contentSchema is null or undefined', { contentSchema });
    return result;
  }
  
  for (const [key, config] of Object.entries(contentSchema)) {
    const elementValue = elements[key as keyof StoreElementTypes];
    
    // ENHANCED FIX: For undefined elements, prioritize exclusions above all else
    if (elementValue === undefined) {
      const isMandatory = layout ? isElementMandatory(layout, key) : false;
      const isInSchema = layout ? isElementInSchema(layout, key) : false;
      const isExcluded = excludedElements?.includes(key) || false;

      // DEBUG: Log what's happening with undefined elements
      logger.dev(`🔍 extractLayoutContent DEBUG: element "${key}" is undefined`, {
        layout,
        isMandatory,
        isInSchema,
        isExcluded,
        hasLayout: !!layout,
        defaultValue: config.default
      });

      // PRIORITY 1: Always respect exclusions first, regardless of schema detection
      if (isExcluded) {
        logger.dev(`❌ EXCLUDED: Skipping element "${key}" - will not appear in UI (exclusion enforced)`);
        continue; // Skip adding this key to result object, leaving it undefined
      }

      // PRIORITY 2: Handle mandatory elements (must appear even if schema detection fails)
      if (isMandatory) {
        if (config.type === 'string') {
          result[key as keyof T] = config.default as T[keyof T];
        } else if (config.type === 'array') {
          result[key as keyof T] = config.default as T[keyof T];
        } else if (config.type === 'boolean') {
          result[key as keyof T] = config.default as T[keyof T];
        } else if (config.type === 'number') {
          result[key as keyof T] = config.default as T[keyof T];
        }
        logger.dev(`✅ MANDATORY: Using default for mandatory element "${key}":`, config.default);
      }
      // PRIORITY 3: ✅ CRITICAL FIX: Only include optional elements if they're in schema AND not excluded
      else if (isInSchema) {
        // Only include optional elements that are explicitly in the schema
        if (config.type === 'string') {
          result[key as keyof T] = config.default as T[keyof T];
        } else if (config.type === 'array') {
          result[key as keyof T] = config.default as T[keyof T];
        } else if (config.type === 'boolean') {
          result[key as keyof T] = config.default as T[keyof T];
        } else if (config.type === 'number') {
          result[key as keyof T] = config.default as T[keyof T];
        }
        logger.dev(`✨ OPTIONAL: Using default for included optional element "${key}":`, config.default);
      }
      // PRIORITY 4: ✅ NEW: Skip undefined optional elements that aren't in schema or are excluded
      else {
        logger.dev(`🚫 SKIPPED: Element "${key}" not in schema or excluded - will not appear in UI`);
        continue; // Don't add to result, leaving it undefined
      }
      continue;
    }
    
    // Element exists in content, so include it (with default if empty)
    // DEBUG: Log existing elements for step_titles specifically
    if (key === 'step_titles' || key === 'step_descriptions') {
      logger.dev(`🎯 extractLayoutContent: Found existing "${key}":`, {
        elementValue,
        layout,
        valueType: typeof elementValue,
        isStringEmpty: typeof elementValue === 'string' && elementValue === '',
        defaultValue: config.default
      });
    }
    
    if (config.type === 'string') {
      result[key as keyof T] = getStringContent(elementValue, config.default) as T[keyof T];
    } else if (config.type === 'array') {
      result[key as keyof T] = getArrayContent(elementValue, config.default) as T[keyof T];
    }
  }
  
  return result;
};
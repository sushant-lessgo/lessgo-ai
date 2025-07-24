import { UniversalElementType } from '@/types/universalElements';

/**
 * Element Restriction Configuration System
 * 
 * This system prevents incompatible universal elements from being added to
 * structured UIBlocks while maintaining flexibility for appropriate sections.
 */

export interface ElementRestriction {
  allowedElements: UniversalElementType[];
  reason: string;
  restrictionLevel: 'strict' | 'moderate' | 'flexible';
}

/**
 * Section-based element restrictions
 * 
 * Structured sections with predefined layouts should restrict elements
 * to maintain design integrity and prevent layout conflicts.
 */
export const SECTION_RESTRICTIONS: Record<string, ElementRestriction> = {
  // Highly structured sections - NO universal elements allowed
  hero: {
    allowedElements: [],
    reason: "Hero sections use predefined content schemas with specific layouts and can't accommodate additional elements",
    restrictionLevel: 'strict'
  },
  
  features: {
    allowedElements: [],
    reason: "Feature sections require structured data formats (pipe-separated lists) that conflict with individual elements",
    restrictionLevel: 'strict'
  },
  
  pricing: {
    allowedElements: [],
    reason: "Pricing sections have fixed card layouts and structured tier data that would break with additional elements",
    restrictionLevel: 'strict'
  },
  
  testimonials: {
    allowedElements: [],
    reason: "Testimonial sections use structured quote formats and specific layouts for social proof display",
    restrictionLevel: 'strict'
  },
  
  faq: {
    allowedElements: [],
    reason: "FAQ sections require question/answer pairs in specific formats and accordion layouts",
    restrictionLevel: 'strict'
  },
  
  // Moderately structured sections - Limited elements allowed
  beforeAfter: {
    allowedElements: ['text', 'headline'],
    reason: "Before/After sections have structured comparison layouts but can accommodate some text elements",
    restrictionLevel: 'moderate'
  },
  
  howItWorks: {
    allowedElements: ['text', 'headline'],
    reason: "How It Works sections use step-based layouts but can include some additional text content",
    restrictionLevel: 'moderate'
  },
  
  socialProof: {
    allowedElements: ['text', 'image'],
    reason: "Social proof sections focus on logos and metrics but can include supporting text and images",
    restrictionLevel: 'moderate'
  },
  
  // Flexible sections - Most elements allowed
  content: {
    allowedElements: ['text', 'headline', 'list', 'button', 'image', 'spacer'],
    reason: "Content sections are designed for flexible layouts and support various element types",
    restrictionLevel: 'flexible'
  },
  
  custom: {
    allowedElements: ['text', 'headline', 'list', 'button', 'image', 'icon', 'spacer', 'container'],
    reason: "Custom sections allow maximum flexibility for unique layout requirements",
    restrictionLevel: 'flexible'
  },
  
  // Special purpose sections
  close: {
    allowedElements: ['button', 'text'],
    reason: "Closing sections focus on final conversion with CTA emphasis but can include supporting elements",
    restrictionLevel: 'moderate'
  },
  
  problem: {
    allowedElements: ['text', 'list'],
    reason: "Problem sections can accommodate additional text and list elements to emphasize pain points",
    restrictionLevel: 'moderate'
  },
  
  results: {
    allowedElements: ['text', 'image'],
    reason: "Results sections can include supporting text and visual elements alongside structured metrics",
    restrictionLevel: 'moderate'
  }
};

/**
 * Layout-specific element restrictions
 * 
 * These take precedence over section restrictions and are based on
 * specific layout implementations that cannot accommodate additional elements.
 */
export const LAYOUT_RESTRICTIONS: Record<string, ElementRestriction> = {
  // Complex grid layouts - NO additional elements
  iconGrid: {
    allowedElements: [],
    reason: "Icon grid layouts use precise 3-column arrangements that would be disrupted by additional elements",
    restrictionLevel: 'strict'
  },
  
  tierCards: {
    allowedElements: [],
    reason: "Pricing tier cards have fixed card layouts with specific content positioning",
    restrictionLevel: 'strict'
  },
  
  centerStacked: {
    allowedElements: [],
    reason: "Center stacked layouts use precise vertical alignment that additional elements would disrupt",
    restrictionLevel: 'strict'
  },
  
  splitScreen: {
    allowedElements: [],
    reason: "Split screen layouts depend on exact 50/50 content distribution",
    restrictionLevel: 'strict'
  },
  
  carousel: {
    allowedElements: [],
    reason: "Carousel layouts require structured slide data and precise navigation controls",
    restrictionLevel: 'strict'
  },
  
  accordion: {
    allowedElements: [],
    reason: "Accordion layouts depend on structured expand/collapse data pairs",
    restrictionLevel: 'strict'
  },
  
  // Moderately complex layouts - Limited elements
  leftCopyRightImage: {
    allowedElements: ['text'],
    reason: "Two-column layouts can accommodate some additional text but not elements that would break the grid",
    restrictionLevel: 'moderate'
  },
  
  imageFirst: {
    allowedElements: ['text'],
    reason: "Image-first layouts maintain visual hierarchy but can include supporting text",
    restrictionLevel: 'moderate'
  },
  
  // Simple layouts - More flexible
  textBlock: {
    allowedElements: ['text', 'headline', 'list'],
    reason: "Text-focused layouts can accommodate various text-based elements",
    restrictionLevel: 'flexible'
  },
  
  imageBlock: {
    allowedElements: ['image', 'text', 'headline'],
    reason: "Image-focused layouts can include supporting text and additional images",
    restrictionLevel: 'flexible'
  },
  
  basicContent: {
    allowedElements: ['text', 'headline', 'list', 'button'],
    reason: "Basic content layouts are designed for element flexibility",
    restrictionLevel: 'flexible'
  }
};

/**
 * Get all available universal element types
 * This should match the types defined in universalElements.ts
 */
export const getAllUniversalElementTypes = (): UniversalElementType[] => [
  'text',
  'headline', 
  'list',
  'button',
  'link',
  'image',
  'icon',
  'spacer',
  'container'
];

/**
 * Default restriction for unknown sections/layouts
 * Applies moderate restrictions as a safe fallback
 */
export const DEFAULT_RESTRICTION: ElementRestriction = {
  allowedElements: ['text', 'headline', 'list'],
  reason: "Unknown section type - applying moderate restrictions for safety",
  restrictionLevel: 'moderate'
};

/**
 * Categories for restriction display and filtering
 */
export const RESTRICTION_CATEGORIES = {
  strict: {
    label: 'Highly Structured',
    description: 'No additional elements allowed',
    color: 'red'
  },
  moderate: {
    label: 'Moderately Flexible', 
    description: 'Some elements allowed',
    color: 'yellow'  
  },
  flexible: {
    label: 'Flexible Layout',
    description: 'Most elements allowed',
    color: 'green'
  }
} as const;

/**
 * Element categories for better organization in restrictions
 */
export const ELEMENT_CATEGORIES = {
  text: ['text', 'headline', 'list'],
  interactive: ['button', 'link'],
  media: ['image', 'icon'],
  layout: ['spacer', 'container']
} as const;
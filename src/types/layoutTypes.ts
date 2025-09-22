// layoutTypes.ts - Type definitions for UIBlock card requirements system

/**
 * Types of card/element groupings that UIBlocks can have
 */
export type CardRequirementType =
  | 'cards'     // Individual cards (e.g., feature cards, metric cards)
  | 'pairs'     // Paired items (e.g., before/after testimonials)
  | 'rows'      // Row items in a comparison table
  | 'items'     // Generic list items (e.g., FAQ questions)
  | 'blocks';   // Larger content blocks

/**
 * Defines the card/element count requirements for a UIBlock
 */
export interface CardRequirements {
  /** Type of card grouping this UIBlock uses */
  type: CardRequirementType;

  /** Minimum number of cards/elements */
  min: number;

  /** Maximum number of cards/elements */
  max: number;

  /** Optimal range for conversion [min, max] */
  optimal: [number, number];

  /** Human-readable description of what these cards represent */
  description: string;

  /** Whether user-provided content should be prioritized */
  respectUserContent?: boolean;
}

/**
 * Configuration for a layout/UIBlock including its card requirements
 */
export interface LayoutConfig {
  /** Component name/identifier */
  component: string;

  /** Card requirements for this layout */
  cardRequirements?: CardRequirements;

  /** Section type this layout belongs to */
  sectionType?: string;
}

/**
 * Enhanced layout registry with card requirements
 */
export type EnhancedLayoutRegistry = {
  [sectionType: string]: {
    [layoutName: string]: LayoutConfig;
  };
};

/**
 * Layout requirements for strategy generation
 */
export interface LayoutRequirement {
  /** Section ID (e.g., 'hero', 'features') */
  sectionId: string;

  /** Section type for mapping */
  sectionType: string;

  /** Selected layout/UIBlock name */
  layoutName: string;

  /** Card requirements from the layout */
  cardRequirements: CardRequirements;
}

/**
 * Complete layout requirements for a page
 */
export interface PageLayoutRequirements {
  /** Array of layout requirements for each section */
  sections: LayoutRequirement[];

  /** Total user-provided features that must be included */
  userProvidedFeatures?: number;
}

/**
 * Maps generic section types to specific UIBlock implementations
 */
export interface SectionTypeMapping {
  [genericType: string]: {
    sectionId: string;
    layoutName: string;
  };
}
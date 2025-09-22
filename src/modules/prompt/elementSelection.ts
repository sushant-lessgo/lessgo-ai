// modules/prompt/elementSelection.ts - Element selection logic for UIBlocks

import { logger } from '@/lib/logger';

/**
 * Element priority levels for selection
 */
export enum ElementPriority {
  CORE = 'core',           // Always required
  STRATEGIC = 'strategic', // Required for conversion strategy
  OPTIONAL = 'optional',   // Nice to have but not essential
  ADVANCED = 'advanced'    // Advanced features, rarely needed
}

/**
 * Element selection configuration for UIBlock types
 */
export interface ElementConfig {
  [elementKey: string]: {
    priority: ElementPriority;
    description?: string;
  };
}

/**
 * UIBlock-specific element configurations
 */
export const UIBLOCK_ELEMENT_CONFIGS: Record<string, ElementConfig> = {
  // Hero sections
  'Hero.splitScreen': {
    headline: { priority: ElementPriority.CORE },
    subheadline: { priority: ElementPriority.CORE },
    cta_text: { priority: ElementPriority.CORE },
    supporting_text: { priority: ElementPriority.STRATEGIC },
    value_proposition: { priority: ElementPriority.STRATEGIC },
    badge_text: { priority: ElementPriority.OPTIONAL },
    trust_items: { priority: ElementPriority.STRATEGIC },
    customer_count: { priority: ElementPriority.OPTIONAL },
    rating_value: { priority: ElementPriority.OPTIONAL },
    rating_count: { priority: ElementPriority.OPTIONAL },
    show_social_proof: { priority: ElementPriority.OPTIONAL },
    show_customer_avatars: { priority: ElementPriority.OPTIONAL },
    avatar_count: { priority: ElementPriority.ADVANCED },
    customer_names: { priority: ElementPriority.ADVANCED },
    avatar_urls: { priority: ElementPriority.ADVANCED },
    trust_item_1: { priority: ElementPriority.ADVANCED },
    trust_item_2: { priority: ElementPriority.ADVANCED },
    trust_item_3: { priority: ElementPriority.ADVANCED },
    trust_item_4: { priority: ElementPriority.ADVANCED },
    trust_item_5: { priority: ElementPriority.ADVANCED },
    split_hero_image: { priority: ElementPriority.ADVANCED }
  },

  'Hero.leftCopyRightImage': {
    headline: { priority: ElementPriority.CORE },
    subheadline: { priority: ElementPriority.CORE },
    cta_text: { priority: ElementPriority.CORE },
    supporting_text: { priority: ElementPriority.STRATEGIC },
    value_proposition: { priority: ElementPriority.STRATEGIC },
    badge_text: { priority: ElementPriority.OPTIONAL },
    trust_items: { priority: ElementPriority.STRATEGIC }
  },

  'Hero.centerStacked': {
    headline: { priority: ElementPriority.CORE },
    subheadline: { priority: ElementPriority.CORE },
    cta_text: { priority: ElementPriority.CORE },
    supporting_text: { priority: ElementPriority.STRATEGIC },
    badge_text: { priority: ElementPriority.OPTIONAL }
  },

  // CTA sections
  'Cta.VisualCTAWithMockup': {
    headline: { priority: ElementPriority.CORE },
    cta_text: { priority: ElementPriority.CORE },
    subheadline: { priority: ElementPriority.STRATEGIC },
    secondary_cta: { priority: ElementPriority.OPTIONAL },
    mockup_image: { priority: ElementPriority.STRATEGIC },
    trust_item_1: { priority: ElementPriority.OPTIONAL },
    trust_item_2: { priority: ElementPriority.OPTIONAL },
    trust_item_3: { priority: ElementPriority.OPTIONAL },
    trust_item_4: { priority: ElementPriority.ADVANCED },
    trust_item_5: { priority: ElementPriority.ADVANCED }
  },

  // Process Flow sections
  'UniqueMechanism.ProcessFlowDiagram': {
    headline: { priority: ElementPriority.CORE },
    subheadline: { priority: ElementPriority.STRATEGIC },
    process_steps: { priority: ElementPriority.CORE },
    step_descriptions: { priority: ElementPriority.CORE },
    benefits_title: { priority: ElementPriority.STRATEGIC },
    benefit_titles: { priority: ElementPriority.STRATEGIC },
    benefit_descriptions: { priority: ElementPriority.STRATEGIC },
    benefit_icon_1: { priority: ElementPriority.ADVANCED },
    benefit_icon_2: { priority: ElementPriority.ADVANCED },
    benefit_icon_3: { priority: ElementPriority.ADVANCED }
  },

  // Generic fallback for unknown UIBlocks
  'Generic': {
    headline: { priority: ElementPriority.CORE },
    subheadline: { priority: ElementPriority.STRATEGIC },
    cta_text: { priority: ElementPriority.CORE },
    description: { priority: ElementPriority.STRATEGIC }
  }
};

/**
 * Selection strategy based on business context
 */
export interface SelectionStrategy {
  maxElements: number;
  includePriorities: ElementPriority[];
  description: string;
}

export const SELECTION_STRATEGIES: Record<string, SelectionStrategy> = {
  'minimal': {
    maxElements: 5,
    includePriorities: [ElementPriority.CORE],
    description: 'Core elements only for clean, focused layout'
  },
  'balanced': {
    maxElements: 8,
    includePriorities: [ElementPriority.CORE, ElementPriority.STRATEGIC],
    description: 'Core + strategic elements for conversion optimization'
  },
  'comprehensive': {
    maxElements: 12,
    includePriorities: [ElementPriority.CORE, ElementPriority.STRATEGIC, ElementPriority.OPTIONAL],
    description: 'All essential elements for detailed presentation'
  },
  'advanced': {
    maxElements: 20,
    includePriorities: [ElementPriority.CORE, ElementPriority.STRATEGIC, ElementPriority.OPTIONAL, ElementPriority.ADVANCED],
    description: 'All available elements for maximum customization'
  }
};

/**
 * Selects appropriate elements for a UIBlock based on strategy and constraints
 */
export function selectElementsForUIBlock(
  sectionId: string,
  layoutName: string,
  aiContent: Record<string, any>,
  strategy: string = 'balanced'
): {
  selectedElements: Record<string, any>;
  removedElements: string[];
  warnings: string[];
} {
  const uiBlockKey = `${sectionId}.${layoutName}`;
  const elementConfig = UIBLOCK_ELEMENT_CONFIGS[uiBlockKey] || UIBLOCK_ELEMENT_CONFIGS['Generic'];
  const selectionStrategy = SELECTION_STRATEGIES[strategy] || SELECTION_STRATEGIES['balanced'];

  const selectedElements: Record<string, any> = {};
  const removedElements: string[] = [];
  const warnings: string[] = [];

  logger.debug(`🎯 Element selection for ${uiBlockKey}:`, {
    strategy,
    maxElements: selectionStrategy.maxElements,
    includePriorities: selectionStrategy.includePriorities,
    availableElements: Object.keys(aiContent).length
  });

  // Create priority-sorted list of elements
  const elementPriorities: Array<{
    key: string;
    value: any;
    priority: ElementPriority;
    priorityWeight: number;
  }> = [];

  const priorityWeights = {
    [ElementPriority.CORE]: 4,
    [ElementPriority.STRATEGIC]: 3,
    [ElementPriority.OPTIONAL]: 2,
    [ElementPriority.ADVANCED]: 1
  };

  Object.entries(aiContent).forEach(([key, value]) => {
    const config = elementConfig[key];
    const priority = config?.priority || ElementPriority.OPTIONAL;
    const priorityWeight = priorityWeights[priority];

    elementPriorities.push({
      key,
      value,
      priority,
      priorityWeight
    });
  });

  // Sort by priority weight (higher first)
  elementPriorities.sort((a, b) => b.priorityWeight - a.priorityWeight);

  // Select elements based on strategy
  let selectedCount = 0;

  for (const element of elementPriorities) {
    const shouldInclude = selectionStrategy.includePriorities.includes(element.priority);
    const withinLimit = selectedCount < selectionStrategy.maxElements;

    if (shouldInclude && withinLimit) {
      selectedElements[element.key] = element.value;
      selectedCount++;
    } else {
      removedElements.push(element.key);
      if (element.priority === ElementPriority.CORE) {
        warnings.push(`Core element '${element.key}' was excluded due to strategy limits`);
      }
    }
  }

  logger.debug(`✅ Element selection completed for ${uiBlockKey}:`, {
    selectedCount,
    removedCount: removedElements.length,
    warningCount: warnings.length,
    coreElementsIncluded: Object.keys(selectedElements).filter(key =>
      elementConfig[key]?.priority === ElementPriority.CORE
    ).length
  });

  return {
    selectedElements,
    removedElements,
    warnings
  };
}

/**
 * Determines selection strategy based on business context
 */
export function determineSelectionStrategy(
  marketSophistication: string,
  copyIntent: string,
  sectionType: string
): string {
  // Market sophistication influences detail level
  if (marketSophistication === 'level-5' || marketSophistication === 'level-4') {
    return 'comprehensive'; // High sophistication needs more proof elements
  }

  if (marketSophistication === 'level-1') {
    return 'minimal'; // Simple market needs clean presentation
  }

  // Copy intent influences element selection
  if (copyIntent === 'urgency-led' || copyIntent === 'fear-led') {
    return 'balanced'; // Focus on core conversion elements
  }

  if (copyIntent === 'desire-led') {
    return 'comprehensive'; // Need more aspirational elements
  }

  // Section-specific strategies
  if (sectionType === 'hero' || sectionType === 'cta') {
    return 'balanced'; // Critical sections need strategic focus
  }

  // Default balanced approach
  return 'balanced';
}

/**
 * Processes all sections with element selection
 */
export function applyElementSelection(
  content: Record<string, any>,
  elementsMap: any,
  marketSophistication: string = 'level-3',
  copyIntent: string = 'desire-led'
): {
  processedContent: Record<string, any>;
  selectionReport: Record<string, {
    strategy: string;
    selectedCount: number;
    removedCount: number;
    warnings: string[];
  }>;
} {
  const processedContent: Record<string, any> = {};
  const selectionReport: Record<string, any> = {};

  Object.entries(content).forEach(([sectionId, sectionContent]) => {
    if (!sectionContent || typeof sectionContent !== 'object') {
      processedContent[sectionId] = sectionContent;
      return;
    }

    const sectionInfo = elementsMap[sectionId];
    if (!sectionInfo) {
      processedContent[sectionId] = sectionContent;
      return;
    }

    const { sectionType, layout } = sectionInfo;
    const strategy = determineSelectionStrategy(marketSophistication, copyIntent, sectionType);

    const result = selectElementsForUIBlock(
      sectionType,
      layout || 'default',
      sectionContent as Record<string, any>,
      strategy
    );

    processedContent[sectionId] = result.selectedElements;
    selectionReport[sectionId] = {
      strategy,
      selectedCount: Object.keys(result.selectedElements).length,
      removedCount: result.removedElements.length,
      warnings: result.warnings
    };
  });

  logger.info('🎯 Element selection summary:', {
    totalSections: Object.keys(content).length,
    processedSections: Object.keys(selectionReport).length,
    totalWarnings: Object.values(selectionReport).reduce((sum: number, report: any) => sum + report.warnings.length, 0)
  });

  return {
    processedContent,
    selectionReport
  };
}
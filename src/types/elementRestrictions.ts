import { UniversalElementType } from './universalElements';

/**
 * TypeScript types for the Element Restriction System
 * 
 * These types support the restriction configuration and logic
 * for preventing incompatible elements from being added to UIBlocks.
 */

/**
 * Core restriction interface defining what elements are allowed
 * and the reasoning behind restrictions
 */
export interface ElementRestriction {
  allowedElements: UniversalElementType[];
  reason: string;
  restrictionLevel: 'strict' | 'moderate' | 'flexible';
}

/**
 * Result of checking restrictions for a specific context
 */
export interface RestrictionResult {
  restrictedElements: UniversalElementType[];
  allowedElements: UniversalElementType[];
  restriction: ElementRestriction;
  hasRestrictions: boolean;
}

/**
 * Summary information about restrictions for UI display
 */
export interface RestrictionSummary {
  level: 'strict' | 'moderate' | 'flexible';
  restrictedCount: number;
  allowedCount: number;
  totalCount: number;
  reason: string;
  hasAnyRestrictions: boolean;
}

/**
 * Validation result for element addition attempts
 */
export interface ElementAdditionValidation {
  allowed: boolean;
  reason?: string;
  suggestion?: string;
}

/**
 * Element categorization with restriction status
 */
export interface CategorizedElements {
  allowed: UniversalElementType[];
  restricted: UniversalElementType[];
}

/**
 * Elements grouped by category with restriction status
 */
export interface ElementsByCategory {
  text: CategorizedElements;
  interactive: CategorizedElements;
  media: CategorizedElements;
  layout: CategorizedElements;
}

/**
 * Debug information about active restrictions
 */
export interface RestrictionDebugInfo {
  sectionType: string;
  layoutType?: string;
  hasLayoutRestriction: boolean;
  hasSectionRestriction: boolean;
  activeRestriction: ElementRestriction;
  restrictionSource: 'layout' | 'section' | 'default';
  restrictedElements: UniversalElementType[];
  allowedElements: UniversalElementType[];
}

/**
 * Context information for restriction checking
 */
export interface RestrictionContext {
  sectionType: string;
  layoutType?: string;
  sectionId?: string;
  additionalMetadata?: Record<string, any>;
}

/**
 * Options for the element picker with restriction support
 */
export interface ElementPickerOptions {
  categories?: ('text' | 'interactive' | 'media' | 'layout')[];
  excludeTypes?: UniversalElementType[];
  restrictedTypes?: UniversalElementType[];
  restrictionReason?: string;
  restrictionContext?: RestrictionContext;
  showRestrictedElements?: boolean;
  allowRestrictedElementsWithWarning?: boolean;
}

/**
 * Restriction category display configuration
 */
export interface RestrictionCategoryConfig {
  label: string;
  description: string;
  color: 'red' | 'yellow' | 'green';
}

/**
 * Configuration for restriction categories
 */
export type RestrictionCategories = Record<'strict' | 'moderate' | 'flexible', RestrictionCategoryConfig>;

/**
 * Element category mapping
 */
export type ElementCategoryMapping = Record<'text' | 'interactive' | 'media' | 'layout', UniversalElementType[]>;

/**
 * Section restriction configuration
 */
export type SectionRestrictions = Record<string, ElementRestriction>;

/**
 * Layout restriction configuration
 */
export type LayoutRestrictions = Record<string, ElementRestriction>;

/**
 * Hook return type for element restrictions
 */
export interface UseElementRestrictions {
  restrictions: RestrictionResult;
  summary: RestrictionSummary;
  isElementAllowed: (elementType: UniversalElementType) => boolean;
  validateElementAddition: (elementType: UniversalElementType) => ElementAdditionValidation;
  filterElements: <T extends { type: UniversalElementType }>(elements: T[]) => T[];
  updateContext: (context: RestrictionContext) => void;
  debugInfo: RestrictionDebugInfo;
}

/**
 * Toolbar action context with restriction support
 */
export interface ToolbarActionContext {
  sectionId: string;
  sectionType: string;
  layoutType?: string;
  restrictions: RestrictionResult;
  position?: number;
  referenceElement?: string;
}

/**
 * Element picker state with restrictions
 */
export interface ElementPickerState {
  isOpen: boolean;
  context?: RestrictionContext;
  restrictions?: RestrictionResult;
  position?: { x: number; y: number };
  options?: ElementPickerOptions;
  onElementSelect?: (elementType: UniversalElementType) => void;
  onClose?: () => void;
}

/**
 * Event data for restriction-related events
 */
export interface RestrictionEvent {
  type: 'element_restricted' | 'element_allowed' | 'restriction_bypassed';
  elementType: UniversalElementType;
  context: RestrictionContext;
  restriction: ElementRestriction;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Configuration for restriction override (for admin/dev modes)
 */
export interface RestrictionOverride {
  enabled: boolean;
  allowedSections?: string[];
  allowedLayouts?: string[];
  requireConfirmation?: boolean;
  logOverrides?: boolean;
}

/**
 * Restriction analytics data
 */
export interface RestrictionAnalytics {
  restrictionHits: Record<string, number>;
  bypassAttempts: Record<string, number>;
  mostRestrictedElements: UniversalElementType[];
  mostRestrictedSections: string[];
  userFeedback: {
    helpfulReasons: number;
    confusingReasons: number;
    suggestionsUsed: number;
  };
}
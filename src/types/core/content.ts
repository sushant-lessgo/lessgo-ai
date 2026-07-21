// types/content.ts - Core content structure types with taxonomy constraints
import type { ImageAsset, VideoData, IconData } from './images';
import type { BackgroundType, SectionBackground } from '../sectionBackground';
import type {
  MarketCategory,
  MarketSubcategory,
  TargetAudience,
  StartupStage,
  LandingGoalType,
  PricingModel,
  AwarenessLevel,
  CopyIntent,
  ToneProfile,
  MarketSophisticationLevel,
  ProblemType
} from '@/modules/inference/taxonomy';

/**
 * ===== CANONICAL INPUT VARIABLES =====
 */

export interface InputVariables {
  marketCategory: MarketCategory;
  marketSubcategory: MarketSubcategory;
  targetAudience: TargetAudience;
  keyProblem: string;
  startupStage: StartupStage;
  landingPageGoals: LandingGoalType;
  pricingModel: PricingModel;
}

export interface HiddenInferredFields {
  awarenessLevel?: AwarenessLevel;
  copyIntent?: CopyIntent;
  toneProfile?: ToneProfile;
  marketSophisticationLevel?: MarketSophisticationLevel;
  problemType?: ProblemType;
}

export interface FeatureItem {
  feature: string;
  benefit: string;
}

/**
 * Asset Availability - Tracks which assets user has ready for layout selection
 * Used to intelligently select layouts that match available assets
 */
export interface AssetAvailability {
  productImages: boolean;        // Product screenshots, mockups, or product photos
  customerLogos: boolean;         // Company/customer logos for social proof
  testimonials: boolean;          // Customer testimonials, reviews, or quotes
  founderPhoto: boolean;          // Founder or team photos
  integrationLogos: boolean;      // Integration partner logos
  demoVideo: boolean;             // Product demo or walkthrough video
}

/**
 * ===== CONTENT HIERARCHY =====
 */

/**
 * ===== i18n CONTENT-LANGUAGE LAYER (i18n-phase-1, D1) =====
 *
 * Independent-authoring locale model: the flat `content` map above IS the
 * default locale (zero migration). Non-default locales live in a sibling
 * OVERLAY carrying text values only — structure (sections/layouts/metadata)
 * is never duplicated, so locales cannot structurally diverge.
 *
 * Both fields are OPTIONAL: legacy single-locale content omits them and sees
 * zero storage/behavior diff (back-compat law).
 */

/**
 * Per-project locale declaration. Absent ⇒ legacy single-locale project.
 *
 * ⚠️ NON-NULL ≠ MULTI-LOCALE (language-settings ruling 10). A SINGLE-locale
 * config — `{ locales: ['nl'], defaultLocale: 'nl' }` — is legal and meaningful:
 * it is the durable record that the site's declared language is Dutch, written
 * by onboarding and read by regeneration. It is NOT a signal to switch on any
 * multi-locale machinery. Gate every multi-locale surface (language pills,
 * published switcher, hreflang, overlay authoring) on `isMultiLocale()`
 * (`@/lib/i18n/localeContent`), never on `localeConfig != null`.
 */
export interface LocaleConfig {
  /** All declared locale codes (default included). e.g. ['en','nl']. */
  locales: string[];
  /** The locale whose copy lives in the flat `content` map. e.g. 'en'. */
  defaultLocale: string;
  /**
   * Published-page language-switcher widget style (publish layer only — it has
   * no effect in the editor). ABSENT ⇒ `'dropdown'` ⇒ exactly today's behavior
   * (zero-diff for every existing project). `'none'` suppresses the ENTIRE
   * switcher block on the published page — pill AND the geo auto-redirect —
   * because "no switcher" must mean "no automatic locale behavior at all".
   * hreflang/canonical emission is unaffected by this field.
   */
  switcherStyle?: 'dropdown' | 'none';
}

/**
 * Locale-keyed text overlay: locale → sectionId → elementKey → text value.
 * Overlay values are text only (`string | string[]`); an absent key falls
 * back to the default-locale copy in the flat `content` map.
 */
export interface LocaleContentOverlay {
  [locale: string]: {
    [sectionId: string]: {
      [elementKey: string]: string | string[];
    };
  };
}

export interface LandingPageContent {
  id: string;
  token: string;
  sections: string[];
  sectionLayouts: Record<string, string>;
  content: Record<string, SectionData>;
  theme: Theme;
  metadata: PageMetadata;
  createdAt: Date;
  updatedAt: Date;
  /** i18n (D1): non-default-locale text overlay. Absent ⇒ single-locale. */
  localeContent?: LocaleContentOverlay;
  /** i18n (D4): project locale declaration. Absent ⇒ single-locale. */
  localeConfig?: LocaleConfig;
}

export type SectionType = 
  | 'header'
  | 'hero' 
  | 'features' 
  | 'testimonials' 
  | 'pricing' 
  | 'faq' 
  | 'cta' 
  | 'problem'
  | 'results'
  | 'logos'
  | 'custom'
  | 'footer';

export interface SectionData {
  id: string;
  layout: string;
  // V2: Direct format - elements stored as values directly (string, array, etc.)
  elements: Record<string, any>;
  // V2: Button metadata stored separately (buttonConfig, etc.)
  // scale-04: `cta` is the new-shape CTA (CTAButton); `buttonConfig` stays for
  // legacy reads. Additive only — the normalization pre-pass bridges cta→buttonConfig.
  // editor phase-3 (phase 4): `alt` is the canonical user-authored alt store
  // (2026-07-11 law). `string` for single-image slots; itemId-keyed map for
  // collections (keyed by the COLLECTION key, e.g. elementMetadata.items.alt[itemId]).
  // Additive + optional — existing buttonConfig/cta readers are unaffected.
  elementMetadata?: Record<string, { buttonConfig?: any; cta?: import('@/types/destination').CTAButton; alt?: string | Record<string, string> }>;
  backgroundType?: BackgroundType;
  sectionBackground?: SectionBackground;
  media?: SectionMedia;
  cta?: SectionCTA;
  aiMetadata: AiGenerationMetadata;
  editMetadata: EditMetadata;
}

export interface EditableElement {
  content: string | string[] | number | boolean;
  type: ElementType;
  isEditable: boolean;
  editMode: ElementEditMode;
  validation?: ElementValidation;
  aiContext?: ElementAiContext;
  defaultValue?: string | string[];
  uiProps?: ElementUIProps;
  metadata?: Record<string, any>;
}

export type ElementType = 
  | 'text'
  | 'richtext'
  | 'headline'
  | 'subheadline'
  | 'list'
  | 'button'
  | 'image'
  | 'video'
  | 'form'
  | 'icon'
  | 'number'
  | 'url'
  | 'email'
  | 'phone'
  | 'custom';

export type ElementEditMode = 
  | 'inline'
  | 'modal'
  | 'sidebar'
  | 'toolbar'
  | 'dropdown'
  | 'readonly';

// Import enhanced background types
export type { 
  BackgroundType, 
  SectionBackground, 
  CustomBackground,
  BackgroundValidation,
  BackgroundCSS 
} from '../sectionBackground';

export interface SectionMedia {
  image?: ImageAsset;
  video?: VideoData;
  icon?: IconData;
  backgroundImage?: ImageAsset;
}

export interface SectionCTA {
  label: string;
  url?: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'small' | 'medium' | 'large';
  trackingId?: string;
  testVariant?: string;
  type?: 'link' | 'form' | 'email-form' | 'link-with-input';
  formId?: string;
  behavior?: 'scrollTo' | 'openModal';
  ctaType?: 'primary' | 'secondary'; // NEW: Identifies primary vs secondary CTA for form placement logic
  inputConfig?: {
    label?: string;
    placeholder?: string;
    queryParamName?: string;
  };
}

export interface AiGenerationMetadata {
  aiGenerated: boolean;
  lastGenerated?: number;
  isCustomized: boolean;
  aiGeneratedElements: string[];
  excludedElements?: string[]; // Elements that were excluded during AI generation
  originalPrompt?: string;
  generationContext?: AiGenerationContext;
  qualityScore?: number;
  alternatives?: AlternativeContent[];
}

export interface EditMetadata {
  isSelected: boolean;
  isEditing: boolean;
  lastModified?: number;
  lastModifiedBy?: string;
  isDeletable: boolean;
  isMovable: boolean;
  isDuplicable: boolean;
  validationStatus: ValidationStatus;
  completionPercentage: number;
}

export interface ElementValidation {
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customValidator?: string;
  errorMessage?: string;
}

export interface ElementAiContext {
  generationType: 'creative' | 'factual' | 'persuasive' | 'technical';
  contextElements: string[];
  instructions?: string;
  tone?: string;
  maxLength?: number;
  generateVariations: boolean;
}

export interface ElementUIProps {
  className?: string;
  style?: Record<string, string>;
  placeholder?: string;
  helpText?: string;
  icon?: string;
  showCharacterCount?: boolean;
  autoFocus?: boolean;
}

export interface AlternativeContent {
  content: string | string[];
  score: number;
  reasoning: string;
  generatedAt: number;
}

export interface ValidationStatus {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  missingRequired: string[];
  lastValidated: number;
}

export interface ValidationError {
  elementKey: string;
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ValidationWarning {
  elementKey: string;
  code: string;
  message: string;
  autoFixable: boolean;
  suggestion?: string;
}

export interface AiGenerationContext {
  inputVariables: InputVariables;
  hiddenFields: HiddenInferredFields;
  features: FeatureItem[];
  sectionType: SectionType;
  layoutType: string;
  surroundingContent?: Record<string, any>;
  userPreferences?: UserPreferences;
  testVariant?: string;
}

export interface UserPreferences {
  tone: string;
  length: 'short' | 'medium' | 'long';
  industryPreferences?: Record<string, any>;
  brandVoice?: string;
  restrictions?: string[];
}

export interface PageMetadata {
  title: string;
  description?: string;
  keywords?: string[];
  ogImage?: string;
  language: string;
  isPublished: boolean;
  publishedAt?: Date;
  slug: string;
  canonicalUrl?: string;
  customMeta?: Record<string, string>;
}

/**
 * ===== THEME SYSTEM =====
 */

export interface Theme {
  typography: TypographySettings;
  colors: ColorSystem;
  spacing: SpacingSystem;
  corners: CornerSettings;
  animations: AnimationSettings;
  uiBlockTheme?: 'warm' | 'cool' | 'neutral';
}

export interface TypographySettings {
  headingFont: string;
  bodyFont: string;
  scale: 'compact' | 'comfortable' | 'spacious';
  lineHeight: number;
  letterSpacing?: number;
  fontWeights: FontWeights;
}

export interface FontWeights {
  light: number;
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface ColorSystem {
  paletteId?: string;
  textureId?: string;
  baseColor: string;
  accentColor: string;
  accentCSS?: string;
  sectionBackgrounds: SectionBackgrounds;
  paletteMode?: 'dark' | 'light';
  paletteTemperature?: 'cool' | 'neutral' | 'warm';
  semantic: SemanticColors;
  states: StateColors;
  // Text colors for each background type - calculated once during generation
  textColors?: TextColorsForBackgrounds;
}

export interface SectionBackgrounds {
  primary?: string;
  secondary?: string;
  neutral?: string;
}

export interface SemanticColors {
  success: string;
  warning: string;
  error: string;
  info: string;
  neutral: string;
}

export interface StateColors {
  hover: Record<string, string>;
  focus: Record<string, string>;
  active: Record<string, string>;
  disabled: Record<string, string>;
}

export interface TextColorSet {
  heading: string;  // Hex color for headings
  body: string;     // Hex color for body text
  muted: string;    // Hex color for muted/secondary text
}

export interface TextColorsForBackgrounds {
  primary: TextColorSet;
  secondary: TextColorSet;
  neutral: TextColorSet;
  // For custom backgrounds
  custom?: TextColorSet;
}

export interface SpacingSystem {
  unit: number;
  scale: number[];
  presets: SpacingPresets;
}

export interface SpacingPresets {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

export interface CornerSettings {
  radius: number;
  scale: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
}

export interface AnimationSettings {
  enabled: boolean;
  duration: {
    fast: number;
    medium: number;
    slow: number;
  };
  easing: {
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
  reducedMotion: boolean;
}

/**
 * ===== BACKGROUND SYSTEM TYPES =====
 * Added additionally
 */

export interface BackgroundSystem {
  /** Primary background (hero sections, CTAs) */
  primary: string;
  /** Secondary background (features, content sections) */
  secondary: string;
  /** Neutral background (testimonials, white sections) */
  neutral: string;
  /** Base color name (e.g., "blue", "purple") */
  baseColor: string;
  /** Accent color name (e.g., "purple", "orange") */
  accentColor: string;
  /** Accent CSS class (e.g., "bg-purple-600") */
  accentCSS: string;
}

/**
 * Background variation from rule-based engine
 */
export interface BackgroundVariation {
  /** Unique variation identifier */
  variationId: string;
  /** Human-readable variation name */
  variationLabel: string;
  /** Archetype category (e.g., "soft-gradient-blur") */
  archetypeId: string;
  /** Theme identifier (e.g., "modern-blue") */
  themeId: string;
  /** Tailwind CSS class for the background */
  tailwindClass: string;
  /** Base color family (e.g., "blue", "purple") */
  baseColor: string;
}

/**
 * Brand colors for background compatibility
 */
export interface BrandColors {
  /** Primary brand color (hex format) */
  primary: string;
  /** Secondary brand color (optional, hex format) */
  secondary?: string;
}

/**
 * ===== TYPOGRAPHY TYPES =====
 */
export interface FontTheme {
  headingFont: string; // CSS font-family value
  bodyFont: string;    // CSS font-family value
}

export interface TypographyState {
  currentTheme: FontTheme;
  originalGenerated: FontTheme;
  customizations: Record<string, Partial<FontTheme>>; // section-level overrides
}
// types/index.ts - Main exports for the complete type system

/**
 * ===== TAXONOMY TYPES =====
 */
export type {
  MarketCategory,
  MarketSubcategory,
  StartupStage,
  TargetAudience,
  LandingGoalType,
  PricingModel,
  AwarenessLevel,
  ToneProfile,
  CopyIntent,
  ProblemType,
  MarketSophisticationLevel
} from '@/modules/inference/taxonomy';

/**
 * ===== TYPE GUARDS =====
 */
export {
  TypeGuards,
  isInputVariables,
  isHiddenInferredFields,
  isFeatureItem,
  isFeatureItemArray,
  isMarketCategory,
  isMarketSubcategory,
  isTargetAudience,
  isStartupStage,
  isLandingGoalType,
  isPricingModel,
  isAwarenessLevel,
  isMarketSophisticationLevel,
  isToneProfile,
  isCopyIntent,
  isProblemType,
  validateCompleteInputData,
  safeParseInputVariables,
  safeParseHiddenInferredFields,
  normalizeInputVariables,
  normalizeHiddenInferredFields,
  assertInputVariables,
  assertHiddenInferredFields,
  assertFeatureItemArray
} from '@/utils/typeGuards';

/**
 * ===== CORE CONTENT TYPES =====
 */
export type {
  InputVariables,
  HiddenInferredFields,
  FeatureItem,
  LandingPageContent,
  SectionData,
  EditableElement,
  ElementType,
  ElementEditMode,
  BackgroundType,
  ThemeColorType,
  SectionBackground,
  CustomBackground,
  BackgroundValidation,
  BackgroundCSS,
  SectionType,
  SectionMedia,
  SectionCTA,
  AiGenerationMetadata,
  EditMetadata,
  ValidationStatus,
  ValidationError,
  ValidationWarning,
  Theme,
  TypographySettings,
  ColorSystem,
  SectionBackgrounds,
  SpacingSystem,
  PageMetadata,
  FontTheme,
  TypographyState,
} from './content';

/**
 * ===== AI GENERATION TYPES =====
 */
export type {
  AIGenerationType,
  BaseAIGenerationRequest,
  PageGenerationRequest,
  PageGenerationResponse,
  SectionRegenerationRequest,
  SectionRegenerationResponse,
  ElementRegenerationRequest,
  ElementRegenerationResponse,
  BaseAIResponse,
  AIError,
  UsageMetrics,
  SectionContent,
  PageGenerationContext,
  RegenerationInstructions,
  AIServiceConfig,
  RetryConfig,
  RateLimitConfig,
  QualityMetrics,
  ThemeRecommendations,
  SEOSuggestions,
  BatchGenerationRequest,
  BatchGenerationResponse,
} from './ai';

/**
 * ===== FORMS SYSTEM TYPES =====
 */
export type {
  FormData,
  FormField,
  FormFieldType,
  FormSettings,
  FormFieldOptions,
  SelectOption,
  FileUploadOptions,
  NumberInputOptions,
  DateTimeOptions,
  TextInputOptions,
  FieldValidation,
  GlobalValidation,
  ValidationTiming,
  ConditionalLogic,
  VisibilityCondition,
  EnabledCondition,
  FormIntegration,
  FormIntegrationType,
  IntegrationConfig,
  IntegrationMapping,
  FormStyling,
  FormLayout,
  FormColorScheme,
  FormTypography,
  FormBuilderState,
  FieldTypeDefinition,
  DragState,
  FormBuilderHistory,
  FormTemplate,
  FormOptimization,
  OptimizationRecommendation,
  FormTesting,
  FormVariant,
  TrafficAllocation,
  FormCollaboration,
  Collaborator,
  FormComment,
} from './forms';

/**
 * ===== SECTION BACKGROUND TYPES =====
 */
export type {
  CustomBackgroundStyle,
  GradientType,
  GradientStop,
  SolidBackground,
  LinearGradient,
  RadialGradient,
  GradientConfig,
  BrandColorSuggestion,
  GradientPreset,
  BackgroundPickerMode,
  BackgroundPickerState,
} from '../sectionBackground';

/**
 * ===== IMAGES SYSTEM TYPES =====
 */
export type {
  ImageAsset,
  VideoData,
  IconData,
  ImageSource,
  ImageUrls,
  ImageMetadata,
  ImageProperties,
  ImageQuality,
  QualitySuitability,
  ContentAnalysis,
  DetectedObject,
  FaceDetection,
  TextDetection,
  ColorAnalysis,
  ImageOptimization,
  OptimizationTechnique,
  CDNInfo,
  LazyLoadingConfig,
  ImageUsage,
  ProjectUsage,
  UsagePerformance,
  GeographicUsage,
  ImageLicensing,
  LicenseType,
  UsageRights,
  AttributionRequirements,
  ImageAIContext,
  AIGenerationParameters,
  AIContentSafety,
  StockPhotoSearchRequest,
  StockPhotoSearchResponse,
  StockPhotoResult,
  ImageCollection,
  CollectionMetadata,
  CollectionSharing,
} from './images';

/**
 * ===== UI STATE TYPES =====
 */
export type {
  AppMode,
  EditMode,
  ElementSelection,
  SelectionMetadata,
  MultiSelection,
  SelectionContext,
  ToolbarState,
  ToolbarType,
  ToolbarAction,
  ToolbarActionType,
  ActionState,
  KeyboardShortcut,
  PanelState,
  PanelType,
  PanelContent,
  PanelContentType,
  PanelTab,
  PanelBehavior,
  NavigationState,
  RouteInfo,
  NavigationHistory,
  BreadcrumbItem,
  MenuState,
  MenuItem,
  SearchConfig,
  SearchType,
  FilterConfig,
  FilterType,
  SuggestionConfig,
  StatusIndicator,
  StatusType,
  LoadingState,
  LoadingType,
  LoadingProgress,
  ToastNotification,
  NotificationType,
  NotificationAction,
  NotificationPosition,
  ResponsiveState,
  Breakpoint,
  DeviceInfo,
  BrowserInfo,
  DragDropState,
  DragSource,
  DropTarget,
  DragData,
  DropZone,
  UIThemeState,
  UITheme,
  UIColors,
  UITypography,
  UISpacing,
  AccessibilityState,
  ScreenReaderState,
  KeyboardNavigationState,
  FocusManagementState,
  ColorContrastState,
   ColorTokens,
  ColorSelectorTier,
  ColorIntensityLevel,
  TextContrastLevel,
  ResetScope,
  UndoableAction,
  ActionHistoryItem,
  UndoRedoState,
  Toast,
  ToastActions,
  EditablePageRendererProps,
  EditableInteraction,
  ContentEditingState,
} from './ui';

/**
 * ===== API TYPES =====
 */
export type {
  ApiResponse,
  ApiError,
  ErrorDetails,
  ValidationError as ApiValidationError,
  ResponseMetadata,
  ParseInputRequest,
  ParseInputResponse,
  FieldExtraction,
  InputAnalysis,
  MarketInsightsRequest,
  MarketInsightsResponse,
  GeneratePageRequest,
  GeneratePageResponse,
  GenerationOptions,
  GenerationMetadata,
  ContentQuality,
  RegenerateContentRequest,
  RegenerateContentResponse,
  RegenerationParameters,
  ToneAdjustments,
  LengthPreferences,
  SaveDraftRequest,
  SaveDraftResponse,
  LoadDraftRequest,
  LoadDraftResponse,
  DraftData,
  DraftMetadata,
  CreateProjectRequest,
  CreateProjectResponse,
  UpdateProjectRequest,
  ProjectMetadata,
  ProjectStatus,
  UploadAssetRequest,
  UploadAssetResponse,
  AssetUrls,
  AssetMetadata,
  ProcessingStatus,
  ExportProjectRequest,
  ExportProjectResponse,
  ExportFormat,
  ExportOptions,
  ExportStatus,
  AnalyticsRequest,
  AnalyticsResponse,
  AnalyticsMetric,
  AnalyticsDimension,
  AnalyticsData,
  WebhookPayload,
  WebhookEvent,
  WebhookConfig,
} from './api';

/**
 * ===== UTILITY TYPES =====
 */

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireProperties<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalProperties<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type Brand<T, B> = T & { __brand: B };

export type SectionId = Brand<string, 'SectionId'>;
export type ElementId = Brand<string, 'ElementId'>;
export type FormId = Brand<string, 'FormId'>;
export type ImageId = Brand<string, 'ImageId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type UserId = Brand<string, 'UserId'>;

export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;
export type Callback<T = void> = () => T;
export type AsyncCallback<T = void> = () => Promise<T>;
export type CallbackWithParam<P, T = void> = (param: P) => T;
export type AsyncCallbackWithParam<P, T = void> = (param: P) => Promise<T>;

export type Timestamp = number;
export type DateString = string;
export type URLString = string;
export type EmailString = string;
export type ColorString = string;
export type CSSString = string;

/**
 * ===== FIELD NAME MAPPINGS =====
 */

export const CANONICAL_FIELD_NAMES = [
  'marketCategory',
  'marketSubcategory', 
  'targetAudience',
  'keyProblem',
  'startupStage',
  'landingPageGoals',
  'pricingModel'
] as const;

export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  marketCategory: 'Market Category',
  marketSubcategory: 'Market Subcategory',
  targetAudience: 'Target Audience', 
  keyProblem: 'Key Problem Getting Solved',
  startupStage: 'Startup Stage',
  landingPageGoals: 'Landing Page Goals',
  pricingModel: 'Pricing Category and Model'
} as const;

export const DISPLAY_TO_CANONICAL = {
  'Market Category': 'marketCategory',
  'Market Subcategory': 'marketSubcategory',
  'Target Audience': 'targetAudience',
  'Key Problem Getting Solved': 'keyProblem',
  'Startup Stage': 'startupStage',
  'Landing Page Goals': 'landingPageGoals',
  'Pricing Category and Model': 'pricingModel'
} as const;

// Hidden AI-inferred field names (not part of onboarding flow)
export const HIDDEN_FIELD_NAMES = [
  'awarenessLevel',
  'copyIntent', 
  'toneProfile',
  'marketSophisticationLevel',
  'problemType'
] as const;

export const HIDDEN_FIELD_DISPLAY_NAMES: Record<string, string> = {
  awarenessLevel: 'Awareness Level',
  copyIntent: 'Copy Intent',
  toneProfile: 'Tone Profile',
  marketSophisticationLevel: 'Market Sophistication',
  problemType: 'Problem Type'
};

export type CanonicalFieldName = typeof CANONICAL_FIELD_NAMES[number];
export type HiddenFieldName = typeof HIDDEN_FIELD_NAMES[number];
export type AnyFieldName = CanonicalFieldName | HiddenFieldName;
export type DisplayFieldName = typeof FIELD_DISPLAY_NAMES[CanonicalFieldName];

/**
 * ===== VALIDATION HELPERS =====
 */

export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};

export const isNonEmptyString = (value: any): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isNonEmptyArray = <T>(value: any): value is T[] => {
  return Array.isArray(value) && value.length > 0;
};

export const isNonEmptyObject = (value: any): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && Object.keys(value).length > 0;
};

/**
 * ===== ERROR TYPES =====
 */

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: Date;
}

export interface AppValidationError extends AppError {
  field?: string;
  value?: any;
  constraint?: string;
}

export interface NetworkError extends AppError {
  status?: number;
  statusText?: string;
  url?: string;
  method?: string;
}

export interface BusinessError extends AppError {
  operation: string;
  entity?: string;
  entityId?: string;
}

/**
 * ===== BACKGROUND SYSTEM TYPES =====
 */

/**
 * Complete background system for a landing page
 */
export interface BackgroundSystem {
  /** Primary background (hero sections, CTAs) */
  primary: string;
  /** Secondary background (features, content sections) */
  secondary: string;
  /** Neutral background (testimonials, white sections) */
  neutral: string;
  /** Divider background (subtle separators) */
  divider: string;
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
 * Background selector mode
 */
export type BackgroundSelectorMode = 'generated' | 'brand' | 'custom';

/**
 * ===== BACKGROUND VALIDATION TYPES =====
 */

/**
 * Complete validation result for a background
 */
export interface BackgroundValidationResult {
  /** Is the background valid */
  isValid: boolean;
  /** Overall validation score (0-100) */
  score: number;
  /** Validation warnings */
  warnings: BackgroundValidationWarning[];
  /** Validation errors */
  errors: BackgroundValidationError[];
  /** Improvement suggestions */
  suggestions: BackgroundValidationSuggestion[];
  /** Accessibility analysis */
  accessibility: BackgroundAccessibilityCheck;
  /** Performance analysis */
  performance: BackgroundPerformanceCheck;
  /** Brand alignment analysis */
  brandAlignment: BackgroundBrandAlignmentCheck;
}

/**
 * Background validation warning
 */
export interface BackgroundValidationWarning {
  /** Warning identifier */
  id: string;
  /** Warning category */
  type: 'contrast' | 'performance' | 'accessibility' | 'brand' | 'usability';
  /** Warning severity level */
  severity: 'low' | 'medium' | 'high';
  /** Warning message */
  message: string;
  /** Additional details */
  details?: string;
  /** Suggested fix */
  fix?: string;
  /** Can be automatically fixed */
  autoFixable: boolean;
}

/**
 * Background validation error
 */
export interface BackgroundValidationError {
  /** Error identifier */
  id: string;
  /** Error category */
  type: 'contrast' | 'accessibility' | 'format' | 'compatibility';
  /** Error message */
  message: string;
  /** Error details */
  details: string;
  /** Suggested fix */
  fix: string;
  /** Is this error blocking */
  blocking: boolean;
}

/**
 * Background validation suggestion
 */
export interface BackgroundValidationSuggestion {
  /** Suggestion identifier */
  id: string;
  /** Suggestion category */
  type: 'improvement' | 'alternative' | 'optimization';
  /** Suggestion message */
  message: string;
  /** Suggested action */
  action?: string;
  /** Suggested value */
  value?: any;
}

/**
 * Background accessibility analysis
 */
export interface BackgroundAccessibilityCheck {
  /** Text contrast ratio */
  contrastRatio: number;
  /** WCAG compliance level */
  wcagLevel: 'AA' | 'AAA' | 'fail';
  /** Color blind safe */
  colorBlindSafe: boolean;
  /** Text readability score */
  readabilityScore: number;
  /** Accessibility issues found */
  issues: BackgroundAccessibilityIssue[];
}

/**
 * Background accessibility issue
 */
export interface BackgroundAccessibilityIssue {
  /** Issue type */
  type: 'contrast' | 'color-blind' | 'readability';
  /** Issue severity */
  severity: 'error' | 'warning' | 'info';
  /** Issue message */
  message: string;
  /** Suggested fix */
  fix?: string;
}

/**
 * Background performance analysis
 */
export interface BackgroundPerformanceCheck {
  /** Rendering complexity */
  complexity: 'low' | 'medium' | 'high';
  /** Rendering cost (0-100) */
  renderCost: number;
  /** Performance optimizations */
  optimizations: string[];
  /** Performance issues */
  issues: BackgroundPerformanceIssue[];
}

/**
 * Background performance issue
 */
export interface BackgroundPerformanceIssue {
  /** Issue type */
  type: 'complexity' | 'size' | 'compatibility';
  /** Issue message */
  message: string;
  /** Performance impact level */
  impact: 'low' | 'medium' | 'high';
  /** Suggested fix */
  fix?: string;
}

/**
 * Background brand alignment analysis
 */
export interface BackgroundBrandAlignmentCheck {
  /** Brand alignment score (0-100) */
  alignmentScore: number;
  /** Color harmony score (0-100) */
  colorHarmony: number;
  /** Brand consistency score (0-100) */
  consistencyScore: number;
  /** Brand alignment issues */
  issues: BackgroundBrandIssue[];
}

/**
 * Background brand alignment issue
 */
export interface BackgroundBrandIssue {
  /** Issue type */
  type: 'color-mismatch' | 'harmony' | 'consistency';
  /** Issue message */
  message: string;
  /** Issue severity */
  severity: 'low' | 'medium' | 'high';
  /** Improvement suggestion */
  suggestion?: string;
}

/**
 * Background validation context
 */
export interface BackgroundValidationContext {
  /** Validation mode */
  mode?: BackgroundSelectorMode;
  /** Target audience */
  targetAudience?: string;
  /** Page section types */
  sectionTypes?: string[];
  /** Performance requirements */
  performanceRequirements?: 'low' | 'medium' | 'high';
}

/**
 * Color harmony analysis result
 */
export interface ColorHarmonyInfo {
  /** Color relationship type */
  relationship: 'identical' | 'analogous' | 'complementary' | 'triadic' | 'neutral' | 'clash';
  /** Harmony score (0-100) */
  score: number;
  /** Harmony description */
  description: string;
}

/**
 * ===== FIELD NAME NORMALIZATION =====
 */

export const normalizeFieldName = (input: string): CanonicalFieldName | null => {
  const normalizations: Record<string, CanonicalFieldName> = {
    'market category': 'marketCategory',
    'market subcategory': 'marketSubcategory',
    'target audience': 'targetAudience',
    'key problem': 'keyProblem',
    'startup stage': 'startupStage',
    'landing page goals': 'landingPageGoals',
    'pricing model': 'pricingModel',
    'market_category': 'marketCategory',
    'market_subcategory': 'marketSubcategory',
    'target_audience': 'targetAudience',
    'key_problem': 'keyProblem',
    'startup_stage': 'startupStage',
    'landing_page_goals': 'landingPageGoals',
    'pricing_model': 'pricingModel',
    'market-category': 'marketCategory',
    'market-subcategory': 'marketSubcategory',
    'target-audience': 'targetAudience',
    'key-problem': 'keyProblem',
    'startup-stage': 'startupStage',
    'landing-page-goals': 'landingPageGoals',
    'pricing-model': 'pricingModel',
    'Market Category': 'marketCategory',
    'Market Subcategory': 'marketSubcategory',
    'Target Audience': 'targetAudience',
    'Key Problem Getting Solved': 'keyProblem',
    'Startup Stage': 'startupStage',
    'Landing Page Goals': 'landingPageGoals',
    'Pricing Category and Model': 'pricingModel',
    'landingGoal': 'landingPageGoals',
    'landing_goal': 'landingPageGoals',
    'landing-goal': 'landingPageGoals',
    'Landing Goal': 'landingPageGoals',
    'pricing': 'pricingModel',
    'stage': 'startupStage',
    'audience': 'targetAudience',
    'problem': 'keyProblem',
    'category': 'marketCategory',
    'subcategory': 'marketSubcategory',
  };
  
  if (CANONICAL_FIELD_NAMES.includes(input as CanonicalFieldName)) {
    return input as CanonicalFieldName;
  }
  
  const normalized = normalizations[input.toLowerCase()];
  if (normalized) {
    return normalized;
  }
  
  return null;
};
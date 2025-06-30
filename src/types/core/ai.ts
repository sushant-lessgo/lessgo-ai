// types/ai.ts - AI generation and regeneration types
// Handles create mode generation + edit mode regeneration

import { InputVariables, HiddenInferredFields, FeatureItem, SectionType } from './content';

/**
 * ===== AI GENERATION LEVELS =====
 * The three levels of AI generation in the system
 */

/**
 * Types of AI generation requests
 */
export type AIGenerationType = 
  | 'page'        // Full page generation (create mode)
  | 'section'     // Single section regeneration (edit mode)
  | 'element';    // Individual element regeneration (edit mode)

/**
 * Base interface for all AI generation requests
 */
export interface BaseAIGenerationRequest {
  /** Type of generation being requested */
  type: AIGenerationType;
  
  /** Unique request ID for tracking */
  requestId: string;
  
  /** Timestamp of request */
  timestamp: number;
  
  /** User ID for tracking and personalization */
  userId?: string;
  
  /** A/B test variant */
  testVariant?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * ===== PAGE-LEVEL GENERATION =====
 * Used in create mode for initial page generation
 */

/**
 * Request for full page generation
 */
export interface PageGenerationRequest extends BaseAIGenerationRequest {
  type: 'page';
  
  /** Core input variables */
  inputVariables: InputVariables;
  
  /** AI-inferred fields */
  hiddenInferredFields: HiddenInferredFields;
  
  /** Extracted features */
  features: FeatureItem[];
  
  /** User's original one-liner description */
  originalDescription: string;
  
  /** Preferred page structure */
  preferredSections?: SectionType[];
  
  /** Content length preference */
  lengthPreference: 'concise' | 'standard' | 'detailed';
  
  /** Brand guidelines */
  brandGuidelines?: BrandGuidelines;
  
  /** Competitor analysis data */
  competitorAnalysis?: CompetitorAnalysis;
}

/**
 * Response from page generation
 */
export interface PageGenerationResponse extends BaseAIResponse {
  /** Generated sections in order */
  sections: string[];
  
  /** Layout assignments for each section */
  sectionLayouts: Record<string, string>;
  
  /** Generated content for each section */
  content: Record<string, SectionContent>;
  
  /** Background/theme suggestions */
  themeRecommendations: ThemeRecommendations;
  
  /** SEO metadata suggestions */
  seoSuggestions: SEOSuggestions;
  
  /** Content quality metrics */
  qualityMetrics: QualityMetrics;
  
  /** Alternative variations */
  alternatives?: PageAlternatives;
}

/**
 * ===== SECTION-LEVEL GENERATION =====
 * Used in edit mode for section regeneration
 */

/**
 * Request for section regeneration
 */
export interface SectionRegenerationRequest extends BaseAIGenerationRequest {
  type: 'section';
  
  /** Section ID to regenerate */
  sectionId: string;
  
  /** Section type */
  sectionType: SectionType;
  
  /** Current layout */
  currentLayout: string;
  
  /** Context from original page generation */
  pageContext: PageGenerationContext;
  
  /** Current content (for reference) */
  currentContent?: SectionContent;
  
  /** Specific regeneration instructions */
  instructions?: RegenerationInstructions;
  
  /** Surrounding sections for context */
  surroundingContext: SurroundingContext;
  
  /** User feedback on current content */
  userFeedback?: UserFeedback;
}

/**
 * Response from section regeneration
 */
export interface SectionRegenerationResponse extends BaseAIResponse {
  /** Section ID that was regenerated */
  sectionId: string;
  
  /** Generated content */
  content: SectionContent;
  
  /** Quality score */
  qualityScore: number;
  
  /** Reasoning for changes */
  reasoning: string;
  
  /** Alternative variations */
  alternatives: SectionAlternative[];
  
  /** Optimization suggestions */
  optimizationSuggestions: string[];
}

/**
 * ===== ELEMENT-LEVEL GENERATION =====
 * Used in edit mode for fine-grained content editing
 */

/**
 * Request for element regeneration
 */
export interface ElementRegenerationRequest extends BaseAIGenerationRequest {
  type: 'element';
  
  /** Section containing the element */
  sectionId: string;
  
  /** Element key to regenerate */
  elementKey: string;
  
  /** Element type */
  elementType: string;
  
  /** Current element content */
  currentContent: string | string[];
  
  /** Element context within section */
  elementContext: ElementContext;
  
  /** Page and section context */
  pageContext: PageGenerationContext;
  
  /** Specific generation parameters */
  generationParams: ElementGenerationParams;
  
  /** Number of variations to generate */
  variationCount: number;
  
  /** Content constraints */
  constraints: ElementConstraints;
}

/**
 * Response from element regeneration
 */
export interface ElementRegenerationResponse extends BaseAIResponse {
  /** Section and element that was regenerated */
  sectionId: string;
  elementKey: string;
  
  /** Primary generated content */
  content: string | string[];
  
  /** Alternative variations */
  variations: ElementVariation[];
  
  /** Reasoning for generated content */
  reasoning: string;
  
  /** Confidence score */
  confidence: number;
  
  /** Suggestions for improvement */
  suggestions: string[];
}

/**
 * ===== SUPPORTING TYPES =====
 */

/**
 * Base response interface for all AI operations
 */
export interface BaseAIResponse {
  /** Whether the request was successful */
  success: boolean;
  
  /** Request ID for tracking */
  requestId: string;
  
  /** Response timestamp */
  timestamp: number;
  
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Error details if unsuccessful */
  error?: AIError;
  
  /** Warnings that don't prevent success */
  warnings: string[];
  
  /** Whether response is partial/incomplete */
  isPartial: boolean;
  
  /** Model version used for generation */
  modelVersion: string;
  
  /** Usage metrics */
  usage: UsageMetrics;
}

/**
 * Error details for AI operations
 */
export interface AIError {
  /** Error code */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Technical error details */
  details?: string;
  
  /** Whether the error is retryable */
  retryable: boolean;
  
  /** Suggested retry delay in seconds */
  retryAfter?: number;
}

/**
 * Usage metrics for API calls
 */
export interface UsageMetrics {
  /** Tokens used for input */
  inputTokens: number;
  
  /** Tokens generated in response */
  outputTokens: number;
  
  /** Total tokens used */
  totalTokens: number;
  
  /** Estimated cost */
  estimatedCost?: number;
}

/**
 * Content for a single section
 */
export interface SectionContent {
  /** Key-value pairs of content elements */
  elements: Record<string, string | string[]>;
  
  /** Media recommendations */
  mediaRecommendations?: MediaRecommendations;
  
  /** CTA recommendations */
  ctaRecommendations?: CTARecommendations;
  
  /** A/B test variants */
  testVariants?: Record<string, any>;
}

/**
 * Page generation context for regeneration requests
 */
export interface PageGenerationContext {
  /** Original input variables */
  inputVariables: InputVariables;
  
  /** Hidden inferred fields */
  hiddenInferredFields: HiddenInferredFields;
  
  /** Feature list */
  features: FeatureItem[];
  
  /** Overall tone and style */
  toneProfile: string;
  
  /** Target audience details */
  audienceProfile: AudienceProfile;
  
  /** Brand positioning */
  brandPositioning: BrandPositioning;
}

/**
 * Instructions for regeneration
 */
export interface RegenerationInstructions {
  /** Specific changes requested */
  requestedChanges: string[];
  
  /** Tone adjustments */
  toneAdjustments?: ToneAdjustments;
  
  /** Length preferences */
  lengthPreferences?: LengthPreferences;
  
  /** Content focus areas */
  focusAreas: string[];
  
  /** Things to avoid */
  avoidanceList: string[];
  
  /** Reference materials */
  references?: string[];
}

/**
 * Context from surrounding sections
 */
export interface SurroundingContext {
  /** Previous section content */
  previousSection?: SectionContent;
  
  /** Next section content */
  nextSection?: SectionContent;
  
  /** Overall page flow */
  pageFlow: string[];
  
  /** Key messages to maintain consistency */
  keyMessages: string[];
}

/**
 * User feedback on content
 */
export interface UserFeedback {
  /** Overall satisfaction (1-10) */
  satisfaction: number;
  
  /** Specific feedback comments */
  comments: string[];
  
  /** Suggested improvements */
  suggestions: string[];
  
  /** Content that worked well */
  positivePoints: string[];
  
  /** Content that didn't work */
  negativePoints: string[];
}

/**
 * Element context within section
 */
export interface ElementContext {
  /** Other elements in the same section */
  siblingElements: Record<string, string>;
  
  /** Element's role in section */
  elementRole: 'primary' | 'secondary' | 'supporting';
  
  /** UI context (where element appears) */
  uiContext: string;
  
  /** Formatting requirements */
  formattingRequirements: FormattingRequirements;
}

/**
 * Parameters for element generation
 */
export interface ElementGenerationParams {
  /** Desired tone for this element */
  tone: string;
  
  /** Target length */
  targetLength: number;
  
  /** Creativity level (0-1) */
  creativityLevel: number;
  
  /** Whether to use humor */
  useHumor: boolean;
  
  /** Technical complexity level */
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  
  /** Persuasion style */
  persuasionStyle: 'logical' | 'emotional' | 'authoritative' | 'friendly';
}

/**
 * Constraints for element content
 */
export interface ElementConstraints {
  /** Maximum character count */
  maxLength: number;
  
  /** Minimum character count */
  minLength?: number;
  
  /** Required keywords to include */
  requiredKeywords: string[];
  
  /** Forbidden words or phrases */
  forbiddenWords: string[];
  
  /** Format requirements */
  format: 'plain' | 'markdown' | 'html';
  
  /** Language requirements */
  language: string;
  
  /** Accessibility requirements */
  accessibilityLevel: 'basic' | 'enhanced';
}

/**
 * Alternative variation for elements
 */
export interface ElementVariation {
  /** Variation content */
  content: string | string[];
  
  /** Quality score */
  score: number;
  
  /** What makes this variation different */
  differentiator: string;
  
  /** Use case for this variation */
  useCase: string;
  
  /** Performance prediction */
  performancePrediction?: PerformancePrediction;
}

/**
 * Alternative variations for sections
 */
export interface SectionAlternative {
  /** Alternative content */
  content: SectionContent;
  
  /** Quality score */
  score: number;
  
  /** Key differences from original */
  differences: string[];
  
  /** Recommended use case */
  recommendedFor: string;
}

/**
 * Alternative page variations
 */
export interface PageAlternatives {
  /** Alternative section arrangements */
  sectionArrangements: string[][];
  
  /** Alternative layout combinations */
  layoutCombinations: Record<string, string>[];
  
  /** Alternative tone variations */
  toneVariations: ToneVariation[];
  
  /** Alternative length versions */
  lengthVariations: LengthVariation[];
}

/**
 * Brand guidelines for content generation
 */
export interface BrandGuidelines {
  /** Brand voice description */
  voice: string;
  
  /** Brand personality traits */
  personality: string[];
  
  /** Preferred terminology */
  terminology: Record<string, string>;
  
  /** Words/phrases to avoid */
  avoidList: string[];
  
  /** Brand values to emphasize */
  values: string[];
  
  /** Industry-specific guidelines */
  industryGuidelines?: string[];
}

/**
 * Competitor analysis data
 */
export interface CompetitorAnalysis {
  /** Competitor websites analyzed */
  competitors: CompetitorInfo[];
  
  /** Common messaging patterns */
  messagingPatterns: string[];
  
  /** Differentiation opportunities */
  differentiationOpportunities: string[];
  
  /** Market positioning insights */
  positioningInsights: string[];
}

/**
 * Information about a competitor
 */
export interface CompetitorInfo {
  /** Competitor name */
  name: string;
  
  /** Website URL */
  url: string;
  
  /** Key messaging */
  keyMessaging: string[];
  
  /** Strengths */
  strengths: string[];
  
  /** Weaknesses */
  weaknesses: string[];
  
  /** Target audience */
  targetAudience: string;
}

/**
 * Theme recommendations from AI
 */
export interface ThemeRecommendations {
  /** Recommended color scheme */
  colorScheme: ColorSchemeRecommendation;
  
  /** Typography recommendations */
  typography: TypographyRecommendation;
  
  /** Layout style recommendations */
  layoutStyle: LayoutStyleRecommendation;
  
  /** Visual hierarchy suggestions */
  visualHierarchy: VisualHierarchyRecommendation;
}

/**
 * Color scheme recommendation
 */
export interface ColorSchemeRecommendation {
  /** Primary colors */
  primary: string[];
  
  /** Accent colors */
  accent: string[];
  
  /** Background colors */
  background: string[];
  
  /** Text colors */
  text: string[];
  
  /** Reasoning for choices */
  reasoning: string;
}

/**
 * Typography recommendation
 */
export interface TypographyRecommendation {
  /** Recommended heading fonts */
  headingFonts: string[];
  
  /** Recommended body fonts */
  bodyFonts: string[];
  
  /** Font pairing suggestions */
  pairings: FontPairing[];
  
  /** Reasoning for choices */
  reasoning: string;
}

/**
 * Font pairing suggestion
 */
export interface FontPairing {
  /** Heading font */
  heading: string;
  
  /** Body font */
  body: string;
  
  /** Style description */
  style: string;
  
  /** Best use case */
  useCase: string;
}

/**
 * Layout style recommendation
 */
export interface LayoutStyleRecommendation {
  /** Overall layout approach */
  approach: 'minimal' | 'rich' | 'balanced' | 'bold';
  
  /** Spacing preferences */
  spacing: 'tight' | 'comfortable' | 'spacious';
  
  /** Content density */
  density: 'compact' | 'standard' | 'airy';
  
  /** Visual style */
  visualStyle: 'clean' | 'modern' | 'playful' | 'professional' | 'luxury';
}

/**
 * Visual hierarchy recommendation
 */
export interface VisualHierarchyRecommendation {
  /** Primary attention areas */
  primaryFocus: string[];
  
  /** Secondary attention areas */
  secondaryFocus: string[];
  
  /** Visual flow recommendations */
  visualFlow: string[];
  
  /** Emphasis techniques */
  emphasisTechniques: string[];
}

/**
 * SEO recommendations from AI
 */
export interface SEOSuggestions {
  /** Recommended page title */
  title: string;
  
  /** Meta description suggestions */
  metaDescription: string[];
  
  /** Keyword opportunities */
  keywords: KeywordOpportunity[];
  
  /** Header structure suggestions */
  headerStructure: HeaderStructure;
  
  /** Content optimization tips */
  optimizationTips: string[];
}

/**
 * Keyword opportunity
 */
export interface KeywordOpportunity {
  /** Keyword phrase */
  keyword: string;
  
  /** Search volume estimate */
  searchVolume: 'low' | 'medium' | 'high';
  
  /** Competition level */
  competition: 'low' | 'medium' | 'high';
  
  /** Relevance score */
  relevance: number;
  
  /** Suggested placement */
  suggestedPlacement: string[];
}

/**
 * Header structure for SEO
 */
export interface HeaderStructure {
  /** H1 recommendations */
  h1: string[];
  
  /** H2 recommendations */
  h2: string[];
  
  /** H3 recommendations */
  h3: string[];
  
  /** Hierarchy tips */
  hierarchyTips: string[];
}

/**
 * Quality metrics for generated content
 */
export interface QualityMetrics {
  /** Overall quality score (0-100) */
  overallScore: number;
  
  /** Individual metric scores */
  metrics: {
    clarity: number;
    persuasiveness: number;
    relevance: number;
    engagement: number;
    completeness: number;
    originality: number;
  };
  
  /** Specific quality feedback */
  feedback: QualityFeedback[];
  
  /** Improvement suggestions */
  improvements: string[];
}

/**
 * Quality feedback details
 */
export interface QualityFeedback {
  /** Metric category */
  category: string;
  
  /** Score for this category */
  score: number;
  
  /** Specific feedback */
  feedback: string;
  
  /** Suggested improvements */
  suggestions: string[];
}

/**
 * Audience profile for targeting
 */
export interface AudienceProfile {
  /** Primary demographic */
  demographics: Demographics;
  
  /** Psychographic profile */
  psychographics: Psychographics;
  
  /** Pain points */
  painPoints: string[];
  
  /** Goals and motivations */
  goals: string[];
  
  /** Communication preferences */
  communicationStyle: CommunicationStyle;
}

/**
 * Demographic information
 */
export interface Demographics {
  /** Age range */
  ageRange: string;
  
  /** Income level */
  incomeLevel: string;
  
  /** Education level */
  education: string;
  
  /** Job roles */
  jobRoles: string[];
  
  /** Company size */
  companySize: string;
  
  /** Geographic location */
  location: string;
}

/**
 * Psychographic profile
 */
export interface Psychographics {
  /** Values */
  values: string[];
  
  /** Interests */
  interests: string[];
  
  /** Personality traits */
  personality: string[];
  
  /** Lifestyle factors */
  lifestyle: string[];
  
  /** Technology adoption */
  techAdoption: 'early' | 'mainstream' | 'late';
}

/**
 * Communication style preferences
 */
export interface CommunicationStyle {
  /** Tone preference */
  tonePreference: string;
  
  /** Detail level */
  detailLevel: 'brief' | 'moderate' | 'comprehensive';
  
  /** Evidence type */
  evidenceType: 'data' | 'stories' | 'testimonials' | 'logic';
  
  /** Persuasion style */
  persuasionStyle: 'direct' | 'consultative' | 'educational';
}

/**
 * Brand positioning information
 */
export interface BrandPositioning {
  /** Unique value proposition */
  valueProposition: string;
  
  /** Market position */
  marketPosition: string;
  
  /** Key differentiators */
  differentiators: string[];
  
  /** Brand promise */
  brandPromise: string;
  
  /** Competitive advantages */
  competitiveAdvantages: string[];
}

/**
 * Tone adjustment parameters
 */
export interface ToneAdjustments {
  /** Formality level (-1 to 1) */
  formality: number;
  
  /** Enthusiasm level (-1 to 1) */
  enthusiasm: number;
  
  /** Confidence level (-1 to 1) */
  confidence: number;
  
  /** Technical depth (-1 to 1) */
  technicalDepth: number;
  
  /** Urgency level (-1 to 1) */
  urgency: number;
}

/**
 * Length preferences for content
 */
export interface LengthPreferences {
  /** Headlines */
  headlines: 'short' | 'medium' | 'long';
  
  /** Descriptions */
  descriptions: 'brief' | 'standard' | 'detailed';
  
  /** Feature lists */
  featureLists: 'concise' | 'descriptive' | 'comprehensive';
  
  /** Overall content */
  overall: 'minimal' | 'balanced' | 'extensive';
}

/**
 * Media recommendations
 */
export interface MediaRecommendations {
  /** Recommended images */
  images: ImageRecommendation[];
  
  /** Video suggestions */
  videos: VideoRecommendation[];
  
  /** Icon suggestions */
  icons: IconRecommendation[];
  
  /** Graphic elements */
  graphics: GraphicRecommendation[];
}

/**
 * Image recommendation
 */
export interface ImageRecommendation {
  /** Image type */
  type: 'photo' | 'illustration' | 'graphic' | 'screenshot';
  
  /** Subject matter */
  subject: string;
  
  /** Style preferences */
  style: string[];
  
  /** Suggested sources */
  sources: string[];
  
  /** Alt text suggestion */
  altText: string;
}

/**
 * Video recommendation
 */
export interface VideoRecommendation {
  /** Video type */
  type: 'demo' | 'testimonial' | 'explainer' | 'product-tour';
  
  /** Suggested length */
  duration: string;
  
  /** Key points to cover */
  keyPoints: string[];
  
  /** Style preferences */
  style: string[];
}

/**
 * Icon recommendation
 */
export interface IconRecommendation {
  /** Icon category */
  category: string;
  
  /** Specific icon suggestions */
  suggestions: string[];
  
  /** Style preference */
  style: 'outline' | 'filled' | 'duotone' | 'minimalist';
  
  /** Color treatment */
  colorTreatment: string;
}

/**
 * Graphic element recommendation
 */
export interface GraphicRecommendation {
  /** Element type */
  type: 'background' | 'decoration' | 'separator' | 'accent';
  
  /** Style description */
  style: string;
  
  /** Color suggestions */
  colors: string[];
  
  /** Placement suggestions */
  placement: string[];
}

/**
 * CTA recommendations
 */
export interface CTARecommendations {
  /** Primary CTA suggestions */
  primary: CTARecommendation[];
  
  /** Secondary CTA suggestions */
  secondary: CTARecommendation[];
  
  /** Micro CTA suggestions */
  micro: CTARecommendation[];
}

/**
 * Individual CTA recommendation
 */
export interface CTARecommendation {
  /** Button text */
  text: string;
  
  /** Alternative text options */
  alternatives: string[];
  
  /** Recommended style */
  style: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  /** Urgency level */
  urgency: 'low' | 'medium' | 'high';
  
  /** Placement suggestions */
  placement: string[];
}

/**
 * Formatting requirements for elements
 */
export interface FormattingRequirements {
  /** Text formatting */
  textFormat: 'plain' | 'rich' | 'markdown';
  
  /** Line break handling */
  lineBreaks: 'preserve' | 'paragraph' | 'strip';
  
  /** List formatting */
  listFormat: 'bullet' | 'numbered' | 'dash' | 'custom';
  
  /** Link handling */
  linkFormat: 'inline' | 'reference' | 'button';
}

/**
 * Performance prediction for content variations
 */
export interface PerformancePrediction {
  /** Conversion rate prediction */
  conversionRate: number;
  
  /** Engagement score prediction */
  engagementScore: number;
  
  /** Click-through rate prediction */
  clickThroughRate: number;
  
  /** Confidence interval */
  confidence: number;
  
  /** Key performance factors */
  performanceFactors: string[];
}

/**
 * Tone variation option
 */
export interface ToneVariation {
  /** Tone name */
  name: string;
  
  /** Tone description */
  description: string;
  
  /** Content sample */
  sample: string;
  
  /** Best use case */
  useCase: string;
  
  /** Audience fit */
  audienceFit: number;
}

/**
 * Length variation option
 */
export interface LengthVariation {
  /** Variation name */
  name: string;
  
  /** Length description */
  description: string;
  
  /** Word count range */
  wordCount: {
    min: number;
    max: number;
  };
  
  /** Best use case */
  useCase: string;
  
  /** Attention span fit */
  attentionFit: string;
}

/**
 * ===== AI SERVICE CONFIGURATION =====
 */

/**
 * Configuration for AI service calls
 */
export interface AIServiceConfig {
  /** API endpoint */
  endpoint: string;
  
  /** Model to use */
  model: string;
  
  /** Temperature for creativity */
  temperature: number;
  
  /** Maximum tokens for response */
  maxTokens: number;
  
  /** Timeout in milliseconds */
  timeout: number;
  
  /** Retry configuration */
  retry: RetryConfig;
  
  /** Rate limiting */
  rateLimit: RateLimitConfig;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Base delay between retries */
  baseDelay: number;
  
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
  
  /** Maximum delay between retries */
  maxDelay: number;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Requests per minute */
  requestsPerMinute: number;
  
  /** Tokens per minute */
  tokensPerMinute: number;
  
  /** Burst allowance */
  burstAllowance: number;
}

/**
 * ===== BATCH OPERATIONS =====
 */

/**
 * Batch generation request for multiple operations
 */
export interface BatchGenerationRequest {
  /** Batch ID for tracking */
  batchId: string;
  
  /** Individual requests in batch */
  requests: (PageGenerationRequest | SectionRegenerationRequest | ElementRegenerationRequest)[];
  
  /** Batch priority */
  priority: 'low' | 'normal' | 'high';
  
  /** Whether to fail fast on first error */
  failFast: boolean;
  
  /** Callback URL for completion notification */
  callbackUrl?: string;
}

/**
 * Batch generation response
 */
export interface BatchGenerationResponse {
  /** Batch ID */
  batchId: string;
  
  /** Overall batch status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Individual responses */
  responses: (PageGenerationResponse | SectionRegenerationResponse | ElementRegenerationResponse)[];
  
  /** Batch-level errors */
  errors: AIError[];
  
  /** Processing summary */
  summary: BatchSummary;
}

/**
 * Batch processing summary
 */
export interface BatchSummary {
  /** Total requests processed */
  totalRequests: number;
  
  /** Successful requests */
  successfulRequests: number;
  
  /** Failed requests */
  failedRequests: number;
  
  /** Total processing time */
  totalProcessingTime: number;
  
  /** Total tokens used */
  totalTokensUsed: number;
  
  /** Estimated total cost */
  estimatedCost: number;
}
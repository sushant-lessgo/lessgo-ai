import { BackgroundSelectorMode } from './ui';

/**
 * Input context
 */
export interface InputContext {
  /** User's industry */
  industry?: string;
  
  /** Company size */
  companySize?: string;
  
  /** Previous responses */
  previousResponses?: Record<string, any>;
  
  /** User preferences */
  preferences?: UserPreferences;
  
  /** Session metadata */
  sessionMetadata?: SessionMetadata;
}

/**
 * User preferences
 */
export interface UserPreferences {
  /** Preferred language */
  language?: string;
  
  /** Preferred tone */
  tone?: string;
  
  /** Content length preference */
  contentLength?: 'short' | 'medium' | 'long';
  
  /** Industry preferences */
  industryPreferences?: Record<string, any>;
}

/**
 * Session metadata
 */
export interface SessionMetadata {
  /** Session ID */
  sessionId: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Referrer */
  referrer?: string;
  
  /** UTM parameters */
  utm?: UTMParameters;
  
  /** Geographic location */
  location?: GeographicLocation;
}

/**
 * UTM parameters
 */
export interface UTMParameters {
  /** UTM source */
  source?: string;
  
  /** UTM medium */
  medium?: string;
  
  /** UTM campaign */
  campaign?: string;
  
  /** UTM term */
  term?: string;
  
  /** UTM content */
  content?: string;
}

/**
 * Geographic location
 */
export interface GeographicLocation {
  /** Country code */
  country?: string;
  
  /** Region/state */
  region?: string;
  
  /** City */
  city?: string;
  
  /** Timezone */
  timezone?: string;
  
  /** Language */
  language?: string;
}

/**
 * Parse options
 */
export interface ParseOptions {
  /** Confidence threshold */
  confidenceThreshold?: number;
  
  /** Maximum alternatives */
  maxAlternatives?: number;
  
  /** Enable fuzzy matching */
  fuzzyMatching?: boolean;
  
  /** Custom extractors */
  customExtractors?: string[];
}

/**
 * Parse input response
 */
export interface ParseInputResponse {
  /** Extracted fields with confidence */
  extractedFields: Record<string, FieldExtraction>;
  
  /** Parsing confidence */
  confidence: number;
  
  /** Alternative extractions */
  alternatives?: AlternativeExtraction[];
  
  /** Suggested questions */
  suggestedQuestions?: SuggestedQuestion[];
  
  /** Input analysis */
  analysis: InputAnalysis;
}

/**
 * Field extraction
 */
export interface FieldExtraction {
  /** Extracted value */
  value: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Alternative values */
  alternatives?: string[];
  
  /** Extraction source */
  source: 'direct' | 'inferred' | 'default' | 'ml';
  
  /** Extraction metadata */
  metadata?: ExtractionMetadata;
}

/**
 * Extraction metadata
 */
export interface ExtractionMetadata {
  /** Text span that was extracted */
  span?: { start: number; end: number };
  
  /** Keywords that triggered extraction */
  keywords?: string[];
  
  /** ML model used */
  model?: string;
  
  /** Model version */
  modelVersion?: string;
}

/**
 * Alternative extraction
 */
export interface AlternativeExtraction {
  /** Alternative fields */
  fields: Record<string, FieldExtraction>;
  
  /** Overall confidence */
  confidence: number;
  
  /** Explanation */
  explanation: string;
}

/**
 * Suggested question
 */
export interface SuggestedQuestion {
  /** Question text */
  question: string;
  
  /** Target field */
  field: string;
  
  /** Question type */
  type: 'clarification' | 'expansion' | 'confirmation';
  
  /** Question priority */
  priority: number;
}

/**
 * Input analysis
 */
export interface InputAnalysis {
  /** Input length */
  length: number;
  
  /** Complexity score */
  complexity: number;
  
  /** Clarity score */
  clarity: number;
  
  /** Completeness score */
  completeness: number;
  
  /** Detected topics */
  topics: string[];
  
  /** Sentiment analysis */
  sentiment?: SentimentAnalysis;
  
  /** Language detection */
  language?: LanguageDetection;
}

/**
 * Sentiment analysis
 */
export interface SentimentAnalysis {
  /** Sentiment score (-1 to 1) */
  score: number;
  
  /** Sentiment label */
  label: 'positive' | 'negative' | 'neutral';
  
  /** Confidence */
  confidence: number;
}

/**
 * Language detection
 */
export interface LanguageDetection {
  /** Detected language */
  language: string;
  
  /** Confidence */
  confidence: number;
  
  /** Alternative languages */
  alternatives?: Array<{ language: string; confidence: number }>;
}

/**
 * Market insights request
 */
export interface MarketInsightsRequest {
  /** Validated input fields */
  validatedFields: InputVariables;
  
  /** Analysis options */
  options?: MarketAnalysisOptions;
}

/**
 * Market analysis options
 */
export interface MarketAnalysisOptions {
  /** Include competitor analysis */
  includeCompetitors?: boolean;
  
  /** Include market trends */
  includeMarketTrends?: boolean;
  
  /** Include audience insights */
  includeAudienceInsights?: boolean;
  
  /** Maximum features to extract */
  maxFeatures?: number;
  
  /** Feature extraction strategy */
  extractionStrategy?: 'conservative' | 'balanced' | 'aggressive';
}

/**
 * Market insights response
 */
export interface MarketInsightsResponse {
  /** Extracted features */
  features: FeatureItem[];
  
  /** Hidden inferred fields */
  hiddenInferredFields: HiddenInferredFields;
  
  /** Market analysis */
  marketAnalysis: MarketAnalysis;
  
  /** Audience insights */
  audienceInsights?: AudienceInsights;
  
  /** Competitive landscape */
  competitiveLandscape?: CompetitiveLandscape;
}

/**
 * Market analysis
 */
export interface MarketAnalysis {
  /** Market size */
  marketSize: MarketSize;
  
  /** Market trends */
  trends: MarketTrend[];
  
  /** Opportunity score */
  opportunityScore: number;
  
  /** Market maturity */
  maturity: 'emerging' | 'growth' | 'mature' | 'declining';
  
  /** Key insights */
  keyInsights: string[];
}

/**
 * Market size
 */
export interface MarketSize {
  /** Total addressable market */
  tam?: string;
  
  /** Serviceable addressable market */
  sam?: string;
  
  /** Serviceable obtainable market */
  som?: string;
  
  /** Market growth rate */
  growthRate?: number;
  
  /** Data source */
  source?: string;
  
  /** Data reliability */
  reliability: 'high' | 'medium' | 'low';
}

/**
 * Market trend
 */
export interface MarketTrend {
  /** Trend name */
  name: string;
  
  /** Trend description */
  description: string;
  
  /** Trend direction */
  direction: 'up' | 'down' | 'stable';
  
  /** Trend strength */
  strength: number;
  
  /** Trend impact */
  impact: 'high' | 'medium' | 'low';
  
  /** Trend timeframe */
  timeframe: string;
}

/**
 * Audience insights
 */
export interface AudienceInsights {
  /** Primary personas */
  personas: AudiencePersona[];
  
  /** Pain points */
  painPoints: string[];
  
  /** Motivations */
  motivations: string[];
  
  /** Communication preferences */
  communicationPrefs: CommunicationPreferences;
  
  /** Behavioral patterns */
  behavioralPatterns: BehavioralPattern[];
}

/**
 * Audience persona
 */
export interface AudiencePersona {
  /** Persona name */
  name: string;
  
  /** Persona description */
  description: string;
  
  /** Demographics */
  demographics: Demographics;
  
  /** Goals */
  goals: string[];
  
  /** Frustrations */
  frustrations: string[];
  
  /** Preferred channels */
  preferredChannels: string[];
  
  /** Persona weight */
  weight: number;
}

/**
 * Demographics
 */
export interface Demographics {
  /** Age range */
  ageRange?: string;
  
  /** Income range */
  incomeRange?: string;
  
  /** Education level */
  education?: string;
  
  /** Job titles */
  jobTitles?: string[];
  
  /** Company sizes */
  companySizes?: string[];
  
  /** Industries */
  industries?: string[];
  
  /** Geographic regions */
  regions?: string[];
}

/**
 * Communication preferences
 */
export interface CommunicationPreferences {
  /** Preferred tone */
  tone: string[];
  
  /** Content format preferences */
  contentFormats: string[];
  
  /** Information density */
  informationDensity: 'brief' | 'moderate' | 'detailed';
  
  /** Visual preferences */
  visualPreferences: string[];
  
  /** Channel preferences */
  channelPreferences: string[];
}

/**
 * Behavioral pattern
 */
export interface BehavioralPattern {
  /** Pattern name */
  name: string;
  
  /** Pattern description */
  description: string;
  
  /** Pattern frequency */
  frequency: 'rare' | 'occasional' | 'common' | 'frequent';
  
  /** Pattern triggers */
  triggers: string[];
  
  /** Pattern outcomes */
  outcomes: string[];
}

/**
 * Competitive landscape
 */
export interface CompetitiveLandscape {
  /** Main competitors */
  competitors: Competitor[];
  
  /** Competitive advantages */
  advantages: string[];
  
  /** Market gaps */
  marketGaps: string[];
  
  /** Positioning opportunities */
  positioningOpportunities: string[];
  
  /** Competitive threats */
  threats: CompetitiveThreat[];
}

/**
 * Competitor
 */
export interface Competitor {
  /** Competitor name */
  name: string;
  
  /** Company description */
  description: string;
  
  /** Website URL */
  website?: string;
  
  /** Market position */
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  
  /** Strengths */
  strengths: string[];
  
  /** Weaknesses */
  weaknesses: string[];
  
  /** Pricing model */
  pricingModel?: string;
  
  /** Target audience overlap */
  audienceOverlap: number;
  
  /** Competitive intensity */
  intensity: 'low' | 'medium' | 'high';
}

/**
 * Competitive threat
 */
export interface CompetitiveThreat {
  /** Threat type */
  type: 'direct' | 'indirect' | 'emerging' | 'substitute';
  
  /** Threat description */
  description: string;
  
  /** Threat level */
  level: 'low' | 'medium' | 'high' | 'critical';
  
  /** Threat timeframe */
  timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  
  /** Mitigation strategies */
  mitigationStrategies: string[];
}

/**
 * ===== PAGE GENERATION API =====
 */

/**
 * Generate page request
 */
export interface GeneratePageRequest {
  /** Project token */
  token: string;
  
  /** AI generation prompt */
  prompt: string;
  
  /** Generation options */
  options?: GenerationOptions;
  
  /** Context data */
  context?: GenerationContext;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  /** Generation model */
  model?: string;
  
  /** Generation temperature */
  temperature?: number;
  
  /** Maximum tokens */
  maxTokens?: number;
  
  /** Generation seed */
  seed?: number;
  
  /** Streaming response */
  stream?: boolean;
  
  /** Include alternatives */
  includeAlternatives?: boolean;
  
  /** Quality threshold */
  qualityThreshold?: number;
}

/**
 * Generation context
 */
export interface GenerationContext {
  /** Pre-selected sections */
  sections?: string[];
  
  /** Section layouts */
  sectionLayouts?: Record<string, string>;
  
  /** Existing content */
  existingContent?: Record<string, any>;
  
  /** User feedback */
  userFeedback?: UserFeedback;
  
  /** Previous generations */
  previousGenerations?: PreviousGeneration[];
}

/**
 * User feedback
 */
export interface UserFeedback {
  /** Overall satisfaction (1-10) */
  satisfaction?: number;
  
  /** Specific feedback */
  feedback?: string[];
  
  /** Requested changes */
  requestedChanges?: string[];
  
  /** Preferred elements */
  preferredElements?: string[];
  
  /** Rejected elements */
  rejectedElements?: string[];
}

/**
 * Previous generation
 */
export interface PreviousGeneration {
  /** Generation timestamp */
  timestamp: Date;
  
  /** Generated content */
  content: any;
  
  /** User rating */
  rating?: number;
  
  /** User actions */
  actions?: GenerationAction[];
}

/**
 * Generation action
 */
export interface GenerationAction {
  /** Action type */
  type: 'accept' | 'reject' | 'modify' | 'regenerate';
  
  /** Target element */
  target: string;
  
  /** Action timestamp */
  timestamp: Date;
  
  /** Action parameters */
  parameters?: Record<string, any>;
}

/**
 * Generate page response
 */
export interface GeneratePageResponse {
  /** Generated content */
  content: Record<string, SectionData>;
  
  /** Generation metadata */
  metadata: GenerationMetadata;
  
  /** Content alternatives */
  alternatives?: ContentAlternatives;
  
  /** Quality metrics */
  quality: ContentQuality;
  
  /** Generation insights */
  insights?: GenerationInsights;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  /** Generation model used */
  model: string;
  
  /** Generation timestamp */
  timestamp: Date;
  
  /** Processing time (ms) */
  processingTime: number;
  
  /** Token usage */
  tokenUsage: TokenUsage;
  
  /** Generation parameters */
  parameters: GenerationParameters;
  
  /** Content fingerprint */
  fingerprint: string;
}

/**
 * Token usage
 */
export interface TokenUsage {
  /** Input tokens */
  input: number;
  
  /** Output tokens */
  output: number;
  
  /** Total tokens */
  total: number;
  
  /** Estimated cost */
  estimatedCost?: number;
}

/**
 * Generation parameters
 */
export interface GenerationParameters {
  /** Temperature used */
  temperature: number;
  
  /** Max tokens used */
  maxTokens: number;
  
  /** Seed used */
  seed?: number;
  
  /** Model version */
  modelVersion: string;
  
  /** Custom parameters */
  custom?: Record<string, any>;
}

/**
 * Content alternatives
 */
export interface ContentAlternatives {
  /** Section alternatives */
  sections?: Record<string, SectionAlternative[]>;
  
  /** Element alternatives */
  elements?: Record<string, ElementAlternative[]>;
  
  /** Style alternatives */
  styles?: StyleAlternative[];
  
  /** Layout alternatives */
  layouts?: LayoutAlternative[];
}

/**
 * Section alternative
 */
export interface SectionAlternative {
  /** Alternative content */
  content: SectionData;
  
  /** Alternative score */
  score: number;
  
  /** Alternative description */
  description: string;
  
  /** Variation type */
  variationType: 'tone' | 'length' | 'structure' | 'focus';
}

/**
 * Element alternative
 */
export interface ElementAlternative {
  /** Element key */
  elementKey: string;
  
  /** Alternative content */
  content: string | string[];
  
  /** Alternative score */
  score: number;
  
  /** Alternative reasoning */
  reasoning: string;
}

/**
 * Style alternative
 */
export interface StyleAlternative {
  /** Style name */
  name: string;
  
  /** Style description */
  description: string;
  
  /** Style properties */
  properties: Record<string, any>;
  
  /** Style preview */
  preview?: string;
}

/**
 * Layout alternative
 */
export interface LayoutAlternative {
  /** Layout name */
  name: string;
  
  /** Layout sections */
  sections: string[];
  
  /** Section arrangements */
  arrangements: Record<string, string>;
  
  /** Layout score */
  score: number;
}

/**
 * Content quality
 */
export interface ContentQuality {
  /** Overall quality score */
  overall: number;
  
  /** Quality dimensions */
  dimensions: QualityDimensions;
  
  /** Quality issues */
  issues: QualityIssue[];
  
  /** Improvement suggestions */
  suggestions: QualitySuggestion[];
}

/**
 * Quality dimensions
 */
export interface QualityDimensions {
  /** Clarity score */
  clarity: number;
  
  /** Relevance score */
  relevance: number;
  
  /** Engagement score */
  engagement: number;
  
  /** Persuasiveness score */
  persuasiveness: number;
  
  /** Completeness score */
  completeness: number;
  
  /** Originality score */
  originality: number;
  
  /** Consistency score */
  consistency: number;
}

/**
 * Quality issue
 */
export interface QualityIssue {
  /** Issue type */
  type: 'clarity' | 'relevance' | 'engagement' | 'consistency' | 'completeness';
  
  /** Issue description */
  description: string;
  
  /** Issue location */
  location: string;
  
  /** Issue severity */
  severity: 'low' | 'medium' | 'high';
  
  /** Suggested fix */
  suggestedFix?: string;
}

/**
 * Quality suggestion
 */
export interface QualitySuggestion {
  /** Suggestion type */
  type: 'improvement' | 'optimization' | 'enhancement';
  
  /** Suggestion description */
  description: string;
  
  /** Expected impact */
  expectedImpact: 'low' | 'medium' | 'high';
  
  /** Implementation effort */
  effort: 'low' | 'medium' | 'high';
  
  /** Suggestion priority */
  priority: number;
}

/**
 * Generation insights
 */
export interface GenerationInsights {
  /** Content strategy */
  strategy: ContentStrategy;
  
  /** Performance predictions */
  predictions: PerformancePredictions;
  
  /** Optimization opportunities */
  optimizations: OptimizationOpportunity[];
  
  /** A/B test suggestions */
  testSuggestions: ABTestSuggestion[];
}

/**
 * Content strategy
 */
export interface ContentStrategy {
  /** Primary messaging approach */
  approach: string;
  
  /** Key value propositions */
  valuePropositions: string[];
  
  /** Persuasion techniques used */
  persuasionTechniques: string[];
  
  /** Content structure rationale */
  structureRationale: string;
  
  /** Target emotional response */
  emotionalResponse: string[];
}

/**
 * Performance predictions
 */
export interface PerformancePredictions {
  /** Predicted conversion rate */
  conversionRate: PredictionRange;
  
  /** Predicted engagement metrics */
  engagement: EngagementPredictions;
  
  /** Predicted user behavior */
  userBehavior: BehaviorPredictions;
  
  /** Confidence intervals */
  confidence: PredictionConfidence;
}

/**
 * Prediction range
 */
export interface PredictionRange {
  /** Minimum value */
  min: number;
  
  /** Maximum value */
  max: number;
  
  /** Expected value */
  expected: number;
  
  /** Confidence level */
  confidence: number;
}

/**
 * Engagement predictions
 */
export interface EngagementPredictions {
  /** Time on page */
  timeOnPage: PredictionRange;
  
  /** Scroll depth */
  scrollDepth: PredictionRange;
  
  /** Click-through rate */
  clickThroughRate: PredictionRange;
  
  /** Bounce rate */
  bounceRate: PredictionRange;
}

/**
 * Behavior predictions
 */
export interface BehaviorPredictions {
  /** Primary user paths */
  userPaths: UserPath[];
  
  /** Drop-off points */
  dropOffPoints: DropOffPrediction[];
  
  /** Conversion funnel */
  conversionFunnel: FunnelStage[];
}

/**
 * User path
 */
export interface UserPath {
  /** Path description */
  description: string;
  
  /** Path probability */
  probability: number;
  
  /** Path steps */
  steps: PathStep[];
  
  /** Expected outcome */
  outcome: string;
}

/**
 * Path step
 */
export interface PathStep {
  /** Step action */
  action: string;
  
  /** Step element */
  element: string;
  
  /** Step probability */
  probability: number;
  
  /** Average time */
  averageTime: number;
}

/**
 * Drop-off prediction
 */
export interface DropOffPrediction {
  /** Drop-off location */
  location: string;
  
  /** Drop-off probability */
  probability: number;
  
  /** Primary reasons */
  reasons: string[];
  
  /** Mitigation strategies */
  mitigations: string[];
}

/**
 * Funnel stage
 */
export interface FunnelStage {
  /** Stage name */
  name: string;
  
  /** Stage conversion rate */
  conversionRate: number;
  
  /** Stage drop-off rate */
  dropOffRate: number;
  
  /** Key actions */
  keyActions: string[];
}

/**
 * Prediction confidence
 */
export interface PredictionConfidence {
  /** Overall confidence */
  overall: number;
  
  /** Data quality score */
  dataQuality: number;
  
  /** Model accuracy */
  modelAccuracy: number;
  
  /** Sample size adequacy */
  sampleSize: number;
}

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  /** Opportunity type */
  type: 'conversion' | 'engagement' | 'performance' | 'accessibility';
  
  /** Opportunity description */
  description: string;
  
  /** Expected impact */
  impact: ImpactEstimate;
  
  /** Implementation effort */
  effort: EffortEstimate;
  
  /** Recommended actions */
  actions: string[];
  
  /** Priority score */
  priority: number;
}

/**
 * Impact estimate
 */
export interface ImpactEstimate {
  /** Impact magnitude */
  magnitude: 'low' | 'medium' | 'high';
  
  /** Impact metrics */
  metrics: Record<string, number>;
  
  /** Impact confidence */
  confidence: number;
  
  /** Impact timeframe */
  timeframe: string;
}

/**
 * Effort estimate
 */
export interface EffortEstimate {
  /** Effort level */
  level: 'low' | 'medium' | 'high';
  
  /** Estimated hours */
  hours?: number;
  
  /** Required skills */
  skills: string[];
  
  /** Complexity factors */
  complexityFactors: string[];
}

/**
 * A/B test suggestion
 */
export interface ABTestSuggestion {
  /** Test hypothesis */
  hypothesis: string;
  
  /** Test variations */
  variations: TestVariation[];
  
  /** Primary metric */
  primaryMetric: string;
  
  /** Secondary metrics */
  secondaryMetrics: string[];
  
  /** Recommended sample size */
  sampleSize: number;
  
  /** Estimated test duration */
  duration: string;
  
  /** Expected lift */
  expectedLift: number;
}

/**
 * Test variation
 */
export interface TestVariation {
  /** Variation name */
  name: string;
  
  /** Variation description */
  description: string;
  
  /** Changes to implement */
  changes: VariationChange[];
  
  /** Traffic allocation */
  trafficAllocation: number;
}

/**
 * Variation change
 */
export interface VariationChange {
  /** Change type */
  type: 'content' | 'layout' | 'style' | 'functionality';
  
  /** Target element */
  target: string;
  
  /** Change description */
  description: string;
  
  /** Implementation details */
  implementation: string;
}

/**
 * ===== REGENERATION API =====
 */

/**
 * Regenerate content request
 */
export interface RegenerateContentRequest {
  /** Project token */
  token: string;
  
  /** Regeneration type */
  type: AIGenerationType;
  
  /** Target ID (section or element) */
  targetId?: string;
  
  /** Regeneration parameters */
  parameters: RegenerationParameters;
  
  /** User instructions */
  instructions?: string;
  
  /** Context data */
  context?: RegenerationContext;
}

/**
 * Regeneration parameters
 */
export interface RegenerationParameters {
  /** Number of variations */
  variations?: number;
  
  /** Focus areas */
  focus?: string[];
  
  /** Tone adjustments */
  toneAdjustments?: ToneAdjustments;
  
  /** Length preferences */
  lengthPreferences?: LengthPreferences;
  
  /** Style preferences */
  stylePreferences?: StylePreferences;
  
  /** Constraints */
  constraints?: RegenerationConstraints;
}

/**
 * Tone adjustments
 */
export interface ToneAdjustments {
  /** Formality (-1 to 1) */
  formality?: number;
  
  /** Enthusiasm (-1 to 1) */
  enthusiasm?: number;
  
  /** Technical depth (-1 to 1) */
  technicalDepth?: number;
  
  /** Urgency (-1 to 1) */
  urgency?: number;
  
  /** Confidence (-1 to 1) */
  confidence?: number;
}

/**
 * Length preferences
 */
export interface LengthPreferences {
  /** Target length */
  target: 'shorter' | 'same' | 'longer';
  
  /** Specific word count */
  wordCount?: number;
  
  /** Character limit */
  characterLimit?: number;
  
  /** Bullet point count */
  bulletPoints?: number;
}

/**
 * Style preferences
 */
export interface StylePreferences {
  /** Writing style */
  writingStyle?: string[];
  
  /** Format preferences */
  format?: string[];
  
  /** Structure preferences */
  structure?: string[];
  
  /** Voice preferences */
  voice?: string[];
}

/**
 * Regeneration constraints
 */
export interface RegenerationConstraints {
  /** Required keywords */
  requiredKeywords?: string[];
  
  /** Forbidden keywords */
  forbiddenKeywords?: string[];
  
  /** Brand guidelines */
  brandGuidelines?: string[];
  
  /** Legal constraints */
  legalConstraints?: string[];
  
  /** Technical constraints */
  technicalConstraints?: string[];
}

/**
 * Regeneration context
 */
export interface RegenerationContext {
  /** Current content */
  currentContent: any;
  
  /** Surrounding content */
  surroundingContent?: Record<string, any>;
  
  /** Page context */
  pageContext: RegenerationPageContext;
  
  /** User feedback history */
  feedbackHistory?: RegenerationFeedback[];
  
  /** Performance data */
  performanceData?: PerformanceData;
}

/**
 * Regeneration page context
 */
export interface RegenerationPageContext {
  /** Input variables */
  inputVariables: InputVariables;
  
  /** Hidden fields */
  hiddenFields: HiddenInferredFields;
  
  /** Features */
  features: FeatureItem[];
  
  /** Page theme */
  theme?: any;
  
  /** Overall messaging */
  messaging?: string[];
}

/**
 * Regeneration feedback
 */
export interface RegenerationFeedback {
  /** Feedback timestamp */
  timestamp: Date;
  
  /** Feedback type */
  type: 'like' | 'dislike' | 'edit' | 'replace';
  
  /** Feedback content */
  content: string;
  
  /** User rating */
  rating?: number;
  
  /** Specific comments */
  comments?: string;
}

/**
 * Performance data
 */
export interface PerformanceData {
  /** Click-through rates */
  ctr?: number;
  
  /** Conversion rates */
  conversion?: number;
  
  /** Engagement metrics */
  engagement?: EngagementMetrics;
  
  /** User behavior */
  behavior?: UserBehaviorData;
  
  /** A/B test results */
  testResults?: ABTestResults;
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  /** Time on page */
  timeOnPage: number;
  
  /** Scroll depth */
  scrollDepth: number;
  
  /** Bounce rate */
  bounceRate: number;
  
  /** Return visits */
  returnVisits: number;
}

/**
 * User behavior data
 */
export interface UserBehaviorData {
  /** Heat map data */
  heatMap?: HeatMapData;
  
  /** Click patterns */
  clickPatterns?: ClickPattern[];
  
  /** Scroll patterns */
  scrollPatterns?: ScrollPattern[];
  
  /** Exit points */
  exitPoints?: ExitPoint[];
}

/**
 * Heat map data
 */
export interface HeatMapData {
  /** Element heat scores */
  elements: Record<string, number>;
  
  /** Click coordinates */
  clicks: Array<{ x: number; y: number; intensity: number }>;
  
  /** Hover areas */
  hovers: Array<{ x: number; y: number; duration: number }>;
}

/**
 * Click pattern
 */
export interface ClickPattern {
  /** Element clicked */
  element: string;
  
  /** Click frequency */
  frequency: number;
  
  /** Click timing */
  timing: number[];
  
  /** User segments */
  segments: string[];
}

/**
 * Scroll pattern
 */
export interface ScrollPattern {
  /** Scroll depth percentages */
  depths: number[];
  
  /** Scroll speed */
  speed: number;
  
  /** Pause points */
  pausePoints: number[];
  
  /** Scroll direction changes */
  directionChanges: number;
}

/**
 * Exit point
 */
export interface ExitPoint {
  /** Element where user exited */
  element: string;
  
  /** Exit frequency */
  frequency: number;
  
  /** Average time before exit */
  timeBeforeExit: number;
  
  /** Exit reasons (if known) */
  reasons?: string[];
}

/**
 * A/B test results
 */
export interface ABTestResults {
  /** Test variations */
  variations: TestVariationResult[];
  
  /** Statistical significance */
  significance: number;
  
  /** Confidence interval */
  confidenceInterval: number;
  
  /** Test duration */
  duration: number;
  
  /** Sample sizes */
  sampleSizes: Record<string, number>;
}

/**
 * Test variation result
 */
export interface TestVariationResult {
  /** Variation name */
  name: string;
  
  /** Conversion rate */
  conversionRate: number;
  
  /** Confidence interval */
  confidenceInterval: [number, number];
  
  /** Statistical significance */
  significance: number;
  
  /** Lift over control */
  lift?: number;
}

/**
 * Regenerate content response
 */
export interface RegenerateContentResponse {
  /** Regenerated content */
  content: any;
  
  /** Content variations */
  variations?: ContentVariation[];
  
  /** Regeneration metadata */
  metadata: RegenerationMetadata;
  
  /** Quality assessment */
  quality: RegenerationQuality;
  
  /** Recommendations */
  recommendations?: RegenerationRecommendation[];
}

/**
 * Content variation
 */
export interface ContentVariation {
  /** Variation ID */
  id: string;
  
  /** Variation content */
  content: any;
  
  /** Variation score */
  score: number;
  
  /** Variation description */
  description: string;
  
  /** Key differences */
  differences: string[];
  
  /** Recommended use case */
  useCase?: string;
}

/**
 * Regeneration metadata
 */
export interface RegenerationMetadata {
  /** Regeneration type */
  type: AIGenerationType;
  
  /** Target element */
  target: string;
  
  /** Generation model */
  model: string;
  
  /** Processing time */
  processingTime: number;
  
  /** Token usage */
  tokenUsage: TokenUsage;
  
  /** Regeneration parameters */
  parameters: RegenerationParameters;
}

/**
 * Regeneration quality
 */
export interface RegenerationQuality {
  /** Overall quality score */
  overall: number;
  
  /** Improvement over original */
  improvement: number;
  
  /** Quality dimensions */
  dimensions: QualityDimensions;
  
  /** Consistency with page */
  consistency: number;
  
  /** Brand alignment */
  brandAlignment: number;
}

/**
 * Regeneration recommendation
 */
export interface RegenerationRecommendation {
  /** Recommendation type */
  type: 'usage' | 'improvement' | 'testing' | 'optimization';
  
  /** Recommendation text */
  text: string;
  
  /** Recommended action */
  action?: string;
  
  /** Expected benefit */
  benefit?: string;
  
  /** Implementation effort */
  effort?: 'low' | 'medium' | 'high';
}

/**
 * ===== DRAFT MANAGEMENT API =====
 */

/**
 * Save draft request
 */
export interface SaveDraftRequest {
  /** Project token */
  token: string;
  
  /** Draft data */
  data: DraftData;
  
  /** Save options */
  options?: SaveOptions;
}

/**
 * Draft data
 */
export interface DraftData {
  /** Input text */
  inputText?: string;
  
  /** Current step */
  stepIndex?: number;
  
  /** Validated fields */
  validatedFields?: InputVariables;
  
  /** Confirmed fields */
  confirmedFields?: Record<string, any>;
  
  /** Features */
  featuresFromAI?: FeatureItem[];
  
  /** Hidden inferred fields */
  hiddenInferredFields?: HiddenInferredFields;
  
  /** Page content */
  finalContent?: LandingPageContent;
  
  /** Theme values */
  themeValues?: Record<string, any>;
  
  /** Custom metadata */
  metadata?: Record<string, any>;
}

/**
 * Save options
 */
export interface SaveOptions {
  /** Force save even if no changes */
  forceSave?: boolean;
  
  /** Create backup */
  createBackup?: boolean;
  
  /** Auto-save trigger */
  autoSave?: boolean;
  
  /** Save timeout (ms) */
  timeout?: number;
}

/**
 * Save draft response
 */
export interface SaveDraftResponse {
  /** Save successful */
  saved: boolean;
  
  /** Draft version */
  version: number;
  
  /** Last saved timestamp */
  lastSaved: Date;
  
  /** Save metadata */
  metadata: SaveMetadata;
}

/**
 * Save metadata
 */
export interface SaveMetadata {
  /** Data size (bytes) */
  size: number;
  
  /** Backup created */
  backupCreated?: boolean;
  
  /** Save duration (ms) */
  saveDuration: number;
  
  /** Conflict resolution */
  conflictResolution?: ConflictResolution;
}

/**
 * Conflict resolution
 */
export interface ConflictResolution {
  /** Conflict detected */
  conflictDetected: boolean;
  
  /** Resolution strategy */
  strategy: 'overwrite' | 'merge' | 'user-choice';
  
  /** Conflicting fields */
  conflictingFields?: string[];
  
  /** Resolution details */
  details?: string;
}

/**
 * Load draft request
 */
export interface LoadDraftRequest {
  /** Project token */
  token: string;
  
  /** Load options */
  options?: LoadOptions;
}

/**
 * Load options
 */
export interface LoadOptions {
  /** Include metadata */
  includeMetadata?: boolean;
  
  /** Include backup data */
  includeBackup?: boolean;
  
  /** Specific version */
  version?: number;
  
  /** Load timeout (ms) */
  timeout?: number;
}

/**
 * Load draft response
 */
export interface LoadDraftResponse {
  /** Draft found */
  found: boolean;
  
  /** Draft data */
  data?: DraftData;
  
  /** Draft metadata */
  metadata?: DraftMetadata;
  
  /** Load warnings */
  warnings?: string[];
}

/**
 * Draft metadata
 */
export interface DraftMetadata {
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Draft version */
  version: number;
  
  /** Data size */
  size: number;
  
  /** Completion percentage */
  completionPercentage: number;
  
  /** Step reached */
  stepReached: number;
  
  /** Draft status */
  status: DraftStatus;
}

/**
 * Draft status
 */
export interface DraftStatus {
  /** Status type */
  type: 'incomplete' | 'complete' | 'generated' | 'error';
  
  /** Status message */
  message?: string;
  
  /** Next recommended action */
  nextAction?: string;
  
  /** Can continue */
  canContinue: boolean;
  
  /** Requires regeneration */
  requiresRegeneration?: boolean;
}

/**
 * ===== PROJECT MANAGEMENT API =====
 */

/**
 * Create project request
 */
export interface CreateProjectRequest {
  /** Project title */
  title?: string;
  
  /** Initial input */
  initialInput?: string;
  
  /** Project template */
  template?: string;
  
  /** Project options */
  options?: ProjectOptions;
}

/**
 * Project options
 */
export interface ProjectOptions {
  /** Auto-save enabled */
  autoSave?: boolean;
  
  /** Collaboration enabled */
  collaboration?: boolean;
  
  /** Public access */
  publicAccess?: boolean;
  
  /** Template category */
  category?: string;
  
  /** Project tags */
  tags?: string[];
}

/**
 * Create project response
 */
export interface CreateProjectResponse {
  /** Project token */
  token: string;
  
  /** Project URL */
  url: string;
  
  /** Project metadata */
  metadata: ProjectMetadata;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  /** Project ID */
  id: string;
  
  /** Project title */
  title: string;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Project status */
  status: ProjectStatus;
  
  /** Project statistics */
  statistics?: ProjectStatistics;
}

/**
 * Project status
 */
export interface ProjectStatus {
  /** Status type */
  type: 'draft' | 'active' | 'published' | 'archived';
  
  /** Status message */
  message?: string;
  
  /** Completion percentage */
  completion: number;
  
  /** Is editable */
  editable: boolean;
  
  /** Is publishable */
  publishable: boolean;
}

/**
 * Project statistics
 */
export interface ProjectStatistics {
  /** Page views */
  views: number;
  
  /** Unique visitors */
  uniqueVisitors: number;
  
  /** Conversion rate */
  conversionRate?: number;
  
  /** Last view timestamp */
  lastView?: Date;
  
  /** Performance metrics */
  performance?: ProjectPerformance;
}

/**
 * Project performance
 */
export interface ProjectPerformance {
  /** Load time (ms) */
  loadTime: number;
  
  /** First contentful paint (ms) */
  fcp: number;
  
  /** Largest contentful paint (ms) */
  lcp: number;
  
  /** Cumulative layout shift */
  cls: number;
  
  /** Performance score */
  score: number;
}

/**
 * Update project request
 */
export interface UpdateProjectRequest {
  /** Project token */
  token: string;
  
  /** Project updates */
  updates: ProjectUpdates;
}

/**
 * Project updates
 */
export interface ProjectUpdates {
  /** New title */
  title?: string;
  
  /** New status */
  status?: ProjectStatus['type'];
  
  /** New options */
  options?: Partial<ProjectOptions>;
  
  /** Metadata updates */
  metadata?: Record<string, any>;
}

/**
 * Update project response
 */
export interface UpdateProjectResponse {
  /** Update successful */
  updated: boolean;
  
  /** Updated fields */
  updatedFields: string[];
  
  /** New metadata */
  metadata: ProjectMetadata;
}

/**
 * ===== ASSET MANAGEMENT API =====
 */

/**
 * Upload asset request
 */
export interface UploadAssetRequest {
  /** Project token */
  token: string;
  
  /** File data */
  file: File | FileData;
  
  /** Upload options */
  options?: UploadOptions;
}

/**
 * File data (for non-browser environments)
 */
export interface FileData {
  /** File name */
  name: string;
  
  /** File type */
  type: string;
  
  /** File size */
  size: number;
  
  /** File content (base64) */
  content: string;
}

/**
 * Upload options
 */
export interface UploadOptions {
  /** Auto-optimize */
  autoOptimize?: boolean;
  
  /** Generate thumbnails */
  generateThumbnails?: boolean;
  
  /** Alt text */
  altText?: string;
  
  /** Asset category */
  category?: string;
  
  /** Asset tags */
  tags?: string[];
  
  /** Public access */
  publicAccess?: boolean;
}

/**
 * Upload asset response
 */
export interface UploadAssetResponse {
  /** Asset ID */
  assetId: string;
  
  /** Asset URLs */
  urls: AssetUrls;
  
  /** Asset metadata */
  metadata: AssetMetadata;
  
  /** Processing status */
  processingStatus?: ProcessingStatus;
}

/**
 * Asset URLs
 */
export interface AssetUrls {
  /** Original URL */
  original: string;
  
  /** Optimized URL */
  optimized?: string;
  
  /** Thumbnail URLs */
  thumbnails?: Record<string, string>;
  
  /** CDN URLs */
  cdn?: Record<string, string>;
}

/**
 * Asset metadata
 */
export interface AssetMetadata {
  /** File information */
  file: FileInfo;
  
  /** Image properties (if image) */
  image?: ImageProperties;
  
  /** Processing information */
  processing?: ProcessingInfo;
  
  /** Usage information */
  usage?: AssetUsage;
}

/**
 * File info
 */
export interface FileInfo {
  /** Original filename */
  originalName: string;
  
  /** File size */
  size: number;
  
  /** MIME type */
  mimeType: string;
  
  /** File hash */
  hash: string;
  
  /** Upload timestamp */
  uploadedAt: Date;
}

/**
 * Image properties
 */
export interface ImageProperties {
  /** Image width */
  width: number;
  
  /** Image height */
  height: number;
  
  /** Aspect ratio */
  aspectRatio: number;
  
  /** Color space */
  colorSpace?: string;
  
  /** Has transparency */
  hasAlpha: boolean;
  
  /** Dominant colors */
  dominantColors?: string[];
}

/**
 * Processing info
 */
export interface ProcessingInfo {
  /** Processing status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Processing progress */
  progress?: number;
  
  /** Processing steps */
  steps?: ProcessingStep[];
  
  /** Processing errors */
  errors?: ProcessingError[];
}

/**
 * Processing step
 */
export interface ProcessingStep {
  /** Step name */
  name: string;
  
  /** Step status */
  status: 'pending' | 'running' | 'completed' | 'failed';
  
  /** Step progress */
  progress: number;
  
  /** Step duration */
  duration?: number;
}

/**
 * Processing error
 */
export interface ProcessingError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error step */
  step: string;
  
  /** Is recoverable */
  recoverable: boolean;
}

/**
 * Asset usage
 */
export interface AssetUsage {
  /** Usage count */
  usageCount: number;
  
  /** Projects using asset */
  projects: string[];
  
  /** Last used timestamp */
  lastUsed?: Date;
  
  /** Usage contexts */
  contexts: string[];
}

/**
 * Processing status
 */
export interface ProcessingStatus {
  /** Overall status */
  status: 'queued' | 'processing' | 'completed' | 'failed';
  
  /** Processing queue position */
  queuePosition?: number;
  
  /** Estimated completion time */
  estimatedCompletion?: Date;
  
  /** Processing errors */
  errors?: string[];
}

/**
 * ===== EXPORT API =====
 */

/**
 * Export project request
 */
export interface ExportProjectRequest {
  /** Project token */
  token: string;
  
  /** Export format */
  format: ExportFormat;
  
  /** Export options */
  options?: ExportOptions;
}

/**
 * Export format
 */
export type ExportFormat = 
  | 'html'          // Static HTML
  | 'react'         // React components
  | 'vue'           // Vue components
  | 'angular'       // Angular components
  | 'json'          // JSON data
  | 'pdf'           // PDF document
  | 'zip'           // ZIP archive
  | 'figma'         // Figma design
  | 'sketch';       // Sketch design

/**
 * Export options
 */
export interface ExportOptions {
  /** Include assets */
  includeAssets?: boolean;
  
  /** Minify output */
  minify?: boolean;
  
  /** Include source maps */
  sourceMaps?: boolean;
  
  /** Framework version */
  frameworkVersion?: string;
  
  /** Custom template */
  customTemplate?: string;
  
  /** Export quality */
  quality?: 'draft' | 'production' | 'high-quality';
  
  /** Include metadata */
  includeMetadata?: boolean;
}

/**
 * Export project response
 */
export interface ExportProjectResponse {
  /** Export ID */
  exportId: string;
  
  /** Download URL */
  downloadUrl?: string;
  
  /** Export status */
  status: ExportStatus;
  
  /** Export metadata */
  metadata?: ExportMetadata;
}

/**
 * Export status
 */
export interface ExportStatus {
  /** Status type */
  type: 'queued' | 'processing' | 'completed' | 'failed';
  
  /** Progress percentage */
  progress: number;
  
  /** Status message */
  message?: string;
  
  /** Estimated completion */
  estimatedCompletion?: Date;
  
  /** Export errors */
  errors?: ExportError[];
}

/**
 * Export error
 */
export interface ExportError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Error context */
  context?: string;
  
  /** Suggested resolution */
  resolution?: string;
}

/**
 * Export metadata
 */
export interface ExportMetadata {
  /** Export timestamp */
  timestamp: Date;
  
  /** File size */
  fileSize: number;
  
  /** Export duration */
  duration: number;
  
  /** Included assets */
  includedAssets: string[];
  
  /** Export statistics */
  statistics?: ExportStatistics;
}

/**
 * Export statistics
 */
export interface ExportStatistics {
  /** Files created */
  filesCreated: number;
  
  /** Total lines of code */
  linesOfCode?: number;
  
  /** Compression ratio */
  compressionRatio?: number;
  
  /** Asset optimization */
  assetOptimization?: number;
}

/**
 * ===== ANALYTICS API =====
 */

/**
 * Analytics request
 */
export interface AnalyticsRequest {
  /** Project token */
  token: string;
  
  /** Date range */
  dateRange: DateRange;
  
  /** Metrics to include */
  metrics: AnalyticsMetric[];
  
  /** Dimensions to group by */
  dimensions?: AnalyticsDimension[];
  
  /** Filters to apply */
  filters?: AnalyticsFilter[];
}

/**
 * Date range
 */
export interface DateRange {
  /** Start date */
  start: Date;
  
  /** End date */
  end: Date;
  
  /** Timezone */
  timezone?: string;
}

/**
 * Analytics metric
 */
export type AnalyticsMetric = 
  | 'views'
  | 'unique_visitors'
  | 'conversions'
  | 'conversion_rate'
  | 'bounce_rate'
  | 'session_duration'
  | 'page_load_time'
  | 'scroll_depth'
  | 'click_through_rate'
  | 'form_completion_rate';

/**
 * Analytics dimension
 */
export type AnalyticsDimension = 
  | 'date'
  | 'country'
  | 'device_type'
  | 'browser'
  | 'traffic_source'
  | 'utm_campaign'
  | 'page_section'
  | 'user_segment';

/**
 * Analytics filter
 */
export interface AnalyticsFilter {
  /** Dimension to filter */
  dimension: AnalyticsDimension;
  
  /** Filter operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'in' | 'not_in';
  
  /** Filter values */
  values: string[];
}

/**
 * Analytics response
 */
export interface AnalyticsResponse {
  /** Analytics data */
  data: AnalyticsData[];
  
  /** Summary statistics */
  summary: AnalyticsSummary;
  
  /** Response metadata */
  metadata: AnalyticsMetadata;
}

/**
 * Analytics data point
 */
export interface AnalyticsData {
  /** Dimension values */
  dimensions: Record<string, string>;
  
  /** Metric values */
  metrics: Record<string, number>;
  
  /** Data timestamp */
  timestamp?: Date;
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  /** Total metrics */
  totals: Record<string, number>;
  
  /** Average metrics */
  averages: Record<string, number>;
  
  /** Period comparisons */
  comparisons?: Record<string, ComparisonData>;
  
  /** Key insights */
  insights: AnalyticsInsight[];
}

/**
 * Comparison data
 */
export interface ComparisonData {
  /** Current period value */
  current: number;
  
  /** Previous period value */
  previous: number;
  
  /** Change amount */
  change: number;
  
  /** Change percentage */
  changePercent: number;
  
  /** Trend direction */
  trend: 'up' | 'down' | 'stable';
}

/**
 * Analytics insight
 */
export interface AnalyticsInsight {
  /** Insight type */
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  
  /** Insight description */
  description: string;
  
  /** Insight importance */
  importance: 'low' | 'medium' | 'high';
  
  /** Recommended actions */
  actions?: string[];
  
  /** Supporting data */
  data?: Record<string, any>;
}

/**
 * Analytics metadata
 */
export interface AnalyticsMetadata {
  /** Data freshness */
  dataFreshness: Date;
  
  /** Sampling rate */
  samplingRate?: number;
  
  /** Data quality score */
  qualityScore: number;
  
  /** Processing time */
  processingTime: number;
  
  /** Cache status */
  cacheStatus: 'hit' | 'miss';
}

/**
 * ===== WEBHOOK TYPES =====
 */

/**
 * Webhook payload
 */
export interface WebhookPayload {
  /** Event type */
  event: WebhookEvent;
  
  /** Event data */
  data: any;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Webhook version */
  version: string;
  
  /** Event ID */
  eventId: string;
  
  /** Project token */
  token: string;
}

/**
 * Webhook events
 */
export type WebhookEvent = 
  | 'project.created'
  | 'project.updated'
  | 'project.published'
  | 'project.deleted'
  | 'generation.started'
  | 'generation.completed'
  | 'generation.failed'
  | 'export.completed'
  | 'asset.uploaded'
  | 'analytics.milestone';

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  /** Webhook URL */
  url: string;
  
  /** Events to listen for */
  events: WebhookEvent[];
  
  /** Secret for signature verification */
  secret?: string;
  
  /** Retry configuration */
  retry?: WebhookRetryConfig;
  
  /** Timeout (seconds) */
  timeout?: number;
  
  /** Custom headers */
  headers?: Record<string, string>;
}

/**
 * Webhook retry configuration
 */
export interface WebhookRetryConfig {
  /** Maximum retries */
  maxRetries: number;
  
  /** Retry delay (seconds) */
  retryDelay: number;
  
  /** Exponential backoff */
  exponentialBackoff: boolean;
  
  /** Maximum delay (seconds) */
  maxDelay: number;
}// types/api.ts - API request/response types for all endpoints
// Handles create, preview, edit, and publish API calls

import { 
  InputVariables, 
  HiddenInferredFields, 
  FeatureItem, 
  LandingPageContent,
  SectionData,
} from './content';
import { AIGenerationType } from './ai';
import { FormData } from './forms';

/**
 * ===== BASE API TYPES =====
 */

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Request was successful */
  success: boolean;
  
  /** Response data */
  data?: T;
  
  /** Error information */
  error?: ApiError;
  
  /** Warning messages */
  warnings?: string[];
  
  /** Response message */
  message?: string;
  
  /** Response timestamp */
  timestamp: Date;
  
  /** Request ID for tracking */
  requestId: string;
  
  /** Response metadata */
  metadata?: ResponseMetadata;
}

/**
 * API error details
 */
export interface ApiError {
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Detailed error information */
  details?: ErrorDetails;
  
  /** Error stack trace (dev only) */
  stack?: string;
  
  /** Is error retryable */
  retryable: boolean;
  
  /** Suggested retry delay (seconds) */
  retryAfter?: number;
  
  /** Help URL */
  helpUrl?: string;
}

/**
 * Error details
 */
export interface ErrorDetails {
  /** Field-specific errors */
  fields?: Record<string, string[]>;
  
  /** Validation errors */
  validation?: ValidationError[];
  
  /** System errors */
  system?: SystemError[];
  
  /** External service errors */
  external?: ExternalError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Field name */
  field: string;
  
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Invalid value */
  value?: any;
  
  /** Expected format */
  expected?: string;
}

/**
 * System error
 */
export interface SystemError {
  /** Error component */
  component: string;
  
  /** Error type */
  type: string;
  
  /** Error message */
  message: string;
  
  /** Error severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * External service error
 */
export interface ExternalError {
  /** Service name */
  service: string;
  
  /** Service error code */
  code: string;
  
  /** Service error message */
  message: string;
  
  /** Service response time */
  responseTime?: number;
  
  /** Retry strategy */
  retryStrategy?: RetryStrategy;
}

/**
 * Retry strategy
 */
export interface RetryStrategy {
  /** Retry attempts */
  attempts: number;
  
  /** Retry delay (seconds) */
  delay: number;
  
  /** Exponential backoff */
  exponentialBackoff: boolean;
  
  /** Maximum delay */
  maxDelay: number;
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  /** Processing time (ms) */
  processingTime: number;
  
  /** Cache information */
  cache?: CacheInfo;
  
  /** Rate limiting info */
  rateLimit?: RateLimitInfo;
  
  /** API version */
  apiVersion: string;
  
  /** Server region */
  region?: string;
  
  /** Debug information */
  debug?: DebugInfo;
}

/**
 * Cache information
 */
export interface CacheInfo {
  /** Cache status */
  status: 'hit' | 'miss' | 'stale' | 'bypass';
  
  /** Cache key */
  key?: string;
  
  /** Cache TTL (seconds) */
  ttl?: number;
  
  /** Cache age (seconds) */
  age?: number;
}

/**
 * Rate limiting information
 */
export interface RateLimitInfo {
  /** Rate limit quota */
  limit: number;
  
  /** Remaining requests */
  remaining: number;
  
  /** Reset timestamp */
  reset: Date;
  
  /** Retry after (seconds) */
  retryAfter?: number;
}

/**
 * Debug information
 */
export interface DebugInfo {
  /** Trace ID */
  traceId: string;
  
  /** SQL queries executed */
  queries?: number;
  
  /** Memory usage */
  memory?: number;
  
  /** Performance metrics */
  performance?: PerformanceMetrics;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Database time (ms) */
  dbTime: number;
  
  /** External API time (ms) */
  externalTime: number;
  
  /** Processing time (ms) */
  processingTime: number;
  
  /** Total time (ms) */
  totalTime: number;
}

/**
 * ===== ONBOARDING API =====
 */

/**
 * Parse input request
 */
export interface ParseInputRequest {
  /** User's one-liner input */
  inputText: string;
  
  /** Optional context hints */
  context?: InputContext;
  
  /** Parse options */
  options?: ParseOptions;
}

/**
 * Input context
 */
export interface InputContext {
  /** User's industry */
  industry?: string;
  
  /** Company size */
  companySize?: string;
  
  /** Previous responses */
  previousResponses?: Record<string, any>;
  
  /** User preferences */
  preferences?: UserPreferences;
  
  /** Session metadata */
  sessionMetadata?: SessionMetadata;
}

/**
 * User preferences for API calls
 */
export interface UserPreferences {
  /** Preferred language */
  language?: string;
  
  /** Preferred tone */
  tone?: string;
  
  /** Content length preference */
  contentLength?: 'short' | 'medium' | 'long';
  
  /** Industry preferences */
  industryPreferences?: Record<string, any>;
}

/**
 * Session metadata for tracking
 */
export interface SessionMetadata {
  /** Session ID */
  sessionId: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Referrer */
  referrer?: string;
  
  /** UTM parameters */
  utm?: UTMParameters;
  
  /** Geographic location */
  location?: GeographicLocation;
}

/**
 * UTM tracking parameters
 */
export interface UTMParameters {
  /** UTM source */
  source?: string;
  
  /** UTM medium */
  medium?: string;
  
  /** UTM campaign */
  campaign?: string;
  
  /** UTM term */
  term?: string;
  
  /** UTM content */
  content?: string;
}

/**
 * Geographic location data
 */
export interface GeographicLocation {
  /** Country code */
  country?: string;
  
  /** Region/state */
  region?: string;
  
  /** City */
  city?: string;
  
  /** Timezone */
  timezone?: string;
  
  /** Language */
  language?: string;
}

/**
 * Parse options for input processing
 */
export interface ParseOptions {
  /** Confidence threshold */
  confidenceThreshold?: number;
  
  /** Maximum alternatives */
  maxAlternatives?: number;
  
  /** Enable fuzzy matching */
  fuzzyMatching?: boolean;
  
  /** Custom extractors */
  customExtractors?: string[];
}

/**
 * ===== BACKGROUND VALIDATION API TYPES =====
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
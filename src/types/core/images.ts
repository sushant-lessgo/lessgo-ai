/**
 * Font information from OCR
 */
export interface FontInfo {
  /** Font family */
  family?: string;
  
  /** Font size */
  size?: number;
  
  /** Font weight */
  weight?: 'normal' | 'bold';
  
  /** Font style */
  style?: 'normal' | 'italic';
  
  /** Text color */
  color?: string;
}

/**
 * Content category
 */
export interface ContentCategory {
  /** Category name */
  name: string;
  
  /** Confidence score */
  confidence: number;
  
  /** Category hierarchy */
  hierarchy?: string[];
  
  /** Subcategories */
  subcategories?: string[];
}

/**
 * Content moderation
 */
export interface ContentModeration {
  /** Overall safety score */
  safetyScore: number;
  
  /** Is content safe */
  isSafe: boolean;
  
  /** Detected issues */
  issues?: ModerationIssue[];
  
  /** Content flags */
  flags?: ContentFlag[];
  
  /** Moderation provider */
  provider: string;
  
  /** Moderation timestamp */
  timestamp: Date;
}

/**
 * Moderation issue
 */
export interface ModerationIssue {
  /** Issue type */
  type: 'adult' | 'violence' | 'gore' | 'hate' | 'drugs' | 'weapons' | 'other';
  
  /** Severity level */
  severity: 'low' | 'medium' | 'high';
  
  /** Confidence score */
  confidence: number;
  
  /** Issue description */
  description: string;
  
  /** Recommended action */
  recommendedAction: 'approve' | 'review' | 'reject';
}

/**
 * Content flag
 */
export interface ContentFlag {
  /** Flag type */
  type: string;
  
  /** Flag reason */
  reason: string;
  
  /** Flagged by */
  flaggedBy: 'system' | 'user' | 'moderator';
  
  /** Flag timestamp */
  timestamp: Date;
  
  /** Flag status */
  status: 'pending' | 'reviewed' | 'resolved';
}

/**
 * Image SEO information
 */
export interface ImageSEO {
  /** SEO score */
  score: number;
  
  /** Alt text quality */
  altTextQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
  
  /** Filename SEO */
  filenameSEO: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Size optimization */
  sizeOptimization: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Format optimization */
  formatOptimization: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Structured data */
  structuredData?: ImageStructuredData;
  
  /** SEO recommendations */
  recommendations: SEORecommendation[];
}

/**
 * Image structured data
 */
export interface ImageStructuredData {
  /** Schema.org type */
  type: string;
  
  /** Structured data properties */
  properties: Record<string, any>;
  
  /** JSON-LD representation */
  jsonLD?: string;
}

/**
 * SEO recommendation
 */
export interface SEORecommendation {
  /** Recommendation type */
  type: 'alt-text' | 'filename' | 'size' | 'format' | 'structure';
  
  /** Recommendation description */
  description: string;
  
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  
  /** Expected impact */
  impact: string;
  
  /** How to implement */
  implementation: string;
}

/**
 * ===== IMAGE OPTIMIZATION =====
 */

/**
 * Image optimization data
 */
export interface ImageOptimization {
  /** Optimization status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Original file size */
  originalSize: number;
  
  /** Optimized file size */
  optimizedSize?: number;
  
  /** Size reduction percentage */
  sizeReduction?: number;
  
  /** Optimization techniques applied */
  techniques: OptimizationTechnique[];
  
  /** Processing history */
  history: OptimizationHistory[];
  
  /** CDN information */
  cdn?: CDNInfo;
  
  /** Lazy loading configuration */
  lazyLoading?: LazyLoadingConfig;
}

/**
 * Optimization technique
 */
export interface OptimizationTechnique {
  /** Technique name */
  name: string;
  
  /** Technique type */
  type: 'compression' | 'format-conversion' | 'resizing' | 'quality-adjustment' | 'metadata-removal';
  
  /** Parameters used */
  parameters: Record<string, any>;
  
  /** Size reduction achieved */
  sizeReduction: number;
  
  /** Quality impact */
  qualityImpact: number;
  
  /** Processing time */
  processingTime: number;
}

/**
 * Optimization history
 */
export interface OptimizationHistory {
  /** Operation timestamp */
  timestamp: Date;
  
  /** Operation type */
  operation: string;
  
  /** Operation parameters */
  parameters: Record<string, any>;
  
  /** Result summary */
  result: OptimizationResult;
  
  /** Processing duration */
  duration: number;
}

/**
 * Optimization result
 */
export interface OptimizationResult {
  /** Success status */
  success: boolean;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Before file size */
  beforeSize: number;
  
  /** After file size */
  afterSize: number;
  
  /** Quality metrics */
  qualityMetrics?: QualityMetrics;
}

/**
 * Quality metrics
 */
export interface QualityMetrics {
  /** SSIM (Structural Similarity Index) */
  ssim?: number;
  
  /** PSNR (Peak Signal-to-Noise Ratio) */
  psnr?: number;
  
  /** VMAF (Video Multimethod Assessment Fusion) */
  vmaf?: number;
  
  /** Custom quality score */
  customScore?: number;
}

/**
 * CDN information
 */
export interface CDNInfo {
  /** CDN provider */
  provider: string;
  
  /** CDN URL */
  url: string;
  
  /** Edge locations */
  edgeLocations?: string[];
  
  /** Cache configuration */
  cache?: CacheConfig;
  
  /** Transform capabilities */
  transforms?: TransformCapability[];
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache TTL (seconds) */
  ttl: number;
  
  /** Cache key strategy */
  keyStrategy: string;
  
  /** Cache tags */
  tags?: string[];
  
  /** Purge configuration */
  purge?: PurgeConfig;
}

/**
 * Purge configuration
 */
export interface PurgeConfig {
  /** Auto-purge on update */
  autoPurge: boolean;
  
  /** Purge delay (seconds) */
  delay?: number;
  
  /** Purge strategies */
  strategies: string[];
}

/**
 * Transform capability
 */
export interface TransformCapability {
  /** Transform type */
  type: 'resize' | 'crop' | 'format' | 'quality' | 'filter' | 'overlay';
  
  /** Supported parameters */
  parameters: string[];
  
  /** Performance characteristics */
  performance?: PerformanceMetrics;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Average processing time (ms) */
  avgProcessingTime: number;
  
  /** Cache hit rate */
  cacheHitRate: number;
  
  /** Error rate */
  errorRate: number;
  
  /** Throughput (requests/second) */
  throughput: number;
}

/**
 * Lazy loading configuration
 */
export interface LazyLoadingConfig {
  /** Enable lazy loading */
  enabled: boolean;
  
  /** Loading strategy */
  strategy: 'intersection-observer' | 'scroll' | 'manual';
  
  /** Root margin */
  rootMargin?: string;
  
  /** Threshold */
  threshold?: number;
  
  /** Placeholder configuration */
  placeholder?: PlaceholderConfig;
}

/**
 * Placeholder configuration
 */
export interface PlaceholderConfig {
  /** Placeholder type */
  type: 'blur' | 'color' | 'skeleton' | 'custom';
  
  /** Placeholder data */
  data?: string;
  
  /** Animation */
  animation?: 'fade' | 'slide' | 'none';
  
  /** Duration (ms) */
  duration?: number;
}

/**
 * ===== IMAGE USAGE TRACKING =====
 */

/**
 * Image usage data
 */
export interface ImageUsage {
  /** Total views */
  views: number;
  
  /** Total downloads */
  downloads: number;
  
  /** Usage in projects */
  projects: ProjectUsage[];
  
  /** Usage contexts */
  contexts: UsageContext[];
  
  /** Performance metrics */
  performance: UsagePerformance;
  
  /** Geographic usage */
  geographic?: GeographicUsage;
  
  /** Device usage */
  devices?: DeviceUsage;
}

/**
 * Project usage
 */
export interface ProjectUsage {
  /** Project ID */
  projectId: string;
  
  /** Project name */
  projectName: string;
  
  /** Usage context in project */
  context: 'hero' | 'gallery' | 'content' | 'background' | 'icon' | 'thumbnail';
  
  /** First used date */
  firstUsed: Date;
  
  /** Last used date */
  lastUsed: Date;
  
  /** Usage frequency */
  frequency: number;
}

/**
 * Usage context
 */
export interface UsageContext {
  /** Context type */
  type: 'landing-page' | 'blog-post' | 'email' | 'social-media' | 'advertisement' | 'presentation';
  
  /** Specific location */
  location: string;
  
  /** Usage count */
  count: number;
  
  /** Performance in context */
  performance?: ContextPerformance;
}

/**
 * Context performance
 */
export interface ContextPerformance {
  /** Click-through rate */
  ctr?: number;
  
  /** Engagement rate */
  engagement?: number;
  
  /** Conversion rate */
  conversion?: number;
  
  /** Time spent viewing */
  viewTime?: number;
}

/**
 * Usage performance
 */
export interface UsagePerformance {
  /** Load time metrics */
  loadTime: LoadTimeMetrics;
  
  /** Bandwidth usage */
  bandwidth: BandwidthMetrics;
  
  /** Error rates */
  errors: ErrorMetrics;
  
  /** User engagement */
  engagement: EngagementMetrics;
}

/**
 * Load time metrics
 */
export interface LoadTimeMetrics {
  /** Average load time (ms) */
  average: number;
  
  /** Median load time (ms) */
  median: number;
  
  /** 95th percentile load time (ms) */
  p95: number;
  
  /** 99th percentile load time (ms) */
  p99: number;
  
  /** Slow loads (>3s) percentage */
  slowLoads: number;
}

/**
 * Bandwidth metrics
 */
export interface BandwidthMetrics {
  /** Total bytes served */
  totalBytes: number;
  
  /** Average bytes per request */
  avgBytesPerRequest: number;
  
  /** Peak bandwidth usage */
  peakBandwidth: number;
  
  /** Bandwidth cost estimate */
  estimatedCost?: number;
}

/**
 * Error metrics
 */
export interface ErrorMetrics {
  /** Total errors */
  totalErrors: number;
  
  /** Error rate (percentage) */
  errorRate: number;
  
  /** Error types */
  errorTypes: Record<string, number>;
  
  /** Most common errors */
  commonErrors: string[];
}

/**
 * Engagement metrics
 */
export interface EngagementMetrics {
  /** Image views */
  views: number;
  
  /** Image clicks */
  clicks: number;
  
  /** Click-through rate */
  ctr: number;
  
  /** Average view duration */
  avgViewDuration: number;
  
  /** Scroll depth when image viewed */
  scrollDepth?: number;
}

/**
 * Geographic usage
 */
export interface GeographicUsage {
  /** Usage by country */
  countries: Record<string, number>;
  
  /** Usage by region */
  regions: Record<string, number>;
  
  /** Usage by city */
  cities: Record<string, number>;
  
  /** Top locations */
  topLocations: LocationUsage[];
}

/**
 * Location usage
 */
export interface LocationUsage {
  /** Location name */
  location: string;
  
  /** Usage count */
  count: number;
  
  /** Percentage of total */
  percentage: number;
  
  /** Average performance */
  performance: LocationPerformance;
}

/**
 * Location performance
 */
export interface LocationPerformance {
  /** Average load time */
  loadTime: number;
  
  /** Error rate */
  errorRate: number;
  
  /** Bandwidth usage */
  bandwidth: number;
}

/**
 * Device usage
 */
export interface DeviceUsage {
  /** Usage by device type */
  deviceTypes: Record<string, number>;
  
  /** Usage by browser */
  browsers: Record<string, number>;
  
  /** Usage by OS */
  operatingSystems: Record<string, number>;
  
  /** Screen resolutions */
  screenResolutions: Record<string, number>;
}

/**
 * ===== IMAGE LICENSING =====
 */

/**
 * Image licensing information
 */
export interface ImageLicensing {
  /** License type */
  license: LicenseType;
  
  /** Copyright holder */
  copyrightHolder?: string;
  
  /** License details */
  details: LicenseDetails;
  
  /** Usage rights */
  usageRights: UsageRights;
  
  /** Attribution requirements */
  attribution?: AttributionRequirements;
  
  /** License compliance */
  compliance: LicenseCompliance;
}

/**
 * License types
 */
export type LicenseType = 
  | 'public-domain'
  | 'cc0'
  | 'cc-by'
  | 'cc-by-sa'
  | 'cc-by-nc'
  | 'cc-by-nc-sa'
  | 'mit'
  | 'apache'
  | 'custom'
  | 'commercial'
  | 'editorial'
  | 'royalty-free'
  | 'rights-managed'
  | 'unknown';

/**
 * License details
 */
export interface LicenseDetails {
  /** License name */
  name: string;
  
  /** License URL */
  url?: string;
  
  /** License text */
  text?: string;
  
  /** License version */
  version?: string;
  
  /** License provider */
  provider?: string;
  
  /** Purchase information */
  purchase?: PurchaseInfo;
}

/**
 * Purchase information
 */
export interface PurchaseInfo {
  /** Purchase date */
  date: Date;
  
  /** Purchase price */
  price?: number;
  
  /** Currency */
  currency?: string;
  
  /** Invoice/receipt ID */
  invoiceId?: string;
  
  /** License ID */
  licenseId?: string;
  
  /** Download ID */
  downloadId?: string;
}

/**
 * Usage rights
 */
export interface UsageRights {
  /** Commercial use allowed */
  commercial: boolean;
  
  /** Modification allowed */
  modification: boolean;
  
  /** Distribution allowed */
  distribution: boolean;
  
  /** Sublicensing allowed */
  sublicensing: boolean;
  
  /** Geographic restrictions */
  geographicRestrictions?: string[];
  
  /** Usage limitations */
  limitations?: UsageLimitation[];
  
  /** Expiration date */
  expirationDate?: Date;
}

/**
 * Usage limitation
 */
export interface UsageLimitation {
  /** Limitation type */
  type: 'print-runs' | 'website-views' | 'social-media' | 'broadcast' | 'duration' | 'territory';
  
  /** Limitation details */
  details: string;
  
  /** Quantitative limit */
  limit?: number;
  
  /** Measurement unit */
  unit?: string;
}

/**
 * Attribution requirements
 */
export interface AttributionRequirements {
  /** Attribution required */
  required: boolean;
  
  /** Attribution text */
  text?: string;
  
  /** Attribution format */
  format?: 'text' | 'html' | 'custom';
  
  /** Placement requirements */
  placement?: 'adjacent' | 'credits' | 'metadata' | 'anywhere';
  
  /** Link requirements */
  linkRequired?: boolean;
  
  /** Link URL */
  linkUrl?: string;
}

/**
 * License compliance
 */
export interface LicenseCompliance {
  /** Compliance status */
  status: 'compliant' | 'non-compliant' | 'unknown' | 'needs-review';
  
  /** Compliance checks */
  checks: ComplianceCheck[];
  
  /** Last check date */
  lastChecked: Date;
  
  /** Next check date */
  nextCheck?: Date;
  
  /** Compliance issues */
  issues?: ComplianceIssue[];
}

/**
 * Compliance check
 */
export interface ComplianceCheck {
  /** Check type */
  type: 'attribution' | 'usage-rights' | 'expiration' | 'geographic' | 'modification';
  
  /** Check result */
  result: 'pass' | 'fail' | 'warning';
  
  /** Check details */
  details: string;
  
  /** Check timestamp */
  timestamp: Date;
}

/**
 * Compliance issue
 */
export interface ComplianceIssue {
  /** Issue type */
  type: 'missing-attribution' | 'unauthorized-use' | 'expired-license' | 'geographic-violation' | 'modification-violation';
  
  /** Issue severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Issue description */
  description: string;
  
  /** Recommended action */
  recommendedAction: string;
  
  /** Resolution deadline */
  deadline?: Date;
}

/**
 * ===== AI GENERATION CONTEXT =====
 */

/**
 * AI generation context for images
 */
export interface ImageAIContext {
  /** Generation prompt */
  prompt: string;
  
  /** Generation parameters */
  parameters: AIGenerationParameters;
  
  /** AI model used */
  model: string;
  
  /** Generation timestamp */
  generatedAt: Date;
  
  /** Generation cost */
  cost?: number;
  
  /** Alternative generations */
  alternatives?: AIAlternative[];
  
  /** Generation metadata */
  metadata: AIGenerationMetadata;
}

/**
 * AI generation parameters
 */
export interface AIGenerationParameters {
  /** Image style */
  style?: string;
  
  /** Aspect ratio */
  aspectRatio?: string;
  
  /** Resolution */
  resolution?: string;
  
  /** Seed for reproducibility */
  seed?: number;
  
  /** Guidance scale */
  guidance?: number;
  
  /** Number of inference steps */
  steps?: number;
  
  /** Negative prompt */
  negativePrompt?: string;
  
  /** Advanced parameters */
  advanced?: Record<string, any>;
}

/**
 * AI alternative generation
 */
export interface AIAlternative {
  /** Alternative image URL */
  url: string;
  
  /** Alternative parameters */
  parameters: Partial<AIGenerationParameters>;
  
  /** Quality score */
  score: number;
  
  /** Generation cost */
  cost?: number;
}

/**
 * AI generation metadata
 */
export interface AIGenerationMetadata {
  /** Request ID */
  requestId: string;
  
  /** Processing time */
  processingTime: number;
  
  /** Queue time */
  queueTime?: number;
  
  /** Generation quality */
  quality: AIGenerationQuality;
  
  /** Content safety */
  safety: AIContentSafety;
}

/**
 * AI generation quality
 */
export interface AIGenerationQuality {
  /** Overall quality score */
  score: number;
  
  /** Prompt adherence */
  promptAdherence: number;
  
  /** Visual quality */
  visualQuality: number;
  
  /** Consistency */
  consistency: number;
  
  /** Originality */
  originality: number;
}

/**
 * AI content safety
 */
export interface AIContentSafety {
  /** Safety score */
  score: number;
  
  /** Is safe for use */
  isSafe: boolean;
  
  /** Safety categories */
  categories: AISafetyCategory[];
  
  /** Content warnings */
  warnings?: string[];
}

/**
 * AI safety category
 */
export interface AISafetyCategory {
  /** Category name */
  name: string;
  
  /** Safety score for category */
  score: number;
  
  /** Is category safe */
  isSafe: boolean;
  
  /** Category description */
  description?: string;
}

/**
 * ===== TIMESTAMPS =====
 */

/**
 * Image timestamps
 */
export interface ImageTimestamps {
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modified timestamp */
  updatedAt: Date;
  
  /** Last accessed timestamp */
  lastAccessed?: Date;
  
  /** Upload completion timestamp */
  uploadedAt?: Date;
  
  /** First usage timestamp */
  firstUsed?: Date;
  
  /** Last usage timestamp */
  lastUsed?: Date;
  
  /** Optimization timestamp */
  optimizedAt?: Date;
  
  /** Analysis completion timestamp */
  analyzedAt?: Date;
}

/**
 * ===== IMAGE OPERATIONS =====
 */

/**
 * Image transformation request
 */
export interface ImageTransformRequest {
  /** Source image ID */
  sourceId: string;
  
  /** Transformation operations */
  operations: ImageOperation[];
  
  /** Output format */
  outputFormat?: 'jpeg' | 'png' | 'webp' | 'avif' | 'auto';
  
  /** Quality setting */
  quality?: number;
  
  /** Progressive encoding */
  progressive?: boolean;
  
  /** Preserve metadata */
  preserveMetadata?: boolean;
}

/**
 * Image operation
 */
export interface ImageOperation {
  /** Operation type */
  type: 'resize' | 'crop' | 'rotate' | 'flip' | 'filter' | 'overlay' | 'border' | 'watermark';
  
  /** Operation parameters */
  parameters: Record<string, any>;
  
  /** Operation order */
  order: number;
}

/**
 * Image transformation response
 */
export interface ImageTransformResponse {
  /** Success status */
  success: boolean;
  
  /** Transformed image data */
  image?: ImageAsset;
  
  /** Error details */
  error?: string;
  
  /** Processing time */
  processingTime: number;
  
  /** Transformation cost */
  cost?: number;
}

/**
 * ===== IMAGE COLLECTIONS =====
 */

/**
 * Image collection/album
 */
export interface ImageCollection {
  /** Collection ID */
  id: string;
  
  /** Collection name */
  name: string;
  
  /** Collection description */
  description?: string;
  
  /** Collection type */
  type: 'album' | 'gallery' | 'library' | 'project' | 'temporary';
  
  /** Images in collection */
  images: string[];
  
  /** Collection metadata */
  metadata: CollectionMetadata;
  
  /** Sharing settings */
  sharing?: CollectionSharing;
  
  /** Collection statistics */
  statistics?: CollectionStatistics;
}

/**
 * Collection metadata
 */
export interface CollectionMetadata {
  /** Creation date */
  createdAt: Date;
  
  /** Last modified date */
  updatedAt: Date;
  
  /** Created by user */
  createdBy: string;
  
  /** Collection tags */
  tags: string[];
  
  /** Collection category */
  category?: string;
  
  /** Cover image */
  coverImage?: string;
  
  /** Collection color theme */
  colorTheme?: string;
}

/**
 * Collection sharing
 */
export interface CollectionSharing {
  /** Sharing enabled */
  enabled: boolean;
  
  /** Public access */
  public: boolean;
  
  /** Share URL */
  shareUrl?: string;
  
  /** Password protection */
  password?: string;
  
  /** Expiration date */
  expirationDate?: Date;
  
  /** Download permissions */
  allowDownload: boolean;
  
  /** View permissions */
  viewPermissions: 'public' | 'link' | 'private';
}

/**
 * Collection statistics
 */
export interface CollectionStatistics {
  /** Total images */
  totalImages: number;
  
  /** Total size */
  totalSize: number;
  
  /** Total views */
  totalViews: number;
  
  /** Total downloads */
  totalDownloads: number;
  
  /** Average rating */
  averageRating?: number;
  
  /** Most popular image */
  mostPopular?: string;
  
  /** Upload frequency */
  uploadFrequency?: Record<string, number>;
}

/**
 * ===== STOCK PHOTO INTEGRATION =====
 */

/**
 * Stock photo search request
 */
export interface StockPhotoSearchRequest {
  /** Search query */
  query: string;
  
  /** Search filters */
  filters: StockPhotoFilters;
  
  /** Pagination */
  pagination: SearchPagination;
  
  /** Sort options */
  sort?: SearchSort;
  
  /** Provider preferences */
  providers?: string[];
}

/**
 * Stock photo filters
 */
export interface StockPhotoFilters {
  /** Image orientation */
  orientation?: 'horizontal' | 'vertical' | 'square';
  
  /** Minimum resolution */
  minResolution?: { width: number; height: number };
  
  /** Image category */
  category?: string;
  
  /** Color filters */
  color?: ColorFilter;
  
  /** People filters */
  people?: PeopleFilter;
  
  /** License type */
  licenseType?: 'free' | 'paid' | 'editorial';
  
  /** Age of image */
  ageFilter?: 'recent' | 'popular' | 'any';
}

/**
 * Color filter
 */
export interface ColorFilter {
  /** Dominant color */
  dominantColor?: string;
  
  /** Color mode */
  colorMode?: 'color' | 'black-white' | 'monochrome';
  
  /** Color palette */
  palette?: string[];
}

/**
 * People filter
 */
export interface PeopleFilter {
  /** Include people */
  includePeople?: boolean;
  
  /** Exclude people */
  excludePeople?: boolean;
  
  /** Age groups */
  ageGroups?: string[];
  
  /** Gender */
  gender?: 'male' | 'female' | 'mixed';
  
  /** Ethnicity */
  ethnicity?: string[];
}

/**
 * Search pagination
 */
export interface SearchPagination {
  /** Page number */
  page: number;
  
  /** Results per page */
  perPage: number;
  
  /** Maximum results */
  maxResults?: number;
}

/**
 * Search sort options
 */
export interface SearchSort {
  /** Sort field */
  field: 'relevance' | 'popularity' | 'date' | 'downloads' | 'rating';
  
  /** Sort direction */
  direction: 'asc' | 'desc';
}

/**
 * Stock photo search response
 */
export interface StockPhotoSearchResponse {
  /** Search results */
  results: StockPhotoResult[];
  
  /** Total results count */
  totalResults: number;
  
  /** Current page */
  currentPage: number;
  
  /** Total pages */
  totalPages: number;
  
  /** Search metadata */
  metadata: SearchMetadata;
  
  /** Provider information */
  providers: ProviderInfo[];
}

/**
 * Stock photo result
 */
export interface StockPhotoResult {
  /** Photo ID */
  id: string;
  
  /** Provider */
  provider: string;
  
  /** Photo URLs */
  urls: StockPhotoUrls;
  
  /** Photo metadata */
  metadata: StockPhotoMetadata;
  
  /** Licensing information */
  licensing: StockPhotoLicensing;
  
  /** Download information */
  download?: DownloadInfo;
}

/**
 * Stock photo URLs
 */
export interface StockPhotoUrls {
  /** Thumbnail URL */
  thumbnail: string;
  
  /** Small preview URL */
  small: string;
  
  /** Medium preview URL */
  medium: string;
  
  /** Large preview URL */
  large?: string;
  
  /** Full resolution URL */
  full?: string;
  
  /** Download URL */
  download?: string;
}

/**
 * Stock photo metadata
 */
export interface StockPhotoMetadata {
  /** Photo title */
  title: string;
  
  /** Photo description */
  description?: string;
  
  /** Photo tags */
  tags: string[];
  
  /** Photo categories */
  categories: string[];
  
  /** Photographer information */
  photographer?: PhotographerInfo;
  
  /** Photo statistics */
  statistics?: PhotoStatistics;
}

/**
 * Photographer information
 */
export interface PhotographerInfo {
  /** Photographer name */
  name: string;
  
  /** Photographer ID */
  id?: string;
  
  /** Profile URL */
  profileUrl?: string;
  
  /** Portfolio URL */
  portfolioUrl?: string;
}

/**
 * Photo statistics
 */
export interface PhotoStatistics {
  /** View count */
  views: number;
  
  /** Download count */
  downloads: number;
  
  /** Like count */
  likes: number;
  
  /** Rating */
  rating?: number;
  
  /** Upload date */
  uploadDate: Date;
}

/**
 * Stock photo licensing
 */
export interface StockPhotoLicensing {
  /** License type */
  type: string;
  
  /** License description */
  description: string;
  
  /** Commercial use allowed */
  commercialUse: boolean;
  
  /** Attribution required */
  attributionRequired: boolean;
  
  /** Price information */
  price?: PriceInfo;
}

/**
 * Price information
 // types/images.ts - Comprehensive image management system types
// Handles uploads, stock photos, AI generation, and library management

/**
 * ===== IMAGE SOURCES =====
 */

/**
 * All supported image sources
 */
export type ImageSource = 
  | 'upload'      // User uploaded files
  | 'unsplash'    // Unsplash stock photos
  | 'pexels'      // Pexels stock photos
  | 'pixabay'     // Pixabay stock photos
  | 'shutterstock' // Shutterstock (premium)
  | 'getty'       // Getty Images (premium)
  | 'ai-generated' // AI-generated images
  | 'url'         // External URL
  | 'library'     // Internal image library
  | 'template'    // Template images
  | 'placeholder'; // Placeholder images

/**
 * ===== CORE IMAGE DATA =====
 */

/**
 * Core image data structure
 */
export interface ImageAsset {
  /** Unique image identifier */
  id: string;
  
  /** Image source type */
  source: ImageSource;
  
  /** Primary image URL */
  url: string;
  
  /** Alternative URLs for different sizes */
  urls?: ImageUrls;
  
  /** Alt text for accessibility */
  altText: string;
  
  /** Image title */
  title?: string;
  
  /** Image description */
  description?: string;
  
  /** Image metadata */
  metadata: ImageMetadata;
  
  /** Processing and optimization data */
  optimization: ImageOptimization;
  
  /** Usage tracking */
  usage: ImageUsage;
  
  /** Copyright and licensing */
  licensing: ImageLicensing;
  
  /** AI generation context (if applicable) */
  aiContext?: ImageAIContext;
  
  /** Timestamps */
  timestamps: ImageTimestamps;
}

/**
 * ===== VIDEO DATA =====
 */

/**
 * Video data structure
 */
export interface VideoData {
  /** Unique video identifier */
  id: string;
  
  /** Video source type */
  source: 'upload' | 'youtube' | 'vimeo' | 'url' | 'library';
  
  /** Primary video URL */
  url: string;
  
  /** Video thumbnail */
  thumbnail?: string;
  
  /** Video title */
  title?: string;
  
  /** Video description */
  description?: string;
  
  /** Video metadata */
  metadata: VideoMetadata;
  
  /** Player configuration */
  player: VideoPlayerConfig;
  
  /** Timestamps */
  timestamps: ImageTimestamps; // Reuse existing timestamp interface
}

/**
 * Video metadata
 */
export interface VideoMetadata {
  /** Video duration in seconds */
  duration: number;
  
  /** Video dimensions */
  dimensions: { width: number; height: number };
  
  /** Video format */
  format: string;
  
  /** File size (for uploads) */
  fileSize?: number;
  
  /** Video codec */
  codec?: string;
  
  /** Bitrate */
  bitrate?: number;
  
  /** Frame rate */
  frameRate?: number;
}

/**
 * Video player configuration
 */
export interface VideoPlayerConfig {
  /** Auto-play video */
  autoplay: boolean;
  
  /** Show video controls */
  controls: boolean;
  
  /** Loop video */
  loop: boolean;
  
  /** Mute by default */
  muted: boolean;
  
  /** Poster image */
  poster?: string;
  
  /** Preload strategy */
  preload: 'none' | 'metadata' | 'auto';
}

/**
 * ===== ICON DATA =====
 */

/**
 * Icon data structure
 */
export interface IconData {
  /** Unique icon identifier */
  id: string;
  
  /** Icon source type */
  source: 'heroicons' | 'lucide' | 'custom' | 'svg' | 'font';
  
  /** Icon name/identifier */
  name: string;
  
  /** Icon variant */
  variant?: 'outline' | 'solid' | 'mini' | 'micro';
  
  /** Icon size */
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  
  /** Icon color */
  color?: string;
  
  /** Custom SVG data (for custom icons) */
  svgData?: string;
  
  /** Icon metadata */
  metadata: IconMetadata;
  
  /** Timestamps */
  timestamps: ImageTimestamps; // Reuse existing timestamp interface
}

/**
 * Icon metadata
 */
export interface IconMetadata {
  /** Icon category */
  category?: string;
  
  /** Icon tags */
  tags: string[];
  
  /** Icon library version */
  libraryVersion?: string;
  
  /** Icon accessibility label */
  ariaLabel?: string;
  
  /** Icon description */
  description?: string;
}


/**
 * Image URLs for different sizes/formats
 */
export interface ImageUrls {
  /** Original/full size */
  original: string;
  
  /** Large size (1200px+) */
  large?: string;
  
  /** Medium size (600-1200px) */
  medium?: string;
  
  /** Small size (300-600px) */
  small?: string;
  
  /** Thumbnail (150px or less) */
  thumbnail?: string;
  
  /** WebP versions */
  webp?: {
    original?: string;
    large?: string;
    medium?: string;
    small?: string;
    thumbnail?: string;
  };
  
  /** AVIF versions */
  avif?: {
    original?: string;
    large?: string;
    medium?: string;
    small?: string;
    thumbnail?: string;
  };
}

/**
 * Image metadata
 */
export interface ImageMetadata {
  /** File information */
  file: FileMetadata;
  
  /** Image dimensions and properties */
  image: ImageProperties;
  
  /** EXIF data (if available) */
  exif?: ExifData;
  
  /** Color analysis */
  colors?: ColorAnalysis;
  
  /** Content analysis */
  content?: ContentAnalysis;
  
  /** SEO information */
  seo?: ImageSEO;
}

/**
 * File metadata
 */
export interface FileMetadata {
  /** Original filename */
  originalName: string;
  
  /** File size in bytes */
  size: number;
  
  /** MIME type */
  mimeType: string;
  
  /** File extension */
  extension: string;
  
  /** MD5 hash for deduplication */
  hash?: string;
  
  /** Upload information */
  upload?: UploadMetadata;
}

/**
 * Upload metadata
 */
export interface UploadMetadata {
  /** Upload timestamp */
  uploadedAt: Date;
  
  /** User who uploaded */
  uploadedBy: string;
  
  /** Upload method */
  method: 'drag-drop' | 'file-picker' | 'url' | 'api' | 'bulk';
  
  /** Upload session ID */
  sessionId?: string;
  
  /** Original upload location */
  location?: UploadLocation;
}

/**
 * Upload location details
 */
export interface UploadLocation {
  /** IP address */
  ip?: string;
  
  /** User agent */
  userAgent?: string;
  
  /** Geographic location */
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Image properties
 */
export interface ImageProperties {
  /** Image width in pixels */
  width: number;
  
  /** Image height in pixels */
  height: number;
  
  /** Aspect ratio */
  aspectRatio: number;
  
  /** Color space */
  colorSpace?: 'sRGB' | 'Adobe RGB' | 'P3' | 'CMYK';
  
  /** Bit depth */
  bitDepth?: number;
  
  /** Has transparency */
  hasAlpha: boolean;
  
  /** Is animated (GIF, WebP, etc.) */
  isAnimated: boolean;
  
  /** Frame count (for animated images) */
  frameCount?: number;
  
  /** Dominant orientation */
  orientation: 'landscape' | 'portrait' | 'square';
  
  /** Quality assessment */
  quality?: ImageQuality;
}

/**
 * Image quality assessment
 */
export interface ImageQuality {
  /** Overall quality score (0-100) */
  score: number;
  
  /** Sharpness score */
  sharpness: number;
  
  /** Brightness score */
  brightness: number;
  
  /** Contrast score */
  contrast: number;
  
  /** Noise level */
  noise: number;
  
  /** Compression artifacts */
  artifacts: number;
  
  /** Suitability for different uses */
  suitability: QualitySuitability;
}

/**
 * Quality suitability assessment
 */
export interface QualitySuitability {
  /** Web usage suitability */
  web: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Print usage suitability */
  print: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Hero section suitability */
  hero: 'excellent' | 'good' | 'fair' | 'poor';
  
  /** Thumbnail suitability */
  thumbnail: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * EXIF data
 */
export interface ExifData {
  /** Camera make */
  make?: string;
  
  /** Camera model */
  model?: string;
  
  /** Date taken */
  dateTaken?: Date;
  
  /** GPS coordinates */
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  
  /** Camera settings */
  settings?: CameraSettings;
  
  /** Lens information */
  lens?: LensInformation;
}

/**
 * Camera settings
 */
export interface CameraSettings {
  /** ISO sensitivity */
  iso?: number;
  
  /** Aperture (f-stop) */
  aperture?: number;
  
  /** Shutter speed */
  shutterSpeed?: string;
  
  /** Focal length */
  focalLength?: number;
  
  /** Flash used */
  flash?: boolean;
  
  /** White balance */
  whiteBalance?: string;
}

/**
 * Lens information
 */
export interface LensInformation {
  /** Lens make */
  make?: string;
  
  /** Lens model */
  model?: string;
  
  /** Focal length range */
  focalLengthRange?: {
    min: number;
    max: number;
  };
  
  /** Maximum aperture */
  maxAperture?: number;
}

/**
 * Color analysis
 */
export interface ColorAnalysis {
  /** Dominant colors */
  dominantColors: ColorInfo[];
  
  /** Color palette */
  palette: ColorPalette;
  
  /** Average color */
  averageColor: string;
  
  /** Color temperature */
  temperature?: 'warm' | 'cool' | 'neutral';
  
  /** Color harmony */
  harmony?: ColorHarmony;
  
  /** Contrast analysis */
  contrast?: ContrastAnalysis;
}

/**
 * Color information
 */
export interface ColorInfo {
  /** Color value (hex) */
  hex: string;
  
  /** RGB values */
  rgb: { r: number; g: number; b: number };
  
  /** HSL values */
  hsl: { h: number; s: number; l: number };
  
  /** Percentage of image */
  percentage: number;
  
  /** Color name */
  name?: string;
}

/**
 * Color palette
 */
export interface ColorPalette {
  /** Primary colors */
  primary: string[];
  
  /** Secondary colors */
  secondary: string[];
  
  /** Accent colors */
  accent: string[];
  
  /** Neutral colors */
  neutral: string[];
}

/**
 * Color harmony analysis
 */
export interface ColorHarmony {
  /** Harmony type */
  type: 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'split-complementary' | 'tetradic';
  
  /** Harmony score (0-100) */
  score: number;
  
  /** Color relationships */
  relationships: ColorRelationship[];
}

/**
 * Color relationship
 */
export interface ColorRelationship {
  /** First color */
  color1: string;
  
  /** Second color */
  color2: string;
  
  /** Relationship type */
  type: 'complementary' | 'analogous' | 'triadic' | 'split-complementary';
  
  /** Strength of relationship */
  strength: number;
}

/**
 * Contrast analysis
 */
export interface ContrastAnalysis {
  /** Overall contrast level */
  level: 'low' | 'medium' | 'high';
  
  /** Contrast ratio */
  ratio: number;
  
  /** Text readability */
  textReadability: {
    onLight: 'excellent' | 'good' | 'poor';
    onDark: 'excellent' | 'good' | 'poor';
  };
  
  /** Accessibility compliance */
  accessibility: {
    wcagAA: boolean;
    wcagAAA: boolean;
  };
}

/**
 * Content analysis
 */
export interface ContentAnalysis {
  /** AI-detected objects */
  objects?: DetectedObject[];
  
  /** Scene description */
  scene?: SceneDescription;
  
  /** Face detection */
  faces?: FaceDetection[];
  
  /** Text detection (OCR) */
  text?: TextDetection[];
  
  /** Content categories */
  categories?: ContentCategory[];
  
  /** Content moderation */
  moderation?: ContentModeration;
}

/**
 * Detected object
 */
export interface DetectedObject {
  /** Object label */
  label: string;
  
  /** Confidence score (0-1) */
  confidence: number;
  
  /** Bounding box */
  boundingBox?: BoundingBox;
  
  /** Object attributes */
  attributes?: string[];
}

/**
 * Bounding box coordinates
 */
export interface BoundingBox {
  /** X coordinate */
  x: number;
  
  /** Y coordinate */
  y: number;
  
  /** Width */
  width: number;
  
  /** Height */
  height: number;
}

/**
 * Scene description
 */
export interface SceneDescription {
  /** Main scene description */
  description: string;
  
  /** Scene type */
  type: 'indoor' | 'outdoor' | 'studio' | 'nature' | 'urban' | 'other';
  
  /** Lighting conditions */
  lighting?: 'natural' | 'artificial' | 'mixed' | 'low-light';
  
  /** Time of day */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  
  /** Weather conditions */
  weather?: string;
  
  /** Setting */
  setting?: string;
}

/**
 * Face detection
 */
export interface FaceDetection {
  /** Face ID */
  id: string;
  
  /** Confidence score */
  confidence: number;
  
  /** Bounding box */
  boundingBox: BoundingBox;
  
  /** Face attributes */
  attributes?: FaceAttributes;
  
  /** Landmarks */
  landmarks?: FaceLandmarks;
}

/**
 * Face attributes
 */
export interface FaceAttributes {
  /** Estimated age range */
  ageRange?: { min: number; max: number };
  
  /** Estimated gender */
  gender?: 'male' | 'female' | 'unknown';
  
  /** Emotion */
  emotion?: string;
  
  /** Facial hair */
  facialHair?: boolean;
  
  /** Eyewear */
  eyewear?: boolean;
  
  /** Smile */
  smile?: boolean;
}

/**
 * Face landmarks
 */
export interface FaceLandmarks {
  /** Left eye */
  leftEye?: { x: number; y: number };
  
  /** Right eye */
  rightEye?: { x: number; y: number };
  
  /** Nose */
  nose?: { x: number; y: number };
  
  /** Mouth */
  mouth?: { x: number; y: number };
  
  /** Additional landmarks */
  additional?: Array<{ name: string; x: number; y: number }>;
}

/**
 * Text detection (OCR)
 */
export interface TextDetection {
  /** Detected text */
  text: string;
  
  /** Confidence score */
  confidence: number;
  
  /** Bounding box */
  boundingBox: BoundingBox;
  
  /** Language */
  language?: string;
  
  /** Text orientation */
  orientation?: number;
  
  /** Font information */
  font?: FontInfo;
}

/**
 * Font information from OCR
 */
/**
 * Font information from OCR
 */
export interface FontInfo {
  /** Font family */
  family?: string;
  
  /** Font size */
  size?: number;
  
  /** Font weight */
  weight?: 'normal' | 'bold';
  
  /** Font style */
  style?: 'normal' | 'italic';
  
  /** Text color */
  color?: string;
}

/**
 * Search metadata
 */
export interface SearchMetadata {
  /** Search query */
  query: string;
  
  /** Search duration */
  duration: number;
  
  /** Results returned */
  resultsReturned: number;
  
  /** Search ID */
  searchId: string;
}

/**
 * Provider information
 */
export interface ProviderInfo {
  /** Provider name */
  name: string;
  
  /** Provider ID */
  id: string;
  
  /** Results count from provider */
  resultsCount: number;
  
  /** Provider status */
  status: 'active' | 'inactive' | 'error';
}

/**
 * Download information
 */
export interface DownloadInfo {
  /** Download URL */
  url: string;
  
  /** Download expiration */
  expiresAt: Date;
  
  /** Download limit */
  downloadLimit?: number;
  
  /** Downloads remaining */
  downloadsRemaining?: number;
}

/**
 * Price information
 */
export interface PriceInfo {
  /** Price amount */
  amount: number;
  
  /** Currency */
  currency: string;
  
  /** Price type */
  type: 'free' | 'paid' | 'subscription';
  
  /** License duration */
  duration?: 'perpetual' | 'limited';
}
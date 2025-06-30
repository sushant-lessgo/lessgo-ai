// types/forms.ts - Comprehensive form system types
// Handles simple forms in create/preview + advanced form builder in edit mode

/**
 * ===== FORM FIELD TYPES =====
 */

/**
 * All supported form field types
 */
export type FormFieldType = 
  | 'text'          // Single line text input
  | 'email'         // Email input with validation
  | 'phone'         // Phone number input
  | 'url'           // URL input with validation  
  | 'textarea'      // Multi-line text input
  | 'number'        // Numeric input
  | 'select'        // Dropdown selection
  | 'multiselect'   // Multiple selection dropdown
  | 'radio'         // Radio button group
  | 'checkbox'      // Single checkbox
  | 'checkboxgroup' // Multiple checkboxes
  | 'file'          // File upload
  | 'date'          // Date picker
  | 'time'          // Time picker
  | 'datetime'      // Date and time picker
  | 'range'         // Slider input
  | 'hidden'        // Hidden field
  | 'custom';       // Custom field type

/**
 * ===== CORE FORM STRUCTURES =====
 */

/**
 * Complete form configuration
 */
export interface FormData {
  /** Unique form identifier */
  id: string;
  
  /** Human-readable form name */
  name: string;
  
  /** Form description/purpose */
  description?: string;
  
  /** Ordered list of form fields */
  fields: FormField[];
  
  /** Form-level settings */
  settings: FormSettings;
  
  /** Integration configurations */
  integrations: FormIntegration[];
  
  /** Validation rules that apply to entire form */
  globalValidation: GlobalValidation;
  
  /** Form styling and layout */
  styling: FormStyling;
  
  /** Conversion tracking */
  tracking: FormTracking;
  
  /** A/B testing configuration */
  testing?: FormTesting;
  
  /** Metadata */
  metadata: FormMetadata;
}

/**
 * Individual form field configuration
 */
export interface FormField {
  /** Unique field identifier */
  id: string;
  
  /** Field type */
  type: FormFieldType;
  
  /** Field label shown to user */
  label: string;
  
  /** Internal name for data processing */
  name: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Help text or description */
  helpText?: string;
  
  /** Whether field is required */
  required: boolean;
  
  /** Default value */
  defaultValue?: any;
  
  /** Field-specific options */
  options?: FormFieldOptions;
  
  /** Validation rules */
  validation: FieldValidation;
  
  /** Conditional logic */
  conditionalLogic?: ConditionalLogic;
  
  /** Field styling */
  styling?: FieldStyling;
  
  /** Integration mappings */
  integrationMappings?: IntegrationMapping[];
  
  /** Field metadata */
  metadata: FieldMetadata;
}

/**
 * Form-level settings
 */
export interface FormSettings {
  /** Form submission method */
  method: 'POST' | 'GET' | 'PUT';
  
  /** Form action URL */
  action?: string;
  
  /** Submit button configuration */
  submitButton: SubmitButtonConfig;
  
  /** What happens after successful submission */
  successAction: SuccessAction;
  
  /** Error handling configuration */
  errorHandling: ErrorHandling;
  
  /** Security settings */
  security: SecuritySettings;
  
  /** Performance settings */
  performance: PerformanceSettings;
  
  /** Accessibility settings */
  accessibility: AccessibilitySettings;
}

/**
 * Submit button configuration
 */
export interface SubmitButtonConfig {
  /** Button text */
  text: string;
  
  /** Button style variant */
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  
  /** Button size */
  size: 'small' | 'medium' | 'large';
  
  /** Loading text during submission */
  loadingText: string;
  
  /** Success text after submission */
  successText?: string;
  
  /** Whether to disable after submission */
  disableAfterSubmit: boolean;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Icon to display */
  icon?: string;
}

/**
 * Post-submission actions
 */
export interface SuccessAction {
  /** Type of action to take */
  type: 'message' | 'redirect' | 'download' | 'modal' | 'custom';
  
  /** Success message to display */
  message?: string;
  
  /** URL to redirect to */
  redirectUrl?: string;
  
  /** File to download */
  downloadUrl?: string;
  
  /** Modal content to show */
  modalContent?: ModalContent;
  
  /** Custom JavaScript function */
  customFunction?: string;
  
  /** Delay before action (in seconds) */
  delay?: number;
}

/**
 * Modal content for success action
 */
export interface ModalContent {
  /** Modal title */
  title: string;
  
  /** Modal body content */
  content: string;
  
  /** Modal actions/buttons */
  actions: ModalAction[];
  
  /** Whether modal can be closed by clicking outside */
  closable: boolean;
}

/**
 * Modal action/button
 */
export interface ModalAction {
  /** Button text */
  text: string;
  
  /** Button action */
  action: 'close' | 'redirect' | 'download' | 'custom';
  
  /** Action target (URL, function name, etc.) */
  target?: string;
  
  /** Button style */
  style: 'primary' | 'secondary' | 'danger' | 'ghost';
}

/**
 * Error handling configuration
 */
export interface ErrorHandling {
  /** How to display validation errors */
  errorDisplay: 'inline' | 'summary' | 'toast' | 'modal';
  
  /** Custom error messages */
  customMessages: Record<string, string>;
  
  /** Whether to show field-level errors */
  showFieldErrors: boolean;
  
  /** Whether to show form-level errors */
  showFormErrors: boolean;
  
  /** Error retry configuration */
  retryConfig?: RetryConfig;
}

/**
 * Retry configuration for failed submissions
 */
export interface RetryConfig {
  /** Enable automatic retry */
  enabled: boolean;
  
  /** Maximum retry attempts */
  maxAttempts: number;
  
  /** Delay between retries (seconds) */
  retryDelay: number;
  
  /** Exponential backoff multiplier */
  backoffMultiplier: number;
}

/**
 * Security settings
 */
export interface SecuritySettings {
  /** Enable CSRF protection */
  csrf: boolean;
  
  /** Enable reCAPTCHA */
  recaptcha?: RecaptchaConfig;
  
  /** Rate limiting */
  rateLimit?: RateLimitConfig;
  
  /** Spam protection */
  spamProtection: SpamProtectionConfig;
  
  /** Data encryption */
  encryption?: EncryptionConfig;
}

/**
 * reCAPTCHA configuration
 */
export interface RecaptchaConfig {
  /** reCAPTCHA site key */
  siteKey: string;
  
  /** reCAPTCHA version */
  version: 'v2' | 'v3';
  
  /** Score threshold for v3 */
  scoreThreshold?: number;
  
  /** Theme */
  theme: 'light' | 'dark';
  
  /** Size */
  size: 'normal' | 'compact';
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  /** Submissions per minute per IP */
  submissionsPerMinute: number;
  
  /** Submissions per hour per IP */
  submissionsPerHour: number;
  
  /** Block duration for rate limit violations */
  blockDuration: number;
}

/**
 * Spam protection configuration
 */
export interface SpamProtectionConfig {
  /** Enable honeypot fields */
  honeypot: boolean;
  
  /** Time-based validation (minimum time to fill form) */
  minimumFillTime?: number;
  
  /** Maximum time to fill form */
  maximumFillTime?: number;
  
  /** IP-based blocking */
  ipBlocking?: IPBlockingConfig;
  
  /** Content-based spam detection */
  contentFiltering?: ContentFilteringConfig;
}

/**
 * IP blocking configuration
 */
export interface IPBlockingConfig {
  /** Enable IP blocking */
  enabled: boolean;
  
  /** Blocked IP addresses */
  blockedIPs: string[];
  
  /** Blocked IP ranges */
  blockedRanges: string[];
  
  /** Country-based blocking */
  blockedCountries?: string[];
}

/**
 * Content filtering configuration
 */
export interface ContentFilteringConfig {
  /** Enable content filtering */
  enabled: boolean;
  
  /** Blocked keywords */
  blockedKeywords: string[];
  
  /** Blocked patterns (regex) */
  blockedPatterns: string[];
  
  /** Spam detection threshold */
  spamThreshold: number;
}

/**
 * Encryption configuration
 */
export interface EncryptionConfig {
  /** Enable field-level encryption */
  enabled: boolean;
  
  /** Fields to encrypt */
  encryptedFields: string[];
  
  /** Encryption algorithm */
  algorithm: string;
  
  /** Key management */
  keyManagement: 'auto' | 'manual';
}

/**
 * Performance settings
 */
export interface PerformanceSettings {
  /** Enable client-side validation */
  clientValidation: boolean;
  
  /** Debounce validation (milliseconds) */
  validationDebounce: number;
  
  /** Enable auto-save draft */
  autoSave?: AutoSaveConfig;
  
  /** Enable progressive enhancement */
  progressiveEnhancement: boolean;
  
  /** Lazy load configuration */
  lazyLoad?: LazyLoadConfig;
}

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Enable auto-save */
  enabled: boolean;
  
  /** Save interval (seconds) */
  interval: number;
  
  /** Fields to exclude from auto-save */
  excludeFields: string[];
  
  /** Storage method */
  storage: 'localStorage' | 'sessionStorage' | 'server';
}

/**
 * Lazy loading configuration
 */
export interface LazyLoadConfig {
  /** Enable lazy loading */
  enabled: boolean;
  
  /** Fields to lazy load */
  lazyFields: string[];
  
  /** Load trigger */
  trigger: 'viewport' | 'interaction' | 'timer';
  
  /** Load delay (milliseconds) */
  delay?: number;
}

/**
 * Accessibility settings
 */
export interface AccessibilitySettings {
  /** ARIA label strategy */
  ariaLabels: 'auto' | 'manual' | 'disabled';
  
  /** Keyboard navigation */
  keyboardNavigation: boolean;
  
  /** Screen reader optimization */
  screenReader: boolean;
  
  /** High contrast mode support */
  highContrast: boolean;
  
  /** Focus management */
  focusManagement: FocusManagementConfig;
}

/**
 * Focus management configuration
 */
export interface FocusManagementConfig {
  /** Focus trap in modal forms */
  trapFocus: boolean;
  
  /** Auto-focus first field */
  autoFocusFirst: boolean;
  
  /** Focus on error fields */
  focusOnError: boolean;
  
  /** Custom focus order */
  customOrder?: string[];
}

/**
 * ===== FIELD-SPECIFIC OPTIONS =====
 */

/**
 * Options specific to field types
 */
export interface FormFieldOptions {
  /** Select/Radio/Checkbox options */
  selectOptions?: SelectOption[];
  
  /** File upload options */
  fileOptions?: FileUploadOptions;
  
  /** Number input options */
  numberOptions?: NumberInputOptions;
  
  /** Date/Time options */
  dateTimeOptions?: DateTimeOptions;
  
  /** Text input options */
  textOptions?: TextInputOptions;
  
  /** Custom field options */
  customOptions?: Record<string, any>;
}

/**
 * Options for select, radio, and checkbox fields
 */
export interface SelectOption {
  /** Option value */
  value: string;
  
  /** Option label */
  label: string;
  
  /** Whether option is disabled */
  disabled?: boolean;
  
  /** Option group (for grouped selects) */
  group?: string;
  
  /** Additional data */
  data?: Record<string, any>;
}

/**
 * File upload options
 */
export interface FileUploadOptions {
  /** Accepted file types */
  acceptedTypes: string[];
  
  /** Maximum file size (bytes) */
  maxSize: number;
  
  /** Maximum number of files */
  maxFiles: number;
  
  /** Upload endpoint */
  uploadEndpoint: string;
  
  /** Preview configuration */
  preview?: FilePreviewConfig;
  
  /** Progress tracking */
  progressTracking: boolean;
  
  /** Drag and drop */
  dragAndDrop: boolean;
}

/**
 * File preview configuration
 */
export interface FilePreviewConfig {
  /** Enable preview */
  enabled: boolean;
  
  /** Preview types */
  previewTypes: ('image' | 'video' | 'audio' | 'document')[];
  
  /** Preview size */
  size: 'thumbnail' | 'small' | 'medium' | 'large';
  
  /** Show file information */
  showFileInfo: boolean;
}

/**
 * Number input options
 */
export interface NumberInputOptions {
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Step increment */
  step?: number;
  
  /** Number format */
  format?: 'integer' | 'decimal' | 'currency' | 'percentage';
  
  /** Currency code (for currency format) */
  currency?: string;
  
  /** Decimal places */
  decimalPlaces?: number;
  
  /** Show increment/decrement buttons */
  showSpinButtons: boolean;
}

/**
 * Date and time input options
 */
export interface DateTimeOptions {
  /** Date format */
  dateFormat: string;
  
  /** Time format */
  timeFormat?: string;
  
  /** Minimum date */
  minDate?: Date;
  
  /** Maximum date */
  maxDate?: Date;
  
  /** Disabled dates */
  disabledDates?: Date[];
  
  /** First day of week (0-6, Sunday-Saturday) */
  firstDayOfWeek?: number;
  
  /** Show week numbers */
  showWeekNumbers?: boolean;
  
  /** Time picker options */
  timePicker?: TimePickerOptions;
}

/**
 * Time picker specific options
 */
export interface TimePickerOptions {
  /** Time step in minutes */
  step: number;
  
  /** 12 or 24 hour format */
  format: 12 | 24;
  
  /** Show seconds */
  showSeconds: boolean;
  
  /** Default time */
  defaultTime?: string;
}

/**
 * Text input options
 */
export interface TextInputOptions {
  /** Auto-complete attribute */
  autoComplete?: string;
  
  /** Input mode for mobile keyboards */
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  
  /** Character counter */
  characterCounter?: CharacterCounterConfig;
  
  /** Auto-resize for textarea */
  autoResize?: boolean;
  
  /** Rich text editing */
  richText?: RichTextConfig;
}

/**
 * Character counter configuration
 */
export interface CharacterCounterConfig {
  /** Show character counter */
  enabled: boolean;
  
  /** Counter position */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  
  /** Show remaining vs used characters */
  showRemaining: boolean;
  
  /** Warning threshold (percentage) */
  warningThreshold?: number;
}

/**
 * Rich text editor configuration
 */
export interface RichTextConfig {
  /** Enable rich text editing */
  enabled: boolean;
  
  /** Available formatting options */
  toolbar: RichTextTool[];
  
  /** Maximum content length */
  maxLength?: number;
  
  /** Allowed HTML tags */
  allowedTags?: string[];
  
  /** Link options */
  linkOptions?: LinkOptions;
}

/**
 * Rich text toolbar options
 */
export type RichTextTool = 
  | 'bold' | 'italic' | 'underline' | 'strikethrough'
  | 'heading1' | 'heading2' | 'heading3'
  | 'paragraph' | 'blockquote'
  | 'bulletList' | 'orderedList'
  | 'link' | 'image'
  | 'undo' | 'redo'
  | 'code' | 'codeBlock'
  | 'table' | 'horizontalRule';

/**
 * Link options for rich text
 */
export interface LinkOptions {
  /** Allow external links */
  allowExternal: boolean;
  
  /** Require link validation */
  validateLinks: boolean;
  
  /** Default link target */
  defaultTarget: '_blank' | '_self' | '_parent' | '_top';
  
  /** Link preview */
  showPreview: boolean;
}

/**
 * ===== VALIDATION =====
 */

/**
 * Field-level validation rules
 */
export interface FieldValidation {
  /** Required field validation */
  required?: RequiredValidation;
  
  /** Length validation */
  length?: LengthValidation;
  
  /** Pattern validation (regex) */
  pattern?: PatternValidation;
  
  /** Email validation */
  email?: EmailValidation;
  
  /** Phone validation */
  phone?: PhoneValidation;
  
  /** URL validation */
  url?: URLValidation;
  
  /** Number validation */
  number?: NumberValidation;
  
  /** Date validation */
  date?: DateValidation;
  
  /** File validation */
  file?: FileValidation;
  
  /** Custom validation functions */
  custom?: CustomValidation[];
  
  /** Cross-field validation */
  crossField?: CrossFieldValidation[];
}

/**
 * Required field validation
 */
export interface RequiredValidation {
  /** Is field required */
  enabled: boolean;
  
  /** Custom error message */
  message?: string;
  
  /** Conditional requirement */
  condition?: ValidationCondition;
}

/**
 * Length validation rules
 */
export interface LengthValidation {
  /** Minimum length */
  min?: number;
  
  /** Maximum length */
  max?: number;
  
  /** Exact length */
  exact?: number;
  
  /** Custom error messages */
  messages?: {
    min?: string;
    max?: string;
    exact?: string;
  };
}

/**
 * Pattern validation (regex)
 */
export interface PatternValidation {
  /** Regular expression pattern */
  pattern: string;
  
  /** Pattern flags */
  flags?: string;
  
  /** Custom error message */
  message?: string;
  
  /** Pattern description for user */
  description?: string;
}

/**
 * Email validation
 */
export interface EmailValidation {
  /** Enable email validation */
  enabled: boolean;
  
  /** Allow multiple emails (comma-separated) */
  allowMultiple?: boolean;
  
  /** Domain whitelist */
  allowedDomains?: string[];
  
  /** Domain blacklist */
  blockedDomains?: string[];
  
  /** Custom error message */
  message?: string;
}

/**
 * Phone validation
 */
export interface PhoneValidation {
  /** Enable phone validation */
  enabled: boolean;
  
  /** Country code requirement */
  requireCountryCode?: boolean;
  
  /** Allowed country codes */
  allowedCountries?: string[];
  
  /** Phone format */
  format?: 'national' | 'international' | 'e164';
  
  /** Custom error message */
  message?: string;
}

/**
 * URL validation
 */
export interface URLValidation {
  /** Enable URL validation */
  enabled: boolean;
  
  /** Allowed protocols */
  allowedProtocols?: string[];
  
  /** Require valid domain */
  requireValidDomain?: boolean;
  
  /** Allow local URLs */
  allowLocal?: boolean;
  
  /** Custom error message */
  message?: string;
}

/**
 * Number validation
 */
export interface NumberValidation {
  /** Minimum value */
  min?: number;
  
  /** Maximum value */
  max?: number;
  
  /** Must be integer */
  integer?: boolean;
  
  /** Must be positive */
  positive?: boolean;
  
  /** Custom error messages */
  messages?: {
    min?: string;
    max?: string;
    integer?: string;
    positive?: string;
  };
}

/**
 * Date validation
 */
export interface DateValidation {
  /** Minimum date */
  min?: Date;
  
  /** Maximum date */
  max?: Date;
  
  /** Allowed date ranges */
  allowedRanges?: DateRange[];
  
  /** Blocked dates */
  blockedDates?: Date[];
  
  /** Custom error messages */
  messages?: {
    min?: string;
    max?: string;
    blocked?: string;
  };
}

/**
 * Date range for validation
 */
export interface DateRange {
  /** Range start date */
  start: Date;
  
  /** Range end date */
  end: Date;
  
  /** Range description */
  description?: string;
}

/**
 * File validation
 */
export interface FileValidation {
  /** Maximum file size (bytes) */
  maxSize?: number;
  
  /** Minimum file size (bytes) */
  minSize?: number;
  
  /** Allowed file types */
  allowedTypes?: string[];
  
  /** Blocked file types */
  blockedTypes?: string[];
  
  /** Maximum number of files */
  maxFiles?: number;
  
  /** Image-specific validation */
  imageValidation?: ImageValidation;
  
  /** Custom error messages */
  messages?: {
    maxSize?: string;
    minSize?: string;
    type?: string;
    maxFiles?: string;
  };
}

/**
 * Image-specific validation
 */
export interface ImageValidation {
  /** Maximum width (pixels) */
  maxWidth?: number;
  
  /** Maximum height (pixels) */
  maxHeight?: number;
  
  /** Minimum width (pixels) */
  minWidth?: number;
  
  /** Minimum height (pixels) */
  minHeight?: number;
  
  /** Allowed aspect ratios */
  aspectRatios?: AspectRatio[];
  
  /** Custom error messages */
  messages?: {
    dimensions?: string;
    aspectRatio?: string;
  };
}

/**
 * Aspect ratio specification
 */
export interface AspectRatio {
  /** Width ratio */
  width: number;
  
  /** Height ratio */
  height: number;
  
  /** Tolerance (percentage) */
  tolerance?: number;
}

/**
 * Custom validation function
 */
export interface CustomValidation {
  /** Validation function name */
  functionName: string;
  
  /** Validation parameters */
  parameters?: Record<string, any>;
  
  /** Custom error message */
  message?: string;
  
  /** Validation trigger */
  trigger: 'change' | 'blur' | 'submit';
  
  /** Async validation */
  async?: boolean;
}

/**
 * Cross-field validation
 */
export interface CrossFieldValidation {
  /** Type of cross-field validation */
  type: 'match' | 'different' | 'conditional' | 'custom';
  
  /** Target field(s) */
  targetFields: string[];
  
  /** Validation condition */
  condition?: ValidationCondition;
  
  /** Custom validation function */
  customFunction?: string;
  
  /** Error message */
  message: string;
}

/**
 * Validation condition
 */
export interface ValidationCondition {
  /** Field to check */
  field: string;
  
  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex';
  
  /** Value to compare against */
  value: any;
  
  /** Logical operator for multiple conditions */
  logic?: 'and' | 'or';
  
  /** Additional conditions */
  conditions?: ValidationCondition[];
}

/**
 * Global form validation
 */
export interface GlobalValidation {
  /** Cross-field validations */
  crossField: CrossFieldValidation[];
  
  /** Form-level custom validations */
  custom: CustomValidation[];
  
  /** Validation timing */
  timing: ValidationTiming;
  
  /** Error aggregation */
  errorAggregation: ErrorAggregation;
}

/**
 * Validation timing configuration
 */
export interface ValidationTiming {
  /** Validate on field change */
  onChange: boolean;
  
  /** Validate on field blur */
  onBlur: boolean;
  
  /** Validate on form submit */
  onSubmit: boolean;
  
  /** Debounce delay for onChange (milliseconds) */
  debounceDelay: number;
  
  /** Re-validate on fix */
  revalidateOnFix: boolean;
}

/**
 * Error aggregation settings
 */
export interface ErrorAggregation {
  /** Show all errors or stop at first */
  showAll: boolean;
  
  /** Group errors by type */
  groupByType: boolean;
  
  /** Error priority ordering */
  priority: string[];
  
  /** Maximum errors to display */
  maxErrors?: number;
}

/**
 * ===== CONDITIONAL LOGIC =====
 */

/**
 * Conditional logic for fields
 */
export interface ConditionalLogic {
  /** Show/hide conditions */
  visibility?: VisibilityCondition[];
  
  /** Enable/disable conditions */
  enabled?: EnabledCondition[];
  
  /** Required/optional conditions */
  required?: RequiredCondition[];
  
  /** Value setting conditions */
  setValue?: SetValueCondition[];
}

/**
 * Visibility condition
 */
export interface VisibilityCondition {
  /** Condition to evaluate */
  condition: ValidationCondition;
  
  /** Show or hide when condition is met */
  action: 'show' | 'hide';
  
  /** Animation for show/hide */
  animation?: 'none' | 'fade' | 'slide' | 'scale';
}

/**
 * Enabled/disabled condition
 */
export interface EnabledCondition {
  /** Condition to evaluate */
  condition: ValidationCondition;
  
  /** Enable or disable when condition is met */
  action: 'enable' | 'disable';
}

/**
 * Required condition
 */
export interface RequiredCondition {
  /** Condition to evaluate */
  condition: ValidationCondition;
  
  /** Make required or optional when condition is met */
  action: 'require' | 'optional';
}

/**
 * Set value condition
 */
export interface SetValueCondition {
  /** Condition to evaluate */
  condition: ValidationCondition;
  
  /** Value to set when condition is met */
  value: any;
  
  /** Whether to trigger validation after setting value */
  triggerValidation: boolean;
}

/**
 * ===== INTEGRATIONS =====
 */

/**
 * Form integration configuration
 */
export interface FormIntegration {
  /** Integration type */
  type: FormIntegrationType;
  
  /** Integration name */
  name: string;
  
  /** Whether integration is enabled */
  enabled: boolean;
  
  /** Integration-specific configuration */
  config: IntegrationConfig;
  
  /** Field mappings */
  fieldMappings: IntegrationMapping[];
  
  /** Error handling */
  errorHandling: IntegrationErrorHandling;
  
  /** Success actions */
  successActions: IntegrationSuccessAction[];
}

/**
 * Supported integration types
 */
export type FormIntegrationType = 
  | 'email'           // Email service (SendGrid, Mailgun, etc.)
  | 'crm'            // CRM system (HubSpot, Salesforce, etc.)
  | 'marketing'      // Marketing automation (Mailchimp, ConvertKit, etc.)
  | 'analytics'      // Analytics (Google Analytics, Mixpanel, etc.)
  | 'webhook'        // Custom webhook
  | 'database'       // Direct database integration
  | 'spreadsheet'    // Google Sheets, Airtable, etc.
  | 'payment'        // Payment processing (Stripe, PayPal, etc.)
  | 'notification'   // Slack, Discord, etc.
  | 'storage'        // File storage (AWS S3, Google Cloud, etc.)
  | 'custom';        // Custom integration

/**
 * Integration configuration (varies by type)
 */
export interface IntegrationConfig {
  /** API endpoint */
  endpoint?: string;
  
  /** API key or token */
  apiKey?: string;
  
  /** Authentication method */
  authMethod?: 'api_key' | 'oauth' | 'basic' | 'bearer';
  
  /** Additional headers */
  headers?: Record<string, string>;
  
  /** Request method */
  method?: 'POST' | 'PUT' | 'PATCH';
  
  /** Request format */
  format?: 'json' | 'form' | 'xml';
  
  /** Integration-specific settings */
  settings?: Record<string, any>;
}

/**
 * Field mapping for integrations
 */
export interface IntegrationMapping {
  /** Local field name */
  localField: string;
  
  /** Remote field name */
  remoteField: string;
  
  /** Data transformation */
  transform?: DataTransform;
  
  /** Whether field is required by integration */
  required: boolean;
  
  /** Default value if local field is empty */
  defaultValue?: any;
}

/**
 * Data transformation for field mapping
 */
export interface DataTransform {
  /** Transformation type */
  type: 'format' | 'lookup' | 'calculate' | 'custom';
  
  /** Transformation parameters */
  parameters?: Record<string, any>;
  
  /** Custom transformation function */
  customFunction?: string;
}

/**
 * Integration error handling
 */
export interface IntegrationErrorHandling {
  /** What to do on integration failure */
  onFailure: 'block' | 'warn' | 'silent';
  
  /** Retry configuration */
  retry?: RetryConfig;
  
  /** Fallback actions */
  fallback?: FallbackAction[];
  
  /** Error notification */
  notification?: ErrorNotification;
}

/**
 * Fallback action for integration failures
 */
export interface FallbackAction {
  /** Fallback type */
  type: 'email' | 'log' | 'webhook' | 'custom';
  
  /** Fallback configuration */
  config: Record<string, any>;
  
  /** When to trigger fallback */
  trigger: 'immediate' | 'after_retry' | 'manual';
}

/**
 * Error notification configuration
 */
export interface ErrorNotification {
  /** Enable error notifications */
  enabled: boolean;
  
  /** Notification methods */
  methods: ('email' | 'sms' | 'webhook' | 'slack')[];
  
  /** Notification recipients */
  recipients: string[];
  
  /** Notification template */
  template?: string;
}

/**
 * Integration success action
 */
export interface IntegrationSuccessAction {
  /** Action type */
  type: 'email' | 'redirect' | 'webhook' | 'custom';
  
  /** Action configuration */
  config: Record<string, any>;
  
  /** Action delay (seconds) */
  delay?: number;
  
  /** Conditional action */
  condition?: ValidationCondition;
}

/**
 * ===== STYLING AND LAYOUT =====
 */

/**
 * Form styling configuration
 */
export interface FormStyling {
  /** Layout type */
  layout: FormLayout;
  
  /** Color scheme */
  colorScheme: FormColorScheme;
  
  /** Typography */
  typography: FormTypography;
  
  /** Spacing */
  spacing: FormSpacing;
  
  /** Custom CSS */
  customCSS?: string;
  
  /** Responsive settings */
  responsive: ResponsiveSettings;
}

/**
 * Form layout configuration
 */
export interface FormLayout {
  /** Overall layout type */
  type: 'single-column' | 'two-column' | 'grid' | 'custom';
  
  /** Grid configuration (for grid layout) */
  grid?: GridConfig;
  
  /** Field grouping */
  groups?: FieldGroup[];
  
  /** Step configuration (for multi-step forms) */
  steps?: FormStep[];
}

/**
 * Grid layout configuration
 */
export interface GridConfig {
  /** Number of columns */
  columns: number;
  
  /** Column width distribution */
  columnWidths?: string[];
  
  /** Gap between columns */
  columnGap: string;
  
  /** Gap between rows */
  rowGap: string;
  
  /** Responsive breakpoints */
  breakpoints?: GridBreakpoint[];
}

/**
 * Grid responsive breakpoint
 */
export interface GridBreakpoint {
  /** Breakpoint size */
  size: 'sm' | 'md' | 'lg' | 'xl';
  
  /** Columns at this breakpoint */
  columns: number;
  
  /** Column widths at this breakpoint */
  columnWidths?: string[];
}

/**
 * Field group for layout
 */
export interface FieldGroup {
  /** Group identifier */
  id: string;
  
  /** Group title */
  title?: string;
  
  /** Group description */
  description?: string;
  
  /** Fields in this group */
  fields: string[];
  
  /** Group styling */
  styling?: GroupStyling;
  
  /** Collapsible group */
  collapsible?: boolean;
  
  /** Initially collapsed */
  collapsed?: boolean;
}

/**
 * Group styling
 */
export interface GroupStyling {
  /** Background color */
  backgroundColor?: string;
  
  /** Border */
  border?: string;
  
  /** Border radius */
  borderRadius?: string;
  
  /** Padding */
  padding?: string;
  
  /** Margin */
  margin?: string;
}

/**
 * Form step for multi-step forms
 */
export interface FormStep {
  /** Step identifier */
  id: string;
  
  /** Step title */
  title: string;
  
  /** Step description */
  description?: string;
  
  /** Fields in this step */
  fields: string[];
  
  /** Step validation */
  validation?: StepValidation;
  
  /** Step navigation */
  navigation?: StepNavigation;
}

/**
 * Step validation configuration
 */
export interface StepValidation {
  /** Validate step before proceeding */
  validateOnNext: boolean;
  
  /** Allow skipping step */
  allowSkip: boolean;
  
  /** Required completion percentage */
  requiredCompletion?: number;
}

/**
 * Step navigation configuration
 */
export interface StepNavigation {
  /** Show previous button */
  showPrevious: boolean;
  
  /** Show next button */
  showNext: boolean;
  
  /** Show step indicator */
  showIndicator: boolean;
  
  /** Allow jumping to steps */
  allowJumping: boolean;
  
  /** Button labels */
  buttonLabels?: {
    previous?: string;
    next?: string;
    submit?: string;
  };
}

/**
 * Form color scheme
 */
export interface FormColorScheme {
  /** Primary color */
  primary: string;
  
  /** Secondary color */
  secondary: string;
  
  /** Background color */
  background: string;
  
  /** Text color */
  text: string;
  
  /** Error color */
  error: string;
  
  /** Success color */
  success: string;
  
  /** Warning color */
  warning: string;
  
  /** Border color */
  border: string;
  
  /** Focus color */
  focus: string;
}

/**
 * Form typography
 */
export interface FormTypography {
  /** Font family */
  fontFamily: string;
  
  /** Base font size */
  fontSize: string;
  
  /** Line height */
  lineHeight: string;
  
  /** Font weights */
  fontWeights: {
    normal: number;
    medium: number;
    bold: number;
  };
  
  /** Label styling */
  label: TypographyStyle;
  
  /** Input styling */
  input: TypographyStyle;
  
  /** Help text styling */
  helpText: TypographyStyle;
  
  /** Error text styling */
  errorText: TypographyStyle;
}

/**
 * Typography style definition
 */
export interface TypographyStyle {
  /** Font size */
  fontSize: string;
  
  /** Font weight */
  fontWeight: number;
  
  /** Line height */
  lineHeight: string;
  
  /** Letter spacing */
  letterSpacing?: string;
  
  /** Text transform */
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

/**
 * Form spacing configuration
 */
export interface FormSpacing {
  /** Space between fields */
  fieldSpacing: string;
  
  /** Space between groups */
  groupSpacing: string;
  
  /** Form padding */
  formPadding: string;
  
  /** Input padding */
  inputPadding: string;
  
  /** Label margin */
  labelMargin: string;
  
  /** Help text margin */
  helpTextMargin: string;
}

/**
 * Field-specific styling
 */
export interface FieldStyling {
  /** Field width */
  width?: string;
  
  /** Custom CSS classes */
  className?: string;
  
  /** Inline styles */
  style?: Record<string, string>;
  
  /** Label styling */
  label?: FieldElementStyling;
  
  /** Input styling */
  input?: FieldElementStyling;
  
  /** Help text styling */
  helpText?: FieldElementStyling;
  
  /** Error text styling */
  errorText?: FieldElementStyling;
}

/**
 * Field element styling
 */
export interface FieldElementStyling {
  /** CSS classes */
  className?: string;
  
  /** Inline styles */
  style?: Record<string, string>;
  
  /** Hide element */
  hidden?: boolean;
}

/**
 * Responsive settings
 */
export interface ResponsiveSettings {
  /** Breakpoints */
  breakpoints: Record<string, string>;
  
  /** Mobile-specific settings */
  mobile?: MobileSettings;
  
  /** Tablet-specific settings */
  tablet?: TabletSettings;
  
  /** Desktop-specific settings */
  desktop?: DesktopSettings;
}

/**
 * Mobile-specific settings
 */
export interface MobileSettings {
  /** Single column layout */
  singleColumn: boolean;
  
  /** Larger touch targets */
  largeTouchTargets: boolean;
  
  /** Mobile keyboard optimization */
  keyboardOptimization: boolean;
  
  /** Simplified navigation */
  simplifiedNavigation: boolean;
}

/**
 * Tablet-specific settings
 */
export interface TabletSettings {
  /** Column layout */
  columns: number;
  
  /** Touch-friendly spacing */
  touchSpacing: boolean;
  
  /** Optimized button sizes */
  optimizedButtons: boolean;
}

/**
 * Desktop-specific settings
 */
export interface DesktopSettings {
  /** Maximum form width */
  maxWidth: string;
  
  /** Enhanced hover states */
  enhancedHover: boolean;
  
  /** Keyboard shortcuts */
  keyboardShortcuts: boolean;
}

/**
 * ===== TRACKING AND ANALYTICS =====
 */

/**
 * Form tracking configuration
 */
export interface FormTracking {
  /** Enable form analytics */
  enabled: boolean;
  
  /** Events to track */
  events: FormEvent[];
  
  /** Analytics integrations */
  integrations: AnalyticsIntegration[];
  
  /** Conversion goals */
  goals: ConversionGoal[];
  
  /** Privacy settings */
  privacy: TrackingPrivacy;
}

/**
 * Form events to track
 */
export interface FormEvent {
  /** Event type */
  type: 'view' | 'start' | 'progress' | 'complete' | 'abandon' | 'error' | 'field_focus' | 'field_blur' | 'field_change';
  
  /** Event name */
  name: string;
  
  /** Additional event data */
  data?: Record<string, any>;
  
  /** Event conditions */
  conditions?: EventCondition[];
}

/**
 * Event condition
 */
export interface EventCondition {
  /** Condition type */
  type: 'field_value' | 'step' | 'time' | 'custom';
  
  /** Condition parameters */
  parameters: Record<string, any>;
}

/**
 * Analytics integration
 */
export interface AnalyticsIntegration {
  /** Integration type */
  type: 'google_analytics' | 'mixpanel' | 'amplitude' | 'custom';
  
  /** Integration configuration */
  config: Record<string, any>;
  
  /** Event mapping */
  eventMapping: Record<string, string>;
}

/**
 * Conversion goal
 */
export interface ConversionGoal {
  /** Goal name */
  name: string;
  
  /** Goal description */
  description: string;
  
  /** Goal type */
  type: 'completion' | 'engagement' | 'quality' | 'custom';
  
  /** Goal conditions */
  conditions: GoalCondition[];
  
  /** Goal value */
  value?: number;
}

/**
 * Goal condition
 */
export interface GoalCondition {
  /** Condition type */
  type: 'form_complete' | 'time_spent' | 'field_completion' | 'custom';
  
  /** Condition parameters */
  parameters: Record<string, any>;
}

/**
 * Tracking privacy settings
 */
export interface TrackingPrivacy {
  /** Anonymize IP addresses */
  anonymizeIP: boolean;
  
  /** Cookie consent requirement */
  cookieConsent: boolean;
  
  /** Data retention period (days) */
  retentionPeriod: number;
  
  /** GDPR compliance */
  gdprCompliant: boolean;
  
  /** PII handling */
  piiHandling: PIIHandling;
}

/**
 * PII handling configuration
 */
export interface PIIHandling {
  /** Encrypt PII */
  encrypt: boolean;
  
  /** Hash PII */
  hash: boolean;
  
  /** Exclude PII from tracking */
  exclude: boolean;
  
  /** PII fields */
  piiFields: string[];
}

/**
 * ===== A/B TESTING =====
 */

/**
 * Form A/B testing configuration
 */
export interface FormTesting {
  /** Enable A/B testing */
  enabled: boolean;
  
  /** Test variants */
  variants: FormVariant[];
  
  /** Traffic allocation */
  trafficAllocation: TrafficAllocation;
  
  /** Test goals */
  goals: TestGoal[];
  
  /** Test duration */
  duration?: TestDuration;
}

/**
 * Form variant for A/B testing
 */
export interface FormVariant {
  /** Variant identifier */
  id: string;
  
  /** Variant name */
  name: string;
  
  /** Variant description */
  description: string;
  
  /** Form configuration for this variant */
  formConfig: Partial<FormData>;
  
  /** Variant weight (for traffic allocation) */
  weight: number;
}

/**
 * Traffic allocation for A/B testing
 */
export interface TrafficAllocation {
  /** Allocation method */
  method: 'equal' | 'weighted' | 'custom';
  
  /** Custom allocation percentages */
  customAllocation?: Record<string, number>;
  
  /** Minimum sample size per variant */
  minSampleSize?: number;
  
  /** User assignment method */
  assignmentMethod: 'random' | 'hash' | 'cookie';
}

/**
 * Test goal for A/B testing
 */
export interface TestGoal {
  /** Goal identifier */
  id: string;
  
  /** Goal name */
  name: string;
  
  /** Goal type */
  type: 'conversion' | 'engagement' | 'completion_rate' | 'time_to_complete' | 'error_rate';
  
  /** Goal metric */
  metric: string;
  
  /** Target improvement */
  targetImprovement?: number;
  
  /** Statistical significance threshold */
  significanceThreshold: number;
}

/**
 * Test duration settings
 */
export interface TestDuration {
  /** Start date */
  startDate: Date;
  
  /** End date */
  endDate?: Date;
  
  /** Minimum runtime (days) */
  minRuntime: number;
  
  /** Maximum runtime (days) */
  maxRuntime?: number;
  
  /** Auto-stop conditions */
  autoStop?: AutoStopCondition[];
}

/**
 * Auto-stop condition for tests
 */
export interface AutoStopCondition {
  /** Condition type */
  type: 'significance_reached' | 'sample_size_reached' | 'max_runtime' | 'custom';
  
  /** Condition parameters */
  parameters: Record<string, any>;
  
  /** Action to take */
  action: 'stop_test' | 'declare_winner' | 'extend_test';
}

/**
 * ===== METADATA =====
 */

/**
 * Form metadata
 */
export interface FormMetadata {
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modification timestamp */
  updatedAt: Date;
  
  /** Form creator */
  createdBy: string;
  
  /** Last modifier */
  updatedBy: string;
  
  /** Form version */
  version: string;
  
  /** Form status */
  status: 'draft' | 'active' | 'inactive' | 'archived';
  
  /** Tags for organization */
  tags: string[];
  
  /** Form category */
  category?: string;
  
  /** Usage statistics */
  statistics?: FormStatistics;
  
  /** Form notes */
  notes?: string;
}

/**
 * Field metadata
 */
export interface FieldMetadata {
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last modification timestamp */
  updatedAt: Date;
  
  /** Field order in form */
  order: number;
  
  /** Field usage statistics */
  statistics?: FieldStatistics;
  
  /** Field notes */
  notes?: string;
}

/**
 * Form usage statistics
 */
export interface FormStatistics {
  /** Total views */
  views: number;
  
  /** Total starts (first field interaction) */
  starts: number;
  
  /** Total completions */
  completions: number;
  
  /** Conversion rate */
  conversionRate: number;
  
  /** Average completion time (seconds) */
  avgCompletionTime: number;
  
  /** Drop-off points */
  dropOffPoints: DropOffPoint[];
  
  /** Error frequency */
  errorFrequency: Record<string, number>;
  
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Field usage statistics
 */
export interface FieldStatistics {
  /** Interaction count */
  interactions: number;
  
  /** Completion rate */
  completionRate: number;
  
  /** Error rate */
  errorRate: number;
  
  /** Average time spent (seconds) */
  avgTimeSpent: number;
  
  /** Skip rate */
  skipRate: number;
  
  /** Most common values */
  commonValues?: string[];
  
  /** Last updated */
  lastUpdated: Date;
}

/**
 * Drop-off point data
 */
export interface DropOffPoint {
  /** Field where drop-off occurred */
  fieldId: string;
  
  /** Drop-off rate at this point */
  dropOffRate: number;
  
  /** Number of users who dropped off */
  dropOffCount: number;
  
  /** Common reasons for drop-off */
  reasons?: string[];
}

/**
 * ===== FORM BUILDER TYPES =====
 * For edit mode form builder interface
 */

/**
 * Form builder state
 */
export interface FormBuilderState {
  /** Current form being edited */
  currentForm: FormData;
  
  /** Available field types */
  availableFields: FieldTypeDefinition[];
  
  /** Form builder mode */
  mode: 'design' | 'preview' | 'settings' | 'integrations';
  
  /** Selected field */
  selectedField?: string;
  
  /** Drag and drop state */
  dragState?: DragState;
  
  /** Undo/redo history */
  history: FormBuilderHistory;
  
  /** Validation errors */
  validationErrors: FormBuilderError[];
}

/**
 * Field type definition for form builder
 */
export interface FieldTypeDefinition {
  /** Field type */
  type: FormFieldType;
  
  /** Display name */
  name: string;
  
  /** Description */
  description: string;
  
  /** Icon */
  icon: string;
  
  /** Category */
  category: 'basic' | 'advanced' | 'layout' | 'custom';
  
  /** Default configuration */
  defaultConfig: Partial<FormField>;
  
  /** Available options */
  availableOptions: string[];
  
  /** Pro feature */
  isPro?: boolean;
}

/**
 * Drag and drop state
 */
export interface DragState {
  /** Dragging field type */
  fieldType?: FormFieldType;
  
  /** Dragging existing field */
  fieldId?: string;
  
  /** Drag source */
  source: 'palette' | 'form';
  
  /** Drop target */
  dropTarget?: DropTarget;
  
  /** Drag position */
  position: { x: number; y: number };
}

/**
 * Drop target for form builder
 */
export interface DropTarget {
  /** Target type */
  type: 'field' | 'group' | 'form';
  
  /** Target ID */
  id: string;
  
  /** Drop position */
  position: 'before' | 'after' | 'inside';
  
  /** Visual indicator */
  indicator: boolean;
}

/**
 * Form builder history for undo/redo
 */
export interface FormBuilderHistory {
  /** History entries */
  entries: FormBuilderHistoryEntry[];
  
  /** Current position in history */
  currentIndex: number;
  
  /** Maximum history size */
  maxSize: number;
}

/**
 * History entry
 */
export interface FormBuilderHistoryEntry {
  /** Action type */
  action: 'add_field' | 'remove_field' | 'edit_field' | 'reorder_fields' | 'edit_settings';
  
  /** Action description */
  description: string;
  
  /** Form state before action */
  beforeState: Partial<FormData>;
  
  /** Form state after action */
  afterState: Partial<FormData>;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * Form builder validation error
 */
export interface FormBuilderError {
  /** Error type */
  type: 'field' | 'form' | 'integration' | 'validation';
  
  /** Error code */
  code: string;
  
  /** Error message */
  message: string;
  
  /** Affected field ID */
  fieldId?: string;
  
  /** Error severity */
  severity: 'error' | 'warning' | 'info';
  
  /** Suggested fix */
  suggestion?: string;
}

/**
 * ===== FORM TEMPLATES =====
 */

/**
 * Form template definition
 */
export interface FormTemplate {
  /** Template ID */
  id: string;
  
  /** Template name */
  name: string;
  
  /** Template description */
  description: string;
  
  /** Template category */
  category: string;
  
  /** Template tags */
  tags: string[];
  
  /** Template preview image */
  previewImage?: string;
  
  /** Template form configuration */
  formConfig: FormData;
  
  /** Template metadata */
  metadata: TemplateMetadata;
  
  /** Usage statistics */
  usage?: TemplateUsage;
}

/**
 * Template metadata
 */
export interface TemplateMetadata {
  /** Template author */
  author: string;
  
  /** Creation date */
  createdAt: Date;
  
  /** Last update date */
  updatedAt: Date;
  
  /** Template version */
  version: string;
  
  /** Compatibility version */
  compatibility: string;
  
  /** Template status */
  status: 'active' | 'deprecated' | 'beta';
  
  /** Premium template */
  isPremium?: boolean;
}

/**
 * Template usage statistics
 */
export interface TemplateUsage {
  /** Times used */
  useCount: number;
  
  /** User rating */
  rating: number;
  
  /** Number of ratings */
  ratingCount: number;
  
  /** Popular with */
  popularWith: string[];
}

/**
 * ===== CONVERSION OPTIMIZATION =====
 */

/**
 * Form optimization suggestions
 */
export interface FormOptimization {
  /** Optimization type */
  type: 'reduce_fields' | 'improve_labels' | 'add_progress' | 'optimize_layout' | 'improve_validation' | 'enhance_mobile';
  
  /** Priority level */
  priority: 'high' | 'medium' | 'low';
  
  /** Optimization title */
  title: string;
  
  /** Detailed description */
  description: string;
  
  /** Expected impact */
  expectedImpact: ExpectedImpact;
  
  /** Implementation difficulty */
  difficulty: 'easy' | 'medium' | 'hard';
  
  /** Specific recommendations */
  recommendations: OptimizationRecommendation[];
}

/**
 * Expected impact of optimization
 */
export interface ExpectedImpact {
  /** Conversion rate improvement */
  conversionImprovement: string;
  
  /** Completion time improvement */
  timeImprovement?: string;
  
  /** Error reduction */
  errorReduction?: string;
  
  /** User satisfaction improvement */
  satisfactionImprovement?: string;
}

/**
 * Specific optimization recommendation
 */
export interface OptimizationRecommendation {
  /** Recommendation description */
  description: string;
  
  /** Field(s) affected */
  affectedFields?: string[];
  
  /** Specific changes to make */
  changes: OptimizationChange[];
  
  /** A/B test suggestion */
  testSuggestion?: string;
}

/**
 * Specific optimization change
 */
export interface OptimizationChange {
  /** Change type */
  type: 'add' | 'remove' | 'modify' | 'reorder';
  
  /** Target element */
  target: string;
  
  /** Change description */
  description: string;
  
  /** Before value */
  before?: any;
  
  /** After value */
  after?: any;
}

/**
 * ===== EXPORT FORMATS =====
 */

/**
 * Form export configuration
 */
export interface FormExport {
  /** Export format */
  format: 'json' | 'html' | 'react' | 'vue' | 'angular' | 'pdf' | 'csv';
  
  /** Export options */
  options: ExportOptions;
  
  /** Include data */
  includeData: boolean;
  
  /** Include styling */
  includeStyling: boolean;
  
  /** Include integrations */
  includeIntegrations: boolean;
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Minify output */
  minify?: boolean;
  
  /** Include comments */
  includeComments?: boolean;
  
  /** Framework version */
  frameworkVersion?: string;
  
  /** Custom template */
  customTemplate?: string;
  
  /** File name */
  fileName?: string;
}

/**
 * ===== COLLABORATION =====
 */

/**
 * Form collaboration settings
 */
export interface FormCollaboration {
  /** Enable collaboration */
  enabled: boolean;
  
  /** Collaborators */
  collaborators: Collaborator[];
  
  /** Permission settings */
  permissions: CollaborationPermissions;
  
  /** Real-time editing */
  realTimeEditing: boolean;
  
  /** Change tracking */
  changeTracking: ChangeTracking;
  
  /** Comments and feedback */
  comments?: FormComment[];
}

/**
 * Form collaborator
 */
export interface Collaborator {
  /** User ID */
  userId: string;
  
  /** User name */
  name: string;
  
  /** User email */
  email: string;
  
  /** Role */
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  
  /** Last active */
  lastActive?: Date;
  
  /** Current status */
  status: 'online' | 'offline' | 'away';
}

/**
 * Collaboration permissions
 */
export interface CollaborationPermissions {
  /** Who can edit */
  edit: 'owner' | 'editors' | 'all';
  
  /** Who can view */
  view: 'collaborators' | 'public' | 'organization';
  
  /** Who can comment */
  comment: 'collaborators' | 'all' | 'none';
  
  /** Who can share */
  share: 'owner' | 'editors' | 'all';
  
  /** Export permissions */
  export: 'owner' | 'editors' | 'all';
}

/**
 * Change tracking configuration
 */
export interface ChangeTracking {
  /** Enable change tracking */
  enabled: boolean;
  
  /** Track field changes */
  trackFields: boolean;
  
  /** Track setting changes */
  trackSettings: boolean;
  
  /** Track style changes */
  trackStyling: boolean;
  
  /** Change retention period (days) */
  retentionPeriod: number;
}

/**
 * Form comment
 */
export interface FormComment {
  /** Comment ID */
  id: string;
  
  /** Comment author */
  author: Collaborator;
  
  /** Comment content */
  content: string;
  
  /** Target element */
  target?: {
    type: 'field' | 'form' | 'general';
    id?: string;
  };
  
  /** Comment timestamp */
  timestamp: Date;
  
  /** Comment status */
  status: 'open' | 'resolved' | 'archived';
  
  /** Replies */
  replies?: FormCommentReply[];
}

/**
 * Comment reply
 */
export interface FormCommentReply {
  /** Reply ID */
  id: string;
  
  /** Reply author */
  author: Collaborator;
  
  /** Reply content */
  content: string;
  
  /** Reply timestamp */
  timestamp: Date;
}
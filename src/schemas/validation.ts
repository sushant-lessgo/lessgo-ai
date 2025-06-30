// schemas/validation.ts - Zod validation schemas derived from taxonomy
import { z } from 'zod';
import {
  marketCategories,
  allMarketSubcategories,
  allStartupStages,
  allTargetAudiences,
  allLandingGoalTypes,
  allPricingModels,
  allAwarenessLevels,
  allMarketSophisticationLevels,
  allToneProfiles,
  copyIntents,
  allProblemTypes,
} from '@/modules/inference/taxonomy';
import type {
  InputVariables,
  LandingPageContent,
  SectionData,
  FormData,
  ImageAsset,
  CanonicalFieldName
} from '@/types/core/index';

/**
 * ===== TAXONOMY-DERIVED SCHEMAS =====
 */

export const MarketCategorySchema = z.enum(marketCategories);
export const MarketSubcategorySchema = z.enum(allMarketSubcategories as [string, ...string[]]);
export const StartupStageSchema = z.enum(allStartupStages as [string, ...string[]]);
export const TargetAudienceSchema = z.enum(allTargetAudiences as [string, ...string[]]);
export const LandingGoalTypeSchema = z.enum(allLandingGoalTypes as [string, ...string[]]);
export const PricingModelSchema = z.enum(allPricingModels as [string, ...string[]]);
export const AwarenessLevelSchema = z.enum(allAwarenessLevels as [string, ...string[]]);
export const MarketSophisticationLevelSchema = z.enum(allMarketSophisticationLevels as [string, ...string[]]);
export const ToneProfileSchema = z.enum(allToneProfiles as [string, ...string[]]);
export const CopyIntentSchema = z.enum(copyIntents);
export const ProblemTypeSchema = z.enum(allProblemTypes as [string, ...string[]]);

/**
 * ===== CORE INPUT VALIDATION =====
 */

export const InputVariablesSchema = z.object({
  marketCategory: MarketCategorySchema,
  marketSubcategory: MarketSubcategorySchema,
  targetAudience: TargetAudienceSchema,
  keyProblem: z.string()
    .min(1, 'Key problem is required')
    .max(500, 'Problem description too long'),
  startupStage: StartupStageSchema,
  landingPageGoals: LandingGoalTypeSchema,
  pricingModel: PricingModelSchema
}).strict();

export const HiddenInferredFieldsSchema = z.object({
  awarenessLevel: AwarenessLevelSchema.optional(),
  copyIntent: CopyIntentSchema.optional(),
  toneProfile: ToneProfileSchema.optional(),
  marketSophisticationLevel: MarketSophisticationLevelSchema.optional(),
  problemType: ProblemTypeSchema.optional()
}).strict();

export const FeatureItemSchema = z.object({
  feature: z.string()
    .min(1, 'Feature name is required')
    .max(200, 'Feature name too long'),
  benefit: z.string()
    .min(1, 'Feature benefit is required')
    .max(500, 'Feature benefit too long')
}).strict();

export const FeatureItemsSchema = z.array(FeatureItemSchema)
  .min(1, 'At least one feature is required')
  .max(20, 'Too many features provided');

/**
 * ===== CONTENT VALIDATION =====
 */

export const ElementTypeSchema = z.enum([
  'text', 'richtext', 'headline', 'subheadline', 'list', 'button',
  'image', 'video', 'form', 'icon', 'number', 'url', 'email', 'phone', 'custom'
]);

export const EditModeSchema = z.enum([
  'inline', 'modal', 'sidebar', 'toolbar', 'dropdown', 'readonly'
]);

export const BackgroundTypeSchema = z.enum([
  'primary', 'secondary', 'neutral', 'divider'
]);

export const EditableElementSchema = z.object({
  content: z.union([z.string(), z.array(z.string()), z.number(), z.boolean()]),
  type: ElementTypeSchema,
  isEditable: z.boolean().default(true),
  editMode: EditModeSchema.default('inline'),
  validation: z.object({
    required: z.boolean().default(false),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    errorMessage: z.string().optional()
  }).optional(),
  defaultValue: z.union([z.string(), z.array(z.string())]).optional(),
  uiProps: z.object({
    className: z.string().optional(),
    placeholder: z.string().optional(),
    helpText: z.string().optional(),
    icon: z.string().optional()
  }).optional()
}).strict();

export const SectionDataSchema = z.object({
  id: z.string().min(1, 'Section ID is required'),
  layout: z.string().min(1, 'Layout is required'),
  elements: z.record(z.string(), EditableElementSchema),
  backgroundType: BackgroundTypeSchema.optional(),
  media: z.object({
    image: z.string().optional(),
    video: z.string().optional(),
    icon: z.string().optional(),
    alt: z.string().optional()
  }).optional(),
  cta: z.object({
    label: z.string().optional(),
    url: z.string().url('Invalid URL').optional(),
    variant: z.enum(['primary', 'secondary', 'ghost']).optional()
  }).optional(),
  aiMetadata: z.object({
    aiGenerated: z.boolean().default(false),
    lastGenerated: z.number().optional(),
    isCustomized: z.boolean().default(false),
    aiGeneratedElements: z.array(z.string()).default([]),
    originalPrompt: z.string().optional(),
    qualityScore: z.number().min(0).max(100).optional()
  }),
  editMetadata: z.object({
    isSelected: z.boolean().default(false),
    isEditing: z.boolean().default(false),
    lastModified: z.number().optional(),
    lastModifiedBy: z.string().optional(),
    isDeletable: z.boolean().default(true),
    isMovable: z.boolean().default(true),
    isDuplicable: z.boolean().default(true),
    validationStatus: z.object({
      isValid: z.boolean(),
      errors: z.array(z.object({
        elementKey: z.string(),
        code: z.string(),
        message: z.string(),
        severity: z.enum(['error', 'warning', 'info'])
      })),
      warnings: z.array(z.object({
        elementKey: z.string(),
        code: z.string(),
        message: z.string(),
        autoFixable: z.boolean(),
        suggestion: z.string().optional()
      })),
      missingRequired: z.array(z.string()),
      lastValidated: z.number()
    }),
    completionPercentage: z.number().min(0).max(100).default(0)
  })
}).strict();

export const ThemeSchema = z.object({
  typography: z.object({
    headingFont: z.string().min(1, 'Heading font is required'),
    bodyFont: z.string().min(1, 'Body font is required'),
    scale: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
    lineHeight: z.number().min(1).max(3).default(1.5),
    fontWeights: z.object({
      light: z.number().default(300),
      normal: z.number().default(400),
      medium: z.number().default(500),
      semibold: z.number().default(600),
      bold: z.number().default(700)
    })
  }),
  colors: z.object({
    baseColor: z.string().min(1, 'Base color is required'),
    accentColor: z.string().min(1, 'Accent color is required'),
    accentCSS: z.string().optional(),
    sectionBackgrounds: z.object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      neutral: z.string().optional(),
      divider: z.string().optional()
    }),
    semantic: z.object({
      success: z.string().default('#10b981'),
      warning: z.string().default('#f59e0b'),
      error: z.string().default('#ef4444'),
      info: z.string().default('#3b82f6'),
      neutral: z.string().default('#6b7280')
    })
  }),
  spacing: z.object({
    unit: z.number().min(1).max(16).default(8),
    scale: z.array(z.number()).default([0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64]),
    presets: z.object({
      xs: z.string().default('0.25rem'),
      sm: z.string().default('0.5rem'),
      md: z.string().default('1rem'),
      lg: z.string().default('1.5rem'),
      xl: z.string().default('3rem'),
      xxl: z.string().default('6rem')
    })
  }),
  corners: z.object({
    radius: z.number().min(0).max(50).default(8),
    scale: z.object({
      small: z.number().default(4),
      medium: z.number().default(8),
      large: z.number().default(16),
      full: z.number().default(9999)
    })
  })
}).strict();

export const PageMetadataSchema = z.object({
  title: z.string()
    .min(1, 'Page title is required')
    .max(70, 'Page title too long for SEO'),
  description: z.string()
    .max(160, 'Meta description too long for SEO')
    .optional(),
  keywords: z.array(z.string()).optional(),
  ogImage: z.string().url('Invalid OG image URL').optional(),
  language: z.string().default('en'),
  isPublished: z.boolean().default(false),
  publishedAt: z.date().optional(),
  slug: z.string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  canonicalUrl: z.string().url('Invalid canonical URL').optional(),
  customMeta: z.record(z.string(), z.string()).optional()
}).strict();

export const LandingPageContentSchema = z.object({
  id: z.string().min(1, 'Page ID is required'),
  token: z.string().min(1, 'Page token is required'),
  sections: z.array(z.string()).min(1, 'At least one section is required'),
  sectionLayouts: z.record(z.string(), z.string()),
  content: z.record(z.string(), SectionDataSchema),
  theme: ThemeSchema,
  metadata: PageMetadataSchema,
  createdAt: z.date(),
  updatedAt: z.date()
}).strict();

/**
 * ===== FORM VALIDATION =====
 */

export const FormFieldTypeSchema = z.enum([
  'text', 'email', 'phone', 'url', 'textarea', 'number', 'select',
  'multiselect', 'radio', 'checkbox', 'checkboxgroup', 'file',
  'date', 'time', 'datetime', 'range', 'hidden', 'custom'
]);

export const FormFieldValidationSchema = z.object({
  required: z.object({
    enabled: z.boolean(),
    message: z.string().optional()
  }).optional(),
  length: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(1).optional(),
    exact: z.number().min(0).optional()
  }).optional(),
  pattern: z.object({
    pattern: z.string(),
    flags: z.string().optional(),
    message: z.string().optional()
  }).optional(),
  email: z.object({
    enabled: z.boolean(),
    allowMultiple: z.boolean().optional(),
    message: z.string().optional()
  }).optional(),
  custom: z.array(z.object({
    functionName: z.string(),
    parameters: z.record(z.any()).optional(),
    message: z.string().optional(),
    trigger: z.enum(['change', 'blur', 'submit'])
  })).optional()
}).strict();

export const FormFieldSchema = z.object({
  id: z.string().min(1, 'Field ID is required'),
  type: FormFieldTypeSchema,
  label: z.string().min(1, 'Field label is required'),
  name: z.string().min(1, 'Field name is required'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(false),
  defaultValue: z.any().optional(),
  validation: FormFieldValidationSchema,
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    order: z.number().min(0),
    statistics: z.object({
      interactions: z.number().default(0),
      completionRate: z.number().min(0).max(1).default(0),
      errorRate: z.number().min(0).max(1).default(0),
      avgTimeSpent: z.number().default(0)
    }).optional()
  })
}).strict();

export const FormSettingsSchema = z.object({
  method: z.enum(['POST', 'GET', 'PUT']).default('POST'),
  action: z.string().url('Invalid action URL').optional(),
  submitButton: z.object({
    text: z.string().min(1, 'Submit button text is required'),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
    size: z.enum(['small', 'medium', 'large']).default('medium'),
    loadingText: z.string().default('Submitting...'),
    successText: z.string().optional(),
    disableAfterSubmit: z.boolean().default(true)
  }),
  successAction: z.object({
    type: z.enum(['message', 'redirect', 'download', 'modal', 'custom']),
    message: z.string().optional(),
    redirectUrl: z.string().url('Invalid redirect URL').optional(),
    delay: z.number().min(0).optional()
  }),
  security: z.object({
    csrf: z.boolean().default(true),
    rateLimit: z.object({
      submissionsPerMinute: z.number().min(1).default(5),
      submissionsPerHour: z.number().min(1).default(100)
    }).optional(),
    spamProtection: z.object({
      honeypot: z.boolean().default(true),
      minimumFillTime: z.number().min(0).optional()
    })
  }).optional()
}).strict();

export const FormDataSchema = z.object({
  id: z.string().min(1, 'Form ID is required'),
  name: z.string().min(1, 'Form name is required'),
  description: z.string().optional(),
  fields: z.array(FormFieldSchema).min(1, 'At least one field is required'),
  settings: FormSettingsSchema,
  integrations: z.array(z.object({
    type: z.string(),
    name: z.string(),
    enabled: z.boolean(),
    config: z.record(z.any())
  })).default([]),
  metadata: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    createdBy: z.string(),
    version: z.string(),
    status: z.enum(['draft', 'active', 'inactive', 'archived']).default('draft'),
    statistics: z.object({
      views: z.number().default(0),
      starts: z.number().default(0),
      completions: z.number().default(0),
      conversionRate: z.number().min(0).max(1).default(0)
    }).optional()
  })
}).strict();

/**
 * ===== IMAGE VALIDATION =====
 */

export const ImageSourceSchema = z.enum([
  'upload', 'unsplash', 'pexels', 'pixabay', 'shutterstock', 'getty',
  'ai-generated', 'url', 'library', 'template', 'placeholder'
]);

export const ImageMetadataSchema = z.object({
  file: z.object({
    originalName: z.string(),
    size: z.number().min(0),
    mimeType: z.string(),
    extension: z.string(),
    hash: z.string().optional()
  }),
  image: z.object({
    width: z.number().min(1),
    height: z.number().min(1),
    aspectRatio: z.number().min(0),
    colorSpace: z.string().optional(),
    hasAlpha: z.boolean(),
    isAnimated: z.boolean(),
    orientation: z.enum(['landscape', 'portrait', 'square'])
  }),
  colors: z.object({
    dominantColors: z.array(z.object({
      hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      percentage: z.number().min(0).max(100)
    })),
    averageColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    temperature: z.enum(['warm', 'cool', 'neutral']).optional()
  }).optional(),
  seo: z.object({
    score: z.number().min(0).max(100),
    altTextQuality: z.enum(['excellent', 'good', 'fair', 'poor', 'missing']),
    recommendations: z.array(z.string())
  }).optional()
}).strict();

export const ImageDataSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  source: ImageSourceSchema,
  url: z.string().url('Invalid image URL'),
  urls: z.object({
    original: z.string().url(),
    large: z.string().url().optional(),
    medium: z.string().url().optional(),
    small: z.string().url().optional(),
    thumbnail: z.string().url().optional()
  }).optional(),
  altText: z.string().min(1, 'Alt text is required'),
  title: z.string().optional(),
  description: z.string().optional(),
  metadata: ImageMetadataSchema,
  optimization: z.object({
    status: z.enum(['pending', 'processing', 'completed', 'failed']),
    originalSize: z.number().min(0),
    optimizedSize: z.number().min(0).optional(),
    sizeReduction: z.number().min(0).max(100).optional()
  }),
  licensing: z.object({
    license: z.string(),
    copyrightHolder: z.string().optional(),
    usageRights: z.object({
      commercial: z.boolean(),
      modification: z.boolean(),
      distribution: z.boolean()
    }),
    attribution: z.object({
      required: z.boolean(),
      text: z.string().optional()
    }).optional()
  }),
  timestamps: z.object({
    createdAt: z.date(),
    updatedAt: z.date(),
    uploadedAt: z.date().optional()
  })
}).strict();

/**
 * ===== API VALIDATION =====
 */

export const ParseInputRequestSchema = z.object({
  inputText: z.string()
    .min(10, 'Input too short - please provide more details')
    .max(2000, 'Input too long - please be more concise'),
  context: z.object({
    industry: z.string().optional(),
    companySize: z.string().optional(),
    preferences: z.object({
      language: z.string().optional(),
      tone: z.string().optional(),
      contentLength: z.enum(['short', 'medium', 'long']).optional()
    }).optional()
  }).optional(),
  options: z.object({
    confidenceThreshold: z.number().min(0).max(1).default(0.7),
    maxAlternatives: z.number().min(1).max(10).default(3),
    fuzzyMatching: z.boolean().default(true)
  }).optional()
}).strict();

export const GeneratePageRequestSchema = z.object({
  token: z.string().min(1, 'Project token is required'),
  prompt: z.string().min(1, 'Generation prompt is required'),
  options: z.object({
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(100).max(10000).default(4000),
    seed: z.number().optional(),
    stream: z.boolean().default(false),
    includeAlternatives: z.boolean().default(false),
    qualityThreshold: z.number().min(0).max(1).default(0.8)
  }).optional(),
  context: z.object({
    sections: z.array(z.string()).optional(),
    sectionLayouts: z.record(z.string(), z.string()).optional(),
    existingContent: z.record(z.string(), z.any()).optional()
  }).optional()
}).strict();

export const SaveDraftRequestSchema = z.object({
  token: z.string().min(1, 'Project token is required'),
  data: z.object({
    inputText: z.string().optional(),
    stepIndex: z.number().min(0).optional(),
    validatedFields: InputVariablesSchema.partial().optional(),
    confirmedFields: z.record(z.string(), z.object({
      value: z.string(),
      confidence: z.number().min(0).max(1),
      alternatives: z.array(z.string()).optional()
    })).optional(),
    featuresFromAI: FeatureItemsSchema.optional(),
    hiddenInferredFields: HiddenInferredFieldsSchema.optional(),
    finalContent: LandingPageContentSchema.optional(),
    themeValues: z.record(z.string(), z.any()).optional(),
    metadata: z.record(z.string(), z.any()).optional()
  }),
  options: z.object({
    forceSave: z.boolean().default(false),
    createBackup: z.boolean().default(true),
    autoSave: z.boolean().default(false),
    timeout: z.number().min(1000).max(30000).default(10000)
  }).optional()
}).strict();

/**
 * ===== API RESPONSE VALIDATION =====
 */

export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.any()).optional(),
      retryable: z.boolean(),
      retryAfter: z.number().optional(),
      helpUrl: z.string().url().optional()
    }).optional(),
    warnings: z.array(z.string()).default([]),
    message: z.string().optional(),
    timestamp: z.date(),
    requestId: z.string(),
    metadata: z.object({
      processingTime: z.number().min(0),
      cache: z.object({
        status: z.enum(['hit', 'miss', 'stale', 'bypass']),
        ttl: z.number().optional(),
        age: z.number().optional()
      }).optional(),
      rateLimit: z.object({
        limit: z.number(),
        remaining: z.number(),
        reset: z.date(),
        retryAfter: z.number().optional()
      }).optional(),
      apiVersion: z.string(),
      region: z.string().optional()
    }).optional()
  }).strict();

export const ParseInputResponseSchema = z.object({
  extractedFields: z.record(z.string(), z.object({
    value: z.string(),
    confidence: z.number().min(0).max(1),
    alternatives: z.array(z.string()).optional(),
    source: z.enum(['direct', 'inferred', 'default', 'ml'])
  })),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.object({
    fields: z.record(z.string(), z.any()),
    confidence: z.number().min(0).max(1),
    explanation: z.string()
  })).optional(),
  suggestedQuestions: z.array(z.object({
    question: z.string(),
    field: z.string(),
    type: z.enum(['clarification', 'expansion', 'confirmation']),
    priority: z.number().min(1).max(10)
  })).optional(),
  analysis: z.object({
    length: z.number().min(0),
    complexity: z.number().min(0).max(10),
    clarity: z.number().min(0).max(10),
    completeness: z.number().min(0).max(10),
    topics: z.array(z.string()),
    sentiment: z.object({
      score: z.number().min(-1).max(1),
      label: z.enum(['positive', 'negative', 'neutral']),
      confidence: z.number().min(0).max(1)
    }).optional()
  })
}).strict();

/**
 * ===== UTILITY VALIDATION =====
 */

export const emailSchema = z.string().email('Invalid email address');
export const urlSchema = z.string().url('Invalid URL');
export const phoneSchema = z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format');
export const hexColorSchema = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid hex color format');
export const cssClassSchema = z.string().regex(/^[a-zA-Z][\w\-]*$/, 'Invalid CSS class name');
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

export const fileSizeSchema = (maxSize: number) =>
  z.number()
    .min(1, 'File cannot be empty')
    .max(maxSize, `File size cannot exceed ${Math.round(maxSize / 1024 / 1024)}MB`);

export const imageDimensionsSchema = z.object({
  width: z.number().min(1, 'Width must be at least 1px').max(10000, 'Width too large'),
  height: z.number().min(1, 'Height must be at least 1px').max(10000, 'Height too large')
});

export const CanonicalFieldNameSchema = z.enum([
  'marketCategory', 'marketSubcategory', 'targetAudience',
  'keyProblem', 'startupStage', 'landingPageGoals', 'pricingModel'
]);

/**
 * ===== FIELD NAME VALIDATION =====
 */

export const validateFieldName = (input: string): CanonicalFieldName | null => {
  const canonicalResult = CanonicalFieldNameSchema.safeParse(input);
  if (canonicalResult.success) {
    return canonicalResult.data;
  }

  const fieldMappings: Record<string, CanonicalFieldName> = {
    'Market Category': 'marketCategory',
    'Market Subcategory': 'marketSubcategory',
    'Target Audience': 'targetAudience',
    'Key Problem Getting Solved': 'keyProblem',
    'Startup Stage': 'startupStage',
    'Landing Page Goals': 'landingPageGoals',
    'Pricing Category and Model': 'pricingModel',
    'landingGoal': 'landingPageGoals',
    'pricing': 'pricingModel',
    'stage': 'startupStage',
    'audience': 'targetAudience',
    'problem': 'keyProblem',
    'category': 'marketCategory',
    'subcategory': 'marketSubcategory',
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
    'pricing-model': 'pricingModel'
  };

  if (fieldMappings[input]) {
    return fieldMappings[input];
  }

  const lowerInput = input.toLowerCase();
  for (const [key, value] of Object.entries(fieldMappings)) {
    if (key.toLowerCase() === lowerInput) {
      return value;
    }
  }

  return null;
};

/**
 * ===== MIGRATION VALIDATION =====
 */

export const migrateLegacyInputVariables = (legacyData: Record<string, any>): {
  success: boolean;
  data?: InputVariables;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const migratedData: Record<string, any> = {};

  for (const [key, value] of Object.entries(legacyData)) {
    if (typeof value !== 'string' || !value.trim()) {
      warnings.push(`Skipping empty field: ${key}`);
      continue;
    }

    const canonicalName = validateFieldName(key);
    if (canonicalName) {
      migratedData[canonicalName] = value.trim();
    } else {
      warnings.push(`Unknown field name: ${key}`);
    }
  }

  const validationResult = InputVariablesSchema.safeParse(migratedData);
  
  if (validationResult.success) {
    return {
      success: true,
      data: validationResult.data as InputVariables,
      errors,
      warnings
    };
  } else {
    for (const issue of validationResult.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }

    return {
      success: false,
      errors,
      warnings
    };
  }
};

/**
 * ===== CUSTOM VALIDATION FUNCTIONS =====
 */

export const atLeastOneField = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[],
  message: string = 'At least one field is required'
) => {
  const hasField = fields.some(field => {
    const value = obj[field];
    return value !== undefined && value !== null && value !== '';
  });
  
  if (!hasField) {
    throw new Error(message);
  }
  
  return obj;
};

export const conditionalRequired = <T extends Record<string, any>>(
  obj: T,
  condition: (obj: T) => boolean,
  requiredFields: (keyof T)[],
  message: string = 'Required fields are missing'
) => {
  if (condition(obj)) {
    for (const field of requiredFields) {
      const value = obj[field];
      if (value === undefined || value === null || value === '') {
        throw new Error(`${String(field)} is required: ${message}`);
      }
    }
  }
  
  return obj;
};

export const validateContentLength = (
  content: string,
  type: 'headline' | 'subheadline' | 'body' | 'caption'
): boolean => {
  const limits = {
    headline: { min: 5, max: 100 },
    subheadline: { min: 10, max: 200 },
    body: { min: 20, max: 1000 },
    caption: { min: 5, max: 150 }
  };

  const limit = limits[type];
  const length = content.trim().length;
  
  return length >= limit.min && length <= limit.max;
};

/**
 * ===== VALIDATION UTILITIES =====
 */

export const ValidationUtils = {
  validateFieldName,
  migrateLegacyInputVariables,
  atLeastOneField,
  conditionalRequired,
  validateContentLength,
  
  isValidEmail: (email: string) => emailSchema.safeParse(email).success,
  isValidUrl: (url: string) => urlSchema.safeParse(url).success,
  isValidPhone: (phone: string) => phoneSchema.safeParse(phone).success,
  isValidHexColor: (color: string) => hexColorSchema.safeParse(color).success,
  isValidSlug: (slug: string) => slugSchema.safeParse(slug).success,
  
  isValidInputVariables: (data: any) => InputVariablesSchema.safeParse(data).success,
  isValidSectionData: (data: any) => SectionDataSchema.safeParse(data).success,
  isValidFormData: (data: any) => FormDataSchema.safeParse(data).success,
  isValidImageData: (data: any) => ImageDataSchema.safeParse(data).success
};

export type ValidatedInputVariables = z.infer<typeof InputVariablesSchema>;
export type ValidatedSectionData = z.infer<typeof SectionDataSchema>;
export type ValidatedFormData = z.infer<typeof FormDataSchema>;
export type ValidatedImageData = z.infer<typeof ImageDataSchema>;
export type ValidatedApiResponse<T> = z.infer<ReturnType<typeof ApiResponseSchema<z.ZodType<T>>>>;

export const ValidationSchemas = {
  InputVariablesSchema,
  HiddenInferredFieldsSchema,
  FeatureItemSchema,
  FeatureItemsSchema,
  EditableElementSchema,
  SectionDataSchema,
  ThemeSchema,
  LandingPageContentSchema,
  FormFieldSchema,
  FormDataSchema,
  FormSettingsSchema,
  ImageDataSchema,
  ImageMetadataSchema,
  ParseInputRequestSchema,
  GeneratePageRequestSchema,
  SaveDraftRequestSchema,
  ApiResponseSchema,
  ParseInputResponseSchema,
  emailSchema,
  urlSchema,
  phoneSchema,
  hexColorSchema,
  slugSchema,
  CanonicalFieldNameSchema
} as const;
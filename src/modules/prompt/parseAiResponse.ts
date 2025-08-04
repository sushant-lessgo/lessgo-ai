

interface ParsedResponse {
  success: boolean
  content: Record<string, any>
  isPartial: boolean
  warnings: string[]
  errors: string[]
}

interface SectionContent {
  [key: string]: string | string[]
}

/**
 * Parses and validates AI response for landing page copy generation
 */
export function parseAiResponse(aiContent: string): ParsedResponse {
  const result: ParsedResponse = {
    success: false,
    content: {},
    isPartial: false,
    warnings: [],
    errors: []
  }

  try {
    // Extract JSON from AI response (handle potential markdown code blocks)
    const jsonContent = extractJSON(aiContent)
    if (!jsonContent) {
      result.errors.push("No valid JSON found in AI response")
      return result
    }

    const parsedContent = JSON.parse(jsonContent)
    
    // Validate structure
    const validation = validateContent(parsedContent)
    result.content = validation.content
    result.warnings = validation.warnings
    result.errors = validation.errors
    result.isPartial = validation.isPartial
    result.success = validation.errors.length === 0

    return result

  } catch (error) {
    result.errors.push(`JSON parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return result
  }
}

/**
 * Extracts JSON from AI response, handling markdown code blocks
 */
function extractJSON(content: string): string | null {
  // Remove potential markdown code blocks
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
  const codeBlockMatch = content.match(codeBlockRegex)
  
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Try to find JSON object directly
  const jsonRegex = /\{[\s\S]*\}/
  const jsonMatch = content.match(jsonRegex)
  
  if (jsonMatch) {
    return jsonMatch[0]
  }

  return null
}

/**
 * Validates and cleans the parsed content
 */
function validateContent(content: any): {
  content: Record<string, any>;
  warnings: string[];
  errors: string[];
  isPartial: boolean;
} {
  const validation = {
    content: {} as Record<string, any>,
    warnings: [] as string[],
    errors: [] as string[],
    isPartial: false
  }

  if (!content || typeof content !== 'object') {
    validation.errors.push("Content must be an object")
    return validation
  }

  // Required sections - removed hardcoded requirement
  // Different pages might have different sections based on business rules
  const availableSections = Object.keys(content)
  
  // Only warn if no sections at all
  if (availableSections.length === 0) {
    validation.errors.push('No sections found in content')
    validation.isPartial = true
  }

  // Process each section
  Object.entries(content).forEach(([sectionId, sectionContent]) => {
    if (!sectionContent || typeof sectionContent !== 'object') {
      validation.warnings.push(`Section ${sectionId} has invalid format`)
      validation.isPartial = true
      return
    }

    const processedSection = processSectionContent(sectionId, sectionContent as SectionContent)
    
    if (processedSection.hasIssues) {
      validation.warnings.push(...processedSection.warnings)
      validation.isPartial = true
    }

    validation.content[sectionId] = processedSection.content
  })

  return validation
}

/**
 * Processes and validates individual section content
 */
function processSectionContent(sectionId: string, content: SectionContent): {
  content: SectionContent;
  warnings: string[];
  hasIssues: boolean;
} {
  const result = {
    content: {} as SectionContent,
    warnings: [] as string[],
    hasIssues: false
  };

  Object.entries(content).forEach(([elementKey, elementValue]) => {
    const processedElement = processElement(sectionId, elementKey, elementValue)
    
    if (processedElement.isValid) {
      result.content[elementKey] = processedElement.value
    } else {
      result.warnings.push(...processedElement.warnings)
      result.hasIssues = true
      // Use fallback or empty value
      result.content[elementKey] = processedElement.fallback
    }
  })

  return result
}

/**
 * Processes individual elements with validation
 */
function processElement(sectionId: string, elementKey: string, value: any): {
  isValid: boolean;
  value: string | string[];
  fallback: string | string[];
  warnings: string[];
} {
  const result = {
    isValid: true,
    value: value,
    fallback: getElementFallback(elementKey),
    warnings: [] as string[]
  };

  // Type validation
  if (typeof value !== 'string' && !Array.isArray(value)) {
    result.isValid = false
    result.warnings.push(`${sectionId}.${elementKey}: Expected string or array, got ${typeof value}`)
    return result
  }

  // String validation
  if (typeof value === 'string') {
    if (!value.trim()) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Empty string`)
      return result
    }

    // Length validation
    const lengthValidation = validateStringLength(elementKey, value)
    if (!lengthValidation.isValid) {
      result.warnings.push(`${sectionId}.${elementKey}: ${lengthValidation.message}`)
      if (lengthValidation.severity === 'error') {
        result.isValid = false
        return result
      }
    }
  }

  // Array validation
  if (Array.isArray(value)) {
    if (value.length === 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Empty array`)
      return result
    }

    const invalidItems = value.filter(item => typeof item !== 'string' || !item.trim())
    if (invalidItems.length > 0) {
      result.isValid = false
      result.warnings.push(`${sectionId}.${elementKey}: Contains ${invalidItems.length} invalid items`)
      return result
    }
  }

  return result
}

/**
 * Validates string length based on element type
 */
function validateStringLength(elementKey: string, value: string): {
  isValid: boolean;
  message: string;
  severity: 'warning' | 'error';
} {
  const lengthRules: Record<string, { min: number; max: number; severity: 'warning' | 'error' }> = {
    headline: { min: 10, max: 100, severity: 'warning' },
    subheadline: { min: 15, max: 150, severity: 'warning' },
    cta_text: { min: 5, max: 30, severity: 'error' },
    description: { min: 20, max: 300, severity: 'warning' },
    quote: { min: 20, max: 200, severity: 'warning' }
  }

  // Find matching rule (check for partial matches)
  let rule = lengthRules[elementKey]
  if (!rule) {
    for (const [key, ruleValue] of Object.entries(lengthRules)) {
      if (elementKey.includes(key)) {
        rule = ruleValue
        break
      }
    }
  }

  // Default rule if no specific rule found
  if (!rule) {
    rule = { min: 1, max: 500, severity: 'warning' }
  }

  const length = value.trim().length

  if (length < rule.min) {
    return {
      isValid: false,
      message: `Too short (${length} chars, min ${rule.min})`,
      severity: rule.severity
    }
  }

  if (length > rule.max) {
    return {
      isValid: false,
      message: `Too long (${length} chars, max ${rule.max})`,
      severity: rule.severity
    }
  }

  return { isValid: true, message: '', severity: 'warning' }
}

/**
 * Provides fallback content for elements
 */
function getElementFallback(elementKey: string): string | string[] {
  const fallbacks: Record<string, string | string[]> = {
    headline: "Transform Your Business Today",
    subheadline: "Join thousands of companies already seeing results",
    cta_text: "Get Started",
    description: "Discover how our solution can help you achieve your goals",
    quote: "This solution changed everything for our business",
    
    // Array fallbacks
    feature_titles: ["Feature 1", "Feature 2", "Feature 3"],
    feature_descriptions: ["Benefit description 1", "Benefit description 2", "Benefit description 3"],
    testimonial_quotes: ["Great product!", "Highly recommended", "Best investment we made"],
    questions: ["How does it work?", "Is it secure?", "What's included?"],
    answers: ["It works seamlessly", "Yes, enterprise-grade security", "Everything you need"]
  }

  // Check for exact match
  if (fallbacks[elementKey]) {
    return fallbacks[elementKey];
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(fallbacks)) {
    if (elementKey.includes(key)) {
      return value;
    }
  }

  // Determine if should be array or string based on element name
  const arrayIndicators = ['titles', 'descriptions', 'quotes', 'questions', 'answers', 'items', 'list']
  const shouldBeArray = arrayIndicators.some(indicator => elementKey.includes(indicator))

  return shouldBeArray ? ["Default content"] : "Default content";
}

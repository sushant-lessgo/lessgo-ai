interface BusinessContext {
  industry: string
  productType: string
  targetAudience: string
  businessStage: string
  oneLiner?: string
}

/**
 * Generates mock AI response for testing and fallback scenarios
 * NOW PARSES THE PROMPT TO ONLY RETURN REQUESTED SECTIONS
 */
export function generateMockResponse(prompt: string): any {
  const businessContext = extractBusinessContext(prompt)
  const requestedSections = extractRequestedSections(prompt)
  
  console.log('🎭 Mock Generator:', {
    requestedSections,
    businessContext,
    promptLength: prompt.length,
    promptPreview: prompt.substring(0, 200) + '...'
  })
  
  return {
    choices: [{
      message: {
        content: JSON.stringify(generateMockContent(businessContext, requestedSections), null, 2)
      }
    }]
  }
}

/**
 * ✅ NEW: Extracts which sections are actually requested in the prompt
 */
function extractRequestedSections(prompt: string): string[] {
  console.log('🔍 Mock generator: Extracting sections from prompt')
  
  // First, try to extract from pageStore sections (most reliable)
  const pageStoreSectionsPatterns = [
    // More specific patterns first
    /"sections":\s*\[([^\]]+)\]/,
    /layout\.sections:\s*\[([^\]]+)\]/,
    /Selected sections:\s*\[([^\]]+)\]/,
    /Sections to generate:\s*\[([^\]]+)\]/,
    // Generic pattern last (most likely to match wrong content)
    /sections[\s\S]*?\[([^\]]+)\]/
  ]
  
  for (const pattern of pageStoreSectionsPatterns) {
    const match = prompt.match(pattern)
    if (match) {
      console.log('🎯 Pattern matched:', pattern.toString(), 'Match:', match[0].substring(0, 100))
      try {
        const sectionsArray = match[1]
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(s => s.length > 0)
        
        if (sectionsArray.length > 0 && sectionsArray.length <= 10) {
          console.log('✅ Extracted sections from pageStore pattern:', sectionsArray)
          return sectionsArray
        }
      } catch (error) {
        console.warn('Failed to parse sections from pageStore match:', error)
      }
    }
  }

  // Look for JSON structure in the prompt which shows requested sections
  const jsonMatch = prompt.match(/\{[\s\S]*?\}/g)
  if (!jsonMatch) {
    console.warn('❌ No JSON structure found in prompt, using fallback sections')
    return ['hero', 'features', 'cta'] // Safe fallback
  }
  
  console.log('📋 Found JSON structures in prompt:', jsonMatch.length)

  const jsonString = jsonMatch[jsonMatch.length - 1] // Get the last JSON block (likely the output format)
  
  console.log('🔍 Found JSON string to parse:', jsonString.substring(0, 200) + '...')
  
  try {
    // Try to parse the JSON to extract section names
    const jsonObj = JSON.parse(jsonString)
    const sections = Object.keys(jsonObj)
    console.log('📋 Extracted sections from JSON:', sections)
    
    // Filter to only known valid sections to prevent returning too many
    const validSections = [
      'hero', 'problem', 'beforeAfter', 'useCases', 'features', 'uniqueMechanism', 
      'howItWorks', 'results', 'testimonials', 'socialProof', 'comparisonTable', 
      'objectionHandling', 'integrations', 'security', 'pricing', 'founderNote', 
      'faq', 'cta', 'closeSection'
    ]
    
    const filteredSections = sections.filter(s => validSections.includes(s))
    
    if (filteredSections.length > 0 && filteredSections.length <= 12) { // Reasonable limit
      console.log('✅ Extracted sections from prompt JSON:', filteredSections)
      return filteredSections
    }
  } catch (error) {
    console.warn('Failed to parse JSON from prompt, trying regex extraction')
  }

  // Fallback: Extract section names from prompt text  
  const sectionPattern = /"([a-zA-Z]+)":\s*\{/g
  const sections: string[] = []
  let match

  while ((match = sectionPattern.exec(prompt)) !== null) {
    sections.push(match[1])
  }

  if (sections.length > 0 && sections.length <= 12) { // Reasonable limit
    console.log('✅ Extracted sections from prompt regex:', sections)
    return sections
  }

  // Final fallback - only essential sections
  console.warn('Could not extract sections from prompt, using minimal safe defaults')
  console.log('📝 Prompt preview (first 500 chars):', prompt.substring(0, 500))
  return ['hero', 'problem', 'features', 'cta'] // Only 4 essential sections
}

/**
 * Extracts business context from prompt for contextual mock data
 */
function extractBusinessContext(prompt: string): BusinessContext {
  const context: BusinessContext = {
    industry: 'Software',
    productType: 'SaaS Platform',
    targetAudience: 'Businesses',
    businessStage: 'Growth'
  }

  // Extract one-liner if present
  const oneLineMatch = prompt.match(/Product\/Service:\s*([^\n]+)/i)
  if (oneLineMatch) {
    context.oneLiner = oneLineMatch[1].trim()
  }

  // Industry detection
  if (prompt.includes('AI') || prompt.includes('artificial intelligence')) {
    context.industry = 'AI/Technology'
    context.productType = 'AI Solution'
  } else if (prompt.includes('ecommerce') || prompt.includes('e-commerce')) {
    context.industry = 'E-commerce'
    context.productType = 'E-commerce Platform'
  } else if (prompt.includes('healthcare') || prompt.includes('medical')) {
    context.industry = 'Healthcare'
    context.productType = 'Healthcare Solution'
  } else if (prompt.includes('fintech') || prompt.includes('finance')) {
    context.industry = 'Financial Services'
    context.productType = 'FinTech Solution'
  } else if (prompt.includes('education') || prompt.includes('edtech')) {
    context.industry = 'Education'
    context.productType = 'EdTech Platform'
  } else if (prompt.includes('marketing') || prompt.includes('martech')) {
    context.industry = 'Marketing'
    context.productType = 'Marketing Tool'
  }

  // Target audience detection
  if (prompt.includes('small business') || prompt.includes('SMB')) {
    context.targetAudience = 'Small Businesses'
  } else if (prompt.includes('enterprise')) {
    context.targetAudience = 'Enterprise'
  } else if (prompt.includes('startup')) {
    context.targetAudience = 'Startups'
  } else if (prompt.includes('freelancer') || prompt.includes('solopreneur')) {
    context.targetAudience = 'Freelancers'
  }

  // Business stage detection
  if (prompt.includes('early') || prompt.includes('mvp')) {
    context.businessStage = 'Early Stage'
  } else if (prompt.includes('scale') || prompt.includes('enterprise')) {
    context.businessStage = 'Scale'
  }

  return context
}

/**
 * ✅ FIXED: Only generates content for requested sections with correct camelCase naming
 */
function generateMockContent(context: BusinessContext, requestedSections: string[]): Record<string, any> {
  const { industry, productType, targetAudience } = context
  
  // Content variation pools
  const contentVariations = {
    headlines: [
      `Transform Your ${industry} Operations`,
      `The Future of ${productType} is Here`,
      `Streamline Your ${targetAudience} Workflow`,
      `Revolutionary ${productType} Solution`,
      `Boost Your ${industry} Performance`,
      `Scale Your ${targetAudience} Success`,
      `Next-Generation ${productType}`,
      `Optimize Your ${industry} Process`
    ],
    subheadlines: [
      `Join thousands of ${targetAudience.toLowerCase()} already seeing results`,
      `Trusted by leading ${industry.toLowerCase()} companies worldwide`,
      `The most advanced ${productType.toLowerCase()} platform available`,
      `Everything you need to succeed in ${industry.toLowerCase()}`,
      `Built specifically for modern ${targetAudience.toLowerCase()}`,
      `Transform your business with cutting-edge technology`,
      `Experience the difference of premium ${productType.toLowerCase()}`
    ],
    ctaTexts: [
      "Start Free Trial",
      "Get Started Now",
      "Try for Free",
      "Book a Demo",
      "Sign Up Today",
      "Start Your Journey",
      "Claim Your Spot",
      "Get Access Now"
    ],
    problemStatements: [
      "Struggling with inefficient processes",
      "Wasting time on manual tasks",
      "Missing growth opportunities",
      "Dealing with outdated systems",
      "Facing scalability challenges",
      "Losing competitive advantage"
    ],
    features: [
      "Advanced Analytics Dashboard",
      "Real-time Collaboration",
      "Enterprise Security",
      "Automated Workflows",
      "Custom Integrations",
      "24/7 Support",
      "Mobile Optimization",
      "API Access"
    ],
    benefits: [
      "Increase productivity by 50%",
      "Save 10+ hours per week",
      "Reduce operational costs",
      "Improve team collaboration",
      "Scale without limits",
      "Get insights in real-time",
      "Automate repetitive tasks",
      "Ensure data security"
    ],
    testimonialQuotes: [
      "This solution transformed our entire workflow and saved us countless hours.",
      "Best investment we've made for our team's productivity.",
      "The results were immediate and impressive.",
      "Finally, a tool that actually delivers on its promises.",
      "Our efficiency increased dramatically within the first month.",
      "Game-changer for our business operations."
    ],
    customerNames: [
      "Sarah Johnson",
      "Michael Chen",
      "Emma Rodriguez",
      "David Thompson",
      "Lisa Wang",
      "James Miller"
    ],
    customerTitles: [
      "CEO, TechStart Inc",
      "Operations Manager, Growth Co",
      "Founder, Innovation Labs",
      "Director, Scale Solutions",
      "VP Operations, NextGen",
      "Head of Product, Future Corp"
    ],
    companyLogos: [
      "Microsoft",
      "Google",
      "Amazon",
      "Salesforce",
      "HubSpot",
      "Slack"
    ],
    stats: [
      "10,000+",
      "500%",
      "99.9%",
      "24/7",
      "50M+",
      "150+"
    ],
    statLabels: [
      "Happy Customers",
      "Performance Increase",
      "Uptime Guarantee",
      "Support Available",
      "Data Points Processed",
      "Integrations Available"
    ]
  }

  const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
  const randomChoices = <T>(arr: T[], count: number): T[] => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  // ✅ FIXED: Complete section templates with correct camelCase naming
  const allSectionTemplates: Record<string, any> = {
    hero: {
      headline: randomChoice(contentVariations.headlines),
      subheadline: randomChoice(contentVariations.subheadlines),
      cta_text: randomChoice(contentVariations.ctaTexts),
      supporting_text: `Perfect for ${targetAudience.toLowerCase()} looking to scale their ${industry.toLowerCase()} operations.`
    },

    problem: {
      headline: "The Challenge Most Teams Face",
      pain_points: randomChoices(contentVariations.problemStatements, 4),
      emotional_hook: "You're not alone in feeling overwhelmed by these challenges.",
      supporting_text: "These issues are costing you time, money, and growth opportunities every day."
    },

    // ✅ FIXED: Correct camelCase naming
    beforeAfter: {
      before_label: "Before",
      after_label: "After",
      before_description: "Manual processes, scattered data, limited visibility into performance metrics.",
      after_description: "Automated workflows, centralized insights, real-time performance tracking.",
      transformation_headline: "See the Transformation",
      comparison_stats: ["5x faster processing", "90% less manual work", "100% data accuracy"]
    },

    // ✅ FIXED: Correct camelCase naming
    useCases: {
      headline: "Perfect for Every Use Case",
      use_case_titles: [
        "Team Collaboration",
        "Data Management", 
        "Process Automation",
        "Performance Tracking"
      ],
      use_case_descriptions: [
        "Enable seamless collaboration across distributed teams",
        "Centralize and organize all your important data",
        "Automate repetitive tasks and workflows",
        "Track and analyze performance in real-time"
      ]
    },

    features: {
      headline: "Everything You Need to Succeed",
      subheadline: "Powerful features designed for modern teams",
      feature_titles: randomChoices(contentVariations.features, 6),
      feature_descriptions: randomChoices(contentVariations.benefits, 6),
      cta_text: randomChoice(contentVariations.ctaTexts)
    },

    // ✅ FIXED: Correct camelCase naming
    uniqueMechanism: {
      headline: "Our Unique Approach",
      mechanism_title: "The Power Framework",
      pillars: [
        "Intelligent Automation",
        "Real-time Processing",
        "Predictive Analytics"
      ],
      pillar_descriptions: [
        "AI-powered automation that learns from your patterns",
        "Process data instantly as it flows through your system",
        "Predict trends and opportunities before they happen"
      ],
      differentiation_text: "Unlike other solutions, we combine cutting-edge AI with intuitive design."
    },

    // ✅ FIXED: Correct camelCase naming
    howItWorks: {
      headline: "How It Works",
      subheadline: "Get started in three simple steps",
      step_titles: [
        "Connect Your Data",
        "Configure Your Workflow", 
        "Monitor & Optimize"
      ],
      step_descriptions: [
        "Seamlessly integrate with your existing tools and data sources",
        "Set up automated workflows tailored to your specific needs",
        "Track performance and continuously improve your processes"
      ],
      step_numbers: ["01", "02", "03"]
    },

    results: {
      headline: "Real Results from Real Customers",
      stat_values: randomChoices(contentVariations.stats, 4),
      stat_labels: randomChoices(contentVariations.statLabels, 4),
      improvement_metrics: [
        "50% faster processing",
        "90% reduction in errors",
        "3x productivity increase",
        "85% cost savings"
      ],
      supporting_text: "Join thousands of teams already seeing these results."
    },

    testimonials: {
      headline: "What Our Customers Say",
      testimonial_quotes: randomChoices(contentVariations.testimonialQuotes, 3),
      customer_names: randomChoices(contentVariations.customerNames, 3),
      customer_titles: randomChoices(contentVariations.customerTitles, 3),
      rating_scores: ["5.0", "4.9", "4.8"],
      rating_sources: ["G2", "Capterra", "TrustPilot"]
    },

    // ✅ FIXED: Correct camelCase naming  
    socialProof: {
      headline: "Trusted by Industry Leaders",
      user_count: "10,000+",
      company_logos: randomChoices(contentVariations.companyLogos, 6),
      industry_validation: `Leading ${industry.toLowerCase()} companies trust our solution`,
      growth_stats: ["500% growth in 2024", "99.9% customer satisfaction", "150+ countries served"]
    },

    // ✅ FIXED: Correct camelCase naming
    comparisonTable: {
      headline: "Why Choose Us",
      your_product_name: "Our Solution",
      competitor_names: ["Competitor A", "Competitor B"],
      feature_comparison: [
        "Advanced AI Features",
        "Real-time Processing", 
        "24/7 Support",
        "Custom Integrations"
      ],
      advantage_callouts: [
        "Only solution with AI-powered automation",
        "10x faster than alternatives",
        "White-glove onboarding included"
      ]
    },

    // ✅ FIXED: Correct camelCase naming
    objectionHandling: {
      headline: "Common Questions Answered",
      objection_questions: [
        "Is it difficult to implement?",
        "What about data security?",
        "How much does it cost?",
        "What if it doesn't work for us?"
      ],
      objection_answers: [
        "Our team handles the entire setup process for you.",
        "Enterprise-grade security with SOC 2 compliance.",
        "Flexible pricing that scales with your needs.",
        "30-day money-back guarantee, no questions asked."
      ]
    },

    integrations: {
      headline: "Integrates with Your Favorite Tools",
      integration_categories: ["CRM", "Communication", "Analytics", "Storage"],
      integration_names: [
        "Salesforce", "Slack", "Google Analytics", "Dropbox",
        "HubSpot", "Microsoft Teams", "Tableau", "AWS S3"
      ],
      integration_count: "150+",
      api_availability: "Full API access available"
    },

    security: {
      headline: "Enterprise-Grade Security",
      compliance_badges: ["SOC 2", "GDPR", "HIPAA", "ISO 27001"],
      security_features: [
        "End-to-end encryption",
        "Regular security audits",
        "24/7 monitoring",
        "Role-based access control"
      ],
      trust_indicators: ["99.9% uptime", "Zero breaches", "Annual audits"]
    },

    pricing: {
      headline: "Simple, Transparent Pricing",
      tier_names: ["Starter", "Professional", "Enterprise"],
      tier_prices: ["$29/mo", "$99/mo", "Custom"],
      tier_descriptions: [
        "Perfect for small teams getting started",
        "Advanced features for growing businesses",
        "Custom solutions for large organizations"
      ],
      popular_tier: "Professional",
      money_back_guarantee: "30-day money-back guarantee"
    },

    // ✅ FIXED: Correct camelCase naming
    founderNote: {
      headline: "A Note from Our Founder",
      founder_name: "Alex Thompson",
      founder_title: "CEO & Founder",
      founder_quote: "We built this solution because we experienced the same challenges you're facing today.",
      founder_story: "After years of struggling with inefficient processes, we decided to create the solution we wished existed.",
      mission_statement: "Our mission is to empower every team to achieve their full potential."
    },

    faq: {
      headline: "Frequently Asked Questions",
      questions: [
        "How quickly can I get started?",
        "Do you offer customer support?",
        "Can I cancel anytime?",
        "Is my data secure?",
        "Do you offer training?",
        "What integrations are available?"
      ],
      answers: [
        "You can be up and running in under 15 minutes with our guided setup.",
        "Yes, we provide 24/7 customer support via chat, email, and phone.",
        "Absolutely. Cancel anytime with no long-term contracts or fees.",
        "Your data is protected with enterprise-grade security and encryption.",
        "We offer comprehensive training and onboarding for all new customers.",
        "We integrate with 150+ popular business tools and platforms."
      ]
    },

    cta: {
      headline: "Ready to Transform Your Business?",
      subheadline: "Join thousands of teams already seeing results",
      cta_text: randomChoice(contentVariations.ctaTexts),
      urgency_text: "Start your free trial today - no credit card required",
      trust_badges: ["30-day free trial", "No setup fees", "Cancel anytime"],
      risk_reversal: "Risk-free with our 30-day money-back guarantee"
    },

    // ✅ FIXED: Correct camelCase naming
    closeSection: {
      headline: "Don't Wait - Start Today",
      value_stack: [
        "Complete platform access",
        "24/7 customer support",
        "Free onboarding & training",
        "30-day money-back guarantee"
      ],
      final_cta: randomChoice(contentVariations.ctaTexts),
      scarcity_text: "Join the 10,000+ teams already transforming their operations",
      contact_options: ["Live chat", "Email support", "Phone consultation"]
    }
  }

  // ✅ FIXED: Only return content for requested sections
  const mockContent: Record<string, any> = {}
  
  requestedSections.forEach(sectionId => {
    if (allSectionTemplates[sectionId]) {
      mockContent[sectionId] = allSectionTemplates[sectionId]
      console.log(`✅ Generated mock content for: ${sectionId}`)
    } else {
      console.warn(`⚠️ No mock template found for section: ${sectionId}`)
      // Provide basic fallback content
      mockContent[sectionId] = {
        headline: `${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Section`,
        description: "Mock content for this section"
      }
    }
  })

  console.log('🎭 Final mock content sections:', Object.keys(mockContent))
  return mockContent
}
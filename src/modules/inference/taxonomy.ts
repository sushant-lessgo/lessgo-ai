// modules/inference/taxonomy.ts - FIXED: Proper type derivation for Phase 1
// Single source of truth with correct singular value exports

/**
 * ===== MARKET CATEGORIES =====
 */
export const marketCategories = [
  'Work & Productivity Tools',
  'Marketing & Sales Tools',
  'Engineering & Development Tools',
  'AI Tools',
  'Design & Creative Tools',
  'No-Code & Low-Code Platforms',
  'Customer Support & Service Tools',
  'Data & Analytics Tools',
  'HR & People Operations Tools',
  'Finance & Accounting Tools',
  'Web3 & Blockchain Tools',
  'Product Add-ons & Integrations',
  'Industry-Specific SaaS',
] as const;

export type MarketCategory = (typeof marketCategories)[number];

/**
 * ===== MARKET SUBCATEGORIES =====
 */
export const marketSubcategories: Record<MarketCategory, readonly string[]> = {
  'Work & Productivity Tools': [
    'Project & Task Management',
    'Note-Taking & Knowledge Management',
    'Team Collaboration & Communication',
    'Email Clients & Management',
    'Calendar & Scheduling Software',
    'Meeting & Video Conferencing Software',
    'Virtual Office Platforms',
    'File Storage & Sharing Solutions',
    'Document Creation & Management',
    'E-Signature Solutions',
    'PDF Editors & Management',
    'Password Management',
    'Time Tracking Software',
    'Productivity Suites',
    'Writing Assistants',
    'Screen Recording & Screenshot Tools',
  ],
  'Marketing & Sales Tools': [
    'CRM',
    'Sales Automation & Outreach',
    'Lead Generation & Prospecting',
    'Marketing Automation Platforms',
    'Email Marketing Platforms',
    'SEO Tools',
    'Content Marketing Platforms',
    'Social Media Management & Scheduling',
    'Influencer Marketing Platforms',
    'Advertising & PPC Management Tools',
    'Affiliate Marketing Platforms',
    'Marketing Analytics & Attribution',
    'Conversion Rate Optimization Tools',
    'Landing Page Builders',
    'Survey & Form Builders',
    'Public Relations Software',
    'Sales Enablement Platforms',
    'Customer Loyalty & Referral Programs',
  ],
  'Engineering & Development Tools': [
    'Cloud Computing & Hosting Platforms',
    'DevOps & CI/CD Platforms',
    'Version Control & Code Collaboration',
    'Testing & QA Software',
    'API Management & Development Services',
    'Backend-as-a-Service & Frameworks',
    'Database Management Tools',
    'Monitoring & Observability Platforms',
    'Issue Tracking & Bug Reporting',
    'Code Editors & IDEs',
    'Authentication & Identity Management',
    'Static Site Generators',
    'Content Management Systems',
    'Headless CMS',
    'VPN Clients',
  ],
  'AI Tools': [
    'AI Chatbots & Virtual Assistants',
    'AI Generative Content',
    'AI Coding Assistants',
    'AI Data Analysis & Business Intelligence',
    'AI Notetakers & Transcription Services',
    'AI Content Detection & Verification',
    'AI Infrastructure & MLOps',
    'AI Voice Agents & Speech-to-Text/Text-to-Speech',
    'LLM Platforms & Prompt Engineering Tools',
    'Predictive Analytics & Machine Learning Platforms',
    'AI Search & Knowledge Discovery',
    'AI Personalization Engines',
  ],
  'Design & Creative Tools': [
    'Graphic Design Software',
    'Photo Editing & Management Software',
    'Video Editing & Hosting Platforms',
    'UI/UX Design & Prototyping Tools',
    'Wireframing & Mockup Tools',
    '3D Modeling & Animation Software',
    'Design Asset Management & Libraries',
    'Digital Whiteboards & Visual Collaboration',
    'User Research & Testing Platforms',
    'Presentation Design Software',
  ],
  'No-Code & Low-Code Platforms': [
    'No-Code/Low-Code Website Builders',
    'No-Code/Low-Code Web & Mobile App Builders',
    'No-Code/Low-Code Automation & Workflow Builders',
    'No-Code/Low-Code Form & Survey Builders',
    'No-Code/Low-Code Database & Backend Builders',
    'No-Code/Low-Code Chatbot Builders',
  ],
  'Customer Support & Service Tools': [
    'Helpdesk & Ticketing Systems',
    'Live Chat & Customer Messaging Platforms',
    'Knowledge Base & Self-Service Software',
    'Customer Feedback & Survey Tools',
    'Community Management Platforms',
    'Call Center Software',
    'Customer Success Platforms',
  ],
  'Data & Analytics Tools': [
    'Business Intelligence & Reporting Platforms',
    'Data Visualization Tools',
    'Web & Product Analytics Platforms',
    'A/B Testing & Experimentation Software',
    'Data Integration & ETL Tools',
    'Customer Data Platforms',
    'Data Warehouse Solutions',
    'Big Data Processing & Analytics',
  ],
  'HR & People Operations Tools': [
    'Applicant Tracking Systems & Recruiting Software',
    'Employee Onboarding & Offboarding Software',
    'Performance Management & Feedback Platforms',
    'HRIS',
    'Payroll & Benefits Administration Software',
    'Employee Engagement & Recognition Platforms',
    'Learning Management Systems',
    'Workforce Management & Scheduling',
  ],
  'Finance & Accounting Tools': [
    'Accounting & Bookkeeping Software',
    'Billing, Invoicing & Subscription Management',
    'Payment Processing & Gateway Solutions',
    'Expense Management Software',
    'Financial Planning & Analysis Software',
    'Budgeting & Forecasting Tools',
    'Tax Compliance & Preparation Software',
    'Treasury Management Systems',
    'Startup Financial Planning & Cap Table Management',
    'Fundraising & Investor Relations Platforms',
  ],
  'Web3 & Blockchain Tools': [
    'Crypto Payment Gateways & Processing',
    'NFT Creation & Marketplace Platforms',
    'DAO Management & Tooling',
    'Blockchain Development Platforms',
    'Smart Contract Auditing & Security',
    'Decentralized Identity Solutions',
    'Crypto Wallet Infrastructure',
  ],
  'Product Add-ons & Integrations': [
    'Browser Extensions',
    'Platform Plugins',
    'Application Connectors & Native Integrations',
    'Templates as a Product',
  ],
  'Industry-Specific SaaS': [
    'Healthcare & MedTech SaaS',
    'LegalTech SaaS',
    'Real Estate Tech SaaS',
    'EdTech SaaS',
    'Travel & Hospitality Tech SaaS',
    'E-commerce Platforms & Tools',
    'Fitness & Wellness Tech SaaS',
  ],
} as const;

// ✅ FIXED: Correct type derivation for subcategories
export type MarketSubcategory = (typeof marketSubcategories)[MarketCategory][number];

/**
 * ===== LANDING PAGE GOALS =====
 */
export const landingGoalTypes = [
  {
    id: 'waitlist',
    label: 'Join Waitlist',
    ctaType: 'Soft',
  },
  {
    id: 'early-access',
    label: 'Get Early Access',
    ctaType: 'Soft',
  },
  {
    id: 'signup',
    label: 'Create Free Account',
    ctaType: 'Direct',
  },
  {
    id: 'free-trial',
    label: 'Start Free Trial',
    ctaType: 'Direct',
  },
  {
    id: 'demo',
    label: 'Request a Demo',
    ctaType: 'Trust',
  },
  {
    id: 'book-call',
    label: 'Book a Strategy Call',
    ctaType: 'Trust',
  },
  {
    id: 'buy-now',
    label: 'Buy Now',
    ctaType: 'Hard',
  },
  {
    id: 'subscribe',
    label: 'Subscribe to a Plan',
    ctaType: 'Hard',
  },
  {
    id: 'download',
    label: 'Download App / Extension',
    ctaType: 'Direct',
  },
  {
    id: 'join-community',
    label: 'Join Discord / Community',
    ctaType: 'Soft',
  },
  {
    id: 'watch-video',
    label: 'Watch Demo / Product Tour',
    ctaType: 'Soft',
  },
  {
    id: 'contact-sales',
    label: 'Talk to Sales',
    ctaType: 'Trust',
  },
] as const;

// ✅ FIXED: Extract IDs for type safety
export type LandingGoalType = (typeof landingGoalTypes)[number]["id"];

/**
 * ===== STARTUP STAGES =====
 */
export const startupStageGroups = [
  {
    id: 'idea',
    label: 'Idea Stage',
    stages: [
      { id: 'problem-exploration', label: 'Problem exploration (no product yet)' },
      { id: 'pre-mvp', label: 'Pre-MVP (wireframes or prototype only)' },
    ],
  },
  {
    id: 'mvp',
    label: 'Building MVP',
    stages: [
      { id: 'mvp-development', label: 'MVP in development' },
      { id: 'mvp-launched', label: 'MVP launched, 0 users' },
      { id: 'early-feedback', label: 'Initial feedback phase (10–50 users)' },
    ],
  },
  {
    id: 'traction',
    label: 'Gaining Traction',
    stages: [
      { id: 'problem-solution-fit', label: 'Problem–solution fit (50–100 users)' },
      { id: 'validated-early', label: 'Validated with early adopters (100–250 users)' },
      { id: 'early-monetization', label: 'Early monetization (first paying customers)' },
      { id: 'building-v2', label: 'Building v2 based on feedback' },
    ],
  },
  {
    id: 'growth',
    label: 'Growth Stage',
    stages: [
      { id: 'targeting-pmf', label: 'Targeting product–market fit' },
      { id: 'users-250-500', label: '250–500 users' },
      { id: 'users-500-1k', label: '500–1000 users' },
      { id: 'users-1k-5k', label: '1K–5K users' },
      { id: 'mrr-growth', label: 'Consistent MRR growth' },
      { id: 'seed-funded', label: 'Seed or Series A funded' },
    ],
  },
  {
    id: 'scale',
    label: 'Scale & Expansion',
    stages: [
      { id: 'series-b', label: 'Series B or beyond' },
      { id: 'scaling-infra', label: 'Scaling team & infrastructure' },
      { id: 'global-suite', label: 'Global presence or multi-product suite' },
    ],
  },
] as const;

// ✅ FIXED: Extract individual stage IDs (not group IDs)
export type StartupStageGroup = (typeof startupStageGroups)[number]["id"];
export type StartupStage = (typeof startupStageGroups)[number]["stages"][number]["id"];

/**
 * ===== TARGET AUDIENCES =====
 */
export const targetAudienceGroups = [
  {
    id: 'founders',
    label: 'Founders & Startup Teams',
    audiences: [
      {
        id: 'early-stage-founders',
        label: 'Early-Stage Founders',
        tags: ['B2B', 'Fast Mover', 'Low Budget'],
      },
      {
        id: 'solopreneurs',
        label: 'Solopreneurs',
        tags: ['B2B', 'Low Budget', 'Emotional Buyer'],
      },
      {
        id: 'startup-teams',
        label: 'Startup Teams',
        tags: ['B2B', 'Technical Buyer', 'Fast Mover'],
      },
      {
        id: 'indie-hackers',
        label: 'Indie Hackers',
        tags: ['B2B', 'Low Budget', 'Fast Mover'],
      },
      {
        id: 'tech-founders',
        label: 'Tech Founders',
        tags: ['B2B', 'Technical Buyer', 'Fast Mover'],
      },
      {
        id: 'non-tech-founders',
        label: 'Non-Tech Founders',
        tags: ['B2B', 'Emotional Buyer', 'Low Budget'],
      },
    ],
  },
  {
    id: 'creators',
    label: 'Creators & Educators',
    audiences: [
      { id: 'content-creators', label: 'Content Creators', tags: ['B2C', 'Low Budget', 'Emotional Buyer'] },
      { id: 'youtubers', label: 'YouTubers', tags: ['B2C', 'Low Budget', 'Fast Mover'] },
      { id: 'newsletter-writers', label: 'Newsletter Writers', tags: ['B2C', 'Low Budget', 'Emotional Buyer'] },
      { id: 'podcasters', label: 'Podcasters', tags: ['B2C', 'Low Budget', 'Emotional Buyer'] },
      { id: 'online-educators', label: 'Online Educators', tags: ['B2C', 'Low Budget'] },
      { id: 'course-creators', label: 'Course Creators', tags: ['B2C', 'Low Budget'] },
      { id: 'coaches-consultants', label: 'Coaches & Consultants', tags: ['B2C', 'Low Budget'] },
      { id: 'cohort-instructors', label: 'Cohort-Based Instructors', tags: ['B2C', 'Low Budget'] },
    ],
  },
  {
    id: 'marketers',
    label: 'Marketers & Agencies',
    audiences: [
      { id: 'growth-hackers', label: 'Growth Hackers', tags: ['B2B', 'Technical Buyer', 'Fast Mover'] },
      { id: 'performance-marketers', label: 'Performance Marketers', tags: ['B2B', 'Technical Buyer', 'High Friction'] },
      { id: 'product-marketers', label: 'Product Marketers', tags: ['B2B', 'Technical Buyer'] },
      { id: 'fractional-cmos', label: 'Fractional CMOs', tags: ['B2B', 'High Friction'] },
      { id: 'freelance-marketers', label: 'Freelance Marketers', tags: ['B2B', 'Low Budget'] },
      { id: 'marketing-agencies', label: 'Marketing Agencies', tags: ['B2B', 'High Friction'] },
      { id: 'design-agencies', label: 'Design Agencies', tags: ['B2B', 'High Friction'] },
      { id: 'no-code-agencies', label: 'No-Code Agencies', tags: ['B2B', 'Fast Mover'] },
    ],
  },
  {
    id: 'businesses',
    label: 'Businesses & Enterprises',
    audiences: [
      { id: 'early-stage-startups', label: 'Early-Stage Startups', tags: ['B2B', 'Fast Mover', 'Low Budget'] },
      { id: 'smbs', label: 'Small Businesses (SMBs)', tags: ['B2B', 'Low Budget'] },
      { id: 'd2c-brands', label: 'D2C Brands', tags: ['B2C', 'High Friction'] },
      { id: 'ecommerce-sellers', label: 'E-commerce Sellers', tags: ['B2C', 'High Friction'] },
      { id: 'local-service-providers', label: 'Local Service Providers', tags: ['B2C', 'Low Budget'] },
      { id: 'mid-market-companies', label: 'Mid-Market Companies', tags: ['B2B', 'Enterprise'] },
      { id: 'non-profits', label: 'Non-Profit Organizations', tags: ['B2B', 'Low Budget', 'High Friction'] },
    ],
  },
  {
    id: 'builders',
    label: 'Builders & Developers',
    audiences: [
      { id: 'developers', label: 'Developers', tags: ['B2B', 'Technical Buyer'] },
      { id: 'no-code-builders', label: 'No-Code Builders', tags: ['B2B', 'Fast Mover'] },
      { id: 'product-managers', label: 'Product Managers', tags: ['B2B', 'Technical Buyer'] },
      { id: 'startup-ctos', label: 'Startup CTOs', tags: ['B2B', 'Technical Buyer', 'Fast Mover'] },
    ],
  },
  {
    id: 'enterprise',
    label: 'Enterprise Teams',
    audiences: [
      { id: 'enterprise-tech-teams', label: 'Enterprise Tech Teams', tags: ['B2B', 'Enterprise', 'Technical Buyer'] },
      { id: 'enterprise-marketing-teams', label: 'Enterprise Marketing Teams', tags: ['B2B', 'Enterprise', 'Technical Buyer'] },
      { id: 'it-decision-makers', label: 'IT Decision Makers', tags: ['B2B', 'Enterprise', 'Technical Buyer'] },
    ],
  },
  {
    id: 'community',
    label: 'Community & Engagement Roles',
    audiences: [
      { id: 'community-managers', label: 'Community Managers', tags: ['B2C', 'Emotional Buyer'] },
    ],
  },
] as const;

// ✅ FIXED: Extract individual audience IDs (not group IDs)
export type TargetAudienceGroup = (typeof targetAudienceGroups)[number]["id"];
export type TargetAudience = (typeof targetAudienceGroups)[number]["audiences"][number]["id"];

/**
 * ===== PRICING MODELS =====
 */
export const pricingModels = [
  {
    id: 'free',
    label: 'Free Forever',
    friction: 'None',
    commitmentOptions: [],
    modifiers: [],
  },
  {
    id: 'freemium',
    label: 'Freemium (limited features)',
    friction: 'Low',
    commitmentOptions: [],
    modifiers: [],
  },
  {
    id: 'trial-free',
    label: 'Free Trial',
    friction: 'Low',
    commitmentOptions: ['no-card', 'card-required'],
    modifiers: ['money-back'],
  },
  {
    id: 'trial-paid',
    label: 'Paid Trial ($1 or more)',
    friction: 'Medium',
    commitmentOptions: ['paid-trial'],
    modifiers: ['money-back'],
  },
  {
    id: 'flat-monthly',
    label: 'Flat Monthly Fee',
    friction: 'Medium',
    commitmentOptions: ['upfront-payment'],
    modifiers: ['money-back', 'discount', 'pay-after-use'],
  },
  {
    id: 'tiered',
    label: 'Tiered Plans (Basic / Pro / Enterprise)',
    friction: 'Medium',
    commitmentOptions: ['upfront-payment'],
    modifiers: ['money-back', 'discount'],
  },
  {
    id: 'per-seat',
    label: 'Per Seat Pricing',
    friction: 'High',
    commitmentOptions: ['upfront-payment', 'annual-only'],
    modifiers: ['money-back', 'discount'],
  },
  {
    id: 'usage-based',
    label: 'Usage-Based Pricing',
    friction: 'High',
    commitmentOptions: ['upfront-payment'],
    modifiers: ['pay-after-use', 'discount'],
  },
  {
    id: 'custom-quote',
    label: 'Custom Quote / Talk to Sales',
    friction: 'High',
    commitmentOptions: ['talk-to-sales'],
    modifiers: ['money-back', 'discount'],
  },
] as const;

// ✅ FIXED: Extract pricing model IDs
export type PricingModel = (typeof pricingModels)[number]["id"];

/**
 * ===== PRICING COMMITMENT OPTIONS =====
 */
export const pricingCommitmentOptions = [
  { id: 'no-card', label: 'Free Trial (No Credit Card)' },
  { id: 'card-required', label: 'Free Trial (Credit Card Required)' },
  { id: 'paid-trial', label: 'Paid Trial ($1 or more)' },
  { id: 'upfront-payment', label: 'Upfront Payment Required' },
  { id: 'annual-only', label: 'Annual Contract Required' },
  { id: 'talk-to-sales', label: 'Talk to Sales' },
] as const;

export type PricingCommitmentOption = (typeof pricingCommitmentOptions)[number]["id"];

/**
 * ===== PRICING MODIFIERS =====
 */
export const pricingModifiers = [
  { id: 'money-back', label: 'Money-Back Guarantee' },
  { id: 'discount', label: 'Discount / Promo Pricing' },
  { id: 'pay-after-use', label: 'Pay After Use' },
] as const;

export type PricingModifier = (typeof pricingModifiers)[number]["id"];

/**
 * ===== AWARENESS LEVELS =====
 */
export const awarenessLevels = [
  {
    id: 'unaware',
    label: 'Unaware',
    description: 'User doesnt know they have a problem yet.',
    persuasionFocus: ['Big Idea', 'Storytelling', 'Vision'],
  },
  {
    id: 'problem-aware',
    label: 'Problem-Aware',
    description: 'User knows the problem but not the solution.',
    persuasionFocus: ['Problem Agitation', 'Before–After', 'Empathy'],
  },
  {
    id: 'solution-aware',
    label: 'Solution-Aware',
    description: 'User knows solutions exist, but not yours.',
    persuasionFocus: ['Benefits', 'Differentiation', 'Trust'],
  },
  {
    id: 'product-aware',
    label: 'Product-Aware',
    description: 'User knows your product but hasnt decided.',
    persuasionFocus: ['How It Works', 'Use Cases', 'Pricing', 'Objection Handling'],
  },
  {
    id: 'most-aware',
    label: 'Most-Aware',
    description: 'User is ready to act — just needs final push.',
    persuasionFocus: ['Guarantee', 'Urgency', 'Final CTA', 'Offer'],
  },
] as const;

export type AwarenessLevel = (typeof awarenessLevels)[number]["id"];

/**
 * ===== MARKET SOPHISTICATION LEVELS =====
 */
export const marketSophisticationLevels = [
  {
    id: 'level-1',
    label: 'Level 1 – Unclaimed Market',
    description: 'Youre first to introduce a solution. Direct benefit-led copy works.',
    copyStrategy: 'Promise the result clearly and confidently.',
    example: '"Eliminates wrinkles instantly."',
  },
  {
    id: 'level-2',
    label: 'Level 2 – Emerging Competition',
    description: 'Competitors exist, but promises are simple. You must differentiate slightly.',
    copyStrategy: 'Highlight speed, ease, or minor advantages.',
    example: '"Eliminates wrinkles faster than any cream."',
  },
  {
    id: 'level-3',
    label: 'Level 3 – Saturated Promises',
    description: 'Market has heard it all. Your promise must come with a unique mechanism.',
    copyStrategy: 'Introduce your "new way" or secret method.',
    example: '"Eliminates wrinkles using hyaluronic nanotech."',
  },
  {
    id: 'level-4',
    label: 'Level 4 – Jaded Market',
    description: 'Everyone claims a mechanism. You must dramatize it or emotionally differentiate.',
    copyStrategy: 'Use storytelling, proof, or user identity as hook.',
    example: '"Used by 10,000 Hollywood makeup artists."',
  },
  {
    id: 'level-5',
    label: 'Level 5 – Saturation & Skepticism',
    description: 'Market is skeptical and emotional. You must lead with values or identity.',
    copyStrategy: 'Sell a belief system, transformation, or tribe.',
    example: '"Wrinkles arent flaws. Join the age-positive movement."',
  },
] as const;

export type MarketSophisticationLevel = (typeof marketSophisticationLevels)[number]["id"];

/**
 * ===== TONE PROFILES =====
 */
export const toneProfiles = [
  {
    id: 'confident-playful',
    label: 'Confident but Playful',
    description: 'Perfect for startups targeting solopreneurs, creators, or modern SaaS audiences. Balances expertise with casual charm.',
    example: "Ready to skip the chaos? Let's get you organized — minus the boring dashboards.",
  },
  {
    id: 'minimal-technical',
    label: 'Minimal and Technical',
    description: 'Ideal for devtools, APIs, or B2B products with engineering or product-led audiences. Clear, no fluff.',
    example: "Deploy scalable infrastructure in seconds. Zero config. Infinite control.",
  },
  {
    id: 'bold-persuasive',
    label: 'Bold and Persuasive',
    description: 'Best for saturated markets or high-friction pricing. Uses urgency, strong claims, and emotional drivers.',
    example: "Stop wasting $3,000/month on tools that don't convert. Switch to the #1 AI-powered funnel engine.",
  },
  {
    id: 'friendly-helpful',
    label: 'Friendly and Helpful',
    description: 'Good fit for support tools, education platforms, and warm B2B use cases. Tone is human and supportive.',
    example: "Need better answers, faster? We've got your team covered — even on weekends.",
  },
  {
    id: 'luxury-expert',
    label: 'Luxury and Expert',
    description: 'Used for premium positioning — financial, legal, enterprise, or luxury products. Emphasizes authority and trust.',
    example: "World-class compliance meets intuitive control. Trusted by top-tier financial institutions.",
  },
] as const;

export type ToneProfile = (typeof toneProfiles)[number]["id"];

/**
 * ===== COPY INTENTS =====
 */
export const copyIntents = ['pain-led', 'desire-led'] as const;

export type CopyIntent = (typeof copyIntents)[number];

/**
 * ===== PROBLEM TYPES =====
 */
export const problemTypes = [
  {
    id: 'manual-repetition',
    label: 'Repetitive Manual Work',
    copyIntent: 'pain-led',
    toneHint: 'Efficient, smart, no-nonsense',
    layoutHint: ['BeforeAfter', 'Features', 'HowItWorks', 'CTA'],
  },
  {
    id: 'burnout-or-overload',
    label: 'Burnout or Overload',
    copyIntent: 'pain-led',
    toneHint: 'Empathetic, calming, supportive',
    layoutHint: ['Story', 'Problem', 'Testimonial', 'CTA'],
  },
  {
    id: 'compliance-or-risk',
    label: 'Compliance or Risk Exposure',
    copyIntent: 'pain-led',
    toneHint: 'Serious, trustworthy, professional',
    layoutHint: ['Problem', 'Proof', 'Features', 'Security', 'CTA'],
  },
  {
    id: 'lost-revenue-or-inefficiency',
    label: 'Lost Revenue or Inefficiency',
    copyIntent: 'pain-led',
    toneHint: 'Urgent, ROI-driven, business-focused',
    layoutHint: ['BeforeAfter', 'ROIProof', 'Features', 'CTA'],
  },
  {
    id: 'creative-empowerment',
    label: 'Creative Empowerment',
    copyIntent: 'desire-led',
    toneHint: 'Playful, bold, inspiring',
    layoutHint: ['Hero', 'Examples', 'Benefits', 'SocialProof', 'CTA'],
  },
  {
    id: 'personal-growth-or-productivity',
    label: 'Personal Growth or Productivity',
    copyIntent: 'desire-led',
    toneHint: 'Aspirational, energetic, clean',
    layoutHint: ['Hero', 'Benefits', 'HowItWorks', 'Comparison', 'CTA'],
  },
  {
    id: 'professional-image-or-branding',
    label: 'Professional Image or Branding',
    copyIntent: 'desire-led',
    toneHint: 'Confident, polished, social-proof heavy',
    layoutHint: ['Hero', 'Logos', 'Testimonials', 'Features', 'CTA'],
  },
  {
    id: 'time-freedom-or-automation',
    label: 'Time Freedom or Automation',
    copyIntent: 'desire-led',
    toneHint: 'Smart, calm, optimistic',
    layoutHint: ['BeforeAfter', 'HowItWorks', 'Benefits', 'CTA'],
  },
] as const;

export type ProblemType = (typeof problemTypes)[number]["id"];

/**
 * ===== UTILITY ARRAYS FOR VALIDATION =====
 * Flat arrays of all valid values for easy validation
 */

// Extract all valid market subcategories across all categories
export const allMarketSubcategories = Object.values(marketSubcategories).flat() as readonly string[];

// Extract all valid startup stages across all groups
export const allStartupStages = startupStageGroups.flatMap(group => 
  group.stages.map(stage => stage.id)
) as readonly string[];

// Extract all valid target audiences across all groups
export const allTargetAudiences = targetAudienceGroups.flatMap(group => 
  group.audiences.map(audience => audience.id)
) as readonly string[];

// Extract all valid landing goal IDs
export const allLandingGoalTypes = landingGoalTypes.map(goal => goal.id) as readonly string[];

// Extract all valid pricing model IDs
export const allPricingModels = pricingModels.map(model => model.id) as readonly string[];

// Extract all valid awareness level IDs
export const allAwarenessLevels = awarenessLevels.map(level => level.id) as readonly string[];

// Extract all valid market sophistication level IDs
export const allMarketSophisticationLevels = marketSophisticationLevels.map(level => level.id) as readonly string[];

// Extract all valid tone profile IDs
export const allToneProfiles = toneProfiles.map(tone => tone.id) as readonly string[];

// Extract all valid problem type IDs
export const allProblemTypes = problemTypes.map(problem => problem.id) as readonly string[];

/**
 * ===== LOOKUP FUNCTIONS =====
 * Helper functions for finding related taxonomy data
 */

/**
 * Get all subcategories for a market category
 */
export const getSubcategoriesForCategory = (category: MarketCategory): readonly string[] => {
  return marketSubcategories[category] || [];
};

/**
 * Get market category for a subcategory
 */
export const getCategoryForSubcategory = (subcategory: string): MarketCategory | null => {
  for (const [category, subcategories] of Object.entries(marketSubcategories)) {
    if (subcategories.includes(subcategory)) {
      return category as MarketCategory;
    }
  }
  return null;
};

/**
 * Get stage group for a startup stage
 */
export const getStageGroupForStage = (stageId: string): StartupStageGroup | null => {
  for (const group of startupStageGroups) {
    if (group.stages.some(stage => stage.id === stageId)) {
      return group.id;
    }
  }
  return null;
};

/**
 * Get all stages for a stage group
 */
export const getStagesForGroup = (groupId: StartupStageGroup): readonly string[] => {
  const group = startupStageGroups.find(g => g.id === groupId);
  return group ? group.stages.map(stage => stage.id) : [];
};

/**
 * Get audience group for a target audience
 */
export const getAudienceGroupForAudience = (audienceId: string): TargetAudienceGroup | null => {
  for (const group of targetAudienceGroups) {
    if (group.audiences.some(audience => audience.id === audienceId)) {
      return group.id;
    }
  }
  return null;
};

/**
 * Get all audiences for an audience group
 */
export const getAudiencesForGroup = (groupId: TargetAudienceGroup): readonly string[] => {
  const group = targetAudienceGroups.find(g => g.id === groupId);
  return group ? group.audiences.map(audience => audience.id) : [];
};

/**
 * Get landing goal data by ID
 */
export const getLandingGoalData = (goalId: LandingGoalType) => {
  return landingGoalTypes.find(goal => goal.id === goalId) || null;
};

/**
 * Get pricing model data by ID
 */
export const getPricingModelData = (modelId: PricingModel) => {
  return pricingModels.find(model => model.id === modelId) || null;
};

/**
 * Get awareness level data by ID
 */
export const getAwarenessLevelData = (levelId: AwarenessLevel) => {
  return awarenessLevels.find(level => level.id === levelId) || null;
};

/**
 * Get market sophistication level data by ID
 */
export const getMarketSophisticationData = (levelId: MarketSophisticationLevel) => {
  return marketSophisticationLevels.find(level => level.id === levelId) || null;
};

/**
 * Get tone profile data by ID
 */
export const getToneProfileData = (toneId: ToneProfile) => {
  return toneProfiles.find(tone => tone.id === toneId) || null;
};

/**
 * Get problem type data by ID
 */
export const getProblemTypeData = (problemId: ProblemType) => {
  return problemTypes.find(problem => problem.id === problemId) || null;
};

/**
 * ===== VALIDATION HELPERS =====
 * Functions to validate taxonomy values at runtime
 */

/**
 * Check if a market category is valid
 */
export const isValidMarketCategory = (value: string): value is MarketCategory => {
  return marketCategories.includes(value as MarketCategory);
};

/**
 * Check if a market subcategory is valid
 */
export const isValidMarketSubcategory = (value: string): value is MarketSubcategory => {
  return allMarketSubcategories.includes(value);
};

/**
 * Check if a startup stage is valid
 */
export const isValidStartupStage = (value: string): value is StartupStage => {
  return allStartupStages.includes(value);
};

/**
 * Check if a target audience is valid
 */
export const isValidTargetAudience = (value: string): value is TargetAudience => {
  return allTargetAudiences.includes(value);
};

/**
 * Check if a landing goal type is valid
 */
export const isValidLandingGoalType = (value: string): value is LandingGoalType => {
  return allLandingGoalTypes.includes(value);
};

/**
 * Check if a pricing model is valid
 */
export const isValidPricingModel = (value: string): value is PricingModel => {
  return allPricingModels.includes(value);
};

/**
 * Check if an awareness level is valid
 */
export const isValidAwarenessLevel = (value: string): value is AwarenessLevel => {
  return allAwarenessLevels.includes(value);
};

/**
 * Check if a market sophistication level is valid
 */
export const isValidMarketSophisticationLevel = (value: string): value is MarketSophisticationLevel => {
  return allMarketSophisticationLevels.includes(value);
};

/**
 * Check if a tone profile is valid
 */
export const isValidToneProfile = (value: string): value is ToneProfile => {
  return allToneProfiles.includes(value);
};

/**
 * Check if a copy intent is valid
 */
export const isValidCopyIntent = (value: string): value is CopyIntent => {
  return copyIntents.includes(value as CopyIntent);
};

/**
 * Check if a problem type is valid
 */
export const isValidProblemType = (value: string): value is ProblemType => {
  return allProblemTypes.includes(value);
};

/**
 * ===== COMBINATION VALIDATORS =====
 * Validate relationships between taxonomy values
 */

/**
 * Check if subcategory belongs to category
 */
export const isValidCategorySubcategoryPair = (
  category: MarketCategory, 
  subcategory: MarketSubcategory
): boolean => {
  return marketSubcategories[category]?.includes(subcategory) || false;
};

/**
 * Check if startup stage belongs to stage group
 */
export const isValidStageGroupStagePair = (
  groupId: StartupStageGroup,
  stageId: StartupStage
): boolean => {
  const group = startupStageGroups.find(g => g.id === groupId);
  return group?.stages.some(stage => stage.id === stageId) || false;
};

/**
 * Check if target audience belongs to audience group
 */
export const isValidAudienceGroupAudiencePair = (
  groupId: TargetAudienceGroup,
  audienceId: TargetAudience
): boolean => {
  const group = targetAudienceGroups.find(g => g.id === groupId);
  return group?.audiences.some(audience => audience.id === audienceId) || false;
};

/**
 * ===== COMPLETE TAXONOMY EXPORT =====
 */
export const taxonomy = {
  // Raw data
  marketCategories,
  marketSubcategories,
  startupStageGroups,
  targetAudienceGroups,
  landingGoalTypes,
  pricingModels,
  pricingModifiers,
  pricingCommitmentOptions,
  awarenessLevels,
  marketSophisticationLevels,
  toneProfiles,
  copyIntents,
  problemTypes,
  
  // Flat arrays for validation
  allMarketSubcategories,
  allStartupStages,
  allTargetAudiences,
  allLandingGoalTypes,
  allPricingModels,
  allAwarenessLevels,
  allMarketSophisticationLevels,
  allToneProfiles,
  allProblemTypes,
  
  // Lookup functions
  getSubcategoriesForCategory,
  getCategoryForSubcategory,
  getStageGroupForStage,
  getStagesForGroup,
  getAudienceGroupForAudience,
  getAudiencesForGroup,
  getLandingGoalData,
  getPricingModelData,
  getAwarenessLevelData,
  getMarketSophisticationData,
  getToneProfileData,
  getProblemTypeData,
  
  // Validators
  isValidMarketCategory,
  isValidMarketSubcategory,
  isValidStartupStage,
  isValidTargetAudience,
  isValidLandingGoalType,
  isValidPricingModel,
  isValidAwarenessLevel,
  isValidMarketSophisticationLevel,
  isValidToneProfile,
  isValidCopyIntent,
  isValidProblemType,
  
  // Combination validators
  isValidCategorySubcategoryPair,
  isValidStageGroupStagePair,
  isValidAudienceGroupAudiencePair,
} as const;
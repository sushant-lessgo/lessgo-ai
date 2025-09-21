// app/api/market-insights/route.ts
import { NextResponse } from "next/server";
import { generateFeatures } from "@/modules/inference/generateFeatures";
import { inferHiddenFields } from "@/modules/inference/inferHiddenFields";
import { generateMockHiddenInferredFields } from '@/modules/mock/mockDataGenerators';

import { logger } from '@/lib/logger';
type FeatureItem = {
  feature: string;
  benefit: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    logger.debug('🔍 Market insights request received');
    const { category, subcategory, problem, audience, startupStage, pricing, landingPageGoals } = body;
    logger.debug('🔍 Request fields validated');
    // Validate required fields
   if (!category || !subcategory || !problem || !audience || !startupStage || !pricing || !landingPageGoals) {

      logger.warn('❌ Missing required fields for market insights');

      return NextResponse.json({ 
        error: "Missing required fields", 
        features: [] 
      }, { status: 400 });
    }

    logger.debug('🚀 Starting market insights generation');

    // Check if we should use mock data
    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      // Using mock data for market insights
      
      // Generate mock features (existing logic)
      const mockFeatures = generateMockFeatures(category, subcategory, problem);
      
      // Generate mock hidden inferred fields (NEW - avoiding embeddings API)
      const validatedFieldsInput = {
        marketCategory: category,
        marketSubcategory: subcategory,
        keyProblem: problem,
        targetAudience: audience,
        startupStage,
        pricingModel: pricing,
        landingPageGoals: landingPageGoals,
      };
      
      logger.debug('🔍 Using mock data for hidden inferred fields (avoiding embeddings API)...');
      const mockHiddenInferredFields = generateMockHiddenInferredFields(validatedFieldsInput);
      logger.debug('✅ Mock hidden inferred fields completed');
      
      return NextResponse.json({ 
        features: mockFeatures,
        hiddenInferredFields: mockHiddenInferredFields
      });
    }

    // Production: Generate features using AI
    const inputData = {
      marketCategory: category,
      marketSubcategory: subcategory,
      keyProblem: problem,
      targetAudience: audience,
      startupStage,
      pricingModel: pricing,
      landingPageGoals: landingPageGoals,
    };

    logger.debug('🤖 Generating features with AI...');

    // Generate features using AI (similar pattern to inferFields)
    const features = await generateFeatures(inputData);

    // Log generated features in detail
    logger.debug('📊 AI-Generated Features:', {
      count: features?.length || 0,
      features: features?.map((f, index) => ({
        index: index + 1,
        feature: f.feature,
        benefit: f.benefit,
        featureLength: f.feature.length,
        benefitLength: f.benefit.length
      })),
      rawFeatures: features
    });

    // Generate hidden copywriting fields using AI market research
    logger.debug('🔍 Performing AI market research for hidden copywriting fields...');
    const hiddenInferredFields = await inferHiddenFields(inputData);

    // Log hidden inferred fields with confidence scores
    logger.debug('🧠 Hidden Inferred Fields (AI Analysis):', {
      awarenessLevel: hiddenInferredFields?.awarenessLevel || 'not inferred',
      copyIntent: hiddenInferredFields?.copyIntent || 'not inferred',
      toneProfile: hiddenInferredFields?.toneProfile || 'not inferred',
      marketSophisticationLevel: hiddenInferredFields?.marketSophisticationLevel || 'not inferred',
      problemType: hiddenInferredFields?.problemType || 'not inferred',
      fieldCount: Object.keys(hiddenInferredFields || {}).length,
      rawHiddenFields: hiddenInferredFields
    });

    // Log how hidden fields map to copywriting strategy
    logger.debug('📝 Copywriting Strategy Mapping:', {
      audience: `${inputData.targetAudience} → Awareness: ${hiddenInferredFields?.awarenessLevel}`,
      messaging: `${hiddenInferredFields?.copyIntent} copy with ${hiddenInferredFields?.toneProfile} tone`,
      market: `Sophistication Level ${hiddenInferredFields?.marketSophisticationLevel}`,
      problem: `${inputData.keyProblem} → Type: ${hiddenInferredFields?.problemType}`,
      approach: hiddenInferredFields?.copyIntent === 'pain-led'
        ? 'Focus on problem agitation and pain points'
        : 'Focus on aspirations and desired outcomes'
    });

    logger.debug('✅ Market insights generation completed');

    // Log the complete response structure
    const responseData = {
      features: features || [],
      hiddenInferredFields: hiddenInferredFields || {}
    };

    logger.debug('📤 Sending Market Insights Response:', {
      featureCount: responseData.features.length,
      hiddenFieldCount: Object.keys(responseData.hiddenInferredFields).length,
      hasAwarenessLevel: !!responseData.hiddenInferredFields.awarenessLevel,
      hasCopyIntent: !!responseData.hiddenInferredFields.copyIntent,
      hasToneProfile: !!responseData.hiddenInferredFields.toneProfile,
      summary: {
        features: responseData.features.map(f => f.feature).join(', '),
        tone: responseData.hiddenInferredFields.toneProfile,
        intent: responseData.hiddenInferredFields.copyIntent
      }
    });

    return NextResponse.json(responseData);

  } catch (err: any) {
    // A09: Security Logging - Safe error handling
    if (process.env.NODE_ENV !== 'production') {
      // Log market insights errors only in development
    }
    
    // Fallback to mock data on error
    try {
      const body = await req.json();
      const { category, subcategory, problem, audience, startupStage, pricing, landingPageGoals } = body;
      
      // AI generation failed, using mock fallback
      const mockFeatures = generateMockFeatures(category, subcategory, problem);
      
      const validatedFieldsInput = {
        marketCategory: category,
        marketSubcategory: subcategory,
        keyProblem: problem,
        targetAudience: audience,
        startupStage,
        pricingModel: pricing,
        landingPageGoals: landingPageGoals,
      };
      
      const mockHiddenInferredFields = generateMockHiddenInferredFields(validatedFieldsInput);
      
      return NextResponse.json({ 
        features: mockFeatures,
        hiddenInferredFields: mockHiddenInferredFields,
        error: 'AI generation failed, using fallback data',
        isPartial: true
      });
    } catch {
      return NextResponse.json({
        features: getDefaultMockFeatures(),
        hiddenInferredFields: {},
        error: 'Complete fallback to default features',
        isPartial: true
      }, { status: 500 });
    }
  }
}

// Keep your existing mock features logic
function generateMockFeatures(category: string, subcategory: string, problem: string): FeatureItem[] {
  const baseFeatures: Record<string, FeatureItem[]> = {
    'Work & Productivity Tools': [
      { feature: "Smart Task Automation", benefit: "Save 5+ hours per week on repetitive work" },
      { feature: "Real-time Team Sync", benefit: "Never miss important updates or deadlines" },
      { feature: "AI-Powered Insights", benefit: "Make data-driven decisions faster" },
      { feature: "Seamless Integrations", benefit: "Connect all your favorite tools in one place" },
    ],
    'Marketing & Sales Tools': [
      { feature: "Advanced Lead Scoring", benefit: "Focus on prospects most likely to convert" },
      { feature: "Automated Follow-ups", benefit: "Never let a potential customer slip through the cracks" },
      { feature: "Performance Analytics", benefit: "Track ROI and optimize campaigns in real-time" },
      { feature: "Multi-channel Outreach", benefit: "Reach prospects where they're most active" },
    ],
    'AI Tools': [
      { feature: "Natural Language Processing", benefit: "Understand and respond to complex queries instantly" },
      { feature: "Machine Learning Models", benefit: "Improve accuracy and predictions over time" },
      { feature: "Custom AI Training", benefit: "Tailor the AI to your specific use case and data" },
      { feature: "Enterprise-grade Security", benefit: "Keep your sensitive data protected and compliant" },
    ],
    'Design & Creative Tools': [
      { feature: "AI-Assisted Design", benefit: "Create professional designs in minutes, not hours" },
      { feature: "Brand Consistency Engine", benefit: "Maintain perfect brand alignment across all assets" },
      { feature: "Collaborative Workspace", benefit: "Get feedback and iterate with your team in real-time" },
      { feature: "Asset Library Management", benefit: "Organize and find your creative assets instantly" },
    ],
  };

  let features = baseFeatures[category] || baseFeatures['Work & Productivity Tools'];
  
  if (problem.toLowerCase().includes('time') || problem.toLowerCase().includes('manual')) {
    features = features.map(f => ({
      ...f,
      benefit: f.benefit.replace('faster', 'in half the time').replace('Save', 'Save up to')
    }));
  }

  return features.slice(0, 4);
}

function getDefaultMockFeatures(): FeatureItem[] {
  return [
    { feature: "Smart Automation", benefit: "Automate repetitive tasks and save time" },
    { feature: "Real-time Analytics", benefit: "Get insights that help you make better decisions" },
    { feature: "Easy Integration", benefit: "Connect with tools you already use" },
    { feature: "24/7 Support", benefit: "Get help whenever you need it" },
  ];
}
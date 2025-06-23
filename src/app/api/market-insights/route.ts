import { NextResponse } from "next/server";
import { generateFeatures } from "@/modules/inference/generateFeatures"; // You'll need to create this
import { validateInferredFields } from "@/modules/inference/validateOutput";

type FeatureItem = {
  feature: string;
  benefit: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, subcategory, problem, audience, startupStage, pricing, goal } = body;

    // Validate required fields
    if (!category || !subcategory || !problem || !audience || !startupStage || !pricing || !goal) {
      return NextResponse.json({ 
        error: "Missing required fields", 
        features: [] 
      }, { status: 400 });
    }

    console.log('🚀 Starting market insights generation for:', { category, subcategory, problem, audience });

    // Check if we should use mock data
    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      console.log("Using mock data for market insights");
      const mockFeatures = generateMockFeatures(category, subcategory, problem);
      return NextResponse.json({ features: mockFeatures });
    }

    // Production: Generate features using AI
    const inputData = {
      marketCategory: category,
      marketSubcategory: subcategory,
      keyProblem: problem,
      targetAudience: audience,
      startupStage,
      pricingModel: pricing,
      landingGoal: goal,
    };

    console.log('🤖 Generating features with AI...');
    
    // Generate features using AI (similar pattern to inferFields)
    const features = await generateFeatures(inputData);
    
    // Validate and enhance with semantic search for hidden fields
    console.log('🔍 Performing semantic validation for hidden inferred fields...');
    const hiddenInferredFields = await validateInferredFields(inputData);
    
    console.log('✅ Market insights generation completed');

    return NextResponse.json({ 
      features: features || [],
      hiddenInferredFields: hiddenInferredFields || {}
    });

  } catch (err: any) {
    console.error('[API] market-insights error:', err);
    
    // Fallback to mock data on error
    try {
      const body = await req.json();
      const { category, subcategory, problem } = body;
      const mockFeatures = generateMockFeatures(category, subcategory, problem);
      
      return NextResponse.json({ 
        features: mockFeatures,
        error: 'AI generation failed, using fallback data',
        isPartial: true
      });
    } catch {
      return NextResponse.json({
        features: getDefaultMockFeatures(),
        error: 'Complete fallback to default features',
        isPartial: true
      }, { status: 500 });
    }
  }
}

// Mock data generator based on input
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

  // Get features for the category, or use default if not found
  let features = baseFeatures[category] || baseFeatures['Work & Productivity Tools'];
  
  // Customize based on problem/subcategory
  if (problem.toLowerCase().includes('time') || problem.toLowerCase().includes('manual')) {
    features = features.map(f => ({
      ...f,
      benefit: f.benefit.replace('faster', 'in half the time').replace('Save', 'Save up to')
    }));
  }

  return features.slice(0, 4); // Return 4 features by default
}

function getDefaultMockFeatures(): FeatureItem[] {
  return [
    { feature: "Smart Automation", benefit: "Automate repetitive tasks and save time" },
    { feature: "Real-time Analytics", benefit: "Get insights that help you make better decisions" },
    { feature: "Easy Integration", benefit: "Connect with tools you already use" },
    { feature: "24/7 Support", benefit: "Get help whenever you need it" },
  ];
}
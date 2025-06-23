import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const DEMO_TOKEN = 'lessgodemomockdata';

// Types matching the save structure
interface ConfirmedFieldData {
  value: string;
  confidence: number;
  alternatives?: string[];
}

interface FeatureItem {
  feature: string;
  benefit: string;
}

interface HiddenInferredFields {
  awarenessLevel?: string;
  copyIntent?: string;
  brandTone?: string;
  layoutPersona?: string;
  [key: string]: string | undefined;
}

interface OnboardingData {
  stepIndex: number;
  confirmedFields: Record<string, ConfirmedFieldData>;
  validatedFields: Record<string, string>;
  featuresFromAI: FeatureItem[];
  hiddenInferredFields: HiddenInferredFields;
}

interface ProjectContent {
  onboarding: OnboardingData;
  finalContent?: any;
  [key: string]: any;
}

export async function GET(req: Request) {
  try {
    // 🔒 Authentication required
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get("tokenId");

    if (!tokenId) {
      return NextResponse.json({ error: "Missing tokenId" }, { status: 400 });
    }

    const isDemo = tokenId === DEMO_TOKEN;

    // 📥 Fetch project with all onboarding data
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: {
        inputText: true,
        content: true,
        themeValues: true,
        title: true,
        userId: true,
        updatedAt: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 🔒 Security check: Ensure user owns the project (skip for demo)
    if (!isDemo) {
      const userRecord = await prisma.user.findUnique({ where: { clerkId } });
      
      if (!userRecord) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (project.userId !== userRecord.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // 🔄 Extract onboarding data with safe defaults
    const content = (project.content as ProjectContent) || {};
    const onboarding = content.onboarding || {};

    const response = {
      // Basic project info
      inputText: project.inputText || "",
      title: project.title || "Untitled Project",
      themeValues: project.themeValues || null,
      
      // Onboarding state for resume
      stepIndex: onboarding.stepIndex || 0,
      confirmedFields: onboarding.confirmedFields || {},
      validatedFields: onboarding.validatedFields || {},
      featuresFromAI: onboarding.featuresFromAI || [],
      hiddenInferredFields: onboarding.hiddenInferredFields || {},
      
      // Final content (if onboarding is complete)
      finalContent: content.finalContent || null,
      
      // Metadata
      lastUpdated: project.updatedAt,
    };

    // 📊 Log load success for debugging
    console.log(`✅ Draft loaded for token: ${tokenId}`, {
      stepIndex: response.stepIndex,
      confirmedFieldsCount: Object.keys(response.confirmedFields).length,
      validatedFieldsCount: Object.keys(response.validatedFields).length,
      featuresCount: response.featuresFromAI.length,
      hiddenFieldsCount: Object.keys(response.hiddenInferredFields).length,
      hasInputText: !!response.inputText,
      hasFinalContent: !!response.finalContent,
    });

    return NextResponse.json(response);

  } catch (err) {
    console.error("[LOAD_DRAFT_ERROR]", err);
    
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: "Failed to load draft", details: errorMessage }, 
      { status: 500 }
    );
  }
}
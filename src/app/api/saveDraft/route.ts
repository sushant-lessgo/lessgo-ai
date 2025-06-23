import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const DEMO_TOKEN = 'lessgodemomockdata';

// Types for onboarding data structure
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
  finalContent?: any; // Final generated page content
  [key: string]: any; // Allow for future extensions
}

export async function POST(req: Request) {
  try {
    // 🔒 Authentication required
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      tokenId, 
      inputText,
      stepIndex = 0,
      confirmedFields = {},
      validatedFields = {},
      featuresFromAI = [],
      hiddenInferredFields = {},
      title,
      themeValues 
    } = body;

    // Validation
    if (!tokenId) {
      return NextResponse.json({ error: 'Missing tokenId' }, { status: 400 });
    }

    const isDemo = tokenId === DEMO_TOKEN;
    let userRecord = null;

    // 🔒 Ensure user exists in DB (skip for demo)
    if (!isDemo) {
      userRecord = await prisma.user.findUnique({ where: { clerkId } });
      if (!userRecord) {
        return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
      }
    }

    // ✅ Ensure token exists
    await prisma.token.upsert({
      where: { value: tokenId },
      create: { value: tokenId },
      update: {},
    });

    // 📥 Get existing project to merge content
    const existingProject = await prisma.project.findUnique({
      where: { tokenId },
      select: { content: true, themeValues: true, title: true }
    });

    // 🔄 Merge strategy: preserve existing data, update onboarding
    const existingContent = (existingProject?.content as ProjectContent) || {};
    const existingOnboarding = existingContent.onboarding || {};

    const updatedOnboarding: OnboardingData = {
      stepIndex,
      confirmedFields: {
        ...existingOnboarding.confirmedFields,
        ...confirmedFields
      },
      validatedFields: {
        ...existingOnboarding.validatedFields,
        ...validatedFields
      },
      featuresFromAI: featuresFromAI.length > 0 ? featuresFromAI : (existingOnboarding.featuresFromAI || []),
      hiddenInferredFields: {
        ...existingOnboarding.hiddenInferredFields,
        ...hiddenInferredFields
      }
    };

    const updatedContent: ProjectContent = {
      ...existingContent,
      onboarding: updatedOnboarding
    };

    // 💾 Upsert project with merged content
    const updatedProject = await prisma.project.upsert({
      where: { tokenId },
      create: {
        tokenId,
        userId: userRecord?.id ?? null,
        title: title || existingProject?.title || 'Untitled Project',
        content: updatedContent,
        inputText: inputText || null,
        themeValues: themeValues || existingProject?.themeValues || null,
        status: 'draft',
      },
      update: {
        title: title || existingProject?.title,
        content: updatedContent,
        inputText: inputText !== undefined ? inputText : undefined,
        themeValues: themeValues !== undefined ? themeValues : undefined,
        updatedAt: new Date(),
      },
    });

    // 📊 Log save success for debugging
    console.log(`✅ Draft saved for token: ${tokenId}`, {
      stepIndex: updatedOnboarding.stepIndex,
      confirmedFieldsCount: Object.keys(updatedOnboarding.confirmedFields).length,
      validatedFieldsCount: Object.keys(updatedOnboarding.validatedFields).length,
      featuresCount: updatedOnboarding.featuresFromAI.length,
      hiddenFieldsCount: Object.keys(updatedOnboarding.hiddenInferredFields).length,
      hasInputText: !!inputText,
    });

    return NextResponse.json({ 
      message: 'Draft saved successfully',
      stepIndex: updatedOnboarding.stepIndex,
      timestamp: updatedProject.updatedAt
    });

  } catch (err) {
    console.error('[SAVE_DRAFT_ERROR]', err);
    
    // Return user-friendly error message
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to save draft', details: errorMessage }, 
      { status: 500 }
    );
  }
}
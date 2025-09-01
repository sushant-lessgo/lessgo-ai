import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { DraftSaveSchema, sanitizeForLogging } from '@/lib/validation';
import { createSecureResponse, verifyProjectAccess } from '@/lib/security';
import { withDraftRateLimit } from '@/lib/rateLimit';

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

// In your api/saveDraft/route.ts file, replace your existing POST function with this:

async function saveDraftHandler(req: NextRequest) {
  try {
    // A01: Broken Access Control - Authentication required
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    
    // A03: Injection Prevention - Validate input
    const validationResult = DraftSaveSchema.safeParse(body);
    if (!validationResult.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: validationResult.error.issues },
        400
      );
    }
    
    const { 
      tokenId, 
      inputText,
      stepIndex = 0,
      confirmedFields = {},
      validatedFields = {},
      featuresFromAI = [],
      hiddenInferredFields = {},
      title,
      themeValues,
      finalContent
    } = validationResult.data;

    const isDemo = tokenId === DEMO_TOKEN;
    let userRecord = null;

    // A01: Broken Access Control - Ensure user exists in DB (skip for demo)
    if (!isDemo) {
      userRecord = await prisma.user.findUnique({ where: { clerkId } });
      if (!userRecord) {
        return createSecureResponse({ error: 'User not found in database' }, 404);
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

    // ✅ NEW: Handle finalContent (complete page data)
    const updatedContent: ProjectContent = {
      ...existingContent,
      onboarding: updatedOnboarding,
    };

    // ✅ CRITICAL FIX: Save the actual page data if provided
    if (finalContent) {
      updatedContent.finalContent = {
        ...existingContent.finalContent,
        ...finalContent,
        lastSaved: new Date().toISOString(),
      };
      
      // A09: Security Logging - Safe logging in development only
      if (process.env.NODE_ENV !== 'production') {
        // Log page data save only in development
      }
    }

    // 💾 Upsert project with merged content
    const updatedProject = await prisma.project.upsert({
      where: { tokenId },
      create: {
        tokenId,
        userId: userRecord?.id ?? null,
        title: title || existingProject?.title || 'Untitled Project',
        content: updatedContent as any,
        inputText: inputText || null,
        themeValues: (themeValues || existingProject?.themeValues || null) as any,
        status: 'draft',
      },
      update: {
        title: title || existingProject?.title,
        content: updatedContent as any,
        inputText: inputText !== undefined ? inputText : undefined,
        themeValues: themeValues !== undefined ? (themeValues as any) : undefined,
        updatedAt: new Date(),
      },
    });

    // A09: Security Logging - Safe logging in development only
    if (process.env.NODE_ENV !== 'production') {
      // Log draft save details only in development
    }

    return createSecureResponse({ 
      message: 'Draft saved successfully',
      stepIndex: updatedOnboarding.stepIndex,
      timestamp: updatedProject.updatedAt,
      hasFinalContent: !!updatedContent.finalContent,
    });

  } catch (err) {
    // A09: Security Logging - Safe error handling
    if (process.env.NODE_ENV !== 'production') {
      // Log save draft errors only in development
    }
    
    // Return user-friendly error message without exposing internals
    return createSecureResponse(
      { error: 'Failed to save draft' }, 
      500
    );
  }
}

// Apply rate limiting to the POST handler
export const POST = withDraftRateLimit(saveDraftHandler);
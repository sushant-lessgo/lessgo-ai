export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createSecureResponse, verifyProjectAccess, validateToken } from '@/lib/security';
import { isAdmin } from '@/lib/admin';

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
  toneProfile?: string;
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
    // A01: Broken Access Control - Authentication required
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get("tokenId");

    // A03: Injection Prevention - Validate token format
    if (!tokenId || !validateToken(tokenId)) {
      return createSecureResponse({ error: "Invalid or missing tokenId" }, 400);
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
        audienceType: true,
        templateId: true,
        variantId: true,
        paletteId: true,
      },
    });

    if (!project) {
      return createSecureResponse({ error: "Project not found" }, 404);
    }

    // A01: Broken Access Control - Ensure user owns the project (skip for demo, admins bypass read-only)
    if (!isDemo && !isAdmin(clerkId)) {
      const userRecord = await prisma.user.findUnique({ where: { clerkId } });

      if (!userRecord) {
        return createSecureResponse({ error: 'User not found' }, 404);
      }

      if (!await verifyProjectAccess(userRecord.id, project.userId, tokenId)) {
        return createSecureResponse({ error: 'Access denied' }, 403);
      }
    }

    // 🔄 Extract onboarding data with safe defaults
    const content = (project.content as ProjectContent) || {};
    const onboarding = content.onboarding || {};

    // 🔧 BACKWARD COMPATIBILITY: Detect legacy data format
    // Legacy format: { layout, sections, content } at top level
    // New format: { onboarding, finalContent }
    let finalContent = null;

    if (content.finalContent) {
      // New format - data wrapped in finalContent
      finalContent = content.finalContent;
    } else if (content.layout || content.sections) {
      // Legacy format - entire content is the page data
      // Extract only page-related fields, exclude onboarding
      const { onboarding: _onboarding, ...legacyPageData } = content;
      finalContent = legacyPageData;
    }

    const response = {
      // Basic project info
      inputText: project.inputText || "",
      title: project.title || "Untitled Project",
      themeValues: project.themeValues || null,
      audienceType: project.audienceType || 'product',
      templateId: project.templateId || null,
      variantId: project.variantId || null,
      paletteId: project.paletteId || null,

      // Onboarding state for resume
      stepIndex: onboarding.stepIndex || 0,
      confirmedFields: onboarding.confirmedFields || {},
      validatedFields: onboarding.validatedFields || {},
      featuresFromAI: onboarding.featuresFromAI || [],
      hiddenInferredFields: onboarding.hiddenInferredFields || {},

      // Final content (supports both new and legacy formats)
      finalContent: finalContent,

      // Metadata
      lastUpdated: project.updatedAt,
    };

    // A09: Security Logging - Safe logging in development only
    if (process.env.NODE_ENV !== 'production') {
      // Log draft load success only in development
    }

    return createSecureResponse(response);

  } catch (err) {
    // A09: Security Logging - Safe error handling
    if (process.env.NODE_ENV !== 'production') {
      // Log load draft errors only in development
    }
    
    return createSecureResponse(
      { error: "Failed to load draft" }, 
      500
    );
  }
}
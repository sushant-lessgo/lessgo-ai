export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { DraftSaveSchema, sanitizeForLogging } from '@/lib/validation';
import { BriefSchema } from '@/lib/schemas/brief.schema';
import { createSecureResponse, assertProjectOwner } from '@/lib/security';
import { withDraftRateLimit } from '@/lib/rateLimit';
import { isAdminClerkId } from '@/lib/admin';
import { logger } from '@/lib/logger';
import {
  collectElements,
  computeNextBaseline,
  captureEditDeltas,
  type Baseline,
  type CollectedElement,
} from '@/lib/editDelta/capture';

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
      finalContent,
      paletteId,
      templateId,
      variantId,
      localeConfig
    } = validationResult.data;

    const isDemo = tokenId === DEMO_TOKEN;
    let userRecord: { id: string } | null = null;

    // A01: Broken Access Control - Enforce project ownership before writing (skip for demo).
    // The token identifies which project; it is not proof of ownership. assertProjectOwner denies
    // non-owner writes (403), claims orphan rows for the first authed writer, and lets the caller
    // create-and-own a brand-new token (allowMissing) so the upsert create branch below still works.
    if (!isDemo) {
      const access = await assertProjectOwner(clerkId, tokenId, {
        action: 'saveDraft',
        claimIfOrphan: true,
        allowMissing: true,
      });
      if (!access.ok) {
        return createSecureResponse({ error: access.error }, access.status);
      }
      userRecord = access.userRecord;
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
      // data-capture (Phase 2): + aiBaseline / templateId / audienceType for the
      // edit-delta baseline freeze. Owner clerkId is NOT selected: assertProjectOwner
      // above guarantees the saver IS the project owner (or first-writer orphan-claim),
      // so the authed `clerkId` already equals the owner's clerkId — no extra lookup.
      select: {
        content: true,
        themeValues: true,
        title: true,
        brief: true,
        aiBaseline: true,
        templateId: true,
        audienceType: true,
      },
    });

    // scale-04: optional Brief passthrough. DraftSaveSchema strips unknown keys,
    // so read `brief` from the raw body (same pattern as `baseline` above) and
    // validate against BriefSchema (partial — every field optional; at minimum
    // goal + socialProfiles). Invalid shape → skip the brief write, keep the
    // rest of the draft save (conservative: never fail an autosave over brief).
    // Valid → shallow-merge over any existing brief so other fields survive.
    let updatedBrief: any = undefined;
    if (body.brief !== undefined) {
      const briefResult = BriefSchema.partial().safeParse(body.brief);
      if (briefResult.success) {
        updatedBrief = {
          ...((existingProject?.brief as Record<string, unknown>) ?? {}),
          ...briefResult.data,
        };
      }
    }

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
    //
    // i18n-phase-1 (D1) — localeContent MERGE MECHANISM #1 (spread-ride):
    // The locale text overlay (`finalContent.localeContent`) lives INSIDE
    // finalContent and rides this shallow `...finalContent` spread. Consequence:
    //  - payload OMITS `localeContent`  ⇒ key absent from spread ⇒ the stored map
    //    is PRESERVED (an autosave that doesn't touch locales can't wipe it);
    //  - payload INCLUDES `localeContent` ⇒ the WHOLE map is REPLACED.
    // This is safe ONLY because of the store-side invariant (Phase 3a): every
    // save that includes localeContent exports the COMPLETE map — all locales,
    // all pages' overlays. Do NOT add per-locale deep-merge here; correctness
    // depends on the overlay riding this existing spread verbatim.
    if (finalContent) {
      updatedContent.finalContent = {
        ...existingContent.finalContent,
        ...(finalContent as Record<string, unknown>),
        lastSaved: new Date().toISOString(),
      };
      
      // A09: Security Logging - Safe logging in development only
      if (process.env.NODE_ENV !== 'production') {
        // Log page data save only in development
      }
    }

    // ✅ Baseline snapshot (edit-header Reset): REPLACE wholesale when present
    // — never deep-merge (it's an immutable point-in-time export). Absent →
    // preserved automatically via the ...existingContent spread above.
    // Read from the raw body: DraftSaveSchema strips unknown keys, and
    // baseline carries the same trust level as finalContent (z.unknown()).
    if (body.baseline !== undefined) {
      updatedContent.baseline = body.baseline;
    }

    // i18n-phase-1 (D4) — localeConfig MERGE MECHANISM #2 (top-level). CLEAR-
    // CONTRACT (Phase-4 fix, REVISES the original absent-preserve-only rule):
    //   undefined ⇒ PRESERVE the stored config (via the `...existingContent`
    //               spread — legacy autosaves that don't touch locales, unchanged);
    //   null      ⇒ CLEAR (assign null; a locale removed back to single-locale
    //               must not resurrect on reload) — schema is `.nullable().optional()`;
    //   object    ⇒ REPLACE wholesale (like `baseline`, never deep-merged).
    // The `!== undefined` guard already distinguishes all three: null falls into
    // the assign branch and overwrites with null. Validated by DraftSaveSchema, so
    // read the parsed value (not raw body). (The paired localeContent CLEAR — an
    // explicit `{}` — rides the finalContent spread above and replaces the stored
    // map; loadDraft returns `localeConfig ?? null`, so a cleared config reads back
    // as null = legacy.)
    if (localeConfig !== undefined) {
      updatedContent.localeConfig = localeConfig;
    }

    // data-capture (Phase 2): compute the next AI baseline.
    //  - Additive first-sight freeze from the incoming finalContent (the initial
    //    generation fan-out saves each page BEFORE the user can edit — those
    //    values ARE the AI baseline).
    //  - Regen re-freeze via `aiBaselinePatch`: read from the RAW body (same
    //    pattern as `baseline` above — DraftSaveSchema strips unknown keys).
    // Only write the `aiBaseline` column when it actually changed (skip rewriting
    // a large JSON on every 1s autosave). Legacy projects with no aiBaseline: the
    // first save freezes current (possibly already-edited) text as baseline —
    // accepted for the minimum build.
    // Demo token (`lessgodemomockdata`) is a shared, un-owned mock project — its
    // saves would write aiBaseline + EditDelta rows that are pure dataset noise.
    // Skip baseline freeze AND capture entirely for demo; the normal draft save
    // still proceeds. (Same `isDemo` that bypasses assertProjectOwner above.)
    const aiBaselinePatch = body.aiBaselinePatch as
      | Record<string, Record<string, string>>
      | undefined;
    let nextAiBaseline: Baseline | undefined;
    let aiBaselineChanged = false;
    let collectedElements: CollectedElement[] = [];
    if (!isDemo && (finalContent || aiBaselinePatch !== undefined)) {
      if (finalContent) {
        collectedElements = collectElements(finalContent);
      }
      const storedBaseline = (existingProject?.aiBaseline as Baseline | null) ?? null;
      const res = computeNextBaseline(storedBaseline, collectedElements, aiBaselinePatch);
      nextAiBaseline = res.next;
      aiBaselineChanged = res.changed;
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
        paletteId: paletteId ?? null,
        templateId: templateId ?? null,
        variantId: variantId ?? null,
        brief: updatedBrief as any,
        // data-capture: write baseline only when it changed (else leave null).
        aiBaseline: aiBaselineChanged ? (nextAiBaseline as any) : undefined,
        status: 'draft',
      },
      update: {
        title: title || existingProject?.title,
        content: updatedContent as any,
        inputText: inputText !== undefined ? inputText : undefined,
        themeValues: themeValues !== undefined ? (themeValues as any) : undefined,
        paletteId: paletteId !== undefined ? paletteId : undefined,
        templateId: templateId !== undefined ? templateId : undefined,
        variantId: variantId !== undefined ? variantId : undefined,
        brief: updatedBrief !== undefined ? (updatedBrief as any) : undefined,
        // data-capture: skip the column write on autosaves that didn't change it.
        aiBaseline: aiBaselineChanged ? (nextAiBaseline as any) : undefined,
        updatedAt: new Date(),
      },
    });

    // data-capture (Phase 2): diff collected elements vs the next baseline and
    // persist EditDelta rows. Wrapped — a capture failure must NEVER fail an
    // autosave (same conservatism as the brief passthrough above). Only meaningful
    // when finalContent was present (patch-only saves have nothing to diff).
    if (nextAiBaseline && collectedElements.length > 0) {
      try {
        await captureEditDeltas({
          prisma,
          tokenId,
          baseline: nextAiBaseline,
          collected: collectedElements,
          templateId: templateId ?? existingProject?.templateId ?? null,
          audienceType: existingProject?.audienceType ?? null,
          // Saver == owner (assertProjectOwner), so the authed clerkId is the owner's.
          isFounderEdit: isAdminClerkId(clerkId),
        });
      } catch (captureErr) {
        logger.warn('[data-capture] edit-delta capture failed (autosave unaffected):', captureErr as Error);
      }
    }

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
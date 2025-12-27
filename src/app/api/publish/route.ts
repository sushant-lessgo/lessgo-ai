// app/api/publish/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublishSchema, sanitizeForLogging } from '@/lib/validation';
import { createSecureResponse, validateSlug, sanitizeHtmlContent, verifyProjectAccess } from '@/lib/security';
import { withPublishRateLimit } from '@/lib/rateLimit';
import { getUserPlan, checkLimit } from '@/lib/planManager';
import { generateThemeCSS } from '@/lib/themeUtils';
import React from 'react';
import { LandingPagePublishedRenderer } from '@/modules/generatedLanding/LandingPagePublishedRenderer';

async function publishHandler(req: NextRequest) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const host = req.headers.get("host") || "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  try {
    // A01: Broken Access Control - Authentication required
    const { userId } = await auth();

    if (!userId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const body = await req.json();
    
    // A03: Injection Prevention - Validate input
    const validationResult = PublishSchema.safeParse(body);
    if (!validationResult.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: validationResult.error.issues },
        400
      );
    }
    
    const { slug, title, content, themeValues, tokenId, inputText, previewImage } = validationResult.data;

    // A04: Insecure Design - Validate slug security
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return createSecureResponse({ error: slugValidation.error }, 400);
    }

    // 🔍 Get the project to link to published page
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true }
    });

    // SERVER-SIDE RENDERING: Generate HTML from content structure
    // Dynamic import to bypass Next.js build-time module analysis
    const { renderToString } = await import('react-dom/server');

    const reactHtml = renderToString(
      React.createElement(LandingPagePublishedRenderer, {
        sections: content.layout.sections,
        content: content.content,
        theme: content.layout.theme,
      })
    );

    const themeCSS = generateThemeCSS({
      primary: content.layout.theme?.colors?.accentColor || '#3B82F6',
      background: content.layout.theme?.colors?.sectionBackgrounds?.primary || '#FFFFFF',
      muted: content.layout.theme?.colors?.textSecondary || '#6B7280'
    });

    const htmlContent = `${themeCSS}${reactHtml}`;

    // 🔍 Check for existing published page
    const existing = await prisma.publishedPage.findUnique({ where: { slug } });

    if (existing) {
      if (existing.userId !== userId) {
        return createSecureResponse({ error: 'Slug already taken' }, 409);
      }

      await prisma.publishedPage.update({
        where: { slug },
        data: {
          htmlContent,  // Server-side rendered HTML
          title,
          content: content as any,
          themeValues: themeValues as any,
          projectId: project?.id || null,
          previewImage: previewImage || null,
          updatedAt: new Date()
        }
      });
    } else {
      // Check published pages limit before creating new page
      const currentPublishedCount = await prisma.publishedPage.count({
        where: { userId, isPublished: true }
      });

      const limitCheck = await checkLimit(userId, 'publishedPages', currentPublishedCount);
      if (!limitCheck.allowed) {
        return createSecureResponse({
          error: 'Published pages limit reached',
          message: `Your plan allows up to ${limitCheck.limit} published page(s). Upgrade to publish more.`,
          limit: limitCheck.limit,
          current: currentPublishedCount
        }, 403);
      }

      await prisma.publishedPage.create({
        data: {
          userId,
          slug,
          htmlContent,  // Server-side rendered HTML
          title,
          content: content as any,
          themeValues: themeValues as any,
          projectId: project?.id || null,
          previewImage: previewImage || null
        }
      });
    }

    await prisma.token.upsert({
  where: { value: tokenId },
  create: { value: tokenId },
  update: {},
});
    // A09: Security Logging - Safe logging in development only
    if (process.env.NODE_ENV !== 'production') {
      // Log publishing details only in development
    }


    // ✅ 🔁 Always upsert into Project as well
    await prisma.project.upsert({
      where: { tokenId },
      create: {
        tokenId,
        userId,
        title: title || 'Untitled',
        content: content as any,
        inputText,
        status: 'published',
      },
      update: {
        title,
        content: content as any,
        inputText,
        status: 'published',
        updatedAt: new Date(),
      },
    });

    return createSecureResponse({
      message: 'Page published successfully',
      url: `https://${slug}.lessgo.ai`,
    });

  } catch (err) {
    // A09: Security Logging - Safe error handling
    if (process.env.NODE_ENV !== 'production') {
      // Log publish errors only in development
    }
    return createSecureResponse({ error: 'Internal Server Error' }, 500);
  }
}

// Apply rate limiting to the POST handler
export const POST = withPublishRateLimit(publishHandler);

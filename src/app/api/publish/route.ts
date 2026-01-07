// app/api/publish/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublishSchema, sanitizeForLogging } from '@/lib/validation';
import { createSecureResponse, validateSlug, sanitizeHtmlContent, verifyProjectAccess } from '@/lib/security';
import { withPublishRateLimit } from '@/lib/rateLimit';
import { getUserPlan, checkLimit } from '@/lib/planManager';
import { stripHTMLTags } from '@/utils/smartTitleGenerator';

// Force Node.js runtime for ReactDOMServer support
export const runtime = 'nodejs';

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

    // Sanitize title - strip HTML tags for meta/OG image safety
    const cleanTitle = stripHTMLTags(title || '').trim().slice(0, 100) || 'Untitled Page';

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

    // Phase 2: No longer generating htmlContent - using dynamic rendering
    // Published pages now render on-demand via React Server Components

    // 🔍 Check for existing published page
    const existing = await prisma.publishedPage.findUnique({ where: { slug } });

    if (existing) {
      if (existing.userId !== userId) {
        return createSecureResponse({ error: 'Slug already taken' }, 409);
      }

      await prisma.publishedPage.update({
        where: { slug },
        data: {
          htmlContent: '',  // Phase 2: Empty for dynamic rendering
          title: cleanTitle,
          content: content as any,
          themeValues: themeValues as any,
          projectId: project?.id || null,
          ...(previewImage !== undefined && { previewImage }),
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
          htmlContent: '',  // Phase 2: Empty for dynamic rendering
          title: cleanTitle,
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
        title: cleanTitle,
        content: content as any,
        inputText,
        status: 'published',
      },
      update: {
        title: cleanTitle,
        content: content as any,
        inputText,
        status: 'published',
        updatedAt: new Date(),
      },
    });

    // Phase 1: Static HTML generation (testing only)
    if (process.env.ENABLE_STATIC_EXPORT === 'true') {
      try {
        const { generateStaticHTML } = await import('@/lib/staticExport/htmlGenerator');

        // Extract description from hero section
        const heroSection = content.layout?.sections?.[0];
        const heroContent = content[heroSection];
        const description =
          heroContent?.elements?.subheadline?.content ||
          heroContent?.elements?.headline?.content ||
          cleanTitle;

        const staticHTML = await generateStaticHTML({
          sections: content.layout.sections,
          content: content,
          theme: content.layout.theme,
          publishedPageId: existing?.id || 'new-page-id',
          pageOwnerId: userId,
          slug,
          title: cleanTitle,
          description: typeof description === 'string' ? description.slice(0, 160) : cleanTitle.slice(0, 160),
          previewImage,
          analyticsOptIn: false,
          baseURL: baseUrl,
        });

        // Phase 1: Log metadata only (don't save yet)
        console.log('[Phase 1] Static HTML generated:', {
          size: `${(staticHTML.metadata.size / 1024).toFixed(2)} KB`,
          fonts: staticHTML.metadata.fonts,
          cssVariables: staticHTML.metadata.cssVariableCount,
        });

        // Phase 2 will: Upload to Blob, update KV routing
      } catch (error) {
        console.error('[Phase 1] Static export failed:', error);
        // Don't block publish - legacy SSR still works
      }
    }

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

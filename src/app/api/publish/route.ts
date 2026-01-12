export const dynamic = 'force-dynamic';

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
    
    const { slug, title, content, themeValues, tokenId, inputText, previewImage, analyticsEnabled } = validationResult.data;

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
          analyticsEnabled: analyticsEnabled || false, // Phase 4
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
          previewImage: previewImage || null,
          analyticsEnabled: analyticsEnabled || false, // Phase 4
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

    // Phase 2: Static HTML generation + Blob upload (always runs)
    const startTime = Date.now();
    let uploadedBlobKey: string | null = null;

    try {
      // Get page ID (use existing or newly created)
      const publishedPage = await prisma.publishedPage.findUnique({ where: { slug } });
      const pageId = publishedPage?.id;

      if (!pageId) {
        throw new Error('Failed to get published page ID');
      }

      // Idempotency guard: prevent double-publish
      const currentPage = await prisma.publishedPage.findUnique({
        where: { id: pageId },
        select: { publishState: true }
      });

      if (currentPage?.publishState === 'publishing') {
        console.warn('[Phase 2] Page already publishing:', pageId);
        // Don't throw - let it continue (may be retry after network error)
      }

      // Set publishing state
      await prisma.publishedPage.update({
        where: { id: pageId },
        data: { publishState: 'publishing' }
      });

      // Generate HTML
      const { generateStaticHTML } = await import('@/lib/staticExport/htmlGenerator');
      const { uploadStaticSite } = await import('@/lib/staticExport/blobUploader');
      const { cleanupOldVersions } = await import('@/lib/staticExport/versionCleanup');
      const { del } = await import('@vercel/blob');

      // Extract description from hero section
      const contentData = content as any;

      // 🔥 REQUIRED: flatten nested section content
      // Published renderer expects flat structure, not nested content.content
      if (contentData.content && typeof contentData.content === 'object') {
        Object.assign(contentData, contentData.content);
        delete contentData.content;
      }

      // 🔥 REQUIRED: ensure forms exist at root
      if (!contentData.forms) {
        contentData.forms = {};
      }

      const heroSection = contentData.layout?.sections?.[0];
      const heroContent = contentData[heroSection];
      const description =
        heroContent?.elements?.subheadline?.content ||
        heroContent?.elements?.headline?.content ||
        cleanTitle;

      const staticHTML = await generateStaticHTML({
        sections: contentData.layout.sections,
        content: contentData,
        theme: contentData.layout.theme,
        publishedPageId: pageId,
        pageOwnerId: userId,
        slug,
        title: cleanTitle,
        description: typeof description === 'string' ? description.slice(0, 160) : cleanTitle.slice(0, 160),
        previewImage,
        analyticsOptIn: analyticsEnabled || false, // Phase 4
        baseURL: baseUrl,
      });

      // Upload to blob with timeout protection
      const uploadPromise = uploadStaticSite({
        pageId,
        html: staticHTML.html,
        assetBundleVersion: 'v1',
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Blob upload timeout after 15s')), 15000)
      );

      const { version, blobKey, blobUrl, sizeBytes } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]);

      uploadedBlobKey = blobKey;

      // Validate upload response
      if (!version || !blobKey || !blobUrl) {
        throw new Error('Invalid blob upload response');
      }

      // Create version record
      const newVersion = await prisma.publishedPageVersion.create({
        data: {
          publishedPageId: pageId,
          version,
          blobKey,
          blobUrl,
          sizeBytes,
          status: 'active',
        }
      });

      // Update page with current version pointer
      await prisma.publishedPage.update({
        where: { id: pageId },
        data: {
          publishState: 'published',
          currentVersionId: newVersion.id,
          lastPublishAt: new Date(),
          analyticsEnabled: analyticsEnabled || false, // Phase 4
          htmlContent: '', // Clear legacy field (save DB space)
        },
      });

      // === PHASE 3: UPDATE KV ROUTING ===
      // Add after successful DB update
      try {
        const { atomicPublish } = await import('@/lib/routing/kvRoutes');

        // Build domain list (currently only {slug}.lessgo.ai)
        // Phase 5 will add custom domains from DB
        const domains = [`${slug}.lessgo.ai`];

        // CRITICAL: Pass blobUrl (not blobKey) to KV
        // This allows proxy to fetch directly without head() API call
        await atomicPublish(
          pageId,
          domains,
          version,
          blobUrl  // Use blobUrl from upload result, not blobKey
        );

        // Minimal logging (only in dev)
        if (process.env.NODE_ENV === 'development') {
          console.log('[Phase 3] KV routing updated:', {
            pageId,
            version,
            domains,
          });
        }
      } catch (kvError) {
        // Don't fail publish if KV update fails
        // Middleware will fall back to SSR
        console.error('[Phase 3] KV update failed (non-critical):', kvError);
      }

      const duration = Date.now() - startTime;
      console.log('[Phase 2] Blob uploaded:', {
        version,
        blobKey,
        size: `${(sizeBytes / 1024).toFixed(2)} KB`,
        duration: `${duration}ms`,
      });

      // Cleanup old versions AFTER successful publish (fire-and-forget)
      cleanupOldVersions(pageId, 10).catch(err => {
        console.error('[Cleanup Error]', err);
      });

    } catch (error) {
      console.error('[Phase 2] Static export failed:', error);

      // Rollback: delete uploaded blob if DB update failed
      if (uploadedBlobKey) {
        try {
          const { del } = await import('@vercel/blob');
          await del(uploadedBlobKey);
          console.log('[Rollback] Deleted orphaned blob:', uploadedBlobKey);
        } catch (delErr) {
          console.error('[Rollback] Failed to delete blob:', delErr);
        }
      }

      // Set failed state
      const publishedPage = await prisma.publishedPage.findUnique({ where: { slug } });
      if (publishedPage) {
        await prisma.publishedPage.update({
          where: { id: publishedPage.id },
          data: {
            publishState: 'failed',
            publishError: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }

      // Don't block publish - legacy SSR still works
      console.warn('[Phase 2] Continuing with legacy publish despite static export failure');
    }

    return createSecureResponse({
      message: 'Page published successfully',
      url: `https://${slug}.lessgo.ai`,
    });

  } catch (err) {
  console.error('[publish] fatal error:', err);
  return createSecureResponse({ error: 'Internal Server Error' }, 500);
}
}

// Apply rate limiting to the POST handler
export const POST = withPublishRateLimit(publishHandler);

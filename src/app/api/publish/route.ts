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
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import * as Sentry from '@sentry/nextjs';

// Force Node.js runtime for ReactDOMServer support
export const runtime = 'nodejs';

// Multi-page shared chrome (Phase 2): inject the project's shared header/footer
// into a page's { layout:{sections}, content } so every frozen/generated page is
// self-contained. Header prepended, footer appended; idempotent.
function injectChromeIntoPage(layout: any, contentMap: any, chrome: any) {
  if (!chrome || !layout || !contentMap) return;
  const sections: string[] = Array.isArray(layout.sections) ? layout.sections : [];
  const without = sections.filter(
    (id) => !(chrome.header && id === chrome.header.id) && !(chrome.footer && id === chrome.footer.id),
  );
  const next: string[] = [];
  if (chrome.header?.id) {
    next.push(chrome.header.id);
    contentMap[chrome.header.id] = chrome.header.data;
  }
  next.push(...without);
  if (chrome.footer?.id) {
    next.push(chrome.footer.id);
    contentMap[chrome.footer.id] = chrome.footer.data;
  }
  layout.sections = next;
}

// First body (non-header/footer) hero section id, for meta description.
function findHeroId(sections: string[] = []): string | undefined {
  return sections.find((id) => /^hero/i.test(id)) || sections.find((id) => !/^(header|footer)/i.test(id));
}

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
    Sentry.setUser({ id: userId });

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

    // Sanitize: strip excluded elements, set required defaults
    if (content && typeof content === 'object') {
      sanitizeContentForPublish(content as Record<string, any>);
    }

    // Multi-page (Phase 2): inject shared chrome into the root + every subpage so
    // each frozen/generated page contains the same header/footer. Done BEFORE the
    // DB write + static export so published routes need no chrome logic.
    {
      const c = content as any;
      const chrome = c?.chrome;
      if (chrome && (chrome.header || chrome.footer)) {
        if (c.layout && c.content) injectChromeIntoPage(c.layout, c.content, chrome);
        const subs = c.subpages && typeof c.subpages === 'object' ? c.subpages : {};
        for (const sub of Object.values(subs) as any[]) {
          if (sub?.layout && sub?.content) injectChromeIntoPage(sub.layout, sub.content, chrome);
        }
      }
    }

    // Sanitize title - strip HTML tags for meta/OG image safety
    const cleanTitle = stripHTMLTags(title || '').trim().slice(0, 100) || 'Untitled Page';

    // A04: Insecure Design - Validate slug security
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return createSecureResponse({ error: slugValidation.error }, 400);
    }

    // 🔍 Get the project to link to published page (also pull audienceType +
    // template/variant/palette so service projects ship with the right tokens).
    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { id: true, audienceType: true, templateId: true, variantId: true, paletteId: true }
    });

    const audienceType: 'product' | 'service' = project?.audienceType === 'service' ? 'service' : 'product';
    const templateId: string | null = project?.templateId ?? null;
    const variantId: string | null = project?.variantId ?? null;
    const paletteId: string | null = project?.paletteId ?? null;

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
          audienceType,
          templateId,
          variantId,
          paletteId,
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
          audienceType,
          templateId,
          variantId,
          paletteId,
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


    // ✅ 🔁 Mark the Project published — but DO NOT overwrite Project.content.
    // Project.content is the editor DRAFT (onboarding + finalContent.pages). The
    // published snapshot lives in PublishedPage.content. Clobbering the draft with
    // the (pages-less) publish payload destroyed multi-page structure on next edit
    // (the catalog/products vanished). The editor autosaves the draft separately
    // (and preview now force-saves before publish), so we only flip status/title.
    await prisma.project.upsert({
      where: { tokenId },
      create: {
        tokenId,
        userId,
        title: cleanTitle,
        inputText,
        status: 'published',
      },
      update: {
        title: cleanTitle,
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

      // Resolve the canonical host once, BEFORE generation: use the custom domain only
      // when it's already live, else leave undefined so the generator falls back to the
      // {slug}.lessgo.ai subdomain. Reused below for the KV domain list. (Domains that go
      // live AFTER publish are handled by verify-dns regenerating the HTML.)
      const canonicalDomain =
        publishedPage?.customDomain && publishedPage.customDomainStatus === 'live'
          ? publishedPage.customDomain
          : undefined;

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

      const heroSection = findHeroId(contentData.layout?.sections);
      const heroContent = heroSection ? contentData[heroSection] : undefined;
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
        audienceType,
        templateId,
        paletteId,
        variantId,
        canonicalDomain,
        canonicalPath: '/',
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

      // === MULTI-PAGE: render + upload each subpage under the SAME version ===
      // Subpages live in content.subpages[pathSlug] = { layout:{sections,theme}, content }.
      // Shared forms/legalPages/theme come from the root content.
      const allBlobs: Array<{ path: string; blobKey: string; blobUrl: string; sizeBytes: number }> = [
        { path: '/', blobKey, blobUrl, sizeBytes },
      ];
      const extraRoutes: Record<string, string> = {};
      const subpages =
        contentData.subpages && typeof contentData.subpages === 'object' ? contentData.subpages : {};

      for (const [rawPath, sub] of Object.entries(subpages) as Array<[string, any]>) {
        try {
          const path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
          if (path === '/') continue; // root already published above
          const pageName = path.replace(/^\//, '').replace(/\/$/, '') || 'index';

          const subSections: string[] = sub?.layout?.sections || [];
          const subTheme = sub?.layout?.theme || contentData.layout.theme;
          const subFlat = {
            ...(sub?.content || {}),
            forms: contentData.forms || {},
            legalPages: contentData.legalPages,
          };
          const subHero = subFlat[findHeroId(subSections) || ''];
          const subDesc =
            subHero?.elements?.subheadline?.content ||
            subHero?.elements?.headline?.content ||
            sub?.title ||
            cleanTitle;

          const subHtml = await generateStaticHTML({
            sections: subSections,
            content: subFlat,
            theme: subTheme,
            publishedPageId: pageId,
            pageOwnerId: userId,
            slug,
            title: sub?.title || cleanTitle,
            description: typeof subDesc === 'string' ? subDesc.slice(0, 160) : cleanTitle.slice(0, 160),
            previewImage,
            analyticsOptIn: analyticsEnabled || false,
            baseURL: baseUrl,
            audienceType,
            templateId,
            paletteId,
            variantId,
            canonicalDomain,
            canonicalPath: path,
          });

          const subUpload = await uploadStaticSite({
            pageId,
            html: subHtml.html,
            assetBundleVersion: 'v1',
            version, // share the root's version
            pageName,
          });

          allBlobs.push({ path, blobKey: subUpload.blobKey, blobUrl: subUpload.blobUrl, sizeBytes: subUpload.sizeBytes });
          extraRoutes[path] = subUpload.blobUrl;
        } catch (subErr) {
          // A failed subpage must not block the rest of the publish.
          console.error('[Phase 2] Subpage render/upload failed:', rawPath, subErr);
        }
      }

      const totalSizeBytes = allBlobs.reduce((sum, b) => sum + b.sizeBytes, 0);

      // Create version record — ONE version covers all pages; per-page blobs in metadata.
      const newVersion = await prisma.publishedPageVersion.create({
        data: {
          publishedPageId: pageId,
          version,
          blobKey,
          blobUrl,
          sizeBytes: totalSizeBytes,
          status: 'active',
          metadata: { blobs: allBlobs } as any,
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

      // === PHASE 3: UPDATE KV ROUTING WITH RETRY & VERIFICATION ===
      // Add after successful DB update
      try {
        const { atomicPublishWithRetry, writeRedirect, writeSlugForHost, removeRedirect } = await import('@/lib/routing/kvRoutes');

        // Build domain list — includes custom domain when live (resolved once above).
        const domains = [`${slug}.lessgo.ai`];
        if (canonicalDomain) domains.push(canonicalDomain);

        // CRITICAL: Pass blobUrl (not blobKey) to KV
        // This allows proxy to fetch directly without head() API call
        console.log('[Phase 3] Updating KV routing with retry & verification:', {
          pageId,
          slug,
          domains,
          version,
        });

        const kvResult = await atomicPublishWithRetry(
          pageId,
          domains,
          version,
          blobUrl,  // Use blobUrl from upload result, not blobKey
          { maxRetries: 3, baseDelay: 1000, extraRoutes }  // extraRoutes = subpage paths → blobUrls
        );

        console.log('[Phase 3] ✓ KV routing updated successfully:', {
          pageId,
          version,
          domains,
          attempts: kvResult.attempts,
          verified: kvResult.verified,
        });

        // Re-assert subdomain → custom domain 301 + slug-for fallback on every republish
        if (canonicalDomain) {
          try {
            await writeRedirect(`${slug}.lessgo.ai`, `https://${canonicalDomain}`, 301);
            await writeSlugForHost(canonicalDomain, slug);
          } catch (e) {
            console.error('[Phase 3] writeRedirect/writeSlugForHost failed (non-fatal)', e);
          }
        } else {
          // Self-heal: no live custom domain → clear any STALE subdomain→custom-domain
          // redirect so {slug}.lessgo.ai serves its own page. Without this, a redirect:
          // KV entry left over from a removed custom domain or a DB wipe survives and the
          // middleware 301s the subdomain to a dead/wrong target (e.g. test1 → kundius...).
          try {
            await removeRedirect(`${slug}.lessgo.ai`);
          } catch (e) {
            console.error('[publish] removeRedirect (stale) failed (non-fatal)', e);
          }
        }

      } catch (kvError) {
        // CRITICAL: KV update failed after retries - this is a fatal error
        // Without KV entry, the page won't be accessible via subdomain
        const errorMsg = kvError instanceof Error ? kvError.message : 'Unknown KV error';

        console.error('[Phase 3] ❌ CRITICAL: KV update failed after all retries:', {
          error: errorMsg,
          pageId,
          slug,
          blobUrl,
        });

        Sentry.captureException(kvError, {
          level: 'fatal',
          tags: { area: 'publish-kv' },
          extra: { pageId, slug, blobUrl },
          user: { id: userId },
        });

        // Set failed state in DB
        await prisma.publishedPage.update({
          where: { id: pageId },
          data: {
            publishState: 'failed',
            publishError: `KV routing update failed: ${errorMsg}`,
          },
        });

        // Return error to user - don't silently fail
        throw new Error(
          `Failed to update routing. The page was generated but is not accessible. Error: ${errorMsg}`
        );
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
      Sentry.captureException(error, {
        tags: { area: 'publish', phase: 'static-export' },
        extra: { slug },
        user: { id: userId },
      });

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
  Sentry.captureException(err, { tags: { area: 'publish', phase: 'fatal' } });
  return createSecureResponse({ error: 'Internal Server Error' }, 500);
}
}

// Apply rate limiting to the POST handler
export const POST = withPublishRateLimit(publishHandler);

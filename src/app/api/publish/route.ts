export const dynamic = 'force-dynamic';

// app/api/publish/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PublishSchema, sanitizeForLogging, sanitizeSeo } from '@/lib/validation';
import { createSecureResponse, validateSlug, sanitizeHtmlContent, verifyProjectAccess } from '@/lib/security';
import { withPublishRateLimit } from '@/lib/rateLimit';
import { getUserPlan, checkLimit, hasTrackingPixels, getPlanConfig, PlanTier } from '@/lib/planManager';
import { stripHTMLTags } from '@/utils/smartTitleGenerator';
import { sanitizeContentForPublish } from '@/modules/sections/layoutElementSchema';
import { publishedSubdomainHost, publishSubdomainHosts } from '@/lib/domains/hosts';
import { isAdmin, logAdminOverride } from '@/lib/admin';
import { injectChromeIntoPage } from '@/lib/staticExport/injectChrome';
import { findLocaleSubpageCollision } from '@/lib/i18n/localeSlugCollision';
import type { LocaleConfig } from '@/types/core/content';
import * as Sentry from '@sentry/nextjs';

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

    // SEO (Phase 2): sanitize the per-page seo blobs in place — user-controlled
    // strings that get baked into the published <head>. Invalid/hostile blobs are
    // dropped (never fail the publish); https-only URLs enforced by the schema.
    if (content && typeof content === 'object') {
      const c = content as any;
      c.seo = sanitizeSeo(c.seo);
      const subs = c.subpages && typeof c.subpages === 'object' ? c.subpages : {};
      for (const sub of Object.values(subs) as any[]) {
        if (sub && typeof sub === 'object') sub.seo = sanitizeSeo(sub.seo);
      }
    }

    // Tracking pixels Pro gate — strip, don't fail; runs before the DB write so
    // all republish paths (custom-domain go-live etc.) inherit the clean content.
    if (content && typeof content === 'object' && !(await hasTrackingPixels(userId))) {
      const c = content as any;
      if (c.seo && typeof c.seo === 'object') {
        delete c.seo.metaPixelId;
        delete c.seo.ga4MeasurementId;
      }
      const subs = c.subpages && typeof c.subpages === 'object' ? c.subpages : {};
      for (const sub of Object.values(subs) as any[]) {
        if (sub?.seo && typeof sub.seo === 'object') {
          delete sub.seo.metaPixelId;
          delete sub.seo.ga4MeasurementId;
        }
      }
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
      select: { id: true, audienceType: true, templateId: true, variantId: true, paletteId: true, themeValues: true, content: true }
    });

    // i18n-phase-1 (D4/Phase 6): the AUTHORITATIVE locale declaration + text
    // overlay live in Project.content (top-level `localeConfig`, and the overlay
    // at `finalContent.localeContent`) — exactly where saveDraft persists them,
    // and preview force-saves before publishing so this read is fresh. The
    // publish REQUEST `content` (built from the store's page export) carries
    // neither key, so we source both from the DB here. Absent ⇒ legacy
    // single-locale ⇒ renderPublishedExport runs its single default-locale pass
    // exactly as before (byte-identical, no locale docs, no extra routes).
    const projectContent = (project?.content ?? null) as any;
    const localeConfig: LocaleConfig | null = projectContent?.localeConfig ?? null;
    const projectLocaleContent = projectContent?.finalContent?.localeContent;

    // i18n-phase-1 (Phase 6): reserved-path collision guard. A multi-page subpage
    // slug that equals a declared NON-DEFAULT locale code would collide with that
    // locale's `/{loc}` doc on the same KV route key. Reject the publish with a
    // clear error. No-op for single-locale projects (guard is gated on
    // isMultiLocale inside the helper), so existing publishes are unaffected.
    {
      const subs = (content as any)?.subpages;
      const subpagePaths = subs && typeof subs === 'object' ? Object.keys(subs) : [];
      const collision = findLocaleSubpageCollision(subpagePaths, localeConfig);
      if (collision) {
        return createSecureResponse(
          {
            error: `The subpage path "/${collision}" conflicts with the "${collision}" language route. Rename that page or remove the language.`,
          },
          400,
        );
      }
    }

    const audienceType: 'product' | 'service' | 'writer' =
      project?.audienceType === 'service' ? 'service'
      : project?.audienceType === 'writer' ? 'writer'
      : 'product';
    const templateId: string | null = project?.templateId ?? null;
    const variantId: string | null = project?.variantId ?? null;
    const paletteId: string | null = project?.paletteId ?? null;
    // Neutral mood (vestria) lives in Project.themeValues.mood — the client's
    // publish payload themeValues is the legacy color record and doesn't carry
    // it. Merge it into what we store on PublishedPage so the SSR fallback +
    // verify-dns regeneration read the same value the static HTML was baked with.
    const projectMood: string | null =
      typeof (project?.themeValues as any)?.mood === 'string'
        ? (project!.themeValues as any).mood
        : null;
    // Knob selection (template-factory phase 9) lives in Project.themeValues.knobs
    // (hybrid look storage — no flat column). The client publish payload themeValues
    // is the legacy color record and doesn't carry it, so read it off the project and
    // (a) feed it into the static-export render and (b) persist it on PublishedPage so
    // the SSR fallback + verify-dns regeneration bake the same knob CSS. Unset drafts
    // (no knobs key) stay byte-identical — default knob values emit no CSS.
    const projectKnobs: import('@/types/template').KnobSelection | null =
      project?.themeValues && typeof (project.themeValues as any).knobs === 'object' && (project.themeValues as any).knobs !== null
        ? (project.themeValues as any).knobs
        : null;
    // User style tokens (work-skeleton D1/§D) live in Project.themeValues.styleTokens
    // (per-section Design ▾ overrides — JSON, no flat column). Like knobs, the client
    // publish payload themeValues doesn't carry them, so read them off the project and
    // (a) feed them into the static-export render and (b) persist them on PublishedPage
    // so the SSR fallback + verify-dns regeneration bake the same `--u-*` CSS. Unset
    // drafts (no styleTokens key) stay byte-identical — serializer emits nothing.
    const projectStyleTokens: import('@/modules/skeletons/styleTokens').StyleTokens | null =
      project?.themeValues && typeof (project.themeValues as any).styleTokens === 'object' && (project.themeValues as any).styleTokens !== null
        ? (project.themeValues as any).styleTokens
        : null;
    const themeValuesWithMood = projectMood
      ? { ...((themeValues as Record<string, any> | undefined) ?? {}), mood: projectMood }
      : themeValues;
    const themeValuesWithKnobs = projectKnobs
      ? { ...((themeValuesWithMood as Record<string, any> | undefined) ?? {}), knobs: projectKnobs }
      : themeValuesWithMood;
    const publishedThemeValues = projectStyleTokens
      ? { ...((themeValuesWithKnobs as Record<string, any> | undefined) ?? {}), styleTokens: projectStyleTokens }
      : themeValuesWithKnobs;

    // Phase 2: No longer generating htmlContent - using dynamic rendering
    // Published pages now render on-demand via React Server Components

    // 🔍 Check for existing published page
    const existing = await prisma.publishedPage.findUnique({ where: { slug } });

    if (existing) {
      if (existing.userId !== userId) {
        // Owner mismatch: reject unless the actor is an admin (support/ops override). Admins may
        // republish a customer's page; ownership is NOT rewritten (the update below never touches
        // userId), so the customer stays the owner. Every override is audit-logged.
        if (!isAdmin(userId)) {
          return createSecureResponse({ error: 'Slug already taken' }, 409);
        }
        await logAdminOverride({ actorClerkId: userId, ownerId: existing.userId, action: 'publish', resource: { slug } });
      }

      await prisma.publishedPage.update({
        where: { slug },
        data: {
          htmlContent: '',  // Phase 2: Empty for dynamic rendering
          title: cleanTitle,
          content: content as any,
          themeValues: publishedThemeValues as any,
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
        // DD0b: isPublished is @default(true) on every row (no writer), so it counted
        // draft rows too. Slot predicate = publishState !== 'draft'.
        where: { userId, publishState: { not: 'draft' } }
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
          themeValues: publishedThemeValues as any,
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

      // Resolve the canonical host once, BEFORE generation: use the custom domain when it has
      // gone live, else leave undefined so the generator falls back to the {slug}.lessgo.site
      // subdomain. Reused below for the KV domain list. (Domains that go live AFTER publish are
      // handled by verify-dns regenerating the HTML.)
      //
      // Gate on the DURABLE customDomainLiveAt marker (set once at go-live, cleared only on
      // domain removal) in addition to status === 'live'. customDomainStatus can silently drift
      // to 'failed' (e.g. GET /api/domains/status's regression check on a flaky Vercel
      // `misconfigured` reading for apex domains); without this fallback a republish would drop
      // the custom domain from the KV write and strand it on the old blob forever.
      const domainHasGoneLive =
        !!publishedPage?.customDomain &&
        (publishedPage.customDomainStatus === 'live' || publishedPage.customDomainLiveAt != null);
      const canonicalDomain = domainHasGoneLive ? publishedPage!.customDomain! : undefined;

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

      // Generate + upload the page (root + all subpages) and advance the version pointer.
      // Shared with the custom-domain go-live path (verify-dns) via renderPublishedExport so
      // both use one generation path (canonical/og:url resolution, subpage loop, versioning).
      const { renderPublishedExport } = await import('@/lib/staticExport/renderPublishedExport');
      const { cleanupOldVersions } = await import('@/lib/staticExport/versionCleanup');

      // i18n (Phase 6): the non-default-locale text overlay lives in the DB
      // (Project.content.finalContent.localeContent), NOT in the publish request
      // `content`. renderPublishedExport reads it off `content.localeContent`
      // (project-global, keyed by unique sectionId) when resolving each locale
      // doc, so seed it here. Only set when present ⇒ single-locale publishes
      // stay byte-identical (no key added).
      if (projectLocaleContent && content && typeof content === 'object') {
        (content as any).localeContent = projectLocaleContent;
      }

      // pricing-v2 (phase 2): suppress the "Made with Lessgo" badge only when the
      // page OWNER's plan has removeBranding (Pro/LTD). userId here is the owner.
      // CONFIG-DERIVED ON PURPOSE — do NOT use hasFeature('removeBranding'): its
      // test (`=== true || !== 'none'`) returns true for a boolean `false`
      // (`false !== 'none'`), so it fails OPEN and would strip the badge for FREE.
      // Resolve the tier and read the flag straight from PLAN_CONFIGS (same pattern
      // as hasTrackingPixels). Any error ⇒ false ⇒ badge shown (fail-closed).
      let removeBranding = false;
      try {
        const ownerPlan = await getUserPlan(userId);
        removeBranding = getPlanConfig(ownerPlan.tier as PlanTier)?.features.removeBranding === true;
      } catch (brandingErr) {
        console.warn('[publish] removeBranding lookup failed (defaulting to branded):', brandingErr);
      }

      const { version, blobKey, blobUrl, sizeBytes, extraRoutes } = await renderPublishedExport({
        pageId,
        userId,
        slug,
        content,
        title: cleanTitle,
        previewImage,
        analyticsEnabled: analyticsEnabled || false,
        audienceType,
        templateId,
        variantId,
        paletteId,
        mood: projectMood,
        knobs: projectKnobs,
        styleTokens: projectStyleTokens,
        baseUrl,
        canonicalDomain,
        removeBranding,
        // i18n (Phase 6): drives the per-locale fan-out. Absent/single-locale ⇒
        // renderPublishedExport's single default-locale pass (byte-identical).
        localeConfig,
      });

      // For the outer catch's rollback: if a step AFTER generation (KV wiring) fails, the
      // orphaned blob is deleted. (Failures DURING generation self-clean inside the helper.)
      uploadedBlobKey = blobKey;

      // === PHASE 3: UPDATE KV ROUTING WITH RETRY & VERIFICATION ===
      // Add after successful DB update
      try {
        const { atomicPublishWithRetry, writeRedirect, writeSlugForHost, removeRedirect } = await import('@/lib/routing/kvRoutes');

        // Build domain list — publish subdomains (new lessgo.site + legacy lessgo.ai)
        // plus the custom domain when live (resolved once above).
        const domains = [...publishSubdomainHosts(slug)];
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

        // Re-assert subdomain → custom domain 301 + slug-for fallback on every republish.
        // Both publish subdomains (lessgo.site + legacy lessgo.ai) redirect to the custom domain.
        if (canonicalDomain) {
          try {
            for (const sub of publishSubdomainHosts(slug)) {
              await writeRedirect(sub, `https://${canonicalDomain}`, 301);
            }
            await writeSlugForHost(canonicalDomain, slug);
          } catch (e) {
            console.error('[Phase 3] writeRedirect/writeSlugForHost failed (non-fatal)', e);
          }
        } else {
          // Self-heal: no live custom domain → clear any STALE subdomain→custom-domain
          // redirect so each {slug} subdomain serves its own page. Without this, a redirect:
          // KV entry left over from a removed custom domain or a DB wipe survives and the
          // middleware 301s the subdomain to a dead/wrong target (e.g. test1 → kundius...).
          try {
            for (const sub of publishSubdomainHosts(slug)) {
              await removeRedirect(sub);
            }
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

      // Blog (Phase 1): re-render published posts + /blog index with the fresh
      // chrome/theme/canonical (fire-and-forget, self-contained errors — must
      // never delay or fail the site publish).
      import('@/lib/blog/publishBlogPost')
        .then(({ syncBlogAfterSitePublish }) => syncBlogAfterSitePublish(pageId, baseUrl))
        .catch(err => console.error('[blog] sync after publish failed (non-fatal):', err));

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
      url: `https://${publishedSubdomainHost(slug)}`,
    });

  } catch (err) {
  console.error('[publish] fatal error:', err);
  Sentry.captureException(err, { tags: { area: 'publish', phase: 'fatal' } });
  return createSecureResponse({ error: 'Internal Server Error' }, 500);
}
}

// Apply rate limiting to the POST handler
export const POST = withPublishRateLimit(publishHandler);

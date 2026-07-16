export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { getDomainConfig, VercelApiError } from '@/lib/vercel/domains';
import { checkDomainRateLimit } from '@/lib/rateLimit';
import { writeRedirect, atomicPublishWithRetry, writeSlugForHost } from '@/lib/routing/kvRoutes';
import { publishSubdomainHosts } from '@/lib/domains/hosts';
import { renderPublishedExport } from '@/lib/staticExport/renderPublishedExport';
import { getUserPlan, getPlanConfig, PlanTier } from '@/lib/planManager';
import { isAdmin, logAdminOverride } from '@/lib/admin';
import * as Sentry from '@sentry/nextjs';

const BodySchema = z.object({ slug: z.string().min(1).max(100) });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  const page = await prisma.publishedPage.findUnique({
    where: { slug: parse.data.slug },
    select: {
      id: true,
      userId: true,
      slug: true,
      customDomain: true,
      customDomainStatus: true,
      currentVersion: { select: { version: true, blobUrl: true } },
      // For regenerating the static HTML with the custom domain baked into canonical/og:url:
      content: true,
      title: true,
      previewImage: true,
      analyticsEnabled: true,
      audienceType: true,
      templateId: true,
      variantId: true,
      paletteId: true,
      themeValues: true,
    },
  });
  if (!page) return createSecureResponse({ error: 'Page not found' }, 404);
  if (page.userId !== userId) {
    if (!isAdmin(userId)) return createSecureResponse({ error: 'Forbidden' }, 403);
    await logAdminOverride({ actorClerkId: userId, ownerId: page.userId, action: 'domain.verify-dns', resource: { slug: page.slug, domain: page.customDomain } });
  }
  if (!page.customDomain) return createSecureResponse({ error: 'No custom domain' }, 400);
  if (page.customDomainStatus === 'live') {
    return createSecureResponse({ status: 'live', domain: page.customDomain });
  }
  if (page.customDomainStatus !== 'pending_dns' && page.customDomainStatus !== 'issuing_ssl') {
    return createSecureResponse(
      { error: 'Ownership not verified yet', status: page.customDomainStatus },
      409
    );
  }

  const rl = checkDomainRateLimit(page.customDomain);
  if (!rl.allowed) {
    return createSecureResponse({ error: 'Too many verify attempts', retryAfter: rl.retryAfter }, 429);
  }

  let cfg;
  try {
    cfg = await getDomainConfig(page.customDomain);
  } catch (e) {
    const err = e as VercelApiError;
    Sentry.captureException(e, {
      tags: { area: 'custom-domain', op: 'getDomainConfig', code: err?.code || 'unknown' },
      extra: { domain: page.customDomain },
      user: { id: userId },
    });
    return createSecureResponse({ error: err?.code || 'vercel_error', message: err?.message }, 502);
  }

  if (cfg.misconfigured) {
    // DNS not ready yet; advance to issuing_ssl after first pass-through or stay pending_dns
    await prisma.publishedPage.update({
      where: { id: page.id },
      data: { customDomainStatus: 'pending_dns', customDomainError: 'dns_misconfigured' },
    });
    return createSecureResponse({
      status: 'pending_dns',
      misconfigured: true,
      expected: { aValues: cfg.aValues, cnames: cfg.cnames, nameservers: cfg.nameservers },
    });
  }

  // DNS good. If not yet live, mark issuing_ssl then live in one call.
  // Vercel cert issuance is automatic once DNS is correct; we transition to live here.
  const subdomainHosts = publishSubdomainHosts(page.slug);
  const customHost = page.customDomain;

  await prisma.publishedPage.update({
    where: { id: page.id },
    data: {
      customDomainStatus: 'live',
      customDomainLiveAt: new Date(),
      customDomainError: null,
    },
  });

  // Regenerate the static HTML with the custom domain baked into canonical/og:url (+ per-page
  // paths for subpages), now that the domain is live — otherwise the served blob keeps claiming
  // the {slug}.lessgo.ai subdomain until the user happens to republish. Only if the page was
  // actually published; a regen failure must NOT block go-live (status is already 'live').
  let rebuilt: Awaited<ReturnType<typeof renderPublishedExport>> | null = null;
  if (page.currentVersion) {
    // pricing-v2 (phase 2): keep the badge decision consistent with the publish
    // route on this go-live republish — resolve the OWNER's (page.userId, not the
    // acting admin's) removeBranding flag config-derived (NOT hasFeature, which
    // fails open on boolean-false). Custom domains are Pro-only, so this is
    // normally true; fail-closed to branded on any error.
    let removeBranding = false;
    try {
      const ownerPlan = await getUserPlan(page.userId);
      removeBranding = getPlanConfig(ownerPlan.tier as PlanTier)?.features.removeBranding === true;
    } catch (brandingErr) {
      console.warn('[verify-dns] removeBranding lookup failed (defaulting to branded):', brandingErr);
    }
    try {
      rebuilt = await renderPublishedExport({
        pageId: page.id,
        userId: page.userId,
        slug: page.slug,
        content: page.content,
        title: page.title ?? page.slug,
        previewImage: page.previewImage,
        analyticsEnabled: page.analyticsEnabled,
        audienceType: page.audienceType === 'service' ? 'service' : 'product',
        templateId: page.templateId,
        variantId: page.variantId,
        paletteId: page.paletteId,
        // Mood was merged into PublishedPage.themeValues at publish time —
        // pass it through so the go-live regeneration doesn't drop it.
        mood: (page.themeValues as any)?.mood ?? null,
        // Style tokens (work-skeleton D1/§D) were likewise merged into
        // PublishedPage.themeValues at publish time — thread them through so the
        // custom-domain go-live regen bakes the same `--u-*` CSS. Absent ⇒ null ⇒
        // byte-identical.
        styleTokens: (page.themeValues as any)?.styleTokens ?? null,
        baseUrl: 'https://lessgo.ai',
        canonicalDomain: customHost,
        removeBranding,
      });
    } catch (e) {
      console.error('[verify-dns] canonical regen failed (non-fatal)', e);
      Sentry.captureException(e, {
        tags: { area: 'custom-domain', op: 'canonical-regen' },
        extra: { domain: customHost, slug: page.slug },
        user: { id: userId },
      });
    }
  }

  // Wire KV: slug-for (SSR fallback, always) + route (static blob, if published) + redirect (subdomain → custom)
  try {
    // 1. slug-for — FIRST + unconditional. Enables SSR fallback even if static export failed.
    await writeSlugForHost(customHost, page.slug);

    // 2. static blob route — prefer the freshly-regenerated version (correct canonical + subpage
    //    routes); fall back to the existing version if regen didn't run or failed.
    const routeVersion = rebuilt?.version ?? page.currentVersion?.version;
    const routeBlobUrl = rebuilt?.blobUrl ?? page.currentVersion?.blobUrl;
    if (routeBlobUrl && routeVersion) {
      await atomicPublishWithRetry(
        page.id,
        [customHost],
        routeVersion,
        routeBlobUrl,
        { maxRetries: 3, baseDelay: 500, extraRoutes: rebuilt?.extraRoutes }
      );
    }

    // 3. 301 from each publish subdomain (lessgo.site + legacy lessgo.ai) → custom domain
    for (const sub of subdomainHosts) {
      await writeRedirect(sub, `https://${customHost}`, 301);
    }
  } catch (e) {
    console.error('[verify-dns] KV wiring failed', e);
    Sentry.captureException(e, {
      tags: { area: 'custom-domain', op: 'kv-wiring' },
      extra: { domain: customHost, slug: page.slug },
      user: { id: userId },
    });
    // Non-fatal for status — user can republish to repair
  }

  // Blog (Phase 1): re-render published posts + /blog index so their canonical/og
  // point at the now-live custom domain, and emit their routes on the new host
  // (fire-and-forget, self-contained errors — must never delay/fail go-live).
  import('@/lib/blog/publishBlogPost')
    .then(({ syncBlogAfterSitePublish }) => syncBlogAfterSitePublish(page.id, 'https://lessgo.ai'))
    .catch((e) => console.error('[verify-dns] blog sync failed (non-fatal):', e));

  return createSecureResponse({ status: 'live', domain: customHost });
}

import 'server-only';

import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { generateStaticHTML } from './htmlGenerator';
import { uploadStaticSite } from './blobUploader';
import { buildPageMetadata } from './buildPageMetadata';

/**
 * Render + upload a published page (root + all subpages) and advance its version pointer.
 *
 * This is the single generation path shared by:
 *  - POST /api/publish            (a normal publish/republish)
 *  - POST /api/domains/verify-dns (regenerate when a custom domain goes live, so canonical/
 *    og:url flip from the {slug}.lessgo.ai subdomain to the live custom domain)
 *
 * It deliberately does NOT do credit checks, KV routing, cleanupOldVersions, or blob rollback —
 * those stay in each caller (the seam is clean: KV only needs the returned version/blobUrl/
 * extraRoutes). `content` is the RAW nested PublishedPage.content shape; this fn flattens it in
 * place exactly as the publish route always has.
 */
export interface RenderPublishedExportInput {
  pageId: string;
  userId: string;
  slug: string;
  /** Raw nested content (PublishedPage.content / publish request `content`). Flattened here. */
  content: any;
  title: string;
  previewImage?: string | null;
  analyticsEnabled: boolean;
  audienceType: 'product' | 'service';
  templateId: string | null;
  variantId: string | null;
  paletteId: string | null;
  baseUrl: string;
  /** Live custom domain (no scheme) to bake into canonical/og:url; undefined → subdomain. */
  canonicalDomain?: string;
}

export interface RenderPublishedExportResult {
  version: string;
  blobKey: string;
  blobUrl: string;
  sizeBytes: number;
  totalSizeBytes: number;
  allBlobs: Array<{ path: string; blobKey: string; blobUrl: string; sizeBytes: number }>;
  extraRoutes: Record<string, string>;
  newVersionId: string;
}

export async function renderPublishedExport(
  input: RenderPublishedExportInput
): Promise<RenderPublishedExportResult> {
  const {
    pageId,
    userId,
    slug,
    title: cleanTitle,
    previewImage,
    analyticsEnabled,
    audienceType,
    templateId,
    variantId,
    paletteId,
    baseUrl,
    canonicalDomain,
  } = input;

  // Extract description from hero section
  const contentData = input.content as any;

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

  const rootMeta = buildPageMetadata({
    slug,
    pageTitle: cleanTitle,
    content: contentData, // already flattened above; carries content.seo when set
    previewImage,
    canonicalDomain,
    canonicalPath: '/',
    baseUrl,
  });

  const staticHTML = await generateStaticHTML({
    sections: contentData.layout.sections,
    content: contentData,
    theme: contentData.layout.theme,
    publishedPageId: pageId,
    pageOwnerId: userId,
    slug,
    title: rootMeta.title,
    description: rootMeta.description,
    previewImage: previewImage ?? undefined,
    seo: contentData.seo,
    faviconUrl: rootMeta.faviconUrl,
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
    timeoutPromise,
  ]);

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
      const subMeta = buildPageMetadata({
        slug,
        pageTitle: sub?.title || cleanTitle,
        content: { ...subFlat, layout: { sections: subSections } },
        previewImage,
        canonicalDomain,
        canonicalPath: path,
        baseUrl,
        seo: sub?.seo, // subpage seo lives on the sub entry, not inside its content
        rootSeo: contentData.seo, // favicon cascades from the root
      });

      const subHtml = await generateStaticHTML({
        sections: subSections,
        content: subFlat,
        theme: subTheme,
        publishedPageId: pageId,
        pageOwnerId: userId,
        slug,
        title: subMeta.title,
        description: subMeta.description,
        previewImage: previewImage ?? undefined,
        seo: sub?.seo,
        faviconUrl: subMeta.faviconUrl,
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

  // Persist the version + advance the pointer. If either DB write fails after we've already
  // uploaded blobs, delete those orphaned blobs before rethrowing so nothing is leaked (the
  // publish route's own rollback used to own this via an early uploadedBlobKey assignment;
  // since the upload now lives here, the cleanup does too).
  let newVersion: { id: string };
  try {
    // Create version record — ONE version covers all pages; per-page blobs in metadata.
    newVersion = await prisma.publishedPageVersion.create({
      data: {
        publishedPageId: pageId,
        version,
        blobKey,
        blobUrl,
        sizeBytes: totalSizeBytes,
        status: 'active',
        metadata: { blobs: allBlobs } as any,
      },
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
  } catch (dbErr) {
    for (const b of allBlobs) {
      try {
        await del(b.blobKey);
      } catch (delErr) {
        console.error('[renderPublishedExport] Failed to delete orphaned blob:', b.blobKey, delErr);
      }
    }
    throw dbErr;
  }

  return {
    version,
    blobKey,
    blobUrl,
    sizeBytes,
    totalSizeBytes,
    allBlobs,
    extraRoutes,
    newVersionId: newVersion.id,
  };
}

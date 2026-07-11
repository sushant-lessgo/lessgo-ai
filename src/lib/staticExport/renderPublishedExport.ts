import 'server-only';

import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { generateStaticHTML } from './htmlGenerator';
import { getPublishedGoal } from './getPublishedGoal';
import { uploadStaticSite } from './blobUploader';
import { buildPageMetadata } from './buildPageMetadata';
import { buildStructuredData, serializeJsonLd, extractLogoUrl } from './structuredData';
import { isReservedBlogPath } from '@/utils/reservedPaths';
import { findFormPagePath, type CtaPageInput } from '@/utils/normalizeCtas';
import { resolveCanonicalURL } from './canonicalUrl';
import { resolveLocaleElements, isMultiLocale } from '@/lib/i18n/localeContent';
import type { LocaleConfig } from '@/types/core/content';

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
  audienceType: 'product' | 'service' | 'writer';
  templateId: string | null;
  variantId: string | null;
  paletteId: string | null;
  /** Neutral mood (vestria; Project.themeValues.mood). Optional — omitting it
   *  renders the default (bone). */
  mood?: string | null;
  baseUrl: string;
  /** Live custom domain (no scheme) to bake into canonical/og:url; undefined → subdomain. */
  canonicalDomain?: string;
  /**
   * i18n (Phase 5): project locale declaration. Absent or single-locale ⇒ today's
   * exact behavior (default locale at `/`, byte-identical, no locale docs). When it
   * declares >1 locale, the default locale still publishes at `/` and each
   * non-default locale is rendered at `/{locale}` (+ `/{locale}/{subpath}`) with its
   * overlay resolved BEFORE render (parity-ordering invariant, D1). Phase 6 reads
   * this from the project content and passes it here.
   */
  localeConfig?: LocaleConfig | null;
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
    mood,
    baseUrl,
    canonicalDomain,
    localeConfig,
  } = input;

  // i18n (Phase 5): locale fan-out gate. Single/absent ⇒ everything below runs
  // exactly as before (default locale only, no locale docs, byte-identical).
  const multiLocale = isMultiLocale(localeConfig);
  const locales = multiLocale ? localeConfig!.locales : [];
  const defaultLocale = multiLocale ? localeConfig!.defaultLocale : 'en';

  // Reciprocal hreflang set for a logical page (identified by its DEFAULT-locale
  // "bare" path, '/' or '/about'). Built from the SAME resolveCanonicalURL source
  // as the self-canonical so self-referencing tags agree exactly. Includes every
  // declared locale + x-default → default locale. Empty when single-locale.
  const buildAlternates = (
    barePath: string
  ): Array<{ hreflang: string; href: string }> => {
    if (!multiLocale) return [];
    const pathFor = (loc: string) =>
      loc === defaultLocale ? barePath : barePath === '/' ? `/${loc}` : `/${loc}${barePath}`;
    const hrefFor = (loc: string) =>
      resolveCanonicalURL({ slug, canonicalDomain, canonicalPath: pathFor(loc) });
    return [
      ...locales.map((loc) => ({ hreflang: loc, href: hrefFor(loc) })),
      { hreflang: 'x-default', href: hrefFor(defaultLocale) },
    ];
  };

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

  // scale-04 (phase 3): resolve the project goal ONCE here (self-fetch) so BOTH
  // callers — normal publish/republish AND the custom-domain go-live republish —
  // thread it into the renderer's normalization pre-pass with zero caller edits.
  // Null goal → renderer's legacy GOAL_REF fallback (existing projects unchanged).
  const goal = await getPublishedGoal(pageId);

  // goal-ref-cta phase 3 (F23): this fn alone holds EVERY page, so it scans the
  // root + subpage bodies ONCE for the page that carries the conversion form
  // (a `leadForm-*` section or a `contact` section with `elements.form_id`).
  // formPagePath is derived per render page (below) so an M1 primary on a page
  // that does NOT hold the form emits a cross-page `page` dest (bare pathSlug),
  // while the form page's own primary keeps the same-page `#form-section` anchor.
  const subpagesForScan =
    contentData.subpages && typeof contentData.subpages === 'object' ? contentData.subpages : {};
  const pageInputsForScan: CtaPageInput[] = [
    { path: '/', content: contentData },
    ...(Object.entries(subpagesForScan) as Array<[string, any]>).map(([rawPath, sub]) => ({
      path: rawPath.startsWith('/') ? rawPath : `/${rawPath}`,
      content: sub?.content,
    })),
  ];

  const rootMeta = buildPageMetadata({
    slug,
    pageTitle: cleanTitle,
    content: contentData, // already flattened above; carries content.seo when set
    previewImage,
    canonicalDomain,
    canonicalPath: '/',
    baseUrl,
  });

  // JSON-LD (Phase 3): root page only. 'auto' → safe generic Organization.
  const rootJsonLd = buildStructuredData({
    type: contentData.seo?.structuredDataType,
    audienceType,
    name: rootMeta.title,
    description: rootMeta.description,
    url: rootMeta.canonicalURL,
    logoUrl: extractLogoUrl(contentData),
    imageUrl: rootMeta.ogImage,
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
    jsonLd: rootJsonLd ? serializeJsonLd(rootJsonLd) : undefined,
    analyticsOptIn: analyticsEnabled || false, // Phase 4
    baseURL: baseUrl,
    audienceType,
    templateId,
    paletteId,
    variantId,
    mood: mood ?? null,
    goal,
    currentPagePath: '/',
    formPagePath: findFormPagePath(pageInputsForScan, '/'),
    canonicalDomain,
    canonicalPath: '/',
    // i18n: default-locale root still lives at '/'. When multi-locale it also
    // carries hreflang + switcher; single-locale ⇒ all undefined ⇒ byte-identical.
    locale: multiLocale ? defaultLocale : undefined,
    localeConfig: multiLocale ? localeConfig! : undefined,
    localeAlternates: multiLocale ? buildAlternates('/') : undefined,
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
      // Blog (Phase 1): /blog* is reserved — blog routes/blobs are owned by the
      // per-post publish pipeline; a stale/hostile draft page must never clobber them.
      if (isReservedBlogPath(path)) {
        console.warn('[Phase 2] Skipping reserved /blog subpage path:', rawPath);
        continue;
      }
      const pageName = path.replace(/^\//, '').replace(/\/$/, '') || 'index';

      const subSections: string[] = sub?.layout?.sections || [];
      const subTheme = sub?.layout?.theme || contentData.layout.theme;
      const subFlat = {
        ...(sub?.content || {}),
        forms: contentData.forms || {},
        legalPages: contentData.legalPages,
        globalSettings: contentData.globalSettings,
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
        mood: mood ?? null,
        goal,
        currentPagePath: path,
        formPagePath: findFormPagePath(pageInputsForScan, path),
        canonicalDomain,
        canonicalPath: path,
        // i18n: default-locale subpage keeps its '/{subpage}' path; hreflang +
        // switcher only when multi-locale. Single-locale ⇒ byte-identical.
        locale: multiLocale ? defaultLocale : undefined,
        localeConfig: multiLocale ? localeConfig! : undefined,
        localeAlternates: multiLocale ? buildAlternates(path) : undefined,
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

  // === i18n (Phase 5): NON-DEFAULT LOCALE DOCS ===
  // For every declared locale other than the default, render the root + each
  // subpage with its overlay RESOLVED before render (resolve-then-extract, D1
  // parity-ordering invariant — same helper the editor read path uses), at
  // `/{locale}` (+ `/{locale}/{subpath}`). These share the primary's version and
  // land in extraRoutes. Nothing here runs for single-locale projects.
  if (multiLocale) {
    for (const loc of locales) {
      if (loc === defaultLocale) continue;

      // Localized root: resolveLocaleElements copies non-section keys (layout,
      // forms, subpages, seo…) by reference and overlays only the section elements.
      const locRoot = resolveLocaleElements(
        contentData,
        contentData.localeContent,
        loc
      );

      // Assemble every localized page for THIS locale ONCE, so CTA form-page
      // detection and rendering share the same content + locale-prefixed paths.
      type LocalePage = {
        path: string; // locale-prefixed served path, e.g. '/nl' or '/nl/about'
        bare: string; // default-locale bare path, e.g. '/' or '/about'
        flat: any;
        sections: string[];
        theme: any;
        title: string;
        seo: any;
        isRoot: boolean;
      };
      const locPages: LocalePage[] = [
        {
          path: `/${loc}`,
          bare: '/',
          flat: locRoot,
          sections: contentData.layout.sections,
          theme: contentData.layout.theme,
          title: cleanTitle,
          seo: undefined, // root seo rides locRoot.seo (as the default root does)
          isRoot: true,
        },
      ];
      for (const [rawPath, sub] of Object.entries(subpages) as Array<[string, any]>) {
        const bare = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        if (bare === '/') continue;
        if (isReservedBlogPath(bare)) continue;
        const subSections: string[] = sub?.layout?.sections || [];
        const subTheme = sub?.layout?.theme || contentData.layout.theme;
        const subFlat = {
          ...(sub?.content || {}),
          forms: contentData.forms || {},
          legalPages: contentData.legalPages,
          globalSettings: contentData.globalSettings,
        };
        // Overlays are PROJECT-GLOBAL: the entire localeContent map (root AND
        // subpage sections) lives in the ROOT content, keyed by globally-unique
        // sectionId. Subpage ProjectPage.content carries NO localeContent key —
        // so feed the ROOT map here. Because sectionIds are globally unique and
        // subFlat only holds this subpage's section keys, only this subpage's own
        // sections get overlaid (no cross-page contamination).
        const locSub = resolveLocaleElements(subFlat, contentData.localeContent, loc);
        locPages.push({
          path: `/${loc}${bare}`,
          bare,
          flat: locSub,
          sections: subSections,
          theme: subTheme,
          title: sub?.title || cleanTitle,
          seo: sub?.seo,
          isRoot: false,
        });
      }

      // CTA form-page scan within THIS locale (localized content, locale-prefixed
      // paths) so a primary CTA on a locale page targets the SAME locale's form
      // page instead of the default-locale one.
      const locPageInputs: CtaPageInput[] = locPages.map((p) => ({
        path: p.path,
        content: p.flat,
      }));

      for (const p of locPages) {
        try {
          const meta = buildPageMetadata({
            slug,
            pageTitle: p.title,
            content: { ...p.flat, layout: { sections: p.sections } },
            previewImage,
            canonicalDomain,
            canonicalPath: p.path,
            baseUrl,
            seo: p.seo,
            rootSeo: contentData.seo,
          });

          const jsonLd = p.isRoot
            ? buildStructuredData({
                type: contentData.seo?.structuredDataType,
                audienceType,
                name: meta.title,
                description: meta.description,
                url: meta.canonicalURL,
                logoUrl: extractLogoUrl(p.flat),
                imageUrl: meta.ogImage,
              })
            : null;

          const locHtml = await generateStaticHTML({
            sections: p.sections,
            content: p.flat,
            theme: p.theme,
            publishedPageId: pageId,
            pageOwnerId: userId,
            slug,
            title: meta.title,
            description: meta.description,
            previewImage: previewImage ?? undefined,
            seo: p.seo ?? undefined,
            faviconUrl: meta.faviconUrl,
            jsonLd: jsonLd ? serializeJsonLd(jsonLd) : undefined,
            analyticsOptIn: analyticsEnabled || false,
            baseURL: baseUrl,
            audienceType,
            templateId,
            paletteId,
            variantId,
            mood: mood ?? null,
            goal,
            currentPagePath: p.path,
            formPagePath: findFormPagePath(locPageInputs, p.path),
            canonicalDomain,
            canonicalPath: p.path,
            locale: loc,
            localeConfig: localeConfig!,
            localeAlternates: buildAlternates(p.bare),
          });

          const pageName = p.path.replace(/^\//, ''); // 'nl' | 'nl/about'
          const locUpload = await uploadStaticSite({
            pageId,
            html: locHtml.html,
            assetBundleVersion: 'v1',
            version, // share the primary (default-locale root) version
            pageName,
          });

          allBlobs.push({
            path: p.path,
            blobKey: locUpload.blobKey,
            blobUrl: locUpload.blobUrl,
            sizeBytes: locUpload.sizeBytes,
          });
          extraRoutes[p.path] = locUpload.blobUrl;
        } catch (locErr) {
          // A failed locale doc must not block the rest of the publish.
          console.error('[Phase 5] Locale doc render/upload failed:', p.path, locErr);
        }
      }
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

import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2MB app-level limit

interface UploadStaticSiteOptions {
  pageId: string;
  html: string;
  assetBundleVersion: string; // "v1" for CSS/JS references
}

interface UploadStaticSiteResult {
  version: string; // timestamp-nanoid
  blobKey: string; // pages/{pageId}/{version}/index.html
  blobUrl: string; // CDN URL
  sizeBytes: number;
}

/**
 * Retry helper with exponential backoff
 */
async function uploadWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * Math.pow(2, i)));
    }
  }
  throw new Error('Upload retry failed'); // Should never reach here
}

/**
 * Upload static HTML to Vercel Blob with versioning
 *
 * @param options - Upload configuration
 * @returns Upload result with version, blobKey, blobUrl, sizeBytes
 * @throws Error if HTML exceeds size limit or upload fails
 */
export async function uploadStaticSite(
  options: UploadStaticSiteOptions
): Promise<UploadStaticSiteResult> {
  const { pageId, html, assetBundleVersion } = options;

  // 1. Validate size
  const sizeBytes = Buffer.byteLength(html, 'utf8');
  if (sizeBytes > MAX_HTML_SIZE) {
    throw new Error(
      `HTML exceeds size limit: ${(sizeBytes / 1024 / 1024).toFixed(2)}MB > 2MB`
    );
  }

  // 2. Generate version ID with collision protection
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').replace('Z', '');
  const version = `${timestamp}-${nanoid(6)}`;

  // 3. Build blob key
  const blobKey = `pages/${pageId}/${version}/index.html`;

  // 4. Upload with retry logic
  const result = await uploadWithRetry(() =>
    put(blobKey, html, {
      contentType: 'text/html; charset=utf-8',
      access: 'public',
      cacheControlMaxAge: 31536000, // 1 year immutable
      addRandomSuffix: false, // Use our version ID, not Vercel's suffix
    })
  );

  // 5. Validate response
  if (!result || !result.url) {
    throw new Error('Invalid blob upload response: missing URL');
  }

  return {
    version,
    blobKey,
    blobUrl: result.url,
    sizeBytes,
  };
}

/**
 * Upload shared assets (CSS, JS) to Vercel Blob
 * Deferred to Phase 4 - currently unused
 */
export async function uploadSharedAssets(options: {
  css: string;
  formJs: string;
  analyticsJs: string;
  version: string; // "v1"
}): Promise<{
  cssKey: string;
  formJsKey: string;
  analyticsJsKey: string;
}> {
  const { css, formJs, analyticsJs, version } = options;

  // Upload CSS
  const cssResult = await put(`assets/published.${version}.css`, css, {
    contentType: 'text/css',
    access: 'public',
    cacheControlMaxAge: 31536000,
  });

  // Upload form handler
  const formJsResult = await put(`assets/form.${version}.js`, formJs, {
    contentType: 'application/javascript',
    access: 'public',
    cacheControlMaxAge: 31536000,
  });

  // Upload analytics
  const analyticsJsResult = await put(`assets/a.${version}.js`, analyticsJs, {
    contentType: 'application/javascript',
    access: 'public',
    cacheControlMaxAge: 31536000,
  });

  return {
    cssKey: cssResult.pathname,
    formJsKey: formJsResult.pathname,
    analyticsJsKey: analyticsJsResult.pathname,
  };
}

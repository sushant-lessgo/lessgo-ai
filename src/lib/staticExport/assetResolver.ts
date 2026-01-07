/**
 * Asset URL Resolver - Phase 1
 *
 * Validates and resolves asset URLs to absolute HTTPS paths
 * Ensures all images and assets are properly referenced in static HTML
 */

export interface AssetValidationResult {
  isValid: boolean;
  resolvedURL?: string;
  error?: string;
}

/**
 * Validate image URL is absolute and HTTPS
 */
export function validateImageURL(
  url: string,
  baseURL: string = 'https://lessgo.ai'
): AssetValidationResult {
  // Empty URL is valid (optional images)
  if (!url) {
    return { isValid: true };
  }

  try {
    // Check if already absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsedURL = new URL(url);

      // Upgrade HTTP to HTTPS
      if (parsedURL.protocol === 'http:') {
        parsedURL.protocol = 'https:';
        return {
          isValid: true,
          resolvedURL: parsedURL.toString(),
        };
      }

      return {
        isValid: true,
        resolvedURL: url,
      };
    }

    // Relative path - prepend baseURL
    if (url.startsWith('/')) {
      const absoluteURL = new URL(url, baseURL);
      return {
        isValid: true,
        resolvedURL: absoluteURL.toString(),
      };
    }

    // Invalid format
    return {
      isValid: false,
      error: `Invalid URL format: ${url}`,
    };
  } catch (err) {
    return {
      isValid: false,
      error: `URL parsing error: ${err instanceof Error ? err.message : 'Unknown'}`,
    };
  }
}

/**
 * Scan HTML for asset URLs and resolve them
 */
export function validateAndResolveAssetURLs(
  html: string,
  baseURL: string = 'https://lessgo.ai'
): string {
  let processedHTML = html;

  // Match image src attributes
  const imgRegex = /src="([^"]+)"/g;
  let match;

  const replacements: Array<{ from: string; to: string }> = [];

  // Collect all src replacements
  while ((match = imgRegex.exec(html)) !== null) {
    const originalURL = match[1];

    // Skip data URLs
    if (originalURL.startsWith('data:')) continue;

    const validation = validateImageURL(originalURL, baseURL);

    if (validation.resolvedURL && validation.resolvedURL !== originalURL) {
      replacements.push({
        from: `src="${originalURL}"`,
        to: `src="${validation.resolvedURL}"`,
      });
    }
  }

  // Match background-image in style attributes
  const bgRegex = /background-image:\s*url\((['"]?)([^'"()]+)\1\)/g;

  while ((match = bgRegex.exec(html)) !== null) {
    const originalURL = match[2];
    const quote = match[1];

    // Skip data URLs
    if (originalURL.startsWith('data:')) continue;

    const validation = validateImageURL(originalURL, baseURL);

    if (validation.resolvedURL && validation.resolvedURL !== originalURL) {
      replacements.push({
        from: `url(${quote}${originalURL}${quote})`,
        to: `url(${quote}${validation.resolvedURL}${quote})`,
      });
    }
  }

  // Apply all replacements
  for (const replacement of replacements) {
    processedHTML = processedHTML.replace(replacement.from, replacement.to);
  }

  return processedHTML;
}

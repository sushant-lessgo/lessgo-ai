/**
 * URL Helper Utilities
 * Provides functions for URL normalization and validation
 */

/**
 * Normalizes a URL by ensuring it has a proper protocol
 * @param url - The URL to normalize
 * @returns The normalized URL with protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';
  
  // Trim whitespace
  const trimmedUrl = url.trim();
  
  // If it already has a protocol, return as-is
  if (/^https?:\/\//i.test(trimmedUrl)) {
    return trimmedUrl;
  }
  
  // If it starts with //, add https:
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }
  
  // For social media URLs without protocol, add https://
  // Common patterns: twitter.com/username, linkedin.com/in/username, etc.
  const socialDomainPatterns = [
    'twitter.com',
    'x.com',
    'linkedin.com',
    'facebook.com',
    'instagram.com',
    'youtube.com',
    'github.com',
    'tiktok.com',
    'discord.gg',
    'medium.com',
    'dribbble.com',
    'behance.net',
    'pinterest.com',
    'reddit.com',
    'twitch.tv',
    'snapchat.com',
    'telegram.me',
    't.me',
    'whatsapp.com',
    'wa.me'
  ];
  
  // Check if the URL starts with a known social domain
  const startsWithSocialDomain = socialDomainPatterns.some(domain => 
    trimmedUrl.toLowerCase().startsWith(domain)
  );
  
  // If it starts with a social domain or contains common URL patterns, add https://
  if (startsWithSocialDomain || 
      /^[\w\-]+(\.[\w\-]+)+/.test(trimmedUrl)) { // Matches domain-like patterns
    return `https://${trimmedUrl}`;
  }
  
  // Default: add https:// for any other cases
  return `https://${trimmedUrl}`;
}

/**
 * Validates if a URL is properly formatted
 * @param url - The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    // Check if protocol is http or https
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Extracts the domain from a URL
 * @param url - The URL to extract domain from
 * @returns The domain name or empty string if invalid
 */
export function extractDomain(url: string): string {
  try {
    const normalizedUrl = normalizeUrl(url);
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * Gets a display-friendly version of the URL (without protocol)
 * @param url - The URL to format for display
 * @returns Display-friendly URL
 */
export function getDisplayUrl(url: string): string {
  const normalized = normalizeUrl(url);
  return normalized.replace(/^https?:\/\//, '');
}

/**
 * Validates and normalizes a social media URL
 * @param url - The social media URL
 * @param platform - Optional platform hint for better normalization
 * @returns Object with normalized URL and validation status
 */
export function processSocialMediaUrl(
  url: string, 
  platform?: string
): { url: string; isValid: boolean; error?: string } {
  if (!url) {
    return { url: '', isValid: false, error: 'URL is required' };
  }
  
  const normalized = normalizeUrl(url);
  
  if (!isValidUrl(normalized)) {
    return { 
      url: normalized, 
      isValid: false, 
      error: 'Invalid URL format' 
    };
  }
  
  // Optional: Platform-specific validation
  if (platform) {
    const domain = extractDomain(normalized);
    const platformDomains: Record<string, string[]> = {
      'Twitter/X': ['twitter.com', 'x.com'],
      'LinkedIn': ['linkedin.com'],
      'GitHub': ['github.com'],
      'Facebook': ['facebook.com', 'fb.com'],
      'Instagram': ['instagram.com'],
      'YouTube': ['youtube.com', 'youtu.be'],
      'TikTok': ['tiktok.com'],
      'Discord': ['discord.gg', 'discord.com'],
      'Medium': ['medium.com'],
      'Dribbble': ['dribbble.com'],
    };
    
    const expectedDomains = platformDomains[platform];
    if (expectedDomains && !expectedDomains.includes(domain)) {
      return {
        url: normalized,
        isValid: true, // Still valid URL, just might be wrong platform
        error: `URL doesn't match expected ${platform} domain`
      };
    }
  }
  
  return { url: normalized, isValid: true };
}
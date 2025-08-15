// lib/security.ts - OWASP Security Headers and Utilities
import { NextResponse } from 'next/server';

// A05: Security Misconfiguration - Security headers
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.clerk.io https://www.gstatic.com https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.clerk.io https://clerk.lessgo.ai https://api.openai.com;",
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
});

// A01: Broken Access Control - Authorization helper
export const verifyProjectAccess = async (
  userId: string | null, 
  projectUserId: string | null, 
  tokenId: string
): Promise<boolean> => {
  const DEMO_TOKEN = 'lessgodemomockdata';
  
  // Allow demo token access
  if (tokenId === DEMO_TOKEN) return true;
  
  // Require authentication for non-demo tokens
  if (!userId) return false;
  
  // Allow access if user owns the project or project is unowned
  return !projectUserId || projectUserId === userId;
};

// A02: Cryptographic Failures - Environment validation
export const validateEnvironmentSecrets = (): { valid: boolean; missing: string[] } => {
  const required = ['DATABASE_URL', 'CLERK_SECRET_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// A03: Injection - HTML sanitization for published content
export const sanitizeHtmlContent = (html: string): string => {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/vbscript:/gi, '') // Remove vbscript: protocols
    .replace(/data:text\/html/gi, ''); // Remove data:text/html
};

// A09: Security Logging - Create secure response with logging
export const createSecureResponse = (
  data: any, 
  status: number = 200, 
  logData?: any
): NextResponse => {
  const response = NextResponse.json(data, { status });
  
  // Add security headers
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Log safely in development
  if (process.env.NODE_ENV !== 'production' && logData) {
    // Only log in development
  }
  
  return response;
};

// A07: Identification and Authentication Failures - Token validation
export const validateToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  if (token.length < 3 || token.length > 100) return false;
  if (!/^[a-zA-Z0-9_-]+$/.test(token)) return false;
  return true;
};

// A04: Insecure Design - Secure slug generation
export const validateSlug = (slug: string): { valid: boolean; error?: string } => {
  if (!slug || typeof slug !== 'string') {
    return { valid: false, error: 'Slug is required' };
  }
  
  if (slug.length < 1 || slug.length > 100) {
    return { valid: false, error: 'Slug must be between 1 and 100 characters' };
  }
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { valid: false, error: 'Slug must contain only lowercase letters, numbers, and hyphens' };
  }
  
  if (slug.startsWith('-') || slug.endsWith('-')) {
    return { valid: false, error: 'Slug cannot start or end with hyphen' };
  }
  
  // Reserved slugs for security
  const reservedSlugs = ['api', 'admin', 'www', 'mail', 'ftp', 'ssl', 'app', 'dashboard'];
  if (reservedSlugs.includes(slug)) {
    return { valid: false, error: 'Slug is reserved' };
  }
  
  return { valid: true };
};
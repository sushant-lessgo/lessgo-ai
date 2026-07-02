// lib/security.ts - OWASP Security Headers and Utilities
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, logAdminOverride } from '@/lib/admin';

// A05: Security Misconfiguration - Security headers
export const getSecurityHeaders = () => ({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.clerk.io https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.clerk.io https://clerk.lessgo.ai https://api.openai.com;",
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

// A01: Broken Access Control - Token-scoped project ownership gate.
//
// The project token (Token.value, in /edit/<token> & /preview/<token> URLs) identifies WHICH
// project; it is NOT proof of ownership. This helper codifies the loadDraft check in one place so
// every token-scoped route enforces it identically and can't drift:
//   - demo token           -> allow (isDemo)
//   - project owned by you  -> allow
//   - orphan (no owner)     -> allow; claim for the caller when claimIfOrphan (first authed writer wins)
//   - project missing       -> allow (project:null) when allowMissing (route's create branch owns it), else 404
//   - admin, not owner      -> allow + logAdminOverride audit (matches publish/domains)
//   - anyone else           -> deny 403
const OWNERSHIP_DEMO_TOKEN = 'lessgodemomockdata';

export type ProjectOwnerResult =
  | {
      ok: true;
      isDemo: boolean;
      adminOverride: boolean;
      userRecord: { id: string } | null;
      project: { userId: string | null } | null;
    }
  | { ok: false; status: number; error: string };

export const assertProjectOwner = async (
  clerkId: string | null | undefined,
  tokenId: string,
  opts: { action: string; claimIfOrphan?: boolean; allowMissing?: boolean }
): Promise<ProjectOwnerResult> => {
  // Demo token short-circuits every gate (parity with verifyProjectAccess / planCheck demo mode).
  if (tokenId === OWNERSHIP_DEMO_TOKEN) {
    return { ok: true, isDemo: true, adminOverride: false, userRecord: null, project: null };
  }

  if (!clerkId) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const userRecord = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!userRecord) {
    return { ok: false, status: 404, error: 'User not found' };
  }

  const project = await prisma.project.findUnique({
    where: { tokenId },
    select: { userId: true },
  });

  // No project row yet: writers (allowMissing) create-and-own it; readers get 404.
  if (!project) {
    if (opts.allowMissing) {
      return { ok: true, isDemo: false, adminOverride: false, userRecord, project: null };
    }
    return { ok: false, status: 404, error: 'Project not found' };
  }

  // Owner.
  if (project.userId === userRecord.id) {
    return { ok: true, isDemo: false, adminOverride: false, userRecord, project };
  }

  // Orphan (unowned): claim-on-first-authenticated-write, else allow read.
  if (project.userId == null) {
    if (opts.claimIfOrphan) {
      await prisma.project.update({ where: { tokenId }, data: { userId: userRecord.id } });
      return {
        ok: true,
        isDemo: false,
        adminOverride: false,
        userRecord,
        project: { userId: userRecord.id },
      };
    }
    return { ok: true, isDemo: false, adminOverride: false, userRecord, project };
  }

  // Non-owner admin: allow with an audit entry (same shape as publish/domains overrides).
  if (isAdmin(clerkId)) {
    await logAdminOverride({
      actorClerkId: clerkId,
      ownerId: project.userId,
      action: opts.action,
      resource: { tokenId },
    });
    return { ok: true, isDemo: false, adminOverride: true, userRecord, project };
  }

  return { ok: false, status: 403, error: 'Access denied' };
};

// A02: Cryptographic Failures - Environment validation
export const validateEnvironmentSecrets = (): { valid: boolean; missing: string[] } => {
  const required = [
    'DATABASE_URL', 
    'CLERK_SECRET_KEY',
    'OPENAI_API_KEY',
    'PEXELS_API_KEY',
    'NEBIUS_API_KEY'
  ];
  const missing = required.filter(key => !process.env[key]);
  
  return {
    valid: missing.length === 0,
    missing
  };
};

// A03: Injection - HTML sanitization for published content using DOMPurify
import { sanitizePublishedContent } from './htmlSanitizer';

export const sanitizeHtmlContent = (html: string): string => {
  // Enhanced HTML sanitization using DOMPurify with strict security profile
  return sanitizePublishedContent(html);
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

  // Prevent all caching - critical for API routes
  response.headers.set('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

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
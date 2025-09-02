// lib/csrf.ts - Minimal CSRF protection for MVP
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a secure CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Get CSRF token from request cookies
 */
export function getCSRFToken(request: NextRequest): string | null {
  return request.cookies.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(request: NextRequest): boolean {
  // Skip CSRF validation for GET requests
  if (request.method === 'GET') {
    return true;
  }

  // Get token from cookie
  const cookieToken = getCSRFToken(request);
  if (!cookieToken) {
    return false;
  }

  // Get token from header or body
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  // Simple timing-safe comparison
  if (!headerToken || headerToken.length !== cookieToken.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(cookieToken),
    Buffer.from(headerToken)
  );
}

/**
 * Set CSRF token cookie in response
 */
export function setCSRFCookie(response: NextResponse, token?: string): void {
  const csrfToken = token || generateCSRFToken();
  
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY / 1000, // Convert to seconds
    path: '/'
  });
}

/**
 * Simple CSRF protection wrapper for API routes
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Validate CSRF token for state-changing methods
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      if (!validateCSRFToken(request)) {
        return NextResponse.json(
          { error: 'Invalid or missing CSRF token' },
          { status: 403 }
        );
      }
    }

    // Call the original handler
    const response = await handler(request);

    // Ensure CSRF token cookie is set for GET requests
    if (request.method === 'GET' && !getCSRFToken(request)) {
      setCSRFCookie(response);
    }

    return response;
  };
}

/**
 * Client-side helper to get CSRF token from cookies
 */
export function getClientCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}
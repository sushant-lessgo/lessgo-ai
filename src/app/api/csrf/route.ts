// app/api/csrf/route.ts - CSRF token initialization endpoint
import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie, getCSRFToken } from '@/lib/csrf';

/**
 * GET endpoint to initialize CSRF token
 * Called on page load to ensure token is available
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.json({ 
    success: true,
    message: 'CSRF token initialized' 
  });

  // Check if token already exists
  const existingToken = getCSRFToken(request);
  
  if (!existingToken) {
    // Generate and set new token
    setCSRFCookie(response);
  }

  return response;
}
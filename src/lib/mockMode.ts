/**
 * Mock mode utilities for demo/testing without AI calls
 */
import { NextRequest } from 'next/server';

export const DEMO_TOKEN = 'lessgodemomockdata';

/**
 * Check if request is in demo/mock mode
 * Returns true if:
 * - NEXT_PUBLIC_USE_MOCK_GPT env var is 'true'
 * - Authorization header contains demo token
 */
export function isDemoMode(req: NextRequest): boolean {
  // Check environment variable
  if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === 'true') {
    return true;
  }

  // Check Authorization header
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  return token === DEMO_TOKEN;
}

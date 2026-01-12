import { NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Check if KV environment variables are available on Edge runtime
 */
export async function GET() {
  return NextResponse.json({
    runtime: 'edge',
    hasKvUrl: !!process.env.KV_URL,
    hasKvRestUrl: !!process.env.KV_REST_API_URL,
    hasKvToken: !!process.env.KV_REST_API_TOKEN,
    hasKvReadOnlyToken: !!process.env.KV_REST_API_READ_ONLY_TOKEN,
    kvRestUrlPrefix: process.env.KV_REST_API_URL?.substring(0, 30) || 'missing',
  });
}

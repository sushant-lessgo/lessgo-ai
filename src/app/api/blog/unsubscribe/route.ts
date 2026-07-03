export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Blog (P2): tokened one-click unsubscribe (linked from every notification
// email). Public route (middleware isPublicRoute). Responds with the same tiny
// confirmation page whether or not the token matched — no token oracle.
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function confirmationPage(message: string): NextResponse {
  const html =
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex"><title>Unsubscribed</title></head>` +
    `<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;color:#111">` +
    `<div style="text-align:center;padding:32px"><h1 style="font-size:20px;margin:0 0 8px">${message}</h1>` +
    `<p style="color:#666;font-size:14px;margin:0">You can close this tab.</p></div></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';

  if (token) {
    try {
      await prisma.blogSubscriber.updateMany({
        where: { token },
        data: { status: 'unsubscribed' },
      });
    } catch (err) {
      console.error('[blog:unsubscribe] error:', err);
    }
  }

  return confirmationPage("You're unsubscribed");
}

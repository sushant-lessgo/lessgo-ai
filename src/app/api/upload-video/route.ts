export const dynamic = 'force-dynamic';

// Video upload — Vercel Blob CLIENT upload (token-minting route).
//
// Unlike /api/upload-image (server-side `put()` of a small formData file), a
// hero video is tens of MB and Vercel Serverless Functions cap request bodies
// at ~4.5MB — a formData handler would 413 in prod regardless of any in-code
// size check. So the browser uploads DIRECTLY to Blob; this route only:
//   1. mints a constrained client token (auth + ownership + MIME/size caps all
//      enforced in `onBeforeGenerateToken` — the file never transits us), and
//   2. receives Blob's completion webhook (`onUploadCompleted`) for logging.
//      NOTE: the webhook needs a publicly reachable URL, so it will NOT fire
//      on localhost — non-fatal, the client gets the blob URL back from
//      `upload()` directly.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prisma } from '@/lib/prisma';
import { isAdmin, logAdminOverride } from '@/lib/admin';

// Size cap is enforced HERE (token constraint), not by request-body size.
const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Authenticate (same auth/user-lookup/ownership/admin-override logic
        // as /api/upload-image, minus the file handling).
        const { userId: clerkId } = await auth();
        if (!clerkId) {
          throw new Error('Unauthorized');
        }

        const user = await prisma.user.findUnique({ where: { clerkId } });
        if (!user) {
          throw new Error('User not found');
        }

        // tokenId arrives via clientPayload (JSON) — the client uploads the
        // file straight to Blob, so there is no formData to read it from.
        let tokenId: string | undefined;
        try {
          tokenId = clientPayload ? JSON.parse(clientPayload)?.tokenId : undefined;
        } catch {
          throw new Error('Invalid client payload');
        }
        if (!tokenId || typeof tokenId !== 'string') {
          throw new Error('No tokenId provided');
        }

        // Verify project ownership (admin override audit-logged, as in the
        // image route — isAdmin needs the Clerk id, not the internal user id).
        const token = await prisma.token.findUnique({
          where: { value: tokenId },
          include: { project: true },
        });
        if (!token) {
          throw new Error('Invalid token');
        }
        if (!token.project) {
          throw new Error('Unauthorized - not project owner');
        }
        if (token.project.userId !== user.id) {
          if (!isAdmin(clerkId)) {
            throw new Error('Unauthorized - not project owner');
          }
          await logAdminOverride({
            actorClerkId: clerkId,
            ownerId: token.project.userId,
            action: 'video.upload',
            resource: { tokenId },
          });
        }

        // The client picks the pathname; pin it under this project's prefix
        // so a token minted for project A can't write into project B's folder.
        if (!pathname.startsWith(`uploads/${tokenId}/`)) {
          throw new Error('Invalid upload path');
        }

        return {
          allowedContentTypes: ALLOWED_VIDEO_TYPES,
          maximumSizeInBytes: MAX_VIDEO_SIZE_BYTES,
          addRandomSuffix: false, // pathname is already timestamp-unique (matches image route convention)
          tokenPayload: JSON.stringify({ tokenId, userId: user.id }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Lightweight logging only — no DB write needed; the client persists
        // the URL into the draft itself. (Won't fire on localhost — see top.)
        console.log('🔵 [UPLOAD-VIDEO] Upload completed:', blob.url, tokenPayload);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('🔴 [UPLOAD-VIDEO] Video upload error:', error);
    // handleUpload conventions: respond 400 so the Blob webhook retries stop
    // cleanly and the client `upload()` surfaces the message.
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to authorize video upload' },
      { status: 400 }
    );
  }
}

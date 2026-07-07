// src/app/api/brief/route.ts
// GET /api/brief?tokenId= — wizard bridge hydrate (scale-02 phase 4, plan D1).
// The wizard page.tsx mount-effect calls this to hydrate its store from the
// Brief that /api/brief/confirm wrote onto the Project. Token identifies WHICH
// project, not ownership — assertProjectOwner is mandatory (2026-07-02 authz fix).
export const dynamic = 'force-dynamic';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse, assertProjectOwner, validateToken } from '@/lib/security';

export async function GET(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return createSecureResponse({ error: 'Unauthorized' }, 401);
    }

    const { searchParams } = new URL(req.url);
    const tokenId = searchParams.get('tokenId');
    if (!tokenId || !validateToken(tokenId)) {
      return createSecureResponse({ error: 'Invalid or missing tokenId' }, 400);
    }

    // Read-only gate: no orphan claim; missing project ⇒ 404 (per plan).
    const access = await assertProjectOwner(clerkId, tokenId, { action: 'brief:get' });
    if (!access.ok) {
      return createSecureResponse({ error: access.error }, access.status);
    }

    const project = await prisma.project.findUnique({
      where: { tokenId },
      select: { brief: true, audienceType: true, templateId: true },
    });
    if (!project) {
      return createSecureResponse({ error: 'Project not found' }, 404);
    }

    return createSecureResponse({
      brief: project.brief ?? null,
      audienceType: project.audienceType ?? null,
      templateId: project.templateId ?? null,
    });
  } catch (err) {
    console.error('[brief] GET failed:', err);
    return createSecureResponse({ error: 'Failed to load brief' }, 500);
  }
}

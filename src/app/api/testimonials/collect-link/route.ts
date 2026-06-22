export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createSecureResponse } from '@/lib/security';
import { isTestimonialsEnabled } from '@/lib/testimonials/flag';
import {
  getOrCreateCollectLink,
  setCollectLinkActive,
  rotateCollectLinkToken,
} from '@/lib/testimonials/collectLinks';

// Owner-only management of a project's collect link. Ownership is enforced inside the repo
// helpers (they verify the project belongs to the caller); a bad/foreign projectId → 400.
const PostBody = z.object({ projectId: z.string().min(1) });
const PatchBody = z.object({
  projectId: z.string().min(1),
  isActive: z.boolean().optional(),
  rotate: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = PostBody.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  try {
    const link = await getOrCreateCollectLink(userId, parse.data.projectId);
    return createSecureResponse({ token: link.token, isActive: link.isActive });
  } catch {
    return createSecureResponse({ error: 'Invalid project' }, 400);
  }
}

export async function PATCH(req: NextRequest) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);
  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  const { projectId, isActive, rotate } = parse.data;
  try {
    let link = null;
    if (rotate) link = await rotateCollectLinkToken(userId, projectId);
    if (typeof isActive === 'boolean') link = await setCollectLinkActive(userId, projectId, isActive);
    if (!link) return createSecureResponse({ error: 'Nothing to update' }, 400);
    return createSecureResponse({ token: link.token, isActive: link.isActive });
  } catch {
    return createSecureResponse({ error: 'Invalid project' }, 400);
  }
}

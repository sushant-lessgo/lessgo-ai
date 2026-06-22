export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { isTestimonialsEnabled } from '@/lib/testimonials/flag';
import { applyTestimonialsToPageContent } from '@/lib/testimonials/applyToPage';

const Body = z.object({
  projectId: z.string().min(1),
  testimonialIds: z.array(z.string().min(1)).min(1).max(20),
});

export async function POST(req: NextRequest) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);

  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = Body.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);
  const { projectId, testimonialIds } = parse.data;

  // Project must belong to the caller.
  const project = await prisma.project.findFirst({
    where: { id: projectId, user: { clerkId: userId } },
    select: { id: true, audienceType: true, content: true },
  });
  if (!project) return createSecureResponse({ error: 'Invalid project' }, 400);

  const content = project.content as Record<string, unknown> | null;
  if (!content || !content.finalContent) {
    return createSecureResponse({ error: 'This project has no page yet' }, 400);
  }

  // Only the caller's APPROVED testimonials for THIS project (ignore anything that doesn't qualify).
  const rows = await prisma.testimonial.findMany({
    where: { id: { in: testimonialIds }, userId, projectId, status: 'approved' },
  });
  if (rows.length === 0) {
    return createSecureResponse({ error: 'No approved testimonials selected' }, 400);
  }

  // Preserve the owner's requested order.
  const byId = new Map(rows.map((r) => [r.id, r]));
  const ordered = testimonialIds.map((id) => byId.get(id)).filter((r): r is (typeof rows)[number] => Boolean(r));

  const result = applyTestimonialsToPageContent(
    content.finalContent as Record<string, unknown>,
    project.audienceType,
    ordered,
  );
  if (!result) {
    return createSecureResponse({ error: 'This page has no testimonials section' }, 400);
  }

  // Rewrap: preserve onboarding + everything else in the content column.
  await prisma.project.update({
    where: { id: project.id },
    data: { content: { ...content, finalContent: result.finalContent } as object },
  });

  return createSecureResponse({ success: true, count: ordered.length, needsRepublish: true });
}

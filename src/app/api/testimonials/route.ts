export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { isTestimonialsEnabled } from '@/lib/testimonials/flag';
import { createTestimonial, isTestimonialStatus } from '@/lib/testimonials/repo';

// Manual add (owner seeding their own library). Optionally scoped to one of the owner's
// projects (Phase 2.5). Photo is a pasted URL here; file upload comes with Phase 3.
const CreateBody = z.object({
  authorName: z.string().min(1).max(120),
  quote: z.string().min(1).max(2000),
  authorRole: z.string().max(120).optional(),
  authorCompany: z.string().max(120).optional(),
  authorPhotoUrl: z.string().url().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  status: z.string().refine(isTestimonialStatus, 'Invalid status').optional(),
  projectId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);

  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  // If scoped to a project, it must belong to the caller (isolation guarantee).
  if (parse.data.projectId) {
    const owned = await prisma.project.findFirst({
      where: { id: parse.data.projectId, user: { clerkId: userId } },
      select: { id: true },
    });
    if (!owned) return createSecureResponse({ error: 'Invalid project' }, 400);
  }

  // Owner-trusted manual add defaults to approved (no self-moderation needed); the form
  // can still override to pending.
  const testimonial = await createTestimonial({
    ...parse.data,
    userId,
    source: 'manual',
    status: parse.data.status ?? 'approved',
  });

  return createSecureResponse({ testimonial }, 201);
}

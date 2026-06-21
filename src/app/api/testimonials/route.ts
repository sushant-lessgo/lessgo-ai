export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { createSecureResponse } from '@/lib/security';
import { isTestimonialsEnabled } from '@/lib/testimonials/flag';
import { createTestimonial, isTestimonialStatus } from '@/lib/testimonials/repo';

// Manual add (owner seeding their own library). Account-level only in Phase 2 —
// project association is handled by Phase 4's "add to page" picker. Photo is a pasted
// URL here; file upload comes with the Phase 3 collection form.
const CreateBody = z.object({
  authorName: z.string().min(1).max(120),
  quote: z.string().min(1).max(2000),
  authorRole: z.string().max(120).optional(),
  authorCompany: z.string().max(120).optional(),
  authorPhotoUrl: z.string().url().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  status: z.string().refine(isTestimonialStatus, 'Invalid status').optional(),
});

export async function POST(req: NextRequest) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);

  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

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

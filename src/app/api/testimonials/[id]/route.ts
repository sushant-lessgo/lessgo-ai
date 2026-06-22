export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import type { Testimonial } from '@prisma/client';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createSecureResponse } from '@/lib/security';
import { isTestimonialsEnabled } from '@/lib/testimonials/flag';
import {
  getTestimonial,
  updateTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
  isTestimonialStatus,
} from '@/lib/testimonials/repo';

// Edit fields and/or change status. Nullable optionals let the form clear a field
// (projectId null = unassign / account-level).
const PatchBody = z.object({
  authorName: z.string().min(1).max(120).optional(),
  quote: z.string().min(1).max(2000).optional(),
  authorRole: z.string().max(120).nullable().optional(),
  authorCompany: z.string().max(120).nullable().optional(),
  authorPhotoUrl: z.string().url().max(2000).nullable().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  status: z.string().refine(isTestimonialStatus, 'Invalid status').optional(),
  projectId: z.string().min(1).nullable().optional(),
});

// Ownership is enforced here (repo mutators take no userId): fetch then compare.
async function requireOwned(
  id: string,
  userId: string,
): Promise<{ testimonial?: Testimonial; fail?: Response }> {
  const testimonial = await getTestimonial(id);
  if (!testimonial) return { fail: createSecureResponse({ error: 'Not found' }, 404) };
  if (testimonial.userId !== userId) return { fail: createSecureResponse({ error: 'Forbidden' }, 403) };
  return { testimonial };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);

  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const parse = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parse.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  const owned = await requireOwned(params.id, userId);
  if (owned.fail) return owned.fail;

  // Reassigning to a project? It must belong to the caller (null = unassign, allowed).
  if (typeof parse.data.projectId === 'string') {
    const ownedProject = await prisma.project.findFirst({
      where: { id: parse.data.projectId, user: { clerkId: userId } },
      select: { id: true },
    });
    if (!ownedProject) return createSecureResponse({ error: 'Invalid project' }, 400);
  }

  const { status, ...fields } = parse.data;

  // status-only change → dedicated mutator; otherwise patch fields (status folded in if present)
  const testimonial =
    Object.keys(fields).length === 0 && status
      ? await updateTestimonialStatus(params.id, status)
      : await updateTestimonial(params.id, parse.data);

  return createSecureResponse({ testimonial });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);

  const { userId } = await auth();
  if (!userId) return createSecureResponse({ error: 'Unauthorized' }, 401);

  const owned = await requireOwned(params.id, userId);
  if (owned.fail) return owned.fail;

  const photoUrl = owned.testimonial?.authorPhotoUrl ?? null;
  await deleteTestimonial(params.id);

  // Best-effort: remove the Blob-hosted photo so deletes don't orphan uploads. Only our own
  // Blob URLs (not externally-pasted manual-add URLs); never fail the delete on a blob error.
  if (photoUrl && photoUrl.includes('vercel-storage.com')) {
    try {
      const { del } = await import('@vercel/blob');
      await del(photoUrl);
    } catch (e) {
      console.error('[testimonials] blob cleanup failed', e);
    }
  }

  return createSecureResponse({ deleted: true });
}

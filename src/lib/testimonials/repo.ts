// Owner-scoped data-access for the testimonial system (Phase 1 foundation).
// Pure data layer — no auth/HTTP here. Phase 2 routes enforce ownership via the
// existing auth() + verifyProjectAccess pattern (src/lib/security.ts) before calling these.
//
// status/source are stored as String (no DB enum, matching repo convention), so the DB
// won't enforce valid values — this layer does. See testimonialSystem.md.

import { prisma } from '@/lib/prisma';
import type { Testimonial } from '@prisma/client';

export const TESTIMONIAL_STATUSES = ['pending', 'approved', 'rejected'] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

export const TESTIMONIAL_SOURCES = ['manual', 'collect-form', 'imported'] as const;
export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[number];

export function isTestimonialStatus(value: string): value is TestimonialStatus {
  return (TESTIMONIAL_STATUSES as readonly string[]).includes(value);
}

export function isTestimonialSource(value: string): value is TestimonialSource {
  return (TESTIMONIAL_SOURCES as readonly string[]).includes(value);
}

export interface CreateTestimonialInput {
  userId: string;
  projectId?: string | null;
  authorName: string;
  authorRole?: string | null;
  authorCompany?: string | null;
  authorPhotoUrl?: string | null;
  quote: string;
  rating?: number | null;
  videoUrl?: string | null;
  status?: TestimonialStatus;
  source?: TestimonialSource;
  collectToken?: string | null;
}

export type UpdateTestimonialPatch = Partial<Omit<CreateTestimonialInput, 'userId'>>;

export interface ListTestimonialsFilter {
  status?: TestimonialStatus;
  /** Pass a project id to scope to one page, or `null` to scope to account-level (unattached). */
  projectId?: string | null;
}

function assertRating(rating: number | null | undefined): void {
  if (rating != null && (rating < 1 || rating > 5)) {
    throw new Error(`Invalid testimonial rating: ${rating} (expected 1–5)`);
  }
}

export function createTestimonial(input: CreateTestimonialInput): Promise<Testimonial> {
  const status = input.status ?? 'pending';
  const source = input.source ?? 'manual';
  if (!isTestimonialStatus(status)) throw new Error(`Invalid testimonial status: ${status}`);
  if (!isTestimonialSource(source)) throw new Error(`Invalid testimonial source: ${source}`);
  if (!input.userId) throw new Error('createTestimonial requires userId');
  if (!input.authorName?.trim()) throw new Error('createTestimonial requires authorName');
  if (!input.quote?.trim()) throw new Error('createTestimonial requires quote');
  assertRating(input.rating);

  return prisma.testimonial.create({
    data: {
      userId: input.userId,
      projectId: input.projectId ?? null,
      authorName: input.authorName,
      authorRole: input.authorRole ?? null,
      authorCompany: input.authorCompany ?? null,
      authorPhotoUrl: input.authorPhotoUrl ?? null,
      quote: input.quote,
      rating: input.rating ?? null,
      videoUrl: input.videoUrl ?? null,
      status,
      source,
      collectToken: input.collectToken ?? null,
    },
  });
}

export function listTestimonialsByOwner(
  userId: string,
  filter: ListTestimonialsFilter = {},
): Promise<Testimonial[]> {
  if (filter.status && !isTestimonialStatus(filter.status)) {
    throw new Error(`Invalid testimonial status filter: ${filter.status}`);
  }
  return prisma.testimonial.findMany({
    where: {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.projectId !== undefined ? { projectId: filter.projectId } : {}),
    },
    orderBy: { createdAt: 'desc' },
  });
}

export function getTestimonial(id: string): Promise<Testimonial | null> {
  return prisma.testimonial.findUnique({ where: { id } });
}

export function updateTestimonialStatus(id: string, status: TestimonialStatus): Promise<Testimonial> {
  if (!isTestimonialStatus(status)) throw new Error(`Invalid testimonial status: ${status}`);
  return prisma.testimonial.update({ where: { id }, data: { status } });
}

export function updateTestimonial(id: string, patch: UpdateTestimonialPatch): Promise<Testimonial> {
  if (patch.status && !isTestimonialStatus(patch.status)) {
    throw new Error(`Invalid testimonial status: ${patch.status}`);
  }
  if (patch.source && !isTestimonialSource(patch.source)) {
    throw new Error(`Invalid testimonial source: ${patch.source}`);
  }
  assertRating(patch.rating);
  return prisma.testimonial.update({ where: { id }, data: patch });
}

export function deleteTestimonial(id: string): Promise<Testimonial> {
  return prisma.testimonial.delete({ where: { id } });
}

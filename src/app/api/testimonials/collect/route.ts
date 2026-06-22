export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { createSecureResponse } from '@/lib/security';
import { withFormRateLimit } from '@/lib/rateLimit';
import { isTestimonialsEnabled } from '@/lib/testimonials/flag';
import { getCollectLinkByToken } from '@/lib/testimonials/collectLinks';
import { processAndUploadTestimonialPhoto, PhotoError } from '@/lib/testimonials/photo';
import { createTestimonial } from '@/lib/testimonials/repo';

// PUBLIC, unauthenticated. The collectToken is the only capability — owner (userId) and projectId
// are resolved server-side from it; nothing about ownership is trusted from the client.
// Spam defense: hidden honeypot field + withFormRateLimit (10/min/IP). No CSRF (public submit).
const Fields = z.object({
  collectToken: z.string().min(1).max(64),
  authorName: z.string().min(1).max(120),
  quote: z.string().min(1).max(2000),
  authorRole: z.string().max(120).optional(),
  authorCompany: z.string().max(120).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});

async function handler(request: NextRequest) {
  if (!isTestimonialsEnabled()) return createSecureResponse({ error: 'Not found' }, 404);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return createSecureResponse({ error: 'Invalid request' }, 400);
  }

  // Honeypot: bots fill hidden fields. Pretend success, store nothing.
  if (String(form.get('website') ?? '').trim()) {
    return createSecureResponse({ success: true });
  }

  const parsed = Fields.safeParse({
    collectToken: form.get('collectToken'),
    authorName: form.get('authorName'),
    quote: form.get('quote'),
    authorRole: form.get('authorRole') || undefined,
    authorCompany: form.get('authorCompany') || undefined,
    rating: form.get('rating') || undefined,
  });
  if (!parsed.success) return createSecureResponse({ error: 'Invalid request' }, 400);

  const link = await getCollectLinkByToken(parsed.data.collectToken);
  if (!link || !link.isActive) return createSecureResponse({ error: 'Link not active' }, 404);

  // Optional photo — processed + re-encoded by the helper (rejects non-images).
  let authorPhotoUrl: string | null = null;
  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    try {
      authorPhotoUrl = await processAndUploadTestimonialPhoto(photo, link.projectId);
    } catch (e) {
      if (e instanceof PhotoError) return createSecureResponse({ error: e.message }, 400);
      throw e;
    }
  }

  await createTestimonial({
    userId: link.userId, // resolved from the token, never the client
    projectId: link.projectId,
    authorName: parsed.data.authorName,
    quote: parsed.data.quote,
    authorRole: parsed.data.authorRole ?? null,
    authorCompany: parsed.data.authorCompany ?? null,
    authorPhotoUrl,
    rating: parsed.data.rating ?? null,
    status: 'pending',
    source: 'collect-form',
    collectToken: parsed.data.collectToken,
  });

  return createSecureResponse({ success: true }, 201);
}

export const POST = withFormRateLimit(handler);

// Phase 4: feed approved testimonials onto a project's page content.
//
// Pure function — no DB/IO. Takes the page's `finalContent` (i.e. project.content.finalContent,
// NOT the wrapping content column) and returns a new finalContent with the testimonial section
// filled, or null if there's no testimonials section.
//
// Deliberately NOT injectRealTestimonials: that seam is tuned for website-import (it clears
// author_company and never sets author_photo). Our collected testimonials are fully real and
// owner-curated, so we preserve company + photo (service) and use the owner's selected order.

import type { Testimonial } from '@prisma/client'

type AnyRecord = Record<string, unknown>

export interface ApplyResult {
  finalContent: AnyRecord
  sectionId: string
}

// Section ids follow `${type}-${uuid}` → the testimonial section key starts with 'testimonials-'.
function findTestimonialSectionId(sectionContent: AnyRecord): string | null {
  for (const key of Object.keys(sectionContent)) {
    if (key.startsWith('testimonials-')) return key
  }
  return null
}

export function applyTestimonialsToPageContent(
  finalContent: AnyRecord | null | undefined,
  audienceType: string,
  selected: Testimonial[],
): ApplyResult | null {
  if (!finalContent || typeof finalContent !== 'object') return null
  if (selected.length === 0) return null

  const sectionContent = (finalContent as AnyRecord).content
  if (!sectionContent || typeof sectionContent !== 'object') return null

  const sectionId = findTestimonialSectionId(sectionContent as AnyRecord)
  if (!sectionId) return null

  // Deep clone (plain JSON) so the input is never mutated.
  const clone = JSON.parse(JSON.stringify(finalContent)) as AnyRecord
  const section = (clone.content as AnyRecord)[sectionId] as AnyRecord
  if (!section || typeof section !== 'object') return null
  if (!section.elements || typeof section.elements !== 'object') section.elements = {}
  const elements = section.elements as AnyRecord

  if (audienceType === 'product') {
    // Collection of up to 3, in the owner's selected order. Product templates render
    // quote/name/role only (no company/photo yet); leave eyebrow/headline/logos untouched.
    elements.testimonials = selected.slice(0, 3).map((t) => ({
      id: t.id,
      quote: t.quote,
      author_name: t.authorName,
      author_role: t.authorRole ?? '',
    }))
  } else {
    // Service: flat single block. Keep the real company + photo (service templates render both).
    const t = selected[0]
    elements.quote = t.quote
    elements.author_name = t.authorName
    elements.author_role = t.authorRole ?? ''
    elements.author_company = t.authorCompany ?? ''
    elements.author_photo = t.authorPhotoUrl ?? ''
  }

  return { finalContent: clone, sectionId }
}

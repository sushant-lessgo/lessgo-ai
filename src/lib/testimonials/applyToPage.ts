// Phase 4: feed approved testimonials onto a project's page content.
//
// Pure function — no DB/IO. Takes the page's `finalContent` (i.e. project.content.finalContent,
// NOT the wrapping content column) and returns a new finalContent with the testimonial section
// filled, or null if there's no testimonials section.
//
// Page-store model (Phase 4b): the current editor stores each page's body under
// `finalContent.pages[pageId]` (AUTHORITATIVE) and keeps flat `finalContent.content` as a derived
// mirror of the home page that the store ignores on load + regenerates on export. So we write the
// home page's slice `pages[homeId].content[sectionId]` and also sync the mirror. Only truly-legacy
// drafts (no `pages` key) use the flat top-level content.
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
function findTestimonialSectionId(sectionContent: unknown): string | null {
  if (!sectionContent || typeof sectionContent !== 'object') return null
  for (const key of Object.keys(sectionContent as AnyRecord)) {
    if (key.startsWith('testimonials-')) return key
  }
  return null
}

// MUST mirror the editor store's home resolution: `findHomeId(pages) || first key`
// (src/hooks/editStore/pageHelpers.ts — findHomeId = the page whose pathSlug === '/').
// Kept inline (not imported) to keep this lib decoupled from the editor store; if the store's rule
// ever changes, update this in lockstep so injection targets the same page the store calls "home".
function resolveHomeId(pages: AnyRecord): string | undefined {
  for (const [id, page] of Object.entries(pages)) {
    if (page && typeof page === 'object' && (page as AnyRecord).pathSlug === '/') return id
  }
  return Object.keys(pages)[0]
}

// Mutate one section's `elements` in place with the selected testimonials (per audience).
function applyToSectionElements(section: AnyRecord, audienceType: string, selected: Testimonial[]): void {
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
}

export function applyTestimonialsToPageContent(
  finalContent: AnyRecord | null | undefined,
  audienceType: string,
  selected: Testimonial[],
): ApplyResult | null {
  if (!finalContent || typeof finalContent !== 'object') return null
  if (selected.length === 0) return null

  // Deep clone (plain JSON) so the input is never mutated.
  const clone = JSON.parse(JSON.stringify(finalContent)) as AnyRecord
  const pages = clone.pages

  // Page-store mode (all current editor drafts): pages[homeId].content is authoritative; flat
  // clone.content is a derived mirror the store ignores on load. Write the page slice (+ sync mirror).
  if (pages && typeof pages === 'object' && Object.keys(pages as AnyRecord).length > 0) {
    const pagesRec = pages as AnyRecord
    const homeId = resolveHomeId(pagesRec)
    // home-first, then any page (robust if a template ever puts testimonials off-home).
    const order = [homeId, ...Object.keys(pagesRec).filter((k) => k !== homeId)].filter(
      (k): k is string => typeof k === 'string',
    )

    for (const pageId of order) {
      const page = pagesRec[pageId] as AnyRecord | undefined
      const pageContent = page?.content as AnyRecord | undefined
      const sectionId = findTestimonialSectionId(pageContent)
      if (!sectionId || !pageContent) continue

      const section = pageContent[sectionId] as AnyRecord
      if (!section || typeof section !== 'object') continue
      applyToSectionElements(section, audienceType, selected)

      // Sync the top-level mirror if it currently holds the same section (i.e. it mirrors this page).
      const mirror = clone.content as AnyRecord | undefined
      if (mirror && typeof mirror === 'object' && mirror[sectionId] && typeof mirror[sectionId] === 'object') {
        applyToSectionElements(mirror[sectionId] as AnyRecord, audienceType, selected)
      }

      return { finalContent: clone, sectionId }
    }
    return null
  }

  // Legacy draft (no `pages`): the flat top-level content is authoritative.
  const sectionContent = clone.content as AnyRecord | undefined
  const sectionId = findTestimonialSectionId(sectionContent)
  if (!sectionId || !sectionContent) return null
  const section = sectionContent[sectionId] as AnyRecord
  if (!section || typeof section !== 'object') return null
  applyToSectionElements(section, audienceType, selected)
  return { finalContent: clone, sectionId }
}

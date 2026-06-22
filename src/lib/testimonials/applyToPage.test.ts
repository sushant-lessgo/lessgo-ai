// Pure mapping coverage for Phase 4. No DB — feeds plain content objects + testimonial-shaped rows.

import { describe, it, expect } from 'vitest'
import { applyTestimonialsToPageContent } from './applyToPage'

// Minimal Testimonial-shaped factory (only the fields the mapping reads).
const t = (over: Partial<Record<string, unknown>> = {}) =>
  ({
    id: 'id1',
    quote: 'Great product',
    authorName: 'Ada',
    authorRole: 'CTO',
    authorCompany: 'Acme',
    authorPhotoUrl: 'https://blob/x.webp',
    ...over,
  }) as never

function productContent() {
  return {
    content: {
      'hero-1': { layout: 'CenterStacked', elements: { headline: 'hi' } },
      'testimonials-abc': {
        layout: 'ProofWithLogoRail',
        elements: { eyebrow: 'PROOF', headline: 'Loved', testimonials: [], logos: [{ id: 'l1', name: 'X' }] },
      },
    },
  }
}

function serviceContent() {
  return {
    content: {
      'testimonials-xyz': {
        layout: 'PullQuoteWithMark',
        elements: { eyebrow: 'WORDS', quote: 'old', author_name: 'old', author_company: 'old', meta: 'keep' },
      },
    },
  }
}

describe('applyTestimonialsToPageContent — product', () => {
  it('maps up to 3 in order and preserves eyebrow/headline/logos', () => {
    const sel = [t({ id: 'a' }), t({ id: 'b' }), t({ id: 'c' }), t({ id: 'd' })]
    const res = applyTestimonialsToPageContent(productContent(), 'product', sel)!
    expect(res.sectionId).toBe('testimonials-abc')
    const el = (res.finalContent as any).content['testimonials-abc'].elements
    expect(el.testimonials).toHaveLength(3)
    expect(el.testimonials.map((x: any) => x.id)).toEqual(['a', 'b', 'c'])
    expect(el.testimonials[0]).toEqual({ id: 'a', quote: 'Great product', author_name: 'Ada', author_role: 'CTO' })
    expect(el.headline).toBe('Loved')
    expect(el.logos).toHaveLength(1)
  })

  it('does not mutate the input', () => {
    const input = productContent()
    applyTestimonialsToPageContent(input, 'product', [t()])
    expect((input as any).content['testimonials-abc'].elements.testimonials).toEqual([])
  })
})

describe('applyTestimonialsToPageContent — service', () => {
  it('maps the first selected and KEEPS real company + photo', () => {
    const res = applyTestimonialsToPageContent(serviceContent(), 'service', [t({ authorCompany: 'Acme', authorPhotoUrl: 'https://p/y.webp' })])!
    const el = (res.finalContent as any).content['testimonials-xyz'].elements
    expect(el.quote).toBe('Great product')
    expect(el.author_company).toBe('Acme') // NOT cleared (unlike injectRealTestimonials)
    expect(el.author_photo).toBe('https://p/y.webp')
    expect(el.meta).toBe('keep')
  })
})

describe('applyTestimonialsToPageContent — guards', () => {
  it('returns null when there is no testimonials section', () => {
    const content = { content: { 'hero-1': { layout: 'X', elements: {} } } }
    expect(applyTestimonialsToPageContent(content, 'product', [t()])).toBeNull()
  })
  it('returns null on empty selection or missing content', () => {
    expect(applyTestimonialsToPageContent(productContent(), 'product', [])).toBeNull()
    expect(applyTestimonialsToPageContent(null, 'product', [t()])).toBeNull()
    expect(applyTestimonialsToPageContent({}, 'product', [t()])).toBeNull()
  })
})

// Pure mapping coverage for Phase 4 / 4b. No DB — feeds plain content objects + testimonial-shaped rows.

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

// --- Legacy (no `pages` key): flat top-level content is authoritative ---

function legacyProduct() {
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

function legacyService() {
  return {
    content: {
      'testimonials-xyz': {
        layout: 'PullQuoteWithMark',
        elements: { eyebrow: 'WORDS', quote: 'old', author_name: 'old', author_company: 'old', meta: 'keep' },
      },
    },
  }
}

describe('applyTestimonialsToPageContent — legacy (no pages) product', () => {
  it('maps up to 3 in order and preserves eyebrow/headline/logos', () => {
    const sel = [t({ id: 'a' }), t({ id: 'b' }), t({ id: 'c' }), t({ id: 'd' })]
    const res = applyTestimonialsToPageContent(legacyProduct(), 'product', sel)!
    expect(res.sectionId).toBe('testimonials-abc')
    const el = (res.finalContent as any).content['testimonials-abc'].elements
    expect(el.testimonials).toHaveLength(3)
    expect(el.testimonials.map((x: any) => x.id)).toEqual(['a', 'b', 'c'])
    expect(el.testimonials[0]).toEqual({ id: 'a', quote: 'Great product', author_name: 'Ada', author_role: 'CTO' })
    expect(el.headline).toBe('Loved')
    expect(el.logos).toHaveLength(1)
  })

  it('does not mutate the input', () => {
    const input = legacyProduct()
    applyTestimonialsToPageContent(input, 'product', [t()])
    expect((input as any).content['testimonials-abc'].elements.testimonials).toEqual([])
  })
})

describe('applyTestimonialsToPageContent — legacy (no pages) service', () => {
  it('maps the first selected and KEEPS real company + photo', () => {
    const res = applyTestimonialsToPageContent(legacyService(), 'service', [t({ authorCompany: 'Acme', authorPhotoUrl: 'https://p/y.webp' })])!
    const el = (res.finalContent as any).content['testimonials-xyz'].elements
    expect(el.quote).toBe('Great product')
    expect(el.author_company).toBe('Acme') // NOT cleared (unlike injectRealTestimonials)
    expect(el.author_photo).toBe('https://p/y.webp')
    expect(el.meta).toBe('keep')
  })
})

// --- Page-store (all current editor drafts): pages[homeId].content is authoritative ---

function pageStoreProduct() {
  const homeBody = {
    'hero-1': { layout: 'X', elements: { headline: 'hi' } },
    'testimonials-abc': { layout: 'ProofWithLogoRail', elements: { headline: 'Loved', testimonials: [], logos: [{ id: 'l1' }] } },
  }
  return {
    content: JSON.parse(JSON.stringify(homeBody)), // top-level mirror of home body
    pages: {
      home: { id: 'home', pathSlug: '/', archetypeKey: 'home', content: JSON.parse(JSON.stringify(homeBody)) },
      'catalog-1': { id: 'catalog-1', pathSlug: '/products', content: { 'catalog-1x': { elements: {} } } },
    },
  }
}

describe('applyTestimonialsToPageContent — page-store', () => {
  it('product: writes pages[home].content (authoritative) AND syncs the mirror; leaves other pages alone', () => {
    const res = applyTestimonialsToPageContent(pageStoreProduct(), 'product', [t({ id: 'a' }), t({ id: 'b' }), t({ id: 'c' }), t({ id: 'd' })])!
    expect(res.sectionId).toBe('testimonials-abc')
    const fc = res.finalContent as any
    expect(fc.pages.home.content['testimonials-abc'].elements.testimonials.map((x: any) => x.id)).toEqual(['a', 'b', 'c'])
    // mirror kept in sync
    expect(fc.content['testimonials-abc'].elements.testimonials).toHaveLength(3)
    // other page untouched
    expect(fc.pages['catalog-1'].content).toEqual({ 'catalog-1x': { elements: {} } })
  })

  it('service: writes home slice and keeps real company + photo', () => {
    const fcIn = {
      content: { 'testimonials-x': { elements: { quote: 'old', author_company: 'old' } } },
      pages: { home: { id: 'home', pathSlug: '/', content: { 'testimonials-x': { elements: { quote: 'old', author_company: 'old', meta: 'keep' } } } } },
    }
    const res = applyTestimonialsToPageContent(fcIn, 'service', [t({ authorCompany: 'Acme', authorPhotoUrl: 'https://p/y.webp' })])!
    const el = (res.finalContent as any).pages.home.content['testimonials-x'].elements
    expect(el.quote).toBe('Great product')
    expect(el.author_company).toBe('Acme')
    expect(el.author_photo).toBe('https://p/y.webp')
    expect(el.meta).toBe('keep')
  })

  it('resolves home by pathSlug even when the page key is not "home"', () => {
    const fcIn = {
      pages: {
        p1: { id: 'p1', pathSlug: '/', content: { 'testimonials-z': { elements: { testimonials: [] } } } },
        p2: { id: 'p2', pathSlug: '/contact', content: { 'contact-1': { elements: {} } } },
      },
    }
    const res = applyTestimonialsToPageContent(fcIn, 'product', [t({ id: 'a' })])!
    expect(res.sectionId).toBe('testimonials-z')
    expect((res.finalContent as any).pages.p1.content['testimonials-z'].elements.testimonials).toHaveLength(1)
  })

  it('falls back to a non-home page when home has no testimonials section', () => {
    const fcIn = {
      pages: {
        home: { id: 'home', pathSlug: '/', content: { 'hero-1': { elements: {} } } },
        sub: { id: 'sub', pathSlug: '/about', content: { 'testimonials-s': { elements: { testimonials: [] } } } },
      },
    }
    const res = applyTestimonialsToPageContent(fcIn, 'product', [t({ id: 'a' })])!
    expect(res.sectionId).toBe('testimonials-s')
    expect((res.finalContent as any).pages.sub.content['testimonials-s'].elements.testimonials).toHaveLength(1)
  })

  it('returns null when no page has a testimonials section', () => {
    const fcIn = { pages: { home: { id: 'home', pathSlug: '/', content: { 'hero-1': { elements: {} } } } } }
    expect(applyTestimonialsToPageContent(fcIn, 'product', [t()])).toBeNull()
  })
})

describe('applyTestimonialsToPageContent — guards', () => {
  it('returns null when there is no testimonials section (legacy)', () => {
    const content = { content: { 'hero-1': { layout: 'X', elements: {} } } }
    expect(applyTestimonialsToPageContent(content, 'product', [t()])).toBeNull()
  })
  it('returns null on empty selection or missing content', () => {
    expect(applyTestimonialsToPageContent(legacyProduct(), 'product', [])).toBeNull()
    expect(applyTestimonialsToPageContent(null, 'product', [t()])).toBeNull()
    expect(applyTestimonialsToPageContent({}, 'product', [t()])).toBeNull()
  })
})

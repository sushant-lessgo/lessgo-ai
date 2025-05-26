import type { CtaConfigType } from "@/types"

export type GPTOutput = {
  meta: {
    marketCategory: string
    marketSubcategory: string
    targetAudience: string
    problemBeingSolved: string
  }
  
    theme: string
  
  hero: {
    headline: string
    subheadline: string
    cta_text: string
    urgency_text: string
    body_text?: string
    hero_image?: string | null;

    ctaConfig: CtaConfigType | null
  }
  before_after: {
    section_headline: string
    before_title: string
    before_points: string[]
    after_title: string
    after_points: string[]
  }
  how_it_works: {
    section_headline: string
    steps: { title: string; description: string }[]
  }
  testimonials: { quote: string; name: string }[]
  offer: {
    headline: string
    bullets: string[]
    cta_text: string
    urgency_text: string
    ctaConfig: CtaConfigType | null
  }
  faq: { question: string; answer: string }[]
  
  visibleSections: {
    hero: true
    before_after: true
    how_it_works: true
    testimonials: true
    offer: true
    faq: true
  }
}

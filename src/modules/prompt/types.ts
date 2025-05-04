export type GPTOutput = {
  hero: {
    headline: string
    subheadline: string
    cta_text: string
    urgency_text: string
    body_text?: string
    hero_image?: string
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
  }
  faq: { question: string; answer: string }[]
  explanation: {
    critical_assumptions: string[]
    target_persona: {
      role: string
      pain_points: string
      aspirations: string
      sophistication_level: string
    }
    market_positioning: {
      category: string
      primary_competitors: string[]
      key_differentiation: string
    }
    copywriting_strategy: {
      tone: string
      structure_choice: string
      persuasion_focus: string
    }
  }
}

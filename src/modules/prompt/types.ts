export type GPTOutput = {
    headline: string
    subheadline: string
    cta: string
    urgency: string
    features: { title: string; description: string }[]
    testimonials: { quote: string; name: string }[]
    faq: { question: string; answer: string }[]
  }
  
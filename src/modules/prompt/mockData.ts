import type { GPTOutput } from "@/modules/prompt/types"

export const mockGPTOutput: GPTOutput = {
  hero: {
    headline: "Effortlessly Shed Pounds Without The Gym",
    subheadline: "Transform your body and stay fit without breaking a sweat",
    cta_text: "Start Your Transformation",
    urgency_text: "Limited spots available this month",
    body_text: "Our proven system helps busy professionals get fit on their own schedule",
    hero_image: "/placeholder-hero.png"
  },
  before_after: {
    section_headline: "Experience the Change",
    before_title: "Before Using FitNow",
    before_points: [
      "Struggling to find time for workouts",
      "Feeling burned out and low on energy",
      "Worrying about health and body image"
    ],
    after_title: "After Using FitNow",
    after_points: [
      "Fitting fitness into your busy schedule",
      "Feeling energized and motivated",
      "Confident and in control of your body"
    ]
  },
  how_it_works: {
    section_headline: "How FitNow Works",
    steps: [
      { title: "Sign Up", description: "Complete a quick onboarding process to personalize your journey" },
      { title: "Follow the Plan", description: "Daily micro-habits and guided steps tailored to you" },
      { title: "See the Results", description: "Watch your body transform over the weeks without burnout" }
    ]
  },
  testimonials: [
    {
      quote: "FitNow helped me lose 12 kg in 3 months without setting foot in a gym. Life-changing!",
      name: "Anita Verma"
    },
    {
      quote: "I finally feel in control of my health. The steps are simple, yet so effective.",
      name: "Michael Lee"
    }
  ],
  offer: {
    headline: "Get Started with Your Personal Fitness Plan",
    bullets: [
      "100% online, no equipment needed",
      "Customized for your lifestyle",
      "Daily guidance and accountability",
      "Cancel anytime, no contracts"
    ],
    cta_text: "Claim Your Free Trial",
    urgency_text: "Offer ends in 48 hours"
  },
  faq: [
    {
      question: "Do I need special equipment?",
      answer: "No. The program is designed to work without any equipment."
    },
    {
      question: "How much time does it take daily?",
      answer: "You’ll need 15-20 minutes per day, fully guided."
    }
  ],
  explanation: {
    critical_assumptions: [
      "Target user lacks time and motivation for traditional workouts",
      "Digital guidance is as effective as in-person training",
      "Behavioral consistency matters more than intensity"
    ],
    target_persona: {
      role: "Busy urban professional, aged 28–40",
      pain_points: "No time for gym, low energy, frustration with yo-yo diets",
      aspirations: "Feel fit, energized, and in control without overhauling lifestyle",
      sophistication_level: "Familiar with fitness basics but needs guidance and structure"
    },
    market_positioning: {
      category: "Digital Fitness & Wellness",
      primary_competitors: ["Noom", "Freeletics", "MyFitnessPal"],
      key_differentiation: "Micro-habit based system with zero gym time required"
    },
    copywriting_strategy: {
      tone: "Empathetic, motivating, and direct",
      structure_choice: "Before/After followed by step-by-step clarity",
      persuasion_focus: "Ease, time efficiency, transformation without burnout"
    }
  }
}

import type { GPTOutput } from "@/modules/prompt/types"
import HeroSection from "./HeroSection"
import BeforeAfterSection from "./BeforeAfterSection"
import HowItWorksSection from "./HowItWorksSection"
import TestimonialsSection from "./TestimonialsSection"
import OfferSection from "./OfferSection"
import FAQSection from "./FAQSection"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  data: GPTOutput
  dispatch: React.Dispatch<Action>
  isStaticExport?: boolean
}

export default function LandingPagePreview({ data, dispatch, isStaticExport }: Props) {

  return (
    <div className="flex flex-col gap-24 max-w-full overflow-hidden">
      <HeroSection
        headline={data.hero.headline}
        subheadline={data.hero.subheadline}
        cta_text={data.hero.cta_text}
        urgency_text={data.hero.urgency_text}
        body_text={data.hero.body_text}
        hero_image={data.hero.hero_image}
        dispatch={dispatch}
        isEditable={!isStaticExport}
      />

      <BeforeAfterSection
        section_headline={data.before_after.section_headline}
        before_title={data.before_after.before_title}
        before_points={data.before_after.before_points}
        after_title={data.before_after.after_title}
        after_points={data.before_after.after_points}
        dispatch={dispatch}
        isEditable={!isStaticExport}
      />

      <HowItWorksSection
        section_headline={data.how_it_works.section_headline}
        steps={data.how_it_works.steps}
        dispatch={dispatch}
        isEditable={!isStaticExport}
      />

      <TestimonialsSection
        testimonials={data.testimonials}
        dispatch={dispatch}
        isEditable={!isStaticExport}
      />

      <OfferSection
        headline={data.offer.headline}
        bullets={data.offer.bullets}
        cta_text={data.offer.cta_text}
        urgency_text={data.offer.urgency_text}
        dispatch={dispatch}
        isEditable={!isStaticExport}
      />

<FAQSection faq={data.faq} dispatch={dispatch} isStaticExport={isStaticExport} isEditable={!isStaticExport} />

    </div>
  )
}

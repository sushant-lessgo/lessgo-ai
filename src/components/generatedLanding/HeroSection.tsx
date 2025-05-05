import EditableText from "@/modules/generatedLanding/EditableText"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  headline: string
  subheadline: string
  cta_text: string
  urgency_text?: string
  body_text?: string
  hero_image?: string
  dispatch: React.Dispatch<Action>
}

export default function HeroSection({
  headline,
  subheadline,
  cta_text,
  urgency_text,
  body_text,
  hero_image = "/placeholder.png",
  dispatch,
}: Props) {
  return (
    <section className="w-full py-20 bg-landing-mutedBg">
      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <EditableText
            value={headline}
            onChange={(val) =>
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.headline", value: val } })
            }
            className="text-4xl leading-tight md:text-5xl font-extrabold text-landing-textPrimary max-w-xl"
          />

          <EditableText
            value={subheadline}
            onChange={(val) =>
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.subheadline", value: val } })
            }
            className="text-lg text-landing-textSecondary max-w-xl"
          />

          {body_text && (
            <EditableText
              value={body_text}
              onChange={(val) =>
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.body_text", value: val } })
              }
              className="text-base text-landing-textMuted max-w-xl"
            />
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <EditableText
              value={cta_text}
              onChange={(val) =>
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.cta_text", value: val } })
              }
              className="bg-landing-primary text-white font-semibold px-6 py-3 rounded-lg text-base hover:bg-landing-primaryHover transition w-full sm:w-auto text-center"
            />
            {urgency_text && (
              <EditableText
                value={urgency_text}
                onChange={(val) =>
                  dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.urgency_text", value: val } })
                }
                className="text-sm text-red-600 sm:mt-0"
              />
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full aspect-[4/3] md:aspect-[16/9] bg-landing-mutedBg border-2 border-dashed border-landing-border rounded-lg flex items-center justify-center text-landing-textMuted text-sm shadow-sm">
        Image placeholder — uploading will be available soon. For now, you can replace the image after downloading the landing page.
</div>

      </div>
    </section>
  )
}

import EditableText from "@/modules/generatedLanding/EditableText"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  headline: string
  bullets: string[]
  cta_text: string
  urgency_text: string
  dispatch: React.Dispatch<Action>
}

export default function OfferSection({
  headline,
  bullets,
  cta_text,
  urgency_text,
  dispatch,
}: Props) {
  return (
    <section className="w-full bg-landing-primary text-white py-24 px-4">
      <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-10">
        
        {/* Headline */}
        <EditableText
          value={headline}
          onChange={(val) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { path: "offer.headline", value: val },
            })
          }
          className="text-3xl md:text-4xl font-bold leading-snug max-w-2xl"
        />

        {/* Urgency Text */}
        <EditableText
          value={urgency_text}
          onChange={(val) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { path: "offer.urgency_text", value: val },
            })
          }
          className="text-white/90 text-base max-w-xl"
        />

        {/* CTA */}
        <EditableText
          value={cta_text}
          onChange={(val) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { path: "offer.cta_text", value: val },
            })
          }
          className="bg-white text-landing-primary font-semibold px-6 py-3 rounded-lg text-base hover:bg-gray-100 transition w-full sm:w-auto text-center"

        />

        {/* Bullet Points */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-white/90 mt-6 max-w-3xl">
          {bullets.map((point, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-landing-accent text-base leading-none">✔</span>
              <EditableText
                value={point}
                onChange={(val) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: { path: `offer.bullets[${i}]`, value: val },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

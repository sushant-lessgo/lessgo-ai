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
    <section className="w-full py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left */}
        <div className="flex flex-col gap-6">
          <EditableText
            value={headline}
            onChange={(val) =>
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.headline", value: val } })
            }
            className="text-4xl md:text-5xl font-bold text-gray-900"
          />

          <EditableText
            value={subheadline}
            onChange={(val) =>
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.subheadline", value: val } })
            }
            className="text-lg text-gray-700"
          />

          {body_text && (
            <EditableText
              value={body_text}
              onChange={(val) =>
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.body_text", value: val } })
              }
              className="text-sm text-gray-600"
            />
          )}

          <EditableText
            value={cta_text}
            onChange={(val) =>
              dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.cta_text", value: val } })
            }
            className="bg-black text-white px-5 py-2 rounded text-sm font-medium inline-block w-max"
          />

          {urgency_text && (
            <EditableText
              value={urgency_text}
              onChange={(val) =>
                dispatch({ type: "UPDATE_FIELD", payload: { path: "hero.urgency_text", value: val } })
              }
              className="text-xs text-red-600 mt-2"
            />
          )}
        </div>

        {/* Right */}
        <div className="w-full h-64 md:h-80 bg-gray-200 flex items-center justify-center rounded">
          <img
            src={hero_image}
            alt="Hero visual"
            className="object-contain w-full h-full"
          />
        </div>
      </div>
    </section>
  )
}

import EditableText from "@/modules/generatedLanding/EditableText"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Testimonial = {
  quote: string
  name: string
  role?: string
  avatar?: string
}

type Props = {
  testimonials: Testimonial[]
  dispatch: React.Dispatch<Action>
}

export default function TestimonialsSection({ testimonials, dispatch }: Props) {
  const first = testimonials[0]

  return (
    <section className="w-full py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        {/* Section Header */}
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
          Customer Testimonials
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-12">
          Don&apos;t just take our word for it
        </h2>

        {/* First Testimonial */}
        {first && (
          <div className="flex flex-col items-center text-left gap-4 max-w-xl mx-auto">
            {first.avatar && (
              <img
                src={first.avatar}
                alt={first.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            )}
            <EditableText
              value={first.quote}
              onChange={(val) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  payload: { path: "testimonials[0].quote", value: val },
                })
              }
              className="text-lg text-gray-800 italic text-center"
            />
            <div className="text-center">
              <EditableText
                value={first.name}
                onChange={(val) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: { path: "testimonials[0].name", value: val },
                  })
                }
                className="font-semibold text-gray-900"
              />
              {first.role && (
                <p className="text-sm text-gray-500">{first.role}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

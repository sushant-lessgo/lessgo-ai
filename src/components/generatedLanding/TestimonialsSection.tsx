import EditableText from "@/modules/generatedLanding/EditableText"
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"
import { trackEdit } from '@/utils/trackEdit';
import type { GPTOutput } from "@/modules/prompt/types"


type Testimonial = {
  quote: string
  name: string
  role?: string
  avatar?: string
}

type Props = {
  testimonials: Testimonial[]
  dispatch: React.Dispatch<Action>
  isEditable: boolean
  sectionId: keyof GPTOutput["visibleSections"];
}

export default function TestimonialsSection({ testimonials, dispatch, isEditable, sectionId, }: Props) {
  const first = testimonials[0]

  return (
    <section className="w-full py-24 bg-landing-mutedBg">
      <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
        {isEditable && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              dispatch({
                type: "SET_SECTION_VISIBILITY",
                payload: { section: sectionId, visible: false },
              })
            }
            className="text-sm text-red-500 hover:underline"
          >
            Hide Section
          </button>
        </div>
      )}
        {/* Section Header */}
        <p className="text-sm font-semibold text-landing-primary uppercase tracking-wider">
          Customer Testimonials
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-3 mb-12 leading-tight">
          Don&apos;t just take our word for it
        </h2>

        {/* First Testimonial */}
        {first && (
          <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto text-center">
            
            {first.avatar && (
              <img
                src={first.avatar}
                alt={first.name}
                className="w-16 h-16 rounded-full object-cover shadow-sm"
              />
            )}

              <EditableWrapper isEditable={isEditable}>
              <EditableText
                value={first.quote}
                onChange={(val) => {
              trackEdit('testimonial', 'quote', val);
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: { path: "testimonials[0].quote", value: val },
                  })
                }}
                className="text-lg text-landing-textMuted italic leading-relaxed"
                isEditable={isEditable}
              />
            </EditableWrapper>

            <div>
              <EditableWrapper isEditable={isEditable}>
                <EditableText
                  value={first.name}
                  onChange={(val) => {
              trackEdit('testimonial', 'name', val);
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: { path: "testimonials[0].name", value: val },
                    })
                  }}
                  className="font-semibold text-landing-textPrimary"
                  isEditable={isEditable}
                />
              </EditableWrapper>
              {first.role && (
                <p className="text-sm text-landing-textMuted">{first.role}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

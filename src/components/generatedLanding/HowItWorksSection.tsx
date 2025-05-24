import EditableText from "@/modules/generatedLanding/EditableText"
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"
import { trackEdit } from '@/utils/trackEdit';
import type { GPTOutput } from "@/modules/prompt/types"

type Step = {
  title: string
  description: string
}

type Props = {
  section_headline: string
  steps: Step[]
  dispatch?: React.Dispatch<Action>
  isEditable: boolean
  sectionId: keyof GPTOutput["visibleSections"];
}

export default function HowItWorksSection({
  section_headline,
  steps,
  dispatch,
  isEditable,
  sectionId,
}: Props) {
  return (
    <section className="w-full py-20 bg-white">


      {isEditable && (
        <div className="flex justify-end">
          <button
            onClick={() =>
              dispatch?.({
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
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col items-center gap-16 text-center">
        
        {/* Section Headline */}
        <EditableWrapper isEditable={isEditable}>
          <EditableText
            value={section_headline}
            onChange={(val) => {
              trackEdit('HowItWorks', 'headline', val);
              dispatch?.({
                type: "UPDATE_FIELD",
                payload: { path: "how_it_works.section_headline", value: val },
              })
            }}
            className="text-3xl md:text-4xl font-bold text-landing-textPrimary leading-snug"
            isEditable={isEditable}
          />
        </EditableWrapper>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 w-full">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center text-center gap-4 px-4">
              
              {/* Step Number */}
              <div className="w-12 h-12 flex items-center justify-center bg-landing-primary text-white font-semibold rounded-full text-base shadow">
                {index + 1}
              </div>

              {/* Step Title */}
              <EditableWrapper isEditable={isEditable}>
                <EditableText
                  value={step.title}
                  onChange={(val) => {
              trackEdit('HowItWorks', 'Step_title', val);
                    dispatch?.({
                      type: "UPDATE_FIELD",
                      payload: {
                        path: `how_it_works.steps[${index}].title`,
                        value: val,
                      },
                    })
                  }}
                  className="text-lg font-semibold text-landing-textPrimary"
                  isEditable={isEditable}
                />
              </EditableWrapper>

              {/* Step Description */}
              <EditableWrapper isEditable={isEditable}>
                <EditableText
                  value={step.description}
                  onChange={(val) => {
              trackEdit('HowItWorks', 'step_description', val);
                    dispatch?.({
                      type: "UPDATE_FIELD",
                      payload: {
                        path: `how_it_works.steps[${index}].description`,
                        value: val,
                      },
                    })
                  }}
                  className="text-sm text-landing-textSecondary max-w-xs"
                  isEditable={isEditable}
                />
              </EditableWrapper>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

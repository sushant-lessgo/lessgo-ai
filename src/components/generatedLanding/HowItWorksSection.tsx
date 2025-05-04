
import EditableText from "@/modules/generatedLanding/EditableText"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Step = {
  title: string
  description: string
}

type Props = {
  section_headline: string
  steps: Step[]
  dispatch: React.Dispatch<Action>
}

export default function HowItWorksSection({
  section_headline,
  steps,
  dispatch,
}: Props) {
  return (
    <section className="w-full py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col items-center text-center gap-12">
        {/* Section Headline */}
        <EditableText
          value={section_headline}
          onChange={(val) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { path: "how_it_works.section_headline", value: val },
            })
          }
          className="text-3xl md:text-4xl font-bold text-gray-900 max-w-3xl leading-snug"
        />

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col items-center gap-4 px-2">
              {/* Step Number Box */}
              <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white font-semibold rounded-md text-sm">
                {index + 1}
              </div>

              {/* Step Title */}
              <EditableText
                value={step.title}
                onChange={(val) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: {
                      path: `how_it_works.steps[${index}].title`,
                      value: val,
                    },
                  })
                }
                className="text-base font-semibold text-gray-900"
              />

              {/* Step Description */}
              <EditableText
                value={step.description}
                onChange={(val) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: {
                      path: `how_it_works.steps[${index}].description`,
                      value: val,
                    },
                  })
                }
                className="text-sm text-gray-600"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

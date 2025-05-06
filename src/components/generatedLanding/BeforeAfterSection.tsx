import EditableText from "@/modules/generatedLanding/EditableText"
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper"

import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type Props = {
  section_headline: string
  before_title: string
  before_points: string[]
  after_title: string
  after_points: string[]
  dispatch: React.Dispatch<Action>
}

export default function BeforeAfterSection({
  section_headline,
  before_title,
  before_points,
  after_title,
  after_points,
  dispatch,
}: Props) {
  return (
    <section className="w-full py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col gap-12">
        
        {/* Section Headline */}


        <EditableWrapper>
          <EditableText
            value={section_headline}
            onChange={(val) =>
              dispatch({
                type: "UPDATE_FIELD",
                payload: { path: "before_after.section_headline", value: val },
              })
            }
            className="text-3xl md:text-4xl font-bold text-center text-landing-textPrimary"
          />
        </EditableWrapper>

        {/* Before / After Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Before Card */}
          <div className="bg-white rounded-xl p-6 shadow border border-landing-border flex flex-col gap-4">
            <p className="text-sm text-landing-textSecondary font-medium">Before</p>

            <EditableWrapper>
              <EditableText
                value={before_title}
                onChange={(val) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: { path: "before_after.before_title", value: val },
                  })
                }
                className="text-xl font-semibold text-landing-textPrimary"
              />
            </EditableWrapper>

            <ul className="space-y-3">
              {before_points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-landing-textMuted">
                  <span className="w-2 h-2 mt-2 rounded-full bg-landing-accent shrink-0"></span>
                  <EditableWrapper>
                    <EditableText
                      value={point}
                      onChange={(val) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          payload: {
                            path: `before_after.before_points[${i}]`,
                            value: val,
                          },
                        })
                      }
                      className="flex-1"
                    />
                  </EditableWrapper>
                </li>
              ))}
            </ul>
          </div>

          {/* After Card */}
          <div className="	bg-landing-primary rounded-xl p-6 shadow text-white flex flex-col gap-4">
            <p className="text-sm text-white/80 font-medium">After</p>

            <EditableWrapper>
              <EditableText
                value={after_title}
                onChange={(val) =>
                  dispatch({
                    type: "UPDATE_FIELD",
                    payload: { path: "before_after.after_title", value: val },
                  })
                }
                className="text-xl font-semibold text-white"
              />
            </EditableWrapper>

            <ul className="space-y-3">
              {after_points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white">
                  <span className="mt-1 text-landing-accent text-lg leading-none">✓</span>
                  <EditableWrapper>
                    <EditableText
                      value={point}
                      onChange={(val) =>
                        dispatch({
                          type: "UPDATE_FIELD",
                          payload: {
                            path: `before_after.after_points[${i}]`,
                            value: val,
                          },
                        })
                      }
                      className="flex-1"
                    />
                  </EditableWrapper>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

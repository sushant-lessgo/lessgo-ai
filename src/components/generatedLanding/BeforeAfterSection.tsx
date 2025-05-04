import EditableText from "@/modules/generatedLanding/EditableText"
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
    <section className="w-full py-16 bg-[#F4F7FF]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-12">
        {/* Section Headline */}
        <EditableText
          value={section_headline}
          onChange={(val) =>
            dispatch({
              type: "UPDATE_FIELD",
              payload: { path: "before_after.section_headline", value: val },
            })
          }
          className="text-3xl md:text-4xl font-bold text-center text-gray-900"
        />

        {/* Before / After Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Card */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-sm text-gray-500 font-medium mb-2">↶ Before</p>

            <EditableText
              value={before_title}
              onChange={(val) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  payload: { path: "before_after.before_title", value: val },
                })
              }
              className="text-xl font-semibold text-gray-900 mb-4"
            />

            <ul className="space-y-3 list-none">
              {before_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="w-2 h-2 mt-2 rounded-full bg-red-400"></span>
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
                </li>
              ))}
            </ul>
          </div>

          {/* After Card */}
          <div className="bg-[#0057FF] rounded-xl p-6 shadow-sm text-white">
            <p className="text-sm text-white/80 font-medium mb-2">↷ After</p>

            <EditableText
              value={after_title}
              onChange={(val) =>
                dispatch({
                  type: "UPDATE_FIELD",
                  payload: { path: "before_after.after_title", value: val },
                })
              }
              className="text-xl font-semibold text-white mb-4"
            />

            <ul className="space-y-3 list-none">
              {after_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-white text-sm">
                  <span className="mt-1">✓</span>
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
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

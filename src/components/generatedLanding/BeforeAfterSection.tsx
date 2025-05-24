import EditableText from "@/modules/generatedLanding/EditableText"
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper"
import { trackEdit } from '@/utils/trackEdit';
import type { Action } from "@/modules/generatedLanding/landingPageReducer"
import type { GPTOutput } from "@/modules/prompt/types"
import { useEffect } from "react";

type Props = {
  section_headline: string
  before_title: string
  before_points: string[]
  after_title: string
  after_points: string[]
  dispatch?: React.Dispatch<Action>
  isEditable: boolean
  sectionId: keyof GPTOutput["visibleSections"];
}

export default function BeforeAfterSection({
  section_headline,
  before_title,
  before_points,
  after_title,
  after_points,
  dispatch,
  isEditable,
  sectionId,
}: Props) {





  return (
    <section className="w-full py-20 	bg-landing-mutedBg">
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex flex-col gap-12">
        
        {/* Section Headline */}
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

        <EditableWrapper isEditable={isEditable}>
          <EditableText
            value={section_headline}
            onChange={(val) => {
              
              trackEdit('before_after', 'section_headline', val);
              
              dispatch?.({
                type: "UPDATE_FIELD",
                payload: { path: "before_after.section_headline", value: val },
              })
            }}
            className="text-3xl md:text-4xl font-bold text-center text-landing-textPrimary"
            isEditable={isEditable}
          />
        </EditableWrapper>

        {/* Before / After Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Before Card */}
          <div className="bg-white rounded-xl p-6 shadow border border-landing-border flex flex-col gap-4">
            <p className="text-sm text-landing-textSecondary font-medium">Before</p>

            <EditableWrapper isEditable={isEditable}>
              <EditableText
                value={before_title}
                onChange={(val) => {
                  trackEdit('before_after', 'before_title', val);
                  dispatch?.({
                    type: "UPDATE_FIELD",
                    payload: { path: "before_after.before_title", value: val },
                  })
                }}
                className="text-xl font-semibold text-landing-textPrimary"
                isEditable={isEditable}
              />
            </EditableWrapper>

            <ul className="space-y-3">
              {before_points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-landing-textMuted">
                  <span className="w-2 h-2 mt-2 rounded-full bg-landing-accent shrink-0"></span>
                  <EditableWrapper isEditable={isEditable}>
                    <EditableText
                      value={point}
                      onChange={(val) => {
                        trackEdit('before_after', 'before_points', val);
                        dispatch?.({
                          type: "UPDATE_FIELD",
                          payload: {
                            path: `before_after.before_points[${i}]`,
                            value: val,
                          },
                        })
                      }}
                      className="flex-1"
                      isEditable={isEditable}
                    />
                  </EditableWrapper>
                </li>
              ))}
            </ul>
          </div>

          {/* After Card */}
          <div className="	bg-landing-primary rounded-xl p-6 shadow text-white flex flex-col gap-4">
            <p className="text-sm text-white/80 font-medium">After</p>

            <EditableWrapper useAltHover={true} isEditable={isEditable} >
              <EditableText
                value={after_title}
                onChange={(val) => {
                    trackEdit('before_after', 'after_title', val);
                  dispatch?.({
                    type: "UPDATE_FIELD",
                    payload: { path: "before_after.after_title", value: val },
                  })
                }}
                className="text-xl font-semibold"
                isEditable={isEditable}
              />
            </EditableWrapper>

            <ul className="space-y-3">
              {after_points.map((point, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-white">
                  <span className="mt-1 text-landing-accent text-lg leading-none">✓</span>
                  <EditableWrapper useAltHover={true} isEditable={isEditable}>
                    <EditableText
                      value={point}
                      onChange={(val) => {
                        trackEdit('before_after', 'after_points', val);
                        dispatch?.({
                          type: "UPDATE_FIELD",
                          payload: {
                            path: `before_after.after_points[${i}]`,
                            value: val,
                          },
                        })
                      }}
                      className="flex-1"
                      isEditable={isEditable}
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

'use client'

import { useState } from "react";
import EditableText from "@/modules/generatedLanding/EditableText";
import EditableWrapper from "@/modules/generatedLanding/EditableWrapper";
import type { Action } from "@/modules/generatedLanding/landingPageReducer";
import { trackEdit } from '@/utils/trackEdit';
import type { GPTOutput } from "@/modules/prompt/types";

type FAQItem = {
  question: string;
  answer: string;
};

type Props = {
  faq: FAQItem[];
  dispatch?: React.Dispatch<Action>;
  isStaticExport?: boolean;
  isEditable: boolean;
  sectionId: keyof GPTOutput["visibleSections"];
};

export default function FAQSection({
  faq,
  dispatch,
  isStaticExport,
  isEditable,
  sectionId,
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const isTwoColumn = false; // Optional: can use if needed for layout width

  return (
    <section className="w-full py-24 bg-landing-mutedBg">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
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

        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-landing-textPrimary">
          FAQs
        </h2>

        {/* FAQ List */}
        <div className="divide-y divide-gray-200 border-t border-b">
          {faq.map((item, index) => (
            <div key={index} className="py-6">
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center text-left font-semibold text-landing-textPrimary text-base"
              >
                <EditableWrapper isEditable={isEditable}>
                  <EditableText
                    value={item.question}
                    onChange={(val) => {
                      trackEdit("faq", "item_question", val);
                      dispatch?.({
                        type: "UPDATE_FIELD",
                        payload: {
                          path: `faq[${index}].question`,
                          value: val,
                        },
                      });
                    }}
                    className="flex-1 text-left"
                    isEditable={isEditable}
                  />
                </EditableWrapper>
                <span className="ml-4 text-xl leading-none text-landing-textSecondary">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <EditableWrapper isEditable={isEditable}>
                  <EditableText
                    value={item.answer}
                    onChange={(val) => {
                      trackEdit("faq", "item_answer", val);
                      dispatch?.({
                        type: "UPDATE_FIELD",
                        payload: {
                          path: `faq[${index}].answer`,
                          value: val,
                        },
                      });
                    }}
                    className="mt-3 text-sm text-landing-textSecondary"
                    isEditable={isEditable}
                  />
                </EditableWrapper>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

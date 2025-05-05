import { useState } from "react"
import EditableText from "@/modules/generatedLanding/EditableText"
import type { Action } from "@/modules/generatedLanding/landingPageReducer"

type FAQItem = {
  question: string
  answer: string
}

type Props = {
  faq: FAQItem[]
  dispatch: React.Dispatch<Action>
}

export default function FAQSection({ faq, dispatch }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        
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
                <EditableText
                  value={item.question}
                  onChange={(val) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        path: `faq[${index}].question`,
                        value: val,
                      },
                    })
                  }
                  className="flex-1 text-left"
                />
                <span className="ml-4 text-xl leading-none text-landing-textSecondary">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>

              {openIndex === index && (
                <EditableText
                  value={item.answer}
                  onChange={(val) =>
                    dispatch({
                      type: "UPDATE_FIELD",
                      payload: {
                        path: `faq[${index}].answer`,
                        value: val,
                      },
                    })
                  }
                  className="mt-3 text-sm text-landing-textSecondary"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

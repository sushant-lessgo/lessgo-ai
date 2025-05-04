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
    <section className="w-full py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          FAQs
        </h2>
        <p className="text-center text-gray-600 mb-12 text-sm">
          Have a different question and can't find the answer you're looking for? Reach out to our support team by{" "}
          <a href="mailto:support@lessgo.ai" className="text-blue-600 underline">
            sending us an email
          </a>{" "}
          and we’ll get back to you as soon as we can.
        </p>

        {/* FAQ List */}
        <div className="divide-y divide-gray-200">
          {faq.map((item, index) => (
            <div key={index} className="py-4">
              <button
                onClick={() => toggle(index)}
                className="w-full flex justify-between items-center text-left font-medium text-gray-900 text-base"
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
                />
                <span className="text-xl">
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
                  className="mt-3 text-sm text-gray-600"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import DownloadButton from "@/components/generatedLanding/DownloadButton"

import type { GPTOutput } from "@/modules/prompt/types"

type Props = {
  data: GPTOutput
}

export default function GeneratedLanding({ data }: Props) {
  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <section className="text-center">
        <h1 className="text-3xl font-bold">{data.headline}</h1>
        <p className="text-lg text-gray-600 mt-2">{data.subheadline}</p>
        <button className="mt-4 px-6 py-2 bg-black text-white rounded">
          {data.cta}
        </button>
        <p className="text-sm text-red-600 mt-2">{data.urgency}</p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <ul className="space-y-2">
          {data.features.map((f, i) => (
            <li key={i}>
              <strong>{f.title}</strong>: {f.description}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Testimonials</h2>
        <ul className="space-y-2">
          {data.testimonials.map((t, i) => (
            <li key={i}>
              <blockquote>"{t.quote}"</blockquote>
              <cite className="text-sm text-gray-500">- {t.name}</cite>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">FAQs</h2>
        <ul className="space-y-4">
          {data.faq.map((q, i) => (
            <li key={i}>
              <p className="font-semibold">{q.question}</p>
              <p>{q.answer}</p>
            </li>
          ))}
        </ul>
      </section>
      <DownloadButton content={data} />
    </div>
  )


}



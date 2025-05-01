"use client"

import { generateHTML, downloadHTMLFile } from "@/modules/export/htmlExporter"
import type { GPTOutput } from "@/modules/prompt/types"

type Props = {
  content: GPTOutput
}

export default function DownloadButton({ content }: Props) {
  return (
    <button
      onClick={() => {
        const html = generateHTML(content)
        downloadHTMLFile(html)
      }}
      className="mt-8 px-6 py-2 bg-green-700 text-white rounded"
    >
      Download HTML
    </button>
  )
}

"use client"

import { useRef } from "react"

export default function ActionButtons() {
  const previewRef = useRef<HTMLDivElement | null>(null)

  const handleDownload = () => {
    const content = document.getElementById("landing-page-preview")
    if (!content) return

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Landing Page</title><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body>${content.innerHTML}</body></html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "landing-page.html"
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePreview = () => {
    const content = document.getElementById("landing-page-preview")
    if (!content) return

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Preview</title><link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet"></head><body>${content.innerHTML}</body></html>`

    const previewWindow = window.open("", "_blank")
    if (previewWindow) {
      previewWindow.document.open()
      previewWindow.document.write(html)
      previewWindow.document.close()
    }
  }

  return (
    <div className="w-full max-w-[800px] sticky bottom-0 z-10 bg-slate-50 border-gray-200 py-4 px-4 flex justify-end gap-4">

  <button
    onClick={handlePreview}
    className="bg-white border border-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-100"
  >
    Preview
  </button>
  <button
    onClick={handleDownload}
    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
  >
    Generate HTML
  </button>
</div>

  )
}

import type { GPTOutput } from "@/modules/prompt/types"

export function generateHTML(content: GPTOutput): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${content.headline}</title>
  <style>
    body { font-family: sans-serif; margin: 2rem; line-height: 1.6; background: #f9f9f9; color: #111; }
    .container { max-width: 800px; margin: auto; background: #fff; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
    h1, h2 { color: #111; }
    button { padding: 10px 20px; background: #111; color: white; border: none; border-radius: 4px; margin-top: 10px; }
    .urgency { color: red; margin-top: 10px; }
    ul { padding-left: 1.2rem; }
    li { margin-bottom: 0.5rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${content.headline}</h1>
    <p>${content.subheadline}</p>
    <button>${content.cta}</button>
    <div class="urgency">${content.urgency}</div>

    <h2>Features</h2>
    <ul>
      ${content.features.map(f => `<li><strong>${f.title}</strong>: ${f.description}</li>`).join("")}
    </ul>

    <h2>Testimonials</h2>
    <ul>
      ${content.testimonials.map(t => `<li>"${t.quote}" — <em>${t.name}</em></li>`).join("")}
    </ul>

    <h2>FAQs</h2>
    <ul>
      ${content.faq.map(q => `<li><strong>${q.question}</strong><br/>${q.answer}</li>`).join("")}
    </ul>
  </div>
</body>
</html>
`.trim()
}

export function downloadHTMLFile(html: string, filename = "landing.html") {
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
  
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
  
    URL.revokeObjectURL(url)
  }
  
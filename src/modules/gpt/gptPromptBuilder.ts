export function buildPrompt(productIdea: string) {
    return [
      {
        role: "system",
        content:
          "You are a world-class SaaS copywriter. Given minimal product info, generate persuasive landing page copy. Output strictly in JSON with keys: headline, subheadline, cta, urgency, features[], testimonials[], faq[].",
      },
      {
        role: "user",
        content: `Here is the product idea:\n${productIdea}\nRespond ONLY in this format:\n{\n"headline": "...",\n"subheadline": "...",\n"cta": "...",\n"urgency": "...",\n"features": [...],\n"testimonials": [...],\n"faq": [...]\n}`,
      },
    ]
  }
  
// Service-shaped website-extraction prompt for
// /api/v2/scrape-website?audienceType=service. Sibling to the product
// buildScrapePrompt inlined in src/app/api/v2/scrape-website/route.ts.
// Same `## PAGE:`-aware framing; service-shaped fields; the verbatim /
// no-fabrication testimonial guardrails are copied exactly — they are the
// whole point of importing REAL testimonials.

export function buildServiceScrapePrompt(combinedText: string): string {
  return `You are extracting landing-page inputs for a SERVICE business (agency, consultancy, coaching, freelance, productized service, or local service) from the text of its existing website (multiple pages concatenated, each under a "## PAGE:" marker).

WEBSITE TEXT:
"""
${combinedText}
"""

Return a JSON object:
- oneLiner: one clear sentence describing the service offered and who it's for (>= 10 chars)
- businessName: the business / studio name, or "" if not clearly stated
- whatYouDo: a single clear sentence describing the service and the result clients get
- services: 1-6 specific services offered (short phrases, e.g. ["Brand identity", "Packaging design", "Marketing site"])
- targetClients: 1-3 target client types (e.g. ["DTC skincare founders", "Early-stage SaaS teams"])
- outcomes: 1-6 concrete results or differentiators clients can expect (short phrases) — proof points, NOT product features
- deliveryModel: one of "remote", "in-person", or "hybrid"
- offer: the main call-to-action / offer the visitor gets (e.g. "Free 30-min audit", "Book a call"), or "" if none is evident
- goal: best-guess primary goal — one of book-call | request-quote | lead-magnet — or null if unclear
- testimonials: up to 3 REAL client testimonials found anywhere in the text, each { quote, author_name, author_role }

RULES:
- Extract only what is stated or strongly implied across the pages — do NOT invent. Speak about the provider person-to-person; services are sold by people, not shipped as products.
- Copy testimonial quotes WORD-FOR-WORD. Do not paraphrase, shorten, or fix grammar. Preserve any numbers/metrics exactly (e.g. "grew revenue 3x"). If author name or role is missing, use "".
- If there are no real testimonials, return an empty array. Never fabricate testimonials, client names, or numbers.`;
}

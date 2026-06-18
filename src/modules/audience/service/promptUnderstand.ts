// Service-shaped extraction prompt for /api/v2/understand?audienceType=service.
// Sibling to the product prompt inlined in src/app/api/v2/understand/route.ts.
// Frames extraction for service businesses (agencies, consultancies, coaches,
// freelancers, productized + local services). "outcomes" = results /
// differentiators, deliberately NOT product "features".

export function buildServiceUnderstandPrompt(oneLiner: string): string {
  return `Extract landing-page inputs for a SERVICE business (agency, consultancy, coaching, freelance, productized service, or local service) from this description:

"${oneLiner}"

Return a JSON object with:
- whatYouDo: one clear sentence describing the service you provide and the result clients get
- services: 1-6 specific services offered (short phrases, e.g. ["Brand identity", "Packaging design", "Marketing site"])
- targetClients: 1-3 target client types (e.g. ["DTC skincare founders", "Early-stage SaaS teams"])
- outcomes: 1-6 concrete results or differentiators clients can expect (short phrases, e.g. ["Launch-ready in 4 weeks", "Conversion-focused copy", "Senior-only team"]) — these are proof points, NOT product features
- deliveryModel: one of "remote", "in-person", or "hybrid"

Be specific and practical. Extract what's stated or strongly implied. Speak about the provider person-to-person — services are sold by people, not shipped as products.`;
}

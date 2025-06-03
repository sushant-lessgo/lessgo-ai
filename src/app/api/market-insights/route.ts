import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { category, subcategory, problem, audience, startupStage, pricing, goal } = body;

  // Example stub response — replace with OpenAI/Mistral call later
  const features = [
    { feature: "Real-time insights", benefit: "Make fast, confident decisions" },
    { feature: "Custom landing pages", benefit: "Improve conversions with tailored UX" },
  ];

  return NextResponse.json({ features });
}

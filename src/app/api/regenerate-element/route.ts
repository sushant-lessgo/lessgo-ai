import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { sectionId, elementKey, currentContent, variationCount = 5 } = await req.json();

    if (!sectionId || !elementKey || !currentContent) {
      return NextResponse.json({ 
        error: "Invalid request", 
        detail: "sectionId, elementKey, and currentContent are required" 
      }, { status: 400 });
    }

    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    // Check for mock data usage
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      console.log("Using mock response for element variations");
      
      const mockVariations = generateMockVariations(currentContent, variationCount);
      
      return NextResponse.json({
        variations: mockVariations,
        originalContent: currentContent,
        elementKey,
        sectionId
      });
    }

    const useOpenAI = process.env.USE_OPENAI === "true";
    const model = useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1";

    // Create prompt for generating variations
    const prompt = `Generate ${variationCount} different variations of this content while maintaining the same meaning and intent:

Original content: "${currentContent}"

Requirements:
- Keep the same core message and purpose
- Vary the tone, style, and word choice
- Maintain appropriate length
- Return as a JSON array of strings

Example format:
["variation 1", "variation 2", "variation 3", ...]`;

    // Try primary AI provider
    let result = await callAIProvider(prompt, useOpenAI, model);
    
    // Fallback to secondary provider
    if (!result.success) {
      console.warn(`Primary provider failed, trying secondary...`);
      result = await callAIProvider(prompt, !useOpenAI, !useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1");
    }

    // Final fallback to mock
    if (!result.success) {
      console.error("Both AI providers failed, returning mock variations");
      const mockVariations = generateMockVariations(currentContent, variationCount);
      return NextResponse.json({
        variations: mockVariations,
        originalContent: currentContent,
        elementKey,
        sectionId,
        isPartial: true,
        warnings: ["AI providers unavailable, using template variations"]
      });
    }

    // Parse AI response
    const aiContent = result.data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("No content received from AI provider");
    }

    let variations;
    try {
      // Try to parse as JSON array
      variations = JSON.parse(aiContent);
      if (!Array.isArray(variations)) {
        throw new Error("AI response is not an array");
      }
    } catch (parseError) {
      // Fallback: split by lines and clean up
      variations = aiContent
        .split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').trim())
        .filter((line: string) => line.length > 0)
        .slice(0, variationCount);
    }

    return NextResponse.json({
      variations,
      originalContent: currentContent,
      elementKey,
      sectionId
    });

  } catch (err) {
    console.error("Element regeneration error:", err);
    
    try {
      const { currentContent, variationCount = 5 } = await req.json();
      const mockVariations = generateMockVariations(currentContent || "", variationCount);
      return NextResponse.json({
        variations: mockVariations,
        originalContent: currentContent,
        isPartial: true,
        warnings: ["Server error occurred, using fallback variations"]
      });
    } catch {
      return NextResponse.json({ 
        error: "Internal server error", 
        isPartial: true,
        variations: [],
        warnings: ["Complete system failure"]
      }, { status: 500 });
    }
  }
}

function generateMockVariations(content: string, count: number): string[] {
  const variations = [];
  const baseContent = content || "Default content";
  
  for (let i = 0; i < count; i++) {
    switch (i % 5) {
      case 0:
        variations.push(`${baseContent} - Enhanced version`);
        break;
      case 1:
        variations.push(`${baseContent} - Professional tone`);
        break;
      case 2:
        variations.push(`${baseContent} - Casual approach`);
        break;
      case 3:
        variations.push(`${baseContent} - Technical focus`);
        break;
      case 4:
        variations.push(`${baseContent} - Persuasive style`);
        break;
    }
  }
  
  return variations;
}

async function callAIProvider(prompt: string, useOpenAI: boolean, model: string) {
  try {
    const apiURL = useOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.studio.nebius.ai/v1/chat/completions";

    const apiKey = useOpenAI
      ? process.env.OPENAI_API_KEY
      : process.env.NEBIUS_API_KEY;

    if (!apiKey) {
      console.error(`Missing API key for ${useOpenAI ? 'OpenAI' : 'Nebius'}`);
      return { success: false, error: "Missing API key" };
    }

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`${useOpenAI ? "OpenAI" : "Nebius"} API Error:`, result);
      return { success: false, error: result };
    }

    return { success: true, data: result };

  } catch (error) {
    console.error(`Error calling ${useOpenAI ? 'OpenAI' : 'Nebius'}:`, error);
    return { success: false, error };
  }
}
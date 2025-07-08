// api/regenerate-content/route.ts - NEW FILE

import { NextResponse } from "next/server";
import { parseAiResponse } from "@/modules/prompt/parseAiResponse";
import { generateMockResponse } from "@/modules/prompt/mockResponseGenerator";

export async function POST(req: Request) {
  try {
    const { prompt, preserveDesign, currentDesign, updatedInputs, newDesign } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ 
        error: "Invalid request", 
        detail: "Prompt is required and must be a string" 
      }, { status: 400 });
    }

    const DEMO_TOKEN = "lessgodemomockdata";
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    // Check for mock data usage
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || token === DEMO_TOKEN) {
      console.log("Using mock response for content regeneration");
      const mockResponse = generateMockResponse(prompt);
      const parsed = parseAiResponse(mockResponse.choices[0].message.content);
      
      return NextResponse.json({
        ...parsed,
        preservedElements: preserveDesign ? Object.keys(currentDesign?.sectionLayouts || {}) : [],
        updatedElements: Object.keys(parsed.content || {}),
        regenerationType: preserveDesign ? 'content-only' : 'design-and-copy',
      });
    }

    const useOpenAI = process.env.USE_OPENAI === "true";
    const model = useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1";

    // Enhanced prompt based on regeneration type
    let enhancedPrompt = prompt;
    if (preserveDesign) {
      enhancedPrompt += `\n\nCONTENT-ONLY MODE: Preserve all design elements, only update text content.`;
    } else if (newDesign) {
      enhancedPrompt += `\n\nDESIGN + COPY MODE: Use updated design elements (layouts, backgrounds) with new copy.`;
    }

    // Try primary AI provider
    let result = await callAIProvider(enhancedPrompt, useOpenAI, model);
    
    // Fallback to secondary provider
    if (!result.success) {
      console.warn(`Primary provider failed, trying secondary...`);
      result = await callAIProvider(enhancedPrompt, !useOpenAI, !useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1");
    }

    // Final fallback to mock
    if (!result.success) {
      console.error("Both AI providers failed, returning mock response");
      const mockResponse = generateMockResponse(prompt);
      const parsed = parseAiResponse(mockResponse.choices[0].message.content);
      parsed.isPartial = true;
      parsed.warnings = parsed.warnings || [];
      parsed.warnings.push("AI providers unavailable, using template content");
      return NextResponse.json(parsed);
    }

    // Parse and validate AI response
    const aiContent = result.data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("No content received from AI provider");
    }

    const parsed = parseAiResponse(aiContent);
    
    // Add regeneration metadata
    return NextResponse.json({
      ...parsed,
      preservedElements: preserveDesign ? Object.keys(currentDesign?.sectionLayouts || {}) : [],
      updatedElements: Object.keys(parsed.content || {}),
      regenerationType: preserveDesign ? 'content-only' : 'design-and-copy',
    });

  } catch (err) {
    console.error("Content regeneration error:", err);
    
    try {
      const { prompt } = await req.json();
      const mockResponse = generateMockResponse(prompt || "");
      const parsed = parseAiResponse(mockResponse.choices[0].message.content);
      parsed.isPartial = true;
      parsed.warnings = ["Server error occurred, using fallback content"];
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ 
        error: "Internal server error", 
        isPartial: true,
        content: {},
        warnings: ["Complete system failure"]
      }, { status: 500 });
    }
  }
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
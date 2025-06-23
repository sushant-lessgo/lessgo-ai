// modules/inference/generateFeatures.ts

type FeatureItem = {
  feature: string;
  benefit: string;
};

interface InputData {
  marketCategory: string;
  marketSubcategory: string;
  keyProblem: string;
  targetAudience: string;
  startupStage: string;
  pricingModel: string;
  landingGoal: string;
}

export async function generateFeatures(inputData: InputData): Promise<FeatureItem[]> {
  const {
    marketCategory,
    marketSubcategory,
    keyProblem,
    targetAudience,
    startupStage,
    pricingModel,
    landingGoal,
  } = inputData;

  // Create the prompt for AI feature generation
  const prompt = `
Based on the following product information, generate 4-6 key product features with their corresponding benefits. Each feature should be concise (2-4 words) and each benefit should explain the value to the user (8-12 words).

Product Information:
- Market Category: ${marketCategory}
- Market Subcategory: ${marketSubcategory}
- Key Problem: ${keyProblem}
- Target Audience: ${targetAudience}
- Startup Stage: ${startupStage}
- Pricing Model: ${pricingModel}
- Landing Goal: ${landingGoal}

Please respond with a JSON array in this exact format:
[
  {
    "feature": "Feature Name",
    "benefit": "Clear benefit that solves the problem"
  }
]

Guidelines:
- Features should be relevant to the market category and subcategory
- Benefits should address the key problem mentioned
- Language should match the target audience sophistication level
- Consider the startup stage when determining feature complexity
- Align with the pricing model and landing goal

Generate between 4-6 features that would be most compelling for this specific use case.
`;

  try {
    const useOpenAI = process.env.USE_OPENAI === "true";
    let result = await callAIProvider(prompt, useOpenAI);
    
    // If primary fails, try secondary provider
    if (!result.success) {
      console.warn(`Primary AI provider (${useOpenAI ? 'OpenAI' : 'Nebius'}) failed, trying secondary...`);
      result = await callAIProvider(prompt, !useOpenAI);
    }

    if (!result.success) {
      throw new Error("Both AI providers failed");
    }

    const aiContent = result.data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("No content received from AI provider");
    }

    // Parse the JSON response
    const cleanContent = aiContent.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    const features = JSON.parse(cleanContent);

    // Validate the response format
    if (!Array.isArray(features)) {
      throw new Error("AI response is not an array");
    }

    // Validate each feature object
    const validatedFeatures = features.filter(f => 
      f && 
      typeof f.feature === 'string' && 
      typeof f.benefit === 'string' &&
      f.feature.length > 0 && 
      f.benefit.length > 0
    ).slice(0, 6); // Limit to 6 features max

    if (validatedFeatures.length === 0) {
      throw new Error("No valid features found in AI response");
    }

    console.log(`✅ Generated ${validatedFeatures.length} features successfully`);
    return validatedFeatures;

  } catch (error) {
    console.error("Error generating features:", error);
    throw error;
  }
}

async function callAIProvider(prompt: string, useOpenAI: boolean) {
  try {
    const apiURL = useOpenAI
      ? "https://api.openai.com/v1/chat/completions"
      : "https://api.studio.nebius.ai/v1/chat/completions";

    const apiKey = useOpenAI
      ? process.env.OPENAI_API_KEY
      : process.env.NEBIUS_API_KEY;

    const model = useOpenAI 
      ? "gpt-3.5-turbo" 
      : "mistralai/Mixtral-8x7B-Instruct-v0.1";

    if (!apiKey) {
      console.error(`Missing API key for ${useOpenAI ? 'OpenAI' : 'Nebius'}`);
      return { success: false, error: "Missing API key" };
    }

    const body = {
      model,
      messages: [
        {
          role: "system",
          content: "You are an expert product marketer who creates compelling feature-benefit pairs for SaaS landing pages. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    };

    const response = await fetch(apiURL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
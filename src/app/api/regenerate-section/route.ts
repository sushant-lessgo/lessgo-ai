import { NextResponse, NextRequest } from "next/server";
import { buildSectionPrompt } from "@/modules/prompt/buildPrompt";
import { parseAiResponse } from "@/modules/prompt/parseAiResponse";
import { generateMockResponse } from "@/modules/prompt/mockResponseGenerator";
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { withAIRateLimit } from '@/lib/rateLimit';
import { requireAICredits } from '@/lib/middleware/planCheck';
import { consumeCredits, UsageEventType, CREDIT_COSTS } from '@/lib/creditSystem';

async function handler(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Check authentication and credits (2 credits for section regeneration)
    const creditCheck = await requireAICredits(req, UsageEventType.SECTION_REGEN, CREDIT_COSTS.SECTION_REGENERATION);
    if (!creditCheck.allowed) {
      return creditCheck.response!;
    }

    const userId = creditCheck.userId!;

    const body = await req.json();
    const { sectionId, tokenId, userGuidance, currentContent, sectionType, layout } = body;
    
    // Debug logging
    logger.dev("Regenerate section request:", {
      tokenId,
      sectionId,
      sectionType,
      layout,
      hasUserGuidance: !!userGuidance,
      currentContentKeys: currentContent ? Object.keys(currentContent) : [],
      bodyKeys: Object.keys(body)
    });

    if (!sectionId || !tokenId) {
      logger.error("Missing required fields:", {
        sectionId: !!sectionId,
        tokenId: !!tokenId,
        receivedBody: body
      });
      return NextResponse.json({ 
        error: "Invalid request", 
        detail: "sectionId and tokenId are required" 
      }, { status: 400 });
    }

    const DEMO_TOKEN = "lessgodemomockdata";

    // Get project data to access onboarding information (optional enhancement)
    let projectData = null;
    if (tokenId !== DEMO_TOKEN) {
      try {
        const project = await prisma.project.findUnique({
          where: { tokenId },
          select: {
            inputText: true,
            content: true,
            title: true
          }
        });
        
        if (project) {
          projectData = project;
        }
      } catch (dbError) {
        logger.warn("Failed to fetch project data, proceeding without database context:", dbError);
        // Continue without database context - this is not critical
      }
    }

    // Check for mock data usage
    if (process.env.NEXT_PUBLIC_USE_MOCK_GPT === "true" || tokenId === DEMO_TOKEN) {
      logger.dev("Using mock response for section regeneration");
      
      const mockSectionContent = generateMockSectionContent(sectionId, sectionType);
      
      return NextResponse.json({
        content: mockSectionContent,
        sectionId,
        originalContent: currentContent,
        regenerationType: 'section',
        isMock: true
      });
    }

    const useOpenAI = process.env.USE_OPENAI === "true";
    const model = useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1";

    // Create prompt for section regeneration
    let prompt = `Regenerate content for the "${sectionType || sectionId}" section.

Section Type: ${sectionType || 'content'}
Layout: ${layout || 'default'}
${userGuidance ? `User Guidance: ${userGuidance}` : ''}

Current Content Elements:
${currentContent ? JSON.stringify(Object.keys(currentContent), null, 2) : 'No current content'}

Requirements:
- Generate fresh, compelling copy for this specific section
- Maintain consistency with the overall landing page message
- Follow conversion optimization best practices
- Use appropriate tone and style for the section type
- Return content in the exact JSON format expected for this section

Generate the section content now in valid JSON format with all required elements.`;

    // If we have project data, build a more detailed prompt
    if (projectData) {
      try {
        // Build context from project data - use inputText and content for context
        const contextPrompt = `
Business Context:
- Project Title: ${projectData.title || 'Not specified'}
- Input Text: ${projectData.inputText || 'Not specified'}

${prompt}`;
        prompt = contextPrompt;
      } catch (contextError) {
        logger.warn("Failed to build context prompt:", contextError);
      }
    }

    // Try primary AI provider
    let result = await callAIProvider(prompt, useOpenAI, model);
    
    // Fallback to secondary provider
    if (!result.success) {
      logger.warn(`Primary provider failed, trying secondary...`);
      result = await callAIProvider(prompt, !useOpenAI, !useOpenAI ? "gpt-3.5-turbo" : "mistralai/Mixtral-8x7B-Instruct-v0.1");
    }

    // Final fallback to mock
    if (!result.success) {
      logger.error("Both AI providers failed, returning mock section content");
      const mockSectionContent = generateMockSectionContent(sectionId, sectionType);
      return NextResponse.json({
        content: mockSectionContent,
        sectionId,
        originalContent: currentContent,
        regenerationType: 'section',
        isPartial: true,
        warnings: ["AI providers unavailable, using template content"]
      });
    }

    // Parse AI response
    const aiContent = result.data.choices[0]?.message?.content;
    if (!aiContent) {
      throw new Error("No content received from AI provider");
    }

    let sectionContent: any;
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(aiContent);
      
      // Check if it's wrapped in a content object or direct elements
      sectionContent = parsed.content || parsed.elements || parsed;
      
      // Ensure each element has the required structure
      if (typeof sectionContent === 'object' && !Array.isArray(sectionContent)) {
        Object.keys(sectionContent).forEach(key => {
          const element = sectionContent[key];
          if (typeof element === 'string') {
            // Convert simple string to element object
            sectionContent[key] = {
              content: element,
              type: key.includes('headline') ? 'headline' : 
                    key.includes('subheadline') ? 'subheadline' :
                    key.includes('cta') || key.includes('button') ? 'button' :
                    key.includes('image') ? 'image' :
                    key.includes('list') ? 'list' : 'text',
              isEditable: true,
              editMode: 'inline'
            };
          } else if (element && typeof element === 'object' && !element.type) {
            // Add missing type field
            element.type = key.includes('headline') ? 'headline' : 
                          key.includes('subheadline') ? 'subheadline' :
                          key.includes('cta') || key.includes('button') ? 'button' :
                          key.includes('image') ? 'image' :
                          key.includes('list') ? 'list' : 'text';
            element.isEditable = element.isEditable !== false;
            element.editMode = element.editMode || 'inline';
          }
        });
      }
    } catch (parseError) {
      logger.warn("Failed to parse AI response as JSON, attempting text extraction:", parseError);
      
      // Fallback: try to extract key-value pairs from text
      sectionContent = {};
      const lines = aiContent.split('\n').filter((line: string) => line.trim());
      
      lines.forEach((line: string, index: number) => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim().toLowerCase().replace(/\s+/g, '_');
          const value = line.substring(colonIndex + 1).trim();
          sectionContent[key] = {
            content: value,
            type: 'text',
            isEditable: true,
            editMode: 'inline'
          };
        }
      });
      
      // If no valid content extracted, use a basic structure
      if (Object.keys(sectionContent).length === 0) {
        sectionContent = generateMockSectionContent(sectionId, sectionType);
      }
    }

    // Consume credits for successful section regeneration
    const consumption = await consumeCredits(userId, UsageEventType.SECTION_REGEN, CREDIT_COSTS.SECTION_REGENERATION, {
      endpoint: '/api/regenerate-section',
      duration: Date.now() - startTime,
      sectionId,
      metadata: { sectionType, hasUserGuidance: !!userGuidance }
    });

    return NextResponse.json({
      content: sectionContent,
      sectionId,
      originalContent: currentContent,
      regenerationType: 'section',
      creditsUsed: CREDIT_COSTS.SECTION_REGENERATION,
      creditsRemaining: consumption.remaining
    });

  } catch (err) {
    logger.error("Section regeneration error:", err);
    
    try {
      const { sectionId, sectionType } = await req.json();
      const mockSectionContent = generateMockSectionContent(sectionId, sectionType);
      return NextResponse.json({
        content: mockSectionContent,
        sectionId,
        regenerationType: 'section',
        isPartial: true,
        warnings: ["Server error occurred, using fallback content"]
      });
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

function generateMockSectionContent(sectionId: string, sectionType?: string): any {
  const type = sectionType || sectionId;
  
  // Generate mock content based on section type
  const mockTemplates: Record<string, any> = {
    hero: {
      headline: {
        content: "Transform Your Business with AI-Powered Solutions",
        type: "headline",
        isEditable: true,
        editMode: "inline"
      },
      subheadline: {
        content: "Leverage cutting-edge technology to streamline operations and boost productivity",
        type: "subheadline",
        isEditable: true,
        editMode: "inline"
      },
      cta_primary: {
        content: "Get Started Free",
        type: "button",
        isEditable: true,
        editMode: "inline"
      }
    },
    features: {
      section_title: {
        content: "Powerful Features Built for Growth",
        type: "headline",
        isEditable: true,
        editMode: "inline"
      },
      feature_1_title: {
        content: "Lightning Fast Performance",
        type: "text",
        isEditable: true,
        editMode: "inline"
      },
      feature_1_description: {
        content: "Experience blazing-fast load times and seamless interactions",
        type: "text",
        isEditable: true,
        editMode: "inline"
      },
      feature_2_title: {
        content: "Advanced Analytics",
        type: "text",
        isEditable: true,
        editMode: "inline"
      },
      feature_2_description: {
        content: "Gain deep insights with comprehensive data analysis tools",
        type: "text",
        isEditable: true,
        editMode: "inline"
      }
    },
    pricing: {
      section_title: {
        content: "Simple, Transparent Pricing",
        type: "headline",
        isEditable: true,
        editMode: "inline"
      },
      section_subtitle: {
        content: "Choose the plan that fits your needs",
        type: "subheadline",
        isEditable: true,
        editMode: "inline"
      },
      starter_price: {
        content: "$29/month",
        type: "text",
        isEditable: true,
        editMode: "inline"
      },
      pro_price: {
        content: "$79/month",
        type: "text",
        isEditable: true,
        editMode: "inline"
      }
    },
    testimonials: {
      section_title: {
        content: "Trusted by Industry Leaders",
        type: "headline",
        isEditable: true,
        editMode: "inline"
      },
      testimonial_1: {
        content: "This product has revolutionized how we handle our daily operations. Highly recommended!",
        type: "text",
        isEditable: true,
        editMode: "inline"
      },
      testimonial_1_author: {
        content: "Sarah Johnson, CEO at TechCorp",
        type: "text",
        isEditable: true,
        editMode: "inline"
      }
    },
    cta: {
      headline: {
        content: "Ready to Get Started?",
        type: "headline",
        isEditable: true,
        editMode: "inline"
      },
      subheadline: {
        content: "Join thousands of satisfied customers today",
        type: "subheadline",
        isEditable: true,
        editMode: "inline"
      },
      cta_button: {
        content: "Start Your Free Trial",
        type: "button",
        isEditable: true,
        editMode: "inline"
      }
    },
    default: {
      title: {
        content: "Section Title",
        type: "headline",
        isEditable: true,
        editMode: "inline"
      },
      content: {
        content: "This is placeholder content for the section. Update with your actual content.",
        type: "text",
        isEditable: true,
        editMode: "inline"
      }
    }
  };
  
  // Find the best matching template
  const normalizedType = type.toLowerCase().replace(/[-_]/g, '');
  let template = mockTemplates.default;
  
  for (const [key, value] of Object.entries(mockTemplates)) {
    if (normalizedType.includes(key) || key.includes(normalizedType)) {
      template = value;
      break;
    }
  }
  
  return { ...template };
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
      logger.error(`Missing API key for ${useOpenAI ? 'OpenAI' : 'Nebius'}`);
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
      logger.error(`${useOpenAI ? "OpenAI" : "Nebius"} API Error:`, result);
      return { success: false, error: result };
    }

    return { success: true, data: result };

  } catch (error) {
    logger.error(`Error calling ${useOpenAI ? 'OpenAI' : 'Nebius'}:`, error);
    return { success: false, error };
  }
}

// Export with rate limiting
export const POST = withAIRateLimit(handler);
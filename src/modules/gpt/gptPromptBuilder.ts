export function buildPrompt(productIdea: string) {
  return [
    {
      role: "system",
      content:
        "You are a senior copywriter who specializes in emotionally resonant, high-converting landing pages for SaaS products, targeting early SaaS founders and indie hackers. Follow the complete instructions below to generate strategic copy in the exact output format.",
    },
    {
      role: "user",
      content: `
      Your task is to take a single-line product description and generate comprehensive, strategic landing page copy in a structured JSON format.
      Your Core Objective: Translate a minimal product description into compelling copy that resonates with the target audience's pain points, aspirations, and sophistication level, driving them towards a desired action.

      RESEARCH PHASE
      When presented with a minimal product description, thoroughly analyze and determine the following core elements:
      Problem: What specific, tangible problem does this product solve for early SaaS founders and indie hackers?


      Target Persona: Create a provisional user persona profile including:


      Their professional role (e.g., Solo Founder, Developer, Marketing Lead at early stage SaaS)


      Their technical sophistication level (relevant to the product's domain)


      Their primary motivations (growth, efficiency, freedom, revenue)


      Their key frustrations (time constraints, technical hurdles, market noise)


      Emotional Transformation: What specific positive emotional shift does this product enable for the user (e.g., from overwhelmed to in control, from frustrated to empowered)?


      Objections: What are the most likely hesitations or objections a potential customer (early founder/indie hacker) would have?


      Proof Points: What types of proof (metrics, testimonials, social proof, logic) would be most convincing to this audience?


      Product Category & Approach: Identify the product's primary category and how it influences the copy focus:


      Productivity: Emphasize time savings, efficiency, automation.


      Creative: Emphasize quality, ease of creation, output volume.


      Data/Analytics: Emphasize insights, clarity, competitive edge.


      Communication: Emphasize clarity, reach, connection.


      Development Tools: Emphasize speed, reduced bugs, simplified workflow.


      Competitive Landscape: Who are the likely alternatives (including manual methods)? Identify the product's unique differentiator(s) that create "blue ocean" positioning.



      TONE AND VOICE CALIBRATION
      Determine and maintain the optimal tone and brand voice throughout the copy, based on the product category and the target audience (early founders/indie hackers), not the input style.
      Optimal Tone:


      Tools for builders/technical: Clear, precise, confident, results-focused, practical.


      Tools for marketers/creatives: Conversational, enthusiastic, empowering, benefit-driven.


      Brand Voice: Select 2-3 specific, consistent voice characteristics (e.g., knowledgeable but approachable, efficient but not robotic, ambitious but realistic).


      Tones to Avoid: Identify specific tones that would alienate this audience (e.g., overly corporate jargon, hype-y or unsubstantiated claims, condescending).



      Target audience AWARENESS & Market SOPHISTICATION LEVELS
      Assess the audience's awareness and sophistication levels to tailor the message complexity and depth.
      Awareness Level: Assume Level 3 (Solution-Aware) unless the product is truly novel/disruptive, in which case use Level 2 (Problem-Aware).


      Sophistication Level: Determine the level (1-5) based on market competition and audience skepticism. Tailor the language and type of proof/mechanism presented.


      Level 1: Birth of Market (Simple claim)


      Level 2: Bigger Claim (Stronger promise vs emerging competition)


      Level 3: Mechanism (Explain how the claim is delivered)


      Level 4: Better Mechanism (Highlight unique/improved process)


      Level 5: Extreme Skepticism (Focus on identity, proof, risk reversal)


      Guideline: More direct competitors/ads = Higher skepticism = Higher sophistication level.



      COPYWRITING PRINCIPLES TO APPLY
      Ensure the copy adheres to these proven principles:
      WIIFM: Constantly reinforce "What's In It For Me?" from the user's perspective.


      Clarity: Be immediately understandable. Avoid ambiguity or unnecessary jargon.


      Specificity: Use concrete details, numbers, and examples to build credibility.


      Curiosity: Use language patterns and structure that encourages scrolling and further engagement.


      Awareness/Sophistication Matching: Ensure the complexity and focus of the copy aligns with the determined levels.


      Be a Buddy: Adopt a conversational, relatable, and empathetic tone, not stiff or overly corporate.


      The Rule of One: Focus on one core idea, one primary audience, and one main call to action per landing page.


      Skillfully weave in these elements:
      Core Persuasion Triggers: Encourage their dream, justify their past failures, confirm their suspicions/fears, gently challenge alternatives ("throw rocks").


      4 Big Persuasion Triggers: Leverage concepts of "New", "Easy", "Safe", and "Big" where applicable, using variations (innovative, seamless, proven, significant).


      Sensory Language: Integrate words that appeal to sight, sound, touch, or feeling to make the copy more vivid and emotionally engaging.


      Pattern Interrupts: Include 1-2 unexpected statements or phrasing that breaks conventional marketing flow to increase engagement and memorability.



      EMOTIONAL CALIBRATION
      Ensure each section hits the appropriate emotional notes:
      Problem Sections: Use direct, often slightly provocative or highly relatable language that mirrors the user's internal frustration ("Stuck manually creating docs?" vs "Creating documents is difficult").


      Solution Sections: Use language that evokes relief, ease, and a sense of possibility – a breath of fresh air after the problem.


      Call to Action Sections: Use aspirational language that connects the action to the user's desired identity or future state ("Join founders who ship faster" vs "Start using the tool").


      Include at least one pattern-interrupt statement in each major section (Problem, Solution, CTA).



      FORMATTING AND VISUAL STRUCTURE
      Format the copy for maximum readability and visual appeal on a landing page:
      Use bullet points (consider relevant emojis where appropriate) for lists of benefits, features, or before/after comparisons.


      Use asterisks (*) or other markdown subtly for emphasis on 1-2 critical words or short phrases per section.


      For social proof/testimonials, include placeholders for visual credibility indicators (e.g., "[Company Logo]", "[Specific Metric achieved]").


      Break longer text blocks into short, scannable paragraphs (max 2-3 sentences) or sentence fragments using line breaks, em-dashes (—), or vertical bars (|).



      URGENCY AND SCARCITY TRIGGERS
      Layer urgency triggers naturally within the CTAs and relevant sections:
      Primary: Risk-reduction ("Try free, no credit card required").


      Secondary: Competitive/Opportunity-cost ("Stop falling behind while others leverage AI," "Don't leave [Benefit] on the table").


      Ensure each primary CTA has at least two layers of urgency/risk reduction.



      TESTIMONIAL ENGINEERING
      Craft example testimonials that follow this structure, understanding these are illustrative and must be replaced with real customer quotes:
      Specific Result: Quantifiable outcome where possible (e.g., "Increased conversions by 30%").


      Before/After: Contrast the previous state with the current one after using the product (e.g., "Used to dread [Task], now it's seamless").


      Relatable Detail: An unexpected or personal detail that adds authenticity and relatability for the target persona (e.g., "...and I actually have weekends free now.").


      Avoid generic praise: Focus on tangible outcomes and feelings.



      SENSORY LANGUAGE INTEGRATION
      Incorporate at least one strong sensory element in each major section (Problem, Solution, Features, CTA) to enhance the copy's impact:
      Visual: How something looks or appears ("See your ideas transform into polished threads").


      Kinesthetic: How something feels, a physical sensation, or ease of movement ("The relief of finally shipping").


      Auditory: References to sound or conversation ("Hear the positive feedback from your audience").


      Ensure sensory language supports the core message, rather than distracting from it.



      COMPETITIVE POSITIONING
      Position the solution clearly within the market landscape for the target audience:
      Explicitly state or imply the product category.


      Position against the pain of manual processes first, and then against less effective existing tools.


      Highlight at least one unexpected or non-obvious benefit that creates clear differentiation.


      Focus on outcome and transformation differentiation over feature-by-feature comparisons.



      LINGUISTIC PATTERNS FOR MEMORABILITY
      Employ persuasive language patterns:
      Question-Answer: Pose a question the user is likely asking, then immediately provide the product as the answer ("Wasting hours on content? What if you could create 10x faster?").


      Metaphor: Use simple, relatable metaphors to explain concepts or transitions between sections ("Think of it as your content co-pilot...").


      Identity Language: Use phrasing that speaks to who the target user wants to be ("For the founder who values speed," "Become known for your insightful content").


      Contrast: Use "Not X, but Y" structures to redefine the product or challenge assumptions ("Not just another tool. A complete workflow revolution.").



      OBJECTION MAPPING AND PREEMPTIVE ADDRESSING
      Proactively identify and address common objections from the target audience:
      Anticipate concerns like: Quality of output, technical complexity, ROI/value, authenticity, time investment to learn.


      For each likely objection, create a concise (1-2 sentence) reframe or counter-statement that turns the potential negative into a positive or a non-issue.



      LENGTH AND FORMAT GUIDELINES
      Adhere to these structural and stylistic rules for web readability:
      Hero Headline: Under 10 words, instantly communicates the core value.


      Subheadlines/Section Headlines: Clear, benefit-oriented.


      Feature/Benefit Descriptions: 1-2 sentences maximum per point.


      Overall: Prioritize brevity and impact over exhaustive detail.


      Use active voice and present tense.


      Break up long paragraphs (maximum 2-3 sentences).

      Given this product description: ${productIdea}

      OUTPUT FORMAT (respond ONLY with minified JSON, no prose):

      {
        "hero": {
          "headline": "...",
          "subheadline": "...",
          "cta_text": "...",
          "urgency_text": "...",
          "body_text": "...",
          "hero_image": "..."
        },
        "before_after": {
          "section_headline": "...",
          "before_title": "...",
          "before_points": ["...", "...", "..."],
          "after_title": "...",
          "after_points": ["...", "...", "..."]
        },
        "how_it_works": {
          "section_headline": "...",
          "steps": [
            { "title": "...", "description": "..." },
            { "title": "...", "description": "..." },
            { "title": "...", "description": "..." }
          ]
        },
        "testimonials": [
          { "quote": "...", "name": "..." }
        ],
        "offer": {
          "headline": "...",
          "bullets": ["...", "...", "..."],
          "cta_text": "...",
          "urgency_text": "..."
        },
        "faq": [
          { "question": "...", "answer": "..." },
          { "question": "...", "answer": "..." }
        ],
        "explanation": {
          "critical_assumptions": ["...", "..."],
          "target_persona": {
            "role": "...",
            "pain_points": "...",
            "aspirations": "...",
            "sophistication_level": "Level [1-5]"
          },
          "market_positioning": {
            "category": "...",
            "primary_competitors": ["...", "..."],
            "key_differentiation": "..."
          },
          "copywriting_strategy": {
            "tone": "...",
            "structure_choice": "...",
            "persuasion_focus": "..."
          }
        }
      }
`,
    },
  ]
}

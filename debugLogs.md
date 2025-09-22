backend logs:

  "confidence": 1
  },
  "marketSubcategory": {
    "ai": "Personal Note-Taking & Knowledge Management",
    "validated": "Personal Note-Taking & Knowledge Management",
    "confidence": 1
  },
  "targetAudience": {
    "ai": "Knowledge Workers",
    "validated": "Newsletter Writers",
    "confidence": 0.4522195825358583
  }
}
 POST /api/infer-fields 200 in 13243ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 2/30, Remaining: 28 
 POST /api/saveDraft 200 in 236ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 3/30, Remaining: 27 
 POST /api/saveDraft 200 in 177ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 4/30, Remaining: 26 
 POST /api/saveDraft 200 in 187ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 5/30, Remaining: 25 
 POST /api/saveDraft 200 in 589ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 6/30, Remaining: 24 
 POST /api/saveDraft 200 in 181ms
 ✓ Compiled /api/market-insights in 476ms (1363 modules)
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 1/30, Remaining: 29 
[2025-09-22T15:03:59.612Z] DEBUG: 🔍 Market insights request received
[2025-09-22T15:03:59.613Z] DEBUG: 🔍 Request fields validated
[2025-09-22T15:03:59.613Z] DEBUG: 🚀 Starting market insights generation
[2025-09-22T15:03:59.613Z] DEBUG: 🤖 Generating features with AI...
 POST /api/saveDraft 200 in 1465ms
[2025-09-22T15:04:06.761Z] DEBUG: ✅ Generated 5 features successfully
[2025-09-22T15:04:06.761Z] DEBUG: 📊 AI-Generated Features: {
  "count": 5,
  "features": [
    {
      "index": 1,
      "feature": "Quick Capture",
      "benefit": "Easily jot down ideas on the go, no hassle.",
      "featureLength": 13,
      "benefitLength": 43
    },
    {
      "index": 2,
      "feature": "Cross-Device Sync",
      "benefit": "Access your notes seamlessly across all your devices.",
      "featureLength": 17,
      "benefitLength": 53
    },
    {
      "index": 3,
      "feature": "Organized Folders",
      "benefit": "Keep your thoughts structured for easy retrieval.",
      "featureLength": 17,
      "benefitLength": 49
    },
    {
      "index": 4,
      "feature": "Search Functionality",
      "benefit": "Find important notes instantly, saving you valuable time.",
      "featureLength": 20,
      "benefitLength": 57
    },
    {
      "index": 5,
      "feature": "Freemium Access",
      "benefit": "Start using essential features for free, no commitment.",
      "featureLength": 15,
      "benefitLength": 55
    }
  ],
  "rawFeatures": [
    {
      "feature": "Quick Capture",
      "benefit": "Easily jot down ideas on the go, no hassle."
    },
    {
      "feature": "Cross-Device Sync",
      "benefit": "Access your notes seamlessly across all your devices."
    },
    {
      "feature": "Organized Folders",
      "benefit": "Keep your thoughts structured for easy retrieval."
    },
    {
      "feature": "Search Functionality",
      "benefit": "Find important notes instantly, saving you valuable time."
    },
    {
      "feature": "Freemium Access",
      "benefit": "Start using essential features for free, no commitment."
    }
  ]
}
[2025-09-22T15:04:06.762Z] DEBUG: 🔍 Performing AI market research for hidden copywriting fields...
[2025-09-22T15:04:06.762Z] DEBUG: 🧠 Starting AI inference for hidden copywriting fields...
[2025-09-22T15:04:06.762Z] DEBUG: 📊 Input context: {
  "category": "Personal Productivity Tools",
  "audience": "Freelancers",
  "problem": "Individuals need an efficient way to quickly capture, organize, and sync their thoughts across devic..."
}
[2025-09-22T15:04:09.218Z] DEBUG: 🤖 Raw AI response for hidden fields: {
  "awarenessLevel": "problem-aware",
  "copyIntent": "pain-led",
  "toneProfile": "friendly-helpful",
  "marketSophisticationLevel": "level-3",
  "problemType": "manual-repetition"
}
[2025-09-22T15:04:09.219Z] INFO: ✅ Hidden fields inferred successfully: {
  "awarenessLevel": "problem-aware",
  "copyIntent": "pain-led",
  "toneProfile": "friendly-helpful",
  "marketSophisticationLevel": "level-3",
  "problemType": "manual-repetition"
}
[2025-09-22T15:04:09.219Z] DEBUG: 🧠 Hidden Inferred Fields (AI Analysis): {
  "awarenessLevel": "problem-aware",
  "copyIntent": "pain-led",
  "toneProfile": "friendly-helpful",
  "marketSophisticationLevel": "level-3",
  "problemType": "manual-repetition",
  "fieldCount": 5,
  "rawHiddenFields": {
    "awarenessLevel": "problem-aware",
    "copyIntent": "pain-led",
    "toneProfile": "friendly-helpful",
    "marketSophisticationLevel": "level-3",
    "problemType": "manual-repetition"
  }
}
[2025-09-22T15:04:09.219Z] DEBUG: 📝 Copywriting Strategy Mapping: {
  "audience": "Freelancers → Awareness: problem-aware",
  "messaging": "pain-led copy with friendly-helpful tone",
  "market": "Sophistication Level level-3",
  "problem": "Individuals need an efficient way to quickly capture, organize, and sync their thoughts across devices without cumbersome processes. → Type: manual-repetition",
  "approach": "Focus on problem agitation and pain points"
}
[2025-09-22T15:04:09.219Z] DEBUG: ✅ Market insights generation completed
[2025-09-22T15:04:09.220Z] DEBUG: 📤 Sending Market Insights Response: {
  "featureCount": 5,
  "hiddenFieldCount": 5,
  "hasAwarenessLevel": true,
  "hasCopyIntent": true,
  "hasToneProfile": true,
  "summary": {
    "features": "Quick Capture, Cross-Device Sync, Organized Folders, Search Functionality, Freemium Access",
    "tone": "friendly-helpful",
    "intent": "pain-led"
  }
}
 POST /api/market-insights 200 in 10478ms
 ○ Compiling /api/generate-landing ...
 ✓ Compiled /api/generate-landing in 904ms (1342 modules)
[DEV] Rate limit check - Key: ip:::1, Requests: 1/5, Remaining: 4 
[DEV] 🚀 /api/generate-landing route called 
[DEV] 📝 Request received: {
  hasPrompt: false,
  promptLength: 0,
  hasOnboardingStore: true,
  hasPageStore: true,
  hasLayoutRequirements: true,
  use2Phase: true
}
[DEV] 🔍 Environment check: {
  NEXT_PUBLIC_USE_MOCK_GPT: 'false',
  token: 'RzW7YhgBjg...',
  isDemoToken: false
}
[DEV] 🧠 Starting 2-phase strategic copy generation
[DEV] 📊 Phase 1: Strategic Analysis
[2025-09-22T15:04:30.234Z] ERROR: ❌ 2-phase generation failed: {}
[DEV] 🔄 Attempting final single-phase fallback
[2025-09-22T15:05:05.848Z] DEBUG: 🔍 Starting AI response parsing: {
  "contentLength": 6846,
  "hasExpectedCounts": false,
  "expectedCountsKeys": [],
  "contentPreview": "```json\n{\n  \"header\": {\n    \"nav_item_1\": \"Features\",\n    \"nav_item_2\": \"Pricing\",\n    \"nav_item_3\": \"Testimonials\",\n    \"nav_item_4\": \"FAQ\",\n    \"nav..."
}
[2025-09-22T15:05:05.849Z] DEBUG: 🔍 Extracting JSON from AI response...
[2025-09-22T15:05:05.849Z] DEBUG: 🔍 Starting enhanced JSON extraction from AI response: {
  "contentLength": 6846,
  "hasCodeBlocks": true,
  "hasJsonKeyword": true,
  "startsWithBrace": false,
  "firstLine": "```json",
  "contentPreview": "```json\n{\n  \"header\": {\n    \"nav_item_1\": \"Features\",\n    \"nav_item_2\": \"Pricing\",\n    \"nav_item_3\":..."
}
[2025-09-22T15:05:05.850Z] DEBUG: 📝 Content cleaned for extraction: {
  "originalLength": 6846,
  "cleanedLength": 6846,
  "significantChange": false
}
[2025-09-22T15:05:05.851Z] DEBUG: ✅ JSON extracted from standard code block: {
  "extractedLength": 6834,
  "startsWithBrace": true,
  "endsWithBrace": true,
  "firstChars": "{\n  \"header\": {\n    \"nav_item_1\": \"Features\",\n    ..."
}
[2025-09-22T15:05:05.852Z] DEBUG: ✅ JSON extracted successfully: {
  "extractedLength": 6834,
  "startsWithBrace": true,
  "endsWithBrace": true
}
[2025-09-22T15:05:05.852Z] DEBUG: 🔍 Parsing extracted JSON...
[2025-09-22T15:05:05.852Z] DEBUG: ✅ JSON parsed successfully: {
  "topLevelKeys": [
    "header",
    "hero",
    "features",
    "uniqueMechanism",
    "results",
    "testimonials",
    "comparisonTable",
    "faq",
    "cta",
    "footer"
  ],
  "sectionCount": 10
}
[2025-09-22T15:05:05.852Z] DEBUG: 🔍 Validating parsed content structure...
[2025-09-22T15:05:05.853Z] DEBUG: 🔍 Starting content validation: {
  "contentType": "object",
  "isArray": false,
  "hasExpectedCounts": false,
  "expectedCountKeys": []
}
[2025-09-22T15:05:05.853Z] DEBUG: 📊 Available sections analysis: {
  "totalSections": 10,
  "sectionList": [
    "header",
    "hero",
    "features",
    "uniqueMechanism",
    "results",
    "testimonials",
    "comparisonTable",
    "faq",
    "cta",
    "footer"
  ],
  "hasExpectedCounts": false,
  "expectedSections": []
}
[2025-09-22T15:05:05.853Z] DEBUG: 🔍 Processing section: header {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "nav_item_1",
    "nav_item_2",
    "nav_item_3",
    "nav_item_4",
    "nav_link_1",
    "nav_link_2",
    "nav_link_3",
    "nav_link_4",
    "cta_text"
  ]
}
[2025-09-22T15:05:05.856Z] DEBUG: ✅ Section header processed successfully
[2025-09-22T15:05:05.856Z] DEBUG: 🔍 Processing section: hero {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "cta_text",
    "subheadline",
    "supporting_text",
    "secondary_cta_text",
    "badge_text",
    "trust_items",
    "trust_item_1",
    "trust_item_2",
    "trust_item_3",
    "trust_item_4",
    "trust_item_5",
    "center_hero_image",
    "customer_count",
    "rating_value",
    "rating_count",
    "show_social_proof",
    "show_customer_avatars",
    "avatar_count",
    "customer_names",
    "avatar_urls"
  ]
}
[2025-09-22T15:05:05.857Z] DEBUG: ✅ Section hero processed successfully
[2025-09-22T15:05:05.857Z] DEBUG: 🔍 Processing section: features {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "feature_titles",
    "feature_descriptions",
    "subheadline"
  ]
}
[2025-09-22T15:05:05.857Z] DEBUG: ✅ Section features processed successfully
[2025-09-22T15:05:05.858Z] DEBUG: 🔍 Processing section: uniqueMechanism {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "highlight_titles",
    "highlight_descriptions",
    "mechanism_name",
    "footer_text",
    "highlight_icon_1",
    "highlight_icon_2",
    "highlight_icon_3",
    "highlight_icon_4"
  ]
}
[2025-09-22T15:05:05.858Z] DEBUG: ✅ Section uniqueMechanism processed successfully
[2025-09-22T15:05:05.858Z] DEBUG: 🔍 Processing section: results {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "icon_types",
    "titles",
    "descriptions",
    "subheadline",
    "layout_style",
    "footer_text"
  ]
}
[2025-09-22T15:05:05.859Z] DEBUG: ✅ Section results processed successfully
[2025-09-22T15:05:05.859Z] DEBUG: 🔍 Processing section: testimonials {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "pullquote_texts",
    "quote_attributions",
    "quote_contexts"
  ]
}
[2025-09-22T15:05:05.859Z] DEBUG: ✅ Section testimonials processed successfully
[2025-09-22T15:05:05.859Z] DEBUG: 🔍 Processing section: comparisonTable {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "feature_names",
    "competitor_names",
    "your_product_name",
    "subheadline"
  ]
}
[2025-09-22T15:05:05.859Z] DEBUG: ✅ Section comparisonTable processed successfully
[2025-09-22T15:05:05.860Z] DEBUG: 🔍 Processing section: faq {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "subheadline",
    "question_1",
    "answer_1",
    "persona_1",
    "question_2",
    "answer_2",
    "persona_2",
    "question_3",
    "answer_3",
    "persona_3",
    "question_4",
    "answer_4",
    "persona_4",
    "question_5",
    "answer_5",
    "persona_5",
    "customer_persona_name",
    "support_persona_name",
    "chat_style",
    "bubble_alignment",
    "questions",
    "answers",
    "chat_personas"
  ]
}
[2025-09-22T15:05:05.860Z] DEBUG: ✅ Section faq processed successfully
[2025-09-22T15:05:05.861Z] DEBUG: 🔍 Processing section: cta {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "cta_text",
    "subheadline",
    "urgency_text",
    "trust_items",
    "trust_item_1",
    "trust_item_2",
    "trust_item_3",
    "trust_item_4",
    "trust_item_5",
    "customer_count",
    "customer_label",
    "rating_stat",
    "uptime_stat",
    "uptime_label"
  ]
}
[2025-09-22T15:05:05.861Z] DEBUG: ✅ Section cta processed successfully
[2025-09-22T15:05:05.862Z] DEBUG: 🔍 Processing section: footer {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "copyright",
    "company_name",
    "tagline",
    "link_text_1",
    "link_1",
    "link_text_2",
    "link_2",
    "link_text_3",
    "link_3",
    "link_text_4",
    "link_4",
    "social_twitter",
    "social_linkedin",
    "social_github",
    "social_facebook"
  ]
}
[2025-09-22T15:05:05.863Z] DEBUG: ✅ Section footer processed successfully
[2025-09-22T15:05:05.863Z] DEBUG: ✅ Content validation completed: {
  "totalSections": 10,
  "processedSuccessfully": 10,
  "successRate": "100%",
  "finalSectionCount": 10,
  "isPartial": false,
  "warningCount": 0,
  "errorCount": 0
}
[2025-09-22T15:05:05.866Z] ERROR: ❌ Unexpected error during AI response parsing: {
  "error": {},
  "errorMessage": "elementsMap is not defined",
  "errorStack": "ReferenceError: elementsMap is not defined\n    at validateContent (webpack-internal:///(rsc)/./src/modules/prompt/parseAiResponse.ts:336:5)\n    at parseAiResponse (webpack-internal:///(rsc)/./src/modules/prompt/parseAiResponse.ts:62:28)\n    at generateLandingHandler (webpack-internal:///(rsc)/./src/app/api/generate-landing/route.ts:320:120)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async eval (webpack-internal:///(rsc)/./src/lib/rateLimit.ts:157:26)\n    at async C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:6:57228\n    at async eT.execute (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:6:46851)\n    at async eT.handle (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:6:58760)\n    at async doRender (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1366:42)\n    at async cacheEntry.responseCache.get.routeKind (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1588:28)\n    at async DevServer.renderToResponseWithComponentsImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1496:28)\n    at async DevServer.renderPageComponent (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1924:24)\n    at async DevServer.renderToResponseImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1962:32)\n    at async DevServer.pipeImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:922:25)\n    at async NextNodeServer.handleCatchallRenderRequest (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\next-server.js:272:17)\n    at async DevServer.handleRequestImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:818:17)\n    at async C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:339:20\n    at async Span.traceAsyncFn (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\trace\\trace.js:154:20)\n    at async DevServer.handleRequest (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:336:24)\n    at async invokeRender (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\router-server.js:179:21)\n    at async handleRequest (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\router-server.js:359:24)\n    at async requestHandlerImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\router-server.js:383:13)\n    at async Server.requestListener (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\start-server.js:141:13)"
}
 POST /api/generate-landing 200 in 36724ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 1/30, Remaining: 29 
 POST /api/saveDraft 200 in 811ms
 ○ Compiling /generate/[token] ...
 ✓ Compiled /generate/[token] in 1249ms (2212 modules)
 ✓ Compiled /api/loadDraft in 377ms (1246 modules)
 GET /api/loadDraft?tokenId=RzW7YhgBjggL 200 in 545ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 1/30, Remaining: 29 
 POST /api/saveDraft 200 in 779ms
 GET /api/loadDraft?tokenId=RzW7YhgBjggL 200 in 63ms
 ○ Compiling /api/start ...
 ✓ Compiled /api/start in 538ms (1235 modules)
 GET /api/start 200 in 1300ms
 ⨯ src\utils\storage.ts (332:4) @ window
 ⨯ ReferenceError: window is not defined
    at eval (./src/utils/storage.ts:265:5)
    at (ssr)/./src/utils/storage.ts (C:\Users\susha\lessgo-ai\.next\server\app\create\[token]\page.js:1248:1)
    at __webpack_require__ (C:\Users\susha\lessgo-ai\.next\server\webpack-runtime.js:33:42)
    at eval (./src/stores/storeManager.ts:6:72)
    at (ssr)/./src/stores/storeManager.ts (C:\Users\susha\lessgo-ai\.next\server\app\create\[token]\page.js:1127:1)
    at __webpack_require__ (C:\Users\susha\lessgo-ai\.next\server\webpack-runtime.js:33:42)
    at eval (./src/hooks/usePageGeneration.ts:9:78)
    at (ssr)/./src/hooks/usePageGeneration.ts (C:\Users\susha\lessgo-ai\.next\server\app\create\[token]\page.js:555:1)
    at __webpack_require__ (C:\Users\susha\lessgo-ai\.next\server\webpack-runtime.js:33:42)
    at eval (./src/app/create/[token]/components/RightPanel.tsx:20:83)
    at (ssr)/./src/app/create/[token]/components/RightPanel.tsx (C:\Users\susha\lessgo-ai\.next\server\app\create\[token]\page.js:302:1)
    at __webpack_require__ (C:\Users\susha\lessgo-ai\.next\server\webpack-runtime.js:33:42)
    at eval (./src/app/create/[token]/components/ClientLayout.tsx:9:69)
    at (ssr)/./src/app/create/[token]/components/ClientLayout.tsx (C:\Users\susha\lessgo-ai\.next\server\app\create\[token]\page.js:203:1)
    at Object.__webpack_require__ [as require] (C:\Users\susha\lessgo-ai\.next\server\webpack-runtime.js:33:42)
digest: "2351412839"
  330 | // Development utilities (only available in development mode)
  331 | if (process.env.NODE_ENV === 'development') {
> 332 |   (window as any).__storageDebug = {
      |    ^
  333 |     getStorageMetadata,
  334 |     getStorageStats,
  335 |     cleanupOldProjects: (tokenId: string) => cleanupOldProjects(tokenId, true),
 GET /create/Ko2tJrgbLA6f 500 in 331ms
 GET /api/loadDraft?tokenId=Ko2tJrgbLA6f 200 in 84ms
 GET /api/loadDraft?tokenId=Ko2tJrgbLA6f 200 in 58ms
 ✓ Compiled /api/infer-fields in 310ms (1343 modules)
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 1/5, Remaining: 4 
[2025-09-22T15:07:03.351Z] DEBUG: 🚀 Starting inference for: FeatherNote AI – A super-light note app powered by AI that captures quick thoughts, organizes them, ...
[2025-09-22T15:07:06.398Z] DEBUG: ✅ AI inference completed
[2025-09-22T15:07:06.399Z] INFO: 📤 Raw AI Output: {
  "marketCategory": "Personal Productivity Tools",
  "marketSubcategory": "Personal Note-Taking & Knowledge Management",
  "keyProblem": "Individuals often struggle to quickly capture and organize their thoughts across multiple devices, leading to lost ideas and disorganization.",
  "targetAudience": "Knowledge Workers",
  "startupStage": "MVP",
  "pricingModel": "Freemium",
  "landingPageGoals": "Start Organizing"
}
[2025-09-22T15:07:06.399Z] DEBUG: 🔍 Starting semantic validation...
[2025-09-22T15:07:06.399Z] INFO: 🔄 Sending to embedding validation: {
  "marketCategory": "Personal Productivity Tools",
  "marketSubcategory": "Personal Note-Taking & Knowledge Management",
  "targetAudience": "Knowledge Workers"
}
[2025-09-22T15:07:06.400Z] DEBUG: 🔍 Starting semantic validation...
[DEV] 🔑 Generating embedding for: Personal Productivity Tools...
[2025-09-22T15:07:06.872Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Personal Productivity Tools...
[2025-09-22T15:07:07.530Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Personal Note-Taking & Knowledge Management...
[DEV] 🔑 Generating embedding for: Knowledge Workers...
[DEV] 🔑 Generating embedding for: MVP...
[DEV] 🔑 Generating embedding for: Freemium...
[DEV] 🔑 Generating embedding for: Start Organizing...
[2025-09-22T15:07:08.081Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:08.083Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:08.084Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:08.100Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:08.321Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Knowledge Workers...
[DEV] 🔑 Generating embedding for: MVP...
[DEV] 🔑 Generating embedding for: Freemium...
[DEV] 🔑 Generating embedding for: Start Organizing...
[2025-09-22T15:07:08.639Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:08.881Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:09.346Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:09.792Z] DEBUG: ✅ Embedding generated successfully
[2025-09-22T15:07:09.924Z] DEBUG: 🔍 Market Category: "Personal Productivity Tools" (HIGH - 100.0%)
[2025-09-22T15:07:09.924Z] DEBUG: 🔍 Market Subcategory: "Personal Note-Taking & Knowledge Management" (HIGH - 100.0%)
[2025-09-22T15:07:09.925Z] DEBUG: 🔍 Target Audience: "Newsletter Writers" (LOW - 45.2%)
[2025-09-22T15:07:09.925Z] DEBUG: 🔍 Key Problem Getting Solved: "Individuals often struggle to quickly capture and organize their thoughts across multiple devices, leading to lost ideas and disorganization." (HIGH - 100.0%)
[2025-09-22T15:07:09.925Z] DEBUG: 🔍 Startup Stage: "MVP in development" (MEDIUM - 84.0%)
[2025-09-22T15:07:09.925Z] DEBUG: 🔍 Landing Page Goals: "Book a Strategy Call" (LOW - 36.2%)
[2025-09-22T15:07:09.925Z] DEBUG: 🔍 Pricing Category and Model: "Freemium (limited features)" (HIGH - 83.0%)
[2025-09-22T15:07:09.925Z] DEBUG: ✅ Semantic validation completed
[2025-09-22T15:07:09.925Z] INFO: 📊 Validation Results Comparison: {
  "marketCategory": {
    "ai": "Personal Productivity Tools",
    "validated": "Personal Productivity Tools",
    "confidence": 1
  },
  "marketSubcategory": {
    "ai": "Personal Note-Taking & Knowledge Management",
    "validated": "Personal Note-Taking & Knowledge Management",
    "confidence": 1
  },
  "targetAudience": {
    "ai": "Knowledge Workers",
    "validated": "Newsletter Writers",
    "confidence": 0.4522195825358583
  }
}
 POST /api/infer-fields 200 in 6991ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 2/30, Remaining: 28 
 POST /api/saveDraft 200 in 302ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 3/30, Remaining: 27 
 POST /api/saveDraft 200 in 220ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 4/30, Remaining: 26 
 POST /api/saveDraft 200 in 626ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 5/30, Remaining: 25 
 POST /api/saveDraft 200 in 192ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 6/30, Remaining: 24 
 POST /api/saveDraft 200 in 551ms
 ○ Compiling /api/market-insights ...
 ✓ Compiled /api/market-insights in 547ms (1347 modules)
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 1/30, Remaining: 29 
[2025-09-22T15:07:23.912Z] DEBUG: 🔍 Market insights request received
[2025-09-22T15:07:23.912Z] DEBUG: 🔍 Request fields validated
[2025-09-22T15:07:23.912Z] DEBUG: 🚀 Starting market insights generation
[2025-09-22T15:07:23.912Z] DEBUG: 🤖 Generating features with AI...
 POST /api/saveDraft 200 in 1093ms
[2025-09-22T15:07:29.107Z] DEBUG: ✅ Generated 5 features successfully
[2025-09-22T15:07:29.107Z] DEBUG: 📊 AI-Generated Features: {
  "count": 5,
  "features": [
    {
      "index": 1,
      "feature": "Cross-Device Sync",
      "benefit": "Capture and access notes seamlessly across all your devices.",
      "featureLength": 17,
      "benefitLength": 60
    },
    {
      "index": 2,
      "feature": "Quick Note Capture",
      "benefit": "Easily jot down ideas before they slip away from you.",
      "featureLength": 18,
      "benefitLength": 53
    },
    {
      "index": 3,
      "feature": "Organized Folders",
      "benefit": "Keep your thoughts structured to avoid confusion and clutter.",
      "featureLength": 17,
      "benefitLength": 61
    },
    {
      "index": 4,
      "feature": "Tagging System",
      "benefit": "Effortlessly categorize notes for easy retrieval when needed.",
      "featureLength": 14,
      "benefitLength": 61
    },
    {
      "index": 5,
      "feature": "Freemium Access",
      "benefit": "Start using essential features without any upfront cost.",
      "featureLength": 15,
      "benefitLength": 56
    }
  ],
  "rawFeatures": [
    {
      "feature": "Cross-Device Sync",
      "benefit": "Capture and access notes seamlessly across all your devices."
    },
    {
      "feature": "Quick Note Capture",
      "benefit": "Easily jot down ideas before they slip away from you."
    },
    {
      "feature": "Organized Folders",
      "benefit": "Keep your thoughts structured to avoid confusion and clutter."
    },
    {
      "feature": "Tagging System",
      "benefit": "Effortlessly categorize notes for easy retrieval when needed."
    },
    {
      "feature": "Freemium Access",
      "benefit": "Start using essential features without any upfront cost."
    }
  ]
}
[2025-09-22T15:07:29.108Z] DEBUG: 🔍 Performing AI market research for hidden copywriting fields...
[2025-09-22T15:07:29.108Z] DEBUG: 🧠 Starting AI inference for hidden copywriting fields...
[2025-09-22T15:07:29.108Z] DEBUG: 📊 Input context: {
  "category": "Personal Productivity Tools",
  "audience": "Freelancers",
  "problem": "Individuals often struggle to quickly capture and organize their thoughts across multiple devices, l..."
}
[2025-09-22T15:07:31.768Z] DEBUG: 🤖 Raw AI response for hidden fields: {
  "awarenessLevel": "problem-aware",
  "copyIntent": "pain-led",
  "toneProfile": "friendly-helpful",
  "marketSophisticationLevel": "level-3",
  "problemType": "manual-repetition"
}
[2025-09-22T15:07:31.769Z] INFO: ✅ Hidden fields inferred successfully: {
  "awarenessLevel": "problem-aware",
  "copyIntent": "pain-led",
  "toneProfile": "friendly-helpful",
  "marketSophisticationLevel": "level-3",
  "problemType": "manual-repetition"
}
[2025-09-22T15:07:31.769Z] DEBUG: 🧠 Hidden Inferred Fields (AI Analysis): {
  "awarenessLevel": "problem-aware",
  "copyIntent": "pain-led",
  "toneProfile": "friendly-helpful",
  "marketSophisticationLevel": "level-3",
  "problemType": "manual-repetition",
  "fieldCount": 5,
  "rawHiddenFields": {
    "awarenessLevel": "problem-aware",
    "copyIntent": "pain-led",
    "toneProfile": "friendly-helpful",
    "marketSophisticationLevel": "level-3",
    "problemType": "manual-repetition"
  }
}
[2025-09-22T15:07:31.769Z] DEBUG: 📝 Copywriting Strategy Mapping: {
  "audience": "Freelancers → Awareness: problem-aware",
  "messaging": "pain-led copy with friendly-helpful tone",
  "market": "Sophistication Level level-3",
  "problem": "Individuals often struggle to quickly capture and organize their thoughts across multiple devices, leading to lost ideas and disorganization. → Type: manual-repetition", 
  "approach": "Focus on problem agitation and pain points"
}
[2025-09-22T15:07:31.769Z] DEBUG: ✅ Market insights generation completed
[2025-09-22T15:07:31.770Z] DEBUG: 📤 Sending Market Insights Response: {
  "featureCount": 5,
  "hiddenFieldCount": 5,
  "hasAwarenessLevel": true,
  "hasCopyIntent": true,
  "hasToneProfile": true,
  "summary": {
    "features": "Cross-Device Sync, Quick Note Capture, Organized Folders, Tagging System, Freemium Access",
    "tone": "friendly-helpful",
    "intent": "pain-led"
  }
}
 POST /api/market-insights 200 in 8818ms
 ○ Compiling /api/generate-landing ...
 ✓ Compiled /api/generate-landing in 1133ms (1362 modules)
[DEV] Rate limit check - Key: ip:::1, Requests: 1/5, Remaining: 4 
[DEV] 🚀 /api/generate-landing route called 
[DEV] 📝 Request received: {
  hasPrompt: false,
  promptLength: 0,
  hasOnboardingStore: true,
  hasPageStore: true,
  hasLayoutRequirements: true,
  use2Phase: true
}
[DEV] 🔍 Environment check: {
  NEXT_PUBLIC_USE_MOCK_GPT: 'false',
  token: 'Ko2tJrgbLA...',
  isDemoToken: false
}
[DEV] 🧠 Starting 2-phase strategic copy generation
[DEV] 📊 Phase 1: Strategic Analysis
[2025-09-22T15:07:49.311Z] ERROR: ❌ 2-phase generation failed: {}
[DEV] 🔄 Attempting final single-phase fallback
[2025-09-22T15:08:33.107Z] DEBUG: 🔍 Starting AI response parsing: {
  "contentLength": 7177,
  "hasExpectedCounts": false,
  "expectedCountsKeys": [],
  "contentPreview": "```json\n{\n  \"header\": {\n    \"nav_item_1\": \"Features\",\n    \"nav_item_2\": \"Pricing\",\n    \"nav_item_3\": \"Testimonials\",\n    \"nav_item_4\": \"FAQ\",\n    \"nav..."
}
[2025-09-22T15:08:33.108Z] DEBUG: 🔍 Extracting JSON from AI response...
[2025-09-22T15:08:33.108Z] DEBUG: 🔍 Starting enhanced JSON extraction from AI response: {
  "contentLength": 7177,
  "hasCodeBlocks": true,
  "hasJsonKeyword": true,
  "startsWithBrace": false,
  "firstLine": "```json",
  "contentPreview": "```json\n{\n  \"header\": {\n    \"nav_item_1\": \"Features\",\n    \"nav_item_2\": \"Pricing\",\n    \"nav_item_3\":..."
}
[2025-09-22T15:08:33.109Z] DEBUG: 📝 Content cleaned for extraction: {
  "originalLength": 7177,
  "cleanedLength": 7177,
  "significantChange": false
}
[2025-09-22T15:08:33.110Z] DEBUG: ✅ JSON extracted from standard code block: {
  "extractedLength": 7165,
  "startsWithBrace": true,
  "endsWithBrace": true,
  "firstChars": "{\n  \"header\": {\n    \"nav_item_1\": \"Features\",\n    ..."
}
[2025-09-22T15:08:33.110Z] DEBUG: ✅ JSON extracted successfully: {
  "extractedLength": 7165,
  "startsWithBrace": true,
  "endsWithBrace": true
}
[2025-09-22T15:08:33.110Z] DEBUG: 🔍 Parsing extracted JSON...
[2025-09-22T15:08:33.111Z] DEBUG: ✅ JSON parsed successfully: {
  "topLevelKeys": [
    "header",
    "hero",
    "features",
    "uniqueMechanism",
    "results",
    "testimonials",
    "comparisonTable",
    "faq",
    "cta",
    "footer"
  ],
  "sectionCount": 10
}
[2025-09-22T15:08:33.111Z] DEBUG: 🔍 Validating parsed content structure...
[2025-09-22T15:08:33.111Z] DEBUG: 🔍 Starting content validation: {
  "contentType": "object",
  "isArray": false,
  "hasExpectedCounts": false,
  "expectedCountKeys": []
}
[2025-09-22T15:08:33.112Z] DEBUG: 📊 Available sections analysis: {
  "totalSections": 10,
  "sectionList": [
    "header",
    "hero",
    "features",
    "uniqueMechanism",
    "results",
    "testimonials",
    "comparisonTable",
    "faq",
    "cta",
    "footer"
  ],
  "hasExpectedCounts": false,
  "expectedSections": []
}
[2025-09-22T15:08:33.112Z] DEBUG: 🔍 Processing section: header {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "nav_item_1",
    "nav_item_2",
    "nav_item_3",
    "nav_item_4",
    "nav_link_1",
    "nav_link_2",
    "nav_link_3",
    "nav_link_4",
    "cta_text"
  ]
}
[2025-09-22T15:08:33.114Z] DEBUG: ✅ Section header processed successfully
[2025-09-22T15:08:33.114Z] DEBUG: 🔍 Processing section: hero {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "cta_text",
    "subheadline",
    "supporting_text",
    "secondary_cta_text",
    "badge_text",
    "trust_items",
    "trust_item_1",
    "trust_item_2",
    "trust_item_3",
    "trust_item_4",
    "trust_item_5",
    "center_hero_image",
    "customer_count",
    "rating_value",
    "rating_count",
    "show_social_proof",
    "show_customer_avatars",
    "avatar_count",
    "customer_names",
    "avatar_urls"
  ]
}
[2025-09-22T15:08:33.115Z] DEBUG: ✅ Section hero processed successfully
[2025-09-22T15:08:33.115Z] DEBUG: 🔍 Processing section: features {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "feature_titles",
    "feature_descriptions",
    "subheadline"
  ]
}
[2025-09-22T15:08:33.116Z] DEBUG: ✅ Section features processed successfully
[2025-09-22T15:08:33.116Z] DEBUG: 🔍 Processing section: uniqueMechanism {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "highlight_titles",
    "highlight_descriptions",
    "mechanism_name",
    "footer_text",
    "highlight_icon_1",
    "highlight_icon_2",
    "highlight_icon_3",
    "highlight_icon_4"
  ]
}
[2025-09-22T15:08:33.117Z] DEBUG: ✅ Section uniqueMechanism processed successfully
[2025-09-22T15:08:33.117Z] DEBUG: 🔍 Processing section: results {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "icon_types",
    "titles",
    "descriptions",
    "subheadline",
    "layout_style",
    "footer_text"
  ]
}
[2025-09-22T15:08:33.117Z] DEBUG: ✅ Section results processed successfully
[2025-09-22T15:08:33.117Z] DEBUG: 🔍 Processing section: testimonials {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "pullquote_texts",
    "quote_attributions",
    "quote_contexts"
  ]
}
[2025-09-22T15:08:33.118Z] DEBUG: ✅ Section testimonials processed successfully
[2025-09-22T15:08:33.118Z] DEBUG: 🔍 Processing section: comparisonTable {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "feature_names",
    "competitor_names",
    "your_product_name",
    "subheadline"
  ]
}
[2025-09-22T15:08:33.118Z] DEBUG: ✅ Section comparisonTable processed successfully
[2025-09-22T15:08:33.118Z] DEBUG: 🔍 Processing section: faq {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "subheadline",
    "question_1",
    "answer_1",
    "persona_1",
    "question_2",
    "answer_2",
    "persona_2",
    "question_3",
    "answer_3",
    "persona_3",
    "question_4",
    "answer_4",
    "persona_4",
    "question_5",
    "answer_5",
    "persona_5",
    "customer_persona_name",
    "support_persona_name",
    "chat_style",
    "bubble_alignment",
    "questions",
    "answers",
    "chat_personas"
  ]
}
[2025-09-22T15:08:33.120Z] DEBUG: ✅ Section faq processed successfully
[2025-09-22T15:08:33.120Z] DEBUG: 🔍 Processing section: cta {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "headline",
    "cta_text",
    "subheadline",
    "urgency_text",
    "trust_items",
    "trust_item_1",
    "trust_item_2",
    "trust_item_3",
    "trust_item_4",
    "trust_item_5",
    "customer_count",
    "customer_label",
    "rating_stat",
    "uptime_stat",
    "uptime_label"
  ]
}
[2025-09-22T15:08:33.121Z] DEBUG: ✅ Section cta processed successfully
[2025-09-22T15:08:33.121Z] DEBUG: 🔍 Processing section: footer {
  "sectionType": "object",
  "isObject": true,
  "isNull": false,
  "keys": [
    "copyright",
    "company_name",
    "tagline",
    "link_text_1",
    "link_1",
    "link_text_2",
    "link_2",
    "link_text_3",
    "link_3",
    "link_text_4",
    "link_4",
    "social_twitter",
    "social_linkedin",
    "social_github",
    "social_facebook"
  ]
}
[2025-09-22T15:08:33.123Z] DEBUG: ✅ Section footer processed successfully
[2025-09-22T15:08:33.123Z] DEBUG: ✅ Content validation completed: {
  "totalSections": 10,
  "processedSuccessfully": 10,
  "successRate": "100%",
  "finalSectionCount": 10,
  "isPartial": false,
  "warningCount": 0,
  "errorCount": 0
}
[2025-09-22T15:08:33.124Z] ERROR: ❌ Unexpected error during AI response parsing: {
  "error": {},
  "errorMessage": "elementsMap is not defined",
  "errorStack": "ReferenceError: elementsMap is not defined\n    at validateContent (webpack-internal:///(rsc)/./src/modules/prompt/parseAiResponse.ts:336:5)\n    at parseAiResponse (webpack-internal:///(rsc)/./src/modules/prompt/parseAiResponse.ts:62:28)\n    at generateLandingHandler (webpack-internal:///(rsc)/./src/app/api/generate-landing/route.ts:320:120)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async eval (webpack-internal:///(rsc)/./src/lib/rateLimit.ts:157:26)\n    at async C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:6:57228\n    at async eT.execute (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:6:46851)\n    at async eT.handle (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\compiled\\next-server\\app-route.runtime.dev.js:6:58760)\n    at async doRender (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1366:42)\n    at async cacheEntry.responseCache.get.routeKind (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1588:28)\n    at async DevServer.renderToResponseWithComponentsImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1496:28)\n    at async DevServer.renderPageComponent (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1924:24)\n    at async DevServer.renderToResponseImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:1962:32)\n    at async DevServer.pipeImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:922:25)\n    at async NextNodeServer.handleCatchallRenderRequest (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\next-server.js:272:17)\n    at async DevServer.handleRequestImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\base-server.js:818:17)\n    at async C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:339:20\n    at async Span.traceAsyncFn (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\trace\\trace.js:154:20)\n    at async DevServer.handleRequest (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\dev\\next-dev-server.js:336:24)\n    at async invokeRender (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\router-server.js:179:21)\n    at async handleRequest (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\router-server.js:359:24)\n    at async requestHandlerImpl (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\router-server.js:383:13)\n    at async Server.requestListener (C:\\Users\\susha\\lessgo-ai\\node_modules\\next\\dist\\server\\lib\\start-server.js:141:13)"
}
 POST /api/generate-landing 200 in 45102ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 1/30, Remaining: 29 
 POST /api/saveDraft 200 in 711ms
 GET /api/loadDraft?tokenId=Ko2tJrgbLA6f 200 in 80ms
[DEV] Rate limit check - Key: user:user_2xd9rxqOOyXmfy1JhrFtKOmD1yw, Requests: 2/30, Remaining: 28 
 POST /api/saveDraft 200 in 211ms
 GET /api/loadDraft?tokenId=Ko2tJrgbLA6f 200 in 67ms


================\


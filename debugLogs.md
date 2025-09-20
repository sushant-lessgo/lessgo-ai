[2025-09-20T10:42:08.279Z] DEBUG: 🚀 Starting inference for: GrowOnX Insights – AI assistant for audience growth on X/Twitter...
[2025-09-20T10:42:11.696Z] DEBUG: ✅ AI inference completed
[2025-09-20T10:42:11.697Z] INFO: 📤 Raw AI Output: {
  "marketCategory": "Marketing & Sales Tools",
  "marketSubcategory": "Social Media Management & Analytics",
  "keyProblem": "Marketers struggle to effectively grow their audience on X/Twitter without actionable insights and automation.",
  "targetAudience": "Social Media Marketers",
  "startupStage": "MVP",
  "pricingModel": "Freemium",
  "landingPageGoals": "Start Free Trial"
}
[2025-09-20T10:42:11.697Z] DEBUG: 🔍 Starting semantic validation...
[2025-09-20T10:42:11.697Z] INFO: 🔄 Sending to embedding validation: {
  "marketCategory": "Marketing & Sales Tools",
  "marketSubcategory": "Social Media Management & Analytics",
  "targetAudience": "Social Media Marketers"
}
[2025-09-20T10:42:11.698Z] DEBUG: 🔍 Starting semantic validation...
[DEV] 🔑 Generating embedding for: Marketing & Sales Tools...
[2025-09-20T10:42:12.161Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Marketing & Sales Tools...
[2025-09-20T10:42:12.922Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Social Media Management & Analytics...
[DEV] 🔑 Generating embedding for: Social Media Marketers...
[DEV] 🔑 Generating embedding for: MVP...
[DEV] 🔑 Generating embedding for: Freemium...
[DEV] 🔑 Generating embedding for: Start Free Trial...
[2025-09-20T10:42:13.444Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:13.446Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:13.447Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:13.448Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Start Free Trial...
[2025-09-20T10:42:13.698Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:13.809Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Freemium...
[DEV] 🔑 Generating embedding for: MVP...
[DEV] 🔑 Generating embedding for: Social Media Marketers...
[2025-09-20T10:42:14.085Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:14.264Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:14.334Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T10:42:14.475Z] DEBUG: 🔍 Market Category: "Marketing & Sales Tools" (HIGH - 100.0%)
[2025-09-20T10:42:14.475Z] DEBUG: 🔍 Market Subcategory: "Social Media Management & Scheduling" (MEDIUM - 82.7%)
[2025-09-20T10:42:14.475Z] DEBUG: 🔍 Target Audience: "Performance Marketers" (MEDIUM - 70.0%)
[2025-09-20T10:42:14.475Z] DEBUG: 🔍 Key Problem Getting Solved: "Marketers struggle to effectively grow their audience on X/Twitter without actionable insights and automation." (HIGH - 100.0%)
[2025-09-20T10:42:14.476Z] DEBUG: 🔍 Startup Stage: "MVP in development" (MEDIUM - 84.0%)
[2025-09-20T10:42:14.476Z] DEBUG: 🔍 Landing Page Goals: "Start Free Trial" (HIGH - 100.0%)
[2025-09-20T10:42:14.476Z] DEBUG: 🔍 Pricing Category and Model: "Freemium (limited features)" (HIGH - 83.0%)
[2025-09-20T10:42:14.476Z] DEBUG: ✅ Semantic validation completed
[2025-09-20T10:42:14.476Z] INFO: 📊 Validation Results Comparison: {
  "marketCategory": {
    "ai": "Marketing & Sales Tools",
    "validated": "Marketing & Sales Tools",
    "confidence": 1
  },
  "marketSubcategory": {
    "ai": "Social Media Management & Analytics",
    "validated": "Social Media Management & Scheduling",
    "confidence": 0.8265724692484404
  },
  "targetAudience": {
    "ai": "Social Media Marketers",
    "validated": "Performance Marketers",
    "confidence": 0.6996773629929588
  }
}
 POST /api/infer-fields 200 in 6226ms
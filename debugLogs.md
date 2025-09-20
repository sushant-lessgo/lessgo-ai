Input: Personalized study planner and quiz generator that adapts to how you learn best.

[2025-09-20T08:27:54.967Z] DEBUG: 🚀 Starting inference for: Personalized study planner and quiz generator that adapts to how you learn best....
[2025-09-20T08:27:57.367Z] DEBUG: ✅ AI inference completed
[2025-09-20T08:27:57.367Z] INFO: 📤 Raw AI Output: {
  "marketCategory": "Education",
  "marketSubcategory": "EdTech",
  "keyProblem": "Students struggle to create effective study plans that align with their individual learning styles and needs.",
  "targetAudience": "Students",
  "startupStage": "Prototype",
  "pricingModel": "Freemium",
  "landingPageGoals": "Sign Up for Free"
}
[2025-09-20T08:27:57.368Z] DEBUG: 🔍 Starting semantic validation...
[2025-09-20T08:27:57.368Z] INFO: 🔄 Sending to embedding validation: {
  "marketCategory": "Education",
  "marketSubcategory": "EdTech",
  "targetAudience": "Students"
}
[2025-09-20T08:27:57.368Z] DEBUG: 🔍 Starting semantic validation...
[DEV] 🔑 Generating embedding for: Education...
[2025-09-20T08:27:57.671Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Education...
[2025-09-20T08:27:59.318Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: EdTech...
[DEV] 🔑 Generating embedding for: Students...
[DEV] 🔑 Generating embedding for: Prototype...
[DEV] 🔑 Generating embedding for: Freemium...
[DEV] 🔑 Generating embedding for: Sign Up for Free...
[2025-09-20T08:27:59.766Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:27:59.832Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:27:59.836Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:27:59.840Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:27:59.912Z] DEBUG: ✅ Embedding generated successfully
[DEV] 🔑 Generating embedding for: Freemium...
[DEV] 🔑 Generating embedding for: Sign Up for Free...
[DEV] 🔑 Generating embedding for: Students...
[DEV] 🔑 Generating embedding for: Prototype...
[2025-09-20T08:28:00.725Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:28:00.825Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:28:00.880Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:28:00.964Z] DEBUG: ✅ Embedding generated successfully
[2025-09-20T08:28:01.069Z] DEBUG: 🔍 Market Category: "Engineering & Development Tools" (LOW - 29.6%)
[2025-09-20T08:28:01.070Z] DEBUG: 🔍 Market Subcategory: "null" (LOW - 0.0%)
[2025-09-20T08:28:01.070Z] DEBUG: 🔍 Target Audience: "Online Educators" (LOW - 46.8%)
[2025-09-20T08:28:01.070Z] DEBUG: 🔍 Key Problem Getting Solved: "Students struggle to create effective study plans that align with their individual learning styles and needs." (HIGH - 100.0%)
[2025-09-20T08:28:01.070Z] DEBUG: 🔍 Startup Stage: "Pre-MVP (wireframes or prototype only)" (LOW - 45.8%)
[2025-09-20T08:28:01.070Z] DEBUG: 🔍 Landing Page Goals: "Create Free Account" (MEDIUM - 72.5%)
[2025-09-20T08:28:01.070Z] DEBUG: 🔍 Pricing Category and Model: "Freemium (limited features)" (HIGH - 83.0%)
[2025-09-20T08:28:01.070Z] DEBUG: ✅ Semantic validation completed
[2025-09-20T08:28:01.070Z] INFO: 📊 Validation Results Comparison: {
  "marketCategory": {
    "ai": "Education",
    "validated": "Engineering & Development Tools",
    "confidence": 0.2964714016987227
  },
  "marketSubcategory": {
    "ai": "EdTech",
    "validated": null,
    "confidence": 0
  },
  "targetAudience": {
    "ai": "Students",
    "validated": "Online Educators",
    "confidence": 0.46844638028209756
  }
}
 POST /api/infer-fields 200 in 6747ms
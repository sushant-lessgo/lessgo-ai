Verified accurate
                                                                                                                      
  - HearthEditable.tsx exists ✓
  - InlineTextEditorV2.tsx:216-217 data-element-key + data-section-id binding ✓
  - publish/route.ts:60-88 writes projectType + paletteId to PublishedPage ✓
  - /p/[slug]/page.tsx:124-134 passes both props to renderer ✓
  - LandingPageRenderer.tsx:849-854 wraps service in HearthThemeInjector ✓
  - LandingPagePublishedRenderer.tsx:107-122 wraps each section in data-hearth-surface div ✓
  - LandingPagePublishedRenderer.tsx:173-176 wraps in HearthSSRTokens ✓
  - CenteredHeadlineCTA.published.tsx:94 buttonConfig extraction + form modal pattern at 148-207 ✓ — clean pattern to
  copy
  - BookCallCTA.tsx:110-125 calendly_url field + edit UI confirmed ✓
  - BookCallCTA.published.tsx exists ✓
  - /api/images/search/route.ts:188 getSpecializedQuery only, no projectType awareness ✓
  - imageKeywords.ts does NOT exist ✓ — Step 2 creates it
  - ImageToolbar.tsx exists ✓
  - Published renderer already flattens content, sections, publishedPageId, pageOwnerId to LayoutComponent props (line
   107-122) — Step 1d's prop-extension is supported by upstream wiring ✓

  Real flags

  1. serviceType availability in edit store. Step 2 plan §76 says "read projectType + serviceType from edit store."
  serviceType is NOT in useEditStoreLegacy today — it lives in useServiceGenerationStore (in-memory, reset after
  onboarding) and gets persisted into Project.content.onboardingData. ImageToolbar would need to read from
  content.onboardingData.understanding.serviceType (loaded from saveDraft response), not the edit store directly. For
  pilot (agency-only), this is moot — getServiceImageQuery can default to generic "warm" keywords without serviceType.
   But plan should clarify either: (a) thread serviceType through editStore meta slice in Phase 4 saveDraft response,
  or (b) fall back to default keywords. Lean: (b) for pilot.

  2. Image-search call sites beyond ImageToolbar. Plan mutates the query client-side in ImageToolbar.tsx. Other
  callers (initial hero image fetch during generation pipeline, regenerate-image API, etc.) won't get warm keywords.
  For pilot this is acceptable since onboarding generation is mostly text and the user manually sets hero image
  post-generation via toolbar. Worth noting in the plan exit summary so Phase 6 catches any image-quality regressions
  on initial AI-generated images.

  Step 1c blocker contingency — sound

  Pre-flight check before deleting calendly_url: open service project, click cta_text, verify buttonConfig UI renders.
   If toolbar binds via data-element-key (which we verified at InlineTextEditorV2:216-217 — generic), it should work.
  If it doesn't, plan halts — correct discipline.

  Open question stances

  All resolved per plan §172. Agree:
  - Drop calendly_url, use buttonConfig ✓
  - Client-side keyword merge ✓
  - Project-level by serviceType ✓ (with my flag #1 caveat)
  - Punt missing toolbar UI to Phase 11 ✓

  Verdict

  GO. Plan is tight, blocker contingency well-flagged, scope appropriately small for a verification phase. Two flags
  above are implementation hints, not blockers.

  ---
  Unresolved questions

  1. serviceType source for getServiceImageQuery in ImageToolbar: thread through editStore meta slice (~30min Phase 4
  patch), or fall back to default warm keywords for pilot?
  2. Initial hero-image fetch during onboarding generation — accept generic Pexels keywords for pilot, or extend
  keyword override into the server-side image-fetch path too?
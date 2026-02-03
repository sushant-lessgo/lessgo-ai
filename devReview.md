Background assignment uses a 6-step enhanced algorithm in enhancedBackgroundLogic.ts:                                                                                    
                                                                                                                                                                               
  Assignment Flow                                                                                                                                                                                                                                                                                                                                             
  1. Baseline from sectionList metadata - Each section type has default:                                                                                                       
    - Hero/CTA → primary                                                                                                                                                       
    - FAQ → divider
    - Most others → neutral/secondary
  2. User profile analysis - Maps onboardingData to conversion importance:
    - Tier 1 (critical): hero, cta, problem, pricing
    - Tier 2 (important): testimonials, results, unique mechanism
    - Tier 3-4 (supporting): features, how-it-works, FAQ
  3. Upgrade candidates - Only Tier 1-2 can upgrade:
    - Tier 1: neutral → secondary → primary
    - Tier 2: neutral → secondary
  4. Rhythm enforcement - Visual flow rules:
    - Max 3 consecutive highlights
    - Adjacency prevention (no two colored sections back-to-back unless protected)
    - Hero & CTA protected from downgrade

  Key Files

  - modules/Design/background/enhancedBackgroundLogic.ts:257-411 - Core 6-step algorithm
  - modules/Design/background/backgroundIntegration.ts:276-292 - Orchestrator + fallback
  - hooks/editStore/generationActions.ts:61-72 - Where it's called during generation

  No Cycling

  There's no explicit round-robin cycling. Assignment is:
  - Profile-driven (awareness level, sophistication, goal)
  - Rhythm-enforced (consecutive limits)
  - Adjacency-aware (prevents clashing)

  The code was migrated to canonical types (Phase 5.2) - see line 1. It uses current fields:                                                                                      
  // Line 17-18                                                                                                                                                                  type UserProfile = Pick<InputVariables, 'landingPageGoals' | 'targetAudience' | 'startupStage'> &
    Pick<HiddenInferredFields, 'awarenessLevel' | 'marketSophisticationLevel'>;                                                                                                
  
  Fields used (lines 128-194):
  - awarenessLevel
  - marketSophisticationLevel
  - landingPageGoals
  - targetAudience
  - startupStage

  Yes, it's rule-based. The CONVERSION_PRIORITIES matrix (lines 95-125) is a hardcoded static mapping:

  // Example rules:
  hero: { profiles: ['all'], tier: 1, ... }
  problem: { profiles: ['unaware', 'problem-aware'], tier: 1, ... }
  pricing: { profiles: ['buy-now', 'subscribe', 'ready-to-buy'], tier: 1, ... }

  Then analyzeUserProfile() converts user data to profile tags like 'skeptical', 'competitive', 'enterprise' etc. and matches against these rules.

  Not AI-driven - no dynamic scoring or model inference. Pure if/else + lookup table logic.
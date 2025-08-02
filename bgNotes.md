 Background Selection Scoring Fix Plan                                         │
     │                                                                               │
     │ Phase 1: Quick Wins (High Impact, Low Effort)                                 │
     │                                                                               │
     │ Goal: Increase background variety immediately without major algorithm changes │
     │                                                                               │
     │ 1.1 Fix Fallback Selection (30 mins)                                          │
     │                                                                               │
     │ - Issue: Fallback only uses first 10 variations                               │
     │ - Fix: Change Math.min(bgVariations.length, 10) to use all 412 variations     │
     │ - Impact: Immediate 40x increase in fallback variety                          │
     │                                                                               │
     │ 1.2 Increase Top Selection Size (15 mins)                                     │
     │                                                                               │
     │ - Issue: Algorithm only considers top 5 variations                            │
     │ - Fix: Change slice(0, 5) to slice(0, 15) in getTopVariations.ts              │
     │ - Impact: 3x more variety in final selection                                  │
     │                                                                               │
     │ 1.3 Add Score Randomization (45 mins)                                         │
     │                                                                               │
     │ - Issue: Identical scores cause same top 5 repeatedly                         │
     │ - Fix: Add small random variance (±0.1) to final scores before sorting        │
     │ - Impact: Breaks ties, increases variety without changing logic               │
     │                                                                               │
     │ Phase 2: Scoring Improvements (Medium Impact, Medium Effort)                  │
     │                                                                               │
     │ Goal: Fix obvious scoring issues to better utilize variations                 │
     │                                                                               │
     │ 2.1 Color Psychology Fixes (3-4 hours)                                        │
     │                                                                               │
     │ - Differentiate color variations within same archetype/theme                  │
     │ - Blue variations → higher scores for enterprise, technical audiences         │
     │ - Orange/warm variations → higher scores for creators, marketers              │
     │ - Green variations → higher scores for wellness, sustainability markets       │
     │                                                                               │
     │ 2.2 Fix Obvious Mismatches (2-3 hours)                                        │
     │                                                                               │
     │ - Builders + wireframe-blueprint: 0 → 3                                       │
     │ - Marketers + modern gradients: 0 → 2-3                                       │
     │ - Healthcare + zen-calm-wave: missing → 3                                     │
     │ - Enterprise + vibrant styles: 3 → 1                                          │
     │                                                                               │
     │ 2.3 Improve Tone Profile Scoring (2 hours)                                    │
     │                                                                               │
     │ - "friendly-helpful" shouldn't exclude energetic styles                       │
     │ - "minimal-technical" should favor clean, geometric patterns                  │
     │ - Add more granular tone-to-background mappings                               │
     │                                                                               │
     │                 │
     │                                                                               │
     │ Implementation Priority                                                       │
     │                                                                               │
     │ Week 1: Phase 1 (Quick Wins)                                                  │
     │                                                                               │
     │ - Day 1: Fix fallback selection                                               │
     │ - Day 2: Increase top selection size                                          │
     │ - Day 3: Add score randomization                                              │
     │ - Day 4-5: Test and validate improvements                                     │
     │                                                                               │
     │ Week 2: Phase 2 (Scoring Fixes)                                               │
     │                                                                               │
     │ - Day 1-2: Color psychology differentiation                                   │
     │ - Day 3: Fix obvious mismatches                                               │
     │ - Day 4: Improve tone profile scoring                                         │
     │ - Day 5: Test and validate                                                    │
     │                                                                               │
     │                      │
     │                                                                               │
     │ Success Metrics                                                               │
     │                                                                               │
     │ - Immediate: Track unique backgrounds generated over 20 test runs             │
     │ - Target: Increase from ~3 unique to 10+ unique backgrounds                   │
     │ - Long-term: Monitor user satisfaction with background variety                │
     │                                                                               │
     │ Risk Mitigation                                                               │
     │                                                                               │
     │ - Keep original algorithm as fallback option                                  │
                                     │
     │ - Log algorithm decisions for debugging                                       │

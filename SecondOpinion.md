Archive Verification - INCOMPLETE           
                                                                                                                                                                              Files with Active Archived Layout References                                                                                                                                                                                                                                                                                                          
  1. sectionScanner.ts (LAYOUT_TO_SECTION_TYPE mapping)                                                                                                                       ┌──────┬───────────────────────────┬──────────────┐
  │ Line │      Archived Layout      │   Section    │
  ├──────┼───────────────────────────┼──────────────┤
  │ 59   │ Tabbed                    │ features     │
  ├──────┼───────────────────────────┼──────────────┤
  │ 61   │ FeatureTestimonial        │ features     │
  ├──────┼───────────────────────────┼──────────────┤
  │ 63   │ MiniCards                 │ features     │
  ├──────┼───────────────────────────┼──────────────┤
  │ 69   │ FeatureMatrix             │ pricing      │
  ├──────┼───────────────────────────┼──────────────┤
  │ 70   │ SegmentBasedPricing       │ pricing      │
  ├──────┼───────────────────────────┼──────────────┤
  │ 73   │ CardWithTestimonial       │ pricing      │
  ├──────┼───────────────────────────┼──────────────┤
  │ 74   │ MiniStackedCards          │ pricing      │
  ├──────┼───────────────────────────┼──────────────┤
  │ 81   │ SegmentedTestimonials     │ testimonials │
  ├──────┼───────────────────────────┼──────────────┤
  │ 82   │ RatingCards               │ testimonials │
  ├──────┼───────────────────────────┼──────────────┤
  │ 84   │ InteractiveTestimonialMap │ testimonials │
  ├──────┼───────────────────────────┼──────────────┤
  │ 91   │ QuoteStyleAnswers         │ faq          │
  ├──────┼───────────────────────────┼──────────────┤
  │ 92   │ IconWithAnswers           │ faq          │
  ├──────┼───────────────────────────┼──────────────┤
  │ 93   │ TestimonialFAQs           │ faq          │
  ├──────┼───────────────────────────┼──────────────┤
  │ 94   │ ChatBubbleFAQ             │ faq          │
  ├──────┼───────────────────────────┼──────────────┤
  │ 98   │ AnimatedProcessLine       │ howitworks   │
  ├──────┼───────────────────────────┼──────────────┤
  │ 99   │ CardFlipSteps             │ howitworks   │
  ├──────┼───────────────────────────┼──────────────┤
  │ 100  │ IconCircleSteps           │ howitworks   │
  ├──────┼───────────────────────────┼──────────────┤
  │ 104  │ ZigzagImageSteps          │ howitworks   │
  └──────┴───────────────────────────┴──────────────┘
  2. buildPrompt.ts (layout descriptions)
  ┌──────┬────────────────────┐
  │ Line │  Archived Layout   │
  ├──────┼────────────────────┤
  │ 1706 │ AlgorithmExplainer │
  ├──────┼────────────────────┤
  │ 1713 │ InnovationTimeline │
  ├──────┼────────────────────┤
  │ 1753 │ SystemArchitecture │
  └──────┴────────────────────┘
  Summary

  parseAiResponse.ts - ✅ CLEAN (archived processors removed)

  sectionScanner.ts - ❌ 18 archived layouts in LAYOUT_TO_SECTION_TYPE mapping

  buildPrompt.ts - ❌ 3 archived layout descriptions still present

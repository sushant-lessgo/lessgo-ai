Gap 1: Missing element defaults on several blocks

  These blocks have NO default values on most elements — getSchemaDefaults() falls back to empty string instead of original CONTENT_SCHEMA placeholder text:
  ┌──────────────────┬───────────────────────────────────────────────────────────────────────────┐
  │      Block       │                         Elements missing defaults                         │
  ├──────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ IconGrid         │ headline, subheadline, badge_text, supporting_text, collection fields     │
  ├──────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ TierCards        │ headline, subheadline, badge_text, billing_note, guarantee_text           │
  ├──────────────────┼───────────────────────────────────────────────────────────────────────────┤
  │ VideoWalkthrough │ headline, video_title, video_description, subheadline, demo_stats_heading │
  └──────────────────┴───────────────────────────────────────────────────────────────────────────┘
  Impact: Not a functional break — getSchemaDefaults() returns '' for missing defaults. But:
  - Required elements get empty string instead of placeholder text if AI fails
  - Optional elements appear blank when user toggles them on (no helpful placeholder)
  - Contradicts plan: "Add default to every element. Source from CONTENT_SCHEMA."

  Fix: Copy original CONTENT_SCHEMA defaults for these blocks into central schema. Mechanical — 15 min.

  Gap 2: 7 files retain contentSchema: in componentMeta
  ┌─────────────────────────────────────┐
  │                File                 │
  ├─────────────────────────────────────┤
  │ Pricing/ToggleableMonthlyYearly.tsx │
  ├─────────────────────────────────────┤
  │ Pricing/TierCards.tsx               │
  ├─────────────────────────────────────┤
  │ Results/StackedWinsList.tsx         │
  ├─────────────────────────────────────┤
  │ Results/StatBlocks.tsx              │
  ├─────────────────────────────────────┤
  │ HowItWorks/AccordionSteps.tsx       │
  ├─────────────────────────────────────┤
  │ HowItWorks/ThreeStepHorizontal.tsx  │
  ├─────────────────────────────────────┤
  │ BeforeAfter/StackedTextVisual.tsx   │
  └─────────────────────────────────────┘
  This is componentMeta.contentSchema (metadata export), NOT the deleted const CONTENT_SCHEMA. Functionally harmless — not used at runtime for gating. But inconsistent with  
  fully-migrated files that use contentFields format instead. Low priority cleanup.
LeftPanel.tsx:228 🔄 Starting page regeneration: {includeDesignRegeneration: true, hasRegenerateAllContent: true, hasRegenerateDesignAndCopy: true, hasRegenerateContentOnly: true}
LeftPanel.tsx:238 🎨 Starting design + content regeneration
regenerationActions.ts:331 🎨 RegenerationActions: regenerateDesignAndCopy called
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
getTopVariations.ts:168 🎨 [VARIETY-DEBUG] Background selection improvements: {totalVariations: 37, topVariationsCount: 15, selectedVariation: 'soft-gradient-blur::mint-frost::soft-blur-mint-frost-solid-teal', scoreRange: {…}}
backgroundIntegration.ts:52 🔍 Funnel result debug: {inputData: {…}, primaryVariationKey: 'soft-gradient-blur::mint-frost::soft-blur-mint-frost-solid-teal', topVariations: Array(15)}
backgroundIntegration.ts:65 🔍 Looking for variation: {archetypeId: 'soft-gradient-blur', themeId: 'mint-frost'}
backgroundIntegration.ts:73 🔍 Found matching variations: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
backgroundIntegration.ts:89 ✅ Selected primary variation: {variationId: 'soft-blur-mint-frost-gradient-tr', tailwindClass: 'bg-gradient-to-tr from-teal-200 via-green-100 to-white', baseColor: 'teal'}
backgroundIntegration.ts:189 🎨 Using smart color harmony accent selection system
colorHarmony.ts:622 ✅ Using curated accent option: {baseColor: 'teal', selectedAccent: 'orange', score: 50, tailwind: 'bg-orange-500'}
backgroundIntegration.ts:201 ⚠️ Smart accent had low confidence, trying legacy system
selectAccentFromTags.ts:51 🎨 Accent selection for teal: {totalOptions: 4, contrastValidated: 0, usingValidated: false}
selectAccentFromTags.ts:78 ⚠️ Using fallback accent selection for teal
regenerationActions.ts:171 🎨 Design Regeneration - Generated new background system: {primary: 'bg-gradient-to-tr from-teal-200 via-green-100 to-white', secondary: 'bg-teal-50/70', neutral: 'bg-white', divider: 'bg-teal-100/50', baseColor: 'teal', …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
regenerationActions.ts:199 🎨 Design Regeneration - Generating layouts for sections: (10) ['header', 'hero', 'features', 'uniqueMechanism', 'results', 'testimonials', 'comparisonTable', 'faq', 'cta', 'footer']
generateSectionLayouts.ts:48 🎨 Generating layouts for sections: (10) ['header', 'hero', 'features', 'uniqueMechanism', 'results', 'testimonials', 'comparisonTable', 'faq', 'cta', 'footer']
generateSectionLayouts.ts:49 📊 Onboarding data available: {validatedFields: Array(7), hiddenInferredFields: Array(0), validatedFieldsValues: {…}, hiddenInferredFieldsValues: {…}}
generateSectionLayouts.ts:78 🎯 Layout picker input prepared: {awarenessLevel: undefined, toneProfile: undefined, marketSophisticationLevel: undefined, copyIntent: undefined, problemType: undefined, …}
generateSectionLayouts.ts:83 🔍 Processing section: "header" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for header: NavWithCTAHeader
generateSectionLayouts.ts:83 🔍 Processing section: "hero" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for hero: imageFirst
generateSectionLayouts.ts:83 🔍 Processing section: "features" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for features: IconGrid
generateSectionLayouts.ts:83 🔍 Processing section: "uniqueMechanism" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for uniqueMechanism: IllustratedModel
generateSectionLayouts.ts:83 🔍 Processing section: "results" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for results: EmojiOutcomeGrid
generateSectionLayouts.ts:83 🔍 Processing section: "testimonials" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for testimonials: AvatarCarousel
generateSectionLayouts.ts:83 🔍 Processing section: "comparisonTable" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for comparisonTable: AnimatedUpgradePath
generateSectionLayouts.ts:83 🔍 Processing section: "faq" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for faq: IconWithAnswers
generateSectionLayouts.ts:83 🔍 Processing section: "cta" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for cta: CenteredHeadlineCTA
generateSectionLayouts.ts:83 🔍 Processing section: "footer" (type: string)
generateSectionLayouts.ts:92 ✅ Smart layout selected for footer: SimpleFooter
generateSectionLayouts.ts:113 🎨 Final layout assignments: {header: 'NavWithCTAHeader', hero: 'imageFirst', features: 'IconGrid', uniqueMechanism: 'IllustratedModel', results: 'EmojiOutcomeGrid', …}
generateSectionLayouts.ts:114 🎨 About to call setSectionLayouts with: {layoutCount: 10, heroLayout: 'imageFirst', allLayouts: Array(10)}
generateSectionLayouts.ts:120 🎨 setSectionLayouts called successfully
regenerationActions.ts:204 🎨 Design Regeneration - Updated section layouts: {cta: 'CenteredHeadlineCTA', faq: 'IconWithAnswers', hero: 'imageFirst', footer: 'SimpleFooter', header: 'NavWithCTAHeader', …}
regenerationActions.ts:208 🎨 Design Regeneration - Updating theme colors. Before: {baseColor: 'teal', accentColor: 'sky', accentCSS: 'bg-gradient-to-r from-teal-500 to-sky-500', sectionBackgrounds: Proxy(Object)}
regenerationActions.ts:225 🎨 Design Regeneration - Updated theme colors. After: {baseColor: 'teal', accentColor: 'amber', accentCSS: 'bg-amber-500', sectionBackgrounds: {…}}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
ColorSystemModalMVP.tsx:191 🔍 Validating CTA stand-out: {ctaColor: 'bg-amber-500', background: 'bg-gradient-to-tr from-teal-200 via-green-100 to-white'}
ColorSystemModalMVP.tsx:204 ✅ Stand-out result: {ratio: 0, score: 0, level: 'poor', message: 'CTAs might blend in ⚠️'}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
generationActions.ts:113 🔍 updateFromAIResponse RAW INPUT: {
  "success": true,
  "content": {
    "header": {
      "nav_item_1": "Product Tour",
      "cta_text": "Start Free Trial"
    },
    "hero": {
      "headline": "Streamline Your Workflow with Our Powerful SaaS Solution",
      "cta_text": "Get Started Now"
    },
    "features": {
      "headline": "Boost Productivity with Key Features",
      "feature_titles": [
        "Automation",
        "Collaboration",
        "Analytics"
      ],
      "feature_descriptions": [
        "Automate repetitive tasks",
        "Collaborate seamlessly with team members",
        "Gain actionable insights"
      ]
    },
    "uniqueMechanism": {
      "headline": "Revolutionary Approach to SaaS",
      "model_title": [
        "Efficiency Boost",
        "Team Harmony",
        "Insightful Analytics"
      ],
      "model_description": [
        "Maximize efficiency with smart automation",
        "Foster team collaboration for success",
        "Make data-driven decisions for growth"
      ],
      "component_labels": [
        "Automation",
        "Collaboration"
      ]
    },
    "results": {
      "headline": "See Real Results with Our SaaS Solution",
      "outcome_titles": [
        "Efficiency Boost",
        "Team Harmony",
        "Data-Driven Decisions"
      ],
      "outcome_descriptions": [
        "Increase productivity by 40%",
        "Improve team communication by 50%",
        "Grow revenue with informed decisions"
      ]
    },
    "testimonials": {
      "headline": "Our Customers Love Us!",
      "testimonial_quotes": [
        "This software changed the game for us!",
        "Highly recommend for any business"
      ],
      "customer_names": [
        "Sarah M.",
        "John D."
      ]
    },
    "comparisonTable": {
      "headline": "Why Choose Us Over the Rest?",
      "current_solution_title": [
        "Basic Plan",
        "Standard Plan",
        "Premium Plan"
      ],
      "upgraded_solution_title": [
        "Starter Plan",
        "Pro Plan",
        "Elite Plan"
      ],
      "upgrade_benefits": [
        "Advanced features included",
        "Dedicated customer support",
        "Customized solutions for your business"
      ]
    },
    "faq": {
      "headline": "Got Questions? We Have Answers!",
      "questions": [
        "Is customer support available 24/7?",
        "Can I customize the software to fit my needs?",
        "How secure is my data?"
      ],
      "answers": [
        "Yes, our customer support team is available round the clock.",
        "Absolutely! Our software is fully customizable to suit your requirements.",
        "Rest assured, we have top-notch security measures in place to protect your data."
      ]
    },
    "cta": {
      "headline": "Ready to Transform Your Business?",
      "cta_text": "Start Free Trial"
    },
    "footer": {
      "copyright": "© 2023 All rights reserved. Privacy Policy | Terms of Service"
    }
  },
  "isPartial": false,
  "warnings": [],
  "errors": [],
  "preservedElements": [],
  "updatedElements": [
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
  "regenerationType": "design-and-copy"
}
generationActions.ts:115 🤖 EditStore: updateFromAIResponse called with: {success: true, isPartial: false, hasContent: true, contentType: 'object', contentKeys: Array(10), …}
 🔒 Pre-selected sections from store: Proxy(Array) {0: {…}}
generationActions.ts:150 🎯 Processing AI response content: {contentKeys: Array(10), totalSections: 10, fullRawContent: '{\n  "header": {\n    "nav_item_1": "Product Tour",\n…eserved. Privacy Policy | Terms of Service"\n  }\n}', sampleContent: Array(2)}
generationActions.ts:177 ✅ Processing pre-selected section: header
generationActions.ts:219 📝 Processing elements for section header: {elementKeys: Array(2), elementCount: 2, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: nav_item_1 {elementKey: 'nav_item_1', elementValue: 'Product Tour', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: nav_item_1 = "Product Tour..."
generationActions.ts:227 🔍 Processing element: cta_text {elementKey: 'cta_text', elementValue: 'Start Free Trial', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: cta_text = "Start Free Trial..."
generationActions.ts:262 ✅ Section header updated with 2 elements
generationActions.ts:266 🔍 Verifying section header content: {hasContent: true, elementCount: 2, elements: Array(2)}
generationActions.ts:177 ✅ Processing pre-selected section: hero
generationActions.ts:219 📝 Processing elements for section hero: {elementKeys: Array(2), elementCount: 2, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Streamline Your Workflow with Our Powerful SaaS Solution', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Streamline Your Workflow with Our Powerful SaaS So..."
generationActions.ts:227 🔍 Processing element: cta_text {elementKey: 'cta_text', elementValue: 'Get Started Now', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: cta_text = "Get Started Now..."
generationActions.ts:262 ✅ Section hero updated with 2 elements
generationActions.ts:266 🔍 Verifying section hero content: {hasContent: true, elementCount: 2, elements: Array(2)}
generationActions.ts:177 ✅ Processing pre-selected section: features
generationActions.ts:219 📝 Processing elements for section features: {elementKeys: Array(3), elementCount: 3, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Boost Productivity with Key Features', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Boost Productivity with Key Features..."
generationActions.ts:227 🔍 Processing element: feature_titles {elementKey: 'feature_titles', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: feature_titles = "Automation,Collaboration,Analytics"
generationActions.ts:227 🔍 Processing element: feature_descriptions {elementKey: 'feature_descriptions', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: feature_descriptions = "Automate repetitive tasks,Collaborate seamlessly with team members,Gain actionable insights"
generationActions.ts:262 ✅ Section features updated with 3 elements
generationActions.ts:266 🔍 Verifying section features content: {hasContent: true, elementCount: 3, elements: Array(3)}
generationActions.ts:177 ✅ Processing pre-selected section: uniqueMechanism
generationActions.ts:219 📝 Processing elements for section uniqueMechanism: {elementKeys: Array(4), elementCount: 4, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Revolutionary Approach to SaaS', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Revolutionary Approach to SaaS..."
generationActions.ts:227 🔍 Processing element: model_title {elementKey: 'model_title', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: model_title = "Efficiency Boost,Team Harmony,Insightful Analytics"
generationActions.ts:227 🔍 Processing element: model_description {elementKey: 'model_description', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: model_description = "Maximize efficiency with smart automation,Foster team collaboration for success,Make data-driven decisions for growth"
generationActions.ts:227 🔍 Processing element: component_labels {elementKey: 'component_labels', elementValue: Array(2), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: component_labels = "Automation,Collaboration"
generationActions.ts:262 ✅ Section uniqueMechanism updated with 4 elements
generationActions.ts:266 🔍 Verifying section uniqueMechanism content: {hasContent: true, elementCount: 4, elements: Array(4)}
generationActions.ts:177 ✅ Processing pre-selected section: results
generationActions.ts:219 📝 Processing elements for section results: {elementKeys: Array(3), elementCount: 3, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'See Real Results with Our SaaS Solution', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "See Real Results with Our SaaS Solution..."
generationActions.ts:227 🔍 Processing element: outcome_titles {elementKey: 'outcome_titles', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: outcome_titles = "Efficiency Boost,Team Harmony,Data-Driven Decisions"
generationActions.ts:227 🔍 Processing element: outcome_descriptions {elementKey: 'outcome_descriptions', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: outcome_descriptions = "Increase productivity by 40%,Improve team communication by 50%,Grow revenue with informed decisions"
generationActions.ts:262 ✅ Section results updated with 3 elements
generationActions.ts:266 🔍 Verifying section results content: {hasContent: true, elementCount: 3, elements: Array(3)}
generationActions.ts:177 ✅ Processing pre-selected section: testimonials
generationActions.ts:219 📝 Processing elements for section testimonials: {elementKeys: Array(3), elementCount: 3, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Our Customers Love Us!', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Our Customers Love Us!..."
generationActions.ts:227 🔍 Processing element: testimonial_quotes {elementKey: 'testimonial_quotes', elementValue: Array(2), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: testimonial_quotes = "This software changed the game for us!,Highly recommend for any business"
generationActions.ts:227 🔍 Processing element: customer_names {elementKey: 'customer_names', elementValue: Array(2), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: customer_names = "Sarah M.,John D."
generationActions.ts:262 ✅ Section testimonials updated with 3 elements
generationActions.ts:266 🔍 Verifying section testimonials content: {hasContent: true, elementCount: 3, elements: Array(3)}
generationActions.ts:177 ✅ Processing pre-selected section: comparisonTable
generationActions.ts:219 📝 Processing elements for section comparisonTable: {elementKeys: Array(4), elementCount: 4, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Why Choose Us Over the Rest?', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Why Choose Us Over the Rest?..."
generationActions.ts:227 🔍 Processing element: current_solution_title {elementKey: 'current_solution_title', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: current_solution_title = "Basic Plan,Standard Plan,Premium Plan"
generationActions.ts:227 🔍 Processing element: upgraded_solution_title {elementKey: 'upgraded_solution_title', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: upgraded_solution_title = "Starter Plan,Pro Plan,Elite Plan"
generationActions.ts:227 🔍 Processing element: upgrade_benefits {elementKey: 'upgrade_benefits', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: upgrade_benefits = "Advanced features included,Dedicated customer support,Customized solutions for your business"
generationActions.ts:262 ✅ Section comparisonTable updated with 4 elements
generationActions.ts:266 🔍 Verifying section comparisonTable content: {hasContent: true, elementCount: 4, elements: Array(4)}
generationActions.ts:177 ✅ Processing pre-selected section: faq
generationActions.ts:219 📝 Processing elements for section faq: {elementKeys: Array(3), elementCount: 3, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Got Questions? We Have Answers!', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Got Questions? We Have Answers!..."
generationActions.ts:227 🔍 Processing element: questions {elementKey: 'questions', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: questions = "Is customer support available 24/7?,Can I customize the software to fit my needs?,How secure is my data?"
generationActions.ts:227 🔍 Processing element: answers {elementKey: 'answers', elementValue: Array(3), elementType: 'object', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: answers = "Yes, our customer support team is available round the clock.,Absolutely! Our software is fully customizable to suit your requirements.,Rest assured, we have top-notch security measures in place to protect your data."
generationActions.ts:262 ✅ Section faq updated with 3 elements
generationActions.ts:266 🔍 Verifying section faq content: {hasContent: true, elementCount: 3, elements: Array(3)}
generationActions.ts:177 ✅ Processing pre-selected section: cta
generationActions.ts:219 📝 Processing elements for section cta: {elementKeys: Array(2), elementCount: 2, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: headline {elementKey: 'headline', elementValue: 'Ready to Transform Your Business?', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: headline = "Ready to Transform Your Business?..."
generationActions.ts:227 🔍 Processing element: cta_text {elementKey: 'cta_text', elementValue: 'Start Free Trial', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: cta_text = "Start Free Trial..."
generationActions.ts:262 ✅ Section cta updated with 2 elements
generationActions.ts:266 🔍 Verifying section cta content: {hasContent: true, elementCount: 3, elements: Array(3)}
generationActions.ts:177 ✅ Processing pre-selected section: footer
generationActions.ts:219 📝 Processing elements for section footer: {elementKeys: Array(1), elementCount: 1, sectionDataType: 'object', rawSectionData: {…}}
generationActions.ts:227 🔍 Processing element: copyright {elementKey: 'copyright', elementValue: '© 2023 All rights reserved. Privacy Policy | Terms of Service', elementType: 'string', isUndefined: false, isNull: false, …}
generationActions.ts:240   ✅ Added element: copyright = "© 2023 All rights reserved. Privacy Policy | Terms..."
generationActions.ts:262 ✅ Section footer updated with 1 elements
generationActions.ts:266 🔍 Verifying section footer content: {hasContent: true, elementCount: 3, elements: Array(3)}
generationActions.ts:316 ✅ Final store content state after AI update: {sections: Array(10), contentKeys: Array(10), sampleContent: Array(10)}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
autoSaveDraft.ts:894 🔧 Enhanced AutoSaveDraft debug utilities available at window.__autoSaveDraftDebug
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}
LeftPanel.tsx:36 🔍 LeftPanel Store Methods Available: {regenerateAllContent: true, regenerateDesignAndCopy: true, regenerateContentOnly: true, hasStore: true, hasStoreState: true, …}

// /app/edit/[token]/components/ui/typography/typographyPreviews.ts

export const previewContent = {
  headline: "Your Headline Here",
  body: "Sample body text that shows readability and character spacing."
};

export function getContextualPreviewText(toneId: string) {
  const tonePreviewTexts = {
    'confident-playful': {
      headline: "Ready to Skip the Chaos?",
      body: "Let's get you organized — minus the boring dashboards."
    },
    'minimal-technical': {
      headline: "Deploy in Seconds",
      body: "Zero config. Infinite control. Build scalable infrastructure."
    },
    'bold-persuasive': {
      headline: "Stop Wasting $3,000/Month",
      body: "Switch to the #1 AI-powered funnel engine that actually converts."
    },
    'friendly-helpful': {
      headline: "Need Better Answers, Faster?",
      body: "We've got your team covered — even on weekends."
    },
    'luxury-expert': {
      headline: "World-Class Compliance",
      body: "Intuitive control trusted by top-tier financial institutions."
    }
  };

  return tonePreviewTexts[toneId as keyof typeof tonePreviewTexts] || previewContent;
}
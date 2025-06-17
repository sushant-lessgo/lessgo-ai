export type FontTheme = {
  toneId: string;
  headingFont: string; // CSS font-family value
  bodyFont: string;    // CSS font-family value
};

export const fontThemesByTone: Record<string, FontTheme[]> = {
  "confident-playful": [
    {
      toneId: "confident-playful",
      headingFont: "'Bricolage Grotesque', sans-serif",
      bodyFont: "'Inter', sans-serif"
    },
    {
      toneId: "confident-playful",
      headingFont: "'Poppins', sans-serif",
      bodyFont: "'Open Sans', sans-serif"
    },
    {
      toneId: "confident-playful",
      headingFont: "'Rubik', sans-serif",
      bodyFont: "'Inter', sans-serif"
    }
  ],

  "minimal-technical": [
    {
      toneId: "minimal-technical",
      headingFont: "'Inter', sans-serif",
      bodyFont: "'Inter', sans-serif"
    },
    {
      toneId: "minimal-technical",
      headingFont: "'Manrope', sans-serif",
      bodyFont: "'Inter', sans-serif"
    },
    {
      toneId: "minimal-technical",
      headingFont: "'Sora', sans-serif",
      bodyFont: "'Inter', sans-serif"
    }
  ],

  "bold-persuasive": [
    {
      toneId: "bold-persuasive",
      headingFont: "'Space Grotesk', sans-serif",
      bodyFont: "'DM Sans', sans-serif"
    },
    {
      toneId: "bold-persuasive",
      headingFont: "'Plus Jakarta Sans', sans-serif",
      bodyFont: "'DM Sans', sans-serif"
    },
    {
      toneId: "bold-persuasive",
      headingFont: "'Outfit', sans-serif",
      bodyFont: "'Inter', sans-serif"
    }
  ],

  "friendly-helpful": [
    {
      toneId: "friendly-helpful",
      headingFont: "'Poppins', sans-serif",
      bodyFont: "'Open Sans', sans-serif"
    },
    {
      toneId: "friendly-helpful",
      headingFont: "'Rubik', sans-serif",
      bodyFont: "'Inter', sans-serif"
    },
    {
      toneId: "friendly-helpful",
      headingFont: "'Nunito', sans-serif",
      bodyFont: "'Inter', sans-serif"
    }
  ],

  "luxury-expert": [
    {
      toneId: "luxury-expert",
      headingFont: "'Playfair Display', serif",
      bodyFont: "'Inter', sans-serif"
    },
    {
      toneId: "luxury-expert",
      headingFont: "'DM Serif Display', serif",
      bodyFont: "'Inter', sans-serif"
    },
    {
      toneId: "luxury-expert",
      headingFont: "'Raleway', sans-serif",
      bodyFont: "'Open Sans', sans-serif"
    }
  ]
};

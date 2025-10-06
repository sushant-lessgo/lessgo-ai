// simpleSecondaryBackgrounds.ts - Clean one-to-one mapping
// Each base color gets exactly one secondary background option

export const secondaryBackgrounds: Record<string, string> = {
  // Blue family - Professional, trustworthy
  "blue": "rgba(239, 246, 255, 0.7)",
  "sky": "rgba(240, 249, 255, 0.7)",
  "cyan": "rgba(236, 254, 255, 0.7)",

  // Purple family - Creative, premium
  "purple": "rgba(250, 245, 255, 0.7)",
  "indigo": "rgba(238, 242, 255, 0.7)",
  "violet": "rgba(245, 243, 255, 0.7)",

  // Green family - Growth, nature
  "green": "rgba(240, 253, 244, 0.7)",
  "emerald": "rgba(236, 253, 245, 0.7)",
  "teal": "rgba(240, 253, 250, 0.7)",
  "lime": "rgba(247, 254, 231, 0.7)",

  // Warm family - Energy, creativity
  "orange": "rgba(255, 247, 237, 0.7)",
  "amber": "rgba(255, 251, 235, 0.7)",
  "yellow": "rgba(254, 252, 232, 0.7)",
  "red": "rgba(254, 242, 242, 0.7)",
  "rose": "rgba(255, 241, 242, 0.7)",
  "pink": "rgba(253, 242, 248, 0.7)",

  // Neutral family - Professional, minimal
  "gray": "rgba(249, 250, 251, 0.7)",
  "slate": "rgba(248, 250, 252, 0.7)",
  "zinc": "rgba(250, 250, 250, 0.7)",
  "neutral": "rgba(250, 250, 250, 0.7)",
  "stone": "rgba(250, 250, 249, 0.7)",
};

// Helper function to get secondary background
export function getSecondaryBackground(baseColor: string): string {
  return secondaryBackgrounds[baseColor] || secondaryBackgrounds["gray"];
}

// ===== DESIGN PRINCIPLES ===== 

/*
DESIGN RATIONALE:

1. **Consistent Formula**: All use rgba() with 50 shade colors at 70% opacity
   - 50 shade: Light tint for readability
   - 0.7 opacity: Sufficient opacity for subtle presence
   - CSS values: Direct inline styling, no Tailwind JIT issues

2. **Visual Hierarchy**: Secondary always lighter than primary
   - Primary: Bold gradients (500-600 range)
   - Secondary: Light tints (50 range)
   - Clear hierarchy maintained

3. **Content Readability**:
   - Light backgrounds ensure dark text is highly readable
   - No patterns or busy gradients to interfere with copy
   - Accessibility-friendly contrast ratios

4. **Brand Consistency**:
   - Secondary color matches base color family
   - Monochromatic approach for cohesive brand feel
   - Predictable and professional appearance

5. **Technical Simplicity**:
   - No complex selection logic
   - Zero configuration needed
   - Easy to debug and maintain
   - Fast performance (direct lookup)
   - No Tailwind safelist issues

RESULT: Clean, professional secondary backgrounds that enhance
content readability while maintaining brand consistency.
*/
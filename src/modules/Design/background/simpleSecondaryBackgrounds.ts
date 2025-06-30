// simpleSecondaryBackgrounds.ts - Clean one-to-one mapping
// Each base color gets exactly one secondary background option

export const secondaryBackgrounds: Record<string, string> = {
  // Blue family - Professional, trustworthy
  "blue": "bg-blue-50/70",
  "sky": "bg-sky-50/70", 
  "cyan": "bg-cyan-50/70",
  
  // Purple family - Creative, premium
  "purple": "bg-purple-50/70",
  "indigo": "bg-indigo-50/70",
  "violet": "bg-violet-50/70",
  
  // Green family - Growth, nature
  "green": "bg-green-50/70",
  "emerald": "bg-emerald-50/70",
  "teal": "bg-teal-50/70",
  "lime": "bg-lime-50/70",
  
  // Warm family - Energy, creativity
  "orange": "bg-orange-50/70",
  "amber": "bg-amber-50/70",
  "yellow": "bg-yellow-50/70",
  "red": "bg-red-50/70",
  "rose": "bg-rose-50/70",
  "pink": "bg-pink-50/70",
  
  // Neutral family - Professional, minimal
  "gray": "bg-gray-50/70",
  "slate": "bg-slate-50/70",
  "zinc": "bg-zinc-50/70",
  "neutral": "bg-neutral-50/70",
  "stone": "bg-stone-50/70",
};

// Helper function to get secondary background
export function getSecondaryBackground(baseColor: string): string {
  return secondaryBackgrounds[baseColor] || secondaryBackgrounds["gray"];
}

// ===== DESIGN PRINCIPLES ===== 

/*
DESIGN RATIONALE:

1. **Consistent Formula**: All use {color}-50/70 for uniformity
   - 50: Light tint for readability
   - 70: Sufficient opacity for subtle presence

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

RESULT: Clean, professional secondary backgrounds that enhance 
content readability while maintaining brand consistency.
*/
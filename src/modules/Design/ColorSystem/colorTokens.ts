// colorTokens.ts
// Updated token map generator for Lessgo.ai dynamic landing pages

export type SectionBackgroundInput = {
  primary?: string;    // Now expects full CSS like "bg-gradient-to-tr from-blue-500 via-blue-400 to-sky-300"
  secondary?: string;  // e.g., "bg-blue-50"
  neutral?: string;    // e.g., "bg-white"
  divider?: string;    // e.g., "bg-blue-100/50"
}

export function generateColorTokens({
  baseColor = "gray",
  accentColor = "purple", // Now expects the actual accent color name, not "accent"
  accentCSS = "bg-purple-600", // NEW: Accept the full CSS class from your system
  sectionBackgrounds = {}
}: {
  baseColor?: string; // From your bgVariations (e.g., "blue", "sky")
  accentColor?: string; // From your accent selection system (e.g., "purple", "indigo") 
  accentCSS?: string; // NEW: Full CSS class from selectAccentOption
  sectionBackgrounds?: SectionBackgroundInput;
}) {
  return {
    // 🎨 Dynamic Accent & CTA - Now uses your sophisticated accent selection
    accent: accentCSS, // Use the exact CSS from your tag-based system
    accentHover: accentCSS.replace('-600', '-700'), // Smart hover state
    accentBorder: accentCSS.replace('bg-', 'border-'),

    ctaBg: accentCSS,
    ctaHover: accentCSS.replace('-600', '-700'),
    ctaText: "text-white",

    // 🖋️ Dynamic Text Colors - Updated to work with your base colors
    textOnLight: `text-${baseColor}-900`,
    textOnDark: "text-white", 
    textOnAccent: "text-white",
    link: `text-${accentColor}-600`,

    // 🧱 Dynamic Section Backgrounds - Now properly handles your complex CSS
    bgPrimary: sectionBackgrounds.primary || `bg-gradient-to-br from-${accentColor}-600 to-${accentColor}-500`,
    bgSecondary: sectionBackgrounds.secondary || `bg-${baseColor}-50`,
    bgNeutral: sectionBackgrounds.neutral || "bg-white",
    bgDivider: sectionBackgrounds.divider || `bg-${baseColor}-100/50`,

    // 📘 Static Text Tokens - Updated for better base color support
    textPrimary: `text-${baseColor}-900`,
    textSecondary: `text-${baseColor}-600`, 
    textMuted: `text-${baseColor}-500`,
    textInverse: "text-white",

    // 📦 Static Surface Tokens - Updated to use base color
    surfaceCard: "bg-white",
    surfaceElevated: `bg-${baseColor}-50`,
    surfaceSection: `bg-${baseColor}-100`,
    surfaceOverlay: "bg-black/20",

    // 🔲 Static Borders - Updated for base and accent colors
    borderDefault: `border-${baseColor}-200`,
    borderSubtle: `border-${baseColor}-100`, 
    borderFocus: `border-${accentColor}-500`,

    // ✅ Static Semantic Colors
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    error: "bg-red-500",
    info: "bg-blue-500"
  };
}

// NEW: Helper function to integrate with your background system
export function generateColorTokensFromBackgroundSystem(backgroundSystem: {
  primary: string;
  secondary: string; 
  neutral: string;
  divider: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}) {
  return generateColorTokens({
    baseColor: backgroundSystem.baseColor,
    accentColor: backgroundSystem.accentColor,
    accentCSS: backgroundSystem.accentCSS,
    sectionBackgrounds: {
      primary: backgroundSystem.primary,
      secondary: backgroundSystem.secondary,
      neutral: backgroundSystem.neutral,
      divider: backgroundSystem.divider
    }
  });
}
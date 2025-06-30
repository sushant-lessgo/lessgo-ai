// colorTokens.ts - UPDATED to properly integrate with background system
// Clean separation: backgrounds from backgroundIntegration, interactive elements here

export type SectionBackgroundInput = {
  primary?: string;    // From bgVariations (hero sections)
  secondary?: string;  // From accentOptions.tailwind (features, testimonials)
  neutral?: string;    // Simple white/light backgrounds
  divider?: string;    // Subtle separator backgrounds
}

export function generateColorTokens({
  baseColor = "gray",
  accentColor = "purple",
  accentCSS,  // ✅ Now properly used for CTAs
  sectionBackgrounds = {}
}: {
  baseColor?: string;         // From bgVariations (e.g., "blue", "sky")
  accentColor?: string;       // From accentOptions (e.g., "purple", "indigo") - for CTAs
  accentCSS?: string;         // From accentOptions - for CTAs (e.g., "bg-purple-600")
  sectionBackgrounds?: SectionBackgroundInput; // From backgroundIntegration system
}) {
  
  // ✅ Smart accent CSS generation with proper fallbacks
  const smartAccentCSS = accentCSS || `bg-${accentColor}-600`;
  const smartAccentHover = accentCSS ? 
    accentCSS.replace('-600', '-700').replace('-500', '-600') : 
    `bg-${accentColor}-700`;
  const smartAccentBorder = accentCSS ? 
    accentCSS.replace('bg-', 'border-') : 
    `border-${accentColor}-600`;

  return {
    // 🎨 CTA & Interactive Elements - Uses accentColor for clean, consistent buttons
    accent: smartAccentCSS,                    // ✅ For buttons: "bg-purple-600"
    accentHover: smartAccentHover,             // ✅ For button hover: "bg-purple-700" 
    accentBorder: smartAccentBorder,           // ✅ For focused inputs: "border-purple-600"

    ctaBg: smartAccentCSS,                     // ✅ Primary CTA background
    ctaHover: smartAccentHover,                // ✅ Primary CTA hover
    ctaText: "text-white",                     // ✅ CTA text color

    // 🖋️ Interactive Text Colors - Uses accentColor for consistency
    link: `text-${accentColor}-600`,           // ✅ Links match CTA color
    linkHover: `text-${accentColor}-700`,      // ✅ Link hover state

    // 🧱 Section Backgrounds - Receives from backgroundIntegration system
    bgPrimary: sectionBackgrounds.primary || `bg-gradient-to-br from-${baseColor}-500 to-${baseColor}-600`,
    bgSecondary: sectionBackgrounds.secondary || `bg-${baseColor}-50`,  // ✅ This gets sophisticated accent backgrounds
    bgNeutral: sectionBackgrounds.neutral || "bg-white",
    bgDivider: sectionBackgrounds.divider || `bg-${baseColor}-100/50`,

    // 📘 Text Colors - Based on baseColor for readability
    textOnLight: `text-${baseColor}-900`,      // Dark text on light backgrounds
    textOnDark: "text-white",                  // Light text on dark backgrounds  
    textOnAccent: "text-white",                // Text on accent-colored elements
    textPrimary: `text-${baseColor}-900`,      // Primary body text
    textSecondary: `text-${baseColor}-600`,    // Secondary text
    textMuted: `text-${baseColor}-500`,        // Muted text
    textInverse: "text-white",                 // Inverse text

    // 📦 Surface Colors - Based on baseColor
    surfaceCard: "bg-white",                   // Card backgrounds
    surfaceElevated: `bg-${baseColor}-50`,     // Elevated surfaces
    surfaceSection: `bg-${baseColor}-100`,     // Section backgrounds
    surfaceOverlay: "bg-black/20",             // Modal overlays

    // 🔲 Border Colors - Mix of base and accent
    borderDefault: `border-${baseColor}-200`,   // Default borders
    borderSubtle: `border-${baseColor}-100`,    // Subtle borders
    borderFocus: `border-${accentColor}-500`,   // ✅ Focus borders use accent for consistency

    // ✅ Semantic Colors - Static for reliability
    success: "bg-green-500",
    successText: "text-green-700",
    warning: "bg-yellow-500", 
    warningText: "text-yellow-700",
    error: "bg-red-500",
    errorText: "text-red-700",
    info: "bg-blue-500",
    infoText: "text-blue-700",

    // 🎯 New: Secondary CTA variants (for variety)
    ctaSecondary: `bg-${baseColor}-100`,       // Secondary CTA (light)
    ctaSecondaryHover: `bg-${baseColor}-200`,  // Secondary CTA hover
    ctaSecondaryText: `text-${baseColor}-700`, // Secondary CTA text
    
    ctaGhost: `text-${accentColor}-600`,       // Ghost CTA (text only)
    ctaGhostHover: `bg-${accentColor}-50`,     // Ghost CTA hover background
  };
}

// ✅ NEW: Helper function to integrate with backgroundIntegration system
export function generateColorTokensFromBackgroundSystem(backgroundSystem: {
  primary: string;
  secondary: string; 
  neutral: string;
  divider: string;
  baseColor: string;
  accentColor: string;
  accentCSS: string;
}) {
  console.log('🎨 Generating color tokens from background system:', backgroundSystem);
  
  return generateColorTokens({
    baseColor: backgroundSystem.baseColor,
    accentColor: backgroundSystem.accentColor,
    accentCSS: backgroundSystem.accentCSS,  // ✅ Now properly passed for CTAs
    sectionBackgrounds: {
      primary: backgroundSystem.primary,      // From bgVariations
      secondary: backgroundSystem.secondary,  // ✅ From accentOptions.tailwind  
      neutral: backgroundSystem.neutral,
      divider: backgroundSystem.divider
    }
  });
}

// ✅ NEW: Type exports for better TypeScript support
export type ColorTokens = ReturnType<typeof generateColorTokens>;
export type BackgroundSystem = Parameters<typeof generateColorTokensFromBackgroundSystem>[0];
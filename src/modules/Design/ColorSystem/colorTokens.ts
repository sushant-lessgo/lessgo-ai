// colorTokens.ts - UPDATED to properly integrate with background system
// Clean separation: backgrounds from backgroundIntegration, interactive elements here

// Import NEW enhanced color utilities
import { 
  getSmartTextColor,
  validateWCAGContrast,
  getSafeTextColorsForBackground,
  isLightBackground,
  hasGoodContrast
} from '@/utils/improvedTextColors';
import { generateAccentCandidates } from '@/utils/colorHarmony';
import { analyzeBackground } from '@/utils/backgroundAnalysis';
import { calculateLuminance, parseColor } from '@/utils/colorUtils';

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
  
  // Helper function to convert hex to Tailwind bg class
  const hexToTailwindBg = (hex: string): string => {
    // This is a simplified mapping - in production you'd want a more comprehensive solution
    return `bg-[${hex}]`; // Use arbitrary value syntax for exact hex colors
  };

  // ✅ ENHANCED: Smart accent CSS generation using color harmony
  const businessContext = { industry: 'tech', tone: 'professional' as const }; // TODO: Extract from onboarding
  const accentCandidates = generateAccentCandidates(baseColor, businessContext);
  
  // Convert accent candidate hex color to Tailwind CSS class
  const candidateHex = accentCandidates[0]?.hex;
  const candidateTailwind = candidateHex ? hexToTailwindBg(candidateHex) : undefined;
  
  const smartAccentCSS = accentCSS || candidateTailwind || `bg-${accentColor}-500`;
  const smartAccentHover = accentCSS ? 
    accentCSS.replace('-500', '-600').replace('-600', '-700') : 
    candidateTailwind?.replace('-500', '-600').replace('-600', '-700') || `bg-${accentColor}-600`;
  const smartAccentBorder = accentCSS ? 
    accentCSS.replace('bg-', 'border-') : 
    `border-${accentColor}-500`;

  // ✅ ENHANCED: Smart text color selection with WCAG validation
  const getContrastingTextColor = (backgroundColor: string | undefined) => {
    if (!backgroundColor) return 'text-gray-900';
    
    // ✅ FIX: Pass the original CSS string, not the RGB object
    return getSmartTextColor(backgroundColor, 'body');
  };

  // ✅ ENHANCED: Convert hex colors to Tailwind classes
  const hexToTailwindClass = (hex: string): string => {
    const colorMap: Record<string, string> = {
      '#ffffff': 'text-white',
      '#f9fafb': 'text-gray-50',
      '#f3f4f6': 'text-gray-100', 
      '#e5e7eb': 'text-gray-200',
      '#d1d5db': 'text-gray-300',
      '#9ca3af': 'text-gray-400',
      '#6b7280': 'text-gray-500',
      '#4b5563': 'text-gray-600',
      '#374151': 'text-gray-700',
      '#1f2937': 'text-gray-800',
      '#111827': 'text-gray-900',
      '#000000': 'text-black'
    };
    return colorMap[hex] || 'text-gray-900'; // Default to dark text for unknown colors
  };

  // ✅ ENHANCED: Context-aware secondary and muted text colors
  const getSafeSecondaryTextColor = (backgroundColor: string | undefined) => {
    if (!backgroundColor) return 'text-gray-700';
    
    const hexColor = getSmartTextColor(backgroundColor, 'body');
    return hexToTailwindClass(hexColor);
  };

  const getSafeMutedTextColor = (backgroundColor: string | undefined) => {
    if (!backgroundColor) return 'text-gray-500';
    
    const hexColor = getSmartTextColor(backgroundColor, 'muted');
    return hexToTailwindClass(hexColor);
  };

  // ✅ ENHANCED: Smart CTA color selection with proper accent validation and smart text color calculation
  const validateCTAColors = () => {
    const backgrounds = [
      sectionBackgrounds.primary,
      sectionBackgrounds.secondary,
      sectionBackgrounds.neutral,
      sectionBackgrounds.divider
    ].filter(Boolean);
    
    let safeCTABg = smartAccentCSS;
    let safeCTAText = 'text-white'; // Default to white text for all colored CTA backgrounds
    
    // ✅ IMPROVED: Ensure white text on all colored backgrounds for maximum contrast
    if (smartAccentCSS.includes('bg-')) {
      // For any colored background, use white text for optimal contrast
      safeCTAText = 'text-white';
    }
    
    // ✅ IMPROVED: Don't validate CTA against ALL backgrounds since CTAs appear on specific sections
    // Instead, ensure the CTA works well against the most common backgrounds (neutral/white)
    const criticalBackgrounds = [
      sectionBackgrounds.neutral || 'bg-white',  // Most CTAs appear on neutral backgrounds
      sectionBackgrounds.secondary || 'bg-gray-50'  // Secondary sections
    ];
    
    const isValidOnCriticalBackgrounds = criticalBackgrounds.every(bg => {
      try {
        return validateWCAGContrast(smartAccentCSS, bg, 'AA');
      } catch (error) {
        console.warn('WCAG validation failed for', smartAccentCSS, 'on', bg, error);
        return false;
      }
    });
    
    if (!isValidOnCriticalBackgrounds) {
      // ✅ IMPROVED: Try accent candidates first before falling back to grays
      const workingCandidate = accentCandidates.find(candidate => {
        try {
          const candidateBg = hexToTailwindBg(candidate.hex);
          return criticalBackgrounds.every(bg => 
            validateWCAGContrast(candidateBg, bg, 'AA')
          );
        } catch (error) {
          return false;
        }
      });
      
      if (workingCandidate) {
        const workingCandidateBg = hexToTailwindBg(workingCandidate.hex);
        safeCTABg = workingCandidateBg;
        const candidateTextHex = getSmartTextColor(workingCandidateBg, 'body');
        safeCTAText = hexToTailwindClass(candidateTextHex);
        // console.log('✅ Using brand-safe accent color for CTA:', safeCTABg, 'with text:', safeCTAText);
      } else {
        // ✅ IMPROVED: Use branded fallback instead of generic gray
        const brandedFallback = accentColor ? `bg-${accentColor}-500` : smartAccentCSS;
        safeCTABg = brandedFallback;
        const fallbackTextHex = getSmartTextColor(brandedFallback, 'body');
        safeCTAText = hexToTailwindClass(fallbackTextHex);
        // console.log('✅ Using branded fallback for CTA:', safeCTABg, 'with text:', safeCTAText);
      }
    } else {
      // console.log('✅ Using original accent color for CTA:', safeCTABg, 'with text:', safeCTAText);
    }
    
    return { safeCTABg, safeCTAText };
  };

  const { safeCTABg, safeCTAText } = validateCTAColors();

  // Debug logging (reduced)
  // console.log('🎨 [TOKENS-DEBUG] Generated tokens:', { safeCTABg, safeCTAText });

  return {
    // 🎨 CTA & Interactive Elements - Uses validated accent colors for clean, consistent buttons
    accent: smartAccentCSS,                    // ✅ For buttons: "bg-purple-600"
    accentHover: smartAccentHover,             // ✅ For button hover: "bg-purple-700" 
    accentBorder: smartAccentBorder,           // ✅ For focused inputs: "border-purple-600"

    ctaBg: safeCTABg,                          // ✅ Validated CTA background
    ctaHover: smartAccentHover,                // ✅ Primary CTA hover
    ctaText: safeCTAText,                      // ✅ Validated CTA text color

    // 🖋️ Interactive Text Colors - Uses accentColor for consistency
    link: `text-${accentColor}-600`,           // ✅ Links match CTA color
    linkHover: `text-${accentColor}-700`,      // ✅ Link hover state

    // 🧱 Section Backgrounds - Receives from backgroundIntegration system
    bgPrimary: sectionBackgrounds.primary || `bg-gradient-to-br from-${baseColor}-400 to-${baseColor}-500`,
    bgSecondary: sectionBackgrounds.secondary || `bg-${baseColor}-50`,  // ✅ This gets sophisticated accent backgrounds
    bgNeutral: sectionBackgrounds.neutral || "bg-white",
    bgDivider: sectionBackgrounds.divider || `bg-${baseColor}-100/50`,

    // 📘 Text Colors - ENHANCED: Smart, context-aware text colors with WCAG compliance
    textOnLight: hexToTailwindClass(getSmartTextColor('#ffffff', 'body')),                     // Smart text color for light backgrounds
    textOnDark: hexToTailwindClass(getSmartTextColor('#000000', 'body')),                      // Smart text color for dark backgrounds
    textOnAccent: hexToTailwindClass(getSmartTextColor(smartAccentCSS, 'body')),               // Smart text color for accent backgrounds
    textPrimary: getContrastingTextColor(sectionBackgrounds.primary),      // Context-aware primary text
    textSecondary: getSafeSecondaryTextColor(sectionBackgrounds.secondary), // Context-aware secondary text
    textMuted: getSafeMutedTextColor(sectionBackgrounds.neutral),          // Context-aware muted text
    textInverse: "text-white",                                             // White text for inverse

    // 📘 Background-specific text colors - ENHANCED with smart detection
    textOnPrimary: hexToTailwindClass(getSmartTextColor(sectionBackgrounds.primary || `bg-${baseColor}-500`, 'body')),
    textOnSecondary: hexToTailwindClass(getSmartTextColor(sectionBackgrounds.secondary || `bg-${baseColor}-50`, 'body')),
    textOnNeutral: hexToTailwindClass(getSmartTextColor(sectionBackgrounds.neutral || 'bg-white', 'body')),
    textOnDivider: hexToTailwindClass(getSmartTextColor(sectionBackgrounds.divider || `bg-${baseColor}-100`, 'body')),

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
  // console.log('🎨 Generating color tokens from background system:', backgroundSystem);
  
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